// Tick protocol types matching PRD Section 5

export type Priority = "urgent" | "high" | "medium" | "low";

export type TaskStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "review"
  | "done"
  | "blocked"
  | "reopened";

export type AgentType = "human" | "bot";
export type AgentStatus = "working" | "idle" | "offline";

export type TrustLevel = "owner" | "trusted" | "restricted" | "read-only";

export interface HistoryEntry {
  ts: string;
  who: string;
  action: string;
  note?: string;
  from?: string;
  to?: string;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  assigned_to: string | null;
  claimed_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  tags: string[];
  depends_on: string[];
  blocks: string[];
  estimated_hours?: number;
  actual_hours?: number;
  detail_file?: string;
  description: string;
  history: HistoryEntry[];
}

export interface Agent {
  name: string;
  type: AgentType;
  roles: string[];
  status: AgentStatus;
  working_on: string | null;
  last_active: string;
  trust_level: TrustLevel;
}

export interface ProjectMeta {
  project: string;
  title: string;
  schema_version: string;
  created: string;
  updated: string;
  default_workflow: TaskStatus[];
  id_prefix: string;
  next_id: number;
}

export const WORKFLOW_COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];

export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; bg: string }
> = {
  urgent: { label: "Urgent", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  high: { label: "High", color: "#fbbf24", bg: "rgba(251,191,36,0.12)" },
  medium: { label: "Medium", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  low: { label: "Low", color: "#9393a8", bg: "rgba(147,147,168,0.10)" },
};
