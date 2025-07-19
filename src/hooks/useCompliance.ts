import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { MedSeniorAuditService } from '../services/audit/AuditService'
import { MedSeniorSecurityService } from '../services/security/SecurityService'
import { RBACService } from '../services/auth/RBACService'

export interface ComplianceConfig {
  enableAuditLogging: boolean
  enableDataEncryption: boolean
  enableRateLimiting: boolean
  enableSessionValidation: boolean
  enableInputSanitization: boolean
}

export interface ComplianceStatus {
  lgpd: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING'
  gdpr: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING'
  sox: 'COMPLIANT' | 'NON_COMPLIANT' | 'PENDING'
  lastChecked: Date
  violations: string[]
}

export function useCompliance() {
  const { user } = useAuth()
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null)
  const [complianceConfig, setComplianceConfig] = useState<ComplianceConfig>({
    enableAuditLogging: true,
    enableDataEncryption: true,
    enableRateLimiting: true,
    enableSessionValidation: true,
    enableInputSanitization: true
  })

  // Rastrear ação do usuário
  const trackAction = useCallback(async (
    action: string, 
    resource: string, 
    details?: any
  ) => {
    if (!user || !complianceConfig.enableAuditLogging) return
    
    try {
      await MedSeniorAuditService.logDataAccess(
        user.id,
        user.name,
        resource,
        action,
        details?.dataType || 'General'
      )
    } catch (error) {
      console.error('❌ Erro ao rastrear ação:', error)
    }
  }, [user, complianceConfig.enableAuditLogging])

  // Validar acesso a dados
  const validateDataAccess = useCallback((
    requiredRole: string,
    resource: string,
    action: string = 'read'
  ): boolean => {
    if (!user) return false
    
    const hasAccess = RBACService.hasPermission(
      user.role,
      resource as any,
      action as any
    )
    
    if (!hasAccess) {
      // Log de acesso negado
      MedSeniorAuditService.logPermissionDenied(
        user.id,
        user.name,
        resource,
        requiredRole
      )
    }
    
    return hasAccess
  }, [user])

  // Sanitizar entrada de dados
  const sanitizeInput = useCallback((input: string): string => {
    if (!complianceConfig.enableInputSanitization) return input
    return MedSeniorSecurityService.sanitizeInput(input)
  }, [complianceConfig.enableInputSanitization])

  // Validar email MedSênior
  const validateMedSeniorEmail = useCallback((email: string): boolean => {
    return MedSeniorSecurityService.validateMedSeniorEmail(email)
  }, [])

  // Validar força da senha
  const validatePasswordStrength = useCallback((password: string) => {
    return MedSeniorSecurityService.validatePasswordStrength(password)
  }, [])

  // Verificar rate limiting
  const checkRateLimit = useCallback((action: string) => {
    if (!user || !complianceConfig.enableRateLimiting) return { allowed: true, remaining: 999, resetTime: Date.now() }
    return MedSeniorSecurityService.checkRateLimit(user.id, action)
  }, [user, complianceConfig.enableRateLimiting])

  // Verificar tentativas de login
  const checkLoginAttempts = useCallback(() => {
    if (!user) return { allowed: true, remainingAttempts: 5, lockoutTime: null }
    return MedSeniorSecurityService.checkLoginAttempts(user.id)
  }, [user])

  // Registrar tentativa de login
  const recordLoginAttempt = useCallback((success: boolean) => {
    if (!user) return
    MedSeniorSecurityService.recordLoginAttempt(user.id, success)
  }, [user])

  // Validar sessão
  const validateSession = useCallback((sessionData: any): boolean => {
    if (!complianceConfig.enableSessionValidation) return true
    return MedSeniorSecurityService.validateSession(sessionData)
  }, [complianceConfig.enableSessionValidation])

  // Criptografar dados sensíveis
  const encryptSensitiveData = useCallback((data: string): string => {
    if (!complianceConfig.enableDataEncryption) return data
    return MedSeniorSecurityService.encryptSensitiveData(data)
  }, [complianceConfig.enableDataEncryption])

  // Descriptografar dados sensíveis
  const decryptSensitiveData = useCallback((encryptedData: string): string => {
    if (!complianceConfig.enableDataEncryption) return encryptedData
    return MedSeniorSecurityService.decryptSensitiveData(encryptedData)
  }, [complianceConfig.enableDataEncryption])

  // Verificar compliance
  const checkCompliance = useCallback(async (): Promise<ComplianceStatus> => {
    try {
      const checks = await MedSeniorAuditService.checkCompliance()
      
      const status: ComplianceStatus = {
        lgpd: 'COMPLIANT',
        gdpr: 'COMPLIANT',
        sox: 'COMPLIANT',
        lastChecked: new Date(),
        violations: []
      }

      checks.forEach(check => {
        if (check.status === 'NON_COMPLIANT') {
          status[check.regulation.toLowerCase() as keyof Pick<ComplianceStatus, 'lgpd' | 'gdpr' | 'sox'>] = 'NON_COMPLIANT'
          status.violations.push(`${check.regulation}: ${check.requirement}`)
        }
      })

      setComplianceStatus(status)
      return status
    } catch (error) {
      console.error('❌ Erro ao verificar compliance:', error)
      throw error
    }
  }, [])

  // Log de autenticação
  const logAuthentication = useCallback(async (success: boolean, method: string = 'Azure AD') => {
    if (!user || !complianceConfig.enableAuditLogging) return
    
    try {
      await MedSeniorAuditService.logAuthentication(
        user.id,
        user.name,
        success,
        method
      )
    } catch (error) {
      console.error('❌ Erro ao logar autenticação:', error)
    }
  }, [user, complianceConfig.enableAuditLogging])

  // Log de criação de projeto
  const logProjectCreation = useCallback(async (projectId: string, projectData: any) => {
    if (!user || !complianceConfig.enableAuditLogging) return
    
    try {
      await MedSeniorAuditService.logProjectCreation(
        user.id,
        user.name,
        projectId,
        projectData
      )
    } catch (error) {
      console.error('❌ Erro ao logar criação de projeto:', error)
    }
  }, [user, complianceConfig.enableAuditLogging])

  // Log de modificação de projeto
  const logProjectModification = useCallback(async (projectId: string, changes: any) => {
    if (!user || !complianceConfig.enableAuditLogging) return
    
    try {
      await MedSeniorAuditService.logProjectModification(
        user.id,
        user.name,
        projectId,
        changes
      )
    } catch (error) {
      console.error('❌ Erro ao logar modificação de projeto:', error)
    }
  }, [user, complianceConfig.enableAuditLogging])

  // Log de aprovação de quality gate
  const logQualityGateApproval = useCallback(async (
    projectId: string,
    gate: string,
    decision: 'APPROVED' | 'REJECTED',
    comments?: string
  ) => {
    if (!user || !complianceConfig.enableAuditLogging) return
    
    try {
      await MedSeniorAuditService.logQualityGateApproval(
        user.id,
        user.name,
        projectId,
        gate,
        decision,
        comments
      )
    } catch (error) {
      console.error('❌ Erro ao logar aprovação de quality gate:', error)
    }
  }, [user, complianceConfig.enableAuditLogging])

  // Log de exportação de dados
  const logDataExport = useCallback(async (resource: string, format: string, recordCount: number) => {
    if (!user || !complianceConfig.enableAuditLogging) return
    
    try {
      await MedSeniorAuditService.logDataExport(
        user.id,
        user.name,
        resource,
        format,
        recordCount
      )
    } catch (error) {
      console.error('❌ Erro ao logar exportação de dados:', error)
    }
  }, [user, complianceConfig.enableAuditLogging])

  // Gerar relatório de auditoria
  const generateAuditReport = useCallback(async (
    startDate: Date,
    endDate: Date,
    filters?: any
  ) => {
    try {
      return await MedSeniorAuditService.generateAuditReport(startDate, endDate, filters)
    } catch (error) {
      console.error('❌ Erro ao gerar relatório de auditoria:', error)
      throw error
    }
  }, [])

  // Atualizar configuração de compliance
  const updateComplianceConfig = useCallback((newConfig: Partial<ComplianceConfig>) => {
    setComplianceConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  // Verificar compliance na inicialização
  useEffect(() => {
    if (user) {
      checkCompliance()
    }
  }, [user, checkCompliance])

  return {
    // Estado
    complianceStatus,
    complianceConfig,
    
    // Ações de rastreamento
    trackAction,
    validateDataAccess,
    
    // Validações de segurança
    sanitizeInput,
    validateMedSeniorEmail,
    validatePasswordStrength,
    checkRateLimit,
    checkLoginAttempts,
    recordLoginAttempt,
    validateSession,
    
    // Criptografia
    encryptSensitiveData,
    decryptSensitiveData,
    
    // Logs específicos
    logAuthentication,
    logProjectCreation,
    logProjectModification,
    logQualityGateApproval,
    logDataExport,
    
    // Relatórios
    generateAuditReport,
    checkCompliance,
    
    // Configuração
    updateComplianceConfig
  }
} 