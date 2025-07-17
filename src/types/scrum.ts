
export interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: "planning" | "active" | "review" | "retrospective" | "completed";
  capacity: number;
  commitment: number;
  completed: number;
  velocity: number;
  projectId: string;
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  storyPoints: number;
  priority: "critical" | "high" | "medium" | "low";
  status: "backlog" | "todo" | "in-progress" | "review" | "done";
  assignee?: string;
  sprintId?: string;
  projectId: string;
  epicId?: string;
}

export interface Epic {
  id: string;
  title: string;
  description: string;
  businessValue: number;
  status: "draft" | "in-progress" | "completed";
  projectId: string;
  userStories: UserStory[];
}

export interface ScrumEvent {
  id: string;
  type: "sprint-planning" | "daily-standup" | "sprint-review" | "retrospective";
  date: string;
  duration: number;
  participants: string[];
  notes?: string;
  sprintId: string;
}
