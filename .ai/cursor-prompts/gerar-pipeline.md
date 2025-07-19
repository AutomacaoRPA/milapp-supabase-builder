# Prompt: Gerar Pipeline de CI/CD

## Contexto
Você é um especialista em DevOps e CI/CD, responsável por criar pipelines automatizados para o projeto MilApp Builder.

## Objetivo
Criar um pipeline de CI/CD completo usando GitHub Actions para deploy automático no Supabase.

## Requisitos Técnicos

### Stack Tecnológica
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase Edge Functions (Deno)
- **Banco**: PostgreSQL (Supabase)
- **Deploy**: Supabase CLI + GitHub Actions
- **Testes**: Jest + Playwright + Vitest

### Ambientes
- **Development**: Deploy automático na branch `develop`
- **Staging**: Deploy automático na branch `staging`
- **Production**: Deploy manual na branch `main`

## Estrutura Esperada

### Workflow Development (`deploy-dev.yml`)
```yaml
name: Deploy to Development
on:
  push:
    branches: [develop]
  pull_request:
    branches: [develop]

jobs:
  test:
    # Testes unitários e de integração
  lint:
    # Verificação de código
  deploy-dev:
    # Deploy para ambiente de desenvolvimento
```

### Workflow Production (`deploy-prod.yml`)
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    # Testes completos
  security-scan:
    # Análise de segurança
  deploy-prod:
    # Deploy para produção
```

## Funcionalidades Obrigatórias

### 1. Testes Automatizados
- **Unit Tests**: Jest para funções e componentes
- **Integration Tests**: Testes de API e banco
- **E2E Tests**: Playwright para fluxos completos
- **Performance Tests**: Testes de carga e stress

### 2. Qualidade de Código
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Security**: Snyk ou similar
- **Coverage**: Mínimo 80% de cobertura

### 3. Deploy Supabase
- **Functions**: `supabase functions deploy`
- **Database**: `supabase db push`
- **Migrations**: Execução automática
- **Secrets**: Gerenciamento seguro

### 4. Notificações
- **Slack**: Status de deploy
- **Email**: Falhas críticas
- **GitHub**: Status checks

## Variáveis de Ambiente

### GitHub Secrets
```bash
SUPABASE_ACCESS_TOKEN=your_access_token
SUPABASE_PROJECT_ID_DEV=dev_project_id
SUPABASE_PROJECT_ID_PROD=prod_project_id
SLACK_WEBHOOK_URL=your_webhook_url
```

### Supabase Environment
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

## Padrões de Código

### Nomenclatura
- **Branches**: `feature/`, `bugfix/`, `hotfix/`
- **Commits**: Conventional Commits
- **Tags**: Semantic Versioning

### Estrutura de Arquivos
```
.github/
├── workflows/
│   ├── deploy-dev.yml
│   ├── deploy-prod.yml
│   └── security.yml
├── ISSUE_TEMPLATE/
└── PULL_REQUEST_TEMPLATE.md
```

## Instruções Específicas

### Para o Cursor AI:
1. **Analise** o contexto atual do projeto
2. **Identifique** as dependências e configurações existentes
3. **Crie** workflows otimizados para a stack
4. **Inclua** comentários explicativos em português
5. **Teste** a sintaxe YAML antes de implementar
6. **Documente** as variáveis de ambiente necessárias

### Exemplo de Implementação
```yaml
# Exemplo de job de teste
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    - name: Install dependencies
      run: npm ci
    - name: Run tests
      run: npm run test:ci
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

## Critérios de Aceitação

✅ **Pipeline Development**
- [ ] Deploy automático na branch `develop`
- [ ] Execução de testes antes do deploy
- [ ] Notificação de status no Slack
- [ ] Rollback automático em caso de falha

✅ **Pipeline Production**
- [ ] Deploy manual com aprovação
- [ ] Testes completos obrigatórios
- [ ] Análise de segurança
- [ ] Backup automático antes do deploy

✅ **Monitoramento**
- [ ] Logs estruturados
- [ ] Métricas de performance
- [ ] Alertas de falha
- [ ] Dashboard de status

## Comandos Úteis

### Local Development
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login no Supabase
supabase login

# Deploy local
supabase functions serve

# Push de migrações
supabase db push
```

### GitHub Actions
```bash
# Testar workflow localmente
act -j deploy-dev

# Verificar sintaxe
yamllint .github/workflows/*.yml
```

## Próximos Passos

1. **Implementar** os workflows básicos
2. **Configurar** as variáveis de ambiente
3. **Testar** em ambiente de desenvolvimento
4. **Documentar** o processo de deploy
5. **Treinar** a equipe no uso

---

**Nota**: Este prompt deve ser usado com o Cursor AI para gerar pipelines de CI/CD completos e otimizados para o projeto MilApp Builder. 