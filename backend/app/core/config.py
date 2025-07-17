from pydantic_settings import BaseSettings
from typing import List, Optional
import os

class Settings(BaseSettings):
    # Configuração Geral
    APP_NAME: str = "MILAPP"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    LOG_LEVEL: str = "info"
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/milapp"
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Supabase
    SUPABASE_URL: Optional[str] = None
    SUPABASE_ANON_KEY: Optional[str] = None
    SUPABASE_SERVICE_KEY: Optional[str] = None
    
    # AI Services
    OPENAI_API_KEY: Optional[str] = None
    LANGCHAIN_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    
    # Azure Integration
    AZURE_TENANT_ID: Optional[str] = None
    AZURE_CLIENT_ID: Optional[str] = None
    AZURE_CLIENT_SECRET: Optional[str] = None
    AZURE_SUBSCRIPTION_ID: Optional[str] = None
    
    # Security
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production"
    ENCRYPTION_KEY: str = "your-encryption-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://milapp.company.com"
    ]
    
    # File Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_FILE_TYPES: List[str] = [
        "image/jpeg", "image/png", "image/gif",
        "application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain", "audio/mpeg", "audio/wav"
    ]
    
    # Monitoring
    PROMETHEUS_ENABLED: bool = True
    SENTRY_DSN: Optional[str] = None
    
    # Notifications
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    TEAMS_WEBHOOK_URL: Optional[str] = None
    WHATSAPP_API_KEY: Optional[str] = None
    WHATSAPP_PHONE_NUMBER: Optional[str] = None
    
    # External Tools
    N8N_BASE_URL: Optional[str] = None
    N8N_API_KEY: Optional[str] = None
    
    POWERBI_WORKSPACE_ID: Optional[str] = None
    POWERBI_CLIENT_ID: Optional[str] = None
    POWERBI_CLIENT_SECRET: Optional[str] = None
    
    # Feature Flags
    ENABLE_AI_FEATURES: bool = True
    ENABLE_ADVANCED_ANALYTICS: bool = True
    ENABLE_EXTERNAL_INTEGRATIONS: bool = True
    ENABLE_AUDIT_LOGGING: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Instância global das configurações
settings = Settings()

# Criar diretório de uploads se não existir
os.makedirs(settings.UPLOAD_DIR, exist_ok=True) 