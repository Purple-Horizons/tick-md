export default function DemoSettingsPage() {
  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-6">
        <h2 className="font-heading font-semibold text-xl text-white mb-2">Demo Mode</h2>
        <p className="font-sans text-sm text-[var(--color-text-muted)] mb-4">
          This is a simulated dashboard. Settings are not available in demo mode.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 text-[var(--color-accent)] text-sm font-sans no-underline hover:bg-[var(--color-accent)]/20 transition-colors"
        >
          <span>Install TICK.md</span>
          <span>→</span>
        </a>
      </div>
    </div>
  );
}
