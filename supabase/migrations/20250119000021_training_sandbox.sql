-- =====================================================
-- MILAPP MedSênior - Sistema de Modo Treinamento/Sandbox
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. TABELA DE AMBIENTES DE TREINAMENTO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.training_environments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    environment_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Configuração
    environment_type VARCHAR(50) NOT NULL CHECK (environment_type IN (
        'training', 'sandbox', 'demo', 'testing', 'development'
    )),
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Configurações específicas
    data_retention_hours INTEGER DEFAULT 24, -- Tempo de retenção dos dados
    max_users INTEGER DEFAULT 50, -- Máximo de usuários simultâneos
    max_workflows INTEGER DEFAULT 100, -- Máximo de workflows
    max_storage_mb INTEGER DEFAULT 1024, -- Máximo de armazenamento em MB
    
    -- Dados de exemplo
    sample_data_enabled BOOLEAN DEFAULT true,
    sample_workflows JSONB DEFAULT '[]', -- Workflows de exemplo
    sample_users JSONB DEFAULT '[]', -- Usuários de exemplo
    sample_documents JSONB DEFAULT '[]', -- Documentos de exemplo
    
    -- Configurações de reset
    auto_reset_enabled BOOLEAN DEFAULT true,
    reset_schedule VARCHAR(100) DEFAULT '0 2 * * *', -- Cron expression para reset
    last_reset_at TIMESTAMP WITH TIME ZONE,
    next_reset_at TIMESTAMP WITH TIME ZONE,
    
    -- Controle
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_training_environments_type ON public.training_environments(environment_type);
CREATE INDEX IF NOT EXISTS idx_training_environments_active ON public.training_environments(is_active);

-- =====================================================
-- 2. TABELA DE SESSÕES DE TREINAMENTO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    session_name VARCHAR(255) NOT NULL,
    session_code VARCHAR(20) UNIQUE NOT NULL,
    
    -- Relacionamentos
    environment_id UUID REFERENCES public.training_environments(id),
    instructor_id UUID REFERENCES public.users(id),
    
    -- Configuração
    max_participants INTEGER DEFAULT 20,
    session_duration_hours INTEGER DEFAULT 4,
    
    -- Status
    status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN (
        'scheduled', 'active', 'paused', 'completed', 'cancelled'
    )),
    
    -- Horários
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    
    -- Configurações
    allow_data_persistence BOOLEAN DEFAULT false, -- Se permite persistir dados após sessão
    auto_cleanup BOOLEAN DEFAULT true, -- Limpeza automática após sessão
    
    -- Metadados
    objectives TEXT,
    prerequisites TEXT,
    materials JSONB DEFAULT '[]', -- Materiais de treinamento
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_training_sessions_code ON public.training_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON public.training_sessions(status);
CREATE INDEX IF NOT EXISTS idx_training_sessions_start ON public.training_sessions(scheduled_start);

-- =====================================================
-- 3. TABELA DE PARTICIPANTES DE TREINAMENTO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.training_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    
    -- Status
    status VARCHAR(50) DEFAULT 'registered' CHECK (status IN (
        'registered', 'attending', 'completed', 'dropped'
    )),
    
    -- Progresso
    progress_percentage INTEGER DEFAULT 0,
    completed_modules TEXT[],
    quiz_scores JSONB DEFAULT '{}',
    
    -- Horários
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    
    -- Feedback
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_comments TEXT,
    
    -- Certificado
    certificate_issued BOOLEAN DEFAULT false,
    certificate_url VARCHAR(500),
    certificate_issued_at TIMESTAMP WITH TIME ZONE,
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(session_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_training_participants_session ON public.training_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_training_participants_user ON public.training_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_training_participants_status ON public.training_participants(status);

-- =====================================================
-- 4. TABELA DE DADOS DE TREINAMENTO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.training_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    data_type VARCHAR(50) NOT NULL CHECK (data_type IN (
        'workflow', 'document', 'user', 'conversation', 'execution_log'
    )),
    original_entity_id UUID, -- ID da entidade original (se aplicável)
    
    -- Relacionamentos
    session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE,
    environment_id UUID REFERENCES public.training_environments(id),
    created_by UUID REFERENCES public.users(id),
    
    -- Dados
    entity_data JSONB NOT NULL, -- Dados da entidade
    metadata JSONB DEFAULT '{}', -- Metadados adicionais
    
    -- Controle de ciclo de vida
    expires_at TIMESTAMP WITH TIME ZONE,
    is_sample_data BOOLEAN DEFAULT false,
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_training_data_session ON public.training_data(session_id);
CREATE INDEX IF NOT EXISTS idx_training_data_type ON public.training_data(data_type);
CREATE INDEX IF NOT EXISTS idx_training_data_expires ON public.training_data(expires_at);

-- =====================================================
-- 5. ATUALIZAR TABELAS EXISTENTES COM FLAG DE TREINAMENTO
-- =====================================================

-- Adicionar campos de treinamento aos workflows
ALTER TABLE public.workflows 
ADD COLUMN IF NOT EXISTS is_training BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS training_session_id UUID REFERENCES public.training_sessions(id),
ADD COLUMN IF NOT EXISTS training_environment_id UUID REFERENCES public.training_environments(id);

-- Adicionar campos de treinamento aos documentos
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS is_training BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS training_session_id UUID REFERENCES public.training_sessions(id),
ADD COLUMN IF NOT EXISTS training_environment_id UUID REFERENCES public.training_environments(id);

-- Adicionar campos de treinamento às conversas
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS is_training BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS training_session_id UUID REFERENCES public.training_sessions(id),
ADD COLUMN IF NOT EXISTS training_environment_id UUID REFERENCES public.training_environments(id);

-- Adicionar campos de treinamento aos logs de execução
ALTER TABLE public.workflow_executions 
ADD COLUMN IF NOT EXISTS is_training BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS training_session_id UUID REFERENCES public.training_sessions(id),
ADD COLUMN IF NOT EXISTS training_environment_id UUID REFERENCES public.training_environments(id);

-- =====================================================
-- 6. FUNÇÕES DE TREINAMENTO
-- =====================================================

-- Função para criar ambiente de treinamento
CREATE OR REPLACE FUNCTION public.create_training_environment(
    p_environment_name VARCHAR(100),
    p_display_name VARCHAR(255),
    p_environment_type VARCHAR(50),
    p_description TEXT DEFAULT NULL,
    p_config JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    environment_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    INSERT INTO public.training_environments (
        environment_name,
        display_name,
        description,
        environment_type,
        data_retention_hours,
        max_users,
        max_workflows,
        max_storage_mb,
        sample_data_enabled,
        auto_reset_enabled,
        reset_schedule,
        next_reset_at,
        created_by
    ) VALUES (
        p_environment_name,
        p_display_name,
        p_description,
        p_environment_type,
        (p_config->>'data_retention_hours')::INTEGER,
        (p_config->>'max_users')::INTEGER,
        (p_config->>'max_workflows')::INTEGER,
        (p_config->>'max_storage_mb')::INTEGER,
        COALESCE((p_config->>'sample_data_enabled')::BOOLEAN, true),
        COALESCE((p_config->>'auto_reset_enabled')::BOOLEAN, true),
        COALESCE(p_config->>'reset_schedule', '0 2 * * *'),
        CASE 
            WHEN COALESCE((p_config->>'auto_reset_enabled')::BOOLEAN, true) THEN
                NOW() + INTERVAL '1 day'
            ELSE NULL
        END,
        current_user_id
    ) RETURNING id INTO environment_id;
    
    RETURN environment_id;
END;
$$ LANGUAGE plpgsql;

-- Função para criar sessão de treinamento
CREATE OR REPLACE FUNCTION public.create_training_session(
    p_session_name VARCHAR(255),
    p_environment_id UUID,
    p_instructor_id UUID,
    p_scheduled_start TIMESTAMP WITH TIME ZONE,
    p_scheduled_end TIMESTAMP WITH TIME ZONE,
    p_config JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    session_id UUID;
    session_code VARCHAR(20);
BEGIN
    -- Gerar código único da sessão
    session_code := 'TRN_' || TO_CHAR(NOW(), 'YYYYMMDD') || '_' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6);
    
    INSERT INTO public.training_sessions (
        session_name,
        session_code,
        environment_id,
        instructor_id,
        max_participants,
        session_duration_hours,
        scheduled_start,
        scheduled_end,
        allow_data_persistence,
        auto_cleanup,
        objectives,
        prerequisites,
        materials
    ) VALUES (
        p_session_name,
        session_code,
        p_environment_id,
        p_instructor_id,
        (p_config->>'max_participants')::INTEGER,
        (p_config->>'session_duration_hours')::INTEGER,
        p_scheduled_start,
        p_scheduled_end,
        COALESCE((p_config->>'allow_data_persistence')::BOOLEAN, false),
        COALESCE((p_config->>'auto_cleanup')::BOOLEAN, true),
        p_config->>'objectives',
        p_config->>'prerequisites',
        p_config->'materials'
    ) RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$ LANGUAGE plpgsql;

-- Função para ingressar em sessão de treinamento
CREATE OR REPLACE FUNCTION public.join_training_session(
    p_session_code VARCHAR(20)
)
RETURNS JSONB AS $$
DECLARE
    session_record RECORD;
    participant_count INTEGER;
    result JSONB;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    -- Obter dados da sessão
    SELECT * INTO session_record
    FROM public.training_sessions
    WHERE session_code = p_session_code
    AND status IN ('scheduled', 'active');
    
    IF session_record IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Sessão não encontrada ou não está ativa'
        );
    END IF;
    
    -- Verificar se usuário já está inscrito
    IF EXISTS (
        SELECT 1 FROM public.training_participants
        WHERE session_id = session_record.id
        AND user_id = current_user_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Você já está inscrito nesta sessão'
        );
    END IF;
    
    -- Verificar limite de participantes
    SELECT COUNT(*) INTO participant_count
    FROM public.training_participants
    WHERE session_id = session_record.id
    AND status != 'dropped';
    
    IF participant_count >= session_record.max_participants THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Sessão está lotada'
        );
    END IF;
    
    -- Inscrever participante
    INSERT INTO public.training_participants (
        session_id,
        user_id,
        status
    ) VALUES (
        session_record.id,
        current_user_id,
        'registered'
    );
    
    result := jsonb_build_object(
        'success', true,
        'session_id', session_record.id,
        'session_name', session_record.session_name,
        'environment_id', session_record.environment_id,
        'scheduled_start', session_record.scheduled_start,
        'scheduled_end', session_record.scheduled_end
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para criar dados de treinamento
CREATE OR REPLACE FUNCTION public.create_training_data(
    p_data_type VARCHAR(50),
    p_entity_data JSONB,
    p_session_id UUID DEFAULT NULL,
    p_environment_id UUID DEFAULT NULL,
    p_is_sample BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    data_id UUID;
    current_user_id UUID;
    session_record RECORD;
    environment_record RECORD;
BEGIN
    current_user_id := auth.uid();
    
    -- Determinar session_id e environment_id se não fornecidos
    IF p_session_id IS NULL THEN
        SELECT ts.id, ts.environment_id INTO session_record
        FROM public.training_participants tp
        JOIN public.training_sessions ts ON tp.session_id = ts.id
        WHERE tp.user_id = current_user_id
        AND tp.status IN ('registered', 'attending')
        LIMIT 1;
        
        IF session_record IS NOT NULL THEN
            p_session_id := session_record.id;
            p_environment_id := session_record.environment_id;
        END IF;
    END IF;
    
    -- Obter dados do ambiente se necessário
    IF p_environment_id IS NULL AND p_session_id IS NOT NULL THEN
        SELECT environment_id INTO p_environment_id
        FROM public.training_sessions
        WHERE id = p_session_id;
    END IF;
    
    -- Calcular expiração baseada no ambiente
    SELECT te.data_retention_hours INTO environment_record
    FROM public.training_environments te
    WHERE te.id = p_environment_id;
    
    INSERT INTO public.training_data (
        data_type,
        entity_data,
        session_id,
        environment_id,
        created_by,
        expires_at,
        is_sample_data
    ) VALUES (
        p_data_type,
        p_entity_data,
        p_session_id,
        p_environment_id,
        current_user_id,
        CASE 
            WHEN environment_record.data_retention_hours IS NOT NULL THEN
                NOW() + (environment_record.data_retention_hours * INTERVAL '1 hour')
            ELSE
                NOW() + INTERVAL '24 hours'
        END,
        p_is_sample
    ) RETURNING id INTO data_id;
    
    RETURN data_id;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar dados de treinamento expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_training_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Limpar dados de treinamento expirados
    DELETE FROM public.training_data
    WHERE expires_at IS NOT NULL
    AND expires_at <= NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Limpar workflows de treinamento expirados
    DELETE FROM public.workflows
    WHERE is_training = true
    AND training_session_id IN (
        SELECT id FROM public.training_sessions
        WHERE status = 'completed'
        AND actual_end < NOW() - INTERVAL '24 hours'
    );
    
    -- Limpar documentos de treinamento expirados
    DELETE FROM public.documents
    WHERE is_training = true
    AND training_session_id IN (
        SELECT id FROM public.training_sessions
        WHERE status = 'completed'
        AND actual_end < NOW() - INTERVAL '24 hours'
    );
    
    -- Limpar conversas de treinamento expiradas
    DELETE FROM public.conversations
    WHERE is_training = true
    AND training_session_id IN (
        SELECT id FROM public.training_sessions
        WHERE status = 'completed'
        AND actual_end < NOW() - INTERVAL '24 hours'
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para resetar ambiente de treinamento
CREATE OR REPLACE FUNCTION public.reset_training_environment(
    p_environment_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    environment_record RECORD;
BEGIN
    -- Obter dados do ambiente
    SELECT * INTO environment_record
    FROM public.training_environments
    WHERE id = p_environment_id;
    
    IF environment_record IS NULL THEN
        RETURN false;
    END IF;
    
    -- Limpar todos os dados do ambiente
    DELETE FROM public.training_data
    WHERE environment_id = p_environment_id;
    
    DELETE FROM public.workflows
    WHERE training_environment_id = p_environment_id;
    
    DELETE FROM public.documents
    WHERE training_environment_id = p_environment_id;
    
    DELETE FROM public.conversations
    WHERE training_environment_id = p_environment_id;
    
    DELETE FROM public.workflow_executions
    WHERE training_environment_id = p_environment_id;
    
    -- Atualizar timestamp de reset
    UPDATE public.training_environments
    SET last_reset_at = NOW(),
        next_reset_at = CASE 
            WHEN auto_reset_enabled THEN
                NOW() + INTERVAL '1 day'
            ELSE NULL
        END,
        updated_at = NOW()
    WHERE id = p_environment_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. DADOS INICIAIS
-- =====================================================

-- Inserir ambiente de treinamento padrão
INSERT INTO public.training_environments (
    environment_name,
    display_name,
    description,
    environment_type,
    data_retention_hours,
    max_users,
    max_workflows,
    max_storage_mb,
    sample_data_enabled,
    auto_reset_enabled,
    reset_schedule,
    next_reset_at,
    is_default
) VALUES (
    'default_training',
    'Ambiente de Treinamento Padrão',
    'Ambiente padrão para treinamentos e demonstrações',
    'training',
    24,
    50,
    100,
    1024,
    true,
    true,
    '0 2 * * *',
    NOW() + INTERVAL '1 day',
    true
);

-- Inserir ambiente sandbox
INSERT INTO public.training_environments (
    environment_name,
    display_name,
    description,
    environment_type,
    data_retention_hours,
    max_users,
    max_workflows,
    max_storage_mb,
    sample_data_enabled,
    auto_reset_enabled,
    reset_schedule
) VALUES (
    'sandbox',
    'Ambiente Sandbox',
    'Ambiente para testes e experimentação',
    'sandbox',
    48,
    20,
    50,
    512,
    false,
    false,
    NULL
);

-- =====================================================
-- 8. VIEWS PARA RELATÓRIOS
-- =====================================================

-- View para sessões de treinamento ativas
CREATE OR REPLACE VIEW public.active_training_sessions AS
SELECT 
    ts.session_code,
    ts.session_name,
    te.display_name as environment_name,
    u.email as instructor_email,
    ts.status,
    ts.scheduled_start,
    ts.scheduled_end,
    COUNT(tp.id) as participant_count,
    ts.max_participants
FROM public.training_sessions ts
JOIN public.training_environments te ON ts.environment_id = te.id
LEFT JOIN public.users u ON ts.instructor_id = u.id
LEFT JOIN public.training_participants tp ON ts.id = tp.session_id AND tp.status != 'dropped'
WHERE ts.status IN ('scheduled', 'active')
GROUP BY ts.id, ts.session_code, ts.session_name, te.display_name, u.email, ts.status, ts.scheduled_start, ts.scheduled_end, ts.max_participants
ORDER BY ts.scheduled_start;

-- View para estatísticas de treinamento
CREATE OR REPLACE VIEW public.training_statistics AS
SELECT 
    te.environment_name,
    te.environment_type,
    COUNT(ts.id) as total_sessions,
    COUNT(ts.id) FILTER (WHERE ts.status = 'completed') as completed_sessions,
    COUNT(tp.id) as total_participants,
    AVG(tp.progress_percentage) as avg_progress,
    AVG(tp.feedback_rating) as avg_feedback
FROM public.training_environments te
LEFT JOIN public.training_sessions ts ON te.id = ts.environment_id
LEFT JOIN public.training_participants tp ON ts.id = tp.session_id
WHERE te.is_active = true
GROUP BY te.id, te.environment_name, te.environment_type;

-- View para dados de treinamento por tipo
CREATE OR REPLACE VIEW public.training_data_summary AS
SELECT 
    data_type,
    COUNT(*) as total_items,
    COUNT(*) FILTER (WHERE is_sample_data = true) as sample_items,
    COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_items,
    MIN(created_at) as oldest_item,
    MAX(created_at) as newest_item
FROM public.training_data
GROUP BY data_type;

-- =====================================================
-- 9. TRIGGERS
-- =====================================================

-- Trigger para atualizar timestamps
CREATE OR REPLACE FUNCTION public.trigger_update_training_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_training_timestamp
    BEFORE UPDATE ON public.training_environments
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_training_timestamp();

CREATE TRIGGER trigger_update_session_timestamp
    BEFORE UPDATE ON public.training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_training_timestamp();

CREATE TRIGGER trigger_update_participant_timestamp
    BEFORE UPDATE ON public.training_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_training_timestamp();

-- Trigger para marcar entidades como treinamento
CREATE OR REPLACE FUNCTION public.trigger_mark_training_entities()
RETURNS TRIGGER AS $$
DECLARE
    current_session_id UUID;
    current_environment_id UUID;
BEGIN
    -- Verificar se usuário está em sessão de treinamento
    SELECT tp.session_id, ts.environment_id INTO current_session_id, current_environment_id
    FROM public.training_participants tp
    JOIN public.training_sessions ts ON tp.session_id = ts.id
    WHERE tp.user_id = auth.uid()
    AND tp.status IN ('registered', 'attending')
    LIMIT 1;
    
    IF current_session_id IS NOT NULL THEN
        NEW.is_training := true;
        NEW.training_session_id := current_session_id;
        NEW.training_environment_id := current_environment_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mark_workflows_training
    BEFORE INSERT ON public.workflows
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_mark_training_entities();

CREATE TRIGGER trigger_mark_documents_training
    BEFORE INSERT ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_mark_training_entities();

CREATE TRIGGER trigger_mark_conversations_training
    BEFORE INSERT ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_mark_training_entities();

-- =====================================================
-- 10. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.training_environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_data ENABLE ROW LEVEL SECURITY;

-- Políticas para training_environments
CREATE POLICY "training_environments_read_access" ON public.training_environments
    FOR SELECT USING (is_active = true);

-- Políticas para training_sessions
CREATE POLICY "training_sessions_read_access" ON public.training_sessions
    FOR SELECT USING (
        status IN ('scheduled', 'active') OR
        instructor_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.training_participants tp
            WHERE tp.session_id = training_sessions.id
            AND tp.user_id = auth.uid()
        )
    );

-- Políticas para training_participants
CREATE POLICY "training_participants_own_access" ON public.training_participants
    FOR SELECT USING (
        user_id = auth.uid() OR
        session_id IN (
            SELECT id FROM public.training_sessions
            WHERE instructor_id = auth.uid()
        )
    );

-- Políticas para training_data
CREATE POLICY "training_data_session_access" ON public.training_data
    FOR SELECT USING (
        session_id IN (
            SELECT tp.session_id FROM public.training_participants tp
            WHERE tp.user_id = auth.uid()
            AND tp.status IN ('registered', 'attending')
        ) OR
        environment_id IN (
            SELECT te.id FROM public.training_environments te
            WHERE te.is_active = true
        )
    );

-- =====================================================
-- FIM DO SISTEMA DE TREINAMENTO/SANDBOX
-- ===================================================== 