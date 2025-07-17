from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import structlog

from app.core.config import settings

logger = structlog.get_logger()

# Configuração do engine do banco
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=StaticPool,
    pool_pre_ping=True,
    echo=settings.DEBUG
)

# Configuração da sessão
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para os modelos
Base = declarative_base()

# Metadata para migrations
metadata = MetaData()

def get_db():
    """Dependency para obter sessão do banco"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def init_db():
    """Inicializar banco de dados"""
    try:
        # Criar tabelas se não existirem
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error("Error creating database tables", error=str(e))
        raise

def check_db_connection():
    """Verificar conexão com banco"""
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error("Database connection failed", error=str(e))
        return False 