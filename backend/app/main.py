from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import structlog
from prometheus_client import Counter, Histogram
import time

from app.core.config import settings
from app.core.database import init_db
from app.api.v1.router import api_router
from app.services.ai_service import AIService
from app.services.auth_service import AuthService

# Configuração de logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Métricas Prometheus
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP request latency')

# Middleware para métricas
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting MILAPP Backend")
    await init_db()
    logger.info("Database initialized")
    
    # Initialize services
    app.state.ai_service = AIService()
    app.state.auth_service = AuthService()
    logger.info("Services initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down MILAPP Backend")

# Criação da aplicação FastAPI
app = FastAPI(
    title="MILAPP API",
    description="Centro de Excelência em Automação RPA - API Backend",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware para métricas e logging
@app.middleware("http")
async def metrics_middleware(request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    REQUEST_LATENCY.observe(duration)
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    logger.info(
        "HTTP Request",
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        duration=duration
    )
    
    return response

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "service": "MILAPP Backend"
    }

# Ready check endpoint
@app.get("/ready")
async def ready_check():
    try:
        # Verificar conexão com banco
        # Verificar serviços essenciais
        return {"status": "ready"}
    except Exception as e:
        logger.error("Service not ready", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service not ready"
        )

# Metrics endpoint para Prometheus
@app.get("/metrics")
async def metrics():
    from prometheus_client import generate_latest
    return generate_latest()

# Incluir rotas da API
app.include_router(api_router, prefix="/api/v1")

# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(
        "Unhandled exception",
        error=str(exc),
        path=request.url.path,
        method=request.method
    )
    return {
        "error": "Internal server error",
        "detail": "An unexpected error occurred"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    ) 