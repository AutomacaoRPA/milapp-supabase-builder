"""
Testes unitários para o serviço de autenticação
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.auth_service import AuthService
from app.models.user import User


class TestAuthService:
    """Testes para AuthService"""
    
    @pytest.fixture
    def mock_db(self):
        """Mock do banco de dados"""
        return AsyncMock(spec=AsyncSession)
    
    @pytest.fixture
    def sample_user_data(self):
        """Dados de exemplo de usuário"""
        return {
            "email": "test@example.com",
            "name": "Test User",
            "password": "testpassword123",
            "role": "user",
            "department": "IT"
        }
    
    @pytest.fixture
    def sample_user(self):
        """Usuário de exemplo"""
        user = User()
        user.id = "test-user-id"
        user.email = "test@example.com"
        user.name = "Test User"
        user.hashed_password = AuthService.get_password_hash("testpassword123")
        user.role = "user"
        user.department = "IT"
        user.is_active = True
        return user
    
    def test_verify_password_valid(self):
        """Testar verificação de senha válida"""
        password = "testpassword123"
        hashed = AuthService.get_password_hash(password)
        
        assert AuthService.verify_password(password, hashed) is True
    
    def test_verify_password_invalid(self):
        """Testar verificação de senha inválida"""
        password = "testpassword123"
        wrong_password = "wrongpassword"
        hashed = AuthService.get_password_hash(password)
        
        assert AuthService.verify_password(wrong_password, hashed) is False
    
    def test_get_password_hash(self):
        """Testar geração de hash de senha"""
        password = "testpassword123"
        hashed = AuthService.get_password_hash(password)
        
        assert hashed != password
        assert len(hashed) > 0
        assert hashed.startswith("$2b$")  # bcrypt hash
    
    def test_create_access_token(self):
        """Testar criação de token de acesso"""
        data = {"sub": "test-user-id"}
        token = AuthService.create_access_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    @pytest.mark.asyncio
    async def test_authenticate_user_valid_credentials(self, mock_db, sample_user):
        """Testar autenticação com credenciais válidas"""
        # Mock da query
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_user
        mock_db.execute.return_value = mock_result
        
        # Testar autenticação
        result = await AuthService.authenticate_user(
            mock_db, "test@example.com", "testpassword123"
        )
        
        assert result is not None
        assert result.email == "test@example.com"
        assert result.name == "Test User"
        mock_db.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_authenticate_user_invalid_email(self, mock_db):
        """Testar autenticação com email inválido"""
        # Mock da query retornando None
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        # Testar autenticação
        result = await AuthService.authenticate_user(
            mock_db, "invalid@example.com", "testpassword123"
        )
        
        assert result is None
        mock_db.commit.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_authenticate_user_invalid_password(self, mock_db, sample_user):
        """Testar autenticação com senha inválida"""
        # Mock da query
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_user
        mock_db.execute.return_value = mock_result
        
        # Testar autenticação com senha errada
        result = await AuthService.authenticate_user(
            mock_db, "test@example.com", "wrongpassword"
        )
        
        assert result is None
        mock_db.commit.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_get_user_by_email_found(self, mock_db, sample_user):
        """Testar busca de usuário por email - encontrado"""
        # Mock da query
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_user
        mock_db.execute.return_value = mock_result
        
        # Testar busca
        result = await AuthService.get_user_by_email(mock_db, "test@example.com")
        
        assert result is not None
        assert result.email == "test@example.com"
    
    @pytest.mark.asyncio
    async def test_get_user_by_email_not_found(self, mock_db):
        """Testar busca de usuário por email - não encontrado"""
        # Mock da query retornando None
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        # Testar busca
        result = await AuthService.get_user_by_email(mock_db, "notfound@example.com")
        
        assert result is None
    
    @pytest.mark.asyncio
    async def test_create_user_success(self, mock_db, sample_user_data):
        """Testar criação de usuário com sucesso"""
        # Mock do commit e refresh
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        
        # Testar criação
        result = await AuthService.create_user(mock_db, sample_user_data)
        
        assert result is not None
        assert result.email == sample_user_data["email"]
        assert result.name == sample_user_data["name"]
        assert result.role == sample_user_data["role"]
        assert result.is_active is True
        
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_create_user_database_error(self, mock_db, sample_user_data):
        """Testar criação de usuário com erro de banco"""
        # Mock do commit para lançar exceção
        mock_db.commit.side_effect = Exception("Database error")
        mock_db.rollback = AsyncMock()
        
        # Testar criação
        with pytest.raises(Exception):
            await AuthService.create_user(mock_db, sample_user_data)
        
        mock_db.rollback.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_logout_user_success(self, mock_db):
        """Testar logout de usuário com sucesso"""
        result = await AuthService.logout_user(mock_db, "test-user-id")
        
        assert result is True
    
    @pytest.mark.asyncio
    async def test_check_user_permissions_admin(self, sample_user):
        """Testar verificação de permissões para admin"""
        sample_user.role = "admin"
        
        result = await AuthService.check_user_permissions(
            sample_user, "projects", "delete"
        )
        
        assert result is True
    
    @pytest.mark.asyncio
    async def test_check_user_permissions_user_allowed(self, sample_user):
        """Testar verificação de permissões para usuário - permitido"""
        sample_user.role = "user"
        
        result = await AuthService.check_user_permissions(
            sample_user, "projects", "read"
        )
        
        assert result is True
    
    @pytest.mark.asyncio
    async def test_check_user_permissions_user_denied(self, sample_user):
        """Testar verificação de permissões para usuário - negado"""
        sample_user.role = "user"
        
        result = await AuthService.check_user_permissions(
            sample_user, "admin", "delete"
        )
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_check_user_permissions_invalid_resource(self, sample_user):
        """Testar verificação de permissões para recurso inválido"""
        sample_user.role = "user"
        
        result = await AuthService.check_user_permissions(
            sample_user, "invalid_resource", "read"
        )
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_check_user_permissions_invalid_action(self, sample_user):
        """Testar verificação de permissões para ação inválida"""
        sample_user.role = "user"
        
        result = await AuthService.check_user_permissions(
            sample_user, "projects", "invalid_action"
        )
        
        assert result is False 