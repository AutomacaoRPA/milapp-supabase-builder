import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  MessageSquare, 
  AlertTriangle, 
  Users, 
  Flag, 
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  Activity
} from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useComments } from "@/hooks/useComments";
import CommentSystem from "./CommentSystem";
import ProjectRiskManagement from "./ProjectRiskManagement";
import ProjectStakeholderManagement from "./ProjectStakeholderManagement";
import ProjectMilestoneTracker from "./ProjectMilestoneTracker";
import ProjectDocumentManagement from "./ProjectDocumentManagement";
import { Project, ProjectMetrics } from "@/types/project-lifecycle";

interface ProjectLifecycleManagerProps {
  projectId: string;
}

const ProjectLifecycleManager: React.FC<ProjectLifecycleManagerProps> = ({ projectId }) => {
  const { 
    projects, 
    loading: projectsLoading, 
    error: projectsError,
    getProjectById,
    updateProject 
  } = useProjects();
  
  const {
    comments,
    loading: commentsLoading,
    addComment,
    editComment,
    deleteComment
  } = useComments(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (projectId) {
      const currentProject = getProjectById(projectId);
      setProject(currentProject || null);
      
      // TODO: Carregar métricas do projeto
      // Mock metrics para demonstração
      setMetrics({
        id: projectId,
        project_id: projectId,
        completion_percentage: 65,
        tasks_completed: 23,
        tasks_total: 35,
        sprints_completed: 3,
        sprints_total: 5,
        risks_count: 4,
        stakeholders_count: 8,
        documents_count: 12,
        comments_count: comments.length,
        velocity: 8.5,
        burndown_data: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }, [projectId, projects, comments.length, getProjectById]);

  if (projectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (projectsError || !project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
          <p className="text-red-600">Erro ao carregar projeto</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-gray-100 text-gray-800";
      case "on_hold": return "bg-yellow-100 text-yellow-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4" />;
      case "in_progress": return <Activity className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "on_hold": return <AlertTriangle className="h-4 w-4" />;
      case "cancelled": return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{project.title}</CardTitle>
              <p className="text-muted-foreground mt-1">{project.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(project.status)}>
                {getStatusIcon(project.status)}
                <span className="ml-1">
                  {project.status === "completed" ? "Concluído" :
                   project.status === "in_progress" ? "Em Progresso" :
                   project.status === "pending" ? "Pendente" :
                   project.status === "on_hold" ? "Em Espera" : "Cancelado"}
                </span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {metrics?.completion_percentage || 0}%
              </p>
              <p className="text-sm text-muted-foreground">Conclusão</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {metrics?.tasks_completed || 0}/{metrics?.tasks_total || 0}
              </p>
              <p className="text-sm text-muted-foreground">Tarefas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {metrics?.sprints_completed || 0}/{metrics?.sprints_total || 0}
              </p>
              <p className="text-sm text-muted-foreground">Sprints</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {metrics?.velocity || 0}
              </p>
              <p className="text-sm text-muted-foreground">Velocidade</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Tarefas
          </TabsTrigger>
          <TabsTrigger value="sprints" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Sprints
          </TabsTrigger>
          <TabsTrigger value="risks" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Riscos
          </TabsTrigger>
          <TabsTrigger value="stakeholders" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Stakeholders
          </TabsTrigger>
          <TabsTrigger value="milestones" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Marcos
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Início</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(project.start_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Fim Previsto</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(project.end_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Gerente</p>
                  <p className="text-sm text-muted-foreground">{project.manager}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Orçamento</p>
                  <p className="text-sm text-muted-foreground">
                    R$ {project.budget?.toLocaleString('pt-BR') || 'Não definido'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Riscos Identificados</span>
                    <Badge variant="outline">{metrics?.risks_count || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Stakeholders</span>
                    <Badge variant="outline">{metrics?.stakeholders_count || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Documentos</span>
                    <Badge variant="outline">{metrics?.documents_count || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Comentários</span>
                    <Badge variant="outline">{metrics?.comments_count || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comentários e Atualizações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CommentSystem
                comments={comments}
                onAddComment={addComment}
                onEditComment={editComment}
                onDeleteComment={deleteComment}
                currentUser="Usuário Atual"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Tarefas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-muted-foreground">Componente de Tarefas em desenvolvimento</p>
                <p className="text-sm text-muted-foreground">
                  Integração com sistema de tarefas será implementada em breve
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sprints Tab */}
        <TabsContent value="sprints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Sprints</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-muted-foreground">Componente de Sprints em desenvolvimento</p>
                <p className="text-sm text-muted-foreground">
                  Integração com sistema de sprints será implementada em breve
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks" className="space-y-4">
          <ProjectRiskManagement projectId={projectId} />
        </TabsContent>

        {/* Stakeholders Tab */}
        <TabsContent value="stakeholders" className="space-y-4">
          <ProjectStakeholderManagement projectId={projectId} />
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
          <ProjectMilestoneTracker projectId={projectId} />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <ProjectDocumentManagement projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectLifecycleManager; 