"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

export function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.12 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(24px)",
        transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export function TickMark({ size = 20, delay = 0 }: { size?: number; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.5)",
        transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        flexShrink: 0,
      }}
    >
      <path
        d="M5 13l4 4L19 7"
        stroke="var(--color-accent)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 24,
          strokeDashoffset: visible ? 0 : 24,
          transition: `stroke-dashoffset 0.5s ease ${delay / 1000 + 0.2}s`,
        }}
      />
    </svg>
  );
}

export function AgentDot({ status, pulse }: { status: string; pulse?: boolean }) {
  const colors: Record<string, string> = {
    working: "var(--color-success)",
    idle: "var(--color-warning)",
    offline: "var(--color-text-muted)",
  };
  return (
    <span
      className={pulse ? "animate-pulse-glow" : ""}
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: colors[status] || "var(--color-text-muted)",
        boxShadow: pulse ? `0 0 8px ${colors[status]}` : "none",
        flexShrink: 0,
      }}
    />
  );
}

export function TickLogo({ size = 28 }: { size?: number }) {
  const inner = Math.round(size * 0.57);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.25,
        background: "linear-gradient(135deg, var(--color-accent), var(--color-accent-deep))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width={inner} height={inner} viewBox="0 0 24 24">
        <path
          d="M5 13l4 4L19 7"
          stroke="#0a0a12"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function CodeWindow({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-code)]">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
        <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
        <div className="w-3 h-3 rounded-full bg-[#fbbf24]" />
        <div className="w-3 h-3 rounded-full bg-[var(--color-accent)]" />
        <span className="font-mono text-xs text-[var(--color-text-muted)] ml-3">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
