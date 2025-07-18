
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, Sparkles, Save, ArrowRight } from "lucide-react";
import { PrioritizationFormData } from "@/types/forms";

interface PrioritizationFormProps {
  onComplete: (data: PrioritizationFormData) => void;
  onSaveDraft: (data: PrioritizationFormData) => void;
}

const PrioritizationForm = ({ onComplete, onSaveDraft }: PrioritizationFormProps) => {
  const [formData, setFormData] = useState<PrioritizationFormData>({
    leadership: "",
    startDate: "",
    endDate: "",
    strategicAlignment: "",
    impact: "",
    viability: "",
    effort: "",
    innovationHorizon: ""
  });

  const [isFormValid, setIsFormValid] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    
    // Check if all required fields are filled
    const requiredFields = ['leadership', 'startDate', 'endDate', 'strategicAlignment', 'impact', 'viability', 'effort', 'innovationHorizon'];
    const isValid = requiredFields.every(field => newData[field as keyof typeof newData]);
    setIsFormValid(isValid);
  };

  const currentStage = 2;
  const totalStages = 11;
  const progressPercentage = Math.round((currentStage / totalStages) * 100);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ChevronDown className="h-5 w-5" />
            Gerenciamento de Etapas
          </CardTitle>
          <Badge variant="secondary">Etapa {currentStage} de {totalStages}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Complete a etapa atual para avançar na esteira de inovação
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progresso na Esteira</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Em Andamento</Badge>
              <span className="text-sm font-medium">{progressPercentage}%</span>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary"></div>
            <span className="text-sm text-muted-foreground">Priorização</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Complete as informações abaixo para avançar na esteira de inovação
          </p>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="leadership">Liderança Responsável *</Label>
            <Select onValueChange={(value) => handleInputChange('leadership', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione ou gerencie uma liderança" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marcus-leitao">Marcus Leitão</SelectItem>
                <SelectItem value="daniele-silva">Daniele Silva</SelectItem>
                <SelectItem value="carlos-santos">Carlos Santos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Data Prevista de Início *</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Data Prevista de Término *</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategicAlignment">Alinhamento Estratégico *</Label>
            <Select onValueChange={(value) => handleInputChange('strategicAlignment', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o alinhamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alto">Alto</SelectItem>
                <SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="baixo">Baixo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="impact">Impacto *</Label>
            <Select onValueChange={(value) => handleInputChange('impact', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o impacto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alto">Alto</SelectItem>
                <SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="baixo">Baixo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="viability">Viabilidade *</Label>
            <Select onValueChange={(value) => handleInputChange('viability', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a viabilidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="effort">Esforço *</Label>
            <Select onValueChange={(value) => handleInputChange('effort', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o esforço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixo">Baixo</SelectItem>
                <SelectItem value="medio">Médio</SelectItem>
                <SelectItem value="alto">Alto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="innovationHorizon">Horizonte de Inovação *</Label>
            <Select onValueChange={(value) => handleInputChange('innovationHorizon', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o horizonte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="core">Core (0-2 anos)</SelectItem>
                <SelectItem value="adjacent">Adjacent (2-5 anos)</SelectItem>
                <SelectItem value="transformational">Transformacional (5+ anos)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* AI Analysis Section */}
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Análise IA para Priorização</h4>
                <p className="text-sm text-muted-foreground">
                  Preencha todos os campos obrigatórios para habilitar a análise por IA
                </p>
              </div>
            </div>
            
            {isFormValid ? (
              <Button variant="outline" className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                Executar Análise IA
              </Button>
            ) : (
              <div className="text-center py-4">
                <Sparkles className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Complete o formulário para usar a IA</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onSaveDraft(formData)}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Rascunho
          </Button>
          
          <Button 
            onClick={() => onComplete(formData)} 
            disabled={!isFormValid}
            className="flex-1"
          >
            Completar Priorização e Avançar para Hipótese Formulada
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrioritizationForm;
