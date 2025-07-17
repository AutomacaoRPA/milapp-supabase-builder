import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, LayoutGrid, Kanban, Target, Clock, TrendingUp, AlertTriangle, Filter, Search, ArrowRight, Users, GitBranch, Activity, CheckCircle2, BookOpen } from "lucide-react";
import { useProjects, Project } from "@/hooks/useProjects";
import ProjectKanban from "@/components/ProjectKanban";
import ProjectGridView from "@/components/ProjectGridView";
import ProjectFilters from "@/components/ProjectFilters";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import PDDProjectView from "@/components/PDDProjectView";
import WorkItemBoard from "@/components/WorkItemBoard";
import SprintBoard from "@/components/SprintBoard";
import PipelineManagement from "@/components/PipelineManagement";
import DevOpsOverview from "@/components/DevOpsOverview";
import InnovationPipelineGuide from "@/components/InnovationPipelineGuide";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import ScrumBoard from "@/components/ScrumBoard";
import ProjectStatusColumns from "@/components/ProjectStatusColumns";

const Projetos = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"columns" | "kanban" | "grid" | "workitems" | "sprints" | "scrum" | "pipelines" | "devops" | "guide">("columns");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState({
    status: [],
    priority: [],
    methodology: [],
  });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const { projects, loading, createProject, updateProject } = useProjects();

  // Se um projeto está selecionado, mostrar a visão PDD detalhada
  if (selectedProject) {
    return (
      <PDDProjectView 
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  // Filtrar projetos baseado na busca e filtros
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedFilters.status.length === 0 || 
                         selectedFilters.status.includes(project.status);
    
    const matchesPriority = selectedFilters.priority.length === 0 || 
                           selectedFilters.priority.includes(project.priority?.toString());
    
    const matchesMethodology = selectedFilters.methodology.length === 0 || 
                              selectedFilters.methodology.includes(project.methodology);

    return matchesSearch && matchesStatus && matchesPriority && matchesMethodology;
  });

  const statusCounts = {
    total: filteredProjects.length,
    ideacao: filteredProjects.filter(p => p.status === "ideacao").length,
    planejamento: filteredProjects.filter(p => p.status === "planejamento").length,
    desenvolvimento: filteredProjects.filter(p => p.status === "desenvolvimento").length,
    homologacao: filteredProjects.filter(p => p.status === "homologacao").length,
    producao: filteredProjects.filter(p => p.status === "producao").length,
    suspenso: filteredProjects.filter(p => p.status === "suspenso").length,
    concluido: filteredProjects.filter(p => p.status === "concluido").length,
  };

  const totalEstimatedROI = filteredProjects.reduce((sum, project) => 
    sum + (project.estimated_roi || 0), 0
  );

  const highPriorityProjects = filteredProjects.filter(p => (p.priority || 0) >= 4).length;
  const overdueProjects = filteredProjects.filter(p => {
    if (!p.target_date) return false;
    return new Date(p.target_date) < new Date() && p.status !== "concluido";
  }).length;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      );
    }

    // Para views que precisam de um projeto específico, use o primeiro projeto disponível
    const sampleProject = filteredProjects[0];

    switch (viewMode) {
      case "guide":
        return <InnovationPipelineGuide />;
      case "workitems":
        return sampleProject ? <WorkItemBoard project={sampleProject} /> : <div>Selecione um projeto</div>;
      case "sprints":
        return sampleProject ? <SprintBoard project={sampleProject} /> : <div>Selecione um projeto</div>;
      case "scrum":
        return sampleProject ? <ScrumBoard project={sampleProject} /> : <div>Selecione um projeto</div>;
      case "pipelines":
        return sampleProject ? <PipelineManagement project={sampleProject} /> : <div>Selecione um projeto</div>;
      case "devops":
        return sampleProject ? <DevOpsOverview project={sampleProject} /> : <div>Selecione um projeto</div>;
      case "grid":
        return (
          <ProjectGridView 
            projects={filteredProjects}
            onProjectUpdate={updateProject}
            onProjectSelect={setSelectedProject}
          />
        );
      case "columns":
        return (
          <ProjectStatusColumns 
            projects={filteredProjects}
            onProjectUpdate={updateProject}
            onProjectSelect={setSelectedProject}
          />
        );
      case "kanban":
      default:
        return (
          <ProjectKanban 
            projects={filteredProjects} 
            onProjectUpdate={updateProject}
            onProjectSelect={setSelectedProject}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      <div className="max-w-full mx-auto space-y-6">
        {/* Header com Governança */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                MilApp - DevOps & Project Management
              </h1>
              <p className="text-muted-foreground">
                Gestão completa de projetos com metodologia DevOps, Scrum e Esteira de Inovação
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === "guide" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("guide")}
                  title="Guia da Esteira"
                >
                  <BookOpen className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "columns" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("columns")}
                  title="Colunas por Status"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "kanban" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("kanban")}
                  title="Kanban Board"
                >
                  <Kanban className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  title="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "workitems" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("workitems")}
                  title="Work Items"
                >
                  <Target className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "sprints" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("sprints")}
                  title="Sprints"
                >
                  <Users className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "scrum" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("scrum")}
                  title="Scrum Board"
                >
                  <TrendingUp className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "pipelines" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("pipelines")}
                  title="Pipelines"
                >
                  <GitBranch className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "devops" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("devops")}
                  title="DevOps Overview"
                >
                  <Activity className="h-4 w-4" />
                </Button>
              </div>
              
              <Button 
                className="bg-gradient-primary"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Ideia
              </Button>

              <Button 
                variant="outline"
                onClick={() => navigate('/projeto-detalhado')}
              >
                <Target className="h-4 w-4 mr-2" />
                Ver Projeto Exemplo
              </Button>
            </div>
          </div>

          {/* Barra de Busca e Controles */}
          <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Badge variant="outline" className="text-sm">
              {filteredProjects.length} de {projects.length} projetos
            </Badge>
          </div>

          {/* Filtros Expandidos */}
          {showFilters && (
            <ProjectFilters
              selectedFilters={selectedFilters}
              onFiltersChange={setSelectedFilters}
            />
          )}
        </div>

        {/* Indicadores de Governança - só mostrar nas views de overview */}
        {(viewMode === "kanban" || viewMode === "grid" || viewMode === "columns") && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Captação de Ideias</p>
                    <p className="text-2xl font-bold">{statusCounts.ideacao}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-rpa">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-rpa/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-rpa" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priorização</p>
                    <p className="text-2xl font-bold">{statusCounts.planejamento}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-accent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Em Desenvolvimento</p>
                    <p className="text-2xl font-bold">{statusCounts.desenvolvimento}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-destructive">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Finalizadas</p>
                    <p className="text-2xl font-bold">{statusCounts.producao + statusCounts.concluido}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Conteúdo Principal */}
        {renderContent()}

        {/* Dialog de Criação */}
        <CreateProjectDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreateProject={createProject}
        />
      </div>
    </div>
  );
};

export default Projetos;
