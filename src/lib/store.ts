import { create } from "zustand";
import type { TickFile, Task, Agent, TaskStatus, ProjectMeta } from "./types";

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

  // Actions
  fetchStatus: () => Promise<void>;
  moveTask: (taskId: string, newStatus: TaskStatus) => Promise<void>;
  claimTask: (taskId: string, agent: string) => Promise<void>;
  releaseTask: (taskId: string, agent: string) => Promise<void>;
  setSelectedTask: (taskId: string | null) => void;
  setActiveView: (view: TickStore["activeView"]) => void;
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
    } catch (error: any) {
      set({ loading: false, error: error.message, connected: false });
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
          set({ connected: true });
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
