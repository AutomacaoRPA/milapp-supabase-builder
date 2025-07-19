import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Mail,
  Phone,
  UserCheck,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { ProjectStakeholder } from "@/types/project-lifecycle";

interface ProjectStakeholderManagementProps {
  projectId: string;
}

const ProjectStakeholderManagement: React.FC<ProjectStakeholderManagementProps> = ({ projectId }) => {
  const [stakeholders, setStakeholders] = useState<ProjectStakeholder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStakeholder, setEditingStakeholder] = useState<ProjectStakeholder | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    influence: "medium" as "high" | "medium" | "low",
    interest: "medium" as "high" | "medium" | "low",
    engagement_strategy: ""
  });

  useEffect(() => {
    loadStakeholders();
  }, [projectId]);

  const loadStakeholders = async () => {
    setLoading(true);
    try {
      // TODO: Implementar busca no backend
      // Mock data para demonstração
      const mockStakeholders: ProjectStakeholder[] = [
        {
          id: "1",
          project_id: projectId,
          name: "João Silva",
          role: "Product Owner",
          email: "joao.silva@empresa.com",
          phone: "(11) 99999-9999",
          influence: "high",
          interest: "high",
          engagement_strategy: "Reuniões semanais e atualizações diárias",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "2",
          project_id: projectId,
          name: "Maria Santos",
          role: "Tech Lead",
          email: "maria.santos@empresa.com",
          phone: "(11) 88888-8888",
          influence: "high",
          interest: "medium",
          engagement_strategy: "Reuniões técnicas e documentação",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "3",
          project_id: projectId,
          name: "Pedro Costa",
          role: "Stakeholder Externo",
          email: "pedro.costa@cliente.com",
          phone: "(11) 77777-7777",
          influence: "medium",
          interest: "high",
          engagement_strategy: "Demonstrações quinzenais",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setStakeholders(mockStakeholders);
    } catch (error) {
      console.error("Erro ao carregar stakeholders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInfluenceColor = (influence: string) => {
    switch (influence) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getInterestColor = (interest: string) => {
    switch (interest) {
      case "high": return "bg-blue-100 text-blue-800";
      case "medium": return "bg-orange-100 text-orange-800";
      case "low": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStakeholderQuadrant = (influence: string, interest: string) => {
    if (influence === "high" && interest === "high") return "Gerenciar de Perto";
    if (influence === "high" && interest === "low") return "Manter Satisfeito";
    if (influence === "low" && interest === "high") return "Manter Informado";
    return "Monitorar";
  };

  const getQuadrantColor = (quadrant: string) => {
    switch (quadrant) {
      case "Gerenciar de Perto": return "bg-red-100 text-red-800";
      case "Manter Satisfeito": return "bg-orange-100 text-orange-800";
      case "Manter Informado": return "bg-blue-100 text-blue-800";
      case "Monitorar": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) return;

    const newStakeholder: ProjectStakeholder = {
      id: editingStakeholder?.id || Date.now().toString(),
      project_id: projectId,
      name: formData.name,
      role: formData.role,
      email: formData.email,
      phone: formData.phone,
      influence: formData.influence,
      interest: formData.interest,
      engagement_strategy: formData.engagement_strategy,
      created_at: editingStakeholder?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (editingStakeholder) {
      setStakeholders(prev => prev.map(stakeholder => 
        stakeholder.id === editingStakeholder.id ? newStakeholder : stakeholder
      ));
    } else {
      setStakeholders(prev => [...prev, newStakeholder]);
    }

    // TODO: Salvar no backend
    console.log('Stakeholder salvo:', newStakeholder);

    setShowAddForm(false);
    setEditingStakeholder(null);
    setFormData({
      name: "",
      role: "",
      email: "",
      phone: "",
      influence: "medium",
      interest: "medium",
      engagement_strategy: ""
    });
  };

  const handleEdit = (stakeholder: ProjectStakeholder) => {
    setEditingStakeholder(stakeholder);
    setFormData({
      name: stakeholder.name,
      role: stakeholder.role,
      email: stakeholder.email,
      phone: stakeholder.phone || "",
      influence: stakeholder.influence,
      interest: stakeholder.interest,
      engagement_strategy: stakeholder.engagement_strategy || ""
    });
    setShowAddForm(true);
  };

  const handleDelete = async (stakeholderId: string) => {
    setStakeholders(prev => prev.filter(stakeholder => stakeholder.id !== stakeholderId));
    // TODO: Remover do backend
    console.log('Stakeholder removido:', stakeholderId);
  };

  const stakeholderCounts = {
    highInfluence: stakeholders.filter(s => s.influence === "high").length,
    highInterest: stakeholders.filter(s => s.interest === "high").length,
    total: stakeholders.length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Stakeholders</h2>
          <p className="text-muted-foreground">
            Identifique e gerencie os stakeholders do projeto
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Stakeholder
        </Button>
      </div>

      {/* Stakeholder Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alta Influência</p>
                <p className="text-2xl font-bold text-red-600">{stakeholderCounts.highInfluence}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Alto Interesse</p>
                <p className="text-2xl font-bold text-blue-600">{stakeholderCounts.highInterest}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-purple-600">{stakeholderCounts.total}</p>
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
              {editingStakeholder ? "Editar Stakeholder" : "Novo Stakeholder"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Função *</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="Ex: Product Owner"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="exemplo@empresa.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="influence">Nível de Influência</Label>
                <Select value={formData.influence} onValueChange={(value: "high" | "medium" | "low") => setFormData(prev => ({ ...prev, influence: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interest">Nível de Interesse</Label>
                <Select value={formData.interest} onValueChange={(value: "high" | "medium" | "low") => setFormData(prev => ({ ...prev, interest: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Alto</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="low">Baixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="strategy">Estratégia de Engajamento</Label>
              <Textarea
                id="strategy"
                value={formData.engagement_strategy}
                onChange={(e) => setFormData(prev => ({ ...prev, engagement_strategy: e.target.value }))}
                placeholder="Como manter este stakeholder engajado?"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit}>
                {editingStakeholder ? "Atualizar" : "Adicionar"} Stakeholder
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingStakeholder(null);
                  setFormData({
                    name: "",
                    role: "",
                    email: "",
                    phone: "",
                    influence: "medium",
                    interest: "medium",
                    engagement_strategy: ""
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stakeholders List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Stakeholders Identificados</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <p>Carregando stakeholders...</p>
          </div>
        ) : stakeholders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-muted-foreground">Nenhum stakeholder identificado</p>
              <p className="text-sm text-muted-foreground">Clique em "Novo Stakeholder" para começar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {stakeholders.map((stakeholder) => {
              const quadrant = getStakeholderQuadrant(stakeholder.influence, stakeholder.interest);
              
              return (
                <Card key={stakeholder.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{stakeholder.name}</h4>
                          <Badge variant="outline">{stakeholder.role}</Badge>
                          <Badge className={getQuadrantColor(quadrant)}>
                            {quadrant}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {stakeholder.email}
                          </div>
                          {stakeholder.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {stakeholder.phone}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getInfluenceColor(stakeholder.influence)}>
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Influência: {stakeholder.influence === "high" ? "Alta" : 
                                        stakeholder.influence === "medium" ? "Média" : "Baixa"}
                          </Badge>
                          <Badge className={getInterestColor(stakeholder.interest)}>
                            <UserCheck className="h-3 w-3 mr-1" />
                            Interesse: {stakeholder.interest === "high" ? "Alto" : 
                                       stakeholder.interest === "medium" ? "Médio" : "Baixo"}
                          </Badge>
                        </div>
                        
                        {stakeholder.engagement_strategy && (
                          <div className="text-sm">
                            <p className="font-medium text-blue-700">Estratégia de Engajamento:</p>
                            <p className="text-muted-foreground">{stakeholder.engagement_strategy}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(stakeholder)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(stakeholder.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Stakeholder Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Stakeholders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-red-700">Gerenciar de Perto</h4>
              <p className="text-muted-foreground">
                Stakeholders com alta influência e alto interesse. 
                Manter comunicação frequente e envolvimento ativo.
              </p>
              <div className="space-y-1">
                {stakeholders
                  .filter(s => s.influence === "high" && s.interest === "high")
                  .map(s => (
                    <div key={s.id} className="text-xs bg-red-50 p-2 rounded">
                      {s.name} ({s.role})
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-orange-700">Manter Satisfeito</h4>
              <p className="text-muted-foreground">
                Stakeholders com alta influência e baixo interesse. 
                Manter informados mas não sobrecarregar.
              </p>
              <div className="space-y-1">
                {stakeholders
                  .filter(s => s.influence === "high" && s.interest === "low")
                  .map(s => (
                    <div key={s.id} className="text-xs bg-orange-50 p-2 rounded">
                      {s.name} ({s.role})
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-blue-700">Manter Informado</h4>
              <p className="text-muted-foreground">
                Stakeholders com baixa influência e alto interesse. 
                Manter informados sobre progresso.
              </p>
              <div className="space-y-1">
                {stakeholders
                  .filter(s => s.influence === "low" && s.interest === "high")
                  .map(s => (
                    <div key={s.id} className="text-xs bg-blue-50 p-2 rounded">
                      {s.name} ({s.role})
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Monitorar</h4>
              <p className="text-muted-foreground">
                Stakeholders com baixa influência e baixo interesse. 
                Monitorar sem comunicação excessiva.
              </p>
              <div className="space-y-1">
                {stakeholders
                  .filter(s => s.influence === "low" && s.interest === "low")
                  .map(s => (
                    <div key={s.id} className="text-xs bg-gray-50 p-2 rounded">
                      {s.name} ({s.role})
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectStakeholderManagement; 