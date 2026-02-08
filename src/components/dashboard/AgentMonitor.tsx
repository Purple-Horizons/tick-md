"use client";

import { useDashboardStore } from "./DashboardProvider";
import type { AgentStatus, Agent } from "@/lib/types";

const STATUS_CONFIG: Record<AgentStatus, { color: string; label: string; pulse: boolean }> = {
  working: { color: "var(--color-accent)", label: "Working", pulse: true },
  idle: { color: "var(--color-warning)", label: "Idle", pulse: false },
  offline: { color: "var(--color-text-muted)", label: "Offline", pulse: false },
};

export default function AgentMonitor() {
  const store = useDashboardStore();
  const { agents, tasks } = store;

  const working = agents.filter((a: Agent) => a.status === "working").length;
  const idle = agents.filter((a: Agent) => a.status === "idle").length;
  const offline = agents.filter((a: Agent) => a.status === "offline").length;

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
        {[
          { label: "Working", count: working, color: "var(--color-accent)" },
          { label: "Idle", count: idle, color: "var(--color-warning)" },
          { label: "Offline", count: offline, color: "var(--color-text-muted)" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-3 md:p-4">
            <div className="flex items-center gap-1.5 md:gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }} />
              <span className="font-sans text-[10px] md:text-xs text-[var(--color-text-muted)] uppercase tracking-wider">{stat.label}</span>
            </div>
            <span className="font-serif text-2xl md:text-3xl text-white">{stat.count}</span>
          </div>
        ))}
      </div>

      {/* ── Mobile: Agent cards ── */}
      <div className="md:hidden space-y-2">
        {agents.map((agent: Agent) => {
          const config = STATUS_CONFIG[agent.status];
          return (
            <div
              key={agent.name}
              className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${config.pulse ? "animate-pulse" : ""}`}
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="font-mono text-sm text-[var(--color-text)]">{agent.name}</span>
                </div>
                <span className="font-mono text-xs" style={{ color: config.color }}>
                  {config.label}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[var(--color-text-dim)]">{agent.type}</span>
                  <span className="font-mono text-[var(--color-text-dim)]">{agent.roles.join(", ")}</span>
                </div>
                {agent.working_on ? (
                  <span className="font-mono text-[var(--color-accent)]">{agent.working_on}</span>
                ) : (
                  <span className="font-mono text-[var(--color-text-muted)]">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tablet/Desktop: Agent table ── */}
      <div className="hidden md:block bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_1fr] gap-4 px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-card)]">
          <span className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Agent</span>
          <span className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Type</span>
          <span className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Status</span>
          <span className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Working On</span>
          <span className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-wider hidden lg:block">Role</span>
          <span className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-wider hidden lg:block">Trust</span>
        </div>

        {agents.map((agent: Agent) => {
          const config = STATUS_CONFIG[agent.status];
          return (
            <div
              key={agent.name}
              className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_1fr] gap-4 px-5 py-3 border-b border-[var(--color-border)]/40 last:border-0 hover:bg-[var(--color-bg-card)]/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${config.pulse ? "animate-pulse" : ""}`}
                  style={{ backgroundColor: config.color }}
                />
                <span className="font-mono text-sm text-[var(--color-text)] truncate">{agent.name}</span>
              </div>
              <span className="font-mono text-xs text-[var(--color-text-dim)] self-center">{agent.type}</span>
              <span className="font-mono text-xs self-center" style={{ color: config.color }}>{config.label}</span>
              <span className="font-mono text-xs self-center truncate">
                {agent.working_on ? (
                  <span className="text-[var(--color-accent)]">{agent.working_on}</span>
                ) : (
                  <span className="text-[var(--color-text-muted)]">—</span>
                )}
              </span>
              <span className="font-mono text-xs text-[var(--color-text-dim)] self-center hidden lg:block truncate">{agent.roles.join(", ")}</span>
              <span className="font-mono text-xs text-[var(--color-text-dim)] self-center hidden lg:block">{agent.trust_level}</span>
            </div>
          );
        })}

        {agents.length === 0 && (
          <div className="px-5 py-8 text-center">
            <p className="font-sans text-sm text-[var(--color-text-muted)]">No agents registered</p>
          </div>
        )}
      </div>
    </div>
  );
}
