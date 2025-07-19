# Prompt: Gerar Política de Segurança Supabase

## Contexto
Você é um especialista em segurança de banco de dados e Supabase, responsável por criar políticas de Row Level Security (RLS) para o projeto MilApp Builder.

## Objetivo
Criar políticas de segurança robustas para as tabelas do projeto, implementando controle de acesso baseado em roles e propriedade de dados.

## Requisitos Técnicos

### Stack de Segurança
- **RLS**: Row Level Security habilitado
- **Roles**: admin, gestor, dev, analista, ia
- **Autenticação**: JWT tokens
- **Auditoria**: Logs de acesso e modificação

### Tabelas Principais
- **projects**: Projetos do sistema
- **project_pipelines**: Pipelines de projeto
- **environments**: Ambientes de deploy
- **users**: Usuários do sistema
- **teams**: Equipes de trabalho
- **audit_logs**: Logs de auditoria

## Estrutura de Roles

### Role: admin
- **Acesso**: Total a todos os recursos
- **Permissões**: CREATE, READ, UPDATE, DELETE
- **Escopo**: Sistema completo

### Role: gestor
- **Acesso**: Projetos da equipe
- **Permissões**: READ, UPDATE (limitado)
- **Escopo**: Equipe e projetos associados

### Role: dev
- **Acesso**: Projetos atribuídos
- **Permissões**: READ, UPDATE (próprios recursos)
- **Escopo**: Recursos próprios e da equipe

### Role: analista
- **Acesso**: Apenas leitura
- **Permissões**: READ (limitado)
- **Escopo**: Dados de análise e relatórios

### Role: ia
- **Acesso**: Dados para treinamento
- **Permissões**: READ (anônimo)
- **Escopo**: Dados públicos e anonimizados

## Políticas por Tabela

### 1. Tabela: projects
```sql
-- Política de leitura: Usuários podem ver projetos da equipe ou próprios
CREATE POLICY "users_can_view_team_projects" ON projects
FOR SELECT USING (
  auth.role() = 'admin' OR
  created_by = auth.uid() OR
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Política de criação: Apenas gestores e admins
CREATE POLICY "managers_can_create_projects" ON projects
FOR INSERT WITH CHECK (
  auth.role() IN ('admin', 'gestor')
);

-- Política de atualização: Criador ou gestor da equipe
CREATE POLICY "owners_can_update_projects" ON projects
FOR UPDATE USING (
  auth.role() = 'admin' OR
  created_by = auth.uid() OR
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() AND role IN ('gestor', 'admin')
  )
);
```

### 2. Tabela: project_pipelines
```sql
-- Política de leitura: Baseada no projeto
CREATE POLICY "users_can_view_pipeline_by_project" ON project_pipelines
FOR SELECT USING (
  auth.role() = 'admin' OR
  project_id IN (
    SELECT id FROM projects WHERE
      created_by = auth.uid() OR
      team_id IN (
        SELECT team_id FROM team_members 
        WHERE user_id = auth.uid() AND status = 'active'
      )
  )
);

-- Política de criação: Apenas para projetos próprios ou da equipe
CREATE POLICY "users_can_create_pipeline_for_own_projects" ON project_pipelines
FOR INSERT WITH CHECK (
  auth.role() = 'admin' OR
  project_id IN (
    SELECT id FROM projects WHERE
      created_by = auth.uid() OR
      team_id IN (
        SELECT team_id FROM team_members 
        WHERE user_id = auth.uid() AND role IN ('gestor', 'admin')
      )
  )
);
```

### 3. Tabela: environments
```sql
-- Política de leitura: Ambientes públicos ou da equipe
CREATE POLICY "users_can_view_environments" ON environments
FOR SELECT USING (
  auth.role() = 'admin' OR
  is_public = true OR
  team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Política de criação: Apenas admins e gestores
CREATE POLICY "admins_can_create_environments" ON environments
FOR INSERT WITH CHECK (
  auth.role() IN ('admin', 'gestor')
);
```

## Funções de Segurança

### Função: Verificar Permissão de Projeto
```sql
CREATE OR REPLACE FUNCTION check_project_permission(
  project_id UUID,
  required_role TEXT DEFAULT 'read'
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects p
    LEFT JOIN team_members tm ON p.team_id = tm.team_id
    WHERE p.id = project_id AND (
      auth.role() = 'admin' OR
      p.created_by = auth.uid() OR
      (tm.user_id = auth.uid() AND tm.status = 'active')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Função: Log de Auditoria
```sql
CREATE OR REPLACE FUNCTION log_audit_event(
  table_name TEXT,
  record_id UUID,
  action TEXT,
  old_values JSONB DEFAULT NULL,
  new_values JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
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
  ) VALUES (
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    auth.uid(),
    auth.jwt() ->> 'email',
    inet_client_addr(),
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Triggers de Auditoria

### Trigger: Log de Modificações
```sql
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_audit_event(
      TG_TABLE_NAME,
      NEW.id,
      'INSERT',
      NULL,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_audit_event(
      TG_TABLE_NAME,
      NEW.id,
      'UPDATE',
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_audit_event(
      TG_TABLE_NAME,
      OLD.id,
      'DELETE',
      to_jsonb(OLD),
      NULL
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas
CREATE TRIGGER audit_projects_trigger
  AFTER INSERT OR UPDATE OR DELETE ON projects
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

## Configurações de Segurança

### Habilitar RLS
```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
```

### Configurar Roles
```sql
-- Criar roles customizados
CREATE ROLE gestor;
CREATE ROLE dev;
CREATE ROLE analista;
CREATE ROLE ia;

-- Conceder permissões básicas
GRANT USAGE ON SCHEMA public TO gestor, dev, analista, ia;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO gestor, dev, analista, ia;
```

## Instruções Específicas

### Para o Cursor AI:
1. **Analise** a estrutura atual das tabelas
2. **Identifique** as relações entre entidades
3. **Crie** políticas baseadas no modelo de roles
4. **Implemente** funções de segurança reutilizáveis
5. **Adicione** triggers de auditoria
6. **Teste** as políticas com diferentes roles

### Exemplo de Implementação
```sql
-- Exemplo de política complexa
CREATE POLICY "complex_project_access" ON projects
FOR ALL USING (
  CASE 
    WHEN auth.role() = 'admin' THEN true
    WHEN auth.role() = 'gestor' THEN 
      team_id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
    WHEN auth.role() = 'dev' THEN 
      created_by = auth.uid() OR 
      id IN (SELECT project_id FROM project_assignments WHERE user_id = auth.uid())
    ELSE false
  END
);
```

## Critérios de Aceitação

✅ **Segurança Básica**
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas de acesso por role
- [ ] Verificação de propriedade de dados
- [ ] Controle de acesso por equipe

✅ **Auditoria**
- [ ] Logs de todas as operações
- [ ] Rastreamento de usuário
- [ ] Histórico de modificações
- [ ] Alertas de acesso suspeito

✅ **Performance**
- [ ] Índices otimizados para políticas
- [ ] Funções de segurança eficientes
- [ ] Cache de permissões
- [ ] Monitoramento de queries

## Comandos Úteis

### Testar Políticas
```sql
-- Testar acesso como gestor
SET ROLE gestor;
SELECT * FROM projects;

-- Verificar políticas ativas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### Monitoramento
```sql
-- Verificar logs de auditoria
SELECT * FROM audit_logs 
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- Análise de acesso por usuário
SELECT user_id, COUNT(*) as access_count
FROM audit_logs 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id
ORDER BY access_count DESC;
```

## Próximos Passos

1. **Implementar** políticas básicas
2. **Testar** com diferentes roles
3. **Otimizar** performance
4. **Configurar** alertas
5. **Documentar** procedimentos

---

**Nota**: Este prompt deve ser usado com o Cursor AI para gerar políticas de segurança robustas e bem estruturadas para o projeto MilApp Builder. 