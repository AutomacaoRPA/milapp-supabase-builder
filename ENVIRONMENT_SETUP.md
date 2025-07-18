# Configuração de Ambientes - MILAPP

## Visão Geral

O MILAPP implementa um sistema robusto de ambientes que permite alternar entre dois modos de operação:

### 🎯 Ambiente de Demonstração (Demo)
- **Propósito**: Testes, treinamentos e apresentações
- **Dados**: Projetos de exemplo pré-carregados
- **Persistência**: Temporária (dados não são salvos)
- **Características**:
  - 5 projetos de exemplo realistas
  - Todas as funcionalidades ativas
  - Mudanças locais apenas na sessão
  - Ideal para POCs e demonstrações

### 🛡️ Ambiente de Produção (Production)
- **Propósito**: Uso corporativo real
- **Dados**: Base limpa, sem dados de exemplo
- **Persistência**: Completa (Supabase)
- **Características**:
  - Base de dados vazia inicialmente
  - Auditoria completa de ações
  - Persistência garantida
  - Pronto para uso corporativo

## Arquitetura do Sistema de Ambientes

### 1. Environment Manager (`src/lib/environment.ts`)
Gerenciador singleton que controla:
- Estado atual do ambiente
- Configurações por ambiente
- Transições entre ambientes
- Eventos de mudança

### 2. Hooks e Components
- `useEnvironment()`: Hook React para consumir estado do ambiente
- `EnvironmentBadge`: Indicador visual do ambiente atual
- `EnvironmentSwitcher`: Seletor de ambiente na navegação

### 3. Integração com Hooks de Dados
Todos os hooks de dados (`useProjects`, `useProjectFiles`, etc.) são ambiente-aware:
- **Demo**: Retorna dados mock
- **Production**: Consulta Supabase

## Como Funciona

### Detecção de Ambiente
```typescript
const environment = environmentManager.getCurrentEnvironment();
// 'demo' ou 'production'
```

### Fluxo de Dados
```typescript
if (environmentManager.shouldUseMockData()) {
  // Carregar dados de exemplo
  return mockData;
} else {
  // Carregar dados reais do Supabase
  return await supabase.from('table').select();
}
```

### Transições
1. **Demo → Produção**:
   - Limpa sessão e cache
   - Recarrega aplicação
   - Conecta ao Supabase

2. **Produção → Demo**:
   - Carrega dados de exemplo
   - Desabilita persistência
   - Recarrega aplicação

## Configuração por Ambiente

### Demo Environment
```typescript
{
  name: 'Demonstração',
  features: {
    mockData: true,
    persistence: false,
    auditLog: false,
    realTimeUpdates: false,
    fullCRUD: true
  },
  ui: {
    showEnvironmentBadge: true,
    environmentBadgeColor: 'warning'
  }
}
```

### Production Environment
```typescript
{
  name: 'Produção',
  features: {
    mockData: false,
    persistence: true,
    auditLog: true,
    realTimeUpdates: true,
    fullCRUD: true
  },
  ui: {
    showEnvironmentBadge: false,
    environmentBadgeColor: 'success'
  }
}
```

## Dados de Demonstração

### Projetos Demo (`loadDemoProjects`)
5 projetos pré-configurados representando diferentes estágios:
1. **Automação de Notas Fiscais** (MVP)
2. **Conciliação Bancária** (Teste Operacional)
3. **Portal de Atendimento** (Planejamento)
4. **Relatórios Gerenciais** (Ideação)
5. **Sistema LGPD** (Concluído)

Cada projeto inclui:
- Dados realistas de ROI, complexidade, datas
- Responsáveis fictícios com emails @medsenior.com
- Status diversos para demonstrar pipeline completo

## Implementação Técnica

### Environment Manager Pattern
```typescript
// Singleton para garantir estado único
export const environmentManager = EnvironmentManager.getInstance();

// Hook React para reatividade
export const useEnvironment = () => {
  const [environment, setEnvironment] = useState(
    environmentManager.getCurrentEnvironment()
  );
  // ... resto da implementação
}
```

### Event-Driven Updates
```typescript
// Disparo de eventos para notificar mudanças
window.dispatchEvent(new CustomEvent('environmentChanged', { 
  detail: { environment: env } 
}));
```

### Conditional Data Loading
```typescript
// Padrão usado em todos os hooks de dados
const fetchData = async () => {
  if (environmentManager.shouldUseMockData()) {
    return loadMockData();
  } else {
    return await supabaseQuery();
  }
};
```

## Benefícios da Implementação

### 🎯 Para Demonstrações
- Dados consistentes e realistas
- Não requer configuração prévia
- Demonstra funcionalidades completas
- Sem riscos de alterações permanentes

### 🛡️ Para Produção
- Base limpa e segura
- Auditoria completa
- Performance otimizada
- Controle total dos dados

### 🔧 Para Desenvolvimento
- Fácil alternar entre contextos
- Testes isolados
- Desenvolvimento sem impacto em produção

## Considerações de Segurança

### Row Level Security (RLS)
- Ambiente de produção utiliza RLS completo
- Políticas definidas para cada tabela
- Acesso baseado em autenticação

### Isolation
- Ambientes completamente isolados
- Não há vazamento de dados entre ambientes
- Transições limpam estado anterior

## Monitoramento e Logging

### Auditoria (Produção)
- Todas as ações são logadas
- Tracking de mudanças
- Compliance com políticas corporativas

### Analytics (Demo)
- Eventos de demonstração
- Métricas de engajamento
- Sem dados sensíveis

## Expansibilidade

### Novos Ambientes
A arquitetura permite facilmente adicionar novos ambientes:
```typescript
// Exemplo: ambiente de staging
staging: {
  name: 'Homologação',
  features: {
    mockData: false,
    persistence: true,
    auditLog: true,
    realTimeUpdates: false,
    fullCRUD: true
  }
}
```

### Configurações Específicas
Cada ambiente pode ter configurações únicas para:
- APIs diferentes
- Níveis de logging
- Funcionalidades habilitadas/desabilitadas
- Policies de segurança

---

**Nota**: Este sistema de ambientes garante que o MILAPP seja tanto uma ferramenta eficaz de demonstração quanto uma plataforma robusta de produção, atendendo às necessidades de diferentes stakeholders e cenários de uso.