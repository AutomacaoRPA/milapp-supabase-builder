import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, Play, Pause, Stop } from "lucide-react";

interface TimeLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
  onLogTime: (timeLog: {
    task_id: string;
    start_time: string;
    end_time: string;
    duration: number;
    description: string;
    activity_type: string;
  }) => void;
}

const TimeLogModal: React.FC<TimeLogModalProps> = ({
  isOpen,
  onClose,
  taskId,
  taskTitle,
  onLogTime,
}) => {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [description, setDescription] = useState("");
  const [activityType, setActivityType] = useState("development");
  const [manualDuration, setManualDuration] = useState("");

  const startTimer = () => {
    setStartTime(new Date());
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const stopTimer = () => {
    const end = new Date();
    setEndTime(end);
    setIsTimerRunning(false);
  };

  const calculateDuration = () => {
    if (startTime && endTime) {
      return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    }
    return 0;
  };

  const handleSubmit = () => {
    const duration = manualDuration ? parseInt(manualDuration) : calculateDuration();
    
    if (duration > 0) {
      onLogTime({
        task_id: taskId,
        start_time: startTime?.toISOString() || new Date().toISOString(),
        end_time: endTime?.toISOString() || new Date().toISOString(),
        duration,
        description,
        activity_type: activityType,
      });
      onClose();
      resetForm();
    }
  };

  const resetForm = () => {
    setStartTime(null);
    setEndTime(null);
    setDescription("");
    setActivityType("development");
    setManualDuration("");
    setIsTimerRunning(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log de Tempo - {taskTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Timer Controls */}
          <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-mono">
                {startTime ? formatTime(startTime) : "00:00:00"}
              </div>
              <div className="text-sm text-muted-foreground">Início</div>
            </div>
            
            <div className="flex space-x-2">
              {!isTimerRunning && !startTime && (
                <Button onClick={startTimer} size="sm">
                  <Play className="h-4 w-4 mr-1" />
                  Iniciar
                </Button>
              )}
              
              {isTimerRunning && (
                <>
                  <Button onClick={pauseTimer} variant="outline" size="sm">
                    <Pause className="h-4 w-4 mr-1" />
                    Pausar
                  </Button>
                  <Button onClick={stopTimer} variant="outline" size="sm">
                    <Stop className="h-4 w-4 mr-1" />
                    Parar
                  </Button>
                </>
              )}
            </div>

            {endTime && (
              <div className="text-center">
                <div className="text-2xl font-mono">
                  {formatTime(endTime)}
                </div>
                <div className="text-sm text-muted-foreground">Fim</div>
              </div>
            )}
          </div>

          {/* Duration Display */}
          {(startTime && endTime) && (
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-semibold text-blue-800">
                Duração: {formatDuration(calculateDuration())}
              </div>
            </div>
          )}

          {/* Manual Duration Input */}
          <div className="space-y-2">
            <Label htmlFor="manual-duration">Duração Manual (minutos)</Label>
            <Input
              id="manual-duration"
              type="number"
              placeholder="Ex: 120"
              value={manualDuration}
              onChange={(e) => setManualDuration(e.target.value)}
            />
          </div>

          {/* Activity Type */}
          <div className="space-y-2">
            <Label htmlFor="activity-type">Tipo de Atividade</Label>
            <Select value={activityType} onValueChange={setActivityType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Desenvolvimento</SelectItem>
                <SelectItem value="testing">Testes</SelectItem>
                <SelectItem value="review">Code Review</SelectItem>
                <SelectItem value="meeting">Reunião</SelectItem>
                <SelectItem value="research">Pesquisa</SelectItem>
                <SelectItem value="documentation">Documentação</SelectItem>
                <SelectItem value="debugging">Debug</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição da Atividade</Label>
            <Textarea
              id="description"
              placeholder="Descreva o que foi feito..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!description || (!startTime && !manualDuration)}
          >
            <Clock className="h-4 w-4 mr-2" />
            Salvar Log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimeLogModal; 