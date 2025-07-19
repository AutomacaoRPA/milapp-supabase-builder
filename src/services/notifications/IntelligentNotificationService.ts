import { supabase } from '../supabase/client'

export interface NotificationTemplate {
  id: string
  name: string
  type: 'alert' | 'info' | 'success' | 'warning' | 'critical'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  channels: string[]
  conditions: NotificationCondition[]
  isActive: boolean
}

export interface NotificationCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in'
  value: any
  logicalOperator?: 'AND' | 'OR'
}

export interface Notification {
  id: string
  userId: string
  templateId: string
  title: string
  message: string
  type: string
  priority: string
  data: any
  channels: string[]
  status: 'pending' | 'sent' | 'failed' | 'read'
  sentAt?: string
  readAt?: string
  metadata: any
}

export interface NotificationPreference {
  userId: string
  channel: string
  isEnabled: boolean
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
  priority: 'all' | 'high_only' | 'urgent_only'
}

export class IntelligentNotificationService {
  private static instance: IntelligentNotificationService
  private templates: Map<string, NotificationTemplate> = new Map()
  private userPreferences: Map<string, NotificationPreference[]> = new Map()

  private constructor() {
    this.initializeTemplates()
  }

  static getInstance(): IntelligentNotificationService {
    if (!IntelligentNotificationService.instance) {
      IntelligentNotificationService.instance = new IntelligentNotificationService()
    }
    return IntelligentNotificationService.instance
  }

  /**
   * Inicializar templates de notificação
   */
  private initializeTemplates() {
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'sla_breach',
        name: 'Violação de SLA',
        type: 'critical',
        title: '🚨 SLA Violado - Ação Imediata Necessária',
        message: 'A solicitação #{id} ultrapassou o SLA de {sla_hours}h. Prioridade: {priority}',
        priority: 'urgent',
        channels: ['email', 'teams', 'whatsapp'],
        conditions: [
          { field: 'status', operator: 'equals', value: 'open' },
          { field: 'sla_breach', operator: 'equals', value: true }
        ],
        isActive: true
      },
      {
        id: 'nc_created',
        name: 'Nova Não Conformidade',
        type: 'warning',
        title: '⚠️ Nova Não Conformidade Registrada',
        message: 'NC #{id} criada por {created_by} no setor {sector}. Tipo: {type}',
        priority: 'high',
        channels: ['email', 'teams'],
        conditions: [
          { field: 'type', operator: 'equals', value: 'nc' },
          { field: 'status', operator: 'equals', value: 'open' }
        ],
        isActive: true
      },
      {
        id: 'security_incident',
        name: 'Incidente de Segurança',
        type: 'critical',
        title: '🔒 Incidente de Segurança Detectado',
        message: 'Tentativa de acesso suspeita detectada. IP: {ip}, Usuário: {user}',
        priority: 'urgent',
        channels: ['email', 'teams', 'whatsapp'],
        conditions: [
          { field: 'type', operator: 'equals', value: 'security' },
          { field: 'severity', operator: 'in', value: ['high', 'critical'] }
        ],
        isActive: true
      },
      {
        id: 'workflow_completed',
        name: 'Workflow Concluído',
        type: 'success',
        title: '✅ Workflow Concluído com Sucesso',
        message: 'Workflow "{name}" foi concluído em {duration} minutos',
        priority: 'medium',
        channels: ['email', 'teams'],
        conditions: [
          { field: 'status', operator: 'equals', value: 'completed' },
          { field: 'type', operator: 'equals', value: 'workflow' }
        ],
        isActive: true
      },
      {
        id: 'ai_analysis_ready',
        name: 'Análise IA Pronta',
        type: 'info',
        title: '🤖 Análise IA Concluída',
        message: 'Análise colaborativa IA para projeto "{project}" está pronta para revisão',
        priority: 'medium',
        channels: ['email', 'teams'],
        conditions: [
          { field: 'type', operator: 'equals', value: 'ai_analysis' },
          { field: 'status', operator: 'equals', value: 'completed' }
        ],
        isActive: true
      },
      {
        id: 'report_delivered',
        name: 'Relatório Entregue',
        type: 'success',
        title: '📊 Relatório Entregue com Sucesso',
        message: 'Relatório "{title}" foi entregue via {channels} para {recipients}',
        priority: 'low',
        channels: ['email'],
        conditions: [
          { field: 'type', operator: 'equals', value: 'report' },
          { field: 'status', operator: 'equals', value: 'delivered' }
        ],
        isActive: true
      },
      {
        id: 'user_activity_alert',
        name: 'Alerta de Atividade',
        type: 'warning',
        title: '👤 Atividade Suspeita Detectada',
        message: 'Usuário {user} realizou {action_count} ações em {timeframe} minutos',
        priority: 'high',
        channels: ['email', 'teams'],
        conditions: [
          { field: 'type', operator: 'equals', value: 'user_activity' },
          { field: 'suspicious', operator: 'equals', value: true }
        ],
        isActive: true
      },
      {
        id: 'system_maintenance',
        name: 'Manutenção do Sistema',
        type: 'info',
        title: '🔧 Manutenção Programada',
        message: 'Manutenção do sistema agendada para {date} das {start_time} às {end_time}',
        priority: 'medium',
        channels: ['email', 'teams'],
        conditions: [
          { field: 'type', operator: 'equals', value: 'maintenance' },
          { field: 'scheduled', operator: 'equals', value: true }
        ],
        isActive: true
      }
    ]

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  /**
   * Processar evento e gerar notificações inteligentes
   */
  async processEvent(event: any): Promise<Notification[]> {
    const notifications: Notification[] = []
    const userId = (await supabase.auth.getUser()).data.user?.id
    if (!userId) return notifications

    // Analisar evento com IA para determinar prioridade
    const aiAnalysis = await this.analyzeEventWithAI(event)
    
    // Encontrar templates aplicáveis
    for (const template of this.templates.values()) {
      if (!template.isActive) continue

      if (this.matchesConditions(event, template.conditions)) {
        // Aplicar análise de IA para ajustar prioridade
        const adjustedPriority = this.adjustPriorityWithAI(template.priority, aiAnalysis)
        
        // Verificar preferências do usuário
        const userPrefs = await this.getUserPreferences(userId)
        const shouldSend = this.shouldSendNotification(userId, template, adjustedPriority, userPrefs)
        
        if (shouldSend) {
          const notification = await this.createNotification(
            userId,
            template,
            event,
            adjustedPriority,
            aiAnalysis
          )
          notifications.push(notification)
        }
      }
    }

    return notifications
  }

  /**
   * Analisar evento com IA para determinar contexto e prioridade
   */
  private async analyzeEventWithAI(event: any): Promise<any> {
    // Simular análise de IA
    const analysis = {
      urgency: this.calculateUrgency(event),
      impact: this.calculateImpact(event),
      context: this.extractContext(event),
      recommendations: this.generateRecommendations(event),
      riskLevel: this.assessRiskLevel(event)
    }

    return analysis
  }

  /**
   * Calcular urgência baseada em múltiplos fatores
   */
  private calculateUrgency(event: any): number {
    let urgency = 0

    // Fatores de urgência
    if (event.sla_breach) urgency += 40
    if (event.priority === 'high') urgency += 30
    if (event.priority === 'critical') urgency += 50
    if (event.type === 'security') urgency += 35
    if (event.affected_users > 10) urgency += 20
    if (event.financial_impact > 10000) urgency += 25

    return Math.min(urgency, 100)
  }

  /**
   * Calcular impacto do evento
   */
  private calculateImpact(event: any): number {
    let impact = 0

    // Fatores de impacto
    if (event.affected_users > 50) impact += 30
    if (event.financial_impact > 50000) impact += 40
    if (event.compliance_related) impact += 25
    if (event.customer_facing) impact += 35
    if (event.system_critical) impact += 45

    return Math.min(impact, 100)
  }

  /**
   * Extrair contexto do evento
   */
  private extractContext(event: any): any {
    return {
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      userRole: event.user_role,
      department: event.department,
      system: event.system,
      previousEvents: event.related_events || []
    }
  }

  /**
   * Gerar recomendações baseadas no evento
   */
  private generateRecommendations(event: any): string[] {
    const recommendations: string[] = []

    if (event.sla_breach) {
      recommendations.push('Revisar processo de atendimento')
      recommendations.push('Considerar escalação para equipe sênior')
    }

    if (event.type === 'security') {
      recommendations.push('Investigar origem do incidente')
      recommendations.push('Revisar logs de acesso')
    }

    if (event.priority === 'critical') {
      recommendations.push('Notificar stakeholders imediatamente')
      recommendations.push('Ativar procedimento de emergência')
    }

    return recommendations
  }

  /**
   * Avaliar nível de risco
   */
  private assessRiskLevel(event: any): 'low' | 'medium' | 'high' | 'critical' {
    const urgency = this.calculateUrgency(event)
    const impact = this.calculateImpact(event)
    const riskScore = (urgency + impact) / 2

    if (riskScore >= 80) return 'critical'
    if (riskScore >= 60) return 'high'
    if (riskScore >= 40) return 'medium'
    return 'low'
  }

  /**
   * Ajustar prioridade com base na análise de IA
   */
  private adjustPriorityWithAI(basePriority: string, aiAnalysis: any): string {
    const riskLevel = aiAnalysis.riskLevel
    const urgency = aiAnalysis.urgency

    // Ajustar prioridade baseada na análise
    if (riskLevel === 'critical' || urgency >= 80) {
      return 'urgent'
    } else if (riskLevel === 'high' || urgency >= 60) {
      return 'high'
    } else if (riskLevel === 'medium' || urgency >= 40) {
      return 'medium'
    }

    return basePriority
  }

  /**
   * Verificar se deve enviar notificação baseado nas preferências
   */
  private shouldSendNotification(
    userId: string,
    template: NotificationTemplate,
    priority: string,
    userPrefs: NotificationPreference[]
  ): boolean {
    // Verificar horário silencioso
    const now = new Date()
    const currentHour = now.getHours()
    
    for (const pref of userPrefs) {
      if (pref.quietHours.enabled) {
        const startHour = parseInt(pref.quietHours.start.split(':')[0])
        const endHour = parseInt(pref.quietHours.end.split(':')[0])
        
        if (currentHour >= startHour && currentHour <= endHour) {
          // Verificar se é urgente o suficiente para quebrar horário silencioso
          if (priority !== 'urgent' && priority !== 'critical') {
            return false
          }
        }
      }

      // Verificar filtro de prioridade
      if (pref.priority === 'high_only' && priority === 'low') {
        return false
      }
      if (pref.priority === 'urgent_only' && priority !== 'urgent' && priority !== 'critical') {
        return false
      }
    }

    return true
  }

  /**
   * Verificar se condições do template são atendidas
   */
  private matchesConditions(event: any, conditions: NotificationCondition[]): boolean {
    if (conditions.length === 0) return true

    let result = true
    let logicalOperator: 'AND' | 'OR' = 'AND'

    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i]
      const matches = this.evaluateCondition(event, condition)

      if (i === 0) {
        result = matches
      } else {
        if (logicalOperator === 'AND') {
          result = result && matches
        } else {
          result = result || matches
        }
      }

      logicalOperator = condition.logicalOperator || 'AND'
    }

    return result
  }

  /**
   * Avaliar condição individual
   */
  private evaluateCondition(event: any, condition: NotificationCondition): boolean {
    const value = event[condition.field]

    switch (condition.operator) {
      case 'equals':
        return value === condition.value
      case 'not_equals':
        return value !== condition.value
      case 'greater_than':
        return value > condition.value
      case 'less_than':
        return value < condition.value
      case 'contains':
        return String(value).includes(String(condition.value))
      case 'in':
        return Array.isArray(condition.value) ? condition.value.includes(value) : false
      default:
        return false
    }
  }

  /**
   * Criar notificação
   */
  private async createNotification(
    userId: string,
    template: NotificationTemplate,
    event: any,
    priority: string,
    aiAnalysis: any
  ): Promise<Notification> {
    const title = this.interpolateTemplate(template.title, event)
    const message = this.interpolateTemplate(template.message, event)

    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      templateId: template.id,
      title,
      message,
      type: template.type,
      priority,
      data: event,
      channels: template.channels,
      status: 'pending',
      metadata: {
        aiAnalysis,
        template: template.name,
        createdAt: new Date().toISOString()
      }
    }

    // Salvar no banco
    await this.saveNotification(notification)

    // Enviar pelos canais configurados
    await this.sendNotification(notification)

    return notification
  }

  /**
   * Interpolar template com dados do evento
   */
  private interpolateTemplate(template: string, event: any): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return event[key] !== undefined ? String(event[key]) : match
    })
  }

  /**
   * Salvar notificação no banco
   */
  private async saveNotification(notification: Notification): Promise<void> {
    try {
      await supabase
        .from('notificacoes')
        .insert({
          user_id: notification.userId,
          template_id: notification.templateId,
          titulo: notification.title,
          mensagem: notification.message,
          tipo: notification.type,
          prioridade: notification.priority,
          dados: notification.data,
          canais: notification.channels,
          status: notification.status,
          metadata: notification.metadata
        })
    } catch (error) {
      console.error('❌ Erro ao salvar notificação:', error)
    }
  }

  /**
   * Enviar notificação pelos canais configurados
   */
  private async sendNotification(notification: Notification): Promise<void> {
    for (const channel of notification.channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmail(notification)
            break
          case 'teams':
            await this.sendTeams(notification)
            break
          case 'whatsapp':
            await this.sendWhatsApp(notification)
            break
          case 'in_app':
            await this.sendInApp(notification)
            break
        }

        // Atualizar status
        await this.updateNotificationStatus(notification.id, 'sent')
      } catch (error) {
        console.error(`❌ Erro ao enviar notificação via ${channel}:`, error)
        await this.updateNotificationStatus(notification.id, 'failed')
      }
    }
  }

  /**
   * Enviar email
   */
  private async sendEmail(notification: Notification): Promise<void> {
    // Simular envio de email
    console.log('📧 Enviando email:', notification.title)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  /**
   * Enviar para Teams
   */
  private async sendTeams(notification: Notification): Promise<void> {
    // Simular envio para Teams
    console.log('💬 Enviando Teams:', notification.title)
    await new Promise(resolve => setTimeout(resolve, 800))
  }

  /**
   * Enviar WhatsApp
   */
  private async sendWhatsApp(notification: Notification): Promise<void> {
    // Simular envio WhatsApp
    console.log('📱 Enviando WhatsApp:', notification.title)
    await new Promise(resolve => setTimeout(resolve, 600))
  }

  /**
   * Enviar notificação in-app
   */
  private async sendInApp(notification: Notification): Promise<void> {
    // Simular notificação in-app
    console.log('🔔 Notificação in-app:', notification.title)
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  /**
   * Atualizar status da notificação
   */
  private async updateNotificationStatus(id: string, status: string): Promise<void> {
    try {
      await supabase
        .from('notificacoes')
        .update({ 
          status,
          enviado_em: status === 'sent' ? new Date().toISOString() : null
        })
        .eq('id', id)
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error)
    }
  }

  /**
   * Obter preferências do usuário
   */
  private async getUserPreferences(userId: string): Promise<NotificationPreference[]> {
    try {
      const { data, error } = await supabase
        .from('preferencias_notificacao')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao obter preferências:', error)
      return []
    }
  }

  /**
   * Obter notificações do usuário
   */
  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao obter notificações:', error)
      return []
    }
  }

  /**
   * Marcar notificação como lida
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await supabase
        .from('notificacoes')
        .update({ 
          status: 'read',
          lida_em: new Date().toISOString()
        })
        .eq('id', notificationId)
    } catch (error) {
      console.error('❌ Erro ao marcar como lida:', error)
    }
  }

  /**
   * Obter estatísticas de notificações
   */
  async getNotificationStats(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('view_estatisticas_notificacoes')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error)
      return []
    }
  }

  /**
   * Configurar preferências de notificação
   */
  async setNotificationPreferences(
    userId: string, 
    preferences: NotificationPreference[]
  ): Promise<void> {
    try {
      // Remover preferências existentes
      await supabase
        .from('preferencias_notificacao')
        .delete()
        .eq('user_id', userId)

      // Inserir novas preferências
      for (const pref of preferences) {
        await supabase
          .from('preferencias_notificacao')
          .insert({
            user_id: userId,
            canal: pref.channel,
            ativo: pref.isEnabled,
            horario_silencio: pref.quietHours,
            frequencia: pref.frequency,
            prioridade: pref.priority
          })
      }
    } catch (error) {
      console.error('❌ Erro ao configurar preferências:', error)
    }
  }
}

// Exportar instância singleton
export const intelligentNotificationService = IntelligentNotificationService.getInstance() 