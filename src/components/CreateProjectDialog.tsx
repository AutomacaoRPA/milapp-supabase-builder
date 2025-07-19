import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/hooks/useProjects";
import { ProjectFormData } from "@/types/forms";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (project: Omit<Project, "id" | "created_at" | "updated_at">) => Promise<void>;
}

const CreateProjectDialog = ({ open, onOpenChange, onCreateProject }: CreateProjectDialogProps) => {
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    expected_impact: "",
    responsible_name: "",
    responsible_email: "",
    status: "ideacao" as const,
    priority: 3,
    methodology: "kanban",
    complexity_score: 1,
    estimated_roi: 0,
    target_date: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome do projeto é obrigatório";
    }

    if (formData.name.length > 255) {
      newErrors.name = "Nome deve ter no máximo 255 caracteres";
    }

    if (formData.complexity_score < 1 || formData.complexity_score > 10) {
      newErrors.complexity_score = "Complexidade deve estar entre 1 e 10";
    }

    if (formData.estimated_roi < 0) {
      newErrors.estimated_roi = "ROI estimado não pode ser negativo";
    }

    if (formData.target_date && new Date(formData.target_date) < new Date()) {
      newErrors.target_date = "Data meta não pode ser no passado";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Preenche automaticamente nome e email do usuário logado
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        responsible_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "",
        responsible_email: user.email || "",
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, corrija os erros no formulário",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateProject({
        name: formData.name,
        description: formData.description || null,
        status: formData.status as any,
        priority: formData.priority,
        methodology: formData.methodology,
        complexity_score: formData.complexity_score,
        estimated_roi: formData.estimated_roi || null,
        target_date: formData.target_date || null,
        created_by: user?.id || "demo-user-id",
        start_date: formData.status !== "ideacao" ? new Date().toISOString().split('T')[0] : null,
        actual_roi: null,
        completed_date: null,
        assigned_architect: null,
        product_owner: null,
        category: formData.category || null,
        expected_impact: formData.expected_impact || null,
        responsible_name: formData.responsible_name || null,
        responsible_email: formData.responsible_email || null,
      });
      
      // Reset form mas mantém dados do usuário
      setFormData({
        name: "",
        description: "",
        category: "",
        expected_impact: "",
        responsible_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || "",
        responsible_email: user?.email || "",
        status: "ideacao",
        priority: 3,
        methodology: "kanban",
        complexity_score: 1,
        estimated_roi: 0,
        target_date: "",
      });
      
      setErrors({});
      onOpenChange(false);
      
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
      toast({
        title: "Erro",
        description: "Falha ao criar projeto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando usuário começa a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const priorityLabels = {
    1: "Muito Baixa",
    2: "Baixa", 
    3: "Média",
    4: "Alta",
    5: "Crítica"
  };

  const priorityColors = {
    1: "bg-green-100 text-green-800",
    2: "bg-blue-100 text-blue-800",
    3: "bg-yellow-100 text-yellow-800",
    4: "bg-orange-100 text-orange-800",
    5: "bg-red-100 text-red-800"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Projeto RPA</DialogTitle>
          <DialogDescription>
            Defina os parâmetros iniciais seguindo as práticas de governança ágil
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4">
            {/* Nome do Projeto */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Projeto *</Label>
              <Input
                id="name"
                placeholder="Ex: Automação de Faturamento"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={errors.name ? "border-red-500" : ""}
                required
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria da sua ideia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automacao">Automação de Processos</SelectItem>
                  <SelectItem value="integracao">Integração de Sistemas</SelectItem>
                  <SelectItem value="modernizacao">Modernização Tecnológica</SelectItem>
                  <SelectItem value="otimizacao">Otimização de Recursos</SelectItem>
                  <SelectItem value="compliance">Compliance e Segurança</SelectItem>
                  <SelectItem value="inovacao">Inovação e Novos Produtos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição da Ideia</Label>
              <Textarea
                id="description"
                placeholder="Descreva sua ideia em detalhes. Inclua o problema que resolve, como funciona e quais benefícios trará para os pacientes 50+ da MedSenior."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
              />
            </div>

            {/* Impacto Esperado */}
            <div className="space-y-2">
              <Label htmlFor="expected_impact">Impacto Esperado</Label>
              <Textarea
                id="expected_impact"
                placeholder="Descreva qual impacto você espera que sua ideia tenha nos pacientes, na operação ou nos resultados da MedSenior."
                value={formData.expected_impact}
                onChange={(e) => handleInputChange("expected_impact", e.target.value)}
                rows={2}
              />
            </div>

            {/* Linha 1: Status e Metodologia */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status Inicial</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: any) => handleInputChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ideacao">Ideação</SelectItem>
                    <SelectItem value="planejamento">Planejamento</SelectItem>
                    <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="methodology">Metodologia</Label>
                <Select 
                  value={formData.methodology} 
                  onValueChange={(value) => handleInputChange("methodology", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kanban">Kanban</SelectItem>
                    <SelectItem value="scrum">Scrum</SelectItem>
                    <SelectItem value="agile">Agile</SelectItem>
                    <SelectItem value="waterfall">Waterfall</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 2: Prioridade e Complexidade */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <div className="flex gap-2 flex-wrap">
                  {[1, 2, 3, 4, 5].map((priority) => (
                    <Badge
                      key={priority}
                      variant={formData.priority === priority ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        formData.priority === priority 
                          ? priorityColors[priority as keyof typeof priorityColors]
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => handleInputChange("priority", priority)}
                    >
                      {priorityLabels[priority as keyof typeof priorityLabels]}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complexity">Complexidade (1-10)</Label>
                <Input
                  id="complexity"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.complexity_score}
                  onChange={(e) => handleInputChange("complexity_score", parseInt(e.target.value) || 1)}
                  className={errors.complexity_score ? "border-red-500" : ""}
                />
                {errors.complexity_score && (
                  <p className="text-sm text-red-500">{errors.complexity_score}</p>
                )}
              </div>
            </div>

            {/* Linha 3: ROI e Data Meta */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roi">ROI Estimado (R$)</Label>
                <Input
                  id="roi"
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="Ex: 50000"
                  value={formData.estimated_roi}
                  onChange={(e) => handleInputChange("estimated_roi", parseFloat(e.target.value) || 0)}
                  className={errors.estimated_roi ? "border-red-500" : ""}
                />
                {errors.estimated_roi && (
                  <p className="text-sm text-red-500">{errors.estimated_roi}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_date">Data Meta</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => handleInputChange("target_date", e.target.value)}
                  className={errors.target_date ? "border-red-500" : ""}
                />
                {errors.target_date && (
                  <p className="text-sm text-red-500">{errors.target_date}</p>
                )}
              </div>
            </div>

            {/* Linha 4: Informações do Responsável */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="responsible_name">Seu Nome</Label>
                <Input
                  id="responsible_name"
                  placeholder="Digite seu nome completo"
                  value={formData.responsible_name}
                  onChange={(e) => handleInputChange("responsible_name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsible_email">Seu Email</Label>
                <Input
                  id="responsible_email"
                  type="email"
                  placeholder="Digite seu email para receber retorno sobre a ideia"
                  value={formData.responsible_email}
                  onChange={(e) => handleInputChange("responsible_email", e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                onOpenChange(false);
                setErrors({});
              }}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.name.trim()}
              className="bg-gradient-primary"
            >
              {isSubmitting ? "Criando..." : "Criar Projeto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;