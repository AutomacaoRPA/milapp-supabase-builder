import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  FolderOpen, 
  CheckCircle, 
  Play, 
  ArrowRight,
  Bot,
  Target,
  TrendingUp,
  Users,
  Zap,
  Shield,
  BarChart3
} from "lucide-react";

const Index = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "Chat IA Multimodal",
      description: "Análise inteligente de documentos, imagens e áudios para descoberta de automações",
      link: "/chat",
      color: "text-primary"
    },
    {
      icon: FolderOpen,
      title: "Gestão de Projetos",
      description: "Kanban, Scrum e acompanhamento completo do ciclo de vida dos projetos RPA",
      link: "/projetos",
      color: "text-accent"
    },
    {
      icon: CheckCircle,
      title: "Quality Gates",
      description: "Governança e controle de qualidade com gates de aprovação automatizados",
      link: "/quality-gates",
      color: "text-rpa"
    },
    {
      icon: Play,
      title: "Deployments",
      description: "Pipeline DevOps para deploy e monitoramento contínuo das automações",
      link: "/deployments",
      color: "text-primary"
    }
  ];

  const metrics = [
    { label: "Automações Ativas", value: "24", icon: Bot },
    { label: "Economia Mensal", value: "R$ 180k", icon: TrendingUp },
    { label: "Taxa de Sucesso", value: "94.5%", icon: Target },
    { label: "Projetos Ativos", value: "12", icon: Users }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center space-y-6 mb-16">
          <Badge variant="outline" className="px-4 py-2 text-sm">
            <Zap className="h-4 w-4 mr-2" />
            Centro de Excelência em RPA
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            MILAPP
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Plataforma completa para descoberta, desenvolvimento e deploy de automações RPA com governança avançada
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90" asChild>
              <Link to="/projetos">
                <Target className="h-5 w-5 mr-2" />
                Explorar Projetos
              </Link>
            </Button>
            
            <Button size="lg" variant="outline" asChild>
              <Link to="/chat">
                <MessageSquare className="h-5 w-5 mr-2" />
                Iniciar Discovery IA
              </Link>
            </Button>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Card key={index} className="text-center hover:shadow-primary transition-all hover-scale">
                <CardContent className="p-6">
                  <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-2xl font-bold mb-2">{metric.value}</div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="group hover:shadow-primary transition-all duration-300 hover-scale">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className={`p-3 rounded-lg bg-primary/10 ${feature.color}`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground mb-4">{feature.description}</p>
                      <Button variant="ghost" className="p-0 h-auto group-hover:translate-x-1 transition-transform" asChild>
                        <Link to={feature.link}>
                          Acessar <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Benefícios */}
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <Shield className="h-12 w-12 mx-auto opacity-90" />
                <h3 className="text-xl font-semibold">Governança Completa</h3>
                <p className="opacity-90">Quality Gates automatizados e conformidade total com padrões corporativos</p>
              </div>
              
              <div className="space-y-2">
                <BarChart3 className="h-12 w-12 mx-auto opacity-90" />
                <h3 className="text-xl font-semibold">ROI Mensurado</h3>
                <p className="opacity-90">Métricas detalhadas de performance e retorno do investimento em tempo real</p>
              </div>
              
              <div className="space-y-2">
                <Zap className="h-12 w-12 mx-auto opacity-90" />
                <h3 className="text-xl font-semibold">Deploy Rápido</h3>
                <p className="opacity-90">Pipeline DevOps otimizado para deploys seguros e rollbacks instantâneos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
