import logging
import time
import psutil
import threading
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict, deque
from dataclasses import dataclass, asdict
from app.core.config import settings

logger = logging.getLogger(__name__)

@dataclass
class MetricPoint:
    """Ponto de métrica com timestamp"""
    timestamp: datetime
    value: float
    labels: Dict[str, str]

@dataclass
class Alert:
    """Alerta do sistema"""
    id: str
    severity: str  # 'info', 'warning', 'error', 'critical'
    message: str
    timestamp: datetime
    resolved: bool = False
    metadata: Dict[str, Any] = None

class MonitoringService:
    """
    Serviço de monitoramento para coletar métricas e alertas
    """
    
    def __init__(self):
        self.metrics: Dict[str, deque] = defaultdict(lambda: deque(maxlen=1000))
        self.alerts: List[Alert] = []
        self.performance_data: Dict[str, List[float]] = defaultdict(list)
        self.error_counts: Dict[str, int] = defaultdict(int)
        self.request_times: deque = deque(maxlen=1000)
        self.monitoring_thread = None
        self.running = False
        
        # Limites de alerta
        self.thresholds = {
            'cpu_usage': 80.0,
            'memory_usage': 85.0,
            'disk_usage': 90.0,
            'response_time': 2.0,
            'error_rate': 5.0
        }
    
    def start_monitoring(self):
        """Inicia o monitoramento em background"""
        if self.monitoring_thread and self.monitoring_thread.is_alive():
            return
        
        self.running = True
        self.monitoring_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.monitoring_thread.start()
        logger.info("Monitoramento iniciado")
    
    def stop_monitoring(self):
        """Para o monitoramento"""
        self.running = False
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=5)
        logger.info("Monitoramento parado")
    
    def _monitor_loop(self):
        """Loop principal de monitoramento"""
        while self.running:
            try:
                self._collect_system_metrics()
                self._check_thresholds()
                time.sleep(30)  # Coleta a cada 30 segundos
            except Exception as e:
                logger.error(f"Erro no loop de monitoramento: {e}")
                time.sleep(60)
    
    def _collect_system_metrics(self):
        """Coleta métricas do sistema"""
        try:
            # CPU
            cpu_percent = psutil.cpu_percent(interval=1)
            self.add_metric('system.cpu_usage', cpu_percent, {'type': 'percentage'})
            
            # Memória
            memory = psutil.virtual_memory()
            self.add_metric('system.memory_usage', memory.percent, {'type': 'percentage'})
            self.add_metric('system.memory_available', memory.available / (1024**3), {'type': 'gb'})
            
            # Disco
            disk = psutil.disk_usage('/')
            self.add_metric('system.disk_usage', (disk.used / disk.total) * 100, {'type': 'percentage'})
            self.add_metric('system.disk_available', disk.free / (1024**3), {'type': 'gb'})
            
            # Rede
            network = psutil.net_io_counters()
            self.add_metric('system.network_bytes_sent', network.bytes_sent, {'type': 'bytes'})
            self.add_metric('system.network_bytes_recv', network.bytes_recv, {'type': 'bytes'})
            
        except Exception as e:
            logger.error(f"Erro ao coletar métricas do sistema: {e}")
    
    def add_metric(self, name: str, value: float, labels: Dict[str, str] = None):
        """Adiciona uma métrica"""
        metric_point = MetricPoint(
            timestamp=datetime.now(),
            value=value,
            labels=labels or {}
        )
        self.metrics[name].append(metric_point)
    
    def record_request_time(self, endpoint: str, method: str, duration: float):
        """Registra tempo de resposta de uma requisição"""
        self.request_times.append({
            'timestamp': datetime.now(),
            'endpoint': endpoint,
            'method': method,
            'duration': duration
        })
        
        # Calcula tempo médio de resposta
        recent_times = [r['duration'] for r in list(self.request_times)[-100:]]
        avg_time = sum(recent_times) / len(recent_times)
        self.add_metric('api.response_time_avg', avg_time, {'endpoint': endpoint})
        
        # Alerta se tempo muito alto
        if duration > self.thresholds['response_time']:
            self.create_alert(
                'high_response_time',
                'warning',
                f"Tempo de resposta alto: {endpoint} ({duration:.2f}s)"
            )
    
    def record_error(self, error_type: str, error_message: str):
        """Registra um erro"""
        self.error_counts[error_type] += 1
        
        # Calcula taxa de erro
        total_requests = len(self.request_times)
        if total_requests > 0:
            error_rate = (sum(self.error_counts.values()) / total_requests) * 100
            self.add_metric('api.error_rate', error_rate, {'type': 'percentage'})
            
            if error_rate > self.thresholds['error_rate']:
                self.create_alert(
                    'high_error_rate',
                    'error',
                    f"Taxa de erro alta: {error_rate:.1f}%"
                )
    
    def _check_thresholds(self):
        """Verifica limites e cria alertas"""
        try:
            # CPU
            cpu_metric = self.get_latest_metric('system.cpu_usage')
            if cpu_metric and cpu_metric.value > self.thresholds['cpu_usage']:
                self.create_alert(
                    'high_cpu_usage',
                    'warning',
                    f"Uso de CPU alto: {cpu_metric.value:.1f}%"
                )
            
            # Memória
            memory_metric = self.get_latest_metric('system.memory_usage')
            if memory_metric and memory_metric.value > self.thresholds['memory_usage']:
                self.create_alert(
                    'high_memory_usage',
                    'warning',
                    f"Uso de memória alto: {memory_metric.value:.1f}%"
                )
            
            # Disco
            disk_metric = self.get_latest_metric('system.disk_usage')
            if disk_metric and disk_metric.value > self.thresholds['disk_usage']:
                self.create_alert(
                    'high_disk_usage',
                    'error',
                    f"Uso de disco alto: {disk_metric.value:.1f}%"
                )
                
        except Exception as e:
            logger.error(f"Erro ao verificar limites: {e}")
    
    def get_latest_metric(self, name: str) -> Optional[MetricPoint]:
        """Obtém a métrica mais recente"""
        if name in self.metrics and self.metrics[name]:
            return self.metrics[name][-1]
        return None
    
    def get_metrics(self, name: str, minutes: int = 60) -> List[MetricPoint]:
        """Obtém métricas dos últimos N minutos"""
        if name not in self.metrics:
            return []
        
        cutoff_time = datetime.now() - timedelta(minutes=minutes)
        return [m for m in self.metrics[name] if m.timestamp > cutoff_time]
    
    def create_alert(self, alert_id: str, severity: str, message: str, metadata: Dict[str, Any] = None):
        """Cria um novo alerta"""
        # Verifica se já existe alerta similar não resolvido
        for alert in self.alerts:
            if alert.id == alert_id and not alert.resolved:
                return  # Alerta já existe
        
        alert = Alert(
            id=alert_id,
            severity=severity,
            message=message,
            timestamp=datetime.now(),
            metadata=metadata or {}
        )
        
        self.alerts.append(alert)
        logger.warning(f"Alerta criado: {severity.upper()} - {message}")
    
    def resolve_alert(self, alert_id: str):
        """Marca um alerta como resolvido"""
        for alert in self.alerts:
            if alert.id == alert_id:
                alert.resolved = True
                logger.info(f"Alerta resolvido: {alert_id}")
                break
    
    def get_active_alerts(self) -> List[Alert]:
        """Obtém alertas ativos (não resolvidos)"""
        return [alert for alert in self.alerts if not alert.resolved]
    
    def get_system_health(self) -> Dict[str, Any]:
        """Obtém status geral de saúde do sistema"""
        cpu_metric = self.get_latest_metric('system.cpu_usage')
        memory_metric = self.get_latest_metric('system.memory_usage')
        disk_metric = self.get_latest_metric('system.disk_usage')
        error_rate_metric = self.get_latest_metric('api.error_rate')
        
        # Calcula score de saúde (0-100)
        health_score = 100
        
        if cpu_metric and cpu_metric.value > 80:
            health_score -= 20
        elif cpu_metric and cpu_metric.value > 60:
            health_score -= 10
            
        if memory_metric and memory_metric.value > 85:
            health_score -= 20
        elif memory_metric and memory_metric.value > 70:
            health_score -= 10
            
        if disk_metric and disk_metric.value > 90:
            health_score -= 30
        elif disk_metric and disk_metric.value > 80:
            health_score -= 15
            
        if error_rate_metric and error_rate_metric.value > 5:
            health_score -= 25
        elif error_rate_metric and error_rate_metric.value > 2:
            health_score -= 10
        
        return {
            'health_score': max(0, health_score),
            'status': 'healthy' if health_score > 80 else 'warning' if health_score > 50 else 'critical',
            'metrics': {
                'cpu_usage': cpu_metric.value if cpu_metric else None,
                'memory_usage': memory_metric.value if memory_metric else None,
                'disk_usage': disk_metric.value if disk_metric else None,
                'error_rate': error_rate_metric.value if error_rate_metric else None
            },
            'active_alerts': len(self.get_active_alerts()),
            'total_requests': len(self.request_times)
        }
    
    def get_performance_summary(self) -> Dict[str, Any]:
        """Obtém resumo de performance"""
        if not self.request_times:
            return {'message': 'Nenhuma requisição registrada'}
        
        recent_requests = list(self.request_times)[-100:]
        durations = [r['duration'] for r in recent_requests]
        
        return {
            'total_requests': len(self.request_times),
            'recent_requests': len(recent_requests),
            'avg_response_time': sum(durations) / len(durations),
            'min_response_time': min(durations),
            'max_response_time': max(durations),
            'error_count': sum(self.error_counts.values()),
            'endpoints': self._get_endpoint_stats()
        }
    
    def _get_endpoint_stats(self) -> Dict[str, Dict[str, float]]:
        """Obtém estatísticas por endpoint"""
        endpoint_stats = defaultdict(lambda: {'count': 0, 'total_time': 0, 'avg_time': 0})
        
        for request in self.request_times:
            endpoint = request['endpoint']
            endpoint_stats[endpoint]['count'] += 1
            endpoint_stats[endpoint]['total_time'] += request['duration']
        
        # Calcula tempo médio
        for endpoint, stats in endpoint_stats.items():
            if stats['count'] > 0:
                stats['avg_time'] = stats['total_time'] / stats['count']
        
        return dict(endpoint_stats)

# Instância global do monitoramento
monitoring_service = MonitoringService() 