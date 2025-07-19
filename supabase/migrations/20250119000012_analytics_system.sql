-- =====================================================
-- MILAPP MedSênior - Sistema de Analytics Corporativo
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. TABELA DE EVENTOS DE ANALYTICS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação do evento
    event_type VARCHAR(100) NOT NULL,
    event_category VARCHAR(50) NOT NULL,
    event_action VARCHAR(100) NOT NULL,
    event_label VARCHAR(255),
    
    -- Contexto
    user_id UUID REFERENCES public.users(id),
    project_id UUID REFERENCES public.projects(id),
    session_id VARCHAR(100),
    
    -- Dados do evento
    event_data JSONB DEFAULT '{}',
    event_value NUMERIC,
    
    -- Metadados
    user_agent TEXT,
    ip_address INET,
    referrer VARCHAR(500),
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON public.analytics_events(event_category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_project ON public.analytics_events(project_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);

-- =====================================================
-- 2. TABELA DE MÉTRICAS AGREGADAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.analytics_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação da métrica
    metric_name VARCHAR(100) NOT NULL,
    metric_category VARCHAR(50) NOT NULL,
    metric_period VARCHAR(20) NOT NULL CHECK (metric_period IN ('hour', 'day', 'week', 'month', 'quarter', 'year')),
    
    -- Dimensões
    project_id UUID REFERENCES public.projects(id),
    user_id UUID REFERENCES public.users(id),
    department VARCHAR(100),
    role VARCHAR(50),
    
    -- Valores
    metric_value NUMERIC NOT NULL,
    metric_count INTEGER DEFAULT 1,
    metric_min NUMERIC,
    metric_max NUMERIC,
    metric_avg NUMERIC,
    
    -- Período
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Controle
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índice único
    UNIQUE(metric_name, metric_category, metric_period, project_id, period_start)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_name ON public.analytics_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_period ON public.analytics_metrics(metric_period, period_start);
CREATE INDEX IF NOT EXISTS idx_analytics_metrics_project ON public.analytics_metrics(project_id);

-- =====================================================
-- 3. TABELA DE DASHBOARDS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.analytics_dashboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    
    -- Configuração
    dashboard_config JSONB NOT NULL,
    layout_config JSONB DEFAULT '{}',
    
    -- Controle
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. FUNÇÕES DE ANALYTICS
-- =====================================================

-- Função para registrar evento
CREATE OR REPLACE FUNCTION public.track_analytics_event(
    p_event_type VARCHAR(100),
    p_event_category VARCHAR(50),
    p_event_action VARCHAR(100),
    p_event_label VARCHAR(255) DEFAULT NULL,
    p_event_data JSONB DEFAULT '{}',
    p_event_value NUMERIC DEFAULT NULL,
    p_project_id UUID DEFAULT NULL,
    p_session_id VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
    current_user_id UUID;
BEGIN
    -- Obter usuário atual
    current_user_id := auth.uid();
    
    -- Inserir evento
    INSERT INTO public.analytics_events (
        event_type,
        event_category,
        event_action,
        event_label,
        user_id,
        project_id,
        session_id,
        event_data,
        event_value
    ) VALUES (
        p_event_type,
        p_event_category,
        p_event_action,
        p_event_label,
        current_user_id,
        p_project_id,
        p_session_id,
        p_event_data,
        p_event_value
    ) RETURNING id INTO event_id;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql;

-- Função para obter métricas de uso de workflows
CREATE OR REPLACE FUNCTION public.get_workflow_usage_metrics(
    p_project_id UUID DEFAULT NULL,
    p_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_period_end TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    metric_name VARCHAR(100),
    metric_value NUMERIC,
    metric_count INTEGER,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'workflows_created'::VARCHAR(100) as metric_name,
        COUNT(w.id)::NUMERIC as metric_value,
        COUNT(w.id)::INTEGER as metric_count,
        p_period_start,
        p_period_end
    FROM public.workflows w
    WHERE (p_project_id IS NULL OR w.project_id = p_project_id)
    AND w.created_at BETWEEN p_period_start AND p_period_end
    
    UNION ALL
    
    SELECT 
        'workflows_executed'::VARCHAR(100),
        COUNT(we.id)::NUMERIC,
        COUNT(we.id)::INTEGER,
        p_period_start,
        p_period_end
    FROM public.workflow_executions we
    JOIN public.workflows w ON we.workflow_id = w.id
    WHERE (p_project_id IS NULL OR w.project_id = p_project_id)
    AND we.created_at BETWEEN p_period_start AND p_period_end
    
    UNION ALL
    
    SELECT 
        'workflows_completed'::VARCHAR(100),
        COUNT(we.id)::NUMERIC,
        COUNT(we.id)::INTEGER,
        p_period_start,
        p_period_end
    FROM public.workflow_executions we
    JOIN public.workflows w ON we.workflow_id = w.id
    WHERE (p_project_id IS NULL OR w.project_id = p_project_id)
    AND we.status = 'completed'
    AND we.created_at BETWEEN p_period_start AND p_period_end;
END;
$$ LANGUAGE plpgsql;

-- Função para obter métricas de IA
CREATE OR REPLACE FUNCTION public.get_ai_usage_metrics(
    p_project_id UUID DEFAULT NULL,
    p_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_period_end TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    metric_name VARCHAR(100),
    metric_value NUMERIC,
    metric_count INTEGER,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'ai_interactions'::VARCHAR(100) as metric_name,
        COUNT(ail.id)::NUMERIC as metric_value,
        COUNT(ail.id)::INTEGER as metric_count,
        p_period_start,
        p_period_end
    FROM public.ai_quality_logs ail
    JOIN public.quality_nonconformities qn ON ail.entity_id = qn.id
    WHERE (p_project_id IS NULL OR qn.project_id = p_project_id)
    AND ail.created_at BETWEEN p_period_start AND p_period_end
    
    UNION ALL
    
    SELECT 
        'ai_documents_reviewed'::VARCHAR(100),
        COUNT(DISTINCT ail.entity_id)::NUMERIC,
        COUNT(DISTINCT ail.entity_id)::INTEGER,
        p_period_start,
        p_period_end
    FROM public.ai_quality_logs ail
    JOIN public.quality_documents qd ON ail.entity_id = qd.id
    WHERE (p_project_id IS NULL OR qd.project_id = p_project_id)
    AND ail.action_type = 'document_review'
    AND ail.created_at BETWEEN p_period_start AND p_period_end
    
    UNION ALL
    
    SELECT 
        'ai_pops_generated'::VARCHAR(100),
        COUNT(DISTINCT ail.entity_id)::NUMERIC,
        COUNT(DISTINCT ail.entity_id)::INTEGER,
        p_period_start,
        p_period_end
    FROM public.ai_quality_logs ail
    JOIN public.quality_pops qp ON ail.entity_id = qp.id
    WHERE (p_project_id IS NULL OR qp.project_id = p_project_id)
    AND ail.action_type = 'pop_generation'
    AND ail.created_at BETWEEN p_period_start AND p_period_end;
END;
$$ LANGUAGE plpgsql;

-- Função para obter métricas de departamentos
CREATE OR REPLACE FUNCTION public.get_department_metrics(
    p_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_period_end TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    department VARCHAR(100),
    total_users INTEGER,
    active_users INTEGER,
    workflows_created INTEGER,
    workflows_executed INTEGER,
    documents_created INTEGER,
    nonconformities_created INTEGER,
    ai_interactions INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ur.department,
        COUNT(DISTINCT ur.user_id)::INTEGER as total_users,
        COUNT(DISTINCT CASE WHEN ae.user_id IS NOT NULL THEN ur.user_id END)::INTEGER as active_users,
        COUNT(DISTINCT w.id)::INTEGER as workflows_created,
        COUNT(DISTINCT we.id)::INTEGER as workflows_executed,
        COUNT(DISTINCT qd.id)::INTEGER as documents_created,
        COUNT(DISTINCT qn.id)::INTEGER as nonconformities_created,
        COUNT(DISTINCT ail.id)::INTEGER as ai_interactions
    FROM public.user_roles ur
    LEFT JOIN public.analytics_events ae ON ur.user_id = ae.user_id 
        AND ae.created_at BETWEEN p_period_start AND p_period_end
    LEFT JOIN public.workflows w ON ur.project_id = w.project_id 
        AND w.created_by = ur.user_id
        AND w.created_at BETWEEN p_period_start AND p_period_end
    LEFT JOIN public.workflow_executions we ON ur.project_id = we.workflow_id 
        AND we.triggered_by = ur.user_id
        AND we.created_at BETWEEN p_period_start AND p_period_end
    LEFT JOIN public.quality_documents qd ON ur.project_id = qd.project_id 
        AND qd.created_by = ur.user_id
        AND qd.created_at BETWEEN p_period_start AND p_period_end
    LEFT JOIN public.quality_nonconformities qn ON ur.project_id = qn.project_id 
        AND qn.created_by = ur.user_id
        AND qn.created_at BETWEEN p_period_start AND p_period_end
    LEFT JOIN public.ai_quality_logs ail ON ur.user_id = ail.user_id
        AND ail.created_at BETWEEN p_period_start AND p_period_end
    WHERE ur.is_active = true
    GROUP BY ur.department
    ORDER BY total_users DESC;
END;
$$ LANGUAGE plpgsql;

-- Função para obter tendências temporais
CREATE OR REPLACE FUNCTION public.get_temporal_trends(
    p_metric_name VARCHAR(100),
    p_period VARCHAR(20) DEFAULT 'day',
    p_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_period_end TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    metric_value NUMERIC,
    metric_count INTEGER,
    trend_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH period_data AS (
        SELECT 
            DATE_TRUNC(p_period, created_at) as period_start,
            DATE_TRUNC(p_period, created_at) + INTERVAL '1 ' || p_period as period_end,
            COUNT(*) as metric_count,
            SUM(COALESCE(event_value, 1)) as metric_value
        FROM public.analytics_events
        WHERE event_type = p_metric_name
        AND created_at BETWEEN p_period_start AND p_period_end
        GROUP BY DATE_TRUNC(p_period, created_at)
    ),
    trend_data AS (
        SELECT 
            *,
            LAG(metric_value) OVER (ORDER BY period_start) as prev_value
        FROM period_data
    )
    SELECT 
        td.period_start,
        td.period_end,
        td.metric_value,
        td.metric_count,
        CASE 
            WHEN td.prev_value = 0 THEN 0
            ELSE ((td.metric_value - td.prev_value) / td.prev_value * 100)
        END as trend_percentage
    FROM trend_data td
    ORDER BY td.period_start;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. VIEWS PARA DASHBOARDS
-- =====================================================

-- View para KPIs gerais
CREATE OR REPLACE VIEW public.analytics_kpis AS
SELECT 
    'Total Workflows' as kpi_name,
    COUNT(w.id) as kpi_value,
    'workflows' as kpi_unit,
    'primary' as kpi_color
FROM public.workflows w
WHERE w.is_active = true

UNION ALL

SELECT 
    'Workflows Executados (30d)' as kpi_name,
    COUNT(we.id) as kpi_value,
    'executions' as kpi_unit,
    'success' as kpi_color
FROM public.workflow_executions we
WHERE we.created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
    'Interações IA (30d)' as kpi_name,
    COUNT(ail.id) as kpi_value,
    'interactions' as kpi_unit,
    'info' as kpi_color
FROM public.ai_quality_logs ail
WHERE ail.created_at >= NOW() - INTERVAL '30 days'

UNION ALL

SELECT 
    'Usuários Ativos (30d)' as kpi_name,
    COUNT(DISTINCT ae.user_id) as kpi_value,
    'users' as kpi_unit,
    'warning' as kpi_color
FROM public.analytics_events ae
WHERE ae.created_at >= NOW() - INTERVAL '30 days';

-- View para top workflows
CREATE OR REPLACE VIEW public.top_workflows AS
SELECT 
    w.name,
    w.category,
    COUNT(we.id) as execution_count,
    AVG(EXTRACT(EPOCH FROM (we.completed_at - we.started_at)) / 60) as avg_duration_minutes,
    COUNT(we.id) FILTER (WHERE we.status = 'completed') as completed_count,
    COUNT(we.id) FILTER (WHERE we.status = 'failed') as failed_count
FROM public.workflows w
LEFT JOIN public.workflow_executions we ON w.id = we.workflow_id
WHERE w.is_active = true
GROUP BY w.id, w.name, w.category
ORDER BY execution_count DESC
LIMIT 10;

-- View para top usuários
CREATE OR REPLACE VIEW public.top_users AS
SELECT 
    u.email,
    ur.department,
    ur.role,
    COUNT(ae.id) as event_count,
    COUNT(DISTINCT w.id) as workflows_created,
    COUNT(DISTINCT we.id) as workflows_executed,
    COUNT(DISTINCT ail.id) as ai_interactions
FROM public.users u
JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.analytics_events ae ON u.id = ae.user_id
LEFT JOIN public.workflows w ON u.id = w.created_by
LEFT JOIN public.workflow_executions we ON u.id = we.triggered_by
LEFT JOIN public.ai_quality_logs ail ON u.id = ail.user_id
WHERE ur.is_active = true
AND ae.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.email, ur.department, ur.role
ORDER BY event_count DESC
LIMIT 20;

-- View para métricas de performance
CREATE OR REPLACE VIEW public.performance_metrics AS
SELECT 
    'Tempo Médio de Execução' as metric_name,
    AVG(EXTRACT(EPOCH FROM (we.completed_at - we.started_at)) / 60) as metric_value,
    'minutos' as metric_unit
FROM public.workflow_executions we
WHERE we.status = 'completed'
AND we.completed_at IS NOT NULL

UNION ALL

SELECT 
    'Taxa de Sucesso' as metric_name,
    (COUNT(we.id) FILTER (WHERE we.status = 'completed') * 100.0 / COUNT(we.id)) as metric_value,
    '%' as metric_unit
FROM public.workflow_executions we

UNION ALL

SELECT 
    'Workflows por Dia' as metric_name,
    COUNT(we.id) * 1.0 / 30 as metric_value,
    'workflows/dia' as metric_unit
FROM public.workflow_executions we
WHERE we.created_at >= NOW() - INTERVAL '30 days';

-- =====================================================
-- 6. TRIGGERS PARA COLETA AUTOMÁTICA
-- =====================================================

-- Trigger para registrar criação de workflows
CREATE OR REPLACE FUNCTION public.track_workflow_creation()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.track_analytics_event(
        'workflow_created',
        'workflow',
        'create',
        NEW.name,
        jsonb_build_object('workflow_id', NEW.id, 'category', NEW.category),
        1,
        NEW.project_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_workflow_creation
    AFTER INSERT ON public.workflows
    FOR EACH ROW
    EXECUTE FUNCTION public.track_workflow_creation();

-- Trigger para registrar execução de workflows
CREATE OR REPLACE FUNCTION public.track_workflow_execution()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.track_analytics_event(
        'workflow_executed',
        'workflow',
        'execute',
        NEW.name,
        jsonb_build_object('execution_id', NEW.execution_id, 'status', NEW.status),
        1,
        (SELECT project_id FROM public.workflows WHERE id = NEW.workflow_id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_workflow_execution
    AFTER INSERT ON public.workflow_executions
    FOR EACH ROW
    EXECUTE FUNCTION public.track_workflow_execution();

-- Trigger para registrar interações de IA
CREATE OR REPLACE FUNCTION public.track_ai_interaction()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.track_analytics_event(
        'ai_interaction',
        'ai',
        NEW.action_type,
        NEW.entity_type,
        jsonb_build_object('entity_id', NEW.entity_id, 'model', NEW.ai_model),
        1,
        (SELECT project_id FROM public.quality_nonconformities WHERE id = NEW.entity_id LIMIT 1)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_ai_interaction
    AFTER INSERT ON public.ai_quality_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.track_ai_interaction();

-- =====================================================
-- 7. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_dashboards ENABLE ROW LEVEL SECURITY;

-- Políticas para analytics_events
CREATE POLICY "analytics_events_project_access" ON public.analytics_events
    FOR ALL USING (
        project_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.project_id = analytics_events.project_id
            AND ur.is_active = true
        )
    );

-- Políticas para analytics_metrics
CREATE POLICY "analytics_metrics_project_access" ON public.analytics_metrics
    FOR ALL USING (
        project_id IS NULL OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.project_id = analytics_metrics.project_id
            AND ur.is_active = true
        )
    );

-- Políticas para analytics_dashboards
CREATE POLICY "analytics_dashboards_access" ON public.analytics_dashboards
    FOR ALL USING (
        is_public = true OR
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'manager')
            AND ur.is_active = true
        )
    );

-- =====================================================
-- FIM DO SISTEMA DE ANALYTICS
-- ===================================================== 