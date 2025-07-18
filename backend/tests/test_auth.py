import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

class TestAuthAPI:
    """Test suite for authentication API endpoints."""
    
    def test_login_success(self, client: TestClient):
        """Test successful login."""
        login_data = {
            "username": "testuser",
            "password": "testpassword"
        }
        response = client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "token_type" in data
        assert data["token_type"] == "bearer"
    
    def test_login_invalid_credentials(self, client: TestClient):
        """Test login with invalid credentials."""
        login_data = {
            "username": "invaliduser",
            "password": "wrongpassword"
        }
        response = client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 401
    
    def test_login_missing_fields(self, client: TestClient):
        """Test login with missing required fields."""
        login_data = {"username": "testuser"}  # Missing password
        response = client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 422
    
    def test_register_success(self, client: TestClient):
        """Test successful user registration."""
        register_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "newpassword123",
            "full_name": "New User"
        }
        response = client.post("/api/v1/auth/register", json=register_data)
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["username"] == register_data["username"]
        assert data["email"] == register_data["email"]
    
    def test_register_duplicate_username(self, client: TestClient):
        """Test registration with duplicate username."""
        register_data = {
            "username": "existinguser",
            "email": "existinguser@example.com",
            "password": "password123",
            "full_name": "Existing User"
        }
        
        # First registration
        client.post("/api/v1/auth/register", json=register_data)
        
        # Second registration with same username
        response = client.post("/api/v1/auth/register", json=register_data)
        assert response.status_code == 400
    
    def test_register_invalid_email(self, client: TestClient):
        """Test registration with invalid email format."""
        register_data = {
            "username": "testuser",
            "email": "invalid-email",
            "password": "password123",
            "full_name": "Test User"
        }
        response = client.post("/api/v1/auth/register", json=register_data)
        assert response.status_code == 422
    
    def test_register_weak_password(self, client: TestClient):
        """Test registration with weak password."""
        register_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "123",  # Too short
            "full_name": "Test User"
        }
        response = client.post("/api/v1/auth/register", json=register_data)
        assert response.status_code == 422
    
    def test_refresh_token(self, client: TestClient):
        """Test token refresh functionality."""
        # First login to get a token
        login_data = {
            "username": "testuser",
            "password": "testpassword"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        refresh_token = login_response.json().get("refresh_token")
        
        # Refresh the token
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
    
    def test_logout(self, client: TestClient):
        """Test logout functionality."""
        # First login to get a token
        login_data = {
            "username": "testuser",
            "password": "testpassword"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        access_token = login_response.json().get("access_token")
        
        # Logout
        headers = {"Authorization": f"Bearer {access_token}"}
        response = client.post("/api/v1/auth/logout", headers=headers)
        assert response.status_code == 200
    
    def test_me_endpoint(self, client: TestClient):
        """Test getting current user information."""
        # First login to get a token
        login_data = {
            "username": "testuser",
            "password": "testpassword"
        }
        login_response = client.post("/api/v1/auth/login", json=login_data)
        access_token = login_response.json().get("access_token")
        
        # Get current user info
        headers = {"Authorization": f"Bearer {access_token}"}
        response = client.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "username" in data
        assert "email" in data
    
    def test_me_endpoint_unauthorized(self, client: TestClient):
        """Test getting current user without authentication."""
        response = client.get("/api/v1/auth/me")
        assert response.status_code == 401
    
    def test_password_reset_request(self, client: TestClient):
        """Test password reset request."""
        reset_data = {"email": "testuser@example.com"}
        response = client.post("/api/v1/auth/password-reset", json=reset_data)
        assert response.status_code == 200
    
    def test_password_reset_invalid_email(self, client: TestClient):
        """Test password reset with invalid email."""
        reset_data = {"email": "nonexistent@example.com"}
        response = client.post("/api/v1/auth/password-reset", json=reset_data)
        assert response.status_code == 404