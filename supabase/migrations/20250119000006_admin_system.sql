-- =====================================================
-- MILAPP MedSênior - Sistema de Administração
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. CONFIGURAÇÕES GLOBAIS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value TEXT,
    type VARCHAR(50) DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    is_global BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(project_id, key)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_settings_project_id ON public.settings(project_id);
CREATE INDEX IF NOT EXISTS idx_settings_key ON public.settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_global ON public.settings(is_global);

-- =====================================================
-- 2. CREDENCIAIS E CHAVES DE API
-- =====================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL CHECK (provider IN (
        'supabase', 'twilio', 'zapi', 'sendgrid', 'openai', 'anthropic', 
        'teams', 'resend', 'stripe', 'aws', 'azure'
    )),
    key_value TEXT NOT NULL,
    secret_value TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_api_keys_project_id ON public.api_keys(project_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON public.api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON public.api_keys(is_active);

-- =====================================================
-- 3. WEBHOOKS E ENDPOINTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    event_types TEXT[] NOT NULL, -- ['new_request', 'status_change', 'ai_response', etc.]
    method VARCHAR(10) DEFAULT 'POST' CHECK (method IN ('GET', 'POST', 'PUT', 'PATCH')),
    headers JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    retry_count INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_project_id ON public.webhook_endpoints(project_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_active ON public.webhook_endpoints(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_events ON public.webhook_endpoints USING GIN(event_types);

-- =====================================================
-- 4. CONFIGURAÇÕES DE IA POR PROJETO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_project_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    model_provider VARCHAR(50) NOT NULL DEFAULT 'openai' CHECK (model_provider IN (
        'openai', 'anthropic', 'mistral', 'google', 'azure'
    )),
    model_name VARCHAR(100) NOT NULL DEFAULT 'gpt-4',
    temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    max_tokens INTEGER DEFAULT 4000,
    system_prompt TEXT,
    user_persona TEXT,
    context_window INTEGER DEFAULT 8000,
    is_active BOOLEAN DEFAULT true,
    api_key_id UUID REFERENCES public.api_keys(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(project_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_project_settings_project_id ON public.ai_project_settings(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_project_settings_provider ON public.ai_project_settings(model_provider);

-- =====================================================
-- 5. PERMISSÕES GRANULARES (RBAC AVANÇADO)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(50) NOT NULL CHECK (role IN (
        'superadmin', 'gestor_global', 'gestor', 'executor', 'solicitante', 'ia'
    )),
    module VARCHAR(50) NOT NULL CHECK (module IN (
        'projects', 'requests', 'users', 'ai', 'notifications', 'admin', 
        'audit', 'settings', 'webhooks', 'environments'
    )),
    permission VARCHAR(50) NOT NULL CHECK (permission IN (
        'view', 'create', 'edit', 'delete', 'approve', 'export', 'import'
    )),
    is_granted BOOLEAN DEFAULT false,
    conditions JSONB DEFAULT '{}', -- Condições específicas (ex: apenas projetos próprios)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(role, module, permission)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module ON public.role_permissions(module);

-- =====================================================
-- 6. LOGS DE WEBHOOK
-- =====================================================

CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    response_time_ms INTEGER,
    success BOOLEAN DEFAULT false,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON public.webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON public.webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON public.webhook_logs(created_at);

-- =====================================================
-- 7. FUNÇÕES PARA GESTÃO DE CONFIGURAÇÕES
-- =====================================================

-- Função para obter configuração
CREATE OR REPLACE FUNCTION public.get_setting(
    p_key VARCHAR(100),
    p_project_id UUID DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    setting_value TEXT;
BEGIN
    -- Primeiro tentar configuração específica do projeto
    IF p_project_id IS NOT NULL THEN
        SELECT value INTO setting_value
        FROM public.settings
        WHERE key = p_key AND project_id = p_project_id;
    END IF;
    
    -- Se não encontrou, buscar configuração global
    IF setting_value IS NULL THEN
        SELECT value INTO setting_value
        FROM public.settings
        WHERE key = p_key AND is_global = true;
    END IF;
    
    RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para definir configuração
CREATE OR REPLACE FUNCTION public.set_setting(
    p_key VARCHAR(100),
    p_value TEXT,
    p_project_id UUID DEFAULT NULL,
    p_type VARCHAR(50) DEFAULT 'string',
    p_description TEXT DEFAULT NULL,
    p_is_encrypted BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    setting_id UUID;
BEGIN
    INSERT INTO public.settings (
        project_id,
        key,
        value,
        type,
        description,
        is_encrypted,
        is_global
    ) VALUES (
        p_project_id,
        p_key,
        p_value,
        p_type,
        p_description,
        p_is_encrypted,
        p_project_id IS NULL
    )
    ON CONFLICT (project_id, key)
    DO UPDATE SET
        value = EXCLUDED.value,
        type = EXCLUDED.type,
        description = EXCLUDED.description,
        is_encrypted = EXCLUDED.is_encrypted,
        updated_at = NOW()
    RETURNING id INTO setting_id;
    
    RETURN setting_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar permissão
CREATE OR REPLACE FUNCTION public.has_permission(
    p_user_id UUID,
    p_module VARCHAR(50),
    p_permission VARCHAR(50),
    p_project_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR(50);
    has_perm BOOLEAN;
BEGIN
    -- Obter papel do usuário
    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = p_user_id
    AND (p_project_id IS NULL OR project_id = p_project_id)
    AND is_active = true
    ORDER BY 
        CASE role 
            WHEN 'superadmin' THEN 1
            WHEN 'gestor_global' THEN 2
            WHEN 'gestor' THEN 3
            WHEN 'executor' THEN 4
            WHEN 'solicitante' THEN 5
            WHEN 'ia' THEN 6
            ELSE 7
        END
    LIMIT 1;
    
    -- Verificar permissão
    SELECT is_granted INTO has_perm
    FROM public.role_permissions
    WHERE role = user_role
    AND module = p_module
    AND permission = p_permission;
    
    RETURN COALESCE(has_perm, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. FUNÇÕES PARA WEBHOOKS
-- =====================================================

-- Função para disparar webhooks
CREATE OR REPLACE FUNCTION public.trigger_webhooks(
    p_event_type VARCHAR(100),
    p_payload JSONB,
    p_project_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    webhook_record RECORD;
    triggered_count INTEGER := 0;
BEGIN
    FOR webhook_record IN
        SELECT * FROM public.webhook_endpoints
        WHERE is_active = true
        AND (p_project_id IS NULL OR project_id = p_project_id)
        AND p_event_type = ANY(event_types)
    LOOP
        -- Inserir log do webhook
        INSERT INTO public.webhook_logs (
            webhook_id,
            event_type,
            payload
        ) VALUES (
            webhook_record.id,
            p_event_type,
            p_payload
        );
        
        triggered_count := triggered_count + 1;
    END LOOP;
    
    RETURN triggered_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. TRIGGERS PARA AUTOMAÇÃO
-- =====================================================

-- Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas
CREATE TRIGGER trigger_update_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_update_api_keys_updated_at
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_update_webhook_endpoints_updated_at
    BEFORE UPDATE ON public.webhook_endpoints
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_update_ai_project_settings_updated_at
    BEFORE UPDATE ON public.ai_project_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_update_role_permissions_updated_at
    BEFORE UPDATE ON public.role_permissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- 10. DADOS INICIAIS
-- =====================================================

-- Configurações globais padrão
INSERT INTO public.settings (key, value, type, description, is_global) VALUES
('platform_name', 'MILAPP MedSênior', 'string', 'Nome da plataforma', true),
('platform_version', '2.0.0', 'string', 'Versão atual da plataforma', true),
('ai_enabled', 'true', 'boolean', 'Habilitar IA no sistema', true),
('notifications_enabled', 'true', 'boolean', 'Habilitar notificações', true),
('audit_enabled', 'true', 'boolean', 'Habilitar auditoria', true),
('default_language', 'pt-BR', 'string', 'Idioma padrão', true),
('default_timezone', 'America/Sao_Paulo', 'string', 'Fuso horário padrão', true),
('session_timeout_minutes', '480', 'number', 'Timeout da sessão em minutos', true),
('max_file_size_mb', '10', 'number', 'Tamanho máximo de arquivo em MB', true),
('password_min_length', '8', 'number', 'Tamanho mínimo de senha', true)
ON CONFLICT (key) DO NOTHING;

-- Permissões padrão
INSERT INTO public.role_permissions (role, module, permission, is_granted) VALUES
-- Superadmin - acesso total
('superadmin', 'projects', 'view', true),
('superadmin', 'projects', 'create', true),
('superadmin', 'projects', 'edit', true),
('superadmin', 'projects', 'delete', true),
('superadmin', 'users', 'view', true),
('superadmin', 'users', 'create', true),
('superadmin', 'users', 'edit', true),
('superadmin', 'users', 'delete', true),
('superadmin', 'admin', 'view', true),
('superadmin', 'admin', 'create', true),
('superadmin', 'admin', 'edit', true),
('superadmin', 'admin', 'delete', true),

-- Gestor Global
('gestor_global', 'projects', 'view', true),
('gestor_global', 'projects', 'create', true),
('gestor_global', 'projects', 'edit', true),
('gestor_global', 'users', 'view', true),
('gestor_global', 'users', 'create', true),
('gestor_global', 'users', 'edit', true),
('gestor_global', 'admin', 'view', true),
('gestor_global', 'admin', 'edit', true),

-- Gestor
('gestor', 'projects', 'view', true),
('gestor', 'projects', 'edit', true),
('gestor', 'users', 'view', true),
('gestor', 'admin', 'view', true),

-- Executor
('executor', 'projects', 'view', true),
('executor', 'requests', 'view', true),
('executor', 'requests', 'edit', true),

-- Solicitante
('solicitante', 'projects', 'view', true),
('solicitante', 'requests', 'view', true),
('solicitante', 'requests', 'create', true),

-- IA
('ia', 'requests', 'view', true),
('ia', 'requests', 'edit', true),
('ia', 'ai', 'view', true),
('ia', 'ai', 'create', true)
ON CONFLICT (role, module, permission) DO NOTHING;

-- =====================================================
-- 11. VIEWS PARA RELATÓRIOS ADMINISTRATIVOS
-- =====================================================

-- View para estatísticas de webhooks
CREATE OR REPLACE VIEW public.webhook_stats AS
SELECT 
    we.id,
    we.name,
    we.url,
    we.event_types,
    COUNT(wl.id) as total_triggers,
    COUNT(wl.id) FILTER (WHERE wl.success = true) as success_count,
    COUNT(wl.id) FILTER (WHERE wl.success = false) as failure_count,
    AVG(wl.response_time_ms) as avg_response_time,
    MAX(wl.created_at) as last_triggered
FROM public.webhook_endpoints we
LEFT JOIN public.webhook_logs wl ON we.id = wl.webhook_id
GROUP BY we.id, we.name, we.url, we.event_types;

-- View para configurações do sistema
CREATE OR REPLACE VIEW public.system_config AS
SELECT 
    key,
    value,
    type,
    description,
    is_global,
    project_id,
    updated_at
FROM public.settings
ORDER BY is_global DESC, project_id NULLS FIRST, key;

-- =====================================================
-- 12. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_project_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para settings (apenas gestores)
CREATE POLICY "settings_admin_access" ON public.settings
    FOR ALL USING (
        public.has_permission(auth.uid(), 'settings', 'view')
    );

-- Políticas para api_keys (apenas gestores)
CREATE POLICY "api_keys_admin_access" ON public.api_keys
    FOR ALL USING (
        public.has_permission(auth.uid(), 'admin', 'view')
    );

-- Políticas para webhook_endpoints (apenas gestores)
CREATE POLICY "webhook_endpoints_admin_access" ON public.webhook_endpoints
    FOR ALL USING (
        public.has_permission(auth.uid(), 'webhooks', 'view')
    );

-- Políticas para ai_project_settings (gestores do projeto)
CREATE POLICY "ai_project_settings_gestor_access" ON public.ai_project_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.project_id = ai_project_settings.project_id
            AND ur.role IN ('superadmin', 'gestor_global', 'gestor')
            AND ur.is_active = true
        )
    );

-- Políticas para role_permissions (apenas superadmin)
CREATE POLICY "role_permissions_superadmin_access" ON public.role_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'superadmin'
            AND ur.is_active = true
        )
    );

-- Políticas para webhook_logs (apenas gestores)
CREATE POLICY "webhook_logs_admin_access" ON public.webhook_logs
    FOR ALL USING (
        public.has_permission(auth.uid(), 'admin', 'view')
    );

-- =====================================================
-- FIM DA MIGRAÇÃO DE ADMINISTRAÇÃO
-- ===================================================== 