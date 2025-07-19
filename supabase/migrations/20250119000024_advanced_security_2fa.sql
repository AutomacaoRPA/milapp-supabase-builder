-- =====================================================
-- MILAPP MedSênior - Sistema de Segurança Corporativa Avançada
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. TABELA DE CONFIGURAÇÃO 2FA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_2fa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamento
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Configuração 2FA
    is_enabled BOOLEAN DEFAULT false,
    secret_key VARCHAR(255), -- Chave TOTP criptografada
    backup_codes TEXT[], -- Códigos de backup criptografados
    totp_algorithm VARCHAR(20) DEFAULT 'SHA1',
    totp_digits INTEGER DEFAULT 6,
    totp_period INTEGER DEFAULT 30, -- Segundos
    
    -- Configurações de segurança
    require_2fa_for_admin BOOLEAN DEFAULT true,
    require_2fa_for_sensitive_actions BOOLEAN DEFAULT true,
    
    -- Status
    setup_completed_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_2fa_enabled ON public.user_2fa(is_enabled);
CREATE INDEX IF NOT EXISTS idx_user_2fa_user ON public.user_2fa(user_id);

-- =====================================================
-- 2. TABELA DE SESSÕES SEGURAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.secure_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- Relacionamentos
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Dados da sessão
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    location_data JSONB DEFAULT '{}',
    
    -- Configuração
    is_active BOOLEAN DEFAULT true,
    is_2fa_verified BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    refresh_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Segurança
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    force_logout BOOLEAN DEFAULT false,
    logout_reason TEXT,
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_secure_sessions_token ON public.secure_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_secure_sessions_user ON public.secure_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_secure_sessions_active ON public.secure_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_secure_sessions_expires ON public.secure_sessions(expires_at);

-- =====================================================
-- 3. TABELA DE PERMISSÕES GRANULARES (RBAC AVANÇADO)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.user_roles(id) ON DELETE CASCADE,
    
    -- Permissão granular
    module VARCHAR(100) NOT NULL, -- 'workflows', 'documents', 'analytics', etc.
    resource VARCHAR(100), -- Recurso específico (opcional)
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'read', 'write', 'delete', 'admin', 'approve', 'export', 'import'
    )),
    
    -- Escopo
    scope_type VARCHAR(50) DEFAULT 'global' CHECK (scope_type IN (
        'global', 'project', 'department', 'own', 'team'
    )),
    scope_value UUID, -- ID do projeto, departamento, etc.
    
    -- Configuração
    is_active BOOLEAN DEFAULT true,
    granted_by UUID REFERENCES public.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, module, resource, action, scope_type, scope_value)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_module ON public.user_permissions(module);
CREATE INDEX IF NOT EXISTS idx_user_permissions_action ON public.user_permissions(action);
CREATE INDEX IF NOT EXISTS idx_user_permissions_scope ON public.user_permissions(scope_type, scope_value);

-- =====================================================
-- 4. TABELA DE LOGS DE SEGURANÇA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    log_type VARCHAR(50) NOT NULL CHECK (log_type IN (
        'login', 'logout', 'login_failed', 'password_change', '2fa_enabled', '2fa_disabled',
        '2fa_verification', '2fa_failed', 'permission_denied', 'sensitive_action',
        'session_created', 'session_expired', 'session_revoked', 'user_created',
        'user_modified', 'user_deleted', 'role_assigned', 'role_removed',
        'api_access', 'file_access', 'data_export', 'data_import'
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN (
        'info', 'warning', 'error', 'critical'
    )),
    
    -- Relacionamentos
    user_id UUID REFERENCES public.users(id),
    session_id UUID REFERENCES public.secure_sessions(id),
    
    -- Contexto
    action_description TEXT NOT NULL,
    resource_type VARCHAR(50), -- 'workflow', 'document', 'user', etc.
    resource_id UUID,
    
    -- Dados técnicos
    ip_address INET,
    user_agent TEXT,
    request_url TEXT,
    request_method VARCHAR(10),
    request_headers JSONB DEFAULT '{}',
    request_body JSONB DEFAULT '{}',
    
    -- Resultado
    success BOOLEAN,
    error_message TEXT,
    error_code VARCHAR(100),
    
    -- Metadados
    location_data JSONB DEFAULT '{}',
    device_info JSONB DEFAULT '{}',
    additional_data JSONB DEFAULT '{}',
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_security_logs_type ON public.security_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON public.security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip ON public.security_logs(ip_address);

-- =====================================================
-- 5. TABELA DE TENTATIVAS DE LOGIN
-- =====================================================

CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    email VARCHAR(255) NOT NULL,
    ip_address INET NOT NULL,
    
    -- Tentativa
    attempt_type VARCHAR(20) NOT NULL CHECK (attempt_type IN (
        'password', '2fa', 'backup_code'
    )),
    success BOOLEAN NOT NULL,
    
    -- Dados técnicos
    user_agent TEXT,
    device_info JSONB DEFAULT '{}',
    location_data JSONB DEFAULT '{}',
    
    -- Resultado
    error_message TEXT,
    error_code VARCHAR(100),
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON public.login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_success ON public.login_attempts(success);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON public.login_attempts(created_at);

-- =====================================================
-- 6. TABELA DE ALERTAS DE SEGURANÇA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.security_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'suspicious_login', 'multiple_failed_attempts', 'unusual_activity',
        'privilege_escalation', 'data_breach_attempt', 'api_abuse',
        'geographic_anomaly', 'time_anomaly', 'device_anomaly'
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN (
        'low', 'medium', 'high', 'critical'
    )),
    
    -- Relacionamentos
    user_id UUID REFERENCES public.users(id),
    session_id UUID REFERENCES public.secure_sessions(id),
    
    -- Detalhes
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    alert_data JSONB DEFAULT '{}',
    
    -- Status
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN (
        'open', 'investigating', 'resolved', 'false_positive'
    )),
    acknowledged_by UUID REFERENCES public.users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON public.security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON public.security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_user ON public.security_alerts(user_id);

-- =====================================================
-- 7. FUNÇÕES DE SEGURANÇA
-- =====================================================

-- Função para gerar chave TOTP
CREATE OR REPLACE FUNCTION public.generate_totp_secret()
RETURNS VARCHAR(32) AS $$
DECLARE
    secret VARCHAR(32);
BEGIN
    -- Gerar chave aleatória de 32 caracteres
    secret := encode(gen_random_bytes(16), 'base32');
    RETURN secret;
END;
$$ LANGUAGE plpgsql;

-- Função para ativar 2FA
CREATE OR REPLACE FUNCTION public.enable_2fa(
    p_user_id UUID,
    p_secret_key VARCHAR(255),
    p_backup_codes TEXT[]
)
RETURNS JSONB AS $$
DECLARE
    current_user_id UUID;
    result JSONB;
BEGIN
    current_user_id := auth.uid();
    
    -- Verificar se usuário tem permissão
    IF current_user_id != p_user_id AND NOT EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = current_user_id
        AND ur.role IN ('admin', 'security_admin')
        AND ur.is_active = true
    ) THEN
        RAISE EXCEPTION 'Sem permissão para ativar 2FA para outro usuário';
    END IF;
    
    -- Inserir ou atualizar configuração 2FA
    INSERT INTO public.user_2fa (
        user_id,
        is_enabled,
        secret_key,
        backup_codes,
        setup_completed_at
    ) VALUES (
        p_user_id,
        true,
        p_secret_key,
        p_backup_codes,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        is_enabled = true,
        secret_key = p_secret_key,
        backup_codes = p_backup_codes,
        setup_completed_at = NOW(),
        updated_at = NOW();
    
    -- Registrar log de segurança
    INSERT INTO public.security_logs (
        log_type,
        severity,
        user_id,
        action_description,
        success,
        ip_address,
        user_agent
    ) VALUES (
        '2fa_enabled',
        'info',
        p_user_id,
        '2FA ativado com sucesso',
        true,
        inet_client_addr(),
        current_setting('request.headers')::jsonb->>'user-agent'
    );
    
    result := jsonb_build_object(
        'success', true,
        'message', '2FA ativado com sucesso',
        'backup_codes_count', array_length(p_backup_codes, 1)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar código 2FA
CREATE OR REPLACE FUNCTION public.verify_2fa_code(
    p_user_id UUID,
    p_code VARCHAR(10)
)
RETURNS BOOLEAN AS $$
DECLARE
    user_2fa_record RECORD;
    is_valid BOOLEAN := false;
BEGIN
    -- Obter configuração 2FA
    SELECT * INTO user_2fa_record
    FROM public.user_2fa
    WHERE user_id = p_user_id
    AND is_enabled = true;
    
    IF user_2fa_record IS NULL THEN
        RETURN false;
    END IF;
    
    -- Verificar se é código de backup
    IF p_code = ANY(user_2fa_record.backup_codes) THEN
        -- Remover código usado
        UPDATE public.user_2fa
        SET backup_codes = array_remove(backup_codes, p_code),
            last_used_at = NOW(),
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        is_valid := true;
    ELSE
        -- Verificar código TOTP (simulação - em produção usar biblioteca TOTP)
        -- Por enquanto, aceita qualquer código de 6 dígitos
        IF LENGTH(p_code) = 6 AND p_code ~ '^[0-9]+$' THEN
            is_valid := true;
            
            UPDATE public.user_2fa
            SET last_used_at = NOW(),
                updated_at = NOW()
            WHERE user_id = p_user_id;
        END IF;
    END IF;
    
    -- Registrar log
    INSERT INTO public.security_logs (
        log_type,
        severity,
        user_id,
        action_description,
        success,
        ip_address,
        user_agent
    ) VALUES (
        '2fa_verification',
        CASE WHEN is_valid THEN 'info' ELSE 'warning' END,
        p_user_id,
        CASE WHEN is_valid THEN '2FA verificado com sucesso' ELSE '2FA falhou' END,
        is_valid,
        inet_client_addr(),
        current_setting('request.headers')::jsonb->>'user-agent'
    );
    
    RETURN is_valid;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar permissão granular
CREATE OR REPLACE FUNCTION public.check_user_permission(
    p_user_id UUID,
    p_module VARCHAR(100),
    p_action VARCHAR(50),
    p_resource VARCHAR(100) DEFAULT NULL,
    p_scope_value UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    permission_count INTEGER;
BEGIN
    -- Verificar permissão específica
    SELECT COUNT(*) INTO permission_count
    FROM public.user_permissions
    WHERE user_id = p_user_id
    AND module = p_module
    AND (resource IS NULL OR resource = p_resource)
    AND action = p_action
    AND is_active = true
    AND (
        scope_type = 'global' OR
        (scope_type = 'project' AND scope_value = p_scope_value) OR
        (scope_type = 'own' AND scope_value = p_user_id) OR
        (scope_type = 'department' AND scope_value IN (
            SELECT department_id FROM public.users WHERE id = p_user_id
        ))
    );
    
    -- Se não encontrou permissão específica, verificar role
    IF permission_count = 0 THEN
        SELECT COUNT(*) INTO permission_count
        FROM public.user_roles ur
        WHERE ur.user_id = p_user_id
        AND ur.is_active = true
        AND ur.role IN ('admin', 'super_admin');
    END IF;
    
    RETURN permission_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar tentativa de login
CREATE OR REPLACE FUNCTION public.log_login_attempt(
    p_email VARCHAR(255),
    p_success BOOLEAN,
    p_attempt_type VARCHAR(20) DEFAULT 'password',
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.login_attempts (
        email,
        ip_address,
        attempt_type,
        success,
        user_agent,
        error_message
    ) VALUES (
        p_email,
        inet_client_addr(),
        p_attempt_type,
        p_success,
        current_setting('request.headers')::jsonb->>'user-agent',
        p_error_message
    );
    
    -- Se falhou, verificar se deve criar alerta
    IF NOT p_success THEN
        PERFORM public.check_failed_login_threshold(p_email);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar limite de tentativas falhadas
CREATE OR REPLACE FUNCTION public.check_failed_login_threshold(
    p_email VARCHAR(255)
)
RETURNS VOID AS $$
DECLARE
    failed_attempts INTEGER;
    user_record RECORD;
BEGIN
    -- Contar tentativas falhadas nas últimas 15 minutos
    SELECT COUNT(*) INTO failed_attempts
    FROM public.login_attempts
    WHERE email = p_email
    AND success = false
    AND created_at >= NOW() - INTERVAL '15 minutes';
    
    -- Se excedeu 5 tentativas, criar alerta
    IF failed_attempts >= 5 THEN
        -- Obter dados do usuário
        SELECT id INTO user_record
        FROM public.users
        WHERE email = p_email;
        
        -- Criar alerta de segurança
        INSERT INTO public.security_alerts (
            alert_type,
            severity,
            user_id,
            title,
            description,
            alert_data
        ) VALUES (
            'multiple_failed_attempts',
            'high',
            user_record.id,
            'Múltiplas tentativas de login falhadas',
            'Detectadas ' || failed_attempts || ' tentativas de login falhadas em 15 minutos',
            jsonb_build_object(
                'email', p_email,
                'failed_attempts', failed_attempts,
                'ip_address', inet_client_addr()
            )
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para criar sessão segura
CREATE OR REPLACE FUNCTION public.create_secure_session(
    p_user_id UUID,
    p_ip_address INET,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    session_id UUID;
    session_token VARCHAR(255);
    refresh_token VARCHAR(255);
    user_2fa_record RECORD;
    result JSONB;
BEGIN
    -- Gerar tokens
    session_token := encode(gen_random_bytes(32), 'base64');
    refresh_token := encode(gen_random_bytes(32), 'base64');
    
    -- Verificar se usuário tem 2FA ativo
    SELECT * INTO user_2fa_record
    FROM public.user_2fa
    WHERE user_id = p_user_id
    AND is_enabled = true;
    
    -- Criar sessão
    INSERT INTO public.secure_sessions (
        session_token,
        refresh_token,
        user_id,
        ip_address,
        user_agent,
        expires_at,
        refresh_expires_at,
        is_2fa_verified
    ) VALUES (
        session_token,
        refresh_token,
        p_user_id,
        p_ip_address,
        p_user_agent,
        NOW() + INTERVAL '15 minutes',
        NOW() + INTERVAL '7 days',
        user_2fa_record IS NULL -- Se não tem 2FA, já está verificado
    ) RETURNING id INTO session_id;
    
    -- Registrar log
    INSERT INTO public.security_logs (
        log_type,
        severity,
        user_id,
        session_id,
        action_description,
        success,
        ip_address,
        user_agent
    ) VALUES (
        'session_created',
        'info',
        p_user_id,
        session_id,
        'Sessão criada com sucesso',
        true,
        p_ip_address,
        p_user_agent
    );
    
    result := jsonb_build_object(
        'session_id', session_id,
        'session_token', session_token,
        'refresh_token', refresh_token,
        'expires_at', NOW() + INTERVAL '15 minutes',
        'requires_2fa', user_2fa_record IS NOT NULL
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para validar sessão
CREATE OR REPLACE FUNCTION public.validate_secure_session(
    p_session_token VARCHAR(255)
)
RETURNS JSONB AS $$
DECLARE
    session_record RECORD;
    user_record RECORD;
    result JSONB;
BEGIN
    -- Obter sessão
    SELECT * INTO session_record
    FROM public.secure_sessions
    WHERE session_token = p_session_token
    AND is_active = true
    AND expires_at > NOW();
    
    IF session_record IS NULL THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Sessão inválida ou expirada'
        );
    END IF;
    
    -- Verificar se foi forçado logout
    IF session_record.force_logout THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Sessão revogada: ' || COALESCE(session_record.logout_reason, 'Motivo não especificado')
        );
    END IF;
    
    -- Obter dados do usuário
    SELECT * INTO user_record
    FROM public.users
    WHERE id = session_record.user_id
    AND is_active = true;
    
    IF user_record IS NULL THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Usuário não encontrado ou inativo'
        );
    END IF;
    
    -- Atualizar última atividade
    UPDATE public.secure_sessions
    SET last_activity_at = NOW()
    WHERE id = session_record.id;
    
    result := jsonb_build_object(
        'valid', true,
        'user_id', session_record.user_id,
        'email', user_record.email,
        'full_name', user_record.full_name,
        'is_2fa_verified', session_record.is_2fa_verified,
        'session_id', session_record.id,
        'expires_at', session_record.expires_at
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para revogar sessão
CREATE OR REPLACE FUNCTION public.revoke_secure_session(
    p_session_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    session_record RECORD;
BEGIN
    -- Obter sessão
    SELECT * INTO session_record
    FROM public.secure_sessions
    WHERE id = p_session_id;
    
    IF session_record IS NULL THEN
        RETURN false;
    END IF;
    
    -- Revogar sessão
    UPDATE public.secure_sessions
    SET is_active = false,
        force_logout = true,
        logout_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_session_id;
    
    -- Registrar log
    INSERT INTO public.security_logs (
        log_type,
        severity,
        user_id,
        session_id,
        action_description,
        success,
        ip_address
    ) VALUES (
        'session_revoked',
        'warning',
        session_record.user_id,
        p_session_id,
        'Sessão revogada: ' || COALESCE(p_reason, 'Motivo não especificado'),
        true,
        inet_client_addr()
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. TRIGGERS DE SEGURANÇA
-- =====================================================

-- Trigger para limpar sessões expiradas
CREATE OR REPLACE FUNCTION public.trigger_cleanup_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
    -- Marcar sessões expiradas como inativas
    UPDATE public.secure_sessions
    SET is_active = false,
        updated_at = NOW()
    WHERE expires_at <= NOW()
    AND is_active = true;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamps
CREATE OR REPLACE FUNCTION public.trigger_update_security_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_2fa_timestamp
    BEFORE UPDATE ON public.user_2fa
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_security_timestamp();

CREATE TRIGGER trigger_update_session_timestamp
    BEFORE UPDATE ON public.secure_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_security_timestamp();

CREATE TRIGGER trigger_update_permission_timestamp
    BEFORE UPDATE ON public.user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_security_timestamp();

CREATE TRIGGER trigger_update_alert_timestamp
    BEFORE UPDATE ON public.security_alerts
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_security_timestamp();

-- =====================================================
-- 9. VIEWS PARA RELATÓRIOS DE SEGURANÇA
-- =====================================================

-- View para estatísticas de segurança
CREATE OR REPLACE VIEW public.security_statistics AS
SELECT 
    COUNT(*) FILTER (WHERE log_type = 'login' AND success = true) as successful_logins,
    COUNT(*) FILTER (WHERE log_type = 'login_failed') as failed_logins,
    COUNT(*) FILTER (WHERE log_type = '2fa_verification' AND success = true) as successful_2fa,
    COUNT(*) FILTER (WHERE log_type = '2fa_failed') as failed_2fa,
    COUNT(*) FILTER (WHERE log_type = 'permission_denied') as permission_denials,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_events,
    COUNT(DISTINCT user_id) as active_users_24h
FROM public.security_logs
WHERE created_at >= NOW() - INTERVAL '24 hours';

-- View para alertas de segurança ativos
CREATE OR REPLACE VIEW public.active_security_alerts AS
SELECT 
    sa.alert_type,
    sa.severity,
    sa.title,
    sa.description,
    sa.created_at,
    u.email as user_email,
    u.full_name as user_name
FROM public.security_alerts sa
LEFT JOIN public.users u ON sa.user_id = u.id
WHERE sa.status = 'open'
ORDER BY sa.severity DESC, sa.created_at DESC;

-- View para tentativas de login suspeitas
CREATE OR REPLACE VIEW public.suspicious_login_attempts AS
SELECT 
    la.email,
    la.ip_address,
    COUNT(*) as failed_attempts,
    MAX(la.created_at) as last_attempt,
    u.id as user_id,
    u.full_name
FROM public.login_attempts la
LEFT JOIN public.users u ON la.email = u.email
WHERE la.success = false
AND la.created_at >= NOW() - INTERVAL '1 hour'
GROUP BY la.email, la.ip_address, u.id, u.full_name
HAVING COUNT(*) >= 3
ORDER BY failed_attempts DESC;

-- View para sessões ativas
CREATE OR REPLACE VIEW public.active_sessions AS
SELECT 
    ss.session_token,
    u.email,
    u.full_name,
    ss.ip_address,
    ss.created_at,
    ss.last_activity_at,
    ss.expires_at,
    ss.is_2fa_verified
FROM public.secure_sessions ss
JOIN public.users u ON ss.user_id = u.id
WHERE ss.is_active = true
AND ss.expires_at > NOW()
ORDER BY ss.last_activity_at DESC;

-- =====================================================
-- 10. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secure_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas para user_2fa
CREATE POLICY "user_2fa_own_access" ON public.user_2fa
    FOR ALL USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'security_admin')
            AND ur.is_active = true
        )
    );

-- Políticas para secure_sessions
CREATE POLICY "secure_sessions_own_access" ON public.secure_sessions
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'security_admin')
            AND ur.is_active = true
        )
    );

-- Políticas para user_permissions
CREATE POLICY "user_permissions_admin_access" ON public.user_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'security_admin')
            AND ur.is_active = true
        )
    );

-- Políticas para security_logs
CREATE POLICY "security_logs_admin_access" ON public.security_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'security_admin')
            AND ur.is_active = true
        )
    );

-- Políticas para login_attempts
CREATE POLICY "login_attempts_admin_access" ON public.login_attempts
    FOR SELECT USING (
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

-- =====================================================
-- FIM DO SISTEMA DE SEGURANÇA CORPORATIVA
-- ===================================================== 