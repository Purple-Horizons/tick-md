import { TickLogo } from "./ui";

export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-[var(--color-border)]/40 bg-[var(--color-bg)]/90 backdrop-blur-xl">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TickLogo size={28} />
          <span className="font-mono text-sm font-bold text-white tracking-wide">
            tick.md
          </span>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="#protocol"
            className="hidden sm:block text-sm text-[var(--color-text-dim)] hover:text-white transition-colors"
          >
            Protocol
          </a>
          <a
            href="#pricing"
            className="hidden sm:block text-sm text-[var(--color-text-dim)] hover:text-white transition-colors"
          >
            Pricing
          </a>
          <a
            href="https://github.com/nicobailon/tick"
            className="hidden sm:block text-sm text-[var(--color-text-dim)] hover:text-white transition-colors"
          >
            GitHub
          </a>
          <a
            href="#get-started"
            className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-bg)] font-bold text-xs rounded-md hover:opacity-90 transition-opacity"
          >
            Get Started
          </a>
        </div>
      </div>
    </nav>
  );
}
