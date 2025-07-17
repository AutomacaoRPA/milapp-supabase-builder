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
    color: "bg-blue-50 border-blue-200 text-blue-800",
    headerColor: "bg-blue-100",
    description: "Conceitos e validação inicial"
  },
  { 
    id: "planejamento", 
    label: "📋 Planejamento", 
    color: "bg-yellow-50 border-yellow-200 text-yellow-800",
    headerColor: "bg-yellow-100",
    description: "Definição de escopo e recursos"
  },
  { 
    id: "desenvolvimento", 
    label: "⚙️ Desenvolvimento", 
    color: "bg-primary/5 border-primary/20 text-primary",
    headerColor: "bg-primary/10",
    description: "Implementação e coding"
  },
  { 
    id: "homologacao", 
    label: "🧪 Homologação", 
    color: "bg-orange-50 border-orange-200 text-orange-800",
    headerColor: "bg-orange-100",
    description: "Testes e validação"
  },
  { 
    id: "producao", 
    label: "🚀 Produção", 
    color: "bg-green-50 border-green-200 text-green-800",
    headerColor: "bg-green-100",
    description: "Deploy e monitoramento"
  },
  { 
    id: "suspenso", 
    label: "⏸️ Suspenso", 
    color: "bg-red-50 border-red-200 text-red-800",
    headerColor: "bg-red-100",
    description: "Projetos pausados"
  },
  { 
    id: "concluido", 
    label: "✅ Concluído", 
    color: "bg-accent/5 border-accent/20 text-accent",
    headerColor: "bg-accent/10",
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
    <div className="w-full overflow-x-auto">
      <div className="flex gap-4 min-w-max pb-4" style={{ minWidth: 'fit-content' }}>
        {statusColumns.map((column) => (
          <div key={column.id} className="flex flex-col w-80 flex-shrink-0">
            {/* Header da Coluna */}
            <div className={`p-4 rounded-t-lg border-2 border-b-0 ${column.color} ${column.headerColor}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{column.label}</h3>
                <Badge variant="secondary" className="text-xs font-bold">
                  {projectsByStatus[column.id]?.length || 0}
                </Badge>
              </div>
              <p className="text-xs opacity-75">{column.description}</p>
            </div>
            
            {/* Cards dos Projetos */}
            <div className={`flex-1 min-h-[600px] p-3 border-2 border-t-0 rounded-b-lg space-y-3 ${column.color} bg-opacity-30`}>
              {projectsByStatus[column.id]?.map((project, index) => {
                const PriorityIcon = getPriorityIcon(project.priority);
                const daysUntilTarget = getDaysUntilTarget(project);
                const isUrgent = daysUntilTarget !== null && daysUntilTarget <= 7 && daysUntilTarget > 0;
                
                return (
                  <Card 
                    key={project.id} 
                    className={`transition-all hover:shadow-md animate-slide-up cursor-pointer group bg-white/80 backdrop-blur-sm ${
                      isOverdue(project) ? "border-destructive/50 bg-destructive/5" :
                      isUrgent ? "border-rpa/50 bg-rpa/5" : ""
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => onProjectSelect?.(project)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-sm leading-tight line-clamp-2">
                              {project.name}
                            </CardTitle>
                            {(isOverdue(project) || isUrgent) && (
                              <Clock className={`h-3 w-3 flex-shrink-0 ${
                                isOverdue(project) ? "text-destructive" : "text-rpa"
                              }`} />
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
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
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onProjectSelect?.(project);
                            }}
                          >
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {project.description && (
                        <CardDescription className="line-clamp-2 text-xs">
                          {project.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0">
                      {/* Progress */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{calculateProgress(project)}%</span>
                        </div>
                        <Progress value={calculateProgress(project)} className="h-1.5" />
                      </div>

                      {/* Prioridade e Complexidade */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <PriorityIcon className={`h-3 w-3 ${getPriorityColor(project.priority)}`} />
                            <span className="text-muted-foreground">Prioridade</span>
                          </div>
                          <Badge variant="outline" className={`text-xs ${getPriorityColor(project.priority)}`}>
                            P{project.priority || 0}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-accent" />
                            <span className="text-muted-foreground">Complexidade</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {project.complexity_score || "N/A"}
                          </Badge>
                        </div>
                      </div>

                      {/* ROI */}
                      {project.estimated_roi && (
                        <div className="flex items-center gap-2 p-2 bg-rpa/5 rounded-md">
                          <TrendingUp className="h-3 w-3 text-rpa" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">ROI Estimado</p>
                            <p className="text-xs font-medium text-rpa">
                              {formatCurrency(project.estimated_roi)}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Timeline */}
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-1">
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
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              isOverdue(project) ? "border-destructive text-destructive" :
                              isUrgent ? "border-rpa text-rpa" : 
                              "text-muted-foreground"
                            }`}
                          >
                            {isOverdue(project) 
                              ? `${Math.abs(daysUntilTarget)} dias atraso`
                              : `${daysUntilTarget} dias restantes`
                            }
                          </Badge>
                        )}
                      </div>

                      {/* Team */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Equipe</span>
                        </div>
                        <div className="flex -space-x-1">
                          <Avatar className="h-4 w-4 border border-background">
                            <AvatarFallback className="text-[10px]">
                              {project.created_by?.slice(0, 2).toUpperCase() || "??"}
                            </AvatarFallback>
                          </Avatar>
                          {project.assigned_architect && (
                            <Avatar className="h-4 w-4 border border-background">
                              <AvatarFallback className="text-[10px] bg-primary/10">
                                AR
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {project.product_owner && (
                            <Avatar className="h-4 w-4 border border-background">
                              <AvatarFallback className="text-[10px] bg-rpa/10">
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
                <div className="flex items-center justify-center h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-white/50">
                  <p className="text-sm text-muted-foreground">
                    Arraste projetos aqui
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectKanban;
