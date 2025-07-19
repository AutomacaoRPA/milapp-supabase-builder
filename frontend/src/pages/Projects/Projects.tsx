import React, { useState, useMemo } from 'react';
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
  LinearProgress,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  ViewKanban as KanbanIcon,
  ViewList as BacklogIcon,
  Schedule as SprintIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  FileUpload as ImportIcon,
  FileDownload as ExportIcon,
} from '@mui/icons-material';
import { useProjects } from '../../hooks/useProjects';
import KanbanBoard from '../../components/Projects/KanbanBoard';
import BacklogView from '../../components/Projects/BacklogView';
import SprintPlanning from '../../components/Projects/SprintPlanning';
import EnhancedProjectCard from '../../components/Projects/EnhancedProjectCard';
import SmartFilters from '../../components/Projects/SmartFilters';
import KPIDashboard from '../../components/Projects/KPIDashboard';
import QuickActions, { FloatingQuickActions } from '../../components/Projects/QuickActions';
import { ProjectBreadcrumbs } from '../../components/Projects/EnhancedBreadcrumbs';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [currentView, setCurrentView] = useState<'grid' | 'list' | 'kanban'>('grid');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'automation',
    priority: 'medium',
    methodology: 'scrum',
  });

  const { projects, isLoading, error, createProject } = useProjects();

  // Filtrar projetos baseado na busca e filtros
  const filteredProjects = useMemo(() => {
    if (!projects) return [];

    return projects.filter(project => {
      // Filtro de busca
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          project.name.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower) ||
          project.type.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Filtros de status
      if (activeFilters.status && activeFilters.status.length > 0) {
        if (!activeFilters.status.includes(project.status)) return false;
      }

      // Filtros de tipo
      if (activeFilters.type && activeFilters.type.length > 0) {
        if (!activeFilters.type.includes(project.type)) return false;
      }

      // Filtros de metodologia
      if (activeFilters.methodology && activeFilters.methodology.length > 0) {
        if (!activeFilters.methodology.includes(project.methodology)) return false;
      }

      // Filtros de prioridade
      if (activeFilters.priority && activeFilters.priority.length > 0) {
        if (!activeFilters.priority.includes(project.priority)) return false;
      }

      // Filtro de atrasados
      if (activeFilters.overdue) {
        if (project.end_date) {
          const endDate = new Date(project.end_date);
          const today = new Date();
          if (endDate >= today || project.status === 'deployed') return false;
        } else {
          return false;
        }
      }

      // Filtro desta semana
      if (activeFilters.thisWeek) {
        if (project.end_date) {
          const endDate = new Date(project.end_date);
          const today = new Date();
          const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          if (endDate > weekFromNow || endDate < today) return false;
        } else {
          return false;
        }
      }

      // Filtro de alta prioridade
      if (activeFilters.highPriority) {
        if (project.priority !== 'high') return false;
      }

      return true;
    });
  }, [projects, searchQuery, activeFilters]);

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
    setActiveTab(0);
  };

  const handleEditProject = (projectId: string) => {
    // Implementar edição de projeto
    console.log('Editar projeto:', projectId);
  };

  const handleExecuteProject = (projectId: string) => {
    // Implementar execução de projeto
    console.log('Executar projeto:', projectId);
  };

  const handleProjectMetrics = (projectId: string) => {
    // Implementar visualização de métricas
    console.log('Métricas do projeto:', projectId);
  };

  const handleImport = () => {
    // Implementar importação
    console.log('Importar projetos');
  };

  const handleExport = () => {
    // Implementar exportação
    console.log('Exportar projetos');
  };

  const handleSettings = () => {
    // Implementar configurações
    console.log('Configurações');
  };

  const handleRefresh = () => {
    // Implementar refresh
    console.log('Atualizar projetos');
  };

  const handleNavigate = (path: string) => {
    // Implementar navegação
    console.log('Navegar para:', path);
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
        {/* Breadcrumbs */}
        <ProjectBreadcrumbs
          currentProject={project}
          onNavigate={handleNavigate}
        />

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
                color="primary"
                size="small"
              />
              <Chip
                label={project?.priority}
                color="secondary"
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

  // Lista de projetos com melhorias de CX
  return (
    <Box p={3}>
      {/* Header com título e ações */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={600}>
          📋 Projetos
        </Typography>
        
        {!isMobile && (
          <QuickActions
            onNewProject={() => setOpenDialog(true)}
            onImport={handleImport}
            onExport={handleExport}
            onSettings={handleSettings}
            onRefresh={handleRefresh}
            onViewChange={setCurrentView}
            currentView={currentView}
          />
        )}
      </Box>

      {/* KPIs Dashboard */}
      <KPIDashboard projects={projects || []} />

      {/* Filtros Inteligentes */}
      <SmartFilters
        projects={projects || []}
        onFilterChange={setActiveFilters}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Contador de resultados */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="body2" color="textSecondary">
          {filteredProjects.length} de {projects?.length || 0} projetos
        </Typography>
        
        {isMobile && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Atualizar
          </Button>
        )}
      </Box>

      {/* Grid de projetos melhorado */}
      <Grid container spacing={3}>
        {filteredProjects.map((project) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={project.id}>
            <EnhancedProjectCard
              project={project}
              onClick={handleProjectSelect}
              onEdit={handleEditProject}
              onExecute={handleExecuteProject}
              onMetrics={handleProjectMetrics}
            />
          </Grid>
        ))}
      </Grid>

      {/* Mensagem quando não há projetos */}
      {filteredProjects.length === 0 && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={8}
          textAlign="center"
        >
          <Typography variant="h6" color="textSecondary" mb={2}>
            {searchQuery || Object.values(activeFilters).some(f => 
              Array.isArray(f) ? f.length > 0 : f
            ) 
              ? 'Nenhum projeto encontrado com os filtros aplicados'
              : 'Nenhum projeto criado ainda'
            }
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={3}>
            {searchQuery || Object.values(activeFilters).some(f => 
              Array.isArray(f) ? f.length > 0 : f
            )
              ? 'Tente ajustar os filtros ou a busca'
              : 'Comece criando seu primeiro projeto'
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Criar Primeiro Projeto
          </Button>
        </Box>
      )}

      {/* Ações flutuantes para mobile */}
      {isMobile && (
        <FloatingQuickActions
          onNewProject={() => setOpenDialog(true)}
          onImport={handleImport}
          onExport={handleExport}
          onSettings={handleSettings}
          onRefresh={handleRefresh}
        />
      )}

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