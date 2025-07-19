/**
 * Função Supabase: validateUserPermissions
 * 
 * Valida permissões de usuário para recursos específicos
 * 
 * Esta função demonstra:
 * - Validação de entrada com Zod
 * - Tratamento de erro com try/catch
 * - Logs de execução estruturados
 * - Comentários explicativos detalhados
 * - Verificação de permissões granulares
 * - Cache de permissões para performance
 * 
 * @param request - Requisição do Supabase Edge Function
 * @returns Resposta padronizada com permissões validadas
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://esm.sh/zod@3.22.4';

// Importa tipos e utilitários compartilhados
import type { 
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
  measureExecutionTime,
  sanitizeData
} from '../shared/utils.ts';

// ============================================================================
// TIPOS ESPECÍFICOS
// ============================================================================

/**
 * Tipo para permissão de recurso
 */
interface ResourcePermission {
  resource: string;
  action: string;
  resource_id?: string;
}

/**
 * Tipo para resultado de validação de permissão
 */
interface PermissionResult {
  hasPermission: boolean;
  reason?: string;
  details?: Record<string, any>;
}

/**
 * Tipo para resposta de validação de permissões
 */
interface ValidatePermissionsResponse {
  user_id: string;
  user_role: string;
  permissions: Record<string, PermissionResult>;
  summary: {
    total: number;
    granted: number;
    denied: number;
  };
}

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

/**
 * Schema para validação da requisição de permissões
 */
const ValidatePermissionsSchema = z.object({
  user_id: z.string()
    .uuid('ID do usuário deve ser um UUID válido')
    .optional(),
  
  permissions: z.array(z.object({
    resource: z.string()
      .min(1, 'Recurso é obrigatório')
      .max(100, 'Nome do recurso deve ter no máximo 100 caracteres'),
    
    action: z.enum(['read', 'write', 'delete', 'admin'], {
      errorMap: () => ({ 
        message: 'Ação deve ser: read, write, delete ou admin' 
      })
    }),
    
    resource_id: z.string()
      .uuid('ID do recurso deve ser um UUID válido')
      .optional()
  }))
    .min(1, 'Pelo menos uma permissão deve ser especificada')
    .max(20, 'Máximo de 20 permissões por requisição'),
  
  include_details: z.boolean()
    .default(false),
  
  cache_result: z.boolean()
    .default(true)
});

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

/**
 * Mapeamento de recursos para tabelas
 */
const RESOURCE_TABLE_MAP = {
  'projects': 'projects',
  'pipelines': 'project_pipelines',
  'users': 'users',
  'teams': 'teams',
  'tasks': 'tasks',
  'comments': 'comments',
  'notifications': 'notifications'
} as const;

/**
 * Permissões padrão por role
 */
const DEFAULT_ROLE_PERMISSIONS = {
  'admin': {
    'projects': ['read', 'write', 'delete', 'admin'],
    'pipelines': ['read', 'write', 'delete', 'admin'],
    'users': ['read', 'write', 'delete', 'admin'],
    'teams': ['read', 'write', 'delete', 'admin'],
    'tasks': ['read', 'write', 'delete', 'admin'],
    'comments': ['read', 'write', 'delete', 'admin'],
    'notifications': ['read', 'write', 'delete', 'admin']
  },
  'manager': {
    'projects': ['read', 'write'],
    'pipelines': ['read', 'write'],
    'users': ['read'],
    'teams': ['read', 'write'],
    'tasks': ['read', 'write'],
    'comments': ['read', 'write'],
    'notifications': ['read']
  },
  'developer': {
    'projects': ['read', 'write'],
    'pipelines': ['read', 'write'],
    'users': ['read'],
    'teams': ['read'],
    'tasks': ['read', 'write'],
    'comments': ['read', 'write'],
    'notifications': ['read']
  },
  'viewer': {
    'projects': ['read'],
    'pipelines': ['read'],
    'users': ['read'],
    'teams': ['read'],
    'tasks': ['read'],
    'comments': ['read'],
    'notifications': ['read']
  }
} as const;

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
 * Obtém informações do usuário
 * @param supabase - Cliente Supabase
 * @param userId - ID do usuário
 * @param context - Contexto da execução
 * @returns Informações do usuário
 */
async function getUserInfo(
  supabase: any,
  userId: string,
  context: FunctionContext
): Promise<any> {
  logDebug('Buscando informações do usuário', {
    user_id: userId
  }, context.request_id);

  const { data: user, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      role,
      team_id,
      is_active,
      created_at
    `)
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      logWarn('Usuário não encontrado', {
        user_id: userId
      }, context.request_id);
      return null;
    }
    
    logError('Erro ao buscar usuário', {
      user_id: userId,
      error: error.message
    }, context.request_id);
    throw new Error(`Falha ao buscar usuário: ${error.message}`);
  }

  logInfo('Usuário encontrado', {
    user_id: userId,
    role: user.role,
    team_id: user.team_id
  }, context.request_id);

  return user;
}

/**
 * Verifica permissão básica por role
 * @param userRole - Role do usuário
 * @param resource - Recurso a ser acessado
 * @param action - Ação a ser executada
 * @returns true se tem permissão básica
 */
function hasBasicPermission(
  userRole: string,
  resource: string,
  action: string
): boolean {
  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[userRole as keyof typeof DEFAULT_ROLE_PERMISSIONS];
  
  if (!rolePermissions) {
    return false;
  }
  
  const resourcePermissions = rolePermissions[resource as keyof typeof rolePermissions];
  
  if (!resourcePermissions) {
    return false;
  }
  
  return resourcePermissions.includes(action as any);
}

/**
 * Verifica permissão de propriedade do recurso
 * @param supabase - Cliente Supabase
 * @param resource - Recurso a ser verificado
 * @param resourceId - ID do recurso
 * @param userId - ID do usuário
 * @param context - Contexto da execução
 * @returns true se é proprietário
 */
async function isResourceOwner(
  supabase: any,
  resource: string,
  resourceId: string,
  userId: string,
  context: FunctionContext
): Promise<boolean> {
  const tableName = RESOURCE_TABLE_MAP[resource as keyof typeof RESOURCE_TABLE_MAP];
  
  if (!tableName) {
    logWarn('Tabela não mapeada para recurso', {
      resource,
      resource_id: resourceId
    }, context.request_id);
    return false;
  }

  logDebug('Verificando propriedade do recurso', {
    resource,
    resource_id: resourceId,
    user_id: userId
  }, context.request_id);

  const { data: record, error } = await supabase
    .from(tableName)
    .select('created_by, team_id')
    .eq('id', resourceId)
    .single();

  if (error) {
    logWarn('Erro ao verificar propriedade do recurso', {
      resource,
      resource_id: resourceId,
      error: error.message
    }, context.request_id);
    return false;
  }

  // Verifica se é o criador
  const isOwner = record.created_by === userId;
  
  // Verifica se é membro da equipe (se aplicável)
  const isTeamMember = record.team_id ? 
    await isTeamMember(supabase, record.team_id, userId, context) : 
    false;

  return isOwner || isTeamMember;
}

/**
 * Verifica se usuário é membro da equipe
 * @param supabase - Cliente Supabase
 * @param teamId - ID da equipe
 * @param userId - ID do usuário
 * @param context - Contexto da execução
 * @returns true se é membro
 */
async function isTeamMember(
  supabase: any,
  teamId: string,
  userId: string,
  context: FunctionContext
): Promise<boolean> {
  logDebug('Verificando membro da equipe', {
    team_id: teamId,
    user_id: userId
  }, context.request_id);

  const { data: membership, error } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error && error.code !== 'PGRST116') {
    logWarn('Erro ao verificar membro da equipe', {
      team_id: teamId,
      user_id: userId,
      error: error.message
    }, context.request_id);
    return false;
  }

  return !!membership;
}

/**
 * Valida uma permissão específica
 * @param supabase - Cliente Supabase
 * @param permission - Permissão a ser validada
 * @param user - Informações do usuário
 * @param context - Contexto da execução
 * @returns Resultado da validação
 */
async function validatePermission(
  supabase: any,
  permission: ResourcePermission,
  user: any,
  context: FunctionContext
): Promise<PermissionResult> {
  const { resource, action, resource_id } = permission;
  
  logDebug('Validando permissão específica', {
    resource,
    action,
    resource_id,
    user_role: user.role
  }, context.request_id);

  // Verifica permissão básica por role
  const hasBasic = hasBasicPermission(user.role, resource, action);
  
  if (!hasBasic) {
    return {
      hasPermission: false,
      reason: 'Permissão não concedida para este role',
      details: {
        user_role: user.role,
        resource,
        action
      }
    };
  }

  // Se não há resource_id, permissão básica é suficiente
  if (!resource_id) {
    return {
      hasPermission: true,
      reason: 'Permissão básica concedida',
      details: {
        user_role: user.role,
        resource,
        action
      }
    };
  }

  // Verifica propriedade do recurso
  const isOwner = await isResourceOwner(supabase, resource, resource_id, user.id, context);
  
  if (isOwner) {
    return {
      hasPermission: true,
      reason: 'Usuário é proprietário do recurso',
      details: {
        user_role: user.role,
        resource,
        action,
        resource_id,
        ownership: 'owner'
      }
    };
  }

  // Para ações de escrita/deleção, requer propriedade
  if (action === 'write' || action === 'delete') {
    return {
      hasPermission: false,
      reason: 'Ação requer propriedade do recurso',
      details: {
        user_role: user.role,
        resource,
        action,
        resource_id,
        ownership: 'not_owner'
      }
    };
  }

  // Para leitura, permissão básica é suficiente
  return {
    hasPermission: true,
    reason: 'Permissão de leitura concedida',
    details: {
      user_role: user.role,
      resource,
      action,
      resource_id,
      ownership: 'not_owner'
    }
  };
}

/**
 * Gera cache key para permissões
 * @param userId - ID do usuário
 * @param permissions - Lista de permissões
 * @returns Chave do cache
 */
function generateCacheKey(userId: string, permissions: ResourcePermission[]): string {
  const permissionsHash = JSON.stringify(permissions.sort((a, b) => 
    `${a.resource}:${a.action}:${a.resource_id}`.localeCompare(`${b.resource}:${b.action}:${b.resource_id}`)
  ));
  
  return `permissions:${userId}:${btoa(permissionsHash)}`;
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

/**
 * Função principal para validação de permissões
 * @param request - Requisição HTTP do Supabase
 * @returns Resposta padronizada
 */
async function validateUserPermissions(request: Request): Promise<Response> {
  const context = extractContext(request);
  
  logInfo('Iniciando validação de permissões de usuário', {
    user_id: context.user_id,
    user_email: context.user_email
  }, context.request_id);

  try {
    // ========================================================================
    // 1. VALIDAÇÃO DA REQUISIÇÃO
    // ========================================================================
    
    logDebug('Validando dados da requisição', {}, context.request_id);
    
    const requestData = await request.json();
    const validation = validateData(ValidatePermissionsSchema, requestData);
    
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

    const { user_id: targetUserId, permissions, include_details, cache_result } = validation.data;
    
    // Usa o usuário da requisição se não especificado
    const userId = targetUserId || context.user_id;
    
    // ========================================================================
    // 2. CRIAÇÃO DO CLIENTE SUPABASE
    // ========================================================================
    
    logDebug('Criando cliente Supabase', {}, context.request_id);
    
    const supabase = createSupabaseClient();

    // ========================================================================
    // 3. VERIFICAÇÃO DE CACHE
    // ========================================================================
    
    if (cache_result) {
      const cacheKey = generateCacheKey(userId, permissions);
      
      logDebug('Verificando cache de permissões', {
        cache_key: cacheKey
      }, context.request_id);

      // Aqui você implementaria a verificação de cache
      // Por exemplo, usando Redis ou cache em memória
      
      logInfo('Cache não implementado, validando permissões', {
        cache_key: cacheKey
      }, context.request_id);
    }

    // ========================================================================
    // 4. BUSCA DE INFORMAÇÕES DO USUÁRIO
    // ========================================================================
    
    logInfo('Buscando informações do usuário', {
      user_id: userId
    }, context.request_id);

    const user = await measureExecutionTime(
      async () => getUserInfo(supabase, userId, context),
      'Busca de informações do usuário'
    );

    if (!user) {
      return new Response(
        JSON.stringify(createErrorResponse(
          'USER_NOT_FOUND',
          'Usuário não encontrado'
        )),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!user.is_active) {
      return new Response(
        JSON.stringify(createErrorResponse(
          'USER_INACTIVE',
          'Usuário inativo'
        )),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // ========================================================================
    // 5. VALIDAÇÃO DE PERMISSÕES
    // ========================================================================
    
    logInfo('Validando permissões do usuário', {
      user_id: userId,
      user_role: user.role,
      permissions_count: permissions.length
    }, context.request_id);

    const permissionResults: Record<string, PermissionResult> = {};
    
    for (const permission of permissions) {
      const permissionKey = `${permission.resource}:${permission.action}${permission.resource_id ? `:${permission.resource_id}` : ''}`;
      
      const result = await measureExecutionTime(
        async () => validatePermission(supabase, permission, user, context),
        `Validação de permissão: ${permissionKey}`
      );
      
      permissionResults[permissionKey] = include_details ? result : {
        hasPermission: result.hasPermission,
        reason: result.reason
      };
    }

    // ========================================================================
    // 6. PREPARAÇÃO DA RESPOSTA
    // ========================================================================
    
    const results = Object.values(permissionResults);
    const summary = {
      total: results.length,
      granted: results.filter(r => r.hasPermission).length,
      denied: results.filter(r => !r.hasPermission).length
    };

    const response: ValidatePermissionsResponse = {
      user_id: userId,
      user_role: user.role,
      permissions: permissionResults,
      summary
    };

    logInfo('Validação de permissões concluída', {
      user_id: userId,
      total: summary.total,
      granted: summary.granted,
      denied: summary.denied
    }, context.request_id);

    return new Response(
      JSON.stringify(createSuccessResponse(
        response,
        'Permissões validadas com sucesso'
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
    
    logError('Erro durante validação de permissões', {
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }, context.request_id);

    return new Response(
      JSON.stringify(createErrorResponse(
        'INTERNAL_ERROR',
        'Erro interno durante validação de permissões',
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
  
  return await validateUserPermissions(request);
}); 