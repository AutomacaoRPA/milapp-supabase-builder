import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  BarChart3,
  LogIn
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Se usuário já está logado, redirecionar para dashboard
  if (user) {
    navigate('/dashboard');
    return null;
  }
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 font-body">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center space-y-6 mb-16">
          <Badge variant="outline" className="px-4 py-2 text-sm border-primary/20 text-primary">
            <Zap className="h-4 w-4 mr-2" />
            Centro de Excelência em RPA • MedSênior
          </Badge>
          
          {/* Logo MedSênior Style */}
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-primary">
              MILAPP
            </h1>
            <p className="text-lg font-heading font-medium text-primary/80 tracking-wide">
              bem envelhecer
            </p>
          </div>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-body">
            Plataforma completa para descoberta, desenvolvimento e deploy de automações RPA com governança avançada e foco no bem-estar organizacional
          </p>
          
          {/* Seleção de Ambiente */}
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-semibold text-foreground">
              Escolha seu Ambiente
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Ambiente Demo */}
              <Card className="group hover:shadow-primary transition-all duration-300 hover-scale cursor-pointer border-2 hover:border-primary/40">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="h-16 w-16 mx-auto rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Target className="h-8 w-8 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-bold mb-2">Ambiente Demo</h3>
                    <p className="text-muted-foreground mb-4">
                      Explore todas as funcionalidades com dados de exemplo e projetos pré-configurados
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-6">
                      <li>✓ Projetos de exemplo</li>
                      <li>✓ Dados de demonstração</li>
                      <li>✓ Todas as funcionalidades ativas</li>
                      <li>✓ Ideal para testes e treinamento</li>
                    </ul>
                  </div>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      localStorage.setItem('milapp_environment', 'demo');
                      navigate('/auth');
                    }}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Acessar Demo
                  </Button>
                </CardContent>
              </Card>

              {/* Ambiente Produção */}
              <Card className="group hover:shadow-primary transition-all duration-300 hover-scale cursor-pointer border-2 hover:border-primary/40">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading font-bold mb-2">Ambiente Produção</h3>
                    <p className="text-muted-foreground mb-4">
                      Ambiente limpo e seguro para seus projetos reais de automação RPA
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-6">
                      <li>✓ Ambiente limpo</li>
                      <li>✓ Dados reais</li>
                      <li>✓ Governança completa</li>
                      <li>✓ Pronto para produção</li>
                    </ul>
                  </div>
                  <Button 
                    size="lg" 
                    variant="brand"
                    className="w-full"
                    onClick={() => {
                      localStorage.setItem('milapp_environment', 'production');
                      navigate('/auth');
                    }}
                  >
                    <LogIn className="h-5 w-5 mr-2" />
                    Acessar Produção
                  </Button>
                </CardContent>
              </Card>
            </div>
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
        <Card className="bg-gradient-brand text-white shadow-primary">
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

        {/* Informações dos Ambientes */}
        <div className="mt-16 space-y-8">
          <div className="text-center">
            <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
              Compreenda os Ambientes
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              O MILAPP oferece dois ambientes distintos para atender diferentes necessidades de uso
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Ambiente Demo */}
            <Card className="border-accent/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="text-lg font-semibold">Ambiente Demo</h3>
                </div>
                
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p><strong>Ideal para:</strong></p>
                  <ul className="space-y-1 ml-4">
                    <li>• Conhecer todas as funcionalidades</li>
                    <li>• Treinamento de equipes</li>
                    <li>• Apresentações para stakeholders</li>
                    <li>• Testes de conceito</li>
                  </ul>
                  
                  <p><strong>Características:</strong></p>
                  <ul className="space-y-1 ml-4">
                    <li>• 5 projetos de exemplo pré-criados</li>
                    <li>• Dados simulados realistas</li>
                    <li>• Todas as funcionalidades ativas</li>
                    <li>• Mudanças não são persistidas</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Ambiente Produção */}
            <Card className="border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Ambiente Produção</h3>
                </div>
                
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p><strong>Ideal para:</strong></p>
                  <ul className="space-y-1 ml-4">
                    <li>• Gestão real de projetos RPA</li>
                    <li>• Controle de pipeline de inovação</li>
                    <li>• Governança corporativa</li>
                    <li>• Métricas e ROI reais</li>
                  </ul>
                  
                  <p><strong>Características:</strong></p>
                  <ul className="space-y-1 ml-4">
                    <li>• Base de dados limpa</li>
                    <li>• Persistência garantida</li>
                    <li>• Auditoria completa</li>
                    <li>• Pronto para uso corporativo</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Dica:</strong> Você pode alternar entre os ambientes a qualquer momento através do menu de perfil
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
