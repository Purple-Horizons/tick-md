import { TickLogo } from "./ui";

export function Footer() {
  return (
    <footer className="py-10 px-6 border-t border-[var(--color-border)] text-center">
      <div className="flex items-center justify-center gap-2 mb-3">
        <TickLogo size={22} />
        <span className="font-mono text-sm text-[var(--color-text-dim)]">
          tick.md
        </span>
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">
        Open source protocol by{" "}
        <a
          href="https://purplehorizons.com"
          className="text-[var(--color-accent)] no-underline hover:underline"
        >
          Purple Horizons
        </a>{" "}
        · MIT License · 2026
      </p>
    </footer>
  );
}
