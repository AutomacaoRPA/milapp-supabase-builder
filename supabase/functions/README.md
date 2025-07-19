# Funções Supabase - MilApp Builder

Este diretório contém as funções Supabase Edge Functions organizadas de forma modular para o projeto MilApp Builder.

## 📁 Estrutura do Projeto

```
supabase/functions/
├── shared/                    # Código compartilhado entre funções
│   ├── types.ts              # Tipos TypeScript compartilhados
│   └── utils.ts              # Utilitários e helpers
├── config.ts                 # Configurações centralizadas
├── projects/                 # Funções relacionadas a projetos
│   └── createProjectPipeline.ts
├── pipelines/                # Funções relacionadas a pipelines
├── auth/                     # Funções de autenticação
└── README.md                 # Esta documentação
```

## 🚀 Funcionalidades Implementadas

### ✅ Estrutura Modular
- **Organização por domínio**: Funções agrupadas por área de responsabilidade
- **Código compartilhado**: Tipos e utilitários reutilizáveis
- **Configuração centralizada**: Todas as configurações em um local

### ✅ Validação Robusta
- **Zod Schemas**: Validação de entrada com mensagens em português
- **Validação customizada**: Regras de negócio específicas
- **Tratamento de erros**: Respostas padronizadas de erro

### ✅ Logging Estruturado
- **Logs JSON**: Formato estruturado para análise
- **Níveis de log**: Error, Warn, Info, Debug
- **Contexto rico**: Request ID, timestamps, dados relevantes

### ✅ Segurança
- **Autenticação**: Verificação de usuário e permissões
- **RLS Policies**: Row Level Security configurado
- **Sanitização**: Remoção de dados sensíveis

## 📋 Funções Disponíveis

### 🔧 Projetos (`/projects/`)

#### `createProjectPipeline.ts`
Cria um novo projeto com pipeline automatizado.

**Endpoint**: `POST /functions/v1/createProjectPipeline`

**Funcionalidades**:
- ✅ Validação completa de entrada
- ✅ Criação de projeto no banco
- ✅ Geração automática de pipeline
- ✅ Atualização de estatísticas
- ✅ Logs detalhados de execução

**Exemplo de uso**:
```typescript
const response = await fetch('/functions/v1/createProjectPipeline', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'Automação de Processos',
    description: 'Sistema de automação para processos internos',
    type: 'automation',
    priority: 'high',
    methodology: 'scrum',
    estimated_effort: 120,
    roi_target: 150,
    tags: ['automation', 'process', 'efficiency'],
    pipeline_config: {
      settings: {
        require_approval: true,
        auto_deploy_dev: true
      }
    }
  })
});
```

## 🛠️ Configuração

### Variáveis de Ambiente

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_PROJECT_REF=your-project-ref

# Aplicação
NODE_ENV=development
DEBUG=true
LOG_LEVEL=info

# Notificações (opcional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

### Deploy das Funções

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login no Supabase
supabase login

# Deploy das funções
supabase functions deploy

# Deploy de uma função específica
supabase functions deploy createProjectPipeline
```

## 📊 Monitoramento

### Logs
As funções geram logs estruturados em JSON com:
- **Request ID**: Identificador único da requisição
- **Timestamp**: Momento exato da execução
- **Nível**: Error, Warn, Info, Debug
- **Contexto**: Dados relevantes da operação
- **Duração**: Tempo de execução (quando aplicável)

### Métricas
- **Tempo de resposta**: Medido automaticamente
- **Taxa de erro**: Monitorada via logs
- **Uso de memória**: Rastreado em produção

## 🔒 Segurança

### Autenticação
- Todas as funções requerem autenticação JWT
- Verificação automática de token
- Extração de contexto do usuário

### Autorização
- Verificação de permissões por role
- Controle de acesso baseado em recursos
- Validação de propriedade de dados

### Validação
- Sanitização de entrada
- Validação de tipos e formatos
- Prevenção de injeção de dados

## 🧪 Testes

### Estrutura de Testes
```
tests/
├── unit/                     # Testes unitários
│   ├── projects/
│   ├── pipelines/
│   └── auth/
├── integration/              # Testes de integração
└── e2e/                      # Testes end-to-end
```

### Execução de Testes
```bash
# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Todos os testes
npm run test
```

## 📝 Padrões de Código

### Estrutura de Função
```typescript
/**
 * Descrição da função
 * @param request - Requisição HTTP
 * @returns Resposta padronizada
 */
async function functionName(request: Request): Promise<Response> {
  // 1. Extrair contexto
  const context = extractContext(request);
  
  // 2. Validar entrada
  const validation = validateData(schema, data);
  
  // 3. Executar lógica principal
  const result = await mainLogic();
  
  // 4. Retornar resposta
  return createSuccessResponse(result);
}
```

### Tratamento de Erros
```typescript
try {
  // Lógica principal
} catch (error) {
  logError('Mensagem de erro', {
    context: 'dados relevantes',
    error: error.message
  }, context.request_id);
  
  return createErrorResponse('ERROR_CODE', 'Mensagem amigável');
}
```

### Logging
```typescript
// Informação
logInfo('Operação realizada', { dados }, requestId);

// Aviso
logWarn('Situação de atenção', { contexto }, requestId);

// Erro
logError('Erro crítico', { detalhes }, requestId);

// Debug
logDebug('Informação de debug', { dados }, requestId);
```

## 🔄 Workflow de Desenvolvimento

### 1. Criação de Nova Função
```bash
# Criar estrutura
mkdir -p supabase/functions/domain/functionName
touch supabase/functions/domain/functionName/index.ts
```

### 2. Desenvolvimento
- Implementar validação com Zod
- Adicionar logs estruturados
- Implementar tratamento de erros
- Testar localmente

### 3. Deploy
```bash
# Deploy da função
supabase functions deploy functionName

# Verificar logs
supabase functions logs functionName
```

## 📚 Recursos Adicionais

### Documentação
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Runtime](https://deno.land/manual)
- [Zod Validation](https://zod.dev/)

### Exemplos
- [createProjectPipeline.ts](./projects/createProjectPipeline.ts) - Exemplo completo
- [shared/types.ts](./shared/types.ts) - Tipos compartilhados
- [shared/utils.ts](./shared/utils.ts) - Utilitários

### Configuração
- [config.ts](./config.ts) - Configurações centralizadas

## 🤝 Contribuição

### Padrões a Seguir
1. **Validação**: Sempre usar Zod para validação
2. **Logging**: Logs estruturados em JSON
3. **Erros**: Respostas padronizadas de erro
4. **Documentação**: Comentários explicativos
5. **Testes**: Cobertura de testes adequada

### Checklist de Nova Função
- [ ] Validação de entrada com Zod
- [ ] Tratamento de erros com try/catch
- [ ] Logs estruturados
- [ ] Comentários explicativos
- [ ] Testes unitários
- [ ] Documentação da API
- [ ] Configuração de segurança

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar logs da função
2. Consultar documentação
3. Abrir issue no repositório
4. Contatar equipe de desenvolvimento 