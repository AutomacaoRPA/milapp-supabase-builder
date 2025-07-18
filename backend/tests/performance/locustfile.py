from locust import HttpUser, task, between
import json

class MILAPPUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login at the start of each user session."""
        login_data = {
            "username": "testuser",
            "password": "testpassword"
        }
        response = self.client.post("/api/v1/auth/login", json=login_data)
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.token = None
            self.headers = {}
    
    @task(3)
    def health_check(self):
        """Test health check endpoint - should be very fast."""
        with self.client.get("/health", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Health check failed: {response.status_code}")
    
    @task(2)
    def get_projects(self):
        """Test getting projects list."""
        with self.client.get("/api/v1/projects/", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get projects failed: {response.status_code}")
    
    @task(1)
    def create_project(self):
        """Test creating a new project."""
        project_data = {
            "name": f"Performance Test Project {self.client.environment.runner.user_count}",
            "description": "Project created during performance testing",
            "status": "active",
            "priority": "medium",
            "deadline": "2024-12-31",
            "team_size": 3,
            "budget": 25000.0
        }
        
        with self.client.post("/api/v1/projects/", json=project_data, headers=self.headers, catch_response=True) as response:
            if response.status_code == 201:
                response.success()
            else:
                response.failure(f"Create project failed: {response.status_code}")
    
    @task(2)
    def get_conversations(self):
        """Test getting conversations."""
        with self.client.get("/api/v1/conversations/", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get conversations failed: {response.status_code}")
    
    @task(1)
    def get_dashboards(self):
        """Test getting dashboards."""
        with self.client.get("/api/v1/dashboards/", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get dashboards failed: {response.status_code}")
    
    @task(1)
    def search_projects(self):
        """Test project search functionality."""
        with self.client.get("/api/v1/projects/search?q=test", headers=self.headers, catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Search projects failed: {response.status_code}")
    
    @task(1)
    def get_metrics(self):
        """Test Prometheus metrics endpoint."""
        with self.client.get("/metrics", catch_response=True) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Get metrics failed: {response.status_code}")

class APILoadTest(HttpUser):
    wait_time = between(0.5, 1.5)
    
    @task(5)
    def rapid_health_checks(self):
        """Rapid health checks to test system stability."""
        self.client.get("/health")
    
    @task(3)
    def rapid_ready_checks(self):
        """Rapid ready checks to test system readiness."""
        self.client.get("/ready")
    
    @task(2)
    def rapid_metrics(self):
        """Rapid metrics requests to test monitoring performance."""
        self.client.get("/metrics")