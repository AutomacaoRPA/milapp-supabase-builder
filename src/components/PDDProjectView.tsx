import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Calendar, 
  Target, 
  TrendingUp, 
  Users,
  FileText,
  Edit,
  Tag,
  Sparkles,
  Eye,
  BarChart3,
  Zap,
  CheckCircle2,
  PlayCircle,
  Clock,
  User,
  Save
} from "lucide-react";
import { Project } from "@/hooks/useProjects";

interface PDDProjectViewProps {
  project: Project;
  onBack: () => void;
}

const PDDProjectView = ({ project, onBack }: PDDProjectViewProps) => {
  const [editingDescription, setEditingDescription] = useState(false);
  const [refinedDescription, setRefinedDescription] = useState(project.description || "");
  const [prioritizationData, setPrioritizationData] = useState({
    leadership: "",
    startDate: "",
    endDate: "",
    strategicAlignment: "",
    businessCase: "",
    resources: "",
    risks: ""
  });

  // Mock stages data with proper status types
  const stages = [
    { id: "1", name: "Priorização", status: "completed" as const, order: 1 },
    { id: "2", name: "Hipótese Formulada", status: "in_progress" as const, order: 2 },
    { id: "3", name: "Análise de Viabilidade", status: "pending" as const, order: 3 },
    { id: "4", name: "Protótipo Rápido", status: "pending" as const, order: 4 },
    { id: "5", name: "Validação do Protótipo", status: "pending" as const, order: 5 },
    { id: "6", name: "MVP", status: "pending" as const, order: 6 },
    { id: "7", name: "Teste Operacional", status: "pending" as const, order: 7 },
    { id: "8", name: "Escala e Entrega", status: "pending" as const, order: 8 },
    { id: "9", name: "Acompanhamento Pós-Entrega", status: "pending" as const, order: 9 },
    { id: "10", name: "Sustentação e Evolução", status: "pending" as const, order: 10 },
  ];

  const completedStages = stages.filter(stage => stage.status === "completed").length;
  const progressPercentage = Math.round((completedStages / stages.length) * 100);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return CheckCircle2;
      case "in_progress": return PlayCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600";
      case "in_progress": return "text-primary";
      default: return "text-muted-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-primary/10 text-primary";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Timeline and AI History */}
          <div className="space-y-6">
            {/* Timeline do Projeto */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timeline do Projeto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progresso Geral</span>
                    <span className="font-medium">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                <div className="space-y-3">
                  {stages.map((stage) => {
                    const StatusIcon = getStatusIcon(stage.status);
                    const isCurrentStage = stage.status === "in_progress";
                    
                    return (
                      <div key={stage.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isCurrentStage ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <StatusIcon className={`h-4 w-4 ${getStatusColor(stage.status)}`} />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{stage.name}</span>
                            <Badge className={`text-xs ${getStatusBadge(stage.status)}`}>
                              {stage.status === "completed" ? "Concluída" : 
                               stage.status === "in_progress" ? "Em andamento" : "Pendente"}
                            </Badge>
                          </div>
                          
                          {isCurrentStage && (
                            <p className="text-xs text-muted-foreground">Etapa atual em execução</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Histórico de Análises IA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Histórico de Análises IA
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Visualize o histórico de análises de priorização feitas pela IA
                </p>
              </CardHeader>
              
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Histórico
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Middle and Right Columns - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Header */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{project.name}</h1>
                  <Badge variant="outline" className="mt-2">Priorização</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Guia da Esteira
                  </Button>
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </div>
              </div>

              {/* Project Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Proponente</p>
                        <p className="font-medium">{project.created_by}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                        <Target className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Área Responsável</p>
                        <p className="font-medium">{project.assigned_architect || "A Definir"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-rpa/10 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-rpa" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Criação</p>
                        <p className="font-medium">
                          {project.created_at ? new Date(project.created_at).toLocaleDateString('pt-BR') : "29/06/2025"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Impact Section */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <Target className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Impacto Esperado</p>
                      <p className="font-medium">Melhoria no atendimento aos pacientes 50+ da MedSenior</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Labels Section */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Labels do Projeto</CardTitle>
                    <Button variant="outline" size="sm">
                      <Tag className="h-4 w-4 mr-2" />
                      Gerenciar Labels
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            </div>

            {/* Description Cards */}
            <div className="space-y-4">
              {/* Original Description */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">Descrição Original (Proponente)</CardTitle>
                    <Badge variant="outline">Original</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {project.description}
                  </p>
                </CardContent>
              </Card>

              {/* Refined Description */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">Descrição Refinada (Time de Inovação)</CardTitle>
                      <Badge variant="outline">Refinada</Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setEditingDescription(!editingDescription)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingDescription ? (
                    <div className="space-y-3">
                      <Textarea
                        value={refinedDescription}
                        onChange={(e) => setRefinedDescription(e.target.value)}
                        rows={6}
                        className="resize-none"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => setEditingDescription(false)}>Salvar</Button>
                        <Button variant="outline" size="sm" onClick={() => setEditingDescription(false)}>Cancelar</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {refinedDescription || project.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* AI Tools Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Ferramentas de IA
                  <Badge variant="secondary">Inteligência Artificial</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Use IA para estruturar descrições e gerar resumos executivos profissionais
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button variant="outline" className="h-auto p-4">
                    <div className="flex flex-col items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      <span className="font-medium">Estruturar Descrição</span>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 bg-green-50">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Resumos Executivos</span>
                    </div>
                  </Button>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-3">
                    Organizar e estruturar a descrição da ideia
                  </p>
                  
                  <Button variant="outline" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Gerar e Editar Descrição Estruturada
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Prioritization Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Formulário de Priorização
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Preencha os dados necessários para completar a etapa de priorização
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leadership">Liderança Responsável *</Label>
                    <Select value={prioritizationData.leadership} onValueChange={(value) => setPrioritizationData(prev => ({ ...prev, leadership: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a liderança" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cto">CTO</SelectItem>
                        <SelectItem value="cpo">CPO</SelectItem>
                        <SelectItem value="director">Diretor de TI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="strategicAlignment">Alinhamento Estratégico *</Label>
                    <Select value={prioritizationData.strategicAlignment} onValueChange={(value) => setPrioritizationData(prev => ({ ...prev, strategicAlignment: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o alinhamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Alto</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="low">Baixo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data de Início *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={prioritizationData.startDate}
                      onChange={(e) => setPrioritizationData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data de Fim *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={prioritizationData.endDate}
                      onChange={(e) => setPrioritizationData(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessCase">Business Case *</Label>
                  <Textarea
                    id="businessCase"
                    placeholder="Descreva o business case do projeto..."
                    value={prioritizationData.businessCase}
                    onChange={(e) => setPrioritizationData(prev => ({ ...prev, businessCase: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resources">Recursos Necessários *</Label>
                  <Textarea
                    id="resources"
                    placeholder="Descreva os recursos necessários..."
                    value={prioritizationData.resources}
                    onChange={(e) => setPrioritizationData(prev => ({ ...prev, resources: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="risks">Riscos Identificados</Label>
                  <Textarea
                    id="risks"
                    placeholder="Descreva os principais riscos..."
                    value={prioritizationData.risks}
                    onChange={(e) => setPrioritizationData(prev => ({ ...prev, risks: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button className="bg-gradient-primary">
                    <Save className="h-4 w-4 mr-2" />
                    Completar Priorização
                  </Button>
                  <Button variant="outline">
                    Salvar Rascunho
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDDProjectView;
