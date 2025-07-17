import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Chip,
  Avatar,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  TrendingUp as VelocityIcon,
  Group as TeamIcon,
  Assignment as TaskIcon,
  Flag as PriorityIcon,
} from '@mui/icons-material';
import { useProjects, useTasks, useSprints } from '../../hooks/useProjects';

interface SprintPlanningProps {
  projectId: string;
}

const SprintPlanning: React.FC<SprintPlanningProps> = ({ projectId }) => {
  const [selectedSprint, setSelectedSprint] = useState<string>('');
  const [newSprintDialog, setNewSprintDialog] = useState(false);
  const [editSprintDialog, setEditSprintDialog] = useState(false);
  const [addTaskDialog, setAddTaskDialog] = useState(false);
  const [sprintToEdit, setSprintToEdit] = useState<any>(null);

  const { useProject } = useProjects();
  const { tasks, createTask, updateTask } = useTasks(projectId);
  const { sprints, createSprint, updateSprint, deleteSprint } = useSprints(projectId);
  const { data: project } = useProject(projectId);

  const currentSprint = sprints?.find(s => s.status === 'active');
  const backlogTasks = tasks?.filter(t => !t.sprint_id) || [];
  const sprintTasks = tasks?.filter(t => t.sprint_id === selectedSprint) || [];

  const calculateSprintMetrics = (sprintId: string) => {
    const sprintTasks = tasks?.filter(t => t.sprint_id === sprintId) || [];
    const totalPoints = sprintTasks.reduce((sum, task) => sum + (task.story_points || 0), 0);
    const completedPoints = sprintTasks
      .filter(t => t.status === 'done')
      .reduce((sum, task) => sum + (task.story_points || 0), 0);
    const completionPercentage = totalPoints > 0 ? (completedPoints / totalPoints) * 100 : 0;

    return {
      totalPoints,
      completedPoints,
      completionPercentage,
      taskCount: sprintTasks.length,
      completedTasks: sprintTasks.filter(t => t.status === 'done').length,
    };
  };

  const SprintCard: React.FC<{ sprint: any }> = ({ sprint }) => {
    const metrics = calculateSprintMetrics(sprint.id);
    const isActive = sprint.status === 'active';
    const isCompleted = sprint.status === 'completed';

    return (
      <Card 
        sx={{ 
          mb: 2, 
          border: isActive ? '2px solid #1976d2' : '1px solid #e0e0e0',
          backgroundColor: isActive ? '#f3f8ff' : 'background.paper',
        }}
      >
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {sprint.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {new Date(sprint.start_date).toLocaleDateString()} - {new Date(sprint.end_date).toLocaleDateString()}
              </Typography>
            </Box>
            <Box display="flex" gap={1}>
              <Chip
                label={sprint.status}
                color={
                  sprint.status === 'active' ? 'primary' :
                  sprint.status === 'completed' ? 'success' :
                  sprint.status === 'planning' ? 'warning' : 'default'
                }
                size="small"
              />
              <IconButton
                size="small"
                onClick={() => {
                  setSprintToEdit(sprint);
                  setEditSprintDialog(true);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {sprint.goal && (
            <Typography variant="body2" color="textSecondary" mb={2}>
              <strong>Objetivo:</strong> {sprint.goal}
            </Typography>
          )}

          <Grid container spacing={2} mb={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                Capacidade
              </Typography>
              <Typography variant="h6">
                {sprint.capacity} SP
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="textSecondary">
                Velocidade
              </Typography>
              <Typography variant="h6">
                {sprint.velocity || 0} SP
              </Typography>
            </Grid>
          </Grid>

          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="caption" color="textSecondary">
                Progresso ({metrics.completedPoints}/{metrics.totalPoints} SP)
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {Math.round(metrics.completionPercentage)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={metrics.completionPercentage}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" color="textSecondary">
              {metrics.completedTasks}/{metrics.taskCount} tasks concluídas
            </Typography>
            <Box display="flex" gap={1}>
              {sprint.status === 'planning' && (
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<StartIcon />}
                  onClick={() => updateSprint.mutate({
                    id: sprint.id,
                    status: 'active'
                  })}
                >
                  Iniciar
                </Button>
              )}
              {sprint.status === 'active' && (
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CompleteIcon />}
                  onClick={() => updateSprint.mutate({
                    id: sprint.id,
                    status: 'completed'
                  })}
                >
                  Finalizar
                </Button>
              )}
              <Button
                size="small"
                variant="outlined"
                onClick={() => setSelectedSprint(sprint.id)}
              >
                Ver Detalhes
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  const SprintBacklog: React.FC = () => {
    if (!selectedSprint) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            Selecione um Sprint para ver o backlog
          </Typography>
        </Paper>
      );
    }

    const sprint = sprints?.find(s => s.id === selectedSprint);
    const metrics = calculateSprintMetrics(selectedSprint);

    return (
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {sprint?.name} - Sprint Backlog
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {sprint?.goal}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddTaskDialog(true)}
          >
            Adicionar Task
          </Button>
        </Box>

        {/* Métricas do Sprint */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {metrics.totalPoints}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total de Story Points
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {metrics.completedPoints}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Story Points Concluídos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {metrics.taskCount}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Total de Tasks
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {Math.round(metrics.completionPercentage)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Progresso
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Lista de Tasks */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Título</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Prioridade</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Responsável</TableCell>
                <TableCell>Story Points</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sprintTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      #{task.id.slice(-6)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {task.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.type.replace('_', ' ')}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.priority}
                      size="small"
                      color={
                        task.priority === 'critical' ? 'error' :
                        task.priority === 'high' ? 'warning' :
                        task.priority === 'medium' ? 'info' : 'success'
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.status.replace('_', ' ')}
                      size="small"
                      color={
                        task.status === 'done' ? 'success' :
                        task.status === 'in_progress' ? 'warning' :
                        task.status === 'todo' ? 'primary' : 'default'
                      }
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
                    <Chip label={`${task.story_points || 0} SP`} size="small" />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => updateTask.mutate({
                        id: task.id,
                        status: task.status === 'done' ? 'in_progress' : 'done'
                      })}
                    >
                      <CompleteIcon 
                        fontSize="small" 
                        color={task.status === 'done' ? 'success' : 'action'}
                      />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Sprint Planning - {project?.name}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setNewSprintDialog(true)}
        >
          Novo Sprint
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Lista de Sprints */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Sprints
            </Typography>
            {sprints?.map((sprint) => (
              <SprintCard key={sprint.id} sprint={sprint} />
            ))}
            {sprints?.length === 0 && (
              <Typography variant="body2" color="textSecondary" textAlign="center">
                Nenhum sprint criado
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Sprint Backlog */}
        <Grid item xs={12} md={8}>
          <SprintBacklog />
        </Grid>
      </Grid>

      {/* Dialog para novo sprint */}
      <Dialog open={newSprintDialog} onClose={() => setNewSprintDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Novo Sprint</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nome do Sprint"
            margin="normal"
            required
            placeholder="Sprint 1, Sprint 2..."
          />
          <TextField
            fullWidth
            label="Objetivo do Sprint"
            margin="normal"
            multiline
            rows={3}
            placeholder="Qual é o objetivo principal deste sprint?"
          />
          <Box display="flex" gap={2} mt={2}>
            <TextField
              fullWidth
              label="Data de Início"
              type="date"
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              fullWidth
              label="Data de Fim"
              type="date"
              InputLabelProps={{ shrink: true }}
              required
            />
          </Box>
          <TextField
            fullWidth
            label="Capacidade (Story Points)"
            type="number"
            margin="normal"
            inputProps={{ min: 0 }}
            placeholder="Ex: 40"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewSprintDialog(false)}>Cancelar</Button>
          <Button variant="contained">Criar Sprint</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para adicionar task ao sprint */}
      <Dialog open={addTaskDialog} onClose={() => setAddTaskDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Adicionar Task ao Sprint</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" mb={2}>
            Tasks disponíveis no Backlog:
          </Typography>
          <List>
            {backlogTasks.map((task) => (
              <ListItem
                key={task.id}
                secondaryAction={
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      updateTask.mutate({
                        id: task.id,
                        sprint_id: selectedSprint
                      });
                      setAddTaskDialog(false);
                    }}
                  >
                    Adicionar
                  </Button>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <TaskIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={task.title}
                  secondary={`${task.story_points || 0} SP • ${task.priority} • ${task.type}`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTaskDialog(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SprintPlanning; 