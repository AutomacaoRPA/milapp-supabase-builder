
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Users, AlertTriangle, CheckCircle2, Play } from "lucide-react";
import { Project } from "@/hooks/useProjects";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  yesterday: string;
  today: string;
  blockers: string;
  status: "available" | "blocked" | "focus";
}

interface DailyScrumProps {
  project: Project;
}

const DailyScrum = ({ project }: DailyScrumProps) => {
  const [currentSpeaker, setCurrentSpeaker] = useState(0);
  const [meetingStarted, setMeetingStarted] = useState(false);

  const teamMembers: TeamMember[] = [
    {
      id: "1",
      name: "João Silva",
      role: "Frontend Developer",
      avatar: "JS",
      yesterday: "Finalizei a implementação da tela de login e corrigi bugs de validação",
      today: "Vou trabalhar na tela de registro e configurar os testes unitários",
      blockers: "",
      status: "available"
    },
    {
      id: "2",
      name: "Maria Santos",
      role: "Backend Developer", 
      avatar: "MS",
      yesterday: "Configurei a API de autenticação e integrei com o banco de dados",
      today: "Vou implementar os endpoints de recuperação de senha",
      blockers: "Aguardando definição dos templates de email",
      status: "blocked"
    },
    {
      id: "3",
      name: "Pedro Costa",
      role: "DevOps Engineer",
      avatar: "PC",
      yesterday: "Configurei o pipeline de CI/CD e deploy automático",
      today: "Vou configurar monitoramento e alertas de performance",
      blockers: "",
      status: "available"
    },
    {
      id: "4",
      name: "Ana Lima",
      role: "QA Engineer",
      avatar: "AL",
      yesterday: "Criei casos de teste para o módulo de autenticação",
      today: "Vou executar testes de integração e reportar bugs encontrados",
      blockers: "",
      status: "focus"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-100 text-green-800";
      case "blocked": return "bg-red-100 text-red-800";
      case "focus": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available": return CheckCircle2;
      case "blocked": return AlertTriangle;
      case "focus": return Clock;
      default: return Clock;
    }
  };

  const nextSpeaker = () => {
    if (currentSpeaker < teamMembers.length - 1) {
      setCurrentSpeaker(currentSpeaker + 1);
    }
  };

  const startMeeting = () => {
    setMeetingStarted(true);
    setCurrentSpeaker(0);
  };

  return (
    <div className="space-y-6">
      {/* Daily Scrum Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Daily Scrum</h3>
          <p className="text-sm text-muted-foreground">
            Reunião diária da equipe - máximo 15 minutos
          </p>
        </div>
        {!meetingStarted ? (
          <Button onClick={startMeeting}>
            <Play className="h-4 w-4 mr-2" />
            Iniciar Daily
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Em andamento</span>
          </div>
        )}
      </div>

      {/* Sprint Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sprint Atual - Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">7</p>
              <p className="text-xs text-muted-foreground">Dias restantes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">32</p>
              <p className="text-xs text-muted-foreground">Pontos concluídos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">33</p>
              <p className="text-xs text-muted-foreground">Pontos restantes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">2</p>
              <p className="text-xs text-muted-foreground">Impedimentos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teamMembers.map((member, index) => {
          const StatusIcon = getStatusIcon(member.status);
          const isCurrentSpeaker = meetingStarted && currentSpeaker === index;
          
          return (
            <Card 
              key={member.id} 
              className={`transition-all ${
                isCurrentSpeaker ? "ring-2 ring-primary border-primary" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{member.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{member.name}</h4>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-4 w-4" />
                    <Badge className={getStatusColor(member.status)}>
                      {member.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium mb-1">🕐 Ontem eu...</h5>
                  <p className="text-sm text-muted-foreground">{member.yesterday}</p>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-1">📋 Hoje eu vou...</h5>
                  <p className="text-sm text-muted-foreground">{member.today}</p>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium mb-1">🚧 Impedimentos</h5>
                  {member.blockers ? (
                    <p className="text-sm text-red-600">{member.blockers}</p>
                  ) : (
                    <p className="text-sm text-green-600">Nenhum impedimento</p>
                  )}
                </div>
                
                {isCurrentSpeaker && (
                  <Button 
                    onClick={nextSpeaker}
                    className="w-full mt-4"
                    variant={currentSpeaker === teamMembers.length - 1 ? "default" : "outline"}
                  >
                    {currentSpeaker === teamMembers.length - 1 ? "Finalizar Daily" : "Próximo"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Action Items da Daily</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-1" />
              <div>
                <p className="text-sm font-medium">Definir templates de email</p>
                <p className="text-xs text-muted-foreground">
                  Responsável: Product Owner • Prazo: Hoje
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 text-blue-500 mt-1" />
              <div>
                <p className="text-sm font-medium">Revisão de código da tela de login</p>
                <p className="text-xs text-muted-foreground">
                  Responsável: Pedro Costa • Prazo: Amanhã
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <Textarea 
              placeholder="Adicionar novas action items..."
              className="min-h-[60px]"
            />
            <Button size="sm" className="mt-2">
              Adicionar Action Item
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyScrum;
