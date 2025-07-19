-- =====================================================
-- MILAPP MedSênior - Infraestrutura de IA para Qualidade
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. EXTENSÃO PGVECTOR (se não existir)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- 2. BASE DE CONHECIMENTO VETORIAL
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Metadados do documento
    title VARCHAR(255) NOT NULL,
    doc_type VARCHAR(50) NOT NULL CHECK (doc_type IN (
        'pop', 'it', 'procedimento', 'manual', 'norma', 'formulario', 'checklist'
    )),
    category VARCHAR(100),
    department VARCHAR(100),
    process VARCHAR(100),
    
    -- Conteúdo
    content TEXT NOT NULL,
    content_summary TEXT,
    
    -- Vetores de embedding
    embedding vector(1536), -- OpenAI ada-002
    embedding_updated_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadados de processamento
    tokens_count INTEGER,
    processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN (
        'pending', 'processing', 'completed', 'failed'
    )),
    
    -- Referências
    source_document_id UUID REFERENCES public.quality_documents(id),
    version VARCHAR(20),
    
    -- Controle de acesso
    is_public BOOLEAN DEFAULT false,
    access_roles TEXT[],
    
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_project_id ON public.ai_knowledge_base(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_doc_type ON public.ai_knowledge_base(doc_type);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_department ON public.ai_knowledge_base(department);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_base_embedding ON public.ai_knowledge_base USING ivfflat (embedding vector_cosine_ops);

-- =====================================================
-- 3. LOGS DE INTERAÇÕES COM IA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_quality_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Contexto da interação
    session_id VARCHAR(100),
    thread_id VARCHAR(100),
    user_id UUID REFERENCES public.users(id),
    user_role VARCHAR(50),
    
    -- Tipo de operação
    operation_type VARCHAR(50) NOT NULL CHECK (operation_type IN (
        'document_generation', 'nc_analysis', 'document_review', 'action_plan', 
        'kpi_analysis', 'audit_assistance', 'training_plan'
    )),
    
    -- Entrada e saída
    input_data JSONB NOT NULL,
    output_data JSONB,
    prompt_used TEXT,
    
    -- Contexto e referências
    context_documents UUID[], -- IDs de documentos relevantes
    knowledge_base_hits INTEGER, -- Quantos documentos similares foram encontrados
    
    -- Métricas
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    confidence_score DECIMAL(3,2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'processing' CHECK (status IN (
        'processing', 'completed', 'failed', 'reviewed', 'approved'
    )),
    
    -- Feedback
    user_feedback TEXT,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_quality_logs_project_id ON public.ai_quality_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_quality_logs_operation_type ON public.ai_quality_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_ai_quality_logs_user_id ON public.ai_quality_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_quality_logs_created_at ON public.ai_quality_logs(created_at);

-- =====================================================
-- 4. TEMPLATES DE PROMPTS ESTRUTURADOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_prompt_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    version VARCHAR(20) DEFAULT '1.0',
    
    -- Categoria
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'document_generation', 'analysis', 'review', 'classification', 'planning'
    )),
    
    -- Template
    prompt_template TEXT NOT NULL,
    variables JSONB, -- Definição das variáveis esperadas
    
    -- Configurações
    model VARCHAR(50) DEFAULT 'gpt-4',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    
    -- Controle
    is_active BOOLEAN DEFAULT true,
    requires_knowledge_base BOOLEAN DEFAULT false,
    
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_prompt_templates_category ON public.ai_prompt_templates(category);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_templates_active ON public.ai_prompt_templates(is_active);

-- =====================================================
-- 5. SESSÕES DE IA CONTEXTUAL
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ai_quality_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    
    -- Identificação
    session_name VARCHAR(255),
    session_type VARCHAR(50) NOT NULL CHECK (session_type IN (
        'document_creation', 'nc_analysis', 'audit_preparation', 'training_planning'
    )),
    
    -- Contexto
    context_summary TEXT,
    relevant_documents UUID[],
    knowledge_base_context JSONB,
    
    -- Estado
    current_step VARCHAR(100),
    progress_percentage INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN (
        'active', 'paused', 'completed', 'cancelled'
    )),
    
    -- Participantes
    owner_id UUID REFERENCES public.users(id),
    participants UUID[],
    
    -- Controle de tempo
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_ai_quality_sessions_project_id ON public.ai_quality_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_quality_sessions_owner_id ON public.ai_quality_sessions(owner_id);
CREATE INDEX IF NOT EXISTS idx_ai_quality_sessions_status ON public.ai_quality_sessions(status);

-- =====================================================
-- 6. FUNÇÕES PARA GESTÃO DE CONHECIMENTO
-- =====================================================

-- Função para armazenar conhecimento na base vetorial
CREATE OR REPLACE FUNCTION public.store_knowledge(
    p_title VARCHAR(255),
    p_content TEXT,
    p_doc_type VARCHAR(50),
    p_project_id UUID DEFAULT NULL,
    p_category VARCHAR(100) DEFAULT NULL,
    p_department VARCHAR(100) DEFAULT NULL,
    p_process VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    knowledge_id UUID;
    embedding_vector vector(1536);
BEGIN
    -- Gerar embedding via OpenAI (simulado - em produção chamaria API)
    -- embedding_vector := openai_embedding(p_content);
    
    -- Por enquanto, usar vetor zero (será atualizado pelo processamento assíncrono)
    embedding_vector := array_fill(0::real, ARRAY[1536]);
    
    -- Inserir na base de conhecimento
    INSERT INTO public.ai_knowledge_base (
        title,
        content,
        doc_type,
        project_id,
        category,
        department,
        process,
        embedding,
        processing_status
    ) VALUES (
        p_title,
        p_content,
        p_doc_type,
        p_project_id,
        p_category,
        p_department,
        p_process,
        embedding_vector,
        'pending'
    ) RETURNING id INTO knowledge_id;
    
    -- Disparar processamento assíncrono para gerar embedding real
    PERFORM public.process_knowledge_embedding(knowledge_id);
    
    RETURN knowledge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar conhecimento similar
CREATE OR REPLACE FUNCTION public.search_similar_knowledge(
    p_query TEXT,
    p_project_id UUID DEFAULT NULL,
    p_doc_type VARCHAR(50) DEFAULT NULL,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    doc_type VARCHAR(50),
    content_summary TEXT,
    similarity_score REAL,
    department VARCHAR(100),
    process VARCHAR(100)
) AS $$
DECLARE
    query_embedding vector(1536);
BEGIN
    -- Gerar embedding da query (simulado)
    -- query_embedding := openai_embedding(p_query);
    query_embedding := array_fill(0::real, ARRAY[1536]);
    
    RETURN QUERY
    SELECT 
        kb.id,
        kb.title,
        kb.doc_type,
        kb.content_summary,
        1 - (kb.embedding <=> query_embedding) as similarity_score,
        kb.department,
        kb.process
    FROM public.ai_knowledge_base kb
    WHERE kb.processing_status = 'completed'
    AND (p_project_id IS NULL OR kb.project_id = p_project_id)
    AND (p_doc_type IS NULL OR kb.doc_type = p_doc_type)
    ORDER BY kb.embedding <=> query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. FUNÇÕES PARA PROMPT ENGINEERING
-- =====================================================

-- Função para obter prompt estruturado
CREATE OR REPLACE FUNCTION public.get_structured_prompt(
    p_template_name VARCHAR(100),
    p_variables JSONB
)
RETURNS TEXT AS $$
DECLARE
    template_record RECORD;
    final_prompt TEXT;
    var_key TEXT;
    var_value TEXT;
BEGIN
    -- Buscar template
    SELECT * INTO template_record
    FROM public.ai_prompt_templates
    WHERE name = p_template_name
    AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template % não encontrado ou inativo', p_template_name;
    END IF;
    
    final_prompt := template_record.prompt_template;
    
    -- Substituir variáveis
    FOR var_key, var_value IN SELECT * FROM jsonb_each_text(p_variables)
    LOOP
        final_prompt := replace(final_prompt, '{' || var_key || '}', var_value);
    END LOOP;
    
    RETURN final_prompt;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para análise de NC com IA
CREATE OR REPLACE FUNCTION public.analyze_nonconformity_ai(
    p_nc_description TEXT,
    p_process VARCHAR(100),
    p_department VARCHAR(100),
    p_project_id UUID
)
RETURNS JSONB AS $$
DECLARE
    analysis_result JSONB;
    similar_docs JSONB;
    context_prompt TEXT;
    final_prompt TEXT;
BEGIN
    -- Buscar documentos similares
    SELECT jsonb_agg(
        jsonb_build_object(
            'title', kb.title,
            'content', kb.content_summary,
            'type', kb.doc_type
        )
    ) INTO similar_docs
    FROM public.search_similar_knowledge(p_nc_description, p_project_id, 'pop', 3);
    
    -- Construir contexto
    context_prompt := '';
    IF similar_docs IS NOT NULL THEN
        context_prompt := 'Documentos relacionados encontrados: ' || similar_docs::text;
    END IF;
    
    -- Obter prompt estruturado
    final_prompt := public.get_structured_prompt('nc_analysis', jsonb_build_object(
        'description', p_nc_description,
        'process', p_process,
        'department', p_department,
        'context', context_prompt
    ));
    
    -- Simular análise da IA (em produção chamaria OpenAI)
    analysis_result := jsonb_build_object(
        'classification', CASE 
            WHEN p_nc_description ILIKE '%procedimento%' THEN 'procedimento'
            WHEN p_nc_description ILIKE '%conduta%' THEN 'conduta'
            WHEN p_nc_description ILIKE '%sistema%' THEN 'sistema'
            ELSE 'outro'
        END,
        'severity', CASE 
            WHEN p_nc_description ILIKE '%critic%' THEN 'critica'
            WHEN p_nc_description ILIKE '%grave%' THEN 'alta'
            WHEN p_nc_description ILIKE '%leve%' THEN 'baixa'
            ELSE 'media'
        END,
        'action_plan', jsonb_build_object(
            'what', 'Implementar correção baseada na análise',
            'why', 'Para resolver a não conformidade identificada',
            'who', 'Responsável pelo processo',
            'where', p_department,
            'when', 'Dentro de 30 dias',
            'how', 'Seguir procedimento de correção',
            'how_much', '0'
        ),
        'similar_documents', similar_docs,
        'confidence_score', 0.85
    );
    
    RETURN analysis_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para geração de POP com IA
CREATE OR REPLACE FUNCTION public.generate_pop_ai(
    p_title VARCHAR(255),
    p_objective TEXT,
    p_department VARCHAR(100),
    p_materials TEXT,
    p_steps TEXT,
    p_project_id UUID
)
RETURNS JSONB AS $$
DECLARE
    pop_result JSONB;
    similar_pops JSONB;
    context_prompt TEXT;
    final_prompt TEXT;
BEGIN
    -- Buscar POPs similares
    SELECT jsonb_agg(
        jsonb_build_object(
            'title', kb.title,
            'content', kb.content_summary
        )
    ) INTO similar_pops
    FROM public.search_similar_knowledge(p_title, p_project_id, 'pop', 3);
    
    -- Construir contexto
    context_prompt := '';
    IF similar_pops IS NOT NULL THEN
        context_prompt := 'POPs similares encontrados: ' || similar_pops::text;
    END IF;
    
    -- Obter prompt estruturado
    final_prompt := public.get_structured_prompt('pop_generation', jsonb_build_object(
        'title', p_title,
        'objective', p_objective,
        'department', p_department,
        'materials', p_materials,
        'steps', p_steps,
        'context', context_prompt
    ));
    
    -- Simular geração da IA
    pop_result := jsonb_build_object(
        'pop_content', jsonb_build_object(
            'objetivo', p_objective,
            'responsaveis', p_department,
            'materiais', p_materials,
            'procedimento', p_steps,
            'referencias', 'Baseado em POPs similares da organização'
        ),
        'similar_pops', similar_pops,
        'confidence_score', 0.90,
        'suggestions', jsonb_build_array(
            'Considerar adicionar medidas de segurança',
            'Incluir pontos de verificação',
            'Definir responsabilidades específicas'
        )
    );
    
    RETURN pop_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. FUNÇÕES PARA REVISÃO E VALIDAÇÃO
-- =====================================================

-- Função para revisão de documento com IA
CREATE OR REPLACE FUNCTION public.review_document_ai(
    p_document_content TEXT,
    p_document_type VARCHAR(50),
    p_project_id UUID
)
RETURNS JSONB AS $$
DECLARE
    review_result JSONB;
    similar_docs JSONB;
    final_prompt TEXT;
BEGIN
    -- Buscar documentos similares para comparação
    SELECT jsonb_agg(
        jsonb_build_object(
            'title', kb.title,
            'content', kb.content_summary
        )
    ) INTO similar_docs
    FROM public.search_similar_knowledge(p_document_content, p_project_id, p_document_type, 3);
    
    -- Obter prompt de revisão
    final_prompt := public.get_structured_prompt('document_review', jsonb_build_object(
        'content', p_document_content,
        'type', p_document_type,
        'similar_documents', similar_docs::text
    ));
    
    -- Simular revisão da IA
    review_result := jsonb_build_object(
        'overall_score', 8.5,
        'issues', jsonb_build_array(
            jsonb_build_object(
                'type', 'clareza',
                'description', 'Algumas seções podem ser mais claras',
                'suggestion', 'Reescrever com linguagem mais direta'
            ),
            jsonb_build_object(
                'type', 'completude',
                'description', 'Faltam informações sobre responsabilidades',
                'suggestion', 'Adicionar seção de responsabilidades'
            )
        ),
        'improvements', jsonb_build_array(
            'Adicionar exemplos práticos',
            'Incluir fluxograma do processo',
            'Definir critérios de sucesso'
        ),
        'compliance_check', jsonb_build_object(
            'is_compliant', true,
            'missing_elements', jsonb_build_array(),
            'recommendations', jsonb_build_array('Documento atende aos padrões da organização')
        ),
        'similar_documents', similar_docs
    );
    
    RETURN review_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. FUNÇÕES PARA LOGGING E AUDITORIA
-- =====================================================

-- Função para registrar interação com IA
CREATE OR REPLACE FUNCTION public.log_ai_interaction(
    p_operation_type VARCHAR(50),
    p_input_data JSONB,
    p_output_data JSONB,
    p_project_id UUID DEFAULT NULL,
    p_session_id VARCHAR(100) DEFAULT NULL,
    p_thread_id VARCHAR(100) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    user_role VARCHAR(50);
BEGIN
    -- Obter papel do usuário atual
    SELECT role INTO user_role
    FROM public.user_roles
    WHERE user_id = auth.uid()
    AND (p_project_id IS NULL OR project_id = p_project_id)
    AND is_active = true
    ORDER BY 
        CASE role 
            WHEN 'superadmin' THEN 1
            WHEN 'gestor_global' THEN 2
            WHEN 'gestor_qualidade' THEN 3
            WHEN 'gestor' THEN 4
            ELSE 5
        END
    LIMIT 1;
    
    -- Inserir log
    INSERT INTO public.ai_quality_logs (
        project_id,
        session_id,
        thread_id,
        user_id,
        user_role,
        operation_type,
        input_data,
        output_data,
        status,
        tokens_used,
        processing_time_ms
    ) VALUES (
        p_project_id,
        p_session_id,
        p_thread_id,
        auth.uid(),
        user_role,
        p_operation_type,
        p_input_data,
        p_output_data,
        'completed',
        jsonb_array_length(p_output_data) * 10, -- Estimativa
        500 -- Estimativa
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. DADOS INICIAIS - TEMPLATES DE PROMPTS
-- =====================================================

-- Template para análise de NC
INSERT INTO public.ai_prompt_templates (name, description, category, prompt_template, variables) VALUES
('nc_analysis', 'Análise de não conformidade com classificação e plano de ação', 'analysis',
'Você é um especialista em gestão da qualidade da MedSênior.

Com base no relato abaixo, classifique a não conformidade, determine a gravidade e gere um plano de ação 5W2H.

RELATO: {description}
PROCESSO RELACIONADO: {process}
ÁREA ENVOLVIDA: {department}

CONTEXTO DOCUMENTAL: {context}

Retorne sua análise em formato JSON estruturado:
{
  "classification": "procedimento|conduta|estrutura|sistema|equipamento|material|outro",
  "severity": "baixa|media|alta|critica",
  "justification": "explicação da classificação",
  "action_plan": {
    "what": "o que será feito",
    "why": "por que será feito",
    "who": "quem fará",
    "where": "onde será feito", 
    "when": "quando será feito",
    "how": "como será feito",
    "how_much": "quanto custará"
  },
  "similar_documents": "referências a documentos similares",
  "confidence_score": 0.85
}',
'{"description": "string", "process": "string", "department": "string", "context": "string"}'
),

-- Template para geração de POP
('pop_generation', 'Geração de Procedimento Operacional Padrão', 'document_generation',
'Você é um especialista em qualidade da MedSênior.

Com base nas informações fornecidas, gere um POP (Procedimento Operacional Padrão) completo e estruturado.

TÍTULO: {title}
OBJETIVO: {objective}
DEPARTAMENTO: {department}
MATERIAIS: {materials}
ETAPAS: {steps}

CONTEXTO DOCUMENTAL: {context}

Estrutura do POP:
1. OBJETIVO
2. ESCOPO
3. RESPONSÁVEIS
4. MATERIAIS E EQUIPAMENTOS
5. PROCEDIMENTO
6. CONTROLES E VERIFICAÇÕES
7. DOCUMENTAÇÃO
8. REFERÊNCIAS

Gere o POP completo seguindo as melhores práticas da MedSênior.',
'{"title": "string", "objective": "string", "department": "string", "materials": "string", "steps": "string", "context": "string"}'
),

-- Template para revisão de documento
('document_review', 'Revisão crítica de documentos com IA', 'review',
'Você é um especialista em qualidade da MedSênior.

Revise o seguinte documento e forneça uma análise crítica completa:

TIPO DE DOCUMENTO: {type}
CONTEÚDO: {content}

DOCUMENTOS SIMILARES: {similar_documents}

Forneça sua análise em formato JSON:
{
  "overall_score": 8.5,
  "issues": [
    {
      "type": "clareza|completude|consistencia|conformidade",
      "description": "descrição do problema",
      "suggestion": "sugestão de melhoria"
    }
  ],
  "improvements": ["sugestão 1", "sugestão 2"],
  "compliance_check": {
    "is_compliant": true,
    "missing_elements": [],
    "recommendations": []
  }
}',
'{"type": "string", "content": "string", "similar_documents": "string"}'
)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 11. TRIGGERS E AUTOMAÇÕES
-- =====================================================

-- Trigger para processar embeddings automaticamente
CREATE OR REPLACE FUNCTION public.process_knowledge_embedding(p_knowledge_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Em produção, aqui seria chamada a API da OpenAI
    -- Por enquanto, apenas marcar como processado
    UPDATE public.ai_knowledge_base
    SET 
        processing_status = 'completed',
        embedding_updated_at = NOW(),
        tokens_count = 1000 -- Estimativa
    WHERE id = p_knowledge_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamps
CREATE TRIGGER trigger_update_ai_knowledge_base_updated_at
    BEFORE UPDATE ON public.ai_knowledge_base
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trigger_update_ai_prompt_templates_updated_at
    BEFORE UPDATE ON public.ai_prompt_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- 12. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.ai_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_quality_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_quality_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para base de conhecimento
CREATE POLICY "ai_knowledge_base_quality_access" ON public.ai_knowledge_base
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.project_id = ai_knowledge_base.project_id
            AND ur.role IN ('superadmin', 'gestor_global', 'gestor_qualidade')
            AND ur.is_active = true
        )
    );

-- Políticas para logs de IA
CREATE POLICY "ai_quality_logs_quality_access" ON public.ai_quality_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.project_id = ai_quality_logs.project_id
            AND ur.role IN ('superadmin', 'gestor_global', 'gestor_qualidade')
            AND ur.is_active = true
        )
    );

-- Políticas para templates (apenas superadmin)
CREATE POLICY "ai_prompt_templates_superadmin_access" ON public.ai_prompt_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'superadmin'
            AND ur.is_active = true
        )
    );

-- =====================================================
-- FIM DA MIGRAÇÃO DE INFRAESTRUTURA DE IA
-- ===================================================== 