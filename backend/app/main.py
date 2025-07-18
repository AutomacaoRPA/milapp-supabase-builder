"""
MILAPP - Centro de Excelência em Automação RPA
Backend API Principal
"""

import os
import json
import time
from contextlib import asynccontextmanager
from typing import List
from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram, Gauge, Summary, generate_latest, CONTENT_TYPE_LATEST
import structlog

from app.core.config import settings
from app.core.database import engine, Base, check_db_connection, get_connection_count
from app.core.security import get_current_user, SecurityMiddleware, check_rate_limit_middleware, get_redis_client
from app.api.v1.router import api_router
from app.services.ai_service import AIService
from app.services.notification_service import NotificationService
from app.services.monitoring_service import monitoring_service

# Configuração de logging
logger = structlog.get_logger()

# Métricas Prometheus
REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint', 'status'])
REQUEST_LATENCY = Histogram('http_request_duration_seconds', 'HTTP request latency')
ACTIVE_USERS = Gauge('active_users_total', 'Total active users')
PROJECT_COUNT = Gauge('projects_total', 'Total projects')
ERROR_COUNT = Counter('errors_total', 'Total errors', ['type', 'endpoint'])
DATABASE_CONNECTIONS = Gauge('database_connections', 'Database connections')
REDIS_CONNECTIONS = Gauge('redis_connections', 'Redis connections')

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle da aplicação"""
    # Startup
    logger.info("Iniciando MILAPP Backend")
    
    # Criar tabelas se não existirem
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Inicializar serviços
    await AIService.initialize()
    await NotificationService.initialize()
    
    # Iniciar monitoramento
    monitoring_service.start_monitoring()
    
    logger.info("MILAPP Backend iniciado com sucesso")
    
    yield
    
    # Shutdown
    logger.info("Encerrando MILAPP Backend")
    monitoring_service.stop_monitoring()
    await AIService.cleanup()
    await NotificationService.cleanup()

# Criação da aplicação FastAPI
app = FastAPI(
    title="MILAPP API",
    description="API do Centro de Excelência em Automação RPA",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Middleware de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware de segurança
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Middleware de segurança customizado
app.add_middleware(SecurityMiddleware)

# Middleware de rate limiting
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    await check_rate_limit_middleware(request)
    response = await call_next(request)
    return response

# Middleware de métricas
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    try:
        response = await call_next(request)
        
        duration = time.time() - start_time
        REQUEST_LATENCY.observe(duration)
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code
        ).inc()
        
        return response
        
    except Exception as e:
        ERROR_COUNT.labels(
            type=type(e).__name__,
            endpoint=request.url.path
        ).inc()
        raise

# Middleware de logging
@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    logger.info(
        "Request",
        method=request.method,
        url=str(request.url),
        client_ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    
    response = await call_next(request)
    
    logger.info(
        "Response",
        status_code=response.status_code,
        method=request.method,
        url=str(request.url)
    )
    
    return response

# Middleware de headers de segurança
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    
    # Headers de segurança
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    response.headers["Referrer-Policy"] = "no-referrer-when-downgrade"
    
    return response

# Incluir rotas da API
app.include_router(api_router, prefix="/api/v1")

# Health check robusto
@app.get("/health")
async def health_check():
    """Health check da aplicação"""
    health_status = {
        "status": "healthy",
        "version": "2.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {}
    }
    
    # Verificar banco de dados
    try:
        db_healthy = await check_db_connection()
        health_status["checks"]["database"] = "healthy" if db_healthy else "unhealthy"
        if not db_healthy:
            health_status["status"] = "unhealthy"
    except Exception as e:
        health_status["checks"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "unhealthy"
    
    # Verificar Redis
    try:
        redis_client = await get_redis_client()
        await redis_client.ping()
        health_status["checks"]["redis"] = "healthy"
    except Exception as e:
        health_status["checks"]["redis"] = f"unhealthy: {str(e)}"
        health_status["status"] = "unhealthy"
    
    # Verificar serviços externos
    try:
        ai_status = await AIService.check_health()
        health_status["checks"]["ai_service"] = "healthy" if ai_status else "unhealthy"
    except Exception as e:
        health_status["checks"]["ai_service"] = f"unhealthy: {str(e)}"
    
    try:
        notification_status = await NotificationService.check_health()
        health_status["checks"]["notification_service"] = "healthy" if notification_status else "unhealthy"
    except Exception as e:
        health_status["checks"]["notification_service"] = f"unhealthy: {str(e)}"
    
    # Retornar status apropriado
    if health_status["status"] == "healthy":
        return health_status
    else:
        return JSONResponse(
            status_code=503,
            content=health_status
        )

# Ready check para Kubernetes
@app.get("/ready")
async def ready_check():
    """Ready check para Kubernetes"""
    try:
        # Verificar conexão com banco
        db_healthy = await check_db_connection()
        if not db_healthy:
            return JSONResponse(
                status_code=503,
                content={"status": "not ready", "error": "Database connection failed"}
            )
        
        # Verificar serviços críticos
        ai_status = await AIService.check_health()
        notification_status = await NotificationService.check_health()
        
        if ai_status and notification_status:
            return {"status": "ready"}
        else:
            return JSONResponse(
                status_code=503,
                content={"status": "not ready", "services": {
                    "ai": ai_status,
                    "notifications": notification_status
                }}
            )
    except Exception as e:
        logger.error("Ready check failed", error=str(e))
        return JSONResponse(
            status_code=503,
            content={"status": "not ready", "error": str(e)}
        )

# Métricas Prometheus melhoradas
@app.get("/metrics")
async def metrics():
    """Endpoint para métricas Prometheus"""
    try:
        # Atualizar métricas customizadas
        try:
            # Contar usuários ativos (mock por enquanto)
            active_users = 10  # TODO: Implementar contagem real
            ACTIVE_USERS.set(active_users)
            
            # Contar projetos (mock por enquanto)
            project_count = 25  # TODO: Implementar contagem real
            PROJECT_COUNT.set(project_count)
            
            # Métricas de conexões
            DATABASE_CONNECTIONS.set(get_connection_count())
            REDIS_CONNECTIONS.set(5)  # TODO: Implementar contagem real
            
        except Exception as e:
            logger.error("Erro ao atualizar métricas", error=str(e))
        
        return Response(
            generate_latest(),
            media_type=CONTENT_TYPE_LATEST
        )
    except Exception as e:
        logger.error("Erro ao gerar métricas", error=str(e))
        raise HTTPException(status_code=500, detail="Erro interno do servidor")

# Tratamento de erros global
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handler global de exceções"""
    logger.error(
        "Unhandled exception",
        error=str(exc),
        method=request.method,
        url=str(request.url)
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Erro interno do servidor",
            "error": str(exc) if settings.DEBUG else "Erro interno"
        }
    )

# Rota raiz
@app.get("/")
async def root():
    """Rota raiz da API"""
    return {
        "message": "MILAPP - Centro de Excelência em Automação RPA",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health",
        "metrics": "/metrics"
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