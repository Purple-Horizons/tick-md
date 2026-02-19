export type {
  Priority,
  TaskStatus,
  AgentType,
  AgentStatus,
  TrustLevel,
  HistoryEntry,
  Deliverable,
  Task,
  Agent,
  ProjectMeta,
  ParseError,
  TickFile,
} from "@tick/core";

export interface DashboardState {
  tickFile: import("@tick/core").TickFile | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
  lastUpdated: string | null;
}

export interface LicenseInfo {
  key: string;
  plan: "free" | "lifetime" | "cloud";
  status: "active" | "expired" | "revoked";
  features: {
    customBranding: boolean;
    unlimitedAgents: boolean;
    prioritySupport: boolean;
  };
}
