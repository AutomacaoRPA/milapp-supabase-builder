import { Project } from "@/hooks/useProjects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, DollarSign, Users, TrendingUp, Eye } from "lucide-react";

interface ProjectGridViewProps {
  projects: Project[];
  onProjectUpdate: (id: string, updates: Partial<Project>) => Promise<void>;
  onProjectSelect: (project: Project) => void;
}

const ProjectGridView = ({ projects, onProjectUpdate, onProjectSelect }: ProjectGridViewProps) => {
  const getStatusColor = (status: string) => {
    const colors = {
      ideacao: "bg-purple-100 text-purple-800",
      planejamento: "bg-blue-100 text-blue-800", 
      desenvolvimento: "bg-yellow-100 text-yellow-800",
      homologacao: "bg-orange-100 text-orange-800",
      producao: "bg-green-100 text-green-800",
      suspenso: "bg-gray-100 text-gray-800",
      concluido: "bg-emerald-100 text-emerald-800"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: number | null) => {
    if (!priority) return "text-muted-foreground";
    if (priority >= 4) return "text-destructive";
    if (priority >= 3) return "text-rpa";
    return "text-accent";
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.id} className="hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <CardTitle className="text-lg">{project.name}</CardTitle>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(project.status || "")}>
                    {project.status}
                  </Badge>
                  {project.priority && project.priority >= 4 && (
                    <Badge variant="destructive">Alta Prioridade</Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onProjectSelect(project)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
            
            {project.description && (
              <CardDescription className="line-clamp-2">
                {project.description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {/* Informações do projeto */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {project.target_date && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(project.target_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
                
                {project.estimated_roi && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
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

                {project.methodology && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="capitalize">{project.methodology}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Equipe</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => onProjectSelect(project)}
              >
                Ver Detalhes
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProjectGridView;
