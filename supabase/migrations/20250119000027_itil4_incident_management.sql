-- =====================================================
-- ITIL 4 INCIDENT MANAGEMENT - Estrutura Completa
-- =====================================================

-- Tabela de tipos de chamados ITIL
CREATE TABLE IF NOT EXISTS itil_tipos_chamado (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(50) NOT NULL, -- 'incident', 'request', 'problem', 'change'
    sla_resposta_minutos INTEGER DEFAULT 60,
    sla_resolucao_minutos INTEGER DEFAULT 480,
    prioridade_padrao VARCHAR(20) DEFAULT 'medium',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de níveis de urgência e impacto
CREATE TABLE IF NOT EXISTS itil_urgencia_impacto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    urgencia VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    impacto VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    prioridade VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    sla_resposta_minutos INTEGER NOT NULL,
    sla_resolucao_minutos INTEGER NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contratos de SLA
CREATE TABLE IF NOT EXISTS itil_sla_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    tipo_servico VARCHAR(100) NOT NULL,
    cliente VARCHAR(100),
    sla_resposta_minutos INTEGER NOT NULL,
    sla_resolucao_minutos INTEGER NOT NULL,
    sla_disponibilidade DECIMAL(5,2) DEFAULT 99.9,
    horario_funcionamento JSONB, -- {"inicio": "08:00", "fim": "18:00", "dias": [1,2,3,4,5]}
    feriados JSONB, -- Lista de feriados
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de incidentes ITIL
CREATE TABLE IF NOT EXISTS itil_incidentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_incidente VARCHAR(20) UNIQUE NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT NOT NULL,
    tipo_chamado_id UUID REFERENCES itil_tipos_chamado(id),
    categoria VARCHAR(100),
    subcategoria VARCHAR(100),
    urgencia VARCHAR(20) NOT NULL DEFAULT 'medium',
    impacto VARCHAR(20) NOT NULL DEFAULT 'medium',
    prioridade VARCHAR(20) NOT NULL DEFAULT 'medium',
    sla_contract_id UUID REFERENCES itil_sla_contracts(id),
    status VARCHAR(50) NOT NULL DEFAULT 'new', -- new, assigned, in_progress, pending, resolved, closed
    estado VARCHAR(50) NOT NULL DEFAULT 'open', -- open, closed
    solicitante_id UUID REFERENCES auth.users(id),
    responsavel_id UUID REFERENCES auth.users(id),
    grupo_responsavel VARCHAR(100),
    causa_raiz TEXT,
    solucao TEXT,
    tempo_resposta_minutos INTEGER,
    tempo_resolucao_minutos INTEGER,
    sla_violado BOOLEAN DEFAULT false,
    sla_violado_em TIMESTAMP WITH TIME ZONE,
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de histórico de incidentes
CREATE TABLE IF NOT EXISTS itil_incidentes_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incidente_id UUID REFERENCES itil_incidentes(id) ON DELETE CASCADE,
    acao VARCHAR(100) NOT NULL,
    descricao TEXT,
    usuario_id UUID REFERENCES auth.users(id),
    dados_anteriores JSONB,
    dados_novos JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de escalação de incidentes
CREATE TABLE IF NOT EXISTS itil_escalacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incidente_id UUID REFERENCES itil_incidentes(id) ON DELETE CASCADE,
    nivel INTEGER NOT NULL, -- 1, 2, 3
    tipo VARCHAR(50) NOT NULL, -- 'functional', 'hierarchical', 'temporal'
    responsavel_id UUID REFERENCES auth.users(id),
    grupo_responsavel VARCHAR(100),
    tempo_escalacao_minutos INTEGER,
    motivo TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, notified, acknowledged, resolved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de templates de incidentes
CREATE TABLE IF NOT EXISTS itil_templates_incidente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100),
    subcategoria VARCHAR(100),
    urgencia VARCHAR(20) DEFAULT 'medium',
    impacto VARCHAR(20) DEFAULT 'medium',
    prioridade VARCHAR(20) DEFAULT 'medium',
    titulo_template TEXT,
    descricao_template TEXT,
    solucao_template TEXT,
    tags TEXT[],
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FUNÇÕES ITIL 4
-- =====================================================

-- Função para gerar número de incidente
CREATE OR REPLACE FUNCTION gerar_numero_incidente()
RETURNS VARCHAR AS $$
DECLARE
    ano_atual VARCHAR(4);
    proximo_numero INTEGER;
    numero_incidente VARCHAR(20);
BEGIN
    ano_atual := EXTRACT(YEAR FROM NOW())::VARCHAR;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_incidente FROM 9) AS INTEGER)), 0) + 1
    INTO proximo_numero
    FROM itil_incidentes
    WHERE numero_incidente LIKE 'INC-' || ano_atual || '-%';
    
    numero_incidente := 'INC-' || ano_atual || '-' || LPAD(proximo_numero::VARCHAR, 6, '0');
    
    RETURN numero_incidente;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular prioridade baseada em urgência e impacto
CREATE OR REPLACE FUNCTION calcular_prioridade(urgencia VARCHAR, impacto VARCHAR)
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

-- Função para verificar violação de SLA
CREATE OR REPLACE FUNCTION verificar_violacao_sla()
RETURNS TRIGGER AS $$
DECLARE
    sla_contract RECORD;
    tempo_decorrido INTEGER;
BEGIN
    -- Buscar SLA contract
    SELECT * INTO sla_contract
    FROM itil_sla_contracts
    WHERE id = NEW.sla_contract_id;
    
    IF FOUND THEN
        -- Calcular tempo decorrido em minutos
        tempo_decorrido := EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 60;
        
        -- Verificar violação de tempo de resposta
        IF NEW.status = 'new' AND tempo_decorrido > sla_contract.sla_resposta_minutos THEN
            NEW.sla_violado := true;
            NEW.sla_violado_em := NOW();
        END IF;
        
        -- Verificar violação de tempo de resolução
        IF NEW.status IN ('resolved', 'closed') AND NEW.tempo_resolucao_minutos > sla_contract.sla_resolucao_minutos THEN
            NEW.sla_violado := true;
            NEW.sla_violado_em := NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar tempos de resposta e resolução
CREATE OR REPLACE FUNCTION atualizar_tempos_incidente()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular tempo de resposta (primeira atribuição)
    IF NEW.status = 'assigned' AND OLD.status = 'new' THEN
        NEW.tempo_resposta_minutos := EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 60;
    END IF;
    
    -- Calcular tempo de resolução
    IF NEW.status IN ('resolved', 'closed') AND OLD.status NOT IN ('resolved', 'closed') THEN
        NEW.tempo_resolucao_minutos := EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 60;
        NEW.resolved_at := NOW();
    END IF;
    
    -- Marcar como fechado
    IF NEW.status = 'closed' THEN
        NEW.estado := 'closed';
        NEW.closed_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar histórico automaticamente
CREATE OR REPLACE FUNCTION registrar_historico_incidente()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar mudanças no histórico
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO itil_incidentes_historico (
            incidente_id,
            acao,
            descricao,
            usuario_id,
            dados_anteriores,
            dados_novos
        ) VALUES (
            NEW.id,
            'update',
            'Incidente atualizado',
            auth.uid(),
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO itil_incidentes_historico (
            incidente_id,
            acao,
            descricao,
            usuario_id,
            dados_novos
        ) VALUES (
            NEW.id,
            'create',
            'Incidente criado',
            auth.uid(),
            to_jsonb(NEW)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para gerar número de incidente automaticamente
CREATE OR REPLACE FUNCTION trigger_gerar_numero_incidente()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_incidente IS NULL THEN
        NEW.numero_incidente := gerar_numero_incidente();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gerar_numero_incidente
    BEFORE INSERT ON itil_incidentes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_gerar_numero_incidente();

-- Trigger para calcular prioridade automaticamente
CREATE OR REPLACE FUNCTION trigger_calcular_prioridade()
RETURNS TRIGGER AS $$
BEGIN
    NEW.prioridade := calcular_prioridade(NEW.urgencia, NEW.impacto);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_prioridade
    BEFORE INSERT OR UPDATE ON itil_incidentes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calcular_prioridade();

-- Trigger para verificar violação de SLA
CREATE TRIGGER trigger_verificar_sla
    BEFORE UPDATE ON itil_incidentes
    FOR EACH ROW
    EXECUTE FUNCTION verificar_violacao_sla();

-- Trigger para atualizar tempos
CREATE TRIGGER trigger_atualizar_tempos
    BEFORE UPDATE ON itil_incidentes
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_tempos_incidente();

-- Trigger para registrar histórico
CREATE TRIGGER trigger_registrar_historico
    AFTER INSERT OR UPDATE ON itil_incidentes
    FOR EACH ROW
    EXECUTE FUNCTION registrar_historico_incidente();

-- =====================================================
-- VIEWS PARA RELATÓRIOS
-- =====================================================

-- View de estatísticas de incidentes
CREATE OR REPLACE VIEW view_estatisticas_incidentes AS
SELECT 
    DATE_TRUNC('day', created_at) as data,
    COUNT(*) as total_incidentes,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolvidos,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as fechados,
    COUNT(CASE WHEN sla_violado THEN 1 END) as sla_violado,
    AVG(tempo_resolucao_minutos) as tempo_medio_resolucao,
    AVG(tempo_resposta_minutos) as tempo_medio_resposta,
    COUNT(CASE WHEN prioridade = 'critical' THEN 1 END) as criticos,
    COUNT(CASE WHEN prioridade = 'high' THEN 1 END) as altos,
    COUNT(CASE WHEN prioridade = 'medium' THEN 1 END) as medios,
    COUNT(CASE WHEN prioridade = 'low' THEN 1 END) as baixos
FROM itil_incidentes
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY data DESC;

-- View de SLA por categoria
CREATE OR REPLACE VIEW view_sla_categoria AS
SELECT 
    categoria,
    COUNT(*) as total_incidentes,
    COUNT(CASE WHEN sla_violado THEN 1 END) as sla_violado,
    ROUND(
        (COUNT(*) - COUNT(CASE WHEN sla_violado THEN 1 END))::DECIMAL / COUNT(*) * 100, 2
    ) as percentual_conformidade,
    AVG(tempo_resolucao_minutos) as tempo_medio_resolucao
FROM itil_incidentes
WHERE status IN ('resolved', 'closed')
GROUP BY categoria
ORDER BY percentual_conformidade DESC;

-- View de incidentes críticos
CREATE OR REPLACE VIEW view_incidentes_criticos AS
SELECT 
    numero_incidente,
    titulo,
    categoria,
    prioridade,
    status,
    created_at,
    tempo_resolucao_minutos,
    sla_violado,
    responsavel_id
FROM itil_incidentes
WHERE prioridade IN ('critical', 'high')
    AND status NOT IN ('resolved', 'closed')
ORDER BY created_at ASC;

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir tipos de chamado padrão
INSERT INTO itil_tipos_chamado (nome, descricao, categoria, sla_resposta_minutos, sla_resolucao_minutos, prioridade_padrao) VALUES
('Incidente Crítico', 'Interrupção total de serviço crítico', 'incident', 15, 240, 'critical'),
('Incidente Alto', 'Degradação significativa de serviço', 'incident', 30, 480, 'high'),
('Incidente Médio', 'Problema que afeta alguns usuários', 'incident', 60, 960, 'medium'),
('Incidente Baixo', 'Problema menor ou não crítico', 'incident', 120, 1440, 'low'),
('Requisição de Serviço', 'Solicitação de serviço ou informação', 'request', 60, 480, 'medium'),
('Problema', 'Causa raiz de múltiplos incidentes', 'problem', 120, 1440, 'high'),
('Mudança', 'Alteração planejada em serviço', 'change', 240, 2880, 'medium');

-- Inserir matriz de urgência e impacto
INSERT INTO itil_urgencia_impacto (urgencia, impacto, prioridade, sla_resposta_minutos, sla_resolucao_minutos, descricao) VALUES
('critical', 'critical', 'critical', 15, 240, 'Crítico - Interrupção total'),
('critical', 'high', 'critical', 15, 240, 'Crítico - Alto impacto'),
('critical', 'medium', 'high', 30, 480, 'Alto - Crítico urgente'),
('critical', 'low', 'high', 30, 480, 'Alto - Crítico urgente'),
('high', 'critical', 'critical', 15, 240, 'Crítico - Alto impacto'),
('high', 'high', 'high', 30, 480, 'Alto - Alto impacto'),
('high', 'medium', 'high', 30, 480, 'Alto - Médio impacto'),
('high', 'low', 'medium', 60, 960, 'Médio - Alto urgente'),
('medium', 'critical', 'high', 30, 480, 'Alto - Crítico impacto'),
('medium', 'high', 'high', 30, 480, 'Alto - Alto impacto'),
('medium', 'medium', 'medium', 60, 960, 'Médio - Médio impacto'),
('medium', 'low', 'medium', 60, 960, 'Médio - Baixo impacto'),
('low', 'critical', 'high', 30, 480, 'Alto - Crítico impacto'),
('low', 'high', 'medium', 60, 960, 'Médio - Alto impacto'),
('low', 'medium', 'medium', 60, 960, 'Médio - Médio impacto'),
('low', 'low', 'low', 120, 1440, 'Baixo - Baixo impacto');

-- Inserir contratos de SLA padrão
INSERT INTO itil_sla_contracts (nome, descricao, tipo_servico, sla_resposta_minutos, sla_resolucao_minutos, sla_disponibilidade, horario_funcionamento) VALUES
('SLA Crítico', 'SLA para serviços críticos', 'critical', 15, 240, 99.99, '{"inicio": "00:00", "fim": "23:59", "dias": [1,2,3,4,5,6,7]}'),
('SLA Padrão', 'SLA para serviços padrão', 'standard', 60, 480, 99.9, '{"inicio": "08:00", "fim": "18:00", "dias": [1,2,3,4,5]}'),
('SLA Baixa Prioridade', 'SLA para serviços não críticos', 'low', 120, 1440, 99.0, '{"inicio": "08:00", "fim": "18:00", "dias": [1,2,3,4,5]}');

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE itil_incidentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE itil_incidentes_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE itil_escalacao ENABLE ROW LEVEL SECURITY;

-- Políticas para incidentes
CREATE POLICY "Usuários podem ver incidentes" ON itil_incidentes
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem criar incidentes" ON itil_incidentes
    FOR INSERT WITH CHECK (auth.uid() = solicitante_id);

CREATE POLICY "Responsáveis podem editar incidentes" ON itil_incidentes
    FOR UPDATE USING (auth.uid() = responsavel_id OR auth.uid() = solicitante_id);

-- Políticas para histórico
CREATE POLICY "Usuários podem ver histórico" ON itil_incidentes_historico
    FOR SELECT USING (true);

-- Políticas para escalação
CREATE POLICY "Usuários podem ver escalação" ON itil_escalacao
    FOR SELECT USING (true);

CREATE POLICY "Responsáveis podem gerenciar escalação" ON itil_escalacao
    FOR ALL USING (auth.uid() = responsavel_id); 