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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Badge,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from '@mui/material'
import {
  Dashboard,
  BugReport,
  Assignment,
  ChangeCircle,
  Book,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  Info,
  Refresh,
  Download,
  Add,
  FilterList,
  Settings,
  History,
  Schedule,
  PriorityHigh,
  LowPriority,
  Security,
  Speed,
  Visibility,
  AutoAwesome,
  Timeline,
  Analytics,
  Business,
  AttachMoney,
  People,
  Notifications,
  Assessment,
  Policy,
  Compliance,
  Build,
  Support,
  Storage,
  NetworkCheck,
  Computer,
  Phone,
  Email,
  Chat,
  ExpandMore,
  MoreVert,
  Edit,
  Delete,
  ViewList,
  ViewModule,
  CalendarToday,
  AccessTime,
  CheckCircleOutline,
  Cancel,
  Pending,
  PlayArrow,
  Stop,
  Pause
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'
import { DynamicChart } from '../../components/Reports/DynamicChart'

interface ITILMetric {
  category: string
  value: number
  target: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  status: 'good' | 'warning' | 'critical'
  description: string
  icon: React.ReactNode
}

interface Incident {
  id: string
  numero_incidente: string
  titulo: string
  categoria: string
  prioridade: string
  status: string
  created_at: string
  tempo_resolucao_minutos: number
  sla_violado: boolean
}

interface Change {
  id: string
  numero_rfc: string
  titulo: string
  categoria: string
  status: string
  risco: string
  created_at: string
}

interface Problem {
  id: string
  numero_problema: string
  titulo: string
  categoria: string
  prioridade: string
  status: string
  created_at: string
  incidentes_relacionados: number
}

interface KnowledgeArticle {
  id: string
  numero_artigo: string
  titulo: string
  tipo_artigo: string
  visualizacoes: number
  status: string
  created_at: string
}

export function ITIL4Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)
  const [selectedPeriod, setSelectedPeriod] = useState('30')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  
  // Estados de dados
  const [metrics, setMetrics] = useState<ITILMetric[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [changes, setChanges] = useState<Change[]>([])
  const [problems, setProblems] = useState<Problem[]>([])
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>([])
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    loadITILData()
  }, [selectedPeriod])

  const loadITILData = async () => {
    try {
      setLoading(true)
      setError(null)

      const periodDays = parseInt(selectedPeriod)

      // Simular carregamento de métricas ITIL
      const mockMetrics: ITILMetric[] = [
        {
          category: 'Incident Management',
          value: 87.5,
          target: 95,
          unit: '%',
          trend: 'up',
          status: 'warning',
          description: 'SLA Compliance',
          icon: <BugReport />
        },
        {
          category: 'Change Management',
          value: 92.3,
          target: 90,
          unit: '%',
          trend: 'up',
          status: 'good',
          description: 'Success Rate',
          icon: <ChangeCircle />
        },
        {
          category: 'Problem Management',
          value: 78.9,
          target: 85,
          unit: '%',
          trend: 'down',
          status: 'warning',
          description: 'Resolution Rate',
          icon: <Assignment />
        },
        {
          category: 'Knowledge Management',
          value: 94.7,
          target: 90,
          unit: '%',
          trend: 'up',
          status: 'good',
          description: 'Article Utilization',
          icon: <Book />
        },
        {
          category: 'Service Request',
          value: 96.2,
          target: 95,
          unit: '%',
          trend: 'up',
          status: 'good',
          description: 'Fulfillment Rate',
          icon: <Support />
        },
        {
          category: 'Continual Improvement',
          value: 82.1,
          target: 80,
          unit: '%',
          trend: 'up',
          status: 'good',
          description: 'CSI Implementation',
          icon: <TrendingUp />
        }
      ]

      setMetrics(mockMetrics)

      // Simular dados de incidentes
      const mockIncidents: Incident[] = [
        {
          id: '1',
          numero_incidente: 'INC-2024-000001',
          titulo: 'Servidor de Email Indisponível',
          categoria: 'Infraestrutura',
          prioridade: 'critical',
          status: 'in_progress',
          created_at: '2024-01-15T10:30:00Z',
          tempo_resolucao_minutos: 180,
          sla_violado: false
        },
        {
          id: '2',
          numero_incidente: 'INC-2024-000002',
          titulo: 'Acesso Negado ao Sistema ERP',
          categoria: 'Aplicações',
          prioridade: 'high',
          status: 'resolved',
          created_at: '2024-01-15T09:15:00Z',
          tempo_resolucao_minutos: 120,
          sla_violado: false
        },
        {
          id: '3',
          numero_incidente: 'INC-2024-000003',
          titulo: 'Lentidão na Rede',
          categoria: 'Redes',
          prioridade: 'medium',
          status: 'open',
          created_at: '2024-01-15T08:45:00Z',
          tempo_resolucao_minutos: 0,
          sla_violado: true
        }
      ]

      setIncidents(mockIncidents)

      // Simular dados de mudanças
      const mockChanges: Change[] = [
        {
          id: '1',
          numero_rfc: 'RFC-2024-000001',
          titulo: 'Atualização do Sistema de Backup',
          categoria: 'normal',
          status: 'approved',
          risco: 'medium',
          created_at: '2024-01-14T14:00:00Z'
        },
        {
          id: '2',
          numero_rfc: 'RFC-2024-000002',
          titulo: 'Migração de Servidor de Email',
          categoria: 'standard',
          status: 'in_progress',
          risco: 'high',
          created_at: '2024-01-13T16:30:00Z'
        },
        {
          id: '3',
          numero_rfc: 'RFC-2024-000003',
          titulo: 'Instalação de Antivírus',
          categoria: 'emergency',
          status: 'completed',
          risco: 'low',
          created_at: '2024-01-12T10:15:00Z'
        }
      ]

      setChanges(mockChanges)

      // Simular dados de problemas
      const mockProblems: Problem[] = [
        {
          id: '1',
          numero_problema: 'PRB-2024-000001',
          titulo: 'Falhas Intermitentes no Sistema ERP',
          categoria: 'Aplicações',
          prioridade: 'high',
          status: 'in_progress',
          created_at: '2024-01-10T11:00:00Z',
          incidentes_relacionados: 5
        },
        {
          id: '2',
          numero_problema: 'PRB-2024-000002',
          titulo: 'Lentidão Crônica na Rede',
          categoria: 'Redes',
          prioridade: 'medium',
          status: 'assigned',
          created_at: '2024-01-08T09:30:00Z',
          incidentes_relacionados: 3
        },
        {
          id: '3',
          numero_problema: 'PRB-2024-000003',
          titulo: 'Erro de Autenticação Recorrente',
          categoria: 'Segurança',
          prioridade: 'critical',
          status: 'new',
          created_at: '2024-01-15T07:00:00Z',
          incidentes_relacionados: 8
        }
      ]

      setProblems(mockProblems)

      // Simular dados de artigos de conhecimento
      const mockKnowledgeArticles: KnowledgeArticle[] = [
        {
          id: '1',
          numero_artigo: 'KB-2024-000001',
          titulo: 'Como Resetar Senha de Usuário',
          tipo_artigo: 'how_to',
          visualizacoes: 156,
          status: 'published',
          created_at: '2024-01-05T10:00:00Z'
        },
        {
          id: '2',
          numero_artigo: 'KB-2024-000002',
          titulo: 'Troubleshooting: Email Não Chegando',
          tipo_artigo: 'troubleshooting',
          visualizacoes: 89,
          status: 'published',
          created_at: '2024-01-08T14:30:00Z'
        },
        {
          id: '3',
          numero_artigo: 'KB-2024-000003',
          titulo: 'Configuração de VPN',
          tipo_artigo: 'reference',
          visualizacoes: 234,
          status: 'published',
          created_at: '2024-01-12T16:45:00Z'
        }
      ]

      setKnowledgeArticles(mockKnowledgeArticles)

      // Dados para gráficos
      const mockChartData = [
        { name: 'Jan', Incidentes: 45, Mudanças: 12, Problemas: 8, 'Artigos KB': 15 },
        { name: 'Fev', Incidentes: 52, Mudanças: 15, Problemas: 10, 'Artigos KB': 18 },
        { name: 'Mar', Incidentes: 48, Mudanças: 18, Problemas: 12, 'Artigos KB': 22 },
        { name: 'Abr', Incidentes: 55, Mudanças: 20, Problemas: 15, 'Artigos KB': 25 },
        { name: 'Mai', Incidentes: 42, Mudanças: 16, Problemas: 9, 'Artigos KB': 20 },
        { name: 'Jun', Incidentes: 38, Mudanças: 14, Problemas: 7, 'Artigos KB': 17 }
      ]

      setChartData(mockChartData)

    } catch (error) {
      console.error('❌ Erro ao carregar dados ITIL:', error)
      setError('Erro ao carregar dados ITIL')
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'default'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle color="success" />
      case 'warning': return <Warning color="warning" />
      case 'critical': return <Error color="error" />
      default: return <Info color="info" />
    }
  }

  const getIncidentStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Pending color="warning" />
      case 'in_progress': return <PlayArrow color="info" />
      case 'resolved': return <CheckCircle color="success" />
      case 'closed': return <CheckCircleOutline color="success" />
      default: return <Info color="default" />
    }
  }

  const getChangeStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit color="default" />
      case 'submitted': return <Pending color="warning" />
      case 'approved': return <CheckCircle color="success" />
      case 'in_progress': return <PlayArrow color="info" />
      case 'completed': return <CheckCircleOutline color="success" />
      case 'failed': return <Cancel color="error" />
      default: return <Info color="default" />
    }
  }

  const getProblemStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Add color="default" />
      case 'assigned': return <Assignment color="info" />
      case 'in_progress': return <PlayArrow color="warning" />
      case 'resolved': return <CheckCircle color="success" />
      case 'closed': return <CheckCircleOutline color="success" />
      default: return <Info color="default" />
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const exportITILReport = () => {
    const content = `
      Relatório ITIL 4 - MILAPP
      Período: Últimos ${selectedPeriod} dias
      Data: ${new Date().toLocaleDateString()}
      
      MÉTRICAS ITIL:
      ${metrics.map(metric => 
        `${metric.category}: ${metric.value}${metric.unit} (Meta: ${metric.target}${metric.unit}) - ${metric.status}`
      ).join('\n')}
      
      INCIDENTES: ${incidents.length}
      MUDANÇAS: ${changes.length}
      PROBLEMAS: ${problems.length}
      ARTIGOS KB: ${knowledgeArticles.length}
    `
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `itil-report-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setSuccess('Relatório ITIL exportado com sucesso')
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
          Dashboard ITIL 4 - MILAPP
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
          
          <Tooltip title="Alternar visualização">
            <IconButton onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
              {viewMode === 'grid' ? <ViewList /> : <ViewModule />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Atualizar dados">
            <IconButton onClick={loadITILData}>
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportITILReport}
          >
            Exportar Relatório
          </Button>
        </Box>
      </Box>

      {/* Métricas ITIL */}
      <Grid container spacing={3} mb={3}>
        {metrics.map((metric) => (
          <Grid item xs={12} sm={6} md={4} key={metric.category}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {metric.icon}
                    <Typography variant="h6">
                      {metric.category}
                    </Typography>
                  </Box>
                  <Chip
                    label={metric.status}
                    color={getStatusColor(metric.status) as any}
                    size="small"
                  />
                </Box>
                
                <Box mb={2}>
                  <LinearProgress
                    variant="determinate"
                    value={(metric.value / metric.target) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                    color={getStatusColor(metric.status) as any}
                  />
                  <Typography variant="body2" color="textSecondary" mt={0.5}>
                    {metric.value}{metric.unit} / {metric.target}{metric.unit}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="textSecondary">
                  {metric.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Visão Geral" icon={<Dashboard />} />
          <Tab label="Incidentes" icon={<BugReport />} />
          <Tab label="Mudanças" icon={<ChangeCircle />} />
          <Tab label="Problemas" icon={<Assignment />} />
          <Tab label="Conhecimento" icon={<Book />} />
          <Tab label="Tendências" icon={<TrendingUp />} />
        </Tabs>
      </Box>

      {/* Tab Visão Geral */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resumo ITIL 4
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="error.main">
                        {incidents.filter(i => i.status === 'open' || i.status === 'in_progress').length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Incidentes Ativos
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {changes.filter(c => c.status === 'in_progress').length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Mudanças em Andamento
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main">
                        {problems.filter(p => p.status === 'new' || p.status === 'assigned').length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Problemas Abertos
                      </Typography>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {knowledgeArticles.length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Artigos KB
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Alertas Críticos
                </Typography>
                
                <List>
                  {incidents.filter(i => i.prioridade === 'critical').map((incident) => (
                    <ListItem key={incident.id} divider>
                      <ListItemIcon>
                        <Error color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={incident.titulo}
                        secondary={`${incident.numero_incidente} - ${formatDate(incident.created_at)}`}
                      />
                    </ListItem>
                  ))}
                  
                  {problems.filter(p => p.prioridade === 'critical').map((problem) => (
                    <ListItem key={problem.id} divider>
                      <ListItemIcon>
                        <Warning color="warning" />
                      </ListItemIcon>
                      <ListItemText
                        primary={problem.titulo}
                        secondary={`${problem.numero_problema} - ${problem.incidentes_relacionados} incidentes`}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab Incidentes */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Gestão de Incidentes
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Número</TableCell>
                    <TableCell>Título</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell>Prioridade</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Tempo Resolução</TableCell>
                    <TableCell>SLA</TableCell>
                    <TableCell>Data</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incidents.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {incident.numero_incidente}
                        </Typography>
                      </TableCell>
                      <TableCell>{incident.titulo}</TableCell>
                      <TableCell>
                        <Chip label={incident.categoria} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={incident.prioridade}
                          size="small"
                          color={getPriorityColor(incident.prioridade) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getIncidentStatusIcon(incident.status)}
                          <Typography variant="body2">
                            {incident.status.replace('_', ' ')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {incident.tempo_resolucao_minutos > 0 
                          ? `${Math.floor(incident.tempo_resolucao_minutos / 60)}h ${incident.tempo_resolucao_minutos % 60}m`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {incident.sla_violado ? (
                          <Chip label="Violado" size="small" color="error" />
                        ) : (
                          <Chip label="OK" size="small" color="success" />
                        )}
                      </TableCell>
                      <TableCell>{formatDate(incident.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Tab Mudanças */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Gestão de Mudanças
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>RFC</TableCell>
                    <TableCell>Título</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Risco</TableCell>
                    <TableCell>Data</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {changes.map((change) => (
                    <TableRow key={change.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {change.numero_rfc}
                        </Typography>
                      </TableCell>
                      <TableCell>{change.titulo}</TableCell>
                      <TableCell>
                        <Chip 
                          label={change.categoria} 
                          size="small"
                          color={change.categoria === 'emergency' ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getChangeStatusIcon(change.status)}
                          <Typography variant="body2">
                            {change.status.replace('_', ' ')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={change.risco}
                          size="small"
                          color={getPriorityColor(change.risco) as any}
                        />
                      </TableCell>
                      <TableCell>{formatDate(change.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Tab Problemas */}
      {activeTab === 3 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Gestão de Problemas
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Número</TableCell>
                    <TableCell>Título</TableCell>
                    <TableCell>Categoria</TableCell>
                    <TableCell>Prioridade</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Incidentes</TableCell>
                    <TableCell>Data</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {problems.map((problem) => (
                    <TableRow key={problem.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {problem.numero_problema}
                        </Typography>
                      </TableCell>
                      <TableCell>{problem.titulo}</TableCell>
                      <TableCell>
                        <Chip label={problem.categoria} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={problem.prioridade}
                          size="small"
                          color={getPriorityColor(problem.prioridade) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getProblemStatusIcon(problem.status)}
                          <Typography variant="body2">
                            {problem.status.replace('_', ' ')}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Badge badgeContent={problem.incidentes_relacionados} color="primary">
                          <BugReport />
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(problem.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Tab Conhecimento */}
      {activeTab === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Gestão de Conhecimento
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Número</TableCell>
                    <TableCell>Título</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Visualizações</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Data</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {knowledgeArticles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {article.numero_artigo}
                        </Typography>
                      </TableCell>
                      <TableCell>{article.titulo}</TableCell>
                      <TableCell>
                        <Chip 
                          label={article.tipo_artigo.replace('_', ' ')} 
                          size="small"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Visibility />
                          <Typography variant="body2">
                            {article.visualizacoes}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={article.status}
                          size="small"
                          color={article.status === 'published' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>{formatDate(article.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Tab Tendências */}
      {activeTab === 5 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Tendências ITIL 4 (Últimos 6 meses)
            </Typography>
            
            <DynamicChart
              data={chartData}
              title="Evolução dos Processos ITIL"
              description="Tendências de incidentes, mudanças, problemas e artigos de conhecimento"
              height={400}
            />
          </CardContent>
        </Card>
      )}

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={!!success}
        autoHideDuration={4000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  )
} 