import { useMemo, useState } from "react";
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
  ArrowRight,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { Project } from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";

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
  const [draggedProject, setDraggedProject] = useState<Project | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);
  const { toast } = useToast();

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

  const handleDragStart = (e: React.DragEvent, project: Project) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setHoveredColumn(columnId);
  };

  const handleDragLeave = () => {
    setHoveredColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setHoveredColumn(null);
    
    if (draggedProject && draggedProject.status !== columnId) {
      try {
        await onProjectUpdate?.(draggedProject.id, { status: columnId });
        toast({
          title: "Status Atualizado",
          description: `Projeto movido para ${statusColumns.find(col => col.id === columnId)?.label}`,
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o status do projeto",
          variant: "destructive",
        });
      }
    }
    setDraggedProject(null);
  };

  const handleProjectAction = (action: string, project: Project) => {
    switch (action) {
      case "view":
        onProjectSelect?.(project);
        break;
      case "edit":
        // Implementar edição inline ou modal
        toast({
          title: "Funcionalidade",
          description: "Edição inline será implementada em breve",
        });
        break;
      case "delete":
        if (confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?`)) {
          // Implementar exclusão
          toast({
            title: "Funcionalidade",
            description: "Exclusão será implementada em breve",
          });
        }
        break;
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-4 min-w-max pb-4" style={{ minWidth: 'fit-content' }}>
        {statusColumns.map((column) => (
          <div 
            key={column.id} 
            className="flex flex-col w-80 flex-shrink-0"
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Header da Coluna */}
            <div className={`p-4 rounded-t-lg border-2 border-b-0 ${column.color} ${column.headerColor} ${
              hoveredColumn === column.id ? "ring-2 ring-primary ring-opacity-50" : ""
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">{column.label}</h3>
                <Badge variant="secondary" className="text-xs font-bold">
                  {projectsByStatus[column.id]?.length || 0}
                </Badge>
              </div>
              <p className="text-xs opacity-75">{column.description}</p>
            </div>
            
            {/* Cards dos Projetos */}
            <div className={`flex-1 min-h-[600px] p-3 border-2 border-t-0 rounded-b-lg space-y-3 ${column.color} bg-opacity-30 ${
              hoveredColumn === column.id ? "bg-primary/10" : ""
            }`}>
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
                    } ${draggedProject?.id === project.id ? "opacity-50" : ""}`}
                    style={{ animationDelay: `${index * 50}ms` }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, project)}
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
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPriorityColor(project.priority)}`}
                            >
                              <PriorityIcon className="h-2 w-2 mr-1" />
                              {getPriorityLabel(project.priority)}
                            </Badge>
                          </div>
                        </div>

                        {/* Menu de Ações */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProjectAction("view", project);
                              }}
                              title="Ver detalhes"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProjectAction("edit", project);
                              }}
                              title="Editar"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProjectAction("delete", project);
                              }}
                              title="Excluir"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 space-y-3">
                      {/* Descrição */}
                      {project.description && (
                        <CardDescription className="text-xs line-clamp-2">
                          {project.description}
                        </CardDescription>
                      )}

                      {/* Progresso */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progresso</span>
                          <span>{calculateProgress(project)}%</span>
                        </div>
                        <Progress value={calculateProgress(project)} className="h-2" />
                      </div>

                      {/* Métricas */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-accent" />
                          <span>ROI: {formatCurrency(project.estimated_roi)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3 text-rpa" />
                          <span>Complexidade: {project.complexity_score}/10</span>
                        </div>
                      </div>

                      {/* Datas */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Meta: {formatDate(project.target_date)}</span>
                        </div>
                        {daysUntilTarget !== null && (
                          <Badge 
                            variant={isOverdue(project) ? "destructive" : isUrgent ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {isOverdue(project) 
                              ? `${Math.abs(daysUntilTarget)}d atrasado`
                              : isUrgent 
                                ? `${daysUntilTarget}d restantes`
                                : `${daysUntilTarget}d`
                            }
                          </Badge>
                        )}
                      </div>

                      {/* Equipe */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {project.assigned_architect ? "Arquiteto" : "Sem arquiteto"}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onProjectSelect?.(project);
                          }}
                        >
                          <ArrowRight className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              {/* Área de drop vazia */}
              {projectsByStatus[column.id]?.length === 0 && (
                <div className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                  Arraste projetos aqui
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
