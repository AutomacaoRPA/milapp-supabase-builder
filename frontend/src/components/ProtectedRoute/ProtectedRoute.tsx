import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { checkConnectivity } from '../../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRole?: string;
  fallbackPath?: string;
  showLoading?: boolean;
}

// Componente de loading customizado
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Carregando...</p>
      <p className="text-sm text-gray-500 mt-2">Verificando autenticação</p>
    </div>
  </div>
);

// Componente de erro de conectividade
const ConnectivityError: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="text-red-500 text-6xl mb-4">📡</div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Sem Conectividade
      </h2>
      <p className="text-gray-600 mb-4">
        Não foi possível conectar ao servidor. Verifique sua conexão com a internet.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        Tentar Novamente
      </button>
    </div>
  </div>
);

// Componente de acesso negado
const AccessDenied: React.FC<{ requiredPermissions?: string[]; requiredRole?: string }> = ({ 
  requiredPermissions, 
  requiredRole 
}) => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="text-red-500 text-6xl mb-4">🚫</div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Acesso Negado
      </h2>
      <p className="text-gray-600 mb-4">
        Você não tem permissão para acessar esta página.
      </p>
      {requiredRole && (
        <p className="text-sm text-gray-500 mb-2">
          Função necessária: <span className="font-semibold">{requiredRole}</span>
        </p>
      )}
      {requiredPermissions && requiredPermissions.length > 0 && (
        <div className="text-sm text-gray-500 mb-4">
          <p>Permissões necessárias:</p>
          <ul className="list-disc list-inside mt-1">
            {requiredPermissions.map((permission, index) => (
              <li key={index} className="font-semibold">{permission}</li>
            ))}
          </ul>
        </div>
      )}
      <button
        onClick={() => window.history.back()}
        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors mr-2"
      >
        Voltar
      </button>
      <button
        onClick={() => window.location.href = '/dashboard'}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        Dashboard
      </button>
    </div>
  </div>
);

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredRole,
  fallbackPath = '/login',
  showLoading = true
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [connectivityStatus, setConnectivityStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [hasCheckedConnectivity, setHasCheckedConnectivity] = useState(false);

  // Verificar conectividade
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await checkConnectivity();
        setConnectivityStatus(isConnected ? 'connected' : 'disconnected');
      } catch (error) {
        setConnectivityStatus('disconnected');
      } finally {
        setHasCheckedConnectivity(true);
      }
    };

    // Só verificar conectividade se não estiver autenticado ou se estiver carregando
    if (!isAuthenticated || loading) {
      checkConnection();
    } else {
      setConnectivityStatus('connected');
      setHasCheckedConnectivity(true);
    }
  }, [isAuthenticated, loading]);

  // Função para verificar permissões
  const hasRequiredPermissions = (): boolean => {
    if (!user) return false;
    
    // Verificar função se especificada
    if (requiredRole && user.role !== requiredRole) {
      return false;
    }
    
    // Verificar permissões se especificadas
    if (requiredPermissions.length > 0) {
      if (!user.permissions || user.permissions.length === 0) {
        return false;
      }
      
      return requiredPermissions.every(permission => 
        user.permissions!.includes(permission)
      );
    }
    
    return true;
  };

  // Função para verificar se o usuário tem acesso
  const hasAccess = (): boolean => {
    if (!isAuthenticated || !user) return false;
    return hasRequiredPermissions();
  };

  // Mostrar loading enquanto verifica autenticação
  if (loading || !hasCheckedConnectivity) {
    return showLoading ? <LoadingSpinner /> : null;
  }

  // Verificar conectividade se não autenticado
  if (!isAuthenticated && connectivityStatus === 'disconnected') {
    return <ConnectivityError />;
  }

  // Redirecionar para login se não autenticado
  if (!isAuthenticated) {
    return (
      <Navigate
        to={fallbackPath}
        state={{ from: location }}
        replace
      />
    );
  }

  // Verificar permissões se autenticado
  if (!hasAccess()) {
    return (
      <AccessDenied
        requiredPermissions={requiredPermissions}
        requiredRole={requiredRole}
      />
    );
  }

  // Renderizar conteúdo se tudo estiver ok
  return <>{children}</>;
};

// Hook para verificar permissões em componentes
export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };
  
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user || !user.permissions) return false;
    return permissions.some(permission => user.permissions!.includes(permission));
  };
  
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user || !user.permissions) return false;
    return permissions.every(permission => user.permissions!.includes(permission));
  };
  
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };
  
  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    userPermissions: user?.permissions || [],
    userRole: user?.role
  };
};

// Componente de wrapper para elementos condicionais baseados em permissões
export const PermissionGate: React.FC<{
  children: React.ReactNode;
  permissions?: string[];
  roles?: string[];
  fallback?: React.ReactNode;
}> = ({ children, permissions = [], roles = [], fallback = null }) => {
  const { hasPermission, hasRole } = usePermissions();
  
  const hasAccess = (): boolean => {
    // Verificar roles primeiro
    if (roles.length > 0 && !roles.some(role => hasRole(role))) {
      return false;
    }
    
    // Verificar permissões
    if (permissions.length > 0 && !permissions.every(permission => hasPermission(permission))) {
      return false;
    }
    
    return true;
  };
  
  return hasAccess() ? <>{children}</> : <>{fallback}</>;
}; 