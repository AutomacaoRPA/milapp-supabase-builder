
import { Project } from "@/hooks/useProjects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye, Calendar, DollarSign, Users, AlertTriangle } from "lucide-react";

interface ProjectStatusColumnsProps {
  projects: Project[];
  onProjectUpdate: (id: string, updates: Partial<Project>) => Promise<void>;
  onProjectSelect: (project: Project) => void;
}

const ProjectStatusColumns = ({ projects, onProjectUpdate, onProjectSelect }: ProjectStatusColumnsProps) => {
  const statusConfig = {
    ideacao: {
      title: "Captação de Ideias",
      color: "bg-purple-100 border-purple-300",
      headerColor: "bg-purple-50",
      count: projects.filter(p => p.status === "ideacao").length
    },
    planejamento: {
      title: "Priorização",
      color: "bg-blue-100 border-blue-300",
      headerColor: "bg-blue-50",
      count: projects.filter(p => p.status === "planejamento").length
    },
    desenvolvimento: {
      title: "Em Desenvolvimento",
      color: "bg-yellow-100 border-yellow-300",
      headerColor: "bg-yellow-50",
      count: projects.filter(p => p.status === "desenvolvimento").length
    },
    homologacao: {
      title: "Homologação",
      color: "bg-orange-100 border-orange-300",
      headerColor: "bg-orange-50",
      count: projects.filter(p => p.status === "homologacao").length
    },
    producao: {
      title: "Finalizadas",
      color: "bg-green-100 border-green-300",
      headerColor: "bg-green-50",
      count: projects.filter(p => p.status === "producao").length + projects.filter(p => p.status === "concluido").length
    }
  };

  const getProjectProgress = (project: Project) => {
    const progressMap = {
      ideacao: 10,
      planejamento: 20,
      desenvolvimento: 40,
      homologacao: 80,
      producao: 100,
      concluido: 100
    };
    return progressMap[project.status as keyof typeof progressMap] || 0;
  };

  const getProjectsByStatus = (status: string) => {
    if (status === "producao") {
      return projects.filter(p => p.status === "producao" || p.status === "concluido");
    }
    return projects.filter(p => p.status === status);
  };

  const getMethodologyBadge = (methodology: string | null) => {
    if (!methodology) return null;
    
    const methodologyColors = {
      scrum: "bg-blue-100 text-blue-800",
      kanban: "bg-green-100 text-green-800",
      waterfall: "bg-gray-100 text-gray-800",
      agile: "bg-purple-100 text-purple-800"
    };

    return (
      <Badge className={methodologyColors[methodology.toLowerCase() as keyof typeof methodologyColors] || "bg-gray-100 text-gray-800"}>
        {methodology.toUpperCase()}
      </Badge>
    );
  };

  const isOverdue = (targetDate: string | null) => {
    if (!targetDate) return false;
    return new Date(targetDate) < new Date();
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 min-h-[600px]">
      {Object.entries(statusConfig).map(([status, config]) => {
        const statusProjects = getProjectsByStatus(status);
        
        return (
          <div key={status} className="flex-shrink-0 w-80">
            {/* Column Header */}
            <div className={`${config.headerColor} p-4 rounded-t-lg border-b`}>
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">{config.title}</h3>
                <Badge variant="secondary" className="text-sm">
                  {config.count}
                </Badge>
              </div>
            </div>

            {/* Projects List */}
            <div className={`${config.color} min-h-[500px] rounded-b-lg p-4 space-y-4`}>
              {statusProjects.map((project) => (
                <Card key={project.id} className="bg-white hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            ID #{project.id.slice(-3)}
                          </Badge>
                          {project.priority && project.priority >= 4 && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          {project.target_date && isOverdue(project.target_date) && (
                            <Badge variant="destructive" className="text-xs">
                              Atrasado
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-sm leading-tight line-clamp-2">
                          {project.name}
                        </CardTitle>
                        {project.methodology && getMethodologyBadge(project.methodology)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onProjectSelect(project)}
                        className="ml-2"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {project.description && (
                      <CardDescription className="text-xs line-clamp-3">
                        {project.description}
                      </CardDescription>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium">Progresso</span>
                        <span className="text-xs text-muted-foreground">
                          {getProjectProgress(project)}%
                        </span>
                      </div>
                      <Progress value={getProjectProgress(project)} className="h-2" />
                      <span className="text-xs text-muted-foreground">
                        {project.status === "desenvolvimento" ? "Em andamento" : 
                         project.status === "planejamento" ? "Progredindo" : "Iniciando"}
                      </span>
                    </div>

                    {/* Project Info */}
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      {project.target_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{new Date(project.target_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                      
                      {project.estimated_roi && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(project.estimated_roi)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>{project.assigned_architect ? "Atribuído" : "Não atribuído"}</span>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => onProjectSelect(project)}
                    >
                      Detalhes
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {statusProjects.length === 0 && (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <span className="text-sm">Nenhum projeto neste status</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectStatusColumns;
