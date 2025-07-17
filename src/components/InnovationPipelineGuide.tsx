
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  Target, 
  Search, 
  Zap, 
  CheckCircle, 
  Rocket, 
  TestTube, 
  Scaling, 
  TrendingUp, 
  Cog,
  Info
} from "lucide-react";

const InnovationPipelineGuide = () => {
  const stages = [
    {
      id: 1,
      title: "Captação de Ideias",
      description: "O ponto de partida, onde as oportunidades e problemas são identificados.",
      icon: Lightbulb,
      color: "bg-purple-100 text-purple-800 border-purple-300",
      keyPoints: [
        "Identificação de oportunidades",
        "Mapeamento de problemas",
        "Coleta de sugestões",
        "Brainstorming estruturado"
      ]
    },
    {
      id: 2,
      title: "Priorização",
      description: "Essencial para focar os esforços nas ideias com maior potencial e alinhamento estratégico.",
      icon: Target,
      color: "bg-blue-100 text-blue-800 border-blue-300",
      keyPoints: [
        "Avaliação de impacto",
        "Análise de viabilidade inicial",
        "Alinhamento estratégico",
        "Definição de prioridades"
      ]
    },
    {
      id: 3,
      title: "Análise de Viabilidade",
      description: "Crucial para garantir que a ideia é técnica, financeira e operacionalmente possível antes de investir mais recursos.",
      icon: Search,
      color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      keyPoints: [
        "Viabilidade técnica",
        "Análise financeira",
        "Aspectos regulatórios",
        "Riscos operacionais"
      ]
    },
    {
      id: 4,
      title: "Protótipo Rápido",
      description: "Permite testar conceitos e funcionalidades de forma ágil e com baixo custo, validando a hipótese principal.",
      icon: Zap,
      color: "bg-orange-100 text-orange-800 border-orange-300",
      keyPoints: [
        "Desenvolvimento ágil",
        "Testes de conceito",
        "Validação de hipóteses",
        "Baixo investimento"
      ]
    },
    {
      id: 5,
      title: "Validação do Protótipo",
      description: "Momento de coletar feedback e aprender com usuários ou stakeholders sobre a usabilidade e a aderência da solução proposta.",
      icon: CheckCircle,
      color: "bg-green-100 text-green-800 border-green-300",
      keyPoints: [
        "Coleta de feedback",
        "Testes de usabilidade",
        "Avaliação de aderência",
        "Refinamento da solução"
      ]
    },
    {
      id: 6,
      title: "MVP (Produto Mínimo Viável)",
      description: "A primeira versão funcional que entrega valor real, permitindo um lançamento rápido para aprender com o mercado e usuários reais.",
      icon: Rocket,
      color: "bg-indigo-100 text-indigo-800 border-indigo-300",
      keyPoints: [
        "Funcionalidade mínima",
        "Entrega de valor",
        "Lançamento rápido",
        "Aprendizado com usuários"
      ]
    },
    {
      id: 7,
      title: "Teste Operacional",
      description: "Após o MVP, esta etapa serve para validar a solução em um ambiente mais próximo do real, com um grupo maior de usuários, antes da escala total.",
      icon: TestTube,
      color: "bg-pink-100 text-pink-800 border-pink-300",
      keyPoints: [
        "Ambiente real de teste",
        "Grupo ampliado de usuários",
        "Validação operacional",
        "Preparação para escala"
      ]
    },
    {
      id: 8,
      title: "Escala e Entrega",
      description: "A fase de implantação em larga escala, onde a solução é integrada à operação da empresa.",
      icon: Scaling,
      color: "bg-teal-100 text-teal-800 border-teal-300",
      keyPoints: [
        "Implantação em escala",
        "Integração operacional",
        "Rollout completo",
        "Monitoramento inicial"
      ]
    },
    {
      id: 9,
      title: "Acompanhamento Pós-Entrega",
      description: "Monitoramento inicial para garantir que a solução está gerando o valor esperado e identificar ajustes necessários.",
      icon: TrendingUp,
      color: "bg-cyan-100 text-cyan-800 border-cyan-300",
      keyPoints: [
        "Monitoramento de resultados",
        "Medição de valor",
        "Identificação de ajustes",
        "Análise de impacto"
      ]
    },
    {
      id: 10,
      title: "Sustentação e Evolução",
      description: "Garante a longevidade da solução, com manutenção contínua, melhorias e novas funcionalidades baseadas em feedback e novas necessidades, realimentando o ciclo de inovação.",
      icon: Cog,
      color: "bg-slate-100 text-slate-800 border-slate-300",
      keyPoints: [
        "Manutenção contínua",
        "Melhorias iterativas",
        "Novas funcionalidades",
        "Ciclo de inovação"
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Guia da Esteira de Inovação
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Consulta rápida dos conceitos e etapas da esteira de inovação
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stages.map((stage, index) => {
          const IconComponent = stage.icon;
          
          return (
            <Card key={stage.id} className={`transition-all hover:shadow-lg border-2 ${stage.color}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {stage.id}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{stage.title}</CardTitle>
                <CardDescription className="text-sm">
                  {stage.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Pontos-chave:
                  </h4>
                  <ul className="space-y-2">
                    {stage.keyPoints.map((point, pointIndex) => (
                      <li key={pointIndex} className="text-sm flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-current mt-2 flex-shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dica final */}
      <Card className="border-l-4 border-l-primary bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold text-primary mb-2">💡 Dica:</h3>
              <p className="text-sm text-muted-foreground">
                A esteira de inovação é um processo iterativo. Cada etapa alimenta a próxima e o 
                aprendizado pode levar a refinamentos em etapas anteriores.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InnovationPipelineGuide;
