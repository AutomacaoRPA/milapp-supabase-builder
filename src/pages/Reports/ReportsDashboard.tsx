import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Badge,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup
} from '@mui/material'
import {
  Assessment,
  QueryStats,
  Send,
  Download,
  Refresh,
  ExpandMore,
  CheckCircle,
  Warning,
  Error,
  Info,
  SmartToy,
  Person,
  Timeline,
  AutoAwesome,
  PlayArrow,
  Stop,
  History,
  Settings,
  Help,
  Email,
  WhatsApp,
  Telegram,
  PictureAsPdf,
  TableChart,
  Analytics,
  TrendingUp,
  Insights,
  DataUsage,
  Schedule,
  Save,
  Share
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'
import { collaborativeAIService } from '../../services/ai/CollaborativeAIService'
import ReactMarkdown from 'react-markdown'

interface ReportCategory {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  color: string
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  category: string
  prompt: string
  sql: string
}

interface DeliveryChannel {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  description: string
}

export function ReportsDashboard() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Estados para consulta IA
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiResponse, setAiResponse] = useState<any>(null)
  const [showAiDialog, setShowAiDialog] = useState(false)
  
  // Estados para entrega
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false)
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [deliveryFormat, setDeliveryFormat] = useState('pdf')
  const [deliveryRecipients, setDeliveryRecipients] = useState('')
  
  // Estados para relatórios
  const [activeTab, setActiveTab] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [reportData, setReportData] = useState<any>(null)
  const [savedReports, setSavedReports] = useState<any[]>([])

  // Categorias de relatórios
  const reportCategories: ReportCategory[] = [
    {
      id: 'solicitacoes',
      name: 'Solicitações',
      description: 'Relatórios de solicitações e tickets',
      icon: <Assessment />,
      color: '#1976d2'
    },
    {
      id: 'sla',
      name: 'SLA',
      description: 'Análise de tempo de atendimento',
      icon: <Timeline />,
      color: '#388e3c'
    },
    {
      id: 'fluxos',
      name: 'Fluxos',
      description: 'Execução de workflows e processos',
      icon: <DataUsage />,
      color: '#f57c00'
    },
    {
      id: 'ia',
      name: 'IA',
      description: 'Interações e uso de inteligência artificial',
      icon: <SmartToy />,
      color: '#7b1fa2'
    },
    {
      id: 'nc',
      name: 'Não Conformidades',
      description: 'NCs e planos de ação',
      icon: <Warning />,
      color: '#d32f2f'
    },
    {
      id: 'usuarios',
      name: 'Usuários',
      description: 'Atividades e perfis de usuários',
      icon: <Person />,
      color: '#5d4037'
    },
    {
      id: 'seguranca',
      name: 'Segurança',
      description: 'Logs de segurança e auditoria',
      icon: <Info />,
      color: '#455a64'
    },
    {
      id: 'projetos',
      name: 'Projetos',
      description: 'Status e progresso de projetos',
      icon: <TrendingUp />,
      color: '#2e7d32'
    }
  ]

  // Canais de entrega
  const deliveryChannels: DeliveryChannel[] = [
    {
      id: 'email',
      name: 'Email',
      icon: <Email />,
      color: '#1976d2',
      description: 'Enviar por email'
    },
    {
      id: 'teams',
      name: 'Microsoft Teams',
      icon: <Telegram />,
      color: '#7b1fa2',
      description: 'Enviar para canal do Teams'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: <WhatsApp />,
      color: '#4caf50',
      description: 'Enviar por WhatsApp'
    },
    {
      id: 'pdf',
      name: 'PDF',
      icon: <PictureAsPdf />,
      color: '#f44336',
      description: 'Baixar como PDF'
    },
    {
      id: 'csv',
      name: 'CSV',
      icon: <TableChart />,
      color: '#ff9800',
      description: 'Baixar como CSV'
    }
  ]

  // Templates de relatórios
  const reportTemplates: ReportTemplate[] = [
    {
      id: 'solicitacoes_abertas',
      name: 'Solicitações Abertas',
      description: 'Todas as solicitações em aberto por setor',
      category: 'solicitacoes',
      prompt: 'Me traga todas as solicitações abertas da Qualidade nos últimos 30 dias, separadas por status',
      sql: 'SELECT * FROM view_relatorio_solicitacoes WHERE status != \'completed\' AND created_at >= NOW() - INTERVAL \'30 days\''
    },
    {
      id: 'tempo_medio_sla',
      name: 'Tempo Médio de SLA',
      description: 'Tempo médio de resolução por setor',
      category: 'sla',
      prompt: 'Qual o tempo médio de resolução por setor no último trimestre?',
      sql: 'SELECT setor, AVG(tempo_real_horas) as tempo_medio FROM view_relatorio_sla WHERE created_at >= NOW() - INTERVAL \'90 days\' GROUP BY setor'
    },
    {
      id: 'fluxos_falharam',
      name: 'Fluxos que Falharam',
      description: 'Fluxos com falhas nos últimos 15 dias',
      category: 'fluxos',
      prompt: 'Qual fluxo teve mais falhas nos últimos 15 dias?',
      sql: 'SELECT nome_fluxo, COUNT(*) as falhas FROM view_relatorio_fluxos WHERE tarefas_falharam > 0 AND created_at >= NOW() - INTERVAL \'15 days\' GROUP BY nome_fluxo ORDER BY falhas DESC'
    },
    {
      id: 'ncs_reincidencia',
      name: 'NCs com Reincidência',
      description: 'Não conformidades com maior reincidência',
      category: 'nc',
      prompt: 'Me envie um relatório com as 5 NCs com maior reincidência',
      sql: 'SELECT titulo, setor, COUNT(*) as reincidencias FROM view_relatorio_nc GROUP BY titulo, setor ORDER BY reincidencias DESC LIMIT 5'
    }
  ]

  useEffect(() => {
    loadSavedReports()
  }, [])

  const loadSavedReports = async () => {
    try {
      const { data, error } = await supabase
        .from('relatorios_salvos')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      setSavedReports(data || [])
    } catch (error) {
      console.error('❌ Erro ao carregar relatórios salvos:', error)
    }
  }

  const executeAIQuery = async () => {
    if (!aiPrompt.trim()) {
      setError('Digite uma pergunta sobre seus dados')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Simular execução de query IA
      const mockResponse = {
        success: true,
        data: [
          { setor: 'Qualidade', solicitacoes: 15, tempo_medio: 8.5 },
          { setor: 'TI', solicitacoes: 23, tempo_medio: 12.3 },
          { setor: 'RH', solicitacoes: 8, tempo_medio: 6.2 }
        ],
        sql: 'SELECT setor, COUNT(*) as solicitacoes, AVG(tempo_horas) as tempo_medio FROM view_relatorio_solicitacoes WHERE created_at >= NOW() - INTERVAL \'30 days\' GROUP BY setor',
        explanation: `Baseado na sua pergunta "${aiPrompt}", analisei os dados dos últimos 30 dias. O setor de TI teve mais solicitações (23), mas o setor de Qualidade tem o melhor tempo médio de resolução (8.5 horas). Recomendo investigar por que TI está demorando mais para resolver as solicitações.`
      }

      setAiResponse(mockResponse)
      setShowAiDialog(true)

    } catch (error) {
      console.error('❌ Erro ao executar query IA:', error)
      setError('Erro ao processar consulta IA')
    } finally {
      setLoading(false)
    }
  }

  const executeTemplateReport = async (template: ReportTemplate) => {
    try {
      setLoading(true)
      setError(null)

      // Simular execução de relatório template
      const mockData = {
        title: template.name,
        description: template.description,
        data: [
          { coluna1: 'Dados', coluna2: 'Simulados' },
          { coluna1: 'Para', coluna2: 'Demonstração' }
        ],
        sql: template.sql,
        explanation: `Relatório "${template.name}" executado com sucesso. Este é um exemplo de como os dados seriam apresentados.`
      }

      setReportData(mockData)
      setActiveTab(1) // Ir para aba de resultados

    } catch (error) {
      console.error('❌ Erro ao executar relatório:', error)
      setError('Erro ao executar relatório')
    } finally {
      setLoading(false)
    }
  }

  const handleDeliveryChannels = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    )
  }

  const sendReport = async () => {
    if (selectedChannels.length === 0) {
      setError('Selecione pelo menos um canal de entrega')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Simular envio
      await new Promise(resolve => setTimeout(resolve, 2000))

      setSuccess('Relatório enviado com sucesso!')
      setShowDeliveryDialog(false)
      setSelectedChannels([])

    } catch (error) {
      console.error('❌ Erro ao enviar relatório:', error)
      setError('Erro ao enviar relatório')
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = (format: string) => {
    // Simular download
    const content = format === 'csv' 
      ? 'coluna1,coluna2\nvalor1,valor2\nvalor3,valor4'
      : 'PDF content would be generated here'
    
    const blob = new Blob([content], { 
      type: format === 'csv' ? 'text/csv' : 'application/pdf' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${Date.now()}.${format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const saveReport = async () => {
    if (!aiResponse && !reportData) {
      setError('Nenhum relatório para salvar')
      return
    }

    try {
      setLoading(true)

      const reportToSave = aiResponse || reportData
      
      const { error } = await supabase
        .from('relatorios_salvos')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          project_id: 'default-project-id',
          nome: `Relatório ${new Date().toLocaleDateString()}`,
          descricao: 'Relatório gerado via IA',
          categoria: 'geral',
          prompt_original: aiPrompt || 'Relatório template',
          sql_generated: reportToSave.sql || '',
          parametros: {}
        })

      if (error) throw error

      setSuccess('Relatório salvo com sucesso!')
      loadSavedReports()

    } catch (error) {
      console.error('❌ Erro ao salvar relatório:', error)
      setError('Erro ao salvar relatório')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
          Relatórios Inteligentes
        </Typography>
        
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<History />}
            onClick={() => setActiveTab(2)}
          >
            Relatórios Salvos
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AutoAwesome />}
            onClick={() => setShowAiDialog(true)}
          >
            Consulta IA
          </Button>
        </Box>
      </Box>

      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Categorias" icon={<Assessment />} />
          <Tab label="Resultados" icon={<Analytics />} />
          <Tab label="Salvos" icon={<Save />} />
        </Tabs>
      </Box>

      {/* Tab Categorias */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          {/* Consulta IA */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <SmartToy sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Consulta Inteligente
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Faça perguntas em linguagem natural sobre seus dados e receba análises inteligentes.
                </Typography>
                
                <Box display="flex" gap={2} alignItems="flex-end">
                  <TextField
                    label="Pergunte sobre seus dados..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Ex: Quais foram os setores com mais fluxos concluídos no último mês?"
                  />
                  <Button
                    variant="contained"
                    onClick={executeAIQuery}
                    disabled={loading || !aiPrompt.trim()}
                  >
                    {loading ? <CircularProgress size={20} /> : 'Consultar'}
                  </Button>
                </Box>

                <Box mt={2}>
                  <Typography variant="caption" color="textSecondary">
                    Sugestões: "Me mostre onde estamos estourando SLA", "Quais NCs têm maior reincidência?"
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Categorias de Relatórios */}
          {reportCategories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                }}
                onClick={() => setSelectedCategory(category.id)}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Box 
                      sx={{ 
                        color: category.color,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {category.icon}
                    </Box>
                    <Typography variant="h6">
                      {category.name}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {category.description}
                  </Typography>

                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCategory(category.id)
                    }}
                  >
                    Ver Relatórios
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Templates por Categoria */}
          {selectedCategory && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Templates - {reportCategories.find(c => c.id === selectedCategory)?.name}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {reportTemplates
                      .filter(template => template.category === selectedCategory)
                      .map((template) => (
                        <Grid item xs={12} sm={6} md={4} key={template.id}>
                          <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              {template.name}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" paragraph>
                              {template.description}
                            </Typography>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => executeTemplateReport(template)}
                              disabled={loading}
                            >
                              Executar
                            </Button>
                          </Paper>
                        </Grid>
                      ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Tab Resultados */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          {reportData && (
            <>
              {/* Resultado do Relatório */}
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6">
                        {reportData.title}
                      </Typography>
                      
                      <Box display="flex" gap={1}>
                        <Tooltip title="Salvar Relatório">
                          <IconButton onClick={saveReport} disabled={loading}>
                            <Save />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Compartilhar">
                          <IconButton onClick={() => setShowDeliveryDialog(true)}>
                            <Share />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Typography variant="body2" color="textSecondary" paragraph>
                      {reportData.description}
                    </Typography>

                    {/* Dados do Relatório */}
                    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Dados:
                      </Typography>
                      <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                        <pre style={{ margin: 0, fontSize: '12px' }}>
                          {JSON.stringify(reportData.data, null, 2)}
                        </pre>
                      </Box>
                    </Paper>

                    {/* Explicação IA */}
                    {reportData.explanation && (
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50' }}>
                        <Typography variant="subtitle2" gutterBottom>
                          <Insights sx={{ mr: 1, verticalAlign: 'middle' }} />
                          Análise IA:
                        </Typography>
                        <Typography variant="body2">
                          {reportData.explanation}
                        </Typography>
                      </Paper>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              {/* Ações */}
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Ações
                    </Typography>
                    
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Button
                        variant="outlined"
                        startIcon={<PictureAsPdf />}
                        onClick={() => downloadReport('pdf')}
                        fullWidth
                      >
                        Baixar PDF
                      </Button>
                      
                      <Button
                        variant="outlined"
                        startIcon={<TableChart />}
                        onClick={() => downloadReport('csv')}
                        fullWidth
                      >
                        Baixar CSV
                      </Button>
                      
                      <Button
                        variant="contained"
                        startIcon={<Send />}
                        onClick={() => setShowDeliveryDialog(true)}
                        fullWidth
                      >
                        Enviar por...
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          {!reportData && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box textAlign="center" py={4}>
                    <Analytics sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Nenhum Relatório Executado
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Execute um relatório ou faça uma consulta IA para ver os resultados aqui.
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Tab Relatórios Salvos */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Meus Relatórios Salvos
                </Typography>
                
                {savedReports.length > 0 ? (
                  <List>
                    {savedReports.map((report) => (
                      <ListItem key={report.id} divider>
                        <ListItemIcon>
                          <Save color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={report.nome}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                {report.descricao}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Criado em: {new Date(report.created_at).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                        <Box display="flex" gap={1}>
                          <Button size="small" variant="outlined">
                            Executar
                          </Button>
                          <Button size="small" variant="outlined">
                            Editar
                          </Button>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Save sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body2" color="textSecondary">
                      Nenhum relatório salvo ainda. Execute um relatório e salve-o para reutilização.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Diálogo Consulta IA */}
      <Dialog open={showAiDialog} onClose={() => setShowAiDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SmartToy />
            Consulta Inteligente
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {!aiResponse ? (
            <Box>
              <Typography variant="body2" color="textSecondary" paragraph>
                Digite sua pergunta em linguagem natural sobre os dados do MILAPP.
              </Typography>
              
              <TextField
                label="Sua pergunta..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                fullWidth
                multiline
                rows={4}
                placeholder="Ex: Quais foram os setores com mais fluxos concluídos no último mês?"
              />
              
              <Box mt={2}>
                <Typography variant="caption" color="textSecondary">
                  Exemplos: "Me mostre onde estamos estourando SLA", "Quais NCs têm maior reincidência?"
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                Resultado da Consulta
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  SQL Gerado:
                </Typography>
                <Box sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1, fontFamily: 'monospace', fontSize: '12px' }}>
                  {aiResponse.sql}
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Dados:
                </Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                  <pre style={{ margin: 0, fontSize: '12px' }}>
                    {JSON.stringify(aiResponse.data, null, 2)}
                  </pre>
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.50' }}>
                <Typography variant="subtitle2" gutterBottom>
                  <Insights sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Análise IA:
                </Typography>
                <Typography variant="body2">
                  {aiResponse.explanation}
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowAiDialog(false)}>
            Fechar
          </Button>
          {!aiResponse && (
            <Button
              onClick={executeAIQuery}
              variant="contained"
              disabled={loading || !aiPrompt.trim()}
            >
              {loading ? <CircularProgress size={20} /> : 'Consultar'}
            </Button>
          )}
          {aiResponse && (
            <>
              <Button onClick={saveReport}>
                Salvar
              </Button>
              <Button
                onClick={() => {
                  setReportData(aiResponse)
                  setShowAiDialog(false)
                  setActiveTab(1)
                }}
                variant="contained"
              >
                Ver Detalhes
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Diálogo Entrega */}
      <Dialog open={showDeliveryDialog} onClose={() => setShowDeliveryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Send />
            Enviar Relatório
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            Escolha como deseja receber este relatório:
          </Typography>

          <FormControl component="fieldset" fullWidth>
            <FormGroup>
              {deliveryChannels.map((channel) => (
                <FormControlLabel
                  key={channel.id}
                  control={
                    <Checkbox
                      checked={selectedChannels.includes(channel.id)}
                      onChange={() => handleDeliveryChannels(channel.id)}
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ color: channel.color }}>
                        {channel.icon}
                      </Box>
                      <Box>
                        <Typography variant="body2">{channel.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {channel.description}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </FormControl>

          <Divider sx={{ my: 2 }} />

          <FormControl fullWidth>
            <InputLabel>Formato</InputLabel>
            <Select
              value={deliveryFormat}
              onChange={(e) => setDeliveryFormat(e.target.value)}
              label="Formato"
            >
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="markdown">Markdown</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Destinatários (emails, números, etc.)"
            value={deliveryRecipients}
            onChange={(e) => setDeliveryRecipients(e.target.value)}
            fullWidth
            multiline
            rows={2}
            sx={{ mt: 2 }}
            placeholder="Ex: joao@empresa.com, +5511999999999, webhook-teams-url"
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowDeliveryDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={sendReport}
            variant="contained"
            disabled={loading || selectedChannels.length === 0}
          >
            {loading ? <CircularProgress size={20} /> : 'Enviar'}
          </Button>
        </DialogActions>
      </Dialog>

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