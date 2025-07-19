-- =====================================================
-- SEED: Ambientes Padrão do Projeto MilApp Builder
-- =====================================================
-- Descrição: Script para inserir ambientes padrão (dev, hml, prod)
-- Autor: MilApp Builder Team
-- Data: 2025-01-18
-- Versão: 1.0.0
-- =====================================================

-- Configuração de timezone para logs
SET timezone = 'America/Sao_Paulo';

-- Log de início da execução
DO $$
BEGIN
    RAISE NOTICE 'Iniciando seed de ambientes padrão - %', NOW();
END $$;

-- =====================================================
-- 1. VERIFICAÇÃO DE EXISTÊNCIA DA TABELA
-- =====================================================

DO $$
BEGIN
    -- Verificar se a tabela environments existe
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'environments'
    ) THEN
        RAISE EXCEPTION 'Tabela environments não encontrada. Execute as migrações primeiro.';
    END IF;
    
    RAISE NOTICE 'Tabela environments encontrada. Prosseguindo com seed...';
END $$;

-- =====================================================
-- 2. LIMPEZA DE DADOS EXISTENTES (OPCIONAL)
-- =====================================================

-- Comentado para evitar perda de dados em produção
-- DELETE FROM environments WHERE name IN ('dev', 'hml', 'prod');

-- =====================================================
-- 3. INSERÇÃO DOS AMBIENTES PADRÃO
-- =====================================================

-- Ambiente de Desenvolvimento (DEV)
INSERT INTO environments (
    id,
    name,
    description,
    url,
    project_id,
    environment_type,
    is_default,
    is_public,
    status,
    config,
    created_by,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'dev',
    'Ambiente de Desenvolvimento - Para testes e desenvolvimento local',
    'https://dev.milapp-builder.supabase.co',
    (SELECT id FROM projects WHERE name = 'MilApp Builder' LIMIT 1),
    'development',
    false,
    true,
    'active',
    '{
        "auto_deploy": true,
        "require_approval": false,
        "notifications": {
            "slack": false,
            "email": true,
            "webhook": false
        },
        "database": {
            "backup_enabled": false,
            "migrations_auto": true
        },
        "security": {
            "rls_enabled": true,
            "audit_logging": true
        }
    }'::jsonb,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    NOW(),
    NOW()
) ON CONFLICT (name, project_id) DO UPDATE SET
    description = EXCLUDED.description,
    url = EXCLUDED.url,
    environment_type = EXCLUDED.environment_type,
    config = EXCLUDED.config,
    updated_at = NOW();

-- Ambiente de Homologação (HML)
INSERT INTO environments (
    id,
    name,
    description,
    url,
    project_id,
    environment_type,
    is_default,
    is_public,
    status,
    config,
    created_by,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'hml',
    'Ambiente de Homologação - Para testes de integração e QA',
    'https://hml.milapp-builder.supabase.co',
    (SELECT id FROM projects WHERE name = 'MilApp Builder' LIMIT 1),
    'staging',
    false,
    false,
    'active',
    '{
        "auto_deploy": false,
        "require_approval": true,
        "notifications": {
            "slack": true,
            "email": true,
            "webhook": false
        },
        "database": {
            "backup_enabled": true,
            "migrations_auto": false
        },
        "security": {
            "rls_enabled": true,
            "audit_logging": true
        }
    }'::jsonb,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    NOW(),
    NOW()
) ON CONFLICT (name, project_id) DO UPDATE SET
    description = EXCLUDED.description,
    url = EXCLUDED.url,
    environment_type = EXCLUDED.environment_type,
    config = EXCLUDED.config,
    updated_at = NOW();

-- Ambiente de Produção (PROD)
INSERT INTO environments (
    id,
    name,
    description,
    url,
    project_id,
    environment_type,
    is_default,
    is_public,
    status,
    config,
    created_by,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'prod',
    'Ambiente de Produção - Sistema em produção para usuários finais',
    'https://milapp-builder.supabase.co',
    (SELECT id FROM projects WHERE name = 'MilApp Builder' LIMIT 1),
    'production',
    true,
    false,
    'active',
    '{
        "auto_deploy": false,
        "require_approval": true,
        "notifications": {
            "slack": true,
            "email": true,
            "webhook": true
        },
        "database": {
            "backup_enabled": true,
            "migrations_auto": false,
            "backup_retention": "30d"
        },
        "security": {
            "rls_enabled": true,
            "audit_logging": true,
            "rate_limiting": true
        },
        "monitoring": {
            "health_checks": true,
            "performance_monitoring": true,
            "error_tracking": true
        }
    }'::jsonb,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1),
    NOW(),
    NOW()
) ON CONFLICT (name, project_id) DO UPDATE SET
    description = EXCLUDED.description,
    url = EXCLUDED.url,
    environment_type = EXCLUDED.environment_type,
    config = EXCLUDED.config,
    updated_at = NOW();

-- =====================================================
-- 4. VERIFICAÇÃO DOS DADOS INSERIDOS
-- =====================================================

DO $$
DECLARE
    dev_count INTEGER;
    hml_count INTEGER;
    prod_count INTEGER;
    total_count INTEGER;
BEGIN
    -- Contar registros inseridos
    SELECT COUNT(*) INTO dev_count FROM environments WHERE name = 'dev';
    SELECT COUNT(*) INTO hml_count FROM environments WHERE name = 'hml';
    SELECT COUNT(*) INTO prod_count FROM environments WHERE name = 'prod';
    SELECT COUNT(*) INTO total_count FROM environments;
    
    -- Log dos resultados
    RAISE NOTICE 'Seed concluído com sucesso:';
    RAISE NOTICE '- Ambientes DEV: %', dev_count;
    RAISE NOTICE '- Ambientes HML: %', hml_count;
    RAISE NOTICE '- Ambientes PROD: %', prod_count;
    RAISE NOTICE '- Total de ambientes: %', total_count;
    
    -- Verificar se todos foram inseridos
    IF dev_count = 0 OR hml_count = 0 OR prod_count = 0 THEN
        RAISE WARNING 'Alguns ambientes padrão não foram inseridos. Verifique os logs.';
    END IF;
    
END $$;

-- =====================================================
-- 5. CRIAÇÃO DE ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índice para busca por nome e projeto
CREATE INDEX IF NOT EXISTS idx_environments_name_project 
ON environments(name, project_id);

-- Índice para busca por tipo de ambiente
CREATE INDEX IF NOT EXISTS idx_environments_type 
ON environments(environment_type);

-- Índice para busca por status
CREATE INDEX IF NOT EXISTS idx_environments_status 
ON environments(status);

-- Índice para busca por ambiente padrão
CREATE INDEX IF NOT EXISTS idx_environments_default 
ON environments(is_default) WHERE is_default = true;

-- =====================================================
-- 6. LOGS DE AUDITORIA
-- =====================================================

-- Inserir logs de auditoria para os ambientes criados
INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    user_id,
    user_email,
    ip_address,
    created_at
) 
SELECT 
    'environments',
    e.id,
    'INSERT',
    NULL,
    to_jsonb(e),
    e.created_by,
    u.email,
    '127.0.0.1',
    NOW()
FROM environments e
LEFT JOIN users u ON e.created_by = u.id
WHERE e.name IN ('dev', 'hml', 'prod')
AND e.created_at >= NOW() - INTERVAL '1 minute';

-- =====================================================
-- 7. NOTIFICAÇÕES (OPCIONAL)
-- =====================================================

-- Comentado para evitar spam em desenvolvimento
/*
DO $$
BEGIN
    -- Notificar administradores sobre novos ambientes
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        created_at
    )
    SELECT 
        u.id,
        'environment_created',
        'Ambientes Padrão Criados',
        'Os ambientes dev, hml e prod foram criados com sucesso.',
        '{"environments": ["dev", "hml", "prod"]}'::jsonb,
        NOW()
    FROM users u
    WHERE u.role = 'admin';
END $$;
*/

-- =====================================================
-- 8. FINALIZAÇÃO
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Seed de ambientes padrão concluído com sucesso - %', NOW();
    RAISE NOTICE 'Ambientes disponíveis: dev, hml, prod';
    RAISE NOTICE 'Execute "supabase db reset" para aplicar todas as mudanças';
END $$;

-- =====================================================
-- FIM DO SCRIPT
-- ===================================================== 