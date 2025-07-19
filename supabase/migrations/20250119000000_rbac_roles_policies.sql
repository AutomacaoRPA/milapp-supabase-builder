-- =====================================================
-- MILAPP MedSênior - RBAC e Políticas de Segurança
-- Versão: 2.0.0
-- Data: 19/07/2024
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. CRIAR ROLES (FUNÇÕES) DO SISTEMA
-- =====================================================

-- Role: Administrador do Sistema
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'medsenior_admin') THEN
        CREATE ROLE medsenior_admin;
    END IF;
END
$$;

-- Role: Gestor de Projetos
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'medsenior_gestor') THEN
        CREATE ROLE medsenior_gestor;
    END IF;
END
$$;

-- Role: Analista de Automação
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'medsenior_analista') THEN
        CREATE ROLE medsenior_analista;
    END IF;
END
$$;

-- Role: Especialista em IA
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'medsenior_ia') THEN
        CREATE ROLE medsenior_ia;
    END IF;
END
$$;

-- Role: Usuário Padrão
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'medsenior_user') THEN
        CREATE ROLE medsenior_user;
    END IF;
END
$$;

-- Role: Apenas Leitura
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'medsenior_readonly') THEN
        CREATE ROLE medsenior_readonly;
    END IF;
END
$$;

-- =====================================================
-- 2. CRIAR TABELA DE USUÁRIOS COM ROLES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'medsenior_user',
    department VARCHAR(100),
    manager_id UUID REFERENCES public.users(id),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validações
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@medsenior\.com\.br$'),
    CONSTRAINT valid_role CHECK (role IN ('medsenior_admin', 'medsenior_gestor', 'medsenior_analista', 'medsenior_ia', 'medsenior_user', 'medsenior_readonly'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_department ON public.users(department);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);

-- =====================================================
-- 3. CRIAR TABELA DE PERMISSÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_action CHECK (action IN ('create', 'read', 'update', 'delete', 'approve', 'export'))
);

-- Inserir permissões padrão
INSERT INTO public.permissions (name, description, resource, action) VALUES
-- Projetos
('projects.create', 'Criar novos projetos', 'projects', 'create'),
('projects.read', 'Visualizar projetos', 'projects', 'read'),
('projects.update', 'Editar projetos', 'projects', 'update'),
('projects.delete', 'Excluir projetos', 'projects', 'delete'),
('projects.approve', 'Aprovar projetos', 'projects', 'approve'),
('projects.export', 'Exportar dados de projetos', 'projects', 'export'),

-- Tarefas
('tasks.create', 'Criar tarefas', 'tasks', 'create'),
('tasks.read', 'Visualizar tarefas', 'tasks', 'read'),
('tasks.update', 'Editar tarefas', 'tasks', 'update'),
('tasks.delete', 'Excluir tarefas', 'tasks', 'delete'),

-- Quality Gates
('quality_gates.create', 'Criar quality gates', 'quality_gates', 'create'),
('quality_gates.read', 'Visualizar quality gates', 'quality_gates', 'read'),
('quality_gates.update', 'Editar quality gates', 'quality_gates', 'update'),
('quality_gates.approve', 'Aprovar quality gates', 'quality_gates', 'approve'),

-- Analytics
('analytics.read', 'Visualizar analytics', 'analytics', 'read'),
('analytics.export', 'Exportar relatórios', 'analytics', 'export'),

-- Usuários
('users.read', 'Visualizar usuários', 'users', 'read'),
('users.update', 'Editar usuários', 'users', 'update'),
('users.create', 'Criar usuários', 'users', 'create'),
('users.delete', 'Excluir usuários', 'users', 'delete'),

-- Auditoria
('audit.read', 'Visualizar logs de auditoria', 'audit', 'read'),
('audit.export', 'Exportar logs de auditoria', 'audit', 'export'),

-- Configurações
('settings.read', 'Visualizar configurações', 'settings', 'read'),
('settings.update', 'Editar configurações', 'settings', 'update')

ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 4. CRIAR TABELA DE ASSOCIAÇÃO ROLES-PERMISSÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name VARCHAR(50) NOT NULL,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(role_name, permission_id),
    CONSTRAINT valid_role_name CHECK (role_name IN ('medsenior_admin', 'medsenior_gestor', 'medsenior_analista', 'medsenior_ia', 'medsenior_user', 'medsenior_readonly'))
);

-- =====================================================
-- 5. ATRIBUIR PERMISSÕES AOS ROLES
-- =====================================================

-- Admin: Todas as permissões
INSERT INTO public.role_permissions (role_name, permission_id)
SELECT 'medsenior_admin', id FROM public.permissions
ON CONFLICT (role_name, permission_id) DO NOTHING;

-- Gestor: Gerenciamento de projetos e equipes
INSERT INTO public.role_permissions (role_name, permission_id)
SELECT 'medsenior_gestor', id FROM public.permissions 
WHERE name IN (
    'projects.create', 'projects.read', 'projects.update', 'projects.delete', 'projects.approve', 'projects.export',
    'tasks.create', 'tasks.read', 'tasks.update', 'tasks.delete',
    'quality_gates.create', 'quality_gates.read', 'quality_gates.update', 'quality_gates.approve',
    'analytics.read', 'analytics.export',
    'users.read', 'users.update',
    'audit.read'
)
ON CONFLICT (role_name, permission_id) DO NOTHING;

-- Analista: Trabalho com projetos e tarefas
INSERT INTO public.role_permissions (role_name, permission_id)
SELECT 'medsenior_analista', id FROM public.permissions 
WHERE name IN (
    'projects.read', 'projects.update',
    'tasks.create', 'tasks.read', 'tasks.update',
    'quality_gates.read', 'quality_gates.update',
    'analytics.read'
)
ON CONFLICT (role_name, permission_id) DO NOTHING;

-- IA: Acesso a analytics e funcionalidades de IA
INSERT INTO public.role_permissions (role_name, permission_id)
SELECT 'medsenior_ia', id FROM public.permissions 
WHERE name IN (
    'projects.read', 'projects.update',
    'tasks.read', 'tasks.update',
    'quality_gates.read', 'quality_gates.update',
    'analytics.read', 'analytics.export',
    'audit.read'
)
ON CONFLICT (role_name, permission_id) DO NOTHING;

-- User: Acesso básico
INSERT INTO public.role_permissions (role_name, permission_id)
SELECT 'medsenior_user', id FROM public.permissions 
WHERE name IN (
    'projects.read',
    'tasks.read', 'tasks.update',
    'quality_gates.read',
    'analytics.read'
)
ON CONFLICT (role_name, permission_id) DO NOTHING;

-- Readonly: Apenas leitura
INSERT INTO public.role_permissions (role_name, permission_id)
SELECT 'medsenior_readonly', id FROM public.permissions 
WHERE name IN (
    'projects.read',
    'tasks.read',
    'quality_gates.read',
    'analytics.read'
)
ON CONFLICT (role_name, permission_id) DO NOTHING;

-- =====================================================
-- 6. CRIAR FUNÇÕES DE VERIFICAÇÃO DE PERMISSÕES
-- =====================================================

-- Função para verificar se usuário tem permissão
CREATE OR REPLACE FUNCTION public.check_permission(
    user_role VARCHAR(50),
    resource_name VARCHAR(100),
    action_name VARCHAR(50)
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.role_permissions rp
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE rp.role_name = user_role
        AND p.resource = resource_name
        AND p.action = action_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter permissões do usuário
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_email VARCHAR(255))
RETURNS TABLE(permission_name VARCHAR(100), resource VARCHAR(100), action VARCHAR(50)) AS $$
BEGIN
    RETURN QUERY
    SELECT p.name, p.resource, p.action
    FROM public.users u
    JOIN public.role_permissions rp ON u.role = rp.role_name
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE u.email = user_email AND u.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. CRIAR POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Política para usuários (cada usuário vê apenas seus dados)
CREATE POLICY "users_own_data" ON public.users
    FOR ALL USING (auth.email() = email);

-- Política para projetos (baseada em role e ownership)
CREATE POLICY "projects_access" ON public.projects
    FOR ALL USING (
        CASE 
            WHEN public.check_permission(
                (SELECT role FROM public.users WHERE email = auth.email()), 
                'projects', 
                'read'
            ) THEN true
            WHEN owner_id = (SELECT id FROM public.users WHERE email = auth.email()) THEN true
            ELSE false
        END
    );

-- Política para tarefas
CREATE POLICY "tasks_access" ON public.tasks
    FOR ALL USING (
        public.check_permission(
            (SELECT role FROM public.users WHERE email = auth.email()), 
            'tasks', 
            'read'
        )
    );

-- Política para quality gates
CREATE POLICY "quality_gates_access" ON public.quality_gates
    FOR ALL USING (
        public.check_permission(
            (SELECT role FROM public.users WHERE email = auth.email()), 
            'quality_gates', 
            'read'
        )
    );

-- Política para logs de auditoria (apenas admin e gestores)
CREATE POLICY "audit_logs_access" ON public.audit_logs
    FOR SELECT USING (
        public.check_permission(
            (SELECT role FROM public.users WHERE email = auth.email()), 
            'audit', 
            'read'
        )
    );

-- Política para eventos de segurança (apenas admin)
CREATE POLICY "security_events_access" ON public.security_events
    FOR SELECT USING (
        (SELECT role FROM public.users WHERE email = auth.email()) = 'medsenior_admin'
    );

-- =====================================================
-- 8. CRIAR TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- =====================================================

-- Função para log automático de auditoria
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    user_email VARCHAR(255);
    user_role VARCHAR(50);
BEGIN
    -- Obter informações do usuário atual
    SELECT email, role INTO user_email, user_role
    FROM public.users 
    WHERE email = auth.email();
    
    -- Inserir log de auditoria
    INSERT INTO public.audit_logs (
        user_id,
        user_name,
        action,
        resource,
        details,
        ip_address,
        user_agent,
        timestamp,
        success,
        risk_level,
        compliance_tags
    ) VALUES (
        (SELECT id FROM public.users WHERE email = user_email),
        (SELECT name FROM public.users WHERE email = user_email),
        TG_OP, -- INSERT, UPDATE, DELETE
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD.*)
            ELSE to_jsonb(NEW.*)
        END,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent',
        NOW(),
        true,
        'LOW',
        ARRAY['AUTO_LOG']
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger em tabelas críticas
CREATE TRIGGER audit_projects_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_tasks_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER audit_quality_gates_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.quality_gates
    FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- =====================================================
-- 9. CRIAR VIEWS PARA RELATÓRIOS
-- =====================================================

-- View para relatório de permissões por usuário
CREATE OR REPLACE VIEW public.user_permissions_report AS
SELECT 
    u.name,
    u.email,
    u.role,
    u.department,
    u.is_active,
    COUNT(rp.permission_id) as total_permissions,
    ARRAY_AGG(p.name) as permissions
FROM public.users u
LEFT JOIN public.role_permissions rp ON u.role = rp.role_name
LEFT JOIN public.permissions p ON rp.permission_id = p.id
GROUP BY u.id, u.name, u.email, u.role, u.department, u.is_active;

-- View para relatório de auditoria
CREATE OR REPLACE VIEW public.audit_summary AS
SELECT 
    DATE(timestamp) as audit_date,
    action,
    resource,
    risk_level,
    COUNT(*) as event_count,
    COUNT(CASE WHEN success = false THEN 1 END) as failed_events
FROM public.audit_logs
GROUP BY DATE(timestamp), action, resource, risk_level
ORDER BY audit_date DESC, event_count DESC;

-- =====================================================
-- 10. CRIAR FUNÇÕES DE MANUTENÇÃO
-- =====================================================

-- Função para limpar logs antigos (manter apenas 2 anos)
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.audit_logs 
    WHERE timestamp < NOW() - INTERVAL '2 years';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log da limpeza
    INSERT INTO public.audit_logs (
        user_id,
        user_name,
        action,
        resource,
        details,
        ip_address,
        user_agent,
        timestamp,
        success,
        risk_level,
        compliance_tags
    ) VALUES (
        NULL,
        'SYSTEM',
        'CLEANUP',
        'audit_logs',
        jsonb_build_object('deleted_count', deleted_count, 'reason', 'Retention policy'),
        '127.0.0.1',
        'System Cleanup',
        NOW(),
        true,
        'LOW',
        ARRAY['SYSTEM', 'MAINTENANCE']
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. CONFIGURAR CRON JOB PARA LIMPEZA AUTOMÁTICA
-- =====================================================

-- Agendar limpeza mensal (primeiro domingo de cada mês às 2h)
SELECT cron.schedule(
    'cleanup-audit-logs',
    '0 2 * * 0',
    'SELECT public.cleanup_old_logs();'
);

-- =====================================================
-- 12. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para auditoria
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level ON public.audit_logs(risk_level);

-- Índices para segurança
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON public.security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);

-- Índices para permissões
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON public.permissions(resource, action);

-- =====================================================
-- 13. COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE public.users IS 'Tabela de usuários do sistema MILAPP MedSênior com controle de roles';
COMMENT ON TABLE public.permissions IS 'Permissões disponíveis no sistema';
COMMENT ON TABLE public.role_permissions IS 'Associação entre roles e permissões';
COMMENT ON TABLE public.audit_logs IS 'Logs de auditoria para compliance LGPD/GDPR/SOX';
COMMENT ON TABLE public.security_events IS 'Eventos de segurança para monitoramento';

COMMENT ON FUNCTION public.check_permission IS 'Verifica se um role tem permissão para uma ação específica';
COMMENT ON FUNCTION public.get_user_permissions IS 'Retorna todas as permissões de um usuário';
COMMENT ON FUNCTION public.cleanup_old_logs IS 'Remove logs antigos conforme política de retenção';

-- =====================================================
-- FIM DA MIGRAÇÃO RBAC
-- ===================================================== 