import { FadeIn } from "./ui";

const integrations = [
  { name: "Claude Code", type: "Skill" },
  { name: "OpenClaw", type: "Skill" },
  { name: "n8n", type: "Node" },
  { name: "LangChain", type: "Tool" },
  { name: "CrewAI", type: "Tool" },
  { name: "AutoGen", type: "Tool" },
  { name: "Cursor", type: "Rules" },
  { name: "Any LLM", type: "File I/O" },
];

export function Integrations() {
  return (
    <section className="py-20 px-6 max-w-3xl mx-auto">
      <FadeIn>
        <h2
          className="font-serif text-3xl text-white text-center mb-3"
        >
          Works with everything
        </h2>
        <p className="text-base text-[var(--color-text-dim)] text-center mb-10">
          If it can read a file, it can use Tick. MCP server, CLI, or raw
          Markdown.
        </p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="flex flex-wrap justify-center gap-3">
          {integrations.map((ig, i) => (
            <div
              key={i}
              className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-lg px-5 py-2.5 flex items-center gap-2 hover:border-[var(--color-accent)]/30 transition-colors"
            >
              <span className="text-sm font-semibold text-[var(--color-text)]">
                {ig.name}
              </span>
              <span className="font-mono text-[10px] text-[var(--color-text-muted)] bg-[var(--color-bg-code)] px-1.5 py-0.5 rounded">
                {ig.type}
              </span>
            </div>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}
