-- =====================================================
-- MILAPP MedSênior - Sistema de Comunicação Multicanal
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. PREFERÊNCIAS DE NOTIFICAÇÃO POR USUÁRIO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Canais de comunicação
    email_enabled BOOLEAN DEFAULT true,
    teams_enabled BOOLEAN DEFAULT true,
    whatsapp_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    
    -- Configurações por tipo de evento
    new_request_notifications JSONB DEFAULT '{"email": true, "teams": true, "whatsapp": false, "push": true}',
    status_change_notifications JSONB DEFAULT '{"email": true, "teams": true, "whatsapp": false, "push": true}',
    ai_response_notifications JSONB DEFAULT '{"email": false, "teams": false, "whatsapp": false, "push": true}',
    approval_required_notifications JSONB DEFAULT '{"email": true, "teams": true, "whatsapp": true, "push": true}',
    completion_notifications JSONB DEFAULT '{"email": true, "teams": true, "whatsapp": true, "push": true}',
    
    -- Configurações de horário
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    
    -- Configurações de frequência
    digest_enabled BOOLEAN DEFAULT false,
    digest_frequency VARCHAR(20) DEFAULT 'daily' CHECK (digest_frequency IN ('hourly', 'daily', 'weekly')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, project_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_project_id ON public.notification_preferences(project_id);

-- =====================================================
-- 2. LOGS DE E-MAIL
-- =====================================================

CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    project_id UUID REFERENCES public.projects(id),
    request_id UUID REFERENCES public.requests(id),
    
    -- Dados do e-mail
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    template_name VARCHAR(100),
    
    -- Status e tracking
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Metadata
    provider VARCHAR(50) DEFAULT 'resend', -- resend, sendgrid, smtp
    message_id VARCHAR(255), -- ID do provedor
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at);

-- =====================================================
-- 3. LOGS DE TEAMS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.teams_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    project_id UUID REFERENCES public.projects(id),
    request_id UUID REFERENCES public.requests(id),
    
    -- Dados da mensagem
    channel_id VARCHAR(255),
    message_text TEXT NOT NULL,
    card_data JSONB, -- Dados do card adaptativo
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Metadata
    webhook_url VARCHAR(500),
    message_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_teams_logs_user_id ON public.teams_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_logs_status ON public.teams_logs(status);

-- =====================================================
-- 4. LOGS DE WHATSAPP
-- =====================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    project_id UUID REFERENCES public.projects(id),
    request_id UUID REFERENCES public.requests(id),
    
    -- Dados da mensagem
    phone_number VARCHAR(20) NOT NULL,
    message_text TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'media', 'template')),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Metadata
    provider VARCHAR(50) DEFAULT 'twilio', -- twilio, zapi, gupshup
    message_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_user_id ON public.whatsapp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status ON public.whatsapp_logs(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_phone ON public.whatsapp_logs(phone_number);

-- =====================================================
-- 5. CONFIGURAÇÕES DE CANAIS POR PROJETO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.project_communication_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Configurações de e-mail
    email_provider VARCHAR(50) DEFAULT 'resend',
    email_from_address VARCHAR(255),
    email_from_name VARCHAR(255),
    email_api_key VARCHAR(500),
    
    -- Configurações do Teams
    teams_webhook_url VARCHAR(500),
    teams_channel_id VARCHAR(255),
    teams_bot_token VARCHAR(500),
    
    -- Configurações do WhatsApp
    whatsapp_provider VARCHAR(50) DEFAULT 'twilio',
    whatsapp_account_sid VARCHAR(255),
    whatsapp_auth_token VARCHAR(500),
    whatsapp_from_number VARCHAR(20),
    
    -- Configurações gerais
    default_channels JSONB DEFAULT '["email", "teams"]',
    enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_project_comm_config_project_id ON public.project_communication_config(project_id);

-- =====================================================
-- 6. FUNÇÕES PARA GESTÃO DE PREFERÊNCIAS
-- =====================================================

-- Função para obter preferências do usuário
CREATE OR REPLACE FUNCTION public.get_user_notification_preferences(
    p_user_id UUID,
    p_project_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    email_enabled BOOLEAN,
    teams_enabled BOOLEAN,
    whatsapp_enabled BOOLEAN,
    push_enabled BOOLEAN,
    new_request_notifications JSONB,
    status_change_notifications JSONB,
    ai_response_notifications JSONB,
    approval_required_notifications JSONB,
    completion_notifications JSONB,
    quiet_hours_enabled BOOLEAN,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR,
    digest_enabled BOOLEAN,
    digest_frequency VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        np.id,
        np.email_enabled,
        np.teams_enabled,
        np.whatsapp_enabled,
        np.push_enabled,
        np.new_request_notifications,
        np.status_change_notifications,
        np.ai_response_notifications,
        np.approval_required_notifications,
        np.completion_notifications,
        np.quiet_hours_enabled,
        np.quiet_hours_start,
        np.quiet_hours_end,
        np.timezone,
        np.digest_enabled,
        np.digest_frequency
    FROM public.notification_preferences np
    WHERE np.user_id = p_user_id
    AND (p_project_id IS NULL OR np.project_id = p_project_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar preferências
CREATE OR REPLACE FUNCTION public.update_notification_preferences(
    p_user_id UUID,
    p_project_id UUID,
    p_preferences JSONB
)
RETURNS UUID AS $$
DECLARE
    preference_id UUID;
BEGIN
    INSERT INTO public.notification_preferences (
        user_id,
        project_id,
        email_enabled,
        teams_enabled,
        whatsapp_enabled,
        push_enabled,
        new_request_notifications,
        status_change_notifications,
        ai_response_notifications,
        approval_required_notifications,
        completion_notifications,
        quiet_hours_enabled,
        quiet_hours_start,
        quiet_hours_end,
        timezone,
        digest_enabled,
        digest_frequency
    ) VALUES (
        p_user_id,
        p_project_id,
        COALESCE((p_preferences->>'email_enabled')::BOOLEAN, true),
        COALESCE((p_preferences->>'teams_enabled')::BOOLEAN, true),
        COALESCE((p_preferences->>'whatsapp_enabled')::BOOLEAN, false),
        COALESCE((p_preferences->>'push_enabled')::BOOLEAN, true),
        COALESCE(p_preferences->'new_request_notifications', '{"email": true, "teams": true, "whatsapp": false, "push": true}'::JSONB),
        COALESCE(p_preferences->'status_change_notifications', '{"email": true, "teams": true, "whatsapp": false, "push": true}'::JSONB),
        COALESCE(p_preferences->'ai_response_notifications', '{"email": false, "teams": false, "whatsapp": false, "push": true}'::JSONB),
        COALESCE(p_preferences->'approval_required_notifications', '{"email": true, "teams": true, "whatsapp": true, "push": true}'::JSONB),
        COALESCE(p_preferences->'completion_notifications', '{"email": true, "teams": true, "whatsapp": true, "push": true}'::JSONB),
        COALESCE((p_preferences->>'quiet_hours_enabled')::BOOLEAN, false),
        COALESCE((p_preferences->>'quiet_hours_start')::TIME, '22:00'::TIME),
        COALESCE((p_preferences->>'quiet_hours_end')::TIME, '08:00'::TIME),
        COALESCE(p_preferences->>'timezone', 'America/Sao_Paulo'),
        COALESCE((p_preferences->>'digest_enabled')::BOOLEAN, false),
        COALESCE(p_preferences->>'digest_frequency', 'daily')
    )
    ON CONFLICT (user_id, project_id)
    DO UPDATE SET
        email_enabled = EXCLUDED.email_enabled,
        teams_enabled = EXCLUDED.teams_enabled,
        whatsapp_enabled = EXCLUDED.whatsapp_enabled,
        push_enabled = EXCLUDED.push_enabled,
        new_request_notifications = EXCLUDED.new_request_notifications,
        status_change_notifications = EXCLUDED.status_change_notifications,
        ai_response_notifications = EXCLUDED.ai_response_notifications,
        approval_required_notifications = EXCLUDED.approval_required_notifications,
        completion_notifications = EXCLUDED.completion_notifications,
        quiet_hours_enabled = EXCLUDED.quiet_hours_enabled,
        quiet_hours_start = EXCLUDED.quiet_hours_start,
        quiet_hours_end = EXCLUDED.quiet_hours_end,
        timezone = EXCLUDED.timezone,
        digest_enabled = EXCLUDED.digest_enabled,
        digest_frequency = EXCLUDED.digest_frequency,
        updated_at = NOW()
    RETURNING id INTO preference_id;
    
    RETURN preference_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. FUNÇÕES PARA ENVIO DE COMUNICAÇÕES
-- =====================================================

-- Função para enviar e-mail
CREATE OR REPLACE FUNCTION public.send_email_notification(
    p_user_id UUID,
    p_project_id UUID,
    p_request_id UUID,
    p_subject VARCHAR(500),
    p_body TEXT,
    p_template_name VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    email_id UUID;
    user_email VARCHAR(255);
    project_config RECORD;
BEGIN
    -- Obter e-mail do usuário
    SELECT email INTO user_email
    FROM public.users
    WHERE id = p_user_id;
    
    -- Obter configuração do projeto
    SELECT * INTO project_config
    FROM public.project_communication_config
    WHERE project_id = p_project_id;
    
    -- Inserir log
    INSERT INTO public.email_logs (
        user_id,
        project_id,
        request_id,
        to_email,
        subject,
        body,
        template_name,
        provider,
        metadata
    ) VALUES (
        p_user_id,
        p_project_id,
        p_request_id,
        user_email,
        p_subject,
        p_body,
        p_template_name,
        COALESCE(project_config.email_provider, 'resend'),
        jsonb_build_object(
            'from_address', project_config.email_from_address,
            'from_name', project_config.email_from_name
        )
    ) RETURNING id INTO email_id;
    
    -- Aqui seria feita a integração real com o provedor de e-mail
    -- Por enquanto, apenas simular o envio
    UPDATE public.email_logs
    SET status = 'sent', sent_at = NOW()
    WHERE id = email_id;
    
    RETURN email_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para enviar mensagem Teams
CREATE OR REPLACE FUNCTION public.send_teams_notification(
    p_user_id UUID,
    p_project_id UUID,
    p_request_id UUID,
    p_message_text TEXT,
    p_card_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    teams_id UUID;
    project_config RECORD;
BEGIN
    -- Obter configuração do projeto
    SELECT * INTO project_config
    FROM public.project_communication_config
    WHERE project_id = p_project_id;
    
    -- Inserir log
    INSERT INTO public.teams_logs (
        user_id,
        project_id,
        request_id,
        channel_id,
        message_text,
        card_data,
        webhook_url,
        metadata
    ) VALUES (
        p_user_id,
        p_project_id,
        p_request_id,
        project_config.teams_channel_id,
        p_message_text,
        p_card_data,
        project_config.teams_webhook_url,
        jsonb_build_object(
            'bot_token', project_config.teams_bot_token
        )
    ) RETURNING id INTO teams_id;
    
    -- Aqui seria feita a integração real com o Teams
    -- Por enquanto, apenas simular o envio
    UPDATE public.teams_logs
    SET status = 'sent', sent_at = NOW()
    WHERE id = teams_id;
    
    RETURN teams_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para enviar WhatsApp
CREATE OR REPLACE FUNCTION public.send_whatsapp_message(
    p_user_id UUID,
    p_project_id UUID,
    p_request_id UUID,
    p_message_text TEXT,
    p_message_type VARCHAR(20) DEFAULT 'text'
)
RETURNS UUID AS $$
DECLARE
    whatsapp_id UUID;
    user_phone VARCHAR(20);
    project_config RECORD;
BEGIN
    -- Obter telefone do usuário (simulado)
    SELECT '5511999999999' INTO user_phone; -- Placeholder
    
    -- Obter configuração do projeto
    SELECT * INTO project_config
    FROM public.project_communication_config
    WHERE project_id = p_project_id;
    
    -- Inserir log
    INSERT INTO public.whatsapp_logs (
        user_id,
        project_id,
        request_id,
        phone_number,
        message_text,
        message_type,
        provider,
        metadata
    ) VALUES (
        p_user_id,
        p_project_id,
        p_request_id,
        user_phone,
        p_message_text,
        p_message_type,
        COALESCE(project_config.whatsapp_provider, 'twilio'),
        jsonb_build_object(
            'account_sid', project_config.whatsapp_account_sid,
            'from_number', project_config.whatsapp_from_number
        )
    ) RETURNING id INTO whatsapp_id;
    
    -- Aqui seria feita a integração real com o WhatsApp
    -- Por enquanto, apenas simular o envio
    UPDATE public.whatsapp_logs
    SET status = 'sent', sent_at = NOW()
    WHERE id = whatsapp_id;
    
    RETURN whatsapp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. FUNÇÃO DISPATCHER CENTRAL
-- =====================================================

-- Função principal para despachar notificações
CREATE OR REPLACE FUNCTION public.dispatch_notification(
    p_user_id UUID,
    p_project_id UUID,
    p_request_id UUID,
    p_event_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_link VARCHAR(500) DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
    user_prefs RECORD;
    project_config RECORD;
    channels JSONB;
    results JSONB := '[]'::JSONB;
    email_id UUID;
    teams_id UUID;
    whatsapp_id UUID;
BEGIN
    -- Obter preferências do usuário
    SELECT * INTO user_prefs
    FROM public.get_user_notification_preferences(p_user_id, p_project_id)
    LIMIT 1;
    
    -- Obter configuração do projeto
    SELECT * INTO project_config
    FROM public.project_communication_config
    WHERE project_id = p_project_id;
    
    -- Se não há configuração, usar padrão
    IF NOT FOUND THEN
        channels := '["email", "teams"]'::JSONB;
    ELSE
        channels := project_config.default_channels;
    END IF;
    
    -- Verificar se está em horário silencioso
    IF user_prefs.quiet_hours_enabled THEN
        -- Implementar lógica de horário silencioso
        -- Por enquanto, continuar
    END IF;
    
    -- Enviar por e-mail se habilitado
    IF user_prefs.email_enabled AND channels ? 'email' THEN
        SELECT public.send_email_notification(
            p_user_id,
            p_project_id,
            p_request_id,
            p_title,
            p_message,
            p_event_type
        ) INTO email_id;
        
        results := results || jsonb_build_object('channel', 'email', 'id', email_id, 'status', 'sent');
    END IF;
    
    -- Enviar por Teams se habilitado
    IF user_prefs.teams_enabled AND channels ? 'teams' THEN
        SELECT public.send_teams_notification(
            p_user_id,
            p_project_id,
            p_request_id,
            p_message,
            jsonb_build_object(
                'title', p_title,
                'text', p_message,
                'link', p_link,
                'metadata', p_metadata
            )
        ) INTO teams_id;
        
        results := results || jsonb_build_object('channel', 'teams', 'id', teams_id, 'status', 'sent');
    END IF;
    
    -- Enviar por WhatsApp se habilitado
    IF user_prefs.whatsapp_enabled AND channels ? 'whatsapp' THEN
        SELECT public.send_whatsapp_message(
            p_user_id,
            p_project_id,
            p_request_id,
            p_message
        ) INTO whatsapp_id;
        
        results := results || jsonb_build_object('channel', 'whatsapp', 'id', whatsapp_id, 'status', 'sent');
    END IF;
    
    -- Registrar auditoria
    PERFORM public.log_action(
        '00000000-0000-0000-0000-000000000000', -- System user
        'system',
        p_project_id,
        'notification_dispatch',
        p_request_id,
        'Notification Dispatch',
        'dispatch',
        jsonb_build_object(
            'event_type', p_event_type,
            'channels', results,
            'user_id', p_user_id
        )
    );
    
    RETURN results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. TRIGGERS PARA COMUNICAÇÃO AUTOMÁTICA
-- =====================================================

-- Trigger para notificar nova solicitação
CREATE OR REPLACE FUNCTION public.notify_new_request()
RETURNS TRIGGER AS $$
DECLARE
    project_name VARCHAR(255);
    solicitante_name VARCHAR(255);
BEGIN
    -- Obter dados
    SELECT p.name, u.name
    INTO project_name, solicitante_name
    FROM public.projects p
    JOIN public.users u ON u.id = NEW.solicitante_id
    WHERE p.id = NEW.project_id;
    
    -- Notificar gestores do projeto
    PERFORM public.dispatch_notification(
        NEW.solicitante_id,
        NEW.project_id,
        NEW.id,
        'new_request',
        'Nova Solicitação Criada',
        format('Solicitação "%s" foi criada no projeto "%s"', NEW.title, project_name),
        format('/requests/%s', NEW.id),
        jsonb_build_object(
            'request_title', NEW.title,
            'project_name', project_name,
            'solicitante', solicitante_name,
            'priority', NEW.priority
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger
DROP TRIGGER IF EXISTS trigger_notify_new_request ON public.requests;
CREATE TRIGGER trigger_notify_new_request
    AFTER INSERT ON public.requests
    FOR EACH ROW EXECUTE FUNCTION public.notify_new_request();

-- =====================================================
-- 10. VIEWS PARA RELATÓRIOS
-- =====================================================

-- View para estatísticas de comunicação
CREATE OR REPLACE VIEW public.communication_stats AS
SELECT 
    project_id,
    COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
    COUNT(*) FILTER (WHERE status = 'delivered') as delivered_count,
    AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) as avg_send_time_seconds
FROM (
    SELECT project_id, status, sent_at, created_at FROM public.email_logs
    UNION ALL
    SELECT project_id, status, sent_at, created_at FROM public.teams_logs
    UNION ALL
    SELECT project_id, status, sent_at, created_at FROM public.whatsapp_logs
) all_logs
GROUP BY project_id;

-- =====================================================
-- 11. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_communication_config ENABLE ROW LEVEL SECURITY;

-- Políticas para notification_preferences
CREATE POLICY "notification_preferences_own_access" ON public.notification_preferences
    FOR ALL USING (user_id = auth.uid());

-- Políticas para logs (apenas gestores podem ver)
CREATE POLICY "communication_logs_gestor_access" ON public.email_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.project_id = email_logs.project_id
            AND ur.role = 'gestor'
            AND ur.is_active = true
        )
    );

CREATE POLICY "communication_logs_gestor_access" ON public.teams_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.project_id = teams_logs.project_id
            AND ur.role = 'gestor'
            AND ur.is_active = true
        )
    );

CREATE POLICY "communication_logs_gestor_access" ON public.whatsapp_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.project_id = whatsapp_logs.project_id
            AND ur.role = 'gestor'
            AND ur.is_active = true
        )
    );

-- Políticas para configuração (apenas gestores)
CREATE POLICY "project_comm_config_gestor_access" ON public.project_communication_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.project_id = project_communication_config.project_id
            AND ur.role = 'gestor'
            AND ur.is_active = true
        )
    );

-- =====================================================
-- FIM DA MIGRAÇÃO DE COMUNICAÇÃO
-- ===================================================== 