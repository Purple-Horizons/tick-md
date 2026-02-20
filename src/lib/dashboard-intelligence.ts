import type { Agent, Priority, Task, TaskStatus } from "./types";

export interface DashboardFilters {
  statuses: TaskStatus[];
  priorities: Priority[];
  tags: string[];
  agents: string[];
  text: string;
  blockedOnly: boolean;
  depsOnly: boolean;
  mineOnly: boolean;
  unownedOnly: boolean;
  mode: "and" | "or";
}

export interface CapacitySignal {
  agent: string;
  activeCount: number;
  overloaded: boolean;
}

export interface DigestItem {
  taskId: string;
  title: string;
  action: string;
  who: string;
  ts: string;
}

export interface RecommendationItem {
  taskId: string;
  title: string;
  score: number;
  reasons: string[];
}

export interface HandoffScore {
  score: number;
  missing: string[];
}

export interface RiskFlags {
  blocked: boolean;
  stale: boolean;
  unowned: boolean;
  reopened: boolean;
  overdue: boolean;
}

const PRIORITY_WEIGHT: Record<Priority, number> = {
  urgent: 40,
  high: 24,
  medium: 12,
  low: 6,
};

const STALE_STATUSES = new Set<TaskStatus>(["todo", "in_progress", "review", "blocked", "reopened", "backlog"]);

export const defaultFilters = (): DashboardFilters => ({
  statuses: [],
  priorities: [],
  tags: [],
  agents: [],
  text: "",
  blockedOnly: false,
  depsOnly: false,
  mineOnly: false,
  unownedOnly: false,
  mode: "or",
});

function containsNormalized(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase().trim());
}

export function filterTasks(tasks: Task[], filters: DashboardFilters, currentAgent?: string) {
  const text = filters.text.trim().toLowerCase();
  return tasks.filter((task) => {
    const statusMatch = filters.statuses.length === 0 || filters.statuses.includes(task.status);
    const priorityMatch = filters.priorities.length === 0 || filters.priorities.includes(task.priority);
    const tagMatch =
      filters.tags.length === 0 ||
      (filters.mode === "and"
        ? filters.tags.every((tag) => task.tags.includes(tag))
        : filters.tags.some((tag) => task.tags.includes(tag)));

    const allAgentsForTask = [
      task.claimed_by,
      task.assigned_to,
      task.created_by,
      ...task.history.map((h) => h.who),
    ].filter(Boolean) as string[];
    const agentMatch = filters.agents.length === 0 || filters.agents.some((agent) => allAgentsForTask.includes(agent));

    const textMatch =
      text.length === 0 ||
      containsNormalized(task.title, text) ||
      containsNormalized(task.id, text) ||
      containsNormalized(task.description || "", text) ||
      task.tags.some((tag) => containsNormalized(tag, text));

    const blockedMatch = !filters.blockedOnly || task.status === "blocked" || task.depends_on.length > 0;
    const depsMatch = !filters.depsOnly || task.depends_on.length > 0 || task.blocks.length > 0;
    const mineMatch =
      !filters.mineOnly ||
      (!!currentAgent && (task.claimed_by === currentAgent || task.assigned_to === currentAgent || task.created_by === currentAgent));
    const unownedMatch = !filters.unownedOnly || !task.claimed_by;

    return (
      statusMatch &&
      priorityMatch &&
      tagMatch &&
      agentMatch &&
      textMatch &&
      blockedMatch &&
      depsMatch &&
      mineMatch &&
      unownedMatch
    );
  });
}

export function buildDigest(tasks: Task[], lastSeenIso: string | null): DigestItem[] {
  if (!lastSeenIso) return [];
  const cutoff = new Date(lastSeenIso).getTime();
  if (Number.isNaN(cutoff)) return [];

  const items: DigestItem[] = [];
  for (const task of tasks) {
    for (const entry of task.history) {
      if (new Date(entry.ts).getTime() > cutoff) {
        items.push({
          taskId: task.id,
          title: task.title,
          action: entry.action,
          who: entry.who,
          ts: entry.ts,
        });
      }
    }
  }
  return items.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
}

export function getRiskFlags(task: Task, now = Date.now()): RiskFlags {
  const dueTs = task.due_date ? new Date(task.due_date).getTime() : NaN;
  const updatedTs = new Date(task.updated_at).getTime();
  const staleDays = (now - updatedTs) / (1000 * 60 * 60 * 24);

  return {
    blocked: task.status === "blocked" || task.depends_on.length > 0,
    stale: STALE_STATUSES.has(task.status) && staleDays > 7,
    unowned: !task.claimed_by && task.status !== "done",
    reopened: task.status === "reopened",
    overdue: !Number.isNaN(dueTs) && dueTs < now && task.status !== "done",
  };
}

export function getHandoffScore(task: Task): HandoffScore {
  const missing: string[] = [];
  if (!task.description || task.description.trim().length < 24) missing.push("clear_description");
  if (!task.assigned_to && !task.claimed_by) missing.push("owner");
  if (task.history.length < 2) missing.push("context_history");
  if (task.depends_on.length === 0 && task.blocks.length === 0) missing.push("dependency_context");
  if (!task.deliverables || task.deliverables.length === 0) missing.push("deliverables");

  return {
    score: Math.max(0, 100 - missing.length * 20),
    missing,
  };
}

export function buildCapacitySignals(tasks: Task[], agents: Agent[], wipLimit = 2): CapacitySignal[] {
  return agents.map((agent) => {
    const activeCount = tasks.filter(
      (task) => task.status === "in_progress" && (task.claimed_by === agent.name || task.assigned_to === agent.name)
    ).length;
    return { agent: agent.name, activeCount, overloaded: activeCount > wipLimit };
  });
}

export function suggestNextTasks(tasks: Task[], currentAgent?: string): RecommendationItem[] {
  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  const candidates = tasks.filter((task) => task.status !== "done" && task.status !== "blocked");

  return candidates
    .map((task) => {
      let score = PRIORITY_WEIGHT[task.priority];
      const reasons: string[] = [];

      if (task.status === "todo" || task.status === "reopened") {
        score += 12;
        reasons.push("ready_state");
      }
      if (!task.claimed_by) {
        score += 8;
        reasons.push("unclaimed");
      }
      const unblocksCount = task.blocks.filter((id) => taskMap.get(id)?.status !== "done").length;
      if (unblocksCount > 0) {
        score += unblocksCount * 5;
        reasons.push("unblocks_work");
      }
      if (currentAgent && task.assigned_to === currentAgent) {
        score += 10;
        reasons.push("assigned_to_you");
      }
      const risk = getRiskFlags(task);
      if (risk.overdue) {
        score += 15;
        reasons.push("overdue");
      }
      if (risk.reopened) {
        score += 6;
        reasons.push("reopened");
      }

      return { taskId: task.id, title: task.title, score, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export function getCriticalPathTasks(tasks: Task[]): string[] {
  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  const memo = new Map<string, number>();
  const visiting = new Set<string>();

  const depth = (taskId: string): number => {
    if (memo.has(taskId)) return memo.get(taskId)!;
    if (visiting.has(taskId)) return 0;
    visiting.add(taskId);
    const task = taskMap.get(taskId);
    if (!task) {
      visiting.delete(taskId);
      memo.set(taskId, 0);
      return 0;
    }
    let maxChild = 0;
    for (const childId of task.blocks) {
      maxChild = Math.max(maxChild, depth(childId));
    }
    visiting.delete(taskId);
    memo.set(taskId, 1 + maxChild);
    return memo.get(taskId)!;
  };

  let best: { id: string; depth: number } = { id: "", depth: 0 };
  for (const task of tasks) {
    const d = depth(task.id);
    if (d > best.depth) best = { id: task.id, depth: d };
  }
  if (!best.id) return [];

  const path: string[] = [];
  let cursor = best.id;
  while (cursor) {
    path.push(cursor);
    const task = taskMap.get(cursor);
    if (!task || task.blocks.length === 0) break;
    let next = "";
    let nextDepth = -1;
    for (const child of task.blocks) {
      const d = memo.get(child) ?? 0;
      if (d > nextDepth) {
        nextDepth = d;
        next = child;
      }
    }
    cursor = next;
  }
  return path;
}

