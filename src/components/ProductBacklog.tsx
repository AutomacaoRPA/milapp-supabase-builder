
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, GripVertical, Target, Bug, CheckSquare } from "lucide-react";
import { Project } from "@/hooks/useProjects";

interface BacklogItem {
  id: string;
  title: string;
  description: string;
  type: "epic" | "user-story" | "bug" | "task";
  priority: number;
  storyPoints?: number;
  businessValue: number;
  status: "backlog" | "ready" | "in-sprint";
  acceptanceCriteria: string[];
}

interface ProductBacklogProps {
  project: Project;
}

const ProductBacklog = ({ project }: ProductBacklogProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [backlogItems] = useState<BacklogItem[]>([
    {
      id: "EPIC-001",
      title: "Sistema de Autenticação Completo",
      description: "Implementar sistema completo de autenticação com login, registro, recuperação de senha e autorização",
      type: "epic",
      priority: 1,
      businessValue: 100,
      status: "backlog",
      acceptanceCriteria: [
        "Usuário pode fazer login com email/senha",
        "Usuário pode se registrar",
        "Sistema de recuperação de senha funcional",
        "Autorização baseada em roles"
      ]
    },
    {
      id: "US-001",
      title: "Como usuário, quero fazer login para acessar o sistema",
      description: "Implementar tela de login com validação de credenciais",
      type: "user-story",
      priority: 2,
      storyPoints: 8,
      businessValue: 80,
      status: "ready",
      acceptanceCriteria: [
        "Tela de login responsiva",
        "Validação de email e senha",
        "Mensagens de erro claras",
        "Redirecionamento após login"
      ]
    },
    {
      id: "US-002",
      title: "Como usuário, quero me registrar no sistema",
      description: "Implementar tela de registro com validação de dados",
      type: "user-story",
      priority: 3,
      storyPoints: 5,
      businessValue: 70,
      status: "backlog",
      acceptanceCriteria: [
        "Formulário de registro",
        "Validação de email único",
        "Confirmação de senha",
        "Email de confirmação"
      ]
    },
    {
      id: "BUG-001",
      title: "Corrigir erro de validação no formulário de contato",
      description: "Formulário não está validando campos obrigatórios corretamente",
      type: "bug",
      priority: 1,
      storyPoints: 3,
      businessValue: 30,
      status: "backlog",
      acceptanceCriteria: [
        "Todos os campos obrigatórios são validados",
        "Mensagens de erro são exibidas",
        "Formulário não é enviado com dados inválidos"
      ]
    }
  ]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "epic": return Target;
      case "user-story": return CheckSquare;
      case "bug": return Bug;
      case "task": return CheckSquare;
      default: return CheckSquare;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "epic": return "bg-purple-100 text-purple-800";
      case "user-story": return "bg-blue-100 text-blue-800";
      case "bug": return "bg-red-100 text-red-800";
      case "task": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 2) return "text-red-600 bg-red-50";
    if (priority <= 4) return "text-orange-600 bg-orange-50";
    return "text-green-600 bg-green-50";
  };

  const sortedItems = [...backlogItems].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Product Backlog</h3>
          <p className="text-sm text-muted-foreground">
            Lista priorizada de funcionalidades e requisitos
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Item do Backlog</DialogTitle>
              <DialogDescription>
                Adicione um novo item ao product backlog
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título*</Label>
                  <Input id="title" placeholder="Título do item" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo*</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="epic">Epic</SelectItem>
                      <SelectItem value="user-story">User Story</SelectItem>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  placeholder="Descreva o item em detalhes"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Crítica</SelectItem>
                      <SelectItem value="2">2 - Alta</SelectItem>
                      <SelectItem value="3">3 - Média</SelectItem>
                      <SelectItem value="4">4 - Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storyPoints">Story Points</Label>
                  <Input 
                    id="storyPoints" 
                    type="number"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessValue">Valor de Negócio</Label>
                  <Input 
                    id="businessValue" 
                    type="number"
                    placeholder="0-100"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">Criar Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Backlog Items */}
      <div className="space-y-4">
        {sortedItems.map((item, index) => {
          const TypeIcon = getTypeIcon(item.type);
          
          return (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <Badge variant="outline" className="font-mono text-xs">
                    #{index + 1}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <TypeIcon className="h-4 w-4" />
                    <Badge className={getTypeColor(item.type)}>
                      {item.type.replace("-", " ").toUpperCase()}
                    </Badge>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={getPriorityColor(item.priority)}
                  >
                    P{item.priority}
                  </Badge>
                  <Badge variant="outline">
                    {item.id}
                  </Badge>
                </div>
                
                <CardTitle className="text-base mt-2">{item.title}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{item.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-sm">
                    {item.storyPoints && (
                      <span><strong>Story Points:</strong> {item.storyPoints}</span>
                    )}
                    <span><strong>Valor de Negócio:</strong> {item.businessValue}</span>
                    <Badge 
                      variant={item.status === "ready" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {item.status}
                    </Badge>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                </div>

                {item.acceptanceCriteria.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Critérios de Aceitação:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {item.acceptanceCriteria.map((criteria, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ProductBacklog;
