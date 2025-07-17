import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, LayoutGrid, Kanban, Target, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import ProjectKanban from "@/components/ProjectKanban";
import { Skeleton } from "@/components/ui/skeleton";

const Projetos = () => {
  const [viewMode, setViewMode] = useState<"kanban" | "grid">("kanban");
  const { projects, loading } = useProjects();

  const statusCounts = {
    total: projects.length,
    desenvolvimento: projects.filter(p => p.status === "desenvolvimento").length,
    homologacao: projects.filter(p => p.status === "homologacao").length,
    planejamento: projects.filter(p => p.status === "planejamento").length,
    ideacao: projects.filter(p => p.status === "ideacao").length,
  };

  const totalEstimatedROI = projects.reduce((sum, project) => 
    sum + (project.estimated_roi || 0), 0
  );

  const highPriorityProjects = projects.filter(p => (p.priority || 0) >= 4).length;

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Projetos RPA
            </h1>
            <p className="text-muted-foreground">
              Gestão ágil de projetos de automação - Metodologia Kanban
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === "kanban" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
              >
                <Kanban className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <Button className="bg-gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Novo Projeto
            </Button>
          </div>
        </div>

        {/* Conteúdo Principal */}
        {loading ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        ) : viewMode === "kanban" ? (
          <ProjectKanban projects={projects} />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Vista em Grid será implementada em breve</p>
          </div>
        )}

        {/* Estatísticas Rápidas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Projetos</p>
                  <p className="text-xl font-bold">{statusCounts.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Em Desenvolvimento</p>
                  <p className="text-xl font-bold">{statusCounts.desenvolvimento}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-rpa/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-rpa" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ROI Estimado</p>
                  <p className="text-xl font-bold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      minimumFractionDigits: 0,
                    }).format(totalEstimatedROI)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Alta Prioridade</p>
                  <p className="text-xl font-bold">{highPriorityProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Projetos;