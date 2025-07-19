import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Grid,
  Chip,
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
  ListItemText,
  ListItemIcon,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Avatar
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Warning,
  CheckCircle,
  Schedule,
  TrendingUp,
  TrendingDown,
  SmartToy,
  Assignment,
  Person,
  CalendarToday,
  ExpandMore,
  Refresh,
  FilterList
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'

interface NonConformity {
  id: string
  code: string
  title: string
  description: string
  type: 'procedimento' | 'conduta' | 'estrutura' | 'sistema' | 'equipamento' | 'material' | 'outro'
  severity: 'baixa' | 'media' | 'alta' | 'critica'
  status: 'aberta' | 'em_analise' | 'plano_aprovado' | 'em_execucao' | 'verificacao' | 'fechada' | 'cancelada'
  priority: 'baixa' | 'normal' | 'alta' | 'urgente'
  department: string
  process: string
  reported_by: string
  responsible_person: string
  opened_at: string
  target_date?: string
  closed_at?: string
  ai_classification: any
  ai_suggestions?: string
  actions_count: number
  completed_actions: number
}

interface NonConformityForm {
  title: string
  description: string
  type: string
  severity: string
  priority: string
  department: string
  process: string
  responsible_person: string
  target_date: string
}

const severityColors = {
  baixa: 'success',
  media: 'warning',
  alta: 'error',
  critica: 'error'
}

const statusColors = {
  aberta: 'error',
  em_analise: 'warning',
  plano_aprovado: 'info',
  em_execucao: 'primary',
  verificacao: 'warning',
  fechada: 'success',
  cancelada: 'default'
}

const priorityColors = {
  baixa: 'success',
  normal: 'info',
  alta: 'warning',
  urgente: 'error'
}

export function NonConformities() {
  const [nonConformities, setNonConformities] = useState<NonConformity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editingNC, setEditingNC] = useState<NonConformity | null>(null)
  const [selectedNC, setSelectedNC] = useState<NonConformity | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')

  const [form, setForm] = useState<NonConformityForm>({
    title: '',
    description: '',
    type: '',
    severity: '',
    priority: '',
    department: '',
    process: '',
    responsible_person: '',
    target_date: ''
  })

  useEffect(() => {
    loadNonConformities()
  }, [])

  const loadNonConformities = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('quality_nonconformities')
        .select(`
          *,
          actions:quality_actions(count, status)
        `)
        .order('opened_at', { ascending: false })

      if (error) throw error

      // Processar dados para incluir contagem de ações
      const processedData = (data || []).map(nc => ({
        ...nc,
        actions_count: nc.actions?.length || 0,
        completed_actions: nc.actions?.filter((a: any) => a.status === 'concluido').length || 0
      }))

      setNonConformities(processedData)
    } catch (error) {
      console.error('❌ Erro ao carregar não conformidades:', error)
      setError('Erro ao carregar não conformidades')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setSaving(true)
      setError(null)

      const ncData = {
        title: form.title,
        description: form.description,
        type: form.type,
        severity: form.severity,
        priority: form.priority,
        department: form.department,
        process: form.process,
        responsible_person: form.responsible_person,
        target_date: form.target_date || null
      }

      if (editingNC) {
        const { error } = await supabase
          .from('quality_nonconformities')
          .update(ncData)
          .eq('id', editingNC.id)

        if (error) throw error
        setSuccess('Não conformidade atualizada com sucesso!')
      } else {
        const { error } = await supabase
          .from('quality_nonconformities')
          .insert(ncData)

        if (error) throw error
        setSuccess('Não conformidade criada com sucesso!')
      }

      setShowDialog(false)
      setEditingNC(null)
      resetForm()
      loadNonConformities()

      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('❌ Erro ao salvar não conformidade:', error)
      setError('Erro ao salvar não conformidade')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta não conformidade?')) return

    try {
      const { error } = await supabase
        .from('quality_nonconformities')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSuccess('Não conformidade excluída com sucesso!')
      loadNonConformities()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('❌ Erro ao excluir não conformidade:', error)
      setError('Erro ao excluir não conformidade')
    }
  }

  const handleEdit = (nc: NonConformity) => {
    setEditingNC(nc)
    setForm({
      title: nc.title,
      description: nc.description,
      type: nc.type,
      severity: nc.severity,
      priority: nc.priority,
      department: nc.department,
      process: nc.process,
      responsible_person: nc.responsible_person,
      target_date: nc.target_date || ''
    })
    setShowDialog(true)
  }

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      type: '',
      severity: '',
      priority: '',
      department: '',
      process: '',
      responsible_person: '',
      target_date: ''
    })
  }

  const classifyWithAI = async (ncId: string) => {
    try {
      const { data, error } = await supabase.rpc('classify_nonconformity_ai', {
        p_nc_id: ncId
      })

      if (error) throw error

      setSuccess('Classificação IA aplicada com sucesso!')
      loadNonConformities()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('❌ Erro ao classificar com IA:', error)
      setError('Erro ao aplicar classificação IA')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aberta':
        return <Warning color="error" />
      case 'fechada':
        return <CheckCircle color="success" />
      case 'em_execucao':
        return <TrendingUp color="primary" />
      case 'em_analise':
        return <Schedule color="warning" />
      default:
        return <Assignment />
    }
  }

  const getProgressPercentage = (nc: NonConformity) => {
    if (nc.actions_count === 0) return 0
    return (nc.completed_actions / nc.actions_count) * 100
  }

  const filteredNCs = nonConformities.filter(nc => {
    if (filterStatus !== 'all' && nc.status !== filterStatus) return false
    if (filterSeverity !== 'all' && nc.severity !== filterSeverity) return false
    return true
  })

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Gestão de Não Conformidades
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            resetForm()
            setShowDialog(true)
          }}
        >
          Nova NC
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="aberta">Aberta</MenuItem>
                  <MenuItem value="em_analise">Em Análise</MenuItem>
                  <MenuItem value="plano_aprovado">Plano Aprovado</MenuItem>
                  <MenuItem value="em_execucao">Em Execução</MenuItem>
                  <MenuItem value="verificacao">Verificação</MenuItem>
                  <MenuItem value="fechada">Fechada</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Gravidade</InputLabel>
                <Select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  label="Gravidade"
                >
                  <MenuItem value="all">Todas</MenuItem>
                  <MenuItem value="baixa">Baixa</MenuItem>
                  <MenuItem value="media">Média</MenuItem>
                  <MenuItem value="alta">Alta</MenuItem>
                  <MenuItem value="critica">Crítica</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Lista de NCs */}
      <Grid container spacing={3}>
        {filteredNCs.map((nc) => (
          <Grid item xs={12} md={6} key={nc.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  {getStatusIcon(nc.status)}
                  <Box flex={1}>
                    <Typography variant="h6" fontWeight="bold">
                      {nc.code} - {nc.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {nc.department} • {nc.process}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" gap={1}>
                    <Chip
                      label={nc.severity}
                      color={severityColors[nc.severity] as any}
                      size="small"
                    />
                    <Chip
                      label={nc.priority}
                      color={priorityColors[nc.priority] as any}
                      size="small"
                    />
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  {nc.description.substring(0, 150)}...
                </Typography>

                {/* Progresso das ações */}
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="caption">
                      Progresso das Ações
                    </Typography>
                    <Typography variant="caption">
                      {nc.completed_actions}/{nc.actions_count}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={getProgressPercentage(nc)}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>

                {/* Classificação IA */}
                {nc.ai_classification && (
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <SmartToy color="primary" fontSize="small" />
                    <Typography variant="caption" color="text.secondary">
                      IA: {nc.ai_classification.type} • {nc.ai_classification.severity}
                    </Typography>
                  </Box>
                )}

                <Box display="flex" gap={1}>
                  <Tooltip title="Ver Detalhes">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedNC(nc)
                        setShowDetails(true)
                      }}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Classificar com IA">
                    <IconButton
                      size="small"
                      onClick={() => classifyWithAI(nc.id)}
                    >
                      <SmartToy />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(nc)}
                    >
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Excluir">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(nc.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredNCs.length === 0 && (
        <Card>
          <CardContent>
            <Box display="flex" flexDirection="column" alignItems="center" p={4}>
              <Warning sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Nenhuma não conformidade encontrada
              </Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                {filterStatus !== 'all' || filterSeverity !== 'all' 
                  ? 'Tente ajustar os filtros para ver mais resultados.'
                  : 'Crie a primeira não conformidade para começar.'
                }
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Dialog para criar/editar NC */}
      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingNC ? 'Editar Não Conformidade' : 'Nova Não Conformidade'}
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={3} mt={1}>
            <TextField
              label="Título"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
            />
            
            <TextField
              label="Descrição"
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              multiline
              rows={4}
              required
            />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={form.type}
                    onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                    label="Tipo"
                  >
                    <MenuItem value="procedimento">Procedimento</MenuItem>
                    <MenuItem value="conduta">Conduta</MenuItem>
                    <MenuItem value="estrutura">Estrutura</MenuItem>
                    <MenuItem value="sistema">Sistema</MenuItem>
                    <MenuItem value="equipamento">Equipamento</MenuItem>
                    <MenuItem value="material">Material</MenuItem>
                    <MenuItem value="outro">Outro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Gravidade</InputLabel>
                  <Select
                    value={form.severity}
                    onChange={(e) => setForm(prev => ({ ...prev, severity: e.target.value }))}
                    label="Gravidade"
                  >
                    <MenuItem value="baixa">Baixa</MenuItem>
                    <MenuItem value="media">Média</MenuItem>
                    <MenuItem value="alta">Alta</MenuItem>
                    <MenuItem value="critica">Crítica</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Prioridade</InputLabel>
                  <Select
                    value={form.priority}
                    onChange={(e) => setForm(prev => ({ ...prev, priority: e.target.value }))}
                    label="Prioridade"
                  >
                    <MenuItem value="baixa">Baixa</MenuItem>
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="alta">Alta</MenuItem>
                    <MenuItem value="urgente">Urgente</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Data Limite"
                  type="date"
                  value={form.target_date}
                  onChange={(e) => setForm(prev => ({ ...prev, target_date: e.target.value }))}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Departamento"
                  value={form.department}
                  onChange={(e) => setForm(prev => ({ ...prev, department: e.target.value }))}
                  fullWidth
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Processo"
                  value={form.process}
                  onChange={(e) => setForm(prev => ({ ...prev, process: e.target.value }))}
                  fullWidth
                />
              </Grid>
            </Grid>
            
            <TextField
              label="Responsável"
              value={form.responsible_person}
              onChange={(e) => setForm(prev => ({ ...prev, responsible_person: e.target.value }))}
              fullWidth
            />
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={saving || !form.title || !form.description || !form.type || !form.severity}
          >
            {saving ? 'Salvando...' : (editingNC ? 'Atualizar' : 'Criar')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de detalhes */}
      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedNC && (
          <>
            <DialogTitle>
              Detalhes da Não Conformidade
            </DialogTitle>
            
            <DialogContent>
              <Box display="flex" flexDirection="column" gap={3} mt={1}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {selectedNC.code} - {selectedNC.title}
                  </Typography>
                  
                  <Box display="flex" gap={1} mb={2}>
                    <Chip
                      label={selectedNC.status}
                      color={statusColors[selectedNC.status] as any}
                    />
                    <Chip
                      label={selectedNC.severity}
                      color={severityColors[selectedNC.severity] as any}
                    />
                    <Chip
                      label={selectedNC.priority}
                      color={priorityColors[selectedNC.priority] as any}
                    />
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Descrição
                  </Typography>
                  <Typography variant="body2">
                    {selectedNC.description}
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Departamento
                    </Typography>
                    <Typography variant="body2">
                      {selectedNC.department}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Processo
                    </Typography>
                    <Typography variant="body2">
                      {selectedNC.process}
                    </Typography>
                  </Grid>
                </Grid>
                
                {selectedNC.ai_suggestions && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Sugestões da IA
                    </Typography>
                    <Typography variant="body2">
                      {selectedNC.ai_suggestions}
                    </Typography>
                  </Box>
                )}
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Progresso das Ações
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={getProgressPercentage(selectedNC)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {selectedNC.completed_actions} de {selectedNC.actions_count} ações concluídas
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={() => setShowDetails(false)}>
                Fechar
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setShowDetails(false)
                  handleEdit(selectedNC)
                }}
              >
                Editar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
} 