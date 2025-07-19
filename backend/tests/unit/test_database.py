"""
Testes unitários para o módulo de banco de dados
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from sqlalchemy.exc import SQLAlchemyError
from app.core.database import (
    get_db, 
    get_db_context, 
    init_db, 
    check_db_connection,
    get_connection_count,
    get_database_config
)
from app.core.config import settings


class TestDatabaseConfig:
    """Testes para configuração do banco de dados"""
    
    def test_get_database_config_development(self):
        """Testar configuração para ambiente de desenvolvimento"""
        with patch('app.core.database.settings') as mock_settings:
            mock_settings.ENVIRONMENT = 'development'
            config = get_database_config()
            
            assert config['pool_size'] == 5
            assert config['max_overflow'] == 10
            assert config['pool_pre_ping'] is True
            assert config['pool_recycle'] == 3600
    
    def test_get_database_config_production(self):
        """Testar configuração para ambiente de produção"""
        with patch('app.core.database.settings') as mock_settings:
            mock_settings.ENVIRONMENT = 'production'
            config = get_database_config()
            
            assert config['pool_size'] == 20
            assert config['max_overflow'] == 30
            assert config['pool_pre_ping'] is True
            assert config['pool_recycle'] == 3600
            assert config['pool_timeout'] == 30
    
    def test_get_database_config_test(self):
        """Testar configuração para ambiente de teste"""
        with patch('app.core.database.settings') as mock_settings:
            mock_settings.ENVIRONMENT = 'test'
            config = get_database_config()
            
            assert config['pool_size'] == 2
            assert config['max_overflow'] == 5
            assert config['pool_pre_ping'] is True
            assert config['pool_recycle'] == 1800


class TestDatabaseConnection:
    """Testes para conexão com banco de dados"""
    
    @pytest.mark.asyncio
    async def test_check_db_connection_success(self):
        """Testar verificação de conexão bem-sucedida"""
        with patch('app.core.database.engine') as mock_engine:
            mock_connection = Mock()
            mock_engine.connect.return_value.__enter__.return_value = mock_connection
            
            result = await check_db_connection()
            
            assert result is True
            mock_connection.execute.assert_called_once_with("SELECT 1")
    
    @pytest.mark.asyncio
    async def test_check_db_connection_failure(self):
        """Testar verificação de conexão com falha"""
        with patch('app.core.database.engine') as mock_engine:
            mock_engine.connect.side_effect = SQLAlchemyError("Connection failed")
            
            result = await check_db_connection()
            
            assert result is False
    
    def test_get_connection_count_success(self):
        """Testar obtenção do número de conexões ativas"""
        with patch('app.core.database.engine') as mock_engine:
            mock_engine.pool.size.return_value = 5
            
            result = get_connection_count()
            
            assert result == 5
            mock_engine.pool.size.assert_called_once()
    
    def test_get_connection_count_failure(self):
        """Testar obtenção do número de conexões com erro"""
        with patch('app.core.database.engine') as mock_engine:
            mock_engine.pool.size.side_effect = Exception("Pool error")
            
            result = get_connection_count()
            
            assert result == 0


class TestDatabaseInitialization:
    """Testes para inicialização do banco de dados"""
    
    @pytest.mark.asyncio
    async def test_init_db_success(self):
        """Testar inicialização bem-sucedida do banco"""
        with patch('app.core.database.Base.metadata.create_all') as mock_create_all:
            mock_create_all.return_value = None
            
            await init_db()
            
            mock_create_all.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_init_db_failure(self):
        """Testar inicialização com falha do banco"""
        with patch('app.core.database.Base.metadata.create_all') as mock_create_all:
            mock_create_all.side_effect = SQLAlchemyError("Creation failed")
            
            with pytest.raises(SQLAlchemyError):
                await init_db()


class TestDatabaseContext:
    """Testes para context managers do banco de dados"""
    
    def test_get_db_context_success(self):
        """Testar context manager com sucesso"""
        with patch('app.core.database.SessionLocal') as mock_session_local:
            mock_session = Mock()
            mock_session_local.return_value = mock_session
            
            with get_db_context() as db:
                assert db == mock_session
            
            mock_session.commit.assert_called_once()
            mock_session.close.assert_called_once()
    
    def test_get_db_context_exception(self):
        """Testar context manager com exceção"""
        with patch('app.core.database.SessionLocal') as mock_session_local:
            mock_session = Mock()
            mock_session_local.return_value = mock_session
            
            with pytest.raises(Exception):
                with get_db_context() as db:
                    raise Exception("Test error")
            
            mock_session.rollback.assert_called_once()
            mock_session.close.assert_called_once()


class TestDatabaseDependency:
    """Testes para dependency injection do banco de dados"""
    
    def test_get_db_generator(self):
        """Testar generator do dependency injection"""
        with patch('app.core.database.SessionLocal') as mock_session_local:
            mock_session = Mock()
            mock_session_local.return_value = mock_session
            
            db_gen = get_db()
            db = next(db_gen)
            
            assert db == mock_session
            
            # Simular finalização
            try:
                db_gen.close()
            except StopIteration:
                pass
            
            mock_session.close.assert_called_once()
    
    def test_get_db_generator_with_exception(self):
        """Testar generator com exceção"""
        with patch('app.core.database.SessionLocal') as mock_session_local:
            mock_session = Mock()
            mock_session_local.return_value = mock_session
            
            db_gen = get_db()
            db = next(db_gen)
            
            # Simular exceção
            try:
                raise Exception("Test error")
            except Exception:
                try:
                    db_gen.close()
                except StopIteration:
                    pass
            
            mock_session.rollback.assert_called_once()
            mock_session.close.assert_called_once()


class TestDatabasePerformance:
    """Testes para performance do banco de dados"""
    
    @pytest.mark.asyncio
    async def test_slow_query_logging(self):
        """Testar logging de queries lentas"""
        with patch('app.core.database.logger') as mock_logger:
            with patch('app.core.database.time') as mock_time:
                # Simular query lenta (mais de 1 segundo)
                mock_time.time.side_effect = [0, 1.5]  # 1.5 segundos
                
                # Simular evento de query
                from app.core.database import after_cursor_execute
                
                mock_conn = Mock()
                mock_conn.info = {'query_start_time': [0]}
                
                after_cursor_execute(mock_conn, None, "SELECT * FROM users", None, None, False)
                
                mock_logger.warning.assert_called_once()
                assert "Slow query detected" in mock_logger.warning.call_args[0][0]
    
    def test_fast_query_no_logging(self):
        """Testar que queries rápidas não são logadas"""
        with patch('app.core.database.logger') as mock_logger:
            with patch('app.core.database.time') as mock_time:
                # Simular query rápida (menos de 1 segundo)
                mock_time.time.side_effect = [0, 0.5]  # 0.5 segundos
                
                # Simular evento de query
                from app.core.database import after_cursor_execute
                
                mock_conn = Mock()
                mock_conn.info = {'query_start_time': [0]}
                
                after_cursor_execute(mock_conn, None, "SELECT 1", None, None, False)
                
                mock_logger.warning.assert_not_called()


class TestDatabaseSecurity:
    """Testes para segurança do banco de dados"""
    
    def test_sqlite_pragma_configuration(self):
        """Testar configuração de pragmas para SQLite"""
        with patch('app.core.database.set_sqlite_pragma') as mock_pragma:
            from app.core.database import set_sqlite_pragma
            
            mock_dbapi_connection = Mock()
            mock_dbapi_connection.cursor.return_value = Mock()
            
            # Simular SQLite
            with patch('app.core.database.str') as mock_str:
                mock_str.return_value.__contains__.return_value = True
                
                set_sqlite_pragma(mock_dbapi_connection, None)
                
                cursor = mock_dbapi_connection.cursor.return_value
                assert cursor.execute.call_count == 5  # 5 pragmas configurados
    
    def test_postgresql_connection_args(self):
        """Testar argumentos de conexão para PostgreSQL"""
        with patch('app.core.database.settings') as mock_settings:
            mock_settings.DATABASE_URL = "postgresql://user:pass@localhost/db"
            
            # Recriar engine para testar argumentos
            with patch('app.core.database.create_engine') as mock_create_engine:
                from app.core.database import engine
                
                # Verificar se os argumentos corretos foram passados
                mock_create_engine.assert_called()
                call_args = mock_create_engine.call_args
                
                # Verificar connect_args para PostgreSQL
                connect_args = call_args[1].get('connect_args', {})
                assert 'connect_timeout' in connect_args
                assert connect_args['connect_timeout'] == 30 