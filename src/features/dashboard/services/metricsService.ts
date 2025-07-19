export interface DashboardMetrics {
  automations: {
    active: number
    total: number
    growth: number
  }
  hours: {
    saved: number
    weeklyGrowth: number
  }
  roi: {
    average: number
    trend: string
  }
  savings: {
    total: number
    target: number
    percentage: number
  }
  qualityGates: {
    g1: { projects: number; progress: number }
    g2: { projects: number; progress: number }
    g3: { projects: number; progress: number }
    g4: { projects: number; progress: number }
  }
  performance: {
    uptime: number
    users: number
    activeProjects: number
    alerts: number
  }
}

export interface ChartData {
  roi: Array<{
    mes: string
    roi: number
    economia: number
  }>
  projectStatus: Array<{
    name: string
    value: number
    color: string
  }>
  automationTypes: Array<{
    tipo: string
    quantidade: number
    economia: number
  }>
}

export class MetricsService {
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    // Simular chamada à API
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      automations: {
        active: 47,
        total: 52,
        growth: 8
      },
      hours: {
        saved: 156,
        weeklyGrowth: 23
      },
      roi: {
        average: 420,
        trend: 'Crescimento constante'
      },
      savings: {
        total: 1200000,
        target: 1500000,
        percentage: 80
      },
      qualityGates: {
        g1: { projects: 15, progress: 75 },
        g2: { projects: 8, progress: 60 },
        g3: { projects: 12, progress: 85 },
        g4: { projects: 47, progress: 95 }
      },
      performance: {
        uptime: 98.5,
        users: 156,
        activeProjects: 23,
        alerts: 3
      }
    }
  }

  static async getChartData(): Promise<ChartData> {
    // Simular chamada à API
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return {
      roi: [
        { mes: 'Jan', roi: 180, economia: 45000 },
        { mes: 'Fev', roi: 220, economia: 67000 },
        { mes: 'Mar', roi: 290, economia: 89000 },
        { mes: 'Abr', roi: 340, economia: 125000 },
        { mes: 'Mai', roi: 380, economia: 156000 },
        { mes: 'Jun', roi: 420, economia: 189000 }
      ],
      projectStatus: [
        { name: 'Em Desenvolvimento', value: 12, color: '#95c11f' },
        { name: 'Em Teste', value: 8, color: '#4aa455' },
        { name: 'Em Produção', value: 47, color: '#327746' },
        { name: 'Pausado', value: 3, color: '#e69732' }
      ],
      automationTypes: [
        { tipo: 'Processamento de Dados', quantidade: 18, economia: 450000 },
        { tipo: 'Validação de Documentos', quantidade: 12, economia: 320000 },
        { tipo: 'Relatórios Automatizados', quantidade: 8, economia: 280000 },
        { tipo: 'Integração de Sistemas', quantidade: 6, economia: 150000 },
        { tipo: 'Monitoramento', quantidade: 3, economia: 80000 }
      ]
    }
  }

  static async getRecentActivities() {
    // Simular chamada à API
    await new Promise(resolve => setTimeout(resolve, 200))
    
    return [
      {
        id: '1',
        type: 'success',
        title: 'Automação de Validação de Documentos',
        description: 'Deploy realizado com sucesso em produção',
        user: 'Maria Silva',
        timestamp: '2 horas atrás'
      },
      {
        id: '2',
        type: 'info',
        title: 'Novo Projeto Aprovado',
        description: 'Projeto de integração de sistemas aprovado no G2',
        user: 'João Santos',
        timestamp: '4 horas atrás'
      },
      {
        id: '3',
        type: 'warning',
        title: 'Alerta de Performance',
        description: 'Automação de relatórios com latência aumentada',
        user: 'Sistema',
        timestamp: '6 horas atrás'
      }
    ]
  }

  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  static formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`
  }

  static formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR').format(value)
  }
} 