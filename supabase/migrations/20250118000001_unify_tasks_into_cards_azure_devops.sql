-- =====================================================
-- MIGRAÇÃO: Unificação de Tarefas em Cartões (Azure DevOps Style)
-- =====================================================
-- Descrição: Refatorar estrutura para unificar tarefas diretamente nos cartões
-- Data: 2025-01-18
-- Versão: 1.0.1
-- Commit: refactor(ui): unify task control into card component as inline task list (Azure DevOps style)
-- =====================================================

-- Configuração de timezone
SET timezone = 'America/Sao_Paulo';

-- Log de início
DO $$
BEGIN
    RAISE NOTICE 'Iniciando unificação de tarefas em cartões (Azure DevOps style) - %', NOW();
END $$;

-- =====================================================
-- 1. BACKUP DOS DADOS EXISTENTES
-- =====================================================

-- Criar tabela de backup para tasks existentes
CREATE TABLE IF NOT EXISTS milapp.tasks_backup AS 
SELECT * FROM milapp.projects WHERE tasks IS NOT NULL;

-- =====================================================
-- 2. REFATORAÇÃO DO SCHEMA PARA AZURE DEVOPS STYLE
-- =====================================================

-- Atualizar estrutura de tasks para incluir subtarefas inline
ALTER TABLE milapp.projects 
ADD COLUMN IF NOT EXISTS work_items JSONB DEFAULT '[]';

-- Adicionar campo para configuração do board Azure DevOps
ALTER TABLE milapp.projects 
ADD COLUMN IF NOT EXISTS azure_devops_config JSONB DEFAULT '{
  "board_settings": {
    "show_subtasks_inline": true,
    "enable_task_estimation": true,
    "enable_time_tracking": true,
    "enable_acceptance_criteria": true,
    "enable_dependencies": true,
    "max_subtasks_per_card": 10,
    "default_task_type": "task",
    "default_priority": "medium"
  },
  "column_config": {
    "backlog": {"title": "Backlog", "color": "#6c757d", "wip_limit": null, "allow_subtasks": true},
    "todo": {"title": "To Do", "color": "#007bff", "wip_limit": null, "allow_subtasks": true},
    "in_progress": {"title": "In Progress", "color": "#ffc107", "wip_limit": 5, "allow_subtasks": true},
    "review": {"title": "Review", "color": "#17a2b8", "wip_limit": 3, "allow_subtasks": true},
    "testing": {"title": "Testing", "color": "#fd7e14", "wip_limit": 3, "allow_subtasks": true},
    "done": {"title": "Done", "color": "#28a745", "wip_limit": null, "allow_subtasks": true}
  }
}';

-- =====================================================
-- 3. FUNÇÕES PARA GESTÃO DE SUBTAREFAS INLINE
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
        (updated_work_item->'subtasks') || (p_subtask_data || jsonb_build_object('id', subtask_id))
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
-- 4. MIGRAÇÃO DOS DADOS EXISTENTES
-- =====================================================

-- Migrar tasks existentes para work_items com subtarefas inline
DO $$
DECLARE
    project_record RECORD;
    current_tasks JSONB;
    work_items JSONB;
    task_record RECORD;
    task_index INTEGER;
BEGIN
    FOR project_record IN SELECT id, tasks FROM milapp.projects WHERE tasks IS NOT NULL AND jsonb_array_length(tasks) > 0 LOOP
        current_tasks := project_record.tasks;
        work_items := '[]'::jsonb;
        
        -- Converter cada task em work item com subtarefas
        FOR task_index IN 0..jsonb_array_length(current_tasks) - 1 LOOP
            task_record := current_tasks->task_index;
            
            -- Criar work item com subtarefas inline
            work_items := work_items || jsonb_build_object(
                'id', task_record->>'id',
                'title', task_record->>'title',
                'description', COALESCE(task_record->>'description', ''),
                'type', COALESCE(task_record->>'type', 'task'),
                'priority', COALESCE(task_record->>'priority', 'medium'),
                'status', COALESCE(task_record->>'status', 'todo'),
                'story_points', COALESCE((task_record->>'story_points')::int, 0),
                'assignee', task_record->'assignee',
                'acceptance_criteria', COALESCE(task_record->'acceptance_criteria', '[]'::jsonb),
                'dependencies', COALESCE(task_record->'dependencies', '[]'::jsonb),
                'tags', COALESCE(task_record->'tags', '[]'::jsonb),
                'comments', COALESCE((task_record->>'comments')::int, 0),
                'attachments', COALESCE((task_record->>'attachments')::int, 0),
                'due_date', task_record->>'due_date',
                'rpa_bot_id', task_record->>'rpa_bot_id',
                'subtasks', '[]'::jsonb, -- Inicializar array vazio de subtarefas
                'created_at', COALESCE(task_record->>'created_at', NOW()),
                'updated_at', NOW()
            );
        END LOOP;
        
        -- Atualizar projeto com work_items
        UPDATE milapp.projects 
        SET work_items = work_items, updated_at = NOW()
        WHERE id = project_record.id;
        
        RAISE NOTICE 'Migradas % tasks para work_items no projeto %', jsonb_array_length(work_items), project_record.id;
    END LOOP;
END $$;

-- =====================================================
-- 5. ÍNDICES E OTIMIZAÇÕES
-- =====================================================

-- Índice para busca em work_items
CREATE INDEX IF NOT EXISTS idx_projects_work_items_gin 
ON milapp.projects USING GIN (work_items);

-- Índice para busca por status em work_items
CREATE INDEX IF NOT EXISTS idx_projects_work_items_status 
ON milapp.projects USING GIN ((work_items->'status'));

-- Índice para busca por tipo em work_items
CREATE INDEX IF NOT EXISTS idx_projects_work_items_type 
ON milapp.projects USING GIN ((work_items->'type'));

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

-- =====================================================
-- 7. TRIGGERS PARA AUDITORIA
-- =====================================================

-- Função de auditoria para work_items
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

-- Trigger para auditoria de work_items
DROP TRIGGER IF EXISTS audit_project_work_items ON milapp.projects;
CREATE TRIGGER audit_project_work_items
    AFTER UPDATE ON milapp.projects
    FOR EACH ROW
    WHEN (OLD.work_items IS DISTINCT FROM NEW.work_items)
    EXECUTE FUNCTION milapp.audit_work_items_changes();

-- =====================================================
-- 8. FUNÇÕES DE VALIDAÇÃO
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

-- Log de conclusão
DO $$
BEGIN
    RAISE NOTICE 'Unificação de tarefas em cartões concluída - %', NOW();
END $$; 