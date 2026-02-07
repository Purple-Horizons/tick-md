import { FadeIn } from "./ui";

export function GetStarted() {
  return (
    <section id="get-started" className="py-24 px-6 max-w-2xl mx-auto">
      <FadeIn>
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-12 text-center">
          <h2
            className="font-serif text-3xl text-white mb-4"
          >
            Start ticking in 30 seconds
          </h2>

          <div className="bg-[var(--color-bg-code)] border border-[var(--color-border)] rounded-lg px-6 py-4 my-6 text-left">
            <code className="font-mono text-sm text-[var(--color-accent)]">
              npx tick-md init
            </code>
          </div>

          <p className="text-sm text-[var(--color-text-dim)] leading-relaxed mb-6">
            That&apos;s it. You now have a TICK.md file, a .tick/ config
            directory, and a CLI ready to go. Add tasks, point your agents at
            it, and watch them coordinate.
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <a
              href="https://github.com/nicobailon/tick"
              className="px-7 py-3 bg-[var(--color-accent)] text-[var(--color-bg)] font-bold text-sm rounded-lg hover:opacity-90 transition-opacity"
            >
              ★ Star on GitHub
            </a>
            <a
              href="#protocol"
              className="px-7 py-3 border border-[var(--color-border)] text-[var(--color-text)] font-semibold text-sm rounded-lg hover:border-[var(--color-accent)]/40 transition-colors"
            >
              Read the Docs
            </a>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
