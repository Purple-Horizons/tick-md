import { create } from "zustand";
import type { TickFile, Task, Agent, TaskStatus, ProjectMeta } from "./types";
import type { DashboardFilters } from "./dashboard-intelligence";
import {
  buildCapacitySignals,
  buildDigest,
  defaultFilters,
  filterTasks,
  getCriticalPathTasks,
  suggestNextTasks,
  getRiskFlags,
} from "./dashboard-intelligence";

interface SavedView {
  name: string;
  filters: DashboardFilters;
}

interface TickStore {
  // Data
  meta: ProjectMeta | null;
  tasks: Task[];
  agents: Agent[];
  workflow: TaskStatus[];
  summary: { total: number; done: number; percentage: number; by_status: Record<string, number> } | null;

  // UI state
  loading: boolean;
  error: string | null;
  connected: boolean;
  selectedTaskId: string | null;
  activeView: "board" | "agents" | "activity" | "graph" | "settings";
  filters: DashboardFilters;
  savedViews: SavedView[];
  currentAgent: string;
  lastSeenAt: string | null;
  pwaOfflineSnapshot: string | null;
  pwaOfflineMode: boolean;

  // Actions
  fetchStatus: () => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  claimTask: (taskId: string, agent: string) => Promise<void>;
  releaseTask: (taskId: string, agent: string) => Promise<void>;
  setSelectedTask: (taskId: string | null) => void;
  setActiveView: (view: TickStore["activeView"]) => void;
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
}

export const useTickStore = create<TickStore>((set, get) => ({
  meta: null,
  tasks: [],
  agents: [],
  workflow: ["backlog", "todo", "in_progress", "review", "done"],
  summary: null,
  loading: true,
  error: null,
  connected: false,
  selectedTaskId: null,
  activeView: "board",
  filters: defaultFilters(),
  savedViews: [],
  currentAgent: "@dashboard",
  lastSeenAt: null,
  pwaOfflineSnapshot: null,
  pwaOfflineMode: false,

  fetchStatus: async () => {
    try {
      set({ loading: true, error: null });
      const res = await fetch("/api/tick/status");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch status");
      }
      const data = await res.json();
      set({
        meta: data.meta,
        tasks: data.tasks,
        agents: data.agents,
        workflow: data.meta.default_workflow,
        summary: data.summary,
        loading: false,
        connected: true,
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("tick-dashboard-offline-snapshot", JSON.stringify(data));
      }
    } catch (error: any) {
      if (typeof window !== "undefined") {
        const cached = localStorage.getItem("tick-dashboard-offline-snapshot");
        if (cached) {
          try {
            const data = JSON.parse(cached);
            set({
              meta: data.meta,
              tasks: data.tasks,
              agents: data.agents,
              workflow: data.meta.default_workflow,
              summary: data.summary,
              loading: false,
              connected: false,
              pwaOfflineMode: true,
              pwaOfflineSnapshot: data.meta?.updated || new Date().toISOString(),
            });
            return;
          } catch {
            // ignore invalid cache
          }
        }
      }
      set({ loading: false, error: error.message, connected: false, pwaOfflineMode: false });
    }
  },

  moveTask: async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic update
    const prevTasks = get().tasks;
    set({
      tasks: prevTasks.map((t) =>
        t.id === taskId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t
      ),
    });

    try {
      const res = await fetch("/api/tick/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: newStatus, agent: "@dashboard" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      // Refetch for consistency
      get().fetchStatus();
    } catch (error: any) {
      // Revert optimistic update
      set({ tasks: prevTasks, error: error.message });
    }
  },

  claimTask: async (taskId: string, agent: string) => {
    try {
      const res = await fetch("/api/tick/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, agent, action: "claim" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      get().fetchStatus();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  releaseTask: async (taskId: string, agent: string) => {
    try {
      const res = await fetch("/api/tick/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, agent, action: "release" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      get().fetchStatus();
    } catch (error: any) {
      set({ error: error.message });
    }
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
      if (typeof window !== "undefined") {
        localStorage.setItem("tick-dashboard-saved-views", JSON.stringify(next));
      }
      return { savedViews: next };
    }),
  applySavedView: (name) =>
    set((state) => {
      const found = state.savedViews.find((view) => view.name === name);
      if (!found) return state;
      return { filters: found.filters };
    }),
  removeSavedView: (name) =>
    set((state) => {
      const next = state.savedViews.filter((view) => view.name !== name);
      if (typeof window !== "undefined") {
        localStorage.setItem("tick-dashboard-saved-views", JSON.stringify(next));
      }
      return { savedViews: next };
    }),
  setPwaOfflineMode: (offline) => set({ pwaOfflineMode: offline }),
  setPwaOfflineSnapshot: (snapshot) => set({ pwaOfflineSnapshot: snapshot }),
  updateLastSeen: () => {
    const now = new Date().toISOString();
    set({ lastSeenAt: now });
    if (typeof window !== "undefined") {
      localStorage.setItem("tick-dashboard-last-seen", now);
    }
  },
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
  hydrateFromStorage: () => {
    if (typeof window === "undefined") return;
    try {
      const views = localStorage.getItem("tick-dashboard-saved-views");
      const lastSeen = localStorage.getItem("tick-dashboard-last-seen");
      set({
        savedViews: views ? JSON.parse(views) : [],
        lastSeenAt: lastSeen || null,
      });
    } catch {
      set({ savedViews: [], lastSeenAt: null });
    }
  },

  startWatching: () => {
    const eventSource = new EventSource("/api/tick/watch");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "change") {
          // File changed on disk - refetch
          get().fetchStatus();
        }
        if (data.type === "connected") {
          set({ connected: true, pwaOfflineMode: false });
        }
      } catch {}
    };

    eventSource.onerror = () => {
      set({ connected: false });
      // Will auto-reconnect
    };

    return () => {
      eventSource.close();
      set({ connected: false });
    };
  },
}));
