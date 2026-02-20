import { create } from "zustand";
import type { Task, Agent, TaskStatus, ProjectMeta } from "./types";
import { DEMO_PROJECT_META, DEMO_AGENTS, DEMO_TASKS, DEMO_TIMELINE, NEW_TASK_TEMPLATE, type DemoEvent } from "./demo-data";
import {
  buildCapacitySignals,
  buildDigest,
  defaultFilters,
  filterTasks,
  getCriticalPathTasks,
  getRiskFlags,
  suggestNextTasks,
  type DashboardFilters,
} from "./dashboard-intelligence";

export interface DemoStore {
  // Data (same as useTickStore)
  meta: ProjectMeta;
  tasks: Task[];
  agents: Agent[];
  workflow: TaskStatus[];
  summary: { total: number; done: number; percentage: number; by_status: Record<string, number> };

  // UI state
  loading: boolean;
  error: string | null;
  connected: boolean;
  selectedTaskId: string | null;
  activeView: "board" | "agents" | "activity" | "graph" | "settings";
  filters: DashboardFilters;
  savedViews: { name: string; filters: DashboardFilters }[];
  currentAgent: string;
  lastSeenAt: string | null;
  pwaOfflineSnapshot: string | null;
  pwaOfflineMode: boolean;

  // Demo-specific
  isSimulating: boolean;
  timelineIndex: number;

  // Actions (same interface as useTickStore)
  fetchStatus: () => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  claimTask: (taskId: string, agent: string) => Promise<void>;
  releaseTask: (taskId: string, agent: string) => Promise<void>;
  setSelectedTask: (taskId: string | null) => void;
  setActiveView: (view: DemoStore["activeView"]) => void;
  setCurrentAgent: (agent: string) => void;
  setFilters: (partial: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  toggleTagFilter: (tag: string) => void;
  toggleAgentFilter: (agent: string) => void;
  saveCurrentView: (name: string) => void;
  applySavedView: (name: string) => void;
  removeSavedView: (name: string) => void;
  setPwaOfflineMode: (offline: boolean) => void;
  setPwaOfflineSnapshot: (snapshot: string | null) => void;
  updateLastSeen: () => void;
  getVisibleTasks: () => Task[];
  getDigest: () => ReturnType<typeof buildDigest>;
  getCapacitySignals: () => ReturnType<typeof buildCapacitySignals>;
  getRecommendations: () => ReturnType<typeof suggestNextTasks>;
  getCriticalPath: () => string[];
  getRiskTasks: () => Task[];
  hydrateFromStorage: () => void;
  startWatching: () => () => void;

  // Demo controls
  startSimulation: () => void;
  stopSimulation: () => void;
  resetDemo: () => void;
}

let simulationTimer: NodeJS.Timeout | null = null;

function computeSummary(tasks: Task[]) {
  const tasksByStatus: Record<string, number> = {};
  for (const task of tasks) {
    tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
  }
  const done = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  return { total, done, percentage: total > 0 ? Math.round((done / total) * 100) : 0, by_status: tasksByStatus };
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export const useDemoStore = create<DemoStore>((set, get) => ({
  meta: deepClone(DEMO_PROJECT_META),
  tasks: deepClone(DEMO_TASKS),
  agents: deepClone(DEMO_AGENTS),
  workflow: deepClone(DEMO_PROJECT_META.default_workflow) as TaskStatus[],
  summary: computeSummary(DEMO_TASKS),
  loading: false,
  error: null,
  connected: true,
  selectedTaskId: null,
  activeView: "board",
  filters: defaultFilters(),
  savedViews: [],
  currentAgent: "@demo-user",
  lastSeenAt: null,
  pwaOfflineSnapshot: null,
  pwaOfflineMode: false,
  isSimulating: false,
  timelineIndex: 0,

  fetchStatus: async () => {
    // No-op for demo (already loaded)
    set({ loading: false, connected: true });
  },

  moveTask: async (taskId: string, newStatus: TaskStatus) => {
    const tasks = get().tasks;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const prevStatus = task.status;
    const now = new Date().toISOString();

    const updated = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            status: newStatus,
            updated_at: now,
            history: [
              ...t.history,
              { ts: now, who: "@demo-user", action: "status_change", from: prevStatus, to: newStatus },
            ],
          }
        : t
    );

    set({ tasks: updated, summary: computeSummary(updated) });
  },

  claimTask: async (taskId: string, agent: string) => {
    // No-op for demo (simulation drives this)
  },

  releaseTask: async (taskId: string, agent: string) => {
    // No-op for demo
  },

  setSelectedTask: (taskId) => set({ selectedTaskId: taskId }),
  setActiveView: (view) => set({ activeView: view }),
  setCurrentAgent: (agent) => set({ currentAgent: agent }),
  setFilters: (partial) => set((state) => ({ filters: { ...state.filters, ...partial } })),
  resetFilters: () => set({ filters: defaultFilters() }),
  toggleTagFilter: (tag) =>
    set((state) => ({
      filters: {
        ...state.filters,
        tags: state.filters.tags.includes(tag)
          ? state.filters.tags.filter((value) => value !== tag)
          : [...state.filters.tags, tag],
      },
    })),
  toggleAgentFilter: (agent) =>
    set((state) => ({
      filters: {
        ...state.filters,
        agents: state.filters.agents.includes(agent)
          ? state.filters.agents.filter((value) => value !== agent)
          : [...state.filters.agents, agent],
      },
    })),
  saveCurrentView: (name) =>
    set((state) => {
      if (!name.trim()) return state;
      const next = state.savedViews.filter((view) => view.name !== name);
      next.push({ name, filters: state.filters });
      return { savedViews: next };
    }),
  applySavedView: (name) =>
    set((state) => {
      const found = state.savedViews.find((view) => view.name === name);
      if (!found) return state;
      return { filters: found.filters };
    }),
  removeSavedView: (name) =>
    set((state) => ({
      savedViews: state.savedViews.filter((view) => view.name !== name),
    })),
  setPwaOfflineMode: (offline) => set({ pwaOfflineMode: offline }),
  setPwaOfflineSnapshot: (snapshot) => set({ pwaOfflineSnapshot: snapshot }),
  updateLastSeen: () => set({ lastSeenAt: new Date().toISOString() }),
  getVisibleTasks: () => {
    const state = get();
    return filterTasks(state.tasks, state.filters, state.currentAgent);
  },
  getDigest: () => {
    const state = get();
    return buildDigest(state.tasks, state.lastSeenAt);
  },
  getCapacitySignals: () => {
    const state = get();
    return buildCapacitySignals(state.tasks, state.agents);
  },
  getRecommendations: () => {
    const state = get();
    return suggestNextTasks(state.tasks, state.currentAgent);
  },
  getCriticalPath: () => {
    const state = get();
    return getCriticalPathTasks(state.tasks);
  },
  getRiskTasks: () => {
    const state = get();
    return state.tasks.filter((task) => {
      const flags = getRiskFlags(task);
      return flags.blocked || flags.reopened || flags.stale || flags.unowned || flags.overdue;
    });
  },
  hydrateFromStorage: () => {},
  startWatching: () => () => {}, // No-op for demo

  startSimulation: () => {
    if (get().isSimulating) return;
    set({ isSimulating: true, timelineIndex: 0 });

    function runTimeline() {
      const events = DEMO_TIMELINE;
      const startTime = Date.now();

      function scheduleEvent(event: DemoEvent) {
        simulationTimer = setTimeout(() => {
          const { tasks, agents } = get();
          const now = new Date().toISOString();

          let updatedTasks = [...tasks];
          let updatedAgents = [...agents];

          switch (event.type) {
            case "create": {
              const newTask = { ...NEW_TASK_TEMPLATE, created_at: now, updated_at: now };
              updatedTasks.push(newTask);
              break;
            }

            case "claim": {
              const task = updatedTasks.find((t) => t.id === event.taskId);
              const agent = updatedAgents.find((a) => a.name === event.agent);
              if (task && agent) {
                const prevStatus = task.status;
                const newStatus = task.status === "backlog" || task.status === "todo" ? "in_progress" : task.status;
                task.claimed_by = event.agent;
                task.status = newStatus;
                task.updated_at = now;
                task.history.push({ ts: now, who: event.agent, action: "claimed", from: prevStatus, to: newStatus });

                agent.status = "working";
                agent.working_on = task.id;
                agent.last_active = now;
              }
              break;
            }

            case "release": {
              const task = updatedTasks.find((t) => t.id === event.taskId);
              const agent = updatedAgents.find((a) => a.name === event.agent);
              if (task && agent) {
                task.claimed_by = null;
                task.updated_at = now;
                task.history.push({ ts: now, who: event.agent, action: "released" });

                agent.status = "idle";
                agent.working_on = null;
                agent.last_active = now;
              }
              break;
            }

            case "complete": {
              const task = updatedTasks.find((t) => t.id === event.taskId);
              const agent = updatedAgents.find((a) => a.name === event.agent);
              if (task && agent) {
                const prevStatus = task.status;
                task.status = event.to || "done";
                task.claimed_by = null;
                task.updated_at = now;
                task.history.push({ ts: now, who: event.agent, action: "completed", from: prevStatus, to: task.status });

                agent.status = "idle";
                agent.working_on = null;
                agent.last_active = now;
              }
              break;
            }

            case "status_change": {
              const task = updatedTasks.find((t) => t.id === event.taskId);
              if (task) {
                const prevStatus = task.status;
                task.status = event.to || task.status;
                task.updated_at = now;
                task.history.push({ ts: now, who: event.agent, action: "status_change", from: prevStatus, to: task.status });
              }
              break;
            }

            case "comment": {
              const task = updatedTasks.find((t) => t.id === event.taskId);
              if (task) {
                task.updated_at = now;
                task.history.push({ ts: now, who: event.agent, action: "commented", note: event.note });
              }
              break;
            }
          }

          set({
            tasks: updatedTasks,
            agents: updatedAgents,
            summary: computeSummary(updatedTasks),
            timelineIndex: get().timelineIndex + 1,
          });

          // Check if we're done with all events
          const nextIndex = get().timelineIndex;
          if (nextIndex < events.length) {
            scheduleEvent(events[nextIndex]);
          } else {
            // Reset and loop after 2s pause
            simulationTimer = setTimeout(() => {
              get().resetDemo();
              get().startSimulation();
            }, 2000);
          }
        }, event.delay - (Date.now() - startTime));
      }

      scheduleEvent(events[0]);
    }

    runTimeline();
  },

  stopSimulation: () => {
    if (simulationTimer) {
      clearTimeout(simulationTimer);
      simulationTimer = null;
    }
    set({ isSimulating: false });
  },

  resetDemo: () => {
    if (simulationTimer) {
      clearTimeout(simulationTimer);
      simulationTimer = null;
    }
    set({
      tasks: deepClone(DEMO_TASKS),
      agents: deepClone(DEMO_AGENTS),
      meta: deepClone(DEMO_PROJECT_META),
      summary: computeSummary(DEMO_TASKS),
      isSimulating: false,
      timelineIndex: 0,
      selectedTaskId: null,
    });
  },
}));
