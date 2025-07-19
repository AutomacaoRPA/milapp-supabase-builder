-- =====================================================
-- MILAPP MedSênior - Sistema de Fila de Notificações com Retry
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. TABELA DE FILA DE NOTIFICAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    queue_id VARCHAR(100) UNIQUE NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'email', 'sms', 'whatsapp', 'teams', 'slack', 'push', 'in_app'
    )),
    
    -- Destinatário
    recipient_id UUID REFERENCES public.users(id),
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    recipient_name VARCHAR(255),
    
    -- Conteúdo
    subject VARCHAR(255),
    message TEXT NOT NULL,
    message_template VARCHAR(100),
    template_variables JSONB DEFAULT '{}',
    
    -- Configuração de entrega
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Status e controle
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'sent', 'failed', 'cancelled', 'expired'
    )),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Retry e fallback
    retry_delay_minutes INTEGER DEFAULT 5,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    fallback_channels TEXT[], -- Canais alternativos se o principal falhar
    
    -- Resultado
    sent_at TIMESTAMP WITH TIME ZONE,
    delivery_confirmation JSONB DEFAULT '{}',
    error_message TEXT,
    error_code VARCHAR(100),
    
    -- Metadados
    source_entity_type VARCHAR(50),
    source_entity_id UUID,
    tags TEXT[],
    
    -- Controle
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON public.notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_priority ON public.notification_queue(priority);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON public.notification_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_retry ON public.notification_queue(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_recipient ON public.notification_queue(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_type ON public.notification_queue(notification_type);

-- =====================================================
-- 2. TABELA DE HISTÓRICO DE ENTREGAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notification_delivery_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamento
    notification_id UUID REFERENCES public.notification_queue(id) ON DELETE CASCADE,
    
    -- Tentativa
    attempt_number INTEGER NOT NULL,
    channel_used VARCHAR(50) NOT NULL,
    
    -- Resultado
    delivery_status VARCHAR(50) NOT NULL CHECK (delivery_status IN (
        'success', 'failed', 'timeout', 'rate_limited', 'invalid_recipient'
    )),
    delivery_message_id VARCHAR(255),
    delivery_response JSONB DEFAULT '{}',
    
    -- Erro
    error_message TEXT,
    error_code VARCHAR(100),
    error_details JSONB DEFAULT '{}',
    
    -- Performance
    response_time_ms INTEGER,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_delivery_history_notification ON public.notification_delivery_history(notification_id);
CREATE INDEX IF NOT EXISTS idx_delivery_history_status ON public.notification_delivery_history(delivery_status);
CREATE INDEX IF NOT EXISTS idx_delivery_history_sent_at ON public.notification_delivery_history(sent_at);

-- =====================================================
-- 3. TABELA DE CONFIGURAÇÕES DE CANAIS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notification_channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    channel_name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    channel_type VARCHAR(50) NOT NULL CHECK (channel_type IN (
        'email', 'sms', 'whatsapp', 'teams', 'slack', 'push', 'in_app'
    )),
    
    -- Configuração
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    priority_order INTEGER DEFAULT 0,
    
    -- Configurações específicas
    config JSONB DEFAULT '{}', -- Configurações específicas do canal
    
    -- Limites e rate limiting
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_hour INTEGER DEFAULT 1000,
    max_retries INTEGER DEFAULT 3,
    retry_delay_minutes INTEGER DEFAULT 5,
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notification_channels_type ON public.notification_channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_notification_channels_active ON public.notification_channels(is_active);

-- =====================================================
-- 4. TABELA DE TEMPLATES DE NOTIFICAÇÃO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    template_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Categorização
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'workflow', 'quality', 'security', 'system', 'user', 'marketing'
    )),
    
    -- Conteúdo
    subject_template TEXT,
    message_template TEXT NOT NULL,
    variables_schema JSONB DEFAULT '{}', -- Schema das variáveis esperadas
    
    -- Canais suportados
    supported_channels TEXT[] NOT NULL,
    channel_specific_content JSONB DEFAULT '{}', -- Conteúdo específico por canal
    
    -- Configuração
    is_active BOOLEAN DEFAULT true,
    requires_approval BOOLEAN DEFAULT false,
    
    -- Controle
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON public.notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON public.notification_templates(is_active);

-- =====================================================
-- 5. FUNÇÕES DE NOTIFICAÇÃO
-- =====================================================

-- Função para adicionar notificação à fila
CREATE OR REPLACE FUNCTION public.queue_notification(
    p_notification_type VARCHAR(50),
    p_recipient_id UUID,
    p_subject VARCHAR(255),
    p_message TEXT,
    p_priority VARCHAR(20) DEFAULT 'normal',
    p_scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_template_name VARCHAR(100) DEFAULT NULL,
    p_template_variables JSONB DEFAULT '{}',
    p_fallback_channels TEXT[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
    queue_id VARCHAR(100);
    recipient_record RECORD;
    template_record RECORD;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    -- Gerar ID da fila
    queue_id := 'NOTIF_' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS') || '_' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
    
    -- Obter dados do destinatário
    SELECT email, full_name INTO recipient_record
    FROM public.users
    WHERE id = p_recipient_id;
    
    -- Obter template se especificado
    IF p_template_name IS NOT NULL THEN
        SELECT * INTO template_record
        FROM public.notification_templates
        WHERE template_name = p_template_name
        AND is_active = true;
    END IF;
    
    -- Inserir na fila
    INSERT INTO public.notification_queue (
        queue_id,
        notification_type,
        recipient_id,
        recipient_email,
        recipient_name,
        subject,
        message,
        message_template,
        template_variables,
        priority,
        scheduled_at,
        fallback_channels,
        source_entity_type,
        created_by
    ) VALUES (
        queue_id,
        p_notification_type,
        p_recipient_id,
        recipient_record.email,
        recipient_record.full_name,
        p_subject,
        p_message,
        p_template_name,
        p_template_variables,
        p_priority,
        COALESCE(p_scheduled_at, NOW()),
        p_fallback_channels,
        'manual',
        current_user_id
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Função para processar fila de notificações
CREATE OR REPLACE FUNCTION public.process_notification_queue()
RETURNS INTEGER AS $$
DECLARE
    notification_record RECORD;
    processed_count INTEGER := 0;
    channel_config RECORD;
    delivery_result JSONB;
BEGIN
    -- Processar notificações pendentes
    FOR notification_record IN
        SELECT * FROM public.notification_queue
        WHERE status = 'pending'
        AND scheduled_at <= NOW()
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
        AND attempts < max_attempts
        ORDER BY priority DESC, scheduled_at ASC
        LIMIT 10
    LOOP
        -- Marcar como processando
        UPDATE public.notification_queue
        SET status = 'processing',
            attempts = attempts + 1,
            updated_at = NOW()
        WHERE id = notification_record.id;
        
        -- Obter configuração do canal
        SELECT * INTO channel_config
        FROM public.notification_channels
        WHERE channel_type = notification_record.notification_type
        AND is_active = true
        ORDER BY priority_order ASC
        LIMIT 1;
        
        IF channel_config IS NULL THEN
            -- Canal não configurado, marcar como falha
            UPDATE public.notification_queue
            SET status = 'failed',
                error_message = 'Canal não configurado',
                error_code = 'CHANNEL_NOT_CONFIGURED',
                updated_at = NOW()
            WHERE id = notification_record.id;
            
            CONTINUE;
        END IF;
        
        -- Tentar entrega
        delivery_result := public.attempt_notification_delivery(
            notification_record.id,
            notification_record.notification_type,
            notification_record.recipient_email,
            notification_record.subject,
            notification_record.message,
            channel_config.config
        );
        
        -- Registrar tentativa
        INSERT INTO public.notification_delivery_history (
            notification_id,
            attempt_number,
            channel_used,
            delivery_status,
            delivery_message_id,
            delivery_response,
            error_message,
            error_code,
            response_time_ms
        ) VALUES (
            notification_record.id,
            notification_record.attempts,
            notification_record.notification_type,
            delivery_result->>'status',
            delivery_result->>'message_id',
            delivery_result->>'response',
            delivery_result->>'error_message',
            delivery_result->>'error_code',
            (delivery_result->>'response_time')::INTEGER
        );
        
        -- Atualizar status baseado no resultado
        IF delivery_result->>'status' = 'success' THEN
            UPDATE public.notification_queue
            SET status = 'sent',
                sent_at = NOW(),
                delivery_confirmation = delivery_result->>'response',
                updated_at = NOW()
            WHERE id = notification_record.id;
        ELSE
            -- Falha na entrega
            IF notification_record.attempts >= notification_record.max_attempts THEN
                -- Esgotou tentativas
                UPDATE public.notification_queue
                SET status = 'failed',
                    error_message = delivery_result->>'error_message',
                    error_code = delivery_result->>'error_code',
                    updated_at = NOW()
                WHERE id = notification_record.id;
                
                -- Tentar canal de fallback se disponível
                IF notification_record.fallback_channels IS NOT NULL AND array_length(notification_record.fallback_channels, 1) > 0 THEN
                    PERFORM public.try_fallback_channels(notification_record.id);
                END IF;
            ELSE
                -- Agendar retry
                UPDATE public.notification_queue
                SET status = 'pending',
                    next_retry_at = NOW() + (channel_config.retry_delay_minutes * INTERVAL '1 minute'),
                    error_message = delivery_result->>'error_message',
                    error_code = delivery_result->>'error_code',
                    updated_at = NOW()
                WHERE id = notification_record.id;
            END IF;
        END IF;
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

-- Função para tentar entrega de notificação
CREATE OR REPLACE FUNCTION public.attempt_notification_delivery(
    p_notification_id UUID,
    p_channel_type VARCHAR(50),
    p_recipient_email VARCHAR(255),
    p_subject VARCHAR(255),
    p_message TEXT,
    p_channel_config JSONB
)
RETURNS JSONB AS $$
DECLARE
    start_time TIMESTAMP WITH TIME ZONE;
    end_time TIMESTAMP WITH TIME ZONE;
    response_time_ms INTEGER;
    delivery_result JSONB;
BEGIN
    start_time := NOW();
    
    -- Simular entrega baseada no tipo de canal
    CASE p_channel_type
        WHEN 'email' THEN
            -- Simular envio de email
            PERFORM pg_sleep(0.1); -- Simular latência
            delivery_result := jsonb_build_object(
                'status', 'success',
                'message_id', 'email_' || p_notification_id,
                'response', jsonb_build_object('provider', 'smtp', 'sent_to', p_recipient_email),
                'error_message', NULL,
                'error_code', NULL
            );
            
        WHEN 'whatsapp' THEN
            -- Simular envio WhatsApp
            PERFORM pg_sleep(0.2);
            delivery_result := jsonb_build_object(
                'status', 'success',
                'message_id', 'whatsapp_' || p_notification_id,
                'response', jsonb_build_object('provider', 'whatsapp_business', 'sent_to', p_recipient_email),
                'error_message', NULL,
                'error_code', NULL
            );
            
        WHEN 'teams' THEN
            -- Simular envio Teams
            PERFORM pg_sleep(0.15);
            delivery_result := jsonb_build_object(
                'status', 'success',
                'message_id', 'teams_' || p_notification_id,
                'response', jsonb_build_object('provider', 'microsoft_teams', 'sent_to', p_recipient_email),
                'error_message', NULL,
                'error_code', NULL
            );
            
        WHEN 'sms' THEN
            -- Simular envio SMS
            PERFORM pg_sleep(0.3);
            delivery_result := jsonb_build_object(
                'status', 'success',
                'message_id', 'sms_' || p_notification_id,
                'response', jsonb_build_object('provider', 'twilio', 'sent_to', p_recipient_email),
                'error_message', NULL,
                'error_code', NULL
            );
            
        ELSE
            -- Canal não suportado
            delivery_result := jsonb_build_object(
                'status', 'failed',
                'message_id', NULL,
                'response', '{}',
                'error_message', 'Canal não suportado: ' || p_channel_type,
                'error_code', 'UNSUPPORTED_CHANNEL'
            );
    END CASE;
    
    end_time := NOW();
    response_time_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Adicionar tempo de resposta ao resultado
    delivery_result := delivery_result || jsonb_build_object('response_time', response_time_ms);
    
    RETURN delivery_result;
END;
$$ LANGUAGE plpgsql;

-- Função para tentar canais de fallback
CREATE OR REPLACE FUNCTION public.try_fallback_channels(
    p_notification_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    notification_record RECORD;
    fallback_channel VARCHAR(50);
    delivery_result JSONB;
    success BOOLEAN := false;
BEGIN
    -- Obter dados da notificação
    SELECT * INTO notification_record
    FROM public.notification_queue
    WHERE id = p_notification_id;
    
    IF notification_record.fallback_channels IS NULL THEN
        RETURN false;
    END IF;
    
    -- Tentar cada canal de fallback
    FOREACH fallback_channel IN ARRAY notification_record.fallback_channels
    LOOP
        -- Tentar entrega no canal de fallback
        delivery_result := public.attempt_notification_delivery(
            p_notification_id,
            fallback_channel,
            notification_record.recipient_email,
            notification_record.subject,
            notification_record.message,
            '{}'::jsonb
        );
        
        -- Registrar tentativa de fallback
        INSERT INTO public.notification_delivery_history (
            notification_id,
            attempt_number,
            channel_used,
            delivery_status,
            delivery_message_id,
            delivery_response,
            error_message,
            error_code
        ) VALUES (
            p_notification_id,
            notification_record.attempts + 1,
            fallback_channel,
            delivery_result->>'status',
            delivery_result->>'message_id',
            delivery_result->>'response',
            delivery_result->>'error_message',
            delivery_result->>'error_code'
        );
        
        -- Se sucesso, atualizar status
        IF delivery_result->>'status' = 'success' THEN
            UPDATE public.notification_queue
            SET status = 'sent',
                sent_at = NOW(),
                delivery_confirmation = delivery_result->>'response',
                updated_at = NOW()
            WHERE id = p_notification_id;
            
            success := true;
            EXIT; -- Sair do loop se sucesso
        END IF;
    END LOOP;
    
    RETURN success;
END;
$$ LANGUAGE plpgsql;

-- Função para cancelar notificação
CREATE OR REPLACE FUNCTION public.cancel_notification(
    p_notification_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE public.notification_queue
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE id = p_notification_id
    AND status IN ('pending', 'processing');
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. DADOS INICIAIS
-- =====================================================

-- Inserir canais de notificação padrão
INSERT INTO public.notification_channels (
    channel_name,
    display_name,
    channel_type,
    config,
    priority_order,
    rate_limit_per_minute,
    rate_limit_per_hour
) VALUES 
(
    'email_smtp',
    'Email SMTP',
    'email',
    jsonb_build_object(
        'smtp_host', 'smtp.gmail.com',
        'smtp_port', 587,
        'smtp_secure', true,
        'from_email', 'noreply@medsenior.com.br',
        'from_name', 'MILAPP MedSênior'
    ),
    1,
    60,
    1000
),
(
    'whatsapp_business',
    'WhatsApp Business',
    'whatsapp',
    jsonb_build_object(
        'api_url', 'https://graph.facebook.com/v17.0',
        'phone_number_id', 'your_phone_number_id',
        'access_token', 'your_access_token'
    ),
    2,
    30,
    500
),
(
    'microsoft_teams',
    'Microsoft Teams',
    'teams',
    jsonb_build_object(
        'webhook_url', 'your_teams_webhook_url',
        'channel', 'general'
    ),
    3,
    20,
    200
),
(
    'sms_twilio',
    'SMS Twilio',
    'sms',
    jsonb_build_object(
        'account_sid', 'your_account_sid',
        'auth_token', 'your_auth_token',
        'from_number', '+1234567890'
    ),
    4,
    10,
    100
);

-- Inserir templates de notificação padrão
INSERT INTO public.notification_templates (
    template_name,
    display_name,
    description,
    category,
    subject_template,
    message_template,
    variables_schema,
    supported_channels
) VALUES 
(
    'workflow_completed',
    'Workflow Concluído',
    'Notificação quando um workflow é concluído',
    'workflow',
    'Workflow {{workflow_name}} concluído',
    'O workflow "{{workflow_name}}" foi concluído com sucesso em {{completion_date}}.',
    jsonb_build_object(
        'workflow_name', jsonb_build_object('type', 'string', 'required', true),
        'completion_date', jsonb_build_object('type', 'string', 'required', true)
    ),
    ARRAY['email', 'whatsapp', 'teams']
),
(
    'quality_alert',
    'Alerta de Qualidade',
    'Notificação de não conformidade detectada',
    'quality',
    'Alerta de Qualidade: {{nc_type}}',
    'Foi detectada uma não conformidade do tipo "{{nc_type}}" no processo "{{process_name}}". Ação imediata requerida.',
    jsonb_build_object(
        'nc_type', jsonb_build_object('type', 'string', 'required', true),
        'process_name', jsonb_build_object('type', 'string', 'required', true)
    ),
    ARRAY['email', 'whatsapp', 'teams', 'sms']
),
(
    'security_alert',
    'Alerta de Segurança',
    'Notificação de evento de segurança',
    'security',
    'Alerta de Segurança: {{event_type}}',
    'Evento de segurança detectado: {{event_type}}. Usuário: {{user_email}}. Ação: {{action_taken}}.',
    jsonb_build_object(
        'event_type', jsonb_build_object('type', 'string', 'required', true),
        'user_email', jsonb_build_object('type', 'string', 'required', true),
        'action_taken', jsonb_build_object('type', 'string', 'required', true)
    ),
    ARRAY['email', 'teams']
);

-- =====================================================
-- 7. VIEWS PARA RELATÓRIOS
-- =====================================================

-- View para estatísticas de notificações
CREATE OR REPLACE VIEW public.notification_statistics AS
SELECT 
    notification_type,
    status,
    priority,
    COUNT(*) as total_notifications,
    AVG(attempts) as avg_attempts,
    AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) as avg_delivery_time_seconds
FROM public.notification_queue
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY notification_type, status, priority;

-- View para notificações pendentes
CREATE OR REPLACE VIEW public.pending_notifications AS
SELECT 
    queue_id,
    notification_type,
    recipient_email,
    subject,
    priority,
    scheduled_at,
    attempts,
    max_attempts,
    next_retry_at,
    created_at
FROM public.notification_queue
WHERE status IN ('pending', 'processing')
ORDER BY priority DESC, scheduled_at ASC;

-- View para falhas de entrega
CREATE OR REPLACE VIEW public.failed_notifications AS
SELECT 
    nq.queue_id,
    nq.notification_type,
    nq.recipient_email,
    nq.subject,
    nq.error_message,
    nq.error_code,
    nq.attempts,
    nq.max_attempts,
    nq.created_at,
    ndh.delivery_status,
    ndh.sent_at as last_attempt
FROM public.notification_queue nq
LEFT JOIN public.notification_delivery_history ndh ON nq.id = ndh.notification_id
WHERE nq.status = 'failed'
AND ndh.attempt_number = nq.attempts
ORDER BY nq.created_at DESC;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.trigger_update_notification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_timestamp
    BEFORE UPDATE ON public.notification_queue
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_notification_timestamp();

-- Trigger para expirar notificações
CREATE OR REPLACE FUNCTION public.trigger_expire_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Marcar notificações expiradas
    UPDATE public.notification_queue
    SET status = 'expired'
    WHERE expires_at IS NOT NULL
    AND expires_at <= NOW()
    AND status IN ('pending', 'processing');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para notification_queue
CREATE POLICY "notification_queue_own_access" ON public.notification_queue
    FOR SELECT USING (
        recipient_id = auth.uid() OR
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'notification_admin')
            AND ur.is_active = true
        )
    );

-- Políticas para notification_delivery_history
CREATE POLICY "delivery_history_admin_access" ON public.notification_delivery_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'notification_admin')
            AND ur.is_active = true
        )
    );

-- Políticas para notification_channels
CREATE POLICY "notification_channels_read_access" ON public.notification_channels
    FOR SELECT USING (is_active = true);

-- Políticas para notification_templates
CREATE POLICY "notification_templates_read_access" ON public.notification_templates
    FOR SELECT USING (is_active = true);

-- =====================================================
-- FIM DO SISTEMA DE NOTIFICAÇÕES
-- ===================================================== 