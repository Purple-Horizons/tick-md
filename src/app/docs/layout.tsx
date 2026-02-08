"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ReactNode, useState } from "react";

const C = {
  bg: "#0a0a0f",
  bgSurface: "#12121a",
  bgCode: "#0d0d14",
  accent: "#a78bfa",
  accentDim: "#7c3aed",
  text: "#e8e8ed",
  textDim: "#8b8b99",
  textMuted: "#55556a",
  border: "#2a2a3a",
  white: "#ffffff",
};

const NAV = [
  { href: "/docs", label: "Overview" },
  { href: "/docs/protocol", label: "Protocol Spec" },
  { href: "/docs/getting-started", label: "Getting Started" },
  { href: "/docs/cli", label: "CLI Reference" },
];

function Sidebar({ pathname, onNav }: { pathname: string; onNav?: () => void }) {
  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 24 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#0a0a0f" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: C.white }}>tick.md</span>
      </Link>

      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.textMuted, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
        Documentation
      </div>

      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNav}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: active ? 600 : 400,
              color: active ? C.accent : C.textDim,
              textDecoration: "none",
              padding: "8px 12px",
              borderRadius: 6,
              background: active ? `${C.accent}10` : "transparent",
              borderLeft: active ? `2px solid ${C.accent}` : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            {item.label}
          </Link>
        );
      })}

      <div style={{ marginTop: 32, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
        <Link href="https://github.com/nicobailon/tick" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: C.textMuted, textDecoration: "none" }}>
          GitHub ↗
        </Link>
      </div>
    </nav>
  );
}

export default function DocsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <style>{`
        .docs-content h1 { font-family: 'Instrument Serif', Georgia, serif; font-size: 36px; color: ${C.white}; margin: 0 0 12px; line-height: 1.2; }
        .docs-content h2 { font-family: 'Instrument Serif', Georgia, serif; font-size: 28px; color: ${C.white}; margin: 48px 0 16px; line-height: 1.3; padding-bottom: 8px; border-bottom: 1px solid ${C.border}; }
        .docs-content h3 { font-family: 'DM Sans', sans-serif; font-size: 20px; font-weight: 700; color: ${C.white}; margin: 32px 0 12px; }
        .docs-content h4 { font-family: 'DM Sans', sans-serif; font-size: 16px; font-weight: 700; color: ${C.text}; margin: 24px 0 8px; }
        .docs-content p { font-family: 'DM Sans', sans-serif; font-size: 15px; color: ${C.textDim}; line-height: 1.7; margin: 0 0 16px; }
        .docs-content strong { color: ${C.text}; }
        .docs-content em { color: ${C.textDim}; font-style: italic; }
        .docs-content a { color: ${C.accent}; text-decoration: none; }
        .docs-content a:hover { text-decoration: underline; }
        .docs-content ul, .docs-content ol { font-family: 'DM Sans', sans-serif; font-size: 15px; color: ${C.textDim}; line-height: 1.7; margin: 0 0 16px; padding-left: 24px; }
        .docs-content li { margin-bottom: 6px; }
        .docs-content code { font-family: 'JetBrains Mono', monospace; font-size: 13px; background: ${C.bgCode}; color: ${C.accent}; padding: 2px 6px; border-radius: 4px; }
        .docs-content pre { background: ${C.bgCode}; border: 1px solid ${C.border}; border-radius: 8px; padding: 16px 20px; margin: 0 0 20px; overflow-x: auto; }
        .docs-content pre code { background: none; padding: 0; font-size: 13px; line-height: 1.7; color: ${C.textDim}; }
        .docs-content blockquote { border-left: 3px solid ${C.accent}; padding: 12px 16px; margin: 0 0 16px; background: ${C.accent}08; border-radius: 0 6px 6px 0; }
        .docs-content blockquote p { margin: 0; color: ${C.text}; font-size: 14px; }
        .docs-content table { width: 100%; border-collapse: collapse; margin: 0 0 20px; font-family: 'DM Sans', sans-serif; font-size: 14px; }
        .docs-content th { text-align: left; padding: 10px 12px; border-bottom: 2px solid ${C.border}; color: ${C.white}; font-weight: 600; white-space: nowrap; }
        .docs-content td { padding: 8px 12px; border-bottom: 1px solid ${C.border}40; color: ${C.textDim}; vertical-align: top; }
        .docs-content td code { font-size: 12px; }
        .docs-content hr { border: none; border-top: 1px solid ${C.border}; margin: 32px 0; }
        .docs-content .lead { font-size: 17px; color: ${C.textDim}; line-height: 1.6; margin-bottom: 32px; }
        .docs-content .label { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: ${C.accent}; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px; }
        @media (max-width: 768px) {
          .docs-sidebar { transform: translateX(100%); left: auto !important; right: 0 !important; top: 56px !important; width: 280px !important; border-right: none !important; border-left: 1px solid ${C.border} !important; transition: transform 0.25s cubic-bezier(0.4,0,0.2,1); z-index: 200 !important; }
          .docs-sidebar.open { transform: translateX(0); }
          .docs-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 150; }
          .docs-overlay.open { display: block; }
          .docs-mobile-header { display: flex !important; }
          .docs-mobile-toggle { display: flex !important; }
          .docs-main { margin-left: 0 !important; padding-top: 56px !important; }
        }
      `}</style>

      {/* Mobile header bar */}
      <header
        className="docs-mobile-header"
        style={{
          display: "none",
          position: "fixed", top: 0, left: 0, right: 0, height: 56, zIndex: 300,
          background: C.bg, borderBottom: `1px solid ${C.border}`,
          alignItems: "center", justifyContent: "space-between",
          padding: "0 16px",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDim})`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="#0a0a0f" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: C.white }}>tick.md</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>docs</span>
        </Link>
        <button
          className="docs-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: "none",
            width: 40, height: 40, borderRadius: 8,
            background: C.bgSurface, border: `1px solid ${C.border}`,
            color: C.text, fontSize: 18, cursor: "pointer",
            alignItems: "center", justifyContent: "center",
          }}
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* Mobile overlay */}
      <div
        className={`docs-overlay ${mobileOpen ? "open" : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`docs-sidebar ${mobileOpen ? "open" : ""}`}
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0, width: 240,
          padding: "32px 20px", borderRight: `1px solid ${C.border}`,
          background: C.bg, overflowY: "auto", zIndex: 50,
        }}
      >
        <Sidebar pathname={pathname} onNav={() => setMobileOpen(false)} />
      </aside>

      {/* Main content */}
      <main className="docs-main" style={{ marginLeft: 240, minHeight: "100vh" }}>
        <div className="docs-content" style={{ maxWidth: 760, margin: "0 auto", padding: "48px 32px 80px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
