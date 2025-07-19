import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Avatar,
  Badge
} from '@mui/material'
import {
  Timeline,
  CheckCircle,
  Pending,
  Error,
  Schedule,
  Edit,
  Add,
  Delete,
  ExpandMore,
  ExpandLess,
  Person,
  CalendarToday,
  Comment
} from '@mui/icons-material'
import { supabase } from '../../services/supabase/client'
import { useCurrentRole } from '../../hooks/useCurrentRole'

interface WorkflowState {
  id: string
  name: string
  description: string
  order_index: number
  color: string
  icon: string
  is_initial: boolean
  is_final: boolean
  requires_approval: boolean
  allowed_roles: string[]
  auto_assign_role?: string
  sla_hours?: number
}

interface StatusLog {
  id: string
  from_state_id?: string
  to_state_id: string
  updated_by: string
  updated_at: string
  comments?: string
  from_state_name?: string
  to_state_name: string
  user_name: string
}

interface WorkflowTimelineProps {
  projectId: string
  requestId?: string
  currentStateId?: string
  onStateChange?: (newStateId: string) => void
  readOnly?: boolean
}

export function WorkflowTimeline({ 
  projectId, 
  requestId, 
  currentStateId, 
  onStateChange, 
  readOnly = false 
}: WorkflowTimelineProps) {
  const [states, setStates] = useState<WorkflowState[]>([])
  const [statusLog, setStatusLog] = useState<StatusLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showStateDialog, setShowStateDialog] = useState(false)
  const [editingState, setEditingState] = useState<WorkflowState | null>(null)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [selectedTargetState, setSelectedTargetState] = useState('')
  const [moveComments, setMoveComments] = useState('')
  const [moving, setMoving] = useState(false)

  const { role, isGestor, canManageWorkflow } = useCurrentRole(projectId)

  useEffect(() => {
    loadWorkflowData()
  }, [projectId, requestId])

  const loadWorkflowData = async () => {
    try {
      setLoading(true)

      // Carregar estados do workflow
      const { data: statesData, error: statesError } = await supabase
        .from('workflow_states')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('order_index')

      if (statesError) throw statesError
      setStates(statesData || [])

      // Carregar histórico de mudanças de estado
      if (requestId) {
        const { data: logData, error: logError } = await supabase
          .from('request_status_log')
          .select(`
            id,
            from_state_id,
            to_state_id,
            updated_by,
            updated_at,
            comments,
            workflow_states!from_state_id(name),
            workflow_states!to_state_id(name),
            users!inner(name)
          `)
          .eq('request_id', requestId)
          .order('updated_at', { ascending: true })

        if (logError) throw logError

        const transformedLog: StatusLog[] = (logData || []).map(log => ({
          id: log.id,
          from_state_id: log.from_state_id,
          to_state_id: log.to_state_id,
          updated_by: log.updated_by,
          updated_at: log.updated_at,
          comments: log.comments,
          from_state_name: log.workflow_states?.name,
          to_state_name: log.workflow_states?.name,
          user_name: log.users?.name
        }))

        setStatusLog(transformedLog)
      }

    } catch (error) {
      console.error('❌ Erro ao carregar workflow:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveWorkflowState = async (stateData: Partial<WorkflowState>) => {
    try {
      if (editingState?.id) {
        // Atualizar estado existente
        const { error } = await supabase
          .from('workflow_states')
          .update(stateData)
          .eq('id', editingState.id)

        if (error) throw error
      } else {
        // Criar novo estado
        const { error } = await supabase
          .from('workflow_states')
          .insert({
            ...stateData,
            project_id: projectId
          })

        if (error) throw error
      }

      setShowStateDialog(false)
      setEditingState(null)
      loadWorkflowData()
    } catch (error) {
      console.error('❌ Erro ao salvar estado:', error)
    }
  }

  const deleteWorkflowState = async (stateId: string) => {
    try {
      const { error } = await supabase
        .from('workflow_states')
        .update({ is_active: false })
        .eq('id', stateId)

      if (error) throw error
      loadWorkflowData()
    } catch (error) {
      console.error('❌ Erro ao deletar estado:', error)
    }
  }

  const moveToState = async () => {
    if (!requestId || !selectedTargetState || moving) return

    try {
      setMoving(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Usar função do Supabase para mover estado
      const { error } = await supabase.rpc('move_request_state', {
        p_request_id: requestId,
        p_to_state_id: selectedTargetState,
        p_updated_by: user.id,
        p_comments: moveComments
      })

      if (error) throw error

      setShowMoveDialog(false)
      setSelectedTargetState('')
      setMoveComments('')
      onStateChange?.(selectedTargetState)
      loadWorkflowData()
    } catch (error) {
      console.error('❌ Erro ao mover estado:', error)
    } finally {
      setMoving(false)
    }
  }

  const getCurrentStepIndex = () => {
    if (!currentStateId) return 0
    return states.findIndex(state => state.id === currentStateId)
  }

  const getStateIcon = (state: WorkflowState) => {
    // Mapear ícones baseado no nome ou usar ícone customizado
    const iconMap: Record<string, string> = {
      'Solicitação Recebida': '📝',
      'Em Análise': '🔍',
      'Em Desenvolvimento': '⚙️',
      'Em Revisão': '👀',
      'Aprovado': '✅',
      'Entregue': '🎉',
      'Rejeitado': '❌'
    }

    return state.icon || iconMap[state.name] || '📋'
  }

  const getStateColor = (state: WorkflowState, isActive: boolean = false) => {
    if (isActive) return state.color
    return '#E5E7EB' // gray-200
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getProgressValue = () => {
    const currentIndex = getCurrentStepIndex()
    return ((currentIndex + 1) / states.length) * 100
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    )
  }

  return (
    <Card>
      <CardContent>
        {/* Cabeçalho */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1}>
            <Timeline color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Workflow do Projeto
            </Typography>
            <Chip
              label={`${states.length} estágios`}
              size="small"
              variant="outlined"
            />
          </Box>
          
          {canManageWorkflow && !readOnly && (
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => {
                setEditingState(null)
                setShowStateDialog(true)
              }}
            >
              Adicionar Estágio
            </Button>
          )}
        </Box>

        {/* Progresso Geral */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Progresso Geral
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {Math.round(getProgressValue())}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={getProgressValue()}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Timeline de Estados */}
        <Stepper orientation="vertical" activeStep={getCurrentStepIndex()}>
          {states.map((state, index) => {
            const isActive = state.id === currentStateId
            const isCompleted = index < getCurrentStepIndex()
            const canMoveTo = !readOnly && canManageWorkflow && !isActive

            return (
              <Step key={state.id} active={isActive} completed={isCompleted}>
                <StepLabel
                  icon={
                    <Avatar
                      sx={{
                        bgcolor: getStateColor(state, isActive || isCompleted),
                        width: 32,
                        height: 32
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>
                        {getStateIcon(state)}
                      </span>
                    </Avatar>
                  }
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {state.name}
                    </Typography>
                    
                    {state.requires_approval && (
                      <Chip
                        label="Aprovação"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                    
                    {state.is_initial && (
                      <Chip
                        label="Inicial"
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    
                    {state.is_final && (
                      <Chip
                        label="Final"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </StepLabel>
                
                <StepContent>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {state.description}
                    </Typography>
                    
                    {state.sla_hours && (
                      <Typography variant="caption" color="text.secondary">
                        SLA: {state.sla_hours} horas
                      </Typography>
                    )}
                    
                    {canMoveTo && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedTargetState(state.id)
                          setShowMoveDialog(true)
                        }}
                        sx={{ mt: 1 }}
                      >
                        Mover para este estágio
                      </Button>
                    )}
                  </Box>
                  
                  {canManageWorkflow && !readOnly && (
                    <Box display="flex" gap={1}>
                      <Tooltip title="Editar estágio">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingState(state)
                            setShowStateDialog(true)
                          }}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Excluir estágio">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteWorkflowState(state.id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </StepContent>
              </Step>
            )
          })}
        </Stepper>

        {/* Histórico de Mudanças */}
        {requestId && statusLog.length > 0 && (
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Histórico de Mudanças
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={1}>
              {statusLog.map((log) => (
                <Card key={log.id} variant="outlined">
                  <CardContent sx={{ py: 1 }}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                        <Person sx={{ fontSize: 14 }} />
                      </Avatar>
                      
                      <Box flex={1}>
                        <Typography variant="body2" fontWeight="bold">
                          {log.user_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(log.updated_at)}
                        </Typography>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1}>
                        {log.from_state_name && (
                          <Chip
                            label={log.from_state_name}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        <Typography variant="caption">→</Typography>
                        <Chip
                          label={log.to_state_name}
                          size="small"
                          color="primary"
                        />
                      </Box>
                    </Box>
                    
                    {log.comments && (
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        {log.comments}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/* Dialog para Editar/Criar Estado */}
        <Dialog
          open={showStateDialog}
          onClose={() => setShowStateDialog(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingState ? 'Editar Estágio' : 'Adicionar Estágio'}
          </DialogTitle>
          
          <DialogContent>
            <WorkflowStateForm
              state={editingState}
              onSave={saveWorkflowState}
              onCancel={() => setShowStateDialog(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Dialog para Mover Estado */}
        <Dialog
          open={showMoveDialog}
          onClose={() => setShowMoveDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Mover para Estágio
          </DialogTitle>
          
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <FormControl fullWidth>
                <InputLabel>Estágio de Destino</InputLabel>
                <Select
                  value={selectedTargetState}
                  onChange={(e) => setSelectedTargetState(e.target.value)}
                  label="Estágio de Destino"
                >
                  {states.map((state) => (
                    <MenuItem key={state.id} value={state.id}>
                      {state.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                label="Comentários (opcional)"
                value={moveComments}
                onChange={(e) => setMoveComments(e.target.value)}
                fullWidth
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => setShowMoveDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={moveToState}
              variant="contained"
              disabled={!selectedTargetState || moving}
            >
              {moving ? 'Movendo...' : 'Mover'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  )
}

// Componente de formulário para estados
interface WorkflowStateFormProps {
  state?: WorkflowState | null
  onSave: (stateData: Partial<WorkflowState>) => void
  onCancel: () => void
}

function WorkflowStateForm({ state, onSave, onCancel }: WorkflowStateFormProps) {
  const [formData, setFormData] = useState({
    name: state?.name || '',
    description: state?.description || '',
    order_index: state?.order_index || 0,
    color: state?.color || '#3B82F6',
    icon: state?.icon || '📋',
    is_initial: state?.is_initial || false,
    is_final: state?.is_final || false,
    requires_approval: state?.requires_approval || false,
    allowed_roles: state?.allowed_roles || [],
    auto_assign_role: state?.auto_assign_role || '',
    sla_hours: state?.sla_hours || undefined
  })

  const handleSave = () => {
    onSave(formData)
  }

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <TextField
        label="Nome do Estágio"
        value={formData.name}
        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        fullWidth
        required
      />
      
      <TextField
        label="Descrição"
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        fullWidth
        multiline
        rows={2}
      />
      
      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
        <TextField
          label="Ordem"
          type="number"
          value={formData.order_index}
          onChange={(e) => setFormData(prev => ({ ...prev, order_index: parseInt(e.target.value) }))}
          fullWidth
        />
        
        <TextField
          label="Cor (hex)"
          value={formData.color}
          onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
          fullWidth
        />
      </Box>
      
      <TextField
        label="Ícone"
        value={formData.icon}
        onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
        fullWidth
        helperText="Emoji ou código de ícone"
      />
      
      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
        <FormControl>
          <InputLabel>Papel de Atribuição Automática</InputLabel>
          <Select
            value={formData.auto_assign_role}
            onChange={(e) => setFormData(prev => ({ ...prev, auto_assign_role: e.target.value }))}
            label="Papel de Atribuição Automática"
          >
            <MenuItem value="">Nenhum</MenuItem>
            <MenuItem value="executor">Executor</MenuItem>
            <MenuItem value="gestor">Gestor</MenuItem>
            <MenuItem value="ia">Especialista IA</MenuItem>
          </Select>
        </FormControl>
        
        <TextField
          label="SLA (horas)"
          type="number"
          value={formData.sla_hours || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, sla_hours: e.target.value ? parseInt(e.target.value) : undefined }))}
          fullWidth
        />
      </Box>
      
      <Box display="flex" gap={2}>
        <Button onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!formData.name}
        >
          Salvar
        </Button>
      </Box>
    </Box>
  )
} 