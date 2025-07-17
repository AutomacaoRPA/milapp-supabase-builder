import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  GanttChart, 
  Target, 
  Users, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  Shield,
  Zap,
  BarChart3,
  Activity,
  GitBranch,
  Settings,
  Eye,
  Edit,
  Plus,
  Download,
  Upload
} from "lucide-react";

interface ProjectPhase {
  id: string;
  name: string;
  type: 'initiation' | 'planning' | 'execution' | 'monitoring' | 'closing';
  methodology: 'agile' | 'pmp' | 'hybrid';
  start_date: string;
  end_date: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  deliverables: Deliverable[];
  risks: Risk[];
  stakeholders: Stakeholder[];
  budget_planned: number;
  budget_actual: number;
  effort_planned: number;
  effort_actual: number;
}

interface Deliverable {
  id: string;
  name: string;
  description: string;
  type: 'document' | 'code' | 'test' | 'deployment' | 'training';
  status: 'pending' | 'in_progress' | 'review' | 'approved' | 'completed';
  due_date: string;
  assigned_to: string;
  quality_gate: string;
  acceptance_criteria: string[];
}

interface Risk {
  id: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  status: 'identified' | 'mitigated' | 'occurred' | 'closed';
  mitigation_plan: string;
  owner: string;
  due_date: string;
}

interface Stakeholder {
  id: string;
  name: string;
  role: string;
  influence: 'low' | 'medium' | 'high';
  interest: 'low' | 'medium' | 'high';
  engagement_level: 'unaware' | 'resistant' | 'neutral' | 'supportive' | 'leading';
  communication_plan: string;
}

interface Sprint {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'planning' | 'active' | 'completed';
  capacity: number;
  velocity: number;
  burndown_data: BurndownPoint[];
  retrospective_notes: string;
  action_items: string[];
}

interface BurndownPoint {
  date: string;
  remaining_points: number;
  ideal_points: number;
}

interface HybridProjectGovernanceProps {
  project: {
    id: string;
    name: string;
    description: string;
    methodology: 'agile' | 'pmp' | 'hybrid';
    phases: ProjectPhase[];
    sprints: Sprint[];
    stakeholders: Stakeholder[];
    risks: Risk[];
    quality_gates: QualityGate[];
    change_requests: ChangeRequest[];
  };
  onUpdatePhase: (phaseId: string, updates: Partial<ProjectPhase>) => void;
  onUpdateDeliverable: (deliverableId: string, updates: Partial<Deliverable>) => void;
  onUpdateRisk: (riskId: string, updates: Partial<Risk>) => void;
  onUpdateStakeholder: (stakeholderId: string, updates: Partial<Stakeholder>) => void;
}

interface QualityGate {
  id: string;
  name: string;
  phase: string;
  criteria: string[];
  status: 'pending' | 'in_progress' | 'passed' | 'failed';
  approver: string;
  due_date: string;
}

interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  type: 'scope' | 'schedule' | 'cost' | 'quality' | 'risk';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'implemented';
  impact_analysis: string;
  requested_by: string;
  requested_date: string;
  approved_by?: string;
  approved_date?: string;
}

const HybridProjectGovernance: React.FC<HybridProjectGovernanceProps> = ({
  project,
  onUpdatePhase,
  onUpdateDeliverable,
  onUpdateRisk,
  onUpdateStakeholder,
}) => {
  const [activeTab, setActiveTab] = useState("overview");

  const getPhaseColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (probability: string, impact: string) => {
    if (probability === 'high' && impact === 'high') return 'bg-red-100 text-red-800';
    if (probability === 'high' || impact === 'high') return 'bg-orange-100 text-orange-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStakeholderEngagementColor = (level: string) => {
    switch (level) {
      case 'leading': return 'bg-green-100 text-green-800';
      case 'supportive': return 'bg-blue-100 text-blue-800';
      case 'neutral': return 'bg-yellow-100 text-yellow-800';
      case 'resistant': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProjectProgress = () => {
    const totalPhases = project.phases.length;
    const completedPhases = project.phases.filter(p => p.status === 'completed').length;
    return (completedPhases / totalPhases) * 100;
  };

  const calculateBudgetVariance = () => {
    const totalPlanned = project.phases.reduce((sum, phase) => sum + phase.budget_planned, 0);
    const totalActual = project.phases.reduce((sum, phase) => sum + phase.budget_actual, 0);
    return ((totalActual - totalPlanned) / totalPlanned) * 100;
  };

  const calculateScheduleVariance = () => {
    const today = new Date();
    const delayedPhases = project.phases.filter(phase => {
      const endDate = new Date(phase.end_date);
      return endDate < today && phase.status !== 'completed';
    });
    return (delayedPhases.length / project.phases.length) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header do Projeto */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <Badge variant="outline" className="bg-purple-100 text-purple-800">
                  {project.methodology.toUpperCase()} - HÍBRIDO
                </Badge>
              </div>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Relatório PMP
              </Button>
              <Button variant="outline" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Métricas Ágeis
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{calculateProjectProgress().toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Progresso Geral</div>
              <Progress value={calculateProjectProgress()} className="mt-2" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{calculateBudgetVariance().toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Variação Orçamentária</div>
              <div className={`text-xs ${calculateBudgetVariance() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {calculateBudgetVariance() > 0 ? 'Acima do orçamento' : 'Dentro do orçamento'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{calculateScheduleVariance().toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Atraso no Cronograma</div>
              <div className={`text-xs ${calculateScheduleVariance() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {calculateScheduleVariance() > 0 ? 'Fases atrasadas' : 'No prazo'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{project.risks.filter(r => r.status === 'identified').length}</div>
              <div className="text-sm text-muted-foreground">Riscos Ativos</div>
              <div className="text-xs text-orange-600">Requer atenção</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="phases">Fases PMP</TabsTrigger>
          <TabsTrigger value="sprints">Sprints Ágeis</TabsTrigger>
          <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
          <TabsTrigger value="risks">Gestão de Riscos</TabsTrigger>
          <TabsTrigger value="quality">Quality Gates</TabsTrigger>
          <TabsTrigger value="changes">Mudanças</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cronograma Híbrido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Gráfico de Gantt Híbrido</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Métricas de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPI (Cost Performance Index)</span>
                      <span>0.95</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>SPI (Schedule Performance Index)</span>
                      <span>0.88</span>
                    </div>
                    <Progress value={88} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Velocity (Story Points/Sprint)</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">24.5</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Fases PMP */}
        <TabsContent value="phases" className="space-y-4">
          <div className="space-y-4">
            {project.phases.map((phase) => (
              <Card key={phase.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{phase.name}</h3>
                      <Badge className={getPhaseColor(phase.status)}>
                        {phase.status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">
                        {phase.methodology.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(phase.start_date).toLocaleDateString('pt-BR')} - 
                        {new Date(phase.end_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progresso da Fase</span>
                        <span>{phase.progress}%</span>
                      </div>
                      <Progress value={phase.progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Orçamento Planejado</p>
                        <p className="font-medium">R$ {phase.budget_planned.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Orçamento Real</p>
                        <p className="font-medium">R$ {phase.budget_actual.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Esforço Planejado</p>
                        <p className="font-medium">{phase.effort_planned}h</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Esforço Real</p>
                        <p className="font-medium">{phase.effort_actual}h</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Entregáveis</h4>
                      <div className="space-y-2">
                        {phase.deliverables.map((deliverable) => (
                          <div key={deliverable.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium text-sm">{deliverable.name}</p>
                              <p className="text-xs text-muted-foreground">{deliverable.type}</p>
                            </div>
                            <Badge className={getPhaseColor(deliverable.status)}>
                              {deliverable.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Sprints Ágeis */}
        <TabsContent value="sprints" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.sprints.map((sprint) => (
              <Card key={sprint.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{sprint.name}</CardTitle>
                    <Badge className={getPhaseColor(sprint.status)}>
                      {sprint.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Período</span>
                      <span>
                        {new Date(sprint.start_date).toLocaleDateString('pt-BR')} - 
                        {new Date(sprint.end_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Capacity</span>
                      <span>{sprint.capacity}h</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Velocity</span>
                      <span>{sprint.velocity} SP</span>
                    </div>

                    <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Burndown Chart</p>
                    </div>

                    {sprint.retrospective_notes && (
                      <div>
                        <h4 className="font-medium text-sm mb-1">Retrospectiva</h4>
                        <p className="text-sm text-muted-foreground">{sprint.retrospective_notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Stakeholders */}
        <TabsContent value="stakeholders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Stakeholders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.stakeholders.map((stakeholder) => (
                  <div key={stakeholder.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{stakeholder.name}</h4>
                      <Badge className={getStakeholderEngagementColor(stakeholder.engagement_level)}>
                        {stakeholder.engagement_level}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{stakeholder.role}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Influência:</span>
                        <span className="ml-1 font-medium">{stakeholder.influence}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Interesse:</span>
                        <span className="ml-1 font-medium">{stakeholder.interest}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Gestão de Riscos */}
        <TabsContent value="risks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Riscos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.risks.map((risk) => (
                  <div key={risk.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{risk.description}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{risk.mitigation_plan}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRiskColor(risk.probability, risk.impact)}>
                          {risk.probability}/{risk.impact}
                        </Badge>
                        <Badge className={getPhaseColor(risk.status)}>
                          {risk.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Responsável: {risk.owner}</span>
                      <span>Prazo: {new Date(risk.due_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Quality Gates */}
        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Gates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.quality_gates.map((gate) => (
                  <div key={gate.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{gate.name}</h4>
                        <p className="text-sm text-muted-foreground">Fase: {gate.phase}</p>
                      </div>
                      <Badge className={getPhaseColor(gate.status)}>
                        {gate.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">Critérios:</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {gate.criteria.map((criterion, index) => (
                          <li key={index}>• {criterion}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex justify-between text-sm text-muted-foreground mt-3">
                      <span>Aprovador: {gate.approver}</span>
                      <span>Prazo: {new Date(gate.due_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Mudanças */}
        <TabsContent value="changes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Solicitações de Mudança</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Solicitação
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.change_requests.map((change) => (
                  <div key={change.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{change.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{change.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getRiskColor(change.priority, change.priority)}>
                          {change.priority}
                        </Badge>
                        <Badge className={getPhaseColor(change.status)}>
                          {change.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      <div>
                        <span>Tipo: {change.type}</span>
                      </div>
                      <div>
                        <span>Solicitante: {change.requested_by}</span>
                      </div>
                      <div>
                        <span>Data: {new Date(change.requested_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {change.approved_by && (
                        <div>
                          <span>Aprovado por: {change.approved_by}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HybridProjectGovernance; 