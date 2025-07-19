-- =====================================================
-- MILAPP MedSênior - Sistema de Gestão de Incidentes ITIL 4
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. TABELA DE INCIDENTES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.incident_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação ITIL
    incident_number VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Classificação ITIL
    incident_type VARCHAR(50) NOT NULL CHECK (incident_type IN (
        'incident', 'service_request', 'problem', 'change_request'
    )),
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    
    -- Priorização ITIL
    urgency VARCHAR(20) NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
    impact VARCHAR(20) NOT NULL CHECK (impact IN ('low', 'medium', 'high', 'critical')),
    priority VARCHAR(20) GENERATED ALWAYS AS (
        CASE 
            WHEN urgency = 'critical' AND impact = 'critical' THEN 'critical'
            WHEN urgency = 'critical' AND impact = 'high' THEN 'critical'
            WHEN urgency = 'high' AND impact = 'critical' THEN 'critical'
            WHEN urgency = 'high' AND impact = 'high' THEN 'high'
            WHEN urgency = 'high' AND impact = 'medium' THEN 'high'
            WHEN urgency = 'medium' AND impact = 'high' THEN 'high'
            WHEN urgency = 'medium' AND impact = 'medium' THEN 'medium'
            WHEN urgency = 'medium' AND impact = 'low' THEN 'medium'
            WHEN urgency = 'low' AND impact = 'medium' THEN 'medium'
            ELSE 'low'
        END
    ) STORED,
    
    -- Status ITIL
    status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN (
        'new', 'assigned', 'in_progress', 'pending_user', 'pending_third_party', 
        'resolved', 'closed', 'cancelled'
    )),
    
    -- SLA e Tempos
    sla_target_minutes INTEGER,
    response_time_minutes INTEGER,
    resolution_time_minutes INTEGER,
    first_response_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Relacionamentos
    affected_service VARCHAR(100),
    affected_user_id UUID REFERENCES public.users(id),
    assigned_to UUID REFERENCES public.users(id),
    assigned_group VARCHAR(100),
    
    -- Dados de contexto
    location VARCHAR(100),
    business_unit VARCHAR(100),
    cost_center VARCHAR(100),
    
    -- Metadados
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    
    -- Controle
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_incident_log_number ON public.incident_log(incident_number);
CREATE INDEX IF NOT EXISTS idx_incident_log_type ON public.incident_log(incident_type);
CREATE INDEX IF NOT EXISTS idx_incident_log_status ON public.incident_log(status);
CREATE INDEX IF NOT EXISTS idx_incident_log_priority ON public.incident_log(priority);
CREATE INDEX IF NOT EXISTS idx_incident_log_assigned_to ON public.incident_log(assigned_to);
CREATE INDEX IF NOT EXISTS idx_incident_log_created_at ON public.incident_log(created_at);

-- =====================================================
-- 2. TABELA DE HISTÓRICO DE INCIDENTES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.incident_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID REFERENCES public.incident_log(id) ON DELETE CASCADE,
    
    -- Mudança
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN (
        'status_change', 'assignment_change', 'priority_change', 'comment_added', 'attachment_added'
    )),
    
    -- Contexto
    comment TEXT,
    attachment_url VARCHAR(500),
    
    -- Responsável
    changed_by UUID REFERENCES public.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_incident_history_incident ON public.incident_history(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_history_changed_at ON public.incident_history(changed_at);

-- =====================================================
-- 3. TABELA DE PROBLEMAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.problem_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação ITIL
    problem_number VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Classificação
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Status ITIL
    status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN (
        'new', 'assigned', 'investigating', 'identified', 'resolved', 'closed'
    )),
    
    -- Análise
    root_cause TEXT,
    workaround TEXT,
    permanent_solution TEXT,
    
    -- Relacionamentos
    related_incidents UUID[],
    assigned_to UUID REFERENCES public.users(id),
    assigned_group VARCHAR(100),
    
    -- Tempos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Controle
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_problem_log_number ON public.problem_log(problem_number);
CREATE INDEX IF NOT EXISTS idx_problem_log_status ON public.problem_log(status);
CREATE INDEX IF NOT EXISTS idx_problem_log_priority ON public.problem_log(priority);

-- =====================================================
-- 4. TABELA DE MUDANÇAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação ITIL
    change_number VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Classificação ITIL
    change_type VARCHAR(50) NOT NULL CHECK (change_type IN (
        'normal', 'standard', 'emergency', 'minor'
    )),
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    
    -- Análise de Risco
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high')),
    impact_analysis TEXT,
    rollback_plan TEXT,
    
    -- Aprovação
    approval_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (approval_status IN (
        'pending', 'approved', 'rejected', 'cancelled'
    )),
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    
    -- Execução
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'scheduled', 'in_progress', 'implemented', 'failed', 'rolled_back', 'closed'
    )),
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    
    -- Relacionamentos
    requested_by UUID REFERENCES public.users(id),
    change_manager UUID REFERENCES public.users(id),
    implementation_team UUID[],
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_change_requests_number ON public.change_requests(change_number);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON public.change_requests(status);
CREATE INDEX IF NOT EXISTS idx_change_requests_type ON public.change_requests(change_type);

-- =====================================================
-- 5. TABELA DE SLAs
-- =====================================================

CREATE TABLE IF NOT EXISTS public.sla_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    sla_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Configuração de Tempo
    response_time_minutes INTEGER NOT NULL,
    resolution_time_minutes INTEGER NOT NULL,
    
    -- Aplicação
    service_type VARCHAR(100) NOT NULL,
    incident_type VARCHAR(50),
    priority_level VARCHAR(20),
    business_hours JSONB DEFAULT '{}', -- Horários de funcionamento
    
    -- Controle
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sla_contracts_service ON public.sla_contracts(service_type);
CREATE INDEX IF NOT EXISTS idx_sla_contracts_active ON public.sla_contracts(is_active);

-- =====================================================
-- 6. TABELA DE BASE DE CONHECIMENTO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    kb_number VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT,
    
    -- Categorização
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    tags TEXT[],
    
    -- Ciclo de Vida
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'review', 'published', 'archived', 'deprecated'
    )),
    version VARCHAR(20) DEFAULT '1.0.0',
    
    -- Aprovação
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Estatísticas
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- Relacionamentos
    related_incidents UUID[],
    related_problems UUID[],
    
    -- Controle
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_knowledge_base_number ON public.knowledge_base(kb_number);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON public.knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_status ON public.knowledge_base(status);

-- =====================================================
-- 7. TABELA DE MELHORIA CONTÍNUA (CSI)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.csi_register (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    csi_number VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Categorização
    improvement_type VARCHAR(50) NOT NULL CHECK (improvement_type IN (
        'process', 'technology', 'people', 'service', 'cost'
    )),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'proposed' CHECK (status IN (
        'proposed', 'approved', 'in_progress', 'implemented', 'evaluated', 'closed'
    )),
    
    -- Planejamento
    target_date DATE,
    actual_completion_date DATE,
    success_criteria TEXT,
    benefits TEXT,
    
    -- Execução
    assigned_to UUID REFERENCES public.users(id),
    budget_required DECIMAL(10,2),
    resources_required TEXT,
    
    -- Resultados
    success_metrics JSONB DEFAULT '{}',
    lessons_learned TEXT,
    
    -- Relacionamentos
    related_incidents UUID[],
    related_problems UUID[],
    related_changes UUID[],
    
    -- Controle
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_csi_register_number ON public.csi_register(csi_number);
CREATE INDEX IF NOT EXISTS idx_csi_register_type ON public.csi_register(improvement_type);
CREATE INDEX IF NOT EXISTS idx_csi_register_status ON public.csi_register(status);

-- =====================================================
-- 8. FUNÇÕES ITIL 4
-- =====================================================

-- Função para gerar número de incidente
CREATE OR REPLACE FUNCTION public.generate_incident_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    timestamp_str VARCHAR(20);
    sequence_num INTEGER;
    incident_number VARCHAR(20);
BEGIN
    timestamp_str := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Obter próximo número da sequência
    SELECT COALESCE(MAX(CAST(SUBSTRING(incident_number FROM 10) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM public.incident_log
    WHERE incident_number LIKE timestamp_str || '%';
    
    incident_number := timestamp_str || '-' || LPAD(sequence_num::TEXT, 4, '0');
    RETURN incident_number;
END;
$$ LANGUAGE plpgsql;

-- Função para classificar incidente com IA
CREATE OR REPLACE FUNCTION public.classify_incident_ai(
    p_title TEXT,
    p_description TEXT
)
RETURNS JSONB AS $$
DECLARE
    classification JSONB;
BEGIN
    -- Simular classificação com IA
    -- Em produção, chamaria OpenAI para análise
    
    classification := jsonb_build_object(
        'incident_type', 
        CASE 
            WHEN p_description ILIKE '%erro%' OR p_description ILIKE '%falha%' THEN 'incident'
            WHEN p_description ILIKE '%solicit%' OR p_description ILIKE '%pedido%' THEN 'service_request'
            WHEN p_description ILIKE '%mudança%' OR p_description ILIKE '%alteração%' THEN 'change_request'
            ELSE 'incident'
        END,
        'urgency',
        CASE 
            WHEN p_description ILIKE '%crítico%' OR p_description ILIKE '%urgente%' THEN 'high'
            WHEN p_description ILIKE '%importante%' THEN 'medium'
            ELSE 'low'
        END,
        'impact',
        CASE 
            WHEN p_description ILIKE '%sistema%' OR p_description ILIKE '%produção%' THEN 'high'
            WHEN p_description ILIKE '%usuário%' THEN 'medium'
            ELSE 'low'
        END,
        'category',
        CASE 
            WHEN p_description ILIKE '%sistema%' THEN 'Sistema'
            WHEN p_description ILIKE '%rede%' THEN 'Rede'
            WHEN p_description ILIKE '%aplicação%' THEN 'Aplicação'
            WHEN p_description ILIKE '%hardware%' THEN 'Hardware'
            ELSE 'Geral'
        END,
        'confidence_score', 0.85
    );
    
    RETURN classification;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular SLA
CREATE OR REPLACE FUNCTION public.calculate_sla_violation(
    p_incident_id UUID
)
RETURNS JSONB AS $$
DECLARE
    incident_record RECORD;
    sla_record RECORD;
    violation_result JSONB;
BEGIN
    -- Obter dados do incidente
    SELECT * INTO incident_record FROM public.incident_log WHERE id = p_incident_id;
    
    -- Obter SLA aplicável
    SELECT * INTO sla_record FROM public.sla_contracts 
    WHERE service_type = incident_record.affected_service
    AND (incident_type IS NULL OR incident_type = incident_record.incident_type)
    AND (priority_level IS NULL OR priority_level = incident_record.priority)
    AND is_active = true
    LIMIT 1;
    
    IF sla_record IS NULL THEN
        RETURN jsonb_build_object(
            'sla_defined', false,
            'message', 'SLA não definido para este tipo de incidente'
        );
    END IF;
    
    -- Calcular violações
    violation_result := jsonb_build_object(
        'sla_defined', true,
        'response_time_minutes', sla_record.response_time_minutes,
        'resolution_time_minutes', sla_record.resolution_time_minutes,
        'response_violation', 
            CASE 
                WHEN incident_record.response_time_minutes > sla_record.response_time_minutes THEN true
                ELSE false
            END,
        'resolution_violation',
            CASE 
                WHEN incident_record.resolution_time_minutes > sla_record.resolution_time_minutes THEN true
                ELSE false
            END,
        'response_remaining_minutes',
            GREATEST(0, sla_record.response_time_minutes - COALESCE(incident_record.response_time_minutes, 0)),
        'resolution_remaining_minutes',
            GREATEST(0, sla_record.resolution_time_minutes - COALESCE(incident_record.resolution_time_minutes, 0))
    );
    
    RETURN violation_result;
END;
$$ LANGUAGE plpgsql;

-- Função para detectar problemas
CREATE OR REPLACE FUNCTION public.detect_problem_pattern(
    p_incident_id UUID
)
RETURNS JSONB AS $$
DECLARE
    incident_record RECORD;
    similar_incidents INTEGER;
    problem_suggestion JSONB;
BEGIN
    -- Obter dados do incidente
    SELECT * INTO incident_record FROM public.incident_log WHERE id = p_incident_id;
    
    -- Contar incidentes similares
    SELECT COUNT(*) INTO similar_incidents
    FROM public.incident_log
    WHERE category = incident_record.category
    AND subcategory = incident_record.subcategory
    AND created_at >= NOW() - INTERVAL '30 days'
    AND status IN ('resolved', 'closed');
    
    -- Sugerir problema se houver padrão
    IF similar_incidents >= 3 THEN
        problem_suggestion := jsonb_build_object(
            'suggest_problem', true,
            'similar_incidents_count', similar_incidents,
            'pattern_detected', true,
            'suggested_title', 'Problema recorrente: ' || incident_record.category,
            'suggested_description', 'Detectado padrão de ' || similar_incidents || ' incidentes similares nos últimos 30 dias',
            'confidence_score', LEAST(0.95, similar_incidents * 0.2)
        );
    ELSE
        problem_suggestion := jsonb_build_object(
            'suggest_problem', false,
            'similar_incidents_count', similar_incidents,
            'pattern_detected', false
        );
    END IF;
    
    RETURN problem_suggestion;
END;
$$ LANGUAGE plpgsql;

-- Função para sugerir KB
CREATE OR REPLACE FUNCTION public.suggest_knowledge_base(
    p_incident_id UUID
)
RETURNS TABLE (
    kb_id UUID,
    kb_number VARCHAR(20),
    title VARCHAR(255),
    relevance_score NUMERIC
) AS $$
DECLARE
    incident_record RECORD;
BEGIN
    -- Obter dados do incidente
    SELECT * INTO incident_record FROM public.incident_log WHERE id = p_incident_id;
    
    RETURN QUERY
    SELECT 
        kb.id,
        kb.kb_number,
        kb.title,
        CASE 
            WHEN kb.category = incident_record.category THEN 0.8
            WHEN kb.subcategory = incident_record.subcategory THEN 0.6
            WHEN incident_record.description ILIKE '%' || kb.title || '%' THEN 0.7
            ELSE 0.3
        END as relevance_score
    FROM public.knowledge_base kb
    WHERE kb.status = 'published'
    AND (
        kb.category = incident_record.category
        OR kb.subcategory = incident_record.subcategory
        OR incident_record.description ILIKE '%' || kb.title || '%'
    )
    ORDER BY relevance_score DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. TRIGGERS ITIL 4
-- =====================================================

-- Trigger para gerar número de incidente
CREATE OR REPLACE FUNCTION public.trigger_generate_incident_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.incident_number IS NULL THEN
        NEW.incident_number := public.generate_incident_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_incident_number
    BEFORE INSERT ON public.incident_log
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_generate_incident_number();

-- Trigger para registrar histórico
CREATE OR REPLACE FUNCTION public.trigger_incident_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar mudança de status
    IF OLD.status != NEW.status THEN
        INSERT INTO public.incident_history (
            incident_id,
            field_name,
            old_value,
            new_value,
            change_type,
            changed_by
        ) VALUES (
            NEW.id,
            'status',
            OLD.status,
            NEW.status,
            'status_change',
            auth.uid()
        );
    END IF;
    
    -- Registrar mudança de atribuição
    IF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
        INSERT INTO public.incident_history (
            incident_id,
            field_name,
            old_value,
            new_value,
            change_type,
            changed_by
        ) VALUES (
            NEW.id,
            'assigned_to',
            OLD.assigned_to::TEXT,
            NEW.assigned_to::TEXT,
            'assignment_change',
            auth.uid()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_incident_history
    AFTER UPDATE ON public.incident_log
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_incident_history();

-- =====================================================
-- 10. VIEWS PARA RELATÓRIOS ITIL 4
-- =====================================================

-- View para dashboard de incidentes
CREATE OR REPLACE VIEW public.incident_dashboard AS
SELECT 
    COUNT(*) as total_incidents,
    COUNT(*) FILTER (WHERE status IN ('new', 'assigned', 'in_progress')) as open_incidents,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved_incidents,
    COUNT(*) FILTER (WHERE status = 'closed') as closed_incidents,
    AVG(resolution_time_minutes) as avg_resolution_time,
    COUNT(*) FILTER (WHERE response_time_minutes > sla_target_minutes) as sla_violations
FROM public.incident_log
WHERE created_at >= NOW() - INTERVAL '30 days';

-- View para SLA compliance
CREATE OR REPLACE VIEW public.sla_compliance AS
SELECT 
    incident_type,
    priority,
    COUNT(*) as total_incidents,
    COUNT(*) FILTER (WHERE response_time_minutes <= sla_target_minutes) as sla_compliant,
    ROUND(
        (COUNT(*) FILTER (WHERE response_time_minutes <= sla_target_minutes) * 100.0 / COUNT(*)), 2
    ) as compliance_percentage
FROM public.incident_log
WHERE sla_target_minutes IS NOT NULL
AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY incident_type, priority;

-- View para problemas ativos
CREATE OR REPLACE VIEW public.active_problems AS
SELECT 
    p.problem_number,
    p.title,
    p.status,
    p.priority,
    p.assigned_to,
    u.email as assigned_to_email,
    COUNT(i.id) as related_incidents,
    p.created_at
FROM public.problem_log p
LEFT JOIN public.users u ON p.assigned_to = u.id
LEFT JOIN public.incident_log i ON i.id = ANY(p.related_incidents)
WHERE p.status IN ('new', 'assigned', 'investigating')
GROUP BY p.id, p.problem_number, p.title, p.status, p.priority, p.assigned_to, u.email, p.created_at
ORDER BY p.priority DESC, p.created_at;

-- =====================================================
-- 11. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.incident_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csi_register ENABLE ROW LEVEL SECURITY;

-- Políticas para incident_log
CREATE POLICY "incident_log_project_access" ON public.incident_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.project_id IN (
                SELECT project_id FROM public.projects WHERE name = affected_service
            )
            AND ur.is_active = true
        )
    );

-- Políticas para outros objetos (implementar conforme necessário)
-- ... (políticas similares para outras tabelas)

-- =====================================================
-- FIM DO SISTEMA ITIL 4
-- ===================================================== 