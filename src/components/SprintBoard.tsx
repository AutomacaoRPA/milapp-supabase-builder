
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
  RotateCcw
} from "lucide-react";
import { Project } from "@/hooks/useProjects";

interface Sprint {
  id: string;
  name: string;
  state: "planned" | "active" | "completed";
  startDate: string;
  endDate: string;
  capacity: number;
  commitment: number;
  completed: number;
  workItems: number;
}

interface SprintBoardProps {
  project: Project;
}

const SprintBoard = ({ project }: SprintBoardProps) => {
  const [activeSprint] = useState<Sprint>({
    id: "sprint-1",
    name: "Sprint 1 - Autenticação",
    state: "active",
    startDate: "2024-01-15",
    endDate: "2024-01-29",
    capacity: 80,
    commitment: 65,
    completed: 32,
    workItems: 12
  });

  const [pastSprints] = useState<Sprint[]>([
    {
      id: "sprint-0",
      name: "Sprint 0 - Setup",
      state: "completed",
      startDate: "2024-01-01",
      endDate: "2024-01-14",
      capacity: 60,
      commitment: 58,
      completed: 58,
      workItems: 8
    }
  ]);

  const getSprintProgress = (sprint: Sprint) => {
    return (sprint.completed / sprint.commitment) * 100;
  };

  const getCapacityUtilization = (sprint: Sprint) => {
    return (sprint.commitment / sprint.capacity) * 100;
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Sprints - {project.name}</h2>
          <p className="text-muted-foreground">Gestão ágil com metodologia Scrum</p>
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

      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Sprint Atual</TabsTrigger>
          <TabsTrigger value="backlog">Backlog</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          {/* Active Sprint Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {activeSprint.name}
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(activeSprint.startDate).toLocaleDateString('pt-BR')} - {new Date(activeSprint.endDate).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {getDaysRemaining(activeSprint.endDate)} dias restantes
                    </div>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Ativo</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sprint Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso do Sprint</span>
                    <span className="font-medium">{Math.round(getSprintProgress(activeSprint))}%</span>
                  </div>
                  <Progress value={getSprintProgress(activeSprint)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {activeSprint.completed} de {activeSprint.commitment} pontos
                  </p>
                </div>

                {/* Capacity */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Capacidade</span>
                    <span className="font-medium">{Math.round(getCapacityUtilization(activeSprint))}%</span>
                  </div>
                  <Progress value={getCapacityUtilization(activeSprint)} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {activeSprint.commitment} de {activeSprint.capacity} horas
                  </p>
                </div>

                {/* Work Items */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Work Items</span>
                  </div>
                  <p className="text-2xl font-bold">{activeSprint.workItems}</p>
                  <p className="text-xs text-muted-foreground">itens no sprint</p>
                </div>

                {/* Velocity */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Velocity</span>
                  </div>
                  <p className="text-2xl font-bold">58</p>
                  <p className="text-xs text-muted-foreground">pontos por sprint</p>
                </div>
              </div>
            </CardContent>
          </Card>

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
              <Target className="h-4 w-4 mr-2" />
              Finalizar Sprint
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="backlog">
          <Card>
            <CardHeader>
              <CardTitle>Product Backlog</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Lista priorizada de funcionalidades e requisitos</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {pastSprints.map((sprint) => (
            <Card key={sprint.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{sprint.name}</CardTitle>
                  <Badge variant="outline">Concluído</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Período</p>
                    <p>{new Date(sprint.startDate).toLocaleDateString('pt-BR')} - {new Date(sprint.endDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Commitment</p>
                    <p>{sprint.commitment} pontos</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Completed</p>
                    <p>{sprint.completed} pontos</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Work Items</p>
                    <p>{sprint.workItems} itens</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SprintBoard;
