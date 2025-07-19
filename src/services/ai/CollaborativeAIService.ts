import { supabase } from '../supabase/client'

export interface AIAgent {
  id: string
  name: string
  role: string
  description: string
  personality: string
  system_prompt: string
  model_name: string
  temperature: number
  max_tokens: number
  avatar_url?: string
  expertise_areas: string[]
  communication_style: string
}

export interface DiscussionRequest {
  projectId: string
  topic: string
  userInput: string
  agent1Id: string
  agent2Id: string
  discussionType: string
}

export interface DiscussionRound {
  round: number
  agent1Response?: string
  agent2Response?: string
  agent1Rebuttal?: string
  agent2Rebuttal?: string
  finalConsensus?: string
}

export interface DiscussionResult {
  id: string
  topic: string
  status: string
  currentRound: number
  maxRounds: number
  agents: {
    agent1: { name: string; role: string; avatar?: string }
    agent2: { name: string; role: string; avatar?: string }
  }
  discussion: {
    round1: { agent1Response: string; agent2Response: string }
    round2: { agent1Rebuttal: string; agent2Rebuttal: string }
    finalConsensus: string
  }
  analysis: {
    agreementPoints: string[]
    disagreementPoints: string[]
    recommendations: string[]
    riskLevel: string
    feasibilityScore: number
  }
  metadata: {
    createdAt: string
    completedAt?: string
    totalTokensUsed: number
    processingTimeMs: number
  }
}

export class CollaborativeAIService {
  private static instance: CollaborativeAIService

  private constructor() {}

  static getInstance(): CollaborativeAIService {
    if (!CollaborativeAIService.instance) {
      CollaborativeAIService.instance = new CollaborativeAIService()
    }
    return CollaborativeAIService.instance
  }

  /**
   * Obter todos os agentes IA ativos
   */
  async getAgents(): Promise<AIAgent[]> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error('❌ Erro ao obter agentes IA:', error)
      throw new Error('Erro ao carregar agentes IA')
    }
  }

  /**
   * Obter agente por ID
   */
  async getAgent(agentId: string): Promise<AIAgent | null> {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', agentId)
        .eq('is_active', true)
        .single()

      if (error) throw error

      return data
    } catch (error) {
      console.error('❌ Erro ao obter agente:', error)
      return null
    }
  }

  /**
   * Iniciar novo debate
   */
  async startDiscussion(request: DiscussionRequest): Promise<{ discussionId: string; agents: any }> {
    try {
      const { data, error } = await supabase.rpc('start_ai_discussion', {
        p_project_id: request.projectId,
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_topic: request.topic,
        p_user_input: request.userInput,
        p_agent_1_id: request.agent1Id,
        p_agent_2_id: request.agent2Id,
        p_discussion_type: request.discussionType
      })

      if (error) throw error

      return {
        discussionId: data.discussion_id,
        agents: {
          agent1: data.agent_1,
          agent2: data.agent_2
        }
      }
    } catch (error) {
      console.error('❌ Erro ao iniciar debate:', error)
      throw new Error('Erro ao iniciar debate IA')
    }
  }

  /**
   * Executar próximo round do debate
   */
  async executeNextRound(discussionId: string): Promise<DiscussionRound> {
    try {
      const { data, error } = await supabase.rpc('execute_ai_discussion_round', {
        p_discussion_id: discussionId
      })

      if (error) throw error

      return {
        round: data.round,
        agent1Response: data.agent_1_response,
        agent2Response: data.agent_2_response,
        agent1Rebuttal: data.agent_1_rebuttal,
        agent2Rebuttal: data.agent_2_rebuttal,
        finalConsensus: data.final_consensus
      }
    } catch (error) {
      console.error('❌ Erro ao executar round:', error)
      throw new Error('Erro ao executar round do debate')
    }
  }

  /**
   * Obter resultado completo do debate
   */
  async getDiscussionResult(discussionId: string): Promise<DiscussionResult | null> {
    try {
      const { data, error } = await supabase.rpc('get_ai_discussion_result', {
        p_discussion_id: discussionId
      })

      if (error) throw error

      if (!data) return null

      return {
        id: data.discussion_id,
        topic: data.topic,
        status: data.status,
        currentRound: data.current_round || 1,
        maxRounds: data.max_rounds || 3,
        agents: {
          agent1: {
            name: data.agents.agent_1.name,
            role: data.agents.agent_1.role,
            avatar: data.agents.agent_1.avatar
          },
          agent2: {
            name: data.agents.agent_2.name,
            role: data.agents.agent_2.role,
            avatar: data.agents.agent_2.avatar
          }
        },
        discussion: {
          round1: {
            agent1Response: data.discussion.round_1.agent_1_response,
            agent2Response: data.discussion.round_1.agent_2_response
          },
          round2: {
            agent1Rebuttal: data.discussion.round_2.agent_1_rebuttal,
            agent2Rebuttal: data.discussion.round_2.agent_2_rebuttal
          },
          finalConsensus: data.discussion.final_consensus
        },
        analysis: {
          agreementPoints: data.analysis.agreement_points || [],
          disagreementPoints: data.analysis.disagreement_points || [],
          recommendations: data.analysis.recommendations || [],
          riskLevel: data.analysis.risk_level || 'medium',
          feasibilityScore: data.analysis.feasibility_score || 0
        },
        metadata: {
          createdAt: data.metadata.created_at,
          completedAt: data.metadata.completed_at,
          totalTokensUsed: data.metadata.total_tokens_used || 0,
          processingTimeMs: data.metadata.processing_time_ms || 0
        }
      }
    } catch (error) {
      console.error('❌ Erro ao obter resultado do debate:', error)
      return null
    }
  }

  /**
   * Obter debates recentes
   */
  async getRecentDiscussions(limit: number = 10): Promise<DiscussionResult[]> {
    try {
      const { data, error } = await supabase
        .from('recent_ai_discussions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return (data || []).map(discussion => ({
        id: discussion.id,
        topic: discussion.topic,
        status: discussion.status,
        currentRound: 1,
        maxRounds: 3,
        agents: {
          agent1: {
            name: discussion.agent_1_name,
            role: discussion.agent_1_role
          },
          agent2: {
            name: discussion.agent_2_name,
            role: discussion.agent_2_role
          }
        },
        discussion: {
          round1: { agent1Response: '', agent2Response: '' },
          round2: { agent1Rebuttal: '', agent2Rebuttal: '' },
          finalConsensus: ''
        },
        analysis: {
          agreementPoints: [],
          disagreementPoints: [],
          recommendations: [],
          riskLevel: discussion.risk_level || 'medium',
          feasibilityScore: discussion.feasibility_score || 0
        },
        metadata: {
          createdAt: discussion.created_at,
          totalTokensUsed: 0,
          processingTimeMs: 0
        }
      }))
    } catch (error) {
      console.error('❌ Erro ao obter debates recentes:', error)
      return []
    }
  }

  /**
   * Obter estatísticas de debates
   */
  async getDiscussionStatistics(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('ai_discussion_statistics')
        .select('*')
        .single()

      if (error) throw error

      return data || {}
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error)
      return {}
    }
  }

  /**
   * Simular resposta de IA (em produção, chamar API real)
   */
  async simulateAIResponse(
    agent: AIAgent,
    prompt: string,
    context?: string
  ): Promise<string> {
    try {
      // Simular delay de processamento
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))

      // Simular resposta baseada no papel do agente
      let response = ''
      
      switch (agent.role) {
        case 'architect':
          response = `Como ${agent.name}, arquiteto de soluções, analiso a proposta: "${prompt}".

**Análise Técnica:**
- Arquitetura recomendada: Solução modular com microserviços
- Tecnologias sugeridas: Supabase, React, Node.js
- Escalabilidade: Horizontal com load balancing
- Segurança: Implementar autenticação JWT + 2FA

**Recomendações:**
1. Implementar cache Redis para performance
2. Usar filas assíncronas para processamento pesado
3. Monitoramento com Prometheus + Grafana
4. CI/CD com GitHub Actions

**Cronograma estimado:** 6-8 semanas
**Complexidade:** Média-Alta`
          break

        case 'critic':
          response = `Como ${agent.name}, analista crítica, reviso a proposta do arquiteto.

**Pontos de Atenção:**
⚠️ **Riscos Identificados:**
- Complexidade excessiva para MVP
- Custos de infraestrutura podem ser altos
- Necessidade de equipe especializada

**Validações Necessárias:**
- Compliance com LGPD
- Auditoria de segurança
- Análise de custo-benefício

**Sugestões de Melhoria:**
1. Começar com POC simplificado
2. Validar demanda antes de escalar
3. Implementar gradualmente
4. Documentar processos claramente

**Recomendação:** Aprovar com ajustes`
          break

        case 'security_expert':
          response = `Como ${agent.name}, especialista em segurança, avalio os riscos:

**Análise de Segurança:**
🔒 **Pontos Críticos:**
- Autenticação e autorização robustas
- Criptografia de dados sensíveis
- Logs de auditoria completos
- Backup e recuperação

**Compliance:**
- LGPD: Implementar consentimento explícito
- ISO 27001: Mapear controles necessários
- SOC 2: Preparar para certificação

**Recomendações de Segurança:**
1. Implementar WAF
2. Monitoramento de ameaças 24/7
3. Testes de penetração regulares
4. Treinamento de equipe`
          break

        case 'cost_optimizer':
          response = `Como ${agent.name}, especialista em custos, analiso o ROI:

**Análise de Custos:**
💰 **Estimativas:**
- Desenvolvimento: R$ 150.000 - R$ 250.000
- Infraestrutura mensal: R$ 5.000 - R$ 15.000
- Manutenção: R$ 20.000/mês

**Otimizações Sugeridas:**
1. Usar serverless onde possível
2. Implementar cache inteligente
3. Otimizar consultas de banco
4. Considerar open source

**ROI Projetado:**
- Retorno em 12-18 meses
- Economia anual: R$ 500.000
- ROI: 200-300%`
          break

        default:
          response = `Como ${agent.name}, analiso a proposta: "${prompt}".

Baseado na minha expertise em ${agent.role}, recomendo uma abordagem equilibrada considerando aspectos técnicos, de segurança e custos.`
      }

      return response
    } catch (error) {
      console.error('❌ Erro ao simular resposta IA:', error)
      return 'Erro ao processar resposta da IA'
    }
  }

  /**
   * Gerar consenso final entre agentes
   */
  async generateFinalConsensus(
    discussionId: string,
    agent1Response: string,
    agent2Response: string
  ): Promise<{
    consensus: string
    agreementPoints: string[]
    disagreementPoints: string[]
    recommendations: string[]
    riskLevel: string
    feasibilityScore: number
  }> {
    try {
      // Simular geração de consenso
      const consensus = `## 🧠 Análise Técnica Conjunta

Após nossa discussão detalhada, chegamos ao seguinte consenso:

### ✅ Pontos de Concordância
- A solução proposta é tecnicamente viável
- O uso de tecnologias modernas é apropriado
- A arquitetura modular permite escalabilidade

### ⚠️ Pontos de Ajuste
- Implementar gradualmente, começando com MVP
- Validar compliance com LGPD antes do lançamento
- Considerar custos de infraestrutura na fase inicial

### 🧩 Recomendações Finais
1. Desenvolver POC em 4 semanas
2. Validar com usuários piloto
3. Implementar monitoramento desde o início
4. Documentar processos e decisões

### 🧾 Conclusão
**Projeto aprovado** com as recomendações acima. Viabilidade técnica confirmada com baixo risco.`

      const agreementPoints = [
        'Solução tecnicamente viável',
        'Uso de tecnologias apropriadas',
        'Arquitetura modular e escalável'
      ]

      const disagreementPoints = [
        'Velocidade de implementação',
        'Custos iniciais vs benefícios',
        'Complexidade da solução'
      ]

      const recommendations = [
        'Desenvolver POC em 4 semanas',
        'Validar com usuários piloto',
        'Implementar monitoramento desde o início',
        'Documentar processos e decisões'
      ]

      return {
        consensus,
        agreementPoints,
        disagreementPoints,
        recommendations,
        riskLevel: 'low',
        feasibilityScore: 85
      }
    } catch (error) {
      console.error('❌ Erro ao gerar consenso:', error)
      throw new Error('Erro ao gerar consenso final')
    }
  }

  /**
   * Obter configurações de IA do projeto
   */
  async getProjectAISettings(projectId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('project_ai_settings')
        .select('*')
        .eq('project_id', projectId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return data || {
        enable_ai_collaboration: true,
        enable_ai_validation: true,
        enable_ai_suggestions: true,
        max_discussion_rounds: 3,
        auto_approve_threshold: 80,
        require_human_approval: true
      }
    } catch (error) {
      console.error('❌ Erro ao obter configurações IA:', error)
      return null
    }
  }

  /**
   * Atualizar configurações de IA do projeto
   */
  async updateProjectAISettings(projectId: string, settings: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('project_ai_settings')
        .upsert({
          project_id: projectId,
          ...settings,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      return true
    } catch (error) {
      console.error('❌ Erro ao atualizar configurações IA:', error)
      return false
    }
  }

  /**
   * Exportar debate como markdown
   */
  generateMarkdownReport(discussion: DiscussionResult): string {
    const content = `# Análise Técnica Colaborativa - ${discussion.topic}

## Agentes Participantes
- **${discussion.agents.agent1.name}** (${discussion.agents.agent1.role})
- **${discussion.agents.agent2.name}** (${discussion.agents.agent2.role})

## Debate

### Round 1

**${discussion.agents.agent1.name}:**
${discussion.discussion.round1.agent1Response}

**${discussion.agents.agent2.name}:**
${discussion.discussion.round1.agent2Response}

### Round 2

**${discussion.agents.agent1.name}:**
${discussion.discussion.round2.agent1Rebuttal}

**${discussion.agents.agent2.name}:**
${discussion.discussion.round2.agent2Rebuttal}

## Análise Final

### ✅ Pontos de Concordância
${discussion.analysis.agreementPoints.map(point => `- ${point}`).join('\n')}

### ⚠️ Pontos de Divergência
${discussion.analysis.disagreementPoints.map(point => `- ${point}`).join('\n')}

### 🧩 Recomendações
${discussion.analysis.recommendations.map(rec => `- ${rec}`).join('\n')}

### 🧾 Conclusão
**Nível de Risco:** ${discussion.analysis.riskLevel}
**Viabilidade:** ${discussion.analysis.feasibilityScore}%

${discussion.discussion.finalConsensus}

---
*Gerado em: ${new Date(discussion.metadata.createdAt).toLocaleString()}*
*Tempo de processamento: ${discussion.metadata.processingTimeMs}ms*
*Tokens utilizados: ${discussion.metadata.totalTokensUsed}*`

    return content
  }

  /**
   * Download do relatório
   */
  downloadReport(discussion: DiscussionResult): void {
    const content = this.generateMarkdownReport(discussion)
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debate-ia-${discussion.topic.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

// Exportar instância singleton
export const collaborativeAIService = CollaborativeAIService.getInstance() 