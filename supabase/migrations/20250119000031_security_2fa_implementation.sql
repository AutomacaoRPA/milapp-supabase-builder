-- =====================================================
-- SECURITY & 2FA IMPLEMENTATION - MILAPP
-- =====================================================

-- Extensão para criptografia
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabela de configurações de segurança do usuário
CREATE TABLE IF NOT EXISTS user_security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_2fa_enabled BOOLEAN DEFAULT false,
    two_fa_secret TEXT, -- Criptografado
    backup_codes TEXT[], -- Códigos de backup criptografados
    last_2fa_verification TIMESTAMP WITH TIME ZONE,
    failed_2fa_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    last_login_user_agent TEXT,
    session_timeout_minutes INTEGER DEFAULT 480, -- 8 horas
    require_password_change BOOLEAN DEFAULT false,
    password_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de segurança
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action_type VARCHAR(100) NOT NULL, -- 'login', 'logout', '2fa_enabled', '2fa_disabled', 'password_change', 'permission_change', 'access_denied'
    action_details JSONB,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sessões ativas
CREATE TABLE IF NOT EXISTS active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL,
    refresh_token TEXT,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de tentativas de login
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT false,
    failure_reason VARCHAR(100), -- 'invalid_password', '2fa_failed', 'account_locked', 'expired_password'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de permissões granulares
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    resource VARCHAR(100) NOT NULL, -- 'projects', 'reports', 'admin', 'security'
    action VARCHAR(100) NOT NULL, -- 'read', 'write', 'delete', 'admin'
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Tabela de políticas de senha
CREATE TABLE IF NOT EXISTS password_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    min_length INTEGER DEFAULT 8,
    require_uppercase BOOLEAN DEFAULT true,
    require_lowercase BOOLEAN DEFAULT true,
    require_numbers BOOLEAN DEFAULT true,
    require_special_chars BOOLEAN DEFAULT true,
    max_age_days INTEGER DEFAULT 90,
    prevent_reuse_count INTEGER DEFAULT 5,
    lockout_threshold INTEGER DEFAULT 5,
    lockout_duration_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de senhas
CREATE TABLE IF NOT EXISTS password_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    changed_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- FUNÇÕES DE SEGURANÇA
-- =====================================================

-- Função para gerar secret 2FA
CREATE OR REPLACE FUNCTION generate_2fa_secret()
RETURNS TEXT AS $$
DECLARE
    secret TEXT;
BEGIN
    -- Gerar secret de 32 caracteres base32
    secret := encode(gen_random_bytes(20), 'base32');
    RETURN secret;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar códigos de backup
CREATE OR REPLACE FUNCTION generate_backup_codes()
RETURNS TEXT[] AS $$
DECLARE
    codes TEXT[] := ARRAY[]::TEXT[];
    i INTEGER;
    code TEXT;
BEGIN
    FOR i IN 1..10 LOOP
        -- Gerar código de 8 dígitos
        code := LPAD(floor(random() * 100000000)::TEXT, 8, '0');
        codes := array_append(codes, code);
    END LOOP;
    
    RETURN codes;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar 2FA
CREATE OR REPLACE FUNCTION verify_2fa_code(
    user_uuid UUID,
    code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    user_secret TEXT;
    user_settings RECORD;
    current_time TIMESTAMP WITH TIME ZONE;
    window_start TIMESTAMP WITH TIME ZONE;
    window_end TIMESTAMP WITH TIME ZONE;
    expected_code TEXT;
    i INTEGER;
BEGIN
    -- Buscar configurações do usuário
    SELECT * INTO user_settings
    FROM user_security_settings
    WHERE user_id = user_uuid;
    
    IF NOT FOUND OR NOT user_settings.is_2fa_enabled THEN
        RETURN false;
    END IF;
    
    -- Verificar se conta está bloqueada
    IF user_settings.locked_until IS NOT NULL AND user_settings.locked_until > NOW() THEN
        RETURN false;
    END IF;
    
    -- Decriptografar secret
    user_secret := decrypt(user_settings.two_fa_secret::bytea, current_setting('app.jwt_secret'), 'aes');
    
    current_time := NOW();
    
    -- Verificar código TOTP (janela de 30 segundos)
    FOR i IN -1..1 LOOP
        window_start := current_time + (i * interval '30 seconds');
        window_end := window_start + interval '30 seconds';
        
        -- Aqui você implementaria a lógica TOTP real
        -- Por simplicidade, vamos simular
        expected_code := LPAD(floor(extract(epoch from window_start) / 30)::TEXT, 6, '0');
        
        IF code = expected_code THEN
            -- Sucesso - atualizar configurações
            UPDATE user_security_settings
            SET 
                last_2fa_verification = NOW(),
                failed_2fa_attempts = 0,
                locked_until = NULL
            WHERE user_id = user_uuid;
            
            RETURN true;
        END IF;
    END LOOP;
    
    -- Verificar códigos de backup
    IF user_settings.backup_codes IS NOT NULL THEN
        FOR i IN 1..array_length(user_settings.backup_codes, 1) LOOP
            IF decrypt(user_settings.backup_codes[i]::bytea, current_setting('app.jwt_secret'), 'aes') = code THEN
                -- Remover código usado
                UPDATE user_security_settings
                SET 
                    backup_codes = array_remove(backup_codes, user_settings.backup_codes[i]),
                    last_2fa_verification = NOW(),
                    failed_2fa_attempts = 0,
                    locked_until = NULL
                WHERE user_id = user_uuid;
                
                RETURN true;
            END IF;
        END LOOP;
    END IF;
    
    -- Falha - incrementar tentativas
    UPDATE user_security_settings
    SET 
        failed_2fa_attempts = failed_2fa_attempts + 1,
        locked_until = CASE 
            WHEN failed_2fa_attempts >= 5 THEN NOW() + interval '30 minutes'
            ELSE locked_until
        END
    WHERE user_id = user_uuid;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Função para ativar 2FA
CREATE OR REPLACE FUNCTION enable_2fa(
    user_uuid UUID,
    secret TEXT
)
RETURNS TEXT[] AS $$
DECLARE
    backup_codes TEXT[];
    encrypted_secret TEXT;
    encrypted_backup_codes TEXT[];
    i INTEGER;
BEGIN
    -- Gerar códigos de backup
    backup_codes := generate_backup_codes();
    
    -- Criptografar secret
    encrypted_secret := encrypt(secret::bytea, current_setting('app.jwt_secret'), 'aes');
    
    -- Criptografar códigos de backup
    encrypted_backup_codes := ARRAY[]::TEXT[];
    FOR i IN 1..array_length(backup_codes, 1) LOOP
        encrypted_backup_codes := array_append(encrypted_backup_codes, encrypt(backup_codes[i]::bytea, current_setting('app.jwt_secret'), 'aes'));
    END LOOP;
    
    -- Atualizar configurações do usuário
    INSERT INTO user_security_settings (user_id, is_2fa_enabled, two_fa_secret, backup_codes)
    VALUES (user_uuid, true, encrypted_secret, encrypted_backup_codes)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        is_2fa_enabled = true,
        two_fa_secret = encrypted_secret,
        backup_codes = encrypted_backup_codes,
        updated_at = NOW();
    
    RETURN backup_codes;
END;
$$ LANGUAGE plpgsql;

-- Função para desativar 2FA
CREATE OR REPLACE FUNCTION disable_2fa(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_security_settings
    SET 
        is_2fa_enabled = false,
        two_fa_secret = NULL,
        backup_codes = NULL,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar log de segurança
CREATE OR REPLACE FUNCTION log_security_event(
    user_uuid UUID,
    action_type VARCHAR,
    action_details JSONB DEFAULT NULL,
    ip_addr INET DEFAULT NULL,
    user_agent_text TEXT DEFAULT NULL,
    success_flag BOOLEAN DEFAULT true,
    error_msg TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO security_logs (
        user_id,
        action_type,
        action_details,
        ip_address,
        user_agent,
        success,
        error_message
    ) VALUES (
        user_uuid,
        action_type,
        action_details,
        ip_addr,
        user_agent_text,
        success_flag,
        error_msg
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar permissões
CREATE OR REPLACE FUNCTION check_user_permission(
    user_uuid UUID,
    resource_name VARCHAR,
    action_name VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := false;
BEGIN
    -- Verificar permissão específica
    SELECT EXISTS(
        SELECT 1 FROM user_permissions
        WHERE user_id = user_uuid
            AND resource = resource_name
            AND action = action_name
            AND is_active = true
            AND (expires_at IS NULL OR expires_at > NOW())
    ) INTO has_permission;
    
    -- Se não tem permissão específica, verificar se é admin
    IF NOT has_permission THEN
        SELECT EXISTS(
            SELECT 1 FROM user_permissions
            WHERE user_id = user_uuid
                AND resource = 'admin'
                AND action = 'full_access'
                AND is_active = true
                AND (expires_at IS NULL OR expires_at > NOW())
        ) INTO has_permission;
    END IF;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql;

-- Função para validar senha
CREATE OR REPLACE FUNCTION validate_password(password_text TEXT)
RETURNS JSONB AS $$
DECLARE
    policy RECORD;
    result JSONB := '{"valid": true, "errors": []}'::JSONB;
    errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Buscar política ativa
    SELECT * INTO policy
    FROM password_policies
    WHERE is_active = true
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN result;
    END IF;
    
    -- Validar comprimento mínimo
    IF length(password_text) < policy.min_length THEN
        errors := array_append(errors, format('Senha deve ter pelo menos %s caracteres', policy.min_length));
    END IF;
    
    -- Validar maiúsculas
    IF policy.require_uppercase AND password_text !~ '[A-Z]' THEN
        errors := array_append(errors, 'Senha deve conter pelo menos uma letra maiúscula');
    END IF;
    
    -- Validar minúsculas
    IF policy.require_lowercase AND password_text !~ '[a-z]' THEN
        errors := array_append(errors, 'Senha deve conter pelo menos uma letra minúscula');
    END IF;
    
    -- Validar números
    IF policy.require_numbers AND password_text !~ '[0-9]' THEN
        errors := array_append(errors, 'Senha deve conter pelo menos um número');
    END IF;
    
    -- Validar caracteres especiais
    IF policy.require_special_chars AND password_text !~ '[!@#$%^&*(),.?":{}|<>]' THEN
        errors := array_append(errors, 'Senha deve conter pelo menos um caractere especial');
    END IF;
    
    -- Atualizar resultado
    IF array_length(errors, 1) > 0 THEN
        result := jsonb_build_object(
            'valid', false,
            'errors', errors
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar reutilização de senha
CREATE OR REPLACE FUNCTION check_password_reuse(
    user_uuid UUID,
    new_password_hash TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    policy RECORD;
    recent_passwords INTEGER;
BEGIN
    -- Buscar política ativa
    SELECT * INTO policy
    FROM password_policies
    WHERE is_active = true
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN true; -- Sem política, permitir
    END IF;
    
    -- Verificar senhas recentes
    SELECT COUNT(*) INTO recent_passwords
    FROM password_history
    WHERE user_id = user_uuid
        AND password_hash = new_password_hash
        AND changed_at > NOW() - (policy.prevent_reuse_count || 5) * interval '1 day';
    
    RETURN recent_passwords = 0;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS DE SEGURANÇA
-- =====================================================

-- Trigger para criar configurações de segurança automaticamente
CREATE OR REPLACE FUNCTION create_user_security_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_security_settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_user_security_settings
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_security_settings();

-- Trigger para registrar mudanças de senha
CREATE OR REPLACE FUNCTION log_password_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Esta função seria chamada quando a senha é alterada
    -- Como o Supabase gerencia senhas, isso seria feito via RPC
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para limpar sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM active_sessions
    WHERE expires_at < NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_expired_sessions
    AFTER INSERT ON active_sessions
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_expired_sessions();

-- =====================================================
-- VIEWS PARA RELATÓRIOS DE SEGURANÇA
-- =====================================================

-- View de atividades de segurança
CREATE OR REPLACE VIEW view_security_activities AS
SELECT 
    sl.id,
    sl.user_id,
    u.email,
    sl.action_type,
    sl.action_details,
    sl.ip_address,
    sl.success,
    sl.error_message,
    sl.created_at,
    CASE 
        WHEN sl.success THEN 'Sucesso'
        ELSE 'Falha'
    END as status
FROM security_logs sl
LEFT JOIN auth.users u ON sl.user_id = u.id
ORDER BY sl.created_at DESC;

-- View de usuários com 2FA
CREATE OR REPLACE VIEW view_2fa_users AS
SELECT 
    uss.user_id,
    u.email,
    uss.is_2fa_enabled,
    uss.last_2fa_verification,
    uss.failed_2fa_attempts,
    uss.locked_until,
    uss.created_at
FROM user_security_settings uss
LEFT JOIN auth.users u ON uss.user_id = u.id
WHERE uss.is_2fa_enabled = true
ORDER BY uss.last_2fa_verification DESC;

-- View de tentativas de login
CREATE OR REPLACE VIEW view_login_attempts AS
SELECT 
    la.id,
    la.user_id,
    la.email,
    la.ip_address,
    la.success,
    la.failure_reason,
    la.created_at,
    CASE 
        WHEN la.success THEN 'Sucesso'
        ELSE 'Falha'
    END as status
FROM login_attempts la
ORDER BY la.created_at DESC;

-- View de sessões ativas
CREATE OR REPLACE VIEW view_active_sessions AS
SELECT 
    as.id,
    as.user_id,
    u.email,
    as.ip_address,
    as.user_agent,
    as.expires_at,
    as.created_at,
    CASE 
        WHEN as.expires_at > NOW() THEN 'Ativa'
        ELSE 'Expirada'
    END as status
FROM active_sessions as
LEFT JOIN auth.users u ON as.user_id = u.id
WHERE as.is_active = true
ORDER BY as.created_at DESC;

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir política de senha padrão
INSERT INTO password_policies (
    name,
    min_length,
    require_uppercase,
    require_lowercase,
    require_numbers,
    require_special_chars,
    max_age_days,
    prevent_reuse_count,
    lockout_threshold,
    lockout_duration_minutes
) VALUES (
    'Política Padrão',
    8,
    true,
    true,
    true,
    true,
    90,
    5,
    5,
    30
);

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

-- Políticas para configurações de segurança
CREATE POLICY "Usuários podem ver suas configurações" ON user_security_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas configurações" ON user_security_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para logs de segurança
CREATE POLICY "Usuários podem ver seus logs" ON security_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todos os logs" ON security_logs
    FOR SELECT USING (
        EXISTS(
            SELECT 1 FROM user_permissions
            WHERE user_id = auth.uid()
                AND resource = 'security'
                AND action = 'read'
        )
    );

-- Políticas para sessões
CREATE POLICY "Usuários podem ver suas sessões" ON active_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem gerenciar suas sessões" ON active_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Políticas para tentativas de login
CREATE POLICY "Usuários podem ver suas tentativas" ON login_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode registrar tentativas" ON login_attempts
    FOR INSERT WITH CHECK (true);

-- Políticas para permissões
CREATE POLICY "Usuários podem ver suas permissões" ON user_permissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins podem gerenciar permissões" ON user_permissions
    FOR ALL USING (
        EXISTS(
            SELECT 1 FROM user_permissions
            WHERE user_id = auth.uid()
                AND resource = 'admin'
                AND action = 'full_access'
        )
    );

-- Políticas para histórico de senhas
CREATE POLICY "Usuários podem ver seu histórico" ON password_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode registrar mudanças" ON password_history
    FOR INSERT WITH CHECK (true); 