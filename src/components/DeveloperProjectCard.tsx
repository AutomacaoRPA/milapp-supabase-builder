import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  MessageSquare, 
  GitBranch, 
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  Stop,
  Plus,
  Upload,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  TrendingUp,
  Target,
  Zap,
  BarChart3,
  Activity
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'testing' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to: string;
  story_points: number;
  estimated_hours: number;
  actual_hours: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  attachments: Attachment[];
  comments: Comment[];
  time_logs: TimeLog[];
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploaded_by: string;
  uploaded_at: string;
}

interface Comment {
  id: string;
  content: string;
  author: string;
  created_at: string;
  type: 'comment' | 'update' | 'blocker' | 'solution';
}

interface TimeLog {
  id: string;
  user_id: string;
  task_id: string;
  start_time: string;
  end_time: string;
  duration: number; // em minutos
  description: string;
  activity_type: 'development' | 'testing' | 'review' | 'meeting' | 'research';
}

interface Sprint {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  capacity: number;
  velocity: number;
  burndown_data: BurndownPoint[];
}

interface BurndownPoint {
  date: string;
  remaining_points: number;
  ideal_points: number;
}

interface DeveloperProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string;
    status: string;
    priority: string;
    methodology: string;
    created_by: string;
    created_at: string;
    start_date: string;
    end_date: string;
    estimated_effort: number;
    actual_effort: number;
    budget: number;
    roi_target: number;
    team_members: TeamMember[];
    current_sprint?: Sprint;
    quality_gates: QualityGate[];
  };
  onUpdateProject?: (updates: any) => void;
  onAddTask?: (task: Partial<Task>) => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onLogTime?: (taskId: string, timeLog: Partial<TimeLog>) => void;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  availability: number; // porcentagem
  current_tasks: number;
  capacity: number;
}

interface QualityGate {
  id: string;
  type: 'G1' | 'G2' | 'G3' | 'G4';
  name: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected';
  criteria: string[];
  approvers: string[];
  due_date: string;
}

const DeveloperProjectCard: React.FC<DeveloperProjectCardProps> = ({
  project,
  onUpdateProject,
  onAddTask,
  onUpdateTask,
  onLogTime
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isLoggingTime, setIsLoggingTime] = useState<string | null>(null);

  // Dados mockados para demonstração
  const tasks: Task[] = [
    {
      id: "1",
      title: "Configurar ambiente de desenvolvimento",
      description: "Instalar e configurar todas as ferramentas necessárias",
      status: "done",
      priority: "high",
      assigned_to: "João Silva",
      story_points: 3,
      estimated_hours: 8,
      actual_hours: 6,
      start_date: "2024-01-15",
      end_date: "2024-01-17",
      created_at: "2024-01-10",
      updated_at: "2024-01-17",
      attachments: [],
      comments: [],
      time_logs: []
    },
    {
      id: "2",
      title: "Implementar autenticação OAuth",
      description: "Integrar autenticação com Azure AD",
      status: "in_progress",
      priority: "critical",
      assigned_to: "Maria Santos",
      story_points: 5,
      estimated_hours: 16,
      actual_hours: 12,
      start_date: "2024-01-18",
      end_date: "2024-01-25",
      created_at: "2024-01-12",
      updated_at: "2024-01-20",
      attachments: [],
      comments: [],
      time_logs: []
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'testing': return 'bg-yellow-100 text-yellow-800';
      case 'todo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = () => {
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    return (completedTasks / tasks.length) * 100;
  };

  const calculateVelocity = () => {
    const completedTasks = tasks.filter(task => task.status === 'done');
    const totalPoints = completedTasks.reduce((sum, task) => sum + task.story_points, 0);
    return totalPoints;
  };

  const calculateBurndown = () => {
    // Simulação de dados de burndown
    return [
      { date: '2024-01-15', remaining_points: 20, ideal_points: 20 },
      { date: '2024-01-16', remaining_points: 18, ideal_points: 18 },
      { date: '2024-01-17', remaining_points: 15, ideal_points: 16 },
      { date: '2024-01-18', remaining_points: 12, ideal_points: 14 },
      { date: '2024-01-19', remaining_points: 8, ideal_points: 12 },
      { date: '2024-01-20', remaining_points: 5, ideal_points: 10 }
    ];
  };

  return (
    <div className="space-y-6">
      {/* Header do Projeto */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <Badge variant="outline" className={getPriorityColor(project.priority)}>
                  {project.priority.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {project.methodology}
                </Badge>
              </div>
              <p className="text-muted-foreground">{project.description}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Projeto
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Relatório
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Arquivar Projeto
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Início</p>
                <p className="font-medium">{new Date(project.start_date).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Fim</p>
                <p className="font-medium">{new Date(project.end_date).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Esforço</p>
                <p className="font-medium">{project.actual_effort}/{project.estimated_effort}h</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">ROI Alvo</p>
                <p className="font-medium">{project.roi_target}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="sprint">Sprint</TabsTrigger>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="quality">Quality Gates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Progresso Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completado</span>
                    <span>{calculateProgress().toFixed(1)}%</span>
                  </div>
                  <Progress value={calculateProgress()} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Velocity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{calculateVelocity()}</div>
                <p className="text-xs text-muted-foreground">Story Points Completados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tasks Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tasks.filter(t => t.status === 'in_progress').length}
                </div>
                <p className="text-xs text-muted-foreground">Em Desenvolvimento</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Burndown Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Gráfico de Burndown</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tasks */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Tasks do Projeto</h3>
            <Button onClick={() => setIsAddingTask(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Task
            </Button>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{task.title}</h4>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>👤 {task.assigned_to}</span>
                        <span>📊 {task.story_points} SP</span>
                        <span>⏱️ {task.actual_hours}/{task.estimated_hours}h</span>
                        <span>📅 {new Date(task.start_date).toLocaleDateString('pt-BR')}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Progress 
                          value={(task.actual_hours / task.estimated_hours) * 100} 
                          className="h-2 flex-1" 
                        />
                        <span className="text-xs text-muted-foreground">
                          {((task.actual_hours / task.estimated_hours) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsLoggingTime(task.id)}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Log Time
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Upload className="h-4 w-4 mr-2" />
                            Anexar Arquivo
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Comentar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Sprint */}
        <TabsContent value="sprint" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sprint Atual</CardTitle>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  Ativo
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Sprint</p>
                  <p className="font-medium">Sprint 1 - Configuração Inicial</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Período</p>
                  <p className="font-medium">15/01 - 29/01/2024</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-medium">80h / 80h</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Burndown</span>
                    <span>5/20 SP restantes</span>
                  </div>
                  <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Burndown Chart</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Velocity</p>
                    <p className="text-2xl font-bold">15 SP</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Eficiência</p>
                    <p className="text-2xl font-bold">75%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Equipe */}
        <TabsContent value="team" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.team_members.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar>
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Disponibilidade</span>
                      <span>{member.availability}%</span>
                    </div>
                    <Progress value={member.availability} className="h-2" />
                    
                    <div className="flex justify-between text-sm">
                      <span>Tasks Ativas</span>
                      <span>{member.current_tasks}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Capacity</span>
                      <span>{member.capacity}h/semana</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Quality Gates */}
        <TabsContent value="quality" className="space-y-4">
          <div className="space-y-3">
            {project.quality_gates.map((gate) => (
              <Card key={gate.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        gate.status === 'approved' ? 'bg-green-100' :
                        gate.status === 'rejected' ? 'bg-red-100' :
                        gate.status === 'in_progress' ? 'bg-yellow-100' : 'bg-gray-100'
                      }`}>
                        {gate.status === 'approved' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : gate.status === 'rejected' ? (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{gate.type} - {gate.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {gate.status === 'pending' ? 'Pendente' :
                           gate.status === 'in_progress' ? 'Em Análise' :
                           gate.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Prazo</p>
                      <p className="font-medium">{new Date(gate.due_date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Lead Time</span>
                    <span className="font-medium">5.2 dias</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cycle Time</span>
                    <span className="font-medium">3.1 dias</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Throughput</span>
                    <span className="font-medium">12 tasks/semana</span>
                  </div>
                  <div className="flex justify-between">
                    <span>WIP</span>
                    <span className="font-medium">8 tasks</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Esforço</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Desenvolvimento</span>
                    <span className="font-medium">60%</span>
                  </div>
                  <Progress value={60} className="h-2" />
                  
                  <div className="flex justify-between">
                    <span>Testes</span>
                    <span className="font-medium">25%</span>
                  </div>
                  <Progress value={25} className="h-2" />
                  
                  <div className="flex justify-between">
                    <span>Reuniões</span>
                    <span className="font-medium">15%</span>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Velocity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Gráfico de Velocity</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeveloperProjectCard; 