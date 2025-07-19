// Tipos para o ciclo de vida completo do projeto (PMP + Ágil)

export type ProjectPhase = 
  | "initiation"      // Iniciação (PMP)
  | "planning"        // Planejamento (PMP)
  | "execution"       // Execução (PMP)
  | "monitoring"      // Monitoramento e Controle (PMP)
  | "closing";        // Encerramento (PMP)

export type ProjectStage = 
  | "ideacao"         // Captação de ideias
  | "priorizacao"     // Priorização e seleção
  | "planejamento"    // Planejamento detalhado
  | "desenvolvimento" // Desenvolvimento/Execução
  | "homologacao"     // Testes e homologação
  | "producao"        // Produção/Entrega
  | "sustentacao"     // Sustentação e evolução
  | "concluido";      // Projeto concluído

export type TaskStatus = 
  | "backlog"         // Backlog
  | "todo"            // A fazer
  | "in_progress"     // Em progresso
  | "review"          // Em revisão
  | "testing"         // Em teste
  | "done"            // Concluída
  | "blocked";        // Bloqueada

export type TaskPriority = 
  | "critical"        // Crítica
  | "high"            // Alta
  | "medium"          // Média
  | "low";            // Baixa

export type SprintStatus = 
  | "planning"        // Planejamento
  | "active"          // Ativo
  | "review"          // Revisão
  | "retrospective"   // Retrospectiva
  | "completed";      // Concluído

export type RiskLevel = 
  | "low"             // Baixo
  | "medium"          // Médio
  | "high"            // Alto
  | "critical";       // Crítico

// =====================================================
// NOVOS TIPOS PARA AZURE DEVOPS STYLE
// =====================================================

export type WorkItemType = 
  | "user_story"      // User Story
  | "bug"             // Bug
  | "task"            // Task
  | "epic"            // Epic
  | "spike";          // Spike

export type WorkItemStatus = 
  | "backlog"         // Backlog
  | "todo"            // To Do
  | "in_progress"     // In Progress
  | "review"          // Review
  | "testing"         // Testing
  | "done"            // Done
  | "cancelled";      // Cancelled

export type WorkItemPriority = 
  | "critical"        // Critical
  | "high"            // High
  | "medium"          // Medium
  | "low";            // Low

// Interface para subtarefa inline (Azure DevOps style)
export interface WorkItemSubtask {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  priority: WorkItemPriority;
  assignee?: {
    id: string;
    name?: string;
    avatar?: string;
  };
  estimated_hours?: number;
  actual_hours?: number;
  story_points?: number;
  due_date?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// Interface para work item principal (Azure DevOps style)
export interface WorkItem {
  id: string;
  title: string;
  description?: string;
  type: WorkItemType;
  priority: WorkItemPriority;
  status: WorkItemStatus;
  story_points?: number;
  assignee?: {
    id: string;
    name?: string;
    avatar?: string;
  };
  acceptance_criteria?: string[];
  dependencies?: string[];
  tags?: string[];
  comments: number;
  attachments: number;
  due_date?: string;
  rpa_bot_id?: string;
  subtasks: WorkItemSubtask[]; // Array de subtarefas inline
  created_at: string;
  updated_at: string;
}

// Interface para configuração do board Azure DevOps
export interface AzureDevOpsBoardConfig {
  board_settings: {
    show_subtasks_inline: boolean;
    enable_task_estimation: boolean;
    enable_time_tracking: boolean;
    enable_acceptance_criteria: boolean;
    enable_dependencies: boolean;
    max_subtasks_per_card: number;
    default_task_type: WorkItemType;
    default_priority: WorkItemPriority;
  };
  column_config: {
    [key: string]: {
      title: string;
      color: string;
      wip_limit?: number;
      allow_subtasks: boolean;
    };
  };
}

// Interface para coluna do Kanban
export interface KanbanColumn {
  id: string;
  title: string;
  status: WorkItemStatus;
  color: string;
  wip_limit?: number;
  allow_subtasks: boolean;
  work_items: WorkItem[];
}

// =====================================================
// TIPOS LEGADOS (MANTIDOS PARA COMPATIBILIDADE)
// =====================================================

// Interfaces para entidades do projeto (legado)

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  story_points?: number;
  estimated_hours?: number;
  actual_hours?: number;
  assignee?: string;
  sprint_id?: string;
  epic_id?: string;
  dependencies?: string[]; // IDs de tarefas dependentes
  acceptance_criteria?: string[];
  created_at: string;
  updated_at: string;
  due_date?: string;
  completed_at?: string;
}

export interface ProjectSprint {
  id: string;
  project_id: string;
  name: string;
  description: string;
  status: SprintStatus;
  start_date: string;
  end_date: string;
  velocity_target?: number;
  velocity_actual?: number;
  sprint_goal: string;
  retrospective_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectEpic {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  business_value: number;
  story_points?: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectRisk {
  id: string;
  project_id: string;
  title: string;
  description: string;
  probability: number; // 1-5
  impact: number; // 1-5
  level: RiskLevel;
  mitigation_strategy?: string;
  contingency_plan?: string;
  owner?: string;
  status: "open" | "mitigated" | "closed";
  created_at: string;
  updated_at: string;
}

export interface ProjectStakeholder {
  id: string;
  project_id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  influence: "high" | "medium" | "low";
  interest: "high" | "medium" | "low";
  engagement_strategy?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description: string;
  due_date: string;
  status: "pending" | "in_progress" | "completed" | "delayed";
  deliverables?: string[];
  dependencies?: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectDeployment {
  id: string;
  project_id: string;
  version: string;
  environment: "development" | "staging" | "production";
  status: "scheduled" | "in_progress" | "completed" | "failed" | "rolled_back";
  deployment_date: string;
  rollback_date?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  title: string;
  description: string;
  type: "requirements" | "design" | "test" | "user_guide" | "api_doc" | "other";
  file_url?: string;
  version: string;
  status: "draft" | "review" | "approved" | "obsolete";
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Interface expandida do projeto com todas as entidades
export interface ProjectLifecycle {
  // Informações básicas do projeto
  id: string;
  name: string;
  description: string;
  status: ProjectStage;
  phase: ProjectPhase;
  priority: number;
  methodology: "scrum" | "kanban" | "waterfall" | "hybrid";
  
  // Datas importantes
  start_date: string;
  target_date: string;
  completed_date?: string;
  
  // Equipe
  created_by: string;
  assigned_architect?: string;
  product_owner?: string;
  scrum_master?: string;
  
  // Métricas e ROI
  complexity_score: number;
  estimated_roi: number;
  actual_roi?: number;
  
  // Entidades relacionadas (legado)
  tasks: ProjectTask[];
  sprints: ProjectSprint[];
  epics: ProjectEpic[];
  risks: ProjectRisk[];
  stakeholders: ProjectStakeholder[];
  milestones: ProjectMilestone[];
  deployments: ProjectDeployment[];
  documents: ProjectDocument[];
  comments: Comment[];
  
  // NOVAS ENTIDADES AZURE DEVOPS STYLE
  work_items: WorkItem[]; // Work items com subtarefas inline
  azure_devops_config: AzureDevOpsBoardConfig; // Configuração do board
  kanban_board: {
    columns: KanbanColumn[];
  };
  sprint_backlog: WorkItem[];
  product_backlog: WorkItem[];
  
  // Métricas calculadas
  metrics: {
    total_tasks: number;
    completed_tasks: number;
    total_sprints: number;
    completed_sprints: number;
    deployment_count: number;
    last_deployment?: string;
    velocity_average: number;
    burndown_data: Array<{ date: string; remaining_points: number }>;
    risk_count: { low: number; medium: number; high: number; critical: number };
    stakeholder_engagement: number;
    // Novas métricas Azure DevOps
    total_work_items: number;
    completed_work_items: number;
    total_subtasks: number;
    completed_subtasks: number;
    work_item_velocity: number;
  };
  
  // Configurações do projeto
  settings: {
    sprint_duration_weeks: number;
    story_point_scale: "fibonacci" | "linear" | "custom";
    definition_of_done: string[];
    definition_of_ready: string[];
    working_hours_per_day: number;
    team_size: number;
  };
  
  // Timestamps
  created_at: string;
  updated_at: string;
} 