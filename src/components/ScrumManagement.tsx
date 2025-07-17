import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, 
  Users, 
  Clock, 
  TrendingUp,
  Plus,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Zap
} from "lucide-react";
import { Project } from "@/hooks/useProjects";
import { Sprint, UserStory, Epic, ScrumEvent } from "@/types/scrum";

interface ScrumManagementProps {
  project: Project;
}

const ScrumManagement = ({ project }: ScrumManagementProps) => {
  const [activeTab, setActiveTab] = useState("current-sprint");

  // Mock data para demonstração
  const [currentSprint] = useState<Sprint>({
    id: "sprint-1",
    name: "Sprint 1 - Implementação Base",
    goal: "Implementar funcionalidades básicas do sistema de agendamento",
    startDate: "2024-01-15",
    endDate: "2024-01-29",
    status: "active",
    capacity: 80,
    commitment: 65,
    completed: 42,
    velocity: 58,
    projectId: project.id
  });

  const [productBacklog] = useState<UserStory[]>([
    {
      id: "US-001",
      title: "Como usuário, quero agendar uma sala",
      description: "Implementar funcionalidade de agendamento de salas",
      acceptanceCriteria: [
        "Usuário pode selecionar data e horário",
        "Sistema valida disponibilidade",
        "Confirmação é enviada por email"
      ],
      storyPoints: 8,
      priority: "high",
      status: "in-progress",
      assignee: "dev-team",
      sprintId: "sprint-1",
      projectId: project.id
    },
    {
      id: "US-002",
      title: "Como admin, quero visualizar relatórios",
      description: "Dashboard com relatórios de uso das salas",
      acceptanceCriteria: [
        "Relatório de ocupação por período",
        "Gráficos de utilização",
        "Exportação em PDF"
      ],
      storyPoints: 13,
      priority: "medium",
      status: "backlog",
      projectId: project.id
    },
    {
      id: "US-003",
      title: "Como usuário, quero receber notificações",
      description: "Sistema de notificações para lembretes",
      acceptanceCriteria: [
        "Notificação 24h antes",
        "Notificação 1h antes",
        "Cancelamento de agendamento"
      ],
      storyPoints: 5,
      priority: "medium",
      status: "todo",
      sprintId: "sprint-1",
      projectId: project.id
    }
  ]);

  const [epics] = useState<Epic[]>([
    {
      id: "EPIC-001",
      title: "Sistema de Agendamento Core",
      description: "Funcionalidades básicas de agendamento de salas",
      businessValue: 100,
      status: "in-progress",
      projectId: project.id,
      userStories: productBacklog.filter(story => ["US-001", "US-003"].includes(story.id))
    },
    {
      id: "EPIC-002",
      title: "Analytics e Relatórios",
      description: "Sistema de relatórios e análises de uso",
      businessValue: 75,
      status: "draft",
      projectId: project.id,
      userStories: productBacklog.filter(story => story.id === "US-002")
    }
  ]);

  const [scrumEvents] = useState<ScrumEvent[]>([
    {
      id: "event-1",
      type: "sprint-planning",
      date: "2024-01-15T09:00:00Z",
      duration: 4,
      participants: ["product-owner", "scrum-master", "dev-team"],
      notes: "Planejamento bem sucedido, commitments definidos",
      sprintId: "sprint-1"
    },
    {
      id: "event-2",
      type: "daily-standup",
      date: "2024-01-16T09:00:00Z",
      duration: 0.25,
      participants: ["scrum-master", "dev-team"],
      sprintId: "sprint-1"
    }
  ]);

  const getSprintProgress = () => {
    return Math.round((currentSprint.completed / currentSprint.commitment) * 100);
  };

  const getDaysRemaining = () => {
    const end = new Date(currentSprint.endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      backlog: "bg-gray-100 text-gray-800",
      todo: "bg-blue-100 text-blue-800",
      "in-progress": "bg-yellow-100 text-yellow-800",
      review: "bg-orange-100 text-orange-800",
      done: "bg-green-100 text-green-800"
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      critical: "text-red-600 border-red-600",
      high: "text-orange-600 border-orange-600",
      medium: "text-yellow-600 border-yellow-600",
      low: "text-green-600 border-green-600"
    };
    return colors[priority as keyof typeof colors] || "text-gray-600 border-gray-600";
  };

  return (
    <div className="space-y-6">
      {/* Header Scrum */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gestão Scrum</h3>
          <p className="text-sm text-muted-foreground">
            Metodologia ágil para desenvolvimento do projeto
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Eventos
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Sprint
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="current-sprint">Sprint Atual</TabsTrigger>
          <TabsTrigger value="backlog">Product Backlog</TabsTrigger>
          <TabsTrigger value="epics">Épicos</TabsTrigger>
          <TabsTrigger value="events">Eventos Scrum</TabsTrigger>
        </TabsList>

        <TabsContent value="current-sprint" className="space-y-6">
          {/* Sprint Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {currentSprint.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentSprint.goal}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(currentSprint.startDate).toLocaleDateString('pt-BR')} - {new Date(currentSprint.endDate).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {getDaysRemaining()} dias restantes
                    </div>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Sprint Ativo</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso do Sprint</span>
                    <span className="font-medium">{getSprintProgress()}%</span>
                  </div>
                  <Progress value={getSprintProgress()} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {currentSprint.completed} de {currentSprint.commitment} story points
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Velocity</span>
                  </div>
                  <p className="text-2xl font-bold">{currentSprint.velocity}</p>
                  <p className="text-xs text-muted-foreground">pontos por sprint</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Capacity</span>
                  </div>
                  <p className="text-2xl font-bold">{currentSprint.capacity}h</p>
                  <p className="text-xs text-muted-foreground">horas da equipe</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Commitment</span>
                  </div>
                  <p className="text-2xl font-bold">{currentSprint.commitment}</p>
                  <p className="text-xs text-muted-foreground">story points</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sprint Backlog */}
          <Card>
            <CardHeader>
              <CardTitle>Sprint Backlog</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {productBacklog
                  .filter(story => story.sprintId === currentSprint.id)
                  .map((story) => (
                    <div key={story.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {story.id}
                            </Badge>
                            <Badge className={getStatusColor(story.status)}>
                              {story.status}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={getPriorityColor(story.priority)}
                            >
                              {story.priority}
                            </Badge>
                          </div>
                          
                          <h4 className="font-medium mb-2">{story.title}</h4>
                          <p className="text-sm text-muted-foreground mb-3">{story.description}</p>
                          
                          <div className="space-y-1">
                            <p className="text-sm font-medium">Critérios de Aceitação:</p>
                            {story.acceptanceCriteria.map((criteria, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3 mt-1 text-green-600" />
                                {criteria}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline" className="text-xs">
                            {story.storyPoints} SP
                          </Badge>
                          {story.assignee && (
                            <p className="text-xs text-muted-foreground">
                              {story.assignee}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backlog" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Product Backlog</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova User Story
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {productBacklog
                  .sort((a, b) => {
                    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                    return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder];
                  })
                  .map((story) => (
                    <div key={story.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {story.id}
                            </Badge>
                            <Badge className={getStatusColor(story.status)}>
                              {story.status}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={getPriorityColor(story.priority)}
                            >
                              {story.priority}
                            </Badge>
                            {story.sprintId && (
                              <Badge variant="secondary" className="text-xs">
                                Sprint Atual
                              </Badge>
                            )}
                          </div>
                          
                          <h4 className="font-medium mb-2">{story.title}</h4>
                          <p className="text-sm text-muted-foreground">{story.description}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-xs">
                            {story.storyPoints} SP
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="epics" className="space-y-4">
          {epics.map((epic) => (
            <Card key={epic.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      {epic.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{epic.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Valor: {epic.businessValue}
                    </Badge>
                    <Badge className={getStatusColor(epic.status)}>
                      {epic.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">User Stories ({epic.userStories.length})</h4>
                    <div className="text-sm text-muted-foreground">
                      {epic.userStories.reduce((sum, story) => sum + story.storyPoints, 0)} story points
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    {epic.userStories.map((story) => (
                      <div key={story.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {story.id}
                          </Badge>
                          <span>{story.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(story.status)}>
                            {story.status}
                          </Badge>
                          <span className="text-muted-foreground">{story.storyPoints} SP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Eventos Scrum</CardTitle>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Evento
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scrumEvents.map((event) => (
                  <div key={event.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            {event.type.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                          <Badge variant="secondary">
                            {event.duration}h
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(event.date).toLocaleDateString('pt-BR')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(event.date).toLocaleTimeString('pt-BR')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {event.participants.length} participantes
                          </div>
                        </div>
                        
                        {event.notes && (
                          <p className="text-sm mt-2 text-muted-foreground">{event.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScrumManagement;
