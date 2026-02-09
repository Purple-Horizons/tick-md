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

function KanbanColumn({ status, tasks, collapsed, onToggle }: { status: string; tasks: Task[]; collapsed: boolean; onToggle: () => void }) {
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
      <div className="flex-1 md:overflow-y-auto space-y-3 px-1 pb-4 min-h-[60px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
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
  const { tasks, workflow, moveTask, selectedTaskId, setSelectedTask } = store;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileStatus, setMobileStatus] = useState<string>("all");
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set(["done"])); // Default collapse "done"
  const [mounted, setMounted] = useState(false);

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

  const activeTask = activeId ? tasks.find((t: Task) => t.id === activeId) : null;
  const selectedTask = selectedTaskId ? tasks.find((t: Task) => t.id === selectedTaskId) : null;

  const visibleStatuses = [...workflow];
  if ((tasksByStatus["blocked"]?.length ?? 0) > 0) visibleStatuses.push("blocked");
  if ((tasksByStatus["reopened"]?.length ?? 0) > 0) visibleStatuses.push("reopened");

  // Mobile: filter tasks by selected status tab
  const mobileFilteredTasks = mobileStatus === "all"
    ? tasks
    : tasks.filter((t: Task) => t.status === mobileStatus);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const targetStatus = over.id as string;

    if (workflow.includes(targetStatus as TaskStatus) || targetStatus === "blocked" || targetStatus === "reopened") {
      const task = tasks.find((t: Task) => t.id === taskId);
      if (task && task.status !== targetStatus) {
        moveTask(taskId, targetStatus as TaskStatus);
      }
    }
  }

  return (
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
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {mobileFilteredTasks.length > 0 ? (
            mobileFilteredTasks.map((task: Task) => (
              <TaskCard key={task.id} task={task} />
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
          <div className="hidden md:flex flex-1 gap-4 lg:gap-5 p-5 lg:p-8 overflow-x-auto">
            {visibleStatuses.map((status) => (
              <KanbanColumn 
                key={status} 
                status={status} 
                tasks={tasksByStatus[status] || []} 
                collapsed={collapsedColumns.has(status)}
                onToggle={() => toggleColumn(status)}
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
  );
}
