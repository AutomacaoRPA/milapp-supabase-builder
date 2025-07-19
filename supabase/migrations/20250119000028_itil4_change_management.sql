-- =====================================================
-- ITIL 4 CHANGE MANAGEMENT - Estrutura Completa
-- =====================================================

-- Tabela de tipos de mudança
CREATE TABLE IF NOT EXISTS itil_tipos_mudanca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(50) NOT NULL, -- 'normal', 'standard', 'emergency'
    tempo_aprovacao_horas INTEGER DEFAULT 24,
    requer_aprovacao BOOLEAN DEFAULT true,
    requer_teste BOOLEAN DEFAULT true,
    requer_rollback BOOLEAN DEFAULT true,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mudanças (RFC - Request for Change)
CREATE TABLE IF NOT EXISTS itil_mudancas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_rfc VARCHAR(20) UNIQUE NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT NOT NULL,
    justificativa TEXT NOT NULL,
    tipo_mudanca_id UUID REFERENCES itil_tipos_mudanca(id),
    categoria VARCHAR(50) NOT NULL, -- 'normal', 'standard', 'emergency'
    urgencia VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    impacto VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    risco VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, submitted, in_review, approved, rejected, in_progress, completed, failed, rolled_back
    estado VARCHAR(50) NOT NULL DEFAULT 'open', -- open, closed
    solicitante_id UUID REFERENCES auth.users(id),
    aprovador_id UUID REFERENCES auth.users(id),
    implementador_id UUID REFERENCES auth.users(id),
    grupo_responsavel VARCHAR(100),
    servicos_afetados TEXT[],
    sistemas_afetados TEXT[],
    usuarios_afetados INTEGER,
    janela_execucao_inicio TIMESTAMP WITH TIME ZONE,
    janela_execucao_fim TIMESTAMP WITH TIME ZONE,
    tempo_estimado_horas DECIMAL(5,2),
    tempo_real_horas DECIMAL(5,2),
    plano_implementacao TEXT,
    plano_teste TEXT,
    plano_rollback TEXT,
    criterios_sucesso TEXT,
    criterios_rollback TEXT,
    recursos_necessarios TEXT[],
    dependencias TEXT[],
    incidentes_relacionados UUID[],
    problemas_relacionados UUID[],
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de histórico de mudanças
CREATE TABLE IF NOT EXISTS itil_mudancas_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mudanca_id UUID REFERENCES itil_mudancas(id) ON DELETE CASCADE,
    acao VARCHAR(100) NOT NULL,
    descricao TEXT,
    usuario_id UUID REFERENCES auth.users(id),
    dados_anteriores JSONB,
    dados_novos JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de aprovações de mudança
CREATE TABLE IF NOT EXISTS itil_aprovacoes_mudanca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mudanca_id UUID REFERENCES itil_mudancas(id) ON DELETE CASCADE,
    aprovador_id UUID REFERENCES auth.users(id),
    nivel_aprovacao INTEGER NOT NULL, -- 1, 2, 3
    tipo_aprovacao VARCHAR(50) NOT NULL, -- 'functional', 'technical', 'business', 'security'
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
    comentarios TEXT,
    data_aprovacao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de execução de mudanças
CREATE TABLE IF NOT EXISTS itil_execucao_mudanca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mudanca_id UUID REFERENCES itil_mudancas(id) ON DELETE CASCADE,
    etapa VARCHAR(100) NOT NULL,
    descricao TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, failed, skipped
    responsavel_id UUID REFERENCES auth.users(id),
    inicio_previsto TIMESTAMP WITH TIME ZONE,
    fim_previsto TIMESTAMP WITH TIME ZONE,
    inicio_real TIMESTAMP WITH TIME ZONE,
    fim_real TIMESTAMP WITH TIME ZONE,
    resultado TEXT,
    logs TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de testes de mudança
CREATE TABLE IF NOT EXISTS itil_testes_mudanca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mudanca_id UUID REFERENCES itil_mudancas(id) ON DELETE CASCADE,
    nome_teste VARCHAR(200) NOT NULL,
    descricao TEXT,
    tipo_teste VARCHAR(50) NOT NULL, -- 'unit', 'integration', 'system', 'user_acceptance'
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, passed, failed, blocked
    responsavel_id UUID REFERENCES auth.users(id),
    criterios_aceitacao TEXT,
    resultado TEXT,
    observacoes TEXT,
    data_teste TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de rollback de mudanças
CREATE TABLE IF NOT EXISTS itil_rollback_mudanca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mudanca_id UUID REFERENCES itil_mudancas(id) ON DELETE CASCADE,
    motivo TEXT NOT NULL,
    solicitante_id UUID REFERENCES auth.users(id),
    aprovador_id UUID REFERENCES auth.users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'requested', -- requested, approved, in_progress, completed, failed
    plano_rollback TEXT,
    resultado TEXT,
    tempo_rollback_minutos INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de mudanças padrão (Standard Changes)
CREATE TABLE IF NOT EXISTS itil_mudancas_padrao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100),
    procedimento TEXT,
    tempo_estimado_horas DECIMAL(5,2),
    recursos_necessarios TEXT[],
    criterios_aprovacao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FUNÇÕES ITIL 4 CHANGE MANAGEMENT
-- =====================================================

-- Função para gerar número RFC
CREATE OR REPLACE FUNCTION gerar_numero_rfc()
RETURNS VARCHAR AS $$
DECLARE
    ano_atual VARCHAR(4);
    proximo_numero INTEGER;
    numero_rfc VARCHAR(20);
BEGIN
    ano_atual := EXTRACT(YEAR FROM NOW())::VARCHAR;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_rfc FROM 9) AS INTEGER)), 0) + 1
    INTO proximo_numero
    FROM itil_mudancas
    WHERE numero_rfc LIKE 'RFC-' || ano_atual || '-%';
    
    numero_rfc := 'RFC-' || ano_atual || '-' || LPAD(proximo_numero::VARCHAR, 6, '0');
    
    RETURN numero_rfc;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular risco baseado em urgência e impacto
CREATE OR REPLACE FUNCTION calcular_risco_mudanca(urgencia VARCHAR, impacto VARCHAR)
RETURNS VARCHAR AS $$
BEGIN
    IF urgencia = 'critical' AND impacto = 'critical' THEN
        RETURN 'critical';
    ELSIF urgencia = 'critical' OR impacto = 'critical' THEN
        RETURN 'high';
    ELSIF urgencia = 'high' OR impacto = 'high' THEN
        RETURN 'high';
    ELSIF urgencia = 'medium' OR impacto = 'medium' THEN
        RETURN 'medium';
    ELSE
        RETURN 'low';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se mudança pode ser aprovada
CREATE OR REPLACE FUNCTION verificar_aprovacao_mudanca(mudanca_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    mudanca RECORD;
    aprovacoes_pendentes INTEGER;
    total_aprovacoes INTEGER;
BEGIN
    -- Buscar mudança
    SELECT * INTO mudanca
    FROM itil_mudancas
    WHERE id = mudanca_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Verificar se é mudança de emergência
    IF mudanca.categoria = 'emergency' THEN
        RETURN true;
    END IF;
    
    -- Verificar aprovações pendentes
    SELECT COUNT(*) INTO aprovacoes_pendentes
    FROM itil_aprovacoes_mudanca
    WHERE mudanca_id = mudanca_id AND status = 'pending';
    
    SELECT COUNT(*) INTO total_aprovacoes
    FROM itil_aprovacoes_mudanca
    WHERE mudanca_id = mudanca_id;
    
    -- Se não há aprovações pendentes e há pelo menos uma aprovação
    RETURN aprovacoes_pendentes = 0 AND total_aprovacoes > 0;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar status de mudança
CREATE OR REPLACE FUNCTION atualizar_status_mudanca()
RETURNS TRIGGER AS $$
BEGIN
    -- Mudança submetida
    IF NEW.status = 'submitted' AND OLD.status = 'draft' THEN
        NEW.submitted_at := NOW();
    END IF;
    
    -- Mudança aprovada
    IF NEW.status = 'approved' AND OLD.status IN ('submitted', 'in_review') THEN
        NEW.approved_at := NOW();
    END IF;
    
    -- Mudança iniciada
    IF NEW.status = 'in_progress' AND OLD.status = 'approved' THEN
        NEW.started_at := NOW();
    END IF;
    
    -- Mudança completada
    IF NEW.status = 'completed' AND OLD.status = 'in_progress' THEN
        NEW.completed_at := NOW();
        NEW.estado := 'closed';
        NEW.closed_at := NOW();
    END IF;
    
    -- Mudança falhou
    IF NEW.status = 'failed' AND OLD.status = 'in_progress' THEN
        NEW.completed_at := NOW();
    END IF;
    
    -- Mudança com rollback
    IF NEW.status = 'rolled_back' THEN
        NEW.completed_at := NOW();
        NEW.estado := 'closed';
        NEW.closed_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar histórico de mudança
CREATE OR REPLACE FUNCTION registrar_historico_mudanca()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar mudanças no histórico
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO itil_mudancas_historico (
            mudanca_id,
            acao,
            descricao,
            usuario_id,
            dados_anteriores,
            dados_novos
        ) VALUES (
            NEW.id,
            'update',
            'Mudança atualizada',
            auth.uid(),
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO itil_mudancas_historico (
            mudanca_id,
            acao,
            descricao,
            usuario_id,
            dados_novos
        ) VALUES (
            NEW.id,
            'create',
            'Mudança criada',
            auth.uid(),
            to_jsonb(NEW)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para criar etapas de execução padrão
CREATE OR REPLACE FUNCTION criar_etapas_execucao_padrao(mudanca_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Etapa 1: Preparação
    INSERT INTO itil_execucao_mudanca (mudanca_id, etapa, descricao, status) VALUES
    (mudanca_id, 'Preparação', 'Preparar ambiente e recursos', 'pending');
    
    -- Etapa 2: Backup
    INSERT INTO itil_execucao_mudanca (mudanca_id, etapa, descricao, status) VALUES
    (mudanca_id, 'Backup', 'Realizar backup dos dados', 'pending');
    
    -- Etapa 3: Implementação
    INSERT INTO itil_execucao_mudanca (mudanca_id, etapa, descricao, status) VALUES
    (mudanca_id, 'Implementação', 'Executar a mudança', 'pending');
    
    -- Etapa 4: Teste
    INSERT INTO itil_execucao_mudanca (mudanca_id, etapa, descricao, status) VALUES
    (mudanca_id, 'Teste', 'Validar a mudança', 'pending');
    
    -- Etapa 5: Finalização
    INSERT INTO itil_execucao_mudanca (mudanca_id, etapa, descricao, status) VALUES
    (mudanca_id, 'Finalização', 'Finalizar e documentar', 'pending');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para gerar número RFC automaticamente
CREATE OR REPLACE FUNCTION trigger_gerar_numero_rfc()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_rfc IS NULL THEN
        NEW.numero_rfc := gerar_numero_rfc();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gerar_numero_rfc
    BEFORE INSERT ON itil_mudancas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_gerar_numero_rfc();

-- Trigger para calcular risco automaticamente
CREATE OR REPLACE FUNCTION trigger_calcular_risco()
RETURNS TRIGGER AS $$
BEGIN
    NEW.risco := calcular_risco_mudanca(NEW.urgencia, NEW.impacto);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calcular_risco
    BEFORE INSERT OR UPDATE ON itil_mudancas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calcular_risco();

-- Trigger para atualizar status
CREATE TRIGGER trigger_atualizar_status
    BEFORE UPDATE ON itil_mudancas
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_status_mudanca();

-- Trigger para registrar histórico
CREATE TRIGGER trigger_registrar_historico_mudanca
    AFTER INSERT OR UPDATE ON itil_mudancas
    FOR EACH ROW
    EXECUTE FUNCTION registrar_historico_mudanca();

-- Trigger para criar etapas quando mudança é aprovada
CREATE OR REPLACE FUNCTION trigger_criar_etapas_aprovacao()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        PERFORM criar_etapas_execucao_padrao(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_criar_etapas_aprovacao
    AFTER UPDATE ON itil_mudancas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_criar_etapas_aprovacao();

-- =====================================================
-- VIEWS PARA RELATÓRIOS
-- =====================================================

-- View de estatísticas de mudanças
CREATE OR REPLACE VIEW view_estatisticas_mudancas AS
SELECT 
    DATE_TRUNC('month', created_at) as mes,
    COUNT(*) as total_mudancas,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completadas,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as falharam,
    COUNT(CASE WHEN status = 'rolled_back' THEN 1 END) as rollback,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as em_andamento,
    AVG(tempo_real_horas) as tempo_medio_horas,
    COUNT(CASE WHEN risco = 'critical' THEN 1 END) as risco_critico,
    COUNT(CASE WHEN risco = 'high' THEN 1 END) as risco_alto,
    COUNT(CASE WHEN risco = 'medium' THEN 1 END) as risco_medio,
    COUNT(CASE WHEN risco = 'low' THEN 1 END) as risco_baixo
FROM itil_mudancas
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mes DESC;

-- View de mudanças por categoria
CREATE OR REPLACE VIEW view_mudancas_categoria AS
SELECT 
    categoria,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as sucesso,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as falha,
    ROUND(
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / COUNT(*) * 100, 2
    ) as taxa_sucesso,
    AVG(tempo_real_horas) as tempo_medio_horas
FROM itil_mudancas
WHERE status IN ('completed', 'failed', 'rolled_back')
GROUP BY categoria
ORDER BY taxa_sucesso DESC;

-- View de mudanças pendentes de aprovação
CREATE OR REPLACE VIEW view_mudancas_pendentes AS
SELECT 
    m.numero_rfc,
    m.titulo,
    m.categoria,
    m.urgencia,
    m.impacto,
    m.risco,
    m.created_at,
    m.solicitante_id,
    u.email as solicitante_email
FROM itil_mudancas m
LEFT JOIN auth.users u ON m.solicitante_id = u.id
WHERE m.status IN ('submitted', 'in_review')
ORDER BY 
    CASE m.urgencia 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
    END,
    m.created_at ASC;

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir tipos de mudança padrão
INSERT INTO itil_tipos_mudanca (nome, descricao, categoria, tempo_aprovacao_horas, requer_aprovacao, requer_teste, requer_rollback) VALUES
('Mudança Normal', 'Mudança planejada com impacto médio', 'normal', 24, true, true, true),
('Mudança Padrão', 'Mudança pre-aprovada e documentada', 'standard', 4, false, true, true),
('Mudança de Emergência', 'Mudança crítica para resolver incidente', 'emergency', 1, true, false, true);

-- Inserir mudanças padrão
INSERT INTO itil_mudancas_padrao (nome, descricao, categoria, procedimento, tempo_estimado_horas, recursos_necessarios) VALUES
('Adicionar Usuário', 'Adicionar novo usuário ao sistema', 'Usuários', '1. Verificar permissões\n2. Criar conta\n3. Configurar acesso\n4. Notificar usuário', 0.5, ARRAY['Sistema de usuários', 'Email']),
('Reset de Senha', 'Reset de senha de usuário', 'Usuários', '1. Verificar identidade\n2. Gerar nova senha\n3. Notificar usuário', 0.25, ARRAY['Sistema de usuários', 'Email']),
('Atualização de Software', 'Atualização de versão de software', 'Infraestrutura', '1. Backup\n2. Instalação\n3. Teste\n4. Validação', 2.0, ARRAY['Servidor', 'Backup', 'Ambiente de teste']);

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE itil_mudancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE itil_mudancas_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE itil_aprovacoes_mudanca ENABLE ROW LEVEL SECURITY;
ALTER TABLE itil_execucao_mudanca ENABLE ROW LEVEL SECURITY;

-- Políticas para mudanças
CREATE POLICY "Usuários podem ver mudanças" ON itil_mudancas
    FOR SELECT USING (true);

CREATE POLICY "Solicitantes podem criar mudanças" ON itil_mudancas
    FOR INSERT WITH CHECK (auth.uid() = solicitante_id);

CREATE POLICY "Responsáveis podem editar mudanças" ON itil_mudancas
    FOR UPDATE USING (
        auth.uid() = solicitante_id OR 
        auth.uid() = aprovador_id OR 
        auth.uid() = implementador_id
    );

-- Políticas para histórico
CREATE POLICY "Usuários podem ver histórico de mudanças" ON itil_mudancas_historico
    FOR SELECT USING (true);

-- Políticas para aprovações
CREATE POLICY "Usuários podem ver aprovações" ON itil_aprovacoes_mudanca
    FOR SELECT USING (true);

CREATE POLICY "Aprovadores podem gerenciar aprovações" ON itil_aprovacoes_mudanca
    FOR ALL USING (auth.uid() = aprovador_id);

-- Políticas para execução
CREATE POLICY "Usuários podem ver execução" ON itil_execucao_mudanca
    FOR SELECT USING (true);

CREATE POLICY "Responsáveis podem gerenciar execução" ON itil_execucao_mudanca
    FOR ALL USING (auth.uid() = responsavel_id); 