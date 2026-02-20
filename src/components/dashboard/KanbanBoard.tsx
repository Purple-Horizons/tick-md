"use client";

import { useState, useMemo, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import TaskCard from "./TaskCard";
import TaskDetail from "./TaskDetail";
import { useDashboardStore } from "./DashboardProvider";
import type { Task, TaskStatus } from "@/lib/types";
import FilterBar from "./FilterBar";
import DecisionCockpit from "./DecisionCockpit";

const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
  blocked: "Blocked",
  reopened: "Reopened",
};

const STATUS_COLORS: Record<string, string> = {
  backlog: "var(--color-text-muted)",
  todo: "var(--color-text)",
  in_progress: "var(--color-accent)",
  review: "var(--color-warning)",
  done: "var(--color-success)",
  blocked: "var(--color-danger)",
  reopened: "var(--color-info)",
};

function KanbanColumn({
  status,
  tasks,
  collapsed,
  onToggle,
  multiSelectMode,
  selectedIds,
  onToggleSelect,
  focusedTaskId,
}: {
  status: string;
  tasks: Task[];
  collapsed: boolean;
  onToggle: () => void;
  multiSelectMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (taskId: string) => void;
  focusedTaskId: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  if (collapsed) {
    return (
      <div
        ref={setNodeRef}
        className="flex-shrink-0 w-16 flex flex-col md:h-full border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-surface)]/30"
      >
        <button
          onClick={onToggle}
          className="flex flex-col items-center gap-2 px-2 py-3 hover:bg-[var(--color-bg-surface)] transition-colors rounded-xl group w-full"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
            <span className="font-mono text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-surface)] px-1.5 py-0.5 rounded">
              {tasks.length}
            </span>
          </div>
          <span className="font-heading text-xs font-semibold text-[var(--color-text-muted)] writing-mode-vertical rotate-180 group-hover:text-[var(--color-text)] transition-colors"
            style={{ writingMode: "vertical-rl" }}>
            {STATUS_LABELS[status] || status}
          </span>
          <span className="text-[var(--color-text-muted)] text-xs group-hover:text-[var(--color-accent)] transition-colors">→</span>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-shrink-0 w-full md:w-64 lg:w-72 flex flex-col md:h-full
        ${isOver ? "ring-1 ring-[var(--color-accent)]/40 rounded-xl" : ""}
      `}
    >
      {/* Column header - hidden on mobile (we use tabs instead) */}
      <div className="hidden md:flex items-center justify-between px-3 py-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
          <span className="font-heading text-sm font-semibold text-[var(--color-text)]">
            {STATUS_LABELS[status] || status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-surface)] px-1.5 py-0.5 rounded">
            {tasks.length}
          </span>
          <button
            onClick={onToggle}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-sm transition-colors"
            title="Collapse column"
          >
            ←
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 md:overflow-y-auto space-y-2 px-1 pb-4 min-h-[60px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              multiSelectMode={multiSelectMode}
              selected={selectedIds.has(task.id)}
              focused={focusedTaskId === task.id}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className={`
            border border-dashed border-[var(--color-border)] rounded-lg py-8 text-center
            ${isOver ? "border-[var(--color-accent)]/60 bg-[var(--color-accent)]/5" : ""}
            transition-colors duration-150
          `}>
            <span className="font-sans text-xs text-[var(--color-text-muted)]">
              {isOver ? "Drop here" : "No tasks"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard() {
  const store = useDashboardStore();
  const { workflow, moveTask, selectedTaskId, setSelectedTask } = store;
  const tasks = store.getVisibleTasks();
  const allTasks = store.tasks;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileStatus, setMobileStatus] = useState<string>("all");
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set(["done"])); // Default collapse "done"
  const [mounted, setMounted] = useState(false);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<TaskStatus>("todo");
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const toggleColumn = (status: string) => {
    setCollapsedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    for (const status of workflow) {
      grouped[status] = [];
    }
    grouped["blocked"] = [];
    grouped["reopened"] = [];

    for (const task of tasks) {
      if (!grouped[task.status]) grouped[task.status] = [];
      grouped[task.status].push(task);
    }

    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    for (const status in grouped) {
      grouped[status].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }

    return grouped;
  }, [tasks, workflow]);

  const activeTask = activeId ? allTasks.find((t: Task) => t.id === activeId) : null;
  const selectedTask = selectedTaskId ? allTasks.find((t: Task) => t.id === selectedTaskId) : null;

  const visibleStatuses = [...workflow];
  if ((tasksByStatus["blocked"]?.length ?? 0) > 0) visibleStatuses.push("blocked");
  if ((tasksByStatus["reopened"]?.length ?? 0) > 0) visibleStatuses.push("reopened");

  // Mobile: filter tasks by selected status tab
  const mobileFilteredTasks = mobileStatus === "all"
    ? tasks
    : tasks.filter((t: Task) => t.status === mobileStatus);

  const orderedVisibleTaskIds = useMemo(() => {
    const list: string[] = [];
    for (const status of visibleStatuses) {
      (tasksByStatus[status] || []).forEach((task: Task) => list.push(task.id));
    }
    return list;
  }, [tasksByStatus, visibleStatuses]);

  function handleDragStart(event: DragStartEvent) {
    if (multiSelectMode) return;
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    if (multiSelectMode) return;
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const targetStatus = over.id as string;

    if (workflow.includes(targetStatus as TaskStatus) || targetStatus === "blocked" || targetStatus === "reopened") {
      const task = allTasks.find((t: Task) => t.id === taskId);
      if (task && task.status !== targetStatus) {
        moveTask(taskId, targetStatus as TaskStatus);
      }
    }
  }

  function toggleSelect(taskId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  async function applyBulkStatus() {
    const ids = [...selectedIds];
    for (const id of ids) {
      const task = allTasks.find((entry: Task) => entry.id === id);
      if (task && task.status !== bulkStatus) {
        // Intentional sequential updates to preserve mutation order/history clarity
        // eslint-disable-next-line no-await-in-loop
        await moveTask(id, bulkStatus);
      }
    }
    setSelectedIds(new Set());
    setMultiSelectMode(false);
  }

  async function quickAdvanceFocusedTask() {
    if (!focusedTaskId) return;
    const task = allTasks.find((entry: Task) => entry.id === focusedTaskId);
    if (!task) return;
    const idx = workflow.indexOf(task.status);
    const next = idx >= 0 && idx < workflow.length - 1 ? workflow[idx + 1] : "todo";
    if (task.status !== next) {
      await moveTask(task.id, next);
    }
  }

  const hasFilteredResults = tasks.length > 0;
  const hasAnyTasks = allTasks.length > 0;
  const hasActiveFilters =
    store.filters.text.length > 0 ||
    store.filters.tags.length > 0 ||
    store.filters.agents.length > 0 ||
    store.filters.statuses.length > 0 ||
    store.filters.priorities.length > 0 ||
    store.filters.blockedOnly ||
    store.filters.depsOnly ||
    store.filters.mineOnly ||
    store.filters.unownedOnly;

  useEffect(() => {
    if (!focusedTaskId && orderedVisibleTaskIds.length > 0) {
      setFocusedTaskId(orderedVisibleTaskIds[0]);
      return;
    }
    if (focusedTaskId && !orderedVisibleTaskIds.includes(focusedTaskId)) {
      setFocusedTaskId(orderedVisibleTaskIds[0] || null);
    }
  }, [focusedTaskId, orderedVisibleTaskIds]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || (event.target as HTMLElement | null)?.isContentEditable) {
        return;
      }
      if (orderedVisibleTaskIds.length === 0) return;
      const currentIndex = focusedTaskId ? orderedVisibleTaskIds.indexOf(focusedTaskId) : 0;

      if (event.key === "j") {
        event.preventDefault();
        const next = Math.min(orderedVisibleTaskIds.length - 1, Math.max(0, currentIndex + 1));
        setFocusedTaskId(orderedVisibleTaskIds[next]);
      }
      if (event.key === "k") {
        event.preventDefault();
        const prev = Math.max(0, currentIndex - 1);
        setFocusedTaskId(orderedVisibleTaskIds[prev]);
      }
      if (event.key.toLowerCase() === "x" && multiSelectMode && focusedTaskId) {
        event.preventDefault();
        toggleSelect(focusedTaskId);
      }
      if (event.key === "." && focusedTaskId) {
        event.preventDefault();
        quickAdvanceFocusedTask();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusedTaskId, orderedVisibleTaskIds, multiSelectMode]);

  return (
    <div className="flex h-full flex-col">
      <DecisionCockpit />
      <FilterBar />
      <div className="flex items-center justify-between gap-2 px-3 md:px-5 py-2 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <span className="hidden md:inline font-mono text-[10px] text-[var(--color-text-muted)]">
            Keys: j/k focus, . advance, x select
          </span>
          <button
            onClick={() => {
              setMultiSelectMode(!multiSelectMode);
              setSelectedIds(new Set());
            }}
            className={`px-2 py-1 rounded text-xs font-mono border ${
              multiSelectMode ? "border-[var(--color-accent)] text-[var(--color-accent)]" : "border-[var(--color-border)] text-[var(--color-text-dim)]"
            }`}
          >
            {multiSelectMode ? "Exit Select" : "Bulk Select"}
          </button>
          {multiSelectMode && (
            <span className="font-mono text-xs text-[var(--color-text-dim)]">{selectedIds.size} selected</span>
          )}
        </div>
        {multiSelectMode && (
          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(event) => setBulkStatus(event.target.value as TaskStatus)}
              className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded px-2 py-1 text-xs font-mono text-[var(--color-text-dim)]"
            >
              {workflow.map((status: TaskStatus) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
              <option value="blocked">blocked</option>
              <option value="reopened">reopened</option>
            </select>
            <button
              disabled={selectedIds.size === 0}
              onClick={applyBulkStatus}
              className="px-2 py-1 rounded text-xs font-mono border border-[var(--color-accent)]/30 text-[var(--color-accent)] disabled:opacity-50"
              title={`Preview: move ${selectedIds.size} tasks to ${bulkStatus}`}
            >
              Apply {selectedIds.size}
            </button>
          </div>
        )}
      </div>

      {!hasFilteredResults && hasAnyTasks && hasActiveFilters && (
        <div className="mx-3 md:mx-5 mt-3 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg p-3">
          <p className="font-sans text-sm text-[var(--color-text-dim)] mb-2">No tasks match current filters.</p>
          <div className="flex items-center flex-wrap gap-2">
            <button onClick={() => store.resetFilters()} className="px-2 py-1 rounded text-xs font-mono border border-[var(--color-border)] text-[var(--color-text-dim)]">
              Clear all filters
            </button>
            {store.filters.tags.length > 0 && (
              <button
                onClick={() => store.setFilters({ tags: [] })}
                className="px-2 py-1 rounded text-xs font-mono border border-[var(--color-border)] text-[var(--color-text-dim)]"
              >
                Remove tag filters
              </button>
            )}
            {store.filters.agents.length > 0 && (
              <button
                onClick={() => store.setFilters({ agents: [] })}
                className="px-2 py-1 rounded text-xs font-mono border border-[var(--color-border)] text-[var(--color-text-dim)]"
              >
                Remove agent filters
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex h-full">
      {/* ── Mobile: tab-based single column ── */}
      <div className="md:hidden flex-1 flex flex-col">
        {/* Status tabs */}
        <div className="flex-shrink-0 overflow-x-auto border-b border-[var(--color-border)] px-3 py-2">
          <div className="flex gap-1 min-w-max">
            <button
              onClick={() => setMobileStatus("all")}
              className={`px-3 py-1.5 rounded-lg font-sans text-xs font-medium transition-colors ${
                mobileStatus === "all"
                  ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              All ({tasks.length})
            </button>
            {visibleStatuses.map((status) => {
              const count = tasksByStatus[status]?.length ?? 0;
              return (
                <button
                  key={status}
                  onClick={() => setMobileStatus(status)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-medium transition-colors whitespace-nowrap ${
                    mobileStatus === status
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "text-[var(--color-text-muted)]"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
                  {STATUS_LABELS[status] || status} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile task list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {mobileFilteredTasks.length > 0 ? (
            mobileFilteredTasks.map((task: Task) => (
              <TaskCard
                key={task.id}
                task={task}
                multiSelectMode={multiSelectMode}
                selected={selectedIds.has(task.id)}
                focused={focusedTaskId === task.id}
                onToggleSelect={toggleSelect}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <span className="font-sans text-sm text-[var(--color-text-muted)]">No tasks</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop/Tablet: full kanban columns (deferred to avoid hydration mismatch from dnd-kit) ── */}
      {mounted ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="hidden md:flex flex-1 gap-3 lg:gap-4 p-4 lg:p-6 overflow-x-auto">
            {visibleStatuses.map((status) => (
              <KanbanColumn 
                key={status} 
                status={status} 
                tasks={tasksByStatus[status] || []} 
                collapsed={collapsedColumns.has(status)}
                onToggle={() => toggleColumn(status)}
                multiSelectMode={multiSelectMode}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                focusedTaskId={focusedTaskId}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="w-64 lg:w-72 opacity-90 rotate-2">
                <TaskCard task={activeTask} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <p className="font-sans text-sm text-[var(--color-text-muted)]">Loading board…</p>
        </div>
      )}

      {/* Task detail slide-over / full-screen on mobile */}
      {selectedTask && (
        <TaskDetail task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
      </div>
    </div>
  );
}
