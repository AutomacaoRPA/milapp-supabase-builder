import structlog
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import jwt

from app.core.config import settings

logger = structlog.get_logger()

class AuthService:
    def __init__(self):
        self.secret_key = settings.JWT_SECRET_KEY
        self.algorithm = "HS256"
    
    def create_access_token(self, user_id: str) -> str:
        """Criar token de acesso JWT"""
        payload = {
            "user_id": user_id,
            "exp": datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            "type": "access"
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def create_refresh_token(self, user_id: str) -> str:
        """Criar token de refresh JWT"""
        payload = {
            "user_id": user_id,
            "exp": datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            "type": "refresh"
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verificar token JWT"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            return None
        except jwt.InvalidTokenError:
            logger.warning("Invalid token")
            return None
    
    async def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Autenticar usuário"""
        # Implementação básica - expandir com Supabase Auth
        try:
            # Placeholder para autenticação
            if email and password:
                return {
                    "id": "user_id",
                    "email": email,
                    "name": "User Name",
                    "role": "user"
                }
            return None
        except Exception as e:
            logger.error("Authentication error", error=str(e))
            return None 