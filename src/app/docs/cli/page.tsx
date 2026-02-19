import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CLI Reference",
  description:
    "Complete command reference for the tick CLI. Task lifecycle, agents, sync, notifications, archive, backups, and automation helpers.",
  alternates: { canonical: "/docs/cli" },
  openGraph: {
    title: "TICK.md CLI Reference",
    description:
      "Authoritative command list for the tick CLI, aligned with the shipped command surface.",
  },
};

export default function CLIReference() {
  return (
    <>
      <div className="label">Reference</div>
      <h1>CLI Reference</h1>
      <p className="lead">
        This page reflects the actual command surface in <code>cli/src/cli.ts</code>.
        Use <code>tick --help</code> and <code>tick &lt;command&gt; --help</code> for full option details.
      </p>

      <h2>Install</h2>
      <pre>
        <code>{`npm install -g tick-md\n\ntick --version`}</code>
      </pre>

      <h2>Core Commands</h2>
      <table>
        <thead>
          <tr>
            <th>Command</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>tick init</code></td><td>Initialize a new Tick project.</td></tr>
          <tr><td><code>tick status</code></td><td>Show project overview and task summary.</td></tr>
          <tr><td><code>tick add &lt;title&gt;</code></td><td>Create a task.</td></tr>
          <tr><td><code>tick claim [task-id] [agent]</code></td><td>Claim a task.</td></tr>
          <tr><td><code>tick release &lt;task-id&gt; &lt;agent&gt;</code></td><td>Release a task claim.</td></tr>
          <tr><td><code>tick done [task-id] [agent]</code></td><td>Mark task done.</td></tr>
          <tr><td><code>tick comment &lt;task-id&gt; &lt;agent&gt;</code></td><td>Add a history note.</td></tr>
          <tr><td><code>tick reopen &lt;task-id&gt; &lt;agent&gt;</code></td><td>Reopen a task.</td></tr>
          <tr><td><code>tick delete &lt;task-id&gt;</code></td><td>Delete a task.</td></tr>
          <tr><td><code>tick edit &lt;task-id&gt; &lt;agent&gt;</code></td><td>Edit task fields directly.</td></tr>
        </tbody>
      </table>

      <h2>Query and Visualization</h2>
      <table>
        <thead>
          <tr>
            <th>Command</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>tick list</code></td><td>List and filter tasks.</td></tr>
          <tr><td><code>tick graph</code></td><td>Render dependency graph (ASCII/Mermaid).</td></tr>
          <tr><td><code>tick watch</code></td><td>Watch TICK.md for live updates.</td></tr>
          <tr><td><code>tick validate</code></td><td>Validate TICK.md structure and references.</td></tr>
          <tr><td><code>tick repair</code></td><td>Attempt automated repair for common issues.</td></tr>
          <tr><td><code>tick conflicts</code></td><td>Inspect conflict state.</td></tr>
          <tr><td><code>tick compact</code></td><td>Compact task history.</td></tr>
          <tr><td><code>tick history-stats</code></td><td>Show history/compaction stats.</td></tr>
        </tbody>
      </table>

      <h2>Sync and Recovery</h2>
      <table>
        <thead>
          <tr>
            <th>Command</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>tick sync</code></td><td>Stage/commit/push Tick changes via git.</td></tr>
          <tr><td><code>tick import [file]</code></td><td>Import tasks from YAML.</td></tr>
          <tr><td><code>tick undo</code></td><td>Undo last Tick commit.</td></tr>
          <tr><td><code>tick batch start|commit|abort|status</code></td><td>Batch multiple operations.</td></tr>
        </tbody>
      </table>

      <h2>Agents</h2>
      <table>
        <thead>
          <tr>
            <th>Command</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>tick agent register &lt;name&gt;</code></td><td>Register an agent.</td></tr>
          <tr><td><code>tick agent list</code></td><td>List registered agents.</td></tr>
        </tbody>
      </table>

      <h2>Messaging and Notifications</h2>
      <table>
        <thead>
          <tr>
            <th>Command</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>tick broadcast &lt;agent&gt; &lt;message&gt;</code></td><td>Broadcast a message.</td></tr>
          <tr><td><code>tick broadcasts</code></td><td>List broadcasts.</td></tr>
          <tr><td><code>tick notify send &lt;event&gt; &lt;message&gt;</code></td><td>Send webhook notification.</td></tr>
          <tr><td><code>tick notify list</code></td><td>List webhook targets.</td></tr>
          <tr><td><code>tick notify test &lt;webhook-name&gt;</code></td><td>Test webhook delivery.</td></tr>
          <tr><td><code>tick notify queue status|list|clear|retry|remove &lt;id&gt;</code></td><td>Manage webhook retry queue.</td></tr>
        </tbody>
      </table>

      <h2>Archive and Backups</h2>
      <table>
        <thead>
          <tr>
            <th>Command</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr><td><code>tick archive</code></td><td>Archive completed tasks.</td></tr>
          <tr><td><code>tick archived</code></td><td>List archived tasks.</td></tr>
          <tr><td><code>tick backup list|create|restore|show|clean</code></td><td>Backup management.</td></tr>
          <tr><td><code>tick completion &lt;shell&gt;</code></td><td>Generate shell completion script.</td></tr>
        </tbody>
      </table>

      <h2>Quick Workflow</h2>
      <pre>
        <code>{`tick init\ntick agent register @you\ntick add "Implement feature X" --priority high\ntick claim TASK-001 @you\ntick comment TASK-001 @you --note "Halfway done"\ntick done TASK-001 @you\ntick validate\ntick sync --push`}</code>
      </pre>
    </>
  );
}
