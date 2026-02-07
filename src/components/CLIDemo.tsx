"use client";

import { useEffect, useState } from "react";
import { FadeIn, CodeWindow } from "./ui";

const steps = [
  {
    cmd: "$ tick next @claude-code",
    out: "→ TASK-042 [high] Build payment flow (tags: backend, api)",
    desc: "Agent checks for available work",
  },
  {
    cmd: "$ tick claim TASK-042 @claude-code",
    out: "✓ Claimed. Status: todo → in_progress",
    desc: "Agent claims with file lock",
  },
  {
    cmd: '$ tick comment TASK-042 --note "Stripe integration complete"',
    out: "✓ Comment added to history",
    desc: "Progress is logged",
  },
  {
    cmd: "$ tick done TASK-042 @claude-code",
    out: "✓ TASK-042 complete. 3 blocked tasks now unblocked.",
    desc: "Completion cascades",
  },
  {
    cmd: "$ tick sync",
    out: '✓ Committed: "[tick] TASK-042: payment flow complete"',
    desc: "Git keeps the audit trail",
  },
];

export function CLIDemo() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(
      () => setActive((s) => (s + 1) % steps.length),
      4000
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-24 px-6 max-w-3xl mx-auto">
      <FadeIn>
        <div className="font-mono text-xs text-[var(--color-accent)] tracking-widest uppercase text-center mb-3">
          The CLI
        </div>
        <h2
          className="font-serif text-4xl text-white text-center mb-12"
        >
          Five commands. Full lifecycle.
        </h2>
      </FadeIn>

      <FadeIn delay={0.1}>
        <CodeWindow title="terminal">
          <div className="px-6 py-5" style={{ minHeight: 200 }}>
            {steps.map((s, i) => (
              <div
                key={i}
                className="mb-3 transition-all duration-500"
                style={{
                  opacity: i <= active ? 1 : 0.15,
                  transform: i <= active ? "none" : "translateY(4px)",
                }}
              >
                <div className="font-mono text-[13px] text-[var(--color-text)]">
                  {s.cmd}
                </div>
                {i <= active && (
                  <div
                    className="font-mono text-[13px] text-[var(--color-accent)] mt-0.5"
                    style={{ opacity: i < active ? 0.5 : 1 }}
                  >
                    {s.out}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CodeWindow>

        <div className="text-center mt-5">
          <p className="text-sm text-[var(--color-text-dim)] mb-3">
            {steps[active]?.desc}
          </p>
          <div className="flex justify-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className="w-2 h-2 rounded-full border-none cursor-pointer transition-all"
                style={{
                  background:
                    i === active
                      ? "var(--color-accent)"
                      : "var(--color-border)",
                }}
              />
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
