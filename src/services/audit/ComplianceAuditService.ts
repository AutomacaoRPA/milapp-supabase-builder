import { supabase } from '../supabase/client'

export interface AuditEvent {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  resourceId?: string
  details: any
  ipAddress: string
  userAgent: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'security' | 'data' | 'access' | 'system' | 'compliance'
  compliance: {
    lgpd: boolean
    iso27001: boolean
    sox: boolean
    pci: boolean
  }
  metadata: any
}

export interface ComplianceRule {
  id: string
  name: string
  description: string
  framework: 'lgpd' | 'iso27001' | 'sox' | 'pci' | 'custom'
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  conditions: ComplianceCondition[]
  isActive: boolean
  remediation: string
  lastCheck: string
  status: 'compliant' | 'non_compliant' | 'warning'
}

export interface ComplianceCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'exists'
  value: any
  logicalOperator?: 'AND' | 'OR'
}

export interface DataSubject {
  id: string
  name: string
  email: string
  cpf: string
  consentStatus: 'granted' | 'denied' | 'pending' | 'withdrawn'
  dataCategories: string[]
  retentionPeriod: string
  lastAccess: string
  deletionRequested: boolean
  deletionDate?: string
}

export interface PrivacyImpactAssessment {
  id: string
  processName: string
  dataCategories: string[]
  purpose: string
  legalBasis: string
  retentionPeriod: string
  dataSubjects: number
  riskLevel: 'low' | 'medium' | 'high'
  mitigationMeasures: string[]
  assessmentDate: string
  nextReview: string
  status: 'pending' | 'approved' | 'rejected' | 'review_required'
}

export class ComplianceAuditService {
  private static instance: ComplianceAuditService
  private complianceRules: Map<string, ComplianceRule> = new Map()

  private constructor() {
    this.initializeComplianceRules()
  }

  static getInstance(): ComplianceAuditService {
    if (!ComplianceAuditService.instance) {
      ComplianceAuditService.instance = new ComplianceAuditService()
    }
    return ComplianceAuditService.instance
  }

  /**
   * Inicializar regras de compliance
   */
  private initializeComplianceRules() {
    const defaultRules: ComplianceRule[] = [
      // LGPD Rules
      {
        id: 'lgpd_consent_required',
        name: 'Consentimento LGPD Obrigatório',
        description: 'Verificar se consentimento foi obtido antes do processamento de dados pessoais',
        framework: 'lgpd',
        category: 'consent',
        severity: 'critical',
        conditions: [
          { field: 'data_type', operator: 'equals', value: 'personal' },
          { field: 'consent_obtained', operator: 'equals', value: false }
        ],
        isActive: true,
        remediation: 'Obter consentimento explícito do titular dos dados',
        lastCheck: new Date().toISOString(),
        status: 'compliant'
      },
      {
        id: 'lgpd_data_minimization',
        name: 'Minimização de Dados LGPD',
        description: 'Verificar se apenas dados necessários estão sendo coletados',
        framework: 'lgpd',
        category: 'data_minimization',
        severity: 'high',
        conditions: [
          { field: 'data_collected', operator: 'greater_than', value: 'minimal_required' }
        ],
        isActive: true,
        remediation: 'Revisar e reduzir dados coletados ao mínimo necessário',
        lastCheck: new Date().toISOString(),
        status: 'compliant'
      },
      {
        id: 'lgpd_retention_period',
        name: 'Período de Retenção LGPD',
        description: 'Verificar se dados pessoais são excluídos após período de retenção',
        framework: 'lgpd',
        category: 'retention',
        severity: 'high',
        conditions: [
          { field: 'retention_expired', operator: 'equals', value: true },
          { field: 'data_deleted', operator: 'equals', value: false }
        ],
        isActive: true,
        remediation: 'Excluir dados pessoais após período de retenção',
        lastCheck: new Date().toISOString(),
        status: 'compliant'
      },
      {
        id: 'lgpd_access_rights',
        name: 'Direitos de Acesso LGPD',
        description: 'Verificar se direitos de acesso, correção e exclusão estão implementados',
        framework: 'lgpd',
        category: 'access_rights',
        severity: 'critical',
        conditions: [
          { field: 'access_rights_implemented', operator: 'equals', value: false }
        ],
        isActive: true,
        remediation: 'Implementar mecanismos para exercício dos direitos LGPD',
        lastCheck: new Date().toISOString(),
        status: 'compliant'
      },

      // ISO 27001 Rules
      {
        id: 'iso_access_control',
        name: 'Controle de Acesso ISO 27001',
        description: 'Verificar se controles de acesso estão implementados adequadamente',
        framework: 'iso27001',
        category: 'access_control',
        severity: 'critical',
        conditions: [
          { field: 'access_control_implemented', operator: 'equals', value: false },
          { field: 'user_authentication', operator: 'equals', value: false }
        ],
        isActive: true,
        remediation: 'Implementar controles de acesso robustos e autenticação multifator',
        lastCheck: new Date().toISOString(),
        status: 'compliant'
      },
      {
        id: 'iso_data_encryption',
        name: 'Criptografia de Dados ISO 27001',
        description: 'Verificar se dados sensíveis estão criptografados',
        framework: 'iso27001',
        category: 'encryption',
        severity: 'high',
        conditions: [
          { field: 'sensitive_data_encrypted', operator: 'equals', value: false }
        ],
        isActive: true,
        remediation: 'Implementar criptografia para dados sensíveis em repouso e trânsito',
        lastCheck: new Date().toISOString(),
        status: 'compliant'
      },
      {
        id: 'iso_incident_response',
        name: 'Resposta a Incidentes ISO 27001',
        description: 'Verificar se processo de resposta a incidentes está documentado',
        framework: 'iso27001',
        category: 'incident_response',
        severity: 'high',
        conditions: [
          { field: 'incident_response_plan', operator: 'equals', value: false }
        ],
        isActive: true,
        remediation: 'Desenvolver e documentar plano de resposta a incidentes',
        lastCheck: new Date().toISOString(),
        status: 'compliant'
      },
      {
        id: 'iso_backup_recovery',
        name: 'Backup e Recuperação ISO 27001',
        description: 'Verificar se procedimentos de backup e recuperação estão implementados',
        framework: 'iso27001',
        category: 'backup_recovery',
        severity: 'high',
        conditions: [
          { field: 'backup_procedures', operator: 'equals', value: false },
          { field: 'recovery_tested', operator: 'equals', value: false }
        ],
        isActive: true,
        remediation: 'Implementar e testar procedimentos de backup e recuperação',
        lastCheck: new Date().toISOString(),
        status: 'compliant'
      },

      // SOX Rules
      {
        id: 'sox_financial_controls',
        name: 'Controles Financeiros SOX',
        description: 'Verificar se controles financeiros estão adequados',
        framework: 'sox',
        category: 'financial_controls',
        severity: 'critical',
        conditions: [
          { field: 'financial_controls_adequate', operator: 'equals', value: false }
        ],
        isActive: true,
        remediation: 'Implementar controles financeiros adequados e documentar processos',
        lastCheck: new Date().toISOString(),
        status: 'compliant'
      },
      {
        id: 'sox_change_management',
        name: 'Gestão de Mudanças SOX',
        description: 'Verificar se mudanças em sistemas financeiros são controladas',
        framework: 'sox',
        category: 'change_management',
        severity: 'high',
        conditions: [
          { field: 'change_management_implemented', operator: 'equals', value: false }
        ],
        isActive: true,
        remediation: 'Implementar processo formal de gestão de mudanças',
        lastCheck: new Date().toISOString(),
        status: 'compliant'
      },

      // PCI DSS Rules
      {
        id: 'pci_card_data_protection',
        name: 'Proteção de Dados de Cartão PCI',
        description: 'Verificar se dados de cartão estão adequadamente protegidos',
        framework: 'pci',
        category: 'card_data_protection',
        severity: 'critical',
        conditions: [
          { field: 'card_data_encrypted', operator: 'equals', value: false },
          { field: 'pci_compliant', operator: 'equals', value: false }
        ],
        isActive: true,
        remediation: 'Implementar controles PCI DSS para proteção de dados de cartão',
        lastCheck: new Date().toISOString(),
        status: 'compliant'
      }
    ]

    defaultRules.forEach(rule => {
      this.complianceRules.set(rule.id, rule)
    })
  }

  /**
   * Registrar evento de auditoria
   */
  async logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) return

      const auditEvent: AuditEvent = {
        ...event,
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      }

      await supabase
        .from('auditoria_eventos')
        .insert({
          user_id: auditEvent.userId,
          user_name: auditEvent.userName,
          acao: auditEvent.action,
          recurso: auditEvent.resource,
          resource_id: auditEvent.resourceId,
          detalhes: auditEvent.details,
          ip_address: auditEvent.ipAddress,
          user_agent: auditEvent.userAgent,
          severidade: auditEvent.severity,
          categoria: auditEvent.category,
          compliance: auditEvent.compliance,
          metadata: auditEvent.metadata
        })

      // Verificar compliance em tempo real
      await this.checkComplianceRealtime(auditEvent)

    } catch (error) {
      console.error('❌ Erro ao registrar evento de auditoria:', error)
    }
  }

  /**
   * Verificar compliance em tempo real
   */
  private async checkComplianceRealtime(event: AuditEvent): Promise<void> {
    for (const rule of this.complianceRules.values()) {
      if (!rule.isActive) continue

      if (this.matchesComplianceRule(event, rule)) {
        await this.createComplianceViolation(event, rule)
      }
    }
  }

  /**
   * Verificar se evento corresponde à regra de compliance
   */
  private matchesComplianceRule(event: AuditEvent, rule: ComplianceRule): boolean {
    if (rule.conditions.length === 0) return false

    let result = true
    let logicalOperator: 'AND' | 'OR' = 'AND'

    for (let i = 0; i < rule.conditions.length; i++) {
      const condition = rule.conditions[i]
      const matches = this.evaluateComplianceCondition(event, condition)

      if (i === 0) {
        result = matches
      } else {
        if (logicalOperator === 'AND') {
          result = result && matches
        } else {
          result = result || matches
        }
      }

      logicalOperator = condition.logicalOperator || 'AND'
    }

    return result
  }

  /**
   * Avaliar condição de compliance
   */
  private evaluateComplianceCondition(event: AuditEvent, condition: ComplianceCondition): boolean {
    const value = event.details[condition.field]

    switch (condition.operator) {
      case 'equals':
        return value === condition.value
      case 'not_equals':
        return value !== condition.value
      case 'greater_than':
        return value > condition.value
      case 'less_than':
        return value < condition.value
      case 'contains':
        return String(value).includes(String(condition.value))
      case 'in':
        return Array.isArray(condition.value) ? condition.value.includes(value) : false
      case 'exists':
        return value !== undefined && value !== null
      default:
        return false
    }
  }

  /**
   * Criar violação de compliance
   */
  private async createComplianceViolation(event: AuditEvent, rule: ComplianceRule): Promise<void> {
    try {
      await supabase
        .from('violacoes_compliance')
        .insert({
          regra_id: rule.id,
          evento_id: event.id,
          user_id: event.userId,
          severidade: rule.severity,
          framework: rule.framework,
          categoria: rule.category,
          descricao: rule.description,
          remediacao: rule.remediation,
          status: 'open',
          data_violacao: event.timestamp,
          metadata: {
            event: event,
            rule: rule
          }
        })
    } catch (error) {
      console.error('❌ Erro ao criar violação de compliance:', error)
    }
  }

  /**
   * Executar auditoria completa de compliance
   */
  async runComplianceAudit(): Promise<any> {
    try {
      const results = {
        lgpd: { compliant: 0, violations: 0, score: 0 },
        iso27001: { compliant: 0, violations: 0, score: 0 },
        sox: { compliant: 0, violations: 0, score: 0 },
        pci: { compliant: 0, violations: 0, score: 0 },
        overall: { compliant: 0, violations: 0, score: 0 }
      }

      // Verificar cada regra de compliance
      for (const rule of this.complianceRules.values()) {
        const isCompliant = await this.checkRuleCompliance(rule)
        
        if (isCompliant) {
          results[rule.framework].compliant++
          results.overall.compliant++
        } else {
          results[rule.framework].violations++
          results.overall.violations++
        }
      }

      // Calcular scores
      Object.keys(results).forEach(framework => {
        const total = results[framework].compliant + results[framework].violations
        results[framework].score = total > 0 ? (results[framework].compliant / total) * 100 : 100
      })

      // Salvar resultado da auditoria
      await this.saveAuditResult(results)

      return results
    } catch (error) {
      console.error('❌ Erro na auditoria de compliance:', error)
      throw error
    }
  }

  /**
   * Verificar compliance de regra específica
   */
  private async checkRuleCompliance(rule: ComplianceRule): Promise<boolean> {
    try {
      // Simular verificação de compliance
      // Em produção, isso seria uma verificação real dos dados
      const isCompliant = Math.random() > 0.3 // 70% de chance de estar compliant

      // Atualizar status da regra
      rule.status = isCompliant ? 'compliant' : 'non_compliant'
      rule.lastCheck = new Date().toISOString()

      return isCompliant
    } catch (error) {
      console.error(`❌ Erro ao verificar regra ${rule.id}:`, error)
      return false
    }
  }

  /**
   * Salvar resultado da auditoria
   */
  private async saveAuditResult(results: any): Promise<void> {
    try {
      await supabase
        .from('auditorias_compliance')
        .insert({
          data_auditoria: new Date().toISOString(),
          resultados: results,
          score_geral: results.overall.score,
          status: results.overall.score >= 90 ? 'compliant' : 'non_compliant',
          metadata: {
            total_regras: Object.values(this.complianceRules).length,
            frameworks_verificados: Object.keys(results).filter(k => k !== 'overall')
          }
        })
    } catch (error) {
      console.error('❌ Erro ao salvar resultado da auditoria:', error)
    }
  }

  /**
   * Obter eventos de auditoria
   */
  async getAuditEvents(
    filters: {
      userId?: string
      category?: string
      severity?: string
      startDate?: string
      endDate?: string
    } = {},
    limit: number = 100
  ): Promise<AuditEvent[]> {
    try {
      let query = supabase
        .from('auditoria_eventos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters.category) {
        query = query.eq('categoria', filters.category)
      }
      if (filters.severity) {
        query = query.eq('severidade', filters.severity)
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao obter eventos de auditoria:', error)
      return []
    }
  }

  /**
   * Obter violações de compliance
   */
  async getComplianceViolations(
    framework?: string,
    status?: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('violacoes_compliance')
        .select('*')
        .order('data_violacao', { ascending: false })
        .limit(limit)

      if (framework) {
        query = query.eq('framework', framework)
      }
      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao obter violações de compliance:', error)
      return []
    }
  }

  /**
   * Gerenciar dados pessoais (LGPD)
   */
  async managePersonalData(action: 'access' | 'rectify' | 'delete' | 'portability', dataSubjectId: string): Promise<any> {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) throw new Error('Usuário não autenticado')

      switch (action) {
        case 'access':
          return await this.processDataAccessRequest(dataSubjectId)
        case 'rectify':
          return await this.processDataRectificationRequest(dataSubjectId)
        case 'delete':
          return await this.processDataDeletionRequest(dataSubjectId)
        case 'portability':
          return await this.processDataPortabilityRequest(dataSubjectId)
        default:
          throw new Error('Ação não suportada')
      }
    } catch (error) {
      console.error(`❌ Erro ao processar solicitação ${action}:`, error)
      throw error
    }
  }

  /**
   * Processar solicitação de acesso aos dados
   */
  private async processDataAccessRequest(dataSubjectId: string): Promise<any> {
    // Simular processamento de solicitação de acesso
    const report = {
      id: `access_${Date.now()}`,
      dataSubjectId,
      type: 'access',
      status: 'completed',
      data: {
        personalInfo: { name: 'João Silva', email: 'joao@email.com' },
        usageHistory: [],
        consentHistory: [],
        thirdPartySharing: []
      },
      generatedAt: new Date().toISOString()
    }

    await this.logAuditEvent({
      userId: 'system',
      userName: 'Sistema',
      action: 'data_access_request',
      resource: 'personal_data',
      resourceId: dataSubjectId,
      details: { action: 'access', dataSubjectId },
      ipAddress: '127.0.0.1',
      userAgent: 'MILAPP-System',
      severity: 'medium',
      category: 'data',
      compliance: { lgpd: true, iso27001: true, sox: false, pci: false },
      metadata: { report }
    })

    return report
  }

  /**
   * Processar solicitação de retificação
   */
  private async processDataRectificationRequest(dataSubjectId: string): Promise<any> {
    // Simular processamento de retificação
    const result = {
      id: `rectify_${Date.now()}`,
      dataSubjectId,
      type: 'rectification',
      status: 'completed',
      updatedFields: ['email', 'phone'],
      updatedAt: new Date().toISOString()
    }

    await this.logAuditEvent({
      userId: 'system',
      userName: 'Sistema',
      action: 'data_rectification_request',
      resource: 'personal_data',
      resourceId: dataSubjectId,
      details: { action: 'rectify', dataSubjectId },
      ipAddress: '127.0.0.1',
      userAgent: 'MILAPP-System',
      severity: 'medium',
      category: 'data',
      compliance: { lgpd: true, iso27001: true, sox: false, pci: false },
      metadata: { result }
    })

    return result
  }

  /**
   * Processar solicitação de exclusão
   */
  private async processDataDeletionRequest(dataSubjectId: string): Promise<any> {
    // Simular processamento de exclusão
    const result = {
      id: `delete_${Date.now()}`,
      dataSubjectId,
      type: 'deletion',
      status: 'scheduled',
      scheduledDeletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
      dataCategories: ['personal_info', 'usage_history', 'preferences']
    }

    await this.logAuditEvent({
      userId: 'system',
      userName: 'Sistema',
      action: 'data_deletion_request',
      resource: 'personal_data',
      resourceId: dataSubjectId,
      details: { action: 'delete', dataSubjectId },
      ipAddress: '127.0.0.1',
      userAgent: 'MILAPP-System',
      severity: 'high',
      category: 'data',
      compliance: { lgpd: true, iso27001: true, sox: false, pci: false },
      metadata: { result }
    })

    return result
  }

  /**
   * Processar solicitação de portabilidade
   */
  private async processDataPortabilityRequest(dataSubjectId: string): Promise<any> {
    // Simular processamento de portabilidade
    const result = {
      id: `portability_${Date.now()}`,
      dataSubjectId,
      type: 'portability',
      status: 'completed',
      format: 'json',
      downloadUrl: `/api/data-portability/${dataSubjectId}/download`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 dias
    }

    await this.logAuditEvent({
      userId: 'system',
      userName: 'Sistema',
      action: 'data_portability_request',
      resource: 'personal_data',
      resourceId: dataSubjectId,
      details: { action: 'portability', dataSubjectId },
      ipAddress: '127.0.0.1',
      userAgent: 'MILAPP-System',
      severity: 'medium',
      category: 'data',
      compliance: { lgpd: true, iso27001: true, sox: false, pci: false },
      metadata: { result }
    })

    return result
  }

  /**
   * Gerar relatório de compliance
   */
  async generateComplianceReport(framework?: string, format: 'pdf' | 'csv' | 'json' = 'pdf'): Promise<any> {
    try {
      const auditResults = await this.runComplianceAudit()
      const violations = await this.getComplianceViolations(framework)
      const recentEvents = await this.getAuditEvents({}, 1000)

      const report = {
        generatedAt: new Date().toISOString(),
        framework: framework || 'all',
        auditResults,
        violations: violations.length,
        recentEvents: recentEvents.length,
        complianceScore: auditResults.overall.score,
        recommendations: this.generateRecommendations(auditResults, violations)
      }

      // Salvar relatório
      await supabase
        .from('relatorios_compliance')
        .insert({
          framework: report.framework,
          data_geracao: report.generatedAt,
          score_compliance: report.complianceScore,
          total_violacoes: report.violations,
          total_eventos: report.recentEvents,
          relatorio: report,
          formato: format
        })

      return report
    } catch (error) {
      console.error('❌ Erro ao gerar relatório de compliance:', error)
      throw error
    }
  }

  /**
   * Gerar recomendações baseadas nos resultados
   */
  private generateRecommendations(auditResults: any, violations: any[]): string[] {
    const recommendations: string[] = []

    if (auditResults.overall.score < 90) {
      recommendations.push('Implementar controles de compliance adicionais')
    }

    if (auditResults.lgpd.score < 95) {
      recommendations.push('Revisar processos de proteção de dados pessoais')
    }

    if (auditResults.iso27001.score < 90) {
      recommendations.push('Fortalecer controles de segurança da informação')
    }

    if (violations.length > 10) {
      recommendations.push('Priorizar correção de violações críticas')
    }

    return recommendations
  }
}

// Exportar instância singleton
export const complianceAuditService = ComplianceAuditService.getInstance() 