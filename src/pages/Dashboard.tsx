import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Bot, CheckCircle, Clock, TrendingUp, Users, Zap } from "lucide-react";

const Dashboard = () => {
  const metrics = [
    { title: "Automações Ativas", value: "24", change: "+12%", icon: Bot, color: "text-primary" },
    { title: "Processos em Execução", value: "8", change: "+3", icon: Activity, color: "text-accent" },
    { title: "Taxa de Sucesso", value: "94.5%", change: "+2.1%", icon: CheckCircle, color: "text-accent" },
    { title: "Economia Mensal", value: "R$ 180k", change: "+18%", icon: TrendingUp, color: "text-rpa" }
  ];

  const recentAutomations = [
    { name: "Processamento de Notas Fiscais", status: "Executando", progress: 75, eta: "2h" },
    { name: "Conciliação Bancária", status: "Concluído", progress: 100, eta: "-" },
    { name: "Relatório de Vendas", status: "Aguardando", progress: 0, eta: "Pendente" },
    { name: "Backup de Dados", status: "Executando", progress: 45, eta: "1h 20m" }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Executando": return "bg-primary text-primary-foreground";
      case "Concluído": return "bg-accent text-accent-foreground";
      case "Aguardando": return "bg-muted text-muted-foreground";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            MILAPP Dashboard
          </h1>
          <p className="text-muted-foreground">
            Centro de Excelência em Automação RPA - MedSênior
          </p>
        </div>

        {/* Métricas Principais */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index} className="transition-all hover:shadow-primary animate-slide-up" 
                    style={{ animationDelay: `${index * 100}ms` }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className="text-xs text-accent">
                    {metric.change} desde o último mês
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Grid Principal */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Automações Recentes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Automações Recentes
              </CardTitle>
              <CardDescription>
                Status atual dos processos RPA em execução
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentAutomations.map((automation, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{automation.name}</h4>
                      <Badge className={getStatusColor(automation.status)}>
                        {automation.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <Progress value={automation.progress} className="flex-1" />
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {automation.eta}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quality Gates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                Quality Gates
              </CardTitle>
              <CardDescription>
                Governança e conformidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {["G1 - Requisitos", "G2 - Design", "G3 - Desenvolvimento", "G4 - Deployment"].map((gate, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{gate}</span>
                  <Badge variant={index < 2 ? "default" : "secondary"}>
                    {index < 2 ? "Aprovado" : "Pendente"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Insights IA */}
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Insights de IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm opacity-90">
              🎯 Oportunidade identificada: O processo de "Reconciliação de Cartões" 
              pode ser automatizado, economizando ~40h/mês. 
              <br />
              💡 Recomendação: Iniciar levantamento de requisitos via Chat IA.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;