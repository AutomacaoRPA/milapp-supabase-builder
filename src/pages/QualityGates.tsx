import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle, XCircle, Users, FileText } from "lucide-react";

const QualityGates = () => {
  const qualityGates = [
    {
      id: "G1",
      name: "G1 - Conceito",
      description: "Validação de PDD e análise de viabilidade",
      status: "approved",
      progress: 100,
      approvers: ["Arquiteto", "Product Owner"],
      criteria: [
        "PDD aprovado",
        "Análise de viabilidade concluída",
        "Stakeholders identificados"
      ],
      completedAt: "2024-01-15"
    },
    {
      id: "G2",
      name: "G2 - Desenvolvimento",
      description: "Code review e testes automatizados",
      status: "in_progress",
      progress: 75,
      approvers: ["Tech Lead", "QA"],
      criteria: [
        "Code review aprovado",
        "Testes automatizados passando",
        "Security scan limpo"
      ],
      dueDate: "2024-01-25"
    },
    {
      id: "G3",
      name: "G3 - Homologação",
      description: "UAT e validação de segurança",
      status: "pending",
      progress: 0,
      approvers: ["UAT Team", "Security"],
      criteria: [
        "UAT aprovado",
        "Performance tests OK",
        "Security validation"
      ]
    },
    {
      id: "G4",
      name: "G4 - Produção",
      description: "Deploy e monitoramento",
      status: "pending",
      progress: 0,
      approvers: ["DevOps", "Operations"],
      criteria: [
        "Deploy realizado",
        "Health checks OK",
        "Monitoring ativo"
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "in_progress": return <Clock className="h-5 w-5 text-yellow-500" />;
      case "pending": return <AlertCircle className="h-5 w-5 text-gray-500" />;
      case "rejected": return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "pending": return "bg-gray-100 text-gray-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Quality Gates
          </h1>
          <p className="text-muted-foreground">
            Governança e controle de qualidade para automações RPA
          </p>
        </div>

        {/* Timeline dos Quality Gates */}
        <div className="space-y-6">
          {qualityGates.map((gate, index) => (
            <Card key={gate.id} className="transition-all hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(gate.status)}
                    <div>
                      <CardTitle className="text-xl">{gate.name}</CardTitle>
                      <CardDescription>{gate.description}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(gate.status)}>
                    {gate.status === "approved" && "Aprovado"}
                    {gate.status === "in_progress" && "Em Progresso"}
                    {gate.status === "pending" && "Pendente"}
                    {gate.status === "rejected" && "Rejeitado"}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progresso */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{gate.progress}%</span>
                  </div>
                  <Progress value={gate.progress} className="h-2" />
                </div>

                {/* Aprovadores */}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Aprovadores:</span>
                  <div className="flex gap-1">
                    {gate.approvers.map((approver, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {approver}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Critérios */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Critérios de Aprovação:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {gate.criteria.map((criterion, idx) => (
                      <li key={idx}>{criterion}</li>
                    ))}
                  </ul>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  {gate.status === "pending" && (
                    <Button size="sm">Iniciar Gate</Button>
                  )}
                  {gate.status === "in_progress" && (
                    <Button size="sm" variant="outline">Ver Detalhes</Button>
                  )}
                  {gate.status === "approved" && (
                    <Button size="sm" variant="outline">Ver Aprovação</Button>
                  )}
                </div>

                {/* Informações adicionais */}
                {gate.completedAt && (
                  <div className="text-xs text-muted-foreground">
                    Concluído em: {gate.completedAt}
                  </div>
                )}
                {gate.dueDate && (
                  <div className="text-xs text-muted-foreground">
                    Prazo: {gate.dueDate}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Métricas de Governança */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gates Aprovados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">2/4</div>
              <p className="text-sm text-muted-foreground">50% concluído</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tempo Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">3.2d</div>
              <p className="text-sm text-muted-foreground">Por gate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Taxa de Aprovação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">85%</div>
              <p className="text-sm text-muted-foreground">Primeira tentativa</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QualityGates; 