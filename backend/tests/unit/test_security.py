"""
Testes unitários para o módulo de segurança
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timedelta
from jose import jwt

from app.core.security import (
    verify_token, 
    create_access_token, 
    get_current_user,
    verify_password,
    get_password_hash,
    sanitize_input,
    validate_file_upload
)
from app.core.config import settings
from app.models.user import User


class TestSecurity:
    """Testes para funcionalidades de segurança"""
    
    def test_create_access_token(self):
        """Testar criação de token de acesso"""
        data = {"sub": "test@example.com"}
        token = create_access_token(data)
        assert token is not None
        assert len(token) > 0
        
        # Verificar se o token pode ser decodificado
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert payload["sub"] == "test@example.com"
        assert "exp" in payload
    
    def test_create_access_token_with_expires_delta(self):
        """Testar criação de token com tempo de expiração customizado"""
        data = {"sub": "test@example.com"}
        expires_delta = timedelta(minutes=60)
        token = create_access_token(data, expires_delta=expires_delta)
        
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        assert payload["sub"] == "test@example.com"
    
    def test_verify_token_valid(self):
        """Testar verificação de token válido"""
        data = {"sub": "test@example.com"}
        token = create_access_token(data)
        payload = verify_token(token)
        assert payload is not None
        assert payload["sub"] == "test@example.com"
    
    def test_verify_token_invalid(self):
        """Testar verificação de token inválido"""
        payload = verify_token("invalid_token")
        assert payload is None
    
    def test_verify_token_expired(self):
        """Testar verificação de token expirado"""
        # Criar token expirado
        data = {"sub": "test@example.com"}
        expires_delta = timedelta(minutes=-60)  # Expiração no passado
        token = create_access_token(data, expires_delta=expires_delta)
        
        payload = verify_token(token)
        assert payload is None
    
    def test_verify_password(self):
        """Testar verificação de senha"""
        plain_password = "testpassword123"
        hashed_password = get_password_hash(plain_password)
        
        assert verify_password(plain_password, hashed_password) is True
        assert verify_password("wrongpassword", hashed_password) is False
    
    def test_get_password_hash(self):
        """Testar hash de senha"""
        password = "testpassword123"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert hashed.startswith("$2b$")  # bcrypt hash
    
    @pytest.mark.asyncio
    async def test_get_current_user_valid(self):
        """Testar obtenção de usuário válido"""
        # Mock do usuário
        mock_user = User(
            id="1",
            email="test@example.com",
            name="Test User",
            role="user"
        )
        
        with patch('app.models.user.User.get_by_id', return_value=mock_user):
            # Criar token válido
            data = {"sub": "test@example.com"}
            token = create_access_token(data)
            
            # Mock das credenciais
            credentials = AsyncMock()
            credentials.credentials = token
            
            user = await get_current_user(credentials)
            assert user is not None
            assert user.email == "test@example.com"
    
    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self):
        """Testar obtenção de usuário com token inválido"""
        credentials = AsyncMock()
        credentials.credentials = "invalid_token"
        
        with pytest.raises(Exception):  # Deve lançar exceção
            await get_current_user(credentials)
    
    @pytest.mark.asyncio
    async def test_get_current_user_user_not_found(self):
        """Testar obtenção de usuário que não existe"""
        # Criar token válido
        data = {"sub": "nonexistent@example.com"}
        token = create_access_token(data)
        
        credentials = AsyncMock()
        credentials.credentials = token
        
        with patch('app.models.user.User.get_by_id', return_value=None):
            with pytest.raises(Exception):  # Deve lançar exceção
                await get_current_user(credentials)
    
    def test_sanitize_input_string(self):
        """Testar sanitização de string"""
        input_data = "<script>alert('xss')</script>Hello World"
        sanitized = sanitize_input(input_data)
        assert sanitized == "Hello World"
    
    def test_sanitize_input_dict(self):
        """Testar sanitização de dicionário"""
        input_data = {
            "name": "<script>alert('xss')</script>John",
            "email": "john@example.com"
        }
        sanitized = sanitize_input(input_data)
        assert sanitized["name"] == "John"
        assert sanitized["email"] == "john@example.com"
    
    def test_sanitize_input_list(self):
        """Testar sanitização de lista"""
        input_data = ["<script>alert('xss')</script>Hello", "World"]
        sanitized = sanitize_input(input_data)
        assert sanitized[0] == "Hello"
        assert sanitized[1] == "World"
    
    def test_sanitize_input_non_string(self):
        """Testar sanitização de tipos não-string"""
        input_data = 123
        sanitized = sanitize_input(input_data)
        assert sanitized == 123
    
    def test_validate_file_upload_valid(self):
        """Testar validação de upload de arquivo válido"""
        filename = "document.pdf"
        content_type = "application/pdf"
        
        assert validate_file_upload(filename, content_type) is True
    
    def test_validate_file_upload_invalid_extension(self):
        """Testar validação de upload com extensão inválida"""
        filename = "malicious.exe"
        content_type = "application/octet-stream"
        
        assert validate_file_upload(filename, content_type) is False
    
    def test_validate_file_upload_invalid_content_type(self):
        """Testar validação de upload com content type inválido"""
        filename = "document.pdf"
        content_type = "application/octet-stream"
        
        assert validate_file_upload(filename, content_type) is False
    
    def test_validate_file_upload_size_limit(self):
        """Testar validação de upload com limite de tamanho"""
        filename = "large_file.pdf"
        content_type = "application/pdf"
        
        # Testar com tamanho máximo padrão (10MB)
        assert validate_file_upload(filename, content_type) is True
        
        # Testar com tamanho personalizado
        assert validate_file_upload(filename, content_type, max_size=1024) is True


class TestSecurityMiddleware:
    """Testes para middleware de segurança"""
    
    @pytest.mark.asyncio
    async def test_security_headers(self):
        """Testar se headers de segurança são aplicados"""
        from app.core.security import SecurityMiddleware
        from fastapi import Request, Response
        
        middleware = SecurityMiddleware()
        
        # Mock request e response
        request = MagicMock(spec=Request)
        response = MagicMock(spec=Response)
        response.headers = {}
        
        # Mock call_next
        async def call_next(req):
            return response
        
        # Executar middleware
        result = await middleware.dispatch(request, call_next)
        
        # Verificar se headers foram aplicados
        assert result.headers.get("X-Content-Type-Options") == "nosniff"
        assert result.headers.get("X-Frame-Options") == "DENY"
        assert result.headers.get("X-XSS-Protection") == "1; mode=block"


class TestRateLimiter:
    """Testes para rate limiting"""
    
    @pytest.mark.asyncio
    async def test_rate_limit_check(self):
        """Testar verificação de rate limit"""
        from app.core.security import RateLimiter
        
        rate_limiter = RateLimiter()
        
        # Mock Redis client
        mock_redis = AsyncMock()
        mock_redis.get.return_value = None
        mock_redis.incr.return_value = 1
        mock_redis.expire.return_value = True
        
        with patch.object(rate_limiter, 'redis_client', mock_redis):
            result = await rate_limiter.check_rate_limit("user123", "/api/test")
            assert result is True
    
    @pytest.mark.asyncio
    async def test_rate_limit_exceeded(self):
        """Testar rate limit excedido"""
        from app.core.security import RateLimiter
        
        rate_limiter = RateLimiter()
        
        # Mock Redis client com limite excedido
        mock_redis = AsyncMock()
        mock_redis.get.return_value = "100"  # Limite excedido
        
        with patch.object(rate_limiter, 'redis_client', mock_redis):
            result = await rate_limiter.check_rate_limit("user123", "/api/test")
            assert result is False


class TestAzureADAuth:
    """Testes para integração Azure AD"""
    
    def test_azure_ad_initialization(self):
        """Testar inicialização do Azure AD"""
        from app.core.security import AzureADAuth
        
        auth = AzureADAuth()
        assert auth.tenant_id == settings.AZURE_TENANT_ID
        assert auth.client_id == settings.AZURE_CLIENT_ID
        assert auth.client_secret == settings.AZURE_CLIENT_SECRET
    
    @pytest.mark.asyncio
    async def test_azure_token_validation_with_msal(self):
        """Testar validação de token Azure com MSAL"""
        from app.core.security import AzureADAuth
        
        auth = AzureADAuth()
        
        with patch('app.core.security.msal') as mock_msal:
            mock_app = MagicMock()
            mock_app.acquire_token_silent.return_value = {"access_token": "valid_token"}
            mock_msal.ConfidentialClientApplication.return_value = mock_app
            
            result = await auth.validate_azure_token("test_token")
            assert result is not None
            assert result["access_token"] == "valid_token"
    
    @pytest.mark.asyncio
    async def test_azure_token_validation_without_msal(self):
        """Testar validação de token Azure sem MSAL"""
        from app.core.security import AzureADAuth
        
        auth = AzureADAuth()
        
        with patch('app.core.security.msal', None):
            result = await auth.validate_azure_token("test_token")
            assert result is None 