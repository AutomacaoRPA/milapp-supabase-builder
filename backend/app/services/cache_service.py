"""
Serviço de Cache Estratégico com Redis
"""

import json
import hashlib
import time
from typing import Any, Optional, Dict, List, Union
from datetime import datetime, timedelta
import redis.asyncio as redis
import structlog
from functools import wraps

from app.core.config import settings

logger = structlog.get_logger()

# Cliente Redis global
redis_client: Optional[redis.Redis] = None


async def get_redis_client() -> redis.Redis:
    """Obter cliente Redis"""
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(settings.REDIS_URL)
    return redis_client


class CacheService:
    """Serviço de cache estratégico"""
    
    def __init__(self):
        self.client = None
        self.default_ttl = 3600  # 1 hora
        self.prefix = "milapp:"
    
    async def initialize(self):
        """Inicializar cliente Redis"""
        self.client = await get_redis_client()
        logger.info("Cache service initialized")
    
    async def close(self):
        """Fechar conexão Redis"""
        if self.client:
            await self.client.close()
            logger.info("Cache service closed")
    
    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Gerar chave de cache"""
        # Criar string com argumentos
        key_parts = [prefix]
        key_parts.extend([str(arg) for arg in args])
        
        # Adicionar kwargs ordenados
        if kwargs:
            sorted_kwargs = sorted(kwargs.items())
            key_parts.extend([f"{k}:{v}" for k, v in sorted_kwargs])
        
        # Criar hash da chave
        key_string = ":".join(key_parts)
        key_hash = hashlib.md5(key_string.encode()).hexdigest()
        
        return f"{self.prefix}{prefix}:{key_hash}"
    
    async def get(self, key: str) -> Optional[Any]:
        """Obter valor do cache"""
        try:
            if not self.client:
                await self.initialize()
            
            value = await self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Error getting cache key {key}: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: int = None) -> bool:
        """Definir valor no cache"""
        try:
            if not self.client:
                await self.initialize()
            
            ttl = ttl or self.default_ttl
            serialized_value = json.dumps(value, default=str)
            
            await self.client.setex(key, ttl, serialized_value)
            return True
        except Exception as e:
            logger.error(f"Error setting cache key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Deletar valor do cache"""
        try:
            if not self.client:
                await self.initialize()
            
            result = await self.client.delete(key)
            return result > 0
        except Exception as e:
            logger.error(f"Error deleting cache key {key}: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Verificar se chave existe"""
        try:
            if not self.client:
                await self.initialize()
            
            return await self.client.exists(key) > 0
        except Exception as e:
            logger.error(f"Error checking cache key {key}: {e}")
            return False
    
    async def expire(self, key: str, ttl: int) -> bool:
        """Definir TTL para chave"""
        try:
            if not self.client:
                await self.initialize()
            
            return await self.client.expire(key, ttl)
        except Exception as e:
            logger.error(f"Error setting TTL for cache key {key}: {e}")
            return False
    
    async def clear_pattern(self, pattern: str) -> int:
        """Limpar chaves por padrão"""
        try:
            if not self.client:
                await self.initialize()
            
            keys = await self.client.keys(pattern)
            if keys:
                return await self.client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Error clearing cache pattern {pattern}: {e}")
            return 0
    
    async def get_many(self, keys: List[str]) -> Dict[str, Any]:
        """Obter múltiplos valores"""
        try:
            if not self.client:
                await self.initialize()
            
            values = await self.client.mget(keys)
            result = {}
            
            for key, value in zip(keys, values):
                if value:
                    result[key] = json.loads(value)
            
            return result
        except Exception as e:
            logger.error(f"Error getting multiple cache keys: {e}")
            return {}
    
    async def set_many(self, data: Dict[str, Any], ttl: int = None) -> bool:
        """Definir múltiplos valores"""
        try:
            if not self.client:
                await self.initialize()
            
            ttl = ttl or self.default_ttl
            pipeline = self.client.pipeline()
            
            for key, value in data.items():
                serialized_value = json.dumps(value, default=str)
                pipeline.setex(key, ttl, serialized_value)
            
            await pipeline.execute()
            return True
        except Exception as e:
            logger.error(f"Error setting multiple cache keys: {e}")
            return False
    
    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Incrementar valor numérico"""
        try:
            if not self.client:
                await self.initialize()
            
            return await self.client.incrby(key, amount)
        except Exception as e:
            logger.error(f"Error incrementing cache key {key}: {e}")
            return None
    
    async def get_stats(self) -> Dict[str, Any]:
        """Obter estatísticas do cache"""
        try:
            if not self.client:
                await self.initialize()
            
            info = await self.client.info()
            return {
                'used_memory': info.get('used_memory', 0),
                'used_memory_human': info.get('used_memory_human', '0B'),
                'connected_clients': info.get('connected_clients', 0),
                'total_commands_processed': info.get('total_commands_processed', 0),
                'keyspace_hits': info.get('keyspace_hits', 0),
                'keyspace_misses': info.get('keyspace_misses', 0),
            }
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {}


# Instância global do serviço de cache
cache_service = CacheService()


def cache_result(prefix: str, ttl: int = None, key_generator: callable = None):
    """
    Decorator para cachear resultado de função
    
    Args:
        prefix: Prefixo para a chave de cache
        ttl: Tempo de vida em segundos
        key_generator: Função para gerar chave customizada
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Gerar chave de cache
            if key_generator:
                cache_key = key_generator(*args, **kwargs)
            else:
                cache_key = cache_service._generate_key(prefix, *args, **kwargs)
            
            # Tentar obter do cache
            cached_result = await cache_service.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for key: {cache_key}")
                return cached_result
            
            # Executar função e cachear resultado
            result = await func(*args, **kwargs)
            await cache_service.set(cache_key, result, ttl)
            
            logger.debug(f"Cache miss for key: {cache_key}, cached result")
            return result
        
        return wrapper
    return decorator


def invalidate_cache(pattern: str):
    """
    Decorator para invalidar cache após operação
    
    Args:
        pattern: Padrão de chaves para invalidar
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            
            # Invalidar cache
            cleared_keys = await cache_service.clear_pattern(pattern)
            if cleared_keys > 0:
                logger.debug(f"Invalidated {cleared_keys} cache keys with pattern: {pattern}")
            
            return result
        
        return wrapper
    return decorator


# Cache específico para diferentes tipos de dados
class UserCache:
    """Cache específico para usuários"""
    
    @staticmethod
    @cache_result("user", ttl=1800)  # 30 minutos
    async def get_user_by_id(user_id: str):
        """Cache para usuário por ID"""
        from app.models.user import User
        return await User.get_by_id(user_id)
    
    @staticmethod
    @cache_result("user_email", ttl=1800)  # 30 minutos
    async def get_user_by_email(email: str):
        """Cache para usuário por email"""
        from app.models.user import User
        return await User.get_by_email(email)
    
    @staticmethod
    @invalidate_cache("milapp:user:*")
    async def update_user(user_id: str, update_data: dict):
        """Atualizar usuário e invalidar cache"""
        from app.models.user import User
        user = await User.get_by_id(user_id)
        if user:
            return await user.update_user(update_data)
        return None


class ProjectCache:
    """Cache específico para projetos"""
    
    @staticmethod
    @cache_result("project", ttl=900)  # 15 minutos
    async def get_project_by_id(project_id: str):
        """Cache para projeto por ID"""
        from app.models.project import Project
        return await Project.get_by_id(project_id)
    
    @staticmethod
    @cache_result("projects_list", ttl=300)  # 5 minutos
    async def get_projects_list(filters: dict = None):
        """Cache para lista de projetos"""
        from app.models.project import Project
        return await Project.get_all(filters)
    
    @staticmethod
    @invalidate_cache("milapp:project:*")
    async def update_project(project_id: str, update_data: dict):
        """Atualizar projeto e invalidar cache"""
        from app.models.project import Project
        project = await Project.get_by_id(project_id)
        if project:
            return await project.update_project(update_data)
        return None


class MetricsCache:
    """Cache para métricas e analytics"""
    
    @staticmethod
    @cache_result("metrics", ttl=60)  # 1 minuto
    async def get_dashboard_metrics():
        """Cache para métricas do dashboard"""
        # Implementar lógica de métricas
        return {
            'total_users': 0,
            'total_projects': 0,
            'active_projects': 0,
            'completed_projects': 0
        }
    
    @staticmethod
    @cache_result("analytics", ttl=300)  # 5 minutos
    async def get_project_analytics(project_id: str):
        """Cache para analytics de projeto"""
        # Implementar lógica de analytics
        return {
            'project_id': project_id,
            'progress': 0,
            'tasks_completed': 0,
            'total_tasks': 0
        }


# Funções utilitárias para cache
async def warm_cache():
    """Aquecer cache com dados frequentes"""
    try:
        logger.info("Warming up cache...")
        
        # Cachear métricas do dashboard
        await MetricsCache.get_dashboard_metrics()
        
        # Cachear lista de projetos ativos
        await ProjectCache.get_projects_list({'status': 'active'})
        
        logger.info("Cache warmed up successfully")
    except Exception as e:
        logger.error(f"Error warming up cache: {e}")


async def clear_all_cache():
    """Limpar todo o cache"""
    try:
        cleared_keys = await cache_service.clear_pattern("milapp:*")
        logger.info(f"Cleared {cleared_keys} cache keys")
        return cleared_keys
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        return 0


async def get_cache_health():
    """Verificar saúde do cache"""
    try:
        await cache_service.initialize()
        await cache_service.client.ping()
        return True
    except Exception as e:
        logger.error(f"Cache health check failed: {e}")
        return False 