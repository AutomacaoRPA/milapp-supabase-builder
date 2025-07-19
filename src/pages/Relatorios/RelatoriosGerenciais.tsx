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
  TextField,
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
  Badge,
  Snackbar,
  CircularProgress,
  Switch,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material'
import {
  Assessment,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error,
  Info,
  Refresh,
  Download,
  FilterList,
  Settings,
  History,
  ExpandMore,
  MoreVert,
  Share,
  Bookmark,
  BookmarkBorder,
  Code,
  Description,
  FileDownload,
  PictureAsPdf,
  TableView,
  ShowChart,
  Notifications,
  NotificationsOff,
  AccessTime,
  CalendarToday,
  Group,
  Person,
  Business,
  Security,
  Speed,
  Visibility,
  AutoAwesome,
  Timeline,
  Analytics,
  Business as BusinessIcon,
  AttachMoney,
  People,
  Notifications as NotificationsIcon,
  Policy,
  Compliance,
  Build,
  Support,
  Storage,
  NetworkCheck,
  Computer,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Chat as ChatIcon,
  BugReport,
  Assignment,
  ChangeCircle,
  Book
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'
import { DynamicChart } from '../../components/Reports/DynamicChart'
import { RelatorioSendOptions } from '../../components/Reports/RelatorioSendOptions'

interface ReportData {
  id: string
  title: string
  type: string
  data: any[]
  summary: string
  insights: string[]
  recommendations: string[]
  generatedAt: string
}

interface ReportFilter {
  dateFrom: string
  dateTo: string
  department: string
  status: string
  priority: string
  category: string
}

export function RelatoriosGerenciais() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Estados de relatórios
  const [selectedReport, setSelectedReport] = useState<string>('')
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [filters, setFilters] = useState<ReportFilter>({
    dateFrom: '',
    dateTo: '',
    department: '',
    status: '',
    priority: '',
    category: ''
  })
  
  // Estados de IA
  const [aiAnalysis, setAiAnalysis] = useState<string>('')
  const [aiInsights, setAiInsights] = useState<string[]>([])
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([])
  const [analyzingWithAI, setAnalyzingWithAI] = useState(false)
  
  // Estados de UI
  const [filtersDialogOpen, setFiltersDialogOpen] = useState(false)
  const [aiAnalysisDialogOpen, setAiAnalysisDialogOpen] = useState(false)

  const reportTypes = [
    {
      id: 'solicitacoes',
      title: 'Relatório de Solicitações',
      icon: <Support />,
      description: 'Análise de solicitações por status, setor e tempo de resolução',
      color: '#1976d2'
    },
    {
      id: 'sla',
      title: 'Relatório de SLA',
      icon: <Speed />,
      description: 'Conformidade com SLAs por categoria e período',
      color: '#2e7d32'
    },
    {
      id: 'ia',
      title: 'Relatório de Interações IA',
      icon: <AutoAwesome />,
      description: 'Uso e eficácia das interações com IA',
      color: '#ed6c02'
    },
    {
      id: 'nc',
      title: 'Relatório de Não Conformidades',
      icon: <Warning />,
      description: 'NCs e POPs por reincidência e impacto',
      color: '#d32f2f'
    },
    {
      id: 'usuarios',
      title: 'Relatório de Usuários',
      icon: <People />,
      description: 'Atividade e acessos dos usuários',
      color: '#7b1fa2'
    },
    {
      id: 'seguranca',
      title: 'Relatório de Segurança',
      icon: <Security />,
      description: 'Logs de segurança e tentativas de acesso',
      color: '#c62828'
    },
    {
      id: 'projetos',
      title: 'Relatório de Projetos',
      icon: <Assignment />,
      description: 'Status e progresso dos projetos',
      color: '#1565c0'
    },
    {
      id: 'itil',
      title: 'Relatório ITIL 4',
      icon: <Policy />,
      description: 'Métricas completas dos processos ITIL',
      color: '#388e3c'
    }
  ]

  useEffect(() => {
    if (selectedReport) {
      generateReport()
    }
  }, [selectedReport, filters])

  const generateReport = async () => {
    try {
      setLoading(true)
      setError(null)

      // Simular geração de relatório baseado no tipo
      const mockData = await generateMockReportData(selectedReport)
      setReportData(mockData)

    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error)
      setError('Erro ao gerar relatório')
    } finally {
      setLoading(false)
    }
  }

  const generateMockReportData = async (reportType: string): Promise<ReportData> => {
    // Simular dados baseados no tipo de relatório
    let data: any[] = []
    let summary = ''
    let insights: string[] = []
    let recommendations: string[] = []

    switch (reportType) {
      case 'solicitacoes':
        data = [
          { setor: 'TI', total: 45, abertas: 12, resolvidas: 33, tempo_medio: '2.5h' },
          { setor: 'RH', total: 28, abertas: 8, resolvidas: 20, tempo_medio: '1.8h' },
          { setor: 'Financeiro', total: 32, abertas: 15, resolvidas: 17, tempo_medio: '3.2h' },
          { setor: 'Marketing', total: 19, abertas: 5, resolvidas: 14, tempo_medio: '1.5h' }
        ]
        summary = 'Total de 124 solicitações processadas no período'
        insights = [
          'Setor Financeiro tem maior tempo médio de resolução',
          'TI concentra 36% das solicitações',
          'Taxa de resolução geral de 67%'
        ]
        recommendations = [
          'Implementar automação para setor Financeiro',
          'Criar FAQ para reduzir solicitações de TI',
          'Estabelecer SLA específico por setor'
        ]
        break

      case 'sla':
        data = [
          { categoria: 'Crítico', sla: '1h', atendido: 95, violado: 5, percentual: 95 },
          { categoria: 'Alto', sla: '4h', atendido: 88, violado: 12, percentual: 88 },
          { categoria: 'Médio', sla: '8h', atendido: 92, violado: 8, percentual: 92 },
          { categoria: 'Baixo', sla: '24h', atendido: 98, violado: 2, percentual: 98 }
        ]
        summary = 'Conformidade geral de SLA: 93.25%'
        insights = [
          'Categoria Alto tem maior taxa de violação',
          'Categoria Baixo apresenta melhor performance',
          '5 violações críticas no período'
        ]
        recommendations = [
          'Revisar capacidade para categoria Alto',
          'Implementar alertas proativos',
          'Treinar equipe em incidentes críticos'
        ]
        break

      case 'ia':
        data = [
          { tipo: 'Classificação', total: 156, sucesso: 142, taxa: 91 },
          { tipo: 'Sugestões', total: 89, sucesso: 78, taxa: 88 },
          { tipo: 'Análise', total: 67, sucesso: 61, taxa: 91 },
          { tipo: 'Relatórios', total: 34, sucesso: 32, taxa: 94 }
        ]
        summary = 'Taxa média de sucesso da IA: 91%'
        insights = [
          'IA tem melhor performance em relatórios',
          'Sugestões precisam de refinamento',
          'Total de 346 interações no período'
        ]
        recommendations = [
          'Treinar modelo em sugestões',
          'Expandir uso para mais processos',
          'Implementar feedback loop'
        ]
        break

      case 'nc':
        data = [
          { tipo: 'Processo', quantidade: 8, reincidencia: 3, impacto: 'Alto' },
          { tipo: 'Sistema', quantidade: 12, reincidencia: 5, impacto: 'Médio' },
          { tipo: 'Documentação', quantidade: 6, reincidencia: 2, impacto: 'Baixo' },
          { tipo: 'Treinamento', quantidade: 4, reincidencia: 1, impacto: 'Médio' }
        ]
        summary = '30 não conformidades identificadas'
        insights = [
          'Sistema tem maior número de NCs',
          'Processo tem maior reincidência',
          'Impacto alto em 27% dos casos'
        ]
        recommendations = [
          'Priorizar correção de NCs de sistema',
          'Revisar processos com reincidência',
          'Implementar auditoria preventiva'
        ]
        break

      case 'usuarios':
        data = [
          { departamento: 'TI', usuarios: 25, ativos: 23, inativos: 2, ultimo_acesso: '2h' },
          { departamento: 'RH', usuarios: 18, ativos: 17, inativos: 1, ultimo_acesso: '1h' },
          { departamento: 'Financeiro', usuarios: 32, ativos: 30, inativos: 2, ultimo_acesso: '30min' },
          { departamento: 'Marketing', usuarios: 15, ativos: 14, inativos: 1, ultimo_acesso: '4h' }
        ]
        summary = '90 usuários ativos de 95 total'
        insights = [
          'Taxa de atividade de 94.7%',
          'Financeiro tem mais usuários',
          'Marketing tem menor atividade'
        ]
        recommendations = [
          'Investigar inatividade do Marketing',
          'Implementar política de senhas',
          'Revisar permissões por departamento'
        ]
        break

      case 'seguranca':
        data = [
          { evento: 'Login', total: 245, sucesso: 238, falha: 7, risco: 'Baixo' },
          { evento: '2FA', total: 156, sucesso: 152, falha: 4, risco: 'Baixo' },
          { evento: 'Acesso Negado', total: 12, sucesso: 0, falha: 12, risco: 'Médio' },
          { evento: 'Tentativa Suspeita', total: 3, sucesso: 0, falha: 3, risco: 'Alto' }
        ]
        summary = '416 eventos de segurança registrados'
        insights = [
          'Taxa de sucesso de login: 97.1%',
          '3 tentativas suspeitas bloqueadas',
          '2FA ativo em 63.7% dos logins'
        ]
        recommendations = [
          'Investigar tentativas suspeitas',
          'Aumentar adoção de 2FA',
          'Implementar monitoramento contínuo'
        ]
        break

      case 'projetos':
        data = [
          { projeto: 'Migração Cloud', status: 'Em Andamento', progresso: 75, prazo: '15 dias' },
          { projeto: 'Automação RPA', status: 'Concluído', progresso: 100, prazo: 'Concluído' },
          { projeto: 'Segurança Zero Trust', status: 'Planejado', progresso: 25, prazo: '45 dias' },
          { projeto: 'Modernização ERP', status: 'Em Andamento', progresso: 60, prazo: '30 dias' }
        ]
        summary = '4 projetos ativos, 1 concluído'
        insights = [
          '75% dos projetos em andamento',
          'Migração Cloud próxima do fim',
          'Segurança Zero Trust em atraso'
        ]
        recommendations = [
          'Acelerar projeto Zero Trust',
          'Revisar cronograma ERP',
          'Preparar documentação Cloud'
        ]
        break

      case 'itil':
        data = [
          { processo: 'Incident Management', sla: 95.2, tempo_medio: '2.3h', incidentes: 45 },
          { processo: 'Change Management', sla: 92.8, tempo_medio: '3.1h', mudancas: 23 },
          { processo: 'Problem Management', sla: 88.5, tempo_medio: '5.2h', problemas: 12 },
          { processo: 'Knowledge Management', sla: 96.1, tempo_medio: '1.8h', artigos: 67 }
        ]
        summary = 'Conformidade ITIL 4: 93.15%'
        insights = [
          'Knowledge Management tem melhor performance',
          'Problem Management precisa de melhoria',
          'Total de 147 itens processados'
        ]
        recommendations = [
          'Investir em Problem Management',
          'Expandir base de conhecimento',
          'Implementar melhoria contínua'
        ]
        break

      default:
        data = []
        summary = 'Relatório não disponível'
        insights = []
        recommendations = []
    }

    return {
      id: `report_${Date.now()}`,
      title: reportTypes.find(r => r.id === reportType)?.title || 'Relatório',
      type: reportType,
      data,
      summary,
      insights,
      recommendations,
      generatedAt: new Date().toISOString()
    }
  }

  const analyzeWithAI = async () => {
    if (!reportData) return

    try {
      setAnalyzingWithAI(true)
      setError(null)

      // Simular análise com IA
      await new Promise(resolve => setTimeout(resolve, 2000))

      const analysis = `
        ## Análise Executiva - ${reportData.title}

        **Resumo Executivo:**
        ${reportData.summary}

        **Principais Descobertas:**
        ${reportData.insights.map(insight => `• ${insight}`).join('\n')}

        **Recomendações Prioritárias:**
        ${reportData.recommendations.map(rec => `• ${rec}`).join('\n')}

        **Análise de Tendências:**
        Baseado nos dados apresentados, identifiquei padrões que indicam oportunidades de melhoria significativa. 
        A implementação das recomendações sugeridas pode resultar em uma melhoria de 15-25% nos indicadores de performance.

        **Próximos Passos:**
        1. Revisar e aprovar as recomendações
        2. Estabelecer cronograma de implementação
        3. Definir métricas de acompanhamento
        4. Implementar monitoramento contínuo
      `

      setAiAnalysis(analysis)
      setAiInsights(reportData.insights)
      setAiRecommendations(reportData.recommendations)
      setAiAnalysisDialogOpen(true)

    } catch (error) {
      console.error('❌ Erro na análise com IA:', error)
      setError('Erro na análise com IA')
    } finally {
      setAnalyzingWithAI(false)
    }
  }

  const exportReport = (format: string) => {
    if (!reportData) return

    try {
      let content = ''
      let filename = `relatorio-${reportData.type}-${Date.now()}.${format}`

      switch (format) {
        case 'csv':
          content = generateCSV(reportData.data)
          break
        case 'json':
          content = JSON.stringify(reportData, null, 2)
          break
        case 'markdown':
          content = generateMarkdown(reportData)
          break
        default:
          throw new Error('Formato não suportado')
      }

      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccess(`Relatório exportado em ${format.toUpperCase()} com sucesso!`)
    } catch (error) {
      console.error('❌ Erro ao exportar:', error)
      setError('Erro ao exportar relatório')
    }
  }

  const generateCSV = (data: any[]): string => {
    if (data.length === 0) return ''
    
    const columns = Object.keys(data[0])
    const csvRows = [
      columns.join(','),
      ...data.map(row => 
        columns.map(col => {
          const value = row[col]
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        }).join(',')
      )
    ]
    return csvRows.join('\n')
  }

  const generateMarkdown = (report: ReportData): string => {
    return `
# ${report.title}

**Gerado em:** ${new Date(report.generatedAt).toLocaleString()}

## Resumo
${report.summary}

## Dados
${report.data.map(row => 
  Object.entries(row).map(([key, value]) => `- **${key}:** ${value}`).join('\n')
).join('\n\n')}

## Insights
${report.insights.map(insight => `- ${insight}`).join('\n')}

## Recomendações
${report.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*Relatório gerado automaticamente pelo MILAPP*
    `
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
          Relatórios Gerenciais
        </Typography>
        
        <Box display="flex" gap={2}>
          <Tooltip title="Filtros Avançados">
            <IconButton onClick={() => setFiltersDialogOpen(true)}>
              <FilterList />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => exportReport('csv')}
            disabled={!reportData}
          >
            Exportar
          </Button>
        </Box>
      </Box>

      {/* Tipos de Relatório */}
      <Grid container spacing={3} mb={3}>
        {reportTypes.map((report) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={report.id}>
            <Card
              sx={{
                cursor: 'pointer',
                border: selectedReport === report.id ? 2 : 1,
                borderColor: selectedReport === report.id ? report.color : 'divider',
                '&:hover': { borderColor: report.color }
              }}
              onClick={() => setSelectedReport(report.id)}
            >
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Box sx={{ color: report.color, mb: 2 }}>
                  {report.icon}
                </Box>
                <Typography variant="h6" gutterBottom>
                  {report.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {report.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Relatório Selecionado */}
      {selectedReport && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                {reportTypes.find(r => r.id === selectedReport)?.title}
              </Typography>
              
              <Box display="flex" gap={2}>
                <Button
                  variant="outlined"
                  startIcon={<AutoAwesome />}
                  onClick={analyzeWithAI}
                  disabled={analyzingWithAI || !reportData}
                >
                  {analyzingWithAI ? 'Analisando...' : 'Analisar com IA'}
                </Button>
                
                <RelatorioSendOptions
                  reportData={reportData?.data || []}
                  reportTitle={reportData?.title || ''}
                />
              </Box>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
              </Box>
            ) : reportData ? (
              <>
                {/* Resumo */}
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Typography variant="subtitle1" color="primary" gutterBottom>
                    Resumo Executivo
                  </Typography>
                  <Typography variant="body1">
                    {reportData.summary}
                  </Typography>
                </Paper>

                {/* Dados */}
                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow>
                            {reportData.data.length > 0 && 
                              Object.keys(reportData.data[0]).map((column) => (
                                <TableCell key={column} sx={{ fontWeight: 'bold' }}>
                                  {column.replace(/_/g, ' ').toUpperCase()}
                                </TableCell>
                              ))
                            }
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {reportData.data.map((row, index) => (
                            <TableRow key={index}>
                              {Object.values(row).map((value, colIndex) => (
                                <TableCell key={colIndex}>
                                  {value}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Insights Principais
                      </Typography>
                      <List dense>
                        {reportData.insights.map((insight, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <Info color="primary" />
                            </ListItemIcon>
                            <ListItemText primary={insight} />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                    
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Recomendações
                      </Typography>
                      <List dense>
                        {reportData.recommendations.map((rec, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <CheckCircle color="success" />
                            </ListItemIcon>
                            <ListItemText primary={rec} />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Grid>
                </Grid>
              </>
            ) : (
              <Alert severity="info">
                Selecione um tipo de relatório para visualizar os dados
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de Filtros */}
      <Dialog
        open={filtersDialogOpen}
        onClose={() => setFiltersDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Filtros Avançados
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Data Inicial"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Data Final"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Departamento</InputLabel>
                <Select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  label="Departamento"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="ti">TI</MenuItem>
                  <MenuItem value="rh">RH</MenuItem>
                  <MenuItem value="financeiro">Financeiro</MenuItem>
                  <MenuItem value="marketing">Marketing</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="aberto">Aberto</MenuItem>
                  <MenuItem value="em_andamento">Em Andamento</MenuItem>
                  <MenuItem value="resolvido">Resolvido</MenuItem>
                  <MenuItem value="fechado">Fechado</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFiltersDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              setFiltersDialogOpen(false)
              generateReport()
            }}
          >
            Aplicar Filtros
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Análise IA */}
      <Dialog
        open={aiAnalysisDialogOpen}
        onClose={() => setAiAnalysisDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AutoAwesome color="primary" />
            Análise Executiva com IA
          </Box>
        </DialogTitle>
        <DialogContent>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              fontFamily: 'inherit',
              margin: 0,
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              {aiAnalysis}
            </pre>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiAnalysisDialogOpen(false)}>
            Fechar
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              exportReport('markdown')
              setAiAnalysisDialogOpen(false)
            }}
          >
            Exportar Análise
          </Button>
        </DialogActions>
      </Dialog>

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