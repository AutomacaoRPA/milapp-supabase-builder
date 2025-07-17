
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { User, Calendar, Target, Edit, Tag } from "lucide-react";
import { useState } from "react";

interface ProjectDescriptionCardProps {
  project: {
    name: string;
    created_by: string;
    created_at?: string;
    description?: string;
    assigned_architect?: string;
  };
  onUpdateDescription?: (description: string) => void;
}

const ProjectDescriptionCard = ({ project, onUpdateDescription }: ProjectDescriptionCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(project.description || "");

  const handleSave = () => {
    onUpdateDescription?.(editedDescription);
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <Badge variant="outline" className="mt-2">Priorização</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Guia da Esteira
          </Button>
          <Button variant="outline" size="sm">
            Dashboard
          </Button>
        </div>
      </div>

      {/* Project Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proponente</p>
                <p className="font-medium">{project.created_by}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Área Responsável</p>
                <p className="font-medium">{project.assigned_architect || "A Definir"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-rpa/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-rpa" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Criação</p>
                <p className="font-medium">
                  {project.created_at ? new Date(project.created_at).toLocaleDateString('pt-BR') : "29/06/2025"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Impact Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Impacto Esperado</p>
              <p className="font-medium">Melhoria no atendimento aos pacientes 50+ da MedSenior</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Labels Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Labels do Projeto</CardTitle>
            <Button variant="outline" size="sm">
              <Tag className="h-4 w-4 mr-2" />
              Gerenciar Labels
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Original Description */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Descrição Original (Proponente)</CardTitle>
              <Badge variant="outline">Original</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {project.description}
          </p>
        </CardContent>
      </Card>

      {/* Refined Description */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Descrição Refinada (Time de Inovação)</CardTitle>
              <Badge variant="outline">Refinada</Badge>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>Salvar</Button>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {editedDescription || project.description}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDescriptionCard;
