# Prompt: Corrigir Erro de Código

## Contexto
Você é um especialista em debugging e correção de erros, responsável por identificar e resolver problemas no projeto MilApp Builder.

## Objetivo
Analisar erros reportados e implementar correções eficientes e seguras, seguindo as melhores práticas do projeto.

## Metodologia de Debugging

### 1. Análise do Erro
```typescript
// Estrutura de análise
interface ErrorAnalysis {
  errorType: 'runtime' | 'compile' | 'logic' | 'security' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedComponents: string[];
  rootCause: string;
  impact: string;
  suggestedFix: string;
}
```

### 2. Priorização de Correções
- **Crítico**: Erros de segurança, crashes, perda de dados
- **Alto**: Funcionalidades quebradas, performance crítica
- **Médio**: Bugs de UI, validações incorretas
- **Baixo**: Melhorias, refatorações, otimizações

## Tipos de Erro Comuns

### 1. Erros de TypeScript
```typescript
// Problema: Type mismatch
const user: User = {
  id: '123',
  name: 'John',
  // ❌ Erro: email é obrigatório
};

// Solução: Adicionar propriedade obrigatória
const user: User = {
  id: '123',
  name: 'John',
  email: 'john@example.com' // ✅ Correto
};
```

### 2. Erros de Supabase
```typescript
// Problema: Cliente não inicializado
const { data, error } = await supabase
  .from('projects')
  .select('*');

// Solução: Verificar inicialização
if (!supabase) {
  throw new Error('Supabase client not initialized');
}

const { data, error } = await supabase
  .from('projects')
  .select('*');
```

### 3. Erros de Validação
```typescript
// Problema: Validação Zod falhando
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});

// Solução: Melhorar mensagens de erro
const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email deve ser válido')
});
```

## Processo de Correção

### 1. Identificação
```bash
# Comandos para identificar erros
npm run lint          # Verificar problemas de código
npm run type-check    # Verificar tipos TypeScript
npm run test          # Executar testes
npm run build         # Verificar build
```

### 2. Isolamento
```typescript
// Criar teste mínimo para reproduzir o erro
describe('Error Reproduction', () => {
  it('should reproduce the specific error', async () => {
    // Setup mínimo
    const input = { /* dados que causam erro */ };
    
    // Ação que causa erro
    const result = await problematicFunction(input);
    
    // Verificação
    expect(result).toBeDefined();
  });
});
```

### 3. Correção
```typescript
// Antes: Código com erro
function createProject(data: any) {
  return supabase.from('projects').insert(data);
}

// Depois: Código corrigido
async function createProject(data: CreateProjectData) {
  // Validação de entrada
  const validatedData = CreateProjectSchema.parse(data);
  
  // Verificação de cliente
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  // Execução com tratamento de erro
  const { data: project, error } = await supabase
    .from('projects')
    .insert(validatedData)
    .select()
    .single();
    
  if (error) {
    throw new Error(`Failed to create project: ${error.message}`);
  }
  
  return project;
}
```

## Padrões de Correção

### 1. Tratamento de Erros
```typescript
// Padrão: Try-Catch com logging
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  // Log estruturado
  logError('Operation failed', {
    operation: 'riskyOperation',
    error: error instanceof Error ? error.message : String(error),
    context: { /* dados relevantes */ }
  });
  
  // Re-throw com contexto
  throw new Error(`Operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
```

### 2. Validação Defensiva
```typescript
// Padrão: Validação em camadas
function processUserData(userData: unknown) {
  // 1. Validação de tipo
  if (!userData || typeof userData !== 'object') {
    throw new Error('Invalid user data format');
  }
  
  // 2. Validação de schema
  const validatedData = UserSchema.parse(userData);
  
  // 3. Validação de negócio
  if (validatedData.age < 18) {
    throw new Error('User must be 18 or older');
  }
  
  return validatedData;
}
```

### 3. Fallbacks Seguros
```typescript
// Padrão: Fallback com valores padrão
function getProjectConfig(projectId: string) {
  try {
    const config = loadProjectConfig(projectId);
    return config;
  } catch (error) {
    // Fallback para configuração padrão
    logWarn('Using default config', { projectId, error: error.message });
    return DEFAULT_PROJECT_CONFIG;
  }
}
```

## Instruções Específicas

### Para o Cursor AI:
1. **Analise** o erro reportado completamente
2. **Identifique** a causa raiz do problema
3. **Proponha** uma solução que resolve o problema
4. **Implemente** a correção seguindo os padrões do projeto
5. **Adicione** testes para prevenir regressão
6. **Documente** a correção e suas implicações

### Checklist de Correção:
- [ ] **Análise**: Entendi completamente o erro?
- [ ] **Isolamento**: Posso reproduzir o erro?
- [ ] **Causa**: Identifiquei a causa raiz?
- [ ] **Solução**: A correção resolve o problema?
- [ ] **Testes**: Adicionei testes para prevenir regressão?
- [ ] **Documentação**: Documentei a correção?

## Exemplos de Correções

### 1. Erro de Autenticação
```typescript
// Problema: Token expirado não tratado
const user = await supabase.auth.getUser();

// Correção: Verificação de autenticação
const { data: { user }, error } = await supabase.auth.getUser();

if (error || !user) {
  // Redirecionar para login
  window.location.href = '/login';
  return;
}
```

### 2. Erro de Performance
```typescript
// Problema: Query N+1
const projects = await Promise.all(
  projectIds.map(id => supabase.from('projects').select('*').eq('id', id))
);

// Correção: Query otimizada
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .in('id', projectIds);
```

### 3. Erro de Estado
```typescript
// Problema: Estado inconsistente
const [projects, setProjects] = useState([]);

useEffect(() => {
  loadProjects().then(setProjects);
}, []); // ❌ Sem dependências

// Correção: Estado consistente
const [projects, setProjects] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  setLoading(true);
  setError(null);
  
  loadProjects()
    .then(setProjects)
    .catch(setError)
    .finally(() => setLoading(false));
}, []); // ✅ Dependências corretas
```

## Ferramentas de Debugging

### 1. Logs Estruturados
```typescript
// Log de debug
logDebug('Processing project', {
  projectId,
  userId,
  action: 'create'
});

// Log de erro
logError('Project creation failed', {
  projectId,
  userId,
  error: error.message,
  stack: error.stack
});
```

### 2. Monitoramento
```typescript
// Métricas de performance
const startTime = performance.now();
const result = await expensiveOperation();
const duration = performance.now() - startTime;

logInfo('Operation completed', {
  operation: 'expensiveOperation',
  duration: `${duration.toFixed(2)}ms`
});
```

### 3. Validação
```typescript
// Validação de entrada
function validateInput(data: unknown) {
  try {
    return InputSchema.parse(data);
  } catch (error) {
    logError('Input validation failed', {
      data: JSON.stringify(data),
      errors: error.errors
    });
    throw new Error('Invalid input data');
  }
}
```

## Critérios de Aceitação

✅ **Correção Completa**
- [ ] Erro resolvido completamente
- [ ] Não introduz novos problemas
- [ ] Segue padrões do projeto
- [ ] Performance mantida ou melhorada

✅ **Testes**
- [ ] Teste que reproduz o erro
- [ ] Teste que verifica a correção
- [ ] Testes de regressão
- [ ] Cobertura adequada

✅ **Documentação**
- [ ] Explicação da causa raiz
- [ ] Descrição da solução
- [ ] Implicações da mudança
- [ ] Comandos para testar

## Comandos Úteis

### Debugging
```bash
# Verificar tipos
npm run type-check

# Executar testes
npm run test

# Verificar linting
npm run lint

# Build para verificar erros
npm run build
```

### Monitoramento
```bash
# Ver logs em tempo real
npm run dev

# Verificar performance
npm run test:performance

# Análise de bundle
npm run analyze
```

## Próximos Passos

1. **Implementar** a correção
2. **Testar** em ambiente local
3. **Validar** em staging
4. **Deploy** em produção
5. **Monitorar** para regressões

---

**Nota**: Este prompt deve ser usado com o Cursor AI para corrigir erros de forma eficiente e segura no projeto MilApp Builder. 