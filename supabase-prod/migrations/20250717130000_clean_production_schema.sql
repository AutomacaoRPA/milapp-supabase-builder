-- Migração completa do MILAPP v2.0 - PRODUÇÃO (sem dados de exemplo)
-- Schema principal do MILAPP conforme especificação técnica

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Schema principal
CREATE SCHEMA IF NOT EXISTS milapp;

-- Tabela de Usuários
CREATE TABLE milapp.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    manager_id UUID REFERENCES milapp.users(id),
    azure_id VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    preferences JSONB DEFAULT '{}',
    last_login TIMESTAMP WITH TIME ZONE,
    password_last_changed TIMESTAMP WITH TIME ZONE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Projetos
CREATE TABLE milapp.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'automation',
    status VARCHAR(50) DEFAULT 'planning',
    priority VARCHAR(20) DEFAULT 'medium',
    methodology VARCHAR(20) DEFAULT 'scrum',
    team_id UUID,
    created_by UUID REFERENCES milapp.users(id),
    assigned_architect UUID REFERENCES milapp.users(id),
    product_owner UUID REFERENCES milapp.users(id),
    roi_target DECIMAL(10,2),
    roi_actual DECIMAL(10,2),
    estimated_effort INTEGER,
    actual_effort INTEGER,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Conversas IA
CREATE TABLE milapp.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES milapp.projects(id),
    user_id UUID REFERENCES milapp.users(id),
    title VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    context JSONB DEFAULT '{}',
    ai_summary TEXT,
    extracted_requirements JSONB DEFAULT '[]',
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Mensagens
CREATE TABLE milapp.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES milapp.conversations(id),
    type VARCHAR(50) NOT NULL,
    content TEXT,
    file_path VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    ai_analysis JSONB DEFAULT '{}',
    processing_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Documentos
CREATE TABLE milapp.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES milapp.projects(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL,
    template_id UUID,
    template_version VARCHAR(20),
    status VARCHAR(50) DEFAULT 'draft',
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES milapp.users(id),
    approved_by UUID REFERENCES milapp.users(id),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Sprints
CREATE TABLE milapp.sprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES milapp.projects(id),
    name VARCHAR(255) NOT NULL,
    goal TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'planning',
    capacity INTEGER DEFAULT 0,
    velocity INTEGER,
    retrospective_notes TEXT,
    satisfaction_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de User Stories/Tickets
CREATE TABLE milapp.user_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES milapp.projects(id),
    sprint_id UUID REFERENCES milapp.sprints(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'user_story',
    priority INTEGER DEFAULT 3,
    status VARCHAR(50) DEFAULT 'backlog',
    story_points INTEGER DEFAULT 0,
    assigned_to UUID REFERENCES milapp.users(id),
    rpa_bot_id UUID,
    acceptance_criteria JSONB DEFAULT '[]',
    dependencies JSONB DEFAULT '[]',
    labels JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Quality Gates
CREATE TABLE milapp.quality_gates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES milapp.projects(id),
    gate_type VARCHAR(10) NOT NULL,
    name VARCHAR(255),
    description TEXT,
    criteria JSONB NOT NULL,
    automated_checks JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'pending',
    overall_score DECIMAL(3,2),
    sla_hours INTEGER DEFAULT 48,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de Aprovações
CREATE TABLE milapp.approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gate_id UUID REFERENCES milapp.quality_gates(id),
    approver_id UUID REFERENCES milapp.users(id),
    approver_role VARCHAR(50),
    criteria_evaluated JSONB DEFAULT '{}',
    decision VARCHAR(20),
    comments TEXT,
    recommendations TEXT,
    sla_deadline TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    escalated BOOLEAN DEFAULT FALSE,
    escalated_to UUID REFERENCES milapp.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Recomendações RPA
CREATE TABLE milapp.tool_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES milapp.projects(id),
    analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recommended_tools JSONB NOT NULL,
    primary_tool VARCHAR(50),
    secondary_tools JSONB DEFAULT '[]',
    analysis_criteria JSONB DEFAULT '{}',
    complexity_score DECIMAL(3,2),
    estimated_effort JSONB DEFAULT '{}',
    roi_projection JSONB DEFAULT '{}',
    risk_assessment JSONB DEFAULT '{}',
    reasoning TEXT,
    confidence DECIMAL(3,2),
    similar_projects JSONB DEFAULT '[]'
);

-- Tabela de Artefatos de Código
CREATE TABLE milapp.code_artifacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES milapp.projects(id),
    repository_id UUID,
    name VARCHAR(255) NOT NULL,
    path VARCHAR(500),
    type VARCHAR(50),
    language VARCHAR(50),
    content TEXT,
    version VARCHAR(50),
    branch VARCHAR(100) DEFAULT 'main',
    status VARCHAR(50) DEFAULT 'development',
    created_by UUID REFERENCES milapp.users(id),
    reviewed_by UUID REFERENCES milapp.users(id),
    quality_score DECIMAL(3,2),
    security_score DECIMAL(3,2),
    test_coverage DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Deployments
CREATE TABLE milapp.deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES milapp.projects(id),
    version VARCHAR(50) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    deployment_type VARCHAR(50) DEFAULT 'rolling',
    status VARCHAR(50) DEFAULT 'pending',
    deployed_by UUID REFERENCES milapp.users(id),
    commit_hash VARCHAR(64),
    configuration JSONB DEFAULT '{}',
    health_checks JSONB DEFAULT '[]',
    rollback_plan JSONB DEFAULT '{}',
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de Monitoramento
CREATE TABLE milapp.monitoring_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES milapp.projects(id),
    metric_name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50),
    value DECIMAL(10,4),
    unit VARCHAR(20),
    threshold DECIMAL(10,4),
    status VARCHAR(20) DEFAULT 'ok',
    tags JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Dashboards
CREATE TABLE milapp.dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'custom',
    owner_id UUID REFERENCES milapp.users(id),
    layout JSONB NOT NULL,
    widgets JSONB DEFAULT '[]',
    filters JSONB DEFAULT '{}',
    permissions JSONB DEFAULT '[]',
    refresh_interval INTEGER DEFAULT 300,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Permissões
CREATE TABLE milapp.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES milapp.users(id),
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    action VARCHAR(50) NOT NULL,
    scope VARCHAR(50) DEFAULT 'own',
    granted_by UUID REFERENCES milapp.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Tabela de Auditoria
CREATE TABLE milapp.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES milapp.users(id),
    session_id VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    location VARCHAR(100),
    risk_score DECIMAL(3,2),
    status VARCHAR(20) DEFAULT 'success',
    details JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION milapp.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON milapp.users
    FOR EACH ROW
    EXECUTE FUNCTION milapp.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON milapp.projects
    FOR EACH ROW
    EXECUTE FUNCTION milapp.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON milapp.conversations
    FOR EACH ROW
    EXECUTE FUNCTION milapp.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON milapp.documents
    FOR EACH ROW
    EXECUTE FUNCTION milapp.update_updated_at_column();

CREATE TRIGGER update_sprints_updated_at
    BEFORE UPDATE ON milapp.sprints
    FOR EACH ROW
    EXECUTE FUNCTION milapp.update_updated_at_column();

CREATE TRIGGER update_user_stories_updated_at
    BEFORE UPDATE ON milapp.user_stories
    FOR EACH ROW
    EXECUTE FUNCTION milapp.update_updated_at_column();

CREATE TRIGGER update_code_artifacts_updated_at
    BEFORE UPDATE ON milapp.code_artifacts
    FOR EACH ROW
    EXECUTE FUNCTION milapp.update_updated_at_column();

CREATE TRIGGER update_dashboards_updated_at
    BEFORE UPDATE ON milapp.dashboards
    FOR EACH ROW
    EXECUTE FUNCTION milapp.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_projects_status ON milapp.projects(status);
CREATE INDEX idx_projects_created_by ON milapp.projects(created_by);
CREATE INDEX idx_conversations_project_id ON milapp.conversations(project_id);
CREATE INDEX idx_messages_conversation_id ON milapp.messages(conversation_id);
CREATE INDEX idx_user_stories_project_id ON milapp.user_stories(project_id);
CREATE INDEX idx_user_stories_assigned_to ON milapp.user_stories(assigned_to);
CREATE INDEX idx_quality_gates_project_id ON milapp.quality_gates(project_id);
CREATE INDEX idx_quality_gates_type ON milapp.quality_gates(gate_type);
CREATE INDEX idx_deployments_project_id ON milapp.deployments(project_id);
CREATE INDEX idx_monitoring_metrics_project_id ON milapp.monitoring_metrics(project_id);
CREATE INDEX idx_monitoring_metrics_timestamp ON milapp.monitoring_metrics(timestamp);
CREATE INDEX idx_audit_logs_user_id ON milapp.audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON milapp.audit_logs(timestamp);

-- Constraints de integridade
ALTER TABLE milapp.projects ADD CONSTRAINT chk_project_status 
CHECK (status IN ('planning', 'development', 'testing', 'deployed', 'maintenance', 'cancelled'));

ALTER TABLE milapp.user_stories ADD CONSTRAINT chk_user_story_type 
CHECK (type IN ('user_story', 'bug', 'task', 'epic', 'spike'));

ALTER TABLE milapp.user_stories ADD CONSTRAINT chk_user_story_status 
CHECK (status IN ('backlog', 'todo', 'in_progress', 'testing', 'done', 'cancelled'));

ALTER TABLE milapp.quality_gates ADD CONSTRAINT chk_gate_type 
CHECK (gate_type IN ('G1', 'G2', 'G3', 'G4'));

-- Habilitar RLS em todas as tabelas
ALTER TABLE milapp.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE milapp.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE milapp.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE milapp.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE milapp.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE milapp.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE milapp.user_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE milapp.quality_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE milapp.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milapp.tool_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE milapp.code_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE milapp.deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE milapp.monitoring_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE milapp.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE milapp.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE milapp.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (expandir conforme necessário)
CREATE POLICY "Users can view their own data" ON milapp.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view projects they participate in" ON milapp.projects
    FOR SELECT USING (
        created_by = auth.uid() 
        OR assigned_architect = auth.uid() 
        OR product_owner = auth.uid()
    );

CREATE POLICY "Users can view conversations they created" ON milapp.conversations
    FOR SELECT USING (user_id = auth.uid());

-- PRODUÇÃO: Base limpa, sem dados de exemplo
-- Todos os dados serão inseridos via aplicação após autenticação