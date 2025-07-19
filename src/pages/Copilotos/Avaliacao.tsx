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
  DialogActions
} from '@mui/material'
import {
  Architecture,
  VerifiedUser,
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
  Chat,
  Psychology,
  AutoAwesome,
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
  BookmarkBorder
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'
import { collaborativeAIService } from '../../services/ai/CollaborativeAIService'
import ReactMarkdown from 'react-markdown'

interface DiscussionRound {
  round: number
  architect: {
    response: string
    timestamp: string
    reasoning: string
  }
  validator: {
    response: string
    timestamp: string
    reasoning: string
  }
}

interface FinalAgreement {
  pointsOfAgreement: string[]
  pointsOfDivergence: string[]
  finalRecommendation: string
  confidence: number
  riskLevel: 'low' | 'medium' | 'high'
}

interface DiscussionLog {
  id: string
  user_id: string
  topic: string
  rounds: DiscussionRound[]
  final_agreement: FinalAgreement
  project_id?: string
  status: 'in_progress' | 'completed' | 'archived'
  created_at: string
  updated_at: string
}

export function Avaliacao() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Estados de entrada
  const [userPrompt, setUserPrompt] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [discussionType, setDiscussionType] = useState<string>('technical')
  
  // Estados de discussão
  const [currentRound, setCurrentRound] = useState(0)
  const [maxRounds, setMaxRounds] = useState(3)
  const [discussionRounds, setDiscussionRounds] = useState<DiscussionRound[]>([])
  const [finalAgreement, setFinalAgreement] = useState<FinalAgreement | null>(null)
  const [discussionLog, setDiscussionLog] = useState<DiscussionLog | null>(null)
  
  // Estados de UI
  const [showHistory, setShowHistory] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [selectedDiscussion, setSelectedDiscussion] = useState<DiscussionLog | null>(null)
  const [discussionHistory, setDiscussionHistory] = useState<DiscussionLog[]>([])

  useEffect(() => {
    loadDiscussionHistory()
  }, [])

  const loadDiscussionHistory = async () => {
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) return

      const { data, error } = await supabase
        .from('ia_discussion_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setDiscussionHistory(data || [])
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error)
    }
  }

  const startDiscussion = async () => {
    if (!userPrompt.trim()) {
      setError('Por favor, insira uma ideia ou proposta para avaliação')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setCurrentRound(0)
      setDiscussionRounds([])
      setFinalAgreement(null)

      const userId = (await supabase.auth.getUser()).data.user?.id
      if (!userId) throw new Error('Usuário não autenticado')

      // Criar log de discussão
      const { data: logData, error: logError } = await supabase
        .from('ia_discussion_logs')
        .insert({
          user_id: userId,
          topic: userPrompt,
          project_id: selectedProject || null,
          discussion_type: discussionType,
          status: 'in_progress',
          rounds: [],
          final_agreement: null
        })
        .select()
        .single()

      if (logError) throw logError

      setDiscussionLog(logData)

      // Iniciar primeira rodada
      await executeDiscussionRound(1, logData.id)

    } catch (error) {
      console.error('❌ Erro ao iniciar discussão:', error)
      setError('Erro ao iniciar discussão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const executeDiscussionRound = async (roundNumber: number, logId: string) => {
    try {
      setLoading(true)

      // Simular discussão entre agentes
      const round = await collaborativeAIService.executeDiscussionRound(
        userPrompt,
        discussionRounds,
        roundNumber,
        discussionType
      )

      const updatedRounds = [...discussionRounds, round]
      setDiscussionRounds(updatedRounds)
      setCurrentRound(roundNumber)

      // Atualizar log no banco
      await supabase
        .from('ia_discussion_logs')
        .update({
          rounds: updatedRounds,
          updated_at: new Date().toISOString()
        })
        .eq('id', logId)

      // Se é a última rodada, gerar acordo final
      if (roundNumber === maxRounds) {
        await generateFinalAgreement(logId)
      }

    } catch (error) {
      console.error(`❌ Erro na rodada ${roundNumber}:`, error)
      setError(`Erro na rodada ${roundNumber}. Tente novamente.`)
    } finally {
      setLoading(false)
    }
  }

  const generateFinalAgreement = async (logId: string) => {
    try {
      setLoading(true)

      const agreement = await collaborativeAIService.generateFinalAgreement(
        userPrompt,
        discussionRounds
      )

      setFinalAgreement(agreement)

      // Atualizar log final
      await supabase
        .from('ia_discussion_logs')
        .update({
          final_agreement: agreement,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', logId)

      setSuccess('Avaliação colaborativa concluída com sucesso!')

    } catch (error) {
      console.error('❌ Erro ao gerar acordo final:', error)
      setError('Erro ao gerar acordo final. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const continueDiscussion = async () => {
    if (!discussionLog) return
    await executeDiscussionRound(currentRound + 1, discussionLog.id)
  }

  const saveDiscussion = async () => {
    try {
      if (!discussionLog) return

      await supabase
        .from('ia_discussion_logs')
        .update({
          status: 'archived',
          updated_at: new Date().toISOString()
        })
        .eq('id', discussionLog.id)

      setSuccess('Discussão salva com sucesso!')
      loadDiscussionHistory()
    } catch (error) {
      console.error('❌ Erro ao salvar discussão:', error)
      setError('Erro ao salvar discussão')
    }
  }

  const exportDiscussion = () => {
    if (!discussionLog || !finalAgreement) return

    const content = `
# Avaliação Colaborativa IA - MILAPP

## Tópico: ${discussionLog.topic}

## Discussão entre Agentes

${discussionRounds.map((round, index) => `
### Rodada ${index + 1}

**Arquiteto:**
${round.architect.response}

**Validador:**
${round.validator.response}
`).join('\n')}

## Acordo Final

### Pontos de Concordância
${finalAgreement.pointsOfAgreement.map(point => `- ${point}`).join('\n')}

### Pontos de Divergência
${finalAgreement.pointsOfDivergence.map(point => `- ${point}`).join('\n')}

### Recomendação Final
${finalAgreement.finalRecommendation}

**Nível de Confiança:** ${finalAgreement.confidence}%
**Nível de Risco:** ${finalAgreement.riskLevel}

---
*Gerado em: ${new Date().toLocaleString()}*
    `

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `avaliacao-ia-${Date.now()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'success'
      case 'medium': return 'warning'
      case 'high': return 'error'
      default: return 'default'
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
          Avaliação Colaborativa IA
        </Typography>
        
        <Box display="flex" gap={2}>
          <Tooltip title="Histórico de Discussões">
            <IconButton onClick={() => setHistoryDialogOpen(true)}>
              <History />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportDiscussion}
            disabled={!finalAgreement}
          >
            Exportar
          </Button>
        </Box>
      </Box>

      {/* Configuração */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Configuração da Avaliação
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Descreva sua ideia, proposta ou problema para avaliação"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Ex: Quero implementar um sistema de automação de processos usando RPA para reduzir o tempo de processamento de documentos em 50%..."
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Discussão</InputLabel>
                <Select
                  value={discussionType}
                  onChange={(e) => setDiscussionType(e.target.value)}
                  label="Tipo de Discussão"
                >
                  <MenuItem value="technical">Técnica</MenuItem>
                  <MenuItem value="business">Negócio</MenuItem>
                  <MenuItem value="security">Segurança</MenuItem>
                  <MenuItem value="compliance">Compliance</MenuItem>
                  <MenuItem value="architecture">Arquitetura</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Projeto (Opcional)</InputLabel>
                <Select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  label="Projeto (Opcional)"
                >
                  <MenuItem value="">Nenhum projeto</MenuItem>
                  <MenuItem value="project-1">Projeto A</MenuItem>
                  <MenuItem value="project-2">Projeto B</MenuItem>
                  <MenuItem value="project-3">Projeto C</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<Send />}
                onClick={startDiscussion}
                disabled={loading || !userPrompt.trim()}
                fullWidth
              >
                Iniciar Avaliação Colaborativa
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Progresso */}
      {discussionLog && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Progresso da Discussão
              </Typography>
              <Chip
                label={`Rodada ${currentRound} de ${maxRounds}`}
                color="primary"
              />
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={(currentRound / maxRounds) * 100}
              sx={{ height: 8, borderRadius: 4, mb: 2 }}
            />
            
            {currentRound < maxRounds && !finalAgreement && (
              <Button
                variant="outlined"
                onClick={continueDiscussion}
                disabled={loading}
                startIcon={<AutoAwesome />}
              >
                Continuar Discussão
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rodadas de Discussão */}
      {discussionRounds.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Discussão entre Agentes
            </Typography>
            
            {discussionRounds.map((round, index) => (
              <Accordion key={index} defaultExpanded={index === discussionRounds.length - 1}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="h6">
                      Rodada {index + 1}
                    </Typography>
                    <Chip
                      label={new Date(round.architect.timestamp).toLocaleTimeString()}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </AccordionSummary>
                
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <Architecture color="primary" />
                          <Typography variant="h6" color="primary">
                            Arquiteto
                          </Typography>
                        </Box>
                        <ReactMarkdown>{round.architect.response}</ReactMarkdown>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="caption" color="textSecondary">
                          <strong>Raciocínio:</strong> {round.architect.reasoning}
                        </Typography>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <VerifiedUser color="secondary" />
                          <Typography variant="h6" color="secondary">
                            Validador
                          </Typography>
                        </Box>
                        <ReactMarkdown>{round.validator.response}</ReactMarkdown>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="caption" color="textSecondary">
                          <strong>Raciocínio:</strong> {round.validator.reasoning}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Acordo Final */}
      {finalAgreement && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Acordo Final dos Agentes
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" color="success.main" gutterBottom>
                    <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Pontos de Concordância
                  </Typography>
                  <List dense>
                    {finalAgreement.pointsOfAgreement.map((point, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle color="success" />
                        </ListItemIcon>
                        <ListItemText primary={point} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" color="warning.main" gutterBottom>
                    <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Pontos de Divergência
                  </Typography>
                  <List dense>
                    {finalAgreement.pointsOfDivergence.map((point, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Warning color="warning" />
                        </ListItemIcon>
                        <ListItemText primary={point} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Recomendação Final
                  </Typography>
                  <ReactMarkdown>{finalAgreement.finalRecommendation}</ReactMarkdown>
                  
                  <Box display="flex" gap={2} mt={2}>
                    <Chip
                      label={`Confiança: ${finalAgreement.confidence}%`}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={`Risco: ${finalAgreement.riskLevel}`}
                      color={getRiskColor(finalAgreement.riskLevel) as any}
                      variant="outlined"
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            
            <Box display="flex" gap={2} mt={3}>
              <Button
                variant="outlined"
                startIcon={<Save />}
                onClick={saveDiscussion}
              >
                Salvar Discussão
              </Button>
              
              <Button
                variant="contained"
                startIcon={<Share />}
                onClick={exportDiscussion}
              >
                Exportar Relatório
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      )}

      {/* Dialog de Histórico */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Histórico de Discussões
        </DialogTitle>
        <DialogContent>
          <List>
            {discussionHistory.map((discussion) => (
              <ListItem
                key={discussion.id}
                button
                onClick={() => {
                  setSelectedDiscussion(discussion)
                  setHistoryDialogOpen(false)
                }}
                divider
              >
                <ListItemIcon>
                  <Chat />
                </ListItemIcon>
                <ListItemText
                  primary={discussion.topic}
                  secondary={`${new Date(discussion.created_at).toLocaleDateString()} - ${discussion.status}`}
                />
                <Chip
                  label={discussion.status}
                  size="small"
                  color={discussion.status === 'completed' ? 'success' : 'default'}
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