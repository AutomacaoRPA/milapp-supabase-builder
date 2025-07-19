-- =====================================================
-- MILAPP MedSênior - Sistema de Relatórios Avançado com IA Analítica
-- Versão: 1.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. TABELA DE LOGS DE EXECUÇÃO SQL
-- =====================================================

CREATE TABLE IF NOT EXISTS public.sql_execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Prompt e SQL
    prompt_text TEXT NOT NULL,
    generated_sql TEXT NOT NULL,
    sql_type VARCHAR(50) DEFAULT 'SELECT' CHECK (sql_type IN ('SELECT', 'ANALYTICS', 'AGGREGATION')),
    
    -- Execução
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    execution_time_ms INTEGER,
    success BOOLEAN NOT NULL,
    
    -- Resultados
    result_preview JSONB DEFAULT '{}',
    result_count INTEGER DEFAULT 0,
    result_size_bytes INTEGER DEFAULT 0,
    
    -- Erros
    error_message TEXT,
    error_code VARCHAR(100),
    
    -- Metadados
    user_agent TEXT,
    ip_address INET,
    session_id UUID,
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_sql_execution_logs_user ON public.sql_execution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sql_execution_logs_executed_at ON public.sql_execution_logs(executed_at);
CREATE INDEX IF NOT EXISTS idx_sql_execution_logs_success ON public.sql_execution_logs(success);

-- =====================================================
-- 2. TABELA DE ENTREGAS DE RELATÓRIOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.relatorio_entregas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    sql_execution_id UUID REFERENCES public.sql_execution_logs(id) ON DELETE CASCADE,
    
    -- Configuração de entrega
    canal VARCHAR(20) NOT NULL CHECK (canal IN ('email', 'teams', 'whatsapp', 'pdf', 'csv')),
    formato VARCHAR(20) NOT NULL CHECK (formato IN ('pdf', 'csv', 'markdown', 'html')),
    destino TEXT NOT NULL, -- email, número, webhook URL
    
    -- Conteúdo
    titulo VARCHAR(255),
    conteudo TEXT,
    anexo_url TEXT,
    anexo_base64 TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'erro', 'cancelado')),
    tentativas INTEGER DEFAULT 0,
    max_tentativas INTEGER DEFAULT 3,
    
    -- Resultado
    enviado_em TIMESTAMP WITH TIME ZONE,
    log_resultado TEXT,
    error_message TEXT,
    
    -- Metadados
    metadata JSONB DEFAULT '{}',
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_relatorio_entregas_user ON public.relatorio_entregas(user_id);
CREATE INDEX IF NOT EXISTS idx_relatorio_entregas_canal ON public.relatorio_entregas(canal);
CREATE INDEX IF NOT EXISTS idx_relatorio_entregas_status ON public.relatorio_entregas(status);
CREATE INDEX IF NOT EXISTS idx_relatorio_entregas_created_at ON public.relatorio_entregas(created_at);

-- =====================================================
-- 3. TABELA DE RELATÓRIOS SALVOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.relatorios_salvos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Configuração
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(50) DEFAULT 'geral' CHECK (categoria IN (
        'solicitacoes', 'sla', 'fluxos', 'ia', 'nc', 'usuarios', 'seguranca', 'projetos', 'geral'
    )),
    
    -- Query
    prompt_original TEXT NOT NULL,
    sql_generated TEXT NOT NULL,
    parametros JSONB DEFAULT '{}',
    
    -- Configuração de entrega
    entrega_automatica BOOLEAN DEFAULT false,
    canais_entrega TEXT[] DEFAULT '{}',
    destinatarios TEXT[] DEFAULT '{}',
    frequencia VARCHAR(20) CHECK (frequencia IN ('manual', 'diario', 'semanal', 'mensal')),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT false,
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, nome)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_relatorios_salvos_user ON public.relatorios_salvos(user_id);
CREATE INDEX IF NOT EXISTS idx_relatorios_salvos_categoria ON public.relatorios_salvos(categoria);
CREATE INDEX IF NOT EXISTS idx_relatorios_salvos_active ON public.relatorios_salvos(is_active);

-- =====================================================
-- 4. VIEWS PARA RELATÓRIOS PRÉ-DEFINIDOS
-- =====================================================

-- View para relatório de solicitações
CREATE OR REPLACE VIEW public.view_relatorio_solicitacoes AS
SELECT 
    c.id,
    c.title as titulo,
    c.description as descricao,
    c.status,
    c.priority,
    c.created_at,
    c.updated_at,
    c.resolved_at,
    u.full_name as solicitante,
    u.email as email_solicitante,
    p.name as projeto,
    s.name as setor,
    EXTRACT(EPOCH FROM (COALESCE(c.resolved_at, NOW()) - c.created_at))/3600 as tempo_horas,
    CASE 
        WHEN c.status = 'completed' THEN 'Concluída'
        WHEN c.status = 'in_progress' THEN 'Em Andamento'
        WHEN c.status = 'pending' THEN 'Pendente'
        ELSE 'Outro'
    END as status_pt
FROM public.cards c
LEFT JOIN public.users u ON c.user_id = u.id
LEFT JOIN public.projects p ON c.project_id = p.id
LEFT JOIN public.departments s ON u.department_id = s.id
WHERE c.is_active = true;

-- View para relatório de SLA
CREATE OR REPLACE VIEW public.view_relatorio_sla AS
SELECT 
    c.id,
    c.title,
    c.status,
    c.created_at,
    c.resolved_at,
    u.full_name as solicitante,
    s.name as setor,
    sla.target_hours as sla_horas,
    EXTRACT(EPOCH FROM (COALESCE(c.resolved_at, NOW()) - c.created_at))/3600 as tempo_real_horas,
    CASE 
        WHEN c.resolved_at IS NOT NULL AND 
             EXTRACT(EPOCH FROM (c.resolved_at - c.created_at))/3600 <= sla.target_hours 
        THEN true 
        ELSE false 
    END as dentro_sla,
    CASE 
        WHEN c.resolved_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (c.resolved_at - c.created_at))/3600
        ELSE 
            EXTRACT(EPOCH FROM (NOW() - c.created_at))/3600
    END as tempo_total_horas
FROM public.cards c
LEFT JOIN public.users u ON c.user_id = u.id
LEFT JOIN public.departments s ON u.department_id = s.id
LEFT JOIN public.sla_contracts sla ON s.id = sla.department_id
WHERE c.is_active = true;

-- View para relatório de fluxos executados
CREATE OR REPLACE VIEW public.view_relatorio_fluxos AS
SELECT 
    w.id,
    w.name as nome_fluxo,
    w.status,
    w.created_at,
    w.completed_at,
    u.full_name as executor,
    p.name as projeto,
    EXTRACT(EPOCH FROM (COALESCE(w.completed_at, NOW()) - w.created_at))/3600 as tempo_execucao_horas,
    COUNT(wt.id) as total_tarefas,
    COUNT(CASE WHEN wt.status = 'completed' THEN 1 END) as tarefas_concluidas,
    COUNT(CASE WHEN wt.status = 'failed' THEN 1 END) as tarefas_falharam
FROM public.workflows w
LEFT JOIN public.users u ON w.user_id = u.id
LEFT JOIN public.projects p ON w.project_id = p.id
LEFT JOIN public.workflow_tasks wt ON w.id = wt.workflow_id
WHERE w.is_active = true
GROUP BY w.id, w.name, w.status, w.created_at, w.completed_at, u.full_name, p.name;

-- View para relatório de IA
CREATE OR REPLACE VIEW public.view_relatorio_ia AS
SELECT 
    ial.id,
    ial.prompt_text,
    ial.response_text,
    ial.model_used,
    ial.tokens_used,
    ial.cost_estimate,
    ial.created_at,
    u.full_name as usuario,
    p.name as projeto,
    CASE 
        WHEN ial.response_quality = 'high' THEN 'Alta'
        WHEN ial.response_quality = 'medium' THEN 'Média'
        WHEN ial.response_quality = 'low' THEN 'Baixa'
        ELSE 'Não avaliada'
    END as qualidade_resposta,
    CASE 
        WHEN ial.user_feedback = 'positive' THEN 'Positivo'
        WHEN ial.user_feedback = 'negative' THEN 'Negativo'
        WHEN ial.user_feedback = 'neutral' THEN 'Neutro'
        ELSE 'Sem feedback'
    END as feedback_usuario
FROM public.ai_audit_logs ial
LEFT JOIN public.users u ON ial.user_id = u.id
LEFT JOIN public.projects p ON ial.project_id = p.id
WHERE ial.is_active = true;

-- View para relatório de não conformidades
CREATE OR REPLACE VIEW public.view_relatorio_nc AS
SELECT 
    nc.id,
    nc.title as titulo,
    nc.description as descricao,
    nc.severity as severidade,
    nc.status,
    nc.created_at,
    nc.resolved_at,
    u.full_name as responsavel,
    s.name as setor,
    p.name as projeto,
    EXTRACT(EPOCH FROM (COALESCE(nc.resolved_at, NOW()) - nc.created_at))/3600 as tempo_resolucao_horas,
    COUNT(pa.id) as total_acoes,
    COUNT(CASE WHEN pa.status = 'completed' THEN 1 END) as acoes_concluidas
FROM public.non_conformities nc
LEFT JOIN public.users u ON nc.assigned_to = u.id
LEFT JOIN public.departments s ON nc.department_id = s.id
LEFT JOIN public.projects p ON nc.project_id = p.id
LEFT JOIN public.action_plans pa ON nc.id = pa.non_conformity_id
WHERE nc.is_active = true
GROUP BY nc.id, nc.title, nc.description, nc.severity, nc.status, nc.created_at, nc.resolved_at, u.full_name, s.name, p.name;

-- View para relatório de usuários
CREATE OR REPLACE VIEW public.view_relatorio_usuarios AS
SELECT 
    u.id,
    u.full_name,
    u.email,
    u.is_active,
    u.created_at,
    u.last_login_at,
    s.name as setor,
    COUNT(DISTINCT c.id) as total_solicitacoes,
    COUNT(DISTINCT w.id) as total_fluxos,
    COUNT(DISTINCT nc.id) as total_ncs,
    EXTRACT(EPOCH FROM (NOW() - u.last_login_at))/86400 as dias_ultimo_login
FROM public.users u
LEFT JOIN public.departments s ON u.department_id = s.id
LEFT JOIN public.cards c ON u.id = c.user_id AND c.is_active = true
LEFT JOIN public.workflows w ON u.id = w.user_id AND w.is_active = true
LEFT JOIN public.non_conformities nc ON u.id = nc.assigned_to AND nc.is_active = true
GROUP BY u.id, u.full_name, u.email, u.is_active, u.created_at, u.last_login_at, s.name;

-- View para relatório de segurança
CREATE OR REPLACE VIEW public.view_relatorio_seguranca AS
SELECT 
    sl.id,
    sl.log_type,
    sl.severity,
    sl.action_description,
    sl.success,
    sl.created_at,
    u.full_name as usuario,
    sl.ip_address,
    sl.user_agent,
    CASE 
        WHEN sl.log_type = 'login' THEN 'Login'
        WHEN sl.log_type = 'login_failed' THEN 'Login Falhou'
        WHEN sl.log_type = '2fa_verification' THEN 'Verificação 2FA'
        WHEN sl.log_type = 'permission_denied' THEN 'Permissão Negada'
        WHEN sl.log_type = 'session_created' THEN 'Sessão Criada'
        WHEN sl.log_type = 'session_revoked' THEN 'Sessão Revogada'
        ELSE sl.log_type
    END as tipo_evento_pt
FROM public.security_logs sl
LEFT JOIN public.users u ON sl.user_id = u.id
ORDER BY sl.created_at DESC;

-- =====================================================
-- 5. FUNÇÕES PARA RELATÓRIOS
-- =====================================================

-- Função para executar query SQL segura
CREATE OR REPLACE FUNCTION public.execute_safe_sql_query(
    p_user_id UUID,
    p_project_id UUID,
    p_prompt_text TEXT,
    p_generated_sql TEXT
)
RETURNS JSONB AS $$
DECLARE
    result_data JSONB;
    start_time TIMESTAMP;
    execution_time_ms INTEGER;
    result_count INTEGER;
    result_size_bytes INTEGER;
    success BOOLEAN := true;
    error_message TEXT;
    error_code VARCHAR(100);
BEGIN
    start_time := NOW();
    
    -- Validar se SQL é apenas SELECT (segurança)
    IF NOT (p_generated_sql ILIKE 'SELECT%' OR p_generated_sql ILIKE 'WITH%') THEN
        RAISE EXCEPTION 'Apenas queries SELECT são permitidas';
    END IF;
    
    -- Verificar permissões do usuário
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = p_user_id
        AND ur.role IN ('admin', 'manager', 'analyst')
        AND ur.is_active = true
    ) THEN
        RAISE EXCEPTION 'Usuário sem permissão para executar queries';
    END IF;
    
    BEGIN
        -- Executar query (simulado - em produção usar EXECUTE)
        -- Por segurança, não executamos SQL dinâmico aqui
        -- Em produção, usar prepared statements ou validação rigorosa
        
        result_data := jsonb_build_object(
            'success', true,
            'message', 'Query executada com sucesso (simulado)',
            'data', jsonb_build_array(
                jsonb_build_object('coluna1', 'valor1', 'coluna2', 'valor2'),
                jsonb_build_object('coluna1', 'valor3', 'coluna2', 'valor4')
            ),
            'metadata', jsonb_build_object(
                'total_rows', 2,
                'columns', jsonb_build_array('coluna1', 'coluna2')
            )
        );
        
        result_count := 2;
        result_size_bytes := 200;
        
    EXCEPTION WHEN OTHERS THEN
        success := false;
        error_message := SQLERRM;
        error_code := SQLSTATE;
        result_data := jsonb_build_object('error', error_message);
    END;
    
    execution_time_ms := EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000;
    
    -- Registrar execução
    INSERT INTO public.sql_execution_logs (
        user_id,
        project_id,
        prompt_text,
        generated_sql,
        sql_type,
        executed_at,
        execution_time_ms,
        success,
        result_preview,
        result_count,
        result_size_bytes,
        error_message,
        error_code,
        user_agent,
        ip_address
    ) VALUES (
        p_user_id,
        p_project_id,
        p_prompt_text,
        p_generated_sql,
        'SELECT',
        NOW(),
        execution_time_ms,
        success,
        result_data,
        result_count,
        result_size_bytes,
        error_message,
        error_code,
        current_setting('request.headers')::jsonb->>'user-agent',
        inet_client_addr()
    );
    
    RETURN result_data;
END;
$$ LANGUAGE plpgsql;

-- Função para salvar relatório
CREATE OR REPLACE FUNCTION public.save_report(
    p_user_id UUID,
    p_project_id UUID,
    p_nome VARCHAR(255),
    p_descricao TEXT,
    p_categoria VARCHAR(50),
    p_prompt_original TEXT,
    p_sql_generated TEXT,
    p_parametros JSONB DEFAULT '{}',
    p_entrega_automatica BOOLEAN DEFAULT false,
    p_canais_entrega TEXT[] DEFAULT '{}',
    p_destinatarios TEXT[] DEFAULT '{}',
    p_frequencia VARCHAR(20) DEFAULT 'manual'
)
RETURNS JSONB AS $$
DECLARE
    report_id UUID;
    result JSONB;
BEGIN
    -- Inserir relatório
    INSERT INTO public.relatorios_salvos (
        user_id,
        project_id,
        nome,
        descricao,
        categoria,
        prompt_original,
        sql_generated,
        parametros,
        entrega_automatica,
        canais_entrega,
        destinatarios,
        frequencia
    ) VALUES (
        p_user_id,
        p_project_id,
        p_nome,
        p_descricao,
        p_categoria,
        p_prompt_original,
        p_sql_generated,
        p_parametros,
        p_entrega_automatica,
        p_canais_entrega,
        p_destinatarios,
        p_frequencia
    ) RETURNING id INTO report_id;
    
    result := jsonb_build_object(
        'success', true,
        'message', 'Relatório salvo com sucesso',
        'report_id', report_id
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para agendar entrega de relatório
CREATE OR REPLACE FUNCTION public.schedule_report_delivery(
    p_user_id UUID,
    p_sql_execution_id UUID,
    p_canal VARCHAR(20),
    p_formato VARCHAR(20),
    p_destino TEXT,
    p_titulo VARCHAR(255),
    p_conteudo TEXT
)
RETURNS JSONB AS $$
DECLARE
    delivery_id UUID;
    result JSONB;
BEGIN
    -- Inserir entrega
    INSERT INTO public.relatorio_entregas (
        user_id,
        sql_execution_id,
        canal,
        formato,
        destino,
        titulo,
        conteudo,
        status
    ) VALUES (
        p_user_id,
        p_sql_execution_id,
        p_canal,
        p_formato,
        p_destino,
        p_titulo,
        p_conteudo,
        'pendente'
    ) RETURNING id INTO delivery_id;
    
    result := jsonb_build_object(
        'success', true,
        'message', 'Entrega agendada com sucesso',
        'delivery_id', delivery_id
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Trigger para atualizar timestamps
CREATE OR REPLACE FUNCTION public.trigger_update_reporting_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_relatorio_entregas_timestamp
    BEFORE UPDATE ON public.relatorio_entregas
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_reporting_timestamp();

CREATE TRIGGER trigger_update_relatorios_salvos_timestamp
    BEFORE UPDATE ON public.relatorios_salvos
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_reporting_timestamp();

-- =====================================================
-- 7. VIEWS PARA ESTATÍSTICAS
-- =====================================================

-- View para estatísticas de relatórios
CREATE OR REPLACE VIEW public.view_relatorio_estatisticas AS
SELECT 
    COUNT(*) as total_execucoes,
    COUNT(*) FILTER (WHERE success = true) as execucoes_sucesso,
    COUNT(*) FILTER (WHERE success = false) as execucoes_erro,
    AVG(execution_time_ms) FILTER (WHERE success = true) as tempo_medio_ms,
    SUM(result_count) as total_registros_processados,
    COUNT(DISTINCT user_id) as usuarios_ativos,
    COUNT(DISTINCT DATE(executed_at)) as dias_com_execucao
FROM public.sql_execution_logs
WHERE executed_at >= NOW() - INTERVAL '30 days';

-- View para estatísticas de entregas
CREATE OR REPLACE VIEW public.view_entrega_estatisticas AS
SELECT 
    canal,
    formato,
    COUNT(*) as total_entregas,
    COUNT(*) FILTER (WHERE status = 'enviado') as entregas_sucesso,
    COUNT(*) FILTER (WHERE status = 'erro') as entregas_erro,
    AVG(EXTRACT(EPOCH FROM (enviado_em - created_at))) FILTER (WHERE status = 'enviado') as tempo_medio_envio_segundos
FROM public.relatorio_entregas
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY canal, formato;

-- =====================================================
-- 8. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.sql_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorio_entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorios_salvos ENABLE ROW LEVEL SECURITY;

-- Políticas para sql_execution_logs
CREATE POLICY "sql_execution_logs_user_access" ON public.sql_execution_logs
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'manager')
            AND ur.is_active = true
        )
    );

CREATE POLICY "sql_execution_logs_user_create" ON public.sql_execution_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Políticas para relatorio_entregas
CREATE POLICY "relatorio_entregas_user_access" ON public.relatorio_entregas
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'manager')
            AND ur.is_active = true
        )
    );

CREATE POLICY "relatorio_entregas_user_create" ON public.relatorio_entregas
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Políticas para relatorios_salvos
CREATE POLICY "relatorios_salvos_user_access" ON public.relatorios_salvos
    FOR SELECT USING (
        user_id = auth.uid() OR
        is_public = true OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'manager')
            AND ur.is_active = true
        )
    );

CREATE POLICY "relatorios_salvos_user_create" ON public.relatorios_salvos
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "relatorios_salvos_user_update" ON public.relatorios_salvos
    FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- FIM DO SISTEMA DE RELATÓRIOS AVANÇADO
-- ===================================================== 