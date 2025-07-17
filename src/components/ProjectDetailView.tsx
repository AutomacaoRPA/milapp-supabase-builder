import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Calendar, 
  Target, 
  TrendingUp, 
  Users,
  FileText,
  Settings,
  GitBranch,
  BookOpen,
  Zap,
  ExternalLink
} from "lucide-react";
import { Project } from "@/hooks/useProjects";
import ProjectStageManager from "./ProjectStageManager";
import InnovationPipelineGuide from "./InnovationPipelineGuide";
import PDDGovernancePanel from "./PDDGovernancePanel";
import ScrumManagement from "./ScrumManagement";
import DetailedProjectView from "./DetailedProjectView";

interface ProjectDetailViewProps {
  project: Project;
  onBack: () => void;
}

const ProjectDetailView = ({ project, onBack }: ProjectDetailViewProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [showDetailedView, setShowDetailedView] = useState(false);

  // Mock stages data for ProjectStageManager
  const mockStages = [
    { id: "1", name: "Priorização", status: "completed" as const, order: 1, completedAt: "2025-07-14T15:34:45.926Z", assignee: "Marcus Leitão" },
    { id: "2", name: "Hipótese Formulada", status: "completed" as const, order: 2, completedAt: "2025-07-14T15:38:49.700Z", assignee: "Marcus Leitão" },
    { id: "3", name: "Análise de Viabilidade", status: "completed" as const, order: 3, completedAt: "2025-07-14T15:47:11.510Z", assignee: "Marcus Leitão" },
    { id: "4", name: "Protótipo Rápido", status: "completed" as const, order: 4, duration: "5 dias", assignee: "Daniele" },
    { id: "5", name: "Validação do Protótipo", status: "pending" as const, order: 5 },
    { id: "6", name: "MVP", status: "pending" as const, order: 6 },
    { id: "7", name: "Teste Operacional", status: "pending" as const, order: 7 },
    { id: "8", name: "Escala e Entrega", status: "pending" as const, order: 8 },
    { id: "9", name: "Acompanhamento Pós-Entrega", status: "pending" as const, order: 9 },
    { id: "10", name: "Sustentação e Evolução", status: "in_progress" as const, order: 10 },
  ];

  const handleStageUpdate = (stageId: string, updates: any) => {
    console.log("Updating stage:", stageId, updates);
    // Here you would implement the actual stage update logic
  };

  // If detailed view is requested, show it
  if (showDetailedView) {
    return (
      <DetailedProjectView 
        project={project} 
        onBack={() => setShowDetailedView(false)}
      />
    );
  }

  const getStatusColor = (status: string) => {
    const colors = {
      ideacao: "bg-blue-100 text-blue-800",
      planejamento: "bg-yellow-100 text-yellow-800", 
      desenvolvimento: "bg-primary/10 text-primary",
      homologacao: "bg-orange-100 text-orange-800",
      producao: "bg-green-100 text-green-800",
      suspenso: "bg-red-100 text-red-800",
      concluido: "bg-accent/10 text-accent"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const calculateProgress = () => {
    const statusProgress = {
      ideacao: 10,
      planejamento: 25,
      desenvolvimento: 60,
      homologacao: 85,
      producao: 95,
      suspenso: 0,
      concluido: 100
    };
    return statusProgress[project.status] || 0;
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "Não definido";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Não definida";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">{project.description}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowDetailedView(true)}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Vista Detalhada PDD
          </Button>
          <Badge className={getStatusColor(project.status)}>
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progresso</p>
                <p className="text-xl font-bold">{calculateProgress()}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rpa/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-rpa" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ROI Estimado</p>
                <p className="text-xl font-bold">
                  {project.estimated_roi ? formatCurrency(project.estimated_roi) : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Meta</p>
                <p className="text-xl font-bold">{formatDate(project.target_date)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Metodologia</p>
                <p className="text-xl font-bold">{project.methodology || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso Geral do Projeto</span>
              <span className="font-medium">{calculateProgress()}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-3" />
            <p className="text-xs text-muted-foreground">
              Status atual: {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="scrum">Scrum</TabsTrigger>
          <TabsTrigger value="pdd">Governança PDD</TabsTrigger>
          <TabsTrigger value="guide">Guia</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Informações do Projeto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                  <p className="text-sm mt-1">{project.description || "Não informado"}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
                    <p className="text-sm mt-1">{project.priority || "Não definida"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Complexidade</label>
                    <p className="text-sm mt-1">{project.complexity_score || "Não avaliada"}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Início</label>
                    <p className="text-sm mt-1">{formatDate(project.start_date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data Meta</label>
                    <p className="text-sm mt-1">{formatDate(project.target_date)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Equipe do Projeto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Criado por</label>
                  <p className="text-sm mt-1">{project.created_by}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Product Owner</label>
                  <p className="text-sm mt-1">{project.product_owner || "Não atribuído"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Arquiteto Responsável</label>
                  <p className="text-sm mt-1">{project.assigned_architect || "Não atribuído"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Metodologia</label>
                  <p className="text-sm mt-1">{project.methodology || "Não definida"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Informações Financeiras
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ROI Estimado</label>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(project.estimated_roi)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ROI Atual</label>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(project.actual_roi)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline">
          <ProjectStageManager 
            projectId={project.id}
            currentStage={project.status}
            stages={mockStages}
            onStageUpdate={handleStageUpdate}
          />
        </TabsContent>

        <TabsContent value="scrum">
          <ScrumManagement project={project} />
        </TabsContent>

        <TabsContent value="pdd">
          <PDDGovernancePanel project={project} />
        </TabsContent>

        <TabsContent value="guide">
          <InnovationPipelineGuide />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Configurações do Projeto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Notificações</h4>
                    <p className="text-sm text-muted-foreground">Receber notificações sobre atualizações</p>
                  </div>
                  <Button variant="outline">Configurar</Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Integração Git</h4>
                    <p className="text-sm text-muted-foreground">Conectar repositório de código</p>
                  </div>
                  <Button variant="outline">
                    <GitBranch className="h-4 w-4 mr-2" />
                    Conectar
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Exportar Dados</h4>
                    <p className="text-sm text-muted-foreground">Exportar informações do projeto</p>
                  </div>
                  <Button variant="outline">Exportar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetailView;
