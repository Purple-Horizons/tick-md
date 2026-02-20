import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Release highlights for tick-md, tick-mcp-server, dashboard UX/PWA updates, and shared @tick/core architecture.",
  alternates: { canonical: "/docs/changelog" },
  openGraph: {
    title: "TICK.md Changelog",
    description:
      "Recent releases and engineering updates across the CLI, dashboard, MCP server, and plugin distribution.",
  },
};

export default function ChangelogPage() {
  return (
    <>
      <div className="label">Updates</div>
      <h1>Changelog</h1>
      <p className="lead">
        This page tracks high-impact release changes for the Tick ecosystem: CLI,
        dashboard, MCP server, shared core package, and plugin distribution.
      </p>

      <h2>Latest Releases</h2>

      <h3>Dashboard Experience Refresh (Web)</h3>
      <p><strong>Released:</strong> February 20, 2026</p>
      <ul>
        <li>Shipped a new dashboard intelligence layer for filtering, risk detection, recommendations, critical-path analysis, and since-last-visit digests.</li>
        <li>Added decision-first UX modules: cockpit summaries, smarter empty states, saved filter views, and richer clickable filtering via tags and agent names.</li>
        <li>Introduced keyboard/power workflows including command palette (<code>Cmd/Ctrl+K</code>), bulk selection/status updates, and board navigation hotkeys.</li>
        <li>Added PWA support with manifest, install prompt support, service worker caching, and offline snapshot/freshness indicators.</li>
      </ul>

      <h3>tick-md 1.2.5</h3>
      <p><strong>Released:</strong> February 2026</p>
      <ul>
        <li>Fixed CLI version reporting so <code>tick --version</code> reads package metadata correctly.</li>
        <li>Bumped npm release version to <code>1.2.5</code> and aligned release metadata.</li>
        <li>Adjusted release aliasing for <code>@tick/core</code> to ensure publishable dependency resolution.</li>
      </ul>

      <h3>tick-mcp-server 1.1.3</h3>
      <p><strong>Released:</strong> February 2026</p>
      <ul>
        <li>Incremental release updates and dependency alignment on top of the <code>@tick/core</code>-based MCP architecture.</li>
      </ul>

      <h3>tick-md 1.2.1</h3>
      <p><strong>Released:</strong> February 2026</p>
      <ul>
        <li>Introduced <code>@tick/core</code> as the single source of truth for parser, serializer, validation, types, and atomic file operations.</li>
        <li>Migrated CLI command flows onto shared core operations to reduce drift and duplicate logic.</li>
        <li>Improved reliability around archive, backup, broadcast, parse caching, and completion helpers.</li>
        <li>Added safer destructive behavior by creating a backup before task deletion.</li>
        <li>Hardened file mutation paths with stale-write guards to reduce concurrent write conflicts.</li>
      </ul>

      <h3>tick-mcp-server 1.1.1</h3>
      <p><strong>Released:</strong> February 2026</p>
      <ul>
        <li>Migrated MCP tools to use <code>@tick/core</code> directly.</li>
        <li>Removed dist-bridge coupling in favor of first-class shared package imports.</li>
        <li>Improved build and bundle consistency for downstream integrations.</li>
      </ul>

      <h3>ClawHub Plugin Update</h3>
      <p><strong>Released:</strong> February 2026</p>
      <ul>
        <li>Added native plugin package under <code>clawhub-plugin/</code> with prebuilt MCP bundle support.</li>
        <li>Added worker and orchestrator role instructions to improve multi-agent coordination quality.</li>
        <li>Added plugin test and bundle scripts for repeatable release workflows.</li>
      </ul>

      <hr />

      <h2>Engineering Notes</h2>
      <p>
        The main architectural shift in this cycle is consolidation around
        <code>@tick/core</code>. This lowers maintenance cost, improves correctness,
        and keeps CLI, MCP, and dashboard behavior aligned as new features ship.
        The latest web cycle builds on this by moving the dashboard toward a
        coordination cockpit model (decision-first summaries, filter-driven workflows,
        and resilient PWA behaviors).
      </p>

      <h2>Where to Track Detailed Diffs</h2>
      <ul>
        <li><a href="https://github.com/Purple-Horizons/tick-md/commits/main">Git commit history</a></li>
        <li><a href="https://www.npmjs.com/package/tick-md">npm: tick-md</a></li>
        <li><a href="https://www.npmjs.com/package/tick-mcp-server">npm: tick-mcp-server</a></li>
      </ul>
    </>
  );
}
