import { createClient } from '@supabase/supabase-js'

interface CommunicationEvent {
  user_id: string
  project_id: string
  request_id?: string
  event_type: 'new_request' | 'status_change' | 'ai_response' | 'approval_required' | 'completion'
  title: string
  message: string
  link?: string
  metadata?: Record<string, any>
}

interface CommunicationResult {
  success: boolean
  channels: Array<{
    channel: string
    id: string
    status: string
  }>
  error?: string
}

interface EmailTemplate {
  name: string
  subject: string
  body: string
  variables: string[]
}

interface TeamsCard {
  type: 'AdaptiveCard'
  version: string
  body: any[]
  actions?: any[]
}

export class CommunicationDispatcher {
  private supabase: any
  private static instance: CommunicationDispatcher

  constructor() {
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!
    )
  }

  static getInstance(): CommunicationDispatcher {
    if (!CommunicationDispatcher.instance) {
      CommunicationDispatcher.instance = new CommunicationDispatcher()
    }
    return CommunicationDispatcher.instance
  }

  /**
   * Despacha notificação para todos os canais configurados
   */
  async dispatch(event: CommunicationEvent): Promise<CommunicationResult> {
    try {
      const { data, error } = await this.supabase.rpc('dispatch_notification', {
        p_user_id: event.user_id,
        p_project_id: event.project_id,
        p_request_id: event.request_id,
        p_event_type: event.event_type,
        p_title: event.title,
        p_message: event.message,
        p_link: event.link,
        p_metadata: event.metadata || {}
      })

      if (error) throw error

      return {
        success: true,
        channels: data || []
      }
    } catch (error) {
      console.error('❌ Erro ao despachar notificação:', error)
      return {
        success: false,
        channels: [],
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Envia notificação de nova solicitação
   */
  async notifyNewRequest(requestData: {
    id: string
    title: string
    solicitante_id: string
    project_id: string
    priority: string
  }): Promise<CommunicationResult> {
    const event: CommunicationEvent = {
      user_id: requestData.solicitante_id,
      project_id: requestData.project_id,
      request_id: requestData.id,
      event_type: 'new_request',
      title: 'Solicitação Criada com Sucesso',
      message: `Sua solicitação "${requestData.title}" foi criada e está sendo processada.`,
      link: `/requests/${requestData.id}`,
      metadata: {
        request_title: requestData.title,
        priority: requestData.priority,
        created_at: new Date().toISOString()
      }
    }

    return this.dispatch(event)
  }

  /**
   * Envia notificação de mudança de status
   */
  async notifyStatusChange(statusData: {
    request_id: string
    user_id: string
    project_id: string
    from_status: string
    to_status: string
    request_title: string
    comments?: string
  }): Promise<CommunicationResult> {
    const event: CommunicationEvent = {
      user_id: statusData.user_id,
      project_id: statusData.project_id,
      request_id: statusData.request_id,
      event_type: 'status_change',
      title: 'Status da Solicitação Atualizado',
      message: `Sua solicitação "${statusData.request_title}" mudou de "${statusData.from_status}" para "${statusData.to_status}".`,
      link: `/requests/${statusData.request_id}`,
      metadata: {
        request_title: statusData.request_title,
        from_status: statusData.from_status,
        to_status: statusData.to_status,
        comments: statusData.comments,
        updated_at: new Date().toISOString()
      }
    }

    return this.dispatch(event)
  }

  /**
   * Envia notificação de resposta da IA
   */
  async notifyAIResponse(aiData: {
    request_id: string
    user_id: string
    project_id: string
    request_title: string
    ai_message: string
    thread_id: string
  }): Promise<CommunicationResult> {
    const event: CommunicationEvent = {
      user_id: aiData.user_id,
      project_id: aiData.project_id,
      request_id: aiData.request_id,
      event_type: 'ai_response',
      title: 'Resposta da IA',
      message: `IA respondeu sobre sua solicitação "${aiData.request_title}".`,
      link: `/requests/${aiData.request_id}/thread`,
      metadata: {
        request_title: aiData.request_title,
        thread_id: aiData.thread_id,
        message_preview: aiData.ai_message.substring(0, 100),
        responded_at: new Date().toISOString()
      }
    }

    return this.dispatch(event)
  }

  /**
   * Envia notificação de aprovação necessária
   */
  async notifyApprovalRequired(approvalData: {
    request_id: string
    gestor_id: string
    project_id: string
    request_title: string
    solicitante_name: string
  }): Promise<CommunicationResult> {
    const event: CommunicationEvent = {
      user_id: approvalData.gestor_id,
      project_id: approvalData.project_id,
      request_id: approvalData.request_id,
      event_type: 'approval_required',
      title: 'Aprovação Necessária',
      message: `Solicitação "${approvalData.request_title}" de ${approvalData.solicitante_name} aguarda sua aprovação.`,
      link: `/requests/${approvalData.request_id}`,
      metadata: {
        request_title: approvalData.request_title,
        solicitante_name: approvalData.solicitante_name,
        requires_immediate_attention: true,
        requested_at: new Date().toISOString()
      }
    }

    return this.dispatch(event)
  }

  /**
   * Envia notificação de conclusão
   */
  async notifyCompletion(completionData: {
    request_id: string
    user_id: string
    project_id: string
    request_title: string
    executor_name?: string
    delivery_notes?: string
  }): Promise<CommunicationResult> {
    const event: CommunicationEvent = {
      user_id: completionData.user_id,
      project_id: completionData.project_id,
      request_id: completionData.request_id,
      event_type: 'completion',
      title: 'Solicitação Concluída',
      message: `Sua solicitação "${completionData.request_title}" foi concluída com sucesso!`,
      link: `/requests/${completionData.request_id}`,
      metadata: {
        request_title: completionData.request_title,
        executor_name: completionData.executor_name,
        delivery_notes: completionData.delivery_notes,
        completed_at: new Date().toISOString()
      }
    }

    return this.dispatch(event)
  }

  /**
   * Gera template de e-mail
   */
  private generateEmailTemplate(template: EmailTemplate, data: Record<string, any>): { subject: string; body: string } {
    let subject = template.subject
    let body = template.body

    // Substituir variáveis
    template.variables.forEach(variable => {
      const value = data[variable] || ''
      const regex = new RegExp(`{{${variable}}}`, 'g')
      subject = subject.replace(regex, value)
      body = body.replace(regex, value)
    })

    return { subject, body }
  }

  /**
   * Gera card do Teams
   */
  private generateTeamsCard(data: {
    title: string
    message: string
    link?: string
    metadata?: Record<string, any>
  }): TeamsCard {
    const card: TeamsCard = {
      type: 'AdaptiveCard',
      version: '1.3',
      body: [
        {
          type: 'TextBlock',
          text: data.title,
          size: 'Large',
          weight: 'Bolder',
          color: 'Accent'
        },
        {
          type: 'TextBlock',
          text: data.message,
          wrap: true,
          spacing: 'Medium'
        }
      ],
      actions: []
    }

    // Adicionar botão de ação se houver link
    if (data.link) {
      card.actions?.push({
        type: 'Action.OpenUrl',
        title: 'Ver Detalhes',
        url: data.link
      })
    }

    // Adicionar metadata se houver
    if (data.metadata) {
      const facts = Object.entries(data.metadata).map(([key, value]) => ({
        title: key.charAt(0).toUpperCase() + key.slice(1),
        value: String(value)
      }))

      if (facts.length > 0) {
        card.body.push({
          type: 'FactSet',
          facts: facts
        })
      }
    }

    return card
  }

  /**
   * Envia e-mail usando template
   */
  async sendEmailWithTemplate(
    user_id: string,
    project_id: string,
    template_name: string,
    data: Record<string, any>
  ): Promise<boolean> {
    try {
      const templates: Record<string, EmailTemplate> = {
        new_request: {
          name: 'new_request',
          subject: 'Solicitação Criada: {{request_title}}',
          body: `
            <h2>Sua solicitação foi criada com sucesso!</h2>
            <p><strong>Título:</strong> {{request_title}}</p>
            <p><strong>Prioridade:</strong> {{priority}}</p>
            <p><strong>Data:</strong> {{created_at}}</p>
            <p>Acompanhe o progresso em: <a href="{{link}}">{{link}}</a></p>
          `,
          variables: ['request_title', 'priority', 'created_at', 'link']
        },
        status_change: {
          name: 'status_change',
          subject: 'Status Atualizado: {{request_title}}',
          body: `
            <h2>Status da sua solicitação foi atualizado</h2>
            <p><strong>Solicitação:</strong> {{request_title}}</p>
            <p><strong>Status Anterior:</strong> {{from_status}}</p>
            <p><strong>Novo Status:</strong> {{to_status}}</p>
            <p><strong>Data:</strong> {{updated_at}}</p>
            {{#if comments}}<p><strong>Comentários:</strong> {{comments}}</p>{{/if}}
            <p>Veja os detalhes em: <a href="{{link}}">{{link}}</a></p>
          `,
          variables: ['request_title', 'from_status', 'to_status', 'updated_at', 'comments', 'link']
        },
        completion: {
          name: 'completion',
          subject: 'Solicitação Concluída: {{request_title}}',
          body: `
            <h2>🎉 Sua solicitação foi concluída!</h2>
            <p><strong>Solicitação:</strong> {{request_title}}</p>
            <p><strong>Concluída em:</strong> {{completed_at}}</p>
            {{#if executor_name}}<p><strong>Executado por:</strong> {{executor_name}}</p>{{/if}}
            {{#if delivery_notes}}<p><strong>Observações:</strong> {{delivery_notes}}</p>{{/if}}
            <p>Acesse o resultado em: <a href="{{link}}">{{link}}</a></p>
          `,
          variables: ['request_title', 'completed_at', 'executor_name', 'delivery_notes', 'link']
        }
      }

      const template = templates[template_name]
      if (!template) {
        throw new Error(`Template '${template_name}' não encontrado`)
      }

      const { subject, body } = this.generateEmailTemplate(template, data)

      const { error } = await this.supabase.rpc('send_email_notification', {
        p_user_id: user_id,
        p_project_id: project_id,
        p_request_id: data.request_id,
        p_subject: subject,
        p_body: body,
        p_template_name: template_name
      })

      if (error) throw error
      return true
    } catch (error) {
      console.error('❌ Erro ao enviar e-mail:', error)
      return false
    }
  }

  /**
   * Envia mensagem Teams com card adaptativo
   */
  async sendTeamsWithCard(
    user_id: string,
    project_id: string,
    data: {
      title: string
      message: string
      link?: string
      metadata?: Record<string, any>
    }
  ): Promise<boolean> {
    try {
      const card = this.generateTeamsCard(data)

      const { error } = await this.supabase.rpc('send_teams_notification', {
        p_user_id: user_id,
        p_project_id: project_id,
        p_request_id: data.metadata?.request_id,
        p_message_text: data.message,
        p_card_data: card
      })

      if (error) throw error
      return true
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem Teams:', error)
      return false
    }
  }

  /**
   * Envia mensagem WhatsApp
   */
  async sendWhatsAppMessage(
    user_id: string,
    project_id: string,
    message: string,
    request_id?: string
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc('send_whatsapp_message', {
        p_user_id: user_id,
        p_project_id: project_id,
        p_request_id: request_id,
        p_message_text: message
      })

      if (error) throw error
      return true
    } catch (error) {
      console.error('❌ Erro ao enviar WhatsApp:', error)
      return false
    }
  }

  /**
   * Testa conectividade dos canais
   */
  async testChannels(project_id: string): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}

    try {
      // Teste de e-mail
      results.email = await this.sendEmailWithTemplate(
        '00000000-0000-0000-0000-000000000000', // System user
        project_id,
        'new_request',
        {
          request_title: 'Teste de Conectividade',
          priority: 'Baixa',
          created_at: new Date().toISOString(),
          link: 'https://milapp.com/test'
        }
      )
    } catch (error) {
      results.email = false
    }

    try {
      // Teste do Teams
      results.teams = await this.sendTeamsWithCard(
        '00000000-0000-0000-0000-000000000000', // System user
        project_id,
        {
          title: 'Teste de Conectividade',
          message: 'Este é um teste de conectividade do sistema MILAPP.',
          link: 'https://milapp.com/test',
          metadata: { test: true }
        }
      )
    } catch (error) {
      results.teams = false
    }

    try {
      // Teste do WhatsApp
      results.whatsapp = await this.sendWhatsAppMessage(
        '00000000-0000-0000-0000-000000000000', // System user
        project_id,
        'Teste de conectividade MILAPP - ' + new Date().toISOString()
      )
    } catch (error) {
      results.whatsapp = false
    }

    return results
  }

  /**
   * Obtém estatísticas de comunicação
   */
  async getCommunicationStats(project_id: string, start_date?: string, end_date?: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('communication_stats')
        .select('*')
        .eq('project_id', project_id)
        .gte('created_at', start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .lte('created_at', end_date || new Date().toISOString())
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error)
      return null
    }
  }
}

// Exportar instância singleton
export const communicationDispatcher = CommunicationDispatcher.getInstance()

// Funções helper para uso direto
export const notifyNewRequest = (data: any) => communicationDispatcher.notifyNewRequest(data)
export const notifyStatusChange = (data: any) => communicationDispatcher.notifyStatusChange(data)
export const notifyAIResponse = (data: any) => communicationDispatcher.notifyAIResponse(data)
export const notifyApprovalRequired = (data: any) => communicationDispatcher.notifyApprovalRequired(data)
export const notifyCompletion = (data: any) => communicationDispatcher.notifyCompletion(data) 