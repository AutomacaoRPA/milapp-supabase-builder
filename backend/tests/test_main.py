import pytest
from fastapi.testclient import TestClient
from app.main import app

class TestMainApp:
    """Test suite for main application endpoints."""
    
    def test_health_check(self, client: TestClient):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["version"] == "2.0.0"
        assert data["service"] == "MILAPP Backend"
    
    def test_ready_check(self, client: TestClient):
        """Test ready check endpoint."""
        response = client.get("/ready")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ready"
    
    def test_metrics_endpoint(self, client: TestClient):
        """Test Prometheus metrics endpoint."""
        response = client.get("/metrics")
        assert response.status_code == 200
        assert "http_requests_total" in response.text
        assert "http_request_duration_seconds" in response.text
    
    def test_docs_endpoint(self, client: TestClient):
        """Test API documentation endpoint."""
        response = client.get("/docs")
        assert response.status_code == 200
    
    def test_redoc_endpoint(self, client: TestClient):
        """Test ReDoc documentation endpoint."""
        response = client.get("/redoc")
        assert response.status_code == 200
    
    def test_cors_headers(self, client: TestClient):
        """Test CORS headers are properly set."""
        response = client.options("/health")
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
    
    def test_404_handler(self, client: TestClient):
        """Test 404 error handling."""
        response = client.get("/nonexistent")
        assert response.status_code == 404
    
    def test_request_metrics(self, client: TestClient):
        """Test that request metrics are being recorded."""
        # Make a request
        client.get("/health")
        
        # Check metrics endpoint
        response = client.get("/metrics")
        assert response.status_code == 200
        metrics_text = response.text
        
        # Should contain our request
        assert "http_requests_total" in metrics_text