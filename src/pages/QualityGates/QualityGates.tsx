import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Approval as ApprovalIcon,
  History as HistoryIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useQualityGates } from '../../hooks/useQualityGates';

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
      id={`quality-gate-tabpanel-${index}`}
      aria-labelledby={`quality-gate-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const QualityGates: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tabValue, setTabValue] = useState(0);
  const [selectedGate, setSelectedGate] = useState<any>(null);
  const [showExecutionDialog, setShowExecutionDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [executionConfig, setExecutionConfig] = useState({
    environment: 'staging',
    timeout: 300,
    parallel: true,
  });
  const [approvalData, setApprovalData] = useState({
    decision: 'approved',
    comments: '',
    recommendations: '',
  });

  const {
    qualityGates,
    loading,
    error,
    executeGate,
    approveGate,
    fetchQualityGates,
    getGateDetails,
  } = useQualityGates();

  useEffect(() => {
    fetchQualityGates();
  }, [fetchQualityGates]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExecuteGate = async (gateId: string) => {
    setSelectedGate(qualityGates.find(gate => gate.id === gateId));
    setShowExecutionDialog(true);
  };

  const handleStartExecution = async () => {
    if (!selectedGate) return;
    
    try {
      await executeGate(selectedGate.id, executionConfig);
      setShowExecutionDialog(false);
      fetchQualityGates(); // Refresh data
    } catch (error) {
      console.error('Erro ao executar quality gate:', error);
    }
  };

  const handleApproveGate = async (gateId: string) => {
    setSelectedGate(qualityGates.find(gate => gate.id === gateId));
    setShowApprovalDialog(true);
  };

  const handleSubmitApproval = async () => {
    if (!selectedGate) return;
    
    try {
      await approveGate(selectedGate.id, approvalData);
      setShowApprovalDialog(false);
      fetchQualityGates(); // Refresh data
      } catch (error) {
      console.error('Erro ao aprovar quality gate:', error);
    }
  };

  const handleViewDetails = async (gateId: string) => {
    try {
      const details = await getGateDetails(gateId);
      setSelectedGate(details);
      setShowDetailsDialog(true);
    } catch (error) {
      console.error('Erro ao buscar detalhes:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'success';
      case 'failed': return 'error';
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckIcon />;
      case 'failed': return <ErrorIcon />;
      case 'pending': return <WarningIcon />;
      case 'in_progress': return <InfoIcon />;
      default: return <InfoIcon />;
    }
  };

  const getProgressValue = (gate: any) => {
    if (gate.status === 'passed') return 100;
    if (gate.status === 'failed') return 0;
    if (gate.status === 'in_progress') return 50;
    return 0;
  };

  const renderQualityGateCard = (gate: any) => (
    <Card key={gate.id} sx={{ mb: 2, position: 'relative' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {gate.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {gate.project_name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <Chip
                label={gate.type}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`Score: ${gate.score || 0}%`}
                size="small"
                color={gate.score >= 90 ? 'success' : gate.score >= 70 ? 'warning' : 'error'}
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={getStatusIcon(gate.status)}
              label={gate.status}
              color={getStatusColor(gate.status) as any}
              size="small"
            />
          </Box>
        </Box>

        <LinearProgress
          variant="determinate"
          value={getProgressValue(gate)}
          color={getStatusColor(gate.status) as any}
          sx={{ mb: 2 }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="textSecondary">
            Executado por: {gate.executed_by || 'N/A'}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {new Date(gate.executed_at || gate.created_at).toLocaleString()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ViewIcon />}
            onClick={() => handleViewDetails(gate.id)}
          >
            Detalhes
          </Button>
          
          {gate.status === 'pending' && (
            <Button
              size="small"
              variant="contained"
              startIcon={<PlayIcon />}
              onClick={() => handleExecuteGate(gate.id)}
            >
              Executar
            </Button>
          )}
          
          {gate.status === 'in_progress' && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<RefreshIcon />}
              disabled
            >
              Executando...
            </Button>
          )}
          
          {gate.status === 'passed' && (
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<ApprovalIcon />}
              onClick={() => handleApproveGate(gate.id)}
            >
              Aprovar
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const renderExecutionDialog = () => (
    <Dialog open={showExecutionDialog} onClose={() => setShowExecutionDialog(false)} maxWidth="sm" fullWidth>
      <DialogTitle>Executar Quality Gate</DialogTitle>
      <DialogContent>
        {selectedGate && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedGate.name}
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {selectedGate.description}
            </Typography>
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Ambiente</InputLabel>
              <Select
                value={executionConfig.environment}
                onChange={(e) => setExecutionConfig(prev => ({ ...prev, environment: e.target.value }))}
                label="Ambiente"
              >
                <MenuItem value="staging">Staging</MenuItem>
                <MenuItem value="production">Production</MenuItem>
                <MenuItem value="development">Development</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Timeout (segundos)"
              type="number"
              value={executionConfig.timeout}
              onChange={(e) => setExecutionConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
              sx={{ mt: 2 }}
            />
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Execução</InputLabel>
              <Select
                value={executionConfig.parallel ? 'parallel' : 'sequential'}
                onChange={(e) => setExecutionConfig(prev => ({ ...prev, parallel: e.target.value === 'parallel' }))}
                label="Execução"
              >
                <MenuItem value="parallel">Paralela</MenuItem>
                <MenuItem value="sequential">Sequencial</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowExecutionDialog(false)}>Cancelar</Button>
        <Button onClick={handleStartExecution} variant="contained" startIcon={<PlayIcon />}>
          Executar
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderApprovalDialog = () => (
    <Dialog open={showApprovalDialog} onClose={() => setShowApprovalDialog(false)} maxWidth="md" fullWidth>
      <DialogTitle>Aprovar Quality Gate</DialogTitle>
      <DialogContent>
        {selectedGate && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedGate.name}
            </Typography>
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Decisão</InputLabel>
              <Select
                value={approvalData.decision}
                onChange={(e) => setApprovalData(prev => ({ ...prev, decision: e.target.value }))}
                label="Decisão"
              >
                <MenuItem value="approved">Aprovado</MenuItem>
                <MenuItem value="rejected">Rejeitado</MenuItem>
                <MenuItem value="conditional">Aprovado com Condições</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Comentários"
              value={approvalData.comments}
              onChange={(e) => setApprovalData(prev => ({ ...prev, comments: e.target.value }))}
              sx={{ mt: 2 }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Recomendações"
              value={approvalData.recommendations}
              onChange={(e) => setApprovalData(prev => ({ ...prev, recommendations: e.target.value }))}
              sx={{ mt: 2 }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowApprovalDialog(false)}>Cancelar</Button>
        <Button onClick={handleSubmitApproval} variant="contained" color="success">
          Submeter Aprovação
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderDetailsDialog = () => (
    <Dialog open={showDetailsDialog} onClose={() => setShowDetailsDialog(false)} maxWidth="lg" fullWidth>
      <DialogTitle>Detalhes do Quality Gate</DialogTitle>
      <DialogContent>
        {selectedGate && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Informações Gerais
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Nome"
                          secondary={selectedGate.name}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Projeto"
                          secondary={selectedGate.project_name}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Tipo"
                          secondary={selectedGate.type}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Status"
                          secondary={
                            <Chip
                              icon={getStatusIcon(selectedGate.status)}
                              label={selectedGate.status}
                              color={getStatusColor(selectedGate.status) as any}
                              size="small"
                            />
                          }
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Score"
                          secondary={`${selectedGate.score || 0}%`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Critérios de Avaliação
                    </Typography>
                    <List dense>
                      {selectedGate.criteria?.map((criterion: any, index: number) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            {criterion.passed ? <CheckIcon color="success" /> : <ErrorIcon color="error" />}
                          </ListItemIcon>
                          <ListItemText
                            primary={criterion.name}
                            secondary={`${criterion.weight}% - ${criterion.description}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Logs de Execução
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Timestamp</TableCell>
                            <TableCell>Nível</TableCell>
                            <TableCell>Mensagem</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedGate.logs?.map((log: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                              <TableCell>
                                <Chip
                                  label={log.level}
                                  size="small"
                                  color={log.level === 'ERROR' ? 'error' : log.level === 'WARNING' ? 'warning' : 'default'}
                                />
                              </TableCell>
                              <TableCell>{log.message}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowDetailsDialog(false)}>Fechar</Button>
        <Button startIcon={<DownloadIcon />}>
          Exportar
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
        Quality Gates
      </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchQualityGates}
              >
            Atualizar
              </Button>
              <Button
                variant="contained"
            startIcon={<SettingsIcon />}
              >
            Configurar
              </Button>
        </Box>
                    </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="quality gates tabs">
          <Tab label="Todos" />
          <Tab label="Pendentes" />
          <Tab label="Em Execução" />
          <Tab label="Aprovados" />
          <Tab label="Falharam" />
        </Tabs>
      </Paper>

      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={2}>
          {qualityGates.map(renderQualityGateCard)}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={2}>
          {qualityGates.filter(gate => gate.status === 'pending').map(renderQualityGateCard)}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={2}>
          {qualityGates.filter(gate => gate.status === 'in_progress').map(renderQualityGateCard)}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={2}>
          {qualityGates.filter(gate => gate.status === 'passed').map(renderQualityGateCard)}
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <Grid container spacing={2}>
          {qualityGates.filter(gate => gate.status === 'failed').map(renderQualityGateCard)}
      </Grid>
      </TabPanel>

      {renderExecutionDialog()}
      {renderApprovalDialog()}
      {renderDetailsDialog()}
    </Box>
  );
};

export default QualityGates; 