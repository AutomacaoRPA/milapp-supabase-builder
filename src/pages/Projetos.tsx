import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  MoreVertical, 
  Plus, 
  Calendar, 
  Users, 
  Target, 
  Clock,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

const Projetos = () => {
  const [selectedBoard, setSelectedBoard] = useState("todos");

  const projects = [
    {
      id: 1,
      title: "Automação de Notas Fiscais",
      description: "Processamento automático de NF-e com validação e aprovação",
      status: "Em Desenvolvimento",
      priority: "Alta",
      progress: 65,
      startDate: "01/12/2024",
      endDate: "15/01/2025",
      team: ["JD", "MS", "AR"],
      tasks: { total: 12, completed: 8 },
      roi: "R$ 50k/mês",
      complexity: "Média"
    },
    {
      id: 2,
      title: "Conciliação Bancária Automática",
      description: "Reconciliação de extratos bancários com sistema financeiro",
      status: "Quality Gate G2",
      priority: "Alta",
      progress: 90,
      startDate: "15/11/2024",
      endDate: "10/01/2025",
      team: ["LF", "TC"],
      tasks: { total: 8, completed: 7 },
      roi: "R$ 30k/mês",
      complexity: "Alta"
    },
    {
      id: 3,
      title: "Relatórios de Vendas",
      description: "Geração automática de relatórios gerenciais de vendas",
      status: "Planejamento",
      priority: "Média",
      progress: 25,
      startDate: "05/01/2025",
      endDate: "20/02/2025",
      team: ["RB", "KL", "OP"],
      tasks: { total: 15, completed: 4 },
      roi: "R$ 25k/mês",
      complexity: "Baixa"
    },
    {
      id: 4,
      title: "Integração SAP-Salesforce",
      description: "Sincronização de dados entre SAP e Salesforce",
      status: "Aguardando Aprovação",
      priority: "Baixa",
      progress: 10,
      startDate: "10/01/2025",
      endDate: "30/03/2025",
      team: ["NM", "QW"],
      tasks: { total: 20, completed: 2 },
      roi: "R$ 75k/mês",
      complexity: "Alta"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Em Desenvolvimento": return "bg-primary text-primary-foreground";
      case "Quality Gate G2": return "bg-accent text-accent-foreground";
      case "Planejamento": return "bg-rpa text-rpa-foreground";
      case "Aguardando Aprovação": return "bg-muted text-muted-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta": return "text-destructive";
      case "Média": return "text-rpa";
      case "Baixa": return "text-accent";
      default: return "text-muted-foreground";
    }
  };

  const boards = [
    { id: "todos", label: "Todos Projetos", count: projects.length },
    { id: "desenvolvimento", label: "Em Desenvolvimento", count: 1 },
    { id: "qualitygate", label: "Quality Gates", count: 1 },
    { id: "planejamento", label: "Planejamento", count: 1 },
    { id: "aprovacao", label: "Aguardando", count: 1 }
  ];

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
              Gestão ágil de projetos de automação
            </p>
          </div>
          <Button className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Novo Projeto
          </Button>
        </div>

        {/* Filtros/Boards */}
        <div className="flex gap-2 flex-wrap">
          {boards.map((board) => (
            <Button
              key={board.id}
              variant={selectedBoard === board.id ? "default" : "outline"}
              onClick={() => setSelectedBoard(board.id)}
              className="gap-2"
            >
              {board.label}
              <Badge variant="secondary" className="text-xs">
                {board.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Grid de Projetos */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <Card key={project.id} className="transition-all hover:shadow-primary animate-slide-up" 
                  style={{ animationDelay: `${index * 100}ms` }}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="line-clamp-2">
                  {project.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} />
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-accent" />
                    <span>{project.tasks.completed}/{project.tasks.total} tarefas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-rpa" />
                    <span>{project.roi}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{project.endDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${getPriorityColor(project.priority)}`} />
                    <span className={getPriorityColor(project.priority)}>
                      {project.priority}
                    </span>
                  </div>
                </div>

                {/* Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Equipe</span>
                  </div>
                  <div className="flex -space-x-2">
                    {project.team.map((member, idx) => (
                      <Avatar key={idx} className="h-6 w-6 border-2 border-background">
                        <AvatarFallback className="text-xs">{member}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>

                {/* Complexidade */}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Complexidade</span>
                  <Badge variant="outline">{project.complexity}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
                  <p className="text-xl font-bold">{projects.length}</p>
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
                  <p className="text-sm text-muted-foreground">Em Andamento</p>
                  <p className="text-xl font-bold">2</p>
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
                  <p className="text-sm text-muted-foreground">ROI Esperado</p>
                  <p className="text-xl font-bold">R$ 180k</p>
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
                  <p className="text-xl font-bold">2</p>
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