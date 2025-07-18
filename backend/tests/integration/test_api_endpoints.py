"""
Testes de integração para endpoints da API
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from datetime import datetime

from app.main import app
from app.models.user import User
from app.models.project import Project


class TestAPIEndpoints:
    """Testes de integração para endpoints da API"""
    
    @pytest.fixture
    def client(self):
        """Cliente de teste"""
        return TestClient(app)
    
    @pytest.fixture
    def sample_user(self):
        """Usuário de exemplo"""
        user = User()
        user.id = "test-user-id"
        user.email = "test@example.com"
        user.name = "Test User"
        user.role = "user"
        user.is_active = True
        return user
    
    @pytest.fixture
    def sample_project(self):
        """Projeto de exemplo"""
        project = Project()
        project.id = "test-project-id"
        project.name = "Test Project"
        project.description = "Test project description"
        project.status = "planning"
        project.type = "rpa"
        project.priority = "high"
        project.created_by = "test-user-id"
        project.created_at = datetime.utcnow()
        return project
    
    @pytest.fixture
    def auth_headers(self):
        """Headers de autenticação"""
        return {"Authorization": "Bearer test-token"}
    
    def test_health_check(self, client):
        """Testar endpoint de health check"""
        response = client.get("/health")
        
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    
    def test_metrics_endpoint(self, client):
        """Testar endpoint de métricas"""
        response = client.get("/metrics")
        
        assert response.status_code == 200
        # Verificar se retorna métricas Prometheus
        assert "http_requests_total" in response.text
    
    @patch('app.core.security.get_current_user')
    def test_get_projects_authenticated(self, mock_get_current_user, client, sample_user, auth_headers):
        """Testar listagem de projetos autenticado"""
        mock_get_current_user.return_value = sample_user
        
        with patch('app.services.project_service.ProjectService.get_projects') as mock_get_projects:
            mock_get_projects.return_value = ([], 0)
            
            response = client.get("/api/v1/projects/", headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert "projects" in data
            assert "total" in data
    
    def test_get_projects_unauthenticated(self, client):
        """Testar listagem de projetos sem autenticação"""
        response = client.get("/api/v1/projects/")
        
        assert response.status_code == 401
    
    @patch('app.core.security.get_current_user')
    def test_create_project_authenticated(self, mock_get_current_user, client, sample_user, auth_headers):
        """Testar criação de projeto autenticado"""
        mock_get_current_user.return_value = sample_user
        
        project_data = {
            "name": "New Project",
            "description": "New project description",
            "status": "planning",
            "type": "rpa",
            "priority": "high"
        }
        
        with patch('app.services.project_service.ProjectService.create_project') as mock_create_project:
            mock_create_project.return_value = Project()
            
            response = client.post(
                "/api/v1/projects/",
                json=project_data,
                headers=auth_headers
            )
            
            assert response.status_code == 201
    
    @patch('app.core.security.get_current_user')
    def test_create_project_invalid_data(self, mock_get_current_user, client, sample_user, auth_headers):
        """Testar criação de projeto com dados inválidos"""
        mock_get_current_user.return_value = sample_user
        
        # Dados inválidos - sem nome
        project_data = {
            "description": "Project without name"
        }
        
        response = client.post(
            "/api/v1/projects/",
            json=project_data,
            headers=auth_headers
        )
        
        assert response.status_code == 422
    
    @patch('app.core.security.get_current_user')
    def test_get_project_by_id_found(self, mock_get_current_user, client, sample_user, sample_project, auth_headers):
        """Testar busca de projeto por ID - encontrado"""
        mock_get_current_user.return_value = sample_user
        
        with patch('app.services.project_service.ProjectService.get_project_by_id') as mock_get_project:
            mock_get_project.return_value = sample_project
            
            response = client.get(
                f"/api/v1/projects/{sample_project.id}",
                headers=auth_headers
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["name"] == sample_project.name
    
    @patch('app.core.security.get_current_user')
    def test_get_project_by_id_not_found(self, mock_get_current_user, client, sample_user, auth_headers):
        """Testar busca de projeto por ID - não encontrado"""
        mock_get_current_user.return_value = sample_user
        
        with patch('app.services.project_service.ProjectService.get_project_by_id') as mock_get_project:
            mock_get_project.return_value = None
            
            response = client.get(
                "/api/v1/projects/non-existent-id",
                headers=auth_headers
            )
            
            assert response.status_code == 404
    
    @patch('app.core.security.get_current_user')
    def test_update_project_success(self, mock_get_current_user, client, sample_user, sample_project, auth_headers):
        """Testar atualização de projeto com sucesso"""
        mock_get_current_user.return_value = sample_user
        
        update_data = {
            "name": "Updated Project",
            "status": "development"
        }
        
        with patch('app.services.project_service.ProjectService.update_project') as mock_update_project:
            mock_update_project.return_value = sample_project
            
            response = client.put(
                f"/api/v1/projects/{sample_project.id}",
                json=update_data,
                headers=auth_headers
            )
            
            assert response.status_code == 200
    
    @patch('app.core.security.get_current_user')
    def test_delete_project_success(self, mock_get_current_user, client, sample_user, sample_project, auth_headers):
        """Testar exclusão de projeto com sucesso"""
        mock_get_current_user.return_value = sample_user
        
        with patch('app.services.project_service.ProjectService.delete_project') as mock_delete_project:
            mock_delete_project.return_value = True
            
            response = client.delete(
                f"/api/v1/projects/{sample_project.id}",
                headers=auth_headers
            )
            
            assert response.status_code == 204
    
    @patch('app.core.security.get_current_user')
    def test_get_dashboard_authenticated(self, mock_get_current_user, client, sample_user, auth_headers):
        """Testar dashboard autenticado"""
        mock_get_current_user.return_value = sample_user
        
        with patch('app.services.analytics_service.AnalyticsService.get_executive_dashboard') as mock_dashboard:
            mock_dashboard.return_value = {
                "widgets": [
                    {
                        "id": "kpis",
                        "type": "metrics",
                        "title": "KPIs Principais",
                        "data": {"total_projects": 10}
                    }
                ]
            }
            
            response = client.get("/api/v1/dashboards/executive", headers=auth_headers)
            
            assert response.status_code == 200
            data = response.json()
            assert "widgets" in data
    
    def test_get_dashboard_unauthenticated(self, client):
        """Testar dashboard sem autenticação"""
        response = client.get("/api/v1/dashboards/executive")
        
        assert response.status_code == 401
    
    @patch('app.core.security.get_current_user')
    def test_get_quality_gates_authenticated(self, mock_get_current_user, client, sample_user, auth_headers):
        """Testar listagem de quality gates autenticado"""
        mock_get_current_user.return_value = sample_user
        
        response = client.get("/api/v1/quality-gates/", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "quality_gates" in data
    
    @patch('app.core.security.get_current_user')
    def test_get_documents_authenticated(self, mock_get_current_user, client, sample_user, auth_headers):
        """Testar listagem de documentos autenticado"""
        mock_get_current_user.return_value = sample_user
        
        response = client.get("/api/v1/documents/", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "documents" in data
    
    @patch('app.core.security.get_current_user')
    def test_get_deployments_authenticated(self, mock_get_current_user, client, sample_user, auth_headers):
        """Testar listagem de deployments autenticado"""
        mock_get_current_user.return_value = sample_user
        
        response = client.get("/api/v1/deployments/", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "deployments" in data
    
    def test_cors_headers(self, client):
        """Testar headers CORS"""
        response = client.options("/api/v1/projects/")
        
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
    
    def test_security_headers(self, client):
        """Testar headers de segurança"""
        response = client.get("/health")
        
        # Verificar headers de segurança
        assert "x-content-type-options" in response.headers
        assert "x-frame-options" in response.headers
        assert "x-xss-protection" in response.headers
    
    @patch('app.core.security.get_current_user')
    def test_rate_limiting(self, mock_get_current_user, client, sample_user, auth_headers):
        """Testar rate limiting"""
        mock_get_current_user.return_value = sample_user
        
        # Fazer múltiplas requisições para testar rate limiting
        responses = []
        for _ in range(65):  # Mais que o limite por minuto
            response = client.get("/api/v1/projects/", headers=auth_headers)
            responses.append(response.status_code)
        
        # Pelo menos uma deve retornar 429 (Too Many Requests)
        assert 429 in responses
    
    def test_invalid_endpoint(self, client):
        """Testar endpoint inválido"""
        response = client.get("/api/v1/invalid-endpoint")
        
        assert response.status_code == 404
    
    def test_method_not_allowed(self, client):
        """Testar método não permitido"""
        response = client.post("/health")
        
        assert response.status_code == 405 