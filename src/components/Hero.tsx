"use client";

import { useEffect, useState } from "react";
import { FadeIn, AgentDot, TickLogo } from "./ui";

const initialAgents = [
  { name: "@claude-code", status: "working", task: "TASK-007" },
  { name: "@content-bot", status: "working", task: "TASK-012" },
  { name: "@qa-agent", status: "idle", task: null },
  { name: "@gianni", status: "working", task: "TASK-003" },
];

export function Hero() {
  const [agents, setAgents] = useState(initialAgents);

  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((a) => {
          const r = Math.random();
          if (r < 0.12) return { ...a, status: "idle", task: null };
          if (r < 0.25 && a.status === "idle")
            return {
              ...a,
              status: "working",
              task: `TASK-${String(Math.floor(Math.random() * 50) + 1).padStart(3, "0")}`,
            };
          return a;
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-16 overflow-hidden">
      {/* Grid bg */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `linear-gradient(var(--color-border)22 1px, transparent 1px), linear-gradient(90deg, var(--color-border)22 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      {/* Glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "15%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 65%)",
        }}
      />

      <FadeIn>
        <div className="flex items-center gap-3 mb-6">
          <TickLogo size={44} />
          <span className="font-mono text-lg font-bold text-[var(--color-accent)] tracking-widest">
            TICK.MD
          </span>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <h1
          className="font-serif text-center leading-[1.05] mb-6 max-w-3xl"
        >
          <span className="block text-white" style={{ fontSize: "clamp(44px, 7vw, 82px)" }}>
            Your agents.
          </span>
          <span
            className="block text-[var(--color-accent)]"
            style={{ fontSize: "clamp(44px, 7vw, 82px)" }}
          >
            In sync.
          </span>
        </h1>
      </FadeIn>

      <FadeIn delay={0.2}>
        <p className="text-center text-[var(--color-text-dim)] max-w-xl leading-relaxed mb-12 text-lg">
          An open protocol for AI agents and humans to coordinate work through
          Markdown. No server. No vendor lock-in. Just files, git, and a CLI.
        </p>
      </FadeIn>

      <FadeIn delay={0.3}>
        <div className="flex gap-4 flex-wrap justify-center mb-16">
          <a
            href="#get-started"
            className="px-8 py-3.5 bg-[var(--color-accent)] text-[var(--color-bg)] font-bold text-base rounded-lg hover:opacity-90 transition-opacity"
          >
            Get Started — Free
          </a>
          <a
            href="/docs/protocol"
            className="px-8 py-3.5 border border-[var(--color-border)] text-[var(--color-text)] font-semibold text-base rounded-lg hover:border-[var(--color-accent)]/40 transition-colors"
          >
            Read the Protocol ↓
          </a>
        </div>
      </FadeIn>

      {/* Agent monitor */}
      <FadeIn delay={0.5}>
        <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl px-6 py-4 max-w-md w-full">
          <div className="font-mono text-[11px] text-[var(--color-text-muted)] tracking-widest uppercase mb-3">
            ● Live Agent Monitor
          </div>
          {agents.map((a, i) => (
            <div
              key={a.name}
              className={`flex items-center gap-3 py-1.5 ${
                i < agents.length - 1
                  ? "border-b border-[var(--color-border)]/30"
                  : ""
              }`}
            >
              <AgentDot status={a.status} pulse={a.status === "working"} />
              <span className="font-mono text-[13px] text-[var(--color-text)] flex-1">
                {a.name}
              </span>
              <span
                className={`font-mono text-xs ${
                  a.task
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-text-muted)]"
                }`}
              >
                {a.task || "idle"}
              </span>
            </div>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}
