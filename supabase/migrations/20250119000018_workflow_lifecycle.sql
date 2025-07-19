-- =====================================================
-- MILAPP MedSênior - Sistema de Ciclo de Vida de Processos
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. TABELA DE ESTADOS DE CICLO DE VIDA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.workflow_lifecycle_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    state_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Configuração do estado
    state_type VARCHAR(20) NOT NULL CHECK (state_type IN (
        'draft', 'active', 'pending', 'completed', 'archived', 'error'
    )),
    is_initial BOOLEAN DEFAULT false,
    is_final BOOLEAN DEFAULT false,
    is_blocking BOOLEAN DEFAULT false,
    
    -- Visualização
    color VARCHAR(7) DEFAULT '#1976d2', -- Hex color
    icon VARCHAR(50),
    order_index INTEGER DEFAULT 0,
    
    -- Controle
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. TABELA DE TRANSIÇÕES DE ESTADO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.workflow_lifecycle_transitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Estados
    from_state_id UUID REFERENCES public.workflow_lifecycle_states(id),
    to_state_id UUID REFERENCES public.workflow_lifecycle_states(id),
    
    -- Configuração
    transition_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Condições
    requires_approval BOOLEAN DEFAULT false,
    approval_role VARCHAR(50),
    conditions JSONB DEFAULT '{}',
    
    -- Ações
    auto_actions JSONB DEFAULT '[]', -- Ações automáticas na transição
    notifications JSONB DEFAULT '[]', -- Notificações a enviar
    
    -- Controle
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(from_state_id, to_state_id)
);

-- =====================================================
-- 3. ATUALIZAR TABELA DE WORKFLOWS COM LIFECYCLE
-- =====================================================

-- Adicionar campos de lifecycle aos workflows
ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS lifecycle_state_id UUID REFERENCES public.workflow_lifecycle_states(id),
ADD COLUMN IF NOT EXISTS lifecycle_progress_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS lifecycle_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS lifecycle_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS lifecycle_blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS lifecycle_blocked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS lifecycle_blocked_by UUID REFERENCES public.users(id);

-- =====================================================
-- 4. TABELA DE HISTÓRICO DE LIFECYCLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.workflow_lifecycle_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,
    from_state_id UUID REFERENCES public.workflow_lifecycle_states(id),
    to_state_id UUID REFERENCES public.workflow_lifecycle_states(id),
    
    -- Transição
    transition_id UUID REFERENCES public.workflow_lifecycle_transitions(id),
    transition_reason TEXT,
    
    -- Contexto
    triggered_by UUID REFERENCES public.users(id),
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Dados adicionais
    metadata JSONB DEFAULT '{}',
    comments TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_lifecycle_history_workflow ON public.workflow_lifecycle_history(workflow_id);
CREATE INDEX IF NOT EXISTS idx_lifecycle_history_triggered_at ON public.workflow_lifecycle_history(triggered_at);

-- =====================================================
-- 5. DADOS INICIAIS DE ESTADOS
-- =====================================================

-- Inserir estados padrão do lifecycle
INSERT INTO public.workflow_lifecycle_states (
    state_name,
    display_name,
    description,
    state_type,
    is_initial,
    is_final,
    is_blocking,
    color,
    icon,
    order_index
) VALUES 
(
    'draft',
    'Rascunho',
    'Workflow em desenvolvimento ou revisão',
    'draft',
    true,
    false,
    false,
    '#9e9e9e',
    'edit',
    1
),
(
    'review',
    'Em Revisão',
    'Aguardando aprovação ou revisão técnica',
    'pending',
    false,
    false,
    true,
    '#ff9800',
    'visibility',
    2
),
(
    'approved',
    'Aprovado',
    'Workflow aprovado e pronto para execução',
    'active',
    false,
    false,
    false,
    '#4caf50',
    'check_circle',
    3
),
(
    'active',
    'Em Execução',
    'Workflow ativo e sendo executado',
    'active',
    false,
    false,
    false,
    '#2196f3',
    'play_arrow',
    4
),
(
    'paused',
    'Pausado',
    'Workflow temporariamente interrompido',
    'pending',
    false,
    false,
    true,
    '#ff9800',
    'pause',
    5
),
(
    'completed',
    'Concluído',
    'Workflow executado com sucesso',
    'completed',
    false,
    true,
    false,
    '#4caf50',
    'done_all',
    6
),
(
    'archived',
    'Arquivado',
    'Workflow arquivado para referência',
    'archived',
    false,
    true,
    false,
    '#757575',
    'archive',
    7
),
(
    'error',
    'Com Erro',
    'Workflow com falha ou erro',
    'error',
    false,
    false,
    true,
    '#f44336',
    'error',
    8
);

-- Inserir transições padrão
INSERT INTO public.workflow_lifecycle_transitions (
    from_state_id,
    to_state_id,
    transition_name,
    description,
    requires_approval,
    approval_role
) 
SELECT 
    (SELECT id FROM public.workflow_lifecycle_states WHERE state_name = 'draft'),
    (SELECT id FROM public.workflow_lifecycle_states WHERE state_name = 'review'),
    'Enviar para Revisão',
    'Enviar workflow para aprovação',
    false,
    NULL

UNION ALL

SELECT 
    (SELECT id FROM public.workflow_lifecycle_states WHERE state_name = 'review'),
    (SELECT id FROM public.workflow_lifecycle_states WHERE state_name = 'approved'),
    'Aprovar',
    'Aprovar workflow para execução',
    true,
    'manager'

UNION ALL

SELECT 
    (SELECT id FROM public.workflow_lifecycle_states WHERE state_name = 'review'),
    (SELECT id FROM public.workflow_lifecycle_states WHERE state_name = 'draft'),
    'Rejeitar',
    'Rejeitar e retornar para rascunho',
    true,
    'manager'

UNION ALL

SELECT 
    (SELECT id FROM public.workflow_lifecycle_states WHERE state_name = 'approved'),
    (SELECT id FROM public.workflow_lifecycle_states WHERE state_name = 'active'),
    'Ativar',
    'Ativar workflow para execução',
    false,
    NULL

UNION ALL

SELECT 
    (SELECT id FROM public.workflow_lifecycle_states WHERE state_name = 'active'),
    (SELECT id FROM public.workflow_lifecycle_states WHERE state_name = 'paused'),
    'Pausar',
    'Pausar execução do workflow',
    false,
    NULL

UNION ALL

SELECT 
    (SELECT id FROM public.workflow_lifecycle_states WHERE state_name = 'paused'),
    (SELECT id FROM public.workflow_lifecycle_states WHERE state_name = 'active'),
    'Retomar',
    'Retomar execução do workflow',
    false,
    NULL

UNION ALL

SELECT 
    (SELECT id FROM public.workflow_lifecycle_states WHERE state_name = 'active'),
    (SELECT id FROM public.workflow_lifecycle_states WHERE state_name = 'completed'),
    'Finalizar',
    'Marcar workflow como concluído',
    false,
    NULL

UNION ALL

SELECT 
    (SELECT id FROM public.workflow_lifecycle_states WHERE state_name = 'completed'),
    (SELECT id FROM public.workflow_lifecycle_states WHERE state_name = 'archived'),
    'Arquivar',
    'Arquivar workflow concluído',
    false,
    NULL;

-- =====================================================
-- 6. FUNÇÕES DE LIFECYCLE
-- =====================================================

-- Função para transicionar estado do workflow
CREATE OR REPLACE FUNCTION public.transition_workflow_state(
    p_workflow_id UUID,
    p_to_state_name VARCHAR(50),
    p_reason TEXT DEFAULT NULL,
    p_comments TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_state_id UUID;
    target_state_id UUID;
    transition_record RECORD;
    current_user_id UUID;
    user_role VARCHAR(50);
    can_transition BOOLEAN := false;
BEGIN
    -- Obter usuário atual
    current_user_id := auth.uid();
    
    -- Obter role do usuário
    SELECT ur.role INTO user_role
    FROM public.user_roles ur
    WHERE ur.user_id = current_user_id
    AND ur.is_active = true
    LIMIT 1;
    
    -- Obter estado atual
    SELECT lifecycle_state_id INTO current_state_id
    FROM public.workflows
    WHERE id = p_workflow_id;
    
    -- Obter estado alvo
    SELECT id INTO target_state_id
    FROM public.workflow_lifecycle_states
    WHERE state_name = p_to_state_name
    AND is_active = true;
    
    IF target_state_id IS NULL THEN
        RAISE EXCEPTION 'Estado de destino não encontrado: %', p_to_state_name;
    END IF;
    
    -- Verificar se transição é válida
    SELECT * INTO transition_record
    FROM public.workflow_lifecycle_transitions
    WHERE from_state_id = current_state_id
    AND to_state_id = target_state_id
    AND is_active = true;
    
    IF transition_record IS NULL THEN
        RAISE EXCEPTION 'Transição não permitida do estado atual para: %', p_to_state_name;
    END IF;
    
    -- Verificar aprovação se necessária
    IF transition_record.requires_approval THEN
        IF user_role != transition_record.approval_role AND user_role != 'admin' THEN
            RAISE EXCEPTION 'Aprovação necessária para esta transição. Role requerido: %', transition_record.approval_role;
        END IF;
    END IF;
    
    -- Executar transição
    UPDATE public.workflows 
    SET lifecycle_state_id = target_state_id,
        lifecycle_progress_percentage = (
            SELECT order_index * 100 / (SELECT MAX(order_index) FROM public.workflow_lifecycle_states)
            FROM public.workflow_lifecycle_states
            WHERE id = target_state_id
        ),
        lifecycle_started_at = CASE 
            WHEN target_state_id = (SELECT id FROM public.workflow_lifecycle_states WHERE state_name = 'active') 
            THEN NOW()
            ELSE lifecycle_started_at
        END,
        lifecycle_completed_at = CASE 
            WHEN target_state_id = (SELECT id FROM public.workflow_lifecycle_states WHERE state_name = 'completed') 
            THEN NOW()
            ELSE lifecycle_completed_at
        END,
        lifecycle_blocked_reason = NULL,
        lifecycle_blocked_at = NULL,
        lifecycle_blocked_by = NULL
    WHERE id = p_workflow_id;
    
    -- Registrar no histórico
    INSERT INTO public.workflow_lifecycle_history (
        workflow_id,
        from_state_id,
        to_state_id,
        transition_id,
        transition_reason,
        triggered_by,
        comments
    ) VALUES (
        p_workflow_id,
        current_state_id,
        target_state_id,
        transition_record.id,
        p_reason,
        current_user_id,
        p_comments
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Função para bloquear workflow
CREATE OR REPLACE FUNCTION public.block_workflow(
    p_workflow_id UUID,
    p_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
    blocked_state_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    -- Obter estado de bloqueio
    SELECT id INTO blocked_state_id
    FROM public.workflow_lifecycle_states
    WHERE state_name = 'error'
    AND is_active = true;
    
    -- Atualizar workflow
    UPDATE public.workflows 
    SET lifecycle_state_id = blocked_state_id,
        lifecycle_blocked_reason = p_reason,
        lifecycle_blocked_at = NOW(),
        lifecycle_blocked_by = current_user_id
    WHERE id = p_workflow_id;
    
    -- Registrar no histórico
    INSERT INTO public.workflow_lifecycle_history (
        workflow_id,
        from_state_id,
        to_state_id,
        transition_reason,
        triggered_by
    ) VALUES (
        p_workflow_id,
        (SELECT lifecycle_state_id FROM public.workflows WHERE id = p_workflow_id),
        blocked_state_id,
        'Bloqueado: ' || p_reason,
        current_user_id
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Função para obter próximas transições disponíveis
CREATE OR REPLACE FUNCTION public.get_available_transitions(
    p_workflow_id UUID
)
RETURNS TABLE (
    transition_id UUID,
    transition_name VARCHAR(100),
    to_state_name VARCHAR(50),
    to_state_display VARCHAR(100),
    requires_approval BOOLEAN,
    approval_role VARCHAR(50),
    description TEXT
) AS $$
DECLARE
    current_state_id UUID;
BEGIN
    -- Obter estado atual
    SELECT lifecycle_state_id INTO current_state_id
    FROM public.workflows
    WHERE id = p_workflow_id;
    
    RETURN QUERY
    SELECT 
        wlt.id,
        wlt.transition_name,
        wls.state_name,
        wls.display_name,
        wlt.requires_approval,
        wlt.approval_role,
        wlt.description
    FROM public.workflow_lifecycle_transitions wlt
    JOIN public.workflow_lifecycle_states wls ON wlt.to_state_id = wls.id
    WHERE wlt.from_state_id = current_state_id
    AND wlt.is_active = true
    AND wls.is_active = true
    ORDER BY wls.order_index;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular progresso do lifecycle
CREATE OR REPLACE FUNCTION public.calculate_lifecycle_progress(
    p_workflow_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    current_state_order INTEGER;
    max_order INTEGER;
    progress INTEGER;
BEGIN
    -- Obter ordem do estado atual
    SELECT wls.order_index INTO current_state_order
    FROM public.workflows w
    JOIN public.workflow_lifecycle_states wls ON w.lifecycle_state_id = wls.id
    WHERE w.id = p_workflow_id;
    
    -- Obter ordem máxima
    SELECT MAX(order_index) INTO max_order
    FROM public.workflow_lifecycle_states
    WHERE is_active = true;
    
    -- Calcular progresso
    progress := (current_state_order * 100) / max_order;
    
    RETURN progress;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. TRIGGERS DE LIFECYCLE
-- =====================================================

-- Trigger para inicializar lifecycle
CREATE OR REPLACE FUNCTION public.trigger_initialize_lifecycle()
RETURNS TRIGGER AS $$
DECLARE
    draft_state_id UUID;
BEGIN
    -- Se não tem estado definido, definir como rascunho
    IF NEW.lifecycle_state_id IS NULL THEN
        SELECT id INTO draft_state_id
        FROM public.workflow_lifecycle_states
        WHERE state_name = 'draft'
        AND is_active = true;
        
        NEW.lifecycle_state_id := draft_state_id;
        NEW.lifecycle_progress_percentage := 0;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_initialize_lifecycle
    BEFORE INSERT ON public.workflows
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_initialize_lifecycle();

-- Trigger para atualizar progresso
CREATE OR REPLACE FUNCTION public.trigger_update_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar progresso quando estado muda
    IF OLD.lifecycle_state_id != NEW.lifecycle_state_id THEN
        NEW.lifecycle_progress_percentage := public.calculate_lifecycle_progress(NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_progress
    BEFORE UPDATE ON public.workflows
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_progress();

-- =====================================================
-- 8. VIEWS PARA LIFECYCLE
-- =====================================================

-- View para workflows por estado
CREATE OR REPLACE VIEW public.workflows_by_lifecycle_state AS
SELECT 
    wls.state_name,
    wls.display_name,
    wls.color,
    wls.icon,
    COUNT(w.id) as workflow_count,
    AVG(w.lifecycle_progress_percentage) as avg_progress
FROM public.workflow_lifecycle_states wls
LEFT JOIN public.workflows w ON wls.id = w.lifecycle_state_id
WHERE wls.is_active = true
GROUP BY wls.id, wls.state_name, wls.display_name, wls.color, wls.icon
ORDER BY wls.order_index;

-- View para workflows bloqueados
CREATE OR REPLACE VIEW public.blocked_workflows AS
SELECT 
    w.id,
    w.name,
    wls.display_name as current_state,
    w.lifecycle_blocked_reason,
    w.lifecycle_blocked_at,
    u.email as blocked_by_email,
    EXTRACT(EPOCH FROM (NOW() - w.lifecycle_blocked_at)) / 3600 as hours_blocked
FROM public.workflows w
JOIN public.workflow_lifecycle_states wls ON w.lifecycle_state_id = wls.id
LEFT JOIN public.users u ON w.lifecycle_blocked_by = u.id
WHERE wls.is_blocking = true
AND w.lifecycle_blocked_at IS NOT NULL
ORDER BY w.lifecycle_blocked_at;

-- View para histórico de lifecycle
CREATE OR REPLACE VIEW public.workflow_lifecycle_timeline AS
SELECT 
    w.name as workflow_name,
    wlh.triggered_at,
    from_state.display_name as from_state,
    to_state.display_name as to_state,
    wlh.transition_reason,
    u.email as triggered_by_email,
    wlh.comments
FROM public.workflow_lifecycle_history wlh
JOIN public.workflows w ON wlh.workflow_id = w.id
JOIN public.workflow_lifecycle_states from_state ON wlh.from_state_id = from_state.id
JOIN public.workflow_lifecycle_states to_state ON wlh.to_state_id = to_state.id
LEFT JOIN public.users u ON wlh.triggered_by = u.id
ORDER BY wlh.triggered_at DESC;

-- =====================================================
-- 9. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.workflow_lifecycle_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_lifecycle_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_lifecycle_history ENABLE ROW LEVEL SECURITY;

-- Políticas para workflow_lifecycle_states
CREATE POLICY "lifecycle_states_read_access" ON public.workflow_lifecycle_states
    FOR SELECT USING (is_active = true);

-- Políticas para workflow_lifecycle_transitions
CREATE POLICY "lifecycle_transitions_read_access" ON public.workflow_lifecycle_transitions
    FOR SELECT USING (is_active = true);

-- Políticas para workflow_lifecycle_history
CREATE POLICY "lifecycle_history_project_access" ON public.workflow_lifecycle_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workflows w
            JOIN public.user_roles ur ON w.project_id = ur.project_id
            WHERE w.id = workflow_lifecycle_history.workflow_id
            AND ur.user_id = auth.uid()
            AND ur.is_active = true
        )
    );

-- =====================================================
-- FIM DO SISTEMA DE LIFECYCLE
-- ===================================================== 