"""
Configuração do banco de dados MILAPP
"""

from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
import logging
from contextlib import contextmanager
from typing import Generator
import time
from .config import settings

# Configuração de logging estruturado
logger = logging.getLogger(__name__)

def get_database_config():
    """Configuração de banco baseada no ambiente"""
    if settings.ENVIRONMENT == "development":
        return {
            "pool_size": 5,
            "max_overflow": 10,
            "pool_pre_ping": True,
            "pool_recycle": 3600,
        }
    elif settings.ENVIRONMENT == "production":
        return {
            "pool_size": 20,
            "max_overflow": 30,
            "pool_pre_ping": True,
            "pool_recycle": 3600,
            "pool_timeout": 30,
        }
    elif settings.ENVIRONMENT == "test":
        return {
            "pool_size": 2,
            "max_overflow": 5,
            "pool_pre_ping": True,
            "pool_recycle": 1800,
        }
    else:
        return {
            "pool_size": 10,
            "max_overflow": 20,
            "pool_pre_ping": True,
            "pool_recycle": 3600,
        }

# Configuração otimizada do engine com connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=QueuePool,
    **get_database_config(),
    echo=settings.DEBUG,  # Log de queries apenas em debug
    connect_args={
        "check_same_thread": False,
        "timeout": 30,  # Timeout de conexão
    } if settings.DATABASE_URL and "sqlite" in settings.DATABASE_URL else {
        "connect_timeout": 30,
        "application_name": "milapp_backend"
    }
)

# Configuração da sessão com retry automático
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False  # Evita problemas com objetos expirados
)

# Base para modelos SQLAlchemy
Base = declarative_base()

# Event listeners para logging e monitoramento
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Configurar pragmas para SQLite"""
    if "sqlite" in str(dbapi_connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA cache_size=10000")
        cursor.execute("PRAGMA temp_store=MEMORY")
        cursor.close()

@event.listens_for(engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Log de queries lentas"""
    conn.info.setdefault('query_start_time', []).append(time.time())

@event.listens_for(engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    """Log de queries lentas"""
    total = time.time() - conn.info['query_start_time'].pop(-1)
    if total > 1.0:  # Log queries que demoram mais de 1 segundo
        logger.warning(f"Slow query detected: {total:.2f}s - {statement[:100]}...")

def get_db() -> Generator[Session, None, None]:
    """Dependency para obter sessão do banco de dados"""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

@contextmanager
def get_db_context():
    """Context manager para sessão do banco de dados"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        logger.error(f"Database error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

async def init_db():
    """Inicializar banco de dados"""
    try:
        # Criar todas as tabelas
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        raise

async def check_db_connection():
    """Verificar conexão com banco de dados"""
    try:
        with engine.connect() as connection:
            connection.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database connection check failed: {str(e)}")
        return False

def get_connection_count():
    """Obter número de conexões ativas"""
    try:
        return engine.pool.size()
    except Exception as e:
        logger.error(f"Error getting connection count: {str(e)}")
        return 0 