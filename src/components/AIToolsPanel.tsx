
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, Edit, Zap } from "lucide-react";

interface AIToolsPanelProps {
  onStructureDescription: () => void;
  onGenerateExecutiveSummary: () => void;
  onEditStructuredDescription: () => void;
}

const AIToolsPanel = ({ 
  onStructureDescription, 
  onGenerateExecutiveSummary, 
  onEditStructuredDescription 
}: AIToolsPanelProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Ferramentas de IA
          <Badge variant="secondary">Inteligência Artificial</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Use IA para estruturar descrições e gerar resumos executivos profissionais
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button variant="outline" onClick={onStructureDescription} className="h-auto p-4">
            <div className="flex flex-col items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-medium">Estruturar Descrição</span>
            </div>
          </Button>
          
          <Button variant="outline" onClick={onGenerateExecutiveSummary} className="h-auto p-4 bg-green-50">
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span className="font-medium">Resumos Executivos</span>
            </div>
          </Button>
        </div>

        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground mb-3">
            Organizar e estruturar a descrição da ideia
          </p>
          
          <Button variant="outline" onClick={onEditStructuredDescription} className="w-full">
            <Edit className="h-4 w-4 mr-2" />
            Gerar e Editar Descrição Estruturada
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIToolsPanel;
