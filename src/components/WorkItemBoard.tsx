
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Bug, 
  Target, 
  CheckCircle, 
  Clock, 
  User,
  MoreVertical,
  Plus
} from "lucide-react";
import { Project } from "@/hooks/useProjects";

interface WorkItem {
  id: string;
  title: string;
  type: "user-story" | "task" | "bug" | "feature";
  state: "new" | "active" | "resolved" | "closed";
  assignedTo?: string;
  priority: 1 | 2 | 3 | 4;
  effort?: number;
  tags: string[];
}

interface WorkItemBoardProps {
  project: Project;
}

const WorkItemBoard = ({ project }: WorkItemBoardProps) => {
  const [workItems] = useState<WorkItem[]>([
    {
      id: "1",
      title: "Implementar autenticação de usuário",
      type: "user-story",
      state: "active",
      assignedTo: "João Silva",
      priority: 2,
      effort: 8,
      tags: ["backend", "security"]
    },
    {
      id: "2", 
      title: "Corrigir bug no formulário de login",
      type: "bug",
      state: "new",
      priority: 1,
      effort: 3,
      tags: ["frontend", "hotfix"]
    },
    {
      id: "3",
      title: "Criar testes unitários",
      type: "task", 
      state: "resolved",
      assignedTo: "Maria Santos",
      priority: 3,
      effort: 5,
      tags: ["testing"]
    }
  ]);

  const columns = [
    { id: "new", title: "Novo", color: "bg-blue-100 border-blue-200" },
    { id: "active", title: "Ativo", color: "bg-yellow-100 border-yellow-200" },
    { id: "resolved", title: "Resolvido", color: "bg-green-100 border-green-200" },
    { id: "closed", title: "Fechado", color: "bg-gray-100 border-gray-200" }
  ];

  const getWorkItemIcon = (type: string) => {
    switch (type) {
      case "user-story": return Target;
      case "task": return CheckCircle;
      case "bug": return Bug;
      case "feature": return Plus;
      default: return CheckCircle;
    }
  };

  const getWorkItemColor = (type: string) => {
    switch (type) {
      case "user-story": return "bg-blue-500";
      case "task": return "bg-green-500";
      case "bug": return "bg-red-500";
      case "feature": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return "text-red-600 bg-red-50";
      case 2: return "text-orange-600 bg-orange-50";
      case 3: return "text-yellow-600 bg-yellow-50";
      case 4: return "text-green-600 bg-green-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Board - {project.name}</h2>
          <p className="text-muted-foreground">Work Items e acompanhamento de tarefas</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Work Item
        </Button>
      </div>

      {/* Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            {/* Column Header */}
            <div className={`p-4 rounded-lg border-2 ${column.color}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{column.title}</h3>
                <Badge variant="secondary">
                  {workItems.filter(item => item.state === column.id).length}
                </Badge>
              </div>
            </div>

            {/* Work Items */}
            <div className="space-y-3 min-h-[400px]">
              {workItems
                .filter(item => item.state === column.id)
                .map((item) => {
                  const Icon = getWorkItemIcon(item.type);
                  return (
                    <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${getWorkItemColor(item.type)}`}>
                              <Icon className="h-3 w-3 text-white" />
                            </div>
                            <CardTitle className="text-sm">#{item.id}</CardTitle>
                            <Badge 
                              variant="outline" 
                              className={getPriorityColor(item.priority)}
                            >
                              P{item.priority}
                            </Badge>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <p className="text-sm font-medium leading-tight">{item.title}</p>
                        
                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {item.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Assignee & Effort */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          {item.assignedTo && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>{item.assignedTo}</span>
                            </div>
                          )}
                          {item.effort && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{item.effort}h</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkItemBoard;
