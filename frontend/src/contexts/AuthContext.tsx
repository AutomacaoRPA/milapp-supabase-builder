import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { secureLogout, checkConnectivity } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions?: string[];
  lastLogin?: string;
}

interface AuthContextProps {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

// Função para validar token JWT
const validateToken = (token: string): boolean => {
  if (!token) return false;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    // Verificar expiração
    if (payload.exp && payload.exp < now) {
      console.warn('[Auth] Token expirado');
      return false;
    }
    
    // Verificar se não está próximo de expirar (5 minutos)
    if (payload.exp && payload.exp < now + 300) {
      console.warn('[Auth] Token próximo de expirar');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[Auth] Erro ao validar token:', error);
    return false;
  }
};

// Função para decodificar token e extrair informações do usuário
const decodeToken = (token: string): Partial<User> | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub || payload.user_id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      permissions: payload.permissions || [],
    };
  } catch (error) {
    console.error('[Auth] Erro ao decodificar token:', error);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Função para verificar e validar token armazenado
  const validateStoredToken = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    
    if (!storedToken) {
      setLoading(false);
      return false;
    }

    if (!validateToken(storedToken)) {
      console.warn('[Auth] Token armazenado inválido, removendo...');
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      return false;
    }

    return true;
  }, []);

  // Função para carregar dados do usuário
  const loadUserData = useCallback(async (authToken: string) => {
    try {
      // Verificar conectividade primeiro
      const isConnected = await checkConnectivity();
      if (!isConnected) {
        console.warn('[Auth] Sem conectividade, usando dados do token');
        const userData = decodeToken(authToken);
        if (userData) {
          setUser(userData as User);
          setIsAuthenticated(true);
        }
        return;
      }

      const response = await api.get('/auth/me');
      const userData = response.data;
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Atualizar token se necessário
      if (response.headers['x-new-token']) {
        const newToken = response.headers['x-new-token'];
        setToken(newToken);
        localStorage.setItem('token', newToken);
      }
      
    } catch (error: any) {
      console.error('[Auth] Erro ao carregar dados do usuário:', error);
      
      if (error.response?.status === 401) {
        // Token inválido no servidor
        secureLogout();
      } else {
        // Erro de rede, usar dados do token
        const userData = decodeToken(authToken);
        if (userData) {
          setUser(userData as User);
          setIsAuthenticated(true);
        }
      }
    }
  }, []);

  // Inicialização da autenticação
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      const isValid = await validateStoredToken();
      if (isValid && token) {
        await loadUserData(token);
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, [token, validateStoredToken, loadUserData]);

  // Função de login com validação robusta
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      // Validação básica
      if (!email || !password) {
        return { success: false, error: 'Email e senha são obrigatórios' };
      }
      
      if (!email.includes('@')) {
        return { success: false, error: 'Email inválido' };
      }
      
      if (password.length < 6) {
        return { success: false, error: 'Senha deve ter pelo menos 6 caracteres' };
      }

      // Verificar conectividade
      const isConnected = await checkConnectivity();
      if (!isConnected) {
        return { success: false, error: 'Sem conectividade com o servidor' };
      }

      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;

      // Validar token recebido
      if (!validateToken(access_token)) {
        return { success: false, error: 'Token inválido recebido do servidor' };
      }

      // Armazenar dados
      setToken(access_token);
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      console.log('[Auth] Login realizado com sucesso');
      return { success: true };

    } catch (error: any) {
      console.error('[Auth] Erro no login:', error);
      
      let errorMessage = 'Erro interno do servidor';
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
            errorMessage = 'Email ou senha incorretos';
            break;
          case 422:
            errorMessage = 'Dados inválidos';
            break;
          case 429:
            errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos';
            break;
          case 500:
            errorMessage = 'Erro interno do servidor';
            break;
          default:
            errorMessage = error.response.data?.message || 'Erro desconhecido';
        }
      } else if (error.request) {
        errorMessage = 'Sem conectividade com o servidor';
      }

      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Função de logout seguro
  const logout = useCallback(() => {
    console.log('[Auth] Logout iniciado');
    
    // Limpar estado local
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    
    // Limpar armazenamento
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    
    // Limpar headers da API
    delete api.defaults.headers.common['Authorization'];
    
    // Redirecionar para login
    window.location.href = '/login';
  }, []);

  // Função para refresh do token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) return false;

      const response = await api.post('/auth/refresh', {}, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      });

      const { access_token } = response.data;
      
      if (validateToken(access_token)) {
        setToken(access_token);
        localStorage.setItem('token', access_token);
        console.log('[Auth] Token renovado com sucesso');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[Auth] Erro ao renovar token:', error);
      logout();
      return false;
    }
  }, [logout]);

  // Função para atualizar dados do usuário
  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
    
    // Atualizar no localStorage se necessário
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      localStorage.setItem('user', JSON.stringify({ ...parsedUser, ...userData }));
    }
  }, []);

  // Verificar token periodicamente (a cada 5 minutos)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      const currentToken = localStorage.getItem('token');
      if (currentToken && !validateToken(currentToken)) {
        console.warn('[Auth] Token expirado detectado, tentando renovar...');
        const refreshed = await refreshToken();
        if (!refreshed) {
          logout();
        }
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshToken, logout]);

  const contextValue: AuthContextProps = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    refreshToken,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}; 