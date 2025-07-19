import * as microsoftTeams from '@microsoft/teams-js'

export interface TeamsMessage {
  title: string
  text: string
  summary?: string
  themeColor?: string
  sections?: TeamsMessageSection[]
  potentialAction?: TeamsAction[]
}

export interface TeamsMessageSection {
  activityTitle?: string
  activitySubtitle?: string
  activityText?: string
  activityImage?: string
  facts?: Array<{ name: string; value: string }>
  markdown?: boolean
}

export interface TeamsAction {
  '@type': string
  name: string
  target?: string
}

export class TeamsIntegrationService {
  private static instance: TeamsIntegrationService
  private isInitialized = false
  private teamsContext: microsoftTeams.Context | null = null

  static getInstance(): TeamsIntegrationService {
    if (!this.instance) {
      this.instance = new TeamsIntegrationService()
    }
    return this.instance
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await microsoftTeams.initialize()
      this.isInitialized = true
      console.log('🏥 Microsoft Teams MedSênior inicializado')
      
      // Obter contexto do Teams
      microsoftTeams.getContext((context) => {
        this.teamsContext = context
        console.log('📱 Contexto Teams obtido:', context)
      })
      
    } catch (error) {
      console.error('❌ Erro ao inicializar Teams:', error)
    }
  }

  // Enviar mensagem para canal do Teams
  async sendMessageToChannel(channelId: string, message: TeamsMessage): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      const webhookUrl = import.meta.env.VITE_TEAMS_WEBHOOK_URL
      if (!webhookUrl) {
        throw new Error('Webhook URL do Teams não configurada')
      }

      const teamsMessage = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: message.themeColor || '#327746', // Verde MedSênior
        title: message.title,
        text: message.text,
        summary: message.summary,
        sections: message.sections || [],
        potentialAction: message.potentialAction || []
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamsMessage)
      })

      if (!response.ok) {
        throw new Error(`Erro ao enviar mensagem Teams: ${response.status}`)
      }

      console.log('✅ Mensagem enviada para Teams:', message.title)
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem Teams:', error)
      throw error
    }
  }

  // Notificar aprovação de Quality Gate
  async notifyQualityGateApproval(projectName: string, gate: string, approver: string): Promise<void> {
    const message: TeamsMessage = {
      title: `🎉 Quality Gate ${gate} Aprovado!`,
      text: `O projeto **${projectName}** passou pelo gate ${gate} com sucesso.`,
      summary: `Quality Gate ${gate} aprovado para ${projectName}`,
      themeColor: '#327746',
      sections: [
        {
          activityTitle: 'Detalhes da Aprovação',
          activitySubtitle: `Gate ${gate} - ${projectName}`,
          facts: [
            { name: 'Projeto', value: projectName },
            { name: 'Quality Gate', value: gate },
            { name: 'Aprovador', value: approver },
            { name: 'Data', value: new Date().toLocaleDateString('pt-BR') },
            { name: 'Status', value: '✅ Aprovado' }
          ],
          markdown: true
        }
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'Ver Projeto',
          target: `${window.location.origin}/projects`
        }
      ]
    }

    await this.sendMessageToChannel('quality-gates', message)
  }

  // Notificar rejeição de Quality Gate
  async notifyQualityGateRejection(projectName: string, gate: string, reason: string, reviewer: string): Promise<void> {
    const message: TeamsMessage = {
      title: `⚠️ Quality Gate ${gate} Rejeitado`,
      text: `O projeto **${projectName}** não passou no gate ${gate}.`,
      summary: `Quality Gate ${gate} rejeitado para ${projectName}`,
      themeColor: '#dc3545',
      sections: [
        {
          activityTitle: 'Detalhes da Rejeição',
          activitySubtitle: `Gate ${gate} - ${projectName}`,
          facts: [
            { name: 'Projeto', value: projectName },
            { name: 'Quality Gate', value: gate },
            { name: 'Revisor', value: reviewer },
            { name: 'Data', value: new Date().toLocaleDateString('pt-BR') },
            { name: 'Status', value: '❌ Rejeitado' },
            { name: 'Motivo', value: reason }
          ],
          markdown: true
        }
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'Revisar Projeto',
          target: `${window.location.origin}/projects`
        }
      ]
    }

    await this.sendMessageToChannel('quality-gates', message)
  }

  // Notificar deployment de automação
  async notifyAutomationDeployed(automationName: string, environment: string, deployer: string): Promise<void> {
    const message: TeamsMessage = {
      title: '🚀 Automação em Produção!',
      text: `A automação **${automationName}** foi implantada com sucesso em ${environment}.`,
      summary: `Deployment: ${automationName} em ${environment}`,
      themeColor: '#28a745',
      sections: [
        {
          activityTitle: 'Detalhes do Deployment',
          activitySubtitle: `${automationName} - ${environment}`,
          facts: [
            { name: 'Automação', value: automationName },
            { name: 'Ambiente', value: environment },
            { name: 'Responsável', value: deployer },
            { name: 'Data', value: new Date().toLocaleDateString('pt-BR') },
            { name: 'Hora', value: new Date().toLocaleTimeString('pt-BR') },
            { name: 'Status', value: '✅ Implantado' }
          ],
          markdown: true
        }
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'Monitorar Automação',
          target: `${window.location.origin}/deployments`
        }
      ]
    }

    await this.sendMessageToChannel('deployments', message)
  }

  // Notificar atualização de ROI
  async notifyROIUpdate(projectName: string, newROI: number, previousROI: number): Promise<void> {
    const change = newROI - previousROI
    const emoji = change >= 0 ? '📈' : '📉'
    const trend = change >= 0 ? 'aumentou' : 'diminuiu'
    
    const message: TeamsMessage = {
      title: `${emoji} ROI Atualizado - ${projectName}`,
      text: `O ROI do projeto **${projectName}** ${trend} de ${previousROI}% para ${newROI}%.`,
      summary: `ROI ${trend} para ${projectName}`,
      themeColor: change >= 0 ? '#28a745' : '#dc3545',
      sections: [
        {
          activityTitle: 'Métricas de ROI',
          activitySubtitle: projectName,
          facts: [
            { name: 'Projeto', value: projectName },
            { name: 'ROI Anterior', value: `${previousROI}%` },
            { name: 'ROI Atual', value: `${newROI}%` },
            { name: 'Variação', value: `${change >= 0 ? '+' : ''}${change}%` },
            { name: 'Data', value: new Date().toLocaleDateString('pt-BR') },
            { name: 'Tendência', value: change >= 0 ? '📈 Positiva' : '📉 Negativa' }
          ],
          markdown: true
        }
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'Ver Analytics',
          target: `${window.location.origin}/dashboard`
        }
      ]
    }

    await this.sendMessageToChannel('analytics', message)
  }

  // Notificar conclusão de discovery
  async notifyDiscoveryCompleted(processName: string, insights: number, analyst: string): Promise<void> {
    const message: TeamsMessage = {
      title: '🤖 Discovery IA Concluído!',
      text: `A análise inteligente do processo **${processName}** foi concluída com ${insights} insights descobertos.`,
      summary: `Discovery concluído: ${processName}`,
      themeColor: '#17a2b8',
      sections: [
        {
          activityTitle: 'Resultados do Discovery',
          activitySubtitle: processName,
          facts: [
            { name: 'Processo', value: processName },
            { name: 'Insights Encontrados', value: insights.toString() },
            { name: 'Analista', value: analyst },
            { name: 'Data', value: new Date().toLocaleDateString('pt-BR') },
            { name: 'Status', value: '✅ Concluído' }
          ],
          markdown: true
        }
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'Ver Insights',
          target: `${window.location.origin}/discovery`
        }
      ]
    }

    await this.sendMessageToChannel('discovery', message)
  }

  // Notificar erro crítico
  async notifyCriticalError(error: string, context: string, severity: 'low' | 'medium' | 'high' | 'critical'): Promise<void> {
    const severityColors = {
      low: '#ffc107',
      medium: '#fd7e14',
      high: '#dc3545',
      critical: '#721c24'
    }

    const severityEmojis = {
      low: '⚠️',
      medium: '🚨',
      high: '🔥',
      critical: '💥'
    }

    const message: TeamsMessage = {
      title: `${severityEmojis[severity]} Erro Crítico - ${context}`,
      text: `**Erro detectado:** ${error}`,
      summary: `Erro ${severity} em ${context}`,
      themeColor: severityColors[severity],
      sections: [
        {
          activityTitle: 'Detalhes do Erro',
          activitySubtitle: context,
          facts: [
            { name: 'Contexto', value: context },
            { name: 'Severidade', value: severity.toUpperCase() },
            { name: 'Data', value: new Date().toLocaleDateString('pt-BR') },
            { name: 'Hora', value: new Date().toLocaleTimeString('pt-BR') },
            { name: 'Erro', value: error }
          ],
          markdown: true
        }
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'Ver Logs',
          target: `${window.location.origin}/admin/logs`
        }
      ]
    }

    await this.sendMessageToChannel('alerts', message)
  }

  // Notificar manutenção programada
  async notifyMaintenanceScheduled(scheduledTime: string, duration: string, affectedServices: string[]): Promise<void> {
    const message: TeamsMessage = {
      title: '🔧 Manutenção Programada',
      text: `Manutenção programada para **${scheduledTime}** com duração estimada de **${duration}**.`,
      summary: `Manutenção: ${scheduledTime}`,
      themeColor: '#6f42c1',
      sections: [
        {
          activityTitle: 'Detalhes da Manutenção',
          activitySubtitle: 'Sistema MedSênior',
          facts: [
            { name: 'Data/Hora', value: scheduledTime },
            { name: 'Duração', value: duration },
            { name: 'Serviços Afetados', value: affectedServices.join(', ') },
            { name: 'Status', value: '🔄 Programado' }
          ],
          markdown: true
        }
      ],
      potentialAction: [
        {
          '@type': 'OpenUri',
          name: 'Ver Status',
          target: `${window.location.origin}/status`
        }
      ]
    }

    await this.sendMessageToChannel('maintenance', message)
  }

  // Obter contexto do Teams
  getTeamsContext(): microsoftTeams.Context | null {
    return this.teamsContext
  }

  // Verificar se está rodando no Teams
  isRunningInTeams(): boolean {
    return this.isInitialized && this.teamsContext !== null
  }

  // Compartilhar dados no Teams
  async shareData(data: any, title: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      await microsoftTeams.shareDeepLink({
        subEntityId: 'milapp-data',
        subEntityLabel: title,
        subEntityWebUrl: window.location.href
      })
      
      console.log('✅ Dados compartilhados no Teams:', title)
    } catch (error) {
      console.error('❌ Erro ao compartilhar no Teams:', error)
    }
  }

  // Abrir diálogo do Teams
  async openDialog(url: string, title: string, size: { width: number; height: number }): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      await microsoftTeams.dialog.open({
        url: url,
        title: title,
        size: size
      })
      
      console.log('✅ Diálogo Teams aberto:', title)
    } catch (error) {
      console.error('❌ Erro ao abrir diálogo Teams:', error)
    }
  }
} 