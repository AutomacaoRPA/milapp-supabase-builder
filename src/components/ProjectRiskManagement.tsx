import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  Shield,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { ProjectRisk, RiskLevel } from "@/types/project-lifecycle";

interface ProjectRiskManagementProps {
  projectId: string;
}

const ProjectRiskManagement: React.FC<ProjectRiskManagementProps> = ({ projectId }) => {
  const [risks, setRisks] = useState<ProjectRisk[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRisk, setEditingRisk] = useState<ProjectRisk | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    probability: 3,
    impact: 3,
    mitigation_strategy: "",
    contingency_plan: "",
    owner: ""
  });

  useEffect(() => {
    loadRisks();
  }, [projectId]);

  const loadRisks = async () => {
    setLoading(true);
    try {
      // TODO: Implementar busca no backend
      // Mock data para demonstração
      const mockRisks: ProjectRisk[] = [
        {
          id: "1",
          project_id: projectId,
          title: "Falta de recursos técnicos",
          description: "Equipe pode não ter conhecimento suficiente em tecnologias específicas",
          probability: 4,
          impact: 5,
          level: "high",
          mitigation_strategy: "Treinamento da equipe e contratação de especialistas",
          contingency_plan: "Terceirização de desenvolvimento",
          owner: "Tech Lead",
          status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: "2",
          project_id: projectId,
          title: "Atraso na aprovação de stakeholders",
          description: "Processo de aprovação pode ser mais lento que o esperado",
          probability: 3,
          impact: 4,
          level: "medium",
          mitigation_strategy: "Comunicação proativa e alinhamento prévio",
          contingency_plan: "Replanejamento de cronograma",
          owner: "Product Owner",
          status: "mitigated",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setRisks(mockRisks);
    } catch (error) {
      console.error("Erro ao carregar riscos:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRiskLevel = (probability: number, impact: number): RiskLevel => {
    const score = probability * impact;
    if (score >= 20) return "critical";
    if (score >= 15) return "high";
    if (score >= 10) return "medium";
    return "low";
  };

  const getRiskLevelColor = (level: RiskLevel) => {
    switch (level) {
      case "critical": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
    }
  };

  const getRiskLevelIcon = (level: RiskLevel) => {
    switch (level) {
      case "critical": return <TrendingUp className="h-4 w-4" />;
      case "high": return <AlertTriangle className="h-4 w-4" />;
      case "medium": return <Minus className="h-4 w-4" />;
      case "low": return <Shield className="h-4 w-4" />;
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;

    const newRisk: ProjectRisk = {
      id: editingRisk?.id || Date.now().toString(),
      project_id: projectId,
      title: formData.title,
      description: formData.description,
      probability: formData.probability,
      impact: formData.impact,
      level: calculateRiskLevel(formData.probability, formData.impact),
      mitigation_strategy: formData.mitigation_strategy,
      contingency_plan: formData.contingency_plan,
      owner: formData.owner,
      status: "open",
      created_at: editingRisk?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (editingRisk) {
      setRisks(prev => prev.map(risk => risk.id === editingRisk.id ? newRisk : risk));
    } else {
      setRisks(prev => [...prev, newRisk]);
    }

    // TODO: Salvar no backend
    console.log('Risco salvo:', newRisk);

    setShowAddForm(false);
    setEditingRisk(null);
    setFormData({
      title: "",
      description: "",
      probability: 3,
      impact: 3,
      mitigation_strategy: "",
      contingency_plan: "",
      owner: ""
    });
  };

  const handleEdit = (risk: ProjectRisk) => {
    setEditingRisk(risk);
    setFormData({
      title: risk.title,
      description: risk.description,
      probability: risk.probability,
      impact: risk.impact,
      mitigation_strategy: risk.mitigation_strategy || "",
      contingency_plan: risk.contingency_plan || "",
      owner: risk.owner || ""
    });
    setShowAddForm(true);
  };

  const handleDelete = async (riskId: string) => {
    setRisks(prev => prev.filter(risk => risk.id !== riskId));
    // TODO: Remover do backend
    console.log('Risco removido:', riskId);
  };

  const riskCounts = {
    critical: risks.filter(r => r.level === "critical").length,
    high: risks.filter(r => r.level === "high").length,
    medium: risks.filter(r => r.level === "medium").length,
    low: risks.filter(r => r.level === "low").length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Riscos</h2>
          <p className="text-muted-foreground">
            Identifique, analise e gerencie riscos do projeto
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Risco
        </Button>
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Críticos</p>
                <p className="text-2xl font-bold text-red-600">{riskCounts.critical}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Altos</p>
                <p className="text-2xl font-bold text-orange-600">{riskCounts.high}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Minus className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Médios</p>
                <p className="text-2xl font-bold text-yellow-600">{riskCounts.medium}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Baixos</p>
                <p className="text-2xl font-bold text-green-600">{riskCounts.low}</p>
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
              {editingRisk ? "Editar Risco" : "Novo Risco"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Risco *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Falta de recursos técnicos"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner">Responsável</Label>
                <Input
                  id="owner"
                  value={formData.owner}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                  placeholder="Ex: Tech Lead"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o risco em detalhes..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="probability">Probabilidade (1-5)</Label>
                <Select value={formData.probability.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, probability: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Muito Baixa</SelectItem>
                    <SelectItem value="2">2 - Baixa</SelectItem>
                    <SelectItem value="3">3 - Média</SelectItem>
                    <SelectItem value="4">4 - Alta</SelectItem>
                    <SelectItem value="5">5 - Muito Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="impact">Impacto (1-5)</Label>
                <Select value={formData.impact.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, impact: parseInt(value) }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Muito Baixo</SelectItem>
                    <SelectItem value="2">2 - Baixo</SelectItem>
                    <SelectItem value="3">3 - Médio</SelectItem>
                    <SelectItem value="4">4 - Alto</SelectItem>
                    <SelectItem value="5">5 - Muito Alto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mitigation">Estratégia de Mitigação</Label>
              <Textarea
                id="mitigation"
                value={formData.mitigation_strategy}
                onChange={(e) => setFormData(prev => ({ ...prev, mitigation_strategy: e.target.value }))}
                placeholder="Como podemos reduzir a probabilidade ou impacto deste risco?"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contingency">Plano de Contingência</Label>
              <Textarea
                id="contingency"
                value={formData.contingency_plan}
                onChange={(e) => setFormData(prev => ({ ...prev, contingency_plan: e.target.value }))}
                placeholder="O que fazer se o risco se materializar?"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit}>
                {editingRisk ? "Atualizar" : "Adicionar"} Risco
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false);
                  setEditingRisk(null);
                  setFormData({
                    title: "",
                    description: "",
                    probability: 3,
                    impact: 3,
                    mitigation_strategy: "",
                    contingency_plan: "",
                    owner: ""
                  });
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risks List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Riscos Identificados</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <p>Carregando riscos...</p>
          </div>
        ) : risks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-muted-foreground">Nenhum risco identificado</p>
              <p className="text-sm text-muted-foreground">Clique em "Novo Risco" para começar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {risks.map((risk) => (
              <Card key={risk.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{risk.title}</h4>
                        <Badge className={getRiskLevelColor(risk.level)}>
                          {getRiskLevelIcon(risk.level)}
                          <span className="ml-1 capitalize">
                            {risk.level === "critical" ? "Crítico" :
                             risk.level === "high" ? "Alto" :
                             risk.level === "medium" ? "Médio" : "Baixo"}
                          </span>
                        </Badge>
                        <Badge variant="outline">
                          Prob: {risk.probability} | Impacto: {risk.impact}
                        </Badge>
                      </div>
                      
                      {risk.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {risk.description}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {risk.mitigation_strategy && (
                          <div>
                            <p className="font-medium text-green-700">Estratégia de Mitigação:</p>
                            <p className="text-muted-foreground">{risk.mitigation_strategy}</p>
                          </div>
                        )}
                        
                        {risk.contingency_plan && (
                          <div>
                            <p className="font-medium text-orange-700">Plano de Contingência:</p>
                            <p className="text-muted-foreground">{risk.contingency_plan}</p>
                          </div>
                        )}
                      </div>
                      
                      {risk.owner && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Responsável: {risk.owner}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(risk)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(risk.id)}
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

export default ProjectRiskManagement; 