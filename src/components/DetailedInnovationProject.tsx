import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Building, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Edit,
  Brain,
  FileText,
  Tag,
  BarChart3,
  Settings,
  Save,
  Sparkles
} from "lucide-react";

interface ProjectStage {
  id: string;
  name: string;
  status: "pending" | "current" | "completed";
  progress: number;
}

const projectStages: ProjectStage[] = [
  { id: "1", name: "Priorização", status: "current", progress: 18 },
  { id: "2", name: "Hipótese Formulada", status: "pending", progress: 0 },
  { id: "3", name: "Análise de Viabilidade", status: "pending", progress: 0 },
  { id: "4", name: "Protótipo Rápido", status: "pending", progress: 0 },
  { id: "5", name: "Validação do Protótipo", status: "pending", progress: 0 },
  { id: "6", name: "MVP", status: "pending", progress: 0 },
  { id: "7", name: "Teste Operacional", status: "pending", progress: 0 },
  { id: "8", name: "Escala e Entrega", status: "pending", progress: 0 },
  { id: "9", name: "Acompanhamento Pós-Entrega", status: "pending", progress: 0 },
  { id: "10", name: "Sustentação e Evolução", status: "pending", progress: 0 }
];

const mockProject = {
  id: "1",
  name: "Automação para Extração de Dados de Notas Fiscais",
  proponent: "Marcus",
  responsibleArea: "A Definir",
  createdAt: "29/06/2025",
  expectedImpact: "Melhoria no atendimento aos pacientes 50+ da MedSenior",
  originalDescription: "A proposta é criar uma automação que permita a leitura automática das notas fiscais, extraindo dados relevantes e inserindo-os diretamente em uma planilha. Essa automação visa reduzir o tempo de trabalho manual, aumentando a eficiência dos processos administrativos. Com isso, a equipe poderá dedicar mais tempo a atividades que impactam diretamente a qualidade do atendimento aos pacientes 50+, melhorando a agilidade no tratamento de informações financeiras e facilitando a gestão de dados.",
  refinedDescription: "A proposta é criar uma automação que permita a leitura automática das notas fiscais, extraindo dados relevantes e inserindo-os diretamente em uma planilha. Essa automação visa reduzir o tempo de trabalho manual, aumentando a eficiência dos processos administrativos. Com isso, a equipe poderá dedicar mais tempo a atividades que impactam diretamente a qualidade do atendimento aos pacientes 50+, melhorando a agilidade no tratamento de informações financeiras e facilitando a gestão de dados.",
  labels: ["Automação", "RPA", "Eficiência", "Financeiro"],
  currentStage: "Priorização",
  progress: 18
};

interface DetailedInnovationProjectProps {
  onBack: () => void;
}

const DetailedInnovationProject = ({ onBack }: DetailedInnovationProjectProps) => {
  const [editingDescription, setEditingDescription] = useState(false);
  const [formData, setFormData] = useState({
    leadership: "",
    startDate: "",
    endDate: "",
    strategicAlignment: "",
    impact: "",
    viability: "",
    effort: "",
    innovationHorizon: ""
  });

  const currentStageIndex = projectStages.findIndex(stage => stage.name === mockProject.currentStage);
  const overallProgress = Math.round((currentStageIndex + 1) * 10); // Progresso baseado na etapa atual

  const getStageStatus = (index: number) => {
    if (index < currentStageIndex) return "completed";
    if (index === currentStageIndex) return "current";
    return "pending";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500";
      case "current": return "bg-blue-500";
      default: return "bg-gray-300";
    }
  };

  const isFormComplete = Object.values(formData).every(value => value !== "");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{mockProject.name}</h1>
            <p className="text-muted-foreground">Gestão da Esteira de Inovação</p>
          </div>
        </div>

        {/* Timeline e Progresso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Timeline do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">Progresso Geral</h3>
                  <p className="text-sm text-muted-foreground">{mockProject.currentStage} - Etapa atual em execução</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold">{mockProject.progress}%</span>
                </div>
              </div>
              <Progress value={mockProject.progress} className="h-2" />
              
              {/* Etapas da Esteira */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
                {projectStages.map((stage, index) => (
                  <div key={stage.id} className="relative">
                    <div className={`p-3 rounded-lg border transition-all ${
                      getStageStatus(index) === "current" 
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
                        : getStageStatus(index) === "completed"
                        ? "border-green-500 bg-green-50 dark:bg-green-950"
                        : "border-gray-200 bg-gray-50 dark:bg-gray-900"
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {getStageStatus(index) === "completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : getStageStatus(index) === "current" ? (
                          <Clock className="h-4 w-4 text-blue-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className={`text-xs font-medium ${
                          getStageStatus(index) === "pending" ? "text-gray-500" : ""
                        }`}>
                          {getStageStatus(index) === "completed" ? "Concluído" :
                           getStageStatus(index) === "current" ? "Em andamento" : "Pendente"}
                        </span>
                      </div>
                      <h4 className="font-medium text-sm">{stage.name}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações do Projeto */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {mockProject.name}
                  </CardTitle>
                  <Badge>{mockProject.currentStage}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Proponente</p>
                      <p className="font-medium">{mockProject.proponent}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Área Responsável</p>
                      <p className="font-medium">{mockProject.responsibleArea}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Criação</p>
                      <p className="font-medium">{mockProject.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Impacto Esperado</p>
                      <p className="font-medium">{mockProject.expectedImpact}</p>
                    </div>
                  </div>
                </div>

                {/* Labels */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Labels do Projeto
                    </h4>
                    <Button variant="outline" size="sm">
                      Gerenciar Labels
                    </Button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {mockProject.labels.map((label, index) => (
                      <Badge key={index} variant="secondary">{label}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Descrições */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Descrições do Projeto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Descrição Original */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">Descrição Original (Proponente)</h4>
                    <Badge variant="outline">Original</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                    {mockProject.originalDescription}
                  </p>
                </div>

                {/* Descrição Refinada */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">Descrição Refinada (Time de Inovação)</h4>
                      <Badge variant="outline">Refinada</Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingDescription(!editingDescription)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                  {editingDescription ? (
                    <div className="space-y-2">
                      <Textarea 
                        defaultValue={mockProject.refinedDescription}
                        rows={6}
                      />
                      <div className="flex gap-2">
                        <Button size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Salvar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingDescription(false)}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                      {mockProject.refinedDescription}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Lateral */}
          <div className="space-y-6">
            {/* Histórico de Análises IA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Histórico de Análises IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Visualize o histórico de análises de priorização feitas pela IA
                </p>
                <Button variant="outline" className="w-full">
                  Ver Histórico
                </Button>
              </CardContent>
            </Card>

            {/* Ferramentas de IA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Ferramentas de IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Use IA para estruturar descrições e gerar resumos executivos profissionais
                </p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Estruturar Descrição
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Resumos Executivos
                  </Button>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Organizar e estruturar a descrição da ideia
                  </p>
                  <Button variant="secondary" className="w-full">
                    Gerar e Editar Descrição Estruturada
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Gerenciamento de Etapas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Gerenciamento de Etapas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Complete a etapa atual para avançar na esteira de inovação
                </p>
                
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progresso na Esteira</span>
                    <Badge>Em Andamento</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{mockProject.progress}%</span>
                      <span className="text-muted-foreground">Etapa 2 de 11</span>
                    </div>
                    <Progress value={mockProject.progress} className="h-2" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{mockProject.currentStage}</p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">
                    Complete as informações abaixo para avançar na esteira de inovação
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="leadership" className="text-xs">Liderança Responsável *</Label>
                      <Select onValueChange={(value) => setFormData({...formData, leadership: value})}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Selecione ou gerencie uma liderança" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="marcus">Marcus Leitão</SelectItem>
                          <SelectItem value="daniele">Daniele Silva</SelectItem>
                          <SelectItem value="roberto">Roberto Santos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="startDate" className="text-xs">Data Prevista de Início *</Label>
                        <Input 
                          type="date" 
                          className="h-8"
                          onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endDate" className="text-xs">Data Prevista de Término *</Label>
                        <Input 
                          type="date" 
                          className="h-8"
                          onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Alinhamento Estratégico *</Label>
                      <Select onValueChange={(value) => setFormData({...formData, strategicAlignment: value})}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Selecione o alinhamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excelencia">Excelência Operacional</SelectItem>
                          <SelectItem value="inovacao">Inovação de Produto</SelectItem>
                          <SelectItem value="experiencia">Experiência do Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Impacto *</Label>
                        <Select onValueChange={(value) => setFormData({...formData, impact: value})}>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Selecione o impacto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alto">Alto</SelectItem>
                            <SelectItem value="medio">Médio</SelectItem>
                            <SelectItem value="baixo">Baixo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Viabilidade *</Label>
                        <Select onValueChange={(value) => setFormData({...formData, viability: value})}>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Selecione a viabilidade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="media">Média</SelectItem>
                            <SelectItem value="baixa">Baixa</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Esforço *</Label>
                        <Select onValueChange={(value) => setFormData({...formData, effort: value})}>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Selecione o esforço" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="baixo">Baixo</SelectItem>
                            <SelectItem value="medio">Médio</SelectItem>
                            <SelectItem value="alto">Alto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Horizonte de Inovação *</Label>
                        <Select onValueChange={(value) => setFormData({...formData, innovationHorizon: value})}>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Selecione o horizonte" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="h1">H1 - Core</SelectItem>
                            <SelectItem value="h2">H2 - Adjacent</SelectItem>
                            <SelectItem value="h3">H3 - Transformational</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Análise IA */}
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      Análise IA para Priorização
                    </h5>
                    {isFormComplete ? (
                      <Button size="sm" className="w-full">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Executar Análise IA
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Preencha todos os campos obrigatórios para habilitar a análise por IA
                      </p>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="space-y-2 mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      Salvar Rascunho
                    </Button>
                    <Button 
                      size="sm" 
                      className="w-full"
                      disabled={!isFormComplete}
                    >
                      Completar Priorização e Avançar para Hipótese Formulada
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedInnovationProject;