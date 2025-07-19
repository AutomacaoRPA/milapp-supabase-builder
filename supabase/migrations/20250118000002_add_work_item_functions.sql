-- =====================================================
-- MIGRAÇÃO: Funções para Work Items (Azure DevOps Style)
-- =====================================================
-- Descrição: Criar funções para gerenciar work items e subtarefas
-- Data: 2025-01-18
-- Versão: 1.0.2
-- Commit: refactor(ui): unify task control into card component as inline task list (Azure DevOps style)
-- =====================================================

-- Configuração de timezone
SET timezone = 'America/Sao_Paulo';

-- Log de início
DO $$
BEGIN
    RAISE NOTICE 'Criando funções para work items (Azure DevOps style) - %', NOW();
END $$;

-- =====================================================
-- 1. FUNÇÕES PARA GESTÃO DE WORK ITEMS
-- =====================================================

-- Função para adicionar work item ao projeto
CREATE OR REPLACE FUNCTION milapp.add_work_item_to_project(
    p_project_id UUID,
    p_work_item_data JSONB
) RETURNS JSONB AS $$
DECLARE
    current_work_items JSONB;
    new_work_item JSONB;
    work_item_id UUID;
BEGIN
    -- Gerar ID único para o work item
    work_item_id := gen_random_uuid();
    
    -- Adicionar ID e timestamps ao work item
    new_work_item := p_work_item_data || jsonb_build_object(
        'id', work_item_id,
        'subtasks', '[]'::jsonb,
        'created_at', NOW(),
        'updated_at', NOW()
    );
    
    -- Buscar work items atuais do projeto
    SELECT work_items INTO current_work_items 
    FROM milapp.projects 
    WHERE id = p_project_id;
    
    -- Adicionar novo work item
    current_work_items := COALESCE(current_work_items, '[]'::jsonb) || new_work_item;
    
    -- Atualizar projeto
    UPDATE milapp.projects 
    SET work_items = current_work_items, updated_at = NOW()
    WHERE id = p_project_id;
    
    RETURN new_work_item;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar work item no projeto
CREATE OR REPLACE FUNCTION milapp.update_work_item_in_project(
    p_project_id UUID,
    p_work_item_id UUID,
    p_work_item_data JSONB
) RETURNS JSONB AS $$
DECLARE
    current_work_items JSONB;
    updated_work_items JSONB;
    work_item_index INTEGER;
    work_item_record RECORD;
BEGIN
    -- Buscar work items atuais do projeto
    SELECT work_items INTO current_work_items 
    FROM milapp.projects 
    WHERE id = p_project_id;
    
    -- Encontrar índice do work item
    work_item_index := -1;
    FOR i IN 0..jsonb_array_length(current_work_items) - 1 LOOP
        IF (current_work_items->i->>'id')::UUID = p_work_item_id THEN
            work_item_index := i;
            work_item_record := current_work_items->i;
            EXIT;
        END IF;
    END LOOP;
    
    IF work_item_index = -1 THEN
        RAISE EXCEPTION 'Work item não encontrado';
    END IF;
    
    -- Atualizar work item mantendo campos existentes
    updated_work_items := jsonb_set(
        current_work_items,
        ARRAY[work_item_index::text],
        work_item_record || p_work_item_data || jsonb_build_object('updated_at', NOW())
    );
    
    -- Atualizar projeto
    UPDATE milapp.projects 
    SET work_items = updated_work_items, updated_at = NOW()
    WHERE id = p_project_id;
    
    RETURN work_item_record || p_work_item_data;
END;
$$ LANGUAGE plpgsql;

-- Função para remover work item do projeto
CREATE OR REPLACE FUNCTION milapp.remove_work_item_from_project(
    p_project_id UUID,
    p_work_item_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    current_work_items JSONB;
    new_work_items JSONB;
BEGIN
    -- Buscar work items atuais do projeto
    SELECT work_items INTO current_work_items 
    FROM milapp.projects 
    WHERE id = p_project_id;
    
    -- Filtrar work item removido
    new_work_items := '[]'::jsonb;
    
    FOR i IN 0..jsonb_array_length(current_work_items) - 1 LOOP
        IF (current_work_items->i->>'id')::UUID != p_work_item_id THEN
            new_work_items := new_work_items || current_work_items->i;
        END IF;
    END LOOP;
    
    -- Atualizar projeto
    UPDATE milapp.projects 
    SET work_items = new_work_items, updated_at = NOW()
    WHERE id = p_project_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Função para mover work item entre colunas
CREATE OR REPLACE FUNCTION milapp.move_work_item_column(
    p_project_id UUID,
    p_work_item_id UUID,
    p_new_status TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    current_work_items JSONB;
    updated_work_items JSONB;
    work_item_index INTEGER;
    work_item_record RECORD;
BEGIN
    -- Buscar work items atuais do projeto
    SELECT work_items INTO current_work_items 
    FROM milapp.projects 
    WHERE id = p_project_id;
    
    -- Encontrar índice do work item
    work_item_index := -1;
    FOR i IN 0..jsonb_array_length(current_work_items) - 1 LOOP
        IF (current_work_items->i->>'id')::UUID = p_work_item_id THEN
            work_item_index := i;
            work_item_record := current_work_items->i;
            EXIT;
        END IF;
    END LOOP;
    
    IF work_item_index = -1 THEN
        RETURN FALSE;
    END IF;
    
    -- Atualizar status do work item
    updated_work_items := jsonb_set(
        current_work_items,
        ARRAY[work_item_index::text, 'status'],
        to_jsonb(p_new_status)
    );
    
    -- Atualizar timestamp
    updated_work_items := jsonb_set(
        updated_work_items,
        ARRAY[work_item_index::text, 'updated_at'],
        to_jsonb(NOW())
    );
    
    -- Atualizar projeto
    UPDATE milapp.projects 
    SET work_items = updated_work_items, updated_at = NOW()
    WHERE id = p_project_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. FUNÇÕES PARA GESTÃO DE SUBTAREFAS
-- =====================================================

-- Função para adicionar subtarefa a um work item
CREATE OR REPLACE FUNCTION milapp.add_subtask_to_work_item(
    p_project_id UUID,
    p_work_item_id UUID,
    p_subtask_data JSONB
) RETURNS JSONB AS $$
DECLARE
    current_work_items JSONB;
    work_item_index INTEGER;
    work_item JSONB;
    updated_work_item JSONB;
    subtask_id UUID;
BEGIN
    -- Gerar ID único para a subtarefa
    subtask_id := gen_random_uuid();
    
    -- Buscar work items atuais do projeto
    SELECT work_items INTO current_work_items 
    FROM milapp.projects 
    WHERE id = p_project_id;
    
    -- Encontrar o work item específico
    work_item_index := -1;
    FOR i IN 0..jsonb_array_length(current_work_items) - 1 LOOP
        IF (current_work_items->i->>'id')::UUID = p_work_item_id THEN
            work_item_index := i;
            work_item := current_work_items->i;
            EXIT;
        END IF;
    END LOOP;
    
    IF work_item_index = -1 THEN
        RAISE EXCEPTION 'Work item não encontrado';
    END IF;
    
    -- Adicionar subtarefa ao work item
    updated_work_item := work_item;
    
    -- Inicializar array de subtarefas se não existir
    IF NOT (updated_work_item ? 'subtasks') THEN
        updated_work_item := updated_work_item || jsonb_build_object('subtasks', '[]'::jsonb);
    END IF;
    
    -- Adicionar nova subtarefa
    updated_work_item := jsonb_set(
        updated_work_item,
        '{subtasks}',
        (updated_work_item->'subtasks') || (p_subtask_data || jsonb_build_object(
            'id', subtask_id,
            'created_at', NOW(),
            'updated_at', NOW()
        ))
    );
    
    -- Atualizar work item na lista
    current_work_items := jsonb_set(
        current_work_items,
        ARRAY[work_item_index::text],
        updated_work_item
    );
    
    -- Atualizar projeto
    UPDATE milapp.projects 
    SET work_items = current_work_items, updated_at = NOW()
    WHERE id = p_project_id;
    
    RETURN p_subtask_data || jsonb_build_object('id', subtask_id);
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar subtarefa
CREATE OR REPLACE FUNCTION milapp.update_subtask_in_work_item(
    p_project_id UUID,
    p_work_item_id UUID,
    p_subtask_id UUID,
    p_subtask_data JSONB
) RETURNS JSONB AS $$
DECLARE
    current_work_items JSONB;
    work_item_index INTEGER;
    subtask_index INTEGER;
    work_item JSONB;
    updated_work_item JSONB;
    subtasks JSONB;
BEGIN
    -- Buscar work items atuais do projeto
    SELECT work_items INTO current_work_items 
    FROM milapp.projects 
    WHERE id = p_project_id;
    
    -- Encontrar o work item específico
    work_item_index := -1;
    FOR i IN 0..jsonb_array_length(current_work_items) - 1 LOOP
        IF (current_work_items->i->>'id')::UUID = p_work_item_id THEN
            work_item_index := i;
            work_item := current_work_items->i;
            EXIT;
        END IF;
    END LOOP;
    
    IF work_item_index = -1 THEN
        RAISE EXCEPTION 'Work item não encontrado';
    END IF;
    
    -- Encontrar a subtarefa específica
    subtasks := work_item->'subtasks';
    subtask_index := -1;
    
    FOR i IN 0..jsonb_array_length(subtasks) - 1 LOOP
        IF (subtasks->i->>'id')::UUID = p_subtask_id THEN
            subtask_index := i;
            EXIT;
        END IF;
    END LOOP;
    
    IF subtask_index = -1 THEN
        RAISE EXCEPTION 'Subtarefa não encontrada';
    END IF;
    
    -- Atualizar subtarefa
    updated_work_item := jsonb_set(
        work_item,
        ARRAY['subtasks', subtask_index::text],
        (subtasks->subtask_index) || p_subtask_data || jsonb_build_object('updated_at', NOW())
    );
    
    -- Atualizar work item na lista
    current_work_items := jsonb_set(
        current_work_items,
        ARRAY[work_item_index::text],
        updated_work_item
    );
    
    -- Atualizar projeto
    UPDATE milapp.projects 
    SET work_items = current_work_items, updated_at = NOW()
    WHERE id = p_project_id;
    
    RETURN subtasks->subtask_index || p_subtask_data;
END;
$$ LANGUAGE plpgsql;

-- Função para remover subtarefa
CREATE OR REPLACE FUNCTION milapp.remove_subtask_from_work_item(
    p_project_id UUID,
    p_work_item_id UUID,
    p_subtask_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    current_work_items JSONB;
    work_item_index INTEGER;
    work_item JSONB;
    updated_work_item JSONB;
    subtasks JSONB;
    new_subtasks JSONB;
BEGIN
    -- Buscar work items atuais do projeto
    SELECT work_items INTO current_work_items 
    FROM milapp.projects 
    WHERE id = p_project_id;
    
    -- Encontrar o work item específico
    work_item_index := -1;
    FOR i IN 0..jsonb_array_length(current_work_items) - 1 LOOP
        IF (current_work_items->i->>'id')::UUID = p_work_item_id THEN
            work_item_index := i;
            work_item := current_work_items->i;
            EXIT;
        END IF;
    END LOOP;
    
    IF work_item_index = -1 THEN
        RETURN FALSE;
    END IF;
    
    -- Filtrar subtarefa removida
    subtasks := work_item->'subtasks';
    new_subtasks := '[]'::jsonb;
    
    FOR i IN 0..jsonb_array_length(subtasks) - 1 LOOP
        IF (subtasks->i->>'id')::UUID != p_subtask_id THEN
            new_subtasks := new_subtasks || subtasks->i;
        END IF;
    END LOOP;
    
    -- Atualizar work item
    updated_work_item := jsonb_set(
        work_item,
        '{subtasks}',
        new_subtasks
    );
    
    -- Atualizar work item na lista
    current_work_items := jsonb_set(
        current_work_items,
        ARRAY[work_item_index::text],
        updated_work_item
    );
    
    -- Atualizar projeto
    UPDATE milapp.projects 
    SET work_items = current_work_items, updated_at = NOW()
    WHERE id = p_project_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. FUNÇÕES DE CONSULTA E ANÁLISE
-- =====================================================

-- Função para buscar work items por filtros
CREATE OR REPLACE FUNCTION milapp.get_work_items_by_filter(
    p_project_id UUID,
    p_filters JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
    project_work_items JSONB;
    filtered_work_items JSONB;
    work_item_record RECORD;
    status_filter TEXT;
    type_filter TEXT;
    priority_filter TEXT;
    assignee_filter TEXT;
BEGIN
    -- Buscar work items do projeto
    SELECT work_items INTO project_work_items 
    FROM milapp.projects 
    WHERE id = p_project_id;
    
    IF project_work_items IS NULL THEN
        RETURN '[]'::jsonb;
    END IF;
    
    -- Extrair filtros
    status_filter := p_filters->>'status';
    type_filter := p_filters->>'type';
    priority_filter := p_filters->>'priority';
    assignee_filter := p_filters->>'assignee';
    
    -- Filtrar work items
    filtered_work_items := '[]'::jsonb;
    
    FOR i IN 0..jsonb_array_length(project_work_items) - 1 LOOP
        work_item_record := project_work_items->i;
        
        -- Aplicar filtros
        IF status_filter IS NOT NULL AND work_item_record->>'status' != status_filter THEN
            CONTINUE;
        END IF;
        
        IF type_filter IS NOT NULL AND work_item_record->>'type' != type_filter THEN
            CONTINUE;
        END IF;
        
        IF priority_filter IS NOT NULL AND work_item_record->>'priority' != priority_filter THEN
            CONTINUE;
        END IF;
        
        IF assignee_filter IS NOT NULL AND work_item_record->'assignee'->>'id' != assignee_filter THEN
            CONTINUE;
        END IF;
        
        filtered_work_items := filtered_work_items || work_item_record;
    END LOOP;
    
    RETURN filtered_work_items;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular métricas do projeto
CREATE OR REPLACE FUNCTION milapp.calculate_project_metrics(
    p_project_id UUID
) RETURNS JSONB AS $$
DECLARE
    project_work_items JSONB;
    total_work_items INTEGER;
    completed_work_items INTEGER;
    total_subtasks INTEGER;
    completed_subtasks INTEGER;
    work_item_record RECORD;
    subtask_record RECORD;
    metrics JSONB;
BEGIN
    -- Buscar work items do projeto
    SELECT work_items INTO project_work_items 
    FROM milapp.projects 
    WHERE id = p_project_id;
    
    IF project_work_items IS NULL THEN
        RETURN jsonb_build_object(
            'total_work_items', 0,
            'completed_work_items', 0,
            'total_subtasks', 0,
            'completed_subtasks', 0,
            'work_item_velocity', 0
        );
    END IF;
    
    -- Calcular métricas
    total_work_items := jsonb_array_length(project_work_items);
    completed_work_items := 0;
    total_subtasks := 0;
    completed_subtasks := 0;
    
    FOR i IN 0..jsonb_array_length(project_work_items) - 1 LOOP
        work_item_record := project_work_items->i;
        
        -- Contar work items completados
        IF work_item_record->>'status' = 'done' THEN
            completed_work_items := completed_work_items + 1;
        END IF;
        
        -- Contar subtarefas
        IF work_item_record ? 'subtasks' THEN
            total_subtasks := total_subtasks + jsonb_array_length(work_item_record->'subtasks');
            
            -- Contar subtarefas completadas
            FOR j IN 0..jsonb_array_length(work_item_record->'subtasks') - 1 LOOP
                subtask_record := work_item_record->'subtasks'->j;
                IF subtask_record->>'status' = 'done' THEN
                    completed_subtasks := completed_subtasks + 1;
                END IF;
            END LOOP;
        END IF;
    END LOOP;
    
    -- Calcular velocidade (work items por semana)
    metrics := jsonb_build_object(
        'total_work_items', total_work_items,
        'completed_work_items', completed_work_items,
        'total_subtasks', total_subtasks,
        'completed_subtasks', completed_subtasks,
        'work_item_velocity', CASE 
            WHEN total_work_items > 0 THEN 
                ROUND((completed_work_items::numeric / total_work_items) * 100, 2)
            ELSE 0 
        END
    );
    
    RETURN metrics;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. TRIGGERS E AUDITORIA
-- =====================================================

-- Função de auditoria para work items
CREATE OR REPLACE FUNCTION milapp.audit_work_items_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.work_items IS DISTINCT FROM NEW.work_items THEN
        INSERT INTO milapp.audit_log (
            table_name,
            record_id,
            action,
            old_data,
            new_data,
            changed_by,
            changed_at
        ) VALUES (
            'projects',
            NEW.id,
            'UPDATE_WORK_ITEMS',
            OLD.work_items,
            NEW.work_items,
            COALESCE(auth.uid()::text, 'system'),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auditoria de work items (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'audit_project_work_items'
    ) THEN
        CREATE TRIGGER audit_project_work_items
            AFTER UPDATE ON milapp.projects
            FOR EACH ROW
            WHEN (OLD.work_items IS DISTINCT FROM NEW.work_items)
            EXECUTE FUNCTION milapp.audit_work_items_changes();
    END IF;
END $$;

-- =====================================================
-- 5. ÍNDICES E OTIMIZAÇÕES
-- =====================================================

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_projects_work_items_gin 
ON milapp.projects USING GIN (work_items);

CREATE INDEX IF NOT EXISTS idx_projects_work_items_status 
ON milapp.projects USING GIN ((work_items->'status'));

CREATE INDEX IF NOT EXISTS idx_projects_work_items_type 
ON milapp.projects USING GIN ((work_items->'type'));

CREATE INDEX IF NOT EXISTS idx_projects_work_items_priority 
ON milapp.projects USING GIN ((work_items->'priority'));

-- =====================================================
-- 6. VIEWS PARA FACILITAR CONSULTAS
-- =====================================================

-- View para work items com subtarefas
CREATE OR REPLACE VIEW milapp.work_items_view AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    wi.value as work_item,
    wi.value->>'id' as work_item_id,
    wi.value->>'title' as title,
    wi.value->>'type' as type,
    wi.value->>'status' as status,
    wi.value->>'priority' as priority,
    (wi.value->>'story_points')::int as story_points,
    wi.value->'assignee' as assignee,
    wi.value->'subtasks' as subtasks,
    jsonb_array_length(COALESCE(wi.value->'subtasks', '[]'::jsonb)) as subtask_count,
    wi.value->>'created_at' as created_at,
    wi.value->>'updated_at' as updated_at
FROM milapp.projects p,
     jsonb_array_elements(COALESCE(p.work_items, '[]'::jsonb)) wi
WHERE p.work_items IS NOT NULL;

-- View para subtarefas
CREATE OR REPLACE VIEW milapp.subtasks_view AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    wi.value->>'id' as work_item_id,
    wi.value->>'title' as work_item_title,
    st.value as subtask,
    st.value->>'id' as subtask_id,
    st.value->>'title' as title,
    st.value->>'status' as status,
    st.value->>'priority' as priority,
    (st.value->>'story_points')::int as story_points,
    (st.value->>'estimated_hours')::numeric as estimated_hours,
    st.value->'assignee' as assignee,
    st.value->>'created_at' as created_at,
    st.value->>'updated_at' as updated_at
FROM milapp.projects p,
     jsonb_array_elements(COALESCE(p.work_items, '[]'::jsonb)) wi,
     jsonb_array_elements(COALESCE(wi.value->'subtasks', '[]'::jsonb)) st
WHERE p.work_items IS NOT NULL 
  AND wi.value ? 'subtasks' 
  AND jsonb_array_length(wi.value->'subtasks') > 0;

-- =====================================================
-- 7. FUNÇÕES DE VALIDAÇÃO
-- =====================================================

-- Função para validar estrutura de work item
CREATE OR REPLACE FUNCTION milapp.validate_work_item_data(work_item_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validar campos obrigatórios
    IF NOT (work_item_data ? 'title') OR work_item_data->>'title' = '' THEN
        RETURN FALSE;
    END IF;
    
    -- Validar tipo
    IF NOT (work_item_data ? 'type') OR 
       NOT (work_item_data->>'type' IN ('user_story', 'bug', 'task', 'epic', 'spike')) THEN
        RETURN FALSE;
    END IF;
    
    -- Validar prioridade
    IF NOT (work_item_data ? 'priority') OR 
       NOT (work_item_data->>'priority' IN ('low', 'medium', 'high', 'critical')) THEN
        RETURN FALSE;
    END IF;
    
    -- Validar status
    IF NOT (work_item_data ? 'status') OR 
       NOT (work_item_data->>'status' IN ('backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'cancelled')) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Função para validar estrutura de subtarefa
CREATE OR REPLACE FUNCTION milapp.validate_subtask_data(subtask_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validar campos obrigatórios
    IF NOT (subtask_data ? 'title') OR subtask_data->>'title' = '' THEN
        RETURN FALSE;
    END IF;
    
    -- Validar prioridade
    IF NOT (subtask_data ? 'priority') OR 
       NOT (subtask_data->>'priority' IN ('low', 'medium', 'high', 'critical')) THEN
        RETURN FALSE;
    END IF;
    
    -- Validar status
    IF NOT (subtask_data ? 'status') OR 
       NOT (subtask_data->>'status' IN ('todo', 'in_progress', 'done')) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Log de conclusão
DO $$
BEGIN
    RAISE NOTICE 'Funções para work items criadas com sucesso - %', NOW();
END $$; 