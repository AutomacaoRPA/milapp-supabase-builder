/**
 * Função Supabase: updatePipelineStatus
 * 
 * Atualiza o status de um pipeline de projeto
 * 
 * Esta função demonstra:
 * - Validação de entrada com Zod
 * - Tratamento de erro com try/catch
 * - Logs de execução estruturados
 * - Comentários explicativos detalhados
 * - Integração com banco de dados Supabase
 * - Atualização de status com validações
 * 
 * @param request - Requisição do Supabase Edge Function
 * @returns Resposta padronizada com pipeline atualizado
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.22.4';

// Importa tipos e utilitários compartilhados
import type { 
  ProjectPipeline, 
  ApiResponse,
  FunctionContext 
} from '../shared/types.ts';

import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createNotFoundErrorResponse,
  validateData,
  logInfo,
  logWarn,
  logError,
  logDebug,
  extractContext,
  hasPermission,
  measureExecutionTime,
  sanitizeData
} from '../shared/utils.ts';

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

/**
 * Schema para validação da requisição de atualização de status
 */
const UpdatePipelineStatusSchema = z.object({
  pipeline_id: z.string()
    .uuid('ID do pipeline deve ser um UUID válido'),
  
  status: z.enum(['pending', 'running', 'success', 'failed', 'cancelled'], {
    errorMap: () => ({ 
      message: 'Status deve ser: pending, running, success, failed ou cancelled' 
    })
  }),
  
  stage: z.string()
    .min(1, 'Nome do estágio é obrigatório')
    .max(100, 'Nome do estágio deve ter no máximo 100 caracteres')
    .optional(),
  
  message: z.string()
    .max(500, 'Mensagem deve ter no máximo 500 caracteres')
    .optional(),
  
  metadata: z.record(z.any())
    .optional(),
  
  force: z.boolean()
    .default(false)
});

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Cria cliente Supabase com role de serviço
 */
function createSupabaseClient() {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Valida se a transição de status é permitida
 * @param currentStatus - Status atual do pipeline
 * @param newStatus - Novo status desejado
 * @returns true se a transição é válida
 */
function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  const validTransitions: Record<string, string[]> = {
    'pending': ['running', 'cancelled'],
    'running': ['success', 'failed', 'cancelled'],
    'success': ['running'], // Permite re-execução
    'failed': ['running', 'cancelled'], // Permite retry
    'cancelled': ['running'] // Permite re-iniciar
  };
  
  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

/**
 * Obtém pipeline pelo ID
 * @param supabase - Cliente Supabase
 * @param pipelineId - ID do pipeline
 * @param context - Contexto da execução
 * @returns Pipeline encontrado ou null
 */
async function getPipelineById(
  supabase: any,
  pipelineId: string,
  context: FunctionContext
): Promise<ProjectPipeline | null> {
  logDebug('Buscando pipeline por ID', {
    pipeline_id: pipelineId
  }, context.request_id);

  const { data: pipeline, error } = await supabase
    .from('project_pipelines')
    .select(`
      *,
      projects (
        id,
        name,
        created_by,
        team_id
      )
    `)
    .eq('id', pipelineId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      logWarn('Pipeline não encontrado', {
        pipeline_id: pipelineId
      }, context.request_id);
      return null;
    }
    
    logError('Erro ao buscar pipeline', {
      pipeline_id: pipelineId,
      error: error.message
    }, context.request_id);
    throw new Error(`Falha ao buscar pipeline: ${error.message}`);
  }

  logInfo('Pipeline encontrado', {
    pipeline_id: pipelineId,
    current_status: pipeline.status
  }, context.request_id);

  return pipeline;
}

/**
 * Verifica permissões do usuário para o pipeline
 * @param pipeline - Pipeline encontrado
 * @param context - Contexto da execução
 * @returns true se tem permissão
 */
function checkPipelinePermissions(
  pipeline: ProjectPipeline,
  context: FunctionContext
): boolean {
  const project = (pipeline as any).projects;
  
  // Verifica permissões básicas
  const hasBasicPermission = hasPermission(
    context.user_id,
    project.created_by,
    context.user_role
  );
  
  // Verifica se é membro da equipe (se aplicável)
  const isTeamMember = project.team_id ? 
    hasPermission(context.user_id, project.team_id, context.user_role) : 
    true;
  
  return hasBasicPermission && isTeamMember;
}

/**
 * Atualiza status do pipeline
 * @param supabase - Cliente Supabase
 * @param pipelineId - ID do pipeline
 * @param updateData - Dados para atualização
 * @param context - Contexto da execução
 * @returns Pipeline atualizado
 */
async function updatePipelineStatus(
  supabase: any,
  pipelineId: string,
  updateData: any,
  context: FunctionContext
): Promise<ProjectPipeline> {
  logInfo('Atualizando status do pipeline', {
    pipeline_id: pipelineId,
    new_status: updateData.status,
    stage: updateData.stage
  }, context.request_id);

  const updatePayload = {
    ...updateData,
    updated_at: new Date().toISOString(),
    updated_by: context.user_id
  };

  const { data: pipeline, error } = await supabase
    .from('project_pipelines')
    .update(updatePayload)
    .eq('id', pipelineId)
    .select()
    .single();

  if (error) {
    logError('Erro ao atualizar pipeline', {
      pipeline_id: pipelineId,
      error: error.message
    }, context.request_id);
    throw new Error(`Falha ao atualizar pipeline: ${error.message}`);
  }

  logInfo('Pipeline atualizado com sucesso', {
    pipeline_id: pipelineId,
    new_status: pipeline.status
  }, context.request_id);

  return pipeline;
}

/**
 * Cria log de auditoria para mudança de status
 * @param supabase - Cliente Supabase
 * @param pipelineId - ID do pipeline
 * @param oldStatus - Status anterior
 * @param newStatus - Novo status
 * @param context - Contexto da execução
 */
async function createAuditLog(
  supabase: any,
  pipelineId: string,
  oldStatus: string,
  newStatus: string,
  context: FunctionContext
): Promise<void> {
  logDebug('Criando log de auditoria', {
    pipeline_id: pipelineId,
    old_status: oldStatus,
    new_status: newStatus
  }, context.request_id);

  const auditLog = {
    table_name: 'project_pipelines',
    record_id: pipelineId,
    action: 'status_update',
    old_values: { status: oldStatus },
    new_values: { status: newStatus },
    user_id: context.user_id,
    user_email: context.user_email,
    ip_address: 'edge_function',
    created_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('audit_logs')
    .insert(auditLog);

  if (error) {
    logWarn('Erro ao criar log de auditoria', {
      pipeline_id: pipelineId,
      error: error.message
    }, context.request_id);
  } else {
    logInfo('Log de auditoria criado', {
      pipeline_id: pipelineId,
      audit_log_id: auditLog.id
    }, context.request_id);
  }
}

/**
 * Envia notificações sobre mudança de status
 * @param pipeline - Pipeline atualizado
 * @param oldStatus - Status anterior
 * @param context - Contexto da execução
 */
async function sendStatusNotifications(
  pipeline: ProjectPipeline,
  oldStatus: string,
  context: FunctionContext
): Promise<void> {
  logDebug('Enviando notificações de status', {
    pipeline_id: pipeline.id,
    old_status: oldStatus,
    new_status: pipeline.status
  }, context.request_id);

  // Aqui você implementaria a lógica de notificação
  // Por exemplo: email, Slack, webhook, etc.
  
  const notificationData = {
    type: 'pipeline_status_change',
    pipeline_id: pipeline.id,
    project_id: pipeline.project_id,
    old_status: oldStatus,
    new_status: pipeline.status,
    user_id: context.user_id,
    timestamp: new Date().toISOString()
  };

  // Simula envio de notificação
  logInfo('Notificação enviada', {
    notification_type: 'pipeline_status_change',
    pipeline_id: pipeline.id
  }, context.request_id);
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

/**
 * Função principal para atualização de status de pipeline
 * @param request - Requisição HTTP do Supabase
 * @returns Resposta padronizada
 */
async function updatePipelineStatus(request: Request): Promise<Response> {
  const context = extractContext(request);
  
  logInfo('Iniciando atualização de status de pipeline', {
    user_id: context.user_id,
    user_email: context.user_email
  }, context.request_id);

  try {
    // ========================================================================
    // 1. VALIDAÇÃO DA REQUISIÇÃO
    // ========================================================================
    
    logDebug('Validando dados da requisição', {}, context.request_id);
    
    const requestData = await request.json();
    const validation = validateData(UpdatePipelineStatusSchema, requestData);
    
    if (!validation.isValid) {
      logWarn('Dados da requisição inválidos', {
        errors: validation.errors
      }, context.request_id);
      
      return new Response(
        JSON.stringify(createValidationErrorResponse(validation.errors)),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { pipeline_id, status: newStatus, stage, message, metadata, force } = validation.data;
    
    // ========================================================================
    // 2. CRIAÇÃO DO CLIENTE SUPABASE
    // ========================================================================
    
    logDebug('Criando cliente Supabase', {}, context.request_id);
    
    const supabase = createSupabaseClient();

    // ========================================================================
    // 3. BUSCA DO PIPELINE
    // ========================================================================
    
    logInfo('Buscando pipeline para atualização', {
      pipeline_id
    }, context.request_id);

    const pipeline = await measureExecutionTime(
      async () => getPipelineById(supabase, pipeline_id, context),
      'Busca do pipeline'
    );

    if (!pipeline) {
      return new Response(
        JSON.stringify(createNotFoundErrorResponse('Pipeline')),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // ========================================================================
    // 4. VERIFICAÇÃO DE PERMISSÕES
    // ========================================================================
    
    logDebug('Verificando permissões do usuário', {
      user_id: context.user_id,
      user_role: context.user_role
    }, context.request_id);

    if (!force && !checkPipelinePermissions(pipeline, context)) {
      logWarn('Usuário sem permissão para atualizar pipeline', {
        user_id: context.user_id,
        pipeline_id
      }, context.request_id);
      
      return new Response(
        JSON.stringify(createErrorResponse(
          'INSUFFICIENT_PERMISSIONS',
          'Você não tem permissão para atualizar este pipeline'
        )),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // ========================================================================
    // 5. VALIDAÇÃO DE TRANSIÇÃO DE STATUS
    // ========================================================================
    
    const currentStatus = pipeline.status;
    
    if (!force && !isValidStatusTransition(currentStatus, newStatus)) {
      logWarn('Transição de status inválida', {
        pipeline_id,
        current_status: currentStatus,
        new_status: newStatus
      }, context.request_id);
      
      return new Response(
        JSON.stringify(createErrorResponse(
          'INVALID_STATUS_TRANSITION',
          `Transição de status inválida: ${currentStatus} → ${newStatus}`
        )),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // ========================================================================
    // 6. ATUALIZAÇÃO DO STATUS
    // ========================================================================
    
    logInfo('Atualizando status do pipeline', {
      pipeline_id,
      current_status: currentStatus,
      new_status: newStatus
    }, context.request_id);

    const updateData = {
      status: newStatus,
      ...(stage && { current_stage: stage }),
      ...(message && { status_message: message }),
      ...(metadata && { status_metadata: metadata })
    };

    const updatedPipeline = await measureExecutionTime(
      async () => updatePipelineStatus(supabase, pipeline_id, updateData, context),
      'Atualização do status'
    );

    // ========================================================================
    // 7. LOGS E NOTIFICAÇÕES
    // ========================================================================
    
    // Cria log de auditoria
    await measureExecutionTime(
      async () => createAuditLog(supabase, pipeline_id, currentStatus, newStatus, context),
      'Criação de log de auditoria'
    );

    // Envia notificações
    await measureExecutionTime(
      async () => sendStatusNotifications(updatedPipeline, currentStatus, context),
      'Envio de notificações'
    );

    // ========================================================================
    // 8. PREPARAÇÃO DA RESPOSTA
    // ========================================================================
    
    logInfo('Status do pipeline atualizado com sucesso', {
      pipeline_id,
      old_status: currentStatus,
      new_status: newStatus,
      total_duration: 'completed'
    }, context.request_id);

    return new Response(
      JSON.stringify(createSuccessResponse(
        updatedPipeline,
        'Status do pipeline atualizado com sucesso'
      )),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    // ========================================================================
    // TRATAMENTO DE ERROS
    // ========================================================================
    
    const errorMessage = error instanceof Error ? error.message : 'Erro interno desconhecido';
    
    logError('Erro durante atualização de status de pipeline', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }, context.request_id);

    return new Response(
      JSON.stringify(createErrorResponse(
        'INTERNAL_ERROR',
        'Erro interno durante atualização do status',
        { details: errorMessage }
      )),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// ============================================================================
// CONFIGURAÇÃO DO SERVIDOR
// ============================================================================

/**
 * Configuração do servidor Deno
 */
serve(async (request: Request) => {
  const { method } = request;
  
  console.log(`${method} ${request.url}`);
  
  if (method !== 'POST') {
    return new Response(
      JSON.stringify(createErrorResponse(
        'METHOD_NOT_ALLOWED',
        'Método não permitido. Use POST.'
      )),
      { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  return await updatePipelineStatus(request);
}); 