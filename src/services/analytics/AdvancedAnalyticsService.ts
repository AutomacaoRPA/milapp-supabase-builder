import { PolynomialRegression } from 'ml-regression'
import { Matrix } from 'ml-matrix'

export interface ProjectData {
  id: string
  name: string
  complexity: number
  duration: number
  actualROI: number
  estimatedROI: number
  teamSize: number
  budget: number
  status: string
  qualityGatesPassed: number
  totalQualityGates: number
  startDate: Date
  completionDate?: Date
}

export interface ROIPrediction {
  nextQuarterROI: number
  confidence: number
  recommendation: string
  factors: Array<{ name: string; weight: number; impact: 'positive' | 'negative' }>
  trend: 'increasing' | 'decreasing' | 'stable'
}

export interface UserFeedback {
  id: string
  userId: string
  text: string
  rating: number
  category: string
  timestamp: Date
}

export interface SentimentAnalysis {
  overall: number // -1 a 1
  trends: Array<{ period: string; score: number }>
  insights: string[]
  categories: Array<{ name: string; score: number; count: number }>
}

export interface MetricData {
  name: string
  value: number
  expectedRange: { min: number; max: number }
  timestamp: Date
  category: string
}

export interface AnomalyReport {
  anomalies: Array<{
    metric: string
    value: number
    expectedRange: { min: number; max: number }
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    recommendation: string
    confidence: number
  }>
  timestamp: Date
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  summary: string
}

export interface PerformanceInsight {
  type: 'trend' | 'anomaly' | 'correlation' | 'prediction'
  title: string
  description: string
  confidence: number
  impact: 'positive' | 'negative' | 'neutral'
  data: any
  recommendations: string[]
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export class MedSeniorAnalyticsService {
  private static instance: MedSeniorAnalyticsService
  private projectData: ProjectData[] = []
  private feedbackData: UserFeedback[] = []
  private metricsData: MetricData[] = []

  static getInstance(): MedSeniorAnalyticsService {
    if (!this.instance) {
      this.instance = new MedSeniorAnalyticsService()
    }
    return this.instance
  }

  // Carregar dados para análise
  async loadAnalyticsData(): Promise<void> {
    try {
      // Simular dados de projetos MedSênior
      this.projectData = [
        {
          id: '1',
          name: 'Automação de Faturamento',
          complexity: 8,
          duration: 60,
          actualROI: 52,
          estimatedROI: 45,
          teamSize: 4,
          budget: 50000,
          status: 'completed',
          qualityGatesPassed: 4,
          totalQualityGates: 4,
          startDate: new Date('2024-01-15'),
          completionDate: new Date('2024-03-15')
        },
        {
          id: '2',
          name: 'Processamento de Notas Fiscais',
          complexity: 6,
          duration: 45,
          actualROI: 38,
          estimatedROI: 35,
          teamSize: 3,
          budget: 35000,
          status: 'completed',
          qualityGatesPassed: 4,
          totalQualityGates: 4,
          startDate: new Date('2024-02-01'),
          completionDate: new Date('2024-03-15')
        },
        {
          id: '3',
          name: 'Gestão de Estoque',
          complexity: 7,
          duration: 75,
          actualROI: 42,
          estimatedROI: 40,
          teamSize: 5,
          budget: 45000,
          status: 'completed',
          qualityGatesPassed: 4,
          totalQualityGates: 4,
          startDate: new Date('2024-03-01'),
          completionDate: new Date('2024-05-15')
        }
      ]

      // Simular feedback de usuários
      this.feedbackData = [
        {
          id: '1',
          userId: 'user1',
          text: 'Excelente ferramenta! Facilitou muito nosso trabalho de automação.',
          rating: 5,
          category: 'usability',
          timestamp: new Date('2024-06-01')
        },
        {
          id: '2',
          userId: 'user2',
          text: 'Interface poderia ser mais intuitiva, mas funcionalidades são boas.',
          rating: 4,
          category: 'usability',
          timestamp: new Date('2024-06-05')
        },
        {
          id: '3',
          userId: 'user3',
          text: 'Muito lento para carregar os relatórios, precisa de otimização.',
          rating: 2,
          category: 'performance',
          timestamp: new Date('2024-06-10')
        }
      ]

      // Simular métricas de performance
      this.metricsData = [
        {
          name: 'Page Load Time',
          value: 2.5,
          expectedRange: { min: 1, max: 3 },
          timestamp: new Date(),
          category: 'performance'
        },
        {
          name: 'API Response Time',
          value: 800,
          expectedRange: { min: 200, max: 1000 },
          timestamp: new Date(),
          category: 'performance'
        },
        {
          name: 'User Satisfaction',
          value: 4.2,
          expectedRange: { min: 3.5, max: 5 },
          timestamp: new Date(),
          category: 'satisfaction'
        }
      ]

      console.log('📊 Dados de analytics carregados:', {
        projects: this.projectData.length,
        feedback: this.feedbackData.length,
        metrics: this.metricsData.length
      })
    } catch (error) {
      console.error('❌ Erro ao carregar dados de analytics:', error)
    }
  }

  // Análise preditiva de ROI
  async predictROITrend(projectData: ProjectData[] = this.projectData): Promise<ROIPrediction> {
    try {
      const historicalData = projectData
        .filter(p => p.actualROI && p.status === 'completed')
        .map(p => ({
          complexity: p.complexity,
          duration: p.duration,
          teamSize: p.teamSize,
          budget: p.budget / 10000, // Normalizar
          roi: p.actualROI
        }))

      if (historicalData.length < 3) {
        throw new Error('Dados insuficientes para predição')
      }

      // Features para regressão
      const X = historicalData.map(d => [
        d.complexity,
        d.duration,
        d.teamSize,
        d.budget
      ])

      const y = historicalData.map(d => d.roi)

      // Treinar modelo de regressão polinomial
      const regression = new PolynomialRegression(X, y, 2)
      regression.train()

      // Calcular confiança
      const predictions = X.map(x => regression.predict(x))
      const confidence = this.calculatePredictionConfidence(y, predictions)

      // Predizer próximo trimestre
      const avgComplexity = historicalData.reduce((sum, d) => sum + d.complexity, 0) / historicalData.length
      const avgDuration = historicalData.reduce((sum, d) => sum + d.duration, 0) / historicalData.length
      const avgTeamSize = historicalData.reduce((sum, d) => sum + d.teamSize, 0) / historicalData.length
      const avgBudget = historicalData.reduce((sum, d) => sum + d.budget, 0) / historicalData.length

      const nextQuarterFeatures = [avgComplexity, avgDuration, avgTeamSize, avgBudget]
      const nextQuarterROI = regression.predict(nextQuarterFeatures)

      // Calcular fatores de impacto
      const factors = [
        { name: 'Complexidade', weight: avgComplexity / 10, impact: avgComplexity > 7 ? 'negative' : 'positive' as const },
        { name: 'Duração', weight: avgDuration / 100, impact: avgDuration > 60 ? 'negative' : 'positive' as const },
        { name: 'Tamanho da Equipe', weight: avgTeamSize / 10, impact: avgTeamSize > 5 ? 'negative' : 'positive' as const },
        { name: 'Orçamento', weight: avgBudget / 10, impact: avgBudget > 5 ? 'negative' : 'positive' as const }
      ]

      // Determinar tendência
      const recentROI = historicalData.slice(-3).map(d => d.roi)
      const trend = this.calculateTrend(recentROI)

      // Gerar recomendação
      const recommendation = this.generateROIRecommendation({
        nextQuarterROI,
        confidence,
        factors,
        trend
      })

      return {
        nextQuarterROI: Math.max(0, Math.min(100, nextQuarterROI)),
        confidence,
        recommendation,
        factors,
        trend
      }
    } catch (error) {
      console.error('❌ Erro na predição de ROI:', error)
      throw error
    }
  }

  // Análise de sentimento dos usuários
  async analyzeUserSentiment(feedbacks: UserFeedback[] = this.feedbackData): Promise<SentimentAnalysis> {
    try {
      const sentimentScores = feedbacks.map(f => this.analyzeSentiment(f.text))
      const overall = this.calculateAverageSentiment(sentimentScores)

      // Calcular tendências por período
      const trends = this.calculateSentimentTrends(feedbacks, sentimentScores)

      // Análise por categoria
      const categories = this.analyzeSentimentByCategory(feedbacks, sentimentScores)

      // Gerar insights
      const insights = this.generateSentimentInsights(sentimentScores, categories)

      return {
        overall,
        trends,
        insights,
        categories
      }
    } catch (error) {
      console.error('❌ Erro na análise de sentimento:', error)
      throw error
    }
  }

  // Detecção de anomalias
  detectAnomalies(metrics: MetricData[] = this.metricsData): AnomalyReport {
    try {
      const anomalies = []

      for (const metric of metrics) {
        if (this.isAnomaly(metric)) {
          const severity = this.calculateAnomalySeverity(metric)
          const recommendation = this.getAnomalyRecommendation(metric, severity)

          anomalies.push({
            metric: metric.name,
            value: metric.value,
            expectedRange: metric.expectedRange,
            severity,
            recommendation,
            confidence: this.calculateAnomalyConfidence(metric)
          })
        }
      }

      const riskLevel = this.calculateOverallRisk(anomalies)
      const summary = this.generateAnomalySummary(anomalies, riskLevel)

      return {
        anomalies,
        timestamp: new Date(),
        riskLevel,
        summary
      }
    } catch (error) {
      console.error('❌ Erro na detecção de anomalias:', error)
      throw error
    }
  }

  // Análise de correlação
  async analyzeCorrelations(): Promise<Array<{ variables: string[]; correlation: number; significance: string }>> {
    try {
      const correlations = []

      // Correlação entre complexidade e ROI
      const complexityROI = this.calculateCorrelation(
        this.projectData.map(p => p.complexity),
        this.projectData.map(p => p.actualROI)
      )

      if (Math.abs(complexityROI) > 0.3) {
        correlations.push({
          variables: ['Complexidade', 'ROI'],
          correlation: complexityROI,
          significance: Math.abs(complexityROI) > 0.7 ? 'Forte' : 'Moderada'
        })
      }

      // Correlação entre duração e ROI
      const durationROI = this.calculateCorrelation(
        this.projectData.map(p => p.duration),
        this.projectData.map(p => p.actualROI)
      )

      if (Math.abs(durationROI) > 0.3) {
        correlations.push({
          variables: ['Duração', 'ROI'],
          correlation: durationROI,
          significance: Math.abs(durationROI) > 0.7 ? 'Forte' : 'Moderada'
        })
      }

      return correlations
    } catch (error) {
      console.error('❌ Erro na análise de correlação:', error)
      throw error
    }
  }

  // Geração de insights automáticos
  async generateInsights(): Promise<PerformanceInsight[]> {
    try {
      await this.loadAnalyticsData()
      
      const insights: PerformanceInsight[] = []

      // Insight de tendência de ROI
      const roiPrediction = await this.predictROITrend()
      insights.push({
        type: 'prediction',
        title: 'Tendência de ROI',
        description: `ROI previsto para o próximo trimestre: ${roiPrediction.nextQuarterROI.toFixed(1)}%`,
        confidence: roiPrediction.confidence,
        impact: roiPrediction.trend === 'increasing' ? 'positive' : 'negative',
        data: roiPrediction,
        recommendations: [roiPrediction.recommendation],
        priority: roiPrediction.confidence > 0.8 ? 'HIGH' : 'MEDIUM'
      })

      // Insight de anomalias
      const anomalyReport = this.detectAnomalies()
      if (anomalyReport.anomalies.length > 0) {
        insights.push({
          type: 'anomaly',
          title: 'Anomalias Detectadas',
          description: `${anomalyReport.anomalies.length} anomalias detectadas no sistema`,
          confidence: 0.85,
          impact: 'negative',
          data: anomalyReport,
          recommendations: anomalyReport.anomalies.map(a => a.recommendation),
          priority: anomalyReport.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH'
        })
      }

      // Insight de sentimento
      const sentimentAnalysis = await this.analyzeUserSentiment()
      insights.push({
        type: 'trend',
        title: 'Análise de Sentimento',
        description: `Sentimento geral dos usuários: ${sentimentAnalysis.overall > 0 ? 'Positivo' : 'Negativo'}`,
        confidence: 0.75,
        impact: sentimentAnalysis.overall > 0.3 ? 'positive' : 'negative',
        data: sentimentAnalysis,
        recommendations: sentimentAnalysis.insights,
        priority: 'MEDIUM'
      })

      return insights
    } catch (error) {
      console.error('❌ Erro ao gerar insights:', error)
      throw error
    }
  }

  // Métodos privados de cálculo
  private calculatePredictionConfidence(actual: number[], predicted: number[]): number {
    const errors = actual.map((a, i) => Math.abs(a - predicted[i]))
    const meanError = errors.reduce((sum, error) => sum + error, 0) / errors.length
    const maxError = Math.max(...errors)
    
    return Math.max(0, Math.min(1, 1 - (meanError / maxError)))
  }

  private analyzeSentiment(text: string): number {
    const positiveWords = ['excelente', 'ótimo', 'bom', 'facilita', 'melhor', 'eficiente', 'rápido']
    const negativeWords = ['ruim', 'lento', 'difícil', 'problema', 'erro', 'falha', 'péssimo']
    
    const words = text.toLowerCase().split(/\s+/)
    let score = 0
    
    words.forEach(word => {
      if (positiveWords.includes(word)) score += 0.2
      if (negativeWords.includes(word)) score -= 0.2
    })
    
    return Math.max(-1, Math.min(1, score))
  }

  private calculateAverageSentiment(scores: number[]): number {
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  private calculateSentimentTrends(feedbacks: UserFeedback[], scores: number[]): Array<{ period: string; score: number }> {
    const trends = []
    const periods = ['Jan-Mar', 'Apr-Jun', 'Jul-Sep', 'Oct-Dec']
    
    // Simular tendências por período
    periods.forEach((period, index) => {
      trends.push({
        period,
        score: 0.3 + (index * 0.1) + (Math.random() * 0.2 - 0.1)
      })
    })
    
    return trends
  }

  private analyzeSentimentByCategory(feedbacks: UserFeedback[], scores: number[]): Array<{ name: string; score: number; count: number }> {
    const categories = new Map<string, { scores: number[]; count: number }>()
    
    feedbacks.forEach((feedback, index) => {
      const category = feedback.category
      if (!categories.has(category)) {
        categories.set(category, { scores: [], count: 0 })
      }
      
      const cat = categories.get(category)!
      cat.scores.push(scores[index])
      cat.count++
    })
    
    return Array.from(categories.entries()).map(([name, data]) => ({
      name,
      score: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length,
      count: data.count
    }))
  }

  private generateSentimentInsights(scores: number[], categories: Array<{ name: string; score: number; count: number }>): string[] {
    const insights: string[] = []
    
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
    
    if (avgScore > 0.5) {
      insights.push('Sentimento geral muito positivo - usuários satisfeitos')
    } else if (avgScore < -0.3) {
      insights.push('Sentimento negativo detectado - investigar problemas')
    }
    
    const worstCategory = categories.reduce((worst, current) => 
      current.score < worst.score ? current : worst
    )
    
    if (worstCategory.score < 0) {
      insights.push(`Categoria "${worstCategory.name}" precisa de atenção`)
    }
    
    return insights
  }

  private isAnomaly(metric: MetricData): boolean {
    return metric.value < metric.expectedRange.min || metric.value > metric.expectedRange.max
  }

  private calculateAnomalySeverity(metric: MetricData): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const deviation = Math.abs(metric.value - (metric.expectedRange.min + metric.expectedRange.max) / 2)
    const range = metric.expectedRange.max - metric.expectedRange.min
    
    const percentage = deviation / range
    
    if (percentage > 0.5) return 'CRITICAL'
    if (percentage > 0.3) return 'HIGH'
    if (percentage > 0.1) return 'MEDIUM'
    return 'LOW'
  }

  private getAnomalyRecommendation(metric: MetricData, severity: string): string {
    const recommendations = {
      'Page Load Time': 'Otimizar carregamento de páginas e assets',
      'API Response Time': 'Investigar gargalos na API e otimizar queries',
      'User Satisfaction': 'Coletar feedback detalhado e implementar melhorias',
      'ROI': 'Revisar metodologia de cálculo e fatores de impacto'
    }
    
    return recommendations[metric.name as keyof typeof recommendations] || 'Investigar causa raiz da anomalia'
  }

  private calculateAnomalyConfidence(metric: MetricData): number {
    // Simular confiança baseada na magnitude da anomalia
    const deviation = Math.abs(metric.value - (metric.expectedRange.min + metric.expectedRange.max) / 2)
    const range = metric.expectedRange.max - metric.expectedRange.min
    const percentage = deviation / range
    
    return Math.min(0.95, 0.5 + percentage)
  }

  private calculateOverallRisk(anomalies: any[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const severityScores = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }
    const totalScore = anomalies.reduce((sum, anomaly) => sum + severityScores[anomaly.severity], 0)
    
    if (totalScore === 0) return 'LOW'
    if (totalScore <= 3) return 'MEDIUM'
    if (totalScore <= 6) return 'HIGH'
    return 'CRITICAL'
  }

  private generateAnomalySummary(anomalies: any[], riskLevel: string): string {
    if (anomalies.length === 0) {
      return 'Nenhuma anomalia detectada - sistema operando normalmente'
    }
    
    return `${anomalies.length} anomalia(s) detectada(s) com risco ${riskLevel.toLowerCase()}`
  }

  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable'
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length
    
    const change = secondAvg - firstAvg
    
    if (change > 0.1) return 'increasing'
    if (change < -0.1) return 'decreasing'
    return 'stable'
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0
    
    const n = x.length
    const sumX = x.reduce((sum, val) => sum + val, 0)
    const sumY = y.reduce((sum, val) => sum + val, 0)
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0)
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0)
    
    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))
    
    return denominator === 0 ? 0 : numerator / denominator
  }

  private generateROIRecommendation(prediction: any): string {
    if (prediction.trend === 'increasing') {
      return 'ROI em tendência positiva - manter práticas atuais e expandir automações'
    } else if (prediction.trend === 'decreasing') {
      return 'ROI em declínio - revisar projetos e otimizar processos'
    } else {
      return 'ROI estável - considerar novos projetos para crescimento'
    }
  }
} 