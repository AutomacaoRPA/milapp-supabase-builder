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
  ArrowRight,
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda - Timeline */}
          <div className="lg:col-span-4 space-y-6">
            {/* Timeline do Projeto */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" />
                  Timeline do Projeto
                </CardTitle>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Progresso Geral</p>
                  <p className="text-2xl font-bold">{mockProject.progress}%</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {projectStages.map((stage, index) => (
                  <div key={stage.id} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full border-2 ${
                      getStageStatus(index) === "completed" 
                        ? "bg-green-500 border-green-500" 
                        : getStageStatus(index) === "current"
                        ? "bg-blue-500 border-blue-500"
                        : "bg-gray-200 border-gray-300"
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${
                          getStageStatus(index) === "current" ? "font-medium text-blue-600" : ""
                        }`}>
                          {stage.name}
                        </span>
                        <Badge 
                          variant={getStageStatus(index) === "current" ? "default" : "outline"}
                          className={`text-xs ${
                            getStageStatus(index) === "current" 
                              ? "bg-green-500 text-white" 
                              : getStageStatus(index) === "completed"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-orange-100 text-orange-600"
                          }`}
                        >
                          {getStageStatus(index) === "completed" 
                            ? "Concluído" 
                            : getStageStatus(index) === "current"
                            ? "Em andamento"
                            : "Pendente"}
                        </Badge>
                      </div>
                      {getStageStatus(index) === "current" && (
                        <p className="text-xs text-muted-foreground mt-1">Etapa atual em execução</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Histórico de Análises IA */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5" />
                  Histórico de Análises IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Visualize o histórico de análises de priorização feitas pela IA
                </p>
                <Button variant="outline" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Histórico
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - Conteúdo Principal */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header do Projeto */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{mockProject.name}</CardTitle>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">Priorização</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Proponente</p>
                      <p className="font-medium">{mockProject.proponent}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Área Responsável</p>
                      <p className="font-medium">{mockProject.responsibleArea}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Criação</p>
                      <p className="font-medium">{mockProject.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Target className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Impacto Esperado</p>
                      <p className="font-medium">{mockProject.expectedImpact}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Labels do Projeto */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Labels do Projeto</h4>
                  <Button variant="outline" size="sm">
                    <Tag className="h-4 w-4 mr-2" />
                    Gerenciar Labels
                  </Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {mockProject.labels.map((label, index) => (
                    <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700">
                      {label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Descrição Original */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-medium">Descrição Original (Proponente)</h4>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Original
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {mockProject.originalDescription}
                </p>
              </CardContent>
            </Card>

            {/* Descrição Refinada */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Descrição Refinada (Time de Inovação)</h4>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Refinada
                    </Badge>
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
                  <div className="space-y-3">
                    <Textarea 
                      defaultValue={mockProject.refinedDescription}
                      rows={6}
                      className="resize-none"
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
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {mockProject.refinedDescription}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Ferramentas de IA */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium">Ferramentas de IA</h4>
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                    Inteligência Artificial
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Use IA para estruturar descrições e gerar resumos executivos profissionais
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="justify-start h-auto py-3">
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <span className="font-medium">Estruturar Descrição</span>
                      </div>
                    </div>
                  </Button>
                  <Button variant="outline" className="justify-start h-auto py-3 bg-green-50 border-green-200 hover:bg-green-100">
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-700">Resumos Executivos</span>
                      </div>
                    </div>
                  </Button>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-2">
                    Organizar e estruturar a descrição da ideia
                  </p>
                  <Button variant="secondary" className="w-full">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar e Editar Descrição Estruturada
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Gerenciamento de Etapas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Gerenciamento de Etapas
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Complete a etapa atual para avançar na esteira de inovação
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress na Esteira */}
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Progresso na Esteira</span>
                    <Badge className="bg-blue-100 text-blue-800">Em Andamento</Badge>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-bold">{mockProject.progress}%</span>
                    <span className="text-sm text-muted-foreground">Etapa 2 de 11</span>
                  </div>
                  <Progress value={mockProject.progress} className="h-2 mb-2" />
                  <p className="text-sm font-medium text-blue-700">{mockProject.currentStage}</p>
                  <p className="text-xs text-muted-foreground">
                    Complete as informações abaixo para avançar na esteira de inovação
                  </p>
                </div>

                {/* Formulário */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Liderança Responsável *</Label>
                    <Select onValueChange={(value) => setFormData({...formData, leadership: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione ou gerencie uma liderança" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marcus">Marcus Leitão</SelectItem>
                        <SelectItem value="daniele">Daniele Silva</SelectItem>
                        <SelectItem value="roberto">Roberto Santos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Data Prevista de Início *</Label>
                      <Input 
                        type="date" 
                        placeholder="dd/mm/aaaa"
                        onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Data Prevista de Término *</Label>
                      <Input 
                        type="date" 
                        placeholder="dd/mm/aaaa"
                        onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Alinhamento Estratégico *</Label>
                    <Select onValueChange={(value) => setFormData({...formData, strategicAlignment: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o alinhamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excelencia">Excelência Operacional</SelectItem>
                        <SelectItem value="inovacao">Inovação de Produto</SelectItem>
                        <SelectItem value="experiencia">Experiência do Cliente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Impacto *</Label>
                    <Select onValueChange={(value) => setFormData({...formData, impact: value})}>
                      <SelectTrigger>
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
                    <Label className="text-sm font-medium">Viabilidade *</Label>
                    <Select onValueChange={(value) => setFormData({...formData, viability: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a viabilidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="baixa">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Esforço *</Label>
                    <Select onValueChange={(value) => setFormData({...formData, effort: value})}>
                      <SelectTrigger>
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
                    <Label className="text-sm font-medium">Horizonte de Inovação *</Label>
                    <Select onValueChange={(value) => setFormData({...formData, innovationHorizon: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o horizonte" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="h1">H1 - Core</SelectItem>
                        <SelectItem value="h2">H2 - Adjacent</SelectItem>
                        <SelectItem value="h3">H3 - Transformational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Análise IA para Priorização */}
                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="h-5 w-5 text-green-600" />
                      <h5 className="font-medium text-green-800">Análise IA para Priorização</h5>
                    </div>
                    {isFormComplete ? (
                      <div className="text-center py-4">
                        <div className="animate-spin h-8 w-8 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className="text-sm text-green-700">Executando análise...</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Preencha todos os campos obrigatórios para habilitar a análise por IA
                      </p>
                    )}
                    {!isFormComplete && (
                      <div className="text-center py-8">
                        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Brain className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-muted-foreground">Complete o formulário para usar a IA</p>
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Rascunho
                    </Button>
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={!isFormComplete}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
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