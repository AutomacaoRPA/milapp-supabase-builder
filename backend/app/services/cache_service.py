import redis
import json
import logging
from typing import Any, Optional, Union
from functools import wraps
import hashlib
from datetime import datetime, timedelta
from app.core.config import settings

logger = logging.getLogger(__name__)

class CacheService:
    """
    Serviço de cache usando Redis para melhorar performance
    """
    
    def __init__(self):
        self.redis_client = None
        self._connect_redis()
    
    def _connect_redis(self):
        """Conecta ao Redis"""
        try:
            if settings.REDIS_URL:
                self.redis_client = redis.from_url(
                    settings.REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=5,
                    socket_timeout=5,
                    retry_on_timeout=True
                )
                # Testa conexão
                self.redis_client.ping()
                logger.info("Conexão com Redis estabelecida")
            else:
                logger.warning("REDIS_URL não configurada - cache desabilitado")
        except Exception as e:
            logger.error(f"Erro ao conectar com Redis: {e}")
            self.redis_client = None
    
    def is_available(self) -> bool:
        """Verifica se o cache está disponível"""
        if not self.redis_client:
            return False
        try:
            self.redis_client.ping()
            return True
        except:
            return False
    
    def get(self, key: str) -> Optional[Any]:
        """Obtém valor do cache"""
        if not self.is_available():
            return None
        
        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Erro ao obter cache para {key}: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """Define valor no cache com TTL"""
        if not self.is_available():
            return False
        
        try:
            serialized = json.dumps(value, default=str)
            self.redis_client.setex(key, ttl, serialized)
            return True
        except Exception as e:
            logger.error(f"Erro ao definir cache para {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Remove valor do cache"""
        if not self.is_available():
            return False
        
        try:
            self.redis_client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Erro ao deletar cache para {key}: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> bool:
        """Remove múltiplas chaves por padrão"""
        if not self.is_available():
            return False
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
            return True
        except Exception as e:
            logger.error(f"Erro ao deletar cache por padrão {pattern}: {e}")
            return False
    
    def invalidate_project_cache(self, project_id: int):
        """Invalida cache relacionado a um projeto"""
        patterns = [
            f"project:{project_id}:*",
            "projects:list:*",
            "dashboard:projects:*"
        ]
        for pattern in patterns:
            self.delete_pattern(pattern)
    
    def invalidate_user_cache(self, user_id: int):
        """Invalida cache relacionado a um usuário"""
        patterns = [
            f"user:{user_id}:*",
            "users:list:*"
        ]
        for pattern in patterns:
            self.delete_pattern(pattern)

# Instância global do cache
cache_service = CacheService()

def cache_result(ttl: int = 3600, key_prefix: str = ""):
    """
    Decorator para cachear resultados de funções
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Gera chave única baseada na função e argumentos
            func_name = func.__name__
            args_str = str(args) + str(sorted(kwargs.items()))
            key_hash = hashlib.md5(args_str.encode()).hexdigest()
            cache_key = f"{key_prefix}:{func_name}:{key_hash}"
            
            # Tenta obter do cache
            cached_result = cache_service.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit para {cache_key}")
                return cached_result
            
            # Executa função e cacheia resultado
            result = func(*args, **kwargs)
            cache_service.set(cache_key, result, ttl)
            logger.debug(f"Cache miss para {cache_key}, resultado cacheado")
            
            return result
        return wrapper
    return decorator

def invalidate_cache_on_change(cache_patterns: list):
    """
    Decorator para invalidar cache quando dados são modificados
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            
            # Invalida cache após modificação
            for pattern in cache_patterns:
                cache_service.delete_pattern(pattern)
            
            return result
        return wrapper
    return decorator 