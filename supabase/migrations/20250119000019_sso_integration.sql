-- =====================================================
-- MILAPP MedSênior - Sistema de Integração SSO Corporativa
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. TABELA DE PROVEDORES SSO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.sso_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    provider_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN (
        'azure_ad', 'google_workspace', 'okta', 'onelogin', 'custom_saml', 'oauth2'
    )),
    
    -- Configuração
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- URLs e Endpoints
    issuer_url VARCHAR(500),
    sso_url VARCHAR(500),
    slo_url VARCHAR(500),
    metadata_url VARCHAR(500),
    
    -- Certificados
    certificate_pem TEXT,
    private_key_pem TEXT,
    
    -- Configuração OAuth2
    client_id VARCHAR(255),
    client_secret VARCHAR(500),
    redirect_uri VARCHAR(500),
    scopes TEXT[],
    
    -- Mapeamento de atributos
    attribute_mapping JSONB DEFAULT '{}', -- Mapeamento de atributos SAML/OAuth para campos do usuário
    
    -- Configurações avançadas
    settings JSONB DEFAULT '{}',
    
    -- Controle
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sso_providers_type ON public.sso_providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_sso_providers_active ON public.sso_providers(is_active);

-- =====================================================
-- 2. TABELA DE SESSÕES SSO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.sso_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação da sessão
    session_id VARCHAR(100) UNIQUE NOT NULL,
    provider_id UUID REFERENCES public.sso_providers(id),
    
    -- Dados do usuário
    external_user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    user_display_name VARCHAR(255),
    
    -- Dados da sessão
    id_token TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Atributos do usuário
    user_attributes JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sso_sessions_external_user ON public.sso_sessions(external_user_id);
CREATE INDEX IF NOT EXISTS idx_sso_sessions_active ON public.sso_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sso_sessions_expires ON public.sso_sessions(expires_at);

-- =====================================================
-- 3. TABELA DE MAPEAMENTO DE USUÁRIOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.sso_user_mapping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.sso_providers(id),
    
    -- Identificadores externos
    external_user_id VARCHAR(255) NOT NULL,
    external_email VARCHAR(255),
    
    -- Mapeamento de atributos
    mapped_attributes JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, provider_id),
    UNIQUE(provider_id, external_user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sso_user_mapping_user ON public.sso_user_mapping(user_id);
CREATE INDEX IF NOT EXISTS idx_sso_user_mapping_external ON public.sso_user_mapping(external_user_id);
CREATE INDEX IF NOT EXISTS idx_sso_user_mapping_provider ON public.sso_user_mapping(provider_id);

-- =====================================================
-- 4. TABELA DE LOGS DE AUTENTICAÇÃO SSO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.sso_auth_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    session_id VARCHAR(100),
    provider_id UUID REFERENCES public.sso_providers(id),
    
    -- Dados da autenticação
    auth_type VARCHAR(50) NOT NULL CHECK (auth_type IN (
        'login', 'logout', 'token_refresh', 'session_expired', 'error'
    )),
    auth_status VARCHAR(50) NOT NULL CHECK (auth_status IN (
        'success', 'failed', 'pending', 'cancelled'
    )),
    
    -- Dados do usuário
    external_user_id VARCHAR(255),
    user_email VARCHAR(255),
    
    -- Detalhes
    error_message TEXT,
    error_code VARCHAR(100),
    auth_data JSONB DEFAULT '{}',
    
    -- Metadados
    ip_address INET,
    user_agent TEXT,
    location_data JSONB DEFAULT '{}',
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sso_auth_logs_session ON public.sso_auth_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_sso_auth_logs_provider ON public.sso_auth_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_sso_auth_logs_status ON public.sso_auth_logs(auth_status);
CREATE INDEX IF NOT EXISTS idx_sso_auth_logs_created_at ON public.sso_auth_logs(created_at);

-- =====================================================
-- 5. FUNÇÕES DE INTEGRAÇÃO SSO
-- =====================================================

-- Função para registrar provedor SSO
CREATE OR REPLACE FUNCTION public.register_sso_provider(
    p_provider_name VARCHAR(100),
    p_display_name VARCHAR(255),
    p_provider_type VARCHAR(50),
    p_config JSONB
)
RETURNS UUID AS $$
DECLARE
    provider_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    INSERT INTO public.sso_providers (
        provider_name,
        display_name,
        provider_type,
        issuer_url,
        sso_url,
        slo_url,
        metadata_url,
        client_id,
        client_secret,
        redirect_uri,
        scopes,
        attribute_mapping,
        settings,
        created_by
    ) VALUES (
        p_provider_name,
        p_display_name,
        p_provider_type,
        p_config->>'issuer_url',
        p_config->>'sso_url',
        p_config->>'slo_url',
        p_config->>'metadata_url',
        p_config->>'client_id',
        p_config->>'client_secret',
        p_config->>'redirect_uri',
        ARRAY(SELECT jsonb_array_elements_text(p_config->'scopes')),
        p_config->'attribute_mapping',
        p_config->'settings',
        current_user_id
    ) RETURNING id INTO provider_id;
    
    RETURN provider_id;
END;
$$ LANGUAGE plpgsql;

-- Função para mapear usuário SSO
CREATE OR REPLACE FUNCTION public.map_sso_user(
    p_provider_id UUID,
    p_external_user_id VARCHAR(255),
    p_external_email VARCHAR(255),
    p_user_attributes JSONB
)
RETURNS UUID AS $$
DECLARE
    user_id UUID;
    existing_mapping_id UUID;
BEGIN
    -- Verificar se já existe mapeamento
    SELECT id INTO existing_mapping_id
    FROM public.sso_user_mapping
    WHERE provider_id = p_provider_id
    AND external_user_id = p_external_user_id;
    
    IF existing_mapping_id IS NOT NULL THEN
        -- Atualizar mapeamento existente
        UPDATE public.sso_user_mapping
        SET external_email = p_external_email,
            mapped_attributes = p_user_attributes,
            last_sync_at = NOW(),
            updated_at = NOW()
        WHERE id = existing_mapping_id
        RETURNING user_id INTO user_id;
        
        RETURN user_id;
    END IF;
    
    -- Verificar se usuário existe pelo email
    SELECT id INTO user_id
    FROM public.users
    WHERE email = p_external_email;
    
    IF user_id IS NULL THEN
        -- Criar novo usuário
        INSERT INTO public.users (
            email,
            full_name,
            is_active
        ) VALUES (
            p_external_email,
            p_user_attributes->>'display_name',
            true
        ) RETURNING id INTO user_id;
    END IF;
    
    -- Criar mapeamento
    INSERT INTO public.sso_user_mapping (
        user_id,
        provider_id,
        external_user_id,
        external_email,
        mapped_attributes
    ) VALUES (
        user_id,
        p_provider_id,
        p_external_user_id,
        p_external_email,
        p_user_attributes
    );
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql;

-- Função para autenticar via SSO
CREATE OR REPLACE FUNCTION public.authenticate_sso_user(
    p_provider_id UUID,
    p_external_user_id VARCHAR(255),
    p_session_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    user_id UUID;
    session_id VARCHAR(100);
    provider_record RECORD;
    result JSONB;
BEGIN
    -- Obter dados do provedor
    SELECT * INTO provider_record
    FROM public.sso_providers
    WHERE id = p_provider_id
    AND is_active = true;
    
    IF provider_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Provedor SSO não encontrado ou inativo'
        );
    END IF;
    
    -- Obter usuário mapeado
    SELECT sm.user_id INTO user_id
    FROM public.sso_user_mapping sm
    WHERE sm.provider_id = p_provider_id
    AND sm.external_user_id = p_external_user_id
    AND sm.is_active = true;
    
    IF user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Usuário não mapeado para este provedor SSO'
        );
    END IF;
    
    -- Gerar ID de sessão
    session_id := 'SSO_' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS') || '_' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
    
    -- Criar sessão SSO
    INSERT INTO public.sso_sessions (
        session_id,
        provider_id,
        external_user_id,
        user_email,
        user_display_name,
        id_token,
        access_token,
        refresh_token,
        token_expires_at,
        user_attributes,
        expires_at
    ) VALUES (
        session_id,
        p_provider_id,
        p_external_user_id,
        p_session_data->>'email',
        p_session_data->>'display_name',
        p_session_data->>'id_token',
        p_session_data->>'access_token',
        p_session_data->>'refresh_token',
        (p_session_data->>'expires_at')::TIMESTAMP WITH TIME ZONE,
        p_session_data->'attributes',
        NOW() + INTERVAL '8 hours'
    );
    
    -- Registrar log de autenticação
    INSERT INTO public.sso_auth_logs (
        session_id,
        provider_id,
        auth_type,
        auth_status,
        external_user_id,
        user_email,
        auth_data
    ) VALUES (
        session_id,
        p_provider_id,
        'login',
        'success',
        p_external_user_id,
        p_session_data->>'email',
        p_session_data
    );
    
    result := jsonb_build_object(
        'success', true,
        'session_id', session_id,
        'user_id', user_id,
        'expires_at', NOW() + INTERVAL '8 hours'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para validar sessão SSO
CREATE OR REPLACE FUNCTION public.validate_sso_session(
    p_session_id VARCHAR(100)
)
RETURNS JSONB AS $$
DECLARE
    session_record RECORD;
    result JSONB;
BEGIN
    SELECT * INTO session_record
    FROM public.sso_sessions
    WHERE session_id = p_session_id
    AND is_active = true
    AND expires_at > NOW();
    
    IF session_record IS NULL THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Sessão SSO inválida ou expirada'
        );
    END IF;
    
    -- Atualizar última atividade
    UPDATE public.sso_sessions
    SET last_activity_at = NOW()
    WHERE session_id = p_session_id;
    
    result := jsonb_build_object(
        'valid', true,
        'user_id', session_record.external_user_id,
        'email', session_record.user_email,
        'display_name', session_record.user_display_name,
        'provider_id', session_record.provider_id,
        'expires_at', session_record.expires_at
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para encerrar sessão SSO
CREATE OR REPLACE FUNCTION public.logout_sso_session(
    p_session_id VARCHAR(100)
)
RETURNS BOOLEAN AS $$
DECLARE
    session_record RECORD;
BEGIN
    SELECT * INTO session_record
    FROM public.sso_sessions
    WHERE session_id = p_session_id
    AND is_active = true;
    
    IF session_record IS NULL THEN
        RETURN false;
    END IF;
    
    -- Desativar sessão
    UPDATE public.sso_sessions
    SET is_active = false
    WHERE session_id = p_session_id;
    
    -- Registrar log de logout
    INSERT INTO public.sso_auth_logs (
        session_id,
        provider_id,
        auth_type,
        auth_status,
        external_user_id,
        user_email
    ) VALUES (
        p_session_id,
        session_record.provider_id,
        'logout',
        'success',
        session_record.external_user_id,
        session_record.user_email
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. DADOS INICIAIS DE PROVEDORES SSO
-- =====================================================

-- Inserir provedor Azure AD padrão
INSERT INTO public.sso_providers (
    provider_name,
    display_name,
    provider_type,
    issuer_url,
    sso_url,
    slo_url,
    attribute_mapping,
    settings,
    is_default
) VALUES (
    'azure_ad',
    'Microsoft Entra ID (Azure AD)',
    'azure_ad',
    'https://login.microsoftonline.com/{tenant_id}/v2.0',
    'https://login.microsoftonline.com/{tenant_id}/saml2',
    'https://login.microsoftonline.com/{tenant_id}/saml2',
    jsonb_build_object(
        'email', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
        'display_name', 'http://schemas.microsoft.com/identity/claims/displayname',
        'given_name', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
        'surname', 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
        'groups', 'http://schemas.microsoft.com/ws/2008/06/identity/claims/groups'
    ),
    jsonb_build_object(
        'tenant_id', 'your-tenant-id',
        'application_id', 'your-application-id',
        'force_authn', true,
        'name_id_format', 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
    ),
    true
);

-- Inserir provedor Google Workspace
INSERT INTO public.sso_providers (
    provider_name,
    display_name,
    provider_type,
    issuer_url,
    sso_url,
    slo_url,
    attribute_mapping,
    settings
) VALUES (
    'google_workspace',
    'Google Workspace',
    'oauth2',
    'https://accounts.google.com',
    'https://accounts.google.com/o/oauth2/auth',
    'https://accounts.google.com/o/oauth2/revoke',
    jsonb_build_object(
        'email', 'email',
        'display_name', 'name',
        'given_name', 'given_name',
        'surname', 'family_name',
        'picture', 'picture'
    ),
    jsonb_build_object(
        'scopes', jsonb_build_array('openid', 'email', 'profile'),
        'response_type', 'code',
        'grant_type', 'authorization_code'
    )
);

-- =====================================================
-- 7. VIEWS PARA RELATÓRIOS SSO
-- =====================================================

-- View para estatísticas de autenticação SSO
CREATE OR REPLACE VIEW public.sso_auth_statistics AS
SELECT 
    sp.provider_name,
    sp.display_name,
    COUNT(sal.id) as total_auth_attempts,
    COUNT(sal.id) FILTER (WHERE sal.auth_status = 'success') as successful_auths,
    COUNT(sal.id) FILTER (WHERE sal.auth_status = 'failed') as failed_auths,
    COUNT(DISTINCT sal.external_user_id) as unique_users,
    AVG(EXTRACT(EPOCH FROM (sal.created_at - LAG(sal.created_at) OVER (PARTITION BY sal.external_user_id ORDER BY sal.created_at))) / 3600) as avg_hours_between_auths
FROM public.sso_providers sp
LEFT JOIN public.sso_auth_logs sal ON sp.id = sal.provider_id
WHERE sp.is_active = true
AND sal.created_at >= NOW() - INTERVAL '30 days'
GROUP BY sp.id, sp.provider_name, sp.display_name;

-- View para sessões SSO ativas
CREATE OR REPLACE VIEW public.active_sso_sessions AS
SELECT 
    ss.session_id,
    sp.provider_name,
    ss.external_user_id,
    ss.user_email,
    ss.user_display_name,
    ss.created_at,
    ss.last_activity_at,
    ss.expires_at,
    EXTRACT(EPOCH FROM (ss.expires_at - NOW())) / 3600 as hours_remaining
FROM public.sso_sessions ss
JOIN public.sso_providers sp ON ss.provider_id = sp.id
WHERE ss.is_active = true
AND ss.expires_at > NOW()
ORDER BY ss.last_activity_at DESC;

-- View para mapeamentos de usuários SSO
CREATE OR REPLACE VIEW public.sso_user_mappings AS
SELECT 
    u.email,
    u.full_name,
    sp.provider_name,
    sum.external_user_id,
    sum.external_email,
    sum.last_sync_at,
    sum.is_active
FROM public.sso_user_mapping sum
JOIN public.users u ON sum.user_id = u.id
JOIN public.sso_providers sp ON sum.provider_id = sp.id
ORDER BY sum.last_sync_at DESC;

-- =====================================================
-- 8. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.sso_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_user_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_auth_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para sso_providers
CREATE POLICY "sso_providers_admin_access" ON public.sso_providers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'security_admin')
            AND ur.is_active = true
        )
    );

-- Políticas para sso_sessions
CREATE POLICY "sso_sessions_own_access" ON public.sso_sessions
    FOR SELECT USING (
        external_user_id IN (
            SELECT external_user_id 
            FROM public.sso_user_mapping 
            WHERE user_id = auth.uid()
        )
    );

-- Políticas para sso_user_mapping
CREATE POLICY "sso_user_mapping_own_access" ON public.sso_user_mapping
    FOR SELECT USING (user_id = auth.uid());

-- Políticas para sso_auth_logs
CREATE POLICY "sso_auth_logs_admin_access" ON public.sso_auth_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'security_admin')
            AND ur.is_active = true
        )
    );

-- =====================================================
-- FIM DO SISTEMA DE INTEGRAÇÃO SSO
-- ===================================================== 