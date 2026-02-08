"use client";

import { useMemo } from "react";
import { useDashboardStore } from "./DashboardProvider";
import type { HistoryEntry } from "@/lib/types";

interface FeedItem {
  taskId: string;
  taskTitle: string;
  entry: HistoryEntry;
}

const ACTION_STYLES: Record<string, { icon: string; color: string }> = {
  created: { icon: "✦", color: "var(--color-text-dim)" },
  claimed: { icon: "◉", color: "var(--color-accent)" },
  released: { icon: "○", color: "var(--color-warning)" },
  completed: { icon: "✓", color: "var(--color-success)" },
  status_change: { icon: "→", color: "var(--color-info)" },
  commented: { icon: "◇", color: "var(--color-accent)" },
  assigned: { icon: "◎", color: "var(--color-text)" },
};

export default function ActivityFeed() {
  const store = useDashboardStore();
  const { tasks } = store;

  const feed = useMemo(() => {
    const items: FeedItem[] = [];
    for (const task of tasks) {
      for (const entry of task.history) {
        items.push({ taskId: task.id, taskTitle: task.title, entry });
      }
    }
    // Sort by timestamp descending
    items.sort((a, b) => new Date(b.entry.ts).getTime() - new Date(a.entry.ts).getTime());
    return items;
  }, [tasks]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, FeedItem[]> = {};
    for (const item of feed) {
      const date = new Date(item.entry.ts).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    }
    return groups;
  }, [feed]);

  return (
    <div className="p-6 max-w-3xl">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="mb-8">
          <div className="font-sans text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-4 sticky top-0 bg-[var(--color-bg)] py-2 z-10">
            {date}
          </div>

          <div className="space-y-0">
            {items.map((item, i) => {
              const style = ACTION_STYLES[item.entry.action] || { icon: "·", color: "var(--color-text-muted)" };

              return (
                <div
                  key={`${item.taskId}-${i}`}
                  className="flex gap-4 py-3 border-b border-[var(--color-border)]/30 last:border-0 group hover:bg-[var(--color-bg-surface)]/30 -mx-3 px-3 rounded-lg transition-colors"
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center pt-1">
                    <span className="text-sm" style={{ color: style.color }}>{style.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold" style={{ color: style.color }}>
                        {item.entry.who}
                      </span>
                      <span className="font-sans text-sm text-[var(--color-text)]">
                        {item.entry.action.replace(/_/g, " ")}
                      </span>
                      <span className="font-mono text-xs text-[var(--color-accent)]">
                        {item.taskId}
                      </span>
                      {item.entry.from && item.entry.to && (
                        <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
                          ({item.entry.from} → {item.entry.to})
                        </span>
                      )}
                    </div>

                    <div className="font-sans text-xs text-[var(--color-text-dim)] mt-0.5 truncate">
                      {item.taskTitle}
                    </div>

                    {item.entry.note && (
                      <div className="font-sans text-xs text-[var(--color-text-dim)] mt-1.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2.5 py-1.5 italic">
                        &ldquo;{item.entry.note}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Time */}
                  <span className="font-mono text-[10px] text-[var(--color-text-muted)] flex-shrink-0 pt-1">
                    {new Date(item.entry.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {feed.length === 0 && (
        <div className="text-center py-16">
          <p className="font-sans text-sm text-[var(--color-text-muted)]">No activity yet</p>
        </div>
      )}
    </div>
  );
}
