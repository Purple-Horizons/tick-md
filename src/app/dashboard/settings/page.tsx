"use client";

import { useTickStore } from "@/lib/store";

export default function SettingsPage() {
  const { meta, agents, summary } = useTickStore();

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="font-serif text-2xl text-white mb-6">Project Settings</h2>

      {/* Project info */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-5 mb-6">
        <h3 className="font-sans text-sm font-semibold text-white mb-4">Project</h3>
        <div className="space-y-3">
          {[
            { label: "Name", value: meta?.project },
            { label: "Title", value: meta?.title },
            { label: "Schema Version", value: meta?.schema_version },
            { label: "ID Prefix", value: meta?.id_prefix },
            { label: "Next ID", value: meta?.next_id },
            { label: "Created", value: meta?.created ? new Date(meta.created).toLocaleString() : "—" },
            { label: "Updated", value: meta?.updated ? new Date(meta.updated).toLocaleString() : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-wider">{label}</span>
              <span className="font-mono text-sm text-[var(--color-text)]">{value ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-5 mb-6">
        <h3 className="font-sans text-sm font-semibold text-white mb-4">Workflow States</h3>
        <div className="flex gap-2 flex-wrap">
          {meta?.default_workflow.map((status, i) => (
            <div key={status} className="flex items-center gap-2">
              <span className="font-mono text-xs text-[var(--color-accent)] bg-[var(--color-bg)] border border-[var(--color-border)] px-2.5 py-1 rounded">
                {status}
              </span>
              {i < (meta?.default_workflow.length ?? 0) - 1 && (
                <span className="text-[var(--color-text-muted)]">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* License */}
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-5">
        <h3 className="font-sans text-sm font-semibold text-white mb-4">License</h3>
        <div className="flex items-center gap-3 mb-4">
          <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
          <span className="font-mono text-sm text-[var(--color-text)]">Open Source (Free)</span>
        </div>
        <p className="font-sans text-xs text-[var(--color-text-dim)] leading-relaxed mb-4">
          You&apos;re running the open source version of the Tick dashboard.
          Upgrade to Lifetime for custom branding and unlimited agents.
        </p>
        <button className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-bg)] font-sans text-xs font-bold rounded-lg hover:opacity-90 transition-opacity">
          Activate License Key
        </button>
      </div>
    </div>
  );
}
