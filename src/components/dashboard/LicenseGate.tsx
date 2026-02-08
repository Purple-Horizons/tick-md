"use client";

import { useState, useEffect } from "react";
import type { LicenseInfo } from "@/lib/types";

interface LicenseGateProps {
  children: React.ReactNode;
  feature?: keyof LicenseInfo["features"];
  fallback?: React.ReactNode;
}

/**
 * LicenseGate wraps content that requires a license.
 * - If no feature specified, it just checks for any valid license
 * - If a feature is specified, it checks that specific feature is enabled
 * - Shows a prompt to activate if no license is found
 */
export default function LicenseGate({ children, feature, fallback }: LicenseGateProps) {
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check local storage for cached license
    const cached = localStorage.getItem("tick-license");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setLicense(parsed);
      } catch {}
    }
    setLoading(false);
  }, []);

  async function handleActivate() {
    if (!keyInput.trim()) return;
    setError(null);
    setActivating(true);

    try {
      const res = await fetch("/api/license/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: keyInput.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Validation failed");
        return;
      }

      setLicense(data.license);
      localStorage.setItem("tick-license", JSON.stringify(data.license));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActivating(false);
    }
  }

  if (loading) return null;

  // Check if license allows access
  const hasAccess = license && license.status === "active" && (!feature || license.features[feature]);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show fallback or upgrade prompt
  if (fallback) return <>{fallback}</>;

  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-xl p-6 max-w-md w-full">
        <div className="text-center mb-5">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-dim)] mx-auto mb-3 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="#0a0a12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="font-sans text-lg font-semibold text-white">Activate License</h3>
          <p className="font-sans text-sm text-[var(--color-text-dim)] mt-1">
            {feature
              ? `This feature requires a Tick Lifetime license.`
              : `Enter your license key to unlock premium features.`}
          </p>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="TICK-XXXX-XXXX-XXXX"
            className="w-full px-3 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg font-mono text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            onKeyDown={(e) => e.key === "Enter" && handleActivate()}
          />

          {error && (
            <p className="font-sans text-xs text-[var(--color-danger)]">{error}</p>
          )}

          <button
            onClick={handleActivate}
            disabled={activating || !keyInput.trim()}
            className="w-full px-4 py-2.5 bg-[var(--color-accent)] text-[var(--color-bg)] font-sans text-sm font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activating ? "Validating..." : "Activate"}
          </button>

          <div className="text-center">
            <a
              href="https://tick.md/#pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-xs text-[var(--color-accent)] hover:underline"
            >
              Get a license key →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
