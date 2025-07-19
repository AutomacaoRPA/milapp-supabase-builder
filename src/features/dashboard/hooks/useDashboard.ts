import { useState, useEffect } from 'react'
import { MetricsService, DashboardMetrics, ChartData } from '../services/metricsService'

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [metricsData, chartDataResult, activitiesData] = await Promise.all([
        MetricsService.getDashboardMetrics(),
        MetricsService.getChartData(),
        MetricsService.getRecentActivities()
      ])

      setMetrics(metricsData)
      setChartData(chartDataResult)
      setActivities(activitiesData)
    } catch (err) {
      setError('Erro ao carregar dados do dashboard')
      console.error('Erro no dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    loadDashboardData()
  }

  const getMetricsSummary = () => {
    if (!metrics) return null

    return {
      automations: {
        value: metrics.automations.active,
        growth: metrics.automations.growth,
        label: 'Automações Ativas'
      },
      hours: {
        value: metrics.hours.saved,
        growth: metrics.hours.weeklyGrowth,
        label: 'Horas Economizadas'
      },
      roi: {
        value: metrics.roi.average,
        trend: metrics.roi.trend,
        label: 'ROI Médio'
      },
      savings: {
        value: metrics.savings.total,
        target: metrics.savings.target,
        percentage: metrics.savings.percentage,
        label: 'Economia Total'
      }
    }
  }

  const getQualityGatesProgress = () => {
    if (!metrics) return []

    return [
      { gate: 'G1 - Ideação', projects: metrics.qualityGates.g1.projects, progress: metrics.qualityGates.g1.progress, color: '#327746' },
      { gate: 'G2 - Aprovação', projects: metrics.qualityGates.g2.projects, progress: metrics.qualityGates.g2.progress, color: '#95c11f' },
      { gate: 'G3 - Desenvolvimento', projects: metrics.qualityGates.g3.projects, progress: metrics.qualityGates.g3.progress, color: '#4aa455' },
      { gate: 'G4 - Produção', projects: metrics.qualityGates.g4.projects, progress: metrics.qualityGates.g4.progress, color: '#e7e365' }
    ]
  }

  const getPerformanceMetrics = () => {
    if (!metrics) return null

    return {
      uptime: {
        value: metrics.performance.uptime,
        label: 'Uptime Médio',
        trend: '+2.3%'
      },
      users: {
        value: metrics.performance.users,
        label: 'Usuários Ativos',
        trend: '+12 este mês'
      },
      projects: {
        value: metrics.performance.activeProjects,
        label: 'Projetos Ativos',
        trend: 'No prazo'
      },
      alerts: {
        value: metrics.performance.alerts,
        label: 'Alertas',
        trend: '-2 esta semana'
      }
    }
  }

  return {
    metrics,
    chartData,
    activities,
    loading,
    error,
    refreshData,
    getMetricsSummary,
    getQualityGatesProgress,
    getPerformanceMetrics
  }
} 