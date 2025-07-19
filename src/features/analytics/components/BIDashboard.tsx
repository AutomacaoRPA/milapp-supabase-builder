import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Button,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Refresh,
  Download,
  Visibility,
  Analytics
} from '@mui/icons-material'
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  PieChart,
  Line,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Area,
  AreaChart
} from 'recharts'
import { MedSeniorAnalyticsService } from '../../../services/analytics/AdvancedAnalyticsService'

interface ROIPrediction {
  nextQuarterROI: number
  confidence: number
  recommendation: string
  factors: Array<{ name: string; weight: number; impact: 'positive' | 'negative' }>
  trend: 'increasing' | 'decreasing' | 'stable'
}

interface AnomalyReport {
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

interface PerformanceInsight {
  type: 'trend' | 'anomaly' | 'correlation' | 'prediction'
  title: string
  description: string
  confidence: number
  impact: 'positive' | 'negative' | 'neutral'
  data: any
  recommendations: string[]
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
}

export function MedSeniorBIDashboard() {
  const [timeRange, setTimeRange] = useState('90days')
  const [predictions, setPredictions] = useState<ROIPrediction | null>(null)
  const [anomalies, setAnomalies] = useState<AnomalyReport | null>(null)
  const [insights, setInsights] = useState<PerformanceInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Dados simulados para gráficos
  const performanceData = [
    { module: 'Discovery IA', usage: 85, satisfaction: 4.2, efficiency: 92 },
    { module: 'Quality Gates', usage: 78, satisfaction: 4.5, efficiency: 88 },
    { module: 'Projects', usage: 92, satisfaction: 4.1, efficiency: 95 },
    { module: 'Analytics', usage: 65, satisfaction: 3.8, efficiency: 82 },
    { module: 'Deployments', usage: 88, satisfaction: 4.3, efficiency: 90 }
  ]

  const roiTrendData = [
    { month: 'Jan', estimated: 35, actual: 38 },
    { month: 'Feb', estimated: 40, actual: 42 },
    { month: 'Mar', estimated: 45, actual: 48 },
    { month: 'Apr', estimated: 42, actual: 45 },
    { month: 'May', estimated: 48, actual: 52 },
    { month: 'Jun', estimated: 50, actual: 55 }
  ]

  const sentimentData = [
    { category: 'Usabilidade', positive: 75, neutral: 20, negative: 5 },
    { category: 'Performance', positive: 60, neutral: 25, negative: 15 },
    { category: 'Funcionalidades', positive: 85, neutral: 10, negative: 5 },
    { category: 'Suporte', positive: 90, neutral: 8, negative: 2 }
  ]

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      const analyticsService = MedSeniorAnalyticsService.getInstance()
      
      // Carregar dados
      await analyticsService.loadAnalyticsData()
      
      // Obter predições
      const roiPrediction = await analyticsService.predictROITrend()
      setPredictions(roiPrediction)
      
      // Detectar anomalias
      const anomalyReport = analyticsService.detectAnomalies()
      setAnomalies(anomalyReport)
      
      // Gerar insights
      const performanceInsights = await analyticsService.generateInsights()
      setInsights(performanceInsights)
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('❌ Erro ao carregar dados de BI:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'error'
      case 'HIGH': return 'warning'
      case 'MEDIUM': return 'info'
      case 'LOW': return 'success'
      default: return 'default'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp color="success" />
      case 'decreasing': return <TrendingDown color="error" />
      default: return <CheckCircle color="info" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'success'
      case 'negative': return 'error'
      default: return 'info'
    }
  }

  const exportReport = () => {
    // Implementar exportação de relatório
    console.log('📊 Exportando relatório BI...')
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h3" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            Business Intelligence MedSênior
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Insights avançados para tomada de decisão estratégica
          </Typography>
        </Box>
        
        <Box display="flex" gap={2}>
          <FormControl size="small">
            <InputLabel>Período</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Período"
            >
              <MenuItem value="30days">Últimos 30 dias</MenuItem>
              <MenuItem value="90days">Últimos 90 dias</MenuItem>
              <MenuItem value="6months">Últimos 6 meses</MenuItem>
              <MenuItem value="1year">Último ano</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Atualizar dados">
            <IconButton onClick={loadAnalyticsData} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Exportar relatório">
            <IconButton onClick={exportReport} color="primary">
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Status de atualização */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Última atualização: {lastUpdated.toLocaleString('pt-BR')}
      </Alert>

      <Grid container spacing={3}>
        {/* Previsão ROI */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Analytics color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  Previsão ROI - Próximo Trimestre
                </Typography>
              </Box>
              
              {predictions && (
                <Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Typography variant="h3" color="secondary.main" fontWeight="bold">
                      {predictions.nextQuarterROI.toFixed(1)}%
                    </Typography>
                    {getTrendIcon(predictions.trend)}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Confiança: {predictions.confidence.toFixed(1)}%
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {predictions.recommendation}
                  </Alert>
                  
                  <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                    Fatores de Impacto:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {predictions.factors.map((factor, index) => (
                      <Chip
                        key={index}
                        label={`${factor.name}: ${(factor.weight * 100).toFixed(0)}%`}
                        color={factor.impact === 'positive' ? 'success' : 'error'}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Detecção de Anomalias */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Warning color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" color="primary.main" fontWeight="bold">
                  Detecção de Anomalias
                </Typography>
              </Box>
              
              {anomalies && (
                <Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Chip 
                      label={`${anomalies.anomalies.length} anomalias detectadas`}
                      color={getSeverityColor(anomalies.riskLevel) as any}
                      icon={<Warning />}
                    />
                    <Typography variant="body2" color="text.secondary" ml={1}>
                      Risco: {anomalies.riskLevel}
                    </Typography>
                  </Box>
                  
                  {anomalies.anomalies.slice(0, 3).map((anomaly, index) => (
                    <Alert 
                      key={index} 
                      severity={getSeverityColor(anomaly.severity) as any}
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        {anomaly.metric}: {anomaly.value}
                      </Typography>
                      <Typography variant="caption">
                        {anomaly.recommendation}
                      </Typography>
                    </Alert>
                  ))}
                  
                  {anomalies.anomalies.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{anomalies.anomalies.length - 3} anomalias adicionais
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de Performance por Módulo */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" color="primary.main" fontWeight="bold" gutterBottom>
                Performance por Módulo - MedSênior
              </Typography>
              
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="module" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <RechartsTooltip />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="usage" 
                    fill="#327746" 
                    name="Uso (%)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="satisfaction" 
                    stroke="#95c11f" 
                    strokeWidth={3}
                    name="Satisfação (1-5)"
                  />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="efficiency" 
                    fill="#e8f5e8" 
                    stroke="#28a745"
                    name="Eficiência (%)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Tendência de ROI */}
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" color="primary.main" fontWeight="bold" gutterBottom>
                Tendência de ROI - MedSênior
              </Typography>
              
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={roiTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="estimated" 
                    stackId="1"
                    stroke="#6c757d" 
                    fill="#6c757d" 
                    name="ROI Estimado"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="actual" 
                    stackId="1"
                    stroke="#327746" 
                    fill="#327746" 
                    name="ROI Real"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Análise de Sentimento */}
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" color="primary.main" fontWeight="bold" gutterBottom>
                Análise de Sentimento
              </Typography>
              
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="positive"
                    nameKey="category"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={['#327746', '#95c11f', '#28a745', '#6c757d'][index % 4]} 
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Insights Automáticos */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" color="primary.main" fontWeight="bold" gutterBottom>
                Insights Automáticos - IA MedSênior
              </Typography>
              
              <Grid container spacing={2}>
                {insights.map((insight, index) => (
                  <Grid item xs={12} md={6} lg={4} key={index}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center" mb={1}>
                          <Chip
                            label={insight.type.toUpperCase()}
                            color={getImpactColor(insight.impact) as any}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                          <Chip
                            label={`${(insight.confidence * 100).toFixed(0)}% confiança`}
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                        
                        <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                          {insight.title}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" mb={2}>
                          {insight.description}
                        </Typography>
                        
                        {insight.recommendations.slice(0, 2).map((rec, recIndex) => (
                          <Alert 
                            key={recIndex} 
                            severity="info" 
                            sx={{ mb: 1, fontSize: '0.75rem' }}
                          >
                            {rec}
                          </Alert>
                        ))}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
} 