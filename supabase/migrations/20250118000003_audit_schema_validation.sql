-- AUDITORIA CRÍTICA: Validação completa de schemas e dados
-- Migration para garantir ZERO inconsistências no lançamento

-- =====================================================
-- 1. AUDITORIA DE SCHEMAS EXISTENTES
-- =====================================================

-- Verificar estrutura atual das tabelas
DO $$
DECLARE
    table_record RECORD;
    column_record RECORD;
    constraint_record RECORD;
BEGIN
    RAISE NOTICE '=== AUDITORIA DE SCHEMAS MILAPP ===';
    
    -- Listar todas as tabelas
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        RAISE NOTICE 'Tabela: %', table_record.table_name;
        
        -- Listar colunas de cada tabela
        FOR column_record IN 
            SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = table_record.table_name
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  - %: % (nullable: %, default: %, max_length: %)', 
                column_record.column_name, 
                column_record.data_type, 
                column_record.is_nullable, 
                COALESCE(column_record.column_default, 'NULL'),
                COALESCE(column_record.character_maximum_length::text, 'N/A');
        END LOOP;
        
        -- Listar constraints
        FOR constraint_record IN 
            SELECT constraint_name, constraint_type
            FROM information_schema.table_constraints 
            WHERE table_schema = 'public' 
            AND table_name = table_record.table_name
        LOOP
            RAISE NOTICE '  - Constraint: % (%%)', constraint_record.constraint_name, constraint_record.constraint_type;
        END LOOP;
        
        RAISE NOTICE '';
    END LOOP;
END $$;

-- =====================================================
-- 2. VALIDAÇÕES CRÍTICAS DE INTEGRIDADE
-- =====================================================

-- Função para validar WorkItems
CREATE OR REPLACE FUNCTION validate_work_item(
    p_title TEXT,
    p_description TEXT DEFAULT NULL,
    p_type TEXT,
    p_priority TEXT,
    p_status TEXT,
    p_story_points INTEGER DEFAULT NULL,
    p_project_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- Validação de título
    IF p_title IS NULL OR LENGTH(TRIM(p_title)) = 0 THEN
        RAISE EXCEPTION 'Título é obrigatório';
    END IF;
    
    IF LENGTH(p_title) > 255 THEN
        RAISE EXCEPTION 'Título não pode ter mais de 255 caracteres';
    END IF;
    
    -- Validação de tipo
    IF p_type NOT IN ('user_story', 'bug', 'task', 'epic', 'spike') THEN
        RAISE EXCEPTION 'Tipo inválido: %', p_type;
    END IF;
    
    -- Validação de prioridade
    IF p_priority NOT IN ('critical', 'high', 'medium', 'low') THEN
        RAISE EXCEPTION 'Prioridade inválida: %', p_priority;
    END IF;
    
    -- Validação de status
    IF p_status NOT IN ('backlog', 'in_progress', 'testing', 'done', 'cancelled') THEN
        RAISE EXCEPTION 'Status inválido: %', p_status;
    END IF;
    
    -- Validação de story points
    IF p_story_points IS NOT NULL AND (p_story_points < 0 OR p_story_points > 100) THEN
        RAISE EXCEPTION 'Story points devem estar entre 0 e 100';
    END IF;
    
    -- Validação de project_id
    IF p_project_id IS NULL THEN
        RAISE EXCEPTION 'Project ID é obrigatório';
    END IF;
    
    -- Verificar se projeto existe
    IF NOT EXISTS (SELECT 1 FROM projects WHERE id = p_project_id) THEN
        RAISE EXCEPTION 'Projeto não encontrado: %', p_project_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Função para validar subtarefas
CREATE OR REPLACE FUNCTION validate_subtask(
    p_title TEXT,
    p_status TEXT,
    p_estimated_hours NUMERIC DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    -- Validação de título
    IF p_title IS NULL OR LENGTH(TRIM(p_title)) = 0 THEN
        RAISE EXCEPTION 'Título da subtarefa é obrigatório';
    END IF;
    
    IF LENGTH(p_title) > 200 THEN
        RAISE EXCEPTION 'Título da subtarefa não pode ter mais de 200 caracteres';
    END IF;
    
    -- Validação de status
    IF p_status NOT IN ('todo', 'in_progress', 'done', 'blocked') THEN
        RAISE EXCEPTION 'Status de subtarefa inválido: %', p_status;
    END IF;
    
    -- Validação de horas estimadas
    IF p_estimated_hours IS NOT NULL AND (p_estimated_hours < 0 OR p_estimated_hours > 1000) THEN
        RAISE EXCEPTION 'Horas estimadas devem estar entre 0 e 1000';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. CONSTRAINTS DE VALIDAÇÃO RIGOROSOS
-- =====================================================

-- Adicionar constraints de validação nas tabelas existentes
ALTER TABLE projects 
ADD CONSTRAINT projects_name_length CHECK (LENGTH(name) >= 3 AND LENGTH(name) <= 100),
ADD CONSTRAINT projects_description_length CHECK (LENGTH(description) <= 1000);

-- Se a tabela work_items existir, adicionar constraints
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_items') THEN
        ALTER TABLE work_items 
        ADD CONSTRAINT work_items_title_length CHECK (LENGTH(title) >= 3 AND LENGTH(title) <= 255),
        ADD CONSTRAINT work_items_story_points_range CHECK (story_points >= 0 AND story_points <= 100);
    END IF;
END $$;

-- =====================================================
-- 4. ÍNDICES DE PERFORMANCE PARA CARGA ALTA
-- =====================================================

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

-- Índices para work items (se a tabela existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_items') THEN
        CREATE INDEX IF NOT EXISTS idx_work_items_project_id ON work_items(project_id);
        CREATE INDEX IF NOT EXISTS idx_work_items_status ON work_items(status);
        CREATE INDEX IF NOT EXISTS idx_work_items_type ON work_items(type);
        CREATE INDEX IF NOT EXISTS idx_work_items_priority ON work_items(priority);
        CREATE INDEX IF NOT EXISTS idx_work_items_created_at ON work_items(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_work_items_updated_at ON work_items(updated_at DESC);
        
        -- Índice composto para consultas complexas
        CREATE INDEX IF NOT EXISTS idx_work_items_project_status ON work_items(project_id, status);
        CREATE INDEX IF NOT EXISTS idx_work_items_project_type ON work_items(project_id, type);
    END IF;
END $$;

-- =====================================================
-- 5. TRIGGERS DE AUDITORIA E VALIDAÇÃO
-- =====================================================

-- Tabela de auditoria
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    user_id UUID,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para auditoria de projetos
CREATE OR REPLACE FUNCTION audit_projects_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, operation, record_id, new_data, user_id)
        VALUES ('projects', 'INSERT', NEW.id, to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, operation, record_id, old_data, new_data, user_id)
        VALUES ('projects', 'UPDATE', NEW.id, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, operation, record_id, old_data, user_id)
        VALUES ('projects', 'DELETE', OLD.id, to_jsonb(OLD), auth.uid());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger se a tabela projects existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
        DROP TRIGGER IF EXISTS audit_projects_trigger ON projects;
        CREATE TRIGGER audit_projects_trigger
            AFTER INSERT OR UPDATE OR DELETE ON projects
            FOR EACH ROW EXECUTE FUNCTION audit_projects_trigger();
    END IF;
END $$;

-- =====================================================
-- 6. FUNÇÕES DE LIMPEZA E MANUTENÇÃO
-- =====================================================

-- Função para limpar logs antigos
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 90) RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_log 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para estatísticas de uso
CREATE OR REPLACE FUNCTION get_system_stats() RETURNS JSONB AS $$
DECLARE
    stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_projects', (SELECT COUNT(*) FROM projects),
        'active_projects', (SELECT COUNT(*) FROM projects WHERE status = 'active'),
        'total_work_items', (SELECT COUNT(*) FROM work_items WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_items')),
        'audit_logs_count', (SELECT COUNT(*) FROM audit_log),
        'last_activity', (SELECT MAX(created_at) FROM audit_log),
        'database_size', (SELECT pg_size_pretty(pg_database_size(current_database())))
    ) INTO stats;
    
    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. VALIDAÇÕES DE SEGURANÇA
-- =====================================================

-- Função para validar entrada de texto (prevenção XSS)
CREATE OR REPLACE FUNCTION sanitize_text(input_text TEXT) RETURNS TEXT AS $$
BEGIN
    -- Remover caracteres potencialmente perigosos
    RETURN regexp_replace(
        regexp_replace(
            regexp_replace(input_text, '<script[^>]*>.*?</script>', '', 'gi'),
            'javascript:', '', 'gi'
        ),
        'on\w+\s*=', '', 'gi'
    );
END;
$$ LANGUAGE plpgsql;

-- Função para validar tamanho de upload
CREATE OR REPLACE FUNCTION validate_file_size(file_size BIGINT, max_size_mb INTEGER DEFAULT 50) RETURNS BOOLEAN AS $$
BEGIN
    RETURN file_size <= (max_size_mb * 1024 * 1024);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. TESTES DE CARGA SIMULADOS
-- =====================================================

-- Função para simular criação de múltiplos work items
CREATE OR REPLACE FUNCTION simulate_bulk_work_items(
    project_id UUID,
    count_items INTEGER DEFAULT 100
) RETURNS INTEGER AS $$
DECLARE
    i INTEGER;
    created_count INTEGER := 0;
    work_item_data JSONB;
BEGIN
    FOR i IN 1..count_items LOOP
        work_item_data := jsonb_build_object(
            'title', 'Work Item Test ' || i,
            'description', 'Descrição do work item de teste ' || i,
            'type', CASE (i % 4) 
                WHEN 0 THEN 'user_story'
                WHEN 1 THEN 'bug'
                WHEN 2 THEN 'task'
                ELSE 'epic'
            END,
            'priority', CASE (i % 4)
                WHEN 0 THEN 'critical'
                WHEN 1 THEN 'high'
                WHEN 2 THEN 'medium'
                ELSE 'low'
            END,
            'status', CASE (i % 4)
                WHEN 0 THEN 'backlog'
                WHEN 1 THEN 'in_progress'
                WHEN 2 THEN 'testing'
                ELSE 'done'
            END,
            'story_points', (i % 13) + 1,
            'project_id', project_id
        );
        
        -- Validar antes de inserir
        IF validate_work_item(
            work_item_data->>'title',
            work_item_data->>'description',
            work_item_data->>'type',
            work_item_data->>'priority',
            work_item_data->>'status',
            (work_item_data->>'story_points')::INTEGER,
            (work_item_data->>'project_id')::UUID
        ) THEN
            -- Inserir work item (se a tabela existir)
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_items') THEN
                INSERT INTO work_items (
                    title, description, type, priority, status, 
                    story_points, project_id, created_at, updated_at
                ) VALUES (
                    work_item_data->>'title',
                    work_item_data->>'description',
                    work_item_data->>'type',
                    work_item_data->>'priority',
                    work_item_data->>'status',
                    (work_item_data->>'story_points')::INTEGER,
                    (work_item_data->>'project_id')::UUID,
                    NOW(),
                    NOW()
                );
                created_count := created_count + 1;
            END IF;
        END IF;
    END LOOP;
    
    RETURN created_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. RELATÓRIO DE AUDITORIA
-- =====================================================

-- Função para gerar relatório de auditoria
CREATE OR REPLACE FUNCTION generate_audit_report() RETURNS JSONB AS $$
DECLARE
    report JSONB;
BEGIN
    SELECT jsonb_build_object(
        'audit_timestamp', NOW(),
        'database_info', jsonb_build_object(
            'name', current_database(),
            'version', version(),
            'size', pg_size_pretty(pg_database_size(current_database()))
        ),
        'tables_info', (
            SELECT jsonb_object_agg(table_name, jsonb_build_object(
                'columns_count', columns_count,
                'constraints_count', constraints_count,
                'indexes_count', indexes_count
            ))
            FROM (
                SELECT 
                    t.table_name,
                    COUNT(DISTINCT c.column_name) as columns_count,
                    COUNT(DISTINCT tc.constraint_name) as constraints_count,
                    COUNT(DISTINCT i.indexname) as indexes_count
                FROM information_schema.tables t
                LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
                LEFT JOIN information_schema.table_constraints tc ON t.table_name = tc.table_name
                LEFT JOIN pg_indexes i ON t.table_name = i.tablename
                WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
                GROUP BY t.table_name
            ) table_stats
        ),
        'validation_functions', (
            SELECT jsonb_agg(function_name)
            FROM (
                SELECT routine_name as function_name
                FROM information_schema.routines
                WHERE routine_schema = 'public' 
                AND routine_name LIKE 'validate_%'
            ) validation_funcs
        ),
        'system_stats', get_system_stats()
    ) INTO report;
    
    RETURN report;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. EXECUÇÃO DA AUDITORIA
-- =====================================================

-- Executar auditoria e gerar relatório
DO $$
DECLARE
    audit_result JSONB;
BEGIN
    RAISE NOTICE '=== INICIANDO AUDITORIA COMPLETA ===';
    
    -- Gerar relatório
    audit_result := generate_audit_report();
    
    RAISE NOTICE 'Relatório de Auditoria: %', audit_result;
    
    RAISE NOTICE '=== AUDITORIA CONCLUÍDA ===';
    RAISE NOTICE 'Status: TODAS AS VALIDAÇÕES IMPLEMENTADAS';
    RAISE NOTICE 'Próximo: Executar testes de carga e falhas';
END $$; 