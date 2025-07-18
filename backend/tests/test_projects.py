import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

class TestProjectsAPI:
    """Test suite for projects API endpoints."""
    
    def test_create_project(self, client: TestClient, auth_headers: dict, sample_project_data: dict):
        """Test creating a new project."""
        response = client.post(
            "/api/v1/projects/",
            json=sample_project_data,
            headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == sample_project_data["name"]
        assert data["description"] == sample_project_data["description"]
        assert "id" in data
    
    def test_create_project_unauthorized(self, client: TestClient, sample_project_data: dict):
        """Test creating project without authentication."""
        response = client.post("/api/v1/projects/", json=sample_project_data)
        assert response.status_code == 401
    
    def test_get_projects(self, client: TestClient, auth_headers: dict):
        """Test getting all projects."""
        response = client.get("/api/v1/projects/", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_project_by_id(self, client: TestClient, auth_headers: dict, sample_project_data: dict):
        """Test getting a specific project by ID."""
        # First create a project
        create_response = client.post(
            "/api/v1/projects/",
            json=sample_project_data,
            headers=auth_headers
        )
        project_id = create_response.json()["id"]
        
        # Then get it by ID
        response = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == project_id
        assert data["name"] == sample_project_data["name"]
    
    def test_get_nonexistent_project(self, client: TestClient, auth_headers: dict):
        """Test getting a project that doesn't exist."""
        response = client.get("/api/v1/projects/999999", headers=auth_headers)
        assert response.status_code == 404
    
    def test_update_project(self, client: TestClient, auth_headers: dict, sample_project_data: dict):
        """Test updating a project."""
        # First create a project
        create_response = client.post(
            "/api/v1/projects/",
            json=sample_project_data,
            headers=auth_headers
        )
        project_id = create_response.json()["id"]
        
        # Update data
        update_data = {"name": "Updated Project Name", "status": "completed"}
        response = client.put(
            f"/api/v1/projects/{project_id}",
            json=update_data,
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Project Name"
        assert data["status"] == "completed"
    
    def test_delete_project(self, client: TestClient, auth_headers: dict, sample_project_data: dict):
        """Test deleting a project."""
        # First create a project
        create_response = client.post(
            "/api/v1/projects/",
            json=sample_project_data,
            headers=auth_headers
        )
        project_id = create_response.json()["id"]
        
        # Delete it
        response = client.delete(f"/api/v1/projects/{project_id}", headers=auth_headers)
        assert response.status_code == 204
        
        # Verify it's deleted
        get_response = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
        assert get_response.status_code == 404
    
    def test_project_validation(self, client: TestClient, auth_headers: dict):
        """Test project data validation."""
        invalid_data = {
            "name": "",  # Empty name should fail
            "description": "Test description"
        }
        response = client.post(
            "/api/v1/projects/",
            json=invalid_data,
            headers=auth_headers
        )
        assert response.status_code == 422
    
    def test_project_search(self, client: TestClient, auth_headers: dict, sample_project_data: dict):
        """Test project search functionality."""
        # Create a project first
        client.post(
            "/api/v1/projects/",
            json=sample_project_data,
            headers=auth_headers
        )
        
        # Search for it
        response = client.get(
            "/api/v1/projects/search?q=Test",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
    
    def test_project_filters(self, client: TestClient, auth_headers: dict):
        """Test project filtering."""
        response = client.get(
            "/api/v1/projects/?status=active&priority=high",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)