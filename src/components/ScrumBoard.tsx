
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  Target, 
  TrendingUp, 
  Users,
  Play,
  Pause,
  RotateCcw,
  Plus,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { Project } from "@/hooks/useProjects";
import ProductBacklog from "./ProductBacklog";
import SprintPlanning from "./SprintPlanning";
import DailyScrum from "./DailyScrum";
import SprintReview from "./SprintReview";
import SprintRetrospective from "./SprintRetrospective";

interface Sprint {
  id: string;
  name: string;
  state: "planned" | "active" | "completed";
  startDate: string;
  endDate: string;
  capacity: number;
  commitment: number;
  completed: number;
  velocity: number;
  workItems: WorkItem[];
}

interface WorkItem {
  id: string;
  title: string;
  type: "user-story" | "task" | "bug";
  storyPoints: number;
  status: "todo" | "doing" | "done";
  assignee?: string;
  priority: "high" | "medium" | "low";
}

interface ScrumBoardProps {
  project: Project;
}

const ScrumBoard = ({ project }: ScrumBoardProps) => {
  const [activeTab, setActiveTab] = useState("current-sprint");
  
  const [currentSprint] = useState<Sprint>({
    id: "sprint-1",
    name: "Sprint 1 - MVP Features",
    state: "active",
    startDate: "2024-01-15",
    endDate: "2024-01-29",
    capacity: 80,
    commitment: 65,
    completed: 32,
    velocity: 58,
    workItems: [
      {
        id: "US-001",
        title: "Como usuário, quero fazer login para acessar o sistema",
        type: "user-story",
        storyPoints: 8,
        status: "doing",
        assignee: "João Silva",
        priority: "high"
      },
      {
        id: "T-002",
        title: "Configurar pipeline de CI/CD",
        type: "task",
        storyPoints: 5,
        status: "done",
        assignee: "Maria Santos",
        priority: "medium"
      },
      {
        id: "BUG-003",
        title: "Corrigir erro de validação no formulário",
        type: "bug",
        storyPoints: 3,
        status: "todo",
        priority: "high"
      }
    ]
  });

  const getSprintProgress = (sprint: Sprint) => {
    return (sprint.completed / sprint.commitment) * 100;
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getBurndownData = () => {
    return [
      { day: 1, ideal: 65, actual: 65 },
      { day: 2, ideal: 58, actual: 60 },
      { day: 3, ideal: 51, actual: 55 },
      { day: 4, ideal: 44, actual: 50 },
      { day: 5, ideal: 37, actual: 42 },
      { day: 6, ideal: 30, actual: 38 },
      { day: 7, ideal: 23, actual: 32 },
      { day: 8, ideal: 16, actual: 32 },
      { day: 9, ideal: 9, actual: 32 },
      { day: 10, ideal: 0, actual: 32 }
    ];
  };

  return (
    <div className="space-y-6">
      {/* Header Scrum */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scrum Board - {project.name}</h2>
          <p className="text-muted-foreground">Metodologia ágil para desenvolvimento</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RotateCcw className="h-4 w-4 mr-2" />
            Planejar Sprint
          </Button>
          <Button>
            <Play className="h-4 w-4 mr-2" />
            Iniciar Sprint
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="current-sprint">Sprint Atual</TabsTrigger>
          <TabsTrigger value="backlog">Product Backlog</TabsTrigger>
          <TabsTrigger value="planning">Sprint Planning</TabsTrigger>
          <TabsTrigger value="daily">Daily Scrum</TabsTrigger>
          <TabsTrigger value="review">Sprint Review</TabsTrigger>
          <TabsTrigger value="retrospective">Retrospectiva</TabsTrigger>
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
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(currentSprint.startDate).toLocaleDateString('pt-BR')} - {new Date(currentSprint.endDate).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {getDaysRemaining(currentSprint.endDate)} dias restantes
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
                    <span className="font-medium">{Math.round(getSprintProgress(currentSprint))}%</span>
                  </div>
                  <Progress value={getSprintProgress(currentSprint)} className="h-2" />
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
                    <span className="text-sm">Team Capacity</span>
                  </div>
                  <p className="text-2xl font-bold">{currentSprint.capacity}h</p>
                  <p className="text-xs text-muted-foreground">horas disponíveis</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Work Items</span>
                  </div>
                  <p className="text-2xl font-bold">{currentSprint.workItems.length}</p>
                  <p className="text-xs text-muted-foreground">itens no sprint</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scrum Board */}
          <div className="grid grid-cols-3 gap-6">
            {["todo", "doing", "done"].map((status) => (
              <div key={status} className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <h3 className="font-semibold capitalize">
                    {status === "todo" ? "To Do" : status === "doing" ? "Doing" : "Done"}
                  </h3>
                  <Badge variant="secondary">
                    {currentSprint.workItems.filter(item => item.status === status).length}
                  </Badge>
                </div>

                <div className="space-y-3 min-h-[400px]">
                  {currentSprint.workItems
                    .filter(item => item.status === status)
                    .map((item) => (
                      <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-sm">{item.id}</CardTitle>
                            <Badge 
                              variant={item.type === "bug" ? "destructive" : 
                                     item.type === "user-story" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {item.type}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm font-medium">{item.title}</p>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {item.storyPoints} SP
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                item.priority === "high" ? "text-red-600" :
                                item.priority === "medium" ? "text-yellow-600" : "text-green-600"
                              }`}
                            >
                              {item.priority}
                            </Badge>
                          </div>

                          {item.assignee && (
                            <p className="text-xs text-muted-foreground">
                              Assignee: {item.assignee}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Sprint Actions */}
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1">
              <Pause className="h-4 w-4 mr-2" />
              Pausar Sprint
            </Button>
            <Button variant="outline" className="flex-1">
              <Calendar className="h-4 w-4 mr-2" />
              Estender Sprint
            </Button>
            <Button className="flex-1">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Finalizar Sprint
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="backlog">
          <ProductBacklog project={project} />
        </TabsContent>

        <TabsContent value="planning">
          <SprintPlanning project={project} />
        </TabsContent>

        <TabsContent value="daily">
          <DailyScrum project={project} />
        </TabsContent>

        <TabsContent value="review">
          <SprintReview project={project} />
        </TabsContent>

        <TabsContent value="retrospective">
          <SprintRetrospective project={project} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScrumBoard;
