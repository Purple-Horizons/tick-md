"use client";

import { useMemo, useState } from "react";
import { useDashboardStore } from "./DashboardProvider";
import type { Priority, TaskStatus } from "@/lib/types";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Agent, Task } from "@/lib/types";

const PRIORITIES: Priority[] = ["urgent", "high", "medium", "low"];
const STATUS_ORDER: TaskStatus[] = ["backlog", "todo", "in_progress", "review", "blocked", "reopened", "done"];

function ToggleChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded-md font-mono text-[11px] transition-colors ${
        active
          ? "bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30"
          : "bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
      }`}
    >
      {label}
    </button>
  );
}

export default function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const store = useDashboardStore();
  const { filters, tasks, agents, setFilters, resetFilters, saveCurrentView, savedViews, applySavedView, removeSavedView } = store;
  const [saveName, setSaveName] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("q");
    const tags = params.get("tags");
    const agentsParam = params.get("agents");
    if (fromUrl || tags || agentsParam) {
      setFilters({
        text: fromUrl || "",
        tags: tags ? tags.split(",").filter(Boolean) : [],
        agents: agentsParam ? agentsParam.split(",").filter(Boolean) : [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setFilters]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.text) params.set("q", filters.text);
    if (filters.tags.length) params.set("tags", filters.tags.join(","));
    if (filters.agents.length) params.set("agents", filters.agents.join(","));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [filters.text, filters.tags, filters.agents, pathname, router]);

  const tags = useMemo(() => {
    const set = new Set<string>();
    (tasks as Task[]).forEach((task: Task) => task.tags.forEach((tag: string) => set.add(tag)));
    return [...set].sort();
  }, [tasks]);

  return (
    <div className="space-y-2 border-b border-[var(--color-border)] px-3 md:px-5 py-3">
      <div className="flex items-center flex-wrap gap-2">
        <input
          value={filters.text}
          onChange={(e) => setFilters({ text: e.target.value })}
          placeholder="Search by id, title, tag..."
          className="w-full md:w-64 px-2.5 py-1.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg font-sans text-xs text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
        />
        <ToggleChip active={filters.mineOnly} onClick={() => setFilters({ mineOnly: !filters.mineOnly })} label="Mine" />
        <ToggleChip active={filters.blockedOnly} onClick={() => setFilters({ blockedOnly: !filters.blockedOnly })} label="Risk" />
        <ToggleChip active={filters.unownedOnly} onClick={() => setFilters({ unownedOnly: !filters.unownedOnly })} label="Unowned" />
        <ToggleChip active={filters.depsOnly} onClick={() => setFilters({ depsOnly: !filters.depsOnly })} label="Dependencies" />
        <ToggleChip active={filters.mode === "and"} onClick={() => setFilters({ mode: filters.mode === "and" ? "or" : "and" })} label={`Tags: ${filters.mode.toUpperCase()}`} />
        <button onClick={resetFilters} className="px-2 py-1 rounded-md font-mono text-[11px] border border-[var(--color-border)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
          Clear
        </button>
      </div>

      <div className="flex items-center flex-wrap gap-1.5">
        {STATUS_ORDER.map((status) => (
          <ToggleChip
            key={status}
            label={status}
            active={filters.statuses.includes(status)}
            onClick={() =>
              setFilters({
                statuses: filters.statuses.includes(status)
                  ? filters.statuses.filter((value: TaskStatus) => value !== status)
                  : [...filters.statuses, status],
              })
            }
          />
        ))}
      </div>

      <div className="flex items-center flex-wrap gap-1.5">
        {PRIORITIES.map((priority) => (
          <ToggleChip
            key={priority}
            label={priority}
            active={filters.priorities.includes(priority)}
            onClick={() =>
              setFilters({
                priorities: filters.priorities.includes(priority)
                  ? filters.priorities.filter((value: Priority) => value !== priority)
                  : [...filters.priorities, priority],
              })
            }
          />
        ))}
      </div>

      <div className="flex items-center flex-wrap gap-1.5">
        {tags.map((tag) => (
          <ToggleChip
            key={tag}
            label={`#${tag}`}
            active={filters.tags.includes(tag)}
            onClick={() =>
              setFilters({
                tags: filters.tags.includes(tag)
                  ? filters.tags.filter((value: string) => value !== tag)
                  : [...filters.tags, tag],
              })
            }
          />
        ))}
      </div>

      <div className="flex items-center flex-wrap gap-1.5">
        {(agents as Agent[]).map((agent: Agent) => (
          <ToggleChip
            key={agent.name}
            label={agent.name}
            active={filters.agents.includes(agent.name)}
            onClick={() =>
              setFilters({
                agents: filters.agents.includes(agent.name)
                  ? filters.agents.filter((value: string) => value !== agent.name)
                  : [...filters.agents, agent.name],
              })
            }
          />
        ))}
      </div>

      <div className="flex items-center flex-wrap gap-2">
        <input
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          placeholder="Save current view..."
          className="w-44 px-2 py-1 bg-[var(--color-bg)] border border-[var(--color-border)] rounded font-mono text-[11px] text-[var(--color-text)]"
        />
        <button
          onClick={() => {
            saveCurrentView(saveName.trim());
            setSaveName("");
          }}
          className="px-2 py-1 rounded-md font-mono text-[11px] bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 text-[var(--color-accent)]"
        >
          Save View
        </button>
        {savedViews.map((view: { name: string; filters: any }) => (
          <div key={view.name} className="inline-flex items-center gap-1 rounded border border-[var(--color-border)] px-1.5 py-0.5">
            <button onClick={() => applySavedView(view.name)} className="font-mono text-[10px] text-[var(--color-text-dim)] hover:text-[var(--color-text)]">
              {view.name}
            </button>
            <button onClick={() => removeSavedView(view.name)} className="font-mono text-[10px] text-[var(--color-danger)]">
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
