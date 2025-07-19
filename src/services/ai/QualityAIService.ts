import { supabase } from '../supabase/client'

export interface AINonConformityAnalysis {
  classification: 'procedimento' | 'conduta' | 'estrutura' | 'sistema' | 'equipamento' | 'material' | 'outro'
  severity: 'baixa' | 'media' | 'alta' | 'critica'
  justification: string
  action_plan: {
    what: string
    why: string
    who: string
    where: string
    when: string
    how: string
    how_much: string
  }
  similar_documents?: any[]
  confidence_score: number
}

export interface AIPOPGeneration {
  pop_content: {
    objetivo: string
    responsaveis: string
    materiais: string
    procedimento: string
    referencias: string
  }
  similar_pops?: any[]
  confidence_score: number
  suggestions: string[]
}

export interface AIDocumentReview {
  overall_score: number
  issues: Array<{
    type: 'clareza' | 'completude' | 'consistencia' | 'conformidade'
    description: string
    suggestion: string
  }>
  improvements: string[]
  compliance_check: {
    is_compliant: boolean
    missing_elements: string[]
    recommendations: string[]
  }
  similar_documents?: any[]
}

export interface AIKnowledgeBaseEntry {
  id: string
  title: string
  doc_type: string
  content_summary?: string
  similarity_score?: number
  department?: string
  process?: string
}

export interface AISession {
  id: string
  session_name: string
  session_type: string
  status: string
  progress_percentage: number
  started_at: string
  last_activity_at: string
}

export class QualityAIService {
  private static instance: QualityAIService

  public static getInstance(): QualityAIService {
    if (!QualityAIService.instance) {
      QualityAIService.instance = new QualityAIService()
    }
    return QualityAIService.instance
  }

  /**
   * Analisa uma não conformidade usando IA
   */
  async analyzeNonConformity(
    description: string,
    process: string,
    department: string,
    projectId: string
  ): Promise<AINonConformityAnalysis> {
    try {
      const { data, error } = await supabase.rpc('analyze_nonconformity_ai', {
        p_nc_description: description,
        p_process: process,
        p_department: department,
        p_project_id: projectId
      })

      if (error) throw error

      // Registrar interação
      await this.logAIInteraction('nc_analysis', {
        description,
        process,
        department,
        projectId
      }, data)

      return data
    } catch (error) {
      console.error('❌ Erro ao analisar NC com IA:', error)
      throw new Error('Erro ao analisar não conformidade')
    }
  }

  /**
   * Gera um POP usando IA
   */
  async generatePOP(
    title: string,
    objective: string,
    department: string,
    materials: string,
    steps: string,
    projectId: string
  ): Promise<AIPOPGeneration> {
    try {
      const { data, error } = await supabase.rpc('generate_pop_ai', {
        p_title: title,
        p_objective: objective,
        p_department: department,
        p_materials: materials,
        p_steps: steps,
        p_project_id: projectId
      })

      if (error) throw error

      // Registrar interação
      await this.logAIInteraction('document_generation', {
        title,
        objective,
        department,
        materials,
        steps,
        projectId
      }, data)

      return data
    } catch (error) {
      console.error('❌ Erro ao gerar POP com IA:', error)
      throw new Error('Erro ao gerar POP')
    }
  }

  /**
   * Revisa um documento usando IA
   */
  async reviewDocument(
    content: string,
    documentType: string,
    projectId: string
  ): Promise<AIDocumentReview> {
    try {
      const { data, error } = await supabase.rpc('review_document_ai', {
        p_document_content: content,
        p_document_type: documentType,
        p_project_id: projectId
      })

      if (error) throw error

      // Registrar interação
      await this.logAIInteraction('document_review', {
        content: content.substring(0, 500), // Primeiros 500 chars para log
        documentType,
        projectId
      }, data)

      return data
    } catch (error) {
      console.error('❌ Erro ao revisar documento com IA:', error)
      throw new Error('Erro ao revisar documento')
    }
  }

  /**
   * Busca conhecimento similar na base vetorial
   */
  async searchSimilarKnowledge(
    query: string,
    projectId?: string,
    docType?: string,
    limit: number = 5
  ): Promise<AIKnowledgeBaseEntry[]> {
    try {
      const { data, error } = await supabase.rpc('search_similar_knowledge', {
        p_query: query,
        p_project_id: projectId,
        p_doc_type: docType,
        p_limit: limit
      })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar conhecimento similar:', error)
      return []
    }
  }

  /**
   * Armazena conhecimento na base vetorial
   */
  async storeKnowledge(
    title: string,
    content: string,
    docType: string,
    projectId?: string,
    category?: string,
    department?: string,
    process?: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('store_knowledge', {
        p_title: title,
        p_content: content,
        p_doc_type: docType,
        p_project_id: projectId,
        p_category: category,
        p_department: department,
        p_process: process
      })

      if (error) throw error

      return data
    } catch (error) {
      console.error('❌ Erro ao armazenar conhecimento:', error)
      throw new Error('Erro ao armazenar conhecimento')
    }
  }

  /**
   * Cria uma nova sessão de IA
   */
  async createAISession(
    sessionName: string,
    sessionType: string,
    projectId: string,
    contextSummary?: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('ai_quality_sessions')
        .insert({
          session_name: sessionName,
          session_type: sessionType,
          project_id: projectId,
          context_summary: contextSummary,
          owner_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select('id')
        .single()

      if (error) throw error

      return data.id
    } catch (error) {
      console.error('❌ Erro ao criar sessão de IA:', error)
      throw new Error('Erro ao criar sessão de IA')
    }
  }

  /**
   * Atualiza progresso da sessão
   */
  async updateSessionProgress(
    sessionId: string,
    progress: number,
    currentStep?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_quality_sessions')
        .update({
          progress_percentage: progress,
          current_step: currentStep,
          last_activity_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) throw error
    } catch (error) {
      console.error('❌ Erro ao atualizar progresso da sessão:', error)
    }
  }

  /**
   * Finaliza uma sessão de IA
   */
  async completeAISession(sessionId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_quality_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress_percentage: 100
        })
        .eq('id', sessionId)

      if (error) throw error
    } catch (error) {
      console.error('❌ Erro ao finalizar sessão de IA:', error)
    }
  }

  /**
   * Obtém sessões ativas do usuário
   */
  async getActiveSessions(projectId?: string): Promise<AISession[]> {
    try {
      let query = supabase
        .from('ai_quality_sessions')
        .select('*')
        .eq('status', 'active')
        .order('last_activity_at', { ascending: false })

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar sessões ativas:', error)
      return []
    }
  }

  /**
   * Registra interação com IA para auditoria
   */
  private async logAIInteraction(
    operationType: string,
    inputData: any,
    outputData: any,
    sessionId?: string
  ): Promise<void> {
    try {
      await supabase.rpc('log_ai_interaction', {
        p_operation_type: operationType,
        p_input_data: inputData,
        p_output_data: outputData,
        p_session_id: sessionId
      })
    } catch (error) {
      console.error('❌ Erro ao registrar interação com IA:', error)
    }
  }

  /**
   * Obtém histórico de interações com IA
   */
  async getAIInteractionHistory(
    projectId?: string,
    operationType?: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('ai_quality_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      if (operationType) {
        query = query.eq('operation_type', operationType)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar histórico de IA:', error)
      return []
    }
  }

  /**
   * Fornece feedback sobre interação com IA
   */
  async provideFeedback(
    logId: string,
    feedback: string,
    rating: number
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_quality_logs')
        .update({
          user_feedback: feedback,
          feedback_rating: rating
        })
        .eq('id', logId)

      if (error) throw error
    } catch (error) {
      console.error('❌ Erro ao fornecer feedback:', error)
      throw new Error('Erro ao fornecer feedback')
    }
  }

  /**
   * Obtém estatísticas de uso da IA
   */
  async getAIUsageStats(projectId?: string, days: number = 30): Promise<any> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      let query = supabase
        .from('ai_quality_logs')
        .select('operation_type, status, tokens_used, processing_time_ms')
        .gte('created_at', startDate.toISOString())

      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error } = await query

      if (error) throw error

      // Calcular estatísticas
      const stats = {
        total_interactions: data?.length || 0,
        by_operation: {} as Record<string, number>,
        avg_tokens: 0,
        avg_processing_time: 0,
        success_rate: 0
      }

      if (data && data.length > 0) {
        // Contar por operação
        data.forEach(log => {
          stats.by_operation[log.operation_type] = (stats.by_operation[log.operation_type] || 0) + 1
        })

        // Calcular médias
        const totalTokens = data.reduce((sum, log) => sum + (log.tokens_used || 0), 0)
        const totalTime = data.reduce((sum, log) => sum + (log.processing_time_ms || 0), 0)
        const successful = data.filter(log => log.status === 'completed').length

        stats.avg_tokens = totalTokens / data.length
        stats.avg_processing_time = totalTime / data.length
        stats.success_rate = (successful / data.length) * 100
      }

      return stats
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de IA:', error)
      return {
        total_interactions: 0,
        by_operation: {},
        avg_tokens: 0,
        avg_processing_time: 0,
        success_rate: 0
      }
    }
  }
}

// Exportar instância singleton
export const qualityAIService = QualityAIService.getInstance() 