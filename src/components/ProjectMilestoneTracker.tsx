import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Flag, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle
} from "lucide-react";
import { ProjectMilestone } from "@/types/project-lifecycle";

interface ProjectMilestoneTrackerProps {
  projectId: string;
}

const ProjectMilestoneTracker: React.FC<ProjectMilestoneTrackerProps> = ({ projectId }) => {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<ProjectMilestone | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    deliverables: "",
    dependencies: ""
  });

  useEffect(() => {
    loadMilestones();
  }, [projectId]);

  const loadMilestones = async () => {
    setLoading(true);
    try {
      // TODO: Implementar busca no backend
      // Mock data para demonstração
      const mockMilestones: ProjectMilestone[] = [
        {
          id: "1",
          project_id: projectId,
          title: "Definição de Requisitos",
          description: "Documento de requisitos aprovado",
          due_date: "2024-02-15",
          status: "completed",
          deliverables: ["Documento de Requisitos", "Wireframes"],
          dependencies: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "2",
          project_id: projectId,
          title: "MVP Desenvolvido",
          description: "Versão mínima viável do produto",
          due_date: "2024-03-30",
          status: "in_progress",
          deliverables: ["MVP Funcional", "Documentação Técnica"],
          dependencies: ["1"],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "3",
          project_id: projectId,
          title: "Testes de Homologação",
          description: "Testes completos em ambiente de homologação",
          due_date: "2024-04-15",
          status: "pending",
          deliverables: ["Relatório de Testes", "Checklist de Qualidade"],
          dependencies: ["2"],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setMilestones(mockMilestones);
    } catch (error) {
      console.error("Erro ao carregar marcos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-gray-100 text-gray-800";
      case "delayed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4" />;
      case "in_progress": return <PlayCircle className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      case "delayed": return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.due_date) return;

    const newMilestone: ProjectMilestone = {
      id: editingMilestone?.id || Date.now().toString(),
      project_id: projectId,
      title: formData.title,
      description: formData.description,
      due_date: formData.due_date,
      status: "pending",
      deliverables: formData.deliverables ? formData.deliverables.split(',').map(d => d.trim()) : [],
      dependencies: formData.dependencies ? formData.dependencies.split(',').map(d => d.trim()) : [],
      created_at: editingMilestone?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (editingMilestone) {
      setMilestones(prev => prev.map(milestone => 
        milestone.id === editingMilestone.id ? newMilestone : milestone
      ));
    } else {
      setMilestones(prev => [...prev, newMilestone]);
    }

    // TODO: Salvar no backend
    console.log('Marco salvo:', newMilestone);

    setShowAddForm(false);
    setEditingMilestone(null);
    setFormData({
      title: "",
      description: "",
      due_date: "",
      deliverables: "",
      dependencies: ""
    });
  };

  const handleEdit = (milestone: ProjectMilestone) => {
    setEditingMilestone(milestone);
    setFormData({
      title: milestone.title,
      description: milestone.description,
      due_date: milestone.due_date,
      deliverables: milestone.deliverables?.join(', ') || "",
      dependencies: milestone.dependencies?.join(', ') || ""
    });
    setShowAddForm(true);
  };

  const handleDelete = async (milestoneId: string) => {
    setMilestones(prev => prev.filter(milestone => milestone.id !== milestoneId));
    // TODO: Remover do backend
    console.log('Marco removido:', milestoneId);
  };

  const handleStatusChange = async (milestoneId: string, newStatus: string) => {
    setMilestones(prev => prev.map(milestone => 
      milestone.id === milestoneId 
        ? { ...milestone, status: newStatus as any, updated_at: new Date().toISOString() }
        : milestone
    ));
    // TODO: Atualizar no backend
    console.log('Status atualizado:', milestoneId, newStatus);
  };

  const milestoneCounts = {
    completed: milestones.filter(m => m.status === "completed").length,
    inProgress: milestones.filter(m => m.status === "in_progress").length,
    pending: milestones.filter(m => m.status === "pending").length,
    delayed: milestones.filter(m => m.status === "delayed").length,
    overdue: milestones.filter(m => isOverdue(m.due_date) && m.status !== "completed").length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rastreamento de Marcos</h2>
          <p className="text-muted-foreground">
            Acompanhe os marcos importantes do projeto
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Marco
        </Button>
      </div>

      {/* Milestone Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold text-green-600">{milestoneCounts.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <PlayCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Progresso</p>
                <p className="text-2xl font-bold text-blue-600">{milestoneCounts.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-gray-600">{milestoneCounts.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Atrasados</p>
                <p className="text-2xl font-bold text-red-600">{milestoneCounts.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Flag className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-purple-600">{milestones.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingMilestone ? "Editar Marco" : "Novo Marco"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Marco *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: MVP Desenvolvido"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Data de Entrega *</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o marco em detalhes..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliverables">Entregáveis (separados por vírgula)</Label>
                <Input
                  id="deliverables"
                  value={formData.deliverables}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliverables: e.target.value }))}
                  placeholder="Ex: Documento, Código, Testes"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dependencies">Dependências (IDs separados por vírgula)</Label>
                <Input
                  id="dependencies"
                  value={formData.dependencies}
                  onChange={(e) => setFormData(prev => ({ ...prev, dependencies: e.target.value }))}
                  placeholder="Ex: 1, 2, 3"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit}>
                {editingMilestone ? "Atualizar" : "Adicionar"} Marco
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingMilestone(null);
                  setFormData({
                    title: "",
                    description: "",
                    due_date: "",
                    deliverables: "",
                    dependencies: ""
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Milestones List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Marcos do Projeto</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <p>Carregando marcos...</p>
          </div>
        ) : milestones.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Flag className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-muted-foreground">Nenhum marco definido</p>
              <p className="text-sm text-muted-foreground">Clique em "Novo Marco" para começar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {milestones.map((milestone) => (
              <Card key={milestone.id} className={isOverdue(milestone.due_date) && milestone.status !== "completed" ? "border-red-200" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{milestone.title}</h4>
                        <Badge className={getStatusColor(milestone.status)}>
                          {getStatusIcon(milestone.status)}
                          <span className="ml-1">
                            {milestone.status === "completed" ? "Concluído" :
                             milestone.status === "in_progress" ? "Em Progresso" :
                             milestone.status === "pending" ? "Pendente" : "Atrasado"}
                          </span>
                        </Badge>
                        {isOverdue(milestone.due_date) && milestone.status !== "completed" && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Atrasado
                          </Badge>
                        )}
                      </div>
                      
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {milestone.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm mb-2">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(milestone.due_date).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      
                      {milestone.deliverables && milestone.deliverables.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-blue-700">Entregáveis:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {milestone.deliverables.map((deliverable, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {deliverable}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {milestone.dependencies && milestone.dependencies.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-orange-700">Dependências:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {milestone.dependencies.map((dependency, index) => (
                              <Badge key={index} variant="outline" className="text-xs bg-orange-50">
                                #{dependency}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      <Select 
                        value={milestone.status} 
                        onValueChange={(value) => handleStatusChange(milestone.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="in_progress">Em Progresso</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                          <SelectItem value="delayed">Atrasado</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(milestone)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(milestone.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectMilestoneTracker; 