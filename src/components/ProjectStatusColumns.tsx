
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
      color: "bg-slate-100 border-slate-300",
      headerColor: "bg-slate-50",
      count: projects.filter(p => p.status === "ideacao").length
    },
    qualidade_processos: {
      title: "Qualidade de Processos",
      color: "bg-violet-100 border-violet-300",
      headerColor: "bg-violet-50",
      count: projects.filter(p => p.status === "qualidade_processos").length
    },
    planejamento: {
      title: "Priorização",
      color: "bg-blue-100 border-blue-300",
      headerColor: "bg-blue-50",
      count: projects.filter(p => p.status === "planejamento").length
    },
    hipotese_formulada: {
      title: "Hipótese Formulada",
      color: "bg-purple-100 border-purple-300",
      headerColor: "bg-purple-50",
      count: projects.filter(p => p.status === "hipotese_formulada").length
    },
    analise_viabilidade: {
      title: "Análise de Viabilidade",
      color: "bg-yellow-100 border-yellow-300",
      headerColor: "bg-yellow-50",
      count: projects.filter(p => p.status === "analise_viabilidade").length
    },
    prototipo_rapido: {
      title: "Protótipo Rápido",
      color: "bg-orange-100 border-orange-300",
      headerColor: "bg-orange-50",
      count: projects.filter(p => p.status === "prototipo_rapido").length
    },
    validacao_prototipo: {
      title: "Validação do Protótipo",
      color: "bg-pink-100 border-pink-300",
      headerColor: "bg-pink-50",
      count: projects.filter(p => p.status === "validacao_prototipo").length
    },
    mvp: {
      title: "MVP",
      color: "bg-indigo-100 border-indigo-300",
      headerColor: "bg-indigo-50",
      count: projects.filter(p => p.status === "mvp").length
    },
    teste_operacional: {
      title: "Teste Operacional",
      color: "bg-emerald-100 border-emerald-300",
      headerColor: "bg-emerald-50",
      count: projects.filter(p => p.status === "teste_operacional").length
    },
    escala_entrega: {
      title: "Escala e Entrega",
      color: "bg-cyan-100 border-cyan-300",
      headerColor: "bg-cyan-50",
      count: projects.filter(p => p.status === "escala_entrega").length
    },
    acompanhamento_pos_entrega: {
      title: "Acompanhamento Pós-Entrega",
      color: "bg-teal-100 border-teal-300",
      headerColor: "bg-teal-50",
      count: projects.filter(p => p.status === "acompanhamento_pos_entrega").length
    },
    sustentacao_evolucao: {
      title: "Sustentação e Evolução",
      color: "bg-green-100 border-green-300",
      headerColor: "bg-green-50",
      count: projects.filter(p => p.status === "sustentacao_evolucao").length + projects.filter(p => p.status === "concluido").length
    }
  };

  const getProjectProgress = (project: Project) => {
    const progressMap = {
      ideacao: 5,
      qualidade_processos: 10,
      planejamento: 15,
      hipotese_formulada: 25,
      analise_viabilidade: 35,
      prototipo_rapido: 45,
      validacao_prototipo: 55,
      mvp: 65,
      teste_operacional: 75,
      escala_entrega: 85,
      acompanhamento_pos_entrega: 95,
      sustentacao_evolucao: 100,
      concluido: 100
    };
    return progressMap[project.status as keyof typeof progressMap] || 0;
  };

  const getProjectsByStatus = (status: string) => {
    if (status === "sustentacao_evolucao") {
      return projects.filter(p => p.status === "sustentacao_evolucao" || p.status === "concluido");
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
