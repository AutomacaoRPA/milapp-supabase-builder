import { ReactNode } from 'react'
import { Box, Alert, Typography, Chip } from '@mui/material'
import { Security, Block, CheckCircle } from '@mui/icons-material'
import { RBACService } from '../../services/auth/RBACService'
import { MedSeniorRole, MedSeniorPermissions } from '../../services/auth/AzureADService'

interface AccessControlProps {
  userRole: MedSeniorRole
  module: keyof MedSeniorPermissions
  action: string
  children: ReactNode
  fallback?: ReactNode
  showAccessInfo?: boolean
}

interface ModuleAccessProps {
  userRole: MedSeniorRole
  module: keyof MedSeniorPermissions
  children: ReactNode
  fallback?: ReactNode
}

interface ActionAccessProps {
  userRole: MedSeniorRole
  module: keyof MedSeniorPermissions
  action: string
  children: ReactNode
  fallback?: ReactNode
}

export function AccessControl({ 
  userRole, 
  module, 
  action, 
  children, 
  fallback,
  showAccessInfo = false 
}: AccessControlProps) {
  const hasAccess = RBACService.hasPermission(userRole, module, action)

  if (!hasAccess) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <Box sx={{ p: 2 }}>
        <Alert 
          severity="warning" 
          icon={<Block />}
          sx={{ 
            fontFamily: '"Antique Olive", sans-serif',
            '& .MuiAlert-message': {
              fontFamily: 'inherit'
            }
          }}
        >
          <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>
            Acesso restrito. Você não tem permissão para {action} em {module}.
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: 'inherit', mt: 1, display: 'block' }}>
            Role atual: <Chip label={userRole} size="small" color="primary" />
          </Typography>
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      {showAccessInfo && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
          <Typography variant="caption" sx={{ color: 'success.main' }}>
            Acesso permitido: {userRole} → {module}.{action}
          </Typography>
        </Box>
      )}
      {children}
    </Box>
  )
}

export function ModuleAccess({ userRole, module, children, fallback }: ModuleAccessProps) {
  const canAccess = RBACService.canAccessModule(userRole, module)

  if (!canAccess) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <Box sx={{ p: 2 }}>
        <Alert 
          severity="info" 
          icon={<Security />}
          sx={{ 
            fontFamily: '"Antique Olive", sans-serif',
            '& .MuiAlert-message': {
              fontFamily: 'inherit'
            }
          }}
        >
          <Typography variant="body2" sx={{ fontFamily: 'inherit' }}>
            Módulo {module} não está disponível para seu perfil.
          </Typography>
        </Alert>
      </Box>
    )
  }

  return <>{children}</>
}

export function ActionAccess({ userRole, module, action, children, fallback }: ActionAccessProps) {
  const hasPermission = RBACService.hasPermission(userRole, module, action)

  if (!hasPermission) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <Box sx={{ p: 1 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'text.secondary',
            fontFamily: '"Antique Olive", sans-serif',
            fontStyle: 'italic'
          }}
        >
          Ação {action} não disponível
        </Typography>
      </Box>
    )
  }

  return <>{children}</>
}

// Componentes específicos para ações comuns
export function CanCreate({ userRole, module, children, fallback }: {
  userRole: MedSeniorRole
  module: keyof MedSeniorPermissions
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <ActionAccess userRole={userRole} module={module} action="create" fallback={fallback}>
      {children}
    </ActionAccess>
  )
}

export function CanRead({ userRole, module, children, fallback }: {
  userRole: MedSeniorRole
  module: keyof MedSeniorPermissions
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <ActionAccess userRole={userRole} module={module} action="read" fallback={fallback}>
      {children}
    </ActionAccess>
  )
}

export function CanUpdate({ userRole, module, children, fallback }: {
  userRole: MedSeniorRole
  module: keyof MedSeniorPermissions
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <ActionAccess userRole={userRole} module={module} action="update" fallback={fallback}>
      {children}
    </ActionAccess>
  )
}

export function CanDelete({ userRole, module, children, fallback }: {
  userRole: MedSeniorRole
  module: keyof MedSeniorPermissions
  children: ReactNode
  fallback?: ReactNode
}) {
  return (
    <ActionAccess userRole={userRole} module={module} action="delete" fallback={fallback}>
      {children}
    </ActionAccess>
  )
}

export function CanApprove({ userRole, children, fallback }: {
  userRole: MedSeniorRole
  children: ReactNode
  fallback?: ReactNode
}) {
  const canApprove = RBACService.canApproveProjects(userRole)

  if (!canApprove) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

export function CanExportAnalytics({ userRole, children, fallback }: {
  userRole: MedSeniorRole
  children: ReactNode
  fallback?: ReactNode
}) {
  const canExport = RBACService.canExportAnalytics(userRole)

  if (!canExport) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

export function CanManageUsers({ userRole, children, fallback }: {
  userRole: MedSeniorRole
  children: ReactNode
  fallback?: ReactNode
}) {
  const canManage = RBACService.canManageUsers(userRole)

  if (!canManage) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

export function CanAccessQualityGate({ userRole, gate, children, fallback }: {
  userRole: MedSeniorRole
  gate: 'g1' | 'g2' | 'g3' | 'g4'
  children: ReactNode
  fallback?: ReactNode
}) {
  const canAccess = RBACService.canAccessQualityGate(userRole, gate)

  if (!canAccess) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

// Hook para verificar permissões
export function usePermissions(userRole: MedSeniorRole) {
  return {
    canCreate: (module: keyof MedSeniorPermissions) => 
      RBACService.canCreateInModule(userRole, module),
    canUpdate: (module: keyof MedSeniorPermissions) => 
      RBACService.canUpdateInModule(userRole, module),
    canDelete: (module: keyof MedSeniorPermissions) => 
      RBACService.canDeleteInModule(userRole, module),
    canApprove: () => RBACService.canApproveProjects(userRole),
    canExportAnalytics: () => RBACService.canExportAnalytics(userRole),
    canManageUsers: () => RBACService.canManageUsers(userRole),
    canAccessQualityGate: (gate: 'g1' | 'g2' | 'g3' | 'g4') => 
      RBACService.canAccessQualityGate(userRole, gate),
    hasPermission: (module: keyof MedSeniorPermissions, action: string) => 
      RBACService.hasPermission(userRole, module, action),
    getAvailableModules: () => RBACService.getAvailableModules(userRole),
    getRoleDescription: () => RBACService.getRoleDescription(userRole),
    getRoleColor: () => RBACService.getRoleColor(userRole)
  }
} 