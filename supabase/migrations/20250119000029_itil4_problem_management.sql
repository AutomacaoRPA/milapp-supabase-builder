-- =====================================================
-- ITIL 4 PROBLEM MANAGEMENT - Estrutura Completa
-- =====================================================

-- Tabela de problemas
CREATE TABLE IF NOT EXISTS itil_problemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_problema VARCHAR(20) UNIQUE NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT NOT NULL,
    categoria VARCHAR(100),
    subcategoria VARCHAR(100),
    urgencia VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    impacto VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    prioridade VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(50) NOT NULL DEFAULT 'new', -- new, assigned, in_progress, pending, resolved, closed
    estado VARCHAR(50) NOT NULL DEFAULT 'open', -- open, closed
    tipo_problema VARCHAR(50) NOT NULL DEFAULT 'reactive', -- 'reactive', 'proactive', 'known_error'
    solicitante_id UUID REFERENCES auth.users(id),
    responsavel_id UUID REFERENCES auth.users(id),
    grupo_responsavel VARCHAR(100),
    incidentes_relacionados UUID[],
    mudancas_relacionadas UUID[],
    causa_raiz TEXT,
    causa_raiz_confirmada BOOLEAN DEFAULT false,
    plano_corretivo TEXT,
    plano_preventivo TEXT,
    solucao_temporaria TEXT,
    solucao_permanente TEXT,
    tempo_estimado_horas DECIMAL(5,2),
    tempo_real_horas DECIMAL(5,2),
    custo_estimado DECIMAL(10,2),
    custo_real DECIMAL(10,2),
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de histórico de problemas
CREATE TABLE IF NOT EXISTS itil_problemas_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problema_id UUID REFERENCES itil_problemas(id) ON DELETE CASCADE,
    acao VARCHAR(100) NOT NULL,
    descricao TEXT,
    usuario_id UUID REFERENCES auth.users(id),
    dados_anteriores JSONB,
    dados_novos JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de análise de causa raiz
CREATE TABLE IF NOT EXISTS itil_analise_causa_raiz (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problema_id UUID REFERENCES itil_problemas(id) ON DELETE CASCADE,
    metodo_analise VARCHAR(100) NOT NULL, -- '5_whys', 'fishbone', 'pareto', 'fault_tree'
    descricao TEXT,
    fatores_identificados JSONB,
    causa_raiz_proposta TEXT,
    confianca_causa_raiz INTEGER CHECK (confianca_causa_raiz >= 0 AND confianca_causa_raiz <= 100),
    evidencia TEXT,
    responsavel_id UUID REFERENCES auth.users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'validated'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de erros conhecidos (Known Errors)
CREATE TABLE IF NOT EXISTS itil_erros_conhecidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problema_id UUID REFERENCES itil_problemas(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    sintomas TEXT[],
    causa_raiz TEXT,
    solucao_temporaria TEXT,
    solucao_permanente TEXT,
    impacto_negocio TEXT,
    frequencia_ocorrencia VARCHAR(50), -- 'rare', 'occasional', 'frequent', 'constant'
    ultima_ocorrencia TIMESTAMP WITH TIME ZONE,
    proxima_revisao TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'resolved', 'archived'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de soluções temporárias
CREATE TABLE IF NOT EXISTS itil_solucoes_temporarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problema_id UUID REFERENCES itil_problemas(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    procedimento TEXT,
    recursos_necessarios TEXT[],
    tempo_aplicacao_minutos INTEGER,
    eficacia_estimada INTEGER CHECK (eficacia_estimada >= 0 AND eficacia_estimada <= 100),
    riscos TEXT,
    responsavel_id UUID REFERENCES auth.users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'proposed', -- 'proposed', 'approved', 'implemented', 'expired'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    implemented_at TIMESTAMP WITH TIME ZONE,
    expired_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de correlação de incidentes
CREATE TABLE IF NOT EXISTS itil_correlacao_incidentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problema_id UUID REFERENCES itil_problemas(id) ON DELETE CASCADE,
    incidente_id UUID NOT NULL,
    nivel_correlacao INTEGER CHECK (nivel_correlacao >= 1 AND nivel_correlacao <= 10),
    criterios_correlacao JSONB,
    data_correlacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de lições aprendidas
CREATE TABLE IF NOT EXISTS itil_licoes_aprendidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problema_id UUID REFERENCES itil_problemas(id) ON DELETE CASCADE,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100),
    impacto VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
    acoes_recomendadas TEXT[],
    acoes_implementadas TEXT[],
    responsavel_id UUID REFERENCES auth.users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'reviewed', 'approved', 'implemented'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de indicadores de problemas
CREATE TABLE IF NOT EXISTS itil_kpis_problemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    formula TEXT,
    unidade VARCHAR(50),
    meta DECIMAL(10,2),
    valor_atual DECIMAL(10,2),
    periodo_medicao VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'quarterly'
    ultima_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FUNÇÕES ITIL 4 PROBLEM MANAGEMENT
-- =====================================================

-- Função para gerar número de problema
CREATE OR REPLACE FUNCTION gerar_numero_problema()
RETURNS VARCHAR AS $$
DECLARE
    ano_atual VARCHAR(4);
    proximo_numero INTEGER;
    numero_problema VARCHAR(20);
BEGIN
    ano_atual := EXTRACT(YEAR FROM NOW())::VARCHAR;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_problema FROM 9) AS INTEGER)), 0) + 1
    INTO proximo_numero
    FROM itil_problemas
    WHERE numero_problema LIKE 'PRB-' || ano_atual || '-%';
    
    numero_problema := 'PRB-' || ano_atual || '-' || LPAD(proximo_numero::VARCHAR, 6, '0');
    
    RETURN numero_problema;
END;
$$ LANGUAGE plpgsql;

-- Função para detectar problemas automaticamente
CREATE OR REPLACE FUNCTION detectar_problema_automatico()
RETURNS TRIGGER AS $$
DECLARE
    incidentes_similares INTEGER;
    problema_id UUID;
    numero_problema VARCHAR(20);
BEGIN
    -- Verificar se há incidentes similares nos últimos 30 dias
    SELECT COUNT(*) INTO incidentes_similares
    FROM itil_incidentes
    WHERE categoria = NEW.categoria
        AND subcategoria = NEW.subcategoria
        AND created_at >= NOW() - INTERVAL '30 days'
        AND id != NEW.id;
    
    -- Se há 3 ou mais incidentes similares, criar problema
    IF incidentes_similares >= 3 THEN
        -- Gerar número do problema
        numero_problema := gerar_numero_problema();
        
        -- Criar problema
        INSERT INTO itil_problemas (
            numero_problema,
            titulo,
            descricao,
            categoria,
            subcategoria,
            urgencia,
            impacto,
            prioridade,
            tipo_problema,
            incidentes_relacionados,
            causa_raiz,
            status
        ) VALUES (
            numero_problema,
            'Problema detectado automaticamente: ' || NEW.categoria || ' - ' || NEW.subcategoria,
            'Problema detectado automaticamente baseado em ' || incidentes_similares || ' incidentes similares',
            NEW.categoria,
            NEW.subcategoria,
            NEW.urgencia,
            NEW.impacto,
            NEW.prioridade,
            'reactive',
            ARRAY[NEW.id],
            'Análise de causa raiz necessária',
            'new'
        ) RETURNING id INTO problema_id;
        
        -- Registrar correlação
        INSERT INTO itil_correlacao_incidentes (
            problema_id,
            incidente_id,
            nivel_correlacao,
            criterios_correlacao
        ) VALUES (
            problema_id,
            NEW.id,
            8,
            jsonb_build_object(
                'categoria', NEW.categoria,
                'subcategoria', NEW.subcategoria,
                'incidentes_similares', incidentes_similares
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular prioridade baseada em urgência e impacto
CREATE OR REPLACE FUNCTION calcular_prioridade_problema(urgencia VARCHAR, impacto VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    IF urgencia = 'critical' OR impacto = 'critical' THEN
        RETURN 'critical';
    ELSIF urgencia = 'high' OR impacto = 'high' THEN
        RETURN 'high';
    ELSIF urgencia = 'medium' OR impacto = 'medium' THEN
        RETURN 'medium';
    ELSE
        RETURN 'low';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar status de problema
CREATE OR REPLACE FUNCTION atualizar_status_problema()
RETURNS TRIGGER AS $$
BEGIN
    -- Problema atribuído
    IF NEW.status = 'assigned' AND OLD.status = 'new' THEN
        NEW.assigned_at := NOW();
    END IF;
    
    -- Problema resolvido
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        NEW.resolved_at := NOW();
    END IF;
    
    -- Problema fechado
    IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
        NEW.estado := 'closed';
        NEW.closed_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar histórico de problema
CREATE OR REPLACE FUNCTION registrar_historico_problema()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar mudanças no histórico
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO itil_problemas_historico (
            problema_id,
            acao,
            descricao,
            usuario_id,
            dados_anteriores,
            dados_novos
        ) VALUES (
            NEW.id,
            'update',
            'Problema atualizado',
            auth.uid(),
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO itil_problemas_historico (
            problema_id,
            acao,
            descricao,
            usuario_id,
            dados_novos
        ) VALUES (
            NEW.id,
            'create',
            'Problema criado',
            auth.uid(),
            to_jsonb(NEW)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular KPIs de problemas
CREATE OR REPLACE FUNCTION calcular_kpis_problemas()
RETURNS VOID AS $$
DECLARE
    kpi RECORD;
    valor_calculado DECIMAL(10,2);
BEGIN
    FOR kpi IN SELECT * FROM itil_kpis_problemas LOOP
        CASE kpi.nome
            WHEN 'Tempo Médio de Resolução' THEN
                SELECT AVG(tempo_real_horas) INTO valor_calculado
                FROM itil_problemas
                WHERE status = 'resolved'
                    AND resolved_at >= NOW() - INTERVAL '30 days';
                    
            WHEN 'Taxa de Resolução' THEN
                SELECT 
                    (COUNT(CASE WHEN status = 'resolved' THEN 1 END)::DECIMAL / COUNT(*) * 100)
                INTO valor_calculado
                FROM itil_problemas
                WHERE created_at >= NOW() - INTERVAL '30 days';
                
            WHEN 'Problemas Críticos Abertos' THEN
                SELECT COUNT(*) INTO valor_calculado
                FROM itil_problemas
                WHERE prioridade = 'critical'
                    AND status NOT IN ('resolved', 'closed');
                    
            WHEN 'Custo Médio por Problema' THEN
                SELECT AVG(custo_real) INTO valor_calculado
                FROM itil_problemas
                WHERE status = 'resolved'
                    AND custo_real > 0
                    AND resolved_at >= NOW() - INTERVAL '30 days';
                    
            ELSE
                valor_calculado := 0;
        END CASE;
        
        -- Atualizar KPI
        UPDATE itil_kpis_problemas
        SET valor_atual = COALESCE(valor_calculado, 0),
            ultima_atualizacao = NOW()
        WHERE id = kpi.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para gerar número de problema automaticamente
CREATE OR REPLACE FUNCTION trigger_gerar_numero_problema()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_problema IS NULL THEN
        NEW.numero_problema := gerar_numero_problema();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gerar_numero_problema
    BEFORE INSERT ON itil_problemas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_gerar_numero_problema();

-- Trigger para detectar problemas automaticamente
CREATE TRIGGER trigger_detectar_problema
    AFTER INSERT ON itil_incidentes
    FOR EACH ROW
    EXECUTE FUNCTION detectar_problema_automatico();

-- Trigger para calcular prioridade automaticamente
CREATE OR REPLACE FUNCTION trigger_calcular_prioridade_problema()
RETURNS TRIGGER AS $$
BEGIN
    NEW.prioridade := calcular_prioridade_problema(NEW.urgencia, NEW.impacto);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_prioridade_problema
    BEFORE INSERT OR UPDATE ON itil_problemas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calcular_prioridade_problema();

-- Trigger para atualizar status
CREATE TRIGGER trigger_atualizar_status_problema
    BEFORE UPDATE ON itil_problemas
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_status_problema();

-- Trigger para registrar histórico
CREATE TRIGGER trigger_registrar_historico_problema
    AFTER INSERT OR UPDATE ON itil_problemas
    FOR EACH ROW
    EXECUTE FUNCTION registrar_historico_problema();

-- =====================================================
-- VIEWS PARA RELATÓRIOS
-- =====================================================

-- View de estatísticas de problemas
CREATE OR REPLACE VIEW view_estatisticas_problemas AS
SELECT 
    DATE_TRUNC('month', created_at) as mes,
    COUNT(*) as total_problemas,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolvidos,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as fechados,
    COUNT(CASE WHEN tipo_problema = 'reactive' THEN 1 END) as reativos,
    COUNT(CASE WHEN tipo_problema = 'proactive' THEN 1 END) as proativos,
    COUNT(CASE WHEN tipo_problema = 'known_error' THEN 1 END) as erros_conhecidos,
    AVG(tempo_real_horas) as tempo_medio_resolucao,
    AVG(custo_real) as custo_medio,
    COUNT(CASE WHEN prioridade = 'critical' THEN 1 END) as criticos,
    COUNT(CASE WHEN prioridade = 'high' THEN 1 END) as altos,
    COUNT(CASE WHEN prioridade = 'medium' THEN 1 END) as medios,
    COUNT(CASE WHEN prioridade = 'low' THEN 1 END) as baixos
FROM itil_problemas
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mes DESC;

-- View de problemas por categoria
CREATE OR REPLACE VIEW view_problemas_categoria AS
SELECT 
    categoria,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolvidos,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as fechados,
    ROUND(
        COUNT(CASE WHEN status IN ('resolved', 'closed') THEN 1 END)::DECIMAL / COUNT(*) * 100, 2
    ) as taxa_resolucao,
    AVG(tempo_real_horas) as tempo_medio_resolucao,
    AVG(custo_real) as custo_medio
FROM itil_problemas
GROUP BY categoria
ORDER BY total DESC;

-- View de problemas críticos abertos
CREATE OR REPLACE VIEW view_problemas_criticos AS
SELECT 
    p.numero_problema,
    p.titulo,
    p.categoria,
    p.prioridade,
    p.status,
    p.created_at,
    p.tempo_real_horas,
    p.responsavel_id,
    u.email as responsavel_email,
    array_length(p.incidentes_relacionados, 1) as incidentes_relacionados
FROM itil_problemas p
LEFT JOIN auth.users u ON p.responsavel_id = u.id
WHERE p.prioridade IN ('critical', 'high')
    AND p.status NOT IN ('resolved', 'closed')
ORDER BY p.created_at ASC;

-- View de correlação incidente-problema
CREATE OR REPLACE VIEW view_correlacao_incidente_problema AS
SELECT 
    p.numero_problema,
    p.titulo as problema_titulo,
    p.categoria,
    p.status as problema_status,
    c.incidente_id,
    c.nivel_correlacao,
    c.data_correlacao,
    i.titulo as incidente_titulo,
    i.status as incidente_status,
    i.created_at as incidente_created
FROM itil_problemas p
JOIN itil_correlacao_incidentes c ON p.id = c.problema_id
LEFT JOIN itil_incidentes i ON c.incidente_id = i.id
ORDER BY c.nivel_correlacao DESC, c.data_correlacao DESC;

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir KPIs padrão
INSERT INTO itil_kpis_problemas (nome, descricao, formula, unidade, meta, periodo_medicao) VALUES
('Tempo Médio de Resolução', 'Tempo médio para resolver problemas', 'AVG(tempo_real_horas)', 'horas', 24.0, 'monthly'),
('Taxa de Resolução', 'Percentual de problemas resolvidos', '(resolvidos/total)*100', '%', 85.0, 'monthly'),
('Problemas Críticos Abertos', 'Quantidade de problemas críticos em aberto', 'COUNT(criticos_abertos)', 'problemas', 5.0, 'daily'),
('Custo Médio por Problema', 'Custo médio para resolver problemas', 'AVG(custo_real)', 'R$', 1000.0, 'monthly'),
('Tempo de Análise de Causa Raiz', 'Tempo médio para identificar causa raiz', 'AVG(tempo_analise)', 'horas', 8.0, 'monthly');

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE itil_problemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE itil_problemas_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE itil_analise_causa_raiz ENABLE ROW LEVEL SECURITY;
ALTER TABLE itil_erros_conhecidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itil_solucoes_temporarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE itil_correlacao_incidentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE itil_licoes_aprendidas ENABLE ROW LEVEL SECURITY;

-- Políticas para problemas
CREATE POLICY "Usuários podem ver problemas" ON itil_problemas
    FOR SELECT USING (true);

CREATE POLICY "Solicitantes podem criar problemas" ON itil_problemas
    FOR INSERT WITH CHECK (auth.uid() = solicitante_id);

CREATE POLICY "Responsáveis podem editar problemas" ON itil_problemas
    FOR UPDATE USING (
        auth.uid() = solicitante_id OR 
        auth.uid() = responsavel_id
    );

-- Políticas para histórico
CREATE POLICY "Usuários podem ver histórico de problemas" ON itil_problemas_historico
    FOR SELECT USING (true);

-- Políticas para análise de causa raiz
CREATE POLICY "Usuários podem ver análise de causa raiz" ON itil_analise_causa_raiz
    FOR SELECT USING (true);

CREATE POLICY "Responsáveis podem gerenciar análise" ON itil_analise_causa_raiz
    FOR ALL USING (auth.uid() = responsavel_id);

-- Políticas para erros conhecidos
CREATE POLICY "Usuários podem ver erros conhecidos" ON itil_erros_conhecidos
    FOR SELECT USING (true);

CREATE POLICY "Responsáveis podem gerenciar erros conhecidos" ON itil_erros_conhecidos
    FOR ALL USING (true);

-- Políticas para soluções temporárias
CREATE POLICY "Usuários podem ver soluções temporárias" ON itil_solucoes_temporarias
    FOR SELECT USING (true);

CREATE POLICY "Responsáveis podem gerenciar soluções temporárias" ON itil_solucoes_temporarias
    FOR ALL USING (auth.uid() = responsavel_id);

-- Políticas para correlação
CREATE POLICY "Usuários podem ver correlação" ON itil_correlacao_incidentes
    FOR SELECT USING (true);

-- Políticas para lições aprendidas
CREATE POLICY "Usuários podem ver lições aprendidas" ON itil_licoes_aprendidas
    FOR SELECT USING (true);

CREATE POLICY "Responsáveis podem gerenciar lições aprendidas" ON itil_licoes_aprendidas
    FOR ALL USING (auth.uid() = responsavel_id); 