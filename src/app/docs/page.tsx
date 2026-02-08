"use client";

import Link from "next/link";

const C = {
  accent: "#a78bfa",
  accentDim: "#7c3aed",
  text: "#e8e8ed",
  textDim: "#8b8b99",
  bgCard: "#1a1a25",
  border: "#2a2a3a",
};

const CARDS = [
  {
    href: "/docs/getting-started",
    label: "Guide",
    title: "Getting Started",
    desc: "Set up a Tick project in under 5 minutes. Initialize, create tasks, and coordinate agents.",
    icon: "→",
  },
  {
    href: "/docs/protocol",
    label: "Reference",
    title: "Protocol Spec",
    desc: "The complete data layer and coordination protocol specification. File format, schema, state transitions.",
    icon: "◇",
  },
  {
    href: "/docs/cli",
    label: "Reference",
    title: "CLI Reference",
    desc: "Every command in the tick CLI. Task management, querying, agent registration, and git integration.",
    icon: "$",
  },
];

export default function DocsOverview() {
  return (
    <>
      <div className="label">Documentation</div>
      <h1>Tick Documentation</h1>
      <p className="lead">
        Tick is a protocol and toolkit for autonomous AI agents and humans to coordinate work
        through structured Markdown files. Every task ticked. Every agent in sync. Every action logged.
      </p>

      <div style={{ display: "grid", gap: 16, marginTop: 32 }}>
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            style={{
              display: "block",
              textDecoration: "none",
              background: C.bgCard,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: "24px 28px",
              transition: "border-color 0.15s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = C.accent + "60";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = C.border;
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.accent, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
              {card.label}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 22, color: C.text, marginBottom: 6 }}>
                  {card.title}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: C.textDim, lineHeight: 1.5 }}>
                  {card.desc}
                </div>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, color: C.accent, marginLeft: 16, flexShrink: 0 }}>
                {card.icon}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <hr />

      <h2>Core Principles</h2>
      <table>
        <thead>
          <tr><th>Principle</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Markdown-Native</strong></td><td>The Markdown file IS the database. No compilation, no build step, no server required.</td></tr>
          <tr><td><strong>Git-Native</strong></td><td>Git IS the sync engine, audit log, and conflict resolver. Every change is a commit.</td></tr>
          <tr><td><strong>Schema-Enforced</strong></td><td>YAML frontmatter provides structured, machine-parseable fields with strict validation.</td></tr>
          <tr><td><strong>Protocol-First</strong></td><td>Tick defines a coordination protocol (claim, release, update, transition), not just a file format.</td></tr>
          <tr><td><strong>Agent-Agnostic</strong></td><td>Any system that can read and write text files can participate. No SDK required.</td></tr>
          <tr><td><strong>Zero Infrastructure</strong></td><td>Works with just a filesystem. Optional enhancements add capabilities but are never required.</td></tr>
        </tbody>
      </table>

      <h2>Architecture</h2>
      <p>Tick is composed of five independent layers:</p>
      <pre><code>{`┌───────────────────────────────────────────────────────┐
│  LAYER 5: GUI DASHBOARD (React Web App)               │
│  Kanban board, agent monitor, activity feed            │
├───────────────────────────────────────────────────────┤
│  LAYER 4: INTEGRATION (MCP Server / Skill / Plugin)   │
│  Exposes Tick to agent frameworks                      │
├───────────────────────────────────────────────────────┤
│  LAYER 3: COORDINATION PROTOCOL                       │
│  Claim/release, locking, transitions, roles            │
├───────────────────────────────────────────────────────┤
│  LAYER 2: CLI & VALIDATION ENGINE                     │
│  tick create/claim/update/query/validate               │
├───────────────────────────────────────────────────────┤
│  LAYER 1: DATA LAYER (Markdown + YAML + Git)          │
│  Master task file + optional detail files              │
└───────────────────────────────────────────────────────┘`}</code></pre>
      <p>
        Only Layer 1 (the Data Layer) is required. All other layers are optional enhancements.
        This means you can start with just a <code>TICK.md</code> file and a text editor.
      </p>
    </>
  );
}
