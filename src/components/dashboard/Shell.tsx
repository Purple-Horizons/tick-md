"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboardStore } from "./DashboardProvider";
import { useEffect, useState } from "react";

function getNavItems(isDemo: boolean) {
  const base = isDemo ? "/dashboard-demo" : "/dashboard";
  return [
    { href: base, label: "Board", icon: "◫" },
    { href: `${base}/agents`, label: "Agents", icon: "◉" },
    { href: `${base}/activity`, label: "Activity", icon: "▤" },
    { href: `${base}/graph`, label: "Graph", icon: "◈" },
    { href: `${base}/settings`, label: "Settings", icon: "⚙" },
  ];
}

function isItemActive(href: string, pathname: string | null, isDemo: boolean) {
  const base = isDemo ? "/dashboard-demo" : "/dashboard";
  if (href === base) {
    return pathname === base || pathname === `${base}/board`;
  }
  return pathname === href || (pathname?.startsWith(href) ?? false);
}

export default function Shell({ children, isDemo = false }: { children: React.ReactNode; isDemo?: boolean }) {
  const pathname = usePathname();
  const store = useDashboardStore();
  const { meta, summary, connected, loading, fetchStatus, startWatching } = store;
  const [showDemoBanner, setShowDemoBanner] = useState(isDemo);
  const [mounted, setMounted] = useState(false);
  const NAV_ITEMS = getNavItems(isDemo);

  useEffect(() => {
    setMounted(true);
    fetchStatus();
    const stop = startWatching();
    if (isDemo && "startSimulation" in store) {
      (store as any).startSimulation();
    }
    return () => {
      stop();
      if (isDemo && "stopSimulation" in store) {
        (store as any).stopSimulation();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemo]); // Only depend on isDemo, not the functions

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[var(--color-bg)] text-[var(--color-text)]">

      {/* ── Desktop sidebar (hidden below lg) ── */}
      <aside className="hidden lg:flex w-56 flex-shrink-0 border-r border-[var(--color-border)] flex-col">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-[var(--color-border)]">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-dim)] flex items-center justify-center flex-shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" stroke="#0a0a12" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-mono text-sm font-bold text-white">TICK.md</span>
          </Link>
        </div>

        {/* Project info */}
        <div className="px-5 py-3 border-b border-[var(--color-border)]">
          <div className="font-sans text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Project</div>
          <div className="font-mono text-sm text-[var(--color-text)]">{meta?.project || "—"}</div>
          {summary && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-[var(--color-bg-card)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                  style={{ width: `${summary.percentage}%` }}
                />
              </div>
              <span className="font-mono text-xs text-[var(--color-text-muted)]">{summary.percentage}%</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item.href, pathname, isDemo);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm no-underline transition-colors mb-0.5 ${
                  active
                    ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                    : "text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-surface)]"
                }`}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                <span className="font-sans">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Status footer */}
        <div className="px-5 py-3 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-[var(--color-success)] animate-pulse" : "bg-[var(--color-danger)]"}`} />
            <span className="font-mono text-xs text-[var(--color-text-muted)]">
              {isDemo ? "Simulated" : connected ? "Watching TICK.md" : "Disconnected"}
            </span>
          </div>
        </div>
      </aside>

      {/* ── Tablet icon rail (md–lg only) ── */}
      <aside className="hidden md:flex lg:hidden w-14 flex-shrink-0 border-r border-[var(--color-border)] flex-col items-center">
        {/* Logo */}
        <div className="py-3 border-b border-[var(--color-border)] w-full flex justify-center">
          <Link href="/" className="no-underline">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-dim)] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" stroke="#0a0a12" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Nav icons */}
        <nav className="flex-1 py-3 flex flex-col items-center gap-1 w-full px-2">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item.href, pathname, isDemo);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`w-10 h-10 rounded-lg flex items-center justify-center no-underline transition-colors ${
                  active
                    ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                    : "text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-surface)]"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
              </Link>
            );
          })}
        </nav>

        {/* Status dot */}
        <div className="py-3 border-t border-[var(--color-border)] w-full flex justify-center">
          <span
            className={`w-2.5 h-2.5 rounded-full ${connected ? "bg-[var(--color-success)] animate-pulse" : "bg-[var(--color-danger)]"}`}
            title={isDemo ? "Simulated" : connected ? "Watching TICK.md" : "Disconnected"}
          />
        </div>
      </aside>

      {/* ── Main content area ── */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-12 md:h-14 flex-shrink-0 border-b border-[var(--color-border)] flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            {/* Mobile logo */}
            <Link href="/" className="md:hidden flex items-center gap-1.5 no-underline flex-shrink-0">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-dim)] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" stroke="#0a0a12" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>

            <h1 className="font-serif text-base md:text-lg text-white truncate">
              {meta?.title || meta?.project || "Dashboard"}
            </h1>

            {isDemo && (
              <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 border border-red-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="font-mono text-[10px] text-red-400 uppercase tracking-wide">Live Demo</span>
              </div>
            )}

            {summary && (
              <span className="hidden sm:inline font-mono text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-surface)] px-2 py-1 rounded flex-shrink-0">
                {summary.total} tasks · {summary.done} done
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            {isDemo && (
              <Link
                href="/#pricing"
                className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-md bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-[var(--color-accent)] text-xs font-sans no-underline hover:bg-[var(--color-accent)]/20 transition-colors"
              >
                <span>Buy Solo — Lifetime</span>
                <span>→</span>
              </Link>
            )}
            {/* Mobile connection status */}
            <span
              className={`md:hidden w-2 h-2 rounded-full ${connected ? "bg-[var(--color-success)] animate-pulse" : "bg-[var(--color-danger)]"}`}
            />
            {mounted && (
              <span className="hidden md:inline font-mono text-xs text-[var(--color-text-muted)]">
                {meta?.updated ? new Date(meta.updated).toLocaleTimeString() : ""}
              </span>
            )}
          </div>
        </header>

        {/* Demo banner */}
        {isDemo && showDemoBanner && (
          <div className="flex items-center justify-between px-4 py-2 bg-[var(--color-accent)]/5 border-b border-[var(--color-accent)]/20">
            <p className="font-sans text-xs text-[var(--color-text-muted)] m-0">
              This is a simulated demo. <Link href="/#pricing" className="text-[var(--color-accent)] underline">Get Solo lifetime license</Link> for your own projects.
            </p>
            <button
              onClick={() => setShowDemoBanner(false)}
              className="text-[var(--color-text-dim)] hover:text-[var(--color-text)] text-xs px-2 py-1 rounded hover:bg-[var(--color-bg-surface)] transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto pb-16 md:pb-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-dim)] mx-auto mb-3 animate-pulse" />
                <p className="font-sans text-sm text-[var(--color-text-muted)]">Loading project...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </main>

      {/* ── Mobile bottom tab bar (below md) ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-[var(--color-bg-surface)] border-t border-[var(--color-border)] flex items-center justify-around px-2 z-50 safe-area-bottom">
        {NAV_ITEMS.map((item) => {
          const active = isItemActive(item.href, pathname, isDemo);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-lg no-underline transition-colors min-w-0 ${
                active
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-text-muted)]"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="font-sans text-[10px] leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
