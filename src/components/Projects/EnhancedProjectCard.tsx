import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Tooltip,
  Avatar,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  ExpandMore,
  ExpandLess,
  Add,
  Edit,
  Delete,
  CheckCircle,
  Schedule,
  Person,
  Assignment,
  PriorityHigh,
  Flag,
  Timeline,
  AttachMoney,
  Speed
} from '@mui/icons-material'
import { motion } from 'framer-motion'

export interface ProjectTask {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  assignee?: string
  estimatedHours?: number
  actualHours?: number
  dueDate?: Date
  completedAt?: Date
  tags?: string[]
  dependencies?: string[]
}

export interface EnhancedProject {
  id: string
  name: string
  description: string
  status: 'ideacao' | 'planejamento' | 'desenvolvimento' | 'producao' | 'concluido'
  priority: 'baixa' | 'media' | 'alta' | 'critica'
  complexity: number
  estimated_roi: number
  actual_roi?: number
  start_date: string
  target_date: string
  owner: string
  team_size: number
  budget: number
  quality_gates_passed: number
  total_quality_gates: number
  tasks: ProjectTask[]
  tags: string[]
  attachments: string[]
  comments: Array<{
    id: string
    user: string
    text: string
    timestamp: Date
  }>
  metrics: {
    progress: number
    velocity: number
    burndown: number
    riskScore: number
  }
}

interface EnhancedProjectCardProps {
  project: EnhancedProject
  onUpdate: (project: EnhancedProject) => void
  onDelete: (id: string) => void
  onTaskUpdate: (projectId: string, taskId: string, updates: Partial<ProjectTask>) => void
  onTaskAdd: (projectId: string, task: Omit<ProjectTask, 'id'>) => void
  onTaskDelete: (projectId: string, taskId: string) => void
}

export function EnhancedProjectCard({
  project,
  onUpdate,
  onDelete,
  onTaskUpdate,
  onTaskAdd,
  onTaskDelete
}: EnhancedProjectCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null)
  const [newTask, setNewTask] = useState<Partial<ProjectTask>>({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM'
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ideacao': return 'default'
      case 'planejamento': return 'info'
      case 'desenvolvimento': return 'warning'
      case 'producao': return 'success'
      case 'concluido': return 'success'
      default: return 'default'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critica': return 'error'
      case 'alta': return 'warning'
      case 'media': return 'info'
      case 'baixa': return 'success'
      default: return 'default'
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'success'
      case 'IN_PROGRESS': return 'warning'
      case 'BLOCKED': return 'error'
      case 'TODO': return 'default'
      default: return 'default'
    }
  }

  const getTaskPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return <PriorityHigh color="error" />
      case 'HIGH': return <Flag color="warning" />
      case 'MEDIUM': return <Flag color="info" />
      case 'LOW': return <Flag color="success" />
      default: return <Flag />
    }
  }

  const calculateProgress = () => {
    if (project.tasks.length === 0) return 0
    const completedTasks = project.tasks.filter(task => task.status === 'DONE').length
    return (completedTasks / project.tasks.length) * 100
  }

  const handleTaskStatusToggle = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE'
    onTaskUpdate(project.id, taskId, { 
      status: newStatus,
      completedAt: newStatus === 'DONE' ? new Date() : undefined
    })
  }

  const handleAddTask = () => {
    if (!newTask.title) return
    
    const task: Omit<ProjectTask, 'id'> = {
      title: newTask.title,
      description: newTask.description || '',
      status: newTask.status || 'TODO',
      priority: newTask.priority || 'MEDIUM',
      assignee: newTask.assignee,
      estimatedHours: newTask.estimatedHours,
      dueDate: newTask.dueDate
    }
    
    onTaskAdd(project.id, task)
    setNewTask({ title: '', description: '', status: 'TODO', priority: 'MEDIUM' })
    setShowTaskDialog(false)
  }

  const handleEditTask = (task: ProjectTask) => {
    setEditingTask(task)
    setNewTask({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assignee: task.assignee,
      estimatedHours: task.estimatedHours,
      dueDate: task.dueDate
    })
    setShowTaskDialog(true)
  }

  const handleUpdateTask = () => {
    if (!editingTask || !newTask.title) return
    
    onTaskUpdate(project.id, editingTask.id, {
      title: newTask.title,
      description: newTask.description,
      status: newTask.status,
      priority: newTask.priority,
      assignee: newTask.assignee,
      estimatedHours: newTask.estimatedHours,
      dueDate: newTask.dueDate
    })
    
    setEditingTask(null)
    setNewTask({ title: '', description: '', status: 'TODO', priority: 'MEDIUM' })
    setShowTaskDialog(false)
  }

  const progress = calculateProgress()

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card 
          elevation={3}
          sx={{ 
            mb: 2,
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': {
              boxShadow: 6,
              borderColor: 'primary.main'
            }
          }}
        >
          <CardContent>
            {/* Cabeçalho do Projeto */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Box flex={1}>
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {project.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {project.description}
                </Typography>
              </Box>
              
              <Box display="flex" gap={1}>
                <Chip
                  label={project.status.toUpperCase()}
                  color={getStatusColor(project.status) as any}
                  size="small"
                />
                <Chip
                  label={project.priority.toUpperCase()}
                  color={getPriorityColor(project.priority) as any}
                  size="small"
                  icon={<PriorityHigh />}
                />
              </Box>
            </Box>

            {/* Métricas Rápidas */}
            <Box display="flex" gap={2} mb={2}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <AttachMoney fontSize="small" color="success" />
                <Typography variant="body2">
                  ROI: {project.actual_roi || project.estimated_roi}%
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={0.5}>
                <Person fontSize="small" color="info" />
                <Typography variant="body2">
                  Equipe: {project.team_size}
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={0.5}>
                <Speed fontSize="small" color="warning" />
                <Typography variant="body2">
                  Complexidade: {project.complexity}/10
                </Typography>
              </Box>
            </Box>

            {/* Progresso das Tarefas */}
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2" fontWeight="bold">
                  Progresso das Tarefas
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {project.tasks.filter(t => t.status === 'DONE').length}/{project.tasks.length}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                {progress.toFixed(1)}% concluído
              </Typography>
            </Box>

            {/* Tags */}
            {project.tags.length > 0 && (
              <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                {project.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            )}

            {/* Tarefas Resumo */}
            <Collapse in={expanded}>
              <Box mt={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Tarefas ({project.tasks.length})
                  </Typography>
                  <Button
                    startIcon={<Add />}
                    size="small"
                    onClick={() => setShowTaskDialog(true)}
                    variant="outlined"
                  >
                    Adicionar Tarefa
                  </Button>
                </Box>

                <List dense>
                  {project.tasks.map((task) => (
                    <ListItem
                      key={task.id}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <ListItemIcon>
                        <Checkbox
                          checked={task.status === 'DONE'}
                          onChange={() => handleTaskStatusToggle(task.id, task.status)}
                          color="primary"
                        />
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography
                              variant="body2"
                              sx={{
                                textDecoration: task.status === 'DONE' ? 'line-through' : 'none',
                                color: task.status === 'DONE' ? 'text.secondary' : 'text.primary'
                              }}
                            >
                              {task.title}
                            </Typography>
                            {getTaskPriorityIcon(task.priority)}
                            <Chip
                              label={task.status}
                              size="small"
                              color={getTaskStatusColor(task.status) as any}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            {task.description && (
                              <Typography variant="caption" color="text.secondary">
                                {task.description}
                              </Typography>
                            )}
                            <Box display="flex" gap={1} mt={0.5}>
                              {task.assignee && (
                                <Chip
                                  label={task.assignee}
                                  size="small"
                                  variant="outlined"
                                  icon={<Person />}
                                />
                              )}
                              {task.estimatedHours && (
                                <Chip
                                  label={`${task.estimatedHours}h`}
                                  size="small"
                                  variant="outlined"
                                  icon={<Schedule />}
                                />
                              )}
                            </Box>
                          </Box>
                        }
                      />
                      
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="Editar tarefa">
                          <IconButton
                            size="small"
                            onClick={() => handleEditTask(task)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir tarefa">
                          <IconButton
                            size="small"
                            onClick={() => onTaskDelete(project.id, task.id)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Collapse>
          </CardContent>

          <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
            <Box display="flex" gap={1}>
              <Button
                size="small"
                onClick={() => setExpanded(!expanded)}
                startIcon={expanded ? <ExpandLess /> : <ExpandMore />}
              >
                {expanded ? 'Ocultar' : 'Ver'} Tarefas
              </Button>
              
              <Button
                size="small"
                variant="outlined"
                startIcon={<Edit />}
              >
                Editar Projeto
              </Button>
            </Box>
            
            <Box display="flex" gap={1}>
              <Tooltip title="Excluir projeto">
                <IconButton
                  size="small"
                  onClick={() => onDelete(project.id)}
                  color="error"
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
          </CardActions>
        </Card>
      </motion.div>

      {/* Dialog para Adicionar/Editar Tarefa */}
      <Dialog 
        open={showTaskDialog} 
        onClose={() => {
          setShowTaskDialog(false)
          setEditingTask(null)
          setNewTask({ title: '', description: '', status: 'TODO', priority: 'MEDIUM' })
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingTask ? 'Editar Tarefa' : 'Adicionar Nova Tarefa'}
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Título da Tarefa"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              fullWidth
              required
            />
            
            <TextField
              label="Descrição"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            
            <Box display="flex" gap={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value as any })}
                  label="Status"
                >
                  <MenuItem value="TODO">A Fazer</MenuItem>
                  <MenuItem value="IN_PROGRESS">Em Progresso</MenuItem>
                  <MenuItem value="DONE">Concluído</MenuItem>
                  <MenuItem value="BLOCKED">Bloqueado</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                  label="Prioridade"
                >
                  <MenuItem value="LOW">Baixa</MenuItem>
                  <MenuItem value="MEDIUM">Média</MenuItem>
                  <MenuItem value="HIGH">Alta</MenuItem>
                  <MenuItem value="CRITICAL">Crítica</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box display="flex" gap={2}>
              <TextField
                label="Responsável"
                value={newTask.assignee || ''}
                onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                fullWidth
              />
              
              <TextField
                label="Horas Estimadas"
                type="number"
                value={newTask.estimatedHours || ''}
                onChange={(e) => setNewTask({ ...newTask, estimatedHours: Number(e.target.value) })}
                fullWidth
              />
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={() => {
              setShowTaskDialog(false)
              setEditingTask(null)
              setNewTask({ title: '', description: '', status: 'TODO', priority: 'MEDIUM' })
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={editingTask ? handleUpdateTask : handleAddTask}
            variant="contained"
            disabled={!newTask.title}
          >
            {editingTask ? 'Atualizar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
} 