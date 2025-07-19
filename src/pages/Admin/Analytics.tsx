import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material'
import {
  TrendingUp,
  TrendingDown,
  People,
  Work,
  SmartToy,
  Assessment,
  Refresh,
  Download,
  Visibility,
  Schedule,
  CheckCircle,
  Warning,
  Error,
  ExpandMore,
  BarChart,
  PieChart,
  Timeline,
  Dashboard as DashboardIcon
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'

interface AnalyticsData {
  kpis: any[]
  workflowMetrics: any[]
  aiMetrics: any[]
  departmentMetrics: any[]
  topWorkflows: any[]
  topUsers: any[]
  performanceMetrics: any[]
  recentEvents: any[]
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export function Analytics() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('30')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [tabValue, setTabValue] = useState(0)

  useEffect(() => {
    loadAnalyticsData()
  }, [selectedPeriod, selectedDepartment])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const periodDays = parseInt(selectedPeriod)
      const periodStart = new Date()
      periodStart.setDate(periodStart.getDate() - periodDays)

      // Carregar KPIs
      const { data: kpisData } = await supabase
        .from('analytics_kpis')
        .select('*')

      // Carregar métricas de workflows
      const { data: workflowMetrics } = await supabase.rpc('get_workflow_usage_metrics', {
        p_period_start: periodStart.toISOString(),
        p_period_end: new Date().toISOString()
      })

      // Carregar métricas de IA
      const { data: aiMetrics } = await supabase.rpc('get_ai_usage_metrics', {
        p_period_start: periodStart.toISOString(),
        p_period_end: new Date().toISOString()
      })

      // Carregar métricas por departamento
      const { data: departmentMetrics } = await supabase.rpc('get_department_metrics', {
        p_period_start: periodStart.toISOString(),
        p_period_end: new Date().toISOString()
      })

      // Carregar top workflows
      const { data: topWorkflows } = await supabase
        .from('top_workflows')
        .select('*')
        .limit(10)

      // Carregar top usuários
      const { data: topUsers } = await supabase
        .from('top_users')
        .select('*')
        .limit(20)

      // Carregar métricas de performance
      const { data: performanceMetrics } = await supabase
        .from('performance_metrics')
        .select('*')

      // Carregar eventos recentes
      const { data: recentEvents } = await supabase
        .from('recent_workflow_executions')
        .select('*')
        .limit(10)

      setData({
        kpis: kpisData || [],
        workflowMetrics: workflowMetrics || [],
        aiMetrics: aiMetrics || [],
        departmentMetrics: departmentMetrics || [],
        topWorkflows: topWorkflows || [],
        topUsers: topUsers || [],
        performanceMetrics: performanceMetrics || [],
        recentEvents: recentEvents || []
      })
    } catch (error) {
      console.error('❌ Erro ao carregar analytics:', error)
      setError('Erro ao carregar dados de analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadAnalyticsData()
  }

  const handleExport = () => {
    // Implementar exportação de dados
    console.log('Exportando dados...')
  }

  const getMetricColor = (metric: any) => {
    if (metric.trend_percentage > 0) return 'success'
    if (metric.trend_percentage < 0) return 'error'
    return 'info'
  }

  const getMetricIcon = (metric: any) => {
    if (metric.trend_percentage > 0) return <TrendingUp />
    if (metric.trend_percentage < 0) return <TrendingDown />
    return <Assessment />
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
          Analytics Corporativo
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
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Departamento</InputLabel>
            <Select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              label="Departamento"
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="ti">TI</MenuItem>
              <MenuItem value="rh">RH</MenuItem>
              <MenuItem value="financeiro">Financeiro</MenuItem>
              <MenuItem value="operacional">Operacional</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Atualizar dados">
            <IconButton onClick={handleRefresh}>
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Exportar
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Dashboard" icon={<DashboardIcon />} />
          <Tab label="Workflows" icon={<Work />} />
          <Tab label="IA" icon={<SmartToy />} />
          <Tab label="Departamentos" icon={<People />} />
          <Tab label="Performance" icon={<Assessment />} />
        </Tabs>
      </Box>

      {/* Dashboard Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* KPIs Principais */}
          {data?.kpis.map((kpi, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        {kpi.kpi_name}
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {kpi.kpi_value?.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {kpi.kpi_unit}
                      </Typography>
                    </Box>
                    <Chip
                      label={kpi.kpi_color}
                      color={kpi.kpi_color as any}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Gráfico de Tendências */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tendências de Uso
                </Typography>
                <Box height={300} display="flex" alignItems="center" justifyContent="center">
                  <Typography color="textSecondary">
                    Gráfico de tendências (implementar com biblioteca de gráficos)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Workflows */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Workflows
                </Typography>
                <List dense>
                  {data?.topWorkflows.slice(0, 5).map((workflow, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Work />
                      </ListItemIcon>
                      <ListItemText
                        primary={workflow.name}
                        secondary={`${workflow.execution_count} execuções`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Eventos Recentes */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Execuções Recentes
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Workflow</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Iniciado por</TableCell>
                        <TableCell>Duração</TableCell>
                        <TableCell>Data</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data?.recentEvents.map((event, index) => (
                        <TableRow key={index}>
                          <TableCell>{event.workflow_name}</TableCell>
                          <TableCell>
                            <Chip
                              label={event.status}
                              color={
                                event.status === 'completed' ? 'success' :
                                event.status === 'failed' ? 'error' : 'warning'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{event.triggered_by_email}</TableCell>
                          <TableCell>
                            {event.completed_at && event.started_at ? 
                              `${Math.round((new Date(event.completed_at).getTime() - new Date(event.started_at).getTime()) / 60000)}min` :
                              'Em andamento'
                            }
                          </TableCell>
                          <TableCell>
                            {new Date(event.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Workflows Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {/* Métricas de Workflows */}
          {data?.workflowMetrics.map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getMetricIcon(metric)}
                    <Typography variant="h6">
                      {metric.metric_value?.toLocaleString()}
                    </Typography>
                  </Box>
                  <Typography color="textSecondary">
                    {metric.metric_name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Top Workflows Detalhado */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Workflows Mais Utilizados
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Workflow</TableCell>
                        <TableCell>Categoria</TableCell>
                        <TableCell>Execuções</TableCell>
                        <TableCell>Taxa de Sucesso</TableCell>
                        <TableCell>Tempo Médio</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data?.topWorkflows.map((workflow, index) => (
                        <TableRow key={index}>
                          <TableCell>{workflow.name}</TableCell>
                          <TableCell>{workflow.category}</TableCell>
                          <TableCell>{workflow.execution_count}</TableCell>
                          <TableCell>
                            {workflow.execution_count > 0 ? 
                              `${Math.round((workflow.completed_count / workflow.execution_count) * 100)}%` :
                              '0%'
                            }
                          </TableCell>
                          <TableCell>
                            {workflow.avg_duration_minutes ? 
                              `${Math.round(workflow.avg_duration_minutes)}min` :
                              'N/A'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* IA Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {/* Métricas de IA */}
          {data?.aiMetrics.map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <SmartToy color="primary" />
                    <Typography variant="h6">
                      {metric.metric_value?.toLocaleString()}
                    </Typography>
                  </Box>
                  <Typography color="textSecondary">
                    {metric.metric_name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Top Usuários de IA */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Usuários Mais Ativos com IA
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Usuário</TableCell>
                        <TableCell>Departamento</TableCell>
                        <TableCell>Interações IA</TableCell>
                        <TableCell>Workflows Criados</TableCell>
                        <TableCell>Eventos</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data?.topUsers.slice(0, 10).map((user, index) => (
                        <TableRow key={index}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.department}</TableCell>
                          <TableCell>{user.ai_interactions}</TableCell>
                          <TableCell>{user.workflows_created}</TableCell>
                          <TableCell>{user.event_count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Departamentos Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          {/* Métricas por Departamento */}
          {data?.departmentMetrics.map((dept, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {dept.department}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Usuários Ativos
                      </Typography>
                      <Typography variant="h6">
                        {dept.active_users}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Workflows Executados
                      </Typography>
                      <Typography variant="h6">
                        {dept.workflows_executed}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Documentos Criados
                      </Typography>
                      <Typography variant="h6">
                        {dept.documents_created}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        Interações IA
                      </Typography>
                      <Typography variant="h6">
                        {dept.ai_interactions}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Performance Tab */}
      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          {/* Métricas de Performance */}
          {data?.performanceMetrics.map((metric, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Assessment color="primary" />
                    <Typography variant="h6">
                      {metric.metric_value?.toFixed(2)}
                    </Typography>
                  </Box>
                  <Typography color="textSecondary">
                    {metric.metric_name}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {metric.metric_unit}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Alertas de Performance */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alertas de Performance
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Warning color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Workflow lento detectado"
                      secondary="Workflow 'Processo de Aprovação' está levando mais de 30 minutos"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <Error color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Taxa de falha alta"
                      secondary="5 workflows falharam nas últimas 24 horas"
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Performance otimizada"
                      secondary="Tempo médio de execução melhorou 15%"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  )
} 