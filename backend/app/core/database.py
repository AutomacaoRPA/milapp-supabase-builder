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

# Configuração otimizada do engine com connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,  # Número de conexões no pool
    max_overflow=30,  # Conexões adicionais quando o pool está cheio
    pool_pre_ping=True,  # Verifica conexões antes de usar
    pool_recycle=3600,  # Recicla conexões a cada hora
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

Base = declarative_base()

# Middleware para logging de queries lentas
@event.listens_for(engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    context._query_start_time = time.time()

@event.listens_for(engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total = time.time() - context._query_start_time
    if total > 1.0:  # Log queries que demoram mais de 1 segundo
        logger.warning(
            "Query lenta detectada",
            extra={
                "query_time": total,
                "statement": statement[:200] + "..." if len(statement) > 200 else statement,
                "parameters": str(parameters)[:100] if parameters else None
            }
        )

def get_db() -> Generator[Session, None, None]:
    """
    Dependency para obter sessão do banco de dados com retry automático
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Erro na sessão do banco: {e}")
        db.rollback()
        raise
    finally:
        db.close()

@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """
    Context manager para sessões do banco de dados
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        logger.error(f"Erro na sessão do banco: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def init_db():
    """
    Inicializa o banco de dados criando todas as tabelas
    """
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Banco de dados inicializado com sucesso")
    except Exception as e:
        logger.error(f"Erro ao inicializar banco de dados: {e}")
        raise

def check_db_connection() -> bool:
    """
    Verifica se a conexão com o banco está funcionando
    """
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Erro na conexão com banco de dados: {e}")
        return False 