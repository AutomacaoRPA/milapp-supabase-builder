import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { ProtectedRoute, usePermissions, PermissionGate } from '../../components/ProtectedRoute/ProtectedRoute';
import api, { secureLogout, checkConnectivity } from '../../services/api';

// Mock do axios
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    },
    defaults: { headers: { common: {} } }
  },
  secureLogout: jest.fn(),
  checkConnectivity: jest.fn()
}));

// Mock do localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock do sessionStorage
const sessionStorageMock = {
  clear: jest.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock do window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '',
    reload: jest.fn()
  },
  writable: true
});

// Mock do window.history
Object.defineProperty(window, 'history', {
  value: {
    back: jest.fn()
  },
  writable: true
});

// Componente de teste para usar o contexto
const TestComponent: React.FC = () => {
  const { user, isAuthenticated, loading, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="authenticated">{isAuthenticated.toString()}</div>
      <div data-testid="user">{user ? user.name : 'no-user'}</div>
      <button onClick={() => login('test@test.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

// Wrapper para testes
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Inicialização', () => {
    it('deve inicializar sem usuário quando não há token', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });
    });

    it('deve carregar usuário quando há token válido', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6InVzZXIiLCJleHAiOjk5OTk5OTk5OTl9.signature';
      
      localStorageMock.getItem.mockReturnValue(mockToken);
      
      (api.get as jest.Mock).mockResolvedValue({
        data: {
          id: '123',
          name: 'John Doe',
          email: 'test@test.com',
          role: 'user'
        }
      });

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
        expect(screen.getByTestId('user')).toHaveTextContent('John Doe');
      });
    });
  });

  describe('Login', () => {
    it('deve fazer login com sucesso', async () => {
      const mockResponse = {
        data: {
          access_token: 'valid-token',
          user: {
            id: '123',
            name: 'John Doe',
            email: 'test@test.com',
            role: 'user'
          }
        }
      };

      (api.post as jest.Mock).mockResolvedValue(mockResponse);
      (checkConnectivity as jest.Mock).mockResolvedValue(true);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/auth/login', {
          email: 'test@test.com',
          password: 'password'
        });
        expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'valid-token');
      });
    });

    it('deve tratar erro de credenciais inválidas', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Credenciais inválidas' }
        }
      };

      (api.post as jest.Mock).mockRejectedValue(mockError);
      (checkConnectivity as jest.Mock).mockResolvedValue(true);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalled();
      });
    });

    it('deve tratar erro de conectividade', async () => {
      (checkConnectivity as jest.Mock).mockResolvedValue(false);

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const loginButton = screen.getByText('Login');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(checkConnectivity).toHaveBeenCalled();
      });
    });
  });

  describe('Logout', () => {
    it('deve fazer logout corretamente', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
        expect(sessionStorageMock.clear).toHaveBeenCalled();
      });
    });
  });
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve mostrar loading enquanto verifica autenticação', () => {
    render(
      <TestWrapper>
        <ProtectedRoute>
          <div>Conteúdo protegido</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('deve redirecionar para login quando não autenticado', async () => {
    (checkConnectivity as jest.Mock).mockResolvedValue(true);

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div>Conteúdo protegido</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      // Deve redirecionar para login
      expect(window.location.href).toBe('/login');
    });
  });

  it('deve mostrar erro de conectividade quando offline', async () => {
    (checkConnectivity as jest.Mock).mockResolvedValue(false);

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div>Conteúdo protegido</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Sem Conectividade')).toBeInTheDocument();
    });
  });

  it('deve mostrar acesso negado quando sem permissões', async () => {
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6InVzZXIiLCJleHAiOjk5OTk5OTk5OTl9.signature';
    
    localStorageMock.getItem.mockReturnValue(mockToken);
    
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        id: '123',
        name: 'John Doe',
        email: 'test@test.com',
        role: 'user',
        permissions: ['read']
      }
    });

    (checkConnectivity as jest.Mock).mockResolvedValue(true);

    render(
      <TestWrapper>
        <ProtectedRoute requiredPermissions={['admin']}>
          <div>Conteúdo protegido</div>
        </ProtectedRoute>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
    });
  });
});

describe('usePermissions', () => {
  const TestPermissionsComponent: React.FC = () => {
    const { hasPermission, hasRole, userPermissions, userRole } = usePermissions();
    
    return (
      <div>
        <div data-testid="has-admin-permission">{hasPermission('admin').toString()}</div>
        <div data-testid="has-admin-role">{hasRole('admin').toString()}</div>
        <div data-testid="permissions">{userPermissions.join(',')}</div>
        <div data-testid="role">{userRole || 'no-role'}</div>
      </div>
    );
  };

  it('deve verificar permissões corretamente', async () => {
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6ImFkbWluIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature';
    
    localStorageMock.getItem.mockReturnValue(mockToken);
    
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        id: '123',
        name: 'John Doe',
        email: 'test@test.com',
        role: 'admin',
        permissions: ['admin', 'read', 'write']
      }
    });

    (checkConnectivity as jest.Mock).mockResolvedValue(true);

    render(
      <TestWrapper>
        <TestPermissionsComponent />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId('has-admin-permission')).toHaveTextContent('true');
      expect(screen.getByTestId('has-admin-role')).toHaveTextContent('true');
      expect(screen.getByTestId('permissions')).toHaveTextContent('admin,read,write');
      expect(screen.getByTestId('role')).toHaveTextContent('admin');
    });
  });
});

describe('PermissionGate', () => {
  it('deve renderizar conteúdo quando tem permissão', async () => {
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6ImFkbWluIiwiZXhwIjo5OTk5OTk5OTk5fQ.signature';
    
    localStorageMock.getItem.mockReturnValue(mockToken);
    
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        id: '123',
        name: 'John Doe',
        email: 'test@test.com',
        role: 'admin',
        permissions: ['admin']
      }
    });

    (checkConnectivity as jest.Mock).mockResolvedValue(true);

    render(
      <TestWrapper>
        <PermissionGate permissions={['admin']}>
          <div>Conteúdo com permissão</div>
        </PermissionGate>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Conteúdo com permissão')).toBeInTheDocument();
    });
  });

  it('deve renderizar fallback quando não tem permissão', async () => {
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6InVzZXIiLCJleHAiOjk5OTk5OTk5OTl9.signature';
    
    localStorageMock.getItem.mockReturnValue(mockToken);
    
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        id: '123',
        name: 'John Doe',
        email: 'test@test.com',
        role: 'user',
        permissions: ['read']
      }
    });

    (checkConnectivity as jest.Mock).mockResolvedValue(true);

    render(
      <TestWrapper>
        <PermissionGate permissions={['admin']} fallback={<div>Sem permissão</div>}>
          <div>Conteúdo com permissão</div>
        </PermissionGate>
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Sem permissão')).toBeInTheDocument();
      expect(screen.queryByText('Conteúdo com permissão')).not.toBeInTheDocument();
    });
  });
}); 