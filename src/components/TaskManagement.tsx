import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Clock, User, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { useProjectTasks, ProjectTask } from "@/hooks/useProjectTasks";
import { useForm } from "react-hook-form";
import { Skeleton } from "@/components/ui/skeleton";

interface TaskManagementProps {
  projectId: string;
}

const TaskManagement = ({ projectId }: TaskManagementProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { tasks, loading, createTask, updateTask } = useProjectTasks(projectId);
  const { register, handleSubmit, reset, setValue, watch } = useForm();

  const taskTypes = [
    { value: "development", label: "Desenvolvimento", color: "bg-primary/10 text-primary" },
    { value: "documentation", label: "Documentação", color: "bg-blue-100 text-blue-800" },
    { value: "testing", label: "Testes", color: "bg-orange-100 text-orange-800" },
    { value: "review", label: "Revisão", color: "bg-purple-100 text-purple-800" }
  ];

  const taskStatuses = [
    { value: "todo", label: "A Fazer", color: "bg-gray-100 text-gray-800" },
    { value: "in_progress", label: "Em Progresso", color: "bg-yellow-100 text-yellow-800" },
    { value: "review", label: "Em Revisão", color: "bg-orange-100 text-orange-800" },
    { value: "done", label: "Concluído", color: "bg-green-100 text-green-800" }
  ];

  const priorities = [
    { value: 1, label: "Muito Baixa" },
    { value: 2, label: "Baixa" },
    { value: 3, label: "Média" },
    { value: 4, label: "Alta" },
    { value: 5, label: "Crítica" }
  ];

  const onSubmit = async (data: any) => {
    try {
      await createTask({
        ...data,
        project_id: projectId,
        created_by: "demo-user-id", // Usando ID demo para desenvolvimento
        priority: parseInt(data.priority),
        estimated_hours: parseFloat(data.estimated_hours) || 0,
        actual_hours: 0
      });
      reset();
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    const updates: Partial<ProjectTask> = { status: newStatus as any };
    if (newStatus === "done") {
      updates.completed_at = new Date().toISOString();
    }
    await updateTask(taskId, updates);
  };

  const getTypeConfig = (type: string) => {
    return taskTypes.find(t => t.value === type) || taskTypes[0];
  };

  const getStatusConfig = (status: string) => {
    return taskStatuses.find(s => s.value === status) || taskStatuses[0];
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return "text-destructive";
    if (priority >= 3) return "text-rpa";
    return "text-accent";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gestão de Tarefas</h3>
          <p className="text-sm text-muted-foreground">
            {tasks.length} tarefas • {tasks.filter(t => t.status === "done").length} concluídas
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle>Criar Nova Tarefa</DialogTitle>
                <DialogDescription>
                  Adicione uma nova tarefa ao projeto
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título*</Label>
                    <Input 
                      id="title" 
                      {...register("title", { required: true })}
                      placeholder="Título da tarefa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo*</Label>
                    <Select onValueChange={(value) => setValue("type", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {taskTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea 
                    id="description" 
                    {...register("description")}
                    placeholder="Descreva a tarefa em detalhes"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select onValueChange={(value) => setValue("priority", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value.toString()}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated_hours">Horas Estimadas</Label>
                    <Input 
                      id="estimated_hours" 
                      type="number"
                      step="0.5"
                      min="0"
                      {...register("estimated_hours")}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Data Limite</Label>
                    <Input 
                      id="due_date" 
                      type="date"
                      {...register("due_date")}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar Tarefa</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Tarefas */}
      <div className="space-y-4">
        {tasks.map((task) => {
          const typeConfig = getTypeConfig(task.type);
          const statusConfig = getStatusConfig(task.status);
          const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";
          
          return (
            <Card key={task.id} className={`transition-all hover:shadow-md ${isOverdue ? "border-destructive/50" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{task.title}</CardTitle>
                      {isOverdue && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={typeConfig.color} variant="outline">
                        {typeConfig.label}
                      </Badge>
                      <Badge className={statusConfig.color} variant="outline">
                        {statusConfig.label}
                      </Badge>
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        Prioridade {task.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  <Select
                    value={task.status}
                    onValueChange={(value) => handleStatusChange(task.id, value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {taskStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {task.description && (
                  <CardDescription>{task.description}</CardDescription>
                )}
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{task.estimated_hours}h estimadas • {task.actual_hours}h realizadas</span>
                  </div>
                  
                  {task.due_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className={isOverdue ? "text-destructive font-medium" : ""}>
                        {new Date(task.due_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  
                  {task.assigned_to && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Atribuída</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {tasks.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma tarefa encontrada</h3>
              <p className="text-muted-foreground text-center mb-4">
                Comece criando a primeira tarefa para este projeto
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Tarefa
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TaskManagement;
