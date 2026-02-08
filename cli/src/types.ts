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
  title?: string;
  schema_version: string;
  created: string;
  updated: string;
  default_workflow: TaskStatus[];
  id_prefix: string;
  next_id: number;
}

export interface TickFile {
  meta: ProjectMeta;
  agents: Agent[];
  tasks: Task[];
  raw_content?: string;
}
