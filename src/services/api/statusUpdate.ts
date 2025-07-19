import { createClient } from '@supabase/supabase-js'

interface StatusUpdateRequest {
  request_id: string
  new_status: string
  execution_time?: number // em segundos
  log?: string
  attachments?: Array<{
    name: string
    url: string
    type: string
  }>
  metadata?: Record<string, any>
  api_key?: string
}

interface StatusUpdateResponse {
  success: boolean
  message: string
  request_id: string
  updated_at: string
  execution_details?: {
    duration: number
    status: string
    log_entries: number
  }
}

export class StatusUpdateService {
  private supabase: any
  private static instance: StatusUpdateService

  constructor() {
    this.supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  static getInstance(): StatusUpdateService {
    if (!StatusUpdateService.instance) {
      StatusUpdateService.instance = new StatusUpdateService()
    }
    return StatusUpdateService.instance
  }

  /**
   * Atualiza status de uma solicitação via API
   */
  async updateRequestStatus(data: StatusUpdateRequest): Promise<StatusUpdateResponse> {
    try {
      // Validar dados
      if (!data.request_id || !data.new_status) {
        throw new Error('request_id e new_status são obrigatórios')
      }

      // Verificar se a solicitação existe
      const { data: request, error: requestError } = await this.supabase
        .from('requests')
        .select('id, title, project_id, current_state_id')
        .eq('id', data.request_id)
        .single()

      if (requestError || !request) {
        throw new Error('Solicitação não encontrada')
      }

      // Mapear status para estados do workflow
      const statusMapping = this.getStatusMapping(data.new_status)
      if (!statusMapping) {
        throw new Error(`Status '${data.new_status}' não reconhecido`)
      }

      // Encontrar estado correspondente
      const { data: targetState, error: stateError } = await this.supabase
        .from('workflow_states')
        .select('id, name')
        .eq('project_id', request.project_id)
        .eq('name', statusMapping)
        .single()

      if (stateError || !targetState) {
        throw new Error(`Estado '${statusMapping}' não encontrado no projeto`)
      }

      // Registrar mudança de status
      const { error: statusError } = await this.supabase
        .from('request_status_log')
        .insert({
          request_id: data.request_id,
          from_state_id: request.current_state_id,
          to_state_id: targetState.id,
          updated_by: '00000000-0000-0000-0000-000000000000', // System user
          comments: this.formatStatusComment(data)
        })

      if (statusError) throw statusError

      // Atualizar solicitação
      const updateData: any = {
        current_state_id: targetState.id,
        status: this.mapStatusToRequestStatus(data.new_status)
      }

      // Adicionar tempo de execução se fornecido
      if (data.execution_time) {
        updateData.actual_effort = Math.ceil(data.execution_time / 3600) // Converter para horas
      }

      const { error: updateError } = await this.supabase
        .from('requests')
        .update(updateData)
        .eq('id', data.request_id)

      if (updateError) throw updateError

      // Salvar log de execução
      if (data.log) {
        await this.saveExecutionLog(data.request_id, data.log, data.execution_time)
      }

      // Salvar anexos
      if (data.attachments && data.attachments.length > 0) {
        await this.saveAttachments(data.request_id, data.attachments)
      }

      // Registrar auditoria
      await this.logStatusUpdate(data.request_id, data)

      // Disparar notificações
      await this.triggerNotifications(data.request_id, data.new_status)

      return {
        success: true,
        message: `Status atualizado para: ${data.new_status}`,
        request_id: data.request_id,
        updated_at: new Date().toISOString(),
        execution_details: {
          duration: data.execution_time || 0,
          status: data.new_status,
          log_entries: data.log ? data.log.split('\n').length : 0
        }
      }

    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        request_id: data.request_id,
        updated_at: new Date().toISOString()
      }
    }
  }

  /**
   * Mapeia status externos para estados do workflow
   */
  private getStatusMapping(externalStatus: string): string | null {
    const mappings: Record<string, string> = {
      'executado_com_sucesso': 'Entregue',
      'executado_sucesso': 'Entregue',
      'sucesso': 'Entregue',
      'completed': 'Entregue',
      'success': 'Entregue',
      
      'erro_execucao': 'Em Revisão',
      'erro': 'Em Revisão',
      'error': 'Em Revisão',
      'failed': 'Em Revisão',
      
      'em_execucao': 'Em Desenvolvimento',
      'executando': 'Em Desenvolvimento',
      'running': 'Em Desenvolvimento',
      'in_progress': 'Em Desenvolvimento',
      
      'aguardando_dados': 'Em Análise',
      'waiting': 'Em Análise',
      'pending': 'Em Análise',
      
      'aprovado': 'Aprovado',
      'approved': 'Aprovado',
      
      'rejeitado': 'Rejeitado',
      'rejected': 'Rejeitado'
    }

    return mappings[externalStatus.toLowerCase()] || null
  }

  /**
   * Mapeia status para status interno da solicitação
   */
  private mapStatusToRequestStatus(externalStatus: string): string {
    const status = externalStatus.toLowerCase()
    
    if (status.includes('sucesso') || status.includes('success') || status.includes('completed')) {
      return 'completed'
    }
    
    if (status.includes('erro') || status.includes('error') || status.includes('failed')) {
      return 'rejected'
    }
    
    if (status.includes('execucao') || status.includes('running') || status.includes('progress')) {
      return 'in_progress'
    }
    
    if (status.includes('aguardando') || status.includes('waiting') || status.includes('pending')) {
      return 'pending'
    }
    
    return 'in_progress'
  }

  /**
   * Formata comentário para mudança de status
   */
  private formatStatusComment(data: StatusUpdateRequest): string {
    let comment = `Status atualizado via API: ${data.new_status}`
    
    if (data.execution_time) {
      comment += `\nTempo de execução: ${data.execution_time}s`
    }
    
    if (data.log) {
      const logLines = data.log.split('\n').length
      comment += `\nLog com ${logLines} entradas`
    }
    
    if (data.attachments && data.attachments.length > 0) {
      comment += `\n${data.attachments.length} anexo(s) incluído(s)`
    }
    
    return comment
  }

  /**
   * Salva log de execução
   */
  private async saveExecutionLog(requestId: string, log: string, executionTime?: number) {
    try {
      const { error } = await this.supabase
        .from('execution_logs')
        .insert({
          request_id: requestId,
          log_content: log,
          execution_time: executionTime,
          created_at: new Date().toISOString()
        })

      if (error) throw error
    } catch (error) {
      console.error('❌ Erro ao salvar log de execução:', error)
    }
  }

  /**
   * Salva anexos da execução
   */
  private async saveAttachments(requestId: string, attachments: Array<{name: string, url: string, type: string}>) {
    try {
      const attachmentData = attachments.map(att => ({
        request_id: requestId,
        name: att.name,
        url: att.url,
        type: att.type,
        created_at: new Date().toISOString()
      }))

      const { error } = await this.supabase
        .from('request_attachments')
        .insert(attachmentData)

      if (error) throw error
    } catch (error) {
      console.error('❌ Erro ao salvar anexos:', error)
    }
  }

  /**
   * Registra auditoria da atualização
   */
  private async logStatusUpdate(requestId: string, data: StatusUpdateRequest) {
    try {
      await this.supabase.rpc('log_action', {
        p_user_id: '00000000-0000-0000-0000-000000000000', // System user
        p_role: 'system',
        p_project_id: null, // Será obtido da solicitação
        p_resource_type: 'request_status_update',
        p_resource_id: requestId,
        p_resource_name: 'API Status Update',
        p_action: 'status_update',
        p_details: {
          new_status: data.new_status,
          execution_time: data.execution_time,
          has_log: !!data.log,
          has_attachments: !!(data.attachments && data.attachments.length > 0),
          source: 'external_api'
        }
      })
    } catch (error) {
      console.error('❌ Erro ao registrar auditoria:', error)
    }
  }

  /**
   * Dispara notificações sobre a mudança de status
   */
  private async triggerNotifications(requestId: string, newStatus: string) {
    try {
      // Obter dados da solicitação
      const { data: request } = await this.supabase
        .from('requests')
        .select('solicitante_id, assigned_to, project_id, title')
        .eq('id', requestId)
        .single()

      if (!request) return

      // Notificar solicitante
      await this.supabase.rpc('create_notification', {
        p_user_id: request.solicitante_id,
        p_project_id: request.project_id,
        p_type: 'request_status_change',
        p_title: 'Status Atualizado via Sistema',
        p_message: `Sua solicitação "${request.title}" foi atualizada para: ${newStatus}`,
        p_link: `/requests/${requestId}`,
        p_metadata: {
          request_id: requestId,
          new_status: newStatus,
          source: 'external_system'
        },
        p_priority: 'normal'
      })

      // Notificar executor se houver
      if (request.assigned_to) {
        await this.supabase.rpc('create_notification', {
          p_user_id: request.assigned_to,
          p_project_id: request.project_id,
          p_type: 'request_status_change',
          p_title: 'Status Atualizado via Sistema',
          p_message: `Solicitação "${request.title}" foi atualizada para: ${newStatus}`,
          p_link: `/requests/${requestId}`,
          p_metadata: {
            request_id: requestId,
            new_status: newStatus,
            source: 'external_system'
          },
          p_priority: 'normal'
        })
      }
    } catch (error) {
      console.error('❌ Erro ao disparar notificações:', error)
    }
  }

  /**
   * Valida API key (se configurado)
   */
  private validateApiKey(apiKey?: string): boolean {
    if (!process.env.API_KEY_REQUIRED || process.env.API_KEY_REQUIRED !== 'true') {
      return true // API key não é obrigatória
    }

    const validApiKey = process.env.VALID_API_KEY
    return apiKey === validApiKey
  }

  /**
   * Endpoint público para atualização de status
   */
  async handleStatusUpdate(data: StatusUpdateRequest): Promise<StatusUpdateResponse> {
    // Validar API key se necessário
    if (!this.validateApiKey(data.api_key)) {
      return {
        success: false,
        message: 'API key inválida ou não fornecida',
        request_id: data.request_id,
        updated_at: new Date().toISOString()
      }
    }

    return this.updateRequestStatus(data)
  }
}

// Exportar instância singleton
export const statusUpdateService = StatusUpdateService.getInstance()

// Função helper para uso em APIs
export async function updateRequestStatus(data: StatusUpdateRequest): Promise<StatusUpdateResponse> {
  return statusUpdateService.handleStatusUpdate(data)
} 