"""
Testes unitários para os modelos do MILAPP
"""

import pytest
import uuid
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
from sqlalchemy.exc import SQLAlchemyError

from app.models.user import User, UserCreate, UserUpdate, UserResponse
from app.models.project import Project, ProjectCreate, ProjectUpdate


class TestUserModel:
    """Testes para o modelo de usuário"""
    
    def test_user_creation(self):
        """Testar criação de usuário"""
        user_data = {
            'email': 'test@example.com',
            'name': 'Test User',
            'role': 'user',
            'department': 'IT'
        }
        
        user = User(**user_data)
        
        assert user.email == 'test@example.com'
        assert user.name == 'Test User'
        assert user.role == 'user'
        assert user.department == 'IT'
        assert user.is_active is True
        assert user.mfa_enabled is False
    
    def test_user_to_dict(self):
        """Testar conversão para dicionário"""
        user = User(
            id=uuid.uuid4(),
            email='test@example.com',
            name='Test User',
            role='user',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        user_dict = user.to_dict()
        
        assert 'id' in user_dict
        assert 'email' in user_dict
        assert 'name' in user_dict
        assert 'role' in user_dict
        assert 'created_at' in user_dict
        assert 'updated_at' in user_dict
    
    @pytest.mark.asyncio
    async def test_get_by_id_success(self):
        """Testar obtenção de usuário por ID com sucesso"""
        user_id = str(uuid.uuid4())
        
        with patch('app.models.user.AsyncSessionLocal') as mock_session_local:
            mock_session = AsyncMock()
            mock_session_local.return_value.__aenter__.return_value = mock_session
            
            mock_result = Mock()
            mock_result.fetchone.return_value = Mock(
                _mapping={
                    'id': user_id,
                    'email': 'test@example.com',
                    'name': 'Test User',
                    'role': 'user'
                }
            )
            mock_session.execute.return_value = mock_result
            
            user = await User.get_by_id(user_id)
            
            assert user is not None
            assert user.email == 'test@example.com'
            assert user.name == 'Test User'
    
    @pytest.mark.asyncio
    async def test_get_by_id_not_found(self):
        """Testar obtenção de usuário por ID não encontrado"""
        user_id = str(uuid.uuid4())
        
        with patch('app.models.user.AsyncSessionLocal') as mock_session_local:
            mock_session = AsyncMock()
            mock_session_local.return_value.__aenter__.return_value = mock_session
            
            mock_result = Mock()
            mock_result.fetchone.return_value = None
            mock_session.execute.return_value = mock_result
            
            user = await User.get_by_id(user_id)
            
            assert user is None
    
    @pytest.mark.asyncio
    async def test_get_by_email_success(self):
        """Testar obtenção de usuário por email com sucesso"""
        email = 'test@example.com'
        
        with patch('app.models.user.AsyncSessionLocal') as mock_session_local:
            mock_session = AsyncMock()
            mock_session_local.return_value.__aenter__.return_value = mock_session
            
            mock_result = Mock()
            mock_result.fetchone.return_value = Mock(
                _mapping={
                    'id': str(uuid.uuid4()),
                    'email': email,
                    'name': 'Test User',
                    'role': 'user'
                }
            )
            mock_session.execute.return_value = mock_result
            
            user = await User.get_by_email(email)
            
            assert user is not None
            assert user.email == email
    
    @pytest.mark.asyncio
    async def test_create_user_success(self):
        """Testar criação de usuário com sucesso"""
        user_data = {
            'email': 'new@example.com',
            'name': 'New User',
            'role': 'user'
        }
        
        with patch('app.models.user.AsyncSessionLocal') as mock_session_local:
            mock_session = AsyncMock()
            mock_session_local.return_value.__aenter__.return_value = mock_session
            
            user = await User.create_user(user_data)
            
            assert user is not None
            mock_session.add.assert_called_once()
            mock_session.commit.assert_called_once()
            mock_session.refresh.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_update_user_success(self):
        """Testar atualização de usuário com sucesso"""
        user = User(
            id=uuid.uuid4(),
            email='test@example.com',
            name='Test User',
            role='user'
        )
        
        update_data = {
            'name': 'Updated User',
            'department': 'HR'
        }
        
        with patch('app.models.user.AsyncSessionLocal') as mock_session_local:
            mock_session = AsyncMock()
            mock_session_local.return_value.__aenter__.return_value = mock_session
            
            updated_user = await user.update_user(update_data)
            
            assert updated_user.name == 'Updated User'
            assert updated_user.department == 'HR'
            mock_session.commit.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_deactivate_user(self):
        """Testar desativação de usuário"""
        user = User(
            id=uuid.uuid4(),
            email='test@example.com',
            name='Test User',
            role='user',
            is_active=True
        )
        
        with patch.object(user, 'update_user') as mock_update:
            await user.deactivate_user()
            
            mock_update.assert_called_once_with({'is_active': False})
    
    @pytest.mark.asyncio
    async def test_activate_user(self):
        """Testar ativação de usuário"""
        user = User(
            id=uuid.uuid4(),
            email='test@example.com',
            name='Test User',
            role='user',
            is_active=False
        )
        
        with patch.object(user, 'update_user') as mock_update:
            await user.activate_user()
            
            mock_update.assert_called_once_with({'is_active': True})


class TestUserSchemas:
    """Testes para os schemas de usuário"""
    
    def test_user_create_schema(self):
        """Testar schema de criação de usuário"""
        user_data = {
            'email': 'test@example.com',
            'name': 'Test User',
            'role': 'user',
            'department': 'IT'
        }
        
        user_create = UserCreate(**user_data)
        
        assert user_create.email == 'test@example.com'
        assert user_create.name == 'Test User'
        assert user_create.role == 'user'
        assert user_create.department == 'IT'
        assert user_create.is_active is True
    
    def test_user_update_schema(self):
        """Testar schema de atualização de usuário"""
        user_data = {
            'name': 'Updated User',
            'department': 'HR'
        }
        
        user_update = UserUpdate(**user_data)
        
        assert user_update.name == 'Updated User'
        assert user_update.department == 'HR'
        assert user_update.email is None
    
    def test_user_response_schema(self):
        """Testar schema de resposta de usuário"""
        user_data = {
            'id': str(uuid.uuid4()),
            'email': 'test@example.com',
            'name': 'Test User',
            'role': 'user',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        user_response = UserResponse(**user_data)
        
        assert user_response.id == user_data['id']
        assert user_response.email == user_data['email']
        assert user_response.name == user_data['name']
        assert user_response.role == user_data['role']


class TestProjectModel:
    """Testes para o modelo de projeto"""
    
    def test_project_creation(self):
        """Testar criação de projeto"""
        project_data = {
            'name': 'Test Project',
            'description': 'Test Description',
            'status': 'active',
            'priority': 'high'
        }
        
        project = Project(**project_data)
        
        assert project.name == 'Test Project'
        assert project.description == 'Test Description'
        assert project.status == 'active'
        assert project.priority == 'high'
    
    def test_project_status_validation(self):
        """Testar validação de status do projeto"""
        valid_statuses = ['active', 'inactive', 'completed', 'cancelled']
        
        for status in valid_statuses:
            project = Project(
                name='Test Project',
                status=status
            )
            assert project.status == status
    
    def test_project_priority_validation(self):
        """Testar validação de prioridade do projeto"""
        valid_priorities = ['low', 'medium', 'high', 'critical']
        
        for priority in valid_priorities:
            project = Project(
                name='Test Project',
                priority=priority
            )
            assert project.priority == priority


class TestProjectSchemas:
    """Testes para os schemas de projeto"""
    
    def test_project_create_schema(self):
        """Testar schema de criação de projeto"""
        project_data = {
            'name': 'New Project',
            'description': 'New Description',
            'status': 'active',
            'priority': 'medium'
        }
        
        project_create = ProjectCreate(**project_data)
        
        assert project_create.name == 'New Project'
        assert project_create.description == 'New Description'
        assert project_create.status == 'active'
        assert project_create.priority == 'medium'
    
    def test_project_update_schema(self):
        """Testar schema de atualização de projeto"""
        project_data = {
            'name': 'Updated Project',
            'status': 'completed'
        }
        
        project_update = ProjectUpdate(**project_data)
        
        assert project_update.name == 'Updated Project'
        assert project_update.status == 'completed'
        assert project_update.description is None


class TestModelValidation:
    """Testes para validação de modelos"""
    
    def test_user_email_validation(self):
        """Testar validação de email de usuário"""
        # Email válido
        user_data = {
            'email': 'valid@example.com',
            'name': 'Test User',
            'role': 'user'
        }
        user = User(**user_data)
        assert user.email == 'valid@example.com'
    
    def test_user_role_validation(self):
        """Testar validação de role de usuário"""
        valid_roles = ['user', 'admin', 'manager', 'viewer']
        
        for role in valid_roles:
            user_data = {
                'email': 'test@example.com',
                'name': 'Test User',
                'role': role
            }
            user = User(**user_data)
            assert user.role == role
    
    def test_project_dates_validation(self):
        """Testar validação de datas do projeto"""
        start_date = datetime.utcnow()
        end_date = start_date + timedelta(days=30)
        
        project = Project(
            name='Test Project',
            start_date=start_date,
            end_date=end_date
        )
        
        assert project.start_date == start_date
        assert project.end_date == end_date


class TestModelRelationships:
    """Testes para relacionamentos entre modelos"""
    
    def test_user_project_relationship(self):
        """Testar relacionamento usuário-projeto"""
        user = User(
            id=uuid.uuid4(),
            email='test@example.com',
            name='Test User',
            role='user'
        )
        
        project = Project(
            id=uuid.uuid4(),
            name='Test Project',
            created_by=user.id
        )
        
        assert project.created_by == user.id
    
    def test_project_stakeholders_relationship(self):
        """Testar relacionamento projeto-stakeholders"""
        project = Project(
            id=uuid.uuid4(),
            name='Test Project'
        )
        
        stakeholder_ids = [str(uuid.uuid4()), str(uuid.uuid4())]
        project.stakeholder_ids = stakeholder_ids
        
        assert len(project.stakeholder_ids) == 2
        assert all(sid in stakeholder_ids for sid in project.stakeholder_ids)


class TestModelSerialization:
    """Testes para serialização de modelos"""
    
    def test_user_json_serialization(self):
        """Testar serialização JSON de usuário"""
        user = User(
            id=uuid.uuid4(),
            email='test@example.com',
            name='Test User',
            role='user',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        user_dict = user.to_dict()
        
        # Verificar se todos os campos estão presentes
        required_fields = ['id', 'email', 'name', 'role', 'created_at', 'updated_at']
        for field in required_fields:
            assert field in user_dict
        
        # Verificar tipos de dados
        assert isinstance(user_dict['id'], str)
        assert isinstance(user_dict['email'], str)
        assert isinstance(user_dict['name'], str)
        assert isinstance(user_dict['role'], str)
        assert isinstance(user_dict['created_at'], str)
        assert isinstance(user_dict['updated_at'], str)
    
    def test_project_json_serialization(self):
        """Testar serialização JSON de projeto"""
        project = Project(
            id=uuid.uuid4(),
            name='Test Project',
            description='Test Description',
            status='active',
            priority='high',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        project_dict = project.to_dict()
        
        # Verificar se todos os campos estão presentes
        required_fields = ['id', 'name', 'description', 'status', 'priority', 'created_at', 'updated_at']
        for field in required_fields:
            assert field in project_dict
        
        # Verificar tipos de dados
        assert isinstance(project_dict['id'], str)
        assert isinstance(project_dict['name'], str)
        assert isinstance(project_dict['description'], str)
        assert isinstance(project_dict['status'], str)
        assert isinstance(project_dict['priority'], str) 