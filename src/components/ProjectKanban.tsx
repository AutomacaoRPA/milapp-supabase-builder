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
    label: "Backlog", 
    color: "border-l-4 border-l-red-500",
    count: 0
  },
  { 
    id: "planejamento", 
    label: "Priorizado", 
    color: "border-l-4 border-l-yellow-500",
    count: 1
  },
  { 
    id: "desenvolvimento", 
    label: "Em Desenvolvimento", 
    color: "border-l-4 border-l-blue-500",
    count: 2
  },
  { 
    id: "homologacao", 
    label: "Validação", 
    color: "border-l-4 border-l-green-500",
    count: 0
  },
  { 
    id: "concluido", 
    label: "Concluído", 
    color: "border-l-4 border-l-gray-500",
    count: 0
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
    <div className="w-full overflow-x-auto bg-gray-50 p-4">
      <div className="flex gap-1 min-w-max" style={{ minWidth: 'fit-content' }}>
        {statusColumns.map((column) => (
          <div key={column.id} className="flex flex-col w-80 bg-white border border-gray-200">
            {/* Header da Coluna */}
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
              <h3 className="font-medium text-sm text-gray-700">{column.label}</h3>
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                {projectsByStatus[column.id]?.length || 0}
              </span>
            </div>
            
            {/* Cards dos Projetos */}
            <div className="flex-1 min-h-[600px] p-2 space-y-2 bg-gray-50">
              {projectsByStatus[column.id]?.map((project, index) => {
                const progress = calculateProgress(project);
                const daysUntilTarget = getDaysUntilTarget(project);
                
                return (
                  <div
                    key={project.id}
                    className={`bg-white border ${column.color} rounded shadow-sm hover:shadow-md transition-shadow cursor-pointer p-3`}
                    onClick={() => onProjectSelect?.(project)}
                  >
                    {/* Header do Card */}
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-red-600 text-sm font-medium">🐞 {Math.floor(Math.random() * 90000) + 10000}</span>
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                            {project.name.toUpperCase()}
                          </h4>
                        </div>
                        
                        {project.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {project.description}
                          </p>
                        )}

                        {/* Status Badge */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ● {column.label}
                          </span>
                        </div>

                        {/* Assignee */}
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-xs bg-blue-500 text-white">
                              {project.created_by?.charAt(0)?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-gray-600">
                            {project.assigned_architect || project.created_by || "Não atribuído"}
                          </span>
                        </div>

                        {/* Tags/Labels */}
                        <div className="flex items-center gap-1 mb-2">
                          <Badge className="bg-blue-600 text-white text-xs px-2 py-1">
                            PROJETO
                          </Badge>
                        </div>

                        {/* Progress */}
                        {project.target_date && (
                          <div className="text-xs text-gray-600 mb-2">
                            <span className="font-medium">Target Date:</span> {formatDate(project.target_date)}
                          </div>
                        )}

                        {/* Tasks Progress */}
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <span className="bg-yellow-100 px-1 rounded">📝</span>
                          <span>{Math.floor(progress/25)}/{Math.ceil(progress/20)}</span>
                        </div>

                        {/* Subtasks/Checklist */}
                        <div className="mt-2 space-y-1">
                          {project.methodology === "scrum" && (
                            <>
                              <div className="flex items-center gap-2 text-xs">
                                <input type="checkbox" checked className="h-3 w-3" readOnly />
                                <span className="bg-yellow-100 px-1 rounded">📝</span>
                                <span className="bg-blue-100 px-1 rounded">👤</span>
                                <span className="text-blue-600 underline">Reunião em 04/10 par...</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <input type="checkbox" checked className="h-3 w-3" readOnly />
                                <span className="bg-yellow-100 px-1 rounded">📝</span>
                                <span className="bg-green-500 text-white px-1 rounded text-xs">●</span>
                                <span className="text-blue-600 underline">Visita do Fornecedor</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <input type="checkbox" checked className="h-3 w-3" readOnly />
                                <span className="bg-yellow-100 px-1 rounded">📝</span>
                                <span className="bg-green-500 text-white px-1 rounded text-xs">●</span>
                                <span className="text-blue-600 underline">Proposta Comercial</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Parent/Epic Info */}
                        {project.methodology && (
                          <div className="mt-2 text-xs text-gray-600">
                            <span className="font-medium">Parent:</span>
                            <span className="text-purple-600 ml-1">🔗 {project.methodology.toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Botão Add New Item */}
              <div className="p-3 border-2 border-dashed border-gray-300 rounded text-center hover:bg-gray-100 cursor-pointer">
                <span className="text-gray-500 text-sm">+ New item</span>
              </div>
              
              {/* Empty State */}
              {projectsByStatus[column.id]?.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Nenhum item nesta coluna
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
