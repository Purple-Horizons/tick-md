"use client";

import { useMemo } from "react";
import { useDashboardStore } from "./DashboardProvider";
import type { CapacitySignal, DigestItem, RecommendationItem } from "@/lib/dashboard-intelligence";
import type { Task } from "@/lib/types";

export default function DecisionCockpit() {
  const store = useDashboardStore();
  const digest: DigestItem[] = store.getDigest();
  const recommendations: RecommendationItem[] = store.getRecommendations();
  const risks: Task[] = store.getRiskTasks();
  const capacities: CapacitySignal[] = store.getCapacitySignals();
  const conflictRadar = store.tasks.filter(
    (task: Task) =>
      task.claimed_by &&
      task.assigned_to &&
      task.claimed_by !== task.assigned_to &&
      task.status === "in_progress"
  );

  const overloaded = useMemo(() => capacities.filter((item: CapacitySignal) => item.overloaded), [capacities]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 p-3 md:p-5 border-b border-[var(--color-border)]">
      <section className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-3">
        <h3 className="font-mono text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Since Last Visit</h3>
        {digest.length === 0 ? (
          <p className="font-sans text-xs text-[var(--color-text-dim)]">No recent updates.</p>
        ) : (
          <ul className="space-y-1.5">
            {digest.slice(0, 5).map((item) => (
              <li key={`${item.taskId}-${item.ts}`} className="font-sans text-xs text-[var(--color-text-dim)]">
                <span className="font-mono text-[var(--color-accent)]">{item.taskId}</span> {item.action} by{" "}
                <span className="font-mono text-[var(--color-text)]">{item.who}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-3">
        <h3 className="font-mono text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Next Best Tasks</h3>
        {recommendations.length === 0 ? (
          <p className="font-sans text-xs text-[var(--color-text-dim)]">No suggestions.</p>
        ) : (
          <ul className="space-y-1.5">
            {recommendations.map((item) => (
              <li key={item.taskId} className="font-sans text-xs text-[var(--color-text-dim)]">
                <span className="font-mono text-[var(--color-accent)]">{item.taskId}</span> score {item.score}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-3">
        <h3 className="font-mono text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Risk & Capacity</h3>
        <p className="font-sans text-xs text-[var(--color-text-dim)] mb-2">{risks.length} risk tasks detected</p>
        {overloaded.length > 0 ? (
          <ul className="space-y-1">
            {overloaded.map((item) => (
              <li key={item.agent} className="font-mono text-xs text-[var(--color-danger)]">
                {item.agent} overloaded ({item.activeCount})
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-sans text-xs text-[var(--color-text-dim)]">No WIP overloads.</p>
        )}
        {conflictRadar.length > 0 && (
          <p className="font-sans text-xs text-[var(--color-warning)] mt-2">
            Conflict radar: {conflictRadar.map((task: Task) => task.id).join(", ")}
          </p>
        )}
      </section>
    </div>
  );
}
