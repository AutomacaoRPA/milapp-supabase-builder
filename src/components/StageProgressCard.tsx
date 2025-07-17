
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle2, PlayCircle } from "lucide-react";

interface Stage {
  id: string;
  name: string;
  status: "completed" | "in_progress" | "pending";
  order: number;
  completedAt?: string;
  assignee?: string;
}

interface StageProgressCardProps {
  stages: Stage[];
  currentStage: number;
}

const StageProgressCard = ({ stages, currentStage }: StageProgressCardProps) => {
  const completedStages = stages.filter(stage => stage.status === "completed").length;
  const progressPercentage = Math.round((completedStages / stages.length) * 100);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return CheckCircle2;
      case "in_progress": return PlayCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600";
      case "in_progress": return "text-primary";
      default: return "text-muted-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-primary/10 text-primary";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timeline do Projeto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Progresso Geral</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="space-y-3">
          {stages.map((stage) => {
            const StatusIcon = getStatusIcon(stage.status);
            const isCurrentStage = stage.status === "in_progress";
            
            return (
              <div key={stage.id} className={`flex items-center gap-3 p-3 rounded-lg border ${isCurrentStage ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <StatusIcon className={`h-4 w-4 ${getStatusColor(stage.status)}`} />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{stage.name}</span>
                    <Badge className={getStatusBadge(stage.status)}>
                      {stage.status === "completed" ? "Concluída" : 
                       stage.status === "in_progress" ? "Em andamento" : "Pendente"}
                    </Badge>
                  </div>
                  
                  {isCurrentStage && (
                    <p className="text-xs text-muted-foreground">Etapa atual em execução</p>
                  )}
                  
                  {stage.completedAt && (
                    <p className="text-xs text-muted-foreground">
                      Concluída em {new Date(stage.completedAt).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default StageProgressCard;
