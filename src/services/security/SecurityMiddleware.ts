import { supabase } from '../supabase/client'

export interface SecurityContext {
  userId: string
  email: string
  fullName: string
  roles: string[]
  permissions: string[]
  sessionId: string
  ipAddress: string
  userAgent: string
}

export interface PermissionCheck {
  module: string
  action: string
  resource?: string
  scopeValue?: string
}

export class SecurityMiddleware {
  private static instance: SecurityMiddleware
  private securityLogs: Array<{
    type: string
    severity: string
    userId: string
    action: string
    success: boolean
    metadata: any
  }> = []

  private constructor() {}

  static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware()
    }
    return SecurityMiddleware.instance
  }

  /**
   * Valida token JWT e retorna contexto de segurança
   */
  async validateToken(token: string): Promise<SecurityContext | null> {
    try {
      // Validar sessão no Supabase
      const { data: sessionData, error: sessionError } = await supabase.rpc('validate_secure_session', {
        p_session_token: token
      })

      if (sessionError || !sessionData?.valid) {
        await this.logSecurityEvent('session_validation', 'warning', null, 'Token inválido', false, {
          error: sessionError?.message || 'Sessão inválida'
        })
        return null
      }

      // Obter dados do usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('id', sessionData.user_id)
        .eq('is_active', true)
        .single()

      if (userError || !userData) {
        await this.logSecurityEvent('user_validation', 'error', sessionData.user_id, 'Usuário não encontrado', false, {
          error: userError?.message
        })
        return null
      }

      // Obter roles do usuário
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userData.id)
        .eq('is_active', true)

      const roles = rolesData?.map(r => r.role) || []

      // Obter permissões do usuário
      const { data: permissionsData } = await supabase
        .from('user_permissions')
        .select('module, action, resource')
        .eq('user_id', userData.id)
        .eq('is_active', true)

      const permissions = permissionsData?.map(p => `${p.module}:${p.action}`) || []

      const context: SecurityContext = {
        userId: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        roles,
        permissions,
        sessionId: sessionData.session_id,
        ipAddress: this.getClientIP(),
        userAgent: this.getUserAgent()
      }

      await this.logSecurityEvent('session_validation', 'info', userData.id, 'Token validado com sucesso', true, {
        sessionId: sessionData.session_id
      })

      return context
    } catch (error) {
      console.error('❌ Erro na validação de token:', error)
      await this.logSecurityEvent('session_validation', 'error', null, 'Erro na validação', false, {
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
      return null
    }
  }

  /**
   * Verifica permissão granular do usuário
   */
  async checkPermission(
    context: SecurityContext,
    permission: PermissionCheck
  ): Promise<boolean> {
    try {
      // Verificar se usuário tem role de admin
      if (context.roles.includes('admin') || context.roles.includes('super_admin')) {
        return true
      }

      // Verificar permissão específica
      const { data: permissionData, error } = await supabase.rpc('check_user_permission', {
        p_user_id: context.userId,
        p_module: permission.module,
        p_action: permission.action,
        p_resource: permission.resource || null,
        p_scope_value: permission.scopeValue || null
      })

      if (error) {
        console.error('❌ Erro ao verificar permissão:', error)
        return false
      }

      const hasPermission = permissionData || false

      await this.logSecurityEvent(
        'permission_check',
        hasPermission ? 'info' : 'warning',
        context.userId,
        `Verificação de permissão: ${permission.module}:${permission.action}`,
        hasPermission,
        {
          module: permission.module,
          action: permission.action,
          resource: permission.resource,
          scopeValue: permission.scopeValue,
          granted: hasPermission
        }
      )

      return hasPermission
    } catch (error) {
      console.error('❌ Erro ao verificar permissão:', error)
      await this.logSecurityEvent('permission_check', 'error', context.userId, 'Erro na verificação de permissão', false, {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        permission
      })
      return false
    }
  }

  /**
   * Verifica se usuário tem 2FA ativo e verificado
   */
  async check2FAStatus(context: SecurityContext): Promise<{
    required: boolean
    verified: boolean
    enabled: boolean
  }> {
    try {
      const { data: twoFactorData, error } = await supabase
        .from('user_2fa')
        .select('is_enabled, require_2fa_for_admin, require_2fa_for_sensitive_actions')
        .eq('user_id', context.userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erro ao verificar 2FA:', error)
        return { required: false, verified: false, enabled: false }
      }

      const isEnabled = twoFactorData?.is_enabled || false
      const requireForAdmin = twoFactorData?.require_2fa_for_admin || false
      const requireForSensitive = twoFactorData?.require_2fa_for_sensitive_actions || false

      // Verificar se 2FA é obrigatório
      const isRequired = isEnabled && (
        context.roles.includes('admin') && requireForAdmin ||
        requireForSensitive
      )

      // Verificar se 2FA foi verificado na sessão
      const { data: sessionData } = await supabase
        .from('secure_sessions')
        .select('is_2fa_verified')
        .eq('id', context.sessionId)
        .single()

      const isVerified = sessionData?.is_2fa_verified || false

      return {
        required: isRequired,
        verified: isVerified,
        enabled: isEnabled
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status 2FA:', error)
      return { required: false, verified: false, enabled: false }
    }
  }

  /**
   * Registra evento de segurança
   */
  async logSecurityEvent(
    type: string,
    severity: string,
    userId: string | null,
    action: string,
    success: boolean,
    metadata: any = {}
  ): Promise<void> {
    try {
      const logEntry = {
        log_type: type,
        severity,
        user_id: userId,
        action_description: action,
        success,
        ip_address: this.getClientIP(),
        user_agent: this.getUserAgent(),
        additional_data: metadata
      }

      // Salvar no Supabase
      const { error } = await supabase
        .from('security_logs')
        .insert(logEntry)

      if (error) {
        console.error('❌ Erro ao salvar log de segurança:', error)
      }

      // Adicionar ao cache local
      this.securityLogs.push({
        type,
        severity,
        userId: userId || 'system',
        action,
        success,
        metadata
      })

      // Limitar cache a 1000 entradas
      if (this.securityLogs.length > 1000) {
        this.securityLogs = this.securityLogs.slice(-1000)
      }
    } catch (error) {
      console.error('❌ Erro ao registrar evento de segurança:', error)
    }
  }

  /**
   * Detecta atividade suspeita
   */
  async detectSuspiciousActivity(context: SecurityContext): Promise<{
    suspicious: boolean
    reasons: string[]
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  }> {
    const reasons: string[] = []
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'

    try {
      // Verificar tentativas de login falhadas
      const { data: failedLogins } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('email', context.email)
        .eq('success', false)
        .gte('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Últimos 15 minutos

      if (failedLogins && failedLogins.length >= 5) {
        reasons.push(`Múltiplas tentativas de login falhadas (${failedLogins.length})`)
        riskLevel = 'high'
      }

      // Verificar localização suspeita
      const { data: recentLogins } = await supabase
        .from('security_logs')
        .select('location_data')
        .eq('user_id', context.userId)
        .eq('log_type', 'login')
        .eq('success', true)
        .order('created_at', { ascending: false })
        .limit(5)

      // Verificar horário suspeito (entre 2h e 6h da manhã)
      const currentHour = new Date().getHours()
      if (currentHour >= 2 && currentHour <= 6) {
        reasons.push('Login em horário suspeito')
        riskLevel = Math.max(riskLevel === 'low' ? 'medium' : riskLevel, 'medium')
      }

      // Verificar múltiplas sessões simultâneas
      const { data: activeSessions } = await supabase
        .from('secure_sessions')
        .select('*')
        .eq('user_id', context.userId)
        .eq('is_active', true)

      if (activeSessions && activeSessions.length > 3) {
        reasons.push(`Múltiplas sessões ativas (${activeSessions.length})`)
        riskLevel = Math.max(riskLevel === 'low' ? 'medium' : riskLevel, 'medium')
      }

      // Se detectou atividade suspeita, criar alerta
      if (reasons.length > 0) {
        await this.createSecurityAlert(context, reasons, riskLevel)
      }

      return {
        suspicious: reasons.length > 0,
        reasons,
        riskLevel
      }
    } catch (error) {
      console.error('❌ Erro ao detectar atividade suspeita:', error)
      return { suspicious: false, reasons: [], riskLevel: 'low' }
    }
  }

  /**
   * Cria alerta de segurança
   */
  private async createSecurityAlert(
    context: SecurityContext,
    reasons: string[],
    riskLevel: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('security_alerts')
        .insert({
          alert_type: 'suspicious_activity',
          severity: riskLevel,
          user_id: context.userId,
          title: 'Atividade Suspeita Detectada',
          description: `Detectada atividade suspeita: ${reasons.join(', ')}`,
          alert_data: {
            reasons,
            riskLevel,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent
          }
        })

      if (error) {
        console.error('❌ Erro ao criar alerta de segurança:', error)
      }
    } catch (error) {
      console.error('❌ Erro ao criar alerta de segurança:', error)
    }
  }

  /**
   * Revoga sessão do usuário
   */
  async revokeSession(sessionId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('revoke_secure_session', {
        p_session_id: sessionId,
        p_reason: reason
      })

      if (error) {
        console.error('❌ Erro ao revogar sessão:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('❌ Erro ao revogar sessão:', error)
      return false
    }
  }

  /**
   * Força logout de todas as sessões do usuário
   */
  async forceLogoutAllSessions(userId: string, reason: string): Promise<number> {
    try {
      const { data: sessions, error: fetchError } = await supabase
        .from('secure_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (fetchError) {
        console.error('❌ Erro ao buscar sessões:', fetchError)
        return 0
      }

      let revokedCount = 0
      for (const session of sessions || []) {
        const success = await this.revokeSession(session.id, reason)
        if (success) revokedCount++
      }

      await this.logSecurityEvent(
        'force_logout_all',
        'warning',
        userId,
        `Forçado logout de ${revokedCount} sessões: ${reason}`,
        true,
        { revokedCount, reason }
      )

      return revokedCount
    } catch (error) {
      console.error('❌ Erro ao forçar logout de todas as sessões:', error)
      return 0
    }
  }

  /**
   * Obtém logs de segurança do cache local
   */
  getSecurityLogs(): Array<{
    type: string
    severity: string
    userId: string
    action: string
    success: boolean
    metadata: any
  }> {
    return [...this.securityLogs]
  }

  /**
   * Limpa logs de segurança do cache local
   */
  clearSecurityLogs(): void {
    this.securityLogs = []
  }

  /**
   * Obtém IP do cliente (simulado)
   */
  private getClientIP(): string {
    // Em produção, isso viria do request
    return '127.0.0.1'
  }

  /**
   * Obtém User Agent do cliente (simulado)
   */
  private getUserAgent(): string {
    // Em produção, isso viria do request
    return navigator.userAgent
  }

  /**
   * Middleware para validação de rota
   */
  static async validateRoute(
    token: string,
    requiredPermission?: PermissionCheck
  ): Promise<{
    authorized: boolean
    context?: SecurityContext
    error?: string
  }> {
    const middleware = SecurityMiddleware.getInstance()

    try {
      // Validar token
      const context = await middleware.validateToken(token)
      if (!context) {
        return {
          authorized: false,
          error: 'Token inválido ou expirado'
        }
      }

      // Verificar permissão se especificada
      if (requiredPermission) {
        const hasPermission = await middleware.checkPermission(context, requiredPermission)
        if (!hasPermission) {
          return {
            authorized: false,
            context,
            error: 'Permissão insuficiente'
          }
        }
      }

      // Verificar 2FA se necessário
      const twoFactorStatus = await middleware.check2FAStatus(context)
      if (twoFactorStatus.required && !twoFactorStatus.verified) {
        return {
          authorized: false,
          context,
          error: 'Verificação 2FA necessária'
        }
      }

      // Detectar atividade suspeita
      const suspiciousActivity = await middleware.detectSuspiciousActivity(context)
      if (suspiciousActivity.suspicious && suspiciousActivity.riskLevel === 'critical') {
        // Revogar sessão em caso de atividade crítica
        await middleware.revokeSession(context.sessionId, 'Atividade suspeita crítica detectada')
        return {
          authorized: false,
          context,
          error: 'Atividade suspeita detectada - sessão revogada'
        }
      }

      return {
        authorized: true,
        context
      }
    } catch (error) {
      console.error('❌ Erro na validação de rota:', error)
      return {
        authorized: false,
        error: 'Erro interno de segurança'
      }
    }
  }

  /**
   * Decorator para proteger rotas
   */
  static requireAuth(permission?: PermissionCheck) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value

      descriptor.value = async function (...args: any[]) {
        const token = args[0]?.token || args[0]?.headers?.authorization?.replace('Bearer ', '')
        
        if (!token) {
          throw new Error('Token de autenticação não fornecido')
        }

        const validation = await SecurityMiddleware.validateRoute(token, permission)
        
        if (!validation.authorized) {
          throw new Error(validation.error || 'Acesso não autorizado')
        }

        // Adicionar contexto de segurança aos argumentos
        args[0].securityContext = validation.context
        
        return originalMethod.apply(this, args)
      }

      return descriptor
    }
  }

  /**
   * Decorator para logging de segurança
   */
  static logSecurity(type: string, severity: string = 'info') {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value

      descriptor.value = async function (...args: any[]) {
        const middleware = SecurityMiddleware.getInstance()
        const context = args[0]?.securityContext

        try {
          const result = await originalMethod.apply(this, args)
          
          await middleware.logSecurityEvent(
            type,
            severity,
            context?.userId || null,
            `${target.constructor.name}.${propertyKey}`,
            true,
            { result: result ? 'success' : 'failure' }
          )

          return result
        } catch (error) {
          await middleware.logSecurityEvent(
            type,
            'error',
            context?.userId || null,
            `${target.constructor.name}.${propertyKey}`,
            false,
            { error: error instanceof Error ? error.message : 'Erro desconhecido' }
          )
          
          throw error
        }
      }

      return descriptor
    }
  }
}

// Exportar instância singleton
export const securityMiddleware = SecurityMiddleware.getInstance() 