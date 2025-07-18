"""
Testes unitários para o serviço de projetos
"""

import pytest
from unittest.mock import AsyncMock, MagicMock
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.services.project_service import ProjectService
from app.models.project import Project


class TestProjectService:
    """Testes para ProjectService"""
    
    @pytest.fixture
    def mock_db(self):
        """Mock do banco de dados"""
        return AsyncMock(spec=AsyncSession)
    
    @pytest.fixture
    def sample_project_data(self):
        """Dados de exemplo de projeto"""
        return {
            "name": "Test Project",
            "description": "Test project description",
            "status": "planning",
            "type": "rpa",
            "priority": "high",
            "estimated_effort": 40,
            "roi_target": 50000.0
        }
    
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
        project.estimated_effort = 40
        project.roi_target = 50000.0
        project.created_by = "test-user-id"
        project.created_at = datetime.utcnow()
        return project
    
    @pytest.mark.asyncio
    async def test_create_project_success(self, mock_db, sample_project_data):
        """Testar criação de projeto com sucesso"""
        # Mock do commit e refresh
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        
        # Testar criação
        result = await ProjectService.create_project(
            mock_db, "test-user-id", sample_project_data
        )
        
        assert result is not None
        assert result.name == sample_project_data["name"]
        assert result.description == sample_project_data["description"]
        assert result.status == sample_project_data["status"]
        assert result.created_by == "test-user-id"
        
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()
        mock_db.refresh.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_create_project_database_error(self, mock_db, sample_project_data):
        """Testar criação de projeto com erro de banco"""
        # Mock do commit para lançar exceção
        mock_db.commit.side_effect = Exception("Database error")
        mock_db.rollback = AsyncMock()
        
        # Testar criação
        with pytest.raises(Exception):
            await ProjectService.create_project(
                mock_db, "test-user-id", sample_project_data
            )
        
        mock_db.rollback.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_projects_no_filters(self, mock_db, sample_project):
        """Testar listagem de projetos sem filtros"""
        # Mock das queries
        mock_count_result = MagicMock()
        mock_count_result.scalar.return_value = 1
        
        mock_projects_result = MagicMock()
        mock_projects_result.scalars.return_value.all.return_value = [sample_project]
        
        mock_db.execute.side_effect = [mock_count_result, mock_projects_result]
        
        # Testar listagem
        projects, total = await ProjectService.get_projects(
            mock_db, "test-user-id", page=1, size=20
        )
        
        assert len(projects) == 1
        assert total == 1
        assert projects[0].name == "Test Project"
    
    @pytest.mark.asyncio
    async def test_get_projects_with_status_filter(self, mock_db, sample_project):
        """Testar listagem de projetos com filtro de status"""
        # Mock das queries
        mock_count_result = MagicMock()
        mock_count_result.scalar.return_value = 1
        
        mock_projects_result = MagicMock()
        mock_projects_result.scalars.return_value.all.return_value = [sample_project]
        
        mock_db.execute.side_effect = [mock_count_result, mock_projects_result]
        
        # Testar listagem com filtro
        projects, total = await ProjectService.get_projects(
            mock_db, "test-user-id", page=1, size=20, status="planning"
        )
        
        assert len(projects) == 1
        assert total == 1
    
    @pytest.mark.asyncio
    async def test_get_projects_with_search(self, mock_db, sample_project):
        """Testar listagem de projetos com busca"""
        # Mock das queries
        mock_count_result = MagicMock()
        mock_count_result.scalar.return_value = 1
        
        mock_projects_result = MagicMock()
        mock_projects_result.scalars.return_value.all.return_value = [sample_project]
        
        mock_db.execute.side_effect = [mock_count_result, mock_projects_result]
        
        # Testar listagem com busca
        projects, total = await ProjectService.get_projects(
            mock_db, "test-user-id", page=1, size=20, search="Test"
        )
        
        assert len(projects) == 1
        assert total == 1
    
    @pytest.mark.asyncio
    async def test_get_projects_empty_result(self, mock_db):
        """Testar listagem de projetos com resultado vazio"""
        # Mock das queries
        mock_count_result = MagicMock()
        mock_count_result.scalar.return_value = 0
        
        mock_projects_result = MagicMock()
        mock_projects_result.scalars.return_value.all.return_value = []
        
        mock_db.execute.side_effect = [mock_count_result, mock_projects_result]
        
        # Testar listagem
        projects, total = await ProjectService.get_projects(
            mock_db, "test-user-id", page=1, size=20
        )
        
        assert len(projects) == 0
        assert total == 0
    
    @pytest.mark.asyncio
    async def test_get_project_by_id_found(self, mock_db, sample_project):
        """Testar busca de projeto por ID - encontrado"""
        # Mock da query
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_project
        mock_db.execute.return_value = mock_result
        
        # Testar busca
        result = await ProjectService.get_project_by_id(
            mock_db, "test-project-id", "test-user-id"
        )
        
        assert result is not None
        assert result.id == "test-project-id"
        assert result.name == "Test Project"
    
    @pytest.mark.asyncio
    async def test_get_project_by_id_not_found(self, mock_db):
        """Testar busca de projeto por ID - não encontrado"""
        # Mock da query retornando None
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        # Testar busca
        result = await ProjectService.get_project_by_id(
            mock_db, "non-existent-id", "test-user-id"
        )
        
        assert result is None
    
    @pytest.mark.asyncio
    async def test_update_project_success(self, mock_db, sample_project):
        """Testar atualização de projeto com sucesso"""
        # Mock da query
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_project
        mock_db.execute.return_value = mock_result
        
        # Mock do commit
        mock_db.commit = AsyncMock()
        
        # Dados de atualização
        update_data = {
            "name": "Updated Project",
            "status": "development",
            "description": "Updated description"
        }
        
        # Testar atualização
        result = await ProjectService.update_project(
            mock_db, "test-project-id", "test-user-id", update_data
        )
        
        assert result is not None
        assert result.name == "Updated Project"
        assert result.status == "development"
        mock_db.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_update_project_not_found(self, mock_db):
        """Testar atualização de projeto não encontrado"""
        # Mock da query retornando None
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        # Dados de atualização
        update_data = {"name": "Updated Project"}
        
        # Testar atualização
        result = await ProjectService.update_project(
            mock_db, "non-existent-id", "test-user-id", update_data
        )
        
        assert result is None
        mock_db.commit.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_delete_project_success(self, mock_db, sample_project):
        """Testar exclusão de projeto com sucesso"""
        # Mock da query
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_project
        mock_db.execute.return_value = mock_result
        
        # Mock do commit
        mock_db.commit = AsyncMock()
        
        # Testar exclusão
        result = await ProjectService.delete_project(
            mock_db, "test-project-id", "test-user-id"
        )
        
        assert result is True
        mock_db.delete.assert_called_once()
        mock_db.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_delete_project_not_found(self, mock_db):
        """Testar exclusão de projeto não encontrado"""
        # Mock da query retornando None
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute.return_value = mock_result
        
        # Testar exclusão
        result = await ProjectService.delete_project(
            mock_db, "non-existent-id", "test-user-id"
        )
        
        assert result is False
        mock_db.delete.assert_not_called()
        mock_db.commit.assert_not_called()
    
    @pytest.mark.asyncio
    async def test_get_project_metrics(self, mock_db, sample_project):
        """Testar obtenção de métricas de projeto"""
        # Mock das queries
        mock_count_result = MagicMock()
        mock_count_result.scalar.return_value = 1
        
        mock_projects_result = MagicMock()
        mock_projects_result.scalars.return_value.all.return_value = [sample_project]
        
        mock_db.execute.side_effect = [mock_count_result, mock_projects_result]
        
        # Testar métricas
        metrics = await ProjectService.get_project_metrics(
            mock_db, "test-user-id"
        )
        
        assert metrics is not None
        assert "total_projects" in metrics
        assert "active_projects" in metrics
        assert "completion_rate" in metrics
        assert metrics["total_projects"] == 1 