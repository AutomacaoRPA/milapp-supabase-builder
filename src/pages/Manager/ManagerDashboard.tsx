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
  Divider,
  LinearProgress,
  Avatar,
  AvatarGroup
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
  Dashboard as DashboardIcon,
  Group,
  Assignment,
  Block,
  Speed,
  PriorityHigh,
  Notifications,
  FilterList
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'

interface ManagerData {
  teamStats: any[]
  pendingRequests: any[]
  blockedItems: any[]
  slaCompliance: any[]
  teamPerformance: any[]
  recentActivities: any[]
  qualityMetrics: any[]
  resourceUtilization: any[]
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
      id={`manager-tabpanel-${index}`}
      aria-labelledby={`manager-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export function ManagerDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ManagerData | null>(null)
  const [selectedTeam, setSelectedTeam] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState('7')
  const [tabValue, setTabValue] = useState(0)

  useEffect(() => {
    loadManagerData()
  }, [selectedTeam, selectedPeriod])

  const loadManagerData = async () => {
    try {
      setLoading(true)
      setError(null)

      const periodDays = parseInt(selectedPeriod)
      const periodStart = new Date()
      periodStart.setDate(periodStart.getDate() - periodDays)

      // Carregar estatísticas da equipe
      const { data: teamStats } = await supabase
        .from('department_metrics')
        .select('*')

      // Carregar solicitações pendentes
      const { data: pendingRequests } = await supabase
        .from('incident_log')
        .select('*')
        .in('status', ['new', 'assigned', 'in_progress'])
        .gte('created_at', periodStart.toISOString())

      // Carregar itens bloqueados
      const { data: blockedItems } = await supabase
        .from('blocked_workflows')
        .select('*')

      // Carregar compliance de SLA
      const { data: slaCompliance } = await supabase
        .from('sla_compliance')
        .select('*')

      // Carregar performance da equipe
      const { data: teamPerformance } = await supabase
        .from('top_users')
        .select('*')
        .limit(10)

      // Carregar atividades recentes
      const { data: recentActivities } = await supabase
        .from('recent_workflow_executions')
        .select('*')
        .limit(20)

      // Carregar métricas de qualidade
      const { data: qualityMetrics } = await supabase
        .from('quality_nonconformities')
        .select('*')
        .gte('created_at', periodStart.toISOString())

      // Carregar utilização de recursos
      const { data: resourceUtilization } = await supabase
        .from('workflow_executions')
        .select('*')
        .gte('created_at', periodStart.toISOString())

      setData({
        teamStats: teamStats || [],
        pendingRequests: pendingRequests || [],
        blockedItems: blockedItems || [],
        slaCompliance: slaCompliance || [],
        teamPerformance: teamPerformance || [],
        recentActivities: recentActivities || [],
        qualityMetrics: qualityMetrics || [],
        resourceUtilization: resourceUtilization || []
      })
    } catch (error) {
      console.error('❌ Erro ao carregar dados gerenciais:', error)
      setError('Erro ao carregar dados gerenciais')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadManagerData()
  }

  const handleExport = () => {
    // Implementar exportação de dados
    console.log('Exportando dados gerenciais...')
  }

  const getSlaColor = (compliance: number) => {
    if (compliance >= 95) return 'success'
    if (compliance >= 80) return 'warning'
    return 'error'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      default: return 'default'
    }
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
          Dashboard Gerencial
        </Typography>
        
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Equipe</InputLabel>
            <Select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              label="Equipe"
            >
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="ti">TI</MenuItem>
              <MenuItem value="rh">RH</MenuItem>
              <MenuItem value="financeiro">Financeiro</MenuItem>
              <MenuItem value="operacional">Operacional</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              label="Período"
            >
              <MenuItem value="1">1 dia</MenuItem>
              <MenuItem value="7">7 dias</MenuItem>
              <MenuItem value="30">30 dias</MenuItem>
              <MenuItem value="90">90 dias</MenuItem>
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

      {/* KPIs Principais */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <People color="primary" />
                <Typography variant="h6">
                  {data?.teamStats.reduce((sum, team) => sum + team.total_users, 0) || 0}
                </Typography>
              </Box>
              <Typography color="textSecondary" gutterBottom>
                Total de Usuários
              </Typography>
              <Typography variant="caption">
                {data?.teamStats.reduce((sum, team) => sum + team.active_users, 0) || 0} ativos
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Assignment color="warning" />
                <Typography variant="h6">
                  {data?.pendingRequests.length || 0}
                </Typography>
              </Box>
              <Typography color="textSecondary" gutterBottom>
                Solicitações Pendentes
              </Typography>
              <Typography variant="caption">
                {data?.pendingRequests.filter(r => r.priority === 'critical').length || 0} críticas
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Block color="error" />
                <Typography variant="h6">
                  {data?.blockedItems.length || 0}
                </Typography>
              </Box>
              <Typography color="textSecondary" gutterBottom>
                Itens Bloqueados
              </Typography>
              <Typography variant="caption">
                Requerem atenção
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Speed color="success" />
                <Typography variant="h6">
                  {data?.slaCompliance.reduce((sum, sla) => sum + sla.compliance_percentage, 0) / Math.max(data?.slaCompliance.length || 1, 1) || 0}%
                </Typography>
              </Box>
              <Typography color="textSecondary" gutterBottom>
                Compliance SLA
              </Typography>
              <Typography variant="caption">
                Meta: 95%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Visão Geral" icon={<DashboardIcon />} />
          <Tab label="Equipe" icon={<Group />} />
          <Tab label="Solicitações" icon={<Assignment />} />
          <Tab label="Qualidade" icon={<Assessment />} />
          <Tab label="Performance" icon={<TrendingUp />} />
        </Tabs>
      </Box>

      {/* Visão Geral Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Gráfico de Performance */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance da Equipe
                </Typography>
                <Box height={300} display="flex" alignItems="center" justifyContent="center">
                  <Typography color="textSecondary">
                    Gráfico de performance (implementar com biblioteca de gráficos)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Alertas */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alertas
                </Typography>
                <List>
                  {data?.pendingRequests.filter(r => r.priority === 'critical').slice(0, 3).map((request, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <PriorityHigh color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={request.title}
                        secondary={`SLA: ${request.sla_target_minutes}min`}
                      />
                    </ListItem>
                  ))}
                  {data?.blockedItems.slice(0, 2).map((item, index) => (
                    <ListItem key={`blocked-${index}`}>
                      <ListItemIcon>
                        <Block color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.workflow_name}
                        secondary={`Bloqueado há ${Math.round(item.hours_blocked)}h`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Compliance SLA */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Compliance de SLA por Tipo
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Prioridade</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Compliance</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data?.slaCompliance.map((sla, index) => (
                        <TableRow key={index}>
                          <TableCell>{sla.incident_type}</TableCell>
                          <TableCell>
                            <Chip
                              label={sla.priority}
                              color={getPriorityColor(sla.priority) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{sla.total_incidents}</TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2">
                                {sla.compliance_percentage}%
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={sla.compliance_percentage}
                                color={getSlaColor(sla.compliance_percentage) as any}
                                sx={{ width: 100 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={sla.compliance_percentage >= 95 ? 'OK' : 'Atenção'}
                              color={getSlaColor(sla.compliance_percentage) as any}
                              size="small"
                            />
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

      {/* Equipe Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {/* Performance da Equipe */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance Individual
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Usuário</TableCell>
                        <TableCell>Departamento</TableCell>
                        <TableCell>Eventos</TableCell>
                        <TableCell>Workflows Criados</TableCell>
                        <TableCell>Interações IA</TableCell>
                        <TableCell>Performance</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data?.teamPerformance.map((user, index) => (
                        <TableRow key={index}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.department}</TableCell>
                          <TableCell>{user.event_count}</TableCell>
                          <TableCell>{user.workflows_created}</TableCell>
                          <TableCell>{user.ai_interactions}</TableCell>
                          <TableCell>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(100, (user.event_count / 100) * 100)}
                              color="primary"
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Estatísticas por Departamento */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Estatísticas por Departamento
                </Typography>
                <List>
                  {data?.teamStats.map((team, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Group />
                      </ListItemIcon>
                      <ListItemText
                        primary={team.department}
                        secondary={`${team.active_users}/${team.total_users} usuários ativos`}
                      />
                      <Typography variant="body2">
                        {team.workflows_executed} execuções
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Utilização de Recursos */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Utilização de Recursos
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Workflows Ativos
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={75}
                      color="primary"
                    />
                    <Typography variant="caption">75% da capacidade</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      IA em Uso
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={45}
                      color="secondary"
                    />
                    <Typography variant="caption">45% da capacidade</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" gutterBottom>
                      Armazenamento
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={60}
                      color="warning"
                    />
                    <Typography variant="caption">60% da capacidade</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Solicitações Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {/* Solicitações Pendentes */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Solicitações Pendentes
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Número</TableCell>
                        <TableCell>Título</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Prioridade</TableCell>
                        <TableCell>Responsável</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Tempo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data?.pendingRequests.map((request, index) => (
                        <TableRow key={index}>
                          <TableCell>{request.incident_number}</TableCell>
                          <TableCell>{request.title}</TableCell>
                          <TableCell>
                            <Chip
                              label={request.incident_type}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={request.priority}
                              color={getPriorityColor(request.priority) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{request.assigned_to || 'Não atribuído'}</TableCell>
                          <TableCell>
                            <Chip
                              label={request.status}
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {request.created_at ? 
                              `${Math.round((new Date().getTime() - new Date(request.created_at).getTime()) / 60000)}min` :
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

          {/* Itens Bloqueados */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Itens Bloqueados
                </Typography>
                <List>
                  {data?.blockedItems.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Block color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.workflow_name}
                        secondary={`Bloqueado há ${Math.round(item.hours_blocked)} horas - ${item.lifecycle_blocked_reason}`}
                      />
                      <Chip
                        label="Requer Atenção"
                        color="warning"
                        size="small"
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Qualidade Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          {/* Métricas de Qualidade */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Não Conformidades
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Total</Typography>
                    <Typography variant="h6">{data?.qualityMetrics.length || 0}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Em Análise</Typography>
                    <Typography variant="h6">
                      {data?.qualityMetrics.filter(q => q.status === 'em_analise').length || 0}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography>Resolvidas</Typography>
                    <Typography variant="h6">
                      {data?.qualityMetrics.filter(q => q.status === 'resolvida').length || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Tendências de Qualidade */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tendências de Qualidade
                </Typography>
                <Box height={200} display="flex" alignItems="center" justifyContent="center">
                  <Typography color="textSecondary">
                    Gráfico de tendências (implementar)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Performance Tab */}
      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={3}>
          {/* Métricas de Performance */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Métricas de Performance
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {data?.recentActivities.filter(a => a.status === 'completed').length || 0}
                      </Typography>
                      <Typography variant="body2">Workflows Concluídos</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {data?.teamPerformance.reduce((sum, user) => sum + user.ai_interactions, 0) || 0}
                      </Typography>
                      <Typography variant="body2">Interações IA</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="warning.main">
                        {data?.pendingRequests.length || 0}
                      </Typography>
                      <Typography variant="body2">Pendências</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main">
                        {data?.teamStats.reduce((sum, team) => sum + team.workflows_executed, 0) || 0}
                      </Typography>
                      <Typography variant="body2">Total Execuções</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  )
} 