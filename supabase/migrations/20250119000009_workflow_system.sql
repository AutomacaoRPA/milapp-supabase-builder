-- =====================================================
-- MILAPP MedSênior - Sistema de Workflows BPMN-like
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. WORKFLOWS PRINCIPAIS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Informações básicas
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(20) DEFAULT '1.0',
    
    -- Configurações
    is_active BOOLEAN DEFAULT true,
    is_template BOOLEAN DEFAULT false,
    category VARCHAR(100),
    tags TEXT[],
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    
    -- Controle de versão
    parent_workflow_id UUID REFERENCES public.workflows(id),
    version_notes TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
        'draft', 'active', 'paused', 'archived', 'deprecated'
    )),
    
    -- Responsáveis
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_workflows_project_id ON public.workflows(project_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON public.workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_category ON public.workflows(category);

-- =====================================================
-- 2. NÓS DO WORKFLOW
-- =====================================================

CREATE TABLE IF NOT EXISTS public.workflow_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
    
    -- Identificação
    node_id VARCHAR(100) NOT NULL, -- ID único no React Flow
    label VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'start', 'end', 'task_human', 'task_automation', 'task_ai', 'gateway', 
        'webhook', 'document', 'subprocess', 'delay', 'notification'
    )),
    
    -- Posição e visual
    position_x DECIMAL(10,2) NOT NULL,
    position_y DECIMAL(10,2) NOT NULL,
    width INTEGER DEFAULT 150,
    height INTEGER DEFAULT 50,
    
    -- Dados específicos do tipo
    data JSONB DEFAULT '{}', -- Configurações específicas do nó
    
    -- Estilo
    style JSONB DEFAULT '{}', -- Estilos CSS customizados
    
    -- Validação
    is_valid BOOLEAN DEFAULT true,
    validation_errors TEXT[],
    
    -- Ordem de execução
    execution_order INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(workflow_id, node_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_workflow_id ON public.workflow_nodes(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_type ON public.workflow_nodes(type);
CREATE INDEX IF NOT EXISTS idx_workflow_nodes_execution_order ON public.workflow_nodes(execution_order);

-- =====================================================
-- 3. CONEXÕES DO WORKFLOW
-- =====================================================

CREATE TABLE IF NOT EXISTS public.workflow_edges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
    
    -- Identificação
    edge_id VARCHAR(100) NOT NULL, -- ID único no React Flow
    source_node_id VARCHAR(100) NOT NULL,
    target_node_id VARCHAR(100) NOT NULL,
    
    -- Configurações
    label VARCHAR(255),
    condition TEXT, -- Condição para gateway
    condition_type VARCHAR(50) DEFAULT 'simple' CHECK (condition_type IN (
        'simple', 'expression', 'ai_decision', 'external_api'
    )),
    
    -- Estilo
    style JSONB DEFAULT '{}',
    
    -- Validação
    is_valid BOOLEAN DEFAULT true,
    validation_errors TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(workflow_id, edge_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_workflow_edges_workflow_id ON public.workflow_edges(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_source ON public.workflow_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_workflow_edges_target ON public.workflow_edges(target_node_id);

-- =====================================================
-- 4. EXECUÇÕES DE WORKFLOW
-- =====================================================

CREATE TABLE IF NOT EXISTS public.workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
    
    -- Identificação
    execution_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255),
    
    -- Status e progresso
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'paused', 'completed', 'failed', 'cancelled'
    )),
    current_node_id VARCHAR(100),
    progress_percentage INTEGER DEFAULT 0,
    
    -- Dados de entrada/saída
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    context_data JSONB DEFAULT '{}',
    
    -- Controle de tempo
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_duration_minutes INTEGER,
    
    -- Responsáveis
    triggered_by UUID REFERENCES public.users(id),
    assigned_to UUID REFERENCES public.users(id),
    
    -- Resultado
    result_summary TEXT,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow_id ON public.workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_triggered_by ON public.workflow_executions(triggered_by);

-- =====================================================
-- 5. LOGS DE EXECUÇÃO DE NÓS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.workflow_node_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
    node_id VARCHAR(100) NOT NULL,
    
    -- Status da execução
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'pending', 'running', 'completed', 'failed', 'skipped'
    )),
    
    -- Dados de entrada/saída
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    
    -- Métricas
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- Resultado
    result_message TEXT,
    error_message TEXT,
    error_stack TEXT,
    
    -- Metadados
    retry_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_workflow_node_logs_execution_id ON public.workflow_node_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_workflow_node_logs_node_id ON public.workflow_node_logs(node_id);
CREATE INDEX IF NOT EXISTS idx_workflow_node_logs_status ON public.workflow_node_logs(status);

-- =====================================================
-- 6. CONFIGURAÇÕES DE INTEGRAÇÃO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.workflow_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Identificação
    name VARCHAR(255) NOT NULL,
    integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN (
        'n8n', 'make', 'zapier', 'webhook', 'openai', 'anthropic', 'email', 'teams', 'whatsapp'
    )),
    
    -- Configuração
    config JSONB NOT NULL, -- URLs, chaves, parâmetros
    is_active BOOLEAN DEFAULT true,
    
    -- Validação
    last_test_at TIMESTAMP WITH TIME ZONE,
    last_test_status VARCHAR(50),
    last_test_error TEXT,
    
    -- Metadados
    description TEXT,
    tags TEXT[],
    
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_workflow_integrations_project_id ON public.workflow_integrations(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_integrations_type ON public.workflow_integrations(integration_type);

-- =====================================================
-- 7. TEMPLATES DE WORKFLOW
-- =====================================================

CREATE TABLE IF NOT EXISTS public.workflow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    
    -- Template
    template_data JSONB NOT NULL, -- Nós e conexões do template
    thumbnail_url VARCHAR(500),
    
    -- Metadados
    tags TEXT[],
    difficulty_level VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty_level IN (
        'beginner', 'intermediate', 'advanced', 'expert'
    )),
    
    -- Estatísticas
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2),
    
    -- Controle
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON public.workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_public ON public.workflow_templates(is_public);

-- =====================================================
-- 8. FUNÇÕES PARA GESTÃO DE WORKFLOWS
-- =====================================================

-- Função para gerar ID único de execução
CREATE OR REPLACE FUNCTION public.generate_execution_id()
RETURNS VARCHAR(100) AS $$
DECLARE
    timestamp_str VARCHAR(20);
    random_str VARCHAR(10);
    execution_id VARCHAR(100);
BEGIN
    timestamp_str := TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS');
    random_str := SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
    execution_id := 'EXEC_' || timestamp_str || '_' || random_str;
    RETURN execution_id;
END;
$$ LANGUAGE plpgsql;

-- Função para validar workflow
CREATE OR REPLACE FUNCTION public.validate_workflow(p_workflow_id UUID)
RETURNS JSONB AS $$
DECLARE
    validation_result JSONB;
    node_count INTEGER;
    edge_count INTEGER;
    start_nodes INTEGER;
    end_nodes INTEGER;
    invalid_nodes TEXT[];
    invalid_edges TEXT[];
BEGIN
    -- Contar nós e conexões
    SELECT COUNT(*) INTO node_count FROM public.workflow_nodes WHERE workflow_id = p_workflow_id;
    SELECT COUNT(*) INTO edge_count FROM public.workflow_edges WHERE workflow_id = p_workflow_id;
    
    -- Verificar nós de início e fim
    SELECT COUNT(*) INTO start_nodes FROM public.workflow_nodes 
    WHERE workflow_id = p_workflow_id AND type = 'start';
    
    SELECT COUNT(*) INTO end_nodes FROM public.workflow_nodes 
    WHERE workflow_id = p_workflow_id AND type = 'end';
    
    -- Verificar nós inválidos
    SELECT ARRAY_AGG(node_id) INTO invalid_nodes FROM public.workflow_nodes 
    WHERE workflow_id = p_workflow_id AND is_valid = false;
    
    -- Verificar conexões inválidas
    SELECT ARRAY_AGG(edge_id) INTO invalid_edges FROM public.workflow_edges 
    WHERE workflow_id = p_workflow_id AND is_valid = false;
    
    -- Construir resultado
    validation_result := jsonb_build_object(
        'is_valid', 
        node_count > 0 AND 
        start_nodes = 1 AND 
        end_nodes >= 1 AND 
        invalid_nodes IS NULL AND 
        invalid_edges IS NULL,
        'node_count', node_count,
        'edge_count', edge_count,
        'start_nodes', start_nodes,
        'end_nodes', end_nodes,
        'invalid_nodes', COALESCE(invalid_nodes, '[]'::TEXT[]),
        'invalid_edges', COALESCE(invalid_edges, '[]'::TEXT[]),
        'errors', CASE 
            WHEN start_nodes != 1 THEN ARRAY['Workflow deve ter exatamente um nó de início']
            WHEN end_nodes < 1 THEN ARRAY['Workflow deve ter pelo menos um nó de fim']
            WHEN invalid_nodes IS NOT NULL THEN ARRAY['Existem nós com configuração inválida']
            WHEN invalid_edges IS NOT NULL THEN ARRAY['Existem conexões com configuração inválida']
            ELSE ARRAY[]::TEXT[]
        END
    );
    
    RETURN validation_result;
END;
$$ LANGUAGE plpgsql;

-- Função para executar workflow
CREATE OR REPLACE FUNCTION public.execute_workflow(
    p_workflow_id UUID,
    p_input_data JSONB DEFAULT '{}',
    p_triggered_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    execution_uuid UUID;
    execution_id VARCHAR(100);
    workflow_name VARCHAR(255);
BEGIN
    -- Validar workflow
    IF NOT (public.validate_workflow(p_workflow_id)->>'is_valid')::BOOLEAN THEN
        RAISE EXCEPTION 'Workflow inválido: %', public.validate_workflow(p_workflow_id)->>'errors';
    END IF;
    
    -- Obter nome do workflow
    SELECT name INTO workflow_name FROM public.workflows WHERE id = p_workflow_id;
    
    -- Gerar ID de execução
    execution_id := public.generate_execution_id();
    
    -- Criar execução
    INSERT INTO public.workflow_executions (
        workflow_id,
        execution_id,
        name,
        input_data,
        triggered_by,
        started_at
    ) VALUES (
        p_workflow_id,
        execution_id,
        workflow_name,
        p_input_data,
        COALESCE(p_triggered_by, auth.uid()),
        NOW()
    ) RETURNING id INTO execution_uuid;
    
    -- Inicializar logs para todos os nós
    INSERT INTO public.workflow_node_logs (
        execution_id,
        node_id,
        status
    )
    SELECT 
        execution_uuid,
        node_id,
        'pending'
    FROM public.workflow_nodes 
    WHERE workflow_id = p_workflow_id;
    
    RETURN execution_uuid;
END;
$$ LANGUAGE plpgsql;

-- Função para obter próximo nó
CREATE OR REPLACE FUNCTION public.get_next_node(
    p_execution_id UUID,
    p_current_node_id VARCHAR(100)
)
RETURNS VARCHAR(100) AS $$
DECLARE
    next_node_id VARCHAR(100);
BEGIN
    SELECT target_node_id INTO next_node_id
    FROM public.workflow_edges we
    JOIN public.workflow_executions wex ON we.workflow_id = wex.workflow_id
    WHERE wex.id = p_execution_id
    AND we.source_node_id = p_current_node_id
    LIMIT 1;
    
    RETURN next_node_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. FUNÇÕES PARA IA COMO COPILOTO
-- =====================================================

-- Função para gerar workflow via IA
CREATE OR REPLACE FUNCTION public.generate_workflow_ai(
    p_description TEXT,
    p_project_id UUID,
    p_category VARCHAR(100) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    workflow_data JSONB;
    workflow_id UUID;
    node_counter INTEGER := 1;
    edge_counter INTEGER := 1;
BEGIN
    -- Simular geração de workflow pela IA
    -- Em produção, chamaria OpenAI com prompt estruturado
    
    workflow_data := jsonb_build_object(
        'nodes', jsonb_build_array(
            jsonb_build_object(
                'id', 'start_' || node_counter,
                'type', 'start',
                'label', 'Início',
                'position', jsonb_build_object('x', 100, 'y', 100),
                'data', jsonb_build_object('description', 'Ponto de início do processo')
            ),
            jsonb_build_object(
                'id', 'task_' || (node_counter + 1),
                'type', 'task_human',
                'label', 'Tarefa Humana',
                'position', jsonb_build_object('x', 300, 'y', 100),
                'data', jsonb_build_object(
                    'description', 'Tarefa que requer intervenção humana',
                    'assigned_to', 'gestor',
                    'estimated_time', 30
                )
            ),
            jsonb_build_object(
                'id', 'ai_' || (node_counter + 2),
                'type', 'task_ai',
                'label', 'Análise IA',
                'position', jsonb_build_object('x', 500, 'y', 100),
                'data', jsonb_build_object(
                    'description', 'Análise automática com IA',
                    'ai_model', 'gpt-4',
                    'prompt_template', 'Analise os dados fornecidos...'
                )
            ),
            jsonb_build_object(
                'id', 'end_' || (node_counter + 3),
                'type', 'end',
                'label', 'Fim',
                'position', jsonb_build_object('x', 700, 'y', 100),
                'data', jsonb_build_object('description', 'Fim do processo')
            )
        ),
        'edges', jsonb_build_array(
            jsonb_build_object(
                'id', 'edge_' || edge_counter,
                'source', 'start_' || node_counter,
                'target', 'task_' || (node_counter + 1),
                'label', 'Iniciar'
            ),
            jsonb_build_object(
                'id', 'edge_' || (edge_counter + 1),
                'source', 'task_' || (node_counter + 1),
                'target', 'ai_' || (node_counter + 2),
                'label', 'Processar'
            ),
            jsonb_build_object(
                'id', 'edge_' || (edge_counter + 2),
                'source', 'ai_' || (node_counter + 2),
                'target', 'end_' || (node_counter + 3),
                'label', 'Finalizar'
            )
        )
    );
    
    RETURN workflow_data;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. TRIGGERS E AUTOMAÇÕES
-- =====================================================

-- Trigger para atualizar timestamps
CREATE TRIGGER trigger_update_workflows_updated_at
    BEFORE UPDATE ON public.workflows
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_update_workflow_nodes_updated_at
    BEFORE UPDATE ON public.workflow_nodes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_update_workflow_edges_updated_at
    BEFORE UPDATE ON public.workflow_edges
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_update_workflow_executions_updated_at
    BEFORE UPDATE ON public.workflow_executions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- 11. VIEWS PARA RELATÓRIOS
-- =====================================================

-- View para estatísticas de workflows
CREATE OR REPLACE VIEW public.workflow_stats AS
SELECT 
    w.project_id,
    COUNT(w.id) as total_workflows,
    COUNT(w.id) FILTER (WHERE w.status = 'active') as active_workflows,
    COUNT(we.id) as total_executions,
    COUNT(we.id) FILTER (WHERE we.status = 'completed') as completed_executions,
    COUNT(we.id) FILTER (WHERE we.status = 'failed') as failed_executions,
    AVG(EXTRACT(EPOCH FROM (we.completed_at - we.started_at)) / 60) as avg_duration_minutes
FROM public.workflows w
LEFT JOIN public.workflow_executions we ON w.id = we.workflow_id
GROUP BY w.project_id;

-- View para execuções recentes
CREATE OR REPLACE VIEW public.recent_workflow_executions AS
SELECT 
    we.id,
    we.execution_id,
    we.name,
    we.status,
    we.progress_percentage,
    we.started_at,
    we.completed_at,
    w.name as workflow_name,
    u.email as triggered_by_email
FROM public.workflow_executions we
JOIN public.workflows w ON we.workflow_id = w.id
LEFT JOIN public.users u ON we.triggered_by = u.id
ORDER BY we.created_at DESC;

-- =====================================================
-- 12. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_node_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para workflows
CREATE POLICY "workflows_project_access" ON public.workflows
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.project_id = workflows.project_id
            AND ur.is_active = true
        )
    );

-- Políticas para nós e conexões
CREATE POLICY "workflow_nodes_project_access" ON public.workflow_nodes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workflows w
            JOIN public.user_roles ur ON w.project_id = ur.project_id
            WHERE w.id = workflow_nodes.workflow_id
            AND ur.user_id = auth.uid()
            AND ur.is_active = true
        )
    );

CREATE POLICY "workflow_edges_project_access" ON public.workflow_edges
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workflows w
            JOIN public.user_roles ur ON w.project_id = ur.project_id
            WHERE w.id = workflow_edges.workflow_id
            AND ur.user_id = auth.uid()
            AND ur.is_active = true
        )
    );

-- Políticas para execuções
CREATE POLICY "workflow_executions_project_access" ON public.workflow_executions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workflows w
            JOIN public.user_roles ur ON w.project_id = ur.project_id
            WHERE w.id = workflow_executions.workflow_id
            AND ur.user_id = auth.uid()
            AND ur.is_active = true
        )
    );

-- =====================================================
-- FIM DA MIGRAÇÃO DE WORKFLOWS
-- ===================================================== 