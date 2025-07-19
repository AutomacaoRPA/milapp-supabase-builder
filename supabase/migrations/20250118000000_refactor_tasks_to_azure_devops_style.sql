-- =====================================================
-- MIGRAÇÃO: Refatoração para Padrão Azure DevOps
-- =====================================================
-- Descrição: Unificar controle de tarefas em cartões (Azure DevOps style)
-- Data: 2025-01-18
-- Versão: 1.0.0
-- =====================================================

-- Configuração de timezone
SET timezone = 'America/Sao_Paulo';

-- Log de início
DO $$
BEGIN
    RAISE NOTICE 'Iniciando refatoração para padrão Azure DevOps - %', NOW();
END $$;

-- =====================================================
-- 1. BACKUP DOS DADOS EXISTENTES
-- =====================================================

-- Criar tabela de backup para user_stories existentes
CREATE TABLE IF NOT EXISTS milapp.user_stories_backup AS 
SELECT * FROM milapp.user_stories;

-- Criar tabela de backup para project_tasks existentes (se existir)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'milapp' AND table_name = 'project_tasks') THEN
        EXECUTE 'CREATE TABLE milapp.project_tasks_backup AS SELECT * FROM milapp.project_tasks';
        RAISE NOTICE 'Backup da tabela project_tasks criado';
    ELSE
        RAISE NOTICE 'Tabela project_tasks não encontrada, pulando backup';
    END IF;
END $$;

-- =====================================================
-- 2. REFATORAÇÃO DA TABELA DE PROJETOS
-- =====================================================

-- Adicionar campo tasks[] ao projeto (Azure DevOps style)
ALTER TABLE milapp.projects 
ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT '[]';

-- Adicionar campo work_items[] ao projeto (para compatibilidade)
ALTER TABLE milapp.projects 
ADD COLUMN IF NOT EXISTS work_items JSONB DEFAULT '[]';

-- Adicionar campo sprint_backlog ao projeto
ALTER TABLE milapp.projects 
ADD COLUMN IF NOT EXISTS sprint_backlog JSONB DEFAULT '[]';

-- Adicionar campo product_backlog ao projeto
ALTER TABLE milapp.projects 
ADD COLUMN IF NOT EXISTS product_backlog JSONB DEFAULT '[]';

-- Adicionar campo kanban_board ao projeto
ALTER TABLE milapp.projects 
ADD COLUMN IF NOT EXISTS kanban_board JSONB DEFAULT '{
  "columns": [
    {"id": "backlog", "title": "Backlog", "status": "backlog", "color": "#6c757d", "wip_limit": null},
    {"id": "todo", "title": "To Do", "status": "todo", "color": "#007bff", "wip_limit": null},
    {"id": "in_progress", "title": "In Progress", "status": "in_progress", "color": "#ffc107", "wip_limit": 5},
    {"id": "review", "title": "Review", "status": "review", "color": "#17a2b8", "wip_limit": 3},
    {"id": "testing", "title": "Testing", "status": "testing", "color": "#fd7e14", "wip_limit": 3},
    {"id": "done", "title": "Done", "status": "done", "color": "#28a745", "wip_limit": null}
  ]
}';

-- =====================================================
-- 3. MIGRAÇÃO DOS DADOS EXISTENTES
-- =====================================================

-- Migrar user_stories existentes para o campo tasks do projeto
DO $$
DECLARE
    project_record RECORD;
    project_tasks JSONB;
    story_record RECORD;
BEGIN
    FOR project_record IN SELECT id FROM milapp.projects LOOP
        project_tasks := '[]'::jsonb;
        
        -- Buscar todas as user_stories do projeto
        FOR story_record IN 
            SELECT 
                id,
                title,
                description,
                type,
                priority,
                status,
                story_points,
                assigned_to,
                acceptance_criteria,
                dependencies,
                labels,
                created_at,
                updated_at
            FROM milapp.user_stories_backup 
            WHERE project_id = project_record.id
        LOOP
            -- Converter para formato Azure DevOps
            project_tasks := project_tasks || jsonb_build_object(
                'id', story_record.id,
                'title', story_record.title,
                'description', COALESCE(story_record.description, ''),
                'type', story_record.type,
                'priority', CASE 
                    WHEN story_record.priority = 1 THEN 'critical'
                    WHEN story_record.priority = 2 THEN 'high'
                    WHEN story_record.priority = 3 THEN 'medium'
                    WHEN story_record.priority = 4 THEN 'low'
                    ELSE 'medium'
                END,
                'status', story_record.status,
                'story_points', COALESCE(story_record.story_points, 0),
                'assignee', CASE 
                    WHEN story_record.assigned_to IS NOT NULL THEN 
                        jsonb_build_object('id', story_record.assigned_to)
                    ELSE NULL
                END,
                'acceptance_criteria', COALESCE(story_record.acceptance_criteria, '[]'::jsonb),
                'dependencies', COALESCE(story_record.dependencies, '[]'::jsonb),
                'tags', COALESCE(story_record.labels, '[]'::jsonb),
                'comments', 0,
                'attachments', 0,
                'created_at', story_record.created_at,
                'updated_at', story_record.updated_at,
                'due_date', NULL,
                'rpa_bot_id', NULL
            );
        END LOOP;
        
        -- Atualizar o projeto com as tarefas migradas
        UPDATE milapp.projects 
        SET tasks = project_tasks
        WHERE id = project_record.id;
        
        RAISE NOTICE 'Migradas % tarefas para o projeto %', jsonb_array_length(project_tasks), project_record.id;
    END LOOP;
END $$;

-- =====================================================
-- 4. FUNÇÕES AUXILIARES PARA GESTÃO DE TAREFAS
-- =====================================================

-- Função para adicionar tarefa ao projeto
CREATE OR REPLACE FUNCTION milapp.add_task_to_project(
    p_project_id UUID,
    p_task_data JSONB
) RETURNS JSONB AS $$
DECLARE
    current_tasks JSONB;
    new_task JSONB;
    task_id UUID;
BEGIN
    -- Gerar ID único para a tarefa
    task_id := gen_random_uuid();
    
    -- Adicionar ID à tarefa
    new_task := p_task_data || jsonb_build_object('id', task_id);
    
    -- Buscar tarefas atuais do projeto
    SELECT tasks INTO current_tasks 
    FROM milapp.projects 
    WHERE id = p_project_id;
    
    -- Adicionar nova tarefa
    current_tasks := COALESCE(current_tasks, '[]'::jsonb) || new_task;
    
    -- Atualizar projeto
    UPDATE milapp.projects 
    SET tasks = current_tasks, updated_at = NOW()
    WHERE id = p_project_id;
    
    RETURN new_task;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar tarefa no projeto
CREATE OR REPLACE FUNCTION milapp.update_task_in_project(
    p_project_id UUID,
    p_task_id UUID,
    p_task_data JSONB
) RETURNS JSONB AS $$
DECLARE
    current_tasks JSONB;
    updated_tasks JSONB;
    task_index INTEGER;
    task_record RECORD;
BEGIN
    -- Buscar tarefas atuais do projeto
    SELECT tasks INTO current_tasks 
    FROM milapp.projects 
    WHERE id = p_project_id;
    
    -- Encontrar índice da tarefa
    task_index := -1;
    FOR i IN 0..jsonb_array_length(current_tasks) - 1 LOOP
        IF (current_tasks->i->>'id')::UUID = p_task_id THEN
            task_index := i;
            EXIT;
        END IF;
    END LOOP;
    
    IF task_index = -1 THEN
        RAISE EXCEPTION 'Tarefa não encontrada';
    END IF;
    
    -- Atualizar tarefa
    updated_tasks := current_tasks;
    updated_tasks := jsonb_set(
        updated_tasks, 
        ARRAY[task_index::text], 
        (current_tasks->task_index) || p_task_data || jsonb_build_object('updated_at', NOW())
    );
    
    -- Atualizar projeto
    UPDATE milapp.projects 
    SET tasks = updated_tasks, updated_at = NOW()
    WHERE id = p_project_id;
    
    RETURN updated_tasks->task_index;
END;
$$ LANGUAGE plpgsql;

-- Função para remover tarefa do projeto
CREATE OR REPLACE FUNCTION milapp.remove_task_from_project(
    p_project_id UUID,
    p_task_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    current_tasks JSONB;
    updated_tasks JSONB;
    task_record RECORD;
BEGIN
    -- Buscar tarefas atuais do projeto
    SELECT tasks INTO current_tasks 
    FROM milapp.projects 
    WHERE id = p_project_id;
    
    -- Filtrar tarefa removida
    updated_tasks := '[]'::jsonb;
    FOR task_record IN SELECT * FROM jsonb_array_elements(current_tasks) LOOP
        IF (task_record.value->>'id')::UUID != p_task_id THEN
            updated_tasks := updated_tasks || task_record.value;
        END IF;
    END LOOP;
    
    -- Atualizar projeto
    UPDATE milapp.projects 
    SET tasks = updated_tasks, updated_at = NOW()
    WHERE id = p_project_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Função para mover tarefa entre colunas (drag & drop)
CREATE OR REPLACE FUNCTION milapp.move_task_column(
    p_project_id UUID,
    p_task_id UUID,
    p_new_status TEXT
) RETURNS JSONB AS $$
DECLARE
    current_tasks JSONB;
    updated_tasks JSONB;
    task_record RECORD;
BEGIN
    -- Buscar tarefas atuais do projeto
    SELECT tasks INTO current_tasks 
    FROM milapp.projects 
    WHERE id = p_project_id;
    
    -- Atualizar status da tarefa
    updated_tasks := '[]'::jsonb;
    FOR task_record IN SELECT * FROM jsonb_array_elements(current_tasks) LOOP
        IF (task_record.value->>'id')::UUID = p_task_id THEN
            -- Atualizar status e timestamp
            updated_tasks := updated_tasks || jsonb_set(
                task_record.value,
                '{status,updated_at}',
                jsonb_build_array(p_new_status, NOW())
            );
        ELSE
            updated_tasks := updated_tasks || task_record.value;
        END IF;
    END LOOP;
    
    -- Atualizar projeto
    UPDATE milapp.projects 
    SET tasks = updated_tasks, updated_at = NOW()
    WHERE id = p_project_id;
    
    RETURN updated_tasks;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. TRIGGERS PARA AUDITORIA
-- =====================================================

-- Trigger para auditoria de mudanças em tarefas
CREATE OR REPLACE FUNCTION milapp.audit_task_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar mudanças na auditoria
    INSERT INTO milapp.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        timestamp
    ) VALUES (
        COALESCE(NEW.updated_by, NEW.created_by),
        TG_OP,
        'project_tasks',
        NEW.id,
        jsonb_build_object(
            'project_id', NEW.id,
            'tasks_count', jsonb_array_length(NEW.tasks),
            'operation', TG_OP
        ),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger
DROP TRIGGER IF EXISTS audit_project_tasks ON milapp.projects;
CREATE TRIGGER audit_project_tasks
    AFTER UPDATE ON milapp.projects
    FOR EACH ROW
    WHEN (OLD.tasks IS DISTINCT FROM NEW.tasks)
    EXECUTE FUNCTION milapp.audit_task_changes();

-- =====================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice GIN para busca em tarefas
CREATE INDEX IF NOT EXISTS idx_projects_tasks_gin 
ON milapp.projects USING GIN (tasks);

-- Índice para busca por status de tarefas
CREATE INDEX IF NOT EXISTS idx_projects_tasks_status 
ON milapp.projects USING GIN ((tasks->>'status'));

-- Índice para busca por tipo de tarefas
CREATE INDEX IF NOT EXISTS idx_projects_tasks_type 
ON milapp.projects USING GIN ((tasks->>'type'));

-- =====================================================
-- 7. DESABILITAR TABELAS ANTIGAS (OPCIONAL)
-- =====================================================

-- Comentado para evitar perda de dados
-- DROP TABLE IF EXISTS milapp.user_stories;
-- DROP TABLE IF EXISTS milapp.project_tasks;

-- =====================================================
-- 8. VIEWS PARA COMPATIBILIDADE
-- =====================================================

-- View para compatibilidade com código existente
CREATE OR REPLACE VIEW milapp.tasks_view AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    t.value->>'id' as task_id,
    t.value->>'title' as title,
    t.value->>'description' as description,
    t.value->>'type' as type,
    t.value->>'priority' as priority,
    t.value->>'status' as status,
    (t.value->>'story_points')::integer as story_points,
    t.value->'assignee'->>'id' as assigned_to,
    t.value->>'acceptance_criteria' as acceptance_criteria,
    t.value->>'dependencies' as dependencies,
    t.value->>'tags' as tags,
    (t.value->>'comments')::integer as comments,
    (t.value->>'attachments')::integer as attachments,
    (t.value->>'created_at')::timestamp as created_at,
    (t.value->>'updated_at')::timestamp as updated_at
FROM milapp.projects p
CROSS JOIN LATERAL jsonb_array_elements(p.tasks) t;

-- =====================================================
-- 9. VALIDAÇÕES E CONSTRAINTS
-- =====================================================

-- Função de validação para tarefas
CREATE OR REPLACE FUNCTION milapp.validate_task_data(task_data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
    -- Validar campos obrigatórios
    IF NOT (task_data ? 'title' AND task_data ? 'type' AND task_data ? 'status') THEN
        RETURN FALSE;
    END IF;
    
    -- Validar tipos permitidos
    IF NOT (task_data->>'type' IN ('user_story', 'bug', 'task', 'epic', 'spike')) THEN
        RETURN FALSE;
    END IF;
    
    -- Validar status permitidos
    IF NOT (task_data->>'status' IN ('backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'cancelled')) THEN
        RETURN FALSE;
    END IF;
    
    -- Validar prioridade permitida
    IF task_data ? 'priority' AND NOT (task_data->>'priority' IN ('low', 'medium', 'high', 'critical')) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. FINALIZAÇÃO
-- =====================================================

-- Log de conclusão
DO $$
DECLARE
    projects_count INTEGER;
    tasks_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO projects_count FROM milapp.projects;
    SELECT SUM(jsonb_array_length(tasks)) INTO tasks_count FROM milapp.projects;
    
    RAISE NOTICE 'Refatoração concluída com sucesso!';
    RAISE NOTICE '- Projetos processados: %', projects_count;
    RAISE NOTICE '- Tarefas migradas: %', COALESCE(tasks_count, 0);
    RAISE NOTICE '- Estrutura Azure DevOps implementada';
    RAISE NOTICE '- Funções auxiliares criadas';
    RAISE NOTICE '- Índices de performance otimizados';
END $$;

-- =====================================================
-- FIM DA MIGRAÇÃO
-- ===================================================== 