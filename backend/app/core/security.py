"""
Sistema de segurança do MILAPP
"""

import os
import hashlib
import time
from datetime import datetime, timedelta
from typing import Optional, Union, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.base import BaseHTTPMiddleware
import structlog
import redis.asyncio as redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db

logger = structlog.get_logger()

# Configuração de criptografia
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuração do JWT
security = HTTPBearer()

# Cliente Redis para rate limiting
redis_client: Optional[redis.Redis] = None


async def get_redis_client() -> redis.Redis:
    """Obter cliente Redis"""
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(settings.REDIS_URL)
    return redis_client


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar senha"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Gerar hash da senha"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Criar token de acesso"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """Verificar token JWT"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Obter usuário atual baseado no token"""
    token = credentials.credentials
    payload = verify_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Buscar usuário no banco de dados
    from app.models.user import User
    user = await User.get_by_id(user_id)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


class SecurityMiddleware(BaseHTTPMiddleware):
    """Middleware de segurança"""
    
    async def dispatch(self, request: Request, call_next):
        # Adicionar headers de segurança
        response = await call_next(request)
        
        # Headers de segurança
        for header, value in settings.SECURITY_HEADERS.items():
            response.headers[header] = value
        
        # Log de auditoria
        await self._log_audit(request, response)
        
        return response
    
    async def _log_audit(self, request: Request, response: Response):
        """Log de auditoria"""
        try:
            audit_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "ip_address": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent"),
                "content_length": response.headers.get("content-length"),
            }
            
            logger.info("Audit log", **audit_data)
            
        except Exception as e:
            logger.error("Erro no log de auditoria", error=str(e))


class RateLimiter:
    """Sistema de rate limiting"""
    
    def __init__(self):
        self.redis_client = None
    
    async def check_rate_limit(self, user_id: str, endpoint: str) -> bool:
        """Verificar rate limit para usuário e endpoint"""
        try:
            if not self.redis_client:
                self.redis_client = await get_redis_client()
            
            # Chave para rate limiting
            minute_key = f"rate_limit:{user_id}:{endpoint}:minute"
            hour_key = f"rate_limit:{user_id}:{endpoint}:hour"
            
            current_time = int(time.time())
            
            # Verificar limite por minuto
            minute_count = await self.redis_client.get(minute_key)
            if minute_count and int(minute_count) >= settings.RATE_LIMIT_PER_MINUTE:
                return False
            
            # Verificar limite por hora
            hour_count = await self.redis_client.get(hour_key)
            if hour_count and int(hour_count) >= settings.RATE_LIMIT_PER_HOUR:
                return False
            
            # Incrementar contadores
            pipe = self.redis_client.pipeline()
            pipe.incr(minute_key)
            pipe.expire(minute_key, 60)  # Expira em 1 minuto
            pipe.incr(hour_key)
            pipe.expire(hour_key, 3600)  # Expira em 1 hora
            await pipe.execute()
            
            return True
            
        except Exception as e:
            logger.error("Rate limiting check failed", error=str(e))
            return True  # Em caso de erro, permitir acesso


# Instância global do rate limiter
rate_limiter = RateLimiter()


async def check_rate_limit_middleware(request: Request):
    """Middleware para verificar rate limit"""
    try:
        # Extrair user_id do token se disponível
        user_id = "anonymous"
        auth_header = request.headers.get("authorization")
        
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            payload = verify_token(token)
            if payload:
                user_id = payload.get("sub", "anonymous")
        
        # Verificar rate limit
        endpoint = request.url.path
        allowed = await rate_limiter.check_rate_limit(user_id, endpoint)
        
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit excedido. Tente novamente em alguns minutos."
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Erro no rate limiting", error=str(e))


def sanitize_input(data: Any) -> Any:
    """Sanitizar entrada do usuário"""
    if isinstance(data, str):
        # Remover caracteres perigosos
        dangerous_chars = ['<', '>', '"', "'", '&', 'script', 'javascript']
        for char in dangerous_chars:
            data = data.replace(char, '')
        return data.strip()
    elif isinstance(data, dict):
        return {k: sanitize_input(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(item) for item in data]
    else:
        return data


def validate_file_upload(filename: str, content_type: str, max_size: int = 10 * 1024 * 1024) -> bool:
    """Validar upload de arquivo"""
    # Verificar extensão
    allowed_extensions = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg']
    file_ext = os.path.splitext(filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        return False
    
    # Verificar content type
    allowed_types = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/png',
        'image/jpeg'
    ]
    
    if content_type not in allowed_types:
        return False
    
    return True


# Azure AD Integration
class AzureADAuth:
    """Integração com Azure AD"""
    
    def __init__(self):
        self.tenant_id = settings.AZURE_TENANT_ID
        self.client_id = settings.AZURE_CLIENT_ID
        self.client_secret = settings.AZURE_CLIENT_SECRET
    
    async def validate_azure_token(self, token: str) -> Optional[dict]:
        """Validar token do Azure AD"""
        try:
            import msal
            
            # Configurar aplicação MSAL
            app = msal.ConfidentialClientApplication(
                client_id=self.client_id,
                client_credential=self.client_secret,
                authority=f"https://login.microsoftonline.com/{self.tenant_id}"
            )
            
            # Validar token
            result = app.acquire_token_silent(
                scopes=["https://graph.microsoft.com/.default"],
                account=None
            )
            
            if result:
                return result
            else:
                return None
                
        except Exception as e:
            logger.error("Azure AD token validation failed", error=str(e))
            return None


# Função para verificar permissões
async def check_permission(user, resource_type: str, action: str) -> bool:
    """Verificar se usuário tem permissão para ação"""
    try:
        # Implementar lógica de verificação de permissões
        if user.role == "admin":
            return True
        
        # Verificar permissões específicas
        permissions = {
            "projects": ["read", "write", "delete"],
            "conversations": ["read", "write"],
            "documents": ["read", "write"],
            "quality_gates": ["read", "approve"],
            "deployments": ["read", "deploy"],
            "dashboards": ["read"]
        }
        
        if resource_type in permissions and action in permissions[resource_type]:
            return True
        
        return False
        
    except Exception as e:
        logger.error("Permission check failed", error=str(e))
        return False


# Decorator para verificar permissões
def require_permission(resource_type: str, action: str):
    """Decorator para verificar permissões"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            current_user = kwargs.get('current_user')
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Usuário não autenticado"
                )
            
            has_permission = await check_permission(current_user, resource_type, action)
            if not has_permission:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Permissão negada"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator 