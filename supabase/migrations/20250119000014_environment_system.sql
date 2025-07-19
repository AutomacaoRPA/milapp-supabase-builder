-- =====================================================
-- MILAPP MedSênior - Sistema de Ambientes e Deploy
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. TABELA DE AMBIENTES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.environments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Configuração
    environment_type VARCHAR(20) NOT NULL CHECK (environment_type IN (
        'development', 'staging', 'production', 'testing'
    )),
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- URLs e Endpoints
    frontend_url VARCHAR(500),
    backend_url VARCHAR(500),
    api_url VARCHAR(500),
    database_url VARCHAR(500),
    
    -- Configurações específicas
    config JSONB DEFAULT '{}',
    
    -- Controle
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_environments_type ON public.environments(environment_type);
CREATE INDEX IF NOT EXISTS idx_environments_active ON public.environments(is_active);

-- =====================================================
-- 2. TABELA DE DEPLOYS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    deployment_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Ambientes
    source_environment_id UUID REFERENCES public.environments(id),
    target_environment_id UUID REFERENCES public.environments(id),
    
    -- Status e progresso
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'completed', 'failed', 'rolled_back'
    )),
    progress_percentage INTEGER DEFAULT 0,
    
    -- Dados do deploy
    deployment_data JSONB DEFAULT '{}',
    rollback_data JSONB DEFAULT '{}',
    
    -- Controle de tempo
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_duration_minutes INTEGER,
    
    -- Responsáveis
    initiated_by UUID REFERENCES public.users(id),
    approved_by UUID REFERENCES public.users(id),
    
    -- Resultado
    result_summary TEXT,
    error_message TEXT,
    logs JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_deployments_source_env ON public.deployments(source_environment_id);
CREATE INDEX IF NOT EXISTS idx_deployments_target_env ON public.deployments(target_environment_id);
CREATE INDEX IF NOT EXISTS idx_deployments_status ON public.deployments(status);
CREATE INDEX IF NOT EXISTS idx_deployments_created_at ON public.deployments(created_at);

-- =====================================================
-- 3. TABELA DE CONFIGURAÇÕES DE AMBIENTE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.environment_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamento
    environment_id UUID REFERENCES public.environments(id) ON DELETE CASCADE,
    
    -- Configuração
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    config_type VARCHAR(20) DEFAULT 'string' CHECK (config_type IN (
        'string', 'number', 'boolean', 'json', 'secret'
    )),
    
    -- Metadados
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    is_secret BOOLEAN DEFAULT false,
    
    -- Controle
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(environment_id, config_key)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_environment_configs_env ON public.environment_configs(environment_id);
CREATE INDEX IF NOT EXISTS idx_environment_configs_key ON public.environment_configs(config_key);

-- =====================================================
-- 4. TABELA DE SANDBOX
-- =====================================================

CREATE TABLE IF NOT EXISTS public.sandbox_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Usuário e projeto
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Configuração
    sandbox_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    
    -- Controle de tempo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Limites
    max_duration_hours INTEGER DEFAULT 24,
    max_storage_mb INTEGER DEFAULT 100,
    
    -- Estatísticas
    access_count INTEGER DEFAULT 0,
    data_size_mb INTEGER DEFAULT 0
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sandbox_user ON public.sandbox_instances(user_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_project ON public.sandbox_instances(project_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_active ON public.sandbox_instances(is_active);
CREATE INDEX IF NOT EXISTS idx_sandbox_expires ON public.sandbox_instances(expires_at);

-- =====================================================
-- 5. FUNÇÕES DE AMBIENTE
-- =====================================================

-- Função para obter configuração de ambiente
CREATE OR REPLACE FUNCTION public.get_environment_config(
    p_environment_name VARCHAR(50),
    p_config_key VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
    config_key VARCHAR(100),
    config_value TEXT,
    config_type VARCHAR(20),
    is_secret BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ec.config_key,
        CASE 
            WHEN ec.is_secret THEN '***HIDDEN***'
            ELSE ec.config_value
        END as config_value,
        ec.config_type,
        ec.is_secret
    FROM public.environment_configs ec
    JOIN public.environments e ON ec.environment_id = e.id
    WHERE e.name = p_environment_name
    AND e.is_active = true
    AND (p_config_key IS NULL OR ec.config_key = p_config_key)
    ORDER BY ec.config_key;
END;
$$ LANGUAGE plpgsql;

-- Função para criar deploy
CREATE OR REPLACE FUNCTION public.create_deployment(
    p_name VARCHAR(255),
    p_source_env VARCHAR(50),
    p_target_env VARCHAR(50),
    p_description TEXT DEFAULT NULL
)
RETURNS VARCHAR(100) AS $$
DECLARE
    deployment_uuid VARCHAR(100);
    source_env_id UUID;
    target_env_id UUID;
    current_user_id UUID;
BEGIN
    -- Obter IDs dos ambientes
    SELECT id INTO source_env_id FROM public.environments WHERE name = p_source_env;
    SELECT id INTO target_env_id FROM public.environments WHERE name = p_target_env;
    
    IF source_env_id IS NULL THEN
        RAISE EXCEPTION 'Ambiente de origem não encontrado: %', p_source_env;
    END IF;
    
    IF target_env_id IS NULL THEN
        RAISE EXCEPTION 'Ambiente de destino não encontrado: %', p_target_env;
    END IF;
    
    -- Obter usuário atual
    current_user_id := auth.uid();
    
    -- Gerar ID de deploy
    deployment_uuid := 'DEPLOY_' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS') || '_' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
    
    -- Criar deploy
    INSERT INTO public.deployments (
        deployment_id,
        name,
        description,
        source_environment_id,
        target_environment_id,
        initiated_by
    ) VALUES (
        deployment_uuid,
        p_name,
        p_description,
        source_env_id,
        target_env_id,
        current_user_id
    );
    
    RETURN deployment_uuid;
END;
$$ LANGUAGE plpgsql;

-- Função para executar deploy
CREATE OR REPLACE FUNCTION public.execute_deployment(
    p_deployment_id VARCHAR(100)
)
RETURNS JSONB AS $$
DECLARE
    deploy_record RECORD;
    result JSONB;
    start_time TIMESTAMP WITH TIME ZONE;
    end_time TIMESTAMP WITH TIME ZONE;
    duration_ms INTEGER;
BEGIN
    -- Obter dados do deploy
    SELECT * INTO deploy_record FROM public.deployments WHERE deployment_id = p_deployment_id;
    
    IF deploy_record IS NULL THEN
        RAISE EXCEPTION 'Deploy não encontrado';
    END IF;
    
    -- Verificar se pode ser executado
    IF deploy_record.status != 'pending' THEN
        RAISE EXCEPTION 'Deploy não está pendente';
    END IF;
    
    -- Atualizar status para em progresso
    UPDATE public.deployments 
    SET status = 'in_progress', started_at = NOW()
    WHERE deployment_id = p_deployment_id;
    
    start_time := NOW();
    
    -- Simular execução do deploy
    -- Em produção, aqui seria a lógica real de deploy
    PERFORM pg_sleep(2); -- Simular tempo de processamento
    
    end_time := NOW();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Determinar resultado (simulado)
    IF RANDOM() > 0.1 THEN -- 90% de sucesso
        result := jsonb_build_object(
            'success', true,
            'message', 'Deploy executado com sucesso',
            'duration_ms', duration_ms,
            'deployed_items', jsonb_build_array('workflows', 'documents', 'configurations')
        );
        
        -- Atualizar deploy como concluído
        UPDATE public.deployments 
        SET status = 'completed',
            completed_at = NOW(),
            progress_percentage = 100,
            result_summary = 'Deploy concluído com sucesso',
            logs = jsonb_build_array(
                jsonb_build_object('timestamp', NOW(), 'level', 'info', 'message', 'Deploy iniciado'),
                jsonb_build_object('timestamp', NOW(), 'level', 'info', 'message', 'Migrações aplicadas'),
                jsonb_build_object('timestamp', NOW(), 'level', 'info', 'message', 'Configurações atualizadas'),
                jsonb_build_object('timestamp', NOW(), 'level', 'success', 'message', 'Deploy concluído')
            )
        WHERE deployment_id = p_deployment_id;
    ELSE
        result := jsonb_build_object(
            'success', false,
            'error', 'Erro durante o deploy',
            'duration_ms', duration_ms
        );
        
        -- Atualizar deploy como falhou
        UPDATE public.deployments 
        SET status = 'failed',
            completed_at = NOW(),
            error_message = 'Erro durante o deploy',
            logs = jsonb_build_array(
                jsonb_build_object('timestamp', NOW(), 'level', 'error', 'message', 'Falha no deploy')
            )
        WHERE deployment_id = p_deployment_id;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para criar sandbox
CREATE OR REPLACE FUNCTION public.create_sandbox(
    p_name VARCHAR(255),
    p_project_id UUID,
    p_description TEXT DEFAULT NULL,
    p_duration_hours INTEGER DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
    sandbox_id UUID;
    current_user_id UUID;
BEGIN
    -- Obter usuário atual
    current_user_id := auth.uid();
    
    -- Verificar se usuário tem acesso ao projeto
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = current_user_id
        AND ur.project_id = p_project_id
        AND ur.is_active = true
    ) THEN
        RAISE EXCEPTION 'Usuário não tem acesso ao projeto';
    END IF;
    
    -- Criar sandbox
    INSERT INTO public.sandbox_instances (
        name,
        description,
        user_id,
        project_id,
        expires_at,
        max_duration_hours
    ) VALUES (
        p_name,
        p_description,
        current_user_id,
        p_project_id,
        NOW() + (p_duration_hours || ' hours')::INTERVAL,
        p_duration_hours
    ) RETURNING id INTO sandbox_id;
    
    RETURN sandbox_id;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar sandboxes expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_sandboxes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE public.sandbox_instances 
    SET is_active = false
    WHERE expires_at < NOW() AND is_active = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. DADOS INICIAIS DE AMBIENTES
-- =====================================================

-- Inserir ambientes padrão
INSERT INTO public.environments (
    name,
    display_name,
    description,
    environment_type,
    is_active,
    is_default,
    frontend_url,
    backend_url,
    api_url
) VALUES 
(
    'dev',
    'Desenvolvimento',
    'Ambiente de desenvolvimento para testes e desenvolvimento',
    'development',
    true,
    false,
    'http://localhost:3000',
    'http://localhost:8000',
    'http://localhost:8000/api'
),
(
    'staging',
    'Homologação',
    'Ambiente de homologação para testes de integração',
    'staging',
    true,
    false,
    'https://staging.milapp.com',
    'https://api-staging.milapp.com',
    'https://api-staging.milapp.com/api'
),
(
    'prod',
    'Produção',
    'Ambiente de produção para uso final',
    'production',
    true,
    true,
    'https://milapp.com',
    'https://api.milapp.com',
    'https://api.milapp.com/api'
),
(
    'test',
    'Testes',
    'Ambiente dedicado para testes automatizados',
    'testing',
    true,
    false,
    'https://test.milapp.com',
    'https://api-test.milapp.com',
    'https://api-test.milapp.com/api'
);

-- Inserir configurações de ambiente
INSERT INTO public.environment_configs (
    environment_id,
    config_key,
    config_value,
    config_type,
    description,
    is_required,
    is_secret
) 
SELECT 
    e.id,
    'OPENAI_API_KEY',
    'sk-test-key',
    'secret',
    'Chave da API OpenAI',
    true,
    true
FROM public.environments e
WHERE e.name = 'dev'

UNION ALL

SELECT 
    e.id,
    'DATABASE_URL',
    'postgresql://user:pass@localhost:5432/milapp_dev',
    'string',
    'URL de conexão com banco de dados',
    true,
    true
FROM public.environments e
WHERE e.name = 'dev'

UNION ALL

SELECT 
    e.id,
    'ENABLE_DEBUG',
    'true',
    'boolean',
    'Habilitar modo debug',
    false,
    false
FROM public.environments e
WHERE e.name = 'dev'

UNION ALL

SELECT 
    e.id,
    'LOG_LEVEL',
    'debug',
    'string',
    'Nível de log',
    false,
    false
FROM public.environments e
WHERE e.name = 'dev';

-- =====================================================
-- 7. VIEWS PARA RELATÓRIOS
-- =====================================================

-- View para status de ambientes
CREATE OR REPLACE VIEW public.environment_status AS
SELECT 
    e.name,
    e.display_name,
    e.environment_type,
    e.is_active,
    e.is_default,
    COUNT(d.id) as total_deployments,
    COUNT(d.id) FILTER (WHERE d.status = 'completed') as successful_deployments,
    COUNT(d.id) FILTER (WHERE d.status = 'failed') as failed_deployments,
    MAX(d.created_at) as last_deployment
FROM public.environments e
LEFT JOIN public.deployments d ON e.id = d.target_environment_id
GROUP BY e.id, e.name, e.display_name, e.environment_type, e.is_active, e.is_default;

-- View para histórico de deploys
CREATE OR REPLACE VIEW public.deployment_history AS
SELECT 
    d.deployment_id,
    d.name,
    d.description,
    source_env.name as source_environment,
    target_env.name as target_environment,
    d.status,
    d.progress_percentage,
    d.started_at,
    d.completed_at,
    EXTRACT(EPOCH FROM (d.completed_at - d.started_at)) / 60 as duration_minutes,
    initiator.email as initiated_by,
    approver.email as approved_by,
    d.result_summary,
    d.error_message
FROM public.deployments d
JOIN public.environments source_env ON d.source_environment_id = source_env.id
JOIN public.environments target_env ON d.target_environment_id = target_env.id
LEFT JOIN public.users initiator ON d.initiated_by = initiator.id
LEFT JOIN public.users approver ON d.approved_by = approver.id
ORDER BY d.created_at DESC;

-- View para sandboxes ativas
CREATE OR REPLACE VIEW public.active_sandboxes AS
SELECT 
    s.id,
    s.name,
    s.description,
    u.email as user_email,
    p.name as project_name,
    s.created_at,
    s.expires_at,
    s.last_accessed_at,
    s.access_count,
    s.data_size_mb,
    EXTRACT(EPOCH FROM (s.expires_at - NOW())) / 3600 as hours_remaining
FROM public.sandbox_instances s
JOIN public.users u ON s.user_id = u.id
JOIN public.projects p ON s.project_id = p.id
WHERE s.is_active = true
ORDER BY s.created_at DESC;

-- =====================================================
-- 8. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environment_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sandbox_instances ENABLE ROW LEVEL SECURITY;

-- Políticas para environments
CREATE POLICY "environments_read_access" ON public.environments
    FOR SELECT USING (true);

CREATE POLICY "environments_write_access" ON public.environments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'manager')
            AND ur.is_active = true
        )
    );

-- Políticas para deployments
CREATE POLICY "deployments_read_access" ON public.deployments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'manager')
            AND ur.is_active = true
        )
    );

CREATE POLICY "deployments_write_access" ON public.deployments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'manager')
            AND ur.is_active = true
        )
    );

-- Políticas para environment_configs
CREATE POLICY "environment_configs_read_access" ON public.environment_configs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'manager')
            AND ur.is_active = true
        )
    );

-- Políticas para sandbox_instances
CREATE POLICY "sandbox_instances_access" ON public.sandbox_instances
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- 9. TRIGGERS E AUTOMAÇÕES
-- =====================================================

-- Trigger para atualizar timestamps
CREATE TRIGGER trigger_update_environments_updated_at
    BEFORE UPDATE ON public.environments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_update_deployments_updated_at
    BEFORE UPDATE ON public.deployments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_update_environment_configs_updated_at
    BEFORE UPDATE ON public.environment_configs
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- FIM DO SISTEMA DE AMBIENTES
-- ===================================================== 