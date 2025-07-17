
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Clock, 
  PlayCircle, 
  Users, 
  Calendar,
  FileText,
  Save,
  ArrowRight,
  History
} from "lucide-react";

interface ProjectStage {
  id: string;
  name: string;
  status: "completed" | "in_progress" | "pending";
  completedAt?: string;
  assignee?: string;
  duration?: string;
  order: number;
}

interface ProjectStageManagerProps {
  projectId: string;
  currentStage: string;
  stages: ProjectStage[];
  onStageUpdate: (stageId: string, updates: Partial<ProjectStage>) => void;
}

const ProjectStageManager = ({ projectId, currentStage, stages, onStageUpdate }: ProjectStageManagerProps) => {
  const [showStageDialog, setShowStageDialog] = useState(false);
  const [selectedStage, setSelectedStage] = useState<ProjectStage | null>(null);
  const [stageForm, setStageForm] = useState({
    assignedTo: "",
    startDate: "",
    endDate: "",
    responsibleTeam: "",
    improvementPlans: "",
    notes: ""
  });

  const getStageIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "in_progress": return <PlayCircle className="h-4 w-4 text-blue-600" />;
      case "pending": return <Clock className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStageColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const calculateProgress = () => {
    const completedStages = stages.filter(s => s.status === "completed").length;
    return (completedStages / stages.length) * 100;
  };

  const handleStageClick = (stage: ProjectStage) => {
    setSelectedStage(stage);
    setShowStageDialog(true);
  };

  const handleCompleteStage = () => {
    if (selectedStage) {
      onStageUpdate(selectedStage.id, {
        status: "completed",
        completedAt: new Date().toISOString(),
        assignee: stageForm.assignedTo
      });
      setShowStageDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com progresso */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Timeline do Projeto
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Progresso Geral {Math.round(calculateProgress())}%
              </p>
            </div>
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 mr-2" />
              Ver Histórico
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Progress value={calculateProgress()} className="h-3" />
        </CardContent>
      </Card>

      {/* Timeline das etapas */}
      <div className="space-y-4">
        {stages.map((stage, index) => (
          <Card 
            key={stage.id} 
            className={`transition-all cursor-pointer hover:shadow-md ${
              stage.status === "in_progress" ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => handleStageClick(stage)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getStageIcon(stage.status)}
                    <h3 className="font-medium">{stage.name}</h3>
                  </div>
                  
                  <Badge className={getStageColor(stage.status)}>
                    {stage.status === "completed" ? "Concluída" :
                     stage.status === "in_progress" ? "Em andamento" : "Pendente"}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {stage.completedAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Concluído: {new Date(stage.completedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  
                  {stage.assignee && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{stage.assignee}</span>
                    </div>
                  )}
                  
                  {stage.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{stage.duration}</span>
                    </div>
                  )}
                </div>
              </div>

              {stage.status === "in_progress" && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium">
                    Etapa atual em execução
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para gerenciar etapa */}
      <Dialog open={showStageDialog} onOpenChange={setShowStageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Gerenciar Etapa: {selectedStage?.name}
            </DialogTitle>
            <DialogDescription>
              Complete as informações abaixo para avançar na esteira de inovação
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Liderança Responsável *</Label>
                <Select onValueChange={(value) => setStageForm({...stageForm, assignedTo: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione ou gerencie uma liderança" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marcus-leitao">Marcus Leitão</SelectItem>
                    <SelectItem value="daniele">Daniele</SelectItem>
                    <SelectItem value="bruno-souza">Bruno Souza</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsibleTeam">Time Responsável *</Label>
                <Input
                  id="responsibleTeam"
                  value={stageForm.responsibleTeam}
                  onChange={(e) => setStageForm({...stageForm, responsibleTeam: e.target.value})}
                  placeholder="Time que fará a execução"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Prevista de Início *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={stageForm.startDate}
                  onChange={(e) => setStageForm({...stageForm, startDate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data Prevista de Término *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={stageForm.endDate}
                  onChange={(e) => setStageForm({...stageForm, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="improvementPlans">Planos de Melhoria *</Label>
              <Textarea
                id="improvementPlans"
                value={stageForm.improvementPlans}
                onChange={(e) => setStageForm({...stageForm, improvementPlans: e.target.value})}
                placeholder="Planos de evolução e melhoria contínua..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={stageForm.notes}
                onChange={(e) => setStageForm({...stageForm, notes: e.target.value})}
                placeholder="Observações adicionais sobre a etapa..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowStageDialog(false)}>
              Cancelar
            </Button>
            <Button variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Salvar Rascunho
            </Button>
            <Button onClick={handleCompleteStage}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Completar {selectedStage?.name}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectStageManager;
