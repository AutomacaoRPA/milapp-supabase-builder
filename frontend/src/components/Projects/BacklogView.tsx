import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
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
  Switch,
  FormControlLabel,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  DragIndicator as DragIcon,
  Flag as FlagIcon,
  Schedule as ScheduleIcon,
  Comment as CommentIcon,
  Attachment as AttachmentIcon,
  Visibility as VisibilityIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
} from '@mui/icons-material';
import { useProjects, useTasks, useSprints } from '../../hooks/useProjects';

interface BacklogViewProps {
  projectId: string;
}

const BacklogView: React.FC<BacklogViewProps> = ({ projectId }) => {
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [newStoryDialog, setNewStoryDialog] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [storyMenuAnchor, setStoryMenuAnchor] = useState<null | HTMLElement>(null);

  const { useProject } = useProjects();
  const { tasks, createTask, updateTask, deleteTask } = useTasks(projectId);
  const { sprints } = useSprints(projectId);
  const { data: project } = useProject(projectId);

  // Filtrar e ordenar tasks
  const filteredTasks = React.useMemo(() => {
    if (!tasks) return [];

    let filtered = tasks.filter(task => {
      if (filterStatus !== 'all' && task.status !== filterStatus) return false;
      if (filterType !== 'all' && task.type !== filterType) return false;
      if (filterAssignee !== 'all' && task.assignee_id !== filterAssignee) return false;
      return true;
    });

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'story_points':
          aValue = a.story_points || 0;
          bValue = b.story_points || 0;
          break;
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
          bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          aValue = a[sortBy as keyof typeof a] || '';
          bValue = b[sortBy as keyof typeof b] || '';
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [tasks, filterStatus, filterType, filterAssignee, sortBy, sortOrder]);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'backlog': return 'default';
      case 'todo': return 'primary';
      case 'in_progress': return 'warning';
      case 'review': return 'info';
      case 'testing': return 'secondary';
      case 'done': return 'success';
      default: return 'default';
    }
  };

  const BacklogList: React.FC = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell width={50}></TableCell>
            <TableCell>ID</TableCell>
            <TableCell>Título</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Prioridade</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Responsável</TableCell>
            <TableCell>Story Points</TableCell>
            <TableCell>Vencimento</TableCell>
            <TableCell>Sprint</TableCell>
            <TableCell width={50}></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredTasks
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((task) => (
              <TableRow key={task.id} hover>
                <TableCell>
                  <DragIcon sx={{ cursor: 'grab', color: 'text.secondary' }} />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="textSecondary">
                    #{task.id.slice(-6)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {task.title}
                    </Typography>
                    {task.description && (
                      <Typography variant="caption" color="textSecondary">
                        {task.description.length > 50 
                          ? `${task.description.substring(0, 50)}...` 
                          : task.description}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.type.replace('_', ' ')}
                    size="small"
                    icon={<span>{getTypeIcon(task.type)}</span>}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.priority}
                    size="small"
                    sx={{
                      backgroundColor: getPriorityColor(task.priority),
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.status.replace('_', ' ')}
                    color={getStatusColor(task.status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {task.assignee ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar
                        src={task.assignee.avatar}
                        sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                      >
                        {task.assignee.name.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">{task.assignee.name}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      Não atribuído
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {task.story_points ? (
                    <Chip label={`${task.story_points} SP`} size="small" />
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {task.due_date ? (
                    <Typography variant="body2">
                      {new Date(task.due_date).toLocaleDateString()}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {task.sprint_id ? (
                    <Chip
                      label={sprints?.find(s => s.id === task.sprint_id)?.name || 'Sprint'}
                      size="small"
                      variant="outlined"
                    />
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      setStoryMenuAnchor(e.currentTarget);
                      setSelectedStory(task);
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredTasks.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="Linhas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />
    </TableContainer>
  );

  const BacklogBoard: React.FC = () => (
    <Box display="flex" gap={2} sx={{ overflowX: 'auto' }}>
      {['backlog', 'todo', 'in_progress', 'review', 'testing', 'done'].map((status) => (
        <Paper key={status} sx={{ minWidth: 300, p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">
              {status.replace('_', ' ').toUpperCase()}
            </Typography>
            <Chip
              label={filteredTasks.filter(t => t.status === status).length}
              color="primary"
              size="small"
            />
          </Box>
          <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
            {filteredTasks
              .filter(task => task.status === status)
              .map((task) => (
                <Paper
                  key={task.id}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 2 },
                  }}
                >
                  <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                    {getTypeIcon(task.type)} {task.title}
                  </Typography>
                  {task.description && (
                    <Typography variant="body2" color="textSecondary" mb={1}>
                      {task.description.length > 100 
                        ? `${task.description.substring(0, 100)}...` 
                        : task.description}
                    </Typography>
                  )}
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" gap={1}>
                      {task.story_points && (
                        <Chip label={`${task.story_points} SP`} size="small" />
                      )}
                      {task.assignee && (
                        <Avatar
                          src={task.assignee.avatar}
                          sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                        >
                          {task.assignee.name.charAt(0)}
                        </Avatar>
                      )}
                    </Box>
                    <Typography variant="caption" color="textSecondary">
                      #{task.id.slice(-6)}
                    </Typography>
                  </Box>
                </Paper>
              ))}
          </Box>
        </Paper>
      ))}
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          {project?.name} - Backlog
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant={viewMode === 'list' ? 'contained' : 'outlined'}
            startIcon={<ViewListIcon />}
            onClick={() => setViewMode('list')}
          >
            Lista
          </Button>
          <Button
            variant={viewMode === 'board' ? 'contained' : 'outlined'}
            startIcon={<ViewModuleIcon />}
            onClick={() => setViewMode('board')}
          >
            Board
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setNewStoryDialog(true)}>
            Nova User Story
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <Typography variant="subtitle2" fontWeight="bold">
            Filtros:
          </Typography>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="backlog">Backlog</MenuItem>
              <MenuItem value="todo">To Do</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="review">Review</MenuItem>
              <MenuItem value="testing">Testing</MenuItem>
              <MenuItem value="done">Done</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              label="Tipo"
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="user_story">User Story</MenuItem>
              <MenuItem value="bug">Bug</MenuItem>
              <MenuItem value="task">Task</MenuItem>
              <MenuItem value="epic">Epic</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Ordenar por</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Ordenar por"
            >
              <MenuItem value="priority">Prioridade</MenuItem>
              <MenuItem value="story_points">Story Points</MenuItem>
              <MenuItem value="due_date">Vencimento</MenuItem>
              <MenuItem value="created_at">Data de Criação</MenuItem>
            </Select>
          </FormControl>

          <IconButton
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            color={sortOrder === 'desc' ? 'primary' : 'default'}
          >
            <SortIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Conteúdo */}
      {viewMode === 'list' ? <BacklogList /> : <BacklogBoard />}

      {/* Menu de contexto */}
      <Menu
        anchorEl={storyMenuAnchor}
        open={Boolean(storyMenuAnchor)}
        onClose={() => setStoryMenuAnchor(null)}
      >
        <MenuItem onClick={() => setStoryMenuAnchor(null)}>Editar</MenuItem>
        <MenuItem onClick={() => setStoryMenuAnchor(null)}>Duplicar</MenuItem>
        <MenuItem onClick={() => setStoryMenuAnchor(null)}>Mover para Sprint</MenuItem>
        <MenuItem onClick={() => setStoryMenuAnchor(null)}>Arquivar</MenuItem>
        <MenuItem 
          onClick={() => {
            if (selectedStory) {
              deleteTask.mutate(selectedStory.id);
              setStoryMenuAnchor(null);
            }
          }}
          sx={{ color: 'error.main' }}
        >
          Excluir
        </MenuItem>
      </Menu>

      {/* Dialog para nova user story */}
      <Dialog open={newStoryDialog} onClose={() => setNewStoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nova User Story</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Título"
            margin="normal"
            required
            placeholder="Como [usuário], eu quero [funcionalidade] para [benefício]"
          />
          <TextField
            fullWidth
            label="Descrição"
            margin="normal"
            multiline
            rows={4}
            placeholder="Descreva os critérios de aceite e detalhes da user story..."
          />
          <Box display="flex" gap={2} mt={2}>
            <FormControl fullWidth>
              <InputLabel>Prioridade</InputLabel>
              <Select label="Prioridade" defaultValue="medium">
                <MenuItem value="low">Baixa</MenuItem>
                <MenuItem value="medium">Média</MenuItem>
                <MenuItem value="high">Alta</MenuItem>
                <MenuItem value="critical">Crítica</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Story Points"
              type="number"
              inputProps={{ min: 0, max: 100 }}
              placeholder="1, 2, 3, 5, 8, 13..."
            />
          </Box>
          <Box display="flex" gap={2} mt={2}>
            <TextField
              fullWidth
              label="Data de Vencimento"
              type="date"
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth>
              <InputLabel>Sprint</InputLabel>
              <Select label="Sprint">
                <MenuItem value="">Sem Sprint</MenuItem>
                {sprints?.map((sprint) => (
                  <MenuItem key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewStoryDialog(false)}>Cancelar</Button>
          <Button variant="contained">Criar User Story</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BacklogView; 