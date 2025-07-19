/**
 * Tipos compartilhados para funções Supabase
 * Centraliza as definições de tipos usadas em múltiplas funções
 */

import { z } from 'zod';

// ============================================================================
// TIPOS BASE
// ============================================================================

/**
 * Status padrão para entidades do sistema
 */
export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

/**
 * Prioridades padrão para projetos e tarefas
 */
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Tipos de projeto suportados
 */
export enum ProjectType {
  AUTOMATION = 'automation',
  ENHANCEMENT = 'enhancement',
  MAINTENANCE = 'maintenance',
  MIGRATION = 'migration',
  INTEGRATION = 'integration'
}

/**
 * Metodologias de desenvolvimento
 */
export enum Methodology {
  SCRUM = 'scrum',
  KANBAN = 'kanban',
  WATERFALL = 'waterfall',
  AGILE = 'agile',
  HYBRID = 'hybrid'
}

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

/**
 * Schema base para projetos
 */
export const ProjectBaseSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  description: z.string().optional(),
  type: z.nativeEnum(ProjectType),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  methodology: z.nativeEnum(Methodology).default(Methodology.SCRUM),
  status: z.nativeEnum(EntityStatus).default(EntityStatus.PENDING),
  estimated_effort: z.number().positive().optional(),
  roi_target: z.number().positive().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Schema para criação de projetos
 */
export const CreateProjectSchema = ProjectBaseSchema.extend({
  created_by: z.string().uuid('ID do usuário deve ser um UUID válido'),
  team_id: z.string().uuid('ID da equipe deve ser um UUID válido').optional()
});

/**
 * Schema para atualização de projetos
 */
export const UpdateProjectSchema = ProjectBaseSchema.partial().extend({
  id: z.string().uuid('ID do projeto deve ser um UUID válido'),
  updated_by: z.string().uuid('ID do usuário deve ser um UUID válido')
});

/**
 * Schema para pipelines de projeto
 */
export const ProjectPipelineSchema = z.object({
  project_id: z.string().uuid('ID do projeto deve ser um UUID válido'),
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  description: z.string().optional(),
  type: z.enum(['ci_cd', 'deployment', 'testing', 'monitoring']),
  config: z.record(z.any()),
  status: z.nativeEnum(EntityStatus).default(EntityStatus.PENDING),
  created_by: z.string().uuid('ID do usuário deve ser um UUID válido')
});

// ============================================================================
// TIPOS DERIVADOS
// ============================================================================

/**
 * Tipo para projetos baseado no schema
 */
export type Project = z.infer<typeof ProjectBaseSchema> & {
  id: string;
  created_by: string;
  team_id?: string;
  created_at: string;
  updated_at: string;
};

/**
 * Tipo para criação de projetos
 */
export type CreateProject = z.infer<typeof CreateProjectSchema>;

/**
 * Tipo para atualização de projetos
 */
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;

/**
 * Tipo para pipelines de projeto
 */
export type ProjectPipeline = z.infer<typeof ProjectPipelineSchema> & {
  id: string;
  created_at: string;
  updated_at: string;
};

// ============================================================================
// TIPOS DE RESPOSTA
// ============================================================================

/**
 * Resposta padrão para operações de sucesso
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Resposta padrão para operações de erro
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * Tipo união para respostas da API
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Resposta para criação de projetos
 */
export interface CreateProjectResponse {
  project: Project;
  pipeline?: ProjectPipeline;
}

// ============================================================================
// TIPOS DE CONTEXTO
// ============================================================================

/**
 * Contexto de execução das funções
 */
export interface FunctionContext {
  user_id: string;
  user_email: string;
  user_role: string;
  request_id: string;
  timestamp: string;
}

/**
 * Log de execução
 */
export interface ExecutionLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  request_id: string;
}

// ============================================================================
// TIPOS DE VALIDAÇÃO
// ============================================================================

/**
 * Resultado de validação
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: any;
}

/**
 * Configurações de validação
 */
export interface ValidationConfig {
  strict: boolean;
  allowUnknown: boolean;
  stripUnknown: boolean;
} 