"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task, Priority } from "@/lib/types";
import { useDashboardStore } from "./DashboardProvider";

const PRIORITY_COLORS: Record<Priority, string> = {
  urgent: "var(--color-danger)",
  high: "var(--color-warning)",
  medium: "var(--color-accent)",
  low: "var(--color-text-muted)",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  urgent: "!!",
  high: "!",
  medium: "—",
  low: "·",
};

export default function TaskCard({
  task,
  multiSelectMode = false,
  selected = false,
  focused = false,
  onToggleSelect,
}: {
  task: Task;
  multiSelectMode?: boolean;
  selected?: boolean;
  focused?: boolean;
  onToggleSelect?: (taskId: string) => void;
}) {
  const store = useDashboardStore();
  const { setSelectedTask, toggleTagFilter, toggleAgentFilter } = store;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (multiSelectMode) {
          onToggleSelect?.(task.id);
          return;
        }
        setSelectedTask(task.id);
      }}
      className={`
        group bg-[var(--color-bg-card)] border border-[var(--color-border)]
        rounded-lg p-4 cursor-grab active:cursor-grabbing
        hover:border-[var(--color-border-accent)] transition-all duration-150
        ${isDragging ? "shadow-lg shadow-[var(--color-glow)]" : ""}
        ${selected ? "ring-1 ring-[var(--color-accent)]/60" : ""}
        ${focused ? "ring-1 ring-[var(--color-info)]/60" : ""}
      `}
    >
      {multiSelectMode && (
        <div className="mb-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect?.(task.id)}
            onClick={(event) => event.stopPropagation()}
            className="accent-[var(--color-accent)]"
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-[var(--color-accent)]">{task.id}</span>
        <span className="font-mono text-xs font-bold" style={{ color: PRIORITY_COLORS[task.priority] }} title={task.priority}>
          {PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      <h4 className="font-sans text-sm text-[var(--color-text)] leading-snug mb-2 line-clamp-2">{task.title}</h4>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 3).map((tag, i) => (
            <button
              key={`${tag}-${i}`}
              onClick={(event) => {
                event.stopPropagation();
                toggleTagFilter(tag);
              }}
              className="font-mono text-[10px] text-[var(--color-text-muted)] bg-[var(--color-bg)] px-1.5 py-0.5 rounded"
            >
              #{tag}
            </button>
          ))}
          {task.tags.length > 3 && <span className="font-mono text-[10px] text-[var(--color-text-muted)]">+{task.tags.length - 3}</span>}
        </div>
      )}

      <div className="flex items-center justify-between">
        {task.claimed_by ? (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
            <button
              onClick={(event) => {
                event.stopPropagation();
                toggleAgentFilter(task.claimed_by!);
              }}
              className="font-mono text-[11px] text-[var(--color-accent)] hover:underline"
            >
              {task.claimed_by}
            </button>
          </div>
        ) : (
          <span />
        )}
        {(task.depends_on.length > 0 || task.blocks.length > 0) && (
          <span
            className="font-mono text-[10px] text-[var(--color-text-muted)]"
            title={`Deps: ${task.depends_on.join(", ")} | Blocks: ${task.blocks.join(", ")}`}
          >
            {task.depends_on.length > 0 && `←${task.depends_on.length}`}
            {task.blocks.length > 0 && ` →${task.blocks.length}`}
          </span>
        )}
      </div>
    </div>
  );
}
