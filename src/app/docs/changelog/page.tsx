import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Release highlights for tick-md, tick-mcp-server, and the shared @tick/core architecture.",
  alternates: { canonical: "/docs/changelog" },
  openGraph: {
    title: "TICK.md Changelog",
    description:
      "Recent releases and engineering updates across the CLI, MCP server, and plugin distribution.",
  },
};

export default function ChangelogPage() {
  return (
    <>
      <div className="label">Updates</div>
      <h1>Changelog</h1>
      <p className="lead">
        This page tracks high-impact release changes for the Tick ecosystem: CLI,
        MCP server, shared core package, and plugin distribution.
      </p>

      <h2>Latest Releases</h2>

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
