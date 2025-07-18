import axios, { AxiosError, AxiosResponse } from 'axios';

// Configuração baseada no ambiente
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || '/api/v1',
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || '30000'),
  retryAttempts: parseInt(process.env.REACT_APP_API_RETRY_ATTEMPTS || '3'),
  retryDelay: parseInt(process.env.REACT_APP_API_RETRY_DELAY || '1000'),
};

// Logger estruturado
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[API] ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[API ERROR] ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[API WARN] ${message}`, data || '');
  }
};

// Função para retry automático
const retryRequest = async (error: AxiosError, retryCount: number = 0): Promise<AxiosResponse> => {
  if (retryCount >= API_CONFIG.retryAttempts) {
    throw error;
  }

  // Só retry para erros de rede ou 5xx
  if (error.response && error.response.status < 500) {
    throw error;
  }

  logger.warn(`Tentativa ${retryCount + 1} de ${API_CONFIG.retryAttempts}`, {
    url: error.config?.url,
    status: error.response?.status
  });

  await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * (retryCount + 1)));
  
  if (error.config) {
    return axios.request(error.config);
  }
  
  throw error;
};

// Função para validar token
const validateToken = (token: string): boolean => {
  if (!token) return false;
  
  try {
    // Verificar se é um JWT válido (formato básico)
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Verificar se não expirou (decodificar payload)
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < now) {
      logger.warn('Token expirado detectado');
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao validar token', error);
    return false;
  }
};

// Função para sanitizar dados sensíveis
const sanitizeData = (data: any): any => {
  if (!data) return data;
  
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  const sanitized = { ...data };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': process.env.REACT_APP_VERSION || '1.0.0',
  }
});

// Interceptor de requisição com validação e logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Validar token antes de usar
    if (token && !validateToken(token)) {
      logger.warn('Token inválido detectado, removendo...');
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(new Error('Token inválido'));
    }
    
    if (token) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Log da requisição (sem dados sensíveis)
    logger.info(`Requisição: ${config.method?.toUpperCase()} ${config.url}`, {
      headers: sanitizeData(config.headers),
      params: config.params
    });
    
    return config;
  },
  (error) => {
    logger.error('Erro no interceptor de requisição', error);
    return Promise.reject(error);
  }
);

// Interceptor de resposta com tratamento robusto de erros
api.interceptors.response.use(
  (response) => {
    // Log da resposta bem-sucedida
    logger.info(`Resposta: ${response.status} ${response.config.url}`, {
      status: response.status,
      data: response.data
    });
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    // Log do erro
    logger.error('Erro na resposta da API', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    // Tratamento específico por status
    if (error.response) {
      switch (error.response.status) {
        case 401:
          logger.warn('Não autorizado - redirecionando para login');
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
          
        case 403:
          logger.warn('Acesso negado');
          // Pode redirecionar para página de acesso negado
          break;
          
        case 404:
          logger.warn('Recurso não encontrado');
          break;
          
        case 422:
          logger.warn('Dados inválidos', error.response.data);
          break;
          
        case 429:
          logger.warn('Rate limit excedido');
          // Aguardar antes de retry
          await new Promise(resolve => setTimeout(resolve, 5000));
          break;
          
        case 500:
        case 502:
        case 503:
        case 504:
          logger.error('Erro do servidor', error.response.data);
          // Tentar retry automático
          if (originalRequest) {
            return retryRequest(error);
          }
          break;
      }
    } else if (error.request) {
      // Erro de rede
      logger.error('Erro de rede - sem resposta do servidor');
      if (originalRequest) {
        return retryRequest(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// Função para fazer logout seguro
export const secureLogout = () => {
  logger.info('Logout seguro iniciado');
  
  // Limpar dados locais
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.clear();
  
  // Limpar headers
  delete api.defaults.headers.common['Authorization'];
  
  // Redirecionar para login
  window.location.href = '/login';
};

// Função para verificar conectividade
export const checkConnectivity = async (): Promise<boolean> => {
  try {
    await api.get('/health', { timeout: 5000 });
    return true;
  } catch (error) {
    logger.error('Falha na verificação de conectividade', error);
    return false;
  }
};

// Função para obter métricas de performance
export const getPerformanceMetrics = () => {
  return {
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    retryAttempts: API_CONFIG.retryAttempts,
    retryDelay: API_CONFIG.retryDelay,
  };
};

export default api; 