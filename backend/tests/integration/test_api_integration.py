"""
Testes de integração para a API MILAPP
"""

import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock

from app.main import app
from app.core.database import get_db
from app.models.user import User


class TestAPIIntegration:
    """Testes de integração para endpoints da API"""
    
    @pytest.mark.asyncio
    async def test_health_check(self):
        """Testar health check da API"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get("/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] in ["healthy", "unhealthy"]
            assert "checks" in data
            assert "timestamp" in data
            assert "version" in data
    
    @pytest.mark.asyncio
    async def test_ready_check(self):
        """Testar ready check para Kubernetes"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get("/ready")
            # Pode retornar 200 (ready) ou 503 (not ready) dependendo do estado dos serviços
            assert response.status_code in [200, 503]
            data = response.json()
            assert "status" in data
    
    @pytest.mark.asyncio
    async def test_metrics_endpoint(self):
        """Testar endpoint de métricas"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get("/metrics")
            assert response.status_code == 200
            assert "http_requests_total" in response.text
            assert "http_request_duration_seconds" in response.text
    
    @pytest.mark.asyncio
    async def test_root_endpoint(self):
        """Testar endpoint raiz"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get("/")
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "MILAPP - Centro de Excelência em Automação RPA"
            assert data["version"] == "2.0.0"
            assert "docs" in data
            assert "health" in data
            assert "metrics" in data
    
    @pytest.mark.asyncio
    async def test_docs_endpoint(self):
        """Testar endpoint de documentação"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get("/docs")
            assert response.status_code == 200
            assert "text/html" in response.headers.get("content-type", "")
    
    @pytest.mark.asyncio
    async def test_redoc_endpoint(self):
        """Testar endpoint de documentação ReDoc"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get("/redoc")
            assert response.status_code == 200
            assert "text/html" in response.headers.get("content-type", "")


class TestAuthEndpoints:
    """Testes para endpoints de autenticação"""
    
    @pytest.mark.asyncio
    async def test_login_endpoint(self):
        """Testar endpoint de login"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            login_data = {
                "email": "test@example.com",
                "password": "testpassword"
            }
            response = await ac.post("/api/v1/auth/login", json=login_data)
            # Pode retornar 200 (sucesso) ou 401 (credenciais inválidas)
            assert response.status_code in [200, 401]
    
    @pytest.mark.asyncio
    async def test_register_endpoint(self):
        """Testar endpoint de registro"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            register_data = {
                "email": "newuser@example.com",
                "password": "newpassword123",
                "name": "New User"
            }
            response = await ac.post("/api/v1/auth/register", json=register_data)
            # Pode retornar 200 (sucesso) ou 400 (email já existe)
            assert response.status_code in [200, 400]
    
    @pytest.mark.asyncio
    async def test_me_endpoint_without_auth(self):
        """Testar endpoint /me sem autenticação"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get("/api/v1/auth/me")
            assert response.status_code == 401  # Não autorizado


class TestProjectEndpoints:
    """Testes para endpoints de projetos"""
    
    @pytest.mark.asyncio
    async def test_projects_endpoint_without_auth(self):
        """Testar endpoint de projetos sem autenticação"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get("/api/v1/projects/")
            assert response.status_code == 401  # Não autorizado
    
    @pytest.mark.asyncio
    async def test_projects_endpoint_with_auth(self):
        """Testar endpoint de projetos com autenticação"""
        # Mock de autenticação
        with patch('app.core.security.get_current_user') as mock_auth:
            mock_user = User(
                id="1",
                email="test@example.com",
                name="Test User",
                role="user"
            )
            mock_auth.return_value = mock_user
            
            async with AsyncClient(app=app, base_url="http://test") as ac:
                response = await ac.get("/api/v1/projects/")
                assert response.status_code in [200, 404]  # 200 se houver projetos, 404 se não houver


class TestSecurityHeaders:
    """Testes para headers de segurança"""
    
    @pytest.mark.asyncio
    async def test_security_headers_present(self):
        """Testar se headers de segurança estão presentes"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get("/")
            
            # Verificar headers de segurança
            assert response.headers.get("X-Content-Type-Options") == "nosniff"
            assert response.headers.get("X-Frame-Options") == "DENY"
            assert response.headers.get("X-XSS-Protection") == "1; mode=block"
            assert "Strict-Transport-Security" in response.headers
            assert "Content-Security-Policy" in response.headers
            assert response.headers.get("Referrer-Policy") == "no-referrer-when-downgrade"


class TestErrorHandling:
    """Testes para tratamento de erros"""
    
    @pytest.mark.asyncio
    async def test_404_error(self):
        """Testar erro 404 para endpoint inexistente"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get("/nonexistent-endpoint")
            assert response.status_code == 404
    
    @pytest.mark.asyncio
    async def test_method_not_allowed(self):
        """Testar erro 405 para método não permitido"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.post("/")  # POST não é permitido no endpoint raiz
            assert response.status_code == 405
    
    @pytest.mark.asyncio
    async def test_validation_error(self):
        """Testar erro de validação"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            # Enviar dados inválidos para login
            invalid_data = {
                "email": "invalid-email",  # Email inválido
                "password": ""  # Senha vazia
            }
            response = await ac.post("/api/v1/auth/login", json=invalid_data)
            assert response.status_code in [400, 422]  # Bad Request ou Unprocessable Entity


class TestCORS:
    """Testes para configuração CORS"""
    
    @pytest.mark.asyncio
    async def test_cors_headers(self):
        """Testar headers CORS"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.options("/", headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Content-Type"
            })
            
            # Verificar se CORS está configurado
            assert "access-control-allow-origin" in response.headers
            assert "access-control-allow-methods" in response.headers


class TestRateLimiting:
    """Testes para rate limiting"""
    
    @pytest.mark.asyncio
    async def test_rate_limiting(self):
        """Testar rate limiting"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            # Fazer múltiplas requisições rapidamente
            responses = []
            for _ in range(10):
                response = await ac.get("/health")
                responses.append(response.status_code)
            
            # Verificar se todas as requisições foram processadas
            # (rate limiting pode não estar ativo em ambiente de teste)
            assert all(status in [200, 429] for status in responses)


class TestDatabaseIntegration:
    """Testes de integração com banco de dados"""
    
    @pytest.mark.asyncio
    async def test_database_connection_in_health_check(self):
        """Testar se health check verifica conexão com banco"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get("/health")
            assert response.status_code in [200, 503]
            data = response.json()
            
            # Verificar se informações do banco estão presentes
            assert "checks" in data
            if "database" in data["checks"]:
                assert data["checks"]["database"] in ["healthy", "unhealthy"]


class TestMonitoringIntegration:
    """Testes de integração com monitoramento"""
    
    @pytest.mark.asyncio
    async def test_metrics_format(self):
        """Testar formato das métricas Prometheus"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get("/metrics")
            assert response.status_code == 200
            
            # Verificar se métricas estão no formato correto
            metrics_text = response.text
            assert "# HELP" in metrics_text
            assert "# TYPE" in metrics_text
            assert "http_requests_total" in metrics_text
            assert "http_request_duration_seconds" in metrics_text


class TestServiceHealth:
    """Testes para saúde dos serviços"""
    
    @pytest.mark.asyncio
    async def test_ai_service_health(self):
        """Testar saúde do serviço de IA"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get("/health")
            data = response.json()
            
            if "ai_service" in data.get("checks", {}):
                assert data["checks"]["ai_service"] in ["healthy", "unhealthy"]
    
    @pytest.mark.asyncio
    async def test_notification_service_health(self):
        """Testar saúde do serviço de notificações"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            response = await ac.get("/health")
            data = response.json()
            
            if "notification_service" in data.get("checks", {}):
                assert data["checks"]["notification_service"] in ["healthy", "unhealthy"] 