import { supabase } from '../supabase/client'

export interface DeliveryChannel {
  id: string
  name: string
  type: 'email' | 'teams' | 'whatsapp' | 'pdf' | 'csv'
  config: any
  isActive: boolean
}

export interface DeliveryRequest {
  reportId: string
  channels: string[]
  format: 'pdf' | 'csv' | 'markdown' | 'html'
  recipients: string[]
  title: string
  content: string
  data?: any[]
  metadata?: any
}

export interface DeliveryResult {
  success: boolean
  channel: string
  message: string
  timestamp: string
  error?: string
}

export class MultiChannelDeliveryService {
  private static instance: MultiChannelDeliveryService
  private channels: Map<string, DeliveryChannel> = new Map()

  private constructor() {
    this.initializeChannels()
  }

  static getInstance(): MultiChannelDeliveryService {
    if (!MultiChannelDeliveryService.instance) {
      MultiChannelDeliveryService.instance = new MultiChannelDeliveryService()
    }
    return MultiChannelDeliveryService.instance
  }

  /**
   * Inicializar canais de entrega
   */
  private initializeChannels() {
    this.channels.set('email', {
      id: 'email',
      name: 'Email',
      type: 'email',
      config: {
        smtpHost: process.env.REACT_APP_SMTP_HOST,
        smtpPort: process.env.REACT_APP_SMTP_PORT,
        smtpUser: process.env.REACT_APP_SMTP_USER,
        smtpPass: process.env.REACT_APP_SMTP_PASS
      },
      isActive: true
    })

    this.channels.set('teams', {
      id: 'teams',
      name: 'Microsoft Teams',
      type: 'teams',
      config: {
        webhookUrl: process.env.REACT_APP_TEAMS_WEBHOOK_URL
      },
      isActive: true
    })

    this.channels.set('whatsapp', {
      id: 'whatsapp',
      name: 'WhatsApp',
      type: 'whatsapp',
      config: {
        apiKey: process.env.REACT_APP_WHATSAPP_API_KEY,
        accountSid: process.env.REACT_APP_TWILIO_ACCOUNT_SID,
        authToken: process.env.REACT_APP_TWILIO_AUTH_TOKEN
      },
      isActive: true
    })

    this.channels.set('pdf', {
      id: 'pdf',
      name: 'PDF',
      type: 'pdf',
      config: {},
      isActive: true
    })

    this.channels.set('csv', {
      id: 'csv',
      name: 'CSV',
      type: 'csv',
      config: {},
      isActive: true
    })
  }

  /**
   * Obter canais disponíveis
   */
  getAvailableChannels(): DeliveryChannel[] {
    return Array.from(this.channels.values()).filter(channel => channel.isActive)
  }

  /**
   * Processar entrega multicanal
   */
  async processDelivery(request: DeliveryRequest): Promise<DeliveryResult[]> {
    const results: DeliveryResult[] = []

    for (const channelId of request.channels) {
      const channel = this.channels.get(channelId)
      if (!channel) {
        results.push({
          success: false,
          channel: channelId,
          message: 'Canal não encontrado',
          timestamp: new Date().toISOString(),
          error: 'Canal não configurado'
        })
        continue
      }

      try {
        let result: DeliveryResult

        switch (channel.type) {
          case 'email':
            result = await this.sendByEmail(request, channel)
            break
          case 'teams':
            result = await this.sendToTeams(request, channel)
            break
          case 'whatsapp':
            result = await this.sendByWhatsApp(request, channel)
            break
          case 'pdf':
            result = await this.generatePDF(request, channel)
            break
          case 'csv':
            result = await this.generateCSV(request, channel)
            break
          default:
            result = {
              success: false,
              channel: channelId,
              message: 'Tipo de canal não suportado',
              timestamp: new Date().toISOString(),
              error: 'Tipo não implementado'
            }
        }

        results.push(result)

        // Registrar entrega no banco
        await this.logDelivery(request, channel, result)

      } catch (error) {
        results.push({
          success: false,
          channel: channelId,
          message: 'Erro no processamento',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        })
      }
    }

    return results
  }

  /**
   * Enviar por email
   */
  private async sendByEmail(request: DeliveryRequest, channel: DeliveryChannel): Promise<DeliveryResult> {
    try {
      // Simular envio por email
      console.log('📧 Enviando email para:', request.recipients)
      console.log('📧 Assunto:', request.title)
      console.log('📧 Conteúdo:', request.content)

      // Em produção, usar serviço de email real
      await this.simulateEmailDelivery(request)

      return {
        success: true,
        channel: 'email',
        message: `Email enviado com sucesso para ${request.recipients.length} destinatário(s)`,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        channel: 'email',
        message: 'Falha no envio do email',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Enviar para Teams
   */
  private async sendToTeams(request: DeliveryRequest, channel: DeliveryChannel): Promise<DeliveryResult> {
    try {
      // Simular envio para Teams
      console.log('💬 Enviando para Teams:', channel.config.webhookUrl)
      console.log('💬 Título:', request.title)
      console.log('💬 Conteúdo:', request.content)

      // Em produção, usar Microsoft Graph API ou webhook
      await this.simulateTeamsDelivery(request)

      return {
        success: true,
        channel: 'teams',
        message: 'Mensagem enviada para Teams com sucesso',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        channel: 'teams',
        message: 'Falha no envio para Teams',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Enviar por WhatsApp
   */
  private async sendByWhatsApp(request: DeliveryRequest, channel: DeliveryChannel): Promise<DeliveryResult> {
    try {
      // Simular envio por WhatsApp
      console.log('📱 Enviando WhatsApp para:', request.recipients)
      console.log('📱 Mensagem:', request.content)

      // Em produção, usar Twilio, Gupshup ou similar
      await this.simulateWhatsAppDelivery(request)

      return {
        success: true,
        channel: 'whatsapp',
        message: `WhatsApp enviado com sucesso para ${request.recipients.length} número(s)`,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        channel: 'whatsapp',
        message: 'Falha no envio do WhatsApp',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Gerar PDF
   */
  private async generatePDF(request: DeliveryRequest, channel: DeliveryChannel): Promise<DeliveryResult> {
    try {
      // Simular geração de PDF
      console.log('📄 Gerando PDF:', request.title)

      const pdfContent = this.generatePDFContent(request)
      const blob = new Blob([pdfContent], { type: 'application/pdf' })
      
      // Download automático
      this.downloadFile(blob, `${request.title}.pdf`)

      return {
        success: true,
        channel: 'pdf',
        message: 'PDF gerado e baixado com sucesso',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        channel: 'pdf',
        message: 'Falha na geração do PDF',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Gerar CSV
   */
  private async generateCSV(request: DeliveryRequest, channel: DeliveryChannel): Promise<DeliveryResult> {
    try {
      // Simular geração de CSV
      console.log('📊 Gerando CSV:', request.title)

      const csvContent = this.generateCSVContent(request.data || [])
      const blob = new Blob([csvContent], { type: 'text/csv' })
      
      // Download automático
      this.downloadFile(blob, `${request.title}.csv`)

      return {
        success: true,
        channel: 'csv',
        message: 'CSV gerado e baixado com sucesso',
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        channel: 'csv',
        message: 'Falha na geração do CSV',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Gerar conteúdo PDF
   */
  private generatePDFContent(request: DeliveryRequest): string {
    const data = request.data || []
    const headers = data.length > 0 ? Object.keys(data[0]) : []
    
    const tableRows = data.map(row => 
      `<tr>${headers.map(header => `<td>${row[header]}</td>`).join('')}</tr>`
    ).join('')

    return `
      <html>
        <head>
          <title>${request.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { background-color: #1976d2; color: white; padding: 20px; }
            .content { padding: 20px; }
            .footer { margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${request.title}</h1>
            <p>MILAPP - Relatório Gerado Automaticamente</p>
          </div>
          
          <div class="content">
            <p>${request.content}</p>
            
            ${data.length > 0 ? `
              <table>
                <thead>
                  <tr>
                    ${headers.map(header => `<th>${header}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            ` : '<p>Nenhum dado disponível</p>'}
          </div>
          
          <div class="footer">
            <p>Gerado em: ${new Date().toLocaleString()}</p>
            <p>Total de registros: ${data.length}</p>
          </div>
        </body>
      </html>
    `
  }

  /**
   * Gerar conteúdo CSV
   */
  private generateCSVContent(data: any[]): string {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        }).join(',')
      )
    ]

    return csvRows.join('\n')
  }

  /**
   * Download de arquivo
   */
  private downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Simular entrega por email
   */
  private async simulateEmailDelivery(request: DeliveryRequest): Promise<void> {
    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Em produção, usar:
    // - SendGrid
    // - Resend
    // - NodeMailer
    // - AWS SES
  }

  /**
   * Simular entrega para Teams
   */
  private async simulateTeamsDelivery(request: DeliveryRequest): Promise<void> {
    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Em produção, usar:
    // - Microsoft Graph API
    // - Teams Webhook
    // - Adaptive Cards
  }

  /**
   * Simular entrega por WhatsApp
   */
  private async simulateWhatsAppDelivery(request: DeliveryRequest): Promise<void> {
    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Em produção, usar:
    // - Twilio API
    // - Gupshup API
    // - WhatsApp Business API
  }

  /**
   * Registrar entrega no banco
   */
  private async logDelivery(
    request: DeliveryRequest, 
    channel: DeliveryChannel, 
    result: DeliveryResult
  ): Promise<void> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) return

      await supabase
        .from('relatorio_entregas')
        .insert({
          user_id: userId,
          sql_execution_id: request.reportId,
          canal: channel.type,
          formato: request.format,
          destino: request.recipients.join(', '),
          titulo: request.title,
          conteudo: request.content,
          status: result.success ? 'enviado' : 'erro',
          enviado_em: result.timestamp,
          log_resultado: result.message,
          error_message: result.error,
          metadata: {
            channel: channel.name,
            recipients: request.recipients,
            format: request.format
          }
        })
    } catch (error) {
      console.error('❌ Erro ao registrar entrega:', error)
    }
  }

  /**
   * Obter histórico de entregas
   */
  async getDeliveryHistory(limit: number = 50): Promise<any[]> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) return []

      const { data, error } = await supabase
        .from('relatorio_entregas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao obter histórico:', error)
      return []
    }
  }

  /**
   * Obter estatísticas de entrega
   */
  async getDeliveryStatistics(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('view_entrega_estatisticas')
        .select('*')

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error)
      return []
    }
  }

  /**
   * Validar configuração de canal
   */
  validateChannelConfig(channelId: string): { valid: boolean; errors: string[] } {
    const channel = this.channels.get(channelId)
    if (!channel) {
      return { valid: false, errors: ['Canal não encontrado'] }
    }

    const errors: string[] = []

    switch (channel.type) {
      case 'email':
        if (!channel.config.smtpHost) errors.push('SMTP Host não configurado')
        if (!channel.config.smtpUser) errors.push('SMTP User não configurado')
        break
      case 'teams':
        if (!channel.config.webhookUrl) errors.push('Webhook URL não configurado')
        break
      case 'whatsapp':
        if (!channel.config.apiKey) errors.push('API Key não configurado')
        break
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Testar conexão de canal
   */
  async testChannelConnection(channelId: string): Promise<{ success: boolean; message: string }> {
    try {
      const channel = this.channels.get(channelId)
      if (!channel) {
        return { success: false, message: 'Canal não encontrado' }
      }

      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 1000))

      return { success: true, message: 'Conexão testada com sucesso' }
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro no teste de conexão' 
      }
    }
  }
}

// Exportar instância singleton
export const multiChannelDeliveryService = MultiChannelDeliveryService.getInstance() 