"""
Configurações do MILAPP Backend
"""

import os
import secrets
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import validator


class Settings(BaseSettings):
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str
    
    # Database Configuration (Supabase PostgreSQL)
    DATABASE_URL: Optional[str] = None
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Security - VALIDAÇÃO FORTE
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Azure AD Configuration
    AZURE_TENANT_ID: Optional[str] = None
    AZURE_CLIENT_ID: Optional[str] = None
    AZURE_CLIENT_SECRET: Optional[str] = None
    
    # AI Services
    OPENAI_API_KEY: Optional[str] = None
    LANGCHAIN_API_KEY: Optional[str] = None
    
    # External Integrations
    N8N_BASE_URL: Optional[str] = None
    N8N_API_KEY: Optional[str] = None
    
    # Notifications
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    # File Storage (MinIO/S3)
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET_NAME: str = "milapp-files"
    MINIO_SECURE: bool = False
    
    # Monitoring
    PROMETHEUS_URL: Optional[str] = None
    GRAFANA_URL: Optional[str] = None
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Security Headers
    SECURITY_HEADERS: dict = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    }
    
    # Allowed Hosts for TrustedHostMiddleware
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "0.0.0.0"]
    
    @validator('SECRET_KEY')
    def validate_secret_key(cls, v):
        if not v or v == "your-secret-key-here":
            raise ValueError("SECRET_KEY deve ser configurada e ter pelo menos 32 caracteres")
        if len(v) < 32:
            raise ValueError("SECRET_KEY deve ter pelo menos 32 caracteres")
        if not any(c.isupper() for c in v):
            raise ValueError("SECRET_KEY deve conter pelo menos uma letra maiúscula")
        if not any(c.islower() for c in v):
            raise ValueError("SECRET_KEY deve conter pelo menos uma letra minúscula")
        if not any(c.isdigit() for c in v):
            raise ValueError("SECRET_KEY deve conter pelo menos um número")
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v):
            raise ValueError("SECRET_KEY deve conter pelo menos um caractere especial")
        return v
    
    @validator('SUPABASE_URL')
    def validate_supabase_url(cls, v):
        if not v or not v.startswith('https://'):
            raise ValueError("SUPABASE_URL deve ser uma URL HTTPS válida")
        return v
    
    @validator('CORS_ORIGINS')
    def validate_cors_origins(cls, v):
        if not v:
            raise ValueError("CORS_ORIGINS não pode estar vazio")
        return v
    
    @validator('ENVIRONMENT')
    def validate_environment(cls, v):
        allowed_environments = ['development', 'staging', 'production', 'test']
        if v not in allowed_environments:
            raise ValueError(f"ENVIRONMENT deve ser um dos: {allowed_environments}")
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Instância global das configurações
settings = Settings()


def get_settings() -> Settings:
    """Retorna as configurações da aplicação"""
    return settings 