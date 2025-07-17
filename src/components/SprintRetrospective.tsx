
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Plus, ThumbsUp, ThumbsDown, Lightbulb, TrendingUp, Users } from "lucide-react";
import { Project } from "@/hooks/useProjects";

interface RetroItem {
  id: string;
  category: "went-well" | "to-improve" | "action-items";
  content: string;
  author: string;
  votes: number;
}

interface SprintRetrospectiveProps {
  project: Project;
}

const SprintRetrospective = ({ project }: SprintRetrospectiveProps) => {
  const [newItem, setNewItem] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"went-well" | "to-improve" | "action-items">("went-well");
  
  const [retroItems, setRetroItems] = useState<RetroItem[]>([
    {
      id: "1",
      category: "went-well",
      content: "Boa comunicação durante o desenvolvimento da feature de login",
      author: "João Silva",
      votes: 5
    },
    {
      id: "2", 
      category: "went-well",
      content: "Pipeline de CI/CD funcionou perfeitamente sem interrupções",
      author: "Pedro Costa",
      votes: 3
    },
    {
      id: "3",
      category: "to-improve",
      content: "Melhorar estimativas - algumas tasks levaram mais tempo que o previsto",
      author: "Maria Santos",
      votes: 4
    },
    {
      id: "4",
      category: "to-improve", 
      content: "Definir critérios de aceitação mais claros no início do sprint",
      author: "Ana Lima",
      votes: 6
    },
    {
      id: "5",
      category: "action-items",
      content: "Implementar sessões de refinement de 30min antes do planning",
      author: "Scrum Master",
      votes: 7
    },
    {
      id: "6",
      category: "action-items",
      content: "Criar templates de Definition of Done para cada tipo de task",
      author: "Product Owner",
      votes: 5
    }
  ]);

  const categories = [
    {
      id: "went-well",
      title: "O que foi bem? 👍",
      description: "Práticas e eventos positivos do sprint",
      color: "bg-green-50 border-green-200",
      icon: ThumbsUp,
      iconColor: "text-green-600"
    },
    {
      id: "to-improve", 
      title: "O que pode melhorar? 🔧",
      description: "Pontos de melhoria identificados",
      color: "bg-yellow-50 border-yellow-200",
      icon: ThumbsDown,
      iconColor: "text-yellow-600"
    },
    {
      id: "action-items",
      title: "Action Items 🎯",
      description: "Ações concretas para o próximo sprint",
      color: "bg-blue-50 border-blue-200", 
      icon: Lightbulb,
      iconColor: "text-blue-600"
    }
  ];

  const addItem = () => {
    if (!newItem.trim()) return;
    
    const item: RetroItem = {
      id: Date.now().toString(),
      category: selectedCategory,
      content: newItem,
      author: "Você",
      votes: 0
    };
    
    setRetroItems([...retroItems, item]);
    setNewItem("");
  };

  const voteItem = (itemId: string) => {
    setRetroItems(items => 
      items.map(item => 
        item.id === itemId 
          ? { ...item, votes: item.votes + 1 }
          : item
      )
    );
  };

  const getItemsByCategory = (category: string) => {
    return retroItems
      .filter(item => item.category === category)
      .sort((a, b) => b.votes - a.votes);
  };

  return (
    <div className="space-y-6">
      {/* Retrospective Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Sprint Retrospective</h3>
          <p className="text-sm text-muted-foreground">
            Reflexão sobre o sprint e identificação de melhorias
          </p>
        </div>
        <Button>
          <TrendingUp className="h-4 w-4 mr-2" />
          Gerar Relatório
        </Button>
      </div>

      {/* Sprint Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Métricas do Sprint</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">89%</p>
              <p className="text-xs text-muted-foreground">Conclusão de Tasks</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">58</p>
              <p className="text-xs text-muted-foreground">Velocity</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">3.2</p>
              <p className="text-xs text-muted-foreground">Lead Time (dias)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">95%</p>
              <p className="text-xs text-muted-foreground">Team Satisfaction</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Item */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar Item</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id as any)}
                >
                  {category.title}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="Digite seu comentário..."
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addItem()}
              />
              <Button onClick={addItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Retrospective Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const items = getItemsByCategory(category.id);
          const Icon = category.icon;
          
          return (
            <div key={category.id} className="space-y-4">
              <div className={`p-4 rounded-lg border-2 ${category.color}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-5 w-5 ${category.iconColor}`} />
                  <h3 className="font-semibold">{category.title}</h3>
                </div>
                <p className="text-sm opacity-75">{category.description}</p>
                <Badge variant="secondary" className="mt-2">
                  {items.length} itens
                </Badge>
              </div>

              <div className="space-y-3 min-h-[300px]">
                {items.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <p className="text-sm mb-3">{item.content}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{item.author}</span>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => voteItem(item.id)}
                          className="h-6 px-2"
                        >
                          👍 {item.votes}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {items.length === 0 && (
                  <div className="flex items-center justify-center h-20 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Nenhum item ainda
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Action Items (Mais Votados)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getItemsByCategory("action-items")
              .slice(0, 3)
              .map((item, index) => (
                <div key={item.id} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                  <Badge variant="default" className="mt-0.5">
                    #{index + 1}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">por {item.author}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.votes} votos
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SprintRetrospective;
