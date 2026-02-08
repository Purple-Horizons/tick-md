export default function ProtocolSpec() {
  return (
    <>
      <div className="label">Reference</div>
      <h1>Protocol Specification</h1>
      <p className="lead">
        The complete specification for the Tick data layer and coordination protocol.
        Everything an agent or human needs to read, write, and coordinate through <code>TICK.md</code> files.
      </p>

      <h2>1. Data Layer</h2>
      <p>
        Tick&rsquo;s data layer is built on three primitives: <strong>Markdown</strong> for human readability,{" "}
        <strong>YAML frontmatter</strong> for machine-parseable structure, and <strong>Git</strong> for versioning
        and audit. The Markdown file <em>is</em> the database.
      </p>

      <h3>Master Task File (TICK.md)</h3>
      <p>
        Every Tick project has a single source of truth: <code>TICK.md</code>. This file uses a structured format
        combining YAML document-level frontmatter, Markdown tables for the agent registry, and repeated
        YAML+Markdown blocks for individual tasks.
      </p>

      <h4>Document Header</h4>
      <p>The file begins with YAML frontmatter containing project-level metadata:</p>
      <pre><code>{`---
project: adgena-v2
title: Adgena V2 Launch
schema_version: "1.0"
created: 2026-02-05T09:00:00-05:00
updated: 2026-02-07T14:32:00-05:00
default_workflow: [backlog, todo, in_progress, review, done]
id_prefix: TASK
next_id: 43
---`}</code></pre>

      <table>
        <thead>
          <tr><th>Field</th><th>Type</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>project</code></td><td>string</td><td>Slug identifier for the project</td></tr>
          <tr><td><code>schema_version</code></td><td>string</td><td>Version of the Tick schema being used</td></tr>
          <tr><td><code>default_workflow</code></td><td>array</td><td>Ordered list of valid workflow states</td></tr>
          <tr><td><code>id_prefix</code></td><td>string</td><td>Prefix for auto-generated task IDs</td></tr>
          <tr><td><code>next_id</code></td><td>integer</td><td>Counter for the next task ID</td></tr>
        </tbody>
      </table>

      <h4>Agent Registry</h4>
      <p>
        Immediately after the frontmatter, a Markdown table registers all participants &mdash;
        both human and bot:
      </p>
      <pre><code>{`## Agents
| Agent | Type | Roles | Status | Working On | Last Active |
|-------|------|-------|--------|------------|-------------|
| @gianni      | human | owner,any    | online  | TASK-001 | 2026-02-07T14:28:00 |
| @claude-code | bot   | engineer     | idle    | -        | 2026-02-07T14:30:00 |
| @content-bot | bot   | copywriter   | working | TASK-003 | 2026-02-07T14:32:00 |
| @qa-bot      | bot   | tester       | idle    | -        | 2026-02-07T14:15:00 |`}</code></pre>

      <p>
        Agent status values: <code>online</code>, <code>idle</code>, <code>working</code>, <code>offline</code>.
        The <code>Working On</code> column tracks the currently claimed task.
      </p>

      <h4>Individual Task Schema</h4>
      <p>
        Each task is a self-contained block with YAML metadata in a fenced code block followed by a
        Markdown description:
      </p>
      <pre><code>{`### TASK-001 · Build avatar selection UI

\`\`\`yaml
id: TASK-001
status: review
priority: urgent        # urgent | high | medium | low
assigned_to: @gianni
claimed_by: null
created_by: @gianni
created_at: 2026-02-05T09:00:00-05:00
updated_at: 2026-02-07T14:28:00-05:00
due_date: 2026-02-14
tags: [frontend, avatar, v2-launch]
depends_on: []
blocks: [TASK-004, TASK-005]
estimated_hours: 8
actual_hours: 6.5
detail_file: tasks/TASK-001.md
history:
  - ts: 2026-02-05T09:00:00  who: @gianni  action: created
  - ts: 2026-02-05T09:15:00  who: @claude-code  action: claimed
  - ts: 2026-02-07T14:00:00  who: @claude-code  action: released
  - ts: 2026-02-07T14:28:00  who: @gianni  action: claimed
\`\`\`

> Build the avatar grid selector for video generation pipeline.
> Must support keyboard nav and preview on hover.`}</code></pre>

      <h3>Task Field Reference</h3>
      <table>
        <thead>
          <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
        </thead>
        <tbody>
          <tr><td><code>id</code></td><td>string</td><td>Yes</td><td>Unique identifier (e.g., TASK-001). Auto-incremented by CLI.</td></tr>
          <tr><td><code>status</code></td><td>enum</td><td>Yes</td><td>Current workflow state. Must be one of <code>default_workflow</code> values.</td></tr>
          <tr><td><code>priority</code></td><td>enum</td><td>Yes</td><td><code>urgent</code>, <code>high</code>, <code>medium</code>, or <code>low</code>.</td></tr>
          <tr><td><code>assigned_to</code></td><td>string</td><td>No</td><td>Agent responsible for the task. Prefixed with <code>@</code>.</td></tr>
          <tr><td><code>claimed_by</code></td><td>string</td><td>No</td><td>Agent actively working. Only one agent may claim a task at a time.</td></tr>
          <tr><td><code>created_by</code></td><td>string</td><td>Yes</td><td>Agent who created the task.</td></tr>
          <tr><td><code>tags</code></td><td>array</td><td>No</td><td>Freeform labels for filtering and role matching.</td></tr>
          <tr><td><code>depends_on</code></td><td>array</td><td>No</td><td>Task IDs that must complete before this task can be claimed.</td></tr>
          <tr><td><code>blocks</code></td><td>array</td><td>No</td><td>Task IDs that are blocked by this task.</td></tr>
          <tr><td><code>estimated_hours</code></td><td>number</td><td>No</td><td>Estimated hours to complete.</td></tr>
          <tr><td><code>actual_hours</code></td><td>number</td><td>No</td><td>Tracked hours spent.</td></tr>
          <tr><td><code>detail_file</code></td><td>string</td><td>No</td><td>Path to extended specification file.</td></tr>
          <tr><td><code>history</code></td><td>array</td><td>Yes</td><td>Append-only log of all actions on this task.</td></tr>
        </tbody>
      </table>

      <h3>History Entry Format</h3>
      <p>Each history entry records a single atomic action:</p>
      <pre><code>{`history:
  - ts: 2026-02-05T09:00:00
    who: @gianni
    action: created
    note: "Initial task"
  - ts: 2026-02-05T09:15:00
    who: @claude-code
    action: claimed
  - ts: 2026-02-07T14:00:00
    who: @claude-code
    action: status_change
    from: in_progress
    to: review`}</code></pre>
      <p>
        Valid actions: <code>created</code>, <code>claimed</code>, <code>released</code>,{" "}
        <code>status_change</code>, <code>assigned</code>, <code>commented</code>,{" "}
        <code>priority_change</code>, <code>dependency_added</code>, <code>dependency_removed</code>.
      </p>

      <hr />

      <h2>2. Coordination Protocol</h2>
      <p>
        The coordination protocol defines how multiple agents safely interact with the same task file
        without conflicts. It is the &ldquo;rules of the road&rdquo; that every participant must follow.
      </p>

      <h3>Claim / Release Cycle</h3>
      <p>
        The fundamental unit of coordination is the <strong>claim/release cycle</strong>. Before an agent
        works on a task, it must claim it. When done, it releases the claim.
      </p>
      <ol>
        <li><strong>Check availability</strong> &mdash; Verify <code>claimed_by</code> is <code>null</code> and all <code>depends_on</code> tasks are <code>done</code>.</li>
        <li><strong>Acquire lock</strong> &mdash; Set the file lock via <code>.tick.lock</code> (timeout: 30s default).</li>
        <li><strong>Write claim</strong> &mdash; Set <code>claimed_by: @agent</code>, append history entry, commit.</li>
        <li><strong>Release lock</strong> &mdash; Remove the file lock.</li>
        <li><strong>Do work</strong> &mdash; The agent performs its task.</li>
        <li><strong>Release claim</strong> &mdash; Set <code>claimed_by: null</code>, update status, append history, commit.</li>
      </ol>

      <blockquote><p>If an agent crashes or times out, the lock expires and another agent can claim the task. The previous agent&rsquo;s partial work is preserved in git history.</p></blockquote>

      <h3>State Transitions</h3>
      <p>
        Tasks move through workflow states defined in <code>default_workflow</code>. Transitions are validated
        against the project configuration:
      </p>
      <pre><code>{`workflow:
  states: [backlog, todo, in_progress, review, done]
  transitions:
    backlog: [todo]
    todo: [in_progress, backlog]
    in_progress: [review, blocked]
    review: [done, in_progress]
    blocked: [todo, in_progress]
    done: [reopened]`}</code></pre>
      <p>
        Invalid transitions are rejected by the CLI. For example, moving directly from <code>backlog</code> to{" "}
        <code>in_progress</code> is not allowed &mdash; it must go through <code>todo</code> first.
      </p>

      <h3>Role-Based Access</h3>
      <p>
        Agents are assigned roles that control which tasks they can claim and which transitions they can perform:
      </p>
      <table>
        <thead>
          <tr><th>Role</th><th>Can Claim (tags)</th><th>Can Transition</th></tr>
        </thead>
        <tbody>
          <tr><td><code>engineer</code></td><td>engineering, frontend, backend, devops, api</td><td>todo→in_progress, in_progress→review</td></tr>
          <tr><td><code>copywriter</code></td><td>content, copy, marketing, email</td><td>todo→in_progress, in_progress→review</td></tr>
          <tr><td><code>tester</code></td><td>qa, testing</td><td>review→done, review→in_progress</td></tr>
          <tr><td><code>owner</code></td><td>any (<code>*</code>)</td><td>any (<code>*→*</code>)</td></tr>
        </tbody>
      </table>

      <h3>Conflict Resolution</h3>
      <p>
        When two agents attempt to claim the same task simultaneously, the file-level lock prevents
        data corruption. The first agent to acquire the lock wins. The second agent receives a
        conflict error and must retry after a configurable delay.
      </p>
      <pre><code>{`locking:
  timeout_seconds: 30
  retry_attempts: 3
  retry_delay_ms: 500`}</code></pre>
      <p>
        For distributed teams using a git remote, Tick follows a <strong>pull-before-write</strong> strategy:
        always pull latest before acquiring the lock, and push immediately after releasing. Git merge
        conflicts on the YAML blocks are handled by the CLI with automatic resolution for non-overlapping
        changes.
      </p>

      <h3>Context Handoff</h3>
      <p>
        When a new agent picks up a task, Tick assembles a <strong>context package</strong> containing
        everything needed to resume work:
      </p>
      <ul>
        <li>Task metadata from <code>TICK.md</code> (status, priority, dependencies, history)</li>
        <li>Full history log showing all previous agents&rsquo; actions and notes</li>
        <li>Detail file content (if <code>detail_file</code> is specified)</li>
        <li>Related task summaries (from <code>depends_on</code> and <code>blocks</code>)</li>
        <li>Agent registry (to understand who else is working on what)</li>
      </ul>
      <pre><code>{`$ tick context TASK-042
# Returns structured context suitable for LLM prompt injection`}</code></pre>

      <h3>Trust Levels</h3>
      <table>
        <thead>
          <tr><th>Trust Level</th><th>Permissions</th><th>Example Agents</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Owner</strong></td><td>Full control: create, delete, assign, override, configure</td><td>Human project leads</td></tr>
          <tr><td><strong>Trusted</strong></td><td>Create tasks, claim, update status, comment</td><td>Vetted bot agents</td></tr>
          <tr><td><strong>Restricted</strong></td><td>Claim assigned tasks only, update status within role</td><td>New or unvetted bots</td></tr>
          <tr><td><strong>Read-Only</strong></td><td>View tasks and history only, cannot modify</td><td>Monitoring dashboards</td></tr>
        </tbody>
      </table>

      <h3>Safety Rails</h3>
      <ul>
        <li><strong>History immutability</strong> &mdash; No agent can modify or delete history entries. The append-only log is the auditable record of all actions.</li>
        <li><strong>Transition validation</strong> &mdash; The CLI enforces valid state transitions. Agents cannot skip states.</li>
        <li><strong>Dependency enforcement</strong> &mdash; Tasks with unmet dependencies cannot be claimed.</li>
        <li><strong>Rate limiting</strong> &mdash; Configurable limits on concurrent claims and change frequency.</li>
        <li><strong>Human approval gates</strong> &mdash; Specific transitions can require human approval regardless of agent role.</li>
      </ul>
    </>
  );
}
