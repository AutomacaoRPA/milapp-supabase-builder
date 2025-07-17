
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

interface ProjectFiltersProps {
  selectedFilters: {
    status: string[];
    priority: string[];
    methodology: string[];
  };
  onFiltersChange: (filters: any) => void;
}

const statusOptions = [
  { value: "ideacao", label: "Ideação", color: "bg-blue-100 text-blue-800" },
  { value: "planejamento", label: "Planejamento", color: "bg-yellow-100 text-yellow-800" },
  { value: "desenvolvimento", label: "Desenvolvimento", color: "bg-primary/10 text-primary" },
  { value: "homologacao", label: "Homologação", color: "bg-orange-100 text-orange-800" },
  { value: "producao", label: "Produção", color: "bg-green-100 text-green-800" },
  { value: "suspenso", label: "Suspenso", color: "bg-red-100 text-red-800" },
  { value: "concluido", label: "Concluído", color: "bg-accent/10 text-accent" }
];

const priorityOptions = [
  { value: "1", label: "Muito Baixa", color: "bg-gray-100 text-gray-800" },
  { value: "2", label: "Baixa", color: "bg-blue-100 text-blue-800" },
  { value: "3", label: "Média", color: "bg-yellow-100 text-yellow-800" },
  { value: "4", label: "Alta", color: "bg-orange-100 text-orange-800" },
  { value: "5", label: "Crítica", color: "bg-red-100 text-red-800" }
];

const methodologyOptions = [
  { value: "scrum", label: "Scrum" },
  { value: "kanban", label: "Kanban" },
  { value: "waterfall", label: "Waterfall" },
  { value: "agile", label: "Agile" }
];

const ProjectFilters = ({ selectedFilters, onFiltersChange }: ProjectFiltersProps) => {
  const toggleFilter = (category: string, value: string) => {
    const currentValues = selectedFilters[category as keyof typeof selectedFilters];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFiltersChange({
      ...selectedFilters,
      [category]: newValues
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: [],
      priority: [],
      methodology: []
    });
  };

  const hasActiveFilters = Object.values(selectedFilters).some(arr => arr.length > 0);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Filtros Avançados</h3>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-2" />
                Limpar Todos
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map(option => (
                  <Badge
                    key={option.value}
                    variant={selectedFilters.status.includes(option.value) ? "default" : "outline"}
                    className={`cursor-pointer hover:opacity-80 ${
                      selectedFilters.status.includes(option.value) ? option.color : ""
                    }`}
                    onClick={() => toggleFilter("status", option.value)}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Prioridade</label>
              <div className="flex flex-wrap gap-2">
                {priorityOptions.map(option => (
                  <Badge
                    key={option.value}
                    variant={selectedFilters.priority.includes(option.value) ? "default" : "outline"}
                    className={`cursor-pointer hover:opacity-80 ${
                      selectedFilters.priority.includes(option.value) ? option.color : ""
                    }`}
                    onClick={() => toggleFilter("priority", option.value)}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Metodologia */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Metodologia</label>
              <div className="flex flex-wrap gap-2">
                {methodologyOptions.map(option => (
                  <Badge
                    key={option.value}
                    variant={selectedFilters.methodology.includes(option.value) ? "default" : "outline"}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => toggleFilter("methodology", option.value)}
                  >
                    {option.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectFilters;
