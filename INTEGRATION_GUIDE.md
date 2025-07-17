# Guia de Integração - MILAPP

## Visão Geral

Este guia descreve como configurar e usar as integrações do MILAPP com as ferramentas que você utiliza: Git, GitHub, Docker, n8n e Python. Essas integrações permitem extrair dados automaticamente para alimentar as métricas do sistema.

## 🛠️ Ferramentas Integradas

### 1. Git
**Propósito**: Extrair métricas de versionamento local
**Dados Coletados**:
- Total de commits
- Commits por autor
- Commits por data
- Linhas adicionadas/removidas
- Arquivos alterados
- Branches ativas
- Frequência de commits
- Code churn

**Configuração**:
```bash
# Variável de ambiente
REACT_APP_GIT_REPOSITORY_PATH=./caminho/para/repositorio
```

### 2. GitHub
**Propósito**: Extrair métricas do repositório remoto
**Dados Coletados**:
- Pull requests (abertas, fechadas, merged)
- Issues (abertas, fechadas)
- Releases
- Estatísticas do repositório
- Contribuidores
- Code reviews
- Status de deployments

**Configuração**:
```bash
# Variáveis de ambiente
REACT_APP_GITHUB_TOKEN=seu_token_github
REACT_APP_GITHUB_REPOSITORY=nome-do-repositorio
REACT_APP_GITHUB_OWNER=seu-usuario
```

**Como obter o token GitHub**:
1. Acesse GitHub Settings > Developer settings > Personal access tokens
2. Clique em "Generate new token"
3. Selecione os escopos: `repo`, `read:user`, `read:org`
4. Copie o token gerado

### 3. Docker
**Propósito**: Monitorar containers e recursos
**Dados Coletados**:
- Status dos containers
- Uso de CPU e memória
- Images disponíveis
- Volumes e networks
- Build history
- Vulnerabilidades

**Configuração**:
```bash
# Variáveis de ambiente
REACT_APP_DOCKER_HOST=localhost
REACT_APP_DOCKER_PORT=2375
REACT_APP_DOCKER_API_VERSION=1.41
```

**Habilitar API do Docker**:
```bash
# No arquivo /etc/docker/daemon.json
{
  "hosts": ["tcp://0.0.0.0:2375", "unix:///var/run/docker.sock"]
}
```

### 4. n8n
**Propósito**: Monitorar workflows e execuções
**Dados Coletados**:
- Workflows ativos/inativos
- Execuções recentes
- Performance dos workflows
- Taxa de sucesso
- Tempo médio de execução
- Credenciais utilizadas

**Configuração**:
```bash
# Variáveis de ambiente
REACT_APP_N8N_BASE_URL=http://localhost:5678
REACT_APP_N8N_API_KEY=sua_api_key_n8n
```

**Como obter a API key do n8n**:
1. Acesse as configurações do n8n
2. Vá para "API Keys"
3. Crie uma nova API key
4. Copie a chave gerada

### 5. Python
**Propósito**: Análise de código e dependências
**Dados Coletados**:
- Dependências e versões
- Cobertura de testes
- Qualidade do código (Pylint, Flake8)
- Vulnerabilidades de segurança
- Performance do código
- Technical debt

**Configuração**:
```bash
# Variáveis de ambiente
REACT_APP_PYTHON_PROJECT_PATH=./caminho/para/projeto
REACT_APP_PYTHON_REQUIREMENTS_FILE=requirements.txt
```

## 🔧 Configuração Completa

### 1. Arquivo .env
Crie um arquivo `.env` na raiz do projeto:

```env
# GitHub
REACT_APP_GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
REACT_APP_GITHUB_REPOSITORY=milapp-supabase-builder
REACT_APP_GITHUB_OWNER=seu-usuario

# Docker
REACT_APP_DOCKER_HOST=localhost
REACT_APP_DOCKER_PORT=2375
REACT_APP_DOCKER_API_VERSION=1.41

# n8n
REACT_APP_N8N_BASE_URL=http://localhost:5678
REACT_APP_N8N_API_KEY=sua_api_key_aqui

# Python
REACT_APP_PYTHON_PROJECT_PATH=./
REACT_APP_PYTHON_REQUIREMENTS_FILE=requirements.txt

# Git
REACT_APP_GIT_REPOSITORY_PATH=./
```

### 2. Configuração por Ambiente

#### Desenvolvimento
```typescript
import { developmentIntegrationConfig } from './config/integration.config';

const config = developmentIntegrationConfig;
```

#### Produção
```typescript
import { productionIntegrationConfig } from './config/integration.config';

const config = productionIntegrationConfig;
```

#### Por Projeto
```typescript
import { getProjectIntegrationConfig } from './config/integration.config';

const config = getProjectIntegrationConfig('milapp-supabase-builder');
```

## 📊 Uso dos Componentes

### 1. Dashboard Integrado
```typescript
import IntegratedMetricsDashboard from './components/IntegratedMetricsDashboard';
import { getIntegrationConfig } from './config/integration.config';

function App() {
  const config = getIntegrationConfig();
  
  return (
    <IntegratedMetricsDashboard 
      projectId="milapp-supabase-builder"
      integrationConfig={config}
    />
  );
}
```

### 2. Hook de Métricas
```typescript
import useIntegrationMetrics from './hooks/useIntegrationMetrics';
import { getIntegrationConfig } from './config/integration.config';

function MyComponent() {
  const config = getIntegrationConfig();
  const { 
    metrics, 
    loading, 
    error, 
    fetchMetrics,
    getDeveloperActivity,
    getProjectVelocity 
  } = useIntegrationMetrics(config);

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  const developerActivity = getDeveloperActivity();
  const projectVelocity = getProjectVelocity();

  return (
    <div>
      <h2>Atividade dos Desenvolvedores</h2>
      {developerActivity.map(dev => (
        <div key={dev.developer}>
          {dev.developer}: {dev.commits} commits
        </div>
      ))}
    </div>
  );
}
```

### 3. Serviço de Integração
```typescript
import IntegrationService from './services/IntegrationService';
import { getIntegrationConfig } from './config/integration.config';

const config = getIntegrationConfig();
const integrationService = new IntegrationService(config);

// Buscar métricas específicas
const gitMetrics = await integrationService.getGitMetrics();
const githubMetrics = await integrationService.getGitHubMetrics();
const dockerMetrics = await integrationService.getDockerMetrics();
const n8nMetrics = await integrationService.getN8nMetrics();
const pythonMetrics = await integrationService.getPythonMetrics();

// Buscar todas as métricas
const allMetrics = await integrationService.getCombinedMetrics();
```

## 🔄 Monitoramento em Tempo Real

### 1. Configurar Monitoramento
```typescript
const { startRealTimeMonitoring, stopRealTimeMonitoring } = useIntegrationMetrics(config);

useEffect(() => {
  startRealTimeMonitoring((metrics) => {
    console.log('Novas métricas:', metrics);
    // Atualizar dashboard ou enviar notificações
  });

  return () => {
    stopRealTimeMonitoring();
  };
}, []);
```

### 2. Alertas Automáticos
```typescript
const { metrics } = useIntegrationMetrics(config);

useEffect(() => {
  if (metrics) {
    // Verificar cobertura de testes
    if (metrics.python.test_coverage.total_coverage < 80) {
      alert('Cobertura de testes abaixo de 80%!');
    }

    // Verificar containers parados
    const stoppedContainers = metrics.docker.containers.filter(c => c.status === 'stopped');
    if (stoppedContainers.length > 0) {
      alert(`${stoppedContainers.length} containers parados!`);
    }

    // Verificar workflows com falha
    const failedWorkflows = metrics.n8n.executions.filter(e => e.status === 'failure');
    if (failedWorkflows.length > 0) {
      alert(`${failedWorkflows.length} workflows falharam!`);
    }
  }
}, [metrics]);
```

## 📈 Métricas Disponíveis

### Métricas de Desenvolvedor
- **Commits por dia/semana/mês**
- **Linhas de código adicionadas/removidas**
- **Pull requests criadas/reviewadas**
- **Issues criadas/resolvidas**
- **Tempo gasto em tarefas**
- **Score de produtividade**

### Métricas de Projeto
- **Velocity (commits por sprint)**
- **Lead time (tempo do commit ao deploy)**
- **Cycle time (tempo de desenvolvimento)**
- **Deployment frequency**
- **Change failure rate**
- **Mean time to recovery**

### Métricas de Qualidade
- **Code coverage**
- **Test pass rate**
- **Security score**
- **Code quality score**
- **Technical debt**
- **Bug density**

### Métricas de Recursos
- **CPU usage**
- **Memory usage**
- **Disk usage**
- **Network usage**
- **Container utilization**
- **Workflow utilization**

## 🚀 Relatórios e Exportação

### 1. Gerar Relatório Completo
```typescript
const { generateIntegrationReport } = useIntegrationMetrics(config);

const report = await generateIntegrationReport(
  '2024-01-01',
  '2024-01-31'
);

console.log('Relatório:', report);
```

### 2. Exportar Dados
```typescript
const { exportMetricsData } = useIntegrationMetrics(config);

// Exportar como JSON
const jsonData = await exportMetricsData('json');

// Exportar como CSV
const csvData = await exportMetricsData('csv');

// Exportar como Excel
const excelData = await exportMetricsData('excel');
```

## 🔒 Segurança

### 1. Proteção de Tokens
- Tokens são armazenados em variáveis de ambiente
- Não são commitados no repositório
- São mascarados nos logs

### 2. Rate Limiting
- Limite de 100 requisições por minuto
- Retry automático com backoff exponencial
- Cache de respostas para reduzir chamadas

### 3. Validação de Configuração
```typescript
import { validateIntegrationConfig } from './config/integration.config';

const config = getIntegrationConfig();
const validation = validateIntegrationConfig(config);

if (!validation.valid) {
  console.error('Erros de configuração:', validation.errors);
}
```

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. GitHub API Rate Limit
**Sintoma**: Erro 403 ou 429
**Solução**: 
- Verificar se o token tem permissões adequadas
- Implementar cache para reduzir chamadas
- Usar GitHub App em vez de Personal Access Token

#### 2. Docker API Indisponível
**Sintoma**: Erro de conexão
**Solução**:
- Verificar se o Docker está rodando
- Verificar se a API está habilitada
- Verificar firewall e portas

#### 3. n8n API Key Inválida
**Sintoma**: Erro 401
**Solução**:
- Verificar se a API key está correta
- Verificar se o n8n está rodando
- Verificar permissões da API key

#### 4. Python Path Inválido
**Sintoma**: Erro de arquivo não encontrado
**Solução**:
- Verificar se o caminho está correto
- Verificar se o requirements.txt existe
- Verificar permissões de acesso

### Logs de Debug
```typescript
// Habilitar logs detalhados
const DEBUG = process.env.NODE_ENV === 'development';

if (DEBUG) {
  console.log('Configuração:', config);
  console.log('Métricas:', metrics);
}
```

## 📚 Recursos Adicionais

### Documentação das APIs
- [GitHub API](https://docs.github.com/en/rest)
- [Docker API](https://docs.docker.com/engine/api/)
- [n8n API](https://docs.n8n.io/api/)

### Ferramentas de Teste
- [GitHub API Tester](https://developer.github.com/v3/oauth_authorizations/)
- [Docker API Explorer](https://docs.docker.com/engine/api/v1.41/)
- [n8n API Documentation](https://docs.n8n.io/api/)

### Monitoramento
- [GitHub Status](https://www.githubstatus.com/)
- [Docker Hub Status](https://status.docker.com/)
- [n8n Status](https://status.n8n.io/)

---

**Desenvolvido para o MILAPP - Sistema de Gestão de Projetos Híbrido**
*Versão 2.0 - Integrações Automatizadas* 