import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Snackbar,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material'
import {
  Analytics,
  Send,
  Refresh,
  Save,
  Download,
  History,
  ExpandMore,
  CheckCircle,
  Warning,
  Error,
  Info,
  QueryStats,
  TableChart,
  BarChart,
  PieChart,
  Timeline,
  Assessment,
  Business,
  Build,
  Security,
  Speed,
  Visibility,
  MoreVert,
  Share,
  Bookmark,
  BookmarkBorder,
  Code,
  Description,
  FileDownload,
  PictureAsPdf,
  TableView,
  ShowChart
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'
import { reportsService } from '../../services/reports/ReportsService'
import { DynamicChart } from '../../components/Reports/DynamicChart'

interface QueryResult {
  data: any[]
  columns: string[]
  totalRows: number
  executionTime: number
  sqlGenerated: string
  explanation: string
  chartType?: string
  chartData?: any[]
}

interface SavedQuery {
  id: string
  name: string
  prompt: string
  sql_generated: string
  created_at: string
  last_executed: string
  execution_count: number
}

interface QueryLog {
  id: string
  user_id: string
  prompt_text: string
  generated_sql: string
  success: boolean
  result_preview: string
  execution_time: number
  created_at: string
}

export function RelatoriosCopilot() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Estados de entrada
  const [userPrompt, setUserPrompt] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('table')
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  
  // Estados de histórico
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [queryHistory, setQueryHistory] = useState<QueryLog[]>([])
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [savedQueriesDialogOpen, setSavedQueriesDialogOpen] = useState(false)
  
  // Estados de exportação
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState('csv')

  useEffect(() => {
    loadQueryHistory()
    loadSavedQueries()
  }, [])

  const loadQueryHistory = async () => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) return

      const { data, error } = await supabase
        .from('sql_execution_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setQueryHistory(data || [])
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error)
    }
  }

  const loadSavedQueries = async () => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) return

      const { data, error } = await supabase
        .from('relatorios_salvos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSavedQueries(data || [])
    } catch (error) {
      console.error('❌ Erro ao carregar queries salvas:', error)
    }
  }

  const executeQuery = async () => {
    if (!userPrompt.trim()) {
      setError('Por favor, insira uma pergunta para análise')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setQueryResult(null)

      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) throw new Error('Usuário não autenticado')

      // Executar consulta com IA
      const result = await reportsService.executeAIQuery(userPrompt, userId)

      setQueryResult(result)

      // Salvar log da execução
      await supabase
        .from('sql_execution_logs')
        .insert({
          user_id: userId,
          prompt_text: userPrompt,
          generated_sql: result.sqlGenerated,
          success: true,
          result_preview: JSON.stringify(result.data.slice(0, 5)),
          execution_time: result.executionTime
        })

      setSuccess('Consulta executada com sucesso!')

    } catch (error) {
      console.error('❌ Erro ao executar consulta:', error)
      setError('Erro ao executar consulta. Verifique se a pergunta está clara.')
      
      // Salvar log de erro
      try {
        const userId = (await supabase.auth.getUser()).data.user?.id
        if (userId) {
          await supabase
            .from('sql_execution_logs')
            .insert({
              user_id: userId,
              prompt_text: userPrompt,
              generated_sql: '',
              success: false,
              result_preview: error instanceof Error ? error.message : 'Erro desconhecido',
              execution_time: 0
            })
        }
      } catch (logError) {
        console.error('❌ Erro ao salvar log:', logError)
      }
    } finally {
      setLoading(false)
    }
  }

  const saveQuery = async () => {
    if (!queryResult || !userPrompt.trim()) return

    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) throw new Error('Usuário não autenticado')

      const queryName = prompt('Digite um nome para salvar esta consulta:')
      if (!queryName) return

      await supabase
        .from('relatorios_salvos')
        .insert({
          user_id: userId,
          nome: queryName,
          prompt_text: userPrompt,
          sql_gerado: queryResult.sqlGenerated,
          resultado: queryResult.data,
          explicacao: queryResult.explanation,
          tipo_visualizacao: selectedFormat
        })

      setSuccess('Consulta salva com sucesso!')
      loadSavedQueries()
    } catch (error) {
      console.error('❌ Erro ao salvar consulta:', error)
      setError('Erro ao salvar consulta')
    }
  }

  const loadSavedQuery = (savedQuery: SavedQuery) => {
    setUserPrompt(savedQuery.prompt)
    setSavedQueriesDialogOpen(false)
  }

  const exportResult = async (format: string) => {
    if (!queryResult) return

    try {
      setLoading(true)

      let content: string
      let filename: string
      let mimeType: string

      switch (format) {
        case 'csv':
          content = generateCSV(queryResult.data, queryResult.columns)
          filename = `relatorio-${Date.now()}.csv`
          mimeType = 'text/csv'
          break
        case 'json':
          content = JSON.stringify(queryResult.data, null, 2)
          filename = `relatorio-${Date.now()}.json`
          mimeType = 'application/json'
          break
        case 'markdown':
          content = generateMarkdown(queryResult)
          filename = `relatorio-${Date.now()}.md`
          mimeType = 'text/markdown'
          break
        default:
          throw new Error('Formato não suportado')
      }

      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccess(`Relatório exportado em ${format.toUpperCase()} com sucesso!`)
      setExportDialogOpen(false)
    } catch (error) {
      console.error('❌ Erro ao exportar:', error)
      setError('Erro ao exportar relatório')
    } finally {
      setLoading(false)
    }
  }

  const generateCSV = (data: any[], columns: string[]): string => {
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

  const generateMarkdown = (result: QueryResult): string => {
    return `
# Relatório Gerado por IA

## Consulta
${userPrompt}

## Explicação
${result.explanation}

## Resultados
Total de registros: ${result.totalRows}
Tempo de execução: ${result.executionTime}ms

## Dados
${result.data.map(row => 
  Object.entries(row).map(([key, value]) => `- **${key}:** ${value}`).join('\n')
).join('\n\n')}

## SQL Gerado
\`\`\`sql
${result.sqlGenerated}
\`\`\`

---
*Gerado em: ${new Date().toLocaleString()}*
    `
  }

  const getChartType = (data: any[], columns: string[]): string => {
    if (data.length === 0) return 'table'
    
    const numericColumns = columns.filter(col => 
      data.some(row => typeof row[col] === 'number')
    )
    
    if (numericColumns.length >= 2) return 'bar'
    if (data.length <= 10) return 'pie'
    return 'line'
  }

  const getSuggestedPrompts = () => [
    'Quais setores tiveram mais incidentes no último mês?',
    'Mostre o tempo médio de resolução por categoria de problema',
    'Quantas mudanças foram aprovadas vs rejeitadas?',
    'Quais são os 5 problemas mais recorrentes?',
    'Mostre a distribuição de usuários por departamento',
    'Qual foi o SLA compliance por mês nos últimos 6 meses?'
  ]

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          <Analytics sx={{ mr: 1, verticalAlign: 'middle' }} />
          Relatórios Dinâmicos com IA
        </Typography>
        
        <Box display="flex" gap={2}>
          <Tooltip title="Queries Salvas">
            <IconButton onClick={() => setSavedQueriesDialogOpen(true)}>
              <Bookmark />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Histórico de Consultas">
            <IconButton onClick={() => setHistoryDialogOpen(true)}>
              <History />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={() => setExportDialogOpen(true)}
            disabled={!queryResult}
          >
            Exportar
          </Button>
        </Box>
      </Box>

      {/* Sugestões de Prompts */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sugestões de Consultas
          </Typography>
          
          <Grid container spacing={1}>
            {getSuggestedPrompts().map((prompt, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Chip
                  label={prompt}
                  onClick={() => setUserPrompt(prompt)}
                  variant="outlined"
                  sx={{ cursor: 'pointer', mb: 1 }}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Entrada de Consulta */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Faça sua pergunta em linguagem natural
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descreva o que você quer analisar"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Ex: Quais setores tiveram mais incidentes no último mês e qual foi o tempo médio de resolução?"
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Formato de Visualização</InputLabel>
                <Select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  label="Formato de Visualização"
                >
                  <MenuItem value="table">Tabela</MenuItem>
                  <MenuItem value="chart">Gráfico</MenuItem>
                  <MenuItem value="summary">Resumo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                startIcon={<Send />}
                onClick={executeQuery}
                disabled={loading || !userPrompt.trim()}
                fullWidth
                sx={{ height: 56 }}
              >
                Analisar com IA
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Resultado da Consulta */}
      {queryResult && (
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                Resultado da Análise
              </Typography>
              
              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<Save />}
                  onClick={saveQuery}
                  size="small"
                >
                  Salvar
                </Button>
                
                <Chip
                  label={`${queryResult.totalRows} registros`}
                  size="small"
                  color="primary"
                />
                
                <Chip
                  label={`${queryResult.executionTime}ms`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Box>

            {/* Explicação */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle2" color="primary" gutterBottom>
                <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
                Explicação da IA
              </Typography>
              <Typography variant="body2">
                {queryResult.explanation}
              </Typography>
            </Paper>

            {/* Visualização */}
            {selectedFormat === 'table' && (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      {queryResult.columns.map((column) => (
                        <TableCell key={column} sx={{ fontWeight: 'bold' }}>
                          {column}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {queryResult.data.map((row, index) => (
                      <TableRow key={index}>
                        {queryResult.columns.map((column) => (
                          <TableCell key={column}>
                            {row[column]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {selectedFormat === 'chart' && queryResult.chartData && (
              <DynamicChart
                data={queryResult.chartData}
                title="Análise Visual dos Dados"
                description="Gráfico gerado automaticamente baseado nos dados"
                height={400}
              />
            )}

            {selectedFormat === 'summary' && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Resumo Executivo
                </Typography>
                <Typography variant="body1" paragraph>
                  A análise retornou <strong>{queryResult.totalRows}</strong> registros.
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Tempo de processamento: {queryResult.executionTime}ms
                </Typography>
              </Paper>
            )}

            {/* SQL Gerado */}
            <Accordion sx={{ mt: 3 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Code />
                  <Typography>SQL Gerado</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
                  <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>
                    {queryResult.sqlGenerated}
                  </pre>
                </Paper>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      )}

      {/* Dialog de Queries Salvas */}
      <Dialog
        open={savedQueriesDialogOpen}
        onClose={() => setSavedQueriesDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Queries Salvas
        </DialogTitle>
        <DialogContent>
          <List>
            {savedQueries.map((query) => (
              <ListItem
                key={query.id}
                button
                onClick={() => loadSavedQuery(query)}
                divider
              >
                <ListItemIcon>
                  <BookmarkBorder />
                </ListItemIcon>
                <ListItemText
                  primary={query.name}
                  secondary={`${query.prompt} - Executada ${query.execution_count} vezes`}
                />
                <Typography variant="caption" color="textSecondary">
                  {new Date(query.last_executed).toLocaleDateString()}
                </Typography>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSavedQueriesDialogOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Histórico */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Histórico de Consultas
        </DialogTitle>
        <DialogContent>
          <List>
            {queryHistory.map((log) => (
              <ListItem key={log.id} divider>
                <ListItemIcon>
                  {log.success ? <CheckCircle color="success" /> : <Error color="error" />}
                </ListItemIcon>
                <ListItemText
                  primary={log.prompt_text}
                  secondary={`${new Date(log.created_at).toLocaleString()} - ${log.execution_time}ms`}
                />
                <Chip
                  label={log.success ? 'Sucesso' : 'Erro'}
                  size="small"
                  color={log.success ? 'success' : 'error'}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Exportação */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Exportar Relatório
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Escolha o formato de exportação:
          </Typography>
          
          <Grid container spacing={2} mt={1}>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                startIcon={<FileDownload />}
                onClick={() => exportResult('csv')}
                fullWidth
                disabled={loading}
              >
                CSV
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                startIcon={<Description />}
                onClick={() => exportResult('json')}
                fullWidth
                disabled={loading}
              >
                JSON
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdf />}
                onClick={() => exportResult('markdown')}
                fullWidth
                disabled={loading}
              >
                Markdown
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>
            Cancelar
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