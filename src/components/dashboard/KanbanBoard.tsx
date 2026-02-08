"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { useTickStore, useFilteredTasks } from "@/lib/store";
import { WORKFLOW_COLUMNS, type TaskStatus } from "@/lib/types";
import { TaskCard } from "./TaskCard";

function Column({ status, label }: { status: TaskStatus; label: string }) {
  const tasks = useFilteredTasks();
  const columnTasks = useMemo(
    () => tasks.filter((t) => t.status === status),
    [tasks, status]
  );

  const { setNodeRef, isOver } = useDroppable({ id: status });

  const statusColors: Record<string, string> = {
    backlog: "var(--color-text-muted)",
    todo: "var(--color-info)",
    in_progress: "var(--color-accent)",
    review: "var(--color-warning)",
    done: "var(--color-success)",
  };

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-1 min-w-[260px] max-w-[320px] flex flex-col rounded-xl
        bg-[var(--color-bg-surface)]/50 border transition-colors
        ${isOver ? "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5" : "border-transparent"}
      `}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: statusColors[status] || "var(--color-text-muted)" }}
          />
          <span className="text-sm font-semibold text-[var(--color-text)]">
            {label}
          </span>
        </div>
        <span className="text-xs font-mono text-[var(--color-text-muted)] bg-[var(--color-bg)]/60 px-2 py-0.5 rounded-full">
          {columnTasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 px-2 pb-3 space-y-2 overflow-y-auto min-h-[120px]">
        <SortableContext
          items={columnTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {columnTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {columnTasks.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-[var(--color-text-muted)] border border-dashed border-[var(--color-border)] rounded-lg">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard() {
  const { tasks, moveTask } = useTickStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const isColumn = WORKFLOW_COLUMNS.some((c) => c.key === overId);
    if (isColumn) {
      moveTask(taskId, overId as TaskStatus);
      return;
    }

    // Dropped on another task — find which column that task is in
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask && overTask.status !== tasks.find((t) => t.id === taskId)?.status) {
      moveTask(taskId, overTask.status);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-6 h-full overflow-x-auto">
        {WORKFLOW_COLUMNS.map((col) => (
          <Column key={col.key} status={col.key} label={col.label} />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
