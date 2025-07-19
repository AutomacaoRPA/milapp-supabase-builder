import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
  Grid,
  Card,
  CardContent,
  CardActions,
  LinearProgress,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as PassIcon,
  Cancel as FailIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  Speed as PerformanceIcon,
  BugReport as QualityIcon,
  Code as CodeIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useToast } from '@/hooks/use-toast';

interface QualityCriteria {
  id: string;
  name: string;
  description: string;
  category: 'security' | 'performance' | 'code_quality' | 'testing' | 'documentation' | 'deployment';
  weight: number; // 1-10
  threshold: number; // Valor mínimo para aprovação
  current_value?: number;
  status: 'pending' | 'passed' | 'failed' | 'warning';
  automated: boolean;
  manual_check_required: boolean;
}

interface QualityGate {
  id: string;
  name: string;
  description: string;
  project_id: string;
  criteria: QualityCriteria[];
  status: 'pending' | 'passed' | 'failed' | 'in_progress';
  overall_score: number;
  required_score: number;
  created_at: Date;
  updated_at: Date;
  executed_at?: Date;
}

interface QualityGatesManagerProps {
  projectId: string;
  projectData?: any;
}

const QualityGatesManager: React.FC<QualityGatesManagerProps> = ({ 
  projectId, 
  projectData 
}) => {
  const [qualityGates, setQualityGates] = useState<QualityGate[]>([]);
  const [selectedGate, setSelectedGate] = useState<QualityGate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editingGate, setEditingGate] = useState<QualityGate | null>(null);
  const [criteriaDialog, setCriteriaDialog] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<QualityCriteria | null>(null);
  const { toast } = useToast();

  // Critérios padrão
  const defaultCriteria: QualityCriteria[] = [
    {
      id: 'security-scan',
      name: 'Análise de Segurança',
      description: 'Verificação de vulnerabilidades de segurança',
      category: 'security',
      weight: 9,
      threshold: 8,
      status: 'pending',
      automated: true,
      manual_check_required: false,
    },
    {
      id: 'code-coverage',
      name: 'Cobertura de Código',
      description: 'Percentual de cobertura de testes',
      category: 'testing',
      weight: 7,
      threshold: 80,
      status: 'pending',
      automated: true,
      manual_check_required: false,
    },
    {
      id: 'performance-test',
      name: 'Teste de Performance',
      description: 'Tempo de resposta e throughput',
      category: 'performance',
      weight: 8,
      threshold: 7,
      status: 'pending',
      automated: true,
      manual_check_required: false,
    },
    {
      id: 'code-quality',
      name: 'Qualidade do Código',
      description: 'Análise estática de código',
      category: 'code_quality',
      weight: 6,
      threshold: 7,
      status: 'pending',
      automated: true,
      manual_check_required: false,
    },
    {
      id: 'documentation',
      name: 'Documentação',
      description: 'Completude da documentação',
      category: 'documentation',
      weight: 5,
      threshold: 6,
      status: 'pending',
      automated: false,
      manual_check_required: true,
    },
    {
      id: 'deployment-readiness',
      name: 'Prontidão para Deploy',
      description: 'Verificação de readiness para produção',
      category: 'deployment',
      weight: 8,
      threshold: 8,
      status: 'pending',
      automated: false,
      manual_check_required: true,
    },
  ];

  useEffect(() => {
    loadQualityGates();
  }, [projectId]);

  const loadQualityGates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/projects/${projectId}/quality-gates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQualityGates(data.quality_gates || []);
      }
    } catch (error) {
      console.error('Erro ao carregar quality gates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createQualityGate = async () => {
    const newGate: QualityGate = {
      id: Date.now().toString(),
      name: 'Quality Gate Padrão',
      description: 'Quality gate padrão para o projeto',
      project_id: projectId,
      criteria: [...defaultCriteria],
      status: 'pending',
      overall_score: 0,
      required_score: 7.5,
      created_at: new Date(),
      updated_at: new Date(),
    };

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/quality-gates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
        body: JSON.stringify(newGate),
      });

      if (response.ok) {
        const createdGate = await response.json();
        setQualityGates(prev => [createdGate, ...prev]);
        toast({
          title: "Quality Gate Criado",
          description: "Quality gate criado com sucesso!",
        });
      }
    } catch (error) {
      console.error('Erro ao criar quality gate:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o quality gate",
        variant: "destructive",
      });
    }
  };

  const executeQualityGate = async (gate: QualityGate) => {
    setIsExecuting(true);
    try {
      // Simular execução dos critérios automatizados
      const updatedCriteria = gate.criteria.map(criteria => {
        if (criteria.automated) {
          // Simular valores baseados no tipo de critério
          let value = 0;
          switch (criteria.category) {
            case 'security':
              value = Math.random() * 10; // 0-10
              break;
            case 'testing':
              value = 70 + Math.random() * 30; // 70-100%
              break;
            case 'performance':
              value = 6 + Math.random() * 4; // 6-10
              break;
            case 'code_quality':
              value = 6 + Math.random() * 4; // 6-10
              break;
            default:
              value = 5 + Math.random() * 5; // 5-10
          }

          return {
            ...criteria,
            current_value: value,
            status: value >= criteria.threshold ? 'passed' : 'failed',
          };
        }
        return criteria;
      });

      // Calcular score geral
      const totalWeight = updatedCriteria.reduce((sum, c) => sum + c.weight, 0);
      const weightedScore = updatedCriteria.reduce((sum, c) => {
        if (c.current_value !== undefined) {
          return sum + (c.current_value * c.weight);
        }
        return sum;
      }, 0);
      const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

      // Determinar status geral
      const failedCriteria = updatedCriteria.filter(c => c.status === 'failed');
      const status = failedCriteria.length > 0 ? 'failed' : 
                    overallScore >= gate.required_score ? 'passed' : 'warning';

      const updatedGate: QualityGate = {
        ...gate,
        criteria: updatedCriteria,
        overall_score: overallScore,
        status,
        executed_at: new Date(),
        updated_at: new Date(),
      };

      // Salvar no backend
      const response = await fetch(`/api/v1/projects/${projectId}/quality-gates/${gate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
        body: JSON.stringify(updatedGate),
      });

      if (response.ok) {
        const savedGate = await response.json();
        setQualityGates(prev => prev.map(g => g.id === savedGate.id ? savedGate : g));
        setSelectedGate(savedGate);
        
        toast({
          title: "Quality Gate Executado",
          description: `Score: ${overallScore.toFixed(1)}/10 - Status: ${status}`,
        });
      }
    } catch (error) {
      console.error('Erro ao executar quality gate:', error);
      toast({
        title: "Erro",
        description: "Não foi possível executar o quality gate",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const updateManualCriteria = async (gateId: string, criteriaId: string, value: number) => {
    const gate = qualityGates.find(g => g.id === gateId);
    if (!gate) return;

    const updatedCriteria = gate.criteria.map(c => {
      if (c.id === criteriaId) {
        return {
          ...c,
          current_value: value,
          status: value >= c.threshold ? 'passed' : 'failed',
        };
      }
      return c;
    });

    // Recalcular score
    const totalWeight = updatedCriteria.reduce((sum, c) => sum + c.weight, 0);
    const weightedScore = updatedCriteria.reduce((sum, c) => {
      if (c.current_value !== undefined) {
        return sum + (c.current_value * c.weight);
      }
      return sum;
    }, 0);
    const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

    const failedCriteria = updatedCriteria.filter(c => c.status === 'failed');
    const status = failedCriteria.length > 0 ? 'failed' : 
                  overallScore >= gate.required_score ? 'passed' : 'warning';

    const updatedGate: QualityGate = {
      ...gate,
      criteria: updatedCriteria,
      overall_score: overallScore,
      status,
      updated_at: new Date(),
    };

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/quality-gates/${gateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
        body: JSON.stringify(updatedGate),
      });

      if (response.ok) {
        const savedGate = await response.json();
        setQualityGates(prev => prev.map(g => g.id === savedGate.id ? savedGate : g));
        setSelectedGate(savedGate);
      }
    } catch (error) {
      console.error('Erro ao atualizar critério:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <PassIcon color="success" />;
      case 'failed': return <FailIcon color="error" />;
      case 'warning': return <WarningIcon color="warning" />;
      default: return <AssessmentIcon color="action" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'success';
      case 'failed': return 'error';
      case 'warning': return 'warning';
      case 'in_progress': return 'info';
      default: return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <SecurityIcon />;
      case 'performance': return <PerformanceIcon />;
      case 'code_quality': return <CodeIcon />;
      case 'testing': return <QualityIcon />;
      case 'documentation': return <AssessmentIcon />;
      case 'deployment': return <AssessmentIcon />;
      default: return <AssessmentIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'security': return 'error';
      case 'performance': return 'warning';
      case 'code_quality': return 'info';
      case 'testing': return 'success';
      case 'documentation': return 'primary';
      case 'deployment': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Quality Gates
      </Typography>
      <Typography variant="body1" color="textSecondary" mb={3}>
        Gerencie critérios de qualidade e validação para seus projetos
      </Typography>

      <Grid container spacing={3}>
        {/* Lista de Quality Gates */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Quality Gates
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={createQualityGate}
                size="small"
              >
                Novo
              </Button>
            </Box>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {qualityGates.map((gate) => (
                  <ListItem
                    key={gate.id}
                    button
                    onClick={() => setSelectedGate(gate)}
                    selected={selectedGate?.id === gate.id}
                    sx={{ mb: 1, borderRadius: 1 }}
                  >
                    <ListItemIcon>
                      {getStatusIcon(gate.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={gate.name}
                      secondary={`Score: ${gate.overall_score.toFixed(1)}/10`}
                    />
                    <Chip
                      label={gate.status}
                      color={getStatusColor(gate.status) as any}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Detalhes do Quality Gate */}
        <Grid item xs={12} md={8}>
          {selectedGate ? (
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {selectedGate.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setEditingGate(selectedGate);
                      setEditDialog(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => executeQualityGate(selectedGate)}
                    disabled={isExecuting}
                    startIcon={isExecuting ? <CircularProgress size={20} /> : <AssessmentIcon />}
                  >
                    {isExecuting ? 'Executando...' : 'Executar'}
                  </Button>
                </Box>
              </Box>

              <Typography variant="body2" color="textSecondary" mb={2}>
                {selectedGate.description}
              </Typography>

              {/* Score Geral */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    Score Geral: {selectedGate.overall_score.toFixed(1)}/10
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Mínimo: {selectedGate.required_score}/10
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(selectedGate.overall_score / 10) * 100}
                  color={selectedGate.overall_score >= selectedGate.required_score ? 'success' : 'error'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              {/* Critérios */}
              <Typography variant="h6" gutterBottom>
                Critérios de Qualidade
              </Typography>

              {selectedGate.criteria.map((criteria) => (
                <Accordion key={criteria.id} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      {getStatusIcon(criteria.status)}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1">
                          {criteria.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {criteria.description}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={criteria.category.replace('_', ' ')}
                          color={getCategoryColor(criteria.category) as any}
                          size="small"
                          icon={getCategoryIcon(criteria.category)}
                        />
                        <Chip
                          label={`Peso: ${criteria.weight}`}
                          variant="outlined"
                          size="small"
                        />
                        {criteria.current_value !== undefined && (
                          <Typography variant="body2">
                            {criteria.current_value.toFixed(1)}/{criteria.threshold}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Typography variant="body2" color="textSecondary" mb={2}>
                        Threshold: {criteria.threshold} | Peso: {criteria.weight}
                      </Typography>

                      {criteria.manual_check_required && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" gutterBottom>
                            Avaliação Manual:
                          </Typography>
                          <Rating
                            value={criteria.current_value || 0}
                            max={10}
                            onChange={(_, value) => {
                              if (value !== null) {
                                updateManualCriteria(selectedGate.id, criteria.id, value);
                              }
                            }}
                          />
                          <Typography variant="caption" display="block" mt={1}>
                            Avalie de 1 a 10
                          </Typography>
                        </Box>
                      )}

                      {criteria.automated && criteria.current_value !== undefined && (
                        <Box>
                          <Typography variant="body2" gutterBottom>
                            Resultado Automatizado:
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(criteria.current_value / 10) * 100}
                            color={criteria.current_value >= criteria.threshold ? 'success' : 'error'}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption" display="block" mt={1}>
                            {criteria.current_value.toFixed(1)}/10
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Paper>
          ) : (
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Selecione um quality gate para ver os detalhes
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Dialog de Edição */}
      <Dialog
        open={editDialog}
        onClose={() => setEditDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Editar Quality Gate</DialogTitle>
        <DialogContent>
          {editingGate && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Nome"
                value={editingGate.name}
                onChange={(e) => setEditingGate(prev => prev ? {
                  ...prev,
                  name: e.target.value
                } : null)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Descrição"
                value={editingGate.description}
                onChange={(e) => setEditingGate(prev => prev ? {
                  ...prev,
                  description: e.target.value
                } : null)}
                margin="normal"
                multiline
                rows={3}
              />
              <TextField
                fullWidth
                label="Score Mínimo Requerido"
                type="number"
                value={editingGate.required_score}
                onChange={(e) => setEditingGate(prev => prev ? {
                  ...prev,
                  required_score: parseFloat(e.target.value)
                } : null)}
                margin="normal"
                inputProps={{ min: 0, max: 10, step: 0.1 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancelar</Button>
          <Button onClick={() => {
            // Salvar alterações
            setEditDialog(false);
            setEditingGate(null);
          }} variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QualityGatesManager; 