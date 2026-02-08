import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CLI Reference",
  description: "Complete command reference for the tick CLI. Task creation, claiming, status updates, dependency graphs, agent management, validation, and Git sync.",
  alternates: { canonical: "/docs/cli" },
  openGraph: {
    title: "TICK.md CLI Reference",
    description: "Every command in the tick CLI — init, add, claim, done, list, graph, watch, validate, sync, and agent management.",
  },
};

export default function CLIReference() {
  return (
    <>
      <div className="label">Reference</div>
      <h1>CLI Reference</h1>
      <p className="lead">
        Complete command reference for the <code>tick</code> CLI. Every mutation to <code>TICK.md</code> goes
        through the CLI to ensure validation, locking, and proper history logging.
      </p>

      <h2>Installation</h2>
      <pre><code>{`npm install -g tick-md

# Verify installation
tick --version`}</code></pre>

      <h2>Project Commands</h2>

      <h3><code>tick init</code></h3>
      <p>Initialize a new Tick project in the current directory.</p>
      <pre><code>{`$ tick init [options]

Options:
  --name <name>        Project slug (default: directory name)
  --title <title>      Human-readable project title
  --workflow <states>  Comma-separated workflow states
                       (default: backlog,todo,in_progress,review,done)`}</code></pre>
      <p>Creates <code>.tick/</code> directory, <code>TICK.md</code>, and <code>tasks/</code> folder.</p>

      <h3><code>tick status</code></h3>
      <p>Display project overview with task counts and active agents.</p>
      <pre><code>{`$ tick status [options]

Options:
  --json    Output as JSON
  --quiet   Only show counts`}</code></pre>
      <pre><code>{`$ tick status

┌─────────────────────────────────────┐
│  adgena-v2 · Adgena V2 Launch      │
├─────────┬───────────────────────────┤
│ backlog │ 12 tasks                  │
│ todo    │  8 tasks                  │
│ active  │  3 tasks (2 bots, 1 you) │
│ review  │  5 tasks                  │
│ done    │ 15 tasks                  │
└─────────┴───────────────────────────┘`}</code></pre>

      <h3><code>tick validate</code></h3>
      <p>Validate <code>TICK.md</code> against the schema. Checks all task blocks for required fields, valid statuses, and reference integrity.</p>
      <pre><code>{`$ tick validate [options]

Options:
  --strict   Fail on warnings (not just errors)
  --fix      Auto-fix common issues (missing timestamps, etc.)`}</code></pre>

      <hr />

      <h2>Task Commands</h2>

      <h3><code>tick add</code></h3>
      <p>Create a new task.</p>
      <pre><code>{`$ tick add <title> [options]

Options:
  --priority <level>   urgent | high | medium | low (default: medium)
  --tags <tags>        Comma-separated tags
  --assign <agent>     Agent to assign (e.g., @claude-code)
  --depends-on <ids>   Comma-separated task IDs this depends on
  --detail             Create a detail file in tasks/
  --due <date>         Due date (ISO 8601 or natural language)
  --commit             Auto-commit after change (override config)
  --no-commit          Skip auto-commit even if config enables it`}</code></pre>
      <pre><code>{`$ tick add "Build user auth" --priority high --tags backend,auth --assign @claude-code

✓ Created TASK-001: Build user auth
  Priority: high
  Tags: backend, auth
  Assigned: @claude-code
  Status: backlog`}</code></pre>

      <h3><code>tick claim</code></h3>
      <p>
        Claim a task for the current agent. Acquires the file lock, sets <code>claimed_by</code>,
        transitions status to <code>in_progress</code>, and commits.
      </p>
      <pre><code>{`$ tick claim <task-id> [options]

Options:
  --as <agent>    Agent identifier (default: detected from git config or env)
  --force         Override existing claim (owner role only)
  --commit        Auto-commit after change (override config)
  --no-commit     Skip auto-commit even if config enables it`}</code></pre>
      <blockquote>
        <p>
          A task can only be claimed if <code>claimed_by</code> is null,
          all <code>depends_on</code> tasks are done, and the agent&rsquo;s role permits the task&rsquo;s tags.
        </p>
      </blockquote>

      <h3><code>tick release</code></h3>
      <p>Release a claim without changing status. Useful when an agent needs to hand off mid-work.</p>
      <pre><code>{`$ tick release <task-id> [options]

Options:
  --comment <msg>  Add a comment explaining why the task was released
  --commit         Auto-commit after change (override config)
  --no-commit      Skip auto-commit even if config enables it`}</code></pre>

      <h3><code>tick update</code></h3>
      <p>Update task fields.</p>
      <pre><code>{`$ tick update <task-id> [options]

Options:
  --priority <level>   Change priority
  --tags <tags>        Replace tags
  --assign <agent>     Reassign
  --due <date>         Change due date
  --add-dep <id>       Add a dependency
  --rm-dep <id>        Remove a dependency`}</code></pre>

      <h3><code>tick done</code></h3>
      <p>Mark a task as complete. Releases the claim and transitions status.</p>
      <pre><code>{`$ tick done <task-id> [options]

Options:
  --skip-review    Go directly to done (skip review state)
  --comment <msg>  Add a completion comment
  --commit         Auto-commit after change (override config)
  --no-commit      Skip auto-commit even if config enables it`}</code></pre>

      <h3><code>tick comment</code></h3>
      <p>Add a comment to a task&rsquo;s history log.</p>
      <pre><code>{`$ tick comment <task-id> <message> [options]

Options:
  --commit        Auto-commit after change (override config)
  --no-commit     Skip auto-commit even if config enables it

Example:
$ tick comment TASK-001 "JWT middleware done, working on refresh tokens"`}</code></pre>

      <hr />

      <h2>Query Commands</h2>

      <h3><code>tick query</code></h3>
      <p>Search and filter tasks.</p>
      <pre><code>{`$ tick query [options]

Options:
  --status <status>      Filter by status
  --priority <level>     Filter by priority
  --assigned <agent>     Filter by assignee
  --tag <tag>            Filter by tag
  --claimed              Show only claimed tasks
  --unclaimed            Show only unclaimed tasks
  --blocked              Show only blocked tasks
  --overdue              Show tasks past due date
  --sort <field>         Sort by field (priority, created, updated, due)
  --json                 Output as JSON
  --limit <n>            Limit results`}</code></pre>
      <pre><code>{`$ tick query --status todo --priority high --tag frontend

TASK-012 · Redesign nav component (todo) high  tags:frontend,ui
TASK-018 · Add dark mode toggle (todo) high  tags:frontend,a11y`}</code></pre>

      <h3><code>tick context</code></h3>
      <p>Assemble the full context package for a task. Designed for injection into LLM prompts.</p>
      <pre><code>{`$ tick context <task-id> [options]

Options:
  --format <fmt>   markdown | json | yaml (default: markdown)
  --include-deps   Include dependency task summaries
  --include-blocks Include blocked task summaries`}</code></pre>
      <pre><code>{`$ tick context TASK-042

# Returns:
# - Task metadata (status, priority, assignee, etc.)
# - Full history log
# - Detail file content (if exists)
# - Dependency summaries
# - Agent registry snapshot`}</code></pre>

      <hr />

      <h2>Agent Commands</h2>

      <h3><code>tick agent register</code></h3>
      <p>Register a new agent in the agent registry.</p>
      <pre><code>{`$ tick agent register <name> [options]

Options:
  --type <type>     human | bot (default: bot)
  --roles <roles>   Comma-separated roles (e.g., engineer,tester)
  --trust <level>   owner | trusted | restricted | readonly (default: trusted)`}</code></pre>

      <h3><code>tick agent list</code></h3>
      <p>List all registered agents and their current status.</p>
      <pre><code>{`$ tick agent list [--json]

Agent          Type   Roles          Status   Working On   Last Active
@gianni        human  owner,any      online   TASK-001     2m ago
@claude-code   bot    engineer       idle     -            5m ago
@content-bot   bot    copywriter     working  TASK-003     30s ago
@qa-bot        bot    tester         idle     -            15m ago`}</code></pre>

      <h3><code>tick agent heartbeat</code></h3>
      <p>Update an agent&rsquo;s <code>last_active</code> timestamp. Bots should call this periodically.</p>
      <pre><code>{`$ tick agent heartbeat [--as <agent>]`}</code></pre>

      <hr />

      <h2>Git Integration</h2>
      <p>
        When <code>git.auto_commit</code> is enabled in <code>.tick/config.yml</code> (enabled by default), every CLI mutation
        automatically creates a git commit:
      </p>
      <pre><code>{`[tick] TASK-001 claimed by @claude-code
[tick] TASK-001 status: todo → in_progress
[tick] TASK-003 created: Write launch email
[tick] TASK-001 completed by @claude-code`}</code></pre>
      <p>
        Set <code>git.auto_commit: false</code> to disable automatic commits, or use the <code>--no-commit</code> flag
        on individual commands to skip auto-commit for specific operations. Conversely, use <code>--commit</code> to force
        auto-commit even when disabled in config.
      </p>
      <p>
        Set <code>git.auto_push: true</code> to automatically push after each commit (useful for
        remote teams).
      </p>

      <hr />

      <h2>Environment Variables</h2>
      <table>
        <thead>
          <tr><th>Variable</th><th>Description</th><th>Default</th></tr>
        </thead>
        <tbody>
          <tr><td><code>TICK_AGENT</code></td><td>Default agent identity</td><td>Detected from git config</td></tr>
          <tr><td><code>TICK_DIR</code></td><td>Path to Tick project root</td><td>Current directory</td></tr>
          <tr><td><code>TICK_LOCK_TIMEOUT</code></td><td>Lock timeout in seconds</td><td>30</td></tr>
          <tr><td><code>TICK_AUTO_COMMIT</code></td><td>Override auto-commit setting</td><td>From config</td></tr>
          <tr><td><code>TICK_JSON</code></td><td>Force JSON output for all commands</td><td>false</td></tr>
        </tbody>
      </table>

      <hr />

      <h2>Exit Codes</h2>
      <table>
        <thead>
          <tr><th>Code</th><th>Meaning</th></tr>
        </thead>
        <tbody>
          <tr><td><code>0</code></td><td>Success</td></tr>
          <tr><td><code>1</code></td><td>General error</td></tr>
          <tr><td><code>2</code></td><td>Validation error (schema, transition, or permission)</td></tr>
          <tr><td><code>3</code></td><td>Lock conflict (another agent holds the lock)</td></tr>
          <tr><td><code>4</code></td><td>Task not found</td></tr>
          <tr><td><code>5</code></td><td>Dependency not met</td></tr>
        </tbody>
      </table>
    </>
  );
}
