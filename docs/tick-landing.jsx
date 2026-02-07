import { useState, useEffect, useRef } from "react";

const COLORS = {
  bg: "#0a0a0f",
  bgSurface: "#12121a",
  bgCard: "#1a1a25",
  bgCode: "#0d0d14",
  accent: "#22d3a7",
  accentDim: "#1a9e7e",
  accentGlow: "rgba(34, 211, 167, 0.15)",
  accentGlow2: "rgba(34, 211, 167, 0.08)",
  text: "#e8e8ed",
  textDim: "#8b8b99",
  textMuted: "#55556a",
  border: "#2a2a3a",
  borderAccent: "#22d3a740",
  white: "#ffffff",
  warning: "#f0b429",
  danger: "#ef4444",
  purple: "#a78bfa",
  blue: "#60a5fa",
};

// Animated checkmark that "ticks"
function TickMark({ delay = 0, size = 20 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.5)", transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
      <path d="M5 13l4 4L19 7" stroke={COLORS.accent} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: 24, strokeDashoffset: visible ? 0 : 24, transition: `stroke-dashoffset 0.5s ease ${delay / 1000 + 0.2}s` }} />
    </svg>
  );
}

// Typing animation for code blocks
function TypedCode({ lines, speed = 30 }) {
  const [displayed, setDisplayed] = useState([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  useEffect(() => {
    if (currentLine >= lines.length) return;
    const line = lines[currentLine];
    if (currentChar >= line.length) {
      setTimeout(() => { setCurrentLine(l => l + 1); setCurrentChar(0); }, 100);
      return;
    }
    const t = setTimeout(() => {
      setDisplayed(prev => {
        const next = [...prev];
        next[currentLine] = (next[currentLine] || "") + line[currentChar];
        return next;
      });
      setCurrentChar(c => c + 1);
    }, speed);
    return () => clearTimeout(t);
  }, [currentLine, currentChar, lines, speed]);
  return displayed;
}

// Agent status indicator
function AgentDot({ status, pulse }) {
  const colors = { working: COLORS.accent, idle: COLORS.warning, offline: COLORS.textMuted };
  return (
    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: colors[status] || COLORS.textMuted,
      boxShadow: pulse ? `0 0 8px ${colors[status]}` : "none",
      animation: pulse ? "pulse 2s infinite" : "none" }} />
  );
}

// Scroll-triggered fade in
function FadeIn({ children, delay = 0, direction = "up" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const transforms = { up: "translateY(30px)", down: "translateY(-30px)", left: "translateX(30px)", right: "translateX(-30px)", none: "none" };
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : transforms[direction], transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s` }}>
      {children}
    </div>
  );
}

// Sections
function Hero() {
  const [agentStates, setAgentStates] = useState([
    { name: "@claude-code", status: "working", task: "TASK-007" },
    { name: "@content-bot", status: "working", task: "TASK-012" },
    { name: "@qa-bot", status: "idle", task: null },
    { name: "@gianni", status: "working", task: "TASK-003" },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAgentStates(prev => prev.map(a => {
        const r = Math.random();
        if (r < 0.15) return { ...a, status: "idle", task: null };
        if (r < 0.3 && a.status === "idle") return { ...a, status: "working", task: `TASK-${String(Math.floor(Math.random() * 50) + 1).padStart(3, "0")}` };
        return a;
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "80px 24px 60px", position: "relative", overflow: "hidden" }}>
      {/* Background grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${COLORS.border}22 1px, transparent 1px), linear-gradient(90deg, ${COLORS.border}22 1px, transparent 1px)`,
        backgroundSize: "60px 60px", opacity: 0.5 }} />
      <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 600, borderRadius: "50%",
        background: `radial-gradient(circle, ${COLORS.accentGlow} 0%, transparent 70%)`, pointerEvents: "none" }} />

      <FadeIn>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDim})`,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#0a0a0f" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, color: COLORS.accent, fontWeight: 700, letterSpacing: 2 }}>TICK.MD</span>
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: "clamp(42px, 7vw, 80px)", color: COLORS.white, textAlign: "center", lineHeight: 1.05, margin: "0 0 24px", maxWidth: 800 }}>
          Your agents.<br />
          <span style={{ color: COLORS.accent }}>In sync.</span>
        </h1>
      </FadeIn>

      <FadeIn delay={0.2}>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(16px, 2.2vw, 20px)", color: COLORS.textDim, textAlign: "center", maxWidth: 580, lineHeight: 1.6, margin: "0 0 48px" }}>
          An open protocol for AI agents and humans to coordinate work through Markdown. No server. No vendor lock-in. Just files, git, and a CLI.
        </p>
      </FadeIn>

      <FadeIn delay={0.3}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center", marginBottom: 64 }}>
          <a href="#get-started" style={{ padding: "14px 32px", background: COLORS.accent, color: COLORS.bg, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 16,
            borderRadius: 8, textDecoration: "none", transition: "all 0.2s", border: "none" }}>
            Get Started — Free
          </a>
          <a href="#protocol" style={{ padding: "14px 32px", background: "transparent", color: COLORS.text, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 16,
            borderRadius: 8, textDecoration: "none", border: `1px solid ${COLORS.border}`, transition: "all 0.2s" }}>
            Read the Protocol ↓
          </a>
        </div>
      </FadeIn>

      {/* Live agent monitor mini */}
      <FadeIn delay={0.5}>
        <div style={{ background: COLORS.bgSurface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "16px 24px", maxWidth: 500, width: "100%" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: COLORS.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1.5 }}>
            ● Live Agent Monitor
          </div>
          {agentStates.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < agentStates.length - 1 ? `1px solid ${COLORS.border}40` : "none" }}>
              <AgentDot status={a.status} pulse={a.status === "working"} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: COLORS.text, flex: 1 }}>{a.name}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: a.task ? COLORS.accent : COLORS.textMuted }}>
                {a.task || "idle"}
              </span>
            </div>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: "📄", title: "Tasks are Markdown", desc: "Every task lives in a TICK.md file with structured YAML metadata. Human-readable, git-friendly, LLM-native." },
    { icon: "🤖", title: "Agents claim work", desc: "Bots and humans follow a coordination protocol — claim, execute, release. No two agents work the same task." },
    { icon: "📜", title: "History is sacred", desc: "Every action is logged in an append-only history. Full traceability. Complete context for handoffs." },
    { icon: "🔄", title: "Git is the backbone", desc: "No database. No server. Git handles sync, audit trails, and conflict resolution. Works offline." },
  ];
  return (
    <section style={{ padding: "100px 24px", maxWidth: 1000, margin: "0 auto" }}>
      <FadeIn>
        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 42, color: COLORS.white, textAlign: "center", marginBottom: 12 }}>
          How Tick works
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: COLORS.textDim, textAlign: "center", marginBottom: 64, maxWidth: 500, margin: "0 auto 64px" }}>
          Dead simple by design. The Markdown file <em>is</em> the database.
        </p>
      </FadeIn>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
        {steps.map((s, i) => (
          <FadeIn key={i} delay={i * 0.1}>
            <div style={{ background: COLORS.bgSurface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 28, height: "100%", transition: "border-color 0.3s" }}>
              <div style={{ fontSize: 28, marginBottom: 16 }}>{s.icon}</div>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, fontWeight: 700, color: COLORS.white, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: COLORS.textDim, lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

function ProtocolPreview() {
  return (
    <section id="protocol" style={{ padding: "100px 24px", maxWidth: 900, margin: "0 auto" }}>
      <FadeIn>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: COLORS.accent, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, textAlign: "center" }}>
          The Protocol
        </div>
        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 42, color: COLORS.white, textAlign: "center", marginBottom: 16 }}>
          One file. Full coordination.
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: COLORS.textDim, textAlign: "center", maxWidth: 550, margin: "0 auto 48px" }}>
          Here's what a TICK.md file looks like. Every agent reads it. Every action writes to it.
        </p>
      </FadeIn>

      <FadeIn delay={0.15}>
        <div style={{ background: COLORS.bgCode, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgSurface }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f0b429" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: COLORS.accent }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: COLORS.textMuted, marginLeft: 12 }}>TICK.md</span>
          </div>
          <pre style={{ padding: "20px 24px", margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.7, overflowX: "auto", color: COLORS.textDim }}>
{`---
`}<span style={{ color: COLORS.purple }}>project</span>{`: adgena-v2
`}<span style={{ color: COLORS.purple }}>schema_version</span>{`: "1.0"
`}<span style={{ color: COLORS.purple }}>default_workflow</span>{`: [backlog, todo, in_progress, review, done]
---

`}<span style={{ color: COLORS.textMuted }}>{`## Agents`}</span>{`
`}<span style={{ color: COLORS.text }}>{`| Agent          | Role       | Status  | Working On |`}</span>{`
| @claude-code   | engineer   | `}<span style={{ color: COLORS.accent }}>working</span>{` | TASK-007   |
| @content-bot   | copywriter | `}<span style={{ color: COLORS.warning }}>idle</span>{`    | -          |
| @gianni        | owner      | `}<span style={{ color: COLORS.accent }}>working</span>{` | TASK-003   |

`}<span style={{ color: COLORS.textMuted }}>{`### TASK-007 · Build avatar selection UI`}</span>{`

\`\`\`yaml
`}<span style={{ color: COLORS.purple }}>id</span>{`: TASK-007
`}<span style={{ color: COLORS.purple }}>status</span>{`: in_progress
`}<span style={{ color: COLORS.purple }}>priority</span>{`: `}<span style={{ color: COLORS.danger }}>urgent</span>{`
`}<span style={{ color: COLORS.purple }}>claimed_by</span>{`: @claude-code
`}<span style={{ color: COLORS.purple }}>created_by</span>{`: @gianni
`}<span style={{ color: COLORS.purple }}>updated_at</span>{`: 2026-02-07T14:28:00-05:00
`}<span style={{ color: COLORS.purple }}>depends_on</span>{`: []
`}<span style={{ color: COLORS.purple }}>blocks</span>{`: [TASK-012, TASK-015]
`}<span style={{ color: COLORS.purple }}>history</span>{`:
  - `}<span style={{ color: COLORS.textMuted }}>ts: 2026-02-05T09:00</span>{`  `}<span style={{ color: COLORS.blue }}>who: @gianni</span>{`       `}<span style={{ color: COLORS.text }}>action: created</span>{`
  - `}<span style={{ color: COLORS.textMuted }}>ts: 2026-02-05T09:15</span>{`  `}<span style={{ color: COLORS.blue }}>who: @claude-code</span>{`  `}<span style={{ color: COLORS.text }}>action: claimed</span>{`
  - `}<span style={{ color: COLORS.textMuted }}>ts: 2026-02-07T14:00</span>{`  `}<span style={{ color: COLORS.blue }}>who: @claude-code</span>{`  `}<span style={{ color: COLORS.accent }}>action: commented</span>{`
    `}<span style={{ color: COLORS.textDim }}>note: "Grid layout done, working on hover preview"</span>{`
\`\`\`

> Build the avatar grid selector for video generation.
> Must support keyboard nav and preview on hover.`}
          </pre>
        </div>
      </FadeIn>
    </section>
  );
}

function AgentWorkflow() {
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    { cmd: "$ tick next @claude-code", out: "→ TASK-042 [high] Build payment flow (tags: backend, api)", desc: "Agent checks for available work" },
    { cmd: "$ tick claim TASK-042 @claude-code", out: "✓ Claimed. Status: todo → in_progress", desc: "Agent claims with file lock" },
    { cmd: "$ tick comment TASK-042 @claude-code --note \"Stripe integration complete\"", out: "✓ Comment added to history", desc: "Progress is logged" },
    { cmd: "$ tick done TASK-042 @claude-code", out: "✓ TASK-042 complete. 3 blocked tasks now unblocked.", desc: "Completion cascades" },
    { cmd: "$ tick sync", out: '✓ Committed: "[tick] TASK-042: payment flow complete"', desc: "Git keeps the audit trail" },
  ];

  useEffect(() => {
    const interval = setInterval(() => setActiveStep(s => (s + 1) % steps.length), 4000);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <section style={{ padding: "100px 24px", maxWidth: 800, margin: "0 auto" }}>
      <FadeIn>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: COLORS.accent, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, textAlign: "center" }}>
          The CLI
        </div>
        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 42, color: COLORS.white, textAlign: "center", marginBottom: 48 }}>
          Five commands. Full lifecycle.
        </h2>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div style={{ background: COLORS.bgCode, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", borderBottom: `1px solid ${COLORS.border}`, background: COLORS.bgSurface }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f0b429" }} />
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: COLORS.accent }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: COLORS.textMuted, marginLeft: 12 }}>terminal</span>
          </div>
          <div style={{ padding: "24px", minHeight: 160 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ marginBottom: 16, opacity: i <= activeStep ? 1 : 0.2, transition: "opacity 0.5s", transform: i <= activeStep ? "none" : "translateY(4px)" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: COLORS.text }}>{s.cmd}</div>
                {i <= activeStep && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: COLORS.accent, marginTop: 2, opacity: i < activeStep ? 0.6 : 1 }}>{s.out}</div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: COLORS.textDim }}>
            {steps[activeStep]?.desc}
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
            {steps.map((_, i) => (
              <button key={i} onClick={() => setActiveStep(i)}
                style={{ width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer",
                  background: i === activeStep ? COLORS.accent : COLORS.border, transition: "all 0.3s" }} />
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

function ForWho() {
  const audiences = [
    { emoji: "🤖", title: "Multi-Agent Teams", desc: "Running Claude Code, OpenClaw, CrewAI, or custom bots? Tick gives them a shared task list with claiming protocol so no two agents collide.", tag: "PROTOCOL" },
    { emoji: "👨‍💻", title: "Solo Devs + AI", desc: "You and your AI assistant, working from the same task file. Create tasks, let the bot claim and execute, review the results. Simple.", tag: "WORKFLOW" },
    { emoji: "🏢", title: "AI-Native Companies", desc: "Like VoxYZ's 6-agent company. Tick is the coordination layer between your agents, with a dashboard for humans to oversee everything.", tag: "SCALE" },
  ];
  return (
    <section style={{ padding: "100px 24px", maxWidth: 1000, margin: "0 auto" }}>
      <FadeIn>
        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 42, color: COLORS.white, textAlign: "center", marginBottom: 48 }}>
          Built for the multi-agent era
        </h2>
      </FadeIn>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
        {audiences.map((a, i) => (
          <FadeIn key={i} delay={i * 0.12}>
            <div style={{ background: COLORS.bgSurface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 32, height: "100%", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 16, right: 16, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: COLORS.accent, letterSpacing: 1.5,
                padding: "4px 8px", border: `1px solid ${COLORS.borderAccent}`, borderRadius: 4 }}>{a.tag}</div>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{a.emoji}</div>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 700, color: COLORS.white, marginBottom: 10 }}>{a.title}</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: COLORS.textDim, lineHeight: 1.6, margin: 0 }}>{a.desc}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

function Integrations() {
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
  return (
    <section style={{ padding: "80px 24px", maxWidth: 800, margin: "0 auto" }}>
      <FadeIn>
        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 36, color: COLORS.white, textAlign: "center", marginBottom: 12 }}>
          Works with everything
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: COLORS.textDim, textAlign: "center", marginBottom: 40 }}>
          If it can read a file, it can use Tick. MCP server, CLI, or raw Markdown.
        </p>
      </FadeIn>
      <FadeIn delay={0.1}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
          {integrations.map((ig, i) => (
            <div key={i} style={{ background: COLORS.bgSurface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 20px",
              display: "flex", alignItems: "center", gap: 8, transition: "border-color 0.3s" }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: COLORS.text }}>{ig.name}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: COLORS.textMuted, background: COLORS.bgCode,
                padding: "2px 6px", borderRadius: 4 }}>{ig.type}</span>
            </div>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}

function Pricing() {
  const plans = [
    {
      name: "Open Source",
      price: "Free",
      period: "forever",
      desc: "The full protocol, CLI, and self-hosted dashboard.",
      features: ["Tick protocol spec", "CLI tool (tick)", "JSON Schema validation", "Git integration", "Claude / MCP skill", "Self-host dashboard", "Community support"],
      cta: "Get Started",
      ctaStyle: { background: "transparent", color: COLORS.text, border: `1px solid ${COLORS.border}` },
      highlight: false,
    },
    {
      name: "Tick Cloud",
      price: "$12",
      period: "/month",
      desc: "Hosted dashboard with real-time sync for your team.",
      features: ["Everything in Free", "Hosted Kanban dashboard", "Real-time agent monitor", "Activity feed & analytics", "Dependency graph view", "Webhook notifications", "Team collaboration (5 seats)", "Priority support"],
      cta: "Start Free Trial",
      ctaStyle: { background: COLORS.accent, color: COLORS.bg, border: "none" },
      highlight: true,
    },
    {
      name: "Lifetime",
      price: "$149",
      period: "one-time",
      desc: "Pay once, use forever. Self-hosted dashboard license.",
      features: ["Everything in Free", "Dashboard source code", "Lifetime updates", "Priority support (1 year)", "Custom branding", "Unlimited agents", "Deploy anywhere"],
      cta: "Buy Lifetime",
      ctaStyle: { background: "transparent", color: COLORS.text, border: `1px solid ${COLORS.border}` },
      highlight: false,
    },
  ];

  return (
    <section id="pricing" style={{ padding: "100px 24px", maxWidth: 1000, margin: "0 auto" }}>
      <FadeIn>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: COLORS.accent, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, textAlign: "center" }}>
          Pricing
        </div>
        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 42, color: COLORS.white, textAlign: "center", marginBottom: 12 }}>
          Protocol is free. Forever.
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: COLORS.textDim, textAlign: "center", maxWidth: 500, margin: "0 auto 56px" }}>
          Pay only if you want the hosted dashboard or a licensed copy to self-host.
        </p>
      </FadeIn>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, alignItems: "start" }}>
        {plans.map((p, i) => (
          <FadeIn key={i} delay={i * 0.1}>
            <div style={{
              background: p.highlight ? COLORS.bgSurface : COLORS.bgSurface,
              border: `1px solid ${p.highlight ? COLORS.accent + "60" : COLORS.border}`,
              borderRadius: 16, padding: 32, position: "relative", overflow: "hidden",
              boxShadow: p.highlight ? `0 0 40px ${COLORS.accentGlow2}` : "none",
            }}>
              {p.highlight && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accentDim})` }} />}
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, color: COLORS.white, marginBottom: 8 }}>{p.name}</h3>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                <span style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 44, color: COLORS.white }}>{p.price}</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: COLORS.textMuted }}>{p.period}</span>
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: COLORS.textDim, lineHeight: 1.5, margin: "0 0 24px" }}>{p.desc}</p>
              <div style={{ marginBottom: 24 }}>
                {p.features.map((f, fi) => (
                  <div key={fi} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                    <TickMark size={16} delay={fi * 80} />
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: COLORS.textDim }}>{f}</span>
                  </div>
                ))}
              </div>
              <button style={{
                width: "100%", padding: "12px 0", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15,
                cursor: "pointer", transition: "all 0.2s", ...p.ctaStyle
              }}>
                {p.cta}
              </button>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

function GetStarted() {
  return (
    <section id="get-started" style={{ padding: "100px 24px 60px", maxWidth: 700, margin: "0 auto" }}>
      <FadeIn>
        <div style={{ background: COLORS.bgSurface, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: "48px 40px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 36, color: COLORS.white, marginBottom: 16 }}>
            Start ticking in 30 seconds
          </h2>
          <div style={{ background: COLORS.bgCode, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "16px 24px", margin: "24px 0", textAlign: "left" }}>
            <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: COLORS.accent }}>
              npx tick-md init
            </code>
          </div>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: COLORS.textDim, lineHeight: 1.6, marginBottom: 24 }}>
            That's it. You now have a TICK.md file, a .tick/ config directory, and a CLI ready to go. Add tasks, point your agents at it, and watch them coordinate.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="https://github.com/nicobailon/tick" style={{ padding: "12px 28px", background: COLORS.accent, color: COLORS.bg, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15,
              borderRadius: 8, textDecoration: "none" }}>
              ★ Star on GitHub
            </a>
            <a href="#protocol" style={{ padding: "12px 28px", background: "transparent", color: COLORS.text, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15,
              borderRadius: 8, textDecoration: "none", border: `1px solid ${COLORS.border}` }}>
              Read the Docs
            </a>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ padding: "40px 24px", borderTop: `1px solid ${COLORS.border}`, textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDim})`,
          display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#0a0a0f" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, color: COLORS.textDim }}>tick.md</span>
      </div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: COLORS.textMuted, margin: 0 }}>
        Open source protocol by <a href="https://purplehorizons.com" style={{ color: COLORS.accent, textDecoration: "none" }}>Purple Horizons</a> · MIT License · 2026
      </p>
    </footer>
  );
}

export default function TickLanding() {
  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", color: COLORS.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        button:hover { opacity: 0.9; transform: translateY(-1px); }
        a:hover { opacity: 0.9; }
        ::selection { background: ${COLORS.accent}40; color: ${COLORS.white}; }
        pre::-webkit-scrollbar { height: 6px; }
        pre::-webkit-scrollbar-track { background: transparent; }
        pre::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 3px; }
      `}</style>

      {/* Nav */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "16px 24px",
        background: `${COLORS.bg}ee`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${COLORS.border}40` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDim})`,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#0a0a0f" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 700, color: COLORS.white }}>tick.md</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <a href="#protocol" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: COLORS.textDim, textDecoration: "none" }}>Protocol</a>
            <a href="#pricing" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: COLORS.textDim, textDecoration: "none" }}>Pricing</a>
            <a href="https://github.com" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: COLORS.textDim, textDecoration: "none" }}>GitHub</a>
            <a href="#get-started" style={{ padding: "8px 18px", background: COLORS.accent, color: COLORS.bg, fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 13,
              borderRadius: 6, textDecoration: "none" }}>Get Started</a>
          </div>
        </div>
      </nav>

      <Hero />
      <HowItWorks />
      <ProtocolPreview />
      <AgentWorkflow />
      <ForWho />
      <Integrations />
      <Pricing />
      <GetStarted />
      <Footer />
    </div>
  );
}
