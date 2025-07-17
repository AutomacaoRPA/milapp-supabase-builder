import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  ViewKanban as KanbanIcon,
  ViewList as BacklogIcon,
  Schedule as SprintIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useProjects } from '../../hooks/useProjects';
import KanbanBoard from '../../components/Projects/KanbanBoard';
import BacklogView from '../../components/Projects/BacklogView';
import SprintPlanning from '../../components/Projects/SprintPlanning';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const Projects: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'automation',
    priority: 'medium',
    methodology: 'scrum',
  });

  const { projects, isLoading, error, createProject } = useProjects();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject.mutate(formData, {
      onSuccess: () => {
        setOpenDialog(false);
        setFormData({ name: '', description: '', type: 'automation', priority: 'medium', methodology: 'scrum' });
      },
    });
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId);
    setActiveTab(0); // Reset para a primeira aba
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'development':
        return 'primary';
      case 'testing':
        return 'warning';
      case 'deployed':
        return 'success';
      case 'planning':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getMethodologyIcon = (methodology: string) => {
    switch (methodology) {
      case 'scrum':
        return '🔄';
      case 'kanban':
        return '📋';
      case 'hybrid':
        return '⚡';
      default:
        return '📊';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Erro ao carregar projetos. Tente novamente.
        </Alert>
      </Box>
    );
  }

  // Se um projeto está selecionado, mostrar a interface de gestão
  if (selectedProject) {
    const project = projects?.find(p => p.id === selectedProject);
    
    return (
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header do projeto */}
        <Paper sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <Button
                variant="text"
                onClick={() => setSelectedProject('')}
                sx={{ minWidth: 'auto' }}
              >
                ← Voltar aos Projetos
              </Button>
              <Typography variant="h5" fontWeight="bold">
                {project?.name}
              </Typography>
              <Chip
                label={project?.status}
                color={getStatusColor(project?.status || '')}
                size="small"
              />
              <Chip
                label={project?.priority}
                color={getPriorityColor(project?.priority || '')}
                size="small"
              />
            </Box>
            <Box display="flex" gap={1}>
              <Tooltip title="Configurações do Projeto">
                <IconButton>
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          
          <Typography variant="body2" color="textSecondary" mt={1}>
            {project?.description}
          </Typography>
        </Paper>

        {/* Tabs de navegação */}
        <Paper sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            aria-label="project tabs"
          >
            <Tab
              icon={<KanbanIcon />}
              label="Kanban Board"
              iconPosition="start"
            />
            <Tab
              icon={<BacklogIcon />}
              label="Backlog"
              iconPosition="start"
            />
            <Tab
              icon={<SprintIcon />}
              label="Sprint Planning"
              iconPosition="start"
            />
            <Tab
              icon={<DashboardIcon />}
              label="Dashboard"
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        {/* Conteúdo das tabs */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <TabPanel value={activeTab} index={0}>
            <KanbanBoard projectId={selectedProject} />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <BacklogView projectId={selectedProject} />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <SprintPlanning projectId={selectedProject} />
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            <Box p={3}>
              <Typography variant="h6">Dashboard do Projeto</Typography>
              <Typography variant="body2" color="textSecondary">
                Métricas e analytics do projeto serão exibidos aqui.
              </Typography>
            </Box>
          </TabPanel>
        </Box>
      </Box>
    );
  }

  // Lista de projetos
  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Projetos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Novo Projeto
        </Button>
      </Box>

      <Grid container spacing={3}>
        {projects?.map((project) => (
          <Grid item xs={12} sm={6} md={4} key={project.id}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 4,
                },
              }}
              onClick={() => handleProjectSelect(project.id)}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" gutterBottom sx={{ flex: 1 }}>
                    {getMethodologyIcon(project.methodology || 'scrum')} {project.name}
                  </Typography>
                  <IconButton size="small">
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                
                <Typography variant="body2" color="textSecondary" paragraph>
                  {project.description}
                </Typography>
                
                <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                  <Chip
                    label={project.status}
                    color={getStatusColor(project.status)}
                    size="small"
                  />
                  <Chip
                    label={project.priority}
                    color={getPriorityColor(project.priority)}
                    size="small"
                  />
                  <Chip
                    label={project.type}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="textSecondary">
                    Criado em: {new Date(project.created_at).toLocaleDateString()}
                  </Typography>
                  {project.completion_percentage !== undefined && (
                    <Typography variant="caption" color="primary">
                      {Math.round(project.completion_percentage)}% completo
                    </Typography>
                  )}
                </Box>

                {project.completion_percentage !== undefined && (
                  <LinearProgress
                    variant="determinate"
                    value={project.completion_percentage}
                    sx={{ mt: 1, height: 4, borderRadius: 2 }}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog para criar projeto */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Novo Projeto</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Nome do Projeto"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Descrição"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
              required
            />
            <Box display="flex" gap={2} mt={2}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  label="Tipo"
                >
                  <MenuItem value="automation">Automação</MenuItem>
                  <MenuItem value="enhancement">Melhoria</MenuItem>
                  <MenuItem value="maintenance">Manutenção</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  label="Prioridade"
                >
                  <MenuItem value="low">Baixa</MenuItem>
                  <MenuItem value="medium">Média</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <FormControl fullWidth margin="normal">
              <InputLabel>Metodologia</InputLabel>
              <Select
                value={formData.methodology}
                onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                label="Metodologia"
              >
                <MenuItem value="scrum">Scrum</MenuItem>
                <MenuItem value="kanban">Kanban</MenuItem>
                <MenuItem value="hybrid">Híbrido</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createProject.isPending}
            >
              {createProject.isPending ? <CircularProgress size={20} /> : 'Criar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Projects; 