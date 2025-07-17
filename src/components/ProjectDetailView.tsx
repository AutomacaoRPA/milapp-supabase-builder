
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Plus, 
  Clock, 
  FileText, 
  CheckSquare,
  Calendar,
  User,
  Target
} from "lucide-react";
import { Project } from "@/hooks/useProjects";
import TaskManagement from "./TaskManagement";
import TimeTracking from "./TimeTracking";
import DocumentManagement from "./DocumentManagement";

interface ProjectDetailViewProps {
  project: Project;
  onBack: () => void;
}

const ProjectDetailView = ({ project, onBack }: ProjectDetailViewProps) => {
  const [activeTab, setActiveTab] = useState("tasks");

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

  const getPriorityColor = (priority: number | null) => {
    if (!priority) return "text-muted-foreground";
    if (priority >= 4) return "text-destructive";
    if (priority >= 3) return "text-rpa";
    return "text-accent";
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
    return statusProgress[project.status as keyof typeof statusProgress] || 0;
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
      {/* Header do Projeto */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge className={getStatusColor(project.status)}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </Badge>
          </div>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Progresso</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Concluído</span>
                <span className="font-medium">{calculateProgress()}%</span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-rpa" />
              <CardTitle className="text-sm">Prioridade</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-bold ${getPriorityColor(project.priority)}`}>
              {project.priority ? `${project.priority}/5` : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {project.complexity_score ? `Complexidade: ${project.complexity_score}/10` : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              <CardTitle className="text-sm">Cronograma</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="text-muted-foreground">Meta: </span>
                <span className="font-medium">{formatDate(project.target_date)}</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Início: </span>
                <span>{formatDate(project.start_date)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              <CardTitle className="text-sm">ROI</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="text-muted-foreground">Estimado: </span>
                <span className="font-medium text-green-600">
                  {formatCurrency(project.estimated_roi)}
                </span>
              </div>
              {project.actual_roi && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Real: </span>
                  <span className="font-medium">{formatCurrency(project.actual_roi)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Gestão */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Tarefas
          </TabsTrigger>
          <TabsTrigger value="time" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Horas
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <TaskManagement projectId={project.id} />
        </TabsContent>

        <TabsContent value="time">
          <TimeTracking projectId={project.id} />
        </TabsContent>

        <TabsContent value="docs">
          <DocumentManagement projectId={project.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectDetailView;
