import { MedSeniorRole, MedSeniorPermissions } from './AzureADService'

export class RBACService {
  private static rolePermissions: Record<MedSeniorRole, MedSeniorPermissions> = {
    admin: {
      discovery: { create: true, read: true, update: true, delete: true },
      projects: { create: true, read: true, update: true, delete: true, approve: true },
      qualityGates: { g1: true, g2: true, g3: true, g4: true },
      analytics: { view: true, export: true, advanced: true },
      administration: { users: true, settings: true, audit: true }
    },
    manager: {
      discovery: { create: true, read: true, update: true, delete: false },
      projects: { create: true, read: true, update: true, delete: false, approve: true },
      qualityGates: { g1: true, g2: true, g3: true, g4: false },
      analytics: { view: true, export: true, advanced: true },
      administration: { users: false, settings: false, audit: true }
    },
    analyst: {
      discovery: { create: true, read: true, update: true, delete: false },
      projects: { create: true, read: true, update: true, delete: false, approve: false },
      qualityGates: { g1: true, g2: true, g3: false, g4: false },
      analytics: { view: true, export: false, advanced: false },
      administration: { users: false, settings: false, audit: false }
    },
    developer: {
      discovery: { create: true, read: true, update: true, delete: false },
      projects: { create: true, read: true, update: true, delete: false, approve: false },
      qualityGates: { g1: true, g2: true, g3: true, g4: false },
      analytics: { view: true, export: false, advanced: false },
      administration: { users: false, settings: false, audit: false }
    },
    viewer: {
      discovery: { create: false, read: true, update: false, delete: false },
      projects: { create: false, read: true, update: false, delete: false, approve: false },
      qualityGates: { g1: true, g2: false, g3: false, g4: false },
      analytics: { view: true, export: false, advanced: false },
      administration: { users: false, settings: false, audit: false }
    }
  }

  static hasPermission(
    userRole: MedSeniorRole, 
    module: keyof MedSeniorPermissions, 
    action: string
  ): boolean {
    const permissions = this.rolePermissions[userRole]
    if (!permissions) {
      console.warn(`Permissões não encontradas para role: ${userRole}`)
      return false
    }

    const modulePermissions = permissions[module]
    if (!modulePermissions) {
      console.warn(`Módulo não encontrado: ${module}`)
      return false
    }

    const hasPermission = modulePermissions[action as keyof any]
    
    console.log(`🔐 Verificação de permissão: ${userRole} -> ${module}.${action} = ${hasPermission}`)
    
    return hasPermission || false
  }

  static canAccessModule(userRole: MedSeniorRole, module: keyof MedSeniorPermissions): boolean {
    const permissions = this.rolePermissions[userRole]
    if (!permissions) return false

    const modulePermissions = permissions[module]
    if (!modulePermissions) return false

    // Verifica se o usuário tem pelo menos permissão de leitura
    return modulePermissions.read || false
  }

  static canCreateInModule(userRole: MedSeniorRole, module: keyof MedSeniorPermissions): boolean {
    return this.hasPermission(userRole, module, 'create')
  }

  static canUpdateInModule(userRole: MedSeniorRole, module: keyof MedSeniorPermissions): boolean {
    return this.hasPermission(userRole, module, 'update')
  }

  static canDeleteInModule(userRole: MedSeniorRole, module: keyof MedSeniorPermissions): boolean {
    return this.hasPermission(userRole, module, 'delete')
  }

  static canApproveProjects(userRole: MedSeniorRole): boolean {
    return this.hasPermission(userRole, 'projects', 'approve')
  }

  static canAccessQualityGate(userRole: MedSeniorRole, gate: 'g1' | 'g2' | 'g3' | 'g4'): boolean {
    return this.hasPermission(userRole, 'qualityGates', gate)
  }

  static canExportAnalytics(userRole: MedSeniorRole): boolean {
    return this.hasPermission(userRole, 'analytics', 'export')
  }

  static canAccessAdvancedAnalytics(userRole: MedSeniorRole): boolean {
    return this.hasPermission(userRole, 'analytics', 'advanced')
  }

  static canManageUsers(userRole: MedSeniorRole): boolean {
    return this.hasPermission(userRole, 'administration', 'users')
  }

  static canManageSettings(userRole: MedSeniorRole): boolean {
    return this.hasPermission(userRole, 'administration', 'settings')
  }

  static canViewAuditLogs(userRole: MedSeniorRole): boolean {
    return this.hasPermission(userRole, 'administration', 'audit')
  }

  static getRoleDescription(role: MedSeniorRole): string {
    const descriptions: Record<MedSeniorRole, string> = {
      admin: 'Administrador completo do sistema MedSênior',
      manager: 'Gerente com permissões de aprovação e gestão',
      analyst: 'Analista com acesso a análise e criação de projetos',
      developer: 'Desenvolvedor com acesso técnico avançado',
      viewer: 'Visualizador com acesso limitado a relatórios'
    }
    return descriptions[role]
  }

  static getRoleColor(role: MedSeniorRole): string {
    const colors: Record<MedSeniorRole, string> = {
      admin: '#d32f2f', // Vermelho
      manager: '#1976d2', // Azul
      analyst: '#388e3c', // Verde
      developer: '#f57c00', // Laranja
      viewer: '#757575' // Cinza
    }
    return colors[role]
  }

  static getAvailableModules(userRole: MedSeniorRole): Array<{
    module: keyof MedSeniorPermissions
    name: string
    description: string
    icon: string
    canAccess: boolean
  }> {
    const modules = [
      {
        module: 'discovery' as keyof MedSeniorPermissions,
        name: 'Discovery',
        description: 'Análise e descoberta de processos',
        icon: '🔍',
        canAccess: this.canAccessModule(userRole, 'discovery')
      },
      {
        module: 'projects' as keyof MedSeniorPermissions,
        name: 'Projetos',
        description: 'Gestão de projetos de automação',
        icon: '📋',
        canAccess: this.canAccessModule(userRole, 'projects')
      },
      {
        module: 'qualityGates' as keyof MedSeniorPermissions,
        name: 'Quality Gates',
        description: 'Controle de qualidade G1-G4',
        icon: '✅',
        canAccess: this.canAccessModule(userRole, 'qualityGates')
      },
      {
        module: 'analytics' as keyof MedSeniorPermissions,
        name: 'Analytics',
        description: 'Métricas e relatórios',
        icon: '📊',
        canAccess: this.canAccessModule(userRole, 'analytics')
      },
      {
        module: 'administration' as keyof MedSeniorPermissions,
        name: 'Administração',
        description: 'Configurações do sistema',
        icon: '⚙️',
        canAccess: this.canAccessModule(userRole, 'administration')
      }
    ]

    return modules
  }

  static validateUserAccess(
    userRole: MedSeniorRole,
    requiredPermissions: Array<{
      module: keyof MedSeniorPermissions
      action: string
    }>
  ): { hasAccess: boolean; missingPermissions: string[] } {
    const missingPermissions: string[] = []

    for (const permission of requiredPermissions) {
      if (!this.hasPermission(userRole, permission.module, permission.action)) {
        missingPermissions.push(`${permission.module}.${permission.action}`)
      }
    }

    return {
      hasAccess: missingPermissions.length === 0,
      missingPermissions
    }
  }

  static logAccessAttempt(
    userRole: MedSeniorRole,
    module: keyof MedSeniorPermissions,
    action: string,
    success: boolean
  ): void {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      userRole,
      module,
      action,
      success,
      message: success 
        ? `✅ Acesso permitido: ${userRole} -> ${module}.${action}`
        : `❌ Acesso negado: ${userRole} -> ${module}.${action}`
    }

    console.log(logEntry.message)
    
    // Aqui você pode implementar logging para auditoria
    // await supabase.from('audit_logs').insert(logEntry)
  }
} 