import { create } from "zustand";
import type { Task, Agent, ProjectMeta, TaskStatus, HistoryEntry } from "./types";

/* ── Mock Data ─────────────────────────────────────────────── */

const NOW = "2026-02-07T14:32:00-05:00";

const mockAgents: Agent[] = [
  { name: "@gianni", type: "human", roles: ["owner", "any"], status: "working", working_on: "TASK-003", last_active: "2026-02-07T14:28:00", trust_level: "owner" },
  { name: "@ralph", type: "human", roles: ["owner", "any"], status: "offline", working_on: null, last_active: "2026-02-06T18:00:00", trust_level: "owner" },
  { name: "@claude-code", type: "bot", roles: ["engineer"], status: "working", working_on: "TASK-007", last_active: "2026-02-07T14:30:00", trust_level: "trusted" },
  { name: "@content-bot", type: "bot", roles: ["copywriter"], status: "working", working_on: "TASK-012", last_active: "2026-02-07T14:32:00", trust_level: "trusted" },
  { name: "@qa-bot", type: "bot", roles: ["tester"], status: "idle", working_on: null, last_active: "2026-02-07T14:15:00", trust_level: "trusted" },
];

const h = (ts: string, who: string, action: string, extra?: Partial<HistoryEntry>): HistoryEntry => ({ ts, who, action, ...extra });

const mockTasks: Task[] = [
  {
    id: "TASK-001", title: "Define project brand guidelines", status: "done", priority: "high",
    assigned_to: "@gianni", claimed_by: null, created_by: "@gianni",
    created_at: "2026-02-01T09:00:00", updated_at: "2026-02-03T16:00:00",
    tags: ["design", "branding"], depends_on: [], blocks: ["TASK-002", "TASK-006"],
    estimated_hours: 4, actual_hours: 3.5, description: "Create the brand color palette, typography scale, and logo usage guidelines for Tick.",
    history: [
      h("2026-02-01T09:00:00", "@gianni", "created"),
      h("2026-02-01T09:05:00", "@gianni", "claimed"),
      h("2026-02-03T16:00:00", "@gianni", "status_change", { from: "in_progress", to: "done" }),
    ],
  },
  {
    id: "TASK-002", title: "Build landing page hero section", status: "done", priority: "urgent",
    assigned_to: "@claude-code", claimed_by: null, created_by: "@gianni",
    created_at: "2026-02-02T10:00:00", updated_at: "2026-02-04T12:00:00",
    tags: ["frontend", "landing", "v2-launch"], depends_on: ["TASK-001"], blocks: ["TASK-005"],
    estimated_hours: 6, actual_hours: 5, description: "Build the hero section with live agent monitor animation, headline, and CTA buttons.",
    history: [
      h("2026-02-02T10:00:00", "@gianni", "created"),
      h("2026-02-02T10:15:00", "@claude-code", "claimed"),
      h("2026-02-04T12:00:00", "@claude-code", "status_change", { from: "in_progress", to: "done" }),
    ],
  },
  {
    id: "TASK-003", title: "Write PROTOCOL.md specification", status: "in_progress", priority: "urgent",
    assigned_to: "@gianni", claimed_by: "@gianni", created_by: "@gianni",
    created_at: "2026-02-03T08:00:00", updated_at: "2026-02-07T14:28:00",
    tags: ["protocol", "docs", "core"], depends_on: [], blocks: ["TASK-008", "TASK-009", "TASK-010"],
    estimated_hours: 12, actual_hours: 8,
    description: "Write the full Tick coordination protocol specification covering claim/release, locking, transitions, and roles.",
    history: [
      h("2026-02-03T08:00:00", "@gianni", "created"),
      h("2026-02-03T08:10:00", "@gianni", "claimed"),
      h("2026-02-05T14:00:00", "@gianni", "commented", { note: "Claim/release section done. Working on locking." }),
      h("2026-02-07T14:28:00", "@gianni", "commented", { note: "Locking and transitions drafted. Roles section next." }),
    ],
  },
  {
    id: "TASK-004", title: "Build CLI: init command", status: "todo", priority: "high",
    assigned_to: "@claude-code", claimed_by: null, created_by: "@gianni",
    created_at: "2026-02-04T09:00:00", updated_at: "2026-02-04T09:00:00",
    tags: ["cli", "core", "engineering"], depends_on: ["TASK-003"], blocks: ["TASK-011"],
    estimated_hours: 4, description: "Implement `tick init` command that creates TICK.md, .tick/ directory, and config.yml.",
    history: [h("2026-02-04T09:00:00", "@gianni", "created")],
  },
  {
    id: "TASK-005", title: "Build landing page pricing section", status: "done", priority: "medium",
    assigned_to: "@claude-code", claimed_by: null, created_by: "@gianni",
    created_at: "2026-02-04T10:00:00", updated_at: "2026-02-06T14:00:00",
    tags: ["frontend", "landing"], depends_on: ["TASK-002"], blocks: [],
    estimated_hours: 3, actual_hours: 2.5, description: "Build the pricing section with three tiers: Free, Cloud, Lifetime.",
    history: [
      h("2026-02-04T10:00:00", "@gianni", "created"),
      h("2026-02-04T10:30:00", "@claude-code", "claimed"),
      h("2026-02-06T14:00:00", "@claude-code", "status_change", { from: "in_progress", to: "done" }),
    ],
  },
  {
    id: "TASK-006", title: "Design dashboard wireframes", status: "review", priority: "high",
    assigned_to: "@gianni", claimed_by: "@gianni", created_by: "@gianni",
    created_at: "2026-02-04T11:00:00", updated_at: "2026-02-07T10:00:00",
    tags: ["design", "dashboard"], depends_on: ["TASK-001"], blocks: ["TASK-013"],
    estimated_hours: 6, actual_hours: 5, description: "Create wireframes for Kanban board, agent monitor, activity feed, and dependency graph views.",
    history: [
      h("2026-02-04T11:00:00", "@gianni", "created"),
      h("2026-02-04T11:30:00", "@gianni", "claimed"),
      h("2026-02-07T10:00:00", "@gianni", "status_change", { from: "in_progress", to: "review" }),
    ],
  },
  {
    id: "TASK-007", title: "Build avatar selection UI", status: "in_progress", priority: "urgent",
    assigned_to: "@claude-code", claimed_by: "@claude-code", created_by: "@gianni",
    created_at: "2026-02-05T09:00:00", updated_at: "2026-02-07T14:28:00",
    tags: ["frontend", "avatar", "v2-launch"], depends_on: [], blocks: ["TASK-012", "TASK-015"],
    estimated_hours: 8, actual_hours: 6.5,
    description: "Build the avatar grid selector for video generation pipeline. Must support keyboard nav and preview on hover.",
    history: [
      h("2026-02-05T09:00:00", "@gianni", "created"),
      h("2026-02-05T09:15:00", "@claude-code", "claimed"),
      h("2026-02-07T14:00:00", "@claude-code", "commented", { note: "Grid layout done, working on hover preview" }),
      h("2026-02-07T14:28:00", "@claude-code", "commented", { note: "Keyboard nav implemented. Preview animation in progress." }),
    ],
  },
  {
    id: "TASK-008", title: "Build CLI: add command", status: "backlog", priority: "high",
    assigned_to: null, claimed_by: null, created_by: "@gianni",
    created_at: "2026-02-05T10:00:00", updated_at: "2026-02-05T10:00:00",
    tags: ["cli", "core", "engineering"], depends_on: ["TASK-003"], blocks: [],
    estimated_hours: 3, description: "Implement `tick add` command to create new tasks with YAML metadata and Markdown body.",
    history: [h("2026-02-05T10:00:00", "@gianni", "created")],
  },
  {
    id: "TASK-009", title: "Build CLI: claim and release", status: "backlog", priority: "high",
    assigned_to: null, claimed_by: null, created_by: "@gianni",
    created_at: "2026-02-05T10:15:00", updated_at: "2026-02-05T10:15:00",
    tags: ["cli", "core", "engineering"], depends_on: ["TASK-003"], blocks: [],
    estimated_hours: 4, description: "Implement `tick claim` and `tick release` with file locking and coordination protocol.",
    history: [h("2026-02-05T10:15:00", "@gianni", "created")],
  },
  {
    id: "TASK-010", title: "Build JSON Schema validator", status: "backlog", priority: "medium",
    assigned_to: null, claimed_by: null, created_by: "@gianni",
    created_at: "2026-02-05T11:00:00", updated_at: "2026-02-05T11:00:00",
    tags: ["validation", "core"], depends_on: ["TASK-003"], blocks: [],
    estimated_hours: 5, description: "Create JSON Schema for TICK.md validation and integrate into CLI validate command.",
    history: [h("2026-02-05T11:00:00", "@gianni", "created")],
  },
  {
    id: "TASK-011", title: "Write getting started guide", status: "todo", priority: "medium",
    assigned_to: "@content-bot", claimed_by: null, created_by: "@gianni",
    created_at: "2026-02-06T09:00:00", updated_at: "2026-02-06T09:00:00",
    tags: ["docs", "content", "onboarding"], depends_on: ["TASK-004"], blocks: [],
    estimated_hours: 3, description: "Write a quickstart guide: install, init, first task, first agent claim.",
    history: [h("2026-02-06T09:00:00", "@gianni", "created")],
  },
  {
    id: "TASK-012", title: "Write landing page copy", status: "in_progress", priority: "high",
    assigned_to: "@content-bot", claimed_by: "@content-bot", created_by: "@gianni",
    created_at: "2026-02-06T10:00:00", updated_at: "2026-02-07T14:32:00",
    tags: ["content", "landing", "copy"], depends_on: ["TASK-007"], blocks: [],
    estimated_hours: 4, actual_hours: 2,
    description: "Write compelling copy for all landing page sections. Must be concise and developer-focused.",
    history: [
      h("2026-02-06T10:00:00", "@gianni", "created"),
      h("2026-02-06T10:30:00", "@content-bot", "claimed"),
      h("2026-02-07T14:32:00", "@content-bot", "commented", { note: "Hero and How It Works copy drafted. Working on pricing copy." }),
    ],
  },
  {
    id: "TASK-013", title: "Build dashboard Kanban board", status: "todo", priority: "high",
    assigned_to: "@claude-code", claimed_by: null, created_by: "@gianni",
    created_at: "2026-02-07T08:00:00", updated_at: "2026-02-07T08:00:00",
    tags: ["dashboard", "frontend", "engineering"], depends_on: ["TASK-006"], blocks: ["TASK-014"],
    estimated_hours: 10, description: "Build the main Kanban board view with draggable cards, workflow columns, and status transitions.",
    history: [h("2026-02-07T08:00:00", "@gianni", "created")],
  },
  {
    id: "TASK-014", title: "Build agent monitor view", status: "backlog", priority: "medium",
    assigned_to: null, claimed_by: null, created_by: "@gianni",
    created_at: "2026-02-07T08:15:00", updated_at: "2026-02-07T08:15:00",
    tags: ["dashboard", "frontend"], depends_on: ["TASK-013"], blocks: [],
    estimated_hours: 6, description: "Build the real-time agent monitor showing all registered agents, their status, and current tasks.",
    history: [h("2026-02-07T08:15:00", "@gianni", "created")],
  },
  {
    id: "TASK-015", title: "Build MCP server integration", status: "backlog", priority: "medium",
    assigned_to: null, claimed_by: null, created_by: "@gianni",
    created_at: "2026-02-07T09:00:00", updated_at: "2026-02-07T09:00:00",
    tags: ["integration", "mcp", "engineering"], depends_on: ["TASK-007"], blocks: [],
    estimated_hours: 8, description: "Build MCP Server implementation that exposes Tick operations to Claude and other MCP-compatible agents.",
    history: [h("2026-02-07T09:00:00", "@gianni", "created")],
  },
];

const mockProject: ProjectMeta = {
  project: "adgena-v2",
  title: "Adgena V2 Launch",
  schema_version: "1.0",
  created: "2026-02-01T09:00:00-05:00",
  updated: NOW,
  default_workflow: ["backlog", "todo", "in_progress", "review", "done"],
  id_prefix: "TASK",
  next_id: 16,
};

/* ── Store ─────────────────────────────────────────────────── */

export type DashboardView = "kanban" | "agents" | "activity" | "graph";

interface TickStore {
  // Data
  project: ProjectMeta;
  tasks: Task[];
  agents: Agent[];

  // UI state
  view: DashboardView;
  selectedTaskId: string | null;
  filterAgent: string | null;
  filterTag: string | null;
  filterPriority: string | null;
  searchQuery: string;
  sidebarCollapsed: boolean;

  // Actions
  setView: (view: DashboardView) => void;
  selectTask: (id: string | null) => void;
  setFilterAgent: (agent: string | null) => void;
  setFilterTag: (tag: string | null) => void;
  setFilterPriority: (p: string | null) => void;
  setSearchQuery: (q: string) => void;
  toggleSidebar: () => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;
}

export const useTickStore = create<TickStore>((set) => ({
  project: mockProject,
  tasks: mockTasks,
  agents: mockAgents,

  view: "kanban",
  selectedTaskId: null,
  filterAgent: null,
  filterTag: null,
  filterPriority: null,
  searchQuery: "",
  sidebarCollapsed: false,

  setView: (view) => set({ view, selectedTaskId: null }),
  selectTask: (id) => set({ selectedTaskId: id }),
  setFilterAgent: (agent) => set({ filterAgent: agent }),
  setFilterTag: (tag) => set({ filterTag: tag }),
  setFilterPriority: (p) => set({ filterPriority: p }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  moveTask: (taskId, newStatus) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus,
              updated_at: new Date().toISOString(),
              history: [
                ...t.history,
                {
                  ts: new Date().toISOString(),
                  who: "@gianni",
                  action: "status_change",
                  from: t.status,
                  to: newStatus,
                },
              ],
            }
          : t
      ),
    })),
}));

/* ── Selectors ─────────────────────────────────────────────── */

export function useFilteredTasks() {
  const { tasks, filterAgent, filterTag, filterPriority, searchQuery } =
    useTickStore();

  return tasks.filter((t) => {
    if (filterAgent && t.assigned_to !== filterAgent && t.claimed_by !== filterAgent)
      return false;
    if (filterTag && !t.tags.includes(filterTag)) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (
      searchQuery &&
      !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });
}

export function useAllHistory() {
  const tasks = useTickStore((s) => s.tasks);
  const entries: (HistoryEntry & { taskId: string; taskTitle: string })[] = [];
  for (const t of tasks) {
    for (const e of t.history) {
      entries.push({ ...e, taskId: t.id, taskTitle: t.title });
    }
  }
  return entries.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
}

export function useAllTags() {
  const tasks = useTickStore((s) => s.tasks);
  const set = new Set<string>();
  for (const t of tasks) for (const tag of t.tags) set.add(tag);
  return Array.from(set).sort();
}
