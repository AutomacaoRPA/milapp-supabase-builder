-- =====================================================
-- MILAPP MedSênior - Sistema de IA Colaborativa Multiagente
-- Versão: 1.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. TABELA DE CONFIGURAÇÃO DE AGENTES IA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    description TEXT,
    personality TEXT,
    
    -- Configuração técnica
    model_name VARCHAR(100) DEFAULT 'gpt-4',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    
    -- Prompts
    system_prompt TEXT NOT NULL,
    evaluation_prompt TEXT,
    collaboration_prompt TEXT,
    
    -- Configuração de comportamento
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 0,
    
    -- Metadados
    avatar_url TEXT,
    expertise_areas TEXT[],
    communication_style VARCHAR(50) DEFAULT 'professional',
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(name, role)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_agents_role ON public.ai_agents(role);
CREATE INDEX IF NOT EXISTS idx_ai_agents_active ON public.ai_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_ai_agents_priority ON public.ai_agents(priority);

-- =====================================================
-- 2. TABELA DE DEBATES IA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Configuração do debate
    agent_1_id UUID REFERENCES public.ai_agents(id),
    agent_2_id UUID REFERENCES public.ai_agents(id),
    discussion_type VARCHAR(50) DEFAULT 'technical_review' CHECK (discussion_type IN (
        'technical_review', 'architecture_validation', 'security_audit', 
        'scalability_analysis', 'cost_optimization', 'risk_assessment'
    )),
    
    -- Conteúdo do debate
    topic VARCHAR(255) NOT NULL,
    user_input TEXT NOT NULL,
    context_data JSONB DEFAULT '{}',
    
    -- Rounds do debate
    round_1_agent_1_response TEXT,
    round_1_agent_2_response TEXT,
    round_2_agent_1_rebuttal TEXT,
    round_2_agent_2_rebuttal TEXT,
    round_3_final_agreement TEXT,
    
    -- Resultado final
    final_consensus TEXT,
    agreement_points TEXT[],
    disagreement_points TEXT[],
    recommendations TEXT[],
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    feasibility_score INTEGER CHECK (feasibility_score >= 0 AND feasibility_score <= 100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN (
        'in_progress', 'completed', 'failed', 'cancelled'
    )),
    current_round INTEGER DEFAULT 1,
    max_rounds INTEGER DEFAULT 3,
    
    -- Métricas
    total_tokens_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    cost_estimate DECIMAL(10,4),
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_discussions_project ON public.ai_discussions(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_discussions_user ON public.ai_discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_discussions_status ON public.ai_discussions(status);
CREATE INDEX IF NOT EXISTS idx_ai_discussions_type ON public.ai_discussions(discussion_type);
CREATE INDEX IF NOT EXISTS idx_ai_discussions_created_at ON public.ai_discussions(created_at);

-- =====================================================
-- 3. TABELA DE HISTÓRICO DE INTERAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_interaction_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    discussion_id UUID REFERENCES public.ai_discussions(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.ai_agents(id),
    
    -- Detalhes da interação
    round_number INTEGER NOT NULL,
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN (
        'initial_response', 'rebuttal', 'agreement', 'final_consensus'
    )),
    
    -- Conteúdo
    input_text TEXT,
    output_text TEXT,
    prompt_used TEXT,
    
    -- Métricas
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    cost DECIMAL(10,4),
    
    -- Metadados
    model_version VARCHAR(100),
    temperature_used DECIMAL(3,2),
    additional_params JSONB DEFAULT '{}',
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_interaction_logs_discussion ON public.ai_interaction_logs(discussion_id);
CREATE INDEX IF NOT EXISTS idx_ai_interaction_logs_agent ON public.ai_interaction_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_interaction_logs_round ON public.ai_interaction_logs(round_number);

-- =====================================================
-- 4. TABELA DE TEMPLATES DE PROMPTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_prompt_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'system', 'evaluation', 'collaboration', 'consensus', 'specialized'
    )),
    
    -- Conteúdo
    template_text TEXT NOT NULL,
    variables JSONB DEFAULT '{}', -- Variáveis que podem ser substituídas
    example_usage TEXT,
    
    -- Configuração
    is_active BOOLEAN DEFAULT true,
    version VARCHAR(20) DEFAULT '1.0',
    language VARCHAR(10) DEFAULT 'pt-BR',
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(name, version)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_prompt_templates_category ON public.ai_prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_templates_active ON public.ai_prompt_templates(is_active);

-- =====================================================
-- 5. TABELA DE CONFIGURAÇÕES DE PROJETO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.project_ai_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Configurações de IA
    enable_ai_collaboration BOOLEAN DEFAULT true,
    enable_ai_validation BOOLEAN DEFAULT true,
    enable_ai_suggestions BOOLEAN DEFAULT true,
    
    -- Agentes padrão
    default_agent_1_id UUID REFERENCES public.ai_agents(id),
    default_agent_2_id UUID REFERENCES public.ai_agents(id),
    
    -- Configurações de debate
    max_discussion_rounds INTEGER DEFAULT 3,
    auto_approve_threshold INTEGER DEFAULT 80, -- Score mínimo para aprovação automática
    require_human_approval BOOLEAN DEFAULT true,
    
    -- Configurações de custo
    max_cost_per_discussion DECIMAL(10,4) DEFAULT 5.00,
    daily_cost_limit DECIMAL(10,4) DEFAULT 50.00,
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(project_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_project_ai_settings_project ON public.project_ai_settings(project_id);

-- =====================================================
-- 6. FUNÇÕES DE IA COLABORATIVA
-- =====================================================

-- Função para iniciar debate IA
CREATE OR REPLACE FUNCTION public.start_ai_discussion(
    p_project_id UUID,
    p_user_id UUID,
    p_topic VARCHAR(255),
    p_user_input TEXT,
    p_agent_1_id UUID DEFAULT NULL,
    p_agent_2_id UUID DEFAULT NULL,
    p_discussion_type VARCHAR(50) DEFAULT 'technical_review'
)
RETURNS JSONB AS $$
DECLARE
    discussion_id UUID;
    agent_1_record RECORD;
    agent_2_record RECORD;
    project_settings RECORD;
    result JSONB;
BEGIN
    -- Obter configurações do projeto
    SELECT * INTO project_settings
    FROM public.project_ai_settings
    WHERE project_id = p_project_id;
    
    -- Se não tem configuração, usar padrões
    IF project_settings IS NULL THEN
        SELECT * INTO agent_1_record
        FROM public.ai_agents
        WHERE role = 'architect'
        AND is_default = true
        AND is_active = true
        LIMIT 1;
        
        SELECT * INTO agent_2_record
        FROM public.ai_agents
        WHERE role = 'critic'
        AND is_default = true
        AND is_active = true
        LIMIT 1;
    ELSE
        -- Usar agentes especificados ou padrões do projeto
        IF p_agent_1_id IS NOT NULL THEN
            SELECT * INTO agent_1_record
            FROM public.ai_agents
            WHERE id = p_agent_1_id
            AND is_active = true;
        ELSE
            SELECT * INTO agent_1_record
            FROM public.ai_agents
            WHERE id = project_settings.default_agent_1_id
            AND is_active = true;
        END IF;
        
        IF p_agent_2_id IS NOT NULL THEN
            SELECT * INTO agent_2_record
            FROM public.ai_agents
            WHERE id = p_agent_2_id
            AND is_active = true;
        ELSE
            SELECT * INTO agent_2_record
            FROM public.ai_agents
            WHERE id = project_settings.default_agent_2_id
            AND is_active = true;
        END IF;
    END IF;
    
    -- Verificar se encontrou agentes válidos
    IF agent_1_record IS NULL OR agent_2_record IS NULL THEN
        RAISE EXCEPTION 'Agentes IA não encontrados ou inativos';
    END IF;
    
    -- Criar debate
    INSERT INTO public.ai_discussions (
        project_id,
        user_id,
        agent_1_id,
        agent_2_id,
        discussion_type,
        topic,
        user_input,
        status,
        current_round,
        max_rounds
    ) VALUES (
        p_project_id,
        p_user_id,
        agent_1_record.id,
        agent_2_record.id,
        p_discussion_type,
        p_topic,
        p_user_input,
        'in_progress',
        1,
        COALESCE(project_settings.max_discussion_rounds, 3)
    ) RETURNING id INTO discussion_id;
    
    -- Iniciar primeiro round automaticamente
    PERFORM public.execute_ai_discussion_round(discussion_id);
    
    result := jsonb_build_object(
        'discussion_id', discussion_id,
        'agent_1', jsonb_build_object(
            'id', agent_1_record.id,
            'name', agent_1_record.name,
            'role', agent_1_record.role
        ),
        'agent_2', jsonb_build_object(
            'id', agent_2_record.id,
            'name', agent_2_record.name,
            'role', agent_2_record.role
        ),
        'status', 'in_progress',
        'current_round', 1
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para executar round de debate
CREATE OR REPLACE FUNCTION public.execute_ai_discussion_round(
    p_discussion_id UUID
)
RETURNS JSONB AS $$
DECLARE
    discussion_record RECORD;
    agent_1_record RECORD;
    agent_2_record RECORD;
    round_result JSONB;
    start_time TIMESTAMP;
BEGIN
    start_time := NOW();
    
    -- Obter dados do debate
    SELECT * INTO discussion_record
    FROM public.ai_discussions
    WHERE id = p_discussion_id;
    
    IF discussion_record IS NULL THEN
        RAISE EXCEPTION 'Debate não encontrado';
    END IF;
    
    -- Obter dados dos agentes
    SELECT * INTO agent_1_record
    FROM public.ai_agents
    WHERE id = discussion_record.agent_1_id;
    
    SELECT * INTO agent_2_record
    FROM public.ai_agents
    WHERE id = discussion_record.agent_2_id;
    
    -- Executar round baseado no número atual
    CASE discussion_record.current_round
        WHEN 1 THEN
            -- Primeiro round: ambos respondem à proposta inicial
            round_result := public.execute_round_1(discussion_record, agent_1_record, agent_2_record);
        WHEN 2 THEN
            -- Segundo round: agentes rebatem as respostas do outro
            round_result := public.execute_round_2(discussion_record, agent_1_record, agent_2_record);
        WHEN 3 THEN
            -- Terceiro round: consenso final
            round_result := public.execute_round_3(discussion_record, agent_1_record, agent_2_record);
        ELSE
            RAISE EXCEPTION 'Round inválido: %', discussion_record.current_round;
    END CASE;
    
    -- Atualizar debate
    UPDATE public.ai_discussions
    SET 
        current_round = discussion_record.current_round + 1,
        processing_time_ms = EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000,
        updated_at = NOW()
    WHERE id = p_discussion_id;
    
    -- Se chegou ao final, marcar como completo
    IF discussion_record.current_round >= discussion_record.max_rounds THEN
        UPDATE public.ai_discussions
        SET 
            status = 'completed',
            completed_at = NOW()
        WHERE id = p_discussion_id;
    END IF;
    
    RETURN round_result;
END;
$$ LANGUAGE plpgsql;

-- Função para executar round 1
CREATE OR REPLACE FUNCTION public.execute_round_1(
    discussion_record RECORD,
    agent_1_record RECORD,
    agent_2_record RECORD
)
RETURNS JSONB AS $$
DECLARE
    agent_1_response TEXT;
    agent_2_response TEXT;
    result JSONB;
BEGIN
    -- Simular resposta do agente 1 (em produção, chamar API de IA)
    agent_1_response := format(
        'Como %s, analiso a proposta: %s. Minha avaliação técnica inclui...',
        agent_1_record.role,
        discussion_record.user_input
    );
    
    -- Simular resposta do agente 2
    agent_2_response := format(
        'Como %s, reviso a proposta do %s. Identifico os seguintes pontos críticos...',
        agent_2_record.role,
        agent_1_record.name
    );
    
    -- Salvar respostas
    UPDATE public.ai_discussions
    SET 
        round_1_agent_1_response = agent_1_response,
        round_1_agent_2_response = agent_2_response
    WHERE id = discussion_record.id;
    
    -- Registrar logs
    INSERT INTO public.ai_interaction_logs (
        discussion_id,
        agent_id,
        round_number,
        interaction_type,
        input_text,
        output_text,
        tokens_used,
        processing_time_ms
    ) VALUES 
    (discussion_record.id, agent_1_record.id, 1, 'initial_response', 
     discussion_record.user_input, agent_1_response, 150, 2000),
    (discussion_record.id, agent_2_record.id, 1, 'initial_response', 
     discussion_record.user_input, agent_2_response, 120, 1800);
    
    result := jsonb_build_object(
        'round', 1,
        'agent_1_response', agent_1_response,
        'agent_2_response', agent_2_response,
        'status', 'completed'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para executar round 2
CREATE OR REPLACE FUNCTION public.execute_round_2(
    discussion_record RECORD,
    agent_1_record RECORD,
    agent_2_record RECORD
)
RETURNS JSONB AS $$
DECLARE
    agent_1_rebuttal TEXT;
    agent_2_rebuttal TEXT;
    result JSONB;
BEGIN
    -- Simular rebatimento do agente 1
    agent_1_rebuttal := format(
        'Considerando os pontos levantados pelo %s, gostaria de esclarecer...',
        agent_2_record.name
    );
    
    -- Simular rebatimento do agente 2
    agent_2_rebuttal := format(
        'Agradeço a clarificação do %s, mas ainda mantenho as seguintes preocupações...',
        agent_1_record.name
    );
    
    -- Salvar rebatimentos
    UPDATE public.ai_discussions
    SET 
        round_2_agent_1_rebuttal = agent_1_rebuttal,
        round_2_agent_2_rebuttal = agent_2_rebuttal
    WHERE id = discussion_record.id;
    
    -- Registrar logs
    INSERT INTO public.ai_interaction_logs (
        discussion_id,
        agent_id,
        round_number,
        interaction_type,
        input_text,
        output_text,
        tokens_used,
        processing_time_ms
    ) VALUES 
    (discussion_record.id, agent_1_record.id, 2, 'rebuttal', 
     discussion_record.round_1_agent_2_response, agent_1_rebuttal, 100, 1500),
    (discussion_record.id, agent_2_record.id, 2, 'rebuttal', 
     discussion_record.round_1_agent_1_response, agent_2_rebuttal, 90, 1400);
    
    result := jsonb_build_object(
        'round', 2,
        'agent_1_rebuttal', agent_1_rebuttal,
        'agent_2_rebuttal', agent_2_rebuttal,
        'status', 'completed'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para executar round 3 (consenso final)
CREATE OR REPLACE FUNCTION public.execute_round_3(
    discussion_record RECORD,
    agent_1_record RECORD,
    agent_2_record RECORD
)
RETURNS JSONB AS $$
DECLARE
    final_consensus TEXT;
    agreement_points TEXT[];
    disagreement_points TEXT[];
    recommendations TEXT[];
    risk_level VARCHAR(20);
    feasibility_score INTEGER;
    result JSONB;
BEGIN
    -- Simular consenso final
    final_consensus := format(
        'Após nossa discussão, %s e %s chegaram ao seguinte consenso...',
        agent_1_record.name,
        agent_2_record.name
    );
    
    agreement_points := ARRAY[
        'Uso do Supabase é apropriado para o volume previsto',
        'A divisão modular por projetos e pipelines é escalável'
    ];
    
    disagreement_points := ARRAY[
        'Validação legal da LGPD antes da indexação',
        'Necessidade de retry controlado para webhooks'
    ];
    
    recommendations := ARRAY[
        'Implementar cache assíncrono de IA para reduzir custo',
        'Criar primeiro POC com 2 perfis antes de abrir para o time todo'
    ];
    
    risk_level := 'medium';
    feasibility_score := 85;
    
    -- Salvar consenso final
    UPDATE public.ai_discussions
    SET 
        round_3_final_agreement = final_consensus,
        final_consensus = final_consensus,
        agreement_points = agreement_points,
        disagreement_points = disagreement_points,
        recommendations = recommendations,
        risk_level = risk_level,
        feasibility_score = feasibility_score
    WHERE id = discussion_record.id;
    
    -- Registrar log
    INSERT INTO public.ai_interaction_logs (
        discussion_id,
        agent_id,
        round_number,
        interaction_type,
        input_text,
        output_text,
        tokens_used,
        processing_time_ms
    ) VALUES 
    (discussion_record.id, agent_1_record.id, 3, 'final_consensus', 
     'Discussão completa', final_consensus, 200, 3000);
    
    result := jsonb_build_object(
        'round', 3,
        'final_consensus', final_consensus,
        'agreement_points', agreement_points,
        'disagreement_points', disagreement_points,
        'recommendations', recommendations,
        'risk_level', risk_level,
        'feasibility_score', feasibility_score,
        'status', 'completed'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para obter resultado final formatado
CREATE OR REPLACE FUNCTION public.get_ai_discussion_result(
    p_discussion_id UUID
)
RETURNS JSONB AS $$
DECLARE
    discussion_record RECORD;
    agent_1_record RECORD;
    agent_2_record RECORD;
    result JSONB;
BEGIN
    -- Obter dados do debate
    SELECT * INTO discussion_record
    FROM public.ai_discussions
    WHERE id = p_discussion_id;
    
    IF discussion_record IS NULL THEN
        RAISE EXCEPTION 'Debate não encontrado';
    END IF;
    
    -- Obter dados dos agentes
    SELECT * INTO agent_1_record
    FROM public.ai_agents
    WHERE id = discussion_record.agent_1_id;
    
    SELECT * INTO agent_2_record
    FROM public.ai_agents
    WHERE id = discussion_record.agent_2_id;
    
    -- Formatar resultado
    result := jsonb_build_object(
        'discussion_id', discussion_record.id,
        'topic', discussion_record.topic,
        'status', discussion_record.status,
        'agents', jsonb_build_object(
            'agent_1', jsonb_build_object(
                'name', agent_1_record.name,
                'role', agent_1_record.role,
                'avatar', agent_1_record.avatar_url
            ),
            'agent_2', jsonb_build_object(
                'name', agent_2_record.name,
                'role', agent_2_record.role,
                'avatar', agent_2_record.avatar_url
            )
        ),
        'discussion', jsonb_build_object(
            'round_1', jsonb_build_object(
                'agent_1_response', discussion_record.round_1_agent_1_response,
                'agent_2_response', discussion_record.round_1_agent_2_response
            ),
            'round_2', jsonb_build_object(
                'agent_1_rebuttal', discussion_record.round_2_agent_1_rebuttal,
                'agent_2_rebuttal', discussion_record.round_2_agent_2_rebuttal
            ),
            'final_consensus', discussion_record.final_consensus
        ),
        'analysis', jsonb_build_object(
            'agreement_points', discussion_record.agreement_points,
            'disagreement_points', discussion_record.disagreement_points,
            'recommendations', discussion_record.recommendations,
            'risk_level', discussion_record.risk_level,
            'feasibility_score', discussion_record.feasibility_score
        ),
        'metadata', jsonb_build_object(
            'created_at', discussion_record.created_at,
            'completed_at', discussion_record.completed_at,
            'total_tokens_used', discussion_record.total_tokens_used,
            'processing_time_ms', discussion_record.processing_time_ms
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger para atualizar timestamps
CREATE OR REPLACE FUNCTION public.trigger_update_ai_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_agents_timestamp
    BEFORE UPDATE ON public.ai_agents
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_ai_timestamp();

CREATE TRIGGER trigger_update_ai_discussions_timestamp
    BEFORE UPDATE ON public.ai_discussions
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_ai_timestamp();

CREATE TRIGGER trigger_update_ai_prompt_templates_timestamp
    BEFORE UPDATE ON public.ai_prompt_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_ai_timestamp();

CREATE TRIGGER trigger_update_project_ai_settings_timestamp
    BEFORE UPDATE ON public.project_ai_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_ai_timestamp();

-- =====================================================
-- 8. VIEWS PARA RELATÓRIOS
-- =====================================================

-- View para estatísticas de debates IA
CREATE OR REPLACE VIEW public.ai_discussion_statistics AS
SELECT 
    COUNT(*) as total_discussions,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_discussions,
    COUNT(*) FILTER (WHERE status = 'in_progress') as active_discussions,
    AVG(feasibility_score) FILTER (WHERE feasibility_score IS NOT NULL) as avg_feasibility_score,
    AVG(processing_time_ms) FILTER (WHERE processing_time_ms IS NOT NULL) as avg_processing_time,
    SUM(total_tokens_used) as total_tokens_used,
    SUM(cost_estimate) as total_cost_estimate
FROM public.ai_discussions;

-- View para debates recentes
CREATE OR REPLACE VIEW public.recent_ai_discussions AS
SELECT 
    d.id,
    d.topic,
    d.status,
    d.feasibility_score,
    d.risk_level,
    d.created_at,
    p.name as project_name,
    u.full_name as user_name,
    a1.name as agent_1_name,
    a1.role as agent_1_role,
    a2.name as agent_2_name,
    a2.role as agent_2_role
FROM public.ai_discussions d
JOIN public.projects p ON d.project_id = p.id
JOIN public.users u ON d.user_id = u.id
JOIN public.ai_agents a1 ON d.agent_1_id = a1.id
JOIN public.ai_agents a2 ON d.agent_2_id = a2.id
ORDER BY d.created_at DESC;

-- =====================================================
-- 9. DADOS INICIAIS
-- =====================================================

-- Inserir agentes padrão
INSERT INTO public.ai_agents (
    name, role, description, personality, system_prompt, is_default, priority
) VALUES 
(
    'Alex',
    'architect',
    'Arquiteto de Soluções especializado em plataformas de automação',
    'Inovador e pragmático, sempre busca a melhor arquitetura técnica',
    'Você é Alex, um arquiteto de soluções experiente especializado em plataformas de automação empresarial. Sua abordagem é inovadora mas sempre considera escalabilidade, manutenibilidade e custos. Você propõe soluções robustas e modulares.',
    true,
    1
),
(
    'Lina',
    'critic',
    'Analista crítica e auditora técnica especializada em validação',
    'Conservadora e detalhista, sempre identifica riscos e gaps',
    'Você é Lina, uma analista crítica e auditora técnica experiente. Sua função é revisar propostas técnicas, identificar riscos, validar escolhas e propor melhorias ou contrapontos técnicos. Você é conservadora e sempre considera aspectos de segurança, governança e compliance.',
    true,
    2
),
(
    'Marco',
    'security_expert',
    'Especialista em segurança e compliance',
    'Focado em segurança, sempre prioriza proteção de dados',
    'Você é Marco, especialista em segurança da informação e compliance. Sua expertise inclui LGPD, ISO 27001, e melhores práticas de segurança. Você sempre avalia riscos de segurança e propõe medidas de proteção.',
    false,
    3
),
(
    'Sofia',
    'cost_optimizer',
    'Especialista em otimização de custos e ROI',
    'Focada em eficiência, sempre busca o melhor custo-benefício',
    'Você é Sofia, especialista em otimização de custos e análise de ROI. Você avalia propostas técnicas considerando custos de implementação, manutenção e retorno sobre investimento.',
    false,
    4
);

-- Inserir templates de prompts
INSERT INTO public.ai_prompt_templates (
    name, description, category, template_text, variables
) VALUES 
(
    'Arquiteto Avaliação Inicial',
    'Prompt para arquiteto avaliar proposta inicial',
    'evaluation',
    'Como arquiteto de soluções especializado em plataformas de automação, avalie a ideia abaixo e proponha uma solução robusta, modular e alinhada a boas práticas.

Descrição da ideia: {user_input}

Considere:
- Arquitetura técnica adequada
- Escalabilidade e performance
- Manutenibilidade e modularidade
- Integração com sistemas existentes
- Tecnologias recomendadas

Forneça uma análise estruturada com recomendações técnicas.',
    '{"user_input": "string"}'
),
(
    'Crítico Revisão Técnica',
    'Prompt para crítico revisar proposta do arquiteto',
    'evaluation',
    'Como analista crítico e auditor técnico, sua função é revisar a proposta abaixo feita pelo arquiteto, identificar riscos, validar escolhas e propor melhorias ou contrapontos técnicos.

Ideia original: {user_input}
Proposta do arquiteto: {architect_response}

Analise:
- Riscos técnicos e operacionais
- Gaps de segurança e compliance
- Viabilidade de implementação
- Custos e recursos necessários
- Alternativas ou melhorias

Forneça uma análise crítica construtiva.',
    '{"user_input": "string", "architect_response": "string"}'
),
(
    'Consenso Final',
    'Prompt para gerar consenso final entre agentes',
    'consensus',
    'Como moderador que reuniu a discussão entre dois agentes técnicos, com base na troca acima, gere um parecer estruturado com:

## 🧠 Análise Técnica Conjunta

### ✅ Pontos de Concordância
[Liste os pontos onde ambos concordam]

### ⚠️ Pontos de Ajuste
[Identifique divergências e como resolvê-las]

### 🧩 Sugestão Final
[Recomendações consensuais]

### 🧾 Acordo
[Conclusão final sobre viabilidade]

Formate em Markdown estruturado.',
    '{"discussion_summary": "string"}'
);

-- =====================================================
-- 10. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_ai_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para ai_agents
CREATE POLICY "ai_agents_read_all" ON public.ai_agents
    FOR SELECT USING (true);

CREATE POLICY "ai_agents_admin_write" ON public.ai_agents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'ai_admin')
            AND ur.is_active = true
        )
    );

-- Políticas para ai_discussions
CREATE POLICY "ai_discussions_user_access" ON public.ai_discussions
    FOR SELECT USING (
        user_id = auth.uid() OR
        project_id IN (
            SELECT p.id FROM public.projects p
            JOIN public.project_members pm ON p.id = pm.project_id
            WHERE pm.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'ai_admin')
            AND ur.is_active = true
        )
    );

CREATE POLICY "ai_discussions_user_create" ON public.ai_discussions
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        project_id IN (
            SELECT p.id FROM public.projects p
            JOIN public.project_members pm ON p.id = pm.project_id
            WHERE pm.user_id = auth.uid()
        )
    );

-- Políticas para ai_interaction_logs
CREATE POLICY "ai_interaction_logs_admin_access" ON public.ai_interaction_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'ai_admin')
            AND ur.is_active = true
        )
    );

-- Políticas para ai_prompt_templates
CREATE POLICY "ai_prompt_templates_read_all" ON public.ai_prompt_templates
    FOR SELECT USING (true);

CREATE POLICY "ai_prompt_templates_admin_write" ON public.ai_prompt_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'ai_admin')
            AND ur.is_active = true
        )
    );

-- Políticas para project_ai_settings
CREATE POLICY "project_ai_settings_project_access" ON public.project_ai_settings
    FOR ALL USING (
        project_id IN (
            SELECT p.id FROM public.projects p
            JOIN public.project_members pm ON p.id = pm.project_id
            WHERE pm.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'ai_admin')
            AND ur.is_active = true
        )
    );

-- =====================================================
-- FIM DO SISTEMA DE IA COLABORATIVA MULTIAGENTE
-- ===================================================== 