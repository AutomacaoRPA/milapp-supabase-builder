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
  AlertTriangle
} from "lucide-react";
import { Project } from "@/hooks/useProjects";

interface ProjectKanbanProps {
  projects: Project[];
  onProjectUpdate?: (projectId: string, updates: Partial<Project>) => void;
}

const statusColumns = [
  { id: "ideacao", label: "Ideação", color: "bg-blue-100 text-blue-800" },
  { id: "planejamento", label: "Planejamento", color: "bg-yellow-100 text-yellow-800" },
  { id: "desenvolvimento", label: "Desenvolvimento", color: "bg-primary/10 text-primary" },
  { id: "homologacao", label: "Homologação", color: "bg-orange-100 text-orange-800" },
  { id: "producao", label: "Produção", color: "bg-green-100 text-green-800" },
  { id: "suspenso", label: "Suspenso", color: "bg-red-100 text-red-800" },
  { id: "concluido", label: "Concluído", color: "bg-accent/10 text-accent" }
];

const ProjectKanban = ({ projects, onProjectUpdate }: ProjectKanbanProps) => {
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

  const getPriorityLabel = (priority: number | null) => {
    if (!priority) return "Não definida";
    if (priority >= 4) return "Alta";
    if (priority >= 3) return "Média";
    return "Baixa";
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
    // Simula progresso baseado no status
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[600px]">
      {statusColumns.map((column) => (
        <div key={column.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{column.label}</h3>
            <Badge variant="secondary" className="text-xs">
              {projectsByStatus[column.id]?.length || 0}
            </Badge>
          </div>
          
          <div className="space-y-4 min-h-[500px] p-2 rounded-lg bg-muted/20">
            {projectsByStatus[column.id]?.map((project, index) => (
              <Card 
                key={project.id} 
                className="transition-all hover:shadow-primary animate-slide-up cursor-move" 
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <CardTitle className="text-base leading-tight">
                        {project.name}
                      </CardTitle>
                      <Badge className={column.color}>
                        {column.label}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                  {project.description && (
                    <CardDescription className="line-clamp-2 text-sm">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Progresso</span>
                      <span>{calculateProgress(project)}%</span>
                    </div>
                    <Progress value={calculateProgress(project)} className="h-2" />
                  </div>

                  {/* Métricas */}
                  <div className="grid grid-cols-1 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Target className="h-3 w-3 text-accent" />
                      <span>Complexidade: {project.complexity_score || "N/A"}</span>
                    </div>
                    
                    {project.estimated_roi && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-rpa" />
                        <span>{formatCurrency(project.estimated_roi)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span>{formatDate(project.target_date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <AlertTriangle 
                        className={`h-3 w-3 ${getPriorityColor(project.priority)}`} 
                      />
                      <span className={getPriorityColor(project.priority)}>
                        {getPriorityLabel(project.priority)}
                      </span>
                    </div>
                  </div>

                  {/* Team - Placeholder para futuras implementações */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">Equipe</span>
                    </div>
                    <div className="flex -space-x-1">
                      <Avatar className="h-5 w-5 border-2 border-background">
                        <AvatarFallback className="text-xs">
                          {project.created_by?.slice(0, 2).toUpperCase() || "??"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>

                  {/* Metodologia */}
                  {project.methodology && (
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-xs text-muted-foreground">Metodologia</span>
                      <Badge variant="outline" className="text-xs">
                        {project.methodology}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectKanban;