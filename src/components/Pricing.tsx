"use client";

import { FadeIn, TickMark } from "./ui";

const plans = [
  {
    name: "Open Source",
    price: "Free",
    period: "forever",
    desc: "The full protocol, CLI, and self-hosted dashboard.",
    features: [
      "Tick protocol spec",
      "CLI tool (tick)",
      "JSON Schema validation",
      "Git integration",
      "Claude / MCP skill",
      "Self-host dashboard",
      "Community support",
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Tick Cloud",
    price: "$12",
    period: "/month",
    desc: "Hosted dashboard with real-time sync for your team.",
    features: [
      "Everything in Free",
      "Hosted Kanban dashboard",
      "Real-time agent monitor",
      "Activity feed & analytics",
      "Dependency graph view",
      "Webhook notifications",
      "Team collaboration (5 seats)",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Lifetime",
    price: "$149",
    period: "one-time",
    desc: "Pay once, use forever. Self-hosted dashboard license.",
    features: [
      "Everything in Free",
      "Dashboard source code",
      "Lifetime updates",
      "Priority support (1 year)",
      "Custom branding",
      "Unlimited agents",
      "Deploy anywhere",
    ],
    cta: "Buy Lifetime",
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 max-w-5xl mx-auto">
      <FadeIn>
        <div className="font-mono text-xs text-[var(--color-accent)] tracking-widest uppercase text-center mb-3">
          Pricing
        </div>
        <h2
          className="font-serif text-4xl text-white text-center mb-3"
        >
          Protocol is free. Forever.
        </h2>
        <p className="text-base text-[var(--color-text-dim)] text-center max-w-md mx-auto mb-14">
          Pay only if you want the hosted dashboard or a licensed copy to
          self-host.
        </p>
      </FadeIn>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {plans.map((p, i) => (
          <FadeIn key={i} delay={i * 0.1}>
            <div
              className={`relative bg-[var(--color-bg-surface)] rounded-2xl p-8 overflow-hidden ${
                p.highlight
                  ? "border border-[var(--color-accent)]/40"
                  : "border border-[var(--color-border)]"
              }`}
              style={{
                boxShadow: p.highlight
                  ? "0 0 60px rgba(167, 139, 250, 0.08)"
                  : "none",
              }}
            >
              {p.highlight && (
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-deep)]" />
              )}

              <h3 className="text-lg font-bold text-white mb-2">{p.name}</h3>
              <div className="flex items-baseline gap-1 mb-1">
                <span
                  className="font-serif text-white text-4xl"
                >
                  {p.price}
                </span>
                <span className="text-sm text-[var(--color-text-muted)]">
                  {p.period}
                </span>
              </div>
              <p className="text-sm text-[var(--color-text-dim)] leading-snug mb-6">
                {p.desc}
              </p>

              <div className="mb-6">
                {p.features.map((f, fi) => (
                  <div key={fi} className="flex items-center gap-2 py-1">
                    <TickMark size={16} delay={fi * 80} />
                    <span className="text-sm text-[var(--color-text-dim)]">
                      {f}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className={`w-full py-3 rounded-lg font-bold text-sm cursor-pointer transition-all hover:opacity-90 ${
                  p.highlight
                    ? "bg-[var(--color-accent)] text-[var(--color-bg)] border-none"
                    : "bg-transparent text-[var(--color-text)] border border-[var(--color-border)]"
                }`}
              >
                {p.cta}
              </button>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
