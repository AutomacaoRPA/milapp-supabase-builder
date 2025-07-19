import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Badge,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  Dashboard,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  Info,
  Refresh,
  Download,
  Notifications,
  Schedule,
  Assessment,
  People,
  Security,
  Speed,
  Visibility,
  AutoAwesome,
  Timeline,
  Analytics,
  Business,
  AttachMoney,
  Assignment,
  BugReport,
  VerifiedUser
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'
import { DynamicChart } from '../../components/Reports/DynamicChart'

interface KPI {
  id: string
  title: string
  value: number
  target: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  status: 'good' | 'warning' | 'critical'
  description: string
  icon: React.ReactNode
}

interface ExecutiveMetric {
  category: string
  metrics: KPI[]
}

export function ExecutiveDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('30')
  const [activeTab, setActiveTab] = useState(0)
  const [metrics, setMetrics] = useState<ExecutiveMetric[]>([])
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    loadExecutiveMetrics()
  }, [selectedPeriod])

  const loadExecutiveMetrics = async () => {
    try {
      setLoading(true)
      setError(null)

      const periodDays = parseInt(selectedPeriod)

      // Simular carregamento de métricas executivas
      const mockMetrics: ExecutiveMetric[] = [
        {
          category: 'Operacional',
          metrics: [
            {
              id: 'sla_compliance',
              title: 'Conformidade SLA',
              value: 87.5,
              target: 95,
              unit: '%',
              trend: 'up',
              status: 'warning',
              description: 'Taxa de atendimento dentro do prazo',
              icon: <Schedule />
            },
            {
              id: 'request_volume',
              title: 'Volume de Solicitações',
              value: 1247,
              target: 1000,
              unit: 'solicitações',
              trend: 'up',
              status: 'good',
              description: 'Total de solicitações processadas',
              icon: <Assignment />
            },
            {
              id: 'resolution_time',
              title: 'Tempo Médio de Resolução',
              value: 8.3,
              target: 6,
              unit: 'horas',
              trend: 'down',
              status: 'warning',
              description: 'Tempo médio para resolver solicitações',
              icon: <Speed />
            }
          ]
        },
        {
          category: 'Qualidade',
          metrics: [
            {
              id: 'nc_count',
              title: 'Não Conformidades',
              value: 23,
              target: 15,
              unit: 'NCs',
              trend: 'up',
              status: 'critical',
              description: 'Total de NCs abertas',
              icon: <BugReport />
            },
            {
              id: 'nc_resolution',
              title: 'Resolução de NCs',
              value: 78.2,
              target: 90,
              unit: '%',
              trend: 'up',
              status: 'warning',
              description: 'Taxa de resolução de NCs',
              icon: <CheckCircle />
            },
            {
              id: 'recurring_nc',
              title: 'NCs Reincidentes',
              value: 5,
              target: 2,
              unit: 'NCs',
              trend: 'up',
              status: 'critical',
              description: 'NCs que se repetiram',
              icon: <Warning />
            }
          ]
        },
        {
          category: 'Segurança',
          metrics: [
            {
              id: 'security_incidents',
              title: 'Incidentes de Segurança',
              value: 2,
              target: 0,
              unit: 'incidentes',
              trend: 'down',
              status: 'warning',
              description: 'Incidentes de segurança registrados',
              icon: <Security />
            },
            {
              id: '2fa_adoption',
              title: 'Adoção 2FA',
              value: 94.7,
              target: 100,
              unit: '%',
              trend: 'up',
              status: 'good',
              description: 'Usuários com 2FA ativo',
              icon: <VerifiedUser />
            },
            {
              id: 'failed_logins',
              title: 'Tentativas Falhadas',
              value: 156,
              target: 50,
              unit: 'tentativas',
              trend: 'up',
              status: 'critical',
              description: 'Tentativas de login suspeitas',
              icon: <Error />
            }
          ]
        },
        {
          category: 'Produtividade',
          metrics: [
            {
              id: 'active_users',
              title: 'Usuários Ativos',
              value: 89,
              target: 100,
              unit: 'usuários',
              trend: 'up',
              status: 'good',
              description: 'Usuários ativos no período',
              icon: <People />
            },
            {
              id: 'workflow_success',
              title: 'Sucesso de Fluxos',
              value: 96.8,
              target: 95,
              unit: '%',
              trend: 'up',
              status: 'good',
              description: 'Taxa de sucesso dos workflows',
              icon: <TrendingUp />
            },
            {
              id: 'ai_adoption',
              title: 'Uso de IA',
              value: 67.3,
              target: 80,
              unit: '%',
              trend: 'up',
              status: 'warning',
              description: 'Adoção de recursos de IA',
              icon: <AutoAwesome />
            }
          ]
        }
      ]

      setMetrics(mockMetrics)

      // Dados para gráficos
      const mockChartData = [
        { name: 'Jan', SLA: 85, NCs: 12, Segurança: 98, Produtividade: 75 },
        { name: 'Fev', SLA: 87, NCs: 15, Segurança: 96, Produtividade: 78 },
        { name: 'Mar', SLA: 89, NCs: 18, Segurança: 94, Produtividade: 82 },
        { name: 'Abr', SLA: 91, NCs: 20, Segurança: 92, Produtividade: 85 },
        { name: 'Mai', SLA: 88, NCs: 22, Segurança: 90, Produtividade: 88 },
        { name: 'Jun', SLA: 87.5, NCs: 23, Segurança: 89, Produtividade: 89 }
      ]

      setChartData(mockChartData)

    } catch (error) {
      console.error('❌ Erro ao carregar métricas:', error)
      setError('Erro ao carregar métricas executivas')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'success'
      case 'warning': return 'warning'
      case 'critical': return 'error'
      default: return 'default'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp color="success" />
      case 'down': return <TrendingDown color="error" />
      case 'stable': return <Timeline color="info" />
      default: return <Info color="default" />
    }
  }

  const getProgressValue = (value: number, target: number) => {
    return Math.min((value / target) * 100, 100)
  }

  const getProgressColor = (value: number, target: number) => {
    const percentage = (value / target) * 100
    if (percentage >= 90) return 'success'
    if (percentage >= 70) return 'warning'
    return 'error'
  }

  const exportDashboard = () => {
    // Simular exportação do dashboard
    const content = `
      Dashboard Executivo MILAPP
      Período: Últimos ${selectedPeriod} dias
      Data: ${new Date().toLocaleDateString()}
      
      ${metrics.map(category => `
        ${category.category}:
        ${category.metrics.map(metric => 
          `- ${metric.title}: ${metric.value}${metric.unit} (Meta: ${metric.target}${metric.unit})`
        ).join('\n')}
      `).join('\n')}
    `
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-executivo-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          <Dashboard sx={{ mr: 1, verticalAlign: 'middle' }} />
          Dashboard Executivo
        </Typography>
        
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              label="Período"
            >
              <MenuItem value="7">7 dias</MenuItem>
              <MenuItem value="30">30 dias</MenuItem>
              <MenuItem value="90">90 dias</MenuItem>
              <MenuItem value="365">1 ano</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Atualizar dados">
            <IconButton onClick={loadExecutiveMetrics}>
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportDashboard}
          >
            Exportar
          </Button>
        </Box>
      </Box>

      {/* Alertas Críticos */}
      {metrics.some(category => 
        category.metrics.some(metric => metric.status === 'critical')
      ) && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Atenção: Métricas Críticas</AlertTitle>
          {metrics
            .flatMap(category => category.metrics)
            .filter(metric => metric.status === 'critical')
            .map(metric => `${metric.title}: ${metric.value}${metric.unit}`)
            .join(', ')}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Visão Geral" icon={<Dashboard />} />
          <Tab label="Tendências" icon={<TrendingUp />} />
          <Tab label="Alertas" icon={<Notifications />} />
        </Tabs>
      </Box>

      {/* Tab Visão Geral */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* KPIs por Categoria */}
          {metrics.map((category) => (
            <Grid item xs={12} md={6} key={category.category}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {category.category}
                  </Typography>
                  
                  <List>
                    {category.metrics.map((metric) => (
                      <ListItem key={metric.id} divider>
                        <ListItemIcon>
                          <Badge
                            badgeContent={getTrendIcon(metric.trend)}
                            color="default"
                          >
                            {metric.icon}
                          </Badge>
                        </ListItemIcon>
                        
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body1">
                                {metric.title}
                              </Typography>
                              <Chip
                                label={`${metric.value}${metric.unit}`}
                                color={getStatusColor(metric.status) as any}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {metric.description}
                              </Typography>
                              <Box mt={1}>
                                <LinearProgress
                                  variant="determinate"
                                  value={getProgressValue(metric.value, metric.target)}
                                  color={getProgressColor(metric.value, metric.target) as any}
                                  sx={{ height: 6, borderRadius: 3 }}
                                />
                                <Typography variant="caption" color="textSecondary">
                                  Meta: {metric.target}{metric.unit}
                                </Typography>
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Resumo Executivo */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resumo Executivo
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {metrics.flatMap(c => c.metrics).filter(m => m.status === 'good').length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Métricas Boas
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {metrics.flatMap(c => c.metrics).filter(m => m.status === 'warning').length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Requer Atenção
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="error.main">
                        {metrics.flatMap(c => c.metrics).filter(m => m.status === 'critical').length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Críticas
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="primary.main">
                        {Math.round(
                          (metrics.flatMap(c => c.metrics).filter(m => m.status === 'good').length / 
                           metrics.flatMap(c => c.metrics).length) * 100
                        )}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Performance Geral
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab Tendências */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Evolução das Métricas (Últimos 6 meses)
                </Typography>
                
                <DynamicChart
                  data={chartData}
                  title="Tendências Executivas"
                  description="Evolução dos principais indicadores ao longo do tempo"
                  height={400}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Análise de Tendências */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tendências Positivas
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUp color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Conformidade SLA"
                      secondary="Melhorou 2.5% nos últimos 30 dias"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUp color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Adoção 2FA"
                      secondary="Aumentou para 94.7% dos usuários"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingUp color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Sucesso de Fluxos"
                      secondary="Manteve-se acima de 95%"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Requer Atenção
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingDown color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Não Conformidades"
                      secondary="Aumentaram 15% no período"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <TrendingDown color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Tentativas de Login Falhadas"
                      secondary="212% acima do esperado"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Warning color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Tempo de Resolução"
                      secondary="38% acima da meta"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab Alertas */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alertas Ativos
                </Typography>
                
                <List>
                  {metrics
                    .flatMap(category => category.metrics)
                    .filter(metric => metric.status === 'critical' || metric.status === 'warning')
                    .map((metric) => (
                      <ListItem key={metric.id} divider>
                        <ListItemIcon>
                          {metric.status === 'critical' ? (
                            <Error color="error" />
                          ) : (
                            <Warning color="warning" />
                          )}
                        </ListItemIcon>
                        
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body1" fontWeight="bold">
                                {metric.title}
                              </Typography>
                              <Chip
                                label={metric.status === 'critical' ? 'Crítico' : 'Atenção'}
                                color={metric.status === 'critical' ? 'error' : 'warning'}
                                size="small"
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2">
                                {metric.description}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Valor atual: {metric.value}{metric.unit} | Meta: {metric.target}{metric.unit}
                              </Typography>
                            </Box>
                          }
                        />
                        
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => console.log('Investigar:', metric.title)}
                        >
                          Investigar
                        </Button>
                      </ListItem>
                    ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert
          onClose={() => setSuccess(null)}
          severity="success"
        >
          {success}
        </Alert>
      </Snackbar>
    </Box>
  )
} 