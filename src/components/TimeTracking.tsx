
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Clock, Calendar, BarChart3 } from "lucide-react";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { useForm } from "react-hook-form";
import { Skeleton } from "@/components/ui/skeleton";

interface TimeTrackingProps {
  projectId: string;
}

const TimeTracking = ({ projectId }: TimeTrackingProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { timeEntries, loading: timeLoading, createTimeEntry } = useTimeEntries();
  const { tasks, loading: tasksLoading } = useProjectTasks(projectId);
  const { register, handleSubmit, reset, setValue } = useForm();

  const projectTimeEntries = timeEntries.filter(entry => 
    tasks.some(task => task.id === entry.task_id)
  );

  const totalHours = projectTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const totalEstimatedHours = tasks.reduce((sum, task) => sum + task.estimated_hours, 0);

  const onSubmit = async (data: any) => {
    try {
      await createTimeEntry({
        ...data,
        user_id: "demo-user-id", // Usando ID demo para desenvolvimento
        hours: parseFloat(data.hours)
      });
      reset();
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Erro ao registrar tempo:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getTaskTitle = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task?.title || "Tarefa não encontrada";
  };

  if (timeLoading || tasksLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Horas Registradas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              {projectTimeEntries.length} registros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-rpa" />
              <CardTitle className="text-sm">Horas Estimadas</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEstimatedHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              Total planejado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              <CardTitle className="text-sm">Eficiência</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalEstimatedHours > 0 ? ((totalHours / totalEstimatedHours) * 100).toFixed(0) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Realizado vs. Estimado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Controle de Horas</h3>
          <p className="text-sm text-muted-foreground">
            Registre o tempo trabalhado nas tarefas
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Registrar Tempo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Registrar Tempo</DialogTitle>
                <DialogDescription>
                  Adicione horas trabalhadas em uma tarefa
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="task_id">Tarefa*</Label>
                  <Select onValueChange={(value) => setValue("task_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a tarefa" />
                    </SelectTrigger>
                    <SelectContent>
                      {tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hours">Horas*</Label>
                    <Input 
                      id="hours" 
                      type="number"
                      step="0.25"
                      min="0.25"
                      max="24"
                      {...register("hours", { required: true })}
                      placeholder="8.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Data*</Label>
                    <Input 
                      id="date" 
                      type="date"
                      {...register("date", { required: true })}
                      defaultValue={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição do Trabalho</Label>
                  <Textarea 
                    id="description" 
                    {...register("description")}
                    placeholder="Descreva o trabalho realizado"
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Registros */}
      <div className="space-y-4">
        {projectTimeEntries.map((entry) => (
          <Card key={entry.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{getTaskTitle(entry.task_id)}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(entry.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {entry.hours}h
                    </span>
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">{entry.hours}h</div>
                </div>
              </div>
            </CardHeader>
            
            {entry.description && (
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">{entry.description}</p>
              </CardContent>
            )}
          </Card>
        ))}

        {projectTimeEntries.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum registro de tempo</h3>
              <p className="text-muted-foreground text-center mb-4">
                Comece registrando as horas trabalhadas nas tarefas
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Primeiro Registro
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TimeTracking;
