import { describe, expect, it } from "vitest";
import {
  buildCapacitySignals,
  buildDigest,
  defaultFilters,
  filterTasks,
  getCriticalPathTasks,
  getHandoffScore,
  getRiskFlags,
  suggestNextTasks,
} from "./dashboard-intelligence";
import type { Agent, Task } from "./types";

const TASKS: Task[] = [
  {
    id: "TASK-001",
    title: "Build filters",
    status: "todo",
    priority: "high",
    assigned_to: "@gianni",
    claimed_by: null,
    created_by: "@gianni",
    created_at: "2026-01-01T10:00:00.000Z",
    updated_at: "2026-01-05T10:00:00.000Z",
    tags: ["frontend", "ux"],
    depends_on: [],
    blocks: ["TASK-002"],
    description: "Build filter chips and URL state for dashboard",
    history: [
      { ts: "2026-01-01T10:00:00.000Z", who: "@gianni", action: "created" },
      { ts: "2026-01-05T10:00:00.000Z", who: "@gianni", action: "commented", note: "planned" },
    ],
    deliverables: [{ name: "FilterBar", type: "file" }],
  },
  {
    id: "TASK-002",
    title: "Improve PWA shell",
    status: "reopened",
    priority: "urgent",
    assigned_to: "@bot",
    claimed_by: "@bot",
    created_by: "@gianni",
    created_at: "2026-01-03T10:00:00.000Z",
    updated_at: "2026-02-01T10:00:00.000Z",
    due_date: "2026-01-31T10:00:00.000Z",
    tags: ["pwa", "offline"],
    depends_on: ["TASK-001"],
    blocks: ["TASK-003"],
    description: "Fix shell and offline banner behavior for installable app.",
    history: [{ ts: "2026-02-01T10:00:00.000Z", who: "@bot", action: "reopened" }],
    deliverables: [{ name: "manifest", type: "file" }],
  },
  {
    id: "TASK-003",
    title: "Activity refinements",
    status: "blocked",
    priority: "medium",
    assigned_to: null,
    claimed_by: null,
    created_by: "@bot",
    created_at: "2026-01-10T10:00:00.000Z",
    updated_at: "2026-01-10T10:00:00.000Z",
    tags: ["activity"],
    depends_on: ["TASK-002"],
    blocks: [],
    description: "Refine activity decisions",
    history: [{ ts: "2026-01-10T10:00:00.000Z", who: "@bot", action: "created" }],
    deliverables: [],
  },
];

const AGENTS: Agent[] = [
  {
    name: "@gianni",
    type: "human",
    roles: ["owner"],
    status: "working",
    working_on: "TASK-001",
    last_active: "2026-02-01T10:00:00.000Z",
    trust_level: "owner",
  },
  {
    name: "@bot",
    type: "bot",
    roles: ["engineer"],
    status: "working",
    working_on: "TASK-002",
    last_active: "2026-02-01T10:00:00.000Z",
    trust_level: "trusted",
  },
];

describe("dashboard intelligence", () => {
  it("filters by tags and agent", () => {
    const filters = defaultFilters();
    filters.tags = ["frontend"];
    filters.agents = ["@gianni"];
    const result = filterTasks(TASKS, filters, "@gianni");
    expect(result.map((task) => task.id)).toEqual(["TASK-001"]);
  });

  it("builds digest since last visit", () => {
    const items = buildDigest(TASKS, "2026-01-31T00:00:00.000Z");
    expect(items.length).toBe(1);
    expect(items[0].taskId).toBe("TASK-002");
  });

  it("detects risk flags", () => {
    const risk = getRiskFlags(TASKS[1], new Date("2026-02-15T00:00:00.000Z").getTime());
    expect(risk.overdue).toBe(true);
    expect(risk.reopened).toBe(true);
  });

  it("scores handoff readiness", () => {
    const score = getHandoffScore(TASKS[0]);
    expect(score.score).toBeGreaterThanOrEqual(80);
  });

  it("builds capacity overload warnings", () => {
    const inProgress = TASKS.map((task) => ({ ...task, status: "in_progress" as const }));
    const capacities = buildCapacitySignals(inProgress, AGENTS, 0);
    expect(capacities.some((item) => item.overloaded)).toBe(true);
  });

  it("suggests next best tasks", () => {
    const items = suggestNextTasks(TASKS, "@gianni");
    expect(items[0].taskId).toBe("TASK-002");
  });

  it("computes critical path", () => {
    const path = getCriticalPathTasks(TASKS);
    expect(path).toEqual(["TASK-001", "TASK-002", "TASK-003"]);
  });
});
