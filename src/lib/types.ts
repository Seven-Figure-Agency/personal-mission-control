// System types (define the methodology — not configurable)
export type TaskStatus = "Maybe" | "Backlog" | "To Do" | "Top 3" | "In Progress" | "Completed";
export type Priority = "High" | "Medium" | "Low";
export type ProjectStatus = "Not Started" | "In Progress" | "Complete" | "Blocked" | "On Hold";
export type ProjectTier = "L1" | "L2" | "L3";
export type RockStatus = "Not Started" | "In Progress" | "Complete" | "Blocked";
export type MeetingStatus = "Unprocessed" | "Processed" | "Complete";
export type DecisionStatus = "Active" | "Superseded" | "Reversed";

// Configurable types (values come from config.json)
export type EnergyType = string;
export type Category = string;
export type Organization = string;
export type Person = string;
export type MeetingType = string;

export interface Task {
  id: number;
  task_title: string;
  task_description: string | null;
  due_date: string | null;
  priority: Priority;
  status: TaskStatus;
  notes: string | null;
  project_id: number | null;
  category: Category | null;
  energy_type: EnergyType | null;
  person: Person | null;
  priority_id: number | null;
  meeting_id: number | null;
  organization: Organization;
  resources: string | null;
  created_at: string;
  updated_at: string;
  project_name?: string;
  meeting_title?: string;
}

export interface Project {
  id: number;
  project_name: string;
  rock_id: number | null;
  status: ProjectStatus;
  due_date: string | null;
  priority: Priority;
  category: Category | null;
  energy_type: EnergyType | null;
  person: Person | null;
  tier: ProjectTier;
  notes: string | null;
  resources: string | null;
  created_at: string;
  updated_at: string;
  rock_name?: string;
  task_count?: number;
  completed_task_count?: number;
}

export interface Rock {
  id: number;
  rock_name: string;
  quarter: string | null;
  status: RockStatus;
  due_date: string | null;
  category: Category | null;
  owner: string;
  notes: string | null;
  resources: string | null;
  created_at: string;
  updated_at: string;
  project_count?: number;
}

export interface Meeting {
  id: number;
  meeting_title: string;
  date: string | null;
  meeting_type: MeetingType | null;
  attendees: string | null;
  duration: number | null;
  summary: string | null;
  key_topics: string | null;
  status: MeetingStatus;
  category: Category | null;
  source_file: string | null;
  recording: string | null;
  notes: string | null;
  resources: string | null;
  organization: Organization;
  created_at: string;
  updated_at: string;
  task_count?: number;
  decision_count?: number;
}

export interface Decision {
  id: number;
  decision_title: string;
  date: string | null;
  context: string | null;
  decision: string | null;
  rationale: string | null;
  impact: string | null;
  status: DecisionStatus;
  category: Category | null;
  owner: Person | null;
  notes: string | null;
  resources: string | null;
  meeting_id: number | null;
  project_id: number | null;
  organization: Organization;
  created_at: string;
  updated_at: string;
  meeting_title?: string;
}

export interface ActivityLog {
  id: number;
  entity_type: "task" | "project" | "rock" | "meeting" | "decision";
  entity_id: number;
  action: string;
  details: string | null;
  created_at: string;
}

// System constants (not configurable)
export const TASK_STATUS_ORDER: TaskStatus[] = ["Maybe", "Backlog", "To Do", "Top 3", "In Progress", "Completed"];
export const PROJECT_STATUS_ORDER: ProjectStatus[] = ["Not Started", "In Progress", "Complete", "Blocked", "On Hold"];
export const PROJECT_TIERS: ProjectTier[] = ["L1", "L2", "L3"];
export const ROCK_STATUS_ORDER: RockStatus[] = ["Not Started", "In Progress", "Complete", "Blocked"];
export const MEETING_STATUS_ORDER: MeetingStatus[] = ["Unprocessed", "Processed", "Complete"];
