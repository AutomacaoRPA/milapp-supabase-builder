
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Target, TrendingUp, Users, Calendar } from "lucide-react";
import { Project } from "@/hooks/useProjects";

interface SprintReviewProps {
  project: Project;
}

const SprintReview = ({ project }: SprintReviewProps) => {
  const [feedback, setFeedback] = useState("");

  const sprintData = {
    name: "Sprint 1 - MVP Features",
    goal: "Implementar funcionalidades básicas de autenticação e configurar infraestrutura",
    startDate: "2024-01-15",
    endDate: "2024-01-29",
    commitment: 65,
    completed: 58,
    velocity: 58,
    completedItems: [
      {
        id: "US-001",
        title: "Como usuário, quero fazer login para acessar o sistema",
        storyPoints: 8,
        demo: true
      },
      {
        id: "T-001",
        title: "Configurar pipeline de CI/CD",
        storyPoints: 8,
        demo: false
      },
      {
        id: "BUG-001",
        title: "Corrigir erro de validação no formulário",
        storyPoints: 3,
        demo: true
      }
    ],
    incompleteItems: [
      {
        id: "US-002",
        title: "Como usuário, quero me registrar no sistema",
        storyPoints: 5,
        reason: "Dependência externa não resolvida"
      },
      {
        id: "T-002",
        title: "Implementar monitoramento de logs",
        storyPoints: 5,
        reason: "Prioridade reduzida pelo PO"
      }
    ]
  };

  const completionRate = (sprintData.completed / sprintData.commitment) * 100;

  return (
    <div className="space-y-6">
      {/* Sprint Review Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Sprint Review</h3>
          <p className="text-sm text-muted-foreground">
            Revisão e demonstração do trabalho realizado no sprint
          </p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Agendar Próxima Review
        </Button>
      </div>

      {/* Sprint Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            {sprintData.name}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{sprintData.goal}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Conclusão do Sprint</span>
                <span className="font-medium">{Math.round(completionRate)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {sprintData.completed} de {sprintData.commitment} story points
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Velocity</span>
              </div>
              <p className="text-2xl font-bold">{sprintData.velocity}</p>
              <p className="text-xs text-muted-foreground">pontos entregues</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Itens Concluídos</span>
              </div>
              <p className="text-2xl font-bold">{sprintData.completedItems.length}</p>
              <p className="text-xs text-muted-foreground">de {sprintData.completedItems.length + sprintData.incompleteItems.length} itens</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Duração</span>
              </div>
              <p className="text-2xl font-bold">14</p>
              <p className="text-xs text-muted-foreground">dias de sprint</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completed Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Itens Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sprintData.completedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono text-xs">
                        {item.id}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.storyPoints} SP
                      </Badge>
                      {item.demo && (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          Demo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium">{item.title}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Incomplete Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <XCircle className="h-5 w-5 text-red-600" />
              Itens Não Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sprintData.incompleteItems.map((item) => (
                <div key={item.id} className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {item.id}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {item.storyPoints} SP
                    </Badge>
                  </div>
                  <p className="text-sm font-medium mb-1">{item.title}</p>
                  <p className="text-xs text-red-600">
                    <strong>Motivo:</strong> {item.reason}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stakeholder Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-primary" />
            Feedback dos Stakeholders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">Product Owner</Badge>
                <span className="text-xs text-muted-foreground">Maria Silva</span>
              </div>
              <p className="text-sm">
                "Excelente trabalho na implementação do login. A interface ficou intuitiva e o fluxo está muito bom. 
                Sugiro apenas ajustar as mensagens de erro para serem mais específicas."
              </p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">UX Designer</Badge>
                <span className="text-xs text-muted-foreground">Carlos Santos</span>
              </div>
              <p className="text-sm">
                "A implementação seguiu perfeitamente o design. Vamos incorporar as melhorias de acessibilidade 
                no próximo sprint."
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Adicionar Feedback</label>
            <Textarea
              placeholder="Digite o feedback sobre o sprint..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
            <Button size="sm">
              Adicionar Feedback
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Action Items para o Próximo Sprint</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">Incluir US-002 no próximo sprint com prioridade alta</p>
                <p className="text-xs text-muted-foreground">Responsável: Product Owner</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">Melhorar mensagens de erro na tela de login</p>
                <p className="text-xs text-muted-foreground">Responsável: Frontend Team</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium">Revisar critérios de aceitação com foco em acessibilidade</p>
                <p className="text-xs text-muted-foreground">Responsável: UX Designer + PO</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SprintReview;
