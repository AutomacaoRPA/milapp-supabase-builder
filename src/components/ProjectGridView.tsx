
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  MoreVertical, 
  Calendar, 
  Users, 
  Target, 
  TrendingUp,
  AlertTriangle,
  Clock
} from "lucide-react";
import { Project } from "@/hooks/useProjects";

interface ProjectGridViewProps {
  projects: Project[];
  onProjectUpdate?: (projectId: string, updates: Partial<Project>) => void;
}

const ProjectGridView = ({ projects, onProjectUpdate }: ProjectGridViewProps) => {
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

  const getPriorityLabel = (priority: number | null) => {
    if (!priority) return "Não definida";
    const labels = ["", "Muito Baixa", "Baixa", "Média", "Alta", "Crítica"];
    return labels[priority] || "Não definida";
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

  const calculateProgress = (project: Project) => {
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

  const isOverdue = (project: Project) => {
    if (!project.target_date || project.status === "concluido") return false;
    return new Date(project.target_date) < new Date();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Card 
          key={project.id} 
          className={`transition-all hover:shadow-lg ${
            isOverdue(project) ? "border-destructive/50 bg-destructive/5" : ""
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg leading-tight">
                    {project.name}
                  </CardTitle>
                  {isOverdue(project) && (
                    <Clock className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(project.status)}>
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </Badge>
                  {project.methodology && (
                    <Badge variant="outline" className="text-xs">
                      {project.methodology}
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
            {project.description && (
              <CardDescription className="line-clamp-2">
                {project.description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{calculateProgress(project)}%</span>
              </div>
              <Progress value={calculateProgress(project)} className="h-2" />
            </div>

            {/* Métricas Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Complexidade</p>
                  <p className="font-medium">{project.complexity_score || "N/A"}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <AlertTriangle 
                  className={`h-4 w-4 ${getPriorityColor(project.priority)}`} 
                />
                <div>
                  <p className="text-xs text-muted-foreground">Prioridade</p>
                  <p className={`font-medium text-xs ${getPriorityColor(project.priority)}`}>
                    {getPriorityLabel(project.priority)}
                  </p>
                </div>
              </div>
            </div>

            {/* ROI */}
            {project.estimated_roi && (
              <div className="flex items-center gap-2 p-2 bg-rpa/5 rounded-lg">
                <TrendingUp className="h-4 w-4 text-rpa" />
                <div>
                  <p className="text-xs text-muted-foreground">ROI Estimado</p>
                  <p className="font-medium text-rpa">{formatCurrency(project.estimated_roi)}</p>
                </div>
              </div>
            )}

            {/* Datas */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Meta:</span>
                <span className={isOverdue(project) ? "text-destructive font-medium" : ""}>
                  {formatDate(project.target_date)}
                </span>
              </div>
            </div>

            {/* Team */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Equipe</span>
              </div>
              <div className="flex -space-x-1">
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-xs">
                    {project.created_by?.slice(0, 2).toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>
                {project.assigned_architect && (
                  <Avatar className="h-6 w-6 border-2 border-background">
                    <AvatarFallback className="text-xs">
                      AR
                    </AvatarFallback>
                  </Avatar>
                )}
                {project.product_owner && (
                  <Avatar className="h-6 w-6 border-2 border-background">
                    <AvatarFallback className="text-xs">
                      PO
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProjectGridView;
