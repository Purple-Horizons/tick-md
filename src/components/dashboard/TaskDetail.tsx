"use client";

import type { Task, Priority } from "@/lib/types";

const PRIORITY_COLORS: Record<Priority, string> = {
  urgent: "var(--color-danger)",
  high: "var(--color-warning)",
  medium: "var(--color-accent)",
  low: "var(--color-text-muted)",
};

const ACTION_ICONS: Record<string, string> = {
  created: "✦",
  claimed: "◉",
  released: "○",
  completed: "✓",
  status_change: "→",
  commented: "◇",
  assigned: "◎",
  priority_change: "▲",
};

export default function TaskDetail({ task, onClose }: { task: Task; onClose: () => void }) {
  return (
    <>
      {/* Mobile: full-screen overlay */}
      <div className="md:hidden fixed inset-0 z-50 bg-[var(--color-bg)] overflow-y-auto">
        <DetailContent task={task} onClose={onClose} />
      </div>

      {/* Desktop: side panel */}
      <div className="hidden md:block w-80 lg:w-96 flex-shrink-0 border-l border-[var(--color-border)] bg-[var(--color-bg-surface)] overflow-y-auto">
        <DetailContent task={task} onClose={onClose} />
      </div>
    </>
  );
}

function DetailContent({ task, onClose }: { task: Task; onClose: () => void }) {
  return (
    <>
      {/* Header */}
      <div className="sticky top-0 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] px-4 md:px-5 py-3 md:py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[var(--color-accent)]">{task.id}</span>
          <span className="font-mono text-xs text-[var(--color-text-muted)]">·</span>
          <span
            className="font-mono text-xs font-bold"
            style={{ color: PRIORITY_COLORS[task.priority] }}
          >
            {task.priority}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-card)] transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>

      <div className="px-4 md:px-5 py-4 space-y-5">
        {/* Title */}
        <h2 className="font-sans text-lg font-semibold text-white leading-snug">
          {task.title}
        </h2>

        {/* Status */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-wider w-20">Status</span>
          <span className="font-mono text-sm text-[var(--color-text)] bg-[var(--color-bg-card)] px-2 py-1 rounded">
            {task.status.replace(/_/g, " ")}
          </span>
        </div>

        {/* Claimed by */}
        {task.claimed_by && (
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-wider w-20">Claimed</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
              <span className="font-mono text-sm text-[var(--color-accent)]">{task.claimed_by}</span>
            </div>
          </div>
        )}

        {/* Assigned to */}
        {task.assigned_to && (
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-wider w-20">Assigned</span>
            <span className="font-mono text-sm text-[var(--color-text)]">{task.assigned_to}</span>
          </div>
        )}

        {/* Created by */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-wider w-20">Created</span>
          <span className="font-mono text-sm text-[var(--color-text)]">{task.created_by}</span>
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div>
            <span className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Tags</span>
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map((tag, i) => (
                <span
                  key={`${tag}-${i}`}
                  className="font-mono text-xs text-[var(--color-text-dim)] bg-[var(--color-bg)] border border-[var(--color-border)] px-2 py-0.5 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dependencies */}
        {task.depends_on.length > 0 && (
          <div>
            <span className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Depends On</span>
            <div className="flex flex-wrap gap-1.5">
              {task.depends_on.map((dep) => (
                <span key={dep} className="font-mono text-xs text-[var(--color-info)] bg-[var(--color-bg)] px-2 py-0.5 rounded border border-[var(--color-border)]">
                  {dep}
                </span>
              ))}
            </div>
          </div>
        )}

        {task.blocks.length > 0 && (
          <div>
            <span className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Blocks</span>
            <div className="flex flex-wrap gap-1.5">
              {task.blocks.map((b) => (
                <span key={b} className="font-mono text-xs text-[var(--color-danger)] bg-[var(--color-bg)] px-2 py-0.5 rounded border border-[var(--color-border)]">
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {task.description && (
          <div>
            <span className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-2">Description</span>
            <div className="font-sans text-sm text-[var(--color-text-dim)] leading-relaxed bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-3">
              {task.description}
            </div>
          </div>
        )}

        {/* History */}
        <div>
          <span className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-wider block mb-3">History</span>
          <div className="space-y-0">
            {[...task.history].reverse().map((entry, i) => (
              <div key={i} className="flex gap-3 py-2 border-b border-[var(--color-border)]/40 last:border-0">
                <span className="text-sm w-5 text-center flex-shrink-0 mt-0.5">
                  {ACTION_ICONS[entry.action] || "·"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-mono text-xs text-[var(--color-accent)]">{entry.who}</span>
                    <span className="font-sans text-xs text-[var(--color-text)]">{entry.action}</span>
                    {entry.from && entry.to && (
                      <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
                        {entry.from} → {entry.to}
                      </span>
                    )}
                  </div>
                  {entry.note && (
                    <p className="font-sans text-xs text-[var(--color-text-dim)] mt-1 leading-relaxed">{entry.note}</p>
                  )}
                  <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
                    {new Date(entry.ts).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timestamps */}
        <div className="pt-3 border-t border-[var(--color-border)]">
          <div className="font-mono text-[10px] text-[var(--color-text-muted)] space-y-1">
            <div>Created: {new Date(task.created_at).toLocaleString()}</div>
            <div>Updated: {new Date(task.updated_at).toLocaleString()}</div>
            {task.estimated_hours && <div>Estimate: {task.estimated_hours}h</div>}
            {task.actual_hours && <div>Actual: {task.actual_hours}h</div>}
          </div>
        </div>
      </div>
    </>
  );
}
