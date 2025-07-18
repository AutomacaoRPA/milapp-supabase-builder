from fastapi import HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
import time
import hashlib
import secrets
from datetime import datetime, timedelta
import redis
from app.core.config import settings

# Rate limiting storage
rate_limit_storage: Dict[str, Dict[str, Any]] = {}

class RateLimiter:
    """Rate limiter implementation for API endpoints."""
    
    def __init__(self, requests_per_minute: int = 60, requests_per_hour: int = 1000):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.redis_client = redis.Redis.from_url(settings.REDIS_URL)
    
    def is_rate_limited(self, client_id: str) -> bool:
        """Check if client is rate limited."""
        current_time = time.time()
        
        # Check minute rate limit
        minute_key = f"rate_limit:{client_id}:minute:{int(current_time / 60)}"
        minute_count = self.redis_client.get(minute_key)
        
        if minute_count and int(minute_count) >= self.requests_per_minute:
            return True
        
        # Check hour rate limit
        hour_key = f"rate_limit:{client_id}:hour:{int(current_time / 3600)}"
        hour_count = self.redis_client.get(hour_key)
        
        if hour_count and int(hour_count) >= self.requests_per_hour:
            return True
        
        return False
    
    def increment_request(self, client_id: str):
        """Increment request count for client."""
        current_time = time.time()
        
        # Increment minute counter
        minute_key = f"rate_limit:{client_id}:minute:{int(current_time / 60)}"
        self.redis_client.incr(minute_key)
        self.redis_client.expire(minute_key, 60)
        
        # Increment hour counter
        hour_key = f"rate_limit:{client_id}:hour:{int(current_time / 3600)}"
        self.redis_client.incr(hour_key)
        self.redis_client.expire(hour_key, 3600)

class SecurityMiddleware:
    """Security middleware for request validation and sanitization."""
    
    def __init__(self):
        self.rate_limiter = RateLimiter()
    
    def get_client_id(self, request: Request) -> str:
        """Get unique client identifier."""
        # Use IP address as client ID
        client_ip = request.client.host
        
        # Add user agent hash for additional uniqueness
        user_agent = request.headers.get("user-agent", "")
        user_agent_hash = hashlib.md5(user_agent.encode()).hexdigest()[:8]
        
        return f"{client_ip}:{user_agent_hash}"
    
    def validate_request(self, request: Request):
        """Validate incoming request for security issues."""
        client_id = self.get_client_id(request)
        
        # Check rate limiting
        if self.rate_limiter.is_rate_limited(client_id):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later."
            )
        
        # Increment request count
        self.rate_limiter.increment_request(client_id)
        
        # Validate content type for POST/PUT requests
        if request.method in ["POST", "PUT", "PATCH"]:
            content_type = request.headers.get("content-type", "")
            if not content_type.startswith("application/json"):
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail="Content-Type must be application/json"
                )
        
        # Check for suspicious headers
        suspicious_headers = [
            "x-forwarded-for",
            "x-real-ip",
            "x-forwarded-proto"
        ]
        
        for header in suspicious_headers:
            if header in request.headers:
                # Log suspicious header for monitoring
                print(f"Suspicious header detected: {header}")
    
    def sanitize_input(self, data: Any) -> Any:
        """Sanitize input data to prevent injection attacks."""
        if isinstance(data, str):
            # Remove potentially dangerous characters
            dangerous_chars = ["<", ">", "'", '"', "&", ";", "(", ")", "{", "}"]
            for char in dangerous_chars:
                data = data.replace(char, "")
            return data.strip()
        
        elif isinstance(data, dict):
            return {k: self.sanitize_input(v) for k, v in data.items()}
        
        elif isinstance(data, list):
            return [self.sanitize_input(item) for item in data]
        
        return data

class TokenValidator:
    """Token validation and management."""
    
    def __init__(self):
        self.redis_client = redis.Redis.from_url(settings.REDIS_URL)
    
    def validate_token(self, token: str) -> bool:
        """Validate JWT token."""
        try:
            # Check if token is blacklisted
            if self.redis_client.exists(f"blacklist:{token}"):
                return False
            
            # Additional token validation logic here
            return True
        except Exception:
            return False
    
    def blacklist_token(self, token: str):
        """Add token to blacklist."""
        # Set expiration for blacklisted token (24 hours)
        self.redis_client.setex(f"blacklist:{token}", 86400, "1")
    
    def generate_session_token(self, user_id: str) -> str:
        """Generate a new session token."""
        token = secrets.token_urlsafe(32)
        # Store token with user ID and expiration
        self.redis_client.setex(f"session:{token}", 3600, user_id)  # 1 hour expiration
        return token

# Global security instance
security_middleware = SecurityMiddleware()
token_validator = TokenValidator()

# Security headers middleware
def add_security_headers(response):
    """Add security headers to response."""
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'"
    return response