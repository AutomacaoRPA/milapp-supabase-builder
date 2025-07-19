export interface MedSeniorNotificationData {
  type: 'quality_gate' | 'deployment' | 'metric' | 'project' | 'automation' | 'system'
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

export class MedSeniorNotificationService {
  private static instance: MedSeniorNotificationService
  private registration: ServiceWorkerRegistration | null = null
  private isInitialized = false

  static getInstance(): MedSeniorNotificationService {
    if (!this.instance) {
      this.instance = new MedSeniorNotificationService()
    }
    return this.instance
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js')
        console.log('🏥 Service Worker MedSênior bem registrado')
        
        await this.requestNotificationPermission()
        this.isInitialized = true
        
        // Listener para mensagens do service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event)
        })
        
      } catch (error) {
        console.error('❌ Erro ao registrar Service Worker:', error)
      }
    } else {
      console.warn('⚠️ Service Worker ou Push API não suportados')
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('Browser não suporta notificações')
      return false
    }

    if (Notification.permission === 'granted') {
      console.log('✅ Permissão de notificação já concedida')
      return true
    }

    if (Notification.permission === 'denied') {
      console.log('❌ Permissão de notificação negada')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      const granted = permission === 'granted'
      
      if (granted) {
        console.log('✅ Permissão de notificação concedida')
      } else {
        console.log('❌ Permissão de notificação negada')
      }
      
      return granted
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error)
      return false
    }
  }

  async showNotification(
    title: string, 
    options: NotificationOptions & { medseniorData?: any }
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    if (!this.registration || Notification.permission !== 'granted') {
      console.log('⚠️ Notificações não disponíveis')
      return
    }

    const defaultOptions: NotificationOptions = {
      icon: '/assets/medsenior-icon-192.png',
      badge: '/assets/medsenior-badge.png',
      tag: 'medsenior-app',
      renotify: true,
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
      ...options,
      data: {
        company: 'MedSênior',
        app: 'MILAPP',
        timestamp: new Date().toISOString(),
        ...options.medseniorData
      }
    }

    try {
      await this.registration.showNotification(title, defaultOptions)
      console.log('🔔 Notificação MedSênior enviada:', title)
    } catch (error) {
      console.error('Erro ao mostrar notificação:', error)
    }
  }

  // Notificações específicas MedSênior
  async notifyQualityGateApproval(projectName: string, gate: string): Promise<void> {
    await this.showNotification(
      `Quality Gate ${gate} Aprovado! 🎉`,
      {
        body: `O projeto "${projectName}" passou pelo gate ${gate}. Bem evoluir!`,
        tag: 'quality-gate-approval',
        medseniorData: { 
          type: 'quality_gate', 
          gate, 
          project: projectName,
          action: 'approval'
        }
      }
    )
  }

  async notifyQualityGateRejection(projectName: string, gate: string, reason: string): Promise<void> {
    await this.showNotification(
      `Quality Gate ${gate} Rejeitado ⚠️`,
      {
        body: `Projeto "${projectName}" não passou no gate ${gate}: ${reason}`,
        tag: 'quality-gate-rejection',
        medseniorData: { 
          type: 'quality_gate', 
          gate, 
          project: projectName,
          reason,
          action: 'rejection'
        }
      }
    )
  }

  async notifyAutomationDeployed(automationName: string, environment: string): Promise<void> {
    await this.showNotification(
      'Automação em Produção! 🚀',
      {
        body: `"${automationName}" foi bem implantada em ${environment}.`,
        tag: 'automation-deployed',
        medseniorData: { 
          type: 'deployment', 
          automation: automationName,
          environment
        }
      }
    )
  }

  async notifyROIUpdate(newROI: number, previousROI: number): Promise<void> {
    const change = newROI - previousROI
    const emoji = change >= 0 ? '📈' : '📉'
    const trend = change >= 0 ? 'aumentou' : 'diminuiu'
    
    await this.showNotification(
      `ROI Atualizado! ${emoji}`,
      {
        body: `ROI ${trend} de ${previousROI}% para ${newROI}% - Bem envelhecer com resultados!`,
        tag: 'roi-update', 
        medseniorData: { 
          type: 'metric', 
          metric: 'roi',
          current: newROI,
          previous: previousROI,
          change
        }
      }
    )
  }

  async notifyProjectCreated(projectName: string, creator: string): Promise<void> {
    await this.showNotification(
      'Novo Projeto Criado! 📋',
      {
        body: `"${projectName}" foi criado por ${creator}. Bem começar!`,
        tag: 'project-created',
        medseniorData: { 
          type: 'project', 
          project: projectName,
          creator,
          action: 'created'
        }
      }
    )
  }

  async notifyAutomationCompleted(automationName: string, duration: string): Promise<void> {
    await this.showNotification(
      'Automação Concluída! ✅',
      {
        body: `"${automationName}" executou com sucesso em ${duration}.`,
        tag: 'automation-completed',
        medseniorData: { 
          type: 'automation', 
          automation: automationName,
          duration,
          action: 'completed'
        }
      }
    )
  }

  async notifySystemMaintenance(scheduledTime: string): Promise<void> {
    await this.showNotification(
      'Manutenção Programada 🔧',
      {
        body: `Sistema MedSênior em manutenção às ${scheduledTime}. Bem preparar!`,
        tag: 'system-maintenance',
        medseniorData: { 
          type: 'system', 
          maintenance: true,
          scheduledTime
        }
      }
    )
  }

  async notifyDiscoveryCompleted(processName: string, insights: number): Promise<void> {
    await this.showNotification(
      'Discovery IA Concluído! 🤖',
      {
        body: `Análise de "${processName}" completa com ${insights} insights descobertos.`,
        tag: 'discovery-completed',
        medseniorData: { 
          type: 'discovery', 
          process: processName,
          insights,
          action: 'completed'
        }
      }
    )
  }

  async notifyError(error: string, context: string): Promise<void> {
    await this.showNotification(
      'Erro Detectado! ⚠️',
      {
        body: `Erro em ${context}: ${error}. Bem corrigir!`,
        tag: 'error-alert',
        medseniorData: { 
          type: 'system', 
          error: true,
          context,
          message: error
        }
      }
    )
  }

  // Métodos utilitários
  async clearNotifications(tag?: string): Promise<void> {
    if (!this.registration) return

    if (tag) {
      await this.registration.getNotifications({ tag })
        .then(notifications => {
          notifications.forEach(notification => notification.close())
        })
    } else {
      await this.registration.getNotifications()
        .then(notifications => {
          notifications.forEach(notification => notification.close())
        })
    }
  }

  async getNotificationPermission(): Promise<NotificationPermission> {
    return Notification.permission
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    console.log('💬 Mensagem do Service Worker:', event.data)
    
    if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
      this.handleNotificationClick(event.data)
    }
  }

  private handleNotificationClick(data: any): void {
    console.log('👆 Notificação clicada:', data)
    
    // Aqui você pode implementar lógica específica baseada no tipo de notificação
    switch (data.action) {
      case 'view-project':
        window.location.href = `/projects/${data.projectId}`
        break
      case 'view-analytics':
        window.location.href = '/dashboard'
        break
      case 'view-automation':
        window.location.href = `/automations/${data.automationId}`
        break
      default:
        console.log('Ação não implementada:', data.action)
    }
  }

  // Método para enviar notificação push para outros dispositivos
  async sendPushNotification(subscription: PushSubscription, data: MedSeniorNotificationData): Promise<void> {
    try {
      const response = await fetch('/api/notifications/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          data
        })
      })

      if (!response.ok) {
        throw new Error('Falha ao enviar notificação push')
      }

      console.log('📱 Notificação push enviada com sucesso')
    } catch (error) {
      console.error('Erro ao enviar notificação push:', error)
    }
  }
} 