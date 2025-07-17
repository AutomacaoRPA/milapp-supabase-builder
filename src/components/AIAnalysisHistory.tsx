
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Eye } from "lucide-react";

const AIAnalysisHistory = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Histórico de Análises IA
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Visualize o histórico de análises de priorização feitas pela IA
        </p>
      </CardHeader>
      
      <CardContent>
        <Button variant="outline" className="w-full">
          <Eye className="h-4 w-4 mr-2" />
          Ver Histórico
        </Button>
      </CardContent>
    </Card>
  );
};

export default AIAnalysisHistory;
