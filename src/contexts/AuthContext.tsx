<<<<<<< HEAD
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };
=======
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AzureADService, MedSeniorUser } from '../services/auth/AzureADService'
import { RBACService } from '../services/auth/RBACService'

interface AuthContextType {
  user: MedSeniorUser | null
  isLoading: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
  hasPermission: (module: keyof MedSeniorUser['permissions'], action: string) => boolean
  canAccessModule: (module: keyof MedSeniorUser['permissions']) => boolean
  updateUserProfile: (updates: Partial<MedSeniorUser>) => Promise<void>
  updateAccessibilitySettings: (settings: MedSeniorUser['accessibility']) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<MedSeniorUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const azureADService = new AzureADService()

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      setIsLoading(true)
      
      // Verificar se já existe um usuário autenticado
      const currentUser = await azureADService.getCurrentUser()
      
      if (currentUser) {
        setUser(currentUser)
        console.log('👤 Usuário MedSênior carregado:', currentUser.name)
      }
    } catch (err) {
      console.error('Erro ao inicializar autenticação:', err)
      setError('Erro ao carregar sessão do usuário')
    } finally {
      setIsLoading(false)
    }
  }

  const signIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const user = await azureADService.signInWithMicrosoft()
      setUser(user)
      
      console.log('🎉 Login MedSênior realizado com sucesso')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro no login'
      setError(errorMessage)
      console.error('❌ Erro no login:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setIsLoading(true)
      
      await azureADService.signOut()
      setUser(null)
      
      console.log('👋 Logout MedSênior realizado')
    } catch (err) {
      console.error('Erro no logout:', err)
      setError('Erro ao fazer logout')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      const currentUser = await azureADService.getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      }
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err)
    }
  }

  const hasPermission = (module: keyof MedSeniorUser['permissions'], action: string): boolean => {
    if (!user) return false
    return RBACService.hasPermission(user.role, module, action)
  }

  const canAccessModule = (module: keyof MedSeniorUser['permissions']): boolean => {
    if (!user) return false
    return RBACService.canAccessModule(user.role, module)
  }

  const updateUserProfile = async (updates: Partial<MedSeniorUser>) => {
    if (!user) throw new Error('Usuário não autenticado')

    try {
      const updatedUser = await azureADService.updateUserProfile(updates)
      setUser(updatedUser)
      console.log('✅ Perfil atualizado com sucesso')
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err)
      throw err
    }
  }

  const updateAccessibilitySettings = async (settings: MedSeniorUser['accessibility']) => {
    if (!user) throw new Error('Usuário não autenticado')

    try {
      await azureADService.updateAccessibilitySettings(settings)
      setUser({ ...user, accessibility: settings })
      console.log('♿ Configurações de acessibilidade atualizadas')
    } catch (err) {
      console.error('Erro ao atualizar acessibilidade:', err)
      throw err
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    signIn,
    signOut,
    refreshUser,
    hasPermission,
    canAccessModule,
    updateUserProfile,
    updateAccessibilitySettings
  }
>>>>>>> 6082052 ( MILAPP v2.0 - Implementação Completa ITIL 4 + IA Multiagente + Segurança Corporativa)

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
<<<<<<< HEAD
  );
};
=======
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

// Hook específico para permissões
export function usePermissions() {
  const { user, hasPermission, canAccessModule } = useAuth()
  
  if (!user) {
    return {
      canCreate: () => false,
      canUpdate: () => false,
      canDelete: () => false,
      canRead: () => false,
      canApprove: () => false,
      canExportAnalytics: () => false,
      canManageUsers: () => false,
      canAccessQualityGate: () => false,
      hasPermission: () => false,
      canAccessModule: () => false,
      getAvailableModules: () => [],
      getRoleDescription: () => '',
      getRoleColor: () => '#757575'
    }
  }

  return {
    canCreate: (module: keyof MedSeniorUser['permissions']) => 
      hasPermission(module, 'create'),
    canUpdate: (module: keyof MedSeniorUser['permissions']) => 
      hasPermission(module, 'update'),
    canDelete: (module: keyof MedSeniorUser['permissions']) => 
      hasPermission(module, 'delete'),
    canRead: (module: keyof MedSeniorUser['permissions']) => 
      hasPermission(module, 'read'),
    canApprove: () => RBACService.canApproveProjects(user.role),
    canExportAnalytics: () => RBACService.canExportAnalytics(user.role),
    canManageUsers: () => RBACService.canManageUsers(user.role),
    canAccessQualityGate: (gate: 'g1' | 'g2' | 'g3' | 'g4') => 
      RBACService.canAccessQualityGate(user.role, gate),
    hasPermission: (module: keyof MedSeniorUser['permissions'], action: string) => 
      hasPermission(module, action),
    canAccessModule: (module: keyof MedSeniorUser['permissions']) => 
      canAccessModule(module),
    getAvailableModules: () => RBACService.getAvailableModules(user.role),
    getRoleDescription: () => RBACService.getRoleDescription(user.role),
    getRoleColor: () => RBACService.getRoleColor(user.role)
  }
} 
>>>>>>> 6082052 ( MILAPP v2.0 - Implementação Completa ITIL 4 + IA Multiagente + Segurança Corporativa)
