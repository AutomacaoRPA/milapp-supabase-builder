
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Users,
  FileText,
  Target,
  TrendingUp
} from "lucide-react";
import { Project } from "@/hooks/useProjects";
import { PDDGovernance, QualityGate, PDDCriteria } from "@/types/pdd";

interface PDDGovernancePanelProps {
  project: Project;
}

const PDDGovernancePanel = ({ project }: PDDGovernancePanelProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data para demonstração
  const [governance] = useState<PDDGovernance>({
    id: "pdd-1",
    projectId: project.id,
    stage: "development",
    gateStatus: "approved",
    criteria: {
      technical: {
        feasibility: 85,
        complexity: 70,
        riskLevel: "medium"
      },
      business: {
        roi: 90,
        marketPotential: 80,
        strategicAlignment: 95
      },
      operational: {
        resourceAvailability: 75,
        timeToMarket: 60,
        maintenanceComplexity: 65
      }
    },
    approvers: ["tech-lead", "product-owner", "architect"],
    approvedBy: ["tech-lead", "product-owner"],
    approvedAt: "2024-01-15T10:00:00Z"
  });

  const [qualityGates] = useState<QualityGate[]>([
    {
      id: "gate-1",
      name: "Gate de Conceito",
      stage: "concept",
      criteria: [
        {
          id: "c1",
          name: "Alinhamento Estratégico",
          description: "Projeto alinhado com objetivos estratégicos",
          weight: 30,
          score: 95,
          passed: true
        },
        {
          id: "c2",
          name: "Viabilidade Inicial",
          description: "Análise preliminar de viabilidade",
          weight: 40,
          score: 85,
          passed: true
        }
      ],
      status: "passed",
      checklistItems: [
        {
          id: "ch1",
          description: "Business case aprovado",
          completed: true,
          completedBy: "product-owner",
          completedAt: "2024-01-10T09:00:00Z"
        },
        {
          id: "ch2",
          description: "Stakeholders identificados",
          completed: true,
          completedBy: "project-manager",
          completedAt: "2024-01-11T14:00:00Z"
        }
      ],
      approver: "product-owner",
      deadline: "2024-01-15"
    },
    {
      id: "gate-2",
      name: "Gate de Viabilidade",
      stage: "feasibility",
      criteria: [
        {
          id: "c3",
          name: "Viabilidade Técnica",
          description: "Análise detalhada de viabilidade técnica",
          weight: 40,
          score: 80,
          passed: true
        },
        {
          id: "c4",
          name: "Análise de Riscos",
          description: "Identificação e mitigação de riscos",
          weight: 30,
          score: 75,
          passed: true
        }
      ],
      status: "pending",
      checklistItems: [
        {
          id: "ch3",
          description: "Arquitetura técnica definida",
          completed: true,
          completedBy: "architect",
          completedAt: "2024-01-12T16:00:00Z"
        },
        {
          id: "ch4",
          description: "Plano de mitigação de riscos",
          completed: false
        }
      ],
      approver: "tech-lead",
      deadline: "2024-01-20"
    }
  ]);

  const getStageColor = (stage: string) => {
    const colors = {
      concept: "bg-blue-100 text-blue-800",
      feasibility: "bg-yellow-100 text-yellow-800",
      development: "bg-primary/10 text-primary",
      testing: "bg-orange-100 text-orange-800",
      launch: "bg-green-100 text-green-800",
      "post-launch": "bg-accent/10 text-accent"
    };
    return colors[stage as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getGateStatusIcon = (status: string) => {
    switch (status) {
      case "passed": return CheckCircle2;
      case "failed": return XCircle;
      case "pending": return Clock;
      default: return AlertTriangle;
    }
  };

  const getGateStatusColor = (status: string) => {
    switch (status) {
      case "passed": return "text-green-600";
      case "failed": return "text-red-600";
      case "pending": return "text-yellow-600";
      default: return "text-gray-600";
    }
  };

  const calculateOverallScore = (criteria: PDDCriteria) => {
    const technical = (criteria.technical.feasibility + criteria.technical.complexity) / 2;
    const business = (criteria.business.roi + criteria.business.marketPotential + criteria.business.strategicAlignment) / 3;
    const operational = (criteria.operational.resourceAvailability + criteria.operational.timeToMarket + criteria.operational.maintenanceComplexity) / 3;
    
    return Math.round((technical + business + operational) / 3);
  };

  return (
    <div className="space-y-6">
      {/* Header PDD */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Governança PDD</h3>
          <p className="text-sm text-muted-foreground">
            Processo de Desenvolvimento de Produtos
          </p>
        </div>
        <Badge className={getStageColor(governance.stage)}>
          {governance.stage.charAt(0).toUpperCase() + governance.stage.slice(1)}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="criteria">Critérios</TabsTrigger>
          <TabsTrigger value="gates">Quality Gates</TabsTrigger>
          <TabsTrigger value="approvals">Aprovações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Score Geral */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Score Geral PDD
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Score Geral</span>
                    <span className="font-medium">{calculateOverallScore(governance.criteria)}%</span>
                  </div>
                  <Progress value={calculateOverallScore(governance.criteria)} className="h-3" />
                </div>
                <Badge 
                  variant={calculateOverallScore(governance.criteria) >= 80 ? "default" : "secondary"}
                  className="text-sm"
                >
                  {calculateOverallScore(governance.criteria) >= 80 ? "Aprovado" : "Em Análise"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Status dos Gates */}
          <Card>
            <CardHeader>
              <CardTitle>Status dos Quality Gates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {qualityGates.map((gate) => {
                  const StatusIcon = getGateStatusIcon(gate.status);
                  return (
                    <div key={gate.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`h-5 w-5 ${getGateStatusColor(gate.status)}`} />
                        <div>
                          <p className="font-medium">{gate.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Prazo: {new Date(gate.deadline).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className={getGateStatusColor(gate.status)}>
                        {gate.status === "passed" ? "Aprovado" : 
                         gate.status === "failed" ? "Reprovado" : "Pendente"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="criteria" className="space-y-4">
          {/* Critérios Técnicos */}
          <Card>
            <CardHeader>
              <CardTitle>Critérios Técnicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Viabilidade Técnica</span>
                    <span>{governance.criteria.technical.feasibility}%</span>
                  </div>
                  <Progress value={governance.criteria.technical.feasibility} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Complexidade</span>
                    <span>{governance.criteria.technical.complexity}%</span>
                  </div>
                  <Progress value={governance.criteria.technical.complexity} className="h-2" />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Nível de Risco</span>
                  <Badge variant={governance.criteria.technical.riskLevel === "low" ? "default" : 
                                 governance.criteria.technical.riskLevel === "medium" ? "secondary" : "destructive"}>
                    {governance.criteria.technical.riskLevel === "low" ? "Baixo" :
                     governance.criteria.technical.riskLevel === "medium" ? "Médio" : "Alto"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Critérios de Negócio */}
          <Card>
            <CardHeader>
              <CardTitle>Critérios de Negócio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>ROI Esperado</span>
                    <span>{governance.criteria.business.roi}%</span>
                  </div>
                  <Progress value={governance.criteria.business.roi} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Potencial de Mercado</span>
                    <span>{governance.criteria.business.marketPotential}%</span>
                  </div>
                  <Progress value={governance.criteria.business.marketPotential} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Alinhamento Estratégico</span>
                    <span>{governance.criteria.business.strategicAlignment}%</span>
                  </div>
                  <Progress value={governance.criteria.business.strategicAlignment} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Critérios Operacionais */}
          <Card>
            <CardHeader>
              <CardTitle>Critérios Operacionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Disponibilidade de Recursos</span>
                    <span>{governance.criteria.operational.resourceAvailability}%</span>
                  </div>
                  <Progress value={governance.criteria.operational.resourceAvailability} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Time to Market</span>
                    <span>{governance.criteria.operational.timeToMarket}%</span>
                  </div>
                  <Progress value={governance.criteria.operational.timeToMarket} className="h-2" />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Complexidade de Manutenção</span>
                    <span>{governance.criteria.operational.maintenanceComplexity}%</span>
                  </div>
                  <Progress value={governance.criteria.operational.maintenanceComplexity} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gates" className="space-y-4">
          {qualityGates.map((gate) => {
            const StatusIcon = getGateStatusIcon(gate.status);
            const completedItems = gate.checklistItems.filter(item => item.completed).length;
            
            return (
              <Card key={gate.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <StatusIcon className={`h-5 w-5 ${getGateStatusColor(gate.status)}`} />
                      {gate.name}
                    </CardTitle>
                    <Badge variant="outline" className={getGateStatusColor(gate.status)}>
                      {gate.status === "passed" ? "Aprovado" : 
                       gate.status === "failed" ? "Reprovado" : "Pendente"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Critérios */}
                  <div>
                    <h4 className="font-medium mb-2">Critérios de Avaliação</h4>
                    <div className="space-y-2">
                      {gate.criteria.map((criterion) => (
                        <div key={criterion.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{criterion.name}</p>
                            <p className="text-xs text-muted-foreground">{criterion.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{criterion.score}%</span>
                            {criterion.passed ? 
                              <CheckCircle2 className="h-4 w-4 text-green-600" /> :
                              <XCircle className="h-4 w-4 text-red-600" />
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Checklist */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">Checklist</h4>
                      <span className="text-sm text-muted-foreground">
                        {completedItems}/{gate.checklistItems.length} concluídos
                      </span>
                    </div>
                    <div className="space-y-2">
                      {gate.checklistItems.map((item) => (
                        <div key={item.id} className="flex items-start gap-2 p-2 bg-muted rounded">
                          {item.completed ? 
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" /> :
                            <Clock className="h-4 w-4 text-yellow-600 mt-0.5" />
                          }
                          <div className="flex-1">
                            <p className="text-sm">{item.description}</p>
                            {item.completed && (
                              <p className="text-xs text-muted-foreground">
                                Concluído por {item.completedBy} em {new Date(item.completedAt!).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Info do Gate */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Aprovador: {gate.approver}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Prazo: {new Date(gate.deadline).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Status das Aprovações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {governance.approvers.map((approver, index) => {
                  const isApproved = governance.approvedBy?.includes(approver);
                  
                  return (
                    <div key={approver} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {isApproved ? 
                          <CheckCircle2 className="h-5 w-5 text-green-600" /> :
                          <Clock className="h-5 w-5 text-yellow-600" />
                        }
                        <div>
                          <p className="font-medium">{approver}</p>
                          <p className="text-sm text-muted-foreground">
                            {isApproved ? "Aprovado" : "Aguardando aprovação"}
                          </p>
                        </div>
                      </div>
                      <Badge variant={isApproved ? "default" : "secondary"}>
                        {isApproved ? "Aprovado" : "Pendente"}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              {governance.approvedAt && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Aprovação Final:</strong> {new Date(governance.approvedAt).toLocaleDateString('pt-BR')} às {new Date(governance.approvedAt).toLocaleTimeString('pt-BR')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PDDGovernancePanel;
