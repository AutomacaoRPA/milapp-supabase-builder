-- =====================================================
-- ITIL 4 KNOWLEDGE MANAGEMENT - Estrutura Completa
-- =====================================================

-- Tabela de categorias de conhecimento
CREATE TABLE IF NOT EXISTS itil_categorias_conhecimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    categoria_pai_id UUID REFERENCES itil_categorias_conhecimento(id),
    nivel INTEGER DEFAULT 1,
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de artigos de conhecimento (KB Articles)
CREATE TABLE IF NOT EXISTS itil_artigos_conhecimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_artigo VARCHAR(20) UNIQUE NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    resumo TEXT,
    conteudo TEXT NOT NULL,
    categoria_id UUID REFERENCES itil_categorias_conhecimento(id),
    tags TEXT[],
    tipo_artigo VARCHAR(50) NOT NULL, -- 'how_to', 'troubleshooting', 'reference', 'best_practice', 'faq'
    nivel_conhecimento VARCHAR(20) NOT NULL, -- 'beginner', 'intermediate', 'advanced', 'expert'
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft', 'review', 'approved', 'published', 'archived'
    estado VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'archived'
    autor_id UUID REFERENCES auth.users(id),
    revisor_id UUID REFERENCES auth.users(id),
    aprovador_id UUID REFERENCES auth.users(id),
    incidentes_relacionados UUID[],
    problemas_relacionados UUID[],
    mudancas_relacionadas UUID[],
    versao INTEGER DEFAULT 1,
    versao_anterior_id UUID REFERENCES itil_artigos_conhecimento(id),
    visualizacoes INTEGER DEFAULT 0,
    avaliacoes_positivas INTEGER DEFAULT 0,
    avaliacoes_negativas INTEGER DEFAULT 0,
    ultima_visualizacao TIMESTAMP WITH TIME ZONE,
    proxima_revisao TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de histórico de artigos
CREATE TABLE IF NOT EXISTS itil_artigos_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artigo_id UUID REFERENCES itil_artigos_conhecimento(id) ON DELETE CASCADE,
    acao VARCHAR(100) NOT NULL,
    descricao TEXT,
    usuario_id UUID REFERENCES auth.users(id),
    dados_anteriores JSONB,
    dados_novos JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de revisão de artigos
CREATE TABLE IF NOT EXISTS itil_revisao_artigos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artigo_id UUID REFERENCES itil_artigos_conhecimento(id) ON DELETE CASCADE,
    revisor_id UUID REFERENCES auth.users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'changes_requested'
    comentarios TEXT,
    sugestoes TEXT,
    data_revisao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de aprovação de artigos
CREATE TABLE IF NOT EXISTS itil_aprovacao_artigos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artigo_id UUID REFERENCES itil_artigos_conhecimento(id) ON DELETE CASCADE,
    aprovador_id UUID REFERENCES auth.users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    comentarios TEXT,
    data_aprovacao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de visualizações de artigos
CREATE TABLE IF NOT EXISTS itil_visualizacoes_artigos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artigo_id UUID REFERENCES itil_artigos_conhecimento(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES auth.users(id),
    contexto VARCHAR(100), -- 'search', 'incident', 'problem', 'change', 'direct'
    tempo_visualizacao_segundos INTEGER,
    encontrou_util BOOLEAN,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de busca de conhecimento
CREATE TABLE IF NOT EXISTS itil_busca_conhecimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES auth.users(id),
    termo_busca TEXT NOT NULL,
    contexto VARCHAR(100),
    resultados_encontrados INTEGER,
    artigo_selecionado_id UUID REFERENCES itil_artigos_conhecimento(id),
    tempo_busca_segundos INTEGER,
    sucesso BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sugestões de conhecimento
CREATE TABLE IF NOT EXISTS itil_sugestoes_conhecimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contexto VARCHAR(100) NOT NULL, -- 'incident', 'problem', 'change'
    contexto_id UUID,
    artigo_sugerido_id UUID REFERENCES itil_artigos_conhecimento(id),
    relevancia DECIMAL(3,2) CHECK (relevancia >= 0 AND relevancia <= 1),
    motivo_sugestao TEXT,
    aceito BOOLEAN,
    usuario_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de templates de artigos
CREATE TABLE IF NOT EXISTS itil_templates_artigos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    tipo_artigo VARCHAR(50) NOT NULL,
    estrutura_template JSONB,
    campos_obrigatorios TEXT[],
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de indicadores de conhecimento
CREATE TABLE IF NOT EXISTS itil_kpis_conhecimento (
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
-- FUNÇÕES ITIL 4 KNOWLEDGE MANAGEMENT
-- =====================================================

-- Função para gerar número de artigo
CREATE OR REPLACE FUNCTION gerar_numero_artigo()
RETURNS VARCHAR AS $$
DECLARE
    ano_atual VARCHAR(4);
    proximo_numero INTEGER;
    numero_artigo VARCHAR(20);
BEGIN
    ano_atual := EXTRACT(YEAR FROM NOW())::VARCHAR;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(numero_artigo FROM 9) AS INTEGER)), 0) + 1
    INTO proximo_numero
    FROM itil_artigos_conhecimento
    WHERE numero_artigo LIKE 'KB-' || ano_atual || '-%';
    
    numero_artigo := 'KB-' || ano_atual || '-' || LPAD(proximo_numero::VARCHAR, 6, '0');
    
    RETURN numero_artigo;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar artigos por relevância
CREATE OR REPLACE FUNCTION buscar_artigos_relevantes(
    termo_busca TEXT,
    categoria_id UUID DEFAULT NULL,
    limite INTEGER DEFAULT 10
)
RETURNS TABLE (
    artigo_id UUID,
    numero_artigo VARCHAR,
    titulo VARCHAR,
    resumo TEXT,
    relevancia DECIMAL(3,2),
    categoria_nome VARCHAR,
    tipo_artigo VARCHAR,
    visualizacoes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.id,
        ac.numero_artigo,
        ac.titulo,
        ac.resumo,
        CASE 
            WHEN ac.titulo ILIKE '%' || termo_busca || '%' THEN 1.0
            WHEN ac.resumo ILIKE '%' || termo_busca || '%' THEN 0.8
            WHEN ac.conteudo ILIKE '%' || termo_busca || '%' THEN 0.6
            WHEN ac.tags && string_to_array(termo_busca, ' ') THEN 0.4
            ELSE 0.2
        END as relevancia,
        ic.nome as categoria_nome,
        ac.tipo_artigo,
        ac.visualizacoes
    FROM itil_artigos_conhecimento ac
    LEFT JOIN itil_categorias_conhecimento ic ON ac.categoria_id = ic.id
    WHERE ac.status = 'published'
        AND ac.estado = 'active'
        AND (categoria_id IS NULL OR ac.categoria_id = categoria_id)
        AND (
            ac.titulo ILIKE '%' || termo_busca || '%'
            OR ac.resumo ILIKE '%' || termo_busca || '%'
            OR ac.conteudo ILIKE '%' || termo_busca || '%'
            OR ac.tags && string_to_array(termo_busca, ' ')
        )
    ORDER BY relevancia DESC, ac.visualizacoes DESC
    LIMIT limite;
END;
$$ LANGUAGE plpgsql;

-- Função para sugerir artigos baseado em contexto
CREATE OR REPLACE FUNCTION sugerir_artigos_contexto(
    contexto VARCHAR,
    contexto_id UUID,
    limite INTEGER DEFAULT 5
)
RETURNS TABLE (
    artigo_id UUID,
    numero_artigo VARCHAR,
    titulo VARCHAR,
    relevancia DECIMAL(3,2),
    motivo_sugestao TEXT
) AS $$
DECLARE
    contexto_data JSONB;
BEGIN
    -- Buscar dados do contexto
    CASE contexto
        WHEN 'incident' THEN
            SELECT to_jsonb(i.*) INTO contexto_data
            FROM itil_incidentes i
            WHERE i.id = contexto_id;
        WHEN 'problem' THEN
            SELECT to_jsonb(p.*) INTO contexto_data
            FROM itil_problemas p
            WHERE p.id = contexto_id;
        WHEN 'change' THEN
            SELECT to_jsonb(m.*) INTO contexto_data
            FROM itil_mudancas m
            WHERE m.id = contexto_id;
        ELSE
            contexto_data := '{}'::jsonb;
    END CASE;
    
    -- Retornar artigos relevantes
    RETURN QUERY
    SELECT 
        ac.id,
        ac.numero_artigo,
        ac.titulo,
        CASE 
            WHEN ac.categoria_id IS NOT NULL AND contexto_data ? 'categoria' THEN 0.9
            WHEN ac.tags && (SELECT tags FROM itil_incidentes WHERE id = contexto_id) THEN 0.8
            WHEN ac.tipo_artigo = 'troubleshooting' AND contexto = 'incident' THEN 0.7
            WHEN ac.tipo_artigo = 'how_to' AND contexto = 'change' THEN 0.7
            ELSE 0.5
        END as relevancia,
        CASE 
            WHEN ac.categoria_id IS NOT NULL AND contexto_data ? 'categoria' THEN 'Categoria similar'
            WHEN ac.tipo_artigo = 'troubleshooting' AND contexto = 'incident' THEN 'Artigo de troubleshooting'
            WHEN ac.tipo_artigo = 'how_to' AND contexto = 'change' THEN 'Procedimento relacionado'
            ELSE 'Artigo relacionado'
        END as motivo_sugestao
    FROM itil_artigos_conhecimento ac
    WHERE ac.status = 'published'
        AND ac.estado = 'active'
        AND (
            (contexto_data ? 'categoria' AND ac.categoria_id IS NOT NULL)
            OR (contexto = 'incident' AND ac.tipo_artigo = 'troubleshooting')
            OR (contexto = 'change' AND ac.tipo_artigo = 'how_to')
        )
    ORDER BY relevancia DESC, ac.visualizacoes DESC
    LIMIT limite;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar visualização
CREATE OR REPLACE FUNCTION registrar_visualizacao_artigo(
    artigo_id UUID,
    usuario_id UUID,
    contexto VARCHAR DEFAULT 'direct'
)
RETURNS VOID AS $$
BEGIN
    -- Registrar visualização
    INSERT INTO itil_visualizacoes_artigos (
        artigo_id,
        usuario_id,
        contexto
    ) VALUES (
        artigo_id,
        usuario_id,
        contexto
    );
    
    -- Atualizar contador de visualizações
    UPDATE itil_artigos_conhecimento
    SET 
        visualizacoes = visualizacoes + 1,
        ultima_visualizacao = NOW()
    WHERE id = artigo_id;
END;
$$ LANGUAGE plpgsql;

-- Função para avaliar artigo
CREATE OR REPLACE FUNCTION avaliar_artigo(
    artigo_id UUID,
    usuario_id UUID,
    util BOOLEAN
)
RETURNS VOID AS $$
BEGIN
    -- Atualizar contadores de avaliação
    IF util THEN
        UPDATE itil_artigos_conhecimento
        SET avaliacoes_positivas = avaliacoes_positivas + 1
        WHERE id = artigo_id;
    ELSE
        UPDATE itil_artigos_conhecimento
        SET avaliacoes_negativas = avaliacoes_negativas + 1
        WHERE id = artigo_id;
    END IF;
    
    -- Atualizar feedback na visualização
    UPDATE itil_visualizacoes_artigos
    SET encontrou_util = util
    WHERE artigo_id = artigo_id
        AND usuario_id = usuario_id
        AND created_at = (
            SELECT MAX(created_at)
            FROM itil_visualizacoes_artigos
            WHERE artigo_id = artigo_id AND usuario_id = usuario_id
        );
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar status de artigo
CREATE OR REPLACE FUNCTION atualizar_status_artigo()
RETURNS TRIGGER AS $$
BEGIN
    -- Artigo publicado
    IF NEW.status = 'published' AND OLD.status != 'published' THEN
        NEW.published_at := NOW();
        NEW.proxima_revisao := NOW() + INTERVAL '6 months';
    END IF;
    
    -- Artigo arquivado
    IF NEW.status = 'archived' AND OLD.status != 'archived' THEN
        NEW.estado := 'archived';
        NEW.archived_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar histórico de artigo
CREATE OR REPLACE FUNCTION registrar_historico_artigo()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar mudanças no histórico
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO itil_artigos_historico (
            artigo_id,
            acao,
            descricao,
            usuario_id,
            dados_anteriores,
            dados_novos
        ) VALUES (
            NEW.id,
            'update',
            'Artigo atualizado',
            auth.uid(),
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO itil_artigos_historico (
            artigo_id,
            acao,
            descricao,
            usuario_id,
            dados_novos
        ) VALUES (
            NEW.id,
            'create',
            'Artigo criado',
            auth.uid(),
            to_jsonb(NEW)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular KPIs de conhecimento
CREATE OR REPLACE FUNCTION calcular_kpis_conhecimento()
RETURNS VOID AS $$
DECLARE
    kpi RECORD;
    valor_calculado DECIMAL(10,2);
BEGIN
    FOR kpi IN SELECT * FROM itil_kpis_conhecimento LOOP
        CASE kpi.nome
            WHEN 'Total de Artigos' THEN
                SELECT COUNT(*) INTO valor_calculado
                FROM itil_artigos_conhecimento
                WHERE status = 'published' AND estado = 'active';
                
            WHEN 'Artigos Visualizados' THEN
                SELECT COUNT(*) INTO valor_calculado
                FROM itil_artigos_conhecimento
                WHERE status = 'published' 
                    AND estado = 'active'
                    AND visualizacoes > 0;
                    
            WHEN 'Taxa de Utilidade' THEN
                SELECT 
                    CASE 
                        WHEN (avaliacoes_positivas + avaliacoes_negativas) > 0 
                        THEN (avaliacoes_positivas::DECIMAL / (avaliacoes_positivas + avaliacoes_negativas) * 100)
                        ELSE 0 
                    END
                INTO valor_calculado
                FROM itil_artigos_conhecimento
                WHERE status = 'published' AND estado = 'active';
                
            WHEN 'Artigos Desatualizados' THEN
                SELECT COUNT(*) INTO valor_calculado
                FROM itil_artigos_conhecimento
                WHERE status = 'published' 
                    AND estado = 'active'
                    AND proxima_revisao < NOW();
                    
            WHEN 'Busca Bem-sucedida' THEN
                SELECT 
                    CASE 
                        WHEN COUNT(*) > 0 
                        THEN (COUNT(CASE WHEN sucesso THEN 1 END)::DECIMAL / COUNT(*) * 100)
                        ELSE 0 
                    END
                INTO valor_calculado
                FROM itil_busca_conhecimento
                WHERE created_at >= NOW() - INTERVAL '30 days';
                
            ELSE
                valor_calculado := 0;
        END CASE;
        
        -- Atualizar KPI
        UPDATE itil_kpis_conhecimento
        SET valor_atual = COALESCE(valor_calculado, 0),
            ultima_atualizacao = NOW()
        WHERE id = kpi.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger para gerar número de artigo automaticamente
CREATE OR REPLACE FUNCTION trigger_gerar_numero_artigo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.numero_artigo IS NULL THEN
        NEW.numero_artigo := gerar_numero_artigo();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gerar_numero_artigo
    BEFORE INSERT ON itil_artigos_conhecimento
    FOR EACH ROW
    EXECUTE FUNCTION trigger_gerar_numero_artigo();

-- Trigger para atualizar status
CREATE TRIGGER trigger_atualizar_status_artigo
    BEFORE UPDATE ON itil_artigos_conhecimento
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_status_artigo();

-- Trigger para registrar histórico
CREATE TRIGGER trigger_registrar_historico_artigo
    AFTER INSERT OR UPDATE ON itil_artigos_conhecimento
    FOR EACH ROW
    EXECUTE FUNCTION registrar_historico_artigo();

-- =====================================================
-- VIEWS PARA RELATÓRIOS
-- =====================================================

-- View de estatísticas de conhecimento
CREATE OR REPLACE VIEW view_estatisticas_conhecimento AS
SELECT 
    DATE_TRUNC('month', created_at) as mes,
    COUNT(*) as total_artigos,
    COUNT(CASE WHEN status = 'published' THEN 1 END) as publicados,
    COUNT(CASE WHEN status = 'draft' THEN 1 END) as rascunhos,
    COUNT(CASE WHEN status = 'review' THEN 1 END) as em_revisao,
    SUM(visualizacoes) as total_visualizacoes,
    AVG(visualizacoes) as media_visualizacoes,
    COUNT(CASE WHEN proxima_revisao < NOW() THEN 1 END) as desatualizados,
    COUNT(CASE WHEN tipo_artigo = 'how_to' THEN 1 END) as how_to,
    COUNT(CASE WHEN tipo_artigo = 'troubleshooting' THEN 1 END) as troubleshooting,
    COUNT(CASE WHEN tipo_artigo = 'reference' THEN 1 END) as reference,
    COUNT(CASE WHEN tipo_artigo = 'best_practice' THEN 1 END) as best_practice,
    COUNT(CASE WHEN tipo_artigo = 'faq' THEN 1 END) as faq
FROM itil_artigos_conhecimento
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY mes DESC;

-- View de artigos mais populares
CREATE OR REPLACE VIEW view_artigos_populares AS
SELECT 
    ac.numero_artigo,
    ac.titulo,
    ac.tipo_artigo,
    ac.visualizacoes,
    ac.avaliacoes_positivas,
    ac.avaliacoes_negativas,
    CASE 
        WHEN (ac.avaliacoes_positivas + ac.avaliacoes_negativas) > 0 
        THEN ROUND((ac.avaliacoes_positivas::DECIMAL / (ac.avaliacoes_positivas + ac.avaliacoes_negativas) * 100), 2)
        ELSE 0 
    END as taxa_utilidade,
    ic.nome as categoria,
    ac.created_at,
    ac.ultima_visualizacao
FROM itil_artigos_conhecimento ac
LEFT JOIN itil_categorias_conhecimento ic ON ac.categoria_id = ic.id
WHERE ac.status = 'published' 
    AND ac.estado = 'active'
    AND ac.visualizacoes > 0
ORDER BY ac.visualizacoes DESC, taxa_utilidade DESC
LIMIT 20;

-- View de busca de conhecimento
CREATE OR REPLACE VIEW view_busca_conhecimento AS
SELECT 
    DATE_TRUNC('day', created_at) as data,
    COUNT(*) as total_buscas,
    COUNT(CASE WHEN sucesso THEN 1 END) as buscas_sucesso,
    COUNT(CASE WHEN NOT sucesso THEN 1 END) as buscas_sem_sucesso,
    ROUND(
        COUNT(CASE WHEN sucesso THEN 1 END)::DECIMAL / COUNT(*) * 100, 2
    ) as taxa_sucesso,
    AVG(tempo_busca_segundos) as tempo_medio_busca,
    COUNT(DISTINCT usuario_id) as usuarios_unicos
FROM itil_busca_conhecimento
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY data DESC;

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Inserir categorias de conhecimento padrão
INSERT INTO itil_categorias_conhecimento (nome, descricao, nivel, ordem) VALUES
('Infraestrutura', 'Artigos relacionados à infraestrutura de TI', 1, 1),
('Aplicações', 'Artigos relacionados a aplicações e sistemas', 1, 2),
('Redes', 'Artigos relacionados a redes e conectividade', 1, 3),
('Segurança', 'Artigos relacionados à segurança da informação', 1, 4),
('Usuários', 'Artigos relacionados ao suporte a usuários', 1, 5),
('Processos', 'Artigos relacionados a processos de TI', 1, 6);

-- Inserir subcategorias
INSERT INTO itil_categorias_conhecimento (nome, descricao, categoria_pai_id, nivel, ordem) VALUES
('Servidores', 'Artigos sobre servidores', (SELECT id FROM itil_categorias_conhecimento WHERE nome = 'Infraestrutura'), 2, 1),
('Storage', 'Artigos sobre armazenamento', (SELECT id FROM itil_categorias_conhecimento WHERE nome = 'Infraestrutura'), 2, 2),
('Backup', 'Artigos sobre backup e recuperação', (SELECT id FROM itil_categorias_conhecimento WHERE nome = 'Infraestrutura'), 2, 3),
('Email', 'Artigos sobre sistemas de email', (SELECT id FROM itil_categorias_conhecimento WHERE nome = 'Aplicações'), 2, 1),
('ERP', 'Artigos sobre sistemas ERP', (SELECT id FROM itil_categorias_conhecimento WHERE nome = 'Aplicações'), 2, 2),
('CRM', 'Artigos sobre sistemas CRM', (SELECT id FROM itil_categorias_conhecimento WHERE nome = 'Aplicações'), 2, 3);

-- Inserir templates de artigos
INSERT INTO itil_templates_artigos (nome, descricao, tipo_artigo, estrutura_template, campos_obrigatorios) VALUES
('Como Fazer', 'Template para procedimentos passo a passo', 'how_to', 
 '{"secoes": ["Objetivo", "Pré-requisitos", "Materiais Necessários", "Passos", "Verificação", "Troubleshooting"]}', 
 ARRAY['Objetivo', 'Passos']),
('Troubleshooting', 'Template para resolução de problemas', 'troubleshooting',
 '{"secoes": ["Sintoma", "Causas Possíveis", "Diagnóstico", "Solução", "Prevenção"]}',
 ARRAY['Sintoma', 'Solução']),
('Referência', 'Template para informações de referência', 'reference',
 '{"secoes": ["Descrição", "Especificações", "Configurações", "Limitações", "Links Relacionados"]}',
 ARRAY['Descrição']),
('Melhor Prática', 'Template para melhores práticas', 'best_practice',
 '{"secoes": ["Contexto", "Prática Recomendada", "Benefícios", "Implementação", "Monitoramento"]}',
 ARRAY['Contexto', 'Prática Recomendada']),
('FAQ', 'Template para perguntas frequentes', 'faq',
 '{"secoes": ["Pergunta", "Resposta", "Contexto", "Links Relacionados"]}',
 ARRAY['Pergunta', 'Resposta']);

-- Inserir KPIs padrão
INSERT INTO itil_kpis_conhecimento (nome, descricao, formula, unidade, meta, periodo_medicao) VALUES
('Total de Artigos', 'Quantidade total de artigos publicados', 'COUNT(artigos_publicados)', 'artigos', 100.0, 'monthly'),
('Artigos Visualizados', 'Quantidade de artigos com visualizações', 'COUNT(artigos_visualizados)', 'artigos', 80.0, 'monthly'),
('Taxa de Utilidade', 'Percentual de avaliações positivas', '(positivas/total)*100', '%', 85.0, 'monthly'),
('Artigos Desatualizados', 'Quantidade de artigos que precisam de revisão', 'COUNT(artigos_desatualizados)', 'artigos', 10.0, 'monthly'),
('Busca Bem-sucedida', 'Percentual de buscas com resultados úteis', '(sucessos/total)*100', '%', 90.0, 'monthly');

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE itil_artigos_conhecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE itil_artigos_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE itil_revisao_artigos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itil_aprovacao_artigos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itil_visualizacoes_artigos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itil_busca_conhecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE itil_sugestoes_conhecimento ENABLE ROW LEVEL SECURITY;

-- Políticas para artigos
CREATE POLICY "Usuários podem ver artigos publicados" ON itil_artigos_conhecimento
    FOR SELECT USING (status = 'published' OR auth.uid() = autor_id);

CREATE POLICY "Autores podem criar artigos" ON itil_artigos_conhecimento
    FOR INSERT WITH CHECK (auth.uid() = autor_id);

CREATE POLICY "Autores e revisores podem editar artigos" ON itil_artigos_conhecimento
    FOR UPDATE USING (
        auth.uid() = autor_id OR 
        auth.uid() = revisor_id OR 
        auth.uid() = aprovador_id
    );

-- Políticas para histórico
CREATE POLICY "Usuários podem ver histórico de artigos" ON itil_artigos_historico
    FOR SELECT USING (true);

-- Políticas para revisão
CREATE POLICY "Revisores podem gerenciar revisões" ON itil_revisao_artigos
    FOR ALL USING (auth.uid() = revisor_id);

-- Políticas para aprovação
CREATE POLICY "Aprovadores podem gerenciar aprovações" ON itil_aprovacao_artigos
    FOR ALL USING (auth.uid() = aprovador_id);

-- Políticas para visualizações
CREATE POLICY "Usuários podem registrar visualizações" ON itil_visualizacoes_artigos
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem ver suas visualizações" ON itil_visualizacoes_artigos
    FOR SELECT USING (auth.uid() = usuario_id);

-- Políticas para busca
CREATE POLICY "Usuários podem registrar buscas" ON itil_busca_conhecimento
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem ver suas buscas" ON itil_busca_conhecimento
    FOR SELECT USING (auth.uid() = usuario_id);

-- Políticas para sugestões
CREATE POLICY "Usuários podem ver sugestões" ON itil_sugestoes_conhecimento
    FOR SELECT USING (true);

CREATE POLICY "Usuários podem gerenciar sugestões" ON itil_sugestoes_conhecimento
    FOR ALL USING (auth.uid() = usuario_id); 