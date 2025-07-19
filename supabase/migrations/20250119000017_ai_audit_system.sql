-- =====================================================
-- MILAPP MedSênior - Sistema de Auditoria de IA (AI Trust & Explainability)
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. TABELA DE AUDITORIA DE IA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação da interação
    session_id VARCHAR(100) NOT NULL,
    interaction_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Contexto da decisão
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN (
        'pop_generation', 'nc_analysis', 'action_plan', 'workflow_decision', 
        'document_review', 'quality_assessment', 'risk_analysis'
    )),
    entity_id UUID,
    
    -- Dados de entrada
    input_data JSONB NOT NULL,
    input_context TEXT,
    user_intent TEXT,
    
    -- Configuração da IA
    ai_model VARCHAR(50) NOT NULL,
    model_version VARCHAR(20),
    prompt_template TEXT NOT NULL,
    prompt_variables JSONB DEFAULT '{}',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER,
    
    -- Resposta da IA
    ai_response TEXT NOT NULL,
    ai_response_structured JSONB,
    confidence_score DECIMAL(3,2),
    reasoning_chain TEXT,
    
    -- Metadados da decisão
    decision_type VARCHAR(50) CHECK (decision_type IN (
        'classification', 'generation', 'analysis', 'recommendation', 'validation'
    )),
    decision_impact VARCHAR(20) CHECK (decision_impact IN (
        'low', 'medium', 'high', 'critical'
    )),
    
    -- Controle humano
    human_reviewed BOOLEAN DEFAULT false,
    human_approved BOOLEAN,
    human_override_reason TEXT,
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Rastreabilidade
    user_id UUID REFERENCES public.users(id),
    user_role VARCHAR(50),
    user_department VARCHAR(100),
    
    -- Performance
    response_time_ms INTEGER,
    tokens_used INTEGER,
    cost_usd DECIMAL(10,4),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_ai_audit_session ON public.ai_audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_entity ON public.ai_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_user ON public.ai_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_audit_created_at ON public.ai_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_audit_model ON public.ai_audit_logs(ai_model);

-- =====================================================
-- 2. TABELA DE EXPLICABILIDADE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_explanations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_log_id UUID REFERENCES public.ai_audit_logs(id) ON DELETE CASCADE,
    
    -- Explicação da decisão
    decision_factors JSONB NOT NULL, -- Fatores que influenciaram a decisão
    confidence_breakdown JSONB, -- Detalhamento do nível de confiança
    alternative_options JSONB, -- Opções alternativas consideradas
    risk_assessment JSONB, -- Avaliação de riscos da decisão
    
    -- Contexto explicativo
    relevant_documents UUID[], -- Documentos relacionados
    similar_cases UUID[], -- Casos similares
    regulatory_compliance JSONB, -- Conformidade regulatória
    
    -- Controle de qualidade
    explanation_quality_score DECIMAL(3,2),
    explanation_reviewed BOOLEAN DEFAULT false,
    explanation_approved_by UUID REFERENCES public.users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TABELA DE REVISÃO HUMANA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_human_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_log_id UUID REFERENCES public.ai_audit_logs(id) ON DELETE CASCADE,
    
    -- Revisor
    reviewer_id UUID REFERENCES public.users(id),
    reviewer_role VARCHAR(50),
    review_type VARCHAR(50) CHECK (review_type IN (
        'quality_check', 'compliance_review', 'expert_validation', 'supervisor_approval'
    )),
    
    -- Avaliação
    review_decision VARCHAR(20) CHECK (review_decision IN (
        'approved', 'rejected', 'modified', 'requires_changes'
    )),
    review_comments TEXT,
    suggested_changes JSONB,
    
    -- Metadados
    review_duration_minutes INTEGER,
    review_criteria JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. TABELA DE ROLLBACK DE DECISÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_decision_rollbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Decisão original
    original_audit_log_id UUID REFERENCES public.ai_audit_logs(id),
    original_entity_id UUID,
    original_entity_type VARCHAR(50),
    
    -- Rollback
    rollback_reason TEXT NOT NULL,
    rollback_type VARCHAR(50) CHECK (rollback_type IN (
        'human_override', 'system_error', 'compliance_violation', 'quality_issue'
    )),
    
    -- Nova decisão
    new_decision TEXT,
    new_decision_source VARCHAR(50) CHECK (new_decision_source IN (
        'human', 'ai_retry', 'manual_override', 'system_default'
    )),
    
    -- Impacto
    affected_users UUID[],
    business_impact TEXT,
    corrective_actions TEXT,
    
    -- Controle
    rollback_by UUID REFERENCES public.users(id),
    rollback_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Aprovação
    rollback_approved BOOLEAN DEFAULT false,
    rollback_approved_by UUID REFERENCES public.users(id),
    rollback_approved_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 5. FUNÇÕES DE AUDITORIA
-- =====================================================

-- Função para registrar decisão de IA
CREATE OR REPLACE FUNCTION public.log_ai_decision(
    p_session_id VARCHAR(100),
    p_entity_type VARCHAR(50),
    p_entity_id UUID,
    p_input_data JSONB,
    p_ai_model VARCHAR(50),
    p_prompt_template TEXT,
    p_ai_response TEXT,
    p_decision_type VARCHAR(50) DEFAULT NULL,
    p_decision_impact VARCHAR(20) DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
    audit_id UUID;
    interaction_id VARCHAR(100);
    current_user_id UUID;
    user_role VARCHAR(50);
    user_department VARCHAR(100);
BEGIN
    -- Gerar ID de interação
    interaction_id := 'AI_' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS') || '_' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
    
    -- Obter dados do usuário
    current_user_id := auth.uid();
    
    -- Obter role e departamento do usuário
    SELECT ur.role, ur.department INTO user_role, user_department
    FROM public.user_roles ur
    WHERE ur.user_id = current_user_id
    AND ur.is_active = true
    LIMIT 1;
    
    -- Inserir log de auditoria
    INSERT INTO public.ai_audit_logs (
        session_id,
        interaction_id,
        entity_type,
        entity_id,
        input_data,
        ai_model,
        prompt_template,
        ai_response,
        decision_type,
        decision_impact,
        user_id,
        user_role,
        user_department
    ) VALUES (
        p_session_id,
        interaction_id,
        p_entity_type,
        p_entity_id,
        p_input_data,
        p_ai_model,
        p_prompt_template,
        p_ai_response,
        p_decision_type,
        p_decision_impact,
        current_user_id,
        user_role,
        user_department
    ) RETURNING id INTO audit_id;
    
    -- Criar explicação automática
    PERFORM public.generate_ai_explanation(audit_id);
    
    RETURN audit_id;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar explicação automática
CREATE OR REPLACE FUNCTION public.generate_ai_explanation(p_audit_log_id UUID)
RETURNS UUID AS $$
DECLARE
    explanation_id UUID;
    audit_record RECORD;
BEGIN
    -- Obter dados do audit log
    SELECT * INTO audit_record FROM public.ai_audit_logs WHERE id = p_audit_log_id;
    
    -- Gerar explicação (simulada - em produção seria mais complexa)
    INSERT INTO public.ai_explanations (
        audit_log_id,
        decision_factors,
        confidence_breakdown,
        alternative_options,
        risk_assessment,
        explanation_quality_score
    ) VALUES (
        p_audit_log_id,
        jsonb_build_object(
            'input_quality', 'high',
            'model_confidence', 0.85,
            'context_relevance', 'medium',
            'historical_patterns', 'detected'
        ),
        jsonb_build_object(
            'overall_confidence', 0.85,
            'input_confidence', 0.90,
            'model_confidence', 0.80,
            'context_confidence', 0.85
        ),
        jsonb_build_object(
            'alternatives', jsonb_build_array(
                jsonb_build_object('option', 'Alternative 1', 'confidence', 0.75),
                jsonb_build_object('option', 'Alternative 2', 'confidence', 0.65)
            )
        ),
        jsonb_build_object(
            'risk_level', 'low',
            'compliance_risks', 'none',
            'business_impact', 'minimal'
        ),
        0.85
    ) RETURNING id INTO explanation_id;
    
    RETURN explanation_id;
END;
$$ LANGUAGE plpgsql;

-- Função para revisão humana
CREATE OR REPLACE FUNCTION public.review_ai_decision(
    p_audit_log_id UUID,
    p_review_decision VARCHAR(20),
    p_review_comments TEXT DEFAULT NULL,
    p_suggested_changes JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    review_id UUID;
    current_user_id UUID;
    user_role VARCHAR(50);
BEGIN
    current_user_id := auth.uid();
    
    -- Obter role do usuário
    SELECT ur.role INTO user_role
    FROM public.user_roles ur
    WHERE ur.user_id = current_user_id
    AND ur.is_active = true
    LIMIT 1;
    
    -- Criar revisão
    INSERT INTO public.ai_human_reviews (
        audit_log_id,
        reviewer_id,
        reviewer_role,
        review_type,
        review_decision,
        review_comments,
        suggested_changes
    ) VALUES (
        p_audit_log_id,
        current_user_id,
        user_role,
        'quality_check',
        p_review_decision,
        p_review_comments,
        p_suggested_changes
    ) RETURNING id INTO review_id;
    
    -- Atualizar audit log
    UPDATE public.ai_audit_logs 
    SET human_reviewed = true,
        human_approved = (p_review_decision = 'approved'),
        reviewed_by = current_user_id,
        reviewed_at = NOW()
    WHERE id = p_audit_log_id;
    
    RETURN review_id;
END;
$$ LANGUAGE plpgsql;

-- Função para rollback de decisão
CREATE OR REPLACE FUNCTION public.rollback_ai_decision(
    p_audit_log_id UUID,
    p_rollback_reason TEXT,
    p_rollback_type VARCHAR(50),
    p_new_decision TEXT DEFAULT NULL,
    p_new_decision_source VARCHAR(50) DEFAULT 'human'
)
RETURNS UUID AS $$
DECLARE
    rollback_id UUID;
    audit_record RECORD;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    -- Obter dados do audit log
    SELECT * INTO audit_record FROM public.ai_audit_logs WHERE id = p_audit_log_id;
    
    -- Criar rollback
    INSERT INTO public.ai_decision_rollbacks (
        original_audit_log_id,
        original_entity_id,
        original_entity_type,
        rollback_reason,
        rollback_type,
        new_decision,
        new_decision_source,
        rollback_by
    ) VALUES (
        p_audit_log_id,
        audit_record.entity_id,
        audit_record.entity_type,
        p_rollback_reason,
        p_rollback_type,
        p_new_decision,
        p_new_decision_source,
        current_user_id
    ) RETURNING id INTO rollback_id;
    
    RETURN rollback_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. VIEWS PARA AUDITORIA
-- =====================================================

-- View para decisões de IA pendentes de revisão
CREATE OR REPLACE VIEW public.pending_ai_reviews AS
SELECT 
    al.interaction_id,
    al.entity_type,
    al.entity_id,
    al.ai_model,
    al.decision_type,
    al.decision_impact,
    al.ai_response,
    al.created_at,
    u.email as user_email,
    al.user_role,
    al.user_department
FROM public.ai_audit_logs al
LEFT JOIN public.users u ON al.user_id = u.id
WHERE al.human_reviewed = false
AND al.decision_impact IN ('high', 'critical')
ORDER BY al.created_at DESC;

-- View para estatísticas de IA
CREATE OR REPLACE VIEW public.ai_statistics AS
SELECT 
    ai_model,
    COUNT(*) as total_decisions,
    COUNT(*) FILTER (WHERE human_reviewed = true) as reviewed_decisions,
    COUNT(*) FILTER (WHERE human_approved = true) as approved_decisions,
    AVG(confidence_score) as avg_confidence,
    AVG(response_time_ms) as avg_response_time,
    SUM(cost_usd) as total_cost
FROM public.ai_audit_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY ai_model;

-- View para rollbacks de decisões
CREATE OR REPLACE VIEW public.ai_rollback_history AS
SELECT 
    ar.rollback_reason,
    ar.rollback_type,
    ar.new_decision_source,
    ar.rollback_at,
    u.email as rolled_back_by,
    al.entity_type,
    al.entity_id
FROM public.ai_decision_rollbacks ar
JOIN public.ai_audit_logs al ON ar.original_audit_log_id = al.id
LEFT JOIN public.users u ON ar.rollback_by = u.id
ORDER BY ar.rollback_at DESC;

-- =====================================================
-- 7. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.ai_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_human_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_decision_rollbacks ENABLE ROW LEVEL SECURITY;

-- Políticas para ai_audit_logs
CREATE POLICY "ai_audit_logs_user_access" ON public.ai_audit_logs
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'auditor', 'supervisor')
            AND ur.is_active = true
        )
    );

-- Políticas para ai_explanations
CREATE POLICY "ai_explanations_audit_access" ON public.ai_explanations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ai_audit_logs al
            WHERE al.id = ai_explanations.audit_log_id
            AND (al.user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.user_roles ur
                    WHERE ur.user_id = auth.uid()
                    AND ur.role IN ('admin', 'auditor')
                    AND ur.is_active = true
                )
            )
        )
    );

-- =====================================================
-- FIM DO SISTEMA DE AUDITORIA DE IA
-- ===================================================== 