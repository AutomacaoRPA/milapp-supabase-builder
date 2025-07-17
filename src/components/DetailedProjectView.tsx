
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Project } from "@/hooks/useProjects";
import StageProgressCard from "./StageProgressCard";
import PrioritizationForm from "./PrioritizationForm";
import AIToolsPanel from "./AIToolsPanel";
import ProjectDescriptionCard from "./ProjectDescriptionCard";
import AIAnalysisHistory from "./AIAnalysisHistory";

interface DetailedProjectViewProps {
  project: Project;
  onBack: () => void;
}

const DetailedProjectView = ({ project, onBack }: DetailedProjectViewProps) => {
  // Mock stages data
  const stages = [
    { id: "1", name: "Priorização", status: "in_progress" as const, order: 1 },
    { id: "2", name: "Hipótese Formulada", status: "pending" as const, order: 2 },
    { id: "3", name: "Análise de Viabilidade", status: "pending" as const, order: 3 },
    { id: "4", name: "Protótipo Rápido", status: "pending" as const, order: 4 },
    { id: "5", name: "Validação do Protótipo", status: "pending" as const, order: 5 },
    { id: "6", name: "MVP", status: "pending" as const, order: 6 },
    { id: "7", name: "Teste Operacional", status: "pending" as const, order: 7 },
    { id: "8", name: "Escala e Entrega", status: "pending" as const, order: 8 },
    { id: "9", name: "Acompanhamento Pós-Entrega", status: "pending" as const, order: 9 },
    { id: "10", name: "Sustentação e Evolução", status: "pending" as const, order: 10 },
  ];

  const handleCompletePrioritization = (data: PrioritizationFormData) => {
    console.log("Completing prioritization with data:", data);
    // Here you would implement the logic to complete the prioritization stage
  };

  const handleSaveDraft = (data: PrioritizationFormData) => {
    console.log("Saving draft:", data);
    // Here you would implement the logic to save the draft
  };

  const handleStructureDescription = () => {
    console.log("Structure description with AI");
    // Here you would implement AI description structuring
  };

  const handleGenerateExecutiveSummary = () => {
    console.log("Generate executive summary");
    // Here you would implement executive summary generation
  };

  const handleEditStructuredDescription = () => {
    console.log("Edit structured description");
    // Here you would implement structured description editing
  };

  const handleUpdateDescription = (description: string) => {
    console.log("Update description:", description);
    // Here you would implement description update logic
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Timeline and AI History */}
          <div className="space-y-6">
            <StageProgressCard stages={stages} currentStage={1} />
            <AIAnalysisHistory />
          </div>

          {/* Middle Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <ProjectDescriptionCard 
              project={project} 
              onUpdateDescription={handleUpdateDescription}
            />
            
            <AIToolsPanel
              onStructureDescription={handleStructureDescription}
              onGenerateExecutiveSummary={handleGenerateExecutiveSummary}
              onEditStructuredDescription={handleEditStructuredDescription}
            />
            
            <PrioritizationForm
              onComplete={handleCompletePrioritization}
              onSaveDraft={handleSaveDraft}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedProjectView;
