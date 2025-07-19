from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from typing import Dict, List, Any
import time
from app.services.monitoring_service import monitoring_service
from app.services.cache_service import cache_service
from app.core.database import check_db_connection
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Health check básico do sistema
    """
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "services": {
            "database": check_db_connection(),
            "cache": cache_service.is_available(),
            "monitoring": True
        }
    }
    
    # Verifica se todos os serviços estão funcionando
    if not all(health_status["services"].values()):
        health_status["status"] = "unhealthy"
        return JSONResponse(
            status_code=503,
            content=health_status
        )
    
    return health_status

@router.get("/health/detailed")
async def detailed_health_check():
    """
    Health check detalhado com métricas do sistema
    """
    system_health = monitoring_service.get_system_health()
    
    # Adiciona informações dos serviços
    system_health["services"] = {
        "database": check_db_connection(),
        "cache": cache_service.is_available(),
        "monitoring": True
    }
    
    # Determina status geral
    if system_health["health_score"] < 50 or not all(system_health["services"].values()):
        system_health["overall_status"] = "critical"
        status_code = 503
    elif system_health["health_score"] < 80:
        system_health["overall_status"] = "warning"
        status_code = 200
    else:
        system_health["overall_status"] = "healthy"
        status_code = 200
    
    return JSONResponse(
        status_code=status_code,
        content=system_health
    )

@router.get("/metrics")
async def get_metrics():
    """
    Obtém métricas do sistema
    """
    metrics = {}
    
    # Métricas do sistema
    for metric_name in [
        'system.cpu_usage',
        'system.memory_usage',
        'system.disk_usage',
        'system.memory_available',
        'system.disk_available',
        'api.response_time_avg',
        'api.error_rate'
    ]:
        latest = monitoring_service.get_latest_metric(metric_name)
        if latest:
            metrics[metric_name] = {
                "value": latest.value,
                "timestamp": latest.timestamp.isoformat(),
                "labels": latest.labels
            }
    
    return {
        "metrics": metrics,
        "timestamp": time.time()
    }

@router.get("/metrics/{metric_name}")
async def get_metric_history(metric_name: str, minutes: int = 60):
    """
    Obtém histórico de uma métrica específica
    """
    metrics = monitoring_service.get_metrics(metric_name, minutes)
    
    return {
        "metric_name": metric_name,
        "data": [
            {
                "timestamp": metric.timestamp.isoformat(),
                "value": metric.value,
                "labels": metric.labels
            }
            for metric in metrics
        ],
        "count": len(metrics)
    }

@router.get("/performance")
async def get_performance_summary():
    """
    Obtém resumo de performance da API
    """
    return monitoring_service.get_performance_summary()

@router.get("/alerts")
async def get_alerts(active_only: bool = True):
    """
    Obtém alertas do sistema
    """
    if active_only:
        alerts = monitoring_service.get_active_alerts()
    else:
        alerts = monitoring_service.alerts
    
    return {
        "alerts": [
            {
                "id": alert.id,
                "severity": alert.severity,
                "message": alert.message,
                "timestamp": alert.timestamp.isoformat(),
                "resolved": alert.resolved,
                "metadata": alert.metadata
            }
            for alert in alerts
        ],
        "count": len(alerts)
    }

@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, current_user: User = Depends(get_current_user)):
    """
    Marca um alerta como resolvido
    """
    monitoring_service.resolve_alert(alert_id)
    return {"message": f"Alerta {alert_id} resolvido"}

@router.get("/cache/status")
async def get_cache_status():
    """
    Obtém status do cache
    """
    return {
        "available": cache_service.is_available(),
        "redis_url": "configured" if cache_service.redis_client else "not configured"
    }

@router.post("/cache/clear")
async def clear_cache(current_user: User = Depends(get_current_user)):
    """
    Limpa todo o cache (requer autenticação)
    """
    if not cache_service.is_available():
        raise HTTPException(status_code=503, detail="Cache não disponível")
    
    # Limpa todos os padrões conhecidos
    patterns = [
        "project:*",
        "user:*",
        "projects:list:*",
        "users:list:*",
        "dashboard:*"
    ]
    
    cleared_count = 0
    for pattern in patterns:
        if cache_service.delete_pattern(pattern):
            cleared_count += 1
    
    return {
        "message": "Cache limpo",
        "patterns_cleared": cleared_count
    }

@router.get("/system/info")
async def get_system_info():
    """
    Obtém informações gerais do sistema
    """
    import psutil
    import platform
    
    return {
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        "cpu_count": psutil.cpu_count(),
        "memory_total": psutil.virtual_memory().total / (1024**3),  # GB
        "disk_total": psutil.disk_usage('/').total / (1024**3),  # GB
        "uptime": time.time() - psutil.boot_time()
    }

# Middleware para registrar tempo de resposta
@router.middleware("http")
async def add_monitoring_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    monitoring_service.record_request_time(
        endpoint=str(request.url.path),
        method=request.method,
        duration=duration
    )
    
    return response 