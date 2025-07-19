-- =====================================================
-- MILAPP MedSênior - Indexação Semântica com pgvector
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- Habilitar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- 1. TABELA DE MEMÓRIA VETORIAL
-- =====================================================

CREATE TABLE IF NOT EXISTS public.memory_vectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('conversation', 'document', 'decision', 'analysis', 'requirement')),
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI embedding dimension
    metadata JSONB DEFAULT '{}',
    similarity_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índices para performance
    CONSTRAINT valid_content CHECK (length(content) > 0)
);

-- Índices para busca eficiente
CREATE INDEX IF NOT EXISTS idx_memory_vectors_project_id ON public.memory_vectors(project_id);
CREATE INDEX IF NOT EXISTS idx_memory_vectors_type ON public.memory_vectors(type);
CREATE INDEX IF NOT EXISTS idx_memory_vectors_created_at ON public.memory_vectors(created_at);
CREATE INDEX IF NOT EXISTS idx_memory_vectors_embedding ON public.memory_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- =====================================================
-- 2. FUNÇÕES PARA GESTÃO DE MEMÓRIA VETORIAL
-- =====================================================

-- Função para armazenar memória com embedding
CREATE OR REPLACE FUNCTION public.store_memory(
    p_project_id UUID,
    p_type VARCHAR(50),
    p_content TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    memory_id UUID;
    embedding_vector VECTOR(1536);
BEGIN
    -- Gerar embedding usando função local (simulada)
    -- Em produção, isso seria uma chamada para OpenAI ou similar
    embedding_vector := public.generate_embedding(p_content);
    
    -- Inserir memória
    INSERT INTO public.memory_vectors (
        project_id,
        type,
        content,
        embedding,
        metadata
    ) VALUES (
        p_project_id,
        p_type,
        p_content,
        embedding_vector,
        p_metadata
    ) RETURNING id INTO memory_id;
    
    RETURN memory_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar memórias similares
CREATE OR REPLACE FUNCTION public.search_memories(
    p_project_id UUID,
    p_query TEXT,
    p_limit INTEGER DEFAULT 5,
    p_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    type VARCHAR(50),
    content TEXT,
    similarity_score FLOAT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    query_embedding VECTOR(1536);
BEGIN
    -- Gerar embedding da query
    query_embedding := public.generate_embedding(p_query);
    
    -- Buscar memórias similares
    RETURN QUERY
    SELECT 
        mv.id,
        mv.type,
        mv.content,
        1 - (mv.embedding <=> query_embedding) as similarity_score,
        mv.metadata,
        mv.created_at
    FROM public.memory_vectors mv
    WHERE mv.project_id = p_project_id
    AND 1 - (mv.embedding <=> query_embedding) >= p_threshold
    ORDER BY mv.embedding <=> query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para gerar embedding (simulada)
-- Em produção, isso seria integrado com OpenAI, Cohere, ou similar
CREATE OR REPLACE FUNCTION public.generate_embedding(text_content TEXT)
RETURNS VECTOR(1536) AS $$
DECLARE
    embedding_vector VECTOR(1536);
    words TEXT[];
    word TEXT;
    hash_val INTEGER;
    i INTEGER := 1;
BEGIN
    -- Simular geração de embedding baseada em hash do conteúdo
    -- Em produção, substituir por chamada real para API de embedding
    
    -- Dividir texto em palavras
    words := string_to_array(lower(text_content), ' ');
    
    -- Inicializar vetor
    embedding_vector := array_fill(0.0, ARRAY[1536])::vector;
    
    -- Gerar valores pseudo-aleatórios baseados no conteúdo
    FOR word IN SELECT unnest(words) LOOP
        hash_val := abs(hashtext(word));
        
        -- Distribuir valores pelo vetor
        FOR j IN 1..10 LOOP
            i := (hash_val + j) % 1536 + 1;
            embedding_vector[i] := embedding_vector[i] + (hash_val % 100) / 1000.0;
        END LOOP;
    END LOOP;
    
    -- Normalizar vetor
    embedding_vector := embedding_vector / sqrt(embedding_vector * embedding_vector);
    
    RETURN embedding_vector;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar memórias antigas
CREATE OR REPLACE FUNCTION public.cleanup_old_memories(
    p_days INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.memory_vectors 
    WHERE created_at < NOW() - INTERVAL '1 day' * p_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de memória
CREATE OR REPLACE FUNCTION public.get_memory_stats(p_project_id UUID)
RETURNS TABLE (
    total_memories INTEGER,
    memories_by_type JSONB,
    avg_similarity_score FLOAT,
    oldest_memory TIMESTAMP WITH TIME ZONE,
    newest_memory TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_memories,
        jsonb_object_agg(mv.type, COUNT(*)) as memories_by_type,
        AVG(mv.similarity_score) as avg_similarity_score,
        MIN(mv.created_at) as oldest_memory,
        MAX(mv.created_at) as newest_memory
    FROM public.memory_vectors mv
    WHERE mv.project_id = p_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. TABELA DE CONVERSAS COM IA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    context_memories UUID[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para conversas
CREATE INDEX IF NOT EXISTS idx_ai_conversations_project_id ON public.ai_conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session_id ON public.ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_created_at ON public.ai_conversations(created_at);

-- =====================================================
-- 4. FUNÇÕES PARA GESTÃO DE CONVERSAS
-- =====================================================

-- Função para armazenar conversa e gerar memória
CREATE OR REPLACE FUNCTION public.store_conversation(
    p_project_id UUID,
    p_user_id UUID,
    p_session_id VARCHAR(255),
    p_message_type VARCHAR(20),
    p_content TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
    memory_id UUID;
BEGIN
    -- Inserir conversa
    INSERT INTO public.ai_conversations (
        project_id,
        user_id,
        session_id,
        message_type,
        content,
        metadata
    ) VALUES (
        p_project_id,
        p_user_id,
        p_session_id,
        p_message_type,
        p_content,
        p_metadata
    ) RETURNING id INTO conversation_id;
    
    -- Gerar memória vetorial para mensagens do assistente
    IF p_message_type = 'assistant' THEN
        memory_id := public.store_memory(
            p_project_id,
            'conversation',
            p_content,
            jsonb_build_object(
                'session_id', p_session_id,
                'user_id', p_user_id,
                'conversation_id', conversation_id
            )
        );
    END IF;
    
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar contexto de conversa
CREATE OR REPLACE FUNCTION public.get_conversation_context(
    p_project_id UUID,
    p_query TEXT,
    p_session_id VARCHAR(255) DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    content TEXT,
    similarity_score FLOAT,
    source_type VARCHAR(50),
    source_id UUID
) AS $$
BEGIN
    -- Buscar memórias similares
    RETURN QUERY
    SELECT 
        mv.content,
        ms.similarity_score,
        mv.type as source_type,
        mv.id as source_id
    FROM public.search_memories(p_project_id, p_query, p_limit, 0.5) ms
    JOIN public.memory_vectors mv ON mv.id = ms.id
    
    UNION ALL
    
    -- Buscar conversas recentes da sessão
    SELECT 
        ac.content,
        0.8 as similarity_score,
        'conversation' as source_type,
        ac.id as source_id
    FROM public.ai_conversations ac
    WHERE ac.project_id = p_project_id
    AND (p_session_id IS NULL OR ac.session_id = p_session_id)
    AND ac.created_at > NOW() - INTERVAL '1 hour'
    ORDER BY ac.created_at DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. TABELA DE MODELOS DE IA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'local', etc.
    model_type VARCHAR(50) NOT NULL, -- 'chat', 'embedding', 'completion'
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir modelos padrão
INSERT INTO public.ai_models (name, provider, model_type, config) VALUES
('gpt-4', 'openai', 'chat', '{"max_tokens": 4000, "temperature": 0.7}'),
('gpt-3.5-turbo', 'openai', 'chat', '{"max_tokens": 2000, "temperature": 0.7}'),
('text-embedding-ada-002', 'openai', 'embedding', '{"dimensions": 1536}'),
('claude-3-sonnet', 'anthropic', 'chat', '{"max_tokens": 4000, "temperature": 0.7}'),
('local-llama', 'local', 'chat', '{"max_tokens": 2000, "temperature": 0.7}')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 6. FUNÇÕES PARA GESTÃO DE MODELOS
-- =====================================================

-- Função para obter modelo ativo
CREATE OR REPLACE FUNCTION public.get_active_model(p_model_type VARCHAR(50))
RETURNS TABLE (
    id UUID,
    name VARCHAR(100),
    provider VARCHAR(50),
    config JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        am.id,
        am.name,
        am.provider,
        am.config
    FROM public.ai_models am
    WHERE am.model_type = p_model_type
    AND am.is_active = true
    ORDER BY am.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. TRIGGERS PARA AUTOMAÇÃO
-- =====================================================

-- Trigger para atualizar timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_memory_vectors_updated_at
    BEFORE UPDATE ON public.memory_vectors
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_update_ai_models_updated_at
    BEFORE UPDATE ON public.ai_models
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- 8. VIEWS PARA RELATÓRIOS
-- =====================================================

-- View para estatísticas de IA por projeto
CREATE OR REPLACE VIEW public.ai_project_stats AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    COUNT(DISTINCT mv.id) as total_memories,
    COUNT(DISTINCT ac.session_id) as conversation_sessions,
    COUNT(ac.id) as total_messages,
    MAX(ac.created_at) as last_conversation,
    AVG(mv.similarity_score) as avg_memory_relevance
FROM public.projects p
LEFT JOIN public.memory_vectors mv ON p.id = mv.project_id
LEFT JOIN public.ai_conversations ac ON p.id = ac.project_id
GROUP BY p.id, p.name;

-- View para memórias mais relevantes
CREATE OR REPLACE VIEW public.top_memories AS
SELECT 
    mv.id,
    mv.project_id,
    p.name as project_name,
    mv.type,
    mv.content,
    mv.similarity_score,
    mv.created_at,
    ROW_NUMBER() OVER (PARTITION BY mv.project_id ORDER BY mv.similarity_score DESC) as rank_in_project
FROM public.memory_vectors mv
JOIN public.projects p ON mv.project_id = p.id
WHERE mv.similarity_score IS NOT NULL;

-- =====================================================
-- 9. FUNÇÕES DE MANUTENÇÃO
-- =====================================================

-- Função para otimizar índices vetoriais
CREATE OR REPLACE FUNCTION public.optimize_vector_indexes()
RETURNS VOID AS $$
BEGIN
    -- Reconstruir índice vetorial
    REINDEX INDEX CONCURRENTLY idx_memory_vectors_embedding;
    
    -- Analisar tabelas
    ANALYZE public.memory_vectors;
    ANALYZE public.ai_conversations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para backup de memórias
CREATE OR REPLACE FUNCTION public.backup_memories(p_backup_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
DECLARE
    backup_count INTEGER;
BEGIN
    -- Criar tabela de backup
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.memory_vectors_backup_%s AS 
        SELECT * FROM public.memory_vectors 
        WHERE DATE(created_at) <= %L
    ', to_char(p_backup_date, 'YYYYMMDD'), p_backup_date);
    
    GET DIAGNOSTICS backup_count = ROW_COUNT;
    
    RETURN backup_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.memory_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

-- Políticas para memory_vectors
CREATE POLICY "memory_vectors_project_access" ON public.memory_vectors
    FOR ALL USING (
        public.check_permission(
            (SELECT role FROM public.users WHERE email = auth.email()), 
            'ai', 
            'read'
        )
    );

-- Políticas para ai_conversations
CREATE POLICY "ai_conversations_project_access" ON public.ai_conversations
    FOR ALL USING (
        public.check_permission(
            (SELECT role FROM public.users WHERE email = auth.email()), 
            'ai', 
            'read'
        )
    );

-- Políticas para ai_models (apenas admin)
CREATE POLICY "ai_models_admin_only" ON public.ai_models
    FOR ALL USING (
        (SELECT role FROM public.users WHERE email = auth.email()) = 'medsenior_admin'
    );

-- =====================================================
-- 11. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.memory_vectors IS 'Memórias vetoriais para IA contextualizada';
COMMENT ON TABLE public.ai_conversations IS 'Histórico de conversas com IA assistente';
COMMENT ON TABLE public.ai_models IS 'Configuração de modelos de IA disponíveis';

COMMENT ON FUNCTION public.store_memory IS 'Armazena memória com embedding vetorial';
COMMENT ON FUNCTION public.search_memories IS 'Busca memórias similares usando similaridade vetorial';
COMMENT ON FUNCTION public.generate_embedding IS 'Gera embedding vetorial do texto (simulado)';
COMMENT ON FUNCTION public.get_conversation_context IS 'Obtém contexto para conversas com IA';

-- =====================================================
-- FIM DA MIGRAÇÃO PGVECTOR
-- ===================================================== 