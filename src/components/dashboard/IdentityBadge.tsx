"use client";

import type { AgentType } from "@/lib/types";

const TYPE_STYLE: Record<AgentType, { icon: string; ring: string; bg: string; label: string }> = {
  human: { icon: "●", ring: "ring-amber-400/35", bg: "bg-amber-300/15", label: "Human" },
  bot: { icon: "⬢", ring: "ring-cyan-400/35", bg: "bg-cyan-300/15", label: "Bot" },
};

export default function IdentityBadge({
  type,
  name,
  compact = false,
}: {
  type: AgentType;
  name: string;
  compact?: boolean;
}) {
  const style = TYPE_STYLE[type];
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${style.bg} ring-1 ${style.ring} rounded-full ${
        compact ? "px-2 py-0.5" : "px-2.5 py-1"
      }`}
      title={`${style.label}: ${name}`}
    >
      <span className="font-mono text-[10px] leading-none">{style.icon}</span>
      <span className="font-mono text-[10px] text-[var(--color-text-dim)]">{name}</span>
    </span>
  );
}

