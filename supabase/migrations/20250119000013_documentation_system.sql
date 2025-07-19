-- =====================================================
-- MILAPP MedSênior - Sistema de Documentação Integrada
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. TABELA DE DOCUMENTAÇÃO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.documentation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    
    -- Conteúdo
    content TEXT NOT NULL,
    content_html TEXT,
    summary TEXT,
    
    -- Metadados
    tags TEXT[],
    difficulty_level VARCHAR(20) DEFAULT 'beginner' CHECK (difficulty_level IN (
        'beginner', 'intermediate', 'advanced', 'expert'
    )),
    
    -- Relacionamentos
    parent_doc_id UUID REFERENCES public.documentation(id),
    related_docs UUID[],
    
    -- SEO e busca
    search_keywords TEXT[],
    meta_description TEXT,
    
    -- Controle de versão
    version VARCHAR(20) DEFAULT '1.0.0',
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    
    -- Estatísticas
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- Controle
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_documentation_category ON public.documentation(category);
CREATE INDEX IF NOT EXISTS idx_documentation_slug ON public.documentation(slug);
CREATE INDEX IF NOT EXISTS idx_documentation_published ON public.documentation(is_published);
CREATE INDEX IF NOT EXISTS idx_documentation_search ON public.documentation USING GIN(search_keywords);

-- =====================================================
-- 2. TABELA DE TUTORIAIS INTERATIVOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.interactive_tutorials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    
    -- Configuração
    tutorial_config JSONB NOT NULL, -- Passos, validações, etc.
    target_role VARCHAR(50), -- solicitante, executor, gestor
    
    -- Progresso
    estimated_duration_minutes INTEGER DEFAULT 15,
    difficulty_level VARCHAR(20) DEFAULT 'beginner',
    
    -- Controle
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. TABELA DE PROGRESSO DE TUTORIAIS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tutorial_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    tutorial_id UUID REFERENCES public.interactive_tutorials(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Progresso
    current_step INTEGER DEFAULT 1,
    completed_steps INTEGER[],
    progress_percentage INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN (
        'not_started', 'in_progress', 'completed', 'abandoned'
    )),
    
    -- Dados de sessão
    session_data JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Feedback
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    
    UNIQUE(tutorial_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_user ON public.tutorial_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_status ON public.tutorial_progress(status);

-- =====================================================
-- 4. TABELA DE FAQ E SUPORTE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.faq_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    
    -- Metadados
    tags TEXT[],
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    
    -- Estatísticas
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    -- Controle
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_faq_category ON public.faq_entries(category);
CREATE INDEX IF NOT EXISTS idx_faq_priority ON public.faq_entries(priority);
CREATE INDEX IF NOT EXISTS idx_faq_active ON public.faq_entries(is_active);

-- =====================================================
-- 5. TABELA DE BUSCA SEMÂNTICA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.documentation_search (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Dados de busca
    search_query TEXT NOT NULL,
    search_results JSONB NOT NULL,
    search_filters JSONB DEFAULT '{}',
    
    -- Contexto
    user_id UUID REFERENCES public.users(id),
    user_role VARCHAR(50),
    user_department VARCHAR(100),
    
    -- Resultados
    clicked_result_id UUID,
    time_spent_seconds INTEGER,
    
    -- Feedback
    was_helpful BOOLEAN,
    feedback_comment TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_documentation_search_query ON public.documentation_search USING GIN(to_tsvector('portuguese', search_query));
CREATE INDEX IF NOT EXISTS idx_documentation_search_user ON public.documentation_search(user_id);

-- =====================================================
-- 6. FUNÇÕES DE DOCUMENTAÇÃO
-- =====================================================

-- Função para buscar documentação
CREATE OR REPLACE FUNCTION public.search_documentation(
    p_query TEXT,
    p_category VARCHAR(100) DEFAULT NULL,
    p_difficulty_level VARCHAR(20) DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    slug VARCHAR(255),
    category VARCHAR(100),
    summary TEXT,
    relevance_score NUMERIC,
    view_count INTEGER,
    helpful_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.slug,
        d.category,
        d.summary,
        ts_rank(
            to_tsvector('portuguese', d.title || ' ' || d.content || ' ' || array_to_string(d.search_keywords, ' ')),
            plainto_tsquery('portuguese', p_query)
        ) as relevance_score,
        d.view_count,
        d.helpful_count
    FROM public.documentation d
    WHERE d.is_published = true
    AND (
        p_category IS NULL OR d.category = p_category
    )
    AND (
        p_difficulty_level IS NULL OR d.difficulty_level = p_difficulty_level
    )
    AND (
        to_tsvector('portuguese', d.title || ' ' || d.content || ' ' || array_to_string(d.search_keywords, ' ')) @@ plainto_tsquery('portuguese', p_query)
        OR p_query = ANY(d.search_keywords)
    )
    ORDER BY relevance_score DESC, d.view_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Função para obter documentação contextual
CREATE OR REPLACE FUNCTION public.get_contextual_help(
    p_context VARCHAR(100),
    p_user_role VARCHAR(50) DEFAULT NULL,
    p_user_department VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    slug VARCHAR(255),
    category VARCHAR(100),
    summary TEXT,
    content_preview TEXT,
    relevance_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.slug,
        d.category,
        d.summary,
        LEFT(d.content, 200) || '...' as content_preview,
        CASE 
            WHEN p_context = ANY(d.tags) THEN 1.0
            WHEN p_user_role = ANY(d.tags) THEN 0.8
            WHEN p_user_department = ANY(d.tags) THEN 0.6
            ELSE 0.4
        END as relevance_score
    FROM public.documentation d
    WHERE d.is_published = true
    AND (
        p_context = ANY(d.tags)
        OR p_user_role = ANY(d.tags)
        OR p_user_department = ANY(d.tags)
        OR d.category = p_context
    )
    ORDER BY relevance_score DESC, d.view_count DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar visualização
CREATE OR REPLACE FUNCTION public.track_documentation_view(p_doc_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.documentation 
    SET view_count = view_count + 1
    WHERE id = p_doc_id;
    
    -- Registrar na busca se vier de uma busca
    -- (implementação futura)
END;
$$ LANGUAGE plpgsql;

-- Função para obter tutorial recomendado
CREATE OR REPLACE FUNCTION public.get_recommended_tutorial(
    p_user_role VARCHAR(50),
    p_user_department VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    description TEXT,
    category VARCHAR(100),
    estimated_duration_minutes INTEGER,
    difficulty_level VARCHAR(20),
    progress_percentage INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        it.id,
        it.title,
        it.description,
        it.category,
        it.estimated_duration_minutes,
        it.difficulty_level,
        COALESCE(tp.progress_percentage, 0) as progress_percentage
    FROM public.interactive_tutorials it
    LEFT JOIN public.tutorial_progress tp ON it.id = tp.tutorial_id AND tp.user_id = auth.uid()
    WHERE it.is_active = true
    AND (
        it.target_role = p_user_role
        OR it.target_role IS NULL
    )
    AND (
        tp.id IS NULL 
        OR tp.status IN ('not_started', 'in_progress')
    )
    ORDER BY it.is_featured DESC, it.difficulty_level ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Função para obter FAQ contextual
CREATE OR REPLACE FUNCTION public.get_contextual_faq(
    p_context VARCHAR(100),
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    question TEXT,
    answer TEXT,
    category VARCHAR(100),
    helpful_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.question,
        f.answer,
        f.category,
        f.helpful_count
    FROM public.faq_entries f
    WHERE f.is_active = true
    AND (
        p_context = ANY(f.tags)
        OR f.category = p_context
    )
    ORDER BY f.priority DESC, f.helpful_count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. DADOS INICIAIS DE DOCUMENTAÇÃO
-- =====================================================

-- Inserir documentação básica
INSERT INTO public.documentation (
    title,
    slug,
    category,
    content,
    summary,
    tags,
    difficulty_level,
    is_published,
    search_keywords
) VALUES 
(
    'Primeiros Passos no MILAPP',
    'primeiros-passos',
    'onboarding',
    '# Primeiros Passos no MILAPP

## Bem-vindo ao MILAPP!

O MILAPP é uma plataforma completa de gestão de processos e qualidade. Este guia irá ajudá-lo a começar.

### 1. Acessando o Sistema
- Use seu email corporativo para fazer login
- Seu perfil será configurado automaticamente baseado no seu departamento

### 2. Navegando pela Interface
- **Dashboard**: Visão geral dos seus projetos e tarefas
- **Projetos**: Gerencie seus projetos e workflows
- **Qualidade**: Acesse documentos, POPs e não conformidades
- **Workflows**: Crie e execute processos automatizados

### 3. Criando seu Primeiro Projeto
1. Clique em "Novo Projeto" no Dashboard
2. Preencha as informações básicas
3. Adicione membros da equipe
4. Configure as permissões

### 4. Usando a IA Assistiva
- A IA está disponível em todos os módulos
- Use para gerar documentos, analisar dados e criar workflows
- Sempre revise as sugestões antes de aplicar

### 5. Próximos Passos
- Complete o tutorial interativo do seu perfil
- Explore os templates disponíveis
- Conecte-se com outros usuários do seu departamento',
    
    'Guia completo para começar a usar o MILAPP',
    ARRAY['iniciante', 'onboarding', 'primeiros-passos'],
    'beginner',
    true,
    ARRAY['primeiros passos', 'iniciante', 'onboarding', 'tutorial', 'começar']
),
(
    'Criando Workflows com IA',
    'workflows-com-ia',
    'workflows',
    '# Criando Workflows com IA

## Automatize seus processos com inteligência artificial

### O que são Workflows?
Workflows são sequências automatizadas de tarefas que podem incluir:
- **Tarefas Humanas**: Requerem intervenção manual
- **Automações**: Executadas por bots ou integrações
- **IA**: Processamento inteligente de dados
- **Webhooks**: Integração com sistemas externos

### Criando um Workflow

#### 1. Método Manual
1. Acesse o módulo Workflows
2. Clique em "Novo Workflow"
3. Arraste e solte os nós necessários
4. Configure cada nó com os parâmetros
5. Conecte os nós para formar o fluxo
6. Valide e salve

#### 2. Método com IA (Recomendado)
1. Clique em "Gerar com IA"
2. Descreva o processo em linguagem natural
3. A IA criará automaticamente o workflow
4. Revise e ajuste conforme necessário
5. Salve e execute

### Exemplo de Descrição para IA
```
"Quero um processo que:
1. Recebe um formulário de solicitação
2. IA analisa a viabilidade
3. Se aprovado, envia para automação
4. Se rejeitado, vai para revisão humana
5. Notifica o solicitante do resultado"
```

### Tipos de Nós Disponíveis

#### Nós de Controle
- **Start**: Ponto de início
- **End**: Ponto de fim
- **Gateway**: Decisões e ramificações

#### Nós de Tarefa
- **Task Human**: Tarefas que requerem intervenção humana
- **Task Automation**: Execução automática
- **Task AI**: Processamento com inteligência artificial
- **Webhook**: Integração com sistemas externos
- **Document**: Geração de documentos
- **Delay**: Aguardar tempo
- **Notification**: Enviar notificações

### Validação e Testes
- Sempre valide o workflow antes de executar
- Use o botão "Testar Fluxo" para verificar conectividade
- Monitore as execuções em tempo real

### Dicas Importantes
- Mantenha workflows simples e claros
- Use nomes descritivos para nós e conexões
- Documente decisões importantes
- Teste em ambiente de desenvolvimento primeiro',
    
    'Aprenda a criar workflows automatizados usando IA',
    ARRAY['workflows', 'ia', 'automação', 'processos'],
    'intermediate',
    true,
    ARRAY['workflow', 'ia', 'automação', 'processo', 'bot', 'webhook']
),
(
    'Gestão de Qualidade com IA',
    'gestao-qualidade-ia',
    'qualidade',
    '# Gestão de Qualidade com IA

## Transforme sua gestão de qualidade com inteligência artificial

### Módulos de Qualidade

#### 1. Documentos
- Crie e gerencie documentos de qualidade
- Use IA para revisão automática
- Controle de versões integrado
- Busca semântica avançada

#### 2. POPs (Procedimentos Operacionais Padrão)
- Geração automática com IA
- Templates inteligentes
- Validação de conformidade
- Distribuição automática

#### 3. Não Conformidades
- Análise automática com IA
- Classificação inteligente
- Sugestões de ações corretivas
- Acompanhamento de prazos

#### 4. Planos de Ação
- Geração automática de planos PDCA
- Sugestões baseadas em histórico
- Acompanhamento de eficácia
- Relatórios automáticos

### Usando a IA para Qualidade

#### Revisão de Documentos
1. Faça upload do documento
2. Clique em "Revisar com IA"
3. A IA analisará:
   - Conformidade com normas
   - Clareza e objetividade
   - Sugestões de melhoria
   - Documentos similares

#### Geração de POPs
1. Descreva o processo
2. A IA gerará o POP completo
3. Revise e ajuste
4. Aprove e distribua

#### Análise de Não Conformidades
1. Registre a não conformidade
2. A IA classificará automaticamente
3. Sugerirá ações corretivas
4. Acompanhe a implementação

### KPIs e Relatórios
- Métricas automáticas de qualidade
- Tendências e análises preditivas
- Relatórios personalizados
- Dashboards em tempo real

### Integração com Sistemas
- Conecte com sistemas existentes
- Importe dados automaticamente
- Sincronize informações
- Mantenha consistência

### Dicas para Sucesso
- Use a IA como assistente, não substituto
- Sempre revise as sugestões
- Mantenha dados atualizados
- Treine a equipe adequadamente',
    
    'Aprenda a usar IA para melhorar sua gestão de qualidade',
    ARRAY['qualidade', 'ia', 'sgq', 'documentos', 'pops'],
    'intermediate',
    true,
    ARRAY['qualidade', 'ia', 'sgq', 'documento', 'pop', 'não conformidade']
);

-- Inserir FAQ básico
INSERT INTO public.faq_entries (
    question,
    answer,
    category,
    tags,
    priority,
    is_active
) VALUES 
(
    'Como faço login no MILAPP?',
    'Use seu email corporativo e senha. Se for seu primeiro acesso, use a opção "Esqueci minha senha" para criar uma nova.',
    'acesso',
    ARRAY['login', 'acesso', 'primeiro-acesso'],
    10,
    true
),
(
    'Como criar meu primeiro workflow?',
    'Acesse o módulo Workflows e clique em "Gerar com IA". Descreva o processo que deseja automatizar e a IA criará o workflow automaticamente.',
    'workflows',
    ARRAY['workflow', 'primeiro', 'ia'],
    9,
    true
),
(
    'A IA pode substituir o trabalho humano?',
    'Não. A IA é um assistente que ajuda a otimizar processos, mas decisões importantes e validações finais sempre devem ser feitas por humanos.',
    'ia',
    ARRAY['ia', 'humano', 'decisão'],
    8,
    true
),
(
    'Como solicitar suporte técnico?',
    'Use o botão "Ajuda" no canto da tela ou entre em contato com o suporte através do chat integrado.',
    'suporte',
    ARRAY['suporte', 'ajuda', 'contato'],
    7,
    true
);

-- Inserir tutoriais interativos
INSERT INTO public.interactive_tutorials (
    title,
    description,
    category,
    tutorial_config,
    target_role,
    estimated_duration_minutes,
    difficulty_level
) VALUES 
(
    'Primeiro Workflow - Solicitante',
    'Aprenda a criar seu primeiro workflow como solicitante',
    'workflows',
    '{
        "steps": [
            {
                "id": 1,
                "title": "Acessar o módulo Workflows",
                "description": "Clique no menu lateral em 'Workflows'",
                "validation": "check_page_url",
                "hint": "Procure pelo ícone de fluxograma no menu"
            },
            {
                "id": 2,
                "title": "Criar novo workflow",
                "description": "Clique no botão 'Novo Workflow'",
                "validation": "check_button_click",
                "hint": "O botão está no canto superior direito"
            },
            {
                "id": 3,
                "title": "Descrever o processo",
                "description": "Use o campo de texto para descrever o que deseja automatizar",
                "validation": "check_text_input",
                "hint": "Seja específico sobre as etapas do processo"
            },
            {
                "id": 4,
                "title": "Gerar com IA",
                "description": "Clique em 'Gerar com IA' para criar o workflow automaticamente",
                "validation": "check_ai_generation",
                "hint": "Aguarde alguns segundos para a IA processar"
            },
            {
                "id": 5,
                "title": "Revisar e salvar",
                "description": "Revise o workflow gerado e clique em 'Salvar'",
                "validation": "check_save_action",
                "hint": "Verifique se todas as etapas estão corretas"
            }
        ],
        "completion_criteria": "workflow_created"
    }',
    'solicitante',
    10,
    'beginner'
),
(
    'Gestão de Qualidade - Executor',
    'Aprenda a usar os módulos de qualidade como executor',
    'qualidade',
    '{
        "steps": [
            {
                "id": 1,
                "title": "Acessar módulo Qualidade",
                "description": "Clique no menu lateral em 'Qualidade'",
                "validation": "check_page_url",
                "hint": "Procure pelo ícone de certificado"
            },
            {
                "id": 2,
                "title": "Explorar documentos",
                "description": "Navegue pela lista de documentos disponíveis",
                "validation": "check_document_list",
                "hint": "Use os filtros para encontrar documentos específicos"
            },
            {
                "id": 3,
                "title": "Criar não conformidade",
                "description": "Clique em 'Nova Não Conformidade' e preencha os dados",
                "validation": "check_nc_creation",
                "hint": "Seja detalhado na descrição do problema"
            },
            {
                "id": 4,
                "title": "Usar IA para análise",
                "description": "Clique em 'Analisar com IA' para obter sugestões",
                "validation": "check_ai_analysis",
                "hint": "A IA classificará automaticamente a não conformidade"
            },
            {
                "id": 5,
                "title": "Implementar ações",
                "description": "Siga as sugestões da IA e implemente as ações corretivas",
                "validation": "check_action_implementation",
                "hint": "Mantenha registro de todas as ações tomadas"
            }
        ],
        "completion_criteria": "nc_created_and_analyzed"
    }',
    'executor',
    15,
    'intermediate'
);

-- =====================================================
-- 8. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactive_tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentation_search ENABLE ROW LEVEL SECURITY;

-- Políticas para documentation
CREATE POLICY "documentation_read_access" ON public.documentation
    FOR SELECT USING (is_published = true);

CREATE POLICY "documentation_write_access" ON public.documentation
    FOR ALL USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'manager')
            AND ur.is_active = true
        )
    );

-- Políticas para interactive_tutorials
CREATE POLICY "tutorials_read_access" ON public.interactive_tutorials
    FOR SELECT USING (is_active = true);

-- Políticas para tutorial_progress
CREATE POLICY "tutorial_progress_access" ON public.tutorial_progress
    FOR ALL USING (user_id = auth.uid());

-- Políticas para faq_entries
CREATE POLICY "faq_read_access" ON public.faq_entries
    FOR SELECT USING (is_active = true);

-- Políticas para documentation_search
CREATE POLICY "documentation_search_access" ON public.documentation_search
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- FIM DO SISTEMA DE DOCUMENTAÇÃO
-- ===================================================== 