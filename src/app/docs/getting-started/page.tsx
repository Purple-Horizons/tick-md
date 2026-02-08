import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Getting Started",
  description: "Set up TICK.md in under 5 minutes. Install the CLI via npm, initialize a project, create tasks, register AI agents, and start coordinating work through Markdown.",
  alternates: { canonical: "/docs/getting-started" },
  openGraph: {
    title: "Getting Started with TICK.md",
    description: "Install the CLI, create tasks, and coordinate AI agents in under 5 minutes. No server, no database, no API keys required.",
  },
};

export default function GettingStarted() {
  return (
    <>
      <div className="label">Guide</div>
      <h1>Getting Started</h1>
      <p className="lead">
        Set up a Tick project in under 5 minutes. All you need is a filesystem &mdash;
        no server, no database, no API keys.
      </p>

      <h2>Installation</h2>
      <p>Install the Tick CLI globally:</p>
      <pre><code>{`npm install -g tick-md

# Or with npx (no install)
npx tick-md init`}</code></pre>

      <h2>Initialize a Project</h2>
      <p>
        Run <code>tick init</code> inside any directory or git repository. This creates
        the Tick scaffolding alongside your existing files:
      </p>
      <pre><code>{`$ cd my-project
$ tick init

✓ Created .tick/config.yml
✓ Created .tick/schema.json
✓ Created TICK.md
✓ Created tasks/
✓ Tick project initialized`}</code></pre>

      <h3>Project Structure</h3>
      <p>After initialization, your project looks like this:</p>
      <pre><code>{`project-root/
├── .tick/
│   ├── config.yml          # Project config, agent registry, workflow rules
│   ├── schema.json         # JSON Schema for task validation
│   └── hooks/              # Optional pre/post commit hooks
├── TICK.md                 # Master task index (single source of truth)
├── tasks/                  # Optional detail files for complex tasks
│   ├── TASK-001.md
│   ├── TASK-002.md
│   └── ...
└── .tick.lock              # Lock file for concurrent access`}</code></pre>

      <table>
        <thead>
          <tr><th>Path</th><th>Purpose</th></tr>
        </thead>
        <tbody>
          <tr><td><code>.tick/config.yml</code></td><td>Project settings: workflow states, role permissions, locking config, git behavior</td></tr>
          <tr><td><code>.tick/schema.json</code></td><td>JSON Schema used to validate task YAML blocks</td></tr>
          <tr><td><code>TICK.md</code></td><td>The master task file. This is the single source of truth for all tasks.</td></tr>
          <tr><td><code>tasks/</code></td><td>Extended detail files for tasks that need more than a one-liner description.</td></tr>
          <tr><td><code>.tick.lock</code></td><td>File-level lock for concurrent access. Auto-managed by the CLI.</td></tr>
        </tbody>
      </table>

      <h3>Single File vs. Multi-File</h3>
      <p>
        Tick uses a <strong>hybrid approach</strong>: one master index file (<code>TICK.md</code>) contains
        all task metadata and short descriptions, while optional detail files in <code>tasks/</code> hold
        extended specifications, acceptance criteria, and discussion threads.
      </p>
      <blockquote>
        <p>
          This optimizes for the most common operation: an agent reading the full project state.
          A single file read gives complete context. Detail files are only accessed when an agent
          claims a task and needs the full spec.
        </p>
      </blockquote>

      <h2>Create Your First Task</h2>
      <pre><code>{`$ tick add "Build user auth flow" --priority high --tags engineering,backend

✓ Created TASK-001: Build user auth flow
  Priority: high
  Tags: engineering, backend
  Status: backlog`}</code></pre>
      <p>This appends a new task block to your <code>TICK.md</code>:</p>
      <pre><code>{`### TASK-001 · Build user auth flow

\`\`\`yaml
id: TASK-001
status: backlog
priority: high
assigned_to: null
claimed_by: null
created_by: @gianni
created_at: 2026-02-07T10:00:00-05:00
tags: [engineering, backend]
depends_on: []
blocks: []
history:
  - ts: 2026-02-07T10:00:00  who: @gianni  action: created
\`\`\`

> Build user auth flow`}</code></pre>

      <h2>Claim and Work</h2>
      <p>An agent (human or bot) claims a task before starting work:</p>
      <pre><code>{`$ tick claim TASK-001

✓ Claimed TASK-001: Build user auth flow
  Status: backlog → in_progress
  Claimed by: @gianni`}</code></pre>
      <p>
        The claim command acquires the file lock, sets <code>claimed_by</code>, transitions
        status to <code>in_progress</code>, appends a history entry, and commits.
      </p>

      <h2>Update Progress</h2>
      <p>Add notes as you work:</p>
      <pre><code>{`$ tick comment TASK-001 "Set up JWT middleware, working on refresh tokens next"

✓ Comment added to TASK-001`}</code></pre>

      <h2>Complete the Task</h2>
      <pre><code>{`$ tick done TASK-001

✓ Completed TASK-001: Build user auth flow
  Status: in_progress → review
  Released claim`}</code></pre>
      <p>
        By default, <code>tick done</code> moves the task to <code>review</code>. To skip review and
        go straight to done:
      </p>
      <pre><code>{`$ tick done TASK-001 --skip-review`}</code></pre>

      <h2>Check Project Status</h2>
      <pre><code>{`$ tick status

┌─────────────────────────────────────┐
│  adgena-v2 · Adgena V2 Launch      │
├─────────┬───────────────────────────┤
│ backlog │ 12 tasks                  │
│ todo    │  8 tasks                  │
│ active  │  3 tasks (2 bots, 1 you) │
│ review  │  5 tasks                  │
│ done    │ 15 tasks                  │
└─────────┴───────────────────────────┘

Active agents:
  @claude-code  working  TASK-023  (2m ago)
  @content-bot  working  TASK-031  (45s ago)
  @gianni       online   TASK-001  (just now)`}</code></pre>

      <hr />

      <h2>Example: Multi-Agent Workflow</h2>
      <p>
        Here&rsquo;s a complete workflow showing how Tick coordinates a human, a coding bot,
        and a QA bot on the same project:
      </p>

      <h4>Step 1 &mdash; Human creates and assigns tasks</h4>
      <pre><code>{`$ tick add "Build landing page" --priority high --tags frontend --assign @claude-code
$ tick add "Write launch email" --priority medium --tags content --assign @content-bot
$ tick add "E2E tests for landing" --priority medium --tags qa --depends-on TASK-001`}</code></pre>

      <h4>Step 2 &mdash; Coding bot picks up work</h4>
      <pre><code>{`# @claude-code reads TICK.md, sees assigned task
$ tick claim TASK-001
# ... builds the landing page ...
$ tick comment TASK-001 "Built responsive landing with hero, features, pricing sections"
$ tick done TASK-001`}</code></pre>

      <h4>Step 3 &mdash; QA bot auto-triggers</h4>
      <pre><code>{`# @qa-bot watches for dependency completion
# TASK-003 depends on TASK-001 which is now done
$ tick claim TASK-003
# ... runs E2E tests ...
$ tick comment TASK-003 "All 12 tests passing. Screenshots attached in detail file."
$ tick done TASK-003 --skip-review`}</code></pre>

      <h4>Step 4 &mdash; Human reviews</h4>
      <pre><code>{`$ tick query --status review

TASK-001 · Build landing page (review) assigned:@gianni
TASK-002 · Write launch email (review) assigned:@gianni

$ tick status TASK-001 done   # Approve
$ tick status TASK-002 in_progress --comment "Needs punchier CTA"  # Reject back`}</code></pre>

      <hr />

      <h2>Configuration</h2>
      <p>
        The <code>.tick/config.yml</code> file controls all project-level behavior. Here&rsquo;s a
        complete example:
      </p>
      <pre><code>{`# .tick/config.yml

project:
  name: adgena-v2
  title: Adgena V2 Launch
  description: AI-powered video generation platform

workflow:
  states: [backlog, todo, in_progress, review, done]
  initial: backlog
  terminal: [done]
  transitions:
    backlog: [todo]
    todo: [in_progress, backlog]
    in_progress: [review, blocked]
    review: [done, in_progress]
    blocked: [todo, in_progress]
    done: [reopened]

roles:
  engineer:
    can_claim_tags: [engineering, frontend, backend, devops, api]
    can_transition: [todo->in_progress, in_progress->review]
  copywriter:
    can_claim_tags: [content, copy, marketing, email]
    can_transition: [todo->in_progress, in_progress->review]
  tester:
    can_claim_tags: [qa, testing]
    can_transition: [review->done, review->in_progress]
  owner:
    can_claim_tags: ["*"]
    can_transition: ["*->*"]

locking:
  timeout_seconds: 30
  retry_attempts: 3
  retry_delay_ms: 500

git:
  auto_commit: true
  auto_push: false
  commit_prefix: "[tick]"
  push_on_sync: false

notifications:
  webhook_url: null
  events: [claimed, completed, blocked, overdue]`}</code></pre>

      <h3>Git Configuration</h3>
      <p>
        By default, <code>auto_commit</code> is enabled, meaning every mutation command (<code>add</code>, <code>claim</code>, 
        <code>done</code>, <code>comment</code>, etc.) automatically creates a git commit with the prefix <code>[tick]</code>. 
        This provides an automatic audit trail of all task changes.
      </p>
      <p>
        You can override this behavior per-command using flags:
      </p>
      <ul>
        <li><code>--commit</code> — Force auto-commit for this command, even if disabled in config</li>
        <li><code>--no-commit</code> — Skip auto-commit for this command, even if enabled in config</li>
      </ul>
      <pre><code>{`# Skip auto-commit for a specific task creation
$ tick add "Draft task" --no-commit

# Force commit even if auto_commit is disabled in config
$ tick done TASK-001 --commit`}</code></pre>

      <h2>Next Steps</h2>
      <ul>
        <li>Read the <a href="/docs/protocol">Protocol Spec</a> for the full data format and coordination rules</li>
        <li>See the <a href="/docs/cli">CLI Reference</a> for all available commands</li>
        <li>Check out the <a href="https://github.com/Purple-Horizons/tick-md">GitHub repo</a> for source code and examples</li>
      </ul>
    </>
  );
}
