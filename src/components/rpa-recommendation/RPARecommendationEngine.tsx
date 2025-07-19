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
  Slider,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Rating,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  AutoFixHigh as RPAIcon,
  TrendingUp as ROIIcon,
  Speed as PerformanceIcon,
  Assessment as AnalysisIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as RecommendedIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Calculate as CalculateIcon,
  Timeline as TimelineIcon,
  AttachMoney as MoneyIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { useToast } from '@/hooks/use-toast';

interface ProcessStep {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  time_spent_minutes: number;
  complexity: 'low' | 'medium' | 'high';
  automation_potential: number; // 0-100
  manual_effort_hours: number;
  error_rate: number; // 0-100
  business_impact: 'low' | 'medium' | 'high' | 'critical';
}

interface RPARecommendation {
  id: string;
  process_name: string;
  description: string;
  process_steps: ProcessStep[];
  automation_potential: number; // 0-100
  estimated_roi: number; // Return on Investment percentage
  implementation_effort: 'low' | 'medium' | 'high';
  implementation_cost: number;
  annual_savings: number;
  payback_period_months: number;
  risk_level: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'analyzed' | 'approved' | 'in_progress' | 'implemented' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

interface RPARecommendationEngineProps {
  projectId: string;
  projectData?: any;
}

const RPARecommendationEngine: React.FC<RPARecommendationEngineProps> = ({ 
  projectId, 
  projectData 
}) => {
  const [recommendations, setRecommendations] = useState<RPARecommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<RPARecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisDialog, setAnalysisDialog] = useState(false);
  const [newProcessDialog, setNewProcessDialog] = useState(false);
  const [editingProcess, setEditingProcess] = useState<RPARecommendation | null>(null);
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
  const { toast } = useToast();

  // Processos padrão para análise
  const defaultProcesses = [
    {
      name: 'Processamento de Faturas',
      description: 'Análise e processamento manual de faturas recebidas',
      steps: [
        {
          name: 'Recebimento de Faturas',
          description: 'Download e organização de faturas por email',
          frequency: 'daily' as const,
          time_spent_minutes: 30,
          complexity: 'low' as const,
          automation_potential: 90,
          manual_effort_hours: 0.5,
          error_rate: 5,
          business_impact: 'medium' as const,
        },
        {
          name: 'Extração de Dados',
          description: 'Digitação manual de dados das faturas',
          frequency: 'daily' as const,
          time_spent_minutes: 120,
          complexity: 'medium' as const,
          automation_potential: 85,
          manual_effort_hours: 2,
          error_rate: 8,
          business_impact: 'high' as const,
        },
        {
          name: 'Validação e Aprovação',
          description: 'Verificação manual de valores e aprovação',
          frequency: 'daily' as const,
          time_spent_minutes: 60,
          complexity: 'high' as const,
          automation_potential: 70,
          manual_effort_hours: 1,
          error_rate: 3,
          business_impact: 'critical' as const,
        },
      ],
    },
    {
      name: 'Relatórios Mensais',
      description: 'Geração e distribuição de relatórios mensais',
      steps: [
        {
          name: 'Coleta de Dados',
          description: 'Coleta manual de dados de diferentes sistemas',
          frequency: 'monthly' as const,
          time_spent_minutes: 240,
          complexity: 'medium' as const,
          automation_potential: 80,
          manual_effort_hours: 4,
          error_rate: 10,
          business_impact: 'high' as const,
        },
        {
          name: 'Consolidação',
          description: 'Consolidação manual dos dados coletados',
          frequency: 'monthly' as const,
          time_spent_minutes: 180,
          complexity: 'high' as const,
          automation_potential: 75,
          manual_effort_hours: 3,
          error_rate: 12,
          business_impact: 'high' as const,
        },
        {
          name: 'Formatação e Distribuição',
          description: 'Formatação do relatório e envio por email',
          frequency: 'monthly' as const,
          time_spent_minutes: 120,
          complexity: 'low' as const,
          automation_potential: 95,
          manual_effort_hours: 2,
          error_rate: 2,
          business_impact: 'medium' as const,
        },
      ],
    },
  ];

  useEffect(() => {
    loadRecommendations();
  }, [projectId]);

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/v1/projects/${projectId}/rpa-recommendations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Erro ao carregar recomendações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeProcess = async (processData: any) => {
    setIsAnalyzing(true);
    try {
      // Calcular métricas de automação
      const totalSteps = processData.steps.length;
      const avgAutomationPotential = processData.steps.reduce((sum: number, step: ProcessStep) => 
        sum + step.automation_potential, 0) / totalSteps;
      
      const totalManualHours = processData.steps.reduce((sum: number, step: ProcessStep) => 
        sum + step.manual_effort_hours, 0);
      
      const avgErrorRate = processData.steps.reduce((sum: number, step: ProcessStep) => 
        sum + step.error_rate, 0) / totalSteps;

      // Calcular ROI
      const hourlyCost = 50; // Custo por hora de trabalho manual
      const annualManualCost = totalManualHours * hourlyCost * 12;
      const implementationCost = calculateImplementationCost(avgAutomationPotential, totalSteps);
      const annualSavings = annualManualCost * (avgAutomationPotential / 100);
      const roi = ((annualSavings - implementationCost) / implementationCost) * 100;
      const paybackPeriod = implementationCost / (annualSavings / 12);

      // Determinar esforço de implementação
      const implementationEffort = avgAutomationPotential > 80 ? 'low' : 
                                  avgAutomationPotential > 60 ? 'medium' : 'high';

      // Determinar nível de risco
      const riskLevel = avgErrorRate > 10 ? 'high' : 
                       avgErrorRate > 5 ? 'medium' : 'low';

      // Determinar prioridade
      const priority = roi > 200 ? 'critical' :
                      roi > 100 ? 'high' :
                      roi > 50 ? 'medium' : 'low';

      const recommendation: RPARecommendation = {
        id: Date.now().toString(),
        process_name: processData.name,
        description: processData.description,
        process_steps: processData.steps.map((step: any, index: number) => ({
          ...step,
          id: `${Date.now()}-${index}`,
        })),
        automation_potential: avgAutomationPotential,
        estimated_roi: roi,
        implementation_effort,
        implementation_cost: implementationCost,
        annual_savings: annualSavings,
        payback_period_months: paybackPeriod,
        risk_level: riskLevel,
        priority,
        status: 'analyzed',
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Salvar no backend
      const response = await fetch(`/api/v1/projects/${projectId}/rpa-recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
        body: JSON.stringify(recommendation),
      });

      if (response.ok) {
        const savedRecommendation = await response.json();
        setRecommendations(prev => [savedRecommendation, ...prev]);
        toast({
          title: "Análise Concluída",
          description: `ROI estimado: ${roi.toFixed(1)}% | Payback: ${paybackPeriod.toFixed(1)} meses`,
        });
        setAnalysisDialog(false);
      }
    } catch (error) {
      console.error('Erro ao analisar processo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível analisar o processo",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateImplementationCost = (automationPotential: number, stepsCount: number) => {
    // Custo base de implementação RPA
    const baseCost = 15000; // Custo base por processo
    const complexityMultiplier = automationPotential < 70 ? 1.5 : 1;
    const stepsMultiplier = stepsCount > 5 ? 1.3 : 1;
    
    return baseCost * complexityMultiplier * stepsMultiplier;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return 'success';
      case 'in_progress': return 'info';
      case 'approved': return 'primary';
      case 'rejected': return 'error';
      case 'analyzed': return 'default';
      default: return 'default';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      default: return 'default';
    }
  };

  const getROIColor = (roi: number) => {
    if (roi > 200) return 'success';
    if (roi > 100) return 'warning';
    if (roi > 50) return 'info';
    return 'error';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Recomendação RPA
      </Typography>
      <Typography variant="body1" color="textSecondary" mb={3}>
        Analise processos e identifique oportunidades de automação RPA
      </Typography>

      <Grid container spacing={3}>
        {/* Lista de Recomendações */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Recomendações
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setNewProcessDialog(true)}
                size="small"
              >
                Analisar Processo
              </Button>
            </Box>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {recommendations.map((recommendation) => (
                  <ListItem
                    key={recommendation.id}
                    button
                    onClick={() => setSelectedRecommendation(recommendation)}
                    selected={selectedRecommendation?.id === recommendation.id}
                    sx={{ mb: 1, borderRadius: 1 }}
                  >
                    <ListItemIcon>
                      <RPAIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={recommendation.process_name}
                      secondary={`ROI: ${recommendation.estimated_roi.toFixed(1)}%`}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <Chip
                        label={recommendation.priority}
                        color={getPriorityColor(recommendation.priority) as any}
                        size="small"
                        sx={{ mb: 0.5 }}
                      />
                      <Chip
                        label={recommendation.status}
                        color={getStatusColor(recommendation.status) as any}
                        size="small"
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Detalhes da Recomendação */}
        <Grid item xs={12} md={8}>
          {selectedRecommendation ? (
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {selectedRecommendation.process_name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={`ROI: ${selectedRecommendation.estimated_roi.toFixed(1)}%`}
                    color={getROIColor(selectedRecommendation.estimated_roi) as any}
                    icon={<ROIIcon />}
                  />
                  <Chip
                    label={`Payback: ${selectedRecommendation.payback_period_months.toFixed(1)} meses`}
                    color="info"
                    icon={<TimelineIcon />}
                  />
                </Box>
              </Box>

              <Typography variant="body2" color="textSecondary" mb={3}>
                {selectedRecommendation.description}
              </Typography>

              {/* Métricas Principais */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {selectedRecommendation.automation_potential.toFixed(0)}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Potencial de Automação
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {formatCurrency(selectedRecommendation.annual_savings)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Economia Anual
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="warning.main">
                        {formatCurrency(selectedRecommendation.implementation_cost)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Custo de Implementação
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="info.main">
                        {selectedRecommendation.payback_period_months.toFixed(1)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Meses para Payback
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Passos do Processo */}
              <Typography variant="h6" gutterBottom>
                Passos do Processo
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Passo</TableCell>
                      <TableCell>Frequência</TableCell>
                      <TableCell>Tempo (min)</TableCell>
                      <TableCell>Automação</TableCell>
                      <TableCell>Complexidade</TableCell>
                      <TableCell>Impacto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRecommendation.process_steps.map((step) => (
                      <TableRow key={step.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {step.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {step.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={step.frequency} size="small" />
                        </TableCell>
                        <TableCell>{step.time_spent_minutes}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={step.automation_potential}
                              sx={{ width: 60, height: 6 }}
                            />
                            <Typography variant="caption">
                              {step.automation_potential}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={step.complexity}
                            color={step.complexity === 'high' ? 'error' : 
                                   step.complexity === 'medium' ? 'warning' : 'success'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={step.business_impact}
                            color={step.business_impact === 'critical' ? 'error' : 
                                   step.business_impact === 'high' ? 'warning' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Recomendações */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Recomendações
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          <RecommendedIcon color="success" sx={{ mr: 1 }} />
                          Pontos Positivos
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemText 
                              primary="Alto potencial de automação"
                              secondary={`${selectedRecommendation.automation_potential.toFixed(0)}% dos passos podem ser automatizados`}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="ROI atrativo"
                              secondary={`${selectedRecommendation.estimated_roi.toFixed(1)}% de retorno sobre investimento`}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="Payback rápido"
                              secondary={`${selectedRecommendation.payback_period_months.toFixed(1)} meses para recuperar o investimento`}
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          <WarningIcon color="warning" sx={{ mr: 1 }} />
                          Considerações
                        </Typography>
                        <List dense>
                          <ListItem>
                            <ListItemText 
                              primary="Esforço de implementação"
                              secondary={`Nível ${selectedRecommendation.implementation_effort}`}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="Nível de risco"
                              secondary={`Risco ${selectedRecommendation.risk_level}`}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText 
                              primary="Custo inicial"
                              secondary={formatCurrency(selectedRecommendation.implementation_cost)}
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Selecione uma recomendação para ver os detalhes
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Dialog de Análise de Processo */}
      <Dialog
        open={newProcessDialog}
        onClose={() => setNewProcessDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Analisar Processo para RPA</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" mb={2}>
            Selecione um processo padrão para análise ou crie um novo:
          </Typography>
          
          <Grid container spacing={2}>
            {defaultProcesses.map((process, index) => (
              <Grid item xs={12} key={index}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {process.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" mb={2}>
                      {process.description}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {process.steps.length} passos identificados
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => analyzeProcess(process)}
                      disabled={isAnalyzing}
                      startIcon={isAnalyzing ? <CircularProgress size={16} /> : <AnalysisIcon />}
                    >
                      {isAnalyzing ? 'Analisando...' : 'Analisar'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewProcessDialog(false)}>Cancelar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RPARecommendationEngine; 