-- =====================================================
-- MILAPP MedSênior - Sistema de Gestão da Qualidade (SGQ)
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. DOCUMENTOS DE QUALIDADE (ITs, POPs, Procedimentos)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.quality_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Informações básicas
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
        'procedimento', 'instrucao_trabalho', 'pop', 'formulario', 'manual', 'politica'
    )),
    code VARCHAR(50) UNIQUE, -- Código do documento (ex: POP-001)
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    
    -- Conteúdo
    description TEXT,
    content TEXT, -- Conteúdo do documento
    file_url VARCHAR(500), -- URL do arquivo PDF/DOCX
    
    -- Classificação
    department VARCHAR(100),
    process VARCHAR(100),
    category VARCHAR(100),
    
    -- Controle de versão
    previous_version_id UUID REFERENCES public.quality_documents(id),
    revision_reason TEXT,
    next_review_date DATE,
    
    -- Status e aprovação
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
        'draft', 'review', 'approved', 'obsolete', 'archived'
    )),
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_quality_documents_project_id ON public.quality_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_quality_documents_type ON public.quality_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_quality_documents_status ON public.quality_documents(status);
CREATE INDEX IF NOT EXISTS idx_quality_documents_code ON public.quality_documents(code);

-- =====================================================
-- 2. NÃO CONFORMIDADES (NCs)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.quality_nonconformities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Informações básicas
    code VARCHAR(50) UNIQUE, -- Código da NC (ex: NC-2024-001)
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Classificação
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'procedimento', 'conduta', 'estrutura', 'sistema', 'equipamento', 'material', 'outro'
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('baixa', 'media', 'alta', 'critica')),
    department VARCHAR(100),
    process VARCHAR(100),
    
    -- Origem e responsáveis
    reported_by UUID REFERENCES public.users(id),
    responsible_department VARCHAR(100),
    responsible_person UUID REFERENCES public.users(id),
    
    -- Status e fluxo
    status VARCHAR(50) DEFAULT 'aberta' CHECK (status IN (
        'aberta', 'em_analise', 'plano_aprovado', 'em_execucao', 'verificacao', 'fechada', 'cancelada'
    )),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('baixa', 'normal', 'alta', 'urgente')),
    
    -- Datas importantes
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    target_date DATE,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Análise da IA
    ai_classification JSONB DEFAULT '{}', -- Classificação automática
    ai_suggestions TEXT, -- Sugestões da IA
    
    -- Metadata
    attachments TEXT[], -- URLs dos anexos
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_quality_ncs_project_id ON public.quality_nonconformities(project_id);
CREATE INDEX IF NOT EXISTS idx_quality_ncs_status ON public.quality_nonconformities(status);
CREATE INDEX IF NOT EXISTS idx_quality_ncs_type ON public.quality_nonconformities(type);
CREATE INDEX IF NOT EXISTS idx_quality_ncs_severity ON public.quality_nonconformities(severity);

-- =====================================================
-- 3. PLANOS DE AÇÃO (5W2H)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.quality_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nonconformity_id UUID REFERENCES public.quality_nonconformities(id) ON DELETE CASCADE,
    
    -- 5W2H
    what TEXT NOT NULL, -- O que será feito
    why TEXT NOT NULL, -- Por que será feito
    where TEXT, -- Onde será feito
    when DATE NOT NULL, -- Quando será feito
    who UUID REFERENCES public.users(id), -- Quem fará
    how TEXT NOT NULL, -- Como será feito
    how_much DECIMAL(10,2), -- Quanto custará
    
    -- Status e execução
    status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN (
        'pendente', 'em_execucao', 'concluido', 'atrasado', 'cancelado'
    )),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    
    -- Resultados
    result_description TEXT,
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    effectiveness_comments TEXT,
    
    -- Datas
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    
    -- Anexos e evidências
    evidence_files TEXT[],
    metadata JSONB DEFAULT '{}',
    
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_quality_actions_nc_id ON public.quality_actions(nonconformity_id);
CREATE INDEX IF NOT EXISTS idx_quality_actions_status ON public.quality_actions(status);

-- =====================================================
-- 4. AUDITORIAS INTERNAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.quality_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Informações básicas
    code VARCHAR(50) UNIQUE, -- Código da auditoria (ex: AUD-2024-001)
    title VARCHAR(255) NOT NULL,
    audit_type VARCHAR(50) NOT NULL CHECK (audit_type IN (
        'interna', 'externa', 'fornecedor', 'processo', 'sistema'
    )),
    
    -- Escopo e critérios
    scope TEXT NOT NULL,
    criteria TEXT, -- Critérios de auditoria
    objectives TEXT, -- Objetivos da auditoria
    
    -- Planejamento
    planned_date DATE NOT NULL,
    actual_date DATE,
    duration_hours INTEGER,
    
    -- Responsáveis
    auditor_leader UUID REFERENCES public.users(id),
    auditors UUID[], -- Array de IDs dos auditores
    auditees UUID[], -- Array de IDs dos auditados
    
    -- Status
    status VARCHAR(50) DEFAULT 'planejada' CHECK (status IN (
        'planejada', 'em_execucao', 'concluida', 'cancelada'
    )),
    
    -- Resultados
    findings_count INTEGER DEFAULT 0,
    nonconformities_count INTEGER DEFAULT 0,
    observations_count INTEGER DEFAULT 0,
    
    -- Relatório
    report_url VARCHAR(500),
    conclusion TEXT,
    
    -- Metadata
    attachments TEXT[],
    metadata JSONB DEFAULT '{}',
    
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_quality_audits_project_id ON public.quality_audits(project_id);
CREATE INDEX IF NOT EXISTS idx_quality_audits_status ON public.quality_audits(status);
CREATE INDEX IF NOT EXISTS idx_quality_audits_type ON public.quality_audits(audit_type);

-- =====================================================
-- 5. TREINAMENTOS OBRIGATÓRIOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.quality_trainings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Informações básicas
    title VARCHAR(255) NOT NULL,
    description TEXT,
    training_type VARCHAR(50) NOT NULL CHECK (training_type IN (
        'obrigatorio', 'complementar', 'reciclagem', 'especifico'
    )),
    
    -- Instrutor e conteúdo
    instructor UUID REFERENCES public.users(id),
    instructor_external VARCHAR(255), -- Nome do instrutor externo
    content_url VARCHAR(500), -- Material do treinamento
    duration_hours INTEGER,
    
    -- Validade e recorrência
    validity_months INTEGER, -- Meses de validade do certificado
    recurrence_months INTEGER, -- Recorrência em meses (0 = não recorrente)
    
    -- Status
    status VARCHAR(50) DEFAULT 'planejado' CHECK (status IN (
        'planejado', 'em_andamento', 'concluido', 'cancelado'
    )),
    
    -- Datas
    planned_date DATE,
    actual_date DATE,
    next_training_date DATE,
    
    -- Metadata
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_quality_trainings_project_id ON public.quality_trainings(project_id);
CREATE INDEX IF NOT EXISTS idx_quality_trainings_status ON public.quality_trainings(status);
CREATE INDEX IF NOT EXISTS idx_quality_trainings_type ON public.quality_trainings(training_type);

-- =====================================================
-- 6. PARTICIPANTES DE TREINAMENTO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.quality_training_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    training_id UUID REFERENCES public.quality_trainings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    
    -- Status de participação
    status VARCHAR(50) DEFAULT 'inscrito' CHECK (status IN (
        'inscrito', 'presente', 'ausente', 'aprovado', 'reprovado'
    )),
    
    -- Avaliação
    grade DECIMAL(3,1) CHECK (grade >= 0 AND grade <= 10),
    comments TEXT,
    
    -- Certificado
    certificate_url VARCHAR(500),
    certificate_issued_at TIMESTAMP WITH TIME ZONE,
    certificate_valid_until DATE,
    
    -- Assinatura digital
    digital_signature TEXT,
    signed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(training_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_training_participants_training_id ON public.quality_training_participants(training_id);
CREATE INDEX IF NOT EXISTS idx_training_participants_user_id ON public.quality_training_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_training_participants_status ON public.quality_training_participants(status);

-- =====================================================
-- 7. INDICADORES DE QUALIDADE (KPIs)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.quality_kpis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Informações básicas
    name VARCHAR(255) NOT NULL,
    description TEXT,
    kpi_type VARCHAR(50) NOT NULL CHECK (kpi_type IN (
        'quantidade', 'percentual', 'tempo', 'financeiro', 'satisfacao'
    )),
    
    -- Fórmula e cálculo
    formula TEXT, -- Fórmula de cálculo
    unit VARCHAR(50), -- Unidade de medida
    target_value DECIMAL(10,2), -- Valor meta
    min_value DECIMAL(10,2), -- Valor mínimo aceitável
    max_value DECIMAL(10,2), -- Valor máximo aceitável
    
    -- Frequência de medição
    measurement_frequency VARCHAR(50) DEFAULT 'mensal' CHECK (measurement_frequency IN (
        'diario', 'semanal', 'mensal', 'trimestral', 'semestral', 'anual'
    )),
    
    -- Responsável
    responsible_person UUID REFERENCES public.users(id),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_quality_kpis_project_id ON public.quality_kpis(project_id);
CREATE INDEX IF NOT EXISTS idx_quality_kpis_type ON public.quality_kpis(kpi_type);

-- =====================================================
-- 8. LOGS DE MEDIÇÃO DE KPIs
-- =====================================================

CREATE TABLE IF NOT EXISTS public.quality_kpi_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kpi_id UUID REFERENCES public.quality_kpis(id) ON DELETE CASCADE,
    
    -- Medição
    measurement_date DATE NOT NULL,
    measured_value DECIMAL(10,2) NOT NULL,
    target_value DECIMAL(10,2),
    
    -- Análise
    status VARCHAR(50) CHECK (status IN ('acima_meta', 'dentro_meta', 'abaixo_meta', 'critico')),
    trend VARCHAR(20) CHECK (trend IN ('melhorando', 'estavel', 'piorando')),
    
    -- Comentários
    comments TEXT,
    action_plan TEXT,
    
    -- Responsável
    measured_by UUID REFERENCES public.users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_kpi_measurements_kpi_id ON public.quality_kpi_measurements(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_measurements_date ON public.quality_kpi_measurements(measurement_date);

-- =====================================================
-- 9. FUNÇÕES PARA GESTÃO DE QUALIDADE
-- =====================================================

-- Função para gerar código automático de NC
CREATE OR REPLACE FUNCTION public.generate_nc_code()
RETURNS VARCHAR(50) AS $$
DECLARE
    year_str VARCHAR(4);
    next_number INTEGER;
    new_code VARCHAR(50);
BEGIN
    year_str := EXTRACT(YEAR FROM NOW())::VARCHAR;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 8) AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.quality_nonconformities
    WHERE code LIKE 'NC-' || year_str || '-%';
    
    new_code := 'NC-' || year_str || '-' || LPAD(next_number::VARCHAR, 3, '0');
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar código automático de auditoria
CREATE OR REPLACE FUNCTION public.generate_audit_code()
RETURNS VARCHAR(50) AS $$
DECLARE
    year_str VARCHAR(4);
    next_number INTEGER;
    new_code VARCHAR(50);
BEGIN
    year_str := EXTRACT(YEAR FROM NOW())::VARCHAR;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 9) AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.quality_audits
    WHERE code LIKE 'AUD-' || year_str || '-%';
    
    new_code := 'AUD-' || year_str || '-' || LPAD(next_number::VARCHAR, 3, '0');
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular KPIs de qualidade
CREATE OR REPLACE FUNCTION public.calculate_quality_kpis(p_project_id UUID, p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
    kpi_name VARCHAR(255),
    kpi_type VARCHAR(50),
    current_value DECIMAL(10,2),
    target_value DECIMAL(10,2),
    status VARCHAR(50),
    trend VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        k.name,
        k.kpi_type,
        COALESCE(latest.measured_value, 0) as current_value,
        k.target_value,
        CASE 
            WHEN latest.measured_value >= k.target_value THEN 'acima_meta'
            WHEN latest.measured_value >= k.min_value THEN 'dentro_meta'
            ELSE 'abaixo_meta'
        END as status,
        COALESCE(latest.trend, 'estavel') as trend
    FROM public.quality_kpis k
    LEFT JOIN LATERAL (
        SELECT measured_value, trend
        FROM public.quality_kpi_measurements m
        WHERE m.kpi_id = k.id
        AND m.measurement_date BETWEEN p_start_date AND p_end_date
        ORDER BY m.measurement_date DESC
        LIMIT 1
    ) latest ON true
    WHERE k.project_id = p_project_id
    AND k.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Função para classificar NC automaticamente via IA
CREATE OR REPLACE FUNCTION public.classify_nonconformity_ai(p_nc_id UUID)
RETURNS JSONB AS $$
DECLARE
    nc_record RECORD;
    classification JSONB;
BEGIN
    -- Obter dados da NC
    SELECT * INTO nc_record
    FROM public.quality_nonconformities
    WHERE id = p_nc_id;
    
    -- Simular classificação da IA (em produção, chamaria API externa)
    classification := jsonb_build_object(
        'type', CASE 
            WHEN nc_record.description ILIKE '%procedimento%' THEN 'procedimento'
            WHEN nc_record.description ILIKE '%conduta%' THEN 'conduta'
            WHEN nc_record.description ILIKE '%estrutura%' THEN 'estrutura'
            WHEN nc_record.description ILIKE '%sistema%' THEN 'sistema'
            ELSE 'outro'
        END,
        'severity', CASE 
            WHEN nc_record.description ILIKE '%critic%' THEN 'critica'
            WHEN nc_record.description ILIKE '%grave%' THEN 'alta'
            WHEN nc_record.description ILIKE '%leve%' THEN 'baixa'
            ELSE 'media'
        END,
        'confidence', 0.85,
        'suggestions', 'Sugestão de plano de ação baseada na análise da descrição'
    );
    
    -- Atualizar NC com classificação
    UPDATE public.quality_nonconformities
    SET 
        ai_classification = classification,
        ai_suggestions = classification->>'suggestions'
    WHERE id = p_nc_id;
    
    RETURN classification;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. TRIGGERS AUTOMÁTICOS
-- =====================================================

-- Trigger para gerar código automático de NC
CREATE OR REPLACE FUNCTION public.auto_generate_nc_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.code IS NULL THEN
        NEW.code := public.generate_nc_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_nc_code
    BEFORE INSERT ON public.quality_nonconformities
    FOR EACH ROW EXECUTE FUNCTION public.auto_generate_nc_code();

-- Trigger para gerar código automático de auditoria
CREATE OR REPLACE FUNCTION public.auto_generate_audit_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.code IS NULL THEN
        NEW.code := public.generate_audit_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_audit_code
    BEFORE INSERT ON public.quality_audits
    FOR EACH ROW EXECUTE FUNCTION public.auto_generate_audit_code();

-- Trigger para atualizar timestamps
CREATE TRIGGER trigger_update_quality_documents_updated_at
    BEFORE UPDATE ON public.quality_documents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_update_quality_ncs_updated_at
    BEFORE UPDATE ON public.quality_nonconformities
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_update_quality_actions_updated_at
    BEFORE UPDATE ON public.quality_actions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_update_quality_audits_updated_at
    BEFORE UPDATE ON public.quality_audits
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_update_quality_trainings_updated_at
    BEFORE UPDATE ON public.quality_trainings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- 11. VIEWS PARA RELATÓRIOS
-- =====================================================

-- View para estatísticas de NCs
CREATE OR REPLACE VIEW public.nc_statistics AS
SELECT 
    project_id,
    COUNT(*) as total_ncs,
    COUNT(*) FILTER (WHERE status = 'aberta') as open_ncs,
    COUNT(*) FILTER (WHERE status = 'fechada') as closed_ncs,
    COUNT(*) FILTER (WHERE severity = 'critica') as critical_ncs,
    COUNT(*) FILTER (WHERE severity = 'alta') as high_ncs,
    AVG(EXTRACT(EPOCH FROM (closed_at - opened_at)) / 86400) as avg_resolution_days,
    COUNT(*) FILTER (WHERE type = 'procedimento') as procedure_ncs,
    COUNT(*) FILTER (WHERE type = 'conduta') as conduct_ncs,
    COUNT(*) FILTER (WHERE type = 'sistema') as system_ncs
FROM public.quality_nonconformities
GROUP BY project_id;

-- View para eficácia de planos de ação
CREATE OR REPLACE VIEW public.action_effectiveness AS
SELECT 
    nc.project_id,
    COUNT(a.id) as total_actions,
    COUNT(a.id) FILTER (WHERE a.status = 'concluido') as completed_actions,
    AVG(a.effectiveness_rating) as avg_effectiveness,
    COUNT(a.id) FILTER (WHERE a.effectiveness_rating >= 4) as effective_actions
FROM public.quality_nonconformities nc
LEFT JOIN public.quality_actions a ON nc.id = a.nonconformity_id
GROUP BY nc.project_id;

-- View para treinamentos vencendo
CREATE OR REPLACE VIEW public.training_expirations AS
SELECT 
    t.id,
    t.title,
    t.project_id,
    tp.user_id,
    tp.certificate_valid_until,
    EXTRACT(DAYS FROM (tp.certificate_valid_until - CURRENT_DATE)) as days_until_expiry
FROM public.quality_trainings t
JOIN public.quality_training_participants tp ON t.id = tp.training_id
WHERE tp.certificate_valid_until IS NOT NULL
AND tp.certificate_valid_until > CURRENT_DATE
ORDER BY tp.certificate_valid_until;

-- =====================================================
-- 12. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.quality_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_nonconformities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_training_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_kpi_measurements ENABLE ROW LEVEL SECURITY;

-- Políticas para documentos (gestores de qualidade)
CREATE POLICY "quality_documents_gestor_access" ON public.quality_documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.project_id = quality_documents.project_id
            AND ur.role IN ('superadmin', 'gestor_global', 'gestor_qualidade')
            AND ur.is_active = true
        )
    );

-- Políticas para NCs (todos podem ver, gestores podem editar)
CREATE POLICY "quality_ncs_view_access" ON public.quality_nonconformities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.project_id = quality_nonconformities.project_id
            AND ur.is_active = true
        )
    );

CREATE POLICY "quality_ncs_edit_access" ON public.quality_nonconformities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.project_id = quality_nonconformities.project_id
            AND ur.role IN ('superadmin', 'gestor_global', 'gestor_qualidade')
            AND ur.is_active = true
        )
    );

-- Políticas similares para outras tabelas...

-- =====================================================
-- FIM DA MIGRAÇÃO DE GESTÃO DA QUALIDADE
-- ===================================================== 