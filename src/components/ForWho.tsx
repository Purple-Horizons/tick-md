import { FadeIn } from "./ui";

const audiences = [
  {
    emoji: "🤖",
    title: "Multi-Agent Teams",
    desc: "Running Claude Code, OpenClaw, CrewAI, or custom bots? Tick gives them a shared task list with a claiming protocol so no two agents collide.",
    tag: "PROTOCOL",
  },
  {
    emoji: "👨‍💻",
    title: "Solo Devs + AI",
    desc: "You and your AI assistant, working from the same task file. Create tasks, let the bot claim and execute, review the results. Simple.",
    tag: "WORKFLOW",
  },
  {
    emoji: "🏢",
    title: "AI-Native Companies",
    desc: "Like VoxYZ's 6-agent autonomous company. Tick is the coordination layer between your agents, with a dashboard for humans to oversee everything.",
    tag: "SCALE",
  },
];

export function ForWho() {
  return (
    <section className="py-24 px-6 max-w-5xl mx-auto">
      <FadeIn>
        <h2
          className="font-serif text-4xl text-white text-center mb-12"
        >
          Built for the multi-agent era
        </h2>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {audiences.map((a, i) => (
          <FadeIn key={i} delay={i * 0.12}>
            <div className="relative bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-8 h-full overflow-hidden hover:border-[var(--color-accent)]/30 transition-colors">
              <div className="absolute top-4 right-4 font-mono text-[10px] text-[var(--color-accent)] tracking-widest px-2 py-1 border border-[var(--color-border-accent)] rounded">
                {a.tag}
              </div>
              <div className="text-4xl mb-4">{a.emoji}</div>
              <h3 className="text-lg font-bold text-white mb-2">{a.title}</h3>
              <p className="text-sm text-[var(--color-text-dim)] leading-relaxed">
                {a.desc}
              </p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
