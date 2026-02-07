import { FadeIn } from "./ui";

const steps = [
  {
    icon: "📄",
    title: "Tasks are Markdown",
    desc: "Every task lives in a TICK.md file with structured YAML metadata. Human-readable, git-friendly, LLM-native.",
  },
  {
    icon: "🤖",
    title: "Agents claim work",
    desc: "Bots and humans follow a coordination protocol — claim, execute, release. No two agents touch the same task.",
  },
  {
    icon: "📜",
    title: "History is sacred",
    desc: "Every action is logged in an append-only history. Full traceability. Complete context for handoffs.",
  },
  {
    icon: "🔄",
    title: "Git is the backbone",
    desc: "No database. No server. Git handles sync, audit trails, and conflict resolution. Works offline.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6 max-w-5xl mx-auto">
      <FadeIn>
        <h2
          className="font-serif text-4xl text-white text-center mb-3"
        >
          How Tick works
        </h2>
        <p className="text-[var(--color-text-dim)] text-center mb-16 max-w-lg mx-auto text-base">
          Dead simple by design. The Markdown file <em>is</em> the database.
        </p>
      </FadeIn>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {steps.map((s, i) => (
          <FadeIn key={i} delay={i * 0.1}>
            <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-7 h-full hover:border-[var(--color-accent)]/30 transition-colors">
              <div className="text-3xl mb-4">{s.icon}</div>
              <h3 className="text-base font-bold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-[var(--color-text-dim)] leading-relaxed">
                {s.desc}
              </p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
