/**
 * Utilitários compartilhados para funções Supabase
 * Funções auxiliares usadas em múltiplas funções
 */

import { z } from 'zod';
import type { 
  ApiResponse, 
  SuccessResponse, 
  ErrorResponse, 
  FunctionContext, 
  ExecutionLog,
  ValidationResult 
} from './types';

// ============================================================================
// UTILITÁRIOS DE RESPOSTA
// ============================================================================

/**
 * Cria uma resposta de sucesso padronizada
 * @param data - Dados da resposta
 * @param message - Mensagem opcional
 * @returns Resposta de sucesso formatada
 */
export function createSuccessResponse<T>(
  data: T, 
  message?: string
): SuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Cria uma resposta de erro padronizada
 * @param code - Código do erro
 * @param message - Mensagem do erro
 * @param details - Detalhes adicionais do erro
 * @returns Resposta de erro formatada
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: any
): ErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Cria uma resposta de erro de validação
 * @param errors - Lista de erros de validação
 * @returns Resposta de erro formatada
 */
export function createValidationErrorResponse(errors: string[]): ErrorResponse {
  return createErrorResponse(
    'VALIDATION_ERROR',
    'Erro de validação dos dados',
    { errors }
  );
}

/**
 * Cria uma resposta de erro de autorização
 * @param message - Mensagem do erro
 * @returns Resposta de erro formatada
 */
export function createAuthErrorResponse(message: string = 'Não autorizado'): ErrorResponse {
  return createErrorResponse(
    'UNAUTHORIZED',
    message
  );
}

/**
 * Cria uma resposta de erro de recurso não encontrado
 * @param resource - Nome do recurso não encontrado
 * @returns Resposta de erro formatada
 */
export function createNotFoundErrorResponse(resource: string): ErrorResponse {
  return createErrorResponse(
    'NOT_FOUND',
    `${resource} não encontrado`
  );
}

// ============================================================================
// UTILITÁRIOS DE VALIDAÇÃO
// ============================================================================

/**
 * Valida dados usando um schema Zod
 * @param schema - Schema Zod para validação
 * @param data - Dados a serem validados
 * @returns Resultado da validação
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult {
  try {
    const validatedData = schema.parse(data);
    return {
      isValid: true,
      data: validatedData,
      errors: []
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
        data: undefined
      };
    }
    return {
      isValid: false,
      errors: ['Erro interno de validação'],
      data: undefined
    };
  }
}

/**
 * Valida dados de forma segura (não lança exceção)
 * @param schema - Schema Zod para validação
 * @param data - Dados a serem validados
 * @returns Dados validados ou null se inválido
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T | null {
  const result = validateData(schema, data);
  return result.isValid ? result.data : null;
}

// ============================================================================
// UTILITÁRIOS DE LOGGING
// ============================================================================

/**
 * Cria um log de execução
 * @param level - Nível do log
 * @param message - Mensagem do log
 * @param context - Contexto adicional
 * @param requestId - ID da requisição
 * @returns Log formatado
 */
export function createLog(
  level: ExecutionLog['level'],
  message: string,
  context?: Record<string, any>,
  requestId?: string
): ExecutionLog {
  return {
    level,
    message,
    context,
    timestamp: new Date().toISOString(),
    request_id: requestId || generateRequestId()
  };
}

/**
 * Gera um ID único para requisições
 * @returns ID único da requisição
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Loga uma mensagem de informação
 * @param message - Mensagem a ser logada
 * @param context - Contexto adicional
 * @param requestId - ID da requisição
 */
export function logInfo(
  message: string, 
  context?: Record<string, any>, 
  requestId?: string
): void {
  const log = createLog('info', message, context, requestId);
  console.log(JSON.stringify(log));
}

/**
 * Loga uma mensagem de aviso
 * @param message - Mensagem a ser logada
 * @param context - Contexto adicional
 * @param requestId - ID da requisição
 */
export function logWarn(
  message: string, 
  context?: Record<string, any>, 
  requestId?: string
): void {
  const log = createLog('warn', message, context, requestId);
  console.warn(JSON.stringify(log));
}

/**
 * Loga uma mensagem de erro
 * @param message - Mensagem a ser logada
 * @param context - Contexto adicional
 * @param requestId - ID da requisição
 */
export function logError(
  message: string, 
  context?: Record<string, any>, 
  requestId?: string
): void {
  const log = createLog('error', message, context, requestId);
  console.error(JSON.stringify(log));
}

/**
 * Loga uma mensagem de debug
 * @param message - Mensagem a ser logada
 * @param context - Contexto adicional
 * @param requestId - ID da requisição
 */
export function logDebug(
  message: string, 
  context?: Record<string, any>, 
  requestId?: string
): void {
  const log = createLog('debug', message, context, requestId);
  console.debug(JSON.stringify(log));
}

// ============================================================================
// UTILITÁRIOS DE CONTEXTO
// ============================================================================

/**
 * Extrai contexto da requisição Supabase
 * @param request - Objeto de requisição do Supabase
 * @returns Contexto da função
 */
export function extractContext(request: any): FunctionContext {
  const user = request.user;
  const requestId = generateRequestId();
  
  return {
    user_id: user?.id || 'anonymous',
    user_email: user?.email || 'anonymous@example.com',
    user_role: user?.role || 'anonymous',
    request_id: requestId,
    timestamp: new Date().toISOString()
  };
}

/**
 * Verifica se o usuário tem permissão para acessar um recurso
 * @param userId - ID do usuário
 * @param resourceOwnerId - ID do proprietário do recurso
 * @param userRole - Role do usuário
 * @returns true se tem permissão
 */
export function hasPermission(
  userId: string,
  resourceOwnerId: string,
  userRole: string
): boolean {
  // Administradores têm acesso a tudo
  if (userRole === 'admin') return true;
  
  // Usuários podem acessar seus próprios recursos
  if (userId === resourceOwnerId) return true;
  
  // Managers podem acessar recursos da equipe
  if (userRole === 'manager') return true;
  
  return false;
}

// ============================================================================
// UTILITÁRIOS DE DADOS
// ============================================================================

/**
 * Sanitiza dados removendo campos sensíveis
 * @param data - Dados a serem sanitizados
 * @param sensitiveFields - Campos sensíveis a serem removidos
 * @returns Dados sanitizados
 */
export function sanitizeData(
  data: Record<string, any>,
  sensitiveFields: string[] = ['password', 'token', 'secret', 'key']
): Record<string, any> {
  const sanitized = { ...data };
  
  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });
  
  return sanitized;
}

/**
 * Converte um objeto para query string
 * @param params - Parâmetros a serem convertidos
 * @returns Query string
 */
export function toQueryString(params: Record<string, any>): string {
  return new URLSearchParams(
    Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)])
  ).toString();
}

/**
 * Gera um slug a partir de uma string
 * @param text - Texto a ser convertido em slug
 * @returns Slug gerado
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Formata uma data para exibição
 * @param date - Data a ser formatada
 * @param locale - Locale para formatação
 * @returns Data formatada
 */
export function formatDate(
  date: string | Date,
  locale: string = 'pt-BR'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ============================================================================
// UTILITÁRIOS DE PERFORMANCE
// ============================================================================

/**
 * Mede o tempo de execução de uma função
 * @param fn - Função a ser medida
 * @param name - Nome da operação para logging
 * @returns Resultado da função
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>,
  name: string
): Promise<T> {
  const start = performance.now();
  
  try {
    const result = await fn();
    const end = performance.now();
    const duration = end - start;
    
    logInfo(`${name} executado em ${duration.toFixed(2)}ms`, {
      operation: name,
      duration_ms: duration
    });
    
    return result;
  } catch (error) {
    const end = performance.now();
    const duration = end - start;
    
    logError(`${name} falhou após ${duration.toFixed(2)}ms`, {
      operation: name,
      duration_ms: duration,
      error: error instanceof Error ? error.message : String(error)
    });
    
    throw error;
  }
}

/**
 * Retry com backoff exponencial
 * @param fn - Função a ser executada
 * @param maxRetries - Número máximo de tentativas
 * @param baseDelay - Delay base em ms
 * @returns Resultado da função
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
} 