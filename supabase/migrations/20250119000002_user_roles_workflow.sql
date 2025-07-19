-- =====================================================
-- MILAPP MedSênior - Sistema de Papéis e Workflow
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. TABELA DE PAPÉIS DE USUÁRIO POR PROJETO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('solicitante', 'executor', 'gestor', 'ia')),
    is_primary BOOLEAN DEFAULT false, -- Papel principal do usuário no projeto
    assigned_by UUID REFERENCES public.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    
    UNIQUE(user_id, project_id, role),
    CONSTRAINT valid_role CHECK (role IN ('solicitante', 'executor', 'gestor', 'ia'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_project_id ON public.user_roles(project_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active);

-- =====================================================
-- 2. TABELA DE SOLICITAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    solicitante_id UUID NOT NULL REFERENCES public.users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    category VARCHAR(100),
    estimated_effort INTEGER, -- Horas estimadas
    actual_effort INTEGER, -- Horas reais
    current_state_id UUID, -- Referência ao estado atual
    assigned_to UUID REFERENCES public.users(id),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'review', 'approved', 'rejected', 'completed', 'cancelled')),
    attachments JSONB DEFAULT '[]',
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'review', 'approved', 'rejected', 'completed', 'cancelled'))
);

-- Índices para solicitações
CREATE INDEX IF NOT EXISTS idx_requests_project_id ON public.requests(project_id);
CREATE INDEX IF NOT EXISTS idx_requests_solicitante_id ON public.requests(solicitante_id);
CREATE INDEX IF NOT EXISTS idx_requests_assigned_to ON public.requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_requests_status ON public.requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_requested_at ON public.requests(requested_at);

-- =====================================================
-- 3. SISTEMA DE WORKFLOW CUSTOMIZÁVEL
-- =====================================================

CREATE TABLE IF NOT EXISTS public.workflow_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280', -- Cor hex para UI
    icon VARCHAR(50), -- Ícone para UI
    is_initial BOOLEAN DEFAULT false, -- Estado inicial
    is_final BOOLEAN DEFAULT false, -- Estado final
    requires_approval BOOLEAN DEFAULT false, -- Requer aprovação
    allowed_roles TEXT[] DEFAULT '{}', -- Quem pode mover para este estado
    auto_assign_role VARCHAR(50), -- Role que é automaticamente atribuído
    sla_hours INTEGER, -- SLA em horas
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(project_id, name),
    UNIQUE(project_id, order_index)
);

-- Índices para workflow
CREATE INDEX IF NOT EXISTS idx_workflow_states_project_id ON public.workflow_states(project_id);
CREATE INDEX IF NOT EXISTS idx_workflow_states_order ON public.workflow_states(order_index);
CREATE INDEX IF NOT EXISTS idx_workflow_states_active ON public.workflow_states(is_active);

-- =====================================================
-- 4. HISTÓRICO DE ESTADOS DAS SOLICITAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.request_status_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    from_state_id UUID REFERENCES public.workflow_states(id),
    to_state_id UUID NOT NULL REFERENCES public.workflow_states(id),
    updated_by UUID NOT NULL REFERENCES public.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    comments TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Índices para histórico
CREATE INDEX IF NOT EXISTS idx_request_status_log_request_id ON public.request_status_log(request_id);
CREATE INDEX IF NOT EXISTS idx_request_status_log_updated_at ON public.request_status_log(updated_at);

-- =====================================================
-- 5. THREADS DE IA POR SOLICITAÇÃO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.request_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id),
    title VARCHAR(255),
    context TEXT, -- Resumo semântico da thread
    messages JSONB DEFAULT '[]', -- Array de mensagens
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_thread_status CHECK (status IN ('active', 'closed', 'archived'))
);

-- Índices para threads
CREATE INDEX IF NOT EXISTS idx_request_threads_request_id ON public.request_threads(request_id);
CREATE INDEX IF NOT EXISTS idx_request_threads_user_id ON public.request_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_request_threads_status ON public.request_threads(status);

-- =====================================================
-- 6. MENSAGENS DOS THREADS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.thread_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES public.request_threads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id),
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('user', 'ai', 'system')),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'decision', 'approval')),
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_sender_type CHECK (sender_type IN ('user', 'ai', 'system')),
    CONSTRAINT valid_message_type CHECK (message_type IN ('text', 'file', 'decision', 'approval'))
);

-- Índices para mensagens
CREATE INDEX IF NOT EXISTS idx_thread_messages_thread_id ON public.thread_messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_messages_sender_id ON public.thread_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_thread_messages_created_at ON public.thread_messages(created_at);

-- =====================================================
-- 7. FUNÇÕES PARA GESTÃO DE PAPÉIS
-- =====================================================

-- Função para obter papel atual do usuário em um projeto
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID, p_project_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    user_role VARCHAR(50);
BEGIN
    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = p_user_id
    AND project_id = p_project_id
    AND is_active = true
    ORDER BY is_primary DESC, assigned_at DESC
    LIMIT 1;
    
    RETURN COALESCE(user_role, 'readonly');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário tem papel específico
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_project_id UUID, p_role VARCHAR(50))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = p_user_id
        AND project_id = p_project_id
        AND role = p_role
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atribuir papel a usuário
CREATE OR REPLACE FUNCTION public.assign_user_role(
    p_user_id UUID,
    p_project_id UUID,
    p_role VARCHAR(50),
    p_assigned_by UUID,
    p_is_primary BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    role_id UUID;
BEGIN
    -- Verificar se já existe
    IF p_is_primary THEN
        -- Desativar outros papéis primários
        UPDATE public.user_roles
        SET is_primary = false
        WHERE user_id = p_user_id
        AND project_id = p_project_id
        AND is_active = true;
    END IF;
    
    -- Inserir ou atualizar papel
    INSERT INTO public.user_roles (
        user_id,
        project_id,
        role,
        is_primary,
        assigned_by
    ) VALUES (
        p_user_id,
        p_project_id,
        p_role,
        p_is_primary,
        p_assigned_by
    )
    ON CONFLICT (user_id, project_id, role)
    DO UPDATE SET
        is_primary = EXCLUDED.is_primary,
        assigned_by = EXCLUDED.assigned_by,
        assigned_at = NOW(),
        is_active = true
    RETURNING id INTO role_id;
    
    RETURN role_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. FUNÇÕES PARA WORKFLOW
-- =====================================================

-- Função para obter estados de um projeto
CREATE OR REPLACE FUNCTION public.get_project_states(p_project_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    description TEXT,
    order_index INTEGER,
    color VARCHAR(7),
    icon VARCHAR(50),
    is_initial BOOLEAN,
    is_final BOOLEAN,
    requires_approval BOOLEAN,
    allowed_roles TEXT[],
    auto_assign_role VARCHAR(50),
    sla_hours INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ws.id,
        ws.name,
        ws.description,
        ws.order_index,
        ws.color,
        ws.icon,
        ws.is_initial,
        ws.is_final,
        ws.requires_approval,
        ws.allowed_roles,
        ws.auto_assign_role,
        ws.sla_hours
    FROM public.workflow_states ws
    WHERE ws.project_id = p_project_id
    AND ws.is_active = true
    ORDER BY ws.order_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para mover solicitação para próximo estado
CREATE OR REPLACE FUNCTION public.move_request_state(
    p_request_id UUID,
    p_to_state_id UUID,
    p_updated_by UUID,
    p_comments TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_state_id UUID;
    to_state_record RECORD;
    user_role VARCHAR(50);
    project_id UUID;
BEGIN
    -- Obter estado atual e projeto
    SELECT current_state_id, project_id INTO current_state_id, project_id
    FROM public.requests
    WHERE id = p_request_id;
    
    -- Obter informações do estado de destino
    SELECT * INTO to_state_record
    FROM public.workflow_states
    WHERE id = p_to_state_id;
    
    -- Verificar permissões
    user_role := public.get_user_role(p_updated_by, project_id);
    
    IF NOT (user_role = ANY(to_state_record.allowed_roles) OR user_role = 'gestor') THEN
        RAISE EXCEPTION 'Usuário não tem permissão para mover para este estado';
    END IF;
    
    -- Registrar mudança
    INSERT INTO public.request_status_log (
        request_id,
        from_state_id,
        to_state_id,
        updated_by,
        comments
    ) VALUES (
        p_request_id,
        current_state_id,
        p_to_state_id,
        p_updated_by,
        p_comments
    );
    
    -- Atualizar solicitação
    UPDATE public.requests
    SET 
        current_state_id = p_to_state_id,
        status = CASE 
            WHEN to_state_record.is_final THEN 'completed'
            WHEN to_state_record.requires_approval THEN 'review'
            ELSE 'in_progress'
        END,
        assigned_to = CASE 
            WHEN to_state_record.auto_assign_role IS NOT NULL THEN
                (SELECT user_id FROM public.user_roles 
                 WHERE project_id = project_id 
                 AND role = to_state_record.auto_assign_role 
                 AND is_active = true 
                 LIMIT 1)
            ELSE assigned_to
        END
    WHERE id = p_request_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. FUNÇÕES PARA THREADS DE IA
-- =====================================================

-- Função para criar novo thread
CREATE OR REPLACE FUNCTION public.create_request_thread(
    p_request_id UUID,
    p_user_id UUID,
    p_title VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    thread_id UUID;
BEGIN
    INSERT INTO public.request_threads (
        request_id,
        user_id,
        title
    ) VALUES (
        p_request_id,
        p_user_id,
        COALESCE(p_title, 'Nova conversa')
    ) RETURNING id INTO thread_id;
    
    RETURN thread_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para adicionar mensagem ao thread
CREATE OR REPLACE FUNCTION public.add_thread_message(
    p_thread_id UUID,
    p_sender_id UUID,
    p_sender_type VARCHAR(20),
    p_content TEXT,
    p_message_type VARCHAR(20) DEFAULT 'text'
)
RETURNS UUID AS $$
DECLARE
    message_id UUID;
BEGIN
    INSERT INTO public.thread_messages (
        thread_id,
        sender_id,
        sender_type,
        content,
        message_type
    ) VALUES (
        p_thread_id,
        p_sender_id,
        p_sender_type,
        p_content,
        p_message_type
    ) RETURNING id INTO message_id;
    
    -- Atualizar timestamp do thread
    UPDATE public.request_threads
    SET last_message_at = NOW(), updated_at = NOW()
    WHERE id = p_thread_id;
    
    RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. VIEWS PARA RELATÓRIOS
-- =====================================================

-- View para dashboard do solicitante
CREATE OR REPLACE VIEW public.solicitante_dashboard AS
SELECT 
    r.id as request_id,
    r.title,
    r.description,
    r.priority,
    r.status,
    r.requested_at,
    r.completed_at,
    p.name as project_name,
    p.id as project_id,
    ws.name as current_state,
    ws.color as state_color,
    ws.icon as state_icon,
    u.name as assigned_to_name,
    COUNT(tm.id) as message_count,
    MAX(tm.created_at) as last_message_at
FROM public.requests r
JOIN public.projects p ON r.project_id = p.id
LEFT JOIN public.workflow_states ws ON r.current_state_id = ws.id
LEFT JOIN public.users u ON r.assigned_to = u.id
LEFT JOIN public.request_threads rt ON r.id = rt.request_id
LEFT JOIN public.thread_messages tm ON rt.id = tm.thread_id
WHERE r.solicitante_id = auth.uid()
GROUP BY r.id, r.title, r.description, r.priority, r.status, r.requested_at, r.completed_at, 
         p.name, p.id, ws.name, ws.color, ws.icon, u.name;

-- View para dashboard do executor
CREATE OR REPLACE VIEW public.executor_dashboard AS
SELECT 
    r.id as request_id,
    r.title,
    r.description,
    r.priority,
    r.status,
    r.requested_at,
    r.started_at,
    r.completed_at,
    p.name as project_name,
    p.id as project_id,
    ws.name as current_state,
    ws.color as state_color,
    ws.icon as state_icon,
    u.name as solicitante_name,
    r.estimated_effort,
    r.actual_effort
FROM public.requests r
JOIN public.projects p ON r.project_id = p.id
LEFT JOIN public.workflow_states ws ON r.current_state_id = ws.id
LEFT JOIN public.users u ON r.solicitante_id = u.id
WHERE r.assigned_to = auth.uid()
AND r.status IN ('in_progress', 'review');

-- View para dashboard do gestor
CREATE OR REPLACE VIEW public.gestor_dashboard AS
SELECT 
    r.id as request_id,
    r.title,
    r.description,
    r.priority,
    r.status,
    r.requested_at,
    p.name as project_name,
    p.id as project_id,
    ws.name as current_state,
    ws.color as state_color,
    ws.icon as state_icon,
    u1.name as solicitante_name,
    u2.name as assigned_to_name,
    COUNT(rsl.id) as state_changes,
    MAX(rsl.updated_at) as last_state_change
FROM public.requests r
JOIN public.projects p ON r.project_id = p.id
LEFT JOIN public.workflow_states ws ON r.current_state_id = ws.id
LEFT JOIN public.users u1 ON r.solicitante_id = u1.id
LEFT JOIN public.users u2 ON r.assigned_to = u2.id
LEFT JOIN public.request_status_log rsl ON r.id = rsl.request_id
WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.project_id = p.id 
    AND ur.role = 'gestor' 
    AND ur.is_active = true
)
GROUP BY r.id, r.title, r.description, r.priority, r.status, r.requested_at, 
         p.name, p.id, ws.name, ws.color, ws.icon, u1.name, u2.name;

-- =====================================================
-- 11. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_status_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para user_roles
CREATE POLICY "user_roles_project_access" ON public.user_roles
    FOR ALL USING (
        public.has_role(auth.uid(), project_id, 'gestor') OR
        user_id = auth.uid()
    );

-- Políticas para requests
CREATE POLICY "requests_project_access" ON public.requests
    FOR ALL USING (
        solicitante_id = auth.uid() OR
        assigned_to = auth.uid() OR
        public.has_role(auth.uid(), project_id, 'gestor') OR
        public.has_role(auth.uid(), project_id, 'executor')
    );

-- Políticas para workflow_states
CREATE POLICY "workflow_states_project_access" ON public.workflow_states
    FOR ALL USING (
        public.has_role(auth.uid(), project_id, 'gestor') OR
        public.has_role(auth.uid(), project_id, 'executor')
    );

-- Políticas para request_threads
CREATE POLICY "request_threads_access" ON public.request_threads
    FOR ALL USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.requests r
            WHERE r.id = request_id
            AND (r.solicitante_id = auth.uid() OR 
                 r.assigned_to = auth.uid() OR
                 public.has_role(auth.uid(), r.project_id, 'gestor'))
        )
    );

-- Políticas para thread_messages
CREATE POLICY "thread_messages_access" ON public.thread_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.request_threads rt
            WHERE rt.id = thread_id
            AND (rt.user_id = auth.uid() OR
                 EXISTS (
                     SELECT 1 FROM public.requests r
                     WHERE r.id = rt.request_id
                     AND (r.solicitante_id = auth.uid() OR 
                          r.assigned_to = auth.uid() OR
                          public.has_role(auth.uid(), r.project_id, 'gestor'))
                 ))
        )
    );

-- =====================================================
-- 12. DADOS INICIAIS
-- =====================================================

-- Estados padrão para novos projetos
INSERT INTO public.workflow_states (project_id, name, description, order_index, color, icon, is_initial, is_final, requires_approval, allowed_roles, auto_assign_role) VALUES
-- Projeto 1 (se existir)
('00000000-0000-0000-0000-000000000001', 'Solicitação Recebida', 'Nova solicitação criada', 1, '#3B82F6', '📝', true, false, false, ARRAY['gestor'], 'executor'),
('00000000-0000-0000-0000-000000000001', 'Em Análise', 'Solicitação sendo analisada', 2, '#F59E0B', '🔍', false, false, false, ARRAY['executor'], NULL),
('00000000-0000-0000-0000-000000000001', 'Em Desenvolvimento', 'Solicitação em desenvolvimento', 3, '#10B981', '⚙️', false, false, false, ARRAY['executor'], NULL),
('00000000-0000-0000-0000-000000000001', 'Em Revisão', 'Aguardando aprovação', 4, '#8B5CF6', '👀', false, false, true, ARRAY['gestor'], NULL),
('00000000-0000-0000-0000-000000000001', 'Aprovado', 'Solicitação aprovada', 5, '#059669', '✅', false, false, false, ARRAY['gestor'], NULL),
('00000000-0000-0000-0000-000000000001', 'Entregue', 'Solicitação finalizada', 6, '#DC2626', '🎉', false, true, false, ARRAY['gestor'], NULL)
ON CONFLICT (project_id, name) DO NOTHING;

-- =====================================================
-- FIM DA MIGRAÇÃO
-- ===================================================== 