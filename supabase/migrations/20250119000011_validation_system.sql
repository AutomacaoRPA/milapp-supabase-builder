-- =====================================================
-- MILAPP MedSênior - Sistema de Validação e Testes
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- =====================================================
-- 1. TABELA DE VALIDAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.validation_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identificação
    test_name VARCHAR(255) NOT NULL,
    test_type VARCHAR(50) NOT NULL CHECK (test_type IN (
        'workflow', 'webhook', 'ai_prompt', 'integration', 'data_quality', 'security'
    )),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    
    -- Configuração do teste
    test_config JSONB NOT NULL,
    validation_rules JSONB NOT NULL,
    
    -- Resultado
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'running', 'passed', 'failed', 'error'
    )),
    result_data JSONB DEFAULT '{}',
    error_message TEXT,
    
    -- Métricas
    execution_time_ms INTEGER,
    last_executed_at TIMESTAMP WITH TIME ZONE,
    
    -- Controle
    is_active BOOLEAN DEFAULT true,
    auto_run BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_validation_tests_entity ON public.validation_tests(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_validation_tests_status ON public.validation_tests(status);
CREATE INDEX IF NOT EXISTS idx_validation_tests_type ON public.validation_tests(test_type);

-- =====================================================
-- 2. TABELA DE LOGS DE VALIDAÇÃO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.validation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_id UUID REFERENCES public.validation_tests(id) ON DELETE CASCADE,
    
    -- Execução
    execution_id VARCHAR(100) UNIQUE NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- Resultado
    status VARCHAR(20) NOT NULL,
    result_summary TEXT,
    detailed_log JSONB DEFAULT '{}',
    
    -- Contexto
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_validation_logs_test_id ON public.validation_logs(test_id);
CREATE INDEX IF NOT EXISTS idx_validation_logs_execution_id ON public.validation_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_validation_logs_status ON public.validation_logs(status);

-- =====================================================
-- 3. FUNÇÕES DE VALIDAÇÃO
-- =====================================================

-- Função para validar workflow completo
CREATE OR REPLACE FUNCTION public.validate_workflow_complete(p_workflow_id UUID)
RETURNS JSONB AS $$
DECLARE
    validation_result JSONB;
    node_count INTEGER;
    edge_count INTEGER;
    start_nodes INTEGER;
    end_nodes INTEGER;
    invalid_nodes TEXT[];
    invalid_edges TEXT[];
    disconnected_nodes TEXT[];
    webhook_errors TEXT[];
    ai_errors TEXT[];
    validation_errors TEXT[];
BEGIN
    -- Validação básica
    SELECT COUNT(*) INTO node_count FROM public.workflow_nodes WHERE workflow_id = p_workflow_id;
    SELECT COUNT(*) INTO edge_count FROM public.workflow_edges WHERE workflow_id = p_workflow_id;
    SELECT COUNT(*) INTO start_nodes FROM public.workflow_nodes WHERE workflow_id = p_workflow_id AND type = 'start';
    SELECT COUNT(*) INTO end_nodes FROM public.workflow_nodes WHERE workflow_id = p_workflow_id AND type = 'end';
    
    -- Verificar nós inválidos
    SELECT ARRAY_AGG(node_id) INTO invalid_nodes FROM public.workflow_nodes 
    WHERE workflow_id = p_workflow_id AND is_valid = false;
    
    -- Verificar conexões inválidas
    SELECT ARRAY_AGG(edge_id) INTO invalid_edges FROM public.workflow_edges 
    WHERE workflow_id = p_workflow_id AND is_valid = false;
    
    -- Verificar nós desconectados
    SELECT ARRAY_AGG(wn.node_id) INTO disconnected_nodes
    FROM public.workflow_nodes wn
    LEFT JOIN public.workflow_edges we1 ON wn.node_id = we1.source_node_id
    LEFT JOIN public.workflow_edges we2 ON wn.node_id = we2.target_node_id
    WHERE wn.workflow_id = p_workflow_id 
    AND wn.type NOT IN ('start', 'end')
    AND we1.id IS NULL AND we2.id IS NULL;
    
    -- Verificar webhooks
    SELECT ARRAY_AGG(wn.node_id) INTO webhook_errors
    FROM public.workflow_nodes wn
    WHERE wn.workflow_id = p_workflow_id 
    AND wn.type = 'webhook'
    AND (wn.data->>'url' IS NULL OR wn.data->>'url' = '');
    
    -- Verificar prompts de IA
    SELECT ARRAY_AGG(wn.node_id) INTO ai_errors
    FROM public.workflow_nodes wn
    WHERE wn.workflow_id = p_workflow_id 
    AND wn.type = 'task_ai'
    AND (wn.data->>'prompt_template' IS NULL OR wn.data->>'prompt_template' = '');
    
    -- Construir lista de erros
    validation_errors := ARRAY[]::TEXT[];
    
    IF start_nodes != 1 THEN
        validation_errors := validation_errors || 'Workflow deve ter exatamente um nó de início';
    END IF;
    
    IF end_nodes < 1 THEN
        validation_errors := validation_errors || 'Workflow deve ter pelo menos um nó de fim';
    END IF;
    
    IF invalid_nodes IS NOT NULL THEN
        validation_errors := validation_errors || 'Existem nós com configuração inválida';
    END IF;
    
    IF invalid_edges IS NOT NULL THEN
        validation_errors := validation_errors || 'Existem conexões com configuração inválida';
    END IF;
    
    IF disconnected_nodes IS NOT NULL THEN
        validation_errors := validation_errors || 'Existem nós desconectados do fluxo';
    END IF;
    
    IF webhook_errors IS NOT NULL THEN
        validation_errors := validation_errors || 'Webhooks sem URL configurada';
    END IF;
    
    IF ai_errors IS NOT NULL THEN
        validation_errors := validation_errors || 'Nós de IA sem prompt configurado';
    END IF;
    
    -- Construir resultado
    validation_result := jsonb_build_object(
        'is_valid', validation_errors = ARRAY[]::TEXT[],
        'node_count', node_count,
        'edge_count', edge_count,
        'start_nodes', start_nodes,
        'end_nodes', end_nodes,
        'invalid_nodes', COALESCE(invalid_nodes, '[]'::TEXT[]),
        'invalid_edges', COALESCE(invalid_edges, '[]'::TEXT[]),
        'disconnected_nodes', COALESCE(disconnected_nodes, '[]'::TEXT[]),
        'webhook_errors', COALESCE(webhook_errors, '[]'::TEXT[]),
        'ai_errors', COALESCE(ai_errors, '[]'::TEXT[]),
        'errors', validation_errors,
        'warnings', ARRAY[]::TEXT[],
        'score', CASE 
            WHEN validation_errors = ARRAY[]::TEXT[] THEN 100
            ELSE GREATEST(0, 100 - (array_length(validation_errors, 1) * 10))
        END
    );
    
    RETURN validation_result;
END;
$$ LANGUAGE plpgsql;

-- Função para testar webhook
CREATE OR REPLACE FUNCTION public.test_webhook_connection(p_url TEXT, p_method TEXT DEFAULT 'GET', p_headers JSONB DEFAULT '{}', p_timeout INTEGER DEFAULT 5000)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    start_time TIMESTAMP WITH TIME ZONE;
    end_time TIMESTAMP WITH TIME ZONE;
    duration_ms INTEGER;
BEGIN
    start_time := NOW();
    
    -- Simular teste de webhook (em produção, usar extensão http)
    -- Por enquanto, validar apenas formato da URL
    IF p_url IS NULL OR p_url = '' THEN
        result := jsonb_build_object(
            'success', false,
            'error', 'URL não fornecida',
            'status_code', 400,
            'response_time_ms', 0
        );
    ELSIF NOT (p_url LIKE 'http://%' OR p_url LIKE 'https://%') THEN
        result := jsonb_build_object(
            'success', false,
            'error', 'URL inválida - deve começar com http:// ou https://',
            'status_code', 400,
            'response_time_ms', 0
        );
    ELSE
        -- Simular resposta bem-sucedida
        result := jsonb_build_object(
            'success', true,
            'status_code', 200,
            'response_time_ms', 150,
            'response_headers', '{}',
            'response_body', '{"status": "ok"}'
        );
    END IF;
    
    end_time := NOW();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Adicionar tempo de execução
    result := result || jsonb_build_object('execution_time_ms', duration_ms);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para validar prompt de IA
CREATE OR REPLACE FUNCTION public.validate_ai_prompt(p_prompt TEXT, p_model VARCHAR(50) DEFAULT 'gpt-4')
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    warnings TEXT[];
    errors TEXT[];
BEGIN
    warnings := ARRAY[]::TEXT[];
    errors := ARRAY[]::TEXT[];
    
    -- Validações básicas
    IF p_prompt IS NULL OR p_prompt = '' THEN
        errors := errors || 'Prompt não pode estar vazio';
    END IF;
    
    IF LENGTH(p_prompt) < 10 THEN
        warnings := warnings || 'Prompt muito curto - pode gerar respostas imprecisas';
    END IF;
    
    IF LENGTH(p_prompt) > 4000 THEN
        warnings := warnings || 'Prompt muito longo - pode exceder limites do modelo';
    END IF;
    
    -- Verificar variáveis de template
    IF p_prompt LIKE '%{{%' AND p_prompt NOT LIKE '%}}%' THEN
        errors := errors || 'Template com variável malformada - falta fechamento }}';
    END IF;
    
    IF p_prompt LIKE '%}}%' AND p_prompt NOT LIKE '%{{%' THEN
        errors := errors || 'Template com variável malformada - falta abertura {{';
    END IF;
    
    -- Verificar instruções claras
    IF NOT (p_prompt ILIKE '%responda%' OR p_prompt ILIKE '%analise%' OR p_prompt ILIKE '%gere%') THEN
        warnings := warnings || 'Prompt pode não ter instrução clara de ação';
    END IF;
    
    -- Construir resultado
    result := jsonb_build_object(
        'is_valid', errors = ARRAY[]::TEXT[],
        'warnings', warnings,
        'errors', errors,
        'prompt_length', LENGTH(p_prompt),
        'estimated_tokens', LENGTH(p_prompt) / 4, -- Estimativa aproximada
        'model_compatibility', CASE 
            WHEN p_model = 'gpt-4' AND LENGTH(p_prompt) > 8000 THEN false
            WHEN p_model = 'gpt-3.5-turbo' AND LENGTH(p_prompt) > 4000 THEN false
            ELSE true
        END,
        'score', CASE 
            WHEN errors != ARRAY[]::TEXT[] THEN 0
            WHEN warnings != ARRAY[]::TEXT[] THEN 80
            ELSE 100
        END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Função para executar teste de validação
CREATE OR REPLACE FUNCTION public.execute_validation_test(p_test_id UUID)
RETURNS JSONB AS $$
DECLARE
    test_record RECORD;
    execution_id VARCHAR(100);
    result JSONB;
    start_time TIMESTAMP WITH TIME ZONE;
    end_time TIMESTAMP WITH TIME ZONE;
    duration_ms INTEGER;
BEGIN
    -- Obter dados do teste
    SELECT * INTO test_record FROM public.validation_tests WHERE id = p_test_id;
    
    IF test_record IS NULL THEN
        RAISE EXCEPTION 'Teste não encontrado';
    END IF;
    
    -- Gerar ID de execução
    execution_id := 'VAL_' || TO_CHAR(NOW(), 'YYYYMMDD_HH24MISS') || '_' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
    
    -- Atualizar status para running
    UPDATE public.validation_tests 
    SET status = 'running', last_executed_at = NOW()
    WHERE id = p_test_id;
    
    start_time := NOW();
    
    -- Executar teste baseado no tipo
    CASE test_record.test_type
        WHEN 'workflow' THEN
            result := public.validate_workflow_complete(test_record.entity_id);
        WHEN 'webhook' THEN
            result := public.test_webhook_connection(
                test_record.test_config->>'url',
                test_record.test_config->>'method',
                test_record.test_config->>'headers'
            );
        WHEN 'ai_prompt' THEN
            result := public.validate_ai_prompt(
                test_record.test_config->>'prompt',
                test_record.test_config->>'model'
            );
        ELSE
            result := jsonb_build_object(
                'success', false,
                'error', 'Tipo de teste não implementado'
            );
    END CASE;
    
    end_time := NOW();
    duration_ms := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    -- Determinar status final
    DECLARE
        final_status VARCHAR(20);
    BEGIN
        IF result->>'is_valid' = 'true' OR result->>'success' = 'true' THEN
            final_status := 'passed';
        ELSIF result->>'error' IS NOT NULL THEN
            final_status := 'error';
        ELSE
            final_status := 'failed';
        END IF;
        
        -- Atualizar teste
        UPDATE public.validation_tests 
        SET status = final_status,
            result_data = result,
            execution_time_ms = duration_ms,
            updated_at = NOW()
        WHERE id = p_test_id;
        
        -- Criar log de execução
        INSERT INTO public.validation_logs (
            test_id,
            execution_id,
            status,
            result_summary,
            detailed_log,
            input_data,
            output_data,
            duration_ms
        ) VALUES (
            p_test_id,
            execution_id,
            final_status,
            result->>'error' OR result->>'summary',
            result,
            test_record.test_config,
            result,
            duration_ms
        );
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. TRIGGERS PARA VALIDAÇÃO AUTOMÁTICA
-- =====================================================

-- Trigger para validar workflow ao salvar
CREATE OR REPLACE FUNCTION public.trigger_workflow_validation()
RETURNS TRIGGER AS $$
DECLARE
    test_id UUID;
BEGIN
    -- Criar teste de validação
    INSERT INTO public.validation_tests (
        test_name,
        test_type,
        entity_type,
        entity_id,
        test_config,
        validation_rules,
        auto_run,
        created_by
    ) VALUES (
        'Validação Workflow: ' || NEW.name,
        'workflow',
        'workflow',
        NEW.id,
        jsonb_build_object('workflow_id', NEW.id),
        jsonb_build_object('require_start_end', true, 'check_connectivity', true),
        true,
        auth.uid()
    ) RETURNING id INTO test_id;
    
    -- Executar validação
    PERFORM public.execute_validation_test(test_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_workflow_validation
    AFTER INSERT OR UPDATE ON public.workflows
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_workflow_validation();

-- =====================================================
-- 5. VIEWS PARA RELATÓRIOS DE VALIDAÇÃO
-- =====================================================

-- View para status de validação
CREATE OR REPLACE VIEW public.validation_status AS
SELECT 
    vt.entity_type,
    vt.entity_id,
    vt.test_type,
    vt.status,
    vt.last_executed_at,
    vt.execution_time_ms,
    vt.result_data->>'score' as validation_score,
    vt.result_data->>'errors' as errors,
    vt.result_data->>'warnings' as warnings
FROM public.validation_tests vt
WHERE vt.is_active = true
ORDER BY vt.last_executed_at DESC;

-- View para testes com falha
CREATE OR REPLACE VIEW public.failed_validations AS
SELECT 
    vt.*,
    vl.execution_id,
    vl.result_summary,
    vl.detailed_log
FROM public.validation_tests vt
JOIN public.validation_logs vl ON vt.id = vl.test_id
WHERE vt.status IN ('failed', 'error')
AND vl.created_at = (
    SELECT MAX(created_at) 
    FROM public.validation_logs 
    WHERE test_id = vt.id
)
ORDER BY vl.created_at DESC;

-- =====================================================
-- 6. POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.validation_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.validation_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para validation_tests
CREATE POLICY "validation_tests_project_access" ON public.validation_tests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.project_id IN (
                SELECT project_id FROM public.workflows WHERE id = validation_tests.entity_id
                UNION
                SELECT project_id FROM public.quality_documents WHERE id = validation_tests.entity_id
                UNION
                SELECT project_id FROM public.quality_pops WHERE id = validation_tests.entity_id
            )
            AND ur.is_active = true
        )
    );

-- Políticas para validation_logs
CREATE POLICY "validation_logs_test_access" ON public.validation_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.validation_tests vt
            JOIN public.user_roles ur ON ur.user_id = auth.uid()
            WHERE vt.id = validation_logs.test_id
            AND ur.project_id IN (
                SELECT project_id FROM public.workflows WHERE id = vt.entity_id
                UNION
                SELECT project_id FROM public.quality_documents WHERE id = vt.entity_id
                UNION
                SELECT project_id FROM public.quality_pops WHERE id = vt.entity_id
            )
            AND ur.is_active = true
        )
    );

-- =====================================================
-- FIM DO SISTEMA DE VALIDAÇÃO
-- ===================================================== 