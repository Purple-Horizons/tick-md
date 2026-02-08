"use client";

import type { Task } from "@/lib/types";
import { PRIORITY_CONFIG } from "@/lib/types";
import { useTickStore } from "@/lib/store";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function TaskCard({ task, overlay }: { task: Task; overlay?: boolean }) {
  const selectTask = useTickStore((s) => s.selectTask);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: overlay });

  const style = overlay
    ? {}
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      };

  const pri = PRIORITY_CONFIG[task.priority];
  const blockedCount = task.blocks.length;
  const depCount = task.depends_on.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => selectTask(task.id)}
      className={`
        group bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg p-3.5
        cursor-grab active:cursor-grabbing hover:border-[var(--color-accent)]/30 transition-all
        ${overlay ? "shadow-xl shadow-black/40 rotate-2 scale-105" : ""}
      `}
    >
      {/* Header: ID + Priority */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
          {task.id}
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{ color: pri.color, backgroundColor: pri.bg }}
        >
          {pri.label}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-[var(--color-text)] leading-snug mb-2.5 group-hover:text-white transition-colors">
        {task.title}
      </h4>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-bg)]/60 text-[var(--color-text-muted)] border border-[var(--color-border)]/50"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-[10px] text-[var(--color-text-muted)]">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: assignee, deps, blocks */}
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          {task.claimed_by ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
              <span className="font-mono text-[var(--color-accent)]">
                {task.claimed_by}
              </span>
            </>
          ) : task.assigned_to ? (
            <span className="font-mono text-[var(--color-text-muted)]">
              {task.assigned_to}
            </span>
          ) : (
            <span className="text-[var(--color-text-muted)] italic">unassigned</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {depCount > 0 && (
            <span className="text-[var(--color-text-muted)]" title={`Depends on ${depCount} task(s)`}>
              ↑{depCount}
            </span>
          )}
          {blockedCount > 0 && (
            <span className="text-[var(--color-warning)]" title={`Blocks ${blockedCount} task(s)`}>
              ↓{blockedCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
