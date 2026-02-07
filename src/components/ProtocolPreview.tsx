import { FadeIn, CodeWindow } from "./ui";

export function ProtocolPreview() {
  return (
    <section id="protocol" className="py-24 px-6 max-w-4xl mx-auto">
      <FadeIn>
        <div className="font-mono text-xs text-[var(--color-accent)] tracking-widest uppercase text-center mb-3">
          The Protocol
        </div>
        <h2
          className="font-serif text-4xl text-white text-center mb-4"
        >
          One file. Full coordination.
        </h2>
        <p className="text-[var(--color-text-dim)] text-center max-w-lg mx-auto mb-12 text-base">
          Here&apos;s what a TICK.md file looks like. Every agent reads it. Every
          action writes to it.
        </p>
      </FadeIn>

      <FadeIn delay={0.15}>
        <CodeWindow title="TICK.md">
          <pre className="px-6 py-5 font-mono text-[13px] leading-[1.7] overflow-x-auto text-[var(--color-text-dim)]">
            <span className="text-[var(--color-text-muted)]">---</span>
            {"\n"}
            <span className="text-[var(--color-accent)]">project</span>
            {": adgena-v2\n"}
            <span className="text-[var(--color-accent)]">schema_version</span>
            {': "1.0"\n'}
            <span className="text-[var(--color-accent)]">default_workflow</span>
            {": [backlog, todo, in_progress, review, done]\n"}
            <span className="text-[var(--color-text-muted)]">---</span>
            {"\n\n"}
            <span className="text-[var(--color-text-muted)]">
              ## Agents
            </span>
            {"\n"}
            <span className="text-[var(--color-text)]">
              | Agent &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| Role
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;| Status &nbsp;| Working On |
            </span>
            {"\n"}
            {"| @claude-code   | engineer   | "}
            <span className="text-[var(--color-success)]">working</span>
            {" | TASK-007   |\n"}
            {"| @content-bot   | copywriter | "}
            <span className="text-[var(--color-warning)]">idle</span>
            {"    | -          |\n"}
            {"| @gianni        | owner      | "}
            <span className="text-[var(--color-success)]">working</span>
            {" | TASK-003   |\n\n"}
            <span className="text-[var(--color-text-muted)]">
              ### TASK-007 · Build avatar selection UI
            </span>
            {"\n\n```yaml\n"}
            <span className="text-[var(--color-accent)]">id</span>
            {": TASK-007\n"}
            <span className="text-[var(--color-accent)]">status</span>
            {": in_progress\n"}
            <span className="text-[var(--color-accent)]">priority</span>
            {": "}
            <span className="text-[var(--color-danger)]">urgent</span>
            {"\n"}
            <span className="text-[var(--color-accent)]">claimed_by</span>
            {": @claude-code\n"}
            <span className="text-[var(--color-accent)]">created_by</span>
            {": @gianni\n"}
            <span className="text-[var(--color-accent)]">depends_on</span>
            {": []\n"}
            <span className="text-[var(--color-accent)]">blocks</span>
            {": [TASK-012, TASK-015]\n"}
            <span className="text-[var(--color-accent)]">history</span>
            {":\n"}
            {"  - "}
            <span className="text-[var(--color-text-muted)]">
              ts: 2026-02-05T09:00
            </span>
            {"  "}
            <span className="text-[var(--color-info)]">who: @gianni</span>
            {"       "}
            <span className="text-[var(--color-text)]">action: created</span>
            {"\n"}
            {"  - "}
            <span className="text-[var(--color-text-muted)]">
              ts: 2026-02-05T09:15
            </span>
            {"  "}
            <span className="text-[var(--color-info)]">who: @claude-code</span>
            {"  "}
            <span className="text-[var(--color-text)]">action: claimed</span>
            {"\n"}
            {"  - "}
            <span className="text-[var(--color-text-muted)]">
              ts: 2026-02-07T14:00
            </span>
            {"  "}
            <span className="text-[var(--color-info)]">who: @claude-code</span>
            {"  "}
            <span className="text-[var(--color-accent)]">action: commented</span>
            {"\n"}
            {"    "}
            <span className="text-[var(--color-text-dim)]">
              note: &quot;Grid layout done, working on hover preview&quot;
            </span>
            {"\n```\n\n"}
            <span className="text-[var(--color-text-dim)]">
              &gt; Build the avatar grid selector for video generation.
            </span>
            {"\n"}
            <span className="text-[var(--color-text-dim)]">
              &gt; Must support keyboard nav and preview on hover.
            </span>
          </pre>
        </CodeWindow>
      </FadeIn>
    </section>
  );
}
