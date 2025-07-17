import { IntegrationConfig } from '../services/IntegrationService';

// Configuração padrão para integrações
export const defaultIntegrationConfig: IntegrationConfig = {
  github: {
    token: process.env.REACT_APP_GITHUB_TOKEN || '',
    repository: process.env.REACT_APP_GITHUB_REPOSITORY || '',
    owner: process.env.REACT_APP_GITHUB_OWNER || '',
  },
  docker: {
    host: process.env.REACT_APP_DOCKER_HOST || 'localhost',
    port: parseInt(process.env.REACT_APP_DOCKER_PORT || '2375'),
    api_version: process.env.REACT_APP_DOCKER_API_VERSION || '1.41',
  },
  n8n: {
    base_url: process.env.REACT_APP_N8N_BASE_URL || 'http://localhost:5678',
    api_key: process.env.REACT_APP_N8N_API_KEY || '',
  },
  python: {
    project_path: process.env.REACT_APP_PYTHON_PROJECT_PATH || './',
    requirements_file: process.env.REACT_APP_PYTHON_REQUIREMENTS_FILE || 'requirements.txt',
  },
  git: {
    repository_path: process.env.REACT_APP_GIT_REPOSITORY_PATH || './',
  },
};

// Configuração para desenvolvimento
export const developmentIntegrationConfig: IntegrationConfig = {
  github: {
    token: process.env.REACT_APP_GITHUB_TOKEN || '',
    repository: 'milapp-supabase-builder',
    owner: 'your-username',
  },
  docker: {
    host: 'localhost',
    port: 2375,
    api_version: '1.41',
  },
  n8n: {
    base_url: 'http://localhost:5678',
    api_key: process.env.REACT_APP_N8N_API_KEY || '',
  },
  python: {
    project_path: './',
    requirements_file: 'requirements.txt',
  },
  git: {
    repository_path: './',
  },
};

// Configuração para produção
export const productionIntegrationConfig: IntegrationConfig = {
  github: {
    token: process.env.REACT_APP_GITHUB_TOKEN || '',
    repository: process.env.REACT_APP_GITHUB_REPOSITORY || '',
    owner: process.env.REACT_APP_GITHUB_OWNER || '',
  },
  docker: {
    host: process.env.REACT_APP_DOCKER_HOST || 'localhost',
    port: parseInt(process.env.REACT_APP_DOCKER_PORT || '2375'),
    api_version: process.env.REACT_APP_DOCKER_API_VERSION || '1.41',
  },
  n8n: {
    base_url: process.env.REACT_APP_N8N_BASE_URL || '',
    api_key: process.env.REACT_APP_N8N_API_KEY || '',
  },
  python: {
    project_path: process.env.REACT_APP_PYTHON_PROJECT_PATH || './',
    requirements_file: process.env.REACT_APP_PYTHON_REQUIREMENTS_FILE || 'requirements.txt',
  },
  git: {
    repository_path: process.env.REACT_APP_GIT_REPOSITORY_PATH || './',
  },
};

// Função para obter configuração baseada no ambiente
export const getIntegrationConfig = (): IntegrationConfig => {
  const environment = process.env.NODE_ENV;
  
  switch (environment) {
    case 'development':
      return developmentIntegrationConfig;
    case 'production':
      return productionIntegrationConfig;
    default:
      return defaultIntegrationConfig;
  }
};

// Validação de configuração
export const validateIntegrationConfig = (config: IntegrationConfig): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validar GitHub
  if (!config.github.token) {
    errors.push('GitHub token é obrigatório');
  }
  if (!config.github.repository) {
    errors.push('GitHub repository é obrigatório');
  }
  if (!config.github.owner) {
    errors.push('GitHub owner é obrigatório');
  }

  // Validar Docker
  if (!config.docker.host) {
    errors.push('Docker host é obrigatório');
  }
  if (config.docker.port <= 0 || config.docker.port > 65535) {
    errors.push('Docker port deve estar entre 1 e 65535');
  }

  // Validar n8n
  if (!config.n8n.base_url) {
    errors.push('n8n base URL é obrigatório');
  }
  if (!config.n8n.api_key) {
    errors.push('n8n API key é obrigatório');
  }

  // Validar Python
  if (!config.python.project_path) {
    errors.push('Python project path é obrigatório');
  }
  if (!config.python.requirements_file) {
    errors.push('Python requirements file é obrigatório');
  }

  // Validar Git
  if (!config.git.repository_path) {
    errors.push('Git repository path é obrigatório');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Configurações específicas por projeto
export const projectIntegrationConfigs: Record<string, IntegrationConfig> = {
  'milapp-supabase-builder': {
    github: {
      token: process.env.REACT_APP_GITHUB_TOKEN || '',
      repository: 'milapp-supabase-builder',
      owner: 'your-username',
    },
    docker: {
      host: 'localhost',
      port: 2375,
      api_version: '1.41',
    },
    n8n: {
      base_url: 'http://localhost:5678',
      api_key: process.env.REACT_APP_N8N_API_KEY || '',
    },
    python: {
      project_path: './',
      requirements_file: 'requirements.txt',
    },
    git: {
      repository_path: './',
    },
  },
  'milapp-backend': {
    github: {
      token: process.env.REACT_APP_GITHUB_TOKEN || '',
      repository: 'milapp-backend',
      owner: 'your-username',
    },
    docker: {
      host: 'localhost',
      port: 2375,
      api_version: '1.41',
    },
    n8n: {
      base_url: 'http://localhost:5678',
      api_key: process.env.REACT_APP_N8N_API_KEY || '',
    },
    python: {
      project_path: './backend',
      requirements_file: 'requirements.txt',
    },
    git: {
      repository_path: './backend',
    },
  },
  'milapp-frontend': {
    github: {
      token: process.env.REACT_APP_GITHUB_TOKEN || '',
      repository: 'milapp-frontend',
      owner: 'your-username',
    },
    docker: {
      host: 'localhost',
      port: 2375,
      api_version: '1.41',
    },
    n8n: {
      base_url: 'http://localhost:5678',
      api_key: process.env.REACT_APP_N8N_API_KEY || '',
    },
    python: {
      project_path: './frontend',
      requirements_file: 'requirements.txt',
    },
    git: {
      repository_path: './frontend',
    },
  },
};

// Função para obter configuração por projeto
export const getProjectIntegrationConfig = (projectName: string): IntegrationConfig => {
  return projectIntegrationConfigs[projectName] || getIntegrationConfig();
};

// Configurações de timeouts e retry
export const integrationTimeouts = {
  github: {
    timeout: 10000, // 10 segundos
    retries: 3,
    retryDelay: 1000, // 1 segundo
  },
  docker: {
    timeout: 15000, // 15 segundos
    retries: 3,
    retryDelay: 2000, // 2 segundos
  },
  n8n: {
    timeout: 20000, // 20 segundos
    retries: 3,
    retryDelay: 3000, // 3 segundos
  },
  python: {
    timeout: 30000, // 30 segundos
    retries: 2,
    retryDelay: 5000, // 5 segundos
  },
  git: {
    timeout: 10000, // 10 segundos
    retries: 3,
    retryDelay: 1000, // 1 segundo
  },
};

// Configurações de cache
export const integrationCache = {
  enabled: true,
  ttl: 300000, // 5 minutos
  maxSize: 100, // máximo 100 itens em cache
};

// Configurações de monitoramento
export const integrationMonitoring = {
  enabled: true,
  interval: 300000, // 5 minutos
  alertThresholds: {
    errorRate: 0.1, // 10% de erro
    responseTime: 10000, // 10 segundos
    availability: 0.95, // 95% de disponibilidade
  },
};

// Configurações de segurança
export const integrationSecurity = {
  encryptTokens: true,
  maskSensitiveData: true,
  auditLog: true,
  rateLimit: {
    enabled: true,
    maxRequests: 100,
    windowMs: 60000, // 1 minuto
  },
};

export default {
  getIntegrationConfig,
  validateIntegrationConfig,
  getProjectIntegrationConfig,
  integrationTimeouts,
  integrationCache,
  integrationMonitoring,
  integrationSecurity,
}; 