"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardStore } from "./DashboardProvider";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
}

export default function CommandPalette({ isDemo = false }: { isDemo?: boolean }) {
  const router = useRouter();
  const store = useDashboardStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const base = isDemo ? "/dashboard-demo" : "/dashboard";

  const commands: CommandItem[] = useMemo(
    () => [
      { id: "nav-board", label: "Go to Board", hint: "Navigation", run: () => router.push(base) },
      { id: "nav-agents", label: "Go to Agents", hint: "Navigation", run: () => router.push(`${base}/agents`) },
      { id: "nav-activity", label: "Go to Activity", hint: "Navigation", run: () => router.push(`${base}/activity`) },
      { id: "nav-graph", label: "Go to Graph", hint: "Navigation", run: () => router.push(`${base}/graph`) },
      { id: "nav-settings", label: "Go to Settings", hint: "Navigation", run: () => router.push(`${base}/settings`) },
      {
        id: "filter-risk",
        label: "Toggle Risk Filter",
        hint: "Filters",
        run: () => store.setFilters({ blockedOnly: !store.filters.blockedOnly }),
      },
      {
        id: "filter-mine",
        label: "Toggle Mine Filter",
        hint: "Filters",
        run: () => store.setFilters({ mineOnly: !store.filters.mineOnly }),
      },
      { id: "filter-clear", label: "Clear Filters", hint: "Filters", run: () => store.resetFilters() },
    ],
    [base, router, store]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.trim().toLowerCase();
    return commands.filter((cmd) => cmd.label.toLowerCase().includes(q) || (cmd.hint || "").toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isPalette = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isPalette) {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
      <div
        className="max-w-xl mx-auto mt-[10vh] bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-3 py-2 border-b border-[var(--color-border)]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type a command..."
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-2 font-sans text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]"
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.map((command) => (
            <button
              key={command.id}
              onClick={() => {
                command.run();
                setOpen(false);
                setQuery("");
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left hover:bg-[var(--color-bg)] transition-colors"
            >
              <span className="font-sans text-sm text-[var(--color-text)]">{command.label}</span>
              <span className="font-mono text-[10px] text-[var(--color-text-muted)]">{command.hint}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-3 py-4 font-sans text-sm text-[var(--color-text-muted)]">No matching commands.</p>
          )}
        </div>
      </div>
    </div>
  );
}

