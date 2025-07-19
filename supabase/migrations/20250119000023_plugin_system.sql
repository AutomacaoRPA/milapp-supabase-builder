-- =====================================================
-- MILAPP MedSênior - Sistema de Plugins e Extensões
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. TABELA DE PLUGINS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.custom_plugins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    plugin_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(20) DEFAULT '1.0.0',
    
    -- Categorização
    plugin_type VARCHAR(50) NOT NULL CHECK (plugin_type IN (
        'workflow_action', 'ui_component', 'integration', 'automation', 'analytics', 'notification'
    )),
    category VARCHAR(100),
    tags TEXT[],
    
    -- Configuração
    is_active BOOLEAN DEFAULT true,
    is_approved BOOLEAN DEFAULT false,
    is_system BOOLEAN DEFAULT false, -- Plugins do sistema vs customizados
    
    -- Código e recursos
    main_code TEXT NOT NULL, -- Código JavaScript principal
    css_styles TEXT, -- Estilos CSS customizados
    dependencies JSONB DEFAULT '[]', -- Dependências externas
    configuration_schema JSONB DEFAULT '{}', -- Schema de configuração
    
    -- Integração
    integration_points JSONB DEFAULT '[]', -- Pontos de integração
    permissions_required TEXT[], -- Permissões necessárias
    api_endpoints JSONB DEFAULT '[]', -- Endpoints da API
    
    -- Interface
    ui_config JSONB DEFAULT '{}', -- Configuração da interface
    icon_url VARCHAR(500),
    screenshots JSONB DEFAULT '[]', -- URLs das screenshots
    
    -- Estatísticas
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    
    -- Controle
    created_by UUID REFERENCES public.users(id),
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_plugins_type ON public.custom_plugins(plugin_type);
CREATE INDEX IF NOT EXISTS idx_plugins_active ON public.custom_plugins(is_active);
CREATE INDEX IF NOT EXISTS idx_plugins_approved ON public.custom_plugins(is_approved);
CREATE INDEX IF NOT EXISTS idx_plugins_category ON public.custom_plugins(category);

-- =====================================================
-- 2. TABELA DE INSTALAÇÕES DE PLUGINS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.plugin_installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    plugin_id UUID REFERENCES public.custom_plugins(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id),
    installed_by UUID REFERENCES public.users(id),
    
    -- Configuração
    is_enabled BOOLEAN DEFAULT true,
    configuration JSONB DEFAULT '{}', -- Configuração específica da instalação
    custom_settings JSONB DEFAULT '{}', -- Configurações customizadas
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN (
        'active', 'disabled', 'error', 'updating'
    )),
    error_message TEXT,
    last_error_at TIMESTAMP WITH TIME ZONE,
    
    -- Estatísticas
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    
    -- Controle
    installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_plugin_installations_plugin ON public.plugin_installations(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_installations_project ON public.plugin_installations(project_id);
CREATE INDEX IF NOT EXISTS idx_plugin_installations_status ON public.plugin_installations(status);

-- =====================================================
-- 3. TABELA DE EXECUÇÕES DE PLUGINS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.plugin_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    plugin_id UUID REFERENCES public.custom_plugins(id),
    installation_id UUID REFERENCES public.plugin_installations(id),
    triggered_by UUID REFERENCES public.users(id),
    
    -- Contexto
    execution_context JSONB NOT NULL, -- Contexto da execução
    input_data JSONB DEFAULT '{}', -- Dados de entrada
    output_data JSONB DEFAULT '{}', -- Dados de saída
    
    -- Status
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'running', 'completed', 'failed', 'cancelled'
    )),
    error_message TEXT,
    error_stack TEXT,
    
    -- Performance
    execution_time_ms INTEGER,
    memory_usage_mb INTEGER,
    
    -- Controle
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_plugin_executions_plugin ON public.plugin_executions(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_executions_status ON public.plugin_executions(status);
CREATE INDEX IF NOT EXISTS idx_plugin_executions_started_at ON public.plugin_executions(started_at);

-- =====================================================
-- 4. TABELA DE HOOKS DE PLUGINS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.plugin_hooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    plugin_id UUID REFERENCES public.custom_plugins(id) ON DELETE CASCADE,
    
    -- Configuração
    hook_name VARCHAR(100) NOT NULL, -- Nome do hook
    hook_type VARCHAR(50) NOT NULL CHECK (hook_type IN (
        'before_save', 'after_save', 'before_delete', 'after_delete',
        'before_execute', 'after_execute', 'on_error', 'on_success'
    )),
    target_entity VARCHAR(50) NOT NULL, -- Entidade alvo (workflow, document, etc.)
    
    -- Código
    hook_code TEXT NOT NULL, -- Código JavaScript do hook
    execution_order INTEGER DEFAULT 0, -- Ordem de execução
    
    -- Configuração
    is_active BOOLEAN DEFAULT true,
    conditions JSONB DEFAULT '{}', -- Condições para execução
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_plugin_hooks_plugin ON public.plugin_hooks(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_hooks_type ON public.plugin_hooks(hook_type);
CREATE INDEX IF NOT EXISTS idx_plugin_hooks_target ON public.plugin_hooks(target_entity);

-- =====================================================
-- 5. TABELA DE RECURSOS DE PLUGINS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.plugin_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relacionamentos
    plugin_id UUID REFERENCES public.custom_plugins(id) ON DELETE CASCADE,
    
    -- Identificação
    resource_name VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN (
        'image', 'css', 'js', 'json', 'html', 'template'
    )),
    
    -- Conteúdo
    content TEXT, -- Conteúdo inline
    file_url VARCHAR(500), -- URL do arquivo externo
    file_size INTEGER, -- Tamanho do arquivo em bytes
    
    -- Metadados
    mime_type VARCHAR(100),
    encoding VARCHAR(50),
    checksum VARCHAR(64), -- Hash para verificação de integridade
    
    -- Controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(plugin_id, resource_name)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_plugin_resources_plugin ON public.plugin_resources(plugin_id);
CREATE INDEX IF NOT EXISTS idx_plugin_resources_type ON public.plugin_resources(resource_type);

-- =====================================================
-- 6. FUNÇÕES DE PLUGINS
-- =====================================================

-- Função para criar plugin
CREATE OR REPLACE FUNCTION public.create_custom_plugin(
    p_plugin_name VARCHAR(100),
    p_display_name VARCHAR(255),
    p_plugin_type VARCHAR(50),
    p_main_code TEXT,
    p_description TEXT DEFAULT NULL,
    p_config JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    plugin_id UUID;
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    INSERT INTO public.custom_plugins (
        plugin_name,
        display_name,
        description,
        plugin_type,
        category,
        tags,
        main_code,
        css_styles,
        dependencies,
        configuration_schema,
        integration_points,
        permissions_required,
        api_endpoints,
        ui_config,
        created_by
    ) VALUES (
        p_plugin_name,
        p_display_name,
        p_description,
        p_plugin_type,
        p_config->>'category',
        ARRAY(SELECT jsonb_array_elements_text(p_config->'tags')),
        p_main_code,
        p_config->>'css_styles',
        p_config->'dependencies',
        p_config->'configuration_schema',
        p_config->'integration_points',
        ARRAY(SELECT jsonb_array_elements_text(p_config->'permissions_required')),
        p_config->'api_endpoints',
        p_config->'ui_config',
        current_user_id
    ) RETURNING id INTO plugin_id;
    
    RETURN plugin_id;
END;
$$ LANGUAGE plpgsql;

-- Função para instalar plugin
CREATE OR REPLACE FUNCTION public.install_plugin(
    p_plugin_id UUID,
    p_project_id UUID,
    p_configuration JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    installation_id UUID;
    current_user_id UUID;
    plugin_record RECORD;
BEGIN
    current_user_id := auth.uid();
    
    -- Verificar se plugin existe e está aprovado
    SELECT * INTO plugin_record
    FROM public.custom_plugins
    WHERE id = p_plugin_id
    AND is_active = true
    AND (is_approved = true OR is_system = true);
    
    IF plugin_record IS NULL THEN
        RAISE EXCEPTION 'Plugin não encontrado ou não aprovado';
    END IF;
    
    -- Verificar se já está instalado
    IF EXISTS (
        SELECT 1 FROM public.plugin_installations
        WHERE plugin_id = p_plugin_id
        AND project_id = p_project_id
    ) THEN
        RAISE EXCEPTION 'Plugin já está instalado neste projeto';
    END IF;
    
    -- Instalar plugin
    INSERT INTO public.plugin_installations (
        plugin_id,
        project_id,
        installed_by,
        configuration
    ) VALUES (
        p_plugin_id,
        p_project_id,
        current_user_id,
        p_configuration
    ) RETURNING id INTO installation_id;
    
    -- Atualizar contador de uso
    UPDATE public.custom_plugins
    SET usage_count = usage_count + 1
    WHERE id = p_plugin_id;
    
    RETURN installation_id;
END;
$$ LANGUAGE plpgsql;

-- Função para executar plugin
CREATE OR REPLACE FUNCTION public.execute_plugin(
    p_plugin_id UUID,
    p_installation_id UUID,
    p_input_data JSONB DEFAULT '{}',
    p_context JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    execution_id UUID;
    current_user_id UUID;
    plugin_record RECORD;
    installation_record RECORD;
    start_time TIMESTAMP WITH TIME ZONE;
BEGIN
    current_user_id := auth.uid();
    start_time := NOW();
    
    -- Verificar se plugin está instalado e ativo
    SELECT * INTO plugin_record
    FROM public.custom_plugins
    WHERE id = p_plugin_id
    AND is_active = true;
    
    IF plugin_record IS NULL THEN
        RAISE EXCEPTION 'Plugin não encontrado ou inativo';
    END IF;
    
    SELECT * INTO installation_record
    FROM public.plugin_installations
    WHERE id = p_installation_id
    AND plugin_id = p_plugin_id
    AND is_enabled = true
    AND status = 'active';
    
    IF installation_record IS NULL THEN
        RAISE EXCEPTION 'Instalação do plugin não encontrada ou inativa';
    END IF;
    
    -- Criar execução
    INSERT INTO public.plugin_executions (
        plugin_id,
        installation_id,
        triggered_by,
        execution_context,
        input_data,
        status
    ) VALUES (
        p_plugin_id,
        p_installation_id,
        current_user_id,
        p_context,
        p_input_data,
        'running'
    ) RETURNING id INTO execution_id;
    
    -- Aqui seria executado o código JavaScript do plugin
    -- Por enquanto, simulamos uma execução bem-sucedida
    
    -- Atualizar execução como concluída
    UPDATE public.plugin_executions
    SET status = 'completed',
        output_data = jsonb_build_object('result', 'success', 'message', 'Plugin executado com sucesso'),
        execution_time_ms = EXTRACT(EPOCH FROM (NOW() - start_time)) * 1000,
        completed_at = NOW()
    WHERE id = execution_id;
    
    -- Atualizar estatísticas da instalação
    UPDATE public.plugin_installations
    SET usage_count = usage_count + 1,
        last_used_at = NOW()
    WHERE id = p_installation_id;
    
    RETURN execution_id;
END;
$$ LANGUAGE plpgsql;

-- Função para adicionar hook
CREATE OR REPLACE FUNCTION public.add_plugin_hook(
    p_plugin_id UUID,
    p_hook_name VARCHAR(100),
    p_hook_type VARCHAR(50),
    p_target_entity VARCHAR(50),
    p_hook_code TEXT,
    p_execution_order INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    hook_id UUID;
BEGIN
    INSERT INTO public.plugin_hooks (
        plugin_id,
        hook_name,
        hook_type,
        target_entity,
        hook_code,
        execution_order
    ) VALUES (
        p_plugin_id,
        p_hook_name,
        p_hook_type,
        p_target_entity,
        p_hook_code,
        p_execution_order
    ) RETURNING id INTO hook_id;
    
    RETURN hook_id;
END;
$$ LANGUAGE plpgsql;

-- Função para executar hooks
CREATE OR REPLACE FUNCTION public.execute_plugin_hooks(
    p_hook_type VARCHAR(50),
    p_target_entity VARCHAR(50),
    p_entity_id UUID,
    p_context JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
    hook_record RECORD;
    execution_result JSONB;
    results JSONB := '[]'::jsonb;
BEGIN
    -- Executar hooks em ordem
    FOR hook_record IN
        SELECT * FROM public.plugin_hooks
        WHERE hook_type = p_hook_type
        AND target_entity = p_target_entity
        AND is_active = true
        ORDER BY execution_order ASC
    LOOP
        -- Aqui seria executado o código JavaScript do hook
        -- Por enquanto, simulamos execução
        execution_result := jsonb_build_object(
            'hook_id', hook_record.id,
            'hook_name', hook_record.hook_name,
            'status', 'executed',
            'result', 'success'
        );
        
        results := results || execution_result;
    END LOOP;
    
    RETURN results;
END;
$$ LANGUAGE plpgsql;

-- Função para avaliar plugin
CREATE OR REPLACE FUNCTION public.rate_plugin(
    p_plugin_id UUID,
    p_rating INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
    existing_rating RECORD;
BEGIN
    current_user_id := auth.uid();
    
    -- Verificar se rating é válido
    IF p_rating < 1 OR p_rating > 5 THEN
        RAISE EXCEPTION 'Rating deve estar entre 1 e 5';
    END IF;
    
    -- Verificar se usuário já avaliou
    -- (Aqui seria implementada uma tabela de ratings individuais)
    
    -- Atualizar rating do plugin
    UPDATE public.custom_plugins
    SET rating = (rating * rating_count + p_rating) / (rating_count + 1),
        rating_count = rating_count + 1
    WHERE id = p_plugin_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. DADOS INICIAIS DE PLUGINS
-- =====================================================

-- Plugin de exemplo: Botão para abrir incidente no GLPI
INSERT INTO public.custom_plugins (
    plugin_name,
    display_name,
    description,
    plugin_type,
    category,
    tags,
    main_code,
    configuration_schema,
    integration_points,
    is_approved,
    is_system
) VALUES (
    'glpi_incident_button',
    'Botão GLPI - Abrir Incidente',
    'Adiciona um botão para abrir incidentes diretamente no GLPI',
    'workflow_action',
    'Integração',
    ARRAY['glpi', 'incident', 'integration'],
    'function createGLPIIncident(workflowData) {
        const glpiUrl = "https://glpi.medsenior.com.br";
        const apiToken = this.config.apiToken;
        
        const incidentData = {
            name: "Incidente do Workflow: " + workflowData.name,
            content: workflowData.description,
            type: 1,
            urgency: this.mapPriority(workflowData.priority),
            impact: this.mapImpact(workflowData.impact)
        };
        
        return fetch(glpiUrl + "/apirest.php/initSession", {
            method: "GET",
            headers: {
                "Authorization": "user_token " + apiToken,
                "Content-Type": "application/json"
            }
        })
        .then(response => response.json())
        .then(session => {
            return fetch(glpiUrl + "/apirest.php/Ticket", {
                method: "POST",
                headers: {
                    "Session-Token": session.session_token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(incidentData)
            });
        })
        .then(response => response.json())
        .then(result => {
            return {
                success: true,
                ticketId: result.id,
                message: "Incidente criado no GLPI com sucesso"
            };
        })
        .catch(error => {
            return {
                success: false,
                error: error.message
            };
        });
    }',
    jsonb_build_object(
        'type', 'object',
        'properties', jsonb_build_object(
            'apiToken', jsonb_build_object('type', 'string', 'description', 'Token da API do GLPI'),
            'glpiUrl', jsonb_build_object('type', 'string', 'description', 'URL do GLPI', 'default', 'https://glpi.medsenior.com.br')
        ),
        'required', jsonb_build_array('apiToken')
    ),
    jsonb_build_array(
        jsonb_build_object(
            'point', 'workflow_action_button',
            'label', 'Abrir no GLPI',
            'icon', 'bug_report',
            'action', 'createGLPIIncident'
        )
    ),
    true,
    true
);

-- Plugin de exemplo: Gerador de PDF personalizado
INSERT INTO public.custom_plugins (
    plugin_name,
    display_name,
    description,
    plugin_type,
    category,
    tags,
    main_code,
    configuration_schema,
    integration_points,
    is_approved,
    is_system
) VALUES (
    'custom_pdf_generator',
    'Gerador de PDF Personalizado',
    'Gera PDFs com cabeçalho e rodapé personalizados da MedSênior',
    'workflow_action',
    'Documentação',
    ARRAY['pdf', 'document', 'generator'],
    'function generateCustomPDF(data) {
        const headerLogo = this.config.headerLogo || "https://medsenior.com.br/logo.png";
        const footerText = this.config.footerText || "MedSênior - Documento gerado automaticamente";
        
        const pdfContent = `
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="${headerLogo}" style="max-width: 200px;">
                <h1>${data.title}</h1>
            </div>
            <div style="margin: 20px 0;">
                ${data.content}
            </div>
            <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #666;">
                ${footerText}
            </div>
        `;
        
        return this.generatePDF(pdfContent, {
            format: "A4",
            margin: "20mm",
            header: {
                height: "30mm",
                contents: `<div style="text-align: center; font-size: 10px; color: #666;">
                    MedSênior - Sistema MILAPP
                </div>`
            },
            footer: {
                height: "20mm",
                contents: `<div style="text-align: center; font-size: 10px; color: #666;">
                    Página {{page}} de {{pages}}
                </div>`
            }
        });
    }',
    jsonb_build_object(
        'type', 'object',
        'properties', jsonb_build_object(
            'headerLogo', jsonb_build_object('type', 'string', 'description', 'URL do logo do cabeçalho'),
            'footerText', jsonb_build_object('type', 'string', 'description', 'Texto do rodapé')
        )
    ),
    jsonb_build_array(
        jsonb_build_object(
            'point', 'document_action',
            'label', 'Gerar PDF Personalizado',
            'icon', 'picture_as_pdf',
            'action', 'generateCustomPDF'
        )
    ),
    true,
    true
);

-- =====================================================
-- 8. VIEWS PARA RELATÓRIOS
-- =====================================================

-- View para plugins mais populares
CREATE OR REPLACE VIEW public.popular_plugins AS
SELECT 
    cp.plugin_name,
    cp.display_name,
    cp.plugin_type,
    cp.category,
    cp.usage_count,
    cp.rating,
    cp.rating_count,
    COUNT(pi.id) as installation_count
FROM public.custom_plugins cp
LEFT JOIN public.plugin_installations pi ON cp.id = pi.plugin_id
WHERE cp.is_active = true
AND cp.is_approved = true
GROUP BY cp.id, cp.plugin_name, cp.display_name, cp.plugin_type, cp.category, cp.usage_count, cp.rating, cp.rating_count
ORDER BY usage_count DESC, rating DESC;

-- View para execuções de plugins
CREATE OR REPLACE VIEW public.plugin_execution_stats AS
SELECT 
    cp.plugin_name,
    cp.display_name,
    COUNT(pe.id) as total_executions,
    COUNT(pe.id) FILTER (WHERE pe.status = 'completed') as successful_executions,
    COUNT(pe.id) FILTER (WHERE pe.status = 'failed') as failed_executions,
    AVG(pe.execution_time_ms) as avg_execution_time,
    MAX(pe.started_at) as last_execution
FROM public.custom_plugins cp
LEFT JOIN public.plugin_executions pe ON cp.id = pe.plugin_id
WHERE cp.is_active = true
GROUP BY cp.id, cp.plugin_name, cp.display_name
ORDER BY total_executions DESC;

-- View para plugins por projeto
CREATE OR REPLACE VIEW public.project_plugins AS
SELECT 
    p.name as project_name,
    cp.display_name as plugin_name,
    cp.plugin_type,
    pi.status,
    pi.usage_count,
    pi.last_used_at
FROM public.plugin_installations pi
JOIN public.custom_plugins cp ON pi.plugin_id = cp.id
JOIN public.projects p ON pi.project_id = p.id
WHERE cp.is_active = true
ORDER BY p.name, cp.display_name;

-- =====================================================
-- 9. TRIGGERS
-- =====================================================

-- Trigger para atualizar timestamps
CREATE OR REPLACE FUNCTION public.trigger_update_plugin_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_plugin_timestamp
    BEFORE UPDATE ON public.custom_plugins
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_plugin_timestamp();

CREATE TRIGGER trigger_update_installation_timestamp
    BEFORE UPDATE ON public.plugin_installations
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_plugin_timestamp();

CREATE TRIGGER trigger_update_hook_timestamp
    BEFORE UPDATE ON public.plugin_hooks
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_plugin_timestamp();

-- =====================================================
-- 10. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.custom_plugins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_resources ENABLE ROW LEVEL SECURITY;

-- Políticas para custom_plugins
CREATE POLICY "plugins_read_access" ON public.custom_plugins
    FOR SELECT USING (
        is_active = true AND (is_approved = true OR is_system = true)
    );

CREATE POLICY "plugins_create_access" ON public.custom_plugins
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'developer')
            AND ur.is_active = true
        )
    );

-- Políticas para plugin_installations
CREATE POLICY "plugin_installations_project_access" ON public.plugin_installations
    FOR ALL USING (
        project_id IN (
            SELECT project_id FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
        )
    );

-- Políticas para plugin_executions
CREATE POLICY "plugin_executions_project_access" ON public.plugin_executions
    FOR SELECT USING (
        installation_id IN (
            SELECT id FROM public.plugin_installations pi
            JOIN public.user_roles ur ON pi.project_id = ur.project_id
            WHERE ur.user_id = auth.uid()
            AND ur.is_active = true
        )
    );

-- Políticas para plugin_hooks
CREATE POLICY "plugin_hooks_read_access" ON public.plugin_hooks
    FOR SELECT USING (
        plugin_id IN (
            SELECT id FROM public.custom_plugins
            WHERE is_active = true AND (is_approved = true OR is_system = true)
        )
    );

-- Políticas para plugin_resources
CREATE POLICY "plugin_resources_read_access" ON public.plugin_resources
    FOR SELECT USING (
        plugin_id IN (
            SELECT id FROM public.custom_plugins
            WHERE is_active = true AND (is_approved = true OR is_system = true)
        )
    );

-- =====================================================
-- FIM DO SISTEMA DE PLUGINS
-- ===================================================== 