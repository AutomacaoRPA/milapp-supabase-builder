import React from 'react'
import { Chip, Tooltip, Box, Typography } from '@mui/material'
import { UserRole, useRoleContext } from '../../hooks/useCurrentRole'

interface RoleBadgeProps {
  role: UserRole
  projectId?: string
  size?: 'small' | 'medium' | 'large'
  showIcon?: boolean
  showDescription?: boolean
  variant?: 'filled' | 'outlined'
  onClick?: () => void
  className?: string
}

export function RoleBadge({ 
  role, 
  projectId, 
  size = 'medium', 
  showIcon = true, 
  showDescription = false,
  variant = 'filled',
  onClick,
  className
}: RoleBadgeProps) {
  const { getRoleDisplayName, getRoleColor, getRoleIcon } = useRoleContext(projectId || '')

  const roleConfig = {
    solicitante: {
      name: 'Solicitante',
      color: '#3B82F6',
      icon: '👤',
      description: 'Cria e acompanha solicitações'
    },
    executor: {
      name: 'Executor',
      color: '#10B981',
      icon: '⚙️',
      description: 'Desenvolve e implementa soluções'
    },
    gestor: {
      name: 'Gestor',
      color: '#F59E0B',
      icon: '👑',
      description: 'Aprova e gerencia projetos'
    },
    ia: {
      name: 'Especialista IA',
      color: '#8B5CF6',
      icon: '🤖',
      description: 'Auxilia com inteligência artificial'
    },
    readonly: {
      name: 'Apenas Leitura',
      color: '#6B7280',
      icon: '👁️',
      description: 'Visualização limitada'
    }
  }

  const config = roleConfig[role] || roleConfig.readonly

  const getChipSize = () => {
    switch (size) {
      case 'small': return 'small'
      case 'large': return 'medium'
      default: return 'medium'
    }
  }

  const getIconSize = () => {
    switch (size) {
      case 'small': return '14px'
      case 'large': return '20px'
      default: return '16px'
    }
  }

  const chipContent = (
    <Box display="flex" alignItems="center" gap={0.5}>
      {showIcon && (
        <span style={{ fontSize: getIconSize() }}>
          {config.icon}
        </span>
      )}
      <Typography 
        variant={size === 'small' ? 'caption' : 'body2'}
        sx={{ fontWeight: 500 }}
      >
        {config.name}
      </Typography>
    </Box>
  )

  const tooltipContent = showDescription ? config.description : config.name

  return (
    <Tooltip title={tooltipContent} arrow>
      <Chip
        label={chipContent}
        size={getChipSize()}
        variant={variant}
        onClick={onClick}
        className={className}
        sx={{
          backgroundColor: variant === 'filled' ? config.color : 'transparent',
          color: variant === 'filled' ? 'white' : config.color,
          borderColor: config.color,
          borderWidth: variant === 'outlined' ? 1 : 0,
          fontWeight: 500,
          '&:hover': {
            backgroundColor: variant === 'filled' ? config.color : `${config.color}10`,
            transform: 'translateY(-1px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          },
          transition: 'all 0.2s ease-in-out',
          cursor: onClick ? 'pointer' : 'default'
        }}
      />
    </Tooltip>
  )
}

// Componente para múltiplos papéis
interface MultiRoleBadgeProps {
  roles: UserRole[]
  projectId?: string
  maxDisplay?: number
  size?: 'small' | 'medium' | 'large'
  variant?: 'filled' | 'outlined'
}

export function MultiRoleBadge({ 
  roles, 
  projectId, 
  maxDisplay = 3, 
  size = 'medium',
  variant = 'filled'
}: MultiRoleBadgeProps) {
  const { getRoleDisplayName, getRoleColor, getRoleIcon } = useRoleContext(projectId || '')

  if (!roles || roles.length === 0) {
    return <RoleBadge role="readonly" projectId={projectId} size={size} variant={variant} />
  }

  const displayRoles = roles.slice(0, maxDisplay)
  const remainingCount = roles.length - maxDisplay

  return (
    <Box display="flex" gap={0.5} alignItems="center" flexWrap="wrap">
      {displayRoles.map((role, index) => (
        <RoleBadge
          key={`${role}-${index}`}
          role={role}
          projectId={projectId}
          size={size}
          variant={variant}
        />
      ))}
      {remainingCount > 0 && (
        <Chip
          label={`+${remainingCount}`}
          size={size === 'small' ? 'small' : 'medium'}
          variant="outlined"
          sx={{
            fontSize: size === 'small' ? '0.75rem' : '0.875rem',
            height: size === 'small' ? '20px' : '24px',
            minWidth: 'auto',
            padding: '0 6px'
          }}
        />
      )}
    </Box>
  )
}

// Componente para papel do usuário atual
interface CurrentRoleBadgeProps {
  projectId: string
  size?: 'small' | 'medium' | 'large'
  showDescription?: boolean
  variant?: 'filled' | 'outlined'
}

export function CurrentRoleBadge({ 
  projectId, 
  size = 'medium', 
  showDescription = false,
  variant = 'filled'
}: CurrentRoleBadgeProps) {
  const { role, isLoading } = useRoleContext(projectId)

  if (isLoading) {
    return (
      <Chip
        label="Carregando..."
        size={size === 'small' ? 'small' : 'medium'}
        variant="outlined"
        sx={{ opacity: 0.6 }}
      />
    )
  }

  if (!role) {
    return <RoleBadge role="readonly" projectId={projectId} size={size} variant={variant} />
  }

  return (
    <RoleBadge
      role={role}
      projectId={projectId}
      size={size}
      showDescription={showDescription}
      variant={variant}
    />
  )
}

// Componente para comparação de papéis
interface RoleComparisonBadgeProps {
  currentRole: UserRole
  requiredRole: UserRole
  projectId?: string
  size?: 'small' | 'medium' | 'large'
}

export function RoleComparisonBadge({ 
  currentRole, 
  requiredRole, 
  projectId, 
  size = 'medium' 
}: RoleComparisonBadgeProps) {
  const roleHierarchy = {
    readonly: 0,
    solicitante: 1,
    executor: 2,
    ia: 3,
    gestor: 4
  }

  const currentLevel = roleHierarchy[currentRole] || 0
  const requiredLevel = roleHierarchy[requiredRole] || 0
  const hasPermission = currentLevel >= requiredLevel

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <RoleBadge
        role={currentRole}
        projectId={projectId}
        size={size}
        variant={hasPermission ? 'filled' : 'outlined'}
      />
      <Typography variant="caption" color="text.secondary">
        {hasPermission ? '✓' : '✗'}
      </Typography>
      <RoleBadge
        role={requiredRole}
        projectId={projectId}
        size={size}
        variant="outlined"
      />
    </Box>
  )
} 