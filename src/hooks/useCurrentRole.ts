import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase/client'

export type UserRole = 'solicitante' | 'executor' | 'gestor' | 'ia' | 'readonly'

interface UserRoleData {
  id: string
  user_id: string
  project_id: string
  role: UserRole
  is_primary: boolean
  assigned_by: string
  assigned_at: string
  expires_at?: string
  is_active: boolean
  metadata: Record<string, any>
}

interface UseCurrentRoleReturn {
  role: UserRole | null
  roles: UserRoleData[]
  isLoading: boolean
  error: string | null
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  isSolicitante: boolean
  isExecutor: boolean
  isGestor: boolean
  isIA: boolean
  canCreateRequest: boolean
  canEditRequest: (requestId: string) => boolean
  canApproveRequest: boolean
  canAssignTasks: boolean
  canViewAnalytics: boolean
  canManageWorkflow: boolean
  canAccessAI: boolean
}

export function useCurrentRole(projectId: string): UseCurrentRoleReturn {
  const [role, setRole] = useState<UserRole | null>(null)
  const [roles, setRoles] = useState<UserRoleData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) {
      setRole(null)
      setRoles([])
      setIsLoading(false)
      return
    }

    loadUserRoles()
  }, [projectId])

  const loadUserRoles = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setRole('readonly')
        setRoles([])
        return
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('assigned_at', { ascending: false })

      if (error) throw error

      setRoles(data || [])
      
      // Definir papel principal
      const primaryRole = data?.find(r => r.is_primary)?.role
      const firstRole = data?.[0]?.role
      setRole(primaryRole || firstRole || 'readonly')

    } catch (err) {
      console.error('❌ Erro ao carregar papéis:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setRole('readonly')
    } finally {
      setIsLoading(false)
    }
  }

  const hasRole = (checkRole: UserRole): boolean => {
    return roles.some(r => r.role === checkRole)
  }

  const hasAnyRole = (checkRoles: UserRole[]): boolean => {
    return roles.some(r => checkRoles.includes(r.role))
  }

  // Computed properties para facilitar verificações
  const isSolicitante = hasRole('solicitante')
  const isExecutor = hasRole('executor')
  const isGestor = hasRole('gestor')
  const isIA = hasRole('ia')

  // Permissões baseadas em papéis
  const canCreateRequest = isSolicitante || isGestor
  const canEditRequest = (requestId: string) => isExecutor || isGestor || isIA
  const canApproveRequest = isGestor
  const canAssignTasks = isGestor || isExecutor
  const canViewAnalytics = isGestor || isExecutor || isIA
  const canManageWorkflow = isGestor
  const canAccessAI = isIA || isGestor || isExecutor

  return {
    role,
    roles,
    isLoading,
    error,
    hasRole,
    hasAnyRole,
    isSolicitante,
    isExecutor,
    isGestor,
    isIA,
    canCreateRequest,
    canEditRequest,
    canApproveRequest,
    canAssignTasks,
    canViewAnalytics,
    canManageWorkflow,
    canAccessAI
  }
}

// Hook para verificar permissões específicas
export function usePermissions(projectId: string) {
  const { role, hasRole, hasAnyRole, ...permissions } = useCurrentRole(projectId)

  return {
    ...permissions,
    // Permissões específicas por recurso
    projects: {
      create: hasRole('gestor'),
      read: true,
      update: hasRole('gestor'),
      delete: hasRole('gestor')
    },
    requests: {
      create: permissions.canCreateRequest,
      read: true,
      update: permissions.canEditRequest,
      delete: hasRole('gestor'),
      approve: permissions.canApproveRequest
    },
    tasks: {
      create: permissions.canAssignTasks,
      read: true,
      update: permissions.canAssignTasks,
      delete: hasRole('gestor')
    },
    workflow: {
      manage: permissions.canManageWorkflow,
      view: true,
      edit: permissions.canManageWorkflow
    },
    analytics: {
      view: permissions.canViewAnalytics,
      export: hasRole('gestor')
    },
    ai: {
      access: permissions.canAccessAI,
      configure: hasRole('gestor')
    },
    users: {
      view: hasRole('gestor'),
      manage: hasRole('gestor')
    }
  }
}

// Hook para contexto de papéis
export function useRoleContext(projectId: string) {
  const roleData = useCurrentRole(projectId)
  const permissions = usePermissions(projectId)

  return {
    ...roleData,
    permissions,
    // Helpers para UI
    getRoleDisplayName: (role: UserRole) => {
      const names = {
        solicitante: 'Solicitante',
        executor: 'Executor',
        gestor: 'Gestor',
        ia: 'Especialista IA',
        readonly: 'Apenas Leitura'
      }
      return names[role] || role
    },
    getRoleColor: (role: UserRole) => {
      const colors = {
        solicitante: '#3B82F6', // blue
        executor: '#10B981',    // green
        gestor: '#F59E0B',      // amber
        ia: '#8B5CF6',          // purple
        readonly: '#6B7280'     // gray
      }
      return colors[role] || '#6B7280'
    },
    getRoleIcon: (role: UserRole) => {
      const icons = {
        solicitante: '👤',
        executor: '⚙️',
        gestor: '👑',
        ia: '🤖',
        readonly: '👁️'
      }
      return icons[role] || '❓'
    }
  }
} 