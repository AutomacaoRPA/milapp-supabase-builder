/**
 * Configurações centralizadas para funções Supabase
 * Centraliza todas as configurações e constantes usadas nas funções
 */

// ============================================================================
// CONFIGURAÇÕES DE AMBIENTE
// ============================================================================

/**
 * Configurações do ambiente Supabase
 */
export const SUPABASE_CONFIG = {
  URL: Deno.env.get('SUPABASE_URL')!,
  SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  ANON_KEY: Deno.env.get('SUPABASE_ANON_KEY')!,
  PROJECT_REF: Deno.env.get('SUPABASE_PROJECT_REF')!
};

/**
 * Configurações de ambiente da aplicação
 */
export const APP_CONFIG = {
  NODE_ENV: Deno.env.get('NODE_ENV') || 'development',
  DEBUG: Deno.env.get('DEBUG') === 'true',
  LOG_LEVEL: Deno.env.get('LOG_LEVEL') || 'info'
};

// ============================================================================
// CONFIGURAÇÕES DE BANCO DE DADOS
// ============================================================================

/**
 * Configurações de tabelas do banco
 */
export const DATABASE_TABLES = {
  PROJECTS: 'projects',
  PROJECT_PIPELINES: 'project_pipelines',
  USERS: 'users',
  TEAMS: 'teams',
  TASKS: 'tasks',
  COMMENTS: 'comments',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'audit_logs'
} as const;

/**
 * Configurações de RLS (Row Level Security)
 */
export const RLS_POLICIES = {
  PROJECTS: {
    SELECT: 'projects_select_policy',
    INSERT: 'projects_insert_policy',
    UPDATE: 'projects_update_policy',
    DELETE: 'projects_delete_policy'
  },
  PIPELINES: {
    SELECT: 'pipelines_select_policy',
    INSERT: 'pipelines_insert_policy',
    UPDATE: 'pipelines_update_policy',
    DELETE: 'pipelines_delete_policy'
  }
} as const;

// ============================================================================
// CONFIGURAÇÕES DE VALIDAÇÃO
// ============================================================================

/**
 * Limites de validação
 */
export const VALIDATION_LIMITS = {
  PROJECT_NAME_MAX_LENGTH: 255,
  PROJECT_DESCRIPTION_MAX_LENGTH: 1000,
  TAGS_MAX_COUNT: 10,
  ASSIGNEES_MAX_COUNT: 10,
  ESTIMATED_EFFORT_MAX: 1000,
  ROI_TARGET_MAX: 1000,
  PIPELINE_STAGES_MAX: 10
} as const;

/**
 * Regex patterns para validação
 */
export const VALIDATION_PATTERNS = {
  PROJECT_NAME: /^[a-zA-Z0-9\s\-_]+$/,
  SLUG: /^[a-z0-9\-]+$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
} as const;

// ============================================================================
// CONFIGURAÇÕES DE PIPELINE
// ============================================================================

/**
 * Configuração padrão de pipeline
 */
export const DEFAULT_PIPELINE_CONFIG = {
  stages: [
    { 
      name: 'development', 
      order: 1, 
      auto_approve: false,
      description: 'Ambiente de desenvolvimento'
    },
    { 
      name: 'testing', 
      order: 2, 
      auto_approve: false,
      description: 'Ambiente de testes'
    },
    { 
      name: 'staging', 
      order: 3, 
      auto_approve: false,
      description: 'Ambiente de homologação'
    },
    { 
      name: 'production', 
      order: 4, 
      auto_approve: false,
      description: 'Ambiente de produção'
    }
  ],
  settings: {
    require_approval: true,
    auto_deploy_dev: true,
    notifications: {
      slack: false,
      email: true,
      webhook: false
    },
    security: {
      scan_vulnerabilities: true,
      check_dependencies: true,
      validate_secrets: true
    }
  }
} as const;

/**
 * Tipos de pipeline suportados
 */
export const PIPELINE_TYPES = {
  CI_CD: 'ci_cd',
  DEPLOYMENT: 'deployment',
  TESTING: 'testing',
  MONITORING: 'monitoring',
  SECURITY: 'security'
} as const;

// ============================================================================
// CONFIGURAÇÕES DE LOGGING
// ============================================================================

/**
 * Níveis de log
 */
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
} as const;

/**
 * Configurações de logging
 */
export const LOGGING_CONFIG = {
  DEFAULT_LEVEL: LOG_LEVELS.INFO,
  MAX_LOG_SIZE: 1000,
  LOG_FORMAT: 'json',
  INCLUDE_TIMESTAMP: true,
  INCLUDE_REQUEST_ID: true
} as const;

// ============================================================================
// CONFIGURAÇÕES DE SEGURANÇA
// ============================================================================

/**
 * Configurações de autenticação
 */
export const AUTH_CONFIG = {
  JWT_EXPIRY: '24h',
  REFRESH_TOKEN_EXPIRY: '7d',
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutos
  PASSWORD_MIN_LENGTH: 8,
  REQUIRE_2FA: false
} as const;

/**
 * Roles de usuário
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DEVELOPER: 'developer',
  VIEWER: 'viewer',
  ANONYMOUS: 'anonymous'
} as const;

/**
 * Permissões por role
 */
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: ['*'], // Todas as permissões
  [USER_ROLES.MANAGER]: [
    'projects:read',
    'projects:write',
    'projects:delete',
    'pipelines:read',
    'pipelines:write',
    'users:read',
    'teams:read',
    'teams:write'
  ],
  [USER_ROLES.DEVELOPER]: [
    'projects:read',
    'projects:write',
    'pipelines:read',
    'pipelines:write',
    'tasks:read',
    'tasks:write'
  ],
  [USER_ROLES.VIEWER]: [
    'projects:read',
    'pipelines:read',
    'tasks:read'
  ],
  [USER_ROLES.ANONYMOUS]: []
} as const;

// ============================================================================
// CONFIGURAÇÕES DE PERFORMANCE
// ============================================================================

/**
 * Configurações de cache
 */
export const CACHE_CONFIG = {
  TTL: 5 * 60 * 1000, // 5 minutos
  MAX_SIZE: 1000,
  ENABLE_CACHE: true
} as const;

/**
 * Configurações de rate limiting
 */
export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutos
  MAX_REQUESTS: 100,
  SKIP_SUCCESSFUL_REQUESTS: false
} as const;

/**
 * Timeouts de operações
 */
export const TIMEOUT_CONFIG = {
  DATABASE_QUERY: 10000, // 10 segundos
  HTTP_REQUEST: 30000, // 30 segundos
  FUNCTION_EXECUTION: 60000 // 60 segundos
} as const;

// ============================================================================
// CONFIGURAÇÕES DE NOTIFICAÇÕES
// ============================================================================

/**
 * Configurações de notificações
 */
export const NOTIFICATION_CONFIG = {
  EMAIL: {
    ENABLED: true,
    PROVIDER: 'sendgrid',
    FROM_EMAIL: 'noreply@milapp.com',
    TEMPLATES: {
      PROJECT_CREATED: 'project-created',
      PIPELINE_UPDATED: 'pipeline-updated',
      TASK_ASSIGNED: 'task-assigned'
    }
  },
  SLACK: {
    ENABLED: false,
    WEBHOOK_URL: Deno.env.get('SLACK_WEBHOOK_URL'),
    CHANNELS: {
      PROJECTS: '#projects',
      PIPELINES: '#pipelines',
      ALERTS: '#alerts'
    }
  },
  WEBHOOK: {
    ENABLED: false,
    ENDPOINTS: []
  }
} as const;

// ============================================================================
// CONFIGURAÇÕES DE MONITORAMENTO
// ============================================================================

/**
 * Configurações de métricas
 */
export const METRICS_CONFIG = {
  ENABLED: true,
  COLLECT_DURATION: true,
  COLLECT_MEMORY: true,
  COLLECT_ERRORS: true,
  EXPORT_INTERVAL: 60 * 1000 // 1 minuto
} as const;

/**
 * Configurações de alertas
 */
export const ALERT_CONFIG = {
  ERROR_THRESHOLD: 5,
  ERROR_WINDOW: 5 * 60 * 1000, // 5 minutos
  PERFORMANCE_THRESHOLD: 5000, // 5 segundos
  MEMORY_THRESHOLD: 512 * 1024 * 1024 // 512MB
} as const;

// ============================================================================
// UTILITÁRIOS DE CONFIGURAÇÃO
// ============================================================================

/**
 * Verifica se todas as variáveis de ambiente necessárias estão definidas
 */
export function validateEnvironment(): void {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_ANON_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !Deno.env.get(varName));
  
  if (missingVars.length > 0) {
    throw new Error(`Variáveis de ambiente obrigatórias não definidas: ${missingVars.join(', ')}`);
  }
}

/**
 * Obtém configuração baseada no ambiente
 */
export function getConfigForEnvironment() {
  const isDevelopment = APP_CONFIG.NODE_ENV === 'development';
  
  return {
    ...APP_CONFIG,
    logging: {
      ...LOGGING_CONFIG,
      level: isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO
    },
    cache: {
      ...CACHE_CONFIG,
      enable: isDevelopment ? false : CACHE_CONFIG.ENABLE_CACHE
    },
    rateLimit: {
      ...RATE_LIMIT_CONFIG,
      maxRequests: isDevelopment ? 1000 : RATE_LIMIT_CONFIG.MAX_REQUESTS
    }
  };
}

/**
 * Verifica se o ambiente é de produção
 */
export function isProduction(): boolean {
  return APP_CONFIG.NODE_ENV === 'production';
}

/**
 * Verifica se o debug está habilitado
 */
export function isDebugEnabled(): boolean {
  return APP_CONFIG.DEBUG || APP_CONFIG.NODE_ENV === 'development';
} 