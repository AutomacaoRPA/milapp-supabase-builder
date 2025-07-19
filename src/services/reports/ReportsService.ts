import { supabase } from '../supabase/client'

export interface ReportQuery {
  prompt: string
  category?: string
  filters?: any
  format?: 'table' | 'chart' | 'markdown' | 'pdf' | 'csv'
}

export interface ReportResult {
  success: boolean
  data: any[]
  sql: string
  explanation: string
  metadata: {
    totalRows: number
    executionTime: number
    columns: string[]
  }
}

export interface DeliveryRequest {
  reportId: string
  channels: string[]
  format: string
  recipients: string[]
  title?: string
  message?: string
}

export interface SavedReport {
  id: string
  name: string
  description: string
  category: string
  prompt: string
  sql: string
  parameters: any
  isActive: boolean
  createdAt: string
}

export class ReportsService {
  private static instance: ReportsService

  private constructor() {}

  static getInstance(): ReportsService {
    if (!ReportsService.instance) {
      ReportsService.instance = new ReportsService()
    }
    return ReportsService.instance
  }

  /**
   * Executar consulta IA em linguagem natural
   */
  async executeAIQuery(query: ReportQuery): Promise<ReportResult> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) {
        throw new Error('Usuário não autenticado')
      }

      // Obter projeto atual (simulado)
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .limit(1)

      const projectId = projects?.[0]?.id || 'default'

      // Gerar SQL baseado no prompt (simulado - em produção usar IA real)
      const generatedSQL = this.generateSQLFromPrompt(query.prompt)
      
      // Executar query segura
      const { data, error } = await supabase.rpc('execute_safe_sql_query', {
        p_user_id: userId,
        p_project_id: projectId,
        p_prompt_text: query.prompt,
        p_generated_sql: generatedSQL
      })

      if (error) throw error

      // Gerar explicação IA
      const explanation = this.generateExplanation(query.prompt, data)

      return {
        success: true,
        data: data.data || [],
        sql: generatedSQL,
        explanation,
        metadata: {
          totalRows: data.metadata?.total_rows || 0,
          executionTime: 0,
          columns: data.metadata?.columns || []
        }
      }

    } catch (error) {
      console.error('❌ Erro ao executar query IA:', error)
      throw new Error('Erro ao processar consulta IA')
    }
  }

  /**
   * Gerar SQL a partir de prompt em linguagem natural
   */
  private generateSQLFromPrompt(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase()
    
    // Mapeamento de prompts para SQL (simulado)
    if (lowerPrompt.includes('solicitações abertas') || lowerPrompt.includes('tickets abertos')) {
      return `
        SELECT 
          c.title as titulo,
          c.status,
          c.created_at,
          u.full_name as solicitante,
          s.name as setor
        FROM public.cards c
        LEFT JOIN public.users u ON c.user_id = u.id
        LEFT JOIN public.departments s ON u.department_id = s.id
        WHERE c.status != 'completed'
        AND c.created_at >= NOW() - INTERVAL '30 days'
        ORDER BY c.created_at DESC
      `
    }
    
    if (lowerPrompt.includes('tempo médio') || lowerPrompt.includes('sla')) {
      return `
        SELECT 
          s.name as setor,
          COUNT(*) as total_solicitacoes,
          AVG(EXTRACT(EPOCH FROM (COALESCE(c.resolved_at, NOW()) - c.created_at))/3600) as tempo_medio_horas
        FROM public.cards c
        LEFT JOIN public.users u ON c.user_id = u.id
        LEFT JOIN public.departments s ON u.department_id = s.id
        WHERE c.created_at >= NOW() - INTERVAL '90 days'
        GROUP BY s.name
        ORDER BY tempo_medio_horas DESC
      `
    }
    
    if (lowerPrompt.includes('fluxos') && lowerPrompt.includes('falhas')) {
      return `
        SELECT 
          w.name as nome_fluxo,
          COUNT(*) as total_execucoes,
          COUNT(CASE WHEN w.status = 'failed' THEN 1 END) as falhas
        FROM public.workflows w
        WHERE w.created_at >= NOW() - INTERVAL '15 days'
        GROUP BY w.name
        HAVING COUNT(CASE WHEN w.status = 'failed' THEN 1 END) > 0
        ORDER BY falhas DESC
      `
    }
    
    if (lowerPrompt.includes('não conformidades') || lowerPrompt.includes('ncs')) {
      return `
        SELECT 
          nc.title as titulo,
          nc.severity as severidade,
          s.name as setor,
          COUNT(*) as reincidencias
        FROM public.non_conformities nc
        LEFT JOIN public.departments s ON nc.department_id = s.id
        WHERE nc.created_at >= NOW() - INTERVAL '90 days'
        GROUP BY nc.title, nc.severity, s.name
        ORDER BY reincidencias DESC
        LIMIT 10
      `
    }
    
    // Query padrão
    return `
      SELECT 
        'Dados simulados' as coluna1,
        'Para demonstração' as coluna2
      LIMIT 5
    `
  }

  /**
   * Gerar explicação IA dos resultados
   */
  private generateExplanation(prompt: string, data: any): string {
    const lowerPrompt = prompt.toLowerCase()
    
    if (lowerPrompt.includes('solicitações abertas')) {
      return `Analisei as solicitações abertas dos últimos 30 dias. Encontrei ${data.data?.length || 0} solicitações em aberto. O setor com mais solicitações pendentes é o que requer mais atenção. Recomendo priorizar a resolução das solicitações mais antigas.`
    }
    
    if (lowerPrompt.includes('tempo médio')) {
      return `O tempo médio de resolução varia significativamente entre setores. Alguns setores estão dentro do SLA, enquanto outros precisam de otimização. Recomendo investigar os processos dos setores com maior tempo médio.`
    }
    
    if (lowerPrompt.includes('fluxos') && lowerPrompt.includes('falhas')) {
      return `Identifiquei fluxos com falhas nos últimos 15 dias. Os fluxos com maior taxa de falha precisam de revisão. Recomendo analisar os logs de erro e otimizar os pontos de falha.`
    }
    
    if (lowerPrompt.includes('não conformidades')) {
      return `As não conformidades com maior reincidência indicam problemas sistêmicos. Recomendo implementar ações corretivas preventivas e revisar os processos relacionados.`
    }
    
    return `Análise concluída com sucesso. Os dados foram processados e estão prontos para análise. Recomendo revisar os resultados e tomar ações baseadas nos insights identificados.`
  }

  /**
   * Obter relatórios salvos do usuário
   */
  async getSavedReports(): Promise<SavedReport[]> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) return []

      const { data, error } = await supabase
        .from('relatorios_salvos')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao obter relatórios salvos:', error)
      return []
    }
  }

  /**
   * Salvar relatório
   */
  async saveReport(report: Omit<SavedReport, 'id' | 'createdAt'>): Promise<string> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) {
        throw new Error('Usuário não autenticado')
      }

      const { data, error } = await supabase
        .from('relatorios_salvos')
        .insert({
          user_id: userId,
          project_id: 'default-project-id',
          nome: report.name,
          descricao: report.description,
          categoria: report.category,
          prompt_original: report.prompt,
          sql_generated: report.sql,
          parametros: report.parameters
        })
        .select('id')
        .single()

      if (error) throw error

      return data.id
    } catch (error) {
      console.error('❌ Erro ao salvar relatório:', error)
      throw new Error('Erro ao salvar relatório')
    }
  }

  /**
   * Executar relatório salvo
   */
  async executeSavedReport(reportId: string): Promise<ReportResult> {
    try {
      const { data: report, error } = await supabase
        .from('relatorios_salvos')
        .select('*')
        .eq('id', reportId)
        .single()

      if (error) throw error

      // Executar query salva
      const result = await this.executeAIQuery({
        prompt: report.prompt_original,
        category: report.categoria
      })

      return result
    } catch (error) {
      console.error('❌ Erro ao executar relatório salvo:', error)
      throw new Error('Erro ao executar relatório salvo')
    }
  }

  /**
   * Agendar entrega de relatório
   */
  async scheduleDelivery(delivery: DeliveryRequest): Promise<string> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) {
        throw new Error('Usuário não autenticado')
      }

      // Simular ID de execução SQL
      const sqlExecutionId = 'mock-execution-id'

      const { data, error } = await supabase.rpc('schedule_report_delivery', {
        p_user_id: userId,
        p_sql_execution_id: sqlExecutionId,
        p_canal: delivery.channels[0], // Primeiro canal
        p_formato: delivery.format,
        p_destino: delivery.recipients.join(', '),
        p_titulo: delivery.title || 'Relatório MILAPP',
        p_conteudo: delivery.message || 'Relatório gerado automaticamente'
      })

      if (error) throw error

      return data.delivery_id
    } catch (error) {
      console.error('❌ Erro ao agendar entrega:', error)
      throw new Error('Erro ao agendar entrega')
    }
  }

  /**
   * Enviar relatório por email
   */
  async sendByEmail(recipients: string[], subject: string, content: string, attachment?: any): Promise<boolean> {
    try {
      // Simular envio por email
      console.log('📧 Enviando email para:', recipients)
      console.log('📧 Assunto:', subject)
      console.log('📧 Conteúdo:', content)
      
      // Em produção, integrar com serviço de email (SendGrid, Resend, etc.)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return true
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error)
      return false
    }
  }

  /**
   * Enviar relatório para Teams
   */
  async sendToTeams(webhookUrl: string, content: string, attachment?: any): Promise<boolean> {
    try {
      // Simular envio para Teams
      console.log('💬 Enviando para Teams:', webhookUrl)
      console.log('💬 Conteúdo:', content)
      
      // Em produção, usar Microsoft Graph API ou webhook
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      return true
    } catch (error) {
      console.error('❌ Erro ao enviar para Teams:', error)
      return false
    }
  }

  /**
   * Enviar relatório por WhatsApp
   */
  async sendByWhatsApp(phoneNumber: string, message: string, attachment?: any): Promise<boolean> {
    try {
      // Simular envio por WhatsApp
      console.log('📱 Enviando WhatsApp para:', phoneNumber)
      console.log('📱 Mensagem:', message)
      
      // Em produção, integrar com Twilio, Gupshup ou similar
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return true
    } catch (error) {
      console.error('❌ Erro ao enviar WhatsApp:', error)
      return false
    }
  }

  /**
   * Gerar PDF do relatório
   */
  async generatePDF(data: any[], title: string): Promise<Blob> {
    try {
      // Simular geração de PDF
      const content = `
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { border-collapse: collapse; width: 100%; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <p>Gerado em: ${new Date().toLocaleString()}</p>
            <table>
              <thead>
                <tr>
                  ${Object.keys(data[0] || {}).map(key => `<th>${key}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${data.map(row => 
                  `<tr>${Object.values(row).map(value => `<td>${value}</td>`).join('')}</tr>`
                ).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `
      
      // Em produção, usar jsPDF ou Puppeteer
      const blob = new Blob([content], { type: 'text/html' })
      return blob
    } catch (error) {
      console.error('❌ Erro ao gerar PDF:', error)
      throw new Error('Erro ao gerar PDF')
    }
  }

  /**
   * Gerar CSV do relatório
   */
  async generateCSV(data: any[]): Promise<Blob> {
    try {
      if (data.length === 0) {
        return new Blob([''], { type: 'text/csv' })
      }

      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => 
            typeof row[header] === 'string' && row[header].includes(',') 
              ? `"${row[header]}"` 
              : row[header]
          ).join(',')
        )
      ].join('\n')

      return new Blob([csvContent], { type: 'text/csv' })
    } catch (error) {
      console.error('❌ Erro ao gerar CSV:', error)
      throw new Error('Erro ao gerar CSV')
    }
  }

  /**
   * Obter estatísticas de relatórios
   */
  async getReportStatistics(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('view_relatorio_estatisticas')
        .select('*')
        .single()

      if (error) throw error

      return data || {}
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error)
      return {}
    }
  }

  /**
   * Obter estatísticas de entregas
   */
  async getDeliveryStatistics(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('view_entrega_estatisticas')
        .select('*')

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de entrega:', error)
      return []
    }
  }

  /**
   * Download de relatório
   */
  downloadReport(data: any[], format: 'pdf' | 'csv', filename: string): void {
    try {
      let blob: Blob
      let mimeType: string

      if (format === 'pdf') {
        blob = new Blob(['PDF content would be generated here'], { type: 'application/pdf' })
        mimeType = 'application/pdf'
      } else {
        const csvContent = this.generateCSVContent(data)
        blob = new Blob([csvContent], { type: 'text/csv' })
        mimeType = 'text/csv'
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('❌ Erro ao fazer download:', error)
      throw new Error('Erro ao fazer download')
    }
  }

  /**
   * Gerar conteúdo CSV
   */
  private generateCSVContent(data: any[]): string {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    return [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          typeof row[header] === 'string' && row[header].includes(',') 
            ? `"${row[header]}"` 
            : row[header]
        ).join(',')
      )
    ].join('\n')
  }

  /**
   * Processar entrega multicanal
   */
  async processMultiChannelDelivery(
    data: any[],
    channels: string[],
    format: string,
    recipients: string[],
    title: string,
    message?: string
  ): Promise<{ success: boolean; results: any[] }> {
    const results = []

    for (const channel of channels) {
      try {
        let success = false

        switch (channel) {
          case 'email':
            success = await this.sendByEmail(recipients, title, message || '', data)
            break
          case 'teams':
            success = await this.sendToTeams(recipients[0], message || '', data)
            break
          case 'whatsapp':
            success = await this.sendByWhatsApp(recipients[0], message || '', data)
            break
          case 'pdf':
            const pdfBlob = await this.generatePDF(data, title)
            this.downloadReport(data, 'pdf', title)
            success = true
            break
          case 'csv':
            const csvBlob = await this.generateCSV(data)
            this.downloadReport(data, 'csv', title)
            success = true
            break
        }

        results.push({
          channel,
          success,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        results.push({
          channel,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: new Date().toISOString()
        })
      }
    }

    return {
      success: results.some(r => r.success),
      results
    }
  }
}

// Exportar instância singleton
export const reportsService = ReportsService.getInstance() 