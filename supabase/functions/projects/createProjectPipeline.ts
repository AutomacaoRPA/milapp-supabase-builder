/**
 * Função Supabase: createProjectPipeline
 * 
 * Cria um novo projeto com pipeline automatizado
 * 
 * Esta função demonstra:
 * - Validação de entrada com Zod
 * - Tratamento de erro com try/catch
 * - Logs de execução estruturados
 * - Comentários explicativos detalhados
 * - Integração com banco de dados Supabase
 * - Criação de pipeline automatizado
 * 
 * @param request - Requisição do Supabase Edge Function
 * @returns Resposta padronizada com projeto e pipeline criados
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.22.4';

// Importa tipos e utilitários compartilhados
import type { 
  CreateProject, 
  Project, 
  ProjectPipeline, 
  CreateProjectResponse,
  ApiResponse,
  FunctionContext 
} from '../shared/types.ts';

import {
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createAuthErrorResponse,
  validateData,
  logInfo,
  logWarn,
  logError,
  logDebug,
  extractContext,
  hasPermission,
  measureExecutionTime,
  generateSlug,
  sanitizeData
} from '../shared/utils.ts';

// ============================================================================
// CONFIGURAÇÃO E CONSTANTES
// ============================================================================

// Configurações do ambiente
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Configurações de pipeline padrão
const DEFAULT_PIPELINE_CONFIG = {
  stages: [
    { name: 'development', order: 1, auto_approve: false },
    { name: 'testing', order: 2, auto_approve: false },
    { name: 'staging', order: 3, auto_approve: false },
    { name: 'production', order: 4, auto_approve: false }
  ],
  settings: {
    require_approval: true,
    auto_deploy_dev: true,
    notifications: {
      slack: false,
      email: true,
      webhook: false
    }
  }
};

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

/**
 * Schema para validação da requisição de criação de projeto
 * Inclui validações específicas para pipeline
 */
const CreateProjectRequestSchema = z.object({
  // Dados básicos do projeto
  name: z.string()
    .min(1, 'Nome do projeto é obrigatório')
    .max(255, 'Nome do projeto deve ter no máximo 255 caracteres')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Nome deve conter apenas letras, números, espaços, hífens e underscores'),
  
  description: z.string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .optional(),
  
  type: z.enum(['automation', 'enhancement', 'maintenance', 'migration', 'integration'], {
    errorMap: () => ({ message: 'Tipo de projeto deve ser: automation, enhancement, maintenance, migration ou integration' })
  }),
  
  priority: z.enum(['low', 'medium', 'high', 'critical'])
    .default('medium'),
  
  methodology: z.enum(['scrum', 'kanban', 'waterfall', 'agile', 'hybrid'])
    .default('scrum'),
  
  // Datas do projeto
  start_date: z.string()
    .datetime('Data de início deve ser uma data válida')
    .optional(),
  
  end_date: z.string()
    .datetime('Data de fim deve ser uma data válida')
    .optional(),
  
  // Configurações de esforço e ROI
  estimated_effort: z.number()
    .positive('Esforço estimado deve ser um número positivo')
    .max(1000, 'Esforço estimado não pode exceder 1000 horas')
    .optional(),
  
  roi_target: z.number()
    .positive('ROI alvo deve ser um número positivo')
    .max(1000, 'ROI alvo não pode exceder 1000%')
    .optional(),
  
  // Tags e metadados
  tags: z.array(z.string())
    .max(10, 'Máximo de 10 tags permitidas')
    .optional(),
  
  metadata: z.record(z.any())
    .optional(),
  
  // Configurações de pipeline
  pipeline_config: z.object({
    stages: z.array(z.object({
      name: z.string(),
      order: z.number().positive(),
      auto_approve: z.boolean()
    })).optional(),
    
    settings: z.object({
      require_approval: z.boolean().optional(),
      auto_deploy_dev: z.boolean().optional(),
      notifications: z.object({
        slack: z.boolean().optional(),
        email: z.boolean().optional(),
        webhook: z.boolean().optional()
      }).optional()
    }).optional()
  }).optional(),
  
  // Configurações de equipe
  team_id: z.string()
    .uuid('ID da equipe deve ser um UUID válido')
    .optional(),
  
  assignees: z.array(z.string().uuid('ID do usuário deve ser um UUID válido'))
    .max(10, 'Máximo de 10 responsáveis permitidos')
    .optional()
});

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Cria cliente Supabase com role de serviço
 * Permite operações administrativas no banco
 */
function createSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Valida se as datas do projeto são coerentes
 * @param startDate - Data de início
 * @param endDate - Data de fim
 * @returns true se as datas são válidas
 */
function validateProjectDates(startDate?: string, endDate?: string): boolean {
  if (!startDate || !endDate) return true;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return start < end;
}

/**
 * Gera configuração de pipeline personalizada
 * @param customConfig - Configuração customizada do usuário
 * @returns Configuração final do pipeline
 */
function generatePipelineConfig(customConfig?: any) {
  const baseConfig = { ...DEFAULT_PIPELINE_CONFIG };
  
  if (customConfig) {
    // Mescla configurações customizadas com padrão
    if (customConfig.stages) {
      baseConfig.stages = customConfig.stages;
    }
    
    if (customConfig.settings) {
      baseConfig.settings = {
        ...baseConfig.settings,
        ...customConfig.settings
      };
    }
  }
  
  return baseConfig;
}

/**
 * Cria pipeline padrão para o projeto
 * @param supabase - Cliente Supabase
 * @param projectId - ID do projeto
 * @param config - Configuração do pipeline
 * @param context - Contexto da execução
 * @returns Pipeline criado
 */
async function createDefaultPipeline(
  supabase: any,
  projectId: string,
  config: any,
  context: FunctionContext
): Promise<ProjectPipeline> {
  logDebug('Criando pipeline padrão para projeto', {
    project_id: projectId,
    pipeline_config: sanitizeData(config)
  }, context.request_id);

  const pipelineData = {
    project_id: projectId,
    name: 'Pipeline Principal',
    description: 'Pipeline automatizado criado para o projeto',
    type: 'ci_cd',
    config: config,
    status: 'pending',
    created_by: context.user_id
  };

  const { data: pipeline, error } = await supabase
    .from('project_pipelines')
    .insert(pipelineData)
    .select()
    .single();

  if (error) {
    logError('Erro ao criar pipeline', {
      project_id: projectId,
      error: error.message
    }, context.request_id);
    throw new Error(`Falha ao criar pipeline: ${error.message}`);
  }

  logInfo('Pipeline criado com sucesso', {
    pipeline_id: pipeline.id,
    project_id: projectId
  }, context.request_id);

  return pipeline;
}

/**
 * Atualiza estatísticas do projeto
 * @param supabase - Cliente Supabase
 * @param projectId - ID do projeto
 * @param context - Contexto da execução
 */
async function updateProjectStats(
  supabase: any,
  projectId: string,
  context: FunctionContext
): Promise<void> {
  logDebug('Atualizando estatísticas do projeto', {
    project_id: projectId
  }, context.request_id);

  // Conta pipelines associados
  const { count: pipelineCount } = await supabase
    .from('project_pipelines')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  // Atualiza estatísticas do projeto
  const { error } = await supabase
    .from('projects')
    .update({
      pipeline_count: pipelineCount || 0,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId);

  if (error) {
    logWarn('Erro ao atualizar estatísticas do projeto', {
      project_id: projectId,
      error: error.message
    }, context.request_id);
  } else {
    logInfo('Estatísticas do projeto atualizadas', {
      project_id: projectId,
      pipeline_count: pipelineCount
    }, context.request_id);
  }
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

/**
 * Função principal para criação de projeto com pipeline
 * @param request - Requisição HTTP do Supabase
 * @returns Resposta padronizada
 */
async function createProjectPipeline(request: Request): Promise<Response> {
  const context = extractContext(request);
  
  logInfo('Iniciando criação de projeto com pipeline', {
    user_id: context.user_id,
    user_email: context.user_email
  }, context.request_id);

  try {
    // ========================================================================
    // 1. VALIDAÇÃO DA REQUISIÇÃO
    // ========================================================================
    
    logDebug('Validando dados da requisição', {}, context.request_id);
    
    const requestData = await request.json();
    const validation = validateData(CreateProjectRequestSchema, requestData);
    
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

    const projectData = validation.data;
    
    // Validação adicional de datas
    if (!validateProjectDates(projectData.start_date, projectData.end_date)) {
      const errorMessage = 'Data de fim deve ser posterior à data de início';
      logWarn('Validação de datas falhou', {
        start_date: projectData.start_date,
        end_date: projectData.end_date
      }, context.request_id);
      
      return new Response(
        JSON.stringify(createErrorResponse('INVALID_DATES', errorMessage)),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // ========================================================================
    // 2. CRIAÇÃO DO CLIENTE SUPABASE
    // ========================================================================
    
    logDebug('Criando cliente Supabase', {}, context.request_id);
    
    const supabase = createSupabaseClient();

    // ========================================================================
    // 3. CRIAÇÃO DO PROJETO
    // ========================================================================
    
    logInfo('Criando projeto no banco de dados', {
      project_name: projectData.name,
      project_type: projectData.type
    }, context.request_id);

    const projectInsertData = {
      ...projectData,
      created_by: context.user_id,
      status: 'pending',
      slug: generateSlug(projectData.name),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: project, error: projectError } = await measureExecutionTime(
      async () => {
        const result = await supabase
          .from('projects')
          .insert(projectInsertData)
          .select()
          .single();
        
        if (result.error) throw result.error;
        return result;
      },
      'Criação do projeto'
    );

    if (projectError) {
      logError('Erro ao criar projeto', {
        project_name: projectData.name,
        error: projectError.message
      }, context.request_id);
      
      return new Response(
        JSON.stringify(createErrorResponse(
          'PROJECT_CREATION_FAILED',
          'Falha ao criar projeto',
          { details: projectError.message }
        )),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    logInfo('Projeto criado com sucesso', {
      project_id: project.id,
      project_name: project.name
    }, context.request_id);

    // ========================================================================
    // 4. CRIAÇÃO DO PIPELINE
    // ========================================================================
    
    logInfo('Criando pipeline para o projeto', {
      project_id: project.id
    }, context.request_id);

    const pipelineConfig = generatePipelineConfig(projectData.pipeline_config);
    
    const pipeline = await measureExecutionTime(
      async () => createDefaultPipeline(supabase, project.id, pipelineConfig, context),
      'Criação do pipeline'
    );

    // ========================================================================
    // 5. ATUALIZAÇÃO DE ESTATÍSTICAS
    // ========================================================================
    
    await measureExecutionTime(
      async () => updateProjectStats(supabase, project.id, context),
      'Atualização de estatísticas'
    );

    // ========================================================================
    // 6. PREPARAÇÃO DA RESPOSTA
    // ========================================================================
    
    const response: CreateProjectResponse = {
      project: project,
      pipeline: pipeline
    };

    logInfo('Projeto e pipeline criados com sucesso', {
      project_id: project.id,
      pipeline_id: pipeline.id,
      total_duration: 'completed'
    }, context.request_id);

    return new Response(
      JSON.stringify(createSuccessResponse(
        response,
        'Projeto e pipeline criados com sucesso'
      )),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    // ========================================================================
    // TRATAMENTO DE ERROS
    // ========================================================================
    
    const errorMessage = error instanceof Error ? error.message : 'Erro interno desconhecido';
    
    logError('Erro durante criação de projeto com pipeline', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }, context.request_id);

    return new Response(
      JSON.stringify(createErrorResponse(
        'INTERNAL_ERROR',
        'Erro interno durante criação do projeto',
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
 * Define handlers para diferentes métodos HTTP
 */
serve(async (request: Request) => {
  const { method } = request;
  
  // Log da requisição
  console.log(`${method} ${request.url}`);
  
  // Validação do método HTTP
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
  
  // Executa a função principal
  return await createProjectPipeline(request);
}); 