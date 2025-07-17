
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Calendar, Target, Users, TrendingUp, Plus, ArrowRight } from "lucide-react";
import { Project } from "@/hooks/useProjects";

interface SprintPlanningProps {
  project: Project;
}

const SprintPlanning = ({ project }: SprintPlanningProps) => {
  const [sprintGoal, setSprintGoal] = useState("");
  const [sprintDuration, setSprintDuration] = useState("14");
  const [teamCapacity, setTeamCapacity] = useState("80");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const backlogItems = [
    {
      id: "US-001",
      title: "Como usuário, quero fazer login para acessar o sistema",
      storyPoints: 8,
      businessValue: 80,
      priority: 1,
      estimate: "8-10h"
    },
    {
      id: "US-002", 
      title: "Como usuário, quero me registrar no sistema",
      storyPoints: 5,
      businessValue: 70,
      priority: 2,
      estimate: "5-6h"
    },
    {
      id: "T-001",
      title: "Configurar pipeline de CI/CD",
      storyPoints: 8,
      businessValue: 60,
      priority: 3,
      estimate: "6-8h"
    },
    {
      id: "BUG-001",
      title: "Corrigir erro de validação no formulário",
      storyPoints: 3,
      businessValue: 30,
      priority: 1,
      estimate: "2-3h"
    }
  ];

  const totalSelectedPoints = selectedItems.reduce((total, itemId) => {
    const item = backlogItems.find(i => i.id === itemId);
    return total + (item?.storyPoints || 0);
  }, 0);

  const capacityUtilization = (totalSelectedPoints / parseInt(teamCapacity)) * 100;

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Sprint Planning Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Sprint Planning</h3>
          <p className="text-sm text-muted-foreground">
            Planeje o próximo sprint selecionando itens do backlog
          </p>
        </div>
        <Button>
          <Target className="h-4 w-4 mr-2" />
          Criar Sprint
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sprint Configuration */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuração do Sprint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal">Sprint Goal</Label>
                <Textarea
                  id="goal"
                  placeholder="Qual é o objetivo deste sprint?"
                  value={sprintGoal}
                  onChange={(e) => setSprintGoal(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duração (dias)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={sprintDuration}
                  onChange={(e) => setSprintDuration(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidade do Time (story points)</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={teamCapacity}
                  onChange={(e) => setTeamCapacity(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sprint Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Métricas do Sprint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Utilização da Capacidade</span>
                  <span className="font-medium">{Math.round(capacityUtilization)}%</span>
                </div>
                <Progress value={capacityUtilization} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {totalSelectedPoints} de {teamCapacity} story points
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Itens Selecionados</p>
                  <p className="text-lg font-bold">{selectedItems.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Story Points</p>
                  <p className="text-lg font-bold">{totalSelectedPoints}</p>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>Velocity Média: 58 pontos</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Backlog Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Backlog</CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecione os itens para incluir no sprint
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {backlogItems.map((item) => {
                  const isSelected = selectedItems.includes(item.id);
                  
                  return (
                    <div
                      key={item.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => toggleItemSelection(item.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {item.id}
                            </Badge>
                            <Badge 
                              variant="outline"
                              className={`text-xs ${
                                item.priority === 1 ? "text-red-600" :
                                item.priority === 2 ? "text-orange-600" : "text-green-600"
                              }`}
                            >
                              P{item.priority}
                            </Badge>
                          </div>
                          
                          <h4 className="font-medium text-sm mb-2">{item.title}</h4>
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span><strong>Story Points:</strong> {item.storyPoints}</span>
                            <span><strong>Valor:</strong> {item.businessValue}</span>
                            <span><strong>Estimativa:</strong> {item.estimate}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <ArrowRight className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Planning Actions */}
      <div className="flex gap-4">
        <Button variant="outline" className="flex-1">
          <Calendar className="h-4 w-4 mr-2" />
          Salvar como Rascunho
        </Button>
        <Button 
          className="flex-1"
          disabled={selectedItems.length === 0 || !sprintGoal.trim()}
        >
          <Plus className="h-4 w-4 mr-2" />
          Criar e Iniciar Sprint
        </Button>
      </div>
    </div>
  );
};

export default SprintPlanning;
