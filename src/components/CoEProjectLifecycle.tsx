import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Lightbulb, 
  FileText, 
  CheckCircle, 
  Settings, 
  Users, 
  Code, 
  TestTube, 
  CheckSquare, 
  BookOpen, 
  Wrench,
  Zap,
  Target,
  TrendingUp,
  Clock,
  AlertTriangle
} from "lucide-react";

// Tipos para o CoE de Automações Inteligentes
interface CoEProject {
  id: string;
  name: string;
  description: string;
  status: 'idea' | 'analysis' | 'planning' | 'development' | 'testing' | 'approval' | 'production' | 'maintenance';
  phase: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimated_roi: number;
  complexity: 'low' | 'medium' | 'high';
  team: string[];
  systems: HealthSystem[];
  created_at: string;
  updated_at: string;
  progress: number;
}

interface HealthSystem {
  name: 'TopSaúde' | 'MXM' | 'Tasy' | 'TechSallus' | 'Bizagi';
  integration_status: 'pending' | 'connected' | 'error';
  data_synced: boolean;
}

interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  deliverables: Deliverable[];
  quality_gate?: QualityGate;
}

interface Deliverable {
  id: string;
  name: string;
  type: 'document' | 'code' | 'test' | 'approval';
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to?: string;
  due_date?: string;
}

interface QualityGate {
  id: string;
  name: string;
  type: 'G1' | 'G2' | 'G3' | 'G4';
  status: 'pending' | 'in_progress' | 'approved' | 'rejected';
  criteria: QualityCriteria[];
  approvers: string[];
}

interface QualityCriteria {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'passed' | 'failed';
  weight: number;
}

interface CoEProjectLifecycleProps {
  project: CoEProject;
  onPhaseUpdate: (phaseId: string, status: string) => void;
  onDeliverableUpdate: (deliverableId: string, status: string) => void;
  onQualityGateUpdate: (gateId: string, status: string) => void;
}

const CoEProjectLifecycle: React.FC<CoEProjectLifecycleProps> = ({
  project,
  onPhaseUpdate,
  onDeliverableUpdate,
  onQualityGateUpdate,
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [phases, setPhases] = useState<ProjectPhase[]>([]);

  // Fases do ciclo de vida do CoE
  const lifecyclePhases = [
    {
      id: "idea-capture",
      name: "Captura da Ideia",
      icon: Lightbulb,
      description: "Identificação e análise inicial da oportunidade de automação",
      deliverables: [
        { id: "idea-form", name: "Formulário de Ideia", type: "document" as const },
        { id: "initial-analysis", name: "Análise Inicial com IA", type: "document" as const },
        { id: "business-value", name: "Valor de Negócio", type: "document" as const }
      ]
    },
    {
      id: "pdd-generation",
      name: "Geração do PDD",
      icon: FileText,
      description: "Documento de Projeto Detalhado com requisitos e análise",
      deliverables: [
        { id: "pdd-document", name: "PDD Completo", type: "document" as const },
        { id: "process-mapping", name: "Mapeamento de Processos", type: "document" as const },
        { id: "system-integration", name: "Planejamento de Integrações", type: "document" as const },
        { id: "risk-assessment", name: "Avaliação de Riscos", type: "document" as const }
      ],
      quality_gate: {
        id: "g1",
        name: "Quality Gate G1 - Conceito",
        type: "G1" as const,
        criteria: [
          { id: "g1-pdd", name: "PDD Aprovado", description: "Documento completo e aprovado", weight: 30 },
          { id: "g1-business", name: "Valor de Negócio", description: "ROI positivo confirmado", weight: 25 },
          { id: "g1-technical", name: "Viabilidade Técnica", description: "Tecnicamente viável", weight: 25 },
          { id: "g1-stakeholders", name: "Aprovação Stakeholders", description: "Aprovado pelos stakeholders", weight: 20 }
        ]
      }
    },
    {
      id: "sdd-generation",
      name: "Geração do SDD",
      icon: Settings,
      description: "Especificação Técnica Detalhada e arquitetura da solução",
      deliverables: [
        { id: "sdd-document", name: "SDD Completo", type: "document" as const },
        { id: "technical-architecture", name: "Arquitetura Técnica", type: "document" as const },
        { id: "api-specifications", name: "Especificações de API", type: "document" as const },
        { id: "n8n-workflow", name: "Workflow n8n", type: "code" as const },
        { id: "security-requirements", name: "Requisitos de Segurança", type: "document" as const }
      ]
    },
    {
      id: "task-management",
      name: "Gestão de Tasks",
      icon: Users,
      description: "Breakdown de tasks e gestão da equipe do squad",
      deliverables: [
        { id: "task-breakdown", name: "Breakdown de Tasks", type: "document" as const },
        { id: "sprint-planning", name: "Planejamento de Sprint", type: "document" as const },
        { id: "team-assignment", name: "Atribuição de Equipe", type: "document" as const },
        { id: "kanban-board", name: "Kanban Board", type: "document" as const }
      ]
    },
    {
      id: "development",
      name: "Desenvolvimento",
      icon: Code,
      description: "Desenvolvimento da automação com integração aos sistemas",
      deliverables: [
        { id: "automation-code", name: "Código da Automação", type: "code" as const },
        { id: "system-integration", name: "Integração com Sistemas", type: "code" as const },
        { id: "n8n-deployment", name: "Deploy no n8n", type: "code" as const },
        { id: "unit-tests", name: "Testes Unitários", type: "test" as const }
      ],
      quality_gate: {
        id: "g2",
        name: "Quality Gate G2 - Desenvolvimento",
        type: "G2" as const,
        criteria: [
          { id: "g2-code-review", name: "Code Review", description: "Código revisado e aprovado", weight: 25 },
          { id: "g2-unit-tests", name: "Testes Unitários", description: "Todos os testes passando", weight: 25 },
          { id: "g2-integration", name: "Testes de Integração", description: "Integração testada", weight: 25 },
          { id: "g2-security", name: "Scan de Segurança", description: "Sem vulnerabilidades", weight: 25 }
        ]
      }
    },
    {
      id: "testing",
      name: "Testes e Homologação",
      icon: TestTube,
      description: "Testes automatizados, UAT e validação da solução",
      deliverables: [
        { id: "automated-tests", name: "Testes Automatizados", type: "test" as const },
        { id: "uat-execution", name: "Execução UAT", type: "test" as const },
        { id: "performance-tests", name: "Testes de Performance", type: "test" as const },
        { id: "security-tests", name: "Testes de Segurança", type: "test" as const },
        { id: "test-reports", name: "Relatórios de Teste", type: "document" as const }
      ],
      quality_gate: {
        id: "g3",
        name: "Quality Gate G3 - Homologação",
        type: "G3" as const,
        criteria: [
          { id: "g3-uat", name: "UAT Aprovado", description: "Aceitação do usuário", weight: 30 },
          { id: "g3-business", name: "Aceitação de Negócio", description: "Aprovado pelo negócio", weight: 25 },
          { id: "g3-security", name: "Segurança", description: "Revisão final de segurança", weight: 25 },
          { id: "g3-compliance", name: "Compliance", description: "Conformidade validada", weight: 20 }
        ]
      }
    },
    {
      id: "delivery-documentation",
      name: "Documentação de Entrega",
      icon: BookOpen,
      description: "Documentação completa para produção e sustentação",
      deliverables: [
        { id: "production-guide", name: "Guia de Produção", type: "document" as const },
        { id: "user-manual", name: "Manual do Usuário", type: "document" as const },
        { id: "technical-docs", name: "Documentação Técnica", type: "document" as const },
        { id: "maintenance-guide", name: "Guia de Manutenção", type: "document" as const },
        { id: "training-materials", name: "Materiais de Treinamento", type: "document" as const }
      ]
    },
    {
      id: "production-deployment",
      name: "Deploy em Produção",
      icon: Zap,
      description: "Deploy final e configuração de monitoramento",
      deliverables: [
        { id: "production-deploy", name: "Deploy em Produção", type: "code" as const },
        { id: "monitoring-setup", name: "Configuração de Monitoramento", type: "code" as const },
        { id: "alert-configuration", name: "Configuração de Alertas", type: "code" as const },
        { id: "backup-verification", name: "Verificação de Backup", type: "test" as const }
      ],
      quality_gate: {
        id: "g4",
        name: "Quality Gate G4 - Produção",
        type: "G4" as const,
        criteria: [
          { id: "g4-deployment", name: "Deploy Realizado", description: "Deploy em produção", weight: 25 },
          { id: "g4-monitoring", name: "Monitoramento", description: "Monitoramento configurado", weight: 25 },
          { id: "g4-backup", name: "Backup", description: "Backup verificado", weight: 25 },
          { id: "g4-go-live", name: "Go-Live", description: "Aprovação para Go-Live", weight: 25 }
        ]
      }
    },
    {
      id: "maintenance-support",
      name: "Sustentação e Manutenção",
      icon: Wrench,
      description: "Sustentação contínua e melhorias da automação",
      deliverables: [
        { id: "support-system", name: "Sistema de Suporte", type: "document" as const },
        { id: "knowledge-base", name: "Base de Conhecimento", type: "document" as const },
        { id: "maintenance-schedule", name: "Agenda de Manutenção", type: "document" as const },
        { id: "performance-monitor", name: "Monitor de Performance", type: "code" as const }
      ]
    }
  ];

  useEffect(() => {
    // Inicializar fases com base no status do projeto
    const projectPhases = lifecyclePhases.map(phase => ({
      ...phase,
      status: getPhaseStatus(phase.id, project.status) as 'pending' | 'in_progress' | 'completed' | 'blocked',
      deliverables: phase.deliverables.map(deliverable => ({
        ...deliverable,
        status: getDeliverableStatus(deliverable.id, project.status) as 'pending' | 'in_progress' | 'completed'
      }))
    }));
    setPhases(projectPhases);
  }, [project]);

  const getPhaseStatus = (phaseId: string, projectStatus: string): string => {
    const phaseOrder = lifecyclePhases.map(p => p.id);
    const currentPhaseIndex = phaseOrder.indexOf(phaseId);
    const projectPhaseIndex = phaseOrder.findIndex(p => p === getProjectPhase(projectStatus));
    
    if (currentPhaseIndex < projectPhaseIndex) return 'completed';
    if (currentPhaseIndex === projectPhaseIndex) return 'in_progress';
    return 'pending';
  };

  const getDeliverableStatus = (deliverableId: string, projectStatus: string): string => {
    // Lógica simplificada - em produção seria mais complexa
    if (projectStatus === 'idea' && deliverableId.includes('idea')) return 'completed';
    if (projectStatus === 'analysis' && deliverableId.includes('pdd')) return 'completed';
    if (projectStatus === 'planning' && deliverableId.includes('sdd')) return 'completed';
    if (projectStatus === 'development' && deliverableId.includes('code')) return 'completed';
    if (projectStatus === 'testing' && deliverableId.includes('test')) return 'completed';
    if (projectStatus === 'approval' && deliverableId.includes('approval')) return 'completed';
    if (projectStatus === 'production' && deliverableId.includes('deploy')) return 'completed';
    if (projectStatus === 'maintenance' && deliverableId.includes('support')) return 'completed';
    return 'pending';
  };

  const getProjectPhase = (status: string): string => {
    const phaseMap: Record<string, string> = {
      'idea': 'idea-capture',
      'analysis': 'pdd-generation',
      'planning': 'sdd-generation',
      'development': 'development',
      'testing': 'testing',
      'approval': 'delivery-documentation',
      'production': 'production-deployment',
      'maintenance': 'maintenance-support'
    };
    return phaseMap[status] || 'idea-capture';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getSystemStatusColor = (status: string): string => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header do Projeto */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{project.name}</CardTitle>
              <p className="text-gray-600 mt-2">{project.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className={getPriorityColor(project.priority)}>
                {project.priority.toUpperCase()}
              </Badge>
              <Badge className="bg-blue-100 text-blue-800">
                ROI: {project.estimated_roi}%
              </Badge>
              <Badge className="bg-purple-100 text-purple-800">
                {project.complexity.toUpperCase()}
              </Badge>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso Geral</span>
              <span className="text-sm text-gray-600">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Tabs de Navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="phases">Fases</TabsTrigger>
          <TabsTrigger value="systems">Sistemas</TabsTrigger>
          <TabsTrigger value="quality-gates">Quality Gates</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Status Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={getStatusColor(project.status)}>
                  {project.status.toUpperCase()}
                </Badge>
                <p className="text-sm text-gray-600 mt-2">
                  Fase: {getProjectPhase(project.status)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  ROI Estimado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {project.estimated_roi}%
                </div>
                <p className="text-sm text-gray-600">
                  Retorno sobre investimento
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p><strong>Criado:</strong> {new Date(project.created_at).toLocaleDateString('pt-BR')}</p>
                  <p><strong>Atualizado:</strong> {new Date(project.updated_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sistemas Integrados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sistemas Integrados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {project.systems.map((system) => (
                  <div key={system.name} className="text-center">
                    <div className="text-sm font-medium mb-2">{system.name}</div>
                    <Badge className={getSystemStatusColor(system.integration_status)}>
                      {system.integration_status}
                    </Badge>
                    {system.data_synced && (
                      <div className="text-xs text-green-600 mt-1">Dados Sincronizados</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Fases */}
        <TabsContent value="phases" className="space-y-4">
          <div className="space-y-4">
            {phases.map((phase) => {
              const IconComponent = phase.icon;
              return (
                <Card key={phase.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-6 w-6 text-blue-600" />
                        <div>
                          <CardTitle className="text-lg">{phase.name}</CardTitle>
                          <p className="text-sm text-gray-600">{phase.description}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(phase.status)}>
                        {phase.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {phase.deliverables.map((deliverable) => (
                        <div key={deliverable.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              deliverable.status === 'completed' ? 'bg-green-500' :
                              deliverable.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                            }`} />
                            <span className="font-medium">{deliverable.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {deliverable.type}
                            </Badge>
                          </div>
                          <Badge className={getStatusColor(deliverable.status)}>
                            {deliverable.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab: Sistemas */}
        <TabsContent value="systems" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.systems.map((system) => (
              <Card key={system.name}>
                <CardHeader>
                  <CardTitle className="text-lg">{system.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Status de Conexão:</span>
                      <Badge className={getSystemStatusColor(system.integration_status)}>
                        {system.integration_status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Sincronização de Dados:</span>
                      <Badge className={system.data_synced ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {system.data_synced ? 'Sincronizado' : 'Pendente'}
                      </Badge>
                    </div>
                    <Button className="w-full" variant="outline">
                      Testar Conexão
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Quality Gates */}
        <TabsContent value="quality-gates" className="space-y-4">
          <div className="space-y-4">
            {phases.filter(phase => phase.quality_gate).map((phase) => (
              <Card key={phase.quality_gate!.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{phase.quality_gate!.name}</CardTitle>
                      <p className="text-sm text-gray-600">Fase: {phase.name}</p>
                    </div>
                    <Badge className={getStatusColor(phase.quality_gate!.status)}>
                      {phase.quality_gate!.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {phase.quality_gate!.criteria.map((criterion) => (
                      <div key={criterion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{criterion.name}</div>
                          <div className="text-sm text-gray-600">{criterion.description}</div>
                          <div className="text-xs text-gray-500">Peso: {criterion.weight}%</div>
                        </div>
                        <Badge className={getStatusColor(criterion.status)}>
                          {criterion.status.toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Equipe */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Equipe do Squad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {project.team.map((member) => (
                  <div key={member} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      {member.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{member}</span>
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

export default CoEProjectLifecycle; 