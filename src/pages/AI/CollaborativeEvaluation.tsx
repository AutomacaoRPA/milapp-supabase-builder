import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Avatar,
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
  ListItemAvatar,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Badge,
  Snackbar,
  CircularProgress
} from '@mui/material'
import {
  Psychology,
  Chat,
  Send,
  Refresh,
  Download,
  ExpandMore,
  CheckCircle,
  Warning,
  Error,
  Info,
  SmartToy,
  Person,
  Timeline,
  Assessment,
  AutoAwesome,
  PlayArrow,
  Stop,
  History,
  Settings,
  Help
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'
import ReactMarkdown from 'react-markdown'

interface AIAgent {
  id: string
  name: string
  role: string
  description: string
  personality: string
  avatar_url?: string
}

interface Discussion {
  id: string
  topic: string
  status: string
  current_round: number
  max_rounds: number
  feasibility_score?: number
  risk_level?: string
  created_at: string
  agents: {
    agent_1: { name: string; role: string; avatar?: string }
    agent_2: { name: string; role: string; avatar?: string }
  }
  discussion: {
    round_1: {
      agent_1_response: string
      agent_2_response: string
    }
    round_2: {
      agent_1_rebuttal: string
      agent_2_rebuttal: string
    }
    final_consensus: string
  }
  analysis: {
    agreement_points: string[]
    disagreement_points: string[]
    recommendations: string[]
    risk_level: string
    feasibility_score: number
  }
}

export function CollaborativeEvaluation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Estados para nova avaliação
  const [topic, setTopic] = useState('')
  const [userInput, setUserInput] = useState('')
  const [selectedAgent1, setSelectedAgent1] = useState<string>('')
  const [selectedAgent2, setSelectedAgent2] = useState<string>('')
  const [discussionType, setDiscussionType] = useState('technical_review')
  
  // Estados para agentes e debates
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [currentDiscussion, setCurrentDiscussion] = useState<Discussion | null>(null)
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [activeTab, setActiveTab] = useState(0)
  
  // Estados para diálogos
  const [showNewDiscussion, setShowNewDiscussion] = useState(false)
  const [showDiscussionHistory, setShowDiscussionHistory] = useState(false)
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null)

  useEffect(() => {
    loadAgents()
    loadRecentDiscussions()
  }, [])

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true })

      if (error) throw error

      setAgents(data || [])
      
      // Definir agentes padrão
      if (data && data.length >= 2) {
        const architect = data.find(a => a.role === 'architect')
        const critic = data.find(a => a.role === 'critic')
        
        if (architect) setSelectedAgent1(architect.id)
        if (critic) setSelectedAgent2(critic.id)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar agentes:', error)
      setError('Erro ao carregar agentes IA')
    }
  }

  const loadRecentDiscussions = async () => {
    try {
      const { data, error } = await supabase
        .from('recent_ai_discussions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      setDiscussions(data || [])
    } catch (error) {
      console.error('❌ Erro ao carregar debates:', error)
    }
  }

  const startDiscussion = async () => {
    if (!topic.trim() || !userInput.trim()) {
      setError('Preencha o tópico e a descrição da ideia')
      return
    }

    if (!selectedAgent1 || !selectedAgent2) {
      setError('Selecione dois agentes para o debate')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Obter projeto atual (simulado)
      const { data: projects } = await supabase
        .from('projects')
        .select('id')
        .limit(1)

      const projectId = projects?.[0]?.id
      if (!projectId) {
        setError('Nenhum projeto encontrado')
        return
      }

      // Iniciar debate
      const { data: discussionData, error } = await supabase.rpc('start_ai_discussion', {
        p_project_id: projectId,
        p_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_topic: topic,
        p_user_input: userInput,
        p_agent_1_id: selectedAgent1,
        p_agent_2_id: selectedAgent2,
        p_discussion_type: discussionType
      })

      if (error) throw error

      setSuccess('Debate iniciado com sucesso!')
      setShowNewDiscussion(false)
      
      // Limpar formulário
      setTopic('')
      setUserInput('')
      
      // Recarregar debates
      loadRecentDiscussions()
      
      // Abrir debate atual
      if (discussionData?.discussion_id) {
        await loadDiscussion(discussionData.discussion_id)
      }

    } catch (error) {
      console.error('❌ Erro ao iniciar debate:', error)
      setError('Erro ao iniciar debate IA')
    } finally {
      setLoading(false)
    }
  }

  const loadDiscussion = async (discussionId: string) => {
    try {
      setLoading(true)

      const { data, error } = await supabase.rpc('get_ai_discussion_result', {
        p_discussion_id: discussionId
      })

      if (error) throw error

      setCurrentDiscussion(data)
      setSelectedDiscussion(data)
      setActiveTab(0) // Voltar para o debate atual

    } catch (error) {
      console.error('❌ Erro ao carregar debate:', error)
      setError('Erro ao carregar debate')
    } finally {
      setLoading(false)
    }
  }

  const executeNextRound = async () => {
    if (!currentDiscussion) return

    try {
      setLoading(true)

      const { data, error } = await supabase.rpc('execute_ai_discussion_round', {
        p_discussion_id: currentDiscussion.id
      })

      if (error) throw error

      // Recarregar debate
      await loadDiscussion(currentDiscussion.id)
      
      setSuccess('Round executado com sucesso!')

    } catch (error) {
      console.error('❌ Erro ao executar round:', error)
      setError('Erro ao executar round do debate')
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'success'
      case 'medium': return 'warning'
      case 'high': return 'error'
      case 'critical': return 'error'
      default: return 'default'
    }
  }

  const getFeasibilityColor = (score: number) => {
    if (score >= 80) return 'success'
    if (score >= 60) return 'warning'
    return 'error'
  }

  const downloadDiscussion = async (discussion: Discussion) => {
    const content = `
# Análise Técnica Colaborativa - ${discussion.topic}

## Agentes Participantes
- **${discussion.agents.agent_1.name}** (${discussion.agents.agent_1.role})
- **${discussion.agents.agent_2.name}** (${discussion.agents.agent_2.role})

## Debate

### Round 1

**${discussion.agents.agent_1.name}:**
${discussion.discussion.round_1.agent_1_response}

**${discussion.agents.agent_2.name}:**
${discussion.discussion.round_1.agent_2_response}

### Round 2

**${discussion.agents.agent_1.name}:**
${discussion.discussion.round_2.agent_1_rebuttal}

**${discussion.agents.agent_2.name}:**
${discussion.discussion.round_2.agent_2_rebuttal}

## Análise Final

### ✅ Pontos de Concordância
${discussion.analysis.agreement_points.map(point => `- ${point}`).join('\n')}

### ⚠️ Pontos de Divergência
${discussion.analysis.disagreement_points.map(point => `- ${point}`).join('\n')}

### 🧩 Recomendações
${discussion.analysis.recommendations.map(rec => `- ${rec}`).join('\n')}

### 🧾 Conclusão
**Nível de Risco:** ${discussion.analysis.risk_level}
**Viabilidade:** ${discussion.analysis.feasibility_score}%

${discussion.discussion.final_consensus}

---
*Gerado em: ${new Date(discussion.created_at).toLocaleString()}*
    `

    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debate-ia-${discussion.topic.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
          <Button
            variant="outlined"
            startIcon={<History />}
            onClick={() => setShowDiscussionHistory(true)}
          >
            Histórico
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AutoAwesome />}
            onClick={() => setShowNewDiscussion(true)}
          >
            Nova Avaliação
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

      {/* Conteúdo Principal */}
      {currentDiscussion ? (
        <Grid container spacing={3}>
          {/* Debate Atual */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Debate: {currentDiscussion.topic}
                  </Typography>
                  
                  <Box display="flex" gap={1}>
                    <Chip
                      label={`Round ${currentDiscussion.current_round}/${currentDiscussion.max_rounds}`}
                      color="primary"
                      size="small"
                    />
                    <Chip
                      label={currentDiscussion.status}
                      color={currentDiscussion.status === 'completed' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                </Box>

                {/* Progresso */}
                <Box mb={3}>
                  <LinearProgress
                    variant="determinate"
                    value={(currentDiscussion.current_round / currentDiscussion.max_rounds) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                {/* Agentes */}
                <Box display="flex" gap={2} mb={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar src={currentDiscussion.agents.agent_1.avatar}>
                      {currentDiscussion.agents.agent_1.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {currentDiscussion.agents.agent_1.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {currentDiscussion.agents.agent_1.role}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h6">vs</Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar src={currentDiscussion.agents.agent_2.avatar}>
                      {currentDiscussion.agents.agent_2.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {currentDiscussion.agents.agent_2.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {currentDiscussion.agents.agent_2.role}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Conteúdo do Debate */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">Round 1 - Respostas Iniciais</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="primary" gutterBottom>
                        {currentDiscussion.agents.agent_1.name}:
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <ReactMarkdown>
                          {currentDiscussion.discussion.round_1.agent_1_response}
                        </ReactMarkdown>
                      </Paper>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="secondary" gutterBottom>
                        {currentDiscussion.agents.agent_2.name}:
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <ReactMarkdown>
                          {currentDiscussion.discussion.round_1.agent_2_response}
                        </ReactMarkdown>
                      </Paper>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {currentDiscussion.discussion.round_2.agent_1_rebuttal && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="h6">Round 2 - Rebatimentos</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box mb={2}>
                        <Typography variant="subtitle2" color="primary" gutterBottom>
                          {currentDiscussion.agents.agent_1.name}:
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <ReactMarkdown>
                            {currentDiscussion.discussion.round_2.agent_1_rebuttal}
                          </ReactMarkdown>
                        </Paper>
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="secondary" gutterBottom>
                          {currentDiscussion.agents.agent_2.name}:
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <ReactMarkdown>
                            {currentDiscussion.discussion.round_2.agent_2_rebuttal}
                          </ReactMarkdown>
                        </Paper>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                )}

                {currentDiscussion.discussion.final_consensus && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="h6">Consenso Final</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.50' }}>
                        <ReactMarkdown>
                          {currentDiscussion.discussion.final_consensus}
                        </ReactMarkdown>
                      </Paper>
                    </AccordionDetails>
                  </Accordion>
                )}

                {/* Ações */}
                <Box display="flex" gap={2} mt={3}>
                  {currentDiscussion.status !== 'completed' && (
                    <Button
                      variant="contained"
                      startIcon={<PlayArrow />}
                      onClick={executeNextRound}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={20} /> : 'Executar Próximo Round'}
                    </Button>
                  )}
                  
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => downloadDiscussion(currentDiscussion)}
                  >
                    Baixar Relatório
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Análise Final */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Análise Final
                </Typography>

                {/* Métricas */}
                <Box mb={3}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2">Viabilidade</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {currentDiscussion.analysis.feasibility_score}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={currentDiscussion.analysis.feasibility_score}
                    color={getFeasibilityColor(currentDiscussion.analysis.feasibility_score) as any}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>

                <Box mb={3}>
                  <Typography variant="body2" gutterBottom>
                    Nível de Risco
                  </Typography>
                  <Chip
                    label={currentDiscussion.analysis.risk_level}
                    color={getRiskLevelColor(currentDiscussion.analysis.risk_level) as any}
                    size="small"
                  />
                </Box>

                {/* Pontos de Concordância */}
                <Box mb={3}>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    ✅ Pontos de Concordância
                  </Typography>
                  <List dense>
                    {currentDiscussion.analysis.agreement_points.map((point, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemText primary={point} />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                {/* Pontos de Divergência */}
                {currentDiscussion.analysis.disagreement_points.length > 0 && (
                  <Box mb={3}>
                    <Typography variant="subtitle2" color="warning.main" gutterBottom>
                      ⚠️ Pontos de Divergência
                    </Typography>
                    <List dense>
                      {currentDiscussion.analysis.disagreement_points.map((point, index) => (
                        <ListItem key={index} sx={{ py: 0.5 }}>
                          <ListItemText primary={point} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Recomendações */}
                <Box>
                  <Typography variant="subtitle2" color="info.main" gutterBottom>
                    🧩 Recomendações
                  </Typography>
                  <List dense>
                    {currentDiscussion.analysis.recommendations.map((rec, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      ) : (
        /* Estado Inicial */
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Psychology sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Avaliação Colaborativa IA
              </Typography>
              <Typography variant="body1" color="textSecondary" paragraph>
                Submeta uma ideia ou proposta técnica e deixe nossos agentes IA especializados 
                debaterem e fornecerem uma análise colaborativa detalhada.
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<AutoAwesome />}
                onClick={() => setShowNewDiscussion(true)}
              >
                Iniciar Nova Avaliação
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Diálogo Nova Avaliação */}
      <Dialog open={showNewDiscussion} onClose={() => setShowNewDiscussion(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AutoAwesome />
            Nova Avaliação Colaborativa
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Tópico da Avaliação"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                fullWidth
                placeholder="Ex: Implementação de automação de processos com IA"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Descrição da Ideia/Proposta"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                fullWidth
                multiline
                rows={6}
                placeholder="Descreva detalhadamente sua ideia, proposta técnica ou desafio que gostaria que os agentes IA avaliassem..."
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Discussão</InputLabel>
                <Select
                  value={discussionType}
                  onChange={(e) => setDiscussionType(e.target.value)}
                  label="Tipo de Discussão"
                >
                  <MenuItem value="technical_review">Revisão Técnica</MenuItem>
                  <MenuItem value="architecture_validation">Validação de Arquitetura</MenuItem>
                  <MenuItem value="security_audit">Auditoria de Segurança</MenuItem>
                  <MenuItem value="scalability_analysis">Análise de Escalabilidade</MenuItem>
                  <MenuItem value="cost_optimization">Otimização de Custos</MenuItem>
                  <MenuItem value="risk_assessment">Avaliação de Riscos</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Agente 1</InputLabel>
                <Select
                  value={selectedAgent1}
                  onChange={(e) => setSelectedAgent1(e.target.value)}
                  label="Agente 1"
                >
                  {agents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          {agent.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{agent.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {agent.role}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Agente 2</InputLabel>
                <Select
                  value={selectedAgent2}
                  onChange={(e) => setSelectedAgent2(e.target.value)}
                  label="Agente 2"
                >
                  {agents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          {agent.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{agent.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {agent.role}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowNewDiscussion(false)}>
            Cancelar
          </Button>
          <Button
            onClick={startDiscussion}
            variant="contained"
            disabled={loading || !topic.trim() || !userInput.trim()}
          >
            {loading ? <CircularProgress size={20} /> : 'Iniciar Debate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo Histórico */}
      <Dialog open={showDiscussionHistory} onClose={() => setShowDiscussionHistory(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <History />
            Histórico de Debates
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <List>
            {discussions.map((discussion) => (
              <ListItem
                key={discussion.id}
                button
                onClick={() => {
                  loadDiscussion(discussion.id)
                  setShowDiscussionHistory(false)
                }}
              >
                <ListItemAvatar>
                  <Avatar>
                    <Assessment />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={discussion.topic}
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        {discussion.agents.agent_1.name} vs {discussion.agents.agent_2.name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {new Date(discussion.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                />
                <Box display="flex" gap={1}>
                  <Chip
                    label={discussion.status}
                    color={discussion.status === 'completed' ? 'success' : 'warning'}
                    size="small"
                  />
                  {discussion.feasibility_score && (
                    <Chip
                      label={`${discussion.feasibility_score}%`}
                      color={getFeasibilityColor(discussion.feasibility_score) as any}
                      size="small"
                    />
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowDiscussionHistory(false)}>
            Fechar
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