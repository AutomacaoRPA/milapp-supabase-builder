// Form types for better type safety
export interface ProjectFormData {
  name: string;
  description: string;
  status: string;
  methodology: string;
  priority: number;
  estimated_roi: number | null;
  target_date: string | null;
  start_date: string | null;
  actual_roi: number | null;
  completed_date: string | null;
  assigned_architect: string | null;
  product_owner: string | null;
}

export interface PrioritizationFormData {
  leadership: string;
  startDate: string;
  endDate: string;
  businessValue: number;
  technicalComplexity: number;
  resourceAvailability: number;
  marketUrgency: number;
  riskLevel: number;
  dependencies: string;
  successCriteria: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  type: string;
  priority: number;
  estimated_hours: number;
  due_date: string;
  assigned_to: string | null;
}

export interface TimeEntryFormData {
  task_id: string;
  hours: number;
  description: string;
  date: string;
}

export interface DocumentFormData {
  name: string;
  description: string;
  type: string;
  file_type: string;
}