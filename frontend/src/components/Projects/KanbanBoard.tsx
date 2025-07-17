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
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useProjects, useTasks } from '../../hooks/useProjects';

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  color: string;
  tasks: Task[];
  wipLimit?: number;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  type: 'user_story' | 'bug' | 'task' | 'epic';
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  storyPoints?: number;
  dueDate?: string;
  tags: string[];
  comments: number;
  attachments: number;
  created_at: string;
  updated_at: string;
}

interface KanbanBoardProps {
  projectId: string;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId }) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([
    {
      id: 'backlog',
      title: 'Backlog',
      status: 'backlog',
      color: '#6c757d',
      tasks: [],
    },
    {
      id: 'todo',
      title: 'To Do',
      status: 'todo',
      color: '#007bff',
      tasks: [],
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      status: 'in_progress',
      color: '#ffc107',
      tasks: [],
    },
    {
      id: 'review',
      title: 'Review',
      status: 'review',
      color: '#17a2b8',
      tasks: [],
    },
    {
      id: 'testing',
      title: 'Testing',
      status: 'testing',
      color: '#fd7e14',
      tasks: [],
    },
    {
      id: 'done',
      title: 'Done',
      status: 'done',
      color: '#28a745',
      tasks: [],
    },
  ]);

  const [newTaskDialog, setNewTaskDialog] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [taskMenuAnchor, setTaskMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { useProject } = useProjects();
  const { tasks, createTask, updateTask, deleteTask } = useTasks(projectId);
  const { data: project } = useProject(projectId);

  // Organizar tasks por coluna
  React.useEffect(() => {
    if (tasks) {
      const updatedColumns = columns.map(column => ({
        ...column,
        tasks: tasks.filter(task => task.status === column.status)
      }));
      setColumns(updatedColumns);
    }
  }, [tasks]);

  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceColumn = columns.find(col => col.id === source.droppableId);
    const destColumn = columns.find(col => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    const sourceTasks = [...sourceColumn.tasks];
    const destTasks = source.droppableId === destination.droppableId 
      ? sourceTasks 
      : [...destColumn.tasks];

    const [removed] = sourceTasks.splice(source.index, 1);
    destTasks.splice(destination.index, 0, removed);

    // Atualizar estado local
    const updatedColumns = columns.map(col => {
      if (col.id === source.droppableId) {
        return { ...col, tasks: sourceTasks };
      }
      if (col.id === destination.droppableId) {
        return { ...col, tasks: destTasks };
      }
      return col;
    });
    setColumns(updatedColumns);

    // Atualizar no backend
    updateTask.mutate({
      id: removed.id,
      status: destColumn.status,
    });
  }, [columns, updateTask]);

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
      default: return '📝';
    }
  };

  const TaskCard: React.FC<{ task: Task; index: number }> = ({ task, index }) => (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          elevation={snapshot.isDragging ? 8 : 2}
          sx={{
            p: 2,
            mb: 2,
            cursor: 'grab',
            '&:hover': {
              boxShadow: 4,
            },
            borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ flex: 1 }}>
              {getTypeIcon(task.type)} {task.title}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                setTaskMenuAnchor(e.currentTarget);
                setSelectedTask(task);
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>

          {task.description && (
            <Typography variant="body2" color="textSecondary" mb={1} sx={{ fontSize: '0.75rem' }}>
              {task.description.length > 100 
                ? `${task.description.substring(0, 100)}...` 
                : task.description}
            </Typography>
          )}

          <Box display="flex" gap={1} mb={1} flexWrap="wrap">
            {task.tags.map((tag, idx) => (
              <Chip
                key={idx}
                label={tag}
                size="small"
                sx={{ fontSize: '0.6rem', height: '20px' }}
              />
            ))}
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              {task.assignee && (
                <Tooltip title={task.assignee.name}>
                  <Avatar
                    src={task.assignee.avatar}
                    sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                  >
                    {task.assignee.name.charAt(0)}
                  </Avatar>
                </Tooltip>
              )}
              {task.storyPoints && (
                <Chip
                  label={`${task.storyPoints} SP`}
                  size="small"
                  sx={{ fontSize: '0.6rem', height: '20px' }}
                />
              )}
            </Box>

            <Box display="flex" alignItems="center" gap={0.5}>
              {task.comments > 0 && (
                <Tooltip title={`${task.comments} comentários`}>
                  <Box display="flex" alignItems="center" sx={{ fontSize: '0.75rem' }}>
                    <CommentIcon sx={{ fontSize: '0.875rem', mr: 0.25 }} />
                    {task.comments}
                  </Box>
                </Tooltip>
              )}
              {task.attachments > 0 && (
                <Tooltip title={`${task.attachments} anexos`}>
                  <Box display="flex" alignItems="center" sx={{ fontSize: '0.75rem' }}>
                    <AttachmentIcon sx={{ fontSize: '0.875rem', mr: 0.25 }} />
                    {task.attachments}
                  </Box>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Paper>
      )}
    </Draggable>
  );

  const KanbanColumn: React.FC<{ column: KanbanColumn }> = ({ column }) => (
    <Droppable droppableId={column.id}>
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.droppableProps}
          sx={{
            width: 320,
            minHeight: 600,
            p: 2,
            mr: 2,
            backgroundColor: snapshot.isDraggingOver ? 'action.hover' : 'background.paper',
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: column.color,
                }}
              />
              <Typography variant="h6" fontWeight="bold">
                {column.title}
              </Typography>
              <Badge badgeContent={column.tasks.length} color="primary" />
            </Box>
            <IconButton
              size="small"
              onClick={() => {
                setSelectedColumn(column.id);
                setNewTaskDialog(true);
              }}
            >
              <AddIcon />
            </IconButton>
          </Box>

          {column.tasks.map((task, index) => (
            <TaskCard key={task.id} task={task} index={index} />
          ))}
          {provided.placeholder}
        </Paper>
      )}
    </Droppable>
  );

  return (
    <Box sx={{ p: 3, overflowX: 'auto' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          {project?.name} - Kanban Board
        </Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<VisibilityIcon />}>
            Visualização
          </Button>
          <Button variant="contained" startIcon={<AddIcon />}>
            Nova Task
          </Button>
        </Box>
      </Box>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Box display="flex" sx={{ minWidth: 'max-content' }}>
          {columns.map((column) => (
            <KanbanColumn key={column.id} column={column} />
          ))}
        </Box>
      </DragDropContext>

      {/* Menu de contexto da task */}
      <Menu
        anchorEl={taskMenuAnchor}
        open={Boolean(taskMenuAnchor)}
        onClose={() => setTaskMenuAnchor(null)}
      >
        <MenuItem onClick={() => setTaskMenuAnchor(null)}>Editar</MenuItem>
        <MenuItem onClick={() => setTaskMenuAnchor(null)}>Duplicar</MenuItem>
        <MenuItem onClick={() => setTaskMenuAnchor(null)}>Mover para...</MenuItem>
        <MenuItem onClick={() => setTaskMenuAnchor(null)}>Arquivar</MenuItem>
        <MenuItem 
          onClick={() => {
            if (selectedTask) {
              deleteTask.mutate(selectedTask.id);
              setTaskMenuAnchor(null);
            }
          }}
          sx={{ color: 'error.main' }}
        >
          Excluir
        </MenuItem>
      </Menu>

      {/* Dialog para nova task */}
      <Dialog open={newTaskDialog} onClose={() => setNewTaskDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Task</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Título"
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Descrição"
            margin="normal"
            multiline
            rows={3}
          />
          <Box display="flex" gap={2} mt={2}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select label="Tipo" defaultValue="task">
                <MenuItem value="user_story">User Story</MenuItem>
                <MenuItem value="bug">Bug</MenuItem>
                <MenuItem value="task">Task</MenuItem>
                <MenuItem value="epic">Epic</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Prioridade</InputLabel>
              <Select label="Prioridade" defaultValue="medium">
                <MenuItem value="low">Baixa</MenuItem>
                <MenuItem value="medium">Média</MenuItem>
                <MenuItem value="high">Alta</MenuItem>
                <MenuItem value="critical">Crítica</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box display="flex" gap={2} mt={2}>
            <TextField
              fullWidth
              label="Story Points"
              type="number"
              inputProps={{ min: 0, max: 100 }}
            />
            <TextField
              fullWidth
              label="Data de Vencimento"
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewTaskDialog(false)}>Cancelar</Button>
          <Button variant="contained">Criar Task</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KanbanBoard; 