"use client";

import { useTickStore, type DashboardView } from "@/lib/store";
import { TickLogo } from "@/components/ui";

const NAV_ITEMS: { key: DashboardView; label: string; icon: JSX.Element }[] = [
  {
    key: "kanban",
    label: "Board",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    key: "agents",
    label: "Agents",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 1 0-16 0" />
      </svg>
    ),
  },
  {
    key: "activity",
    label: "Activity",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    key: "graph",
    label: "Graph",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3" />
        <circle cx="18" cy="18" r="3" />
        <circle cx="18" cy="6" r="3" />
        <line x1="8.5" y1="7.5" x2="15.5" y2="16.5" />
        <line x1="8.5" y1="6" x2="15" y2="6" />
      </svg>
    ),
  },
];

function Sidebar() {
  const { view, setView, sidebarCollapsed, toggleSidebar, project } = useTickStore();

  return (
    <aside
      className="h-screen flex flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-surface)] transition-all duration-300"
      style={{ width: sidebarCollapsed ? 64 : 220 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--color-border)]">
        <TickLogo size={32} />
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <span className="font-mono text-sm font-bold text-[var(--color-accent)] tracking-wider block">
              TICK
            </span>
            <span className="font-mono text-[10px] text-[var(--color-text-muted)] truncate block">
              {project.project}
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = view === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${active
                  ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                  : "text-[var(--color-text-dim)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text)]"
                }
              `}
              title={item.label}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-[var(--color-border)] p-2">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center py-2 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-card)] hover:text-[var(--color-text-dim)] transition-colors"
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: sidebarCollapsed ? "rotate(180deg)" : "none", transition: "transform 0.3s" }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>
    </aside>
  );
}

function Header() {
  const { view, searchQuery, setSearchQuery, project, tasks, agents } = useTickStore();

  const titles: Record<DashboardView, string> = {
    kanban: "Task Board",
    agents: "Agent Monitor",
    activity: "Activity Feed",
    graph: "Dependency Graph",
  };

  const activeTasks = tasks.filter((t) => t.status === "in_progress").length;
  const activeAgents = agents.filter((a) => a.status === "working").length;

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
      <div>
        <h1 className="text-xl font-semibold text-white">{titles[view]}</h1>
        <p className="text-xs text-[var(--color-text-muted)] mt-0.5 font-mono">
          {project.title} · {activeTasks} active · {activeAgents} agents working
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)]/50 w-56 transition-colors"
          />
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg">
          <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse" />
          <span className="text-xs font-mono text-[var(--color-text-dim)]">Live</span>
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[var(--color-bg)] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
