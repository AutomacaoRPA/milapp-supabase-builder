-- =====================================================
-- MILAPP MedSênior - Sistema de Auditoria Automática
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. TABELA DE LOG DE AUDITORIA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    user_email VARCHAR(255), -- Cache do email para performance
    role VARCHAR(50) NOT NULL, -- Papel do usuário no momento da ação
    project_id UUID REFERENCES public.projects(id),
    resource_type VARCHAR(100) NOT NULL, -- 'request', 'task', 'workflow_state', etc.
    resource_id UUID, -- ID do recurso afetado
    resource_name VARCHAR(255), -- Nome/identificação do recurso
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'approve', 'reject', etc.
    details JSONB DEFAULT '{}', -- Detalhes específicos da ação
    ip_address INET, -- IP do usuário
    user_agent TEXT, -- User agent do navegador
    session_id VARCHAR(255), -- ID da sessão
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para performance
    CONSTRAINT valid_action CHECK (action IN (
        'create', 'update', 'delete', 'approve', 'reject', 'assign', 'move', 'comment',
        'ai_interaction', 'status_change', 'role_change', 'permission_change'
    ))
);

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_project_id ON public.audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource_type ON public.audit_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_role ON public.audit_log(role);

-- =====================================================
-- 2. FUNÇÃO PARA LOG DE AÇÕES
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_action(
    p_user_id UUID,
    p_role VARCHAR(50),
    p_project_id UUID,
    p_resource_type VARCHAR(100),
    p_resource_id UUID,
    p_resource_name VARCHAR(255),
    p_action VARCHAR(100),
    p_details JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_session_id VARCHAR(255) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    user_email VARCHAR(255);
BEGIN
    -- Obter email do usuário
    SELECT email INTO user_email
    FROM public.users
    WHERE id = p_user_id;
    
    -- Inserir log
    INSERT INTO public.audit_log (
        user_id,
        user_email,
        role,
        project_id,
        resource_type,
        resource_id,
        resource_name,
        action,
        details,
        ip_address,
        user_agent,
        session_id
    ) VALUES (
        p_user_id,
        user_email,
        p_role,
        p_project_id,
        p_resource_type,
        p_resource_id,
        p_resource_name,
        p_action,
        p_details,
        p_ip_address,
        p_user_agent,
        p_session_id
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- =====================================================

-- Função para obter contexto da sessão
CREATE OR REPLACE FUNCTION public.get_audit_context()
RETURNS TABLE (
    user_id UUID,
    role VARCHAR(50),
    project_id UUID,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255)
) AS $$
DECLARE
    current_user_id UUID;
    current_role VARCHAR(50);
    current_project_id UUID;
BEGIN
    -- Obter usuário atual
    current_user_id := auth.uid();
    
    -- Obter papel atual (simulado - em produção viria do contexto)
    current_role := 'gestor'; -- Placeholder
    
    -- Obter projeto atual (simulado)
    current_project_id := '00000000-0000-0000-0000-000000000001'; -- Placeholder
    
    RETURN QUERY SELECT
        current_user_id,
        current_role,
        current_project_id,
        inet_client_addr(),
        current_setting('request.headers')::json->>'user-agent',
        current_setting('request.headers')::json->>'x-session-id';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auditoria de requests
CREATE OR REPLACE FUNCTION public.audit_request_changes()
RETURNS TRIGGER AS $$
DECLARE
    context_record RECORD;
    action_type VARCHAR(100);
    details JSONB;
BEGIN
    -- Obter contexto
    SELECT * INTO context_record FROM public.get_audit_context();
    
    -- Determinar tipo de ação
    IF TG_OP = 'INSERT' THEN
        action_type := 'create';
        details := jsonb_build_object(
            'new_data', to_jsonb(NEW),
            'operation', 'insert'
        );
    ELSIF TG_OP = 'UPDATE' THEN
        action_type := 'update';
        details := jsonb_build_object(
            'old_data', to_jsonb(OLD),
            'new_data', to_jsonb(NEW),
            'changes', to_jsonb(NEW) - to_jsonb(OLD),
            'operation', 'update'
        );
    ELSIF TG_OP = 'DELETE' THEN
        action_type := 'delete';
        details := jsonb_build_object(
            'old_data', to_jsonb(OLD),
            'operation', 'delete'
        );
    END IF;
    
    -- Registrar log
    PERFORM public.log_action(
        context_record.user_id,
        context_record.role,
        context_record.project_id,
        'request',
        COALESCE(NEW.id, OLD.id),
        COALESCE(NEW.title, OLD.title),
        action_type,
        details,
        context_record.ip_address,
        context_record.user_agent,
        context_record.session_id
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger em requests
DROP TRIGGER IF EXISTS trigger_audit_requests ON public.requests;
CREATE TRIGGER trigger_audit_requests
    AFTER INSERT OR UPDATE OR DELETE ON public.requests
    FOR EACH ROW EXECUTE FUNCTION public.audit_request_changes();

-- Trigger para auditoria de mudanças de status
CREATE OR REPLACE FUNCTION public.audit_status_changes()
RETURNS TRIGGER AS $$
DECLARE
    context_record RECORD;
    details JSONB;
BEGIN
    -- Obter contexto
    SELECT * INTO context_record FROM public.get_audit_context();
    
    -- Preparar detalhes
    details := jsonb_build_object(
        'from_state', OLD.to_state_id,
        'to_state', NEW.to_state_id,
        'comments', NEW.comments,
        'operation', 'status_change'
    );
    
    -- Registrar log
    PERFORM public.log_action(
        context_record.user_id,
        context_record.role,
        context_record.project_id,
        'request_status',
        NEW.request_id,
        'Status Change',
        'status_change',
        details,
        context_record.ip_address,
        context_record.user_agent,
        context_record.session_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger em request_status_log
DROP TRIGGER IF EXISTS trigger_audit_status_changes ON public.request_status_log;
CREATE TRIGGER trigger_audit_status_changes
    AFTER INSERT ON public.request_status_log
    FOR EACH ROW EXECUTE FUNCTION public.audit_status_changes();

-- Trigger para auditoria de interações IA
CREATE OR REPLACE FUNCTION public.audit_ai_interactions()
RETURNS TRIGGER AS $$
DECLARE
    context_record RECORD;
    details JSONB;
BEGIN
    -- Obter contexto
    SELECT * INTO context_record FROM public.get_audit_context();
    
    -- Preparar detalhes
    details := jsonb_build_object(
        'sender_type', NEW.sender_type,
        'message_type', NEW.message_type,
        'content_length', length(NEW.content),
        'has_attachments', jsonb_array_length(NEW.attachments) > 0,
        'operation', 'ai_interaction'
    );
    
    -- Registrar log
    PERFORM public.log_action(
        context_record.user_id,
        context_record.role,
        context_record.project_id,
        'ai_message',
        NEW.thread_id,
        'AI Interaction',
        'ai_interaction',
        details,
        context_record.ip_address,
        context_record.user_agent,
        context_record.session_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger em thread_messages
DROP TRIGGER IF EXISTS trigger_audit_ai_interactions ON public.thread_messages;
CREATE TRIGGER trigger_audit_ai_interactions
    AFTER INSERT ON public.thread_messages
    FOR EACH ROW EXECUTE FUNCTION public.audit_ai_interactions();

-- =====================================================
-- 4. FUNÇÕES PARA CONSULTA DE AUDITORIA
-- =====================================================

-- Função para obter logs de auditoria com filtros
CREATE OR REPLACE FUNCTION public.get_audit_logs(
    p_project_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_resource_type VARCHAR(100) DEFAULT NULL,
    p_action VARCHAR(100) DEFAULT NULL,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_email VARCHAR(255),
    role VARCHAR(50),
    resource_type VARCHAR(100),
    resource_name VARCHAR(255),
    action VARCHAR(100),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    ip_address INET
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.user_email,
        al.role,
        al.resource_type,
        al.resource_name,
        al.action,
        al.details,
        al.created_at,
        al.ip_address
    FROM public.audit_log al
    WHERE (p_project_id IS NULL OR al.project_id = p_project_id)
    AND (p_user_id IS NULL OR al.user_id = p_user_id)
    AND (p_resource_type IS NULL OR al.resource_type = p_resource_type)
    AND (p_action IS NULL OR al.action = p_action)
    AND (p_start_date IS NULL OR al.created_at >= p_start_date)
    AND (p_end_date IS NULL OR al.created_at <= p_end_date)
    ORDER BY al.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para estatísticas de auditoria
CREATE OR REPLACE FUNCTION public.get_audit_stats(
    p_project_id UUID DEFAULT NULL,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
    total_actions INTEGER,
    actions_by_type JSONB,
    actions_by_role JSONB,
    actions_by_user JSONB,
    most_active_users JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_actions,
        jsonb_object_agg(resource_type, COUNT(*)) as actions_by_type,
        jsonb_object_agg(role, COUNT(*)) as actions_by_role,
        jsonb_object_agg(user_email, COUNT(*)) as actions_by_user,
        jsonb_object_agg(
            user_email, 
            jsonb_build_object('count', COUNT(*), 'last_action', MAX(created_at))
        ) as most_active_users
    FROM public.audit_log al
    WHERE (p_project_id IS NULL OR al.project_id = p_project_id)
    AND (p_start_date IS NULL OR al.created_at >= p_start_date)
    AND (p_end_date IS NULL OR al.created_at <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. VIEWS PARA RELATÓRIOS DE AUDITORIA
-- =====================================================

-- View para relatório de atividades por usuário
CREATE OR REPLACE VIEW public.user_activity_report AS
SELECT 
    al.user_email,
    al.role,
    COUNT(*) as total_actions,
    COUNT(DISTINCT DATE(al.created_at)) as active_days,
    MIN(al.created_at) as first_action,
    MAX(al.created_at) as last_action,
    jsonb_object_agg(al.resource_type, COUNT(*)) as actions_by_resource,
    jsonb_object_agg(al.action, COUNT(*)) as actions_by_type
FROM public.audit_log al
GROUP BY al.user_email, al.role
ORDER BY total_actions DESC;

-- View para relatório de segurança
CREATE OR REPLACE VIEW public.security_report AS
SELECT 
    DATE(al.created_at) as action_date,
    al.user_email,
    al.role,
    al.action,
    al.resource_type,
    al.ip_address,
    COUNT(*) as action_count
FROM public.audit_log al
WHERE al.action IN ('delete', 'role_change', 'permission_change', 'approve', 'reject')
GROUP BY DATE(al.created_at), al.user_email, al.role, al.action, al.resource_type, al.ip_address
ORDER BY action_date DESC, action_count DESC;

-- =====================================================
-- 6. FUNÇÕES DE MANUTENÇÃO
-- =====================================================

-- Função para limpar logs antigos
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(p_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.audit_log 
    WHERE created_at < NOW() - INTERVAL '1 day' * p_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para exportar logs
CREATE OR REPLACE FUNCTION public.export_audit_logs(
    p_project_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    export_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT jsonb_build_object(
        'project_id', p_project_id,
        'start_date', p_start_date,
        'end_date', p_end_date,
        'exported_at', NOW(),
        'logs', jsonb_agg(
            jsonb_build_object(
                'id', al.id,
                'user_email', al.user_email,
                'role', al.role,
                'resource_type', al.resource_type,
                'resource_name', al.resource_name,
                'action', al.action,
                'details', al.details,
                'created_at', al.created_at,
                'ip_address', al.ip_address
            )
        )
    ) as export_data
    FROM public.audit_log al
    WHERE al.project_id = p_project_id
    AND al.created_at BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. POLÍTICAS RLS PARA AUDITORIA
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas para audit_log (apenas gestores podem ver)
CREATE POLICY "audit_log_gestor_access" ON public.audit_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.project_id = audit_log.project_id
            AND ur.role = 'gestor'
            AND ur.is_active = true
        )
    );

-- Política para usuários verem apenas seus próprios logs
CREATE POLICY "audit_log_own_access" ON public.audit_log
    FOR SELECT USING (
        user_id = auth.uid()
    );

-- =====================================================
-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.audit_log IS 'Log central de auditoria para todas as ações do sistema';
COMMENT ON FUNCTION public.log_action IS 'Função para registrar ações no log de auditoria';
COMMENT ON FUNCTION public.get_audit_logs IS 'Função para consultar logs de auditoria com filtros';
COMMENT ON FUNCTION public.get_audit_stats IS 'Função para obter estatísticas de auditoria';

-- =====================================================
-- FIM DA MIGRAÇÃO DE AUDITORIA
-- ===================================================== 