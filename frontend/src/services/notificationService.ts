import { toast } from 'react-toastify';
import { api } from './api';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action_url?: string;
  metadata?: {
    project_id?: string;
    quality_gate_id?: string;
    deployment_id?: string;
    user_id?: string;
  };
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  in_app: boolean;
  types: {
    project_updates: boolean;
    quality_gates: boolean;
    deployments: boolean;
    system_alerts: boolean;
  };
}

class NotificationService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Array<(notification: Notification) => void> = [];
  private isConnected = false;

  constructor() {
    this.initializeWebSocket();
  }

  private initializeWebSocket() {
    try {
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/notifications';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket conectado para notificações');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.authenticateWebSocket();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleNotification(data);
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket desconectado');
        this.isConnected = false;
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
        this.isConnected = false;
      };
    } catch (error) {
      console.error('Erro ao inicializar WebSocket:', error);
    }
  }

  private authenticateWebSocket() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const token = localStorage.getItem('access_token');
      if (token) {
        this.ws.send(JSON.stringify({
          type: 'auth',
          token: token
        }));
      }
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.initializeWebSocket();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Máximo de tentativas de reconexão atingido');
    }
  }

  private handleNotification(notification: Notification) {
    // Mostrar toast
    this.showToast(notification);
    
    // Notificar listeners
    this.listeners.forEach(listener => listener(notification));
    
    // Salvar no localStorage para histórico
    this.saveNotificationToHistory(notification);
  }

  private showToast(notification: Notification) {
    const toastOptions = {
      position: 'top-right' as const,
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      onClick: () => {
        if (notification.action_url) {
          window.open(notification.action_url, '_blank');
        }
      }
    };

    switch (notification.type) {
      case 'success':
        toast.success(notification.message, {
          ...toastOptions,
          icon: '🎉'
        });
        break;
      case 'error':
        toast.error(notification.message, {
          ...toastOptions,
          icon: '❌'
        });
        break;
      case 'warning':
        toast.warning(notification.message, {
          ...toastOptions,
          icon: '⚠️'
        });
        break;
      case 'info':
      default:
        toast.info(notification.message, {
          ...toastOptions,
          icon: 'ℹ️'
        });
        break;
    }
  }

  private saveNotificationToHistory(notification: Notification) {
    try {
      const history = this.getNotificationHistory();
      history.unshift(notification);
      
      // Manter apenas as últimas 100 notificações
      if (history.length > 100) {
        history.splice(100);
      }
      
      localStorage.setItem('notification_history', JSON.stringify(history));
    } catch (error) {
      console.error('Erro ao salvar notificação no histórico:', error);
    }
  }

  // Buscar notificações do servidor
  async fetchNotifications(limit = 50, offset = 0): Promise<Notification[]> {
    try {
      const response = await api.get('/api/v1/notifications/', {
        params: { limit, offset }
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      return [];
    }
  }

  // Marcar notificação como lida
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.patch(`/api/v1/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }

  // Marcar todas como lidas
  async markAllAsRead(): Promise<void> {
    try {
      await api.post('/api/v1/notifications/mark-all-read');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  }

  // Deletar notificação
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await api.delete(`/api/v1/notifications/${notificationId}`);
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  }

  // Buscar preferências de notificação
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await api.get('/api/v1/notifications/preferences');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar preferências:', error);
      return this.getDefaultPreferences();
    }
  }

  // Atualizar preferências de notificação
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      await api.patch('/api/v1/notifications/preferences', preferences);
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
    }
  }

  // Enviar notificação de teste
  async sendTestNotification(): Promise<void> {
    try {
      await api.post('/api/v1/notifications/test');
    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
    }
  }

  // Buscar histórico local
  getNotificationHistory(): Notification[] {
    try {
      const history = localStorage.getItem('notification_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Erro ao buscar histórico de notificações:', error);
      return [];
    }
  }

  // Limpar histórico local
  clearNotificationHistory(): void {
    try {
      localStorage.removeItem('notification_history');
    } catch (error) {
      console.error('Erro ao limpar histórico de notificações:', error);
    }
  }

  // Adicionar listener para notificações
  addListener(listener: (notification: Notification) => void): () => void {
    this.listeners.push(listener);
    
    // Retornar função para remover listener
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Verificar se está conectado
  isWebSocketConnected(): boolean {
    return this.isConnected;
  }

  // Reconectar manualmente
  reconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
    this.reconnectAttempts = 0;
    this.initializeWebSocket();
  }

  // Desconectar
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
    this.isConnected = false;
  }

  // Preferências padrão
  private getDefaultPreferences(): NotificationPreferences {
    return {
      email: true,
      push: true,
      in_app: true,
      types: {
        project_updates: true,
        quality_gates: true,
        deployments: true,
        system_alerts: true,
      }
    };
  }

  // Criar notificação local (para testes)
  createLocalNotification(
    type: Notification['type'],
    title: string,
    message: string,
    metadata?: Notification['metadata']
  ): Notification {
    const notification: Notification = {
      id: `local-${Date.now()}`,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      metadata
    };

    this.handleNotification(notification);
    return notification;
  }

  // Notificações específicas do sistema
  notifyProjectUpdate(projectId: string, projectName: string, action: string) {
    this.createLocalNotification(
      'info',
      'Atualização de Projeto',
      `Projeto "${projectName}" foi ${action}`,
      { project_id: projectId }
    );
  }

  notifyQualityGateResult(gateId: string, gateName: string, status: string) {
    const type = status === 'passed' ? 'success' : status === 'failed' ? 'error' : 'warning';
    this.createLocalNotification(
      type,
      'Quality Gate',
      `Quality Gate "${gateName}" ${status}`,
      { quality_gate_id: gateId }
    );
  }

  notifyDeploymentResult(deploymentId: string, projectName: string, status: string) {
    const type = status === 'success' ? 'success' : status === 'failed' ? 'error' : 'warning';
    this.createLocalNotification(
      type,
      'Deployment',
      `Deployment do projeto "${projectName}" ${status}`,
      { deployment_id: deploymentId }
    );
  }

  notifySystemAlert(title: string, message: string, type: Notification['type'] = 'warning') {
    this.createLocalNotification(type, title, message);
  }
}

// Instância singleton
export const notificationService = new NotificationService();

// Hook para usar o serviço de notificações
export const useNotificationService = () => {
  return {
    // Métodos principais
    fetchNotifications: notificationService.fetchNotifications.bind(notificationService),
    markAsRead: notificationService.markAsRead.bind(notificationService),
    markAllAsRead: notificationService.markAllAsRead.bind(notificationService),
    deleteNotification: notificationService.deleteNotification.bind(notificationService),
    
    // Preferências
    getPreferences: notificationService.getPreferences.bind(notificationService),
    updatePreferences: notificationService.updatePreferences.bind(notificationService),
    
    // Histórico local
    getNotificationHistory: notificationService.getNotificationHistory.bind(notificationService),
    clearNotificationHistory: notificationService.clearNotificationHistory.bind(notificationService),
    
    // WebSocket
    addListener: notificationService.addListener.bind(notificationService),
    isConnected: notificationService.isWebSocketConnected.bind(notificationService),
    reconnect: notificationService.reconnect.bind(notificationService),
    
    // Notificações específicas
    notifyProjectUpdate: notificationService.notifyProjectUpdate.bind(notificationService),
    notifyQualityGateResult: notificationService.notifyQualityGateResult.bind(notificationService),
    notifyDeploymentResult: notificationService.notifyDeploymentResult.bind(notificationService),
    notifySystemAlert: notificationService.notifySystemAlert.bind(notificationService),
    
    // Teste
    sendTestNotification: notificationService.sendTestNotification.bind(notificationService),
  };
}; 