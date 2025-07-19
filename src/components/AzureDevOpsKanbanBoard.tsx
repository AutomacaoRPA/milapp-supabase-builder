import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Chip,
  Avatar,
  AvatarGroup,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Badge,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  LinearProgress,
  Checkbox,
  ListItemButton,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  Comment as CommentIcon,
  Attachment as AttachmentIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Archive as ArchiveIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon,
  DragIndicator as DragIcon,
  AddTask as AddTaskIcon,
  Task as TaskIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useAzureDevOpsTasks, AzureDevOpsTask, KanbanColumn } from '../hooks/useAzureDevOpsTasks';
import { WorkItemSubtask } from '@/types/project-lifecycle';

interface AzureDevOpsKanbanBoardProps {
  projectId: string;
}

const AzureDevOpsKanbanBoard: React.FC<AzureDevOpsKanbanBoardProps> = ({ projectId }) => {
  const {
    columns,
    loading,
    addWorkItem,
    updateWorkItem,
    removeWorkItem,
    moveWorkItem,
    addSubtask,
    updateSubtask,
    removeSubtask,
    project
  } = useAzureDevOpsTasks(projectId);

  const [newWorkItemDialog, setNewWorkItemDialog] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [workItemMenuAnchor, setWorkItemMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedWorkItem, setSelectedWorkItem] = useState<AzureDevOpsTask | null>(null);
  const [expandedWorkItems, setExpandedWorkItems] = useState<Set<string>>(new Set());
  const [editWorkItemDialog, setEditWorkItemDialog] = useState(false);
  const [workItemFormData, setWorkItemFormData] = useState({
    title: '',
    description: '',
    type: 'task' as const,
    priority: 'medium' as const,
    story_points: 0,
    due_date: '',
  });

  // Estados para subtarefas
  const [newSubtaskDialog, setNewSubtaskDialog] = useState(false);
  const [selectedWorkItemForSubtask, setSelectedWorkItemForSubtask] = useState<string>('');
  const [subtaskFormData, setSubtaskFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as const,
    estimated_hours: 0,
    story_points: 0,
    due_date: '',
  });

  // Funções auxiliares
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'user_story': return '📋';
      case 'bug': return '🐛';
      case 'task': return '✅';
      case 'epic': return '🎯';
      case 'spike': return '🔍';
      default: return '📝';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'success';
      case 'in_progress': return 'warning';
      case 'testing': return 'info';
      case 'review': return 'secondary';
      case 'todo': return 'primary';
      case 'backlog': return 'default';
      default: return 'default';
    }
  };

  const getSubtaskStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircleIcon fontSize="small" color="success" />;
      case 'in_progress': return <PlayArrowIcon fontSize="small" color="warning" />;
      case 'todo': return <UncheckedIcon fontSize="small" />;
      default: return <UncheckedIcon fontSize="small" />;
    }
  };

  // Handlers
  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const workItemId = result.draggableId;
    const newStatus = destination.droppableId;

    moveWorkItem(workItemId, newStatus);
  }, [moveWorkItem]);

  const handleAddWorkItem = async () => {
    if (!selectedColumn || !workItemFormData.title.trim()) return;

    const newWorkItem = {
      title: workItemFormData.title,
      description: workItemFormData.description,
      type: workItemFormData.type,
      priority: workItemFormData.priority,
      status: selectedColumn,
      story_points: workItemFormData.story_points,
      due_date: workItemFormData.due_date || undefined,
      comments: 0,
      attachments: 0,
      acceptance_criteria: [],
      dependencies: [],
      tags: [],
    };

    await addWorkItem(newWorkItem);
    setNewWorkItemDialog(false);
    setWorkItemFormData({
      title: '',
      description: '',
      type: 'task',
      priority: 'medium',
      story_points: 0,
      due_date: '',
    });
  };

  const handleEditWorkItem = async () => {
    if (!selectedWorkItem) return;

    const updates = {
      title: workItemFormData.title,
      description: workItemFormData.description,
      type: workItemFormData.type,
      priority: workItemFormData.priority,
      story_points: workItemFormData.story_points,
      due_date: workItemFormData.due_date || undefined,
    };

    await updateWorkItem(selectedWorkItem.id, updates);
    setEditWorkItemDialog(false);
    setSelectedWorkItem(null);
  };

  const handleDeleteWorkItem = async () => {
    if (!selectedWorkItem) return;
    await removeWorkItem(selectedWorkItem.id);
    setWorkItemMenuAnchor(null);
    setSelectedWorkItem(null);
  };

  const toggleWorkItemExpansion = (workItemId: string) => {
    const newExpanded = new Set(expandedWorkItems);
    if (newExpanded.has(workItemId)) {
      newExpanded.delete(workItemId);
    } else {
      newExpanded.add(workItemId);
    }
    setExpandedWorkItems(newExpanded);
  };

  const openEditDialog = (workItem: AzureDevOpsTask) => {
    setSelectedWorkItem(workItem);
    setWorkItemFormData({
      title: workItem.title,
      description: workItem.description || '',
      type: workItem.type,
      priority: workItem.priority,
      story_points: workItem.story_points || 0,
      due_date: workItem.due_date || '',
    });
    setEditWorkItemDialog(true);
    setWorkItemMenuAnchor(null);
  };

  // Handlers para subtarefas
  const handleAddSubtask = async () => {
    if (!selectedWorkItemForSubtask || !subtaskFormData.title.trim()) return;

    const newSubtask = {
      title: subtaskFormData.title,
      description: subtaskFormData.description,
      status: 'todo' as const,
      priority: subtaskFormData.priority,
      estimated_hours: subtaskFormData.estimated_hours,
      story_points: subtaskFormData.story_points,
      due_date: subtaskFormData.due_date || undefined,
    };

    await addSubtask(selectedWorkItemForSubtask, newSubtask);
    setNewSubtaskDialog(false);
    setSubtaskFormData({
      title: '',
      description: '',
      priority: 'medium',
      estimated_hours: 0,
      story_points: 0,
      due_date: '',
    });
  };

  const handleUpdateSubtaskStatus = async (workItemId: string, subtaskId: string, newStatus: string) => {
    await updateSubtask(workItemId, subtaskId, { status: newStatus as any });
  };

  const handleDeleteSubtask = async (workItemId: string, subtaskId: string) => {
    await removeSubtask(workItemId, subtaskId);
  };

  // Componente de subtarefa inline
  const SubtaskItem: React.FC<{
    subtask: WorkItemSubtask;
    workItemId: string;
  }> = ({ subtask, workItemId }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(subtask.title);

    const handleSaveTitle = async () => {
      await updateSubtask(workItemId, subtask.id, { title: editTitle });
      setIsEditing(false);
    };

    return (
      <ListItem sx={{ py: 0.5, pl: 2 }}>
        <ListItemIcon sx={{ minWidth: 32 }}>
          <Checkbox
            checked={subtask.status === 'done'}
            onChange={(e) => handleUpdateSubtaskStatus(
              workItemId, 
              subtask.id, 
              e.target.checked ? 'done' : 'todo'
            )}
            size="small"
          />
        </ListItemIcon>
        <ListItemText
          primary={
            isEditing ? (
              <TextField
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveTitle()}
                size="small"
                fullWidth
                autoFocus
              />
            ) : (
              <Typography
                variant="body2"
                sx={{
                  textDecoration: subtask.status === 'done' ? 'line-through' : 'none',
                  color: subtask.status === 'done' ? 'text.secondary' : 'text.primary',
                  cursor: 'pointer',
                }}
                onClick={() => setIsEditing(true)}
              >
                {subtask.title}
              </Typography>
            )
          }
          secondary={
            <Box display="flex" gap={1} alignItems="center" mt={0.5}>
              {subtask.story_points && (
                <Chip
                  label={`${subtask.story_points} SP`}
                  size="small"
                  sx={{ fontSize: '0.6rem', height: '16px' }}
                />
              )}
              {subtask.estimated_hours && (
                <Chip
                  label={`${subtask.estimated_hours}h`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.6rem', height: '16px' }}
                />
              )}
              {subtask.assignee && (
                <Avatar
                  src={subtask.assignee.avatar}
                  sx={{ width: 16, height: 16, fontSize: '0.6rem' }}
                >
                  {subtask.assignee.name?.charAt(0) || 'U'}
                </Avatar>
              )}
            </Box>
          }
        />
        <ListItemSecondaryAction>
          <IconButton
            size="small"
            onClick={() => handleDeleteSubtask(workItemId, subtask.id)}
            sx={{ fontSize: '0.75rem' }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    );
  };

  // Componente de cartão de work item
  const WorkItemCard: React.FC<{ workItem: AzureDevOpsTask; index: number }> = ({ workItem, index }) => {
    const isExpanded = expandedWorkItems.has(workItem.id);
    const subtasks = workItem.subtasks || [];
    const completedSubtasks = subtasks.filter(st => st.status === 'done').length;
    const progressPercentage = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

    return (
      <Draggable draggableId={workItem.id} index={index}>
        {(provided, snapshot) => (
          <Paper
            ref={provided.innerRef}
            {...provided.draggableProps}
            elevation={snapshot.isDragging ? 8 : 2}
            sx={{
              p: 2,
              mb: 2,
              cursor: 'grab',
              '&:hover': {
                boxShadow: 4,
              },
              borderLeft: `4px solid ${getPriorityColor(workItem.priority)}`,
              position: 'relative',
            }}
          >
            {/* Header do cartão */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
              <Box display="flex" alignItems="center" gap={1} sx={{ flex: 1 }}>
                <Box {...provided.dragHandleProps} sx={{ cursor: 'grab' }}>
                  <DragIcon fontSize="small" color="action" />
                </Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ flex: 1 }}>
                  {getTypeIcon(workItem.type)} {workItem.title}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={0.5}>
                <IconButton
                  size="small"
                  onClick={() => {
                    setSelectedWorkItemForSubtask(workItem.id);
                    setNewSubtaskDialog(true);
                  }}
                  title="Adicionar subtarefa"
                >
                  <AddTaskIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => toggleWorkItemExpansion(workItem.id)}
                >
                  {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    setWorkItemMenuAnchor(e.currentTarget);
                    setSelectedWorkItem(workItem);
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Informações básicas */}
            {workItem.description && (
              <Typography variant="body2" color="textSecondary" mb={1} sx={{ fontSize: '0.75rem' }}>
                {workItem.description.length > 100 && !isExpanded
                  ? `${workItem.description.substring(0, 100)}...`
                  : workItem.description}
              </Typography>
            )}

            {/* Progresso das subtarefas */}
            {subtasks.length > 0 && (
              <Box mb={1}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="caption" color="textSecondary">
                    Subtarefas: {completedSubtasks}/{subtasks.length}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {Math.round(progressPercentage)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={progressPercentage}
                  sx={{ height: 4, borderRadius: 2 }}
                />
              </Box>
            )}

            {/* Tags */}
            {workItem.tags && workItem.tags.length > 0 && (
              <Box display="flex" gap={1} mb={1} flexWrap="wrap">
                {workItem.tags.slice(0, 3).map((tag, idx) => (
                  <Chip
                    key={idx}
                    label={tag}
                    size="small"
                    sx={{ fontSize: '0.6rem', height: '20px' }}
                  />
                ))}
                {workItem.tags.length > 3 && (
                  <Chip
                    label={`+${workItem.tags.length - 3}`}
                    size="small"
                    sx={{ fontSize: '0.6rem', height: '20px' }}
                  />
                )}
              </Box>
            )}

            {/* Conteúdo expandido */}
            <Collapse in={isExpanded}>
              <Box mt={2}>
                <Divider sx={{ mb: 2 }} />
                
                {/* Subtarefas inline */}
                {subtasks.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="caption" fontWeight="bold" color="textSecondary" display="block" mb={1}>
                      Subtarefas:
                    </Typography>
                    <List dense sx={{ bgcolor: 'grey.50', borderRadius: 1 }}>
                      {subtasks.map((subtask) => (
                        <SubtaskItem
                          key={subtask.id}
                          subtask={subtask}
                          workItemId={workItem.id}
                        />
                      ))}
                    </List>
                  </Box>
                )}

                {/* Critérios de aceitação */}
                {workItem.acceptance_criteria && workItem.acceptance_criteria.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="caption" fontWeight="bold" color="textSecondary">
                      Critérios de Aceitação:
                    </Typography>
                    <List dense>
                      {workItem.acceptance_criteria.map((criteria, idx) => (
                        <ListItem key={idx} sx={{ py: 0 }}>
                          <ListItemIcon sx={{ minWidth: 24 }}>
                            <UncheckedIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={criteria} 
                            primaryTypographyProps={{ fontSize: '0.75rem' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {/* Dependências */}
                {workItem.dependencies && workItem.dependencies.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="caption" fontWeight="bold" color="textSecondary">
                      Dependências:
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {workItem.dependencies.map((dep, idx) => (
                        <Chip
                          key={idx}
                          label={dep}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.6rem', height: '20px' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Informações adicionais */}
                <Box display="flex" gap={2} flexWrap="wrap">
                  {workItem.story_points && (
                    <Chip
                      label={`${workItem.story_points} SP`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.6rem', height: '20px' }}
                    />
                  )}
                  {workItem.due_date && (
                    <Chip
                      icon={<ScheduleIcon />}
                      label={new Date(workItem.due_date).toLocaleDateString('pt-BR')}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.6rem', height: '20px' }}
                    />
                  )}
                </Box>
              </Box>
            </Collapse>

            {/* Footer do cartão */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
              <Box display="flex" alignItems="center" gap={1}>
                {workItem.assignee && (
                  <Tooltip title={workItem.assignee.name || 'Usuário'}>
                    <Avatar
                      src={workItem.assignee.avatar}
                      sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                    >
                      {workItem.assignee.name?.charAt(0) || 'U'}
                    </Avatar>
                  </Tooltip>
                )}
                {workItem.story_points && (
                  <Chip
                    label={`${workItem.story_points} SP`}
                    size="small"
                    sx={{ fontSize: '0.6rem', height: '20px' }}
                  />
                )}
              </Box>

              <Box display="flex" alignItems="center" gap={0.5}>
                {subtasks.length > 0 && (
                  <Tooltip title={`${subtasks.length} subtarefas`}>
                    <Box display="flex" alignItems="center" sx={{ fontSize: '0.75rem' }}>
                      <TaskIcon sx={{ fontSize: '0.875rem', mr: 0.25 }} />
                      {subtasks.length}
                    </Box>
                  </Tooltip>
                )}
                {workItem.comments > 0 && (
                  <Tooltip title={`${workItem.comments} comentários`}>
                    <Box display="flex" alignItems="center" sx={{ fontSize: '0.75rem' }}>
                      <CommentIcon sx={{ fontSize: '0.875rem', mr: 0.25 }} />
                      {workItem.comments}
                    </Box>
                  </Tooltip>
                )}
                {workItem.attachments > 0 && (
                  <Tooltip title={`${workItem.attachments} anexos`}>
                    <Box display="flex" alignItems="center" sx={{ fontSize: '0.75rem' }}>
                      <AttachmentIcon sx={{ fontSize: '0.875rem', mr: 0.25 }} />
                      {workItem.attachments}
                    </Box>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Paper>
        )}
      </Draggable>
    );
  };

  // Componente de coluna do Kanban
  const KanbanColumn: React.FC<{ column: KanbanColumn }> = ({ column }) => {
    const workItems = column.work_items || [];
    const wipLimit = column.wip_limit;
    const isOverLimit = wipLimit && workItems.length > wipLimit;

    return (
      <Box sx={{ minWidth: 300, maxWidth: 350 }}>
        <Paper
          sx={{
            p: 2,
            height: 'fit-content',
            minHeight: 600,
            bgcolor: 'grey.50',
          }}
        >
          {/* Header da coluna */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" fontWeight="bold">
                {column.title}
              </Typography>
              <Badge badgeContent={workItems.length} color="primary" />
            </Box>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                setSelectedColumn(column.status);
                setNewWorkItemDialog(true);
              }}
              disabled={isOverLimit}
            >
              Adicionar
            </Button>
          </Box>

          {/* WIP Limit Warning */}
          {isOverLimit && (
            <Alert severity="warning" sx={{ mb: 2, fontSize: '0.75rem' }}>
              Limite WIP excedido ({workItems.length}/{wipLimit})
            </Alert>
          )}

          {/* Lista de work items */}
          <Droppable droppableId={column.status}>
            {(provided, snapshot) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                sx={{
                  minHeight: 100,
                  bgcolor: snapshot.isDraggingOver ? 'action.hover' : 'transparent',
                  borderRadius: 1,
                  p: 1,
                }}
              >
                {workItems.map((workItem, index) => (
                  <WorkItemCard key={workItem.id} workItem={workItem} index={index} />
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </Paper>
      </Box>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header do board */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Azure DevOps Kanban Board
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedColumn('todo');
              setNewWorkItemDialog(true);
            }}
          >
            Novo Work Item
          </Button>
        </Box>
      </Box>

      {/* Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Box display="flex" gap={3} overflow="auto" pb={2}>
          {columns.map((column) => (
            <KanbanColumn key={column.id} column={column} />
          ))}
        </Box>
      </DragDropContext>

      {/* Dialog para novo work item */}
      <Dialog open={newWorkItemDialog} onClose={() => setNewWorkItemDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Work Item</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Título"
              value={workItemFormData.title}
              onChange={(e) => setWorkItemFormData({ ...workItemFormData, title: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Descrição"
              value={workItemFormData.description}
              onChange={(e) => setWorkItemFormData({ ...workItemFormData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <Box display="flex" gap={2}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={workItemFormData.type}
                  onChange={(e) => setWorkItemFormData({ ...workItemFormData, type: e.target.value as any })}
                  label="Tipo"
                >
                  <MenuItem value="user_story">User Story</MenuItem>
                  <MenuItem value="bug">Bug</MenuItem>
                  <MenuItem value="task">Task</MenuItem>
                  <MenuItem value="epic">Epic</MenuItem>
                  <MenuItem value="spike">Spike</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select
                  value={workItemFormData.priority}
                  onChange={(e) => setWorkItemFormData({ ...workItemFormData, priority: e.target.value as any })}
                  label="Prioridade"
                >
                  <MenuItem value="low">Baixa</MenuItem>
                  <MenuItem value="medium">Média</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                  <MenuItem value="critical">Crítica</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Story Points"
                type="number"
                value={workItemFormData.story_points}
                onChange={(e) => setWorkItemFormData({ ...workItemFormData, story_points: parseInt(e.target.value) || 0 })}
                fullWidth
              />
              <TextField
                label="Data de Vencimento"
                type="date"
                value={workItemFormData.due_date}
                onChange={(e) => setWorkItemFormData({ ...workItemFormData, due_date: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewWorkItemDialog(false)}>Cancelar</Button>
          <Button onClick={handleAddWorkItem} variant="contained">Criar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para editar work item */}
      <Dialog open={editWorkItemDialog} onClose={() => setEditWorkItemDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Work Item</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Título"
              value={workItemFormData.title}
              onChange={(e) => setWorkItemFormData({ ...workItemFormData, title: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Descrição"
              value={workItemFormData.description}
              onChange={(e) => setWorkItemFormData({ ...workItemFormData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <Box display="flex" gap={2}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={workItemFormData.type}
                  onChange={(e) => setWorkItemFormData({ ...workItemFormData, type: e.target.value as any })}
                  label="Tipo"
                >
                  <MenuItem value="user_story">User Story</MenuItem>
                  <MenuItem value="bug">Bug</MenuItem>
                  <MenuItem value="task">Task</MenuItem>
                  <MenuItem value="epic">Epic</MenuItem>
                  <MenuItem value="spike">Spike</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select
                  value={workItemFormData.priority}
                  onChange={(e) => setWorkItemFormData({ ...workItemFormData, priority: e.target.value as any })}
                  label="Prioridade"
                >
                  <MenuItem value="low">Baixa</MenuItem>
                  <MenuItem value="medium">Média</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                  <MenuItem value="critical">Crítica</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Story Points"
                type="number"
                value={workItemFormData.story_points}
                onChange={(e) => setWorkItemFormData({ ...workItemFormData, story_points: parseInt(e.target.value) || 0 })}
                fullWidth
              />
              <TextField
                label="Data de Vencimento"
                type="date"
                value={workItemFormData.due_date}
                onChange={(e) => setWorkItemFormData({ ...workItemFormData, due_date: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditWorkItemDialog(false)}>Cancelar</Button>
          <Button onClick={handleEditWorkItem} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para nova subtarefa */}
      <Dialog open={newSubtaskDialog} onClose={() => setNewSubtaskDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Subtarefa</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Título"
              value={subtaskFormData.title}
              onChange={(e) => setSubtaskFormData({ ...subtaskFormData, title: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Descrição"
              value={subtaskFormData.description}
              onChange={(e) => setSubtaskFormData({ ...subtaskFormData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <Box display="flex" gap={2}>
              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select
                  value={subtaskFormData.priority}
                  onChange={(e) => setSubtaskFormData({ ...subtaskFormData, priority: e.target.value as any })}
                  label="Prioridade"
                >
                  <MenuItem value="low">Baixa</MenuItem>
                  <MenuItem value="medium">Média</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                  <MenuItem value="critical">Crítica</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Story Points"
                type="number"
                value={subtaskFormData.story_points}
                onChange={(e) => setSubtaskFormData({ ...subtaskFormData, story_points: parseInt(e.target.value) || 0 })}
                fullWidth
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Horas Estimadas"
                type="number"
                value={subtaskFormData.estimated_hours}
                onChange={(e) => setSubtaskFormData({ ...subtaskFormData, estimated_hours: parseFloat(e.target.value) || 0 })}
                fullWidth
              />
              <TextField
                label="Data de Vencimento"
                type="date"
                value={subtaskFormData.due_date}
                onChange={(e) => setSubtaskFormData({ ...subtaskFormData, due_date: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewSubtaskDialog(false)}>Cancelar</Button>
          <Button onClick={handleAddSubtask} variant="contained">Adicionar</Button>
        </DialogActions>
      </Dialog>

      {/* Menu de contexto do work item */}
      <Menu
        anchorEl={workItemMenuAnchor}
        open={Boolean(workItemMenuAnchor)}
        onClose={() => setWorkItemMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          if (selectedWorkItem) openEditDialog(selectedWorkItem);
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Editar
        </MenuItem>
        <MenuItem onClick={handleDeleteWorkItem}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          Excluir
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <DuplicateIcon fontSize="small" />
          </ListItemIcon>
          Duplicar
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <ArchiveIcon fontSize="small" />
          </ListItemIcon>
          Arquivar
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default AzureDevOpsKanbanBoard; 