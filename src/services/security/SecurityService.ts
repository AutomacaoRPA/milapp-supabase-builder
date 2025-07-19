import CryptoJS from 'crypto-js'
import { supabase } from '../supabase/client'

export interface SecurityConfig {
  encryptionKey: string
  rateLimitMax: number
  rateLimitWindow: number
  sessionTimeout: number
  maxLoginAttempts: number
}

export interface SecurityEvent {
  id: string
  userId: string
  eventType: 'LOGIN' | 'LOGOUT' | 'DATA_ACCESS' | 'PERMISSION_DENIED' | 'ANOMALY'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  details: any
  ipAddress: string
  userAgent: string
  timestamp: Date
}

export class MedSeniorSecurityService {
  private static readonly ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'medsenior-secure-key-2024'
  private static readonly RATE_LIMIT_CACHE = new Map<string, number[]>()
  private static readonly LOGIN_ATTEMPTS = new Map<string, { count: number; lastAttempt: number }>()
  
  // Configurações de segurança MedSênior
  private static readonly SECURITY_CONFIG: SecurityConfig = {
    encryptionKey: this.ENCRYPTION_KEY,
    rateLimitMax: 100,
    rateLimitWindow: 60000, // 1 minuto
    sessionTimeout: 3600000, // 1 hora
    maxLoginAttempts: 5
  }

  // Criptografia de dados sensíveis
  static encryptSensitiveData(data: string): string {
    try {
      return CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY).toString()
    } catch (error) {
      console.error('❌ Erro na criptografia:', error)
      throw new Error('Falha na criptografia de dados sensíveis')
    }
  }

  static decryptSensitiveData(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY)
      const decrypted = bytes.toString(CryptoJS.enc.Utf8)
      
      if (!decrypted) {
        throw new Error('Dados criptografados inválidos')
      }
      
      return decrypted
    } catch (error) {
      console.error('❌ Erro na descriptografia:', error)
      throw new Error('Falha na descriptografia de dados sensíveis')
    }
  }

  // Criptografia de objetos completos
  static encryptObject(obj: any): string {
    const jsonString = JSON.stringify(obj)
    return this.encryptSensitiveData(jsonString)
  }

  static decryptObject(encryptedData: string): any {
    const decryptedString = this.decryptSensitiveData(encryptedData)
    return JSON.parse(decryptedString)
  }

  // Validação e sanitização de entrada
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return ''
    }

    return input
      // Remover scripts
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remover javascript: URLs
      .replace(/javascript:/gi, '')
      // Remover event handlers
      .replace(/on\w+\s*=/gi, '')
      // Remover tags HTML perigosas
      .replace(/<(iframe|object|embed|form|input|textarea|select|button)[^>]*>/gi, '')
      // Remover atributos perigosos
      .replace(/\s*(on\w+|javascript:|vbscript:|data:)\s*=/gi, '')
      // Limpar espaços extras
      .trim()
  }

  // Validação de email MedSênior
  static validateMedSeniorEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@medsenior\.com\.br$/
    return emailRegex.test(email)
  }

  // Validação de senha forte
  static validatePasswordStrength(password: string): {
    isValid: boolean
    score: number
    feedback: string[]
  } {
    const feedback: string[] = []
    let score = 0

    // Comprimento mínimo
    if (password.length >= 8) {
      score += 1
    } else {
      feedback.push('Senha deve ter pelo menos 8 caracteres')
    }

    // Letra maiúscula
    if (/[A-Z]/.test(password)) {
      score += 1
    } else {
      feedback.push('Senha deve conter pelo menos uma letra maiúscula')
    }

    // Letra minúscula
    if (/[a-z]/.test(password)) {
      score += 1
    } else {
      feedback.push('Senha deve conter pelo menos uma letra minúscula')
    }

    // Número
    if (/\d/.test(password)) {
      score += 1
    } else {
      feedback.push('Senha deve conter pelo menos um número')
    }

    // Caractere especial
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1
    } else {
      feedback.push('Senha deve conter pelo menos um caractere especial')
    }

    return {
      isValid: score >= 4,
      score,
      feedback
    }
  }

  // Rate limiting avançado
  static checkRateLimit(userId: string, action: string): {
    allowed: boolean
    remaining: number
    resetTime: number
  } {
    const now = Date.now()
    const key = `${userId}:${action}`
    const userRequests = this.RATE_LIMIT_CACHE.get(key) || []
    
    // Remover requests antigas
    const validRequests = userRequests.filter(time => 
      now - time < this.SECURITY_CONFIG.rateLimitWindow
    )
    
    const remaining = Math.max(0, this.SECURITY_CONFIG.rateLimitMax - validRequests.length)
    const allowed = remaining > 0
    
    if (allowed) {
      validRequests.push(now)
      this.RATE_LIMIT_CACHE.set(key, validRequests)
    }
    
    const resetTime = now + this.SECURITY_CONFIG.rateLimitWindow
    
    return {
      allowed,
      remaining,
      resetTime
    }
  }

  // Controle de tentativas de login
  static checkLoginAttempts(userId: string): {
    allowed: boolean
    remainingAttempts: number
    lockoutTime: number | null
  } {
    const now = Date.now()
    const userAttempts = this.LOGIN_ATTEMPTS.get(userId)
    
    if (!userAttempts) {
      return {
        allowed: true,
        remainingAttempts: this.SECURITY_CONFIG.maxLoginAttempts,
        lockoutTime: null
      }
    }
    
    // Verificar se ainda está bloqueado
    const lockoutDuration = 15 * 60 * 1000 // 15 minutos
    if (now - userAttempts.lastAttempt < lockoutDuration) {
      return {
        allowed: false,
        remainingAttempts: 0,
        lockoutTime: userAttempts.lastAttempt + lockoutDuration
      }
    }
    
    // Reset se passou o tempo de bloqueio
    if (userAttempts.count >= this.SECURITY_CONFIG.maxLoginAttempts) {
      this.LOGIN_ATTEMPTS.delete(userId)
      return {
        allowed: true,
        remainingAttempts: this.SECURITY_CONFIG.maxLoginAttempts,
        lockoutTime: null
      }
    }
    
    return {
      allowed: true,
      remainingAttempts: this.SECURITY_CONFIG.maxLoginAttempts - userAttempts.count,
      lockoutTime: null
    }
  }

  static recordLoginAttempt(userId: string, success: boolean): void {
    if (success) {
      this.LOGIN_ATTEMPTS.delete(userId)
      return
    }
    
    const now = Date.now()
    const currentAttempts = this.LOGIN_ATTEMPTS.get(userId) || { count: 0, lastAttempt: 0 }
    
    this.LOGIN_ATTEMPTS.set(userId, {
      count: currentAttempts.count + 1,
      lastAttempt: now
    })
  }

  // Validação de sessão
  static validateSession(sessionData: any): boolean {
    if (!sessionData || !sessionData.createdAt) {
      return false
    }
    
    const now = Date.now()
    const sessionAge = now - new Date(sessionData.createdAt).getTime()
    
    return sessionAge < this.SECURITY_CONFIG.sessionTimeout
  }

  // Geração de tokens seguros
  static generateSecureToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  // Hash seguro para senhas
  static hashPassword(password: string): string {
    return CryptoJS.SHA256(password + this.ENCRYPTION_KEY).toString()
  }

  // Verificação de hash
  static verifyPassword(password: string, hash: string): boolean {
    const passwordHash = this.hashPassword(password)
    return passwordHash === hash
  }

  // Log de eventos de segurança
  static async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        ...event
      }

      // Salvar no Supabase
      const { error } = await supabase
        .from('security_events')
        .insert({
          id: securityEvent.id,
          user_id: securityEvent.userId,
          event_type: securityEvent.eventType,
          severity: securityEvent.severity,
          details: securityEvent.details,
          ip_address: securityEvent.ipAddress,
          user_agent: securityEvent.userAgent,
          timestamp: securityEvent.timestamp.toISOString()
        })

      if (error) {
        console.error('❌ Erro ao salvar evento de segurança:', error)
      }

      // Alertas para eventos críticos
      if (securityEvent.severity === 'CRITICAL') {
        await this.sendSecurityAlert(securityEvent)
      }
    } catch (error) {
      console.error('❌ Erro no log de segurança:', error)
    }
  }

  // Envio de alertas de segurança
  private static async sendSecurityAlert(event: SecurityEvent): Promise<void> {
    try {
      // Integração com Teams para alertas críticos
      const { TeamsIntegrationService } = await import('../integrations/TeamsIntegrationService')
      const teamsService = TeamsIntegrationService.getInstance()
      
      await teamsService.notifyCriticalError(
        `Evento de Segurança Crítico: ${event.eventType}`,
        'Security',
        'critical'
      )
    } catch (error) {
      console.error('❌ Erro ao enviar alerta de segurança:', error)
    }
  }

  // Obter IP do cliente
  static async getClientIP(): Promise<string> {
    try {
      // Em produção, isso viria do servidor
      // Aqui simulamos para desenvolvimento
      return '127.0.0.1'
    } catch (error) {
      return 'unknown'
    }
  }

  // Validação de CSRF token
  static validateCSRFToken(token: string, sessionToken: string): boolean {
    if (!token || !sessionToken) {
      return false
    }
    
    // Verificar se o token corresponde à sessão
    const expectedToken = this.generateCSRFToken(sessionToken)
    return token === expectedToken
  }

  static generateCSRFToken(sessionToken: string): string {
    return CryptoJS.SHA256(sessionToken + this.ENCRYPTION_KEY).toString()
  }

  // Limpeza de cache de segurança
  static cleanupSecurityCache(): void {
    const now = Date.now()
    
    // Limpar rate limit cache
    for (const [key, requests] of this.RATE_LIMIT_CACHE.entries()) {
      const validRequests = requests.filter(time => 
        now - time < this.SECURITY_CONFIG.rateLimitWindow
      )
      
      if (validRequests.length === 0) {
        this.RATE_LIMIT_CACHE.delete(key)
      } else {
        this.RATE_LIMIT_CACHE.set(key, validRequests)
      }
    }
    
    // Limpar login attempts antigos
    for (const [userId, attempts] of this.LOGIN_ATTEMPTS.entries()) {
      const lockoutDuration = 15 * 60 * 1000
      if (now - attempts.lastAttempt > lockoutDuration) {
        this.LOGIN_ATTEMPTS.delete(userId)
      }
    }
  }

  // Configurar limpeza automática
  static initializeSecurityCleanup(): void {
    setInterval(() => {
      this.cleanupSecurityCache()
    }, 5 * 60 * 1000) // Limpar a cada 5 minutos
  }
} 