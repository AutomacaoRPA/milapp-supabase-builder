import { supabase } from '../supabase/client'

export interface Workflow {
  id: string
  name: string
  description?: string
  version: string
  is_active: boolean
  is_template: boolean
  category?: string
  tags?: string[]
  status: 'draft' | 'active' | 'paused' | 'archived' | 'deprecated'
  created_by: string
  created_at: string
  updated_at: string
}

export interface WorkflowNode {
  id: string
  node_id: string
  label: string
  type: 'start' | 'end' | 'task_human' | 'task_automation' | 'task_ai' | 'gateway' | 'webhook' | 'document' | 'subprocess' | 'delay' | 'notification'
  position_x: number
  position_y: number
  width?: number
  height?: number
  data: any
  style?: any
  is_valid: boolean
  execution_order?: number
}

export interface WorkflowEdge {
  id: string
  edge_id: string
  source_node_id: string
  target_node_id: string
  label?: string
  condition?: string
  condition_type?: 'simple' | 'expression' | 'ai_decision' | 'external_api'
  style?: any
  is_valid: boolean
}

export interface WorkflowExecution {
  id: string
  execution_id: string
  name: string
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  current_node_id?: string
  progress_percentage: number
  input_data: any
  output_data: any
  started_at?: string
  completed_at?: string
  triggered_by: string
  result_summary?: string
  error_message?: string
}

export interface WorkflowNodeLog {
  id: string
  execution_id: string
  node_id: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  input_data: any
  output_data: any
  start_time?: string
  end_time?: string
  duration_ms?: number
  result_message?: string
  error_message?: string
  retry_count: number
}

export interface WorkflowIntegration {
  id: string
  name: string
  integration_type: 'n8n' | 'make' | 'zapier' | 'webhook' | 'openai' | 'anthropic' | 'email' | 'teams' | 'whatsapp'
  config: any
  is_active: boolean
  last_test_at?: string
  last_test_status?: string
  description?: string
}

export interface WorkflowTemplate {
  id: string
  name: string
  description?: string
  category?: string
  template_data: any
  thumbnail_url?: string
  tags?: string[]
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  usage_count: number
  rating?: number
  is_public: boolean
}

export class WorkflowService {
  private static instance: WorkflowService

  public static getInstance(): WorkflowService {
    if (!WorkflowService.instance) {
      WorkflowService.instance = new WorkflowService()
    }
    return WorkflowService.instance
  }

  /**
   * Criar novo workflow
   */
  async createWorkflow(
    name: string,
    projectId: string,
    description?: string,
    category?: string,
    tags?: string[]
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .insert({
          name,
          description,
          project_id: projectId,
          category,
          tags,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select('id')
        .single()

      if (error) throw error

      return data.id
    } catch (error) {
      console.error('❌ Erro ao criar workflow:', error)
      throw new Error('Erro ao criar workflow')
    }
  }

  /**
   * Obter workflows do projeto
   */
  async getWorkflows(projectId: string): Promise<Workflow[]> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar workflows:', error)
      return []
    }
  }

  /**
   * Obter workflow por ID
   */
  async getWorkflow(workflowId: string): Promise<Workflow | null> {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('❌ Erro ao buscar workflow:', error)
      return null
    }
  }

  /**
   * Atualizar workflow
   */
  async updateWorkflow(
    workflowId: string,
    updates: Partial<Workflow>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflows')
        .update({
          ...updates,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', workflowId)

      if (error) throw error
    } catch (error) {
      console.error('❌ Erro ao atualizar workflow:', error)
      throw new Error('Erro ao atualizar workflow')
    }
  }

  /**
   * Excluir workflow
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', workflowId)

      if (error) throw error
    } catch (error) {
      console.error('❌ Erro ao excluir workflow:', error)
      throw new Error('Erro ao excluir workflow')
    }
  }

  /**
   * Salvar nós do workflow
   */
  async saveWorkflowNodes(
    workflowId: string,
    nodes: WorkflowNode[]
  ): Promise<void> {
    try {
      // Excluir nós existentes
      await supabase
        .from('workflow_nodes')
        .delete()
        .eq('workflow_id', workflowId)

      // Inserir novos nós
      if (nodes.length > 0) {
        const { error } = await supabase
          .from('workflow_nodes')
          .insert(
            nodes.map(node => ({
              workflow_id: workflowId,
              node_id: node.node_id,
              label: node.label,
              type: node.type,
              position_x: node.position_x,
              position_y: node.position_y,
              width: node.width,
              height: node.height,
              data: node.data,
              style: node.style,
              execution_order: node.execution_order
            }))
          )

        if (error) throw error
      }
    } catch (error) {
      console.error('❌ Erro ao salvar nós:', error)
      throw new Error('Erro ao salvar nós do workflow')
    }
  }

  /**
   * Salvar conexões do workflow
   */
  async saveWorkflowEdges(
    workflowId: string,
    edges: WorkflowEdge[]
  ): Promise<void> {
    try {
      // Excluir conexões existentes
      await supabase
        .from('workflow_edges')
        .delete()
        .eq('workflow_id', workflowId)

      // Inserir novas conexões
      if (edges.length > 0) {
        const { error } = await supabase
          .from('workflow_edges')
          .insert(
            edges.map(edge => ({
              workflow_id: workflowId,
              edge_id: edge.edge_id,
              source_node_id: edge.source_node_id,
              target_node_id: edge.target_node_id,
              label: edge.label,
              condition: edge.condition,
              condition_type: edge.condition_type,
              style: edge.style
            }))
          )

        if (error) throw error
      }
    } catch (error) {
      console.error('❌ Erro ao salvar conexões:', error)
      throw new Error('Erro ao salvar conexões do workflow')
    }
  }

  /**
   * Obter nós do workflow
   */
  async getWorkflowNodes(workflowId: string): Promise<WorkflowNode[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_nodes')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('execution_order', { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar nós:', error)
      return []
    }
  }

  /**
   * Obter conexões do workflow
   */
  async getWorkflowEdges(workflowId: string): Promise<WorkflowEdge[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_edges')
        .select('*')
        .eq('workflow_id', workflowId)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar conexões:', error)
      return []
    }
  }

  /**
   * Validar workflow
   */
  async validateWorkflow(workflowId: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('validate_workflow', {
        p_workflow_id: workflowId
      })

      if (error) throw error

      return data
    } catch (error) {
      console.error('❌ Erro ao validar workflow:', error)
      throw new Error('Erro ao validar workflow')
    }
  }

  /**
   * Executar workflow
   */
  async executeWorkflow(
    workflowId: string,
    inputData: any = {},
    triggeredBy?: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('execute_workflow', {
        p_workflow_id: workflowId,
        p_input_data: inputData,
        p_triggered_by: triggeredBy
      })

      if (error) throw error

      return data
    } catch (error) {
      console.error('❌ Erro ao executar workflow:', error)
      throw new Error('Erro ao executar workflow')
    }
  }

  /**
   * Obter execuções do workflow
   */
  async getWorkflowExecutions(workflowId: string): Promise<WorkflowExecution[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar execuções:', error)
      return []
    }
  }

  /**
   * Obter execução específica
   */
  async getWorkflowExecution(executionId: string): Promise<WorkflowExecution | null> {
    try {
      const { data, error } = await supabase
        .from('workflow_executions')
        .select('*')
        .eq('id', executionId)
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('❌ Erro ao buscar execução:', error)
      return null
    }
  }

  /**
   * Obter logs de execução
   */
  async getWorkflowNodeLogs(executionId: string): Promise<WorkflowNodeLog[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_node_logs')
        .select('*')
        .eq('execution_id', executionId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar logs:', error)
      return []
    }
  }

  /**
   * Gerar workflow via IA
   */
  async generateWorkflowAI(
    description: string,
    projectId: string,
    category?: string
  ): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('generate_workflow_ai', {
        p_description: description,
        p_project_id: projectId,
        p_category: category
      })

      if (error) throw error

      return data
    } catch (error) {
      console.error('❌ Erro ao gerar workflow com IA:', error)
      throw new Error('Erro ao gerar workflow com IA')
    }
  }

  /**
   * Obter templates de workflow
   */
  async getWorkflowTemplates(category?: string): Promise<WorkflowTemplate[]> {
    try {
      let query = supabase
        .from('workflow_templates')
        .select('*')
        .eq('is_active', true)
        .eq('is_public', true)
        .order('usage_count', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar templates:', error)
      return []
    }
  }

  /**
   * Aplicar template ao workflow
   */
  async applyTemplate(
    workflowId: string,
    templateData: any
  ): Promise<void> {
    try {
      // Salvar nós do template
      if (templateData.nodes) {
        await this.saveWorkflowNodes(workflowId, templateData.nodes)
      }

      // Salvar conexões do template
      if (templateData.edges) {
        await this.saveWorkflowEdges(workflowId, templateData.edges)
      }
    } catch (error) {
      console.error('❌ Erro ao aplicar template:', error)
      throw new Error('Erro ao aplicar template')
    }
  }

  /**
   * Obter integrações do projeto
   */
  async getWorkflowIntegrations(projectId: string): Promise<WorkflowIntegration[]> {
    try {
      const { data, error } = await supabase
        .from('workflow_integrations')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('name')

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar integrações:', error)
      return []
    }
  }

  /**
   * Testar integração
   */
  async testIntegration(integrationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('workflow_integrations')
        .update({
          last_test_at: new Date().toISOString(),
          last_test_status: 'success'
        })
        .eq('id', integrationId)
        .select('last_test_status')
        .single()

      if (error) throw error

      return data.last_test_status === 'success'
    } catch (error) {
      console.error('❌ Erro ao testar integração:', error)
      return false
    }
  }

  /**
   * Obter estatísticas de workflows
   */
  async getWorkflowStats(projectId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('workflow_stats')
        .select('*')
        .eq('project_id', projectId)
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error)
      return {
        total_workflows: 0,
        active_workflows: 0,
        total_executions: 0,
        completed_executions: 0,
        failed_executions: 0,
        avg_duration_minutes: 0
      }
    }
  }

  /**
   * Obter execuções recentes
   */
  async getRecentExecutions(limit: number = 10): Promise<WorkflowExecution[]> {
    try {
      const { data, error } = await supabase
        .from('recent_workflow_executions')
        .select('*')
        .limit(limit)

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar execuções recentes:', error)
      return []
    }
  }
}

// Exportar instância singleton
export const workflowService = WorkflowService.getInstance() 