
import { useMemo } from "react";
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
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight
} from "lucide-react";
import { Project } from "@/hooks/useProjects";

interface ProjectKanbanProps {
  projects: Project[];
  onProjectUpdate?: (projectId: string, updates: Partial<Project>) => void;
  onProjectSelect?: (project: Project) => void;
}

const statusColumns = [
  { 
    id: "ideacao", 
    label: "💡 Ideação", 
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Conceitos e validação inicial"
  },
  { 
    id: "planejamento", 
    label: "📋 Planejamento", 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    description: "Definição de escopo e recursos"
  },
  { 
    id: "desenvolvimento", 
    label: "⚙️ Desenvolvimento", 
    color: "bg-primary/10 text-primary border-primary/20",
    description: "Implementação e coding"
  },
  { 
    id: "homologacao", 
    label: "🧪 Homologação", 
    color: "bg-orange-100 text-orange-800 border-orange-200",
    description: "Testes e validação"
  },
  { 
    id: "producao", 
    label: "🚀 Produção", 
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Deploy e monitoramento"
  },
  { 
    id: "suspenso", 
    label: "⏸️ Suspenso", 
    color: "bg-red-100 text-red-800 border-red-200",
    description: "Projetos pausados"
  },
  { 
    id: "concluido", 
    label: "✅ Concluído", 
    color: "bg-accent/10 text-accent border-accent/20",
    description: "Entregues com sucesso"
  }
];

const ProjectKanban = ({ projects, onProjectUpdate, onProjectSelect }: ProjectKanbanProps) => {
  const projectsByStatus = useMemo(() => {
    return statusColumns.reduce((acc, column) => {
      acc[column.id] = projects.filter(project => project.status === column.id);
      return acc;
    }, {} as Record<string, Project[]>);
  }, [projects]);

  const getPriorityColor = (priority: number | null) => {
    if (!priority) return "text-muted-foreground";
    if (priority >= 4) return "text-destructive";
    if (priority >= 3) return "text-rpa";
    return "text-accent";
  };

  const getPriorityIcon = (priority: number | null) => {
    if (!priority || priority < 4) return AlertTriangle;
    return priority >= 4 ? XCircle : CheckCircle;
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

  const getDaysUntilTarget = (project: Project) => {
    if (!project.target_date) return null;
    const target = new Date(project.target_date);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-6 min-h-[600px]">
      {statusColumns.map((column) => (
        <div key={column.id} className="space-y-4">
          {/* Header da Coluna */}
          <div className={`p-4 rounded-lg border-2 ${column.color}`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{column.label}</h3>
              <Badge variant="secondary" className="text-sm font-bold">
                {projectsByStatus[column.id]?.length || 0}
              </Badge>
            </div>
            <p className="text-sm opacity-80">{column.description}</p>
          </div>
          
          {/* Cards dos Projetos */}
          <div className="space-y-4 min-h-[500px] p-2 rounded-lg bg-muted/20">
            {projectsByStatus[column.id]?.map((project, index) => {
              const PriorityIcon = getPriorityIcon(project.priority);
              const daysUntilTarget = getDaysUntilTarget(project);
              const isUrgent = daysUntilTarget !== null && daysUntilTarget <= 7 && daysUntilTarget > 0;
              
              return (
                <Card 
                  key={project.id} 
                  className={`transition-all hover:shadow-lg animate-slide-up cursor-pointer group ${
                    isOverdue(project) ? "border-destructive/50 bg-destructive/5" :
                    isUrgent ? "border-rpa/50 bg-rpa/5" : ""
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  onClick={() => onProjectSelect?.(project)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base leading-tight">
                            {project.name}
                          </CardTitle>
                          {(isOverdue(project) || isUrgent) && (
                            <Clock className={`h-4 w-4 ${
                              isOverdue(project) ? "text-destructive" : "text-rpa"
                            }`} />
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          <Badge className={column.color} variant="outline">
                            {column.label.replace(/[^\w\s]/gi, '').trim()}
                          </Badge>
                          {project.methodology && (
                            <Badge variant="outline" className="text-xs">
                              {project.methodology}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            onProjectSelect?.(project);
                          }}
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {project.description && (
                      <CardDescription className="line-clamp-2 text-sm">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    {/* Progress com Governança */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Progresso</span>
                        <span className="font-medium">{calculateProgress(project)}%</span>
                      </div>
                      <Progress value={calculateProgress(project)} className="h-2" />
                    </div>

                    {/* Métricas de Governança */}
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Target className="h-3 w-3 text-accent" />
                          <span>Complexidade:</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {project.complexity_score || "N/A"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <PriorityIcon 
                            className={`h-3 w-3 ${getPriorityColor(project.priority)}`} 
                          />
                          <span>Prioridade:</span>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getPriorityColor(project.priority)}`}
                        >
                          {getPriorityLabel(project.priority)}
                        </Badge>
                      </div>
                    </div>

                    {/* ROI */}
                    {project.estimated_roi && (
                      <div className="flex items-center gap-2 p-2 bg-rpa/5 rounded-lg">
                        <TrendingUp className="h-3 w-3 text-rpa" />
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">ROI Estimado</p>
                          <p className="text-sm font-medium text-rpa">
                            {formatCurrency(project.estimated_roi)}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Timeline */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Meta:</span>
                        <span className={
                          isOverdue(project) ? "text-destructive font-medium" :
                          isUrgent ? "text-rpa font-medium" : ""
                        }>
                          {formatDate(project.target_date)}
                        </span>
                      </div>
                      
                      {daysUntilTarget !== null && (
                        <div className="text-xs">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              isOverdue(project) ? "border-destructive text-destructive" :
                              isUrgent ? "border-rpa text-rpa" : 
                              "text-muted-foreground"
                            }`}
                          >
                            {isOverdue(project) 
                              ? `${Math.abs(daysUntilTarget)} dias em atraso`
                              : `${daysUntilTarget} dias restantes`
                            }
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Team */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Equipe</span>
                      </div>
                      <div className="flex -space-x-1">
                        <Avatar className="h-5 w-5 border-2 border-background">
                          <AvatarFallback className="text-xs">
                            {project.created_by?.slice(0, 2).toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        {project.assigned_architect && (
                          <Avatar className="h-5 w-5 border-2 border-background">
                            <AvatarFallback className="text-xs bg-primary/10">
                              AR
                            </AvatarFallback>
                          </Avatar>
                        )}
                        {project.product_owner && (
                          <Avatar className="h-5 w-5 border-2 border-background">
                            <AvatarFallback className="text-xs bg-rpa/10">
                              PO
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {/* Drop Zone para Kanban */}
            {projectsByStatus[column.id]?.length === 0 && (
              <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Arraste projetos aqui
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectKanban;
