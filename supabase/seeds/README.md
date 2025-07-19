# Seeds do Supabase - MilApp Builder

Este diretório contém scripts de seed para popular o banco de dados com dados iniciais necessários para o funcionamento do projeto.

## 📁 Estrutura

```
supabase/seeds/
├── seed_environments.sql    # Ambientes padrão (dev, hml, prod)
├── README.md               # Esta documentação
└── (futuros seeds...)      # Outros seeds conforme necessário
```

## 🚀 Seeds Disponíveis

### `seed_environments.sql`

**Descrição**: Cria os ambientes padrão do projeto (dev, hml, prod)

**Ambientes Criados**:
- **DEV**: Ambiente de desenvolvimento
- **HML**: Ambiente de homologação  
- **PROD**: Ambiente de produção

**Campos Incluídos**:
- `name`: Nome do ambiente (dev, hml, prod)
- `description`: Descrição detalhada
- `url`: URL do ambiente Supabase
- `project_id`: ID do projeto (busca automática)
- `environment_type`: Tipo (development, staging, production)
- `is_default`: Se é o ambiente padrão
- `is_public`: Se é público
- `status`: Status do ambiente (active)
- `config`: Configurações JSON específicas por ambiente
- `created_by`: Usuário admin que criou
- `created_at` / `updated_at`: Timestamps

## 🔧 Como Executar

### 1. Execução Manual

```bash
# Via Supabase CLI
supabase db reset --seed

# Via SQL direto
psql "SUA_CONNECTION_STRING" -f supabase/seeds/seed_environments.sql

# Via script de deploy
./scripts/deploy-with-seed.sh development
```

### 2. Execução Automática

O seed é executado automaticamente após:
- `supabase db reset`
- `supabase db push` (se configurado)
- Deploy via scripts

### 3. Execução em Produção

```bash
# ⚠️ CUIDADO: Backup antes de executar em produção
supabase db dump --project-ref SEU_PROJECT_ID

# Executar seed
psql "SUA_CONNECTION_STRING_PROD" -f supabase/seeds/seed_environments.sql
```

## 📊 Configurações por Ambiente

### DEV (Desenvolvimento)
```json
{
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
}
```

### HML (Homologação)
```json
{
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
}
```

### PROD (Produção)
```json
{
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
}
```

## 🔒 Segurança

### Validações Implementadas
- ✅ Verificação de existência da tabela
- ✅ Verificação de usuário admin
- ✅ Verificação de projeto existente
- ✅ Logs de auditoria
- ✅ Rollback em caso de erro

### Configurações de Segurança
```sql
-- Habilitar RLS em todos os ambientes
"rls_enabled": true

-- Logs de auditoria
"audit_logging": true

-- Rate limiting (apenas produção)
"rate_limiting": true
```

## 📝 Logs e Auditoria

### Logs Automáticos
O seed gera logs automáticos para:
- Início e fim da execução
- Contagem de registros inseridos
- Erros e warnings
- Auditoria de criação

### Exemplo de Log
```
[INFO] Iniciando seed de ambientes padrão - 2025-01-18 23:52:00
[INFO] Tabela environments encontrada. Prosseguindo com seed...
[SUCCESS] Seed concluído com sucesso:
[INFO] - Ambientes DEV: 1
[INFO] - Ambientes HML: 1
[INFO] - Ambientes PROD: 1
[INFO] - Total de ambientes: 3
[SUCCESS] Seed de ambientes padrão concluído com sucesso
```

## 🛠️ Desenvolvimento

### Criando Novos Seeds

1. **Estrutura do Seed**:
   ```sql
   -- =====================================================
   -- SEED: Nome do Seed
   -- =====================================================
   -- Descrição: O que o seed faz
   -- Autor: Seu nome
   -- Data: YYYY-MM-DD
   -- Versão: 1.0.0
   -- =====================================================
   
   -- 1. Validações
   -- 2. Inserção de dados
   -- 3. Verificações
   -- 4. Logs de auditoria
   ```

2. **Boas Práticas**:
   - ✅ Sempre incluir validações
   - ✅ Usar ON CONFLICT para evitar duplicatas
   - ✅ Incluir logs de auditoria
   - ✅ Documentar configurações
   - ✅ Testar em ambiente local primeiro

### Testando Seeds

```bash
# Teste local
supabase start
supabase db reset --seed

# Verificar dados
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "SELECT * FROM environments;"
```

## 🔄 Integração com CI/CD

### GitHub Actions
```yaml
- name: Run Seeds
  run: |
    supabase db push
    psql "${{ secrets.DATABASE_URL }}" -f supabase/seeds/seed_environments.sql
```

### Scripts de Deploy
```bash
# Linux/Mac
./scripts/deploy-with-seed.sh development

# Windows
scripts\deploy-with-seed.bat development
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Tabela não encontrada
```bash
# Solução: Execute as migrações primeiro
supabase db push
```

#### 2. Usuário admin não encontrado
```bash
# Solução: Crie um usuário admin primeiro
INSERT INTO users (id, email, role) VALUES (gen_random_uuid(), 'admin@example.com', 'admin');
```

#### 3. Projeto não encontrado
```bash
# Solução: Crie o projeto primeiro ou ajuste o nome no seed
INSERT INTO projects (id, name) VALUES (gen_random_uuid(), 'MilApp Builder');
```

#### 4. Erro de permissão
```bash
# Solução: Use connection string com permissões adequadas
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f seed_environments.sql
```

### Logs de Debug

```bash
# Habilitar logs detalhados
export SUPABASE_DEBUG=1
supabase db reset --seed

# Verificar logs do banco
supabase logs --project-ref SEU_PROJECT_ID
```

## 📚 Recursos Adicionais

### Documentação
- [Supabase Seeds Documentation](https://supabase.com/docs/guides/database/seed)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Comandos Úteis
```bash
# Verificar status do banco
supabase status

# Ver logs em tempo real
supabase logs --follow

# Abrir Studio
supabase studio

# Backup do banco
supabase db dump --project-ref SEU_PROJECT_ID
```

---

**Commit**: `feat(seed): seed inicial com ambientes padrão do projeto`

**Status**: ✅ **IMPLEMENTADO E DOCUMENTADO** 