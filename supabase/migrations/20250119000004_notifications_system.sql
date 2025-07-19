-- =====================================================
-- MILAPP MedSênior - Sistema de Notificações em Tempo Real
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. TABELA DE NOTIFICAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'request_status_change',
        'request_assigned',
        'ai_response',
        'approval_required',
        'deadline_approaching',
        'workflow_update',
        'system_alert'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500), -- URL para navegar quando clicar
    metadata JSONB DEFAULT '{}', -- Dados adicionais
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE, -- Notificações que expiram
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_notification_type CHECK (type IN (
        'request_status_change',
        'request_assigned',
        'ai_response',
        'approval_required',
        'deadline_approaching',
        'workflow_update',
        'system_alert'
    ))
);

-- Índices para notificações
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_project_id ON public.notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);

-- =====================================================
-- 2. FUNÇÕES PARA GESTÃO DE NOTIFICAÇÕES
-- =====================================================

-- Função para criar notificação
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_project_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_link VARCHAR(500) DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_priority VARCHAR(20) DEFAULT 'normal',
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (
        user_id,
        project_id,
        type,
        title,
        message,
        link,
        metadata,
        priority,
        expires_at
    ) VALUES (
        p_user_id,
        p_project_id,
        p_type,
        p_title,
        p_message,
        p_link,
        p_metadata,
        p_priority,
        p_expires_at
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar notificação como lida
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.notifications
    SET is_read = true, read_at = NOW()
    WHERE id = p_notification_id
    AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para marcar todas as notificações como lidas
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_project_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.notifications
    SET is_read = true, read_at = NOW()
    WHERE user_id = auth.uid()
    AND is_read = false
    AND (p_project_id IS NULL OR project_id = p_project_id);
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter notificações do usuário
CREATE OR REPLACE FUNCTION public.get_user_notifications(
    p_project_id UUID DEFAULT NULL,
    p_unread_only BOOLEAN DEFAULT false,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    link VARCHAR(500),
    priority VARCHAR(20),
    is_read BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.link,
        n.priority,
        n.is_read,
        n.created_at,
        n.metadata
    FROM public.notifications n
    WHERE n.user_id = auth.uid()
    AND (p_project_id IS NULL OR n.project_id = p_project_id)
    AND (NOT p_unread_only OR n.is_read = false)
    AND (n.expires_at IS NULL OR n.expires_at > NOW())
    ORDER BY n.priority DESC, n.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. TRIGGERS PARA NOTIFICAÇÕES AUTOMÁTICAS
-- =====================================================

-- Trigger para notificar mudanças de status
CREATE OR REPLACE FUNCTION public.notify_status_change()
RETURNS TRIGGER AS $$
DECLARE
    request_data RECORD;
    solicitante_id UUID;
    gestor_ids UUID[];
    notification_title VARCHAR(255);
    notification_message TEXT;
BEGIN
    -- Obter dados da solicitação
    SELECT r.solicitante_id, r.title, r.project_id
    INTO request_data
    FROM public.requests r
    WHERE r.id = NEW.request_id;
    
    -- Obter gestores do projeto
    SELECT ARRAY_AGG(ur.user_id)
    INTO gestor_ids
    FROM public.user_roles ur
    WHERE ur.project_id = request_data.project_id
    AND ur.role = 'gestor'
    AND ur.is_active = true;
    
    -- Notificar solicitante
    notification_title := 'Status da Solicitação Atualizado';
    notification_message := format('Sua solicitação "%s" mudou para: %s', 
        request_data.title, 
        (SELECT name FROM public.workflow_states WHERE id = NEW.to_state_id)
    );
    
    PERFORM public.create_notification(
        request_data.solicitante_id,
        request_data.project_id,
        'request_status_change',
        notification_title,
        notification_message,
        format('/requests/%s', NEW.request_id),
        jsonb_build_object(
            'request_id', NEW.request_id,
            'from_state', OLD.to_state_id,
            'to_state', NEW.to_state_id,
            'updated_by', NEW.updated_by
        ),
        CASE 
            WHEN (SELECT is_final FROM public.workflow_states WHERE id = NEW.to_state_id) THEN 'high'
            ELSE 'normal'
        END
    );
    
    -- Notificar gestores se requer aprovação
    IF (SELECT requires_approval FROM public.workflow_states WHERE id = NEW.to_state_id) THEN
        FOREACH solicitante_id IN ARRAY gestor_ids
        LOOP
            PERFORM public.create_notification(
                solicitante_id,
                request_data.project_id,
                'approval_required',
                'Aprovação Necessária',
                format('Solicitação "%s" aguarda sua aprovação', request_data.title),
                format('/requests/%s', NEW.request_id),
                jsonb_build_object(
                    'request_id', NEW.request_id,
                    'current_state', NEW.to_state_id
                ),
                'high'
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_notify_status_change ON public.request_status_log;
CREATE TRIGGER trigger_notify_status_change
    AFTER INSERT ON public.request_status_log
    FOR EACH ROW EXECUTE FUNCTION public.notify_status_change();

-- Trigger para notificar respostas da IA
CREATE OR REPLACE FUNCTION public.notify_ai_response()
RETURNS TRIGGER AS $$
DECLARE
    thread_data RECORD;
    request_data RECORD;
BEGIN
    -- Apenas notificar respostas da IA
    IF NEW.sender_type != 'ai' THEN
        RETURN NEW;
    END IF;
    
    -- Obter dados do thread e request
    SELECT rt.user_id, rt.request_id
    INTO thread_data
    FROM public.request_threads rt
    WHERE rt.id = NEW.thread_id;
    
    SELECT r.title, r.project_id
    INTO request_data
    FROM public.requests r
    WHERE r.id = thread_data.request_id;
    
    -- Notificar usuário do thread
    PERFORM public.create_notification(
        thread_data.user_id,
        request_data.project_id,
        'ai_response',
        'Resposta da IA',
        format('IA respondeu sobre sua solicitação "%s"', request_data.title),
        format('/requests/%s/thread', thread_data.request_id),
        jsonb_build_object(
            'thread_id', NEW.thread_id,
            'request_id', thread_data.request_id,
            'message_preview', substring(NEW.content from 1 for 100)
        ),
        'normal'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_notify_ai_response ON public.thread_messages;
CREATE TRIGGER trigger_notify_ai_response
    AFTER INSERT ON public.thread_messages
    FOR EACH ROW EXECUTE FUNCTION public.notify_ai_response();

-- Trigger para notificar atribuição de solicitações
CREATE OR REPLACE FUNCTION public.notify_request_assignment()
RETURNS TRIGGER AS $$
DECLARE
    request_title VARCHAR(255);
    project_id UUID;
BEGIN
    -- Apenas notificar se foi atribuído a alguém
    IF NEW.assigned_to IS NULL OR OLD.assigned_to = NEW.assigned_to THEN
        RETURN NEW;
    END IF;
    
    -- Obter dados da solicitação
    SELECT r.title, r.project_id
    INTO request_title, project_id
    FROM public.requests r
    WHERE r.id = NEW.id;
    
    -- Notificar executor atribuído
    PERFORM public.create_notification(
        NEW.assigned_to,
        project_id,
        'request_assigned',
        'Nova Solicitação Atribuída',
        format('Você foi designado para a solicitação "%s"', request_title),
        format('/requests/%s', NEW.id),
        jsonb_build_object(
            'request_id', NEW.id,
            'priority', NEW.priority,
            'assigned_by', auth.uid()
        ),
        CASE 
            WHEN NEW.priority = 'critical' THEN 'urgent'
            WHEN NEW.priority = 'high' THEN 'high'
            ELSE 'normal'
        END
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_notify_request_assignment ON public.requests;
CREATE TRIGGER trigger_notify_request_assignment
    AFTER UPDATE ON public.requests
    FOR EACH ROW EXECUTE FUNCTION public.notify_request_assignment();

-- =====================================================
-- 4. FUNÇÕES PARA NOTIFICAÇÕES ESPECÍFICAS
-- =====================================================

-- Função para notificar deadline próximo
CREATE OR REPLACE FUNCTION public.notify_deadline_approaching()
RETURNS VOID AS $$
DECLARE
    request_record RECORD;
BEGIN
    -- Buscar solicitações com deadline próximo (24h)
    FOR request_record IN
        SELECT 
            r.id,
            r.title,
            r.solicitante_id,
            r.assigned_to,
            r.project_id,
            r.target_date
        FROM public.requests r
        WHERE r.target_date IS NOT NULL
        AND r.target_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
        AND r.status NOT IN ('completed', 'cancelled')
    LOOP
        -- Notificar solicitante
        PERFORM public.create_notification(
            request_record.solicitante_id,
            request_record.project_id,
            'deadline_approaching',
            'Deadline Próximo',
            format('Sua solicitação "%s" vence em breve', request_record.title),
            format('/requests/%s', request_record.id),
            jsonb_build_object(
                'request_id', request_record.id,
                'deadline', request_record.target_date,
                'hours_remaining', EXTRACT(EPOCH FROM (request_record.target_date - NOW())) / 3600
            ),
            'high'
        );
        
        -- Notificar executor se houver
        IF request_record.assigned_to IS NOT NULL THEN
            PERFORM public.create_notification(
                request_record.assigned_to,
                request_record.project_id,
                'deadline_approaching',
                'Deadline Próximo',
                format('Solicitação "%s" vence em breve', request_record.title),
                format('/requests/%s', request_record.id),
                jsonb_build_object(
                    'request_id', request_record.id,
                    'deadline', request_record.target_date,
                    'hours_remaining', EXTRACT(EPOCH FROM (request_record.target_date - NOW())) / 3600
                ),
                'high'
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para notificar gestores sobre métricas
CREATE OR REPLACE FUNCTION public.notify_gestors_metrics()
RETURNS VOID AS $$
DECLARE
    project_record RECORD;
    gestor_id UUID;
    pending_count INTEGER;
    overdue_count INTEGER;
BEGIN
    FOR project_record IN
        SELECT DISTINCT p.id, p.name
        FROM public.projects p
        JOIN public.user_roles ur ON p.id = ur.project_id
        WHERE ur.role = 'gestor'
        AND ur.is_active = true
    LOOP
        -- Contar solicitações pendentes
        SELECT COUNT(*) INTO pending_count
        FROM public.requests r
        WHERE r.project_id = project_record.id
        AND r.status = 'pending';
        
        -- Contar solicitações atrasadas
        SELECT COUNT(*) INTO overdue_count
        FROM public.requests r
        WHERE r.project_id = project_record.id
        AND r.target_date < NOW()
        AND r.status NOT IN ('completed', 'cancelled');
        
        -- Notificar gestores se houver problemas
        IF pending_count > 5 OR overdue_count > 0 THEN
            FOR gestor_id IN
                SELECT ur.user_id
                FROM public.user_roles ur
                WHERE ur.project_id = project_record.id
                AND ur.role = 'gestor'
                AND ur.is_active = true
            LOOP
                PERFORM public.create_notification(
                    gestor_id,
                    project_record.id,
                    'system_alert',
                    'Métricas do Projeto',
                    format('Projeto "%s": %s pendentes, %s atrasadas', 
                        project_record.name, pending_count, overdue_count),
                    format('/projects/%s/analytics', project_record.id),
                    jsonb_build_object(
                        'project_id', project_record.id,
                        'pending_count', pending_count,
                        'overdue_count', overdue_count
                    ),
                    CASE 
                        WHEN overdue_count > 0 THEN 'urgent'
                        WHEN pending_count > 10 THEN 'high'
                        ELSE 'normal'
                    END
                );
            END LOOP;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. VIEWS PARA RELATÓRIOS DE NOTIFICAÇÕES
-- =====================================================

-- View para estatísticas de notificações
CREATE OR REPLACE VIEW public.notification_stats AS
SELECT 
    user_id,
    COUNT(*) as total_notifications,
    COUNT(*) FILTER (WHERE is_read = false) as unread_count,
    COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count,
    COUNT(*) FILTER (WHERE priority = 'high') as high_count,
    COUNT(*) FILTER (WHERE type = 'ai_response') as ai_responses,
    COUNT(*) FILTER (WHERE type = 'request_status_change') as status_changes,
    MAX(created_at) as last_notification
FROM public.notifications
GROUP BY user_id;

-- View para notificações por projeto
CREATE OR REPLACE VIEW public.project_notifications AS
SELECT 
    project_id,
    type,
    priority,
    COUNT(*) as notification_count,
    COUNT(*) FILTER (WHERE is_read = false) as unread_count,
    AVG(EXTRACT(EPOCH FROM (read_at - created_at))) as avg_read_time_seconds
FROM public.notifications
WHERE project_id IS NOT NULL
GROUP BY project_id, type, priority;

-- =====================================================
-- 6. FUNÇÕES DE MANUTENÇÃO
-- =====================================================

-- Função para limpar notificações expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.notifications 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar notificações antigas lidas
CREATE OR REPLACE FUNCTION public.cleanup_old_read_notifications(p_days INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.notifications 
    WHERE is_read = true 
    AND created_at < NOW() - INTERVAL '1 day' * p_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas notificações
CREATE POLICY "notifications_own_access" ON public.notifications
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- 8. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.notifications IS 'Sistema de notificações em tempo real';
COMMENT ON FUNCTION public.create_notification IS 'Cria uma nova notificação';
COMMENT ON FUNCTION public.mark_notification_read IS 'Marca notificação como lida';
COMMENT ON FUNCTION public.get_user_notifications IS 'Obtém notificações do usuário';

-- =====================================================
-- FIM DA MIGRAÇÃO DE NOTIFICAÇÕES
-- ===================================================== 