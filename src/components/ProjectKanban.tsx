import { useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  MoreVertical, 
  Calendar, 
  Users, 
  Target, 
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  GripVertical,
  GitBranch,
  MessageSquare,
  FileText,
  Code,
  Bug,
  Zap,
  Star,
  Eye,
  Edit
} from "lucide-react";
import { Project } from "@/hooks/useProjects";
import { useProjectTasks, ProjectTask } from "@/hooks/useProjectTasks";
import { toast } from "sonner";

interface ProjectKanbanProps {
  projects: Project[];
  onProjectUpdate?: (projectId: string, updates: Partial<Project>) => void;
  onProjectSelect?: (project: Project) => void;
}

// Colunas otimizadas para desenvolvimento
const taskStatusColumns = [
  { 
    id: "todo", 
    label: "Backlog", 
    color: "bg-slate-50 border-l-4 border-l-slate-400",
    bgColor: "bg-slate-50",
    count: 0,
    icon: FileText
  },
  { 
    id: "in_progress", 
    label: "Em Progresso", 
    color: "bg-blue-50 border-l-4 border-l-blue-500",
    bgColor: "bg-blue-50", 
    count: 0,
    icon: Code
  },
  { 
    id: "review", 
    label: "Code Review", 
    color: "bg-yellow-50 border-l-4 border-l-yellow-500",
    bgColor: "bg-yellow-50",
    count: 0,
    icon: Eye
  },
  { 
    id: "testing", 
    label: "Testing", 
    color: "bg-purple-50 border-l-4 border-l-purple-500", 
    bgColor: "bg-purple-50",
    count: 0,
    icon: Bug
  },
  { 
    id: "done", 
    label: "Concluído", 
    color: "bg-green-50 border-l-4 border-l-green-500",
    bgColor: "bg-green-50",
    count: 0,
    icon: CheckCircle
  }
];

const taskTypes = [
  { value: "feature", label: "Feature", icon: Star, color: "bg-blue-100 text-blue-800" },
  { value: "bug", label: "Bug", icon: Bug, color: "bg-red-100 text-red-800" },
  { value: "improvement", label: "Melhoria", icon: TrendingUp, color: "bg-green-100 text-green-800" },
  { value: "documentation", label: "Documentação", icon: FileText, color: "bg-purple-100 text-purple-800" },
  { value: "hotfix", label: "Hotfix", icon: Zap, color: "bg-orange-100 text-orange-800" }
];

const priorityLevels = [
  { value: 1, label: "Muito Baixa", color: "text-gray-600" },
  { value: 2, label: "Baixa", color: "text-green-600" },
  { value: 3, label: "Média", color: "text-yellow-600" },
  { value: 4, label: "Alta", color: "text-orange-600" },
  { value: 5, label: "Crítica", color: "text-red-600" }
];

const ProjectKanban = ({ projects, onProjectUpdate, onProjectSelect }: ProjectKanbanProps) => {
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedColumnId, setSelectedColumnId] = useState<string>("");
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [newTaskData, setNewTaskData] = useState({
    title: "",
    description: "",
    type: "feature",
    priority: 3,
    estimated_hours: 0
  });

  const { createTask, updateTask, fetchTasks } = useProjectTasks();

  const tasksByStatus = useMemo(() => {
    return taskStatusColumns.reduce((acc, column) => {
      acc[column.id] = tasks.filter(task => task.status === column.id);
      return acc;
    }, {} as Record<string, ProjectTask[]>);
  }, [tasks]);

  // Carregar tasks quando um projeto for selecionado
  const selectedProject = projects[0]; // Para demo, usar o primeiro projeto

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    const newStatus = destination.droppableId;
    
    try {
      await updateTask(task.id, { status: newStatus as any });
      
      // Atualizar estado local
      setTasks(prevTasks => 
        prevTasks.map(t => 
          t.id === task.id ? { ...t, status: newStatus as any } : t
        )
      );
      
      const columnLabel = taskStatusColumns.find(c => c.id === destination.droppableId)?.label;
      toast.success(`Task movida para ${columnLabel}`);
    } catch (error) {
      toast.error("Erro ao mover task");
    }
  };

  const handleCreateTask = async () => {
    if (!selectedProject || !newTaskData.title.trim()) {
      toast.error("Preencha pelo menos o título da task");
      return;
    }

    try {
      const newTask = await createTask({
        project_id: selectedProject.id,
        title: newTaskData.title,
        description: newTaskData.description,
        type: newTaskData.type as any,
        priority: newTaskData.priority,
        estimated_hours: newTaskData.estimated_hours,
        status: selectedColumnId as any || 'todo',
        created_by: 'demo-user-id' // TODO: Usar auth.uid() quando autenticação estiver configurada
      });

      // Atualizar estado local
      if (newTask) {
        setTasks(prevTasks => [...prevTasks, newTask]);
      }

      setNewTaskDialogOpen(false);
      setNewTaskData({
        title: "",
        description: "",
        type: "feature",
        priority: 3,
        estimated_hours: 0
      });
      toast.success("Task criada com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar task");
    }
  };

  const handleOpenCreateDialog = (columnId: string) => {
    setSelectedColumnId(columnId);
    setNewTaskDialogOpen(true);
  };

  const getPriorityInfo = (priority: number | null) => {
    return priorityLevels.find(p => p.value === priority) || { 
      value: 3, 
      label: "Média", 
      color: "text-yellow-600" 
    };
  };

  const getTaskTypeInfo = (type: string) => {
    return taskTypes.find(t => t.value === type) || taskTypes[0];
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Não definida";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const generateTaskId = () => {
    return Math.floor(Math.random() * 90000) + 10000;
  };

  const isOverdue = (task: ProjectTask) => {
    if (!task.due_date || task.status === "done") return false;
    return new Date(task.due_date) < new Date();
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="w-full h-[calc(100vh-200px)] bg-background">
          {/* Header do Board */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Development Board</h2>
              {selectedProject && (
                <Badge variant="outline">{selectedProject.name}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleOpenCreateDialog("todo")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Task
              </Button>
            </div>
          </div>

          {/* Board Columns */}
          <div className="flex gap-0 h-full overflow-x-auto">
            {taskStatusColumns.map((column) => {
              const Icon = column.icon;
              const columnTasks = tasksByStatus[column.id] || [];
              
              return (
                <div key={column.id} className="flex flex-col w-80 min-w-80 border-r border-border">
                  {/* Column Header */}
                  <div className={`flex items-center justify-between p-4 ${column.bgColor} border-b`}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <h3 className="font-medium text-sm">{column.label}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {columnTasks.length}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => handleOpenCreateDialog(column.id)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 p-3 space-y-3 overflow-y-auto transition-colors ${
                          snapshot.isDraggingOver ? 'bg-blue-50' : column.bgColor
                        }`}
                        style={{ minHeight: '500px' }}
                      >
                        {columnTasks.map((task, index) => {
                          const taskType = getTaskTypeInfo(task.type);
                          const priorityInfo = getPriorityInfo(task.priority);
                          const TaskTypeIcon = taskType.icon;
                          
                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`transition-all hover:shadow-md cursor-pointer ${
                                    snapshot.isDragging ? 'shadow-lg rotate-1' : ''
                                  } ${isOverdue(task) ? 'border-red-300 bg-red-50' : 'bg-white'}`}
                                >
                                  <CardContent className="p-3">
                                    {/* Drag Handle */}
                                    <div 
                                      {...provided.dragHandleProps}
                                      className="flex items-center justify-between mb-3"
                                    >
                                      <div className="flex items-center gap-2">
                                        <GripVertical className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm font-mono text-gray-500">
                                          ID #{generateTaskId()}
                                        </span>
                                      </div>
                                      <MoreVertical className="h-4 w-4 text-gray-400" />
                                    </div>

                                    {/* Task Title */}
                                    <h4 className="font-medium text-sm mb-2 line-clamp-2">
                                      {task.title}
                                    </h4>

                                    {/* Task Description */}
                                    {task.description && (
                                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                                        {task.description}
                                      </p>
                                    )}

                                    {/* Task Type & Priority */}
                                    <div className="flex items-center gap-2 mb-3">
                                      <Badge className={`text-xs ${taskType.color}`}>
                                        <TaskTypeIcon className="h-3 w-3 mr-1" />
                                        {taskType.label}
                                      </Badge>
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs ${priorityInfo.color}`}
                                      >
                                        {priorityInfo.label}
                                      </Badge>
                                    </div>

                                    {/* Task Meta */}
                                    <div className="space-y-2">
                                      {/* Assignee */}
                                      {task.assigned_to && (
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-5 w-5">
                                            <AvatarFallback className="text-xs">
                                              {task.assigned_to.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-xs text-gray-600">
                                            {task.assigned_to}
                                          </span>
                                        </div>
                                      )}

                                      {/* Due Date */}
                                      {task.due_date && (
                                        <div className={`flex items-center gap-1 text-xs ${
                                          isOverdue(task) ? 'text-red-600' : 'text-gray-600'
                                        }`}>
                                          <Calendar className="h-3 w-3" />
                                          <span>{formatDate(task.due_date)}</span>
                                          {isOverdue(task) && (
                                            <AlertTriangle className="h-3 w-3 text-red-600" />
                                          )}
                                        </div>
                                      )}

                                      {/* Estimated Hours */}
                                      {task.estimated_hours && task.estimated_hours > 0 && (
                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                          <Clock className="h-3 w-3" />
                                          <span>{task.estimated_hours}h estimadas</span>
                                        </div>
                                      )}

                                      {/* Actual Hours */}
                                      {task.actual_hours && task.actual_hours > 0 && (
                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                          <Target className="h-3 w-3" />
                                          <span>{task.actual_hours}h trabalhadas</span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between mt-3 pt-2 border-t">
                                      <div className="flex items-center gap-1">
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                          <MessageSquare className="h-3 w-3" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                          <GitBranch className="h-3 w-3" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                          <FileText className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          );
                        })}
                        
                        {provided.placeholder}

                        {/* Add Task Button */}
                        <Button
                          variant="outline"
                          className="w-full border-dashed h-12 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                          onClick={() => handleOpenCreateDialog(column.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Task
                        </Button>
                        
                        {/* Empty State */}
                        {columnTasks.length === 0 && (
                          <div className="text-center py-8 text-gray-400">
                            <Icon className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm">Nenhuma task</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </div>
      </DragDropContext>

      {/* Create Task Dialog */}
      <Dialog open={newTaskDialogOpen} onOpenChange={setNewTaskDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Criar Nova Task</DialogTitle>
            <DialogDescription>
              Adicione uma nova task ao projeto e defina seus detalhes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título da Task *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Implementar autenticação OAuth"
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo de Task</Label>
                <Select 
                  value={newTaskData.type} 
                  onValueChange={(value) => setNewTaskData({ ...newTaskData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva os detalhes da task..."
                value={newTaskData.description}
                onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select 
                  value={newTaskData.priority.toString()} 
                  onValueChange={(value) => setNewTaskData({ ...newTaskData, priority: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityLevels.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value.toString()}>
                        <span className={priority.color}>{priority.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="estimated_hours">Horas Estimadas</Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  placeholder="8"
                  value={newTaskData.estimated_hours}
                  onChange={(e) => setNewTaskData({ ...newTaskData, estimated_hours: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setNewTaskDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTask}>
                Criar Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProjectKanban;