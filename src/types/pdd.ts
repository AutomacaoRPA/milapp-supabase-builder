
export interface PDDGovernance {
  id: string;
  projectId: string;
  stage: "concept" | "feasibility" | "development" | "testing" | "launch" | "post-launch";
  gateStatus: "pending" | "approved" | "rejected" | "conditional";
  criteria: PDDCriteria;
  approvers: string[];
  approvedBy?: string[];
  approvedAt?: string;
  comments?: string;
}

export interface PDDCriteria {
  technical: {
    feasibility: number;
    complexity: number;
    riskLevel: "low" | "medium" | "high";
  };
  business: {
    roi: number;
    marketPotential: number;
    strategicAlignment: number;
  };
  operational: {
    resourceAvailability: number;
    timeToMarket: number;
    maintenanceComplexity: number;
  };
}

export interface QualityGate {
  id: string;
  name: string;
  stage: string;
  criteria: QualityGateCriteria[];
  status: "pending" | "passed" | "failed";
  checklistItems: ChecklistItem[];
  approver: string;
  deadline: string;
}

export interface QualityGateCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  score?: number;
  passed: boolean;
}

export interface ChecklistItem {
  id: string;
  description: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: string;
  evidence?: string;
}
