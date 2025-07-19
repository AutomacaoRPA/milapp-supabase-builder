import { PolynomialRegression } from 'ml-regression'
import { Matrix } from 'ml-matrix'

export interface MLPrediction {
  type: 'roi' | 'completion_time' | 'success_rate' | 'resource_usage'
  value: number
  confidence: number
  factors: Array<{ name: string; weight: number }>
  timestamp: string
}

export interface ProjectMetrics {
  id: string
  name: string
  complexity: number
  estimated_roi: number
  actual_roi?: number
  start_date: string
  completion_date?: string
  duration_days?: number
  team_size: number
  budget: number
  status: string
  quality_gates_passed: number
  total_quality_gates: number
}

export interface MLInsight {
  type: 'trend' | 'anomaly' | 'correlation' | 'prediction'
  title: string
  description: string
  confidence: number
  data: any
  recommendations: string[]
}

export class MLAnalyticsService {
  private static instance: MLAnalyticsService
  private projectData: ProjectMetrics[] = []

  static getInstance(): MLAnalyticsService {
    if (!this.instance) {
      this.instance = new MLAnalyticsService()
    }
    return this.instance
  }

  // Carregar dados de projetos
  async loadProjectData(): Promise<void> {
    try {
      // Simular dados de projetos (em produção, viria do Supabase)
      this.projectData = [
        {
          id: '1',
          name: 'Automação de Faturamento',
          complexity: 8,
          estimated_roi: 45,
          actual_roi: 52,
          start_date: '2024-01-15',
          completion_date: '2024-03-15',
          duration_days: 60,
          team_size: 4,
          budget: 50000,
          status: 'completed',
          quality_gates_passed: 4,
          total_quality_gates: 4
        },
        {
          id: '2',
          name: 'Processamento de Notas Fiscais',
          complexity: 6,
          estimated_roi: 35,
          actual_roi: 38,
          start_date: '2024-02-01',
          completion_date: '2024-04-01',
          duration_days: 60,
          team_size: 3,
          budget: 35000,
          status: 'completed',
          quality_gates_passed: 4,
          total_quality_gates: 4
        },
        {
          id: '3',
          name: 'Gestão de Estoque',
          complexity: 7,
          estimated_roi: 40,
          actual_roi: 42,
          start_date: '2024-03-01',
          completion_date: '2024-05-01',
          duration_days: 61,
          team_size: 5,
          budget: 45000,
          status: 'completed',
          quality_gates_passed: 4,
          total_quality_gates: 4
        }
      ]

      console.log('📊 Dados de projetos carregados para ML:', this.projectData.length)
    } catch (error) {
      console.error('❌ Erro ao carregar dados para ML:', error)
    }
  }

  // Predizer ROI baseado em características do projeto
  async predictROI(projectFeatures: {
    complexity: number
    team_size: number
    budget: number
    estimated_duration: number
  }): Promise<MLPrediction> {
    try {
      // Preparar dados de treinamento
      const trainingData = this.projectData.filter(p => p.actual_roi !== undefined)
      
      if (trainingData.length < 3) {
        throw new Error('Dados insuficientes para predição')
      }

      // Features para treinamento
      const X = trainingData.map(p => [
        p.complexity,
        p.team_size,
        p.budget / 10000, // Normalizar budget
        p.duration_days || 60
      ])

      // Target (ROI real)
      const y = trainingData.map(p => p.actual_roi!)

      // Treinar modelo de regressão polinomial
      const regression = new PolynomialRegression(X, y, 2)
      regression.train()

      // Fazer predição
      const features = [
        projectFeatures.complexity,
        projectFeatures.team_size,
        projectFeatures.budget / 10000,
        projectFeatures.estimated_duration
      ]

      const predictedROI = regression.predict(features)
      const confidence = this.calculateConfidence(X, y, regression)

      // Calcular importância dos fatores
      const factors = [
        { name: 'Complexidade', weight: projectFeatures.complexity / 10 },
        { name: 'Tamanho da Equipe', weight: projectFeatures.team_size / 10 },
        { name: 'Orçamento', weight: (projectFeatures.budget / 100000) },
        { name: 'Duração', weight: projectFeatures.estimated_duration / 100 }
      ]

      return {
        type: 'roi',
        value: Math.max(0, Math.min(100, predictedROI)),
        confidence,
        factors,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Erro na predição de ROI:', error)
      throw error
    }
  }

  // Predizer tempo de conclusão
  async predictCompletionTime(projectFeatures: {
    complexity: number
    team_size: number
    budget: number
    estimated_roi: number
  }): Promise<MLPrediction> {
    try {
      const trainingData = this.projectData.filter(p => p.duration_days !== undefined)
      
      if (trainingData.length < 3) {
        throw new Error('Dados insuficientes para predição')
      }

      const X = trainingData.map(p => [
        p.complexity,
        p.team_size,
        p.budget / 10000,
        p.estimated_roi
      ])

      const y = trainingData.map(p => p.duration_days!)

      const regression = new PolynomialRegression(X, y, 2)
      regression.train()

      const features = [
        projectFeatures.complexity,
        projectFeatures.team_size,
        projectFeatures.budget / 10000,
        projectFeatures.estimated_roi
      ]

      const predictedDays = regression.predict(features)
      const confidence = this.calculateConfidence(X, y, regression)

      const factors = [
        { name: 'Complexidade', weight: projectFeatures.complexity / 10 },
        { name: 'Tamanho da Equipe', weight: projectFeatures.team_size / 10 },
        { name: 'Orçamento', weight: (projectFeatures.budget / 100000) },
        { name: 'ROI Estimado', weight: projectFeatures.estimated_roi / 100 }
      ]

      return {
        type: 'completion_time',
        value: Math.max(1, Math.round(predictedDays)),
        confidence,
        factors,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Erro na predição de tempo:', error)
      throw error
    }
  }

  // Predizer taxa de sucesso
  async predictSuccessRate(projectFeatures: {
    complexity: number
    team_size: number
    budget: number
    estimated_roi: number
  }): Promise<MLPrediction> {
    try {
      const trainingData = this.projectData.filter(p => p.quality_gates_passed !== undefined)
      
      if (trainingData.length < 3) {
        throw new Error('Dados insuficientes para predição')
      }

      const X = trainingData.map(p => [
        p.complexity,
        p.team_size,
        p.budget / 10000,
        p.estimated_roi
      ])

      // Taxa de sucesso baseada em quality gates
      const y = trainingData.map(p => (p.quality_gates_passed / p.total_quality_gates) * 100)

      const regression = new PolynomialRegression(X, y, 2)
      regression.train()

      const features = [
        projectFeatures.complexity,
        projectFeatures.team_size,
        projectFeatures.budget / 10000,
        projectFeatures.estimated_roi
      ]

      const predictedRate = regression.predict(features)
      const confidence = this.calculateConfidence(X, y, regression)

      const factors = [
        { name: 'Complexidade', weight: (10 - projectFeatures.complexity) / 10 },
        { name: 'Tamanho da Equipe', weight: projectFeatures.team_size / 10 },
        { name: 'Orçamento', weight: (projectFeatures.budget / 100000) },
        { name: 'ROI Estimado', weight: projectFeatures.estimated_roi / 100 }
      ]

      return {
        type: 'success_rate',
        value: Math.max(0, Math.min(100, predictedRate)),
        confidence,
        factors,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('❌ Erro na predição de sucesso:', error)
      throw error
    }
  }

  // Detectar anomalias nos dados
  async detectAnomalies(): Promise<MLInsight[]> {
    const insights: MLInsight[] = []

    try {
      // Análise de ROI vs Estimativa
      const roiDeviations = this.projectData
        .filter(p => p.actual_roi !== undefined)
        .map(p => ({
          project: p.name,
          deviation: Math.abs((p.actual_roi! - p.estimated_roi) / p.estimated_roi) * 100
        }))
        .filter(d => d.deviation > 20) // Mais de 20% de desvio

      if (roiDeviations.length > 0) {
        insights.push({
          type: 'anomaly',
          title: 'Desvios Significativos de ROI',
          description: `${roiDeviations.length} projetos apresentaram desvios superiores a 20% entre ROI estimado e real.`,
          confidence: 0.85,
          data: roiDeviations,
          recommendations: [
            'Revisar metodologia de estimativa de ROI',
            'Implementar feedback loop para melhorar previsões',
            'Analisar fatores que causaram desvios'
          ]
        })
      }

      // Análise de complexidade vs tempo
      const complexityTimeCorrelation = this.calculateCorrelation(
        this.projectData.map(p => p.complexity),
        this.projectData.map(p => p.duration_days || 60)
      )

      if (complexityTimeCorrelation > 0.8) {
        insights.push({
          type: 'correlation',
          title: 'Alta Correlação: Complexidade vs Tempo',
          description: `Correlação de ${(complexityTimeCorrelation * 100).toFixed(1)}% entre complexidade e tempo de conclusão.`,
          confidence: complexityTimeCorrelation,
          data: { correlation: complexityTimeCorrelation },
          recommendations: [
            'Considerar complexidade no planejamento de cronogramas',
            'Ajustar estimativas baseado na correlação identificada',
            'Implementar buffer de tempo para projetos complexos'
          ]
        })
      }

      // Análise de tendências
      const recentProjects = this.projectData
        .filter(p => new Date(p.start_date) > new Date('2024-01-01'))
        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())

      if (recentProjects.length >= 3) {
        const roiTrend = this.calculateTrend(recentProjects.map(p => p.actual_roi || p.estimated_roi))
        
        if (roiTrend > 0.1) {
          insights.push({
            type: 'trend',
            title: 'Tendência Positiva de ROI',
            description: `ROI médio aumentando ${(roiTrend * 100).toFixed(1)}% por projeto.`,
            confidence: 0.75,
            data: { trend: roiTrend, projects: recentProjects.length },
            recommendations: [
              'Manter práticas que estão gerando melhoria',
              'Documentar fatores de sucesso',
              'Replicar estratégias bem-sucedidas'
            ]
          })
        }
      }

    } catch (error) {
      console.error('❌ Erro na detecção de anomalias:', error)
    }

    return insights
  }

  // Calcular confiança do modelo
  private calculateConfidence(X: number[][], y: number[], regression: any): number {
    try {
      const predictions = X.map(x => regression.predict(x))
      const errors = predictions.map((pred, i) => Math.abs(pred - y[i]))
      const meanError = errors.reduce((sum, error) => sum + error, 0) / errors.length
      const maxError = Math.max(...errors)
      
      // Confiança baseada no erro médio
      const confidence = Math.max(0, Math.min(1, 1 - (meanError / maxError)))
      return confidence
    } catch (error) {
      return 0.5 // Confiança padrão
    }
  }

  // Calcular correlação entre duas variáveis
  private calculateCorrelation(x: number[], y: number[]): number {
    try {
      const n = x.length
      if (n !== y.length || n === 0) return 0

      const sumX = x.reduce((sum, val) => sum + val, 0)
      const sumY = y.reduce((sum, val) => sum + val, 0)
      const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
      const sumX2 = x.reduce((sum, val) => sum + val * val, 0)
      const sumY2 = y.reduce((sum, val) => sum + val * val, 0)

      const numerator = n * sumXY - sumX * sumY
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

      return denominator === 0 ? 0 : numerator / denominator
    } catch (error) {
      return 0
    }
  }

  // Calcular tendência
  private calculateTrend(values: number[]): number {
    try {
      if (values.length < 2) return 0

      const n = values.length
      const x = Array.from({ length: n }, (_, i) => i)
      
      const sumX = x.reduce((sum, val) => sum + val, 0)
      const sumY = values.reduce((sum, val) => sum + val, 0)
      const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0)
      const sumX2 = x.reduce((sum, val) => sum + val * val, 0)

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
      return slope
    } catch (error) {
      return 0
    }
  }

  // Gerar insights automáticos
  async generateInsights(): Promise<MLInsight[]> {
    await this.loadProjectData()
    
    const insights: MLInsight[] = []

    try {
      // Insights de performance
      const avgROI = this.projectData
        .filter(p => p.actual_roi !== undefined)
        .reduce((sum, p) => sum + p.actual_roi!, 0) / 
        this.projectData.filter(p => p.actual_roi !== undefined).length

      if (avgROI > 40) {
        insights.push({
          type: 'trend',
          title: 'Performance Excepcional',
          description: `ROI médio de ${avgROI.toFixed(1)}% demonstra excelente performance do Centro de Excelência.`,
          confidence: 0.9,
          data: { averageROI: avgROI },
          recommendations: [
            'Manter práticas atuais',
            'Documentar casos de sucesso',
            'Expandir para outros processos'
          ]
        })
      }

      // Insights de qualidade
      const qualityRate = this.projectData
        .reduce((sum, p) => sum + (p.quality_gates_passed / p.total_quality_gates), 0) / 
        this.projectData.length * 100

      if (qualityRate > 90) {
        insights.push({
          type: 'trend',
          title: 'Alta Qualidade de Entrega',
          description: `Taxa de aprovação em quality gates de ${qualityRate.toFixed(1)}%.`,
          confidence: 0.85,
          data: { qualityRate },
          recommendations: [
            'Manter rigor nos quality gates',
            'Compartilhar melhores práticas',
            'Considerar automação de testes'
          ]
        })
      }

      // Adicionar anomalias detectadas
      const anomalies = await this.detectAnomalies()
      insights.push(...anomalies)

    } catch (error) {
      console.error('❌ Erro ao gerar insights:', error)
    }

    return insights
  }

  // Obter métricas resumidas
  getSummaryMetrics(): any {
    const completedProjects = this.projectData.filter(p => p.status === 'completed')
    
    return {
      totalProjects: this.projectData.length,
      completedProjects: completedProjects.length,
      averageROI: completedProjects.length > 0 
        ? completedProjects.reduce((sum, p) => sum + (p.actual_roi || p.estimated_roi), 0) / completedProjects.length
        : 0,
      averageDuration: completedProjects.length > 0
        ? completedProjects.reduce((sum, p) => sum + (p.duration_days || 0), 0) / completedProjects.length
        : 0,
      qualityRate: this.projectData.length > 0
        ? this.projectData.reduce((sum, p) => sum + (p.quality_gates_passed / p.total_quality_gates), 0) / this.projectData.length * 100
        : 0
    }
  }
} 