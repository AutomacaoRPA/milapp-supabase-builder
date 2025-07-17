import { useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
  ArrowRight,
  Plus,
  GripVertical
} from "lucide-react";
import { Project } from "@/hooks/useProjects";
import { useProjectTasks } from "@/hooks/useProjectTasks";
import { toast } from "sonner";

interface ProjectKanbanProps {
  projects: Project[];
  onProjectUpdate?: (projectId: string, updates: Partial<Project>) => void;
  onProjectSelect?: (project: Project) => void;
}

const statusColumns = [
  { 
    id: "ideacao", 
    label: "Backlog", 
    color: "border-l-4 border-l-red-500",
    count: 0
  },
  { 
    id: "planejamento", 
    label: "Priorizado", 
    color: "border-l-4 border-l-yellow-500",
    count: 1
  },
  { 
    id: "desenvolvimento", 
    label: "Em Desenvolvimento", 
    color: "border-l-4 border-l-blue-500",
    count: 2
  },
  { 
    id: "homologacao", 
    label: "Validação", 
    color: "border-l-4 border-l-green-500",
    count: 0
  },
  { 
    id: "concluido", 
    label: "Concluído", 
    color: "border-l-4 border-l-gray-500",
    count: 0
  }
];

const ProjectKanban = ({ projects, onProjectUpdate, onProjectSelect }: ProjectKanbanProps) => {
  const [newTaskDialogOpen, setNewTaskDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [newTaskData, setNewTaskData] = useState({
    title: "",
    description: "",
    type: "development",
    priority: 3,
    estimated_hours: 0
  });

  const { createTask } = useProjectTasks();

  const projectsByStatus = useMemo(() => {
    return statusColumns.reduce((acc, column) => {
      acc[column.id] = projects.filter(project => project.status === column.id);
      return acc;
    }, {} as Record<string, Project[]>);
  }, [projects]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const project = projects.find(p => p.id === draggableId);
    if (!project) return;

    // Mapear os IDs das colunas para os status do projeto
    const statusMapping: Record<string, string> = {
      'ideacao': 'ideacao',
      'planejamento': 'planejamento', 
      'desenvolvimento': 'desenvolvimento',
      'homologacao': 'homologacao',
      'concluido': 'concluido'
    };

    const newStatus = statusMapping[destination.droppableId];
    if (newStatus && onProjectUpdate) {
      onProjectUpdate(project.id, { status: newStatus as any });
      toast.success(`Projeto movido para ${statusColumns.find(c => c.id === destination.droppableId)?.label}`);
    }
  };

  const handleCreateTask = async () => {
    if (!selectedProjectId || !newTaskData.title.trim()) {
      toast.error("Preencha pelo menos o título da task");
      return;
    }

    try {
      await createTask({
        project_id: selectedProjectId,
        title: newTaskData.title,
        description: newTaskData.description,
        type: newTaskData.type as any,
        priority: newTaskData.priority,
        estimated_hours: newTaskData.estimated_hours,
        status: 'todo',
        created_by: 'demo-user-id' // TODO: Usar auth.uid() quando autenticação estiver configurada
      });

      setNewTaskDialogOpen(false);
      setNewTaskData({
        title: "",
        description: "",
        type: "development",
        priority: 3,
        estimated_hours: 0
      });
      toast.success("Task criada com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar task");
    }
  };

  const getPriorityColor = (priority: number | null) => {
    if (!priority) return "text-muted-foreground";
    if (priority >= 4) return "text-destructive";
    if (priority >= 3) return "text-rpa";
    return "text-accent";
  };

  const getPriorityIcon = (priority: number | null) => {
    if (!priority || priority < 4) return AlertTriangle;
    return priority >= 4 ? XCircle : CheckCircle;
  };

  const getPriorityLabel = (priority: number | null) => {
    if (!priority) return "Não definida";
    const labels = ["", "Muito Baixa", "Baixa", "Média", "Alta", "Crítica"];
    return labels[priority] || "Não definida";
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "Não definido";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Não definida";
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calculateProgress = (project: Project) => {
    const statusProgress = {
      ideacao: 10,
      planejamento: 25,
      desenvolvimento: 60,
      homologacao: 85,
      producao: 95,
      suspenso: 0,
      concluido: 100
    };
    return statusProgress[project.status] || 0;
  };

  const isOverdue = (project: Project) => {
    if (!project.target_date || project.status === "concluido") return false;
    return new Date(project.target_date) < new Date();
  };

  const getDaysUntilTarget = (project: Project) => {
    if (!project.target_date) return null;
    const target = new Date(project.target_date);
    const today = new Date();
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="w-full overflow-x-auto bg-gray-50 p-4">
          <div className="flex gap-1 min-w-max" style={{ minWidth: 'fit-content' }}>
            {statusColumns.map((column) => (
              <div key={column.id} className="flex flex-col w-80 bg-white border border-gray-200">
                {/* Header da Coluna */}
                <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                  <h3 className="font-medium text-sm text-gray-700">{column.label}</h3>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                      {projectsByStatus[column.id]?.length || 0}
                    </span>
                    <Dialog open={newTaskDialogOpen} onOpenChange={setNewTaskDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 w-6 p-0"
                          onClick={() => setSelectedProjectId(projectsByStatus[column.id]?.[0]?.id || "")}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>
                </div>
                
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[600px] p-2 space-y-2 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-gray-50'
                      }`}
                    >
                      {projectsByStatus[column.id]?.map((project, index) => {
                        const progress = calculateProgress(project);
                        const daysUntilTarget = getDaysUntilTarget(project);
                        
                        return (
                          <Draggable key={project.id} draggableId={project.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`bg-white border ${column.color} rounded shadow-sm transition-all ${
                                  snapshot.isDragging ? 'shadow-lg rotate-2' : 'hover:shadow-md'
                                } cursor-pointer p-3`}
                                onClick={() => onProjectSelect?.(project)}
                              >
                                {/* Drag Handle */}
                                <div 
                                  {...provided.dragHandleProps}
                                  className="flex items-center justify-between mb-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                    <span className="text-red-600 text-sm font-medium">🐞 {Math.floor(Math.random() * 90000) + 10000}</span>
                                  </div>
                                  <MoreVertical className="h-4 w-4 text-gray-400" />
                                </div>

                                {/* Header do Card */}
                                <div className="flex items-start gap-2 mb-2">
                                  <div className="flex-1">
                                    <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                                      {project.name.toUpperCase()}
                                    </h4>
                                    
                                    {project.description && (
                                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                        {project.description}
                                      </p>
                                    )}

                                    {/* Status Badge */}
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        ● {column.label}
                                      </span>
                                    </div>

                                    {/* Assignee */}
                                    <div className="flex items-center gap-2 mb-2">
                                      <Avatar className="h-5 w-5">
                                        <AvatarFallback className="text-xs bg-blue-500 text-white">
                                          {project.created_by?.charAt(0)?.toUpperCase() || "?"}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs text-gray-600">
                                        {project.assigned_architect || project.created_by || "Não atribuído"}
                                      </span>
                                    </div>

                                    {/* Tags/Labels */}
                                    <div className="flex items-center gap-1 mb-2">
                                      <Badge className="bg-blue-600 text-white text-xs px-2 py-1">
                                        PROJETO
                                      </Badge>
                                      {project.priority && project.priority >= 4 && (
                                        <Badge variant="destructive" className="text-xs px-2 py-1">
                                          ALTA PRIORIDADE
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Progress */}
                                    <div className="mb-2">
                                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                        <span>Progresso</span>
                                        <span>{progress}%</span>
                                      </div>
                                      <Progress value={progress} className="h-2" />
                                    </div>

                                    {/* Target Date */}
                                    {project.target_date && (
                                      <div className={`text-xs mb-2 flex items-center gap-1 ${
                                        isOverdue(project) ? 'text-red-600' : 'text-gray-600'
                                      }`}>
                                        <Calendar className="h-3 w-3" />
                                        <span className="font-medium">Meta:</span> {formatDate(project.target_date)}
                                        {daysUntilTarget !== null && (
                                          <span className={`ml-1 ${daysUntilTarget < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            ({daysUntilTarget < 0 ? 'Atrasado' : `${daysUntilTarget} dias`})
                                          </span>
                                        )}
                                      </div>
                                    )}

                                    {/* ROI Estimate */}
                                    {project.estimated_roi && (
                                      <div className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        <span className="font-medium">ROI:</span> {formatCurrency(project.estimated_roi)}
                                      </div>
                                    )}

                                    {/* Methodology */}
                                    {project.methodology && (
                                      <div className="mt-2 text-xs text-gray-600">
                                        <span className="font-medium">Metodologia:</span>
                                        <span className="text-purple-600 ml-1 uppercase">{project.methodology}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      
                      {provided.placeholder}

                      {/* Botão Add New Item aprimorado */}
                      <Dialog open={newTaskDialogOpen} onOpenChange={setNewTaskDialogOpen}>
                        <DialogTrigger asChild>
                          <div 
                            className="p-4 border-2 border-dashed border-gray-300 rounded text-center hover:bg-gray-100 hover:border-blue-400 cursor-pointer transition-colors"
                            onClick={() => setSelectedProjectId(projectsByStatus[column.id]?.[0]?.id || "")}
                          >
                            <Plus className="h-5 w-5 mx-auto mb-1 text-gray-400" />
                            <span className="text-gray-500 text-sm font-medium">Adicionar Task</span>
                          </div>
                        </DialogTrigger>
                      </Dialog>
                      
                      {/* Empty State */}
                      {projectsByStatus[column.id]?.length === 0 && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          <Target className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p>Nenhum projeto nesta coluna</p>
                          <p className="text-xs mt-1">Arraste projetos para cá</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>

      {/* Dialog para criar nova task */}
      <Dialog open={newTaskDialogOpen} onOpenChange={setNewTaskDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Criar Nova Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Projeto</label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Título</label>
              <Input
                value={newTaskData.title}
                onChange={(e) => setNewTaskData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Digite o título da task"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={newTaskData.description}
                onChange={(e) => setNewTaskData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva os detalhes da task"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <Select value={newTaskData.type} onValueChange={(value) => setNewTaskData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="development">Desenvolvimento</SelectItem>
                    <SelectItem value="testing">Teste</SelectItem>
                    <SelectItem value="documentation">Documentação</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="research">Pesquisa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Prioridade</label>
                <Select 
                  value={newTaskData.priority.toString()} 
                  onValueChange={(value) => setNewTaskData(prev => ({ ...prev, priority: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Muito Baixa</SelectItem>
                    <SelectItem value="2">Baixa</SelectItem>
                    <SelectItem value="3">Média</SelectItem>
                    <SelectItem value="4">Alta</SelectItem>
                    <SelectItem value="5">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Estimativa (horas)</label>
              <Input
                type="number"
                value={newTaskData.estimated_hours}
                onChange={(e) => setNewTaskData(prev => ({ ...prev, estimated_hours: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
                step="0.5"
              />
            </div>

            <div className="flex gap-2 justify-end">
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
