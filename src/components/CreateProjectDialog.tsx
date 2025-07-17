
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/hooks/useProjects";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateProject: (project: Omit<Project, "id" | "created_at" | "updated_at">) => void;
}

const CreateProjectDialog = ({ open, onOpenChange, onCreateProject }: CreateProjectDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "ideacao" as const,
    priority: 3,
    methodology: "kanban",
    complexity_score: 1,
    estimated_roi: 0,
    target_date: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateProject({
        ...formData,
        created_by: "temp-user-id", // Será substituído por auth real
        start_date: formData.status !== "ideacao" ? new Date().toISOString().split('T')[0] : null,
        target_date: formData.target_date || null,
        estimated_roi: formData.estimated_roi || null,
        actual_roi: null,
        completed_date: null,
        assigned_architect: null,
        product_owner: null,
      });
      
      // Reset form
      setFormData({
        name: "",
        description: "",
        status: "ideacao",
        priority: 3,
        methodology: "kanban",
        complexity_score: 1,
        estimated_roi: 0,
        target_date: "",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityLabels = {
    1: "Muito Baixa",
    2: "Baixa", 
    3: "Média",
    4: "Alta",
    5: "Crítica"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o objetivo e escopo do projeto..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            {/* Linha 1: Status e Metodologia */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status Inicial</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
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
                  onValueChange={(value) => setFormData({ ...formData, methodology: value })}
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
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((priority) => (
                    <Badge
                      key={priority}
                      variant={formData.priority === priority ? "default" : "outline"}
                      className={`cursor-pointer ${
                        priority >= 4 ? "hover:bg-destructive hover:text-destructive-foreground" :
                        priority >= 3 ? "hover:bg-rpa hover:text-rpa-foreground" :
                        "hover:bg-accent hover:text-accent-foreground"
                      }`}
                      onClick={() => setFormData({ ...formData, priority })}
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
                  onChange={(e) => setFormData({ ...formData, complexity_score: parseInt(e.target.value) || 1 })}
                />
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
                  onChange={(e) => setFormData({ ...formData, estimated_roi: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_date">Data Meta</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting ? "Criando..." : "Criar Projeto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
