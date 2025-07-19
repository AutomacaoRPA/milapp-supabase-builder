-- =====================================================
-- MILAPP MedSênior - Sistema de Segurança e Auditoria
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. TABELA DE LOGS DE SEGURANÇA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação do evento
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    event_severity VARCHAR(20) NOT NULL CHECK (event_severity IN (
        'low', 'medium', 'high', 'critical'
    )),
    
    -- Contexto
    user_id UUID REFERENCES public.users(id),
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    location_data JSONB DEFAULT '{}',
    
    -- Detalhes do evento
    event_data JSONB DEFAULT '{}',
    event_summary TEXT,
    
    -- Metadados
    source_system VARCHAR(50) DEFAULT 'milapp',
    correlation_id VARCHAR(100),
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_security_logs_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON public.security_logs(event_severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at);

-- =====================================================
-- 2. TABELA DE SESSÕES DE USUÁRIO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    session_id VARCHAR(100) UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Dados da sessão
    ip_address INET,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    location_info JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_suspicious BOOLEAN DEFAULT false,
    
    -- Controle de tempo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadados
    login_method VARCHAR(50) DEFAULT 'email',
    mfa_verified BOOLEAN DEFAULT false
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);

-- =====================================================
-- 3. TABELA DE AUTENTICAÇÃO 2FA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.mfa_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Usuário
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Configuração 2FA
    is_enabled BOOLEAN DEFAULT false,
    mfa_type VARCHAR(20) DEFAULT 'totp' CHECK (mfa_type IN ('totp', 'sms', 'email')),
    
    -- TOTP (Time-based One-Time Password)
    totp_secret VARCHAR(100),
    totp_backup_codes TEXT[],
    
    -- SMS/Email
    phone_number VARCHAR(20),
    email_verified BOOLEAN DEFAULT false,
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 4. TABELA DE TENTATIVAS DE LOGIN
-- =====================================================

CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    email VARCHAR(255) NOT NULL,
    ip_address INET NOT NULL,
    
    -- Resultado
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    
    -- Dados da tentativa
    user_agent TEXT,
    location_data JSONB DEFAULT '{}',
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON public.login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON public.login_attempts(success);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON public.login_attempts(created_at);

-- =====================================================
-- 5. TABELA DE ALERTAS DE SEGURANÇA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.security_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    alert_type VARCHAR(100) NOT NULL,
    alert_severity VARCHAR(20) NOT NULL CHECK (alert_severity IN (
        'low', 'medium', 'high', 'critical'
    )),
    
    -- Contexto
    user_id UUID REFERENCES public.users(id),
    project_id UUID REFERENCES public.projects(id),
    
    -- Detalhes
    alert_message TEXT NOT NULL,
    alert_data JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN (
        'open', 'investigating', 'resolved', 'false_positive'
    )),
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public.users(id),
    resolution_notes TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON public.security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON public.security_alerts(alert_severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON public.security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_user ON public.security_alerts(user_id);

-- =====================================================
-- 6. TABELA DE AUDITORIA DE PERMISSÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.permission_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    user_id UUID REFERENCES public.users(id),
    project_id UUID REFERENCES public.projects(id),
    
    -- Mudança
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN (
        'role_assigned', 'role_removed', 'permission_granted', 'permission_revoked'
    )),
    
    -- Detalhes
    old_role VARCHAR(50),
    new_role VARCHAR(50),
    old_permissions TEXT[],
    new_permissions TEXT[],
    
    -- Responsável
    changed_by UUID REFERENCES public.users(id),
    change_reason TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_permission_audit_user ON public.permission_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_project ON public.permission_audit(project_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_action ON public.permission_audit(action_type);
CREATE INDEX IF NOT EXISTS idx_permission_audit_created_at ON public.permission_audit(created_at);

-- =====================================================
-- 7. FUNÇÕES DE SEGURANÇA
-- =====================================================

-- Função para registrar evento de segurança
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type VARCHAR(100),
    p_event_category VARCHAR(50),
    p_event_severity VARCHAR(20),
    p_event_summary TEXT,
    p_event_data JSONB DEFAULT '{}',
    p_user_id UUID DEFAULT NULL,
    p_session_id VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
    current_user_id UUID;
    current_session_id VARCHAR(100);
    client_ip INET;
BEGIN
    -- Obter dados do contexto
    current_user_id := COALESCE(p_user_id, auth.uid());
    
    -- Obter IP do cliente (simulado)
    client_ip := '127.0.0.1'::INET;
    
    -- Inserir log
    INSERT INTO public.security_logs (
        event_type,
        event_category,
        event_severity,
        user_id,
        session_id,
        ip_address,
        event_summary,
        event_data
    ) VALUES (
        p_event_type,
        p_event_category,
        p_event_severity,
        current_user_id,
        p_session_id,
        client_ip,
        p_event_summary,
        p_event_data
    ) RETURNING id INTO event_id;
    
    -- Verificar se deve gerar alerta
    IF p_event_severity IN ('high', 'critical') THEN
        PERFORM public.create_security_alert(
            p_event_type,
            p_event_severity,
            current_user_id,
            p_event_summary
        );
    END IF;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Função para criar alerta de segurança
CREATE OR REPLACE FUNCTION public.create_security_alert(
    p_alert_type VARCHAR(100),
    p_alert_severity VARCHAR(20),
    p_user_id UUID DEFAULT NULL,
    p_alert_message TEXT DEFAULT NULL,
    p_project_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    alert_id UUID;
BEGIN
    INSERT INTO public.security_alerts (
        alert_type,
        alert_severity,
        user_id,
        project_id,
        alert_message
    ) VALUES (
        p_alert_type,
        p_alert_severity,
        p_user_id,
        p_project_id,
        COALESCE(p_alert_message, 'Alerta de segurança gerado automaticamente')
    ) RETURNING id INTO alert_id;
    
    RETURN alert_id;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar tentativas de login suspeitas
CREATE OR REPLACE FUNCTION public.check_suspicious_login(
    p_email VARCHAR(255),
    p_ip_address INET
)
RETURNS BOOLEAN AS $$
DECLARE
    failed_attempts INTEGER;
    recent_attempts INTEGER;
    different_ips INTEGER;
BEGIN
    -- Contar tentativas falhadas nas últimas 15 minutos
    SELECT COUNT(*) INTO failed_attempts
    FROM public.login_attempts
    WHERE email = p_email
    AND success = false
    AND created_at >= NOW() - INTERVAL '15 minutes';
    
    -- Contar tentativas totais nas últimas 1 hora
    SELECT COUNT(*) INTO recent_attempts
    FROM public.login_attempts
    WHERE email = p_email
    AND created_at >= NOW() - INTERVAL '1 hour';
    
    -- Contar IPs diferentes nas últimas 24 horas
    SELECT COUNT(DISTINCT ip_address) INTO different_ips
    FROM public.login_attempts
    WHERE email = p_email
    AND created_at >= NOW() - INTERVAL '24 hours';
    
    -- Retornar true se suspeito
    RETURN failed_attempts >= 5 OR recent_attempts >= 20 OR different_ips >= 3;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar tentativa de login
CREATE OR REPLACE FUNCTION public.record_login_attempt(
    p_email VARCHAR(255),
    p_success BOOLEAN,
    p_failure_reason VARCHAR(100) DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    client_ip INET;
    is_suspicious BOOLEAN;
BEGIN
    -- Obter IP do cliente
    client_ip := COALESCE(p_ip_address, '127.0.0.1'::INET);
    
    -- Registrar tentativa
    INSERT INTO public.login_attempts (
        email,
        ip_address,
        success,
        failure_reason,
        user_agent
    ) VALUES (
        p_email,
        client_ip,
        p_success,
        p_failure_reason,
        p_user_agent
    );
    
    -- Verificar se é suspeito
    is_suspicious := public.check_suspicious_login(p_email, client_ip);
    
    -- Registrar evento de segurança se suspeito
    IF is_suspicious THEN
        PERFORM public.log_security_event(
            'suspicious_login_attempt',
            'authentication',
            'high',
            'Tentativa de login suspeita detectada para ' || p_email,
            jsonb_build_object(
                'email', p_email,
                'ip_address', client_ip,
                'failed_attempts', (
                    SELECT COUNT(*) 
                    FROM public.login_attempts 
                    WHERE email = p_email 
                    AND success = false 
                    AND created_at >= NOW() - INTERVAL '15 minutes'
                )
            )
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar sessão ativa
CREATE OR REPLACE FUNCTION public.validate_user_session(
    p_session_id VARCHAR(100)
)
RETURNS BOOLEAN AS $$
DECLARE
    session_exists BOOLEAN;
    session_expired BOOLEAN;
BEGIN
    -- Verificar se sessão existe e está ativa
    SELECT 
        EXISTS(SELECT 1 FROM public.user_sessions WHERE session_id = p_session_id AND is_active = true),
        EXISTS(SELECT 1 FROM public.user_sessions WHERE session_id = p_session_id AND expires_at < NOW())
    INTO session_exists, session_expired;
    
    -- Se sessão expirou, desativar
    IF session_expired THEN
        UPDATE public.user_sessions 
        SET is_active = false 
        WHERE session_id = p_session_id;
        
        RETURN false;
    END IF;
    
    RETURN session_exists;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    UPDATE public.user_sessions 
    SET is_active = false 
    WHERE expires_at < NOW() AND is_active = true;
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Função para auditoria de mudanças de permissão
CREATE OR REPLACE FUNCTION public.audit_permission_change(
    p_user_id UUID,
    p_project_id UUID,
    p_action_type VARCHAR(50),
    p_old_role VARCHAR(50),
    p_new_role VARCHAR(50),
    p_change_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    INSERT INTO public.permission_audit (
        user_id,
        project_id,
        action_type,
        old_role,
        new_role,
        changed_by,
        change_reason
    ) VALUES (
        p_user_id,
        p_project_id,
        p_action_type,
        p_old_role,
        p_new_role,
        current_user_id,
        p_change_reason
    ) RETURNING id INTO audit_id;
    
    -- Registrar evento de segurança
    PERFORM public.log_security_event(
        'permission_changed',
        'authorization',
        'medium',
        'Permissão alterada para usuário ' || p_user_id,
        jsonb_build_object(
            'user_id', p_user_id,
            'project_id', p_project_id,
            'old_role', p_old_role,
            'new_role', p_new_role,
            'action_type', p_action_type
        ),
        p_user_id
    );
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. TRIGGERS DE SEGURANÇA
-- =====================================================

-- Trigger para auditar mudanças de role
CREATE OR REPLACE FUNCTION public.trigger_audit_role_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Se é uma inserção
    IF TG_OP = 'INSERT' THEN
        PERFORM public.audit_permission_change(
            NEW.user_id,
            NEW.project_id,
            'role_assigned',
            NULL,
            NEW.role,
            'Nova atribuição de role'
        );
    END IF;
    
    -- Se é uma atualização
    IF TG_OP = 'UPDATE' THEN
        IF OLD.role != NEW.role THEN
            PERFORM public.audit_permission_change(
                NEW.user_id,
                NEW.project_id,
                'role_assigned',
                OLD.role,
                NEW.role,
                'Role alterada'
            );
        END IF;
    END IF;
    
    -- Se é uma exclusão
    IF TG_OP = 'DELETE' THEN
        PERFORM public.audit_permission_change(
            OLD.user_id,
            OLD.project_id,
            'role_removed',
            OLD.role,
            NULL,
            'Role removida'
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_role_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_audit_role_changes();

-- Trigger para monitorar alterações críticas
CREATE OR REPLACE FUNCTION public.trigger_monitor_critical_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Monitorar alterações em workflows
    IF TG_TABLE_NAME = 'workflows' THEN
        IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
            PERFORM public.log_security_event(
                'workflow_status_changed',
                'workflow',
                'medium',
                'Status do workflow alterado de ' || OLD.status || ' para ' || NEW.status,
                jsonb_build_object(
                    'workflow_id', NEW.id,
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'changed_by', auth.uid()
                ),
                NEW.created_by
            );
        END IF;
    END IF;
    
    -- Monitorar alterações em documentos
    IF TG_TABLE_NAME = 'quality_documents' THEN
        IF TG_OP = 'UPDATE' AND OLD.is_active != NEW.is_active THEN
            PERFORM public.log_security_event(
                'document_status_changed',
                'document',
                'medium',
                'Status do documento alterado',
                jsonb_build_object(
                    'document_id', NEW.id,
                    'old_active', OLD.is_active,
                    'new_active', NEW.is_active,
                    'changed_by', auth.uid()
                ),
                NEW.created_by
            );
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_monitor_critical_changes
    AFTER UPDATE ON public.workflows
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_monitor_critical_changes();

CREATE TRIGGER trigger_monitor_critical_changes
    AFTER UPDATE ON public.quality_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_monitor_critical_changes();

-- =====================================================
-- 9. VIEWS PARA RELATÓRIOS DE SEGURANÇA
-- =====================================================

-- View para eventos de segurança recentes
CREATE OR REPLACE VIEW public.recent_security_events AS
SELECT 
    sl.event_type,
    sl.event_category,
    sl.event_severity,
    sl.event_summary,
    u.email as user_email,
    sl.ip_address,
    sl.created_at
FROM public.security_logs sl
LEFT JOIN public.users u ON sl.user_id = u.id
WHERE sl.created_at >= NOW() - INTERVAL '24 hours'
ORDER BY sl.created_at DESC;

-- View para alertas de segurança ativos
CREATE OR REPLACE VIEW public.active_security_alerts AS
SELECT 
    sa.alert_type,
    sa.alert_severity,
    sa.alert_message,
    u.email as user_email,
    p.name as project_name,
    sa.created_at,
    sa.status
FROM public.security_alerts sa
LEFT JOIN public.users u ON sa.user_id = u.id
LEFT JOIN public.projects p ON sa.project_id = p.id
WHERE sa.status IN ('open', 'investigating')
ORDER BY sa.alert_severity DESC, sa.created_at DESC;

-- View para sessões ativas
CREATE OR REPLACE VIEW public.active_user_sessions AS
SELECT 
    us.session_id,
    u.email as user_email,
    us.ip_address,
    us.created_at,
    us.last_activity_at,
    us.expires_at,
    us.is_suspicious,
    EXTRACT(EPOCH FROM (us.expires_at - NOW())) / 3600 as hours_remaining
FROM public.user_sessions us
JOIN public.users u ON us.user_id = u.id
WHERE us.is_active = true
ORDER BY us.last_activity_at DESC;

-- View para tentativas de login suspeitas
CREATE OR REPLACE VIEW public.suspicious_login_attempts AS
SELECT 
    la.email,
    la.ip_address,
    COUNT(*) as failed_attempts,
    MAX(la.created_at) as last_attempt,
    COUNT(DISTINCT la.ip_address) as unique_ips
FROM public.login_attempts la
WHERE la.success = false
AND la.created_at >= NOW() - INTERVAL '1 hour'
GROUP BY la.email, la.ip_address
HAVING COUNT(*) >= 3
ORDER BY failed_attempts DESC;

-- =====================================================
-- 10. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_audit ENABLE ROW LEVEL SECURITY;

-- Políticas para security_logs
CREATE POLICY "security_logs_admin_access" ON public.security_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'security_admin')
            AND ur.is_active = true
        )
    );

-- Políticas para user_sessions
CREATE POLICY "user_sessions_own_access" ON public.user_sessions
    FOR ALL USING (user_id = auth.uid());

-- Políticas para mfa_settings
CREATE POLICY "mfa_settings_own_access" ON public.mfa_settings
    FOR ALL USING (user_id = auth.uid());

-- Políticas para login_attempts
CREATE POLICY "login_attempts_admin_access" ON public.login_attempts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'security_admin')
            AND ur.is_active = true
        )
    );

-- Políticas para security_alerts
CREATE POLICY "security_alerts_admin_access" ON public.security_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'security_admin')
            AND ur.is_active = true
        )
    );

-- Políticas para permission_audit
CREATE POLICY "permission_audit_admin_access" ON public.permission_audit
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'security_admin')
            AND ur.is_active = true
        )
    );

-- =====================================================
-- FIM DO SISTEMA DE SEGURANÇA
-- ===================================================== 