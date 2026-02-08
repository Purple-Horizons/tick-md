import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { parseTickFile } from "../dist/parser/parse.js";
import { serializeTickFile, generateDefaultTickFile } from "../dist/parser/serialize.js";

// ─── Fixtures ────────────────────────────────────────────────────

const MINIMAL_TICK = `---
project: test-project
schema_version: "1.0"
created: 2026-01-01T00:00:00Z
updated: 2026-01-01T00:00:00Z
default_workflow: [backlog, todo, in_progress, review, done]
id_prefix: TASK
next_id: 1
---
`;

const TICK_WITH_AGENTS = `---
project: test-project
schema_version: "1.0"
created: 2026-01-01T00:00:00Z
updated: 2026-01-01T00:00:00Z
default_workflow: [backlog, todo, in_progress, review, done]
id_prefix: TASK
next_id: 3
---

## Agents

| Agent | Type | Role | Status | Working On | Last Active | Trust Level |
|-------|------|------|--------|------------|-------------|-------------|
| @alice | human | owner, developer | working | TASK-001 | 2026-01-01T10:00:00Z | owner |
| @bot | bot | engineer | idle | - | 2026-01-01T09:00:00Z | trusted |

---

`;

const TICK_WITH_TASKS = `---
project: test-project
schema_version: "1.0"
created: 2026-01-01T00:00:00Z
updated: 2026-01-01T00:00:00Z
default_workflow: [backlog, todo, in_progress, review, done]
id_prefix: TASK
next_id: 4
---

## Agents

| Agent | Type | Role | Status | Working On | Last Active | Trust Level |
|-------|------|------|--------|------------|-------------|-------------|
| @alice | human | owner | working | TASK-001 | 2026-01-01T10:00:00Z | owner |

---

## Tasks

### TASK-001 · Build authentication

\`\`\`yaml
id: TASK-001
status: in_progress
priority: high
assigned_to: "@alice"
claimed_by: "@alice"
created_by: "@alice"
created_at: 2026-01-01T08:00:00Z
updated_at: 2026-01-01T10:00:00Z
tags:
  - backend
  - security
history:
  - ts: 2026-01-01T08:00:00Z
    who: "@alice"
    action: created
  - ts: 2026-01-01T09:00:00Z
    who: "@alice"
    action: claimed
\`\`\`

> Implement JWT-based authentication with refresh tokens.

### TASK-002 · Write unit tests

\`\`\`yaml
id: TASK-002
status: blocked
priority: medium
assigned_to: null
claimed_by: null
created_by: "@alice"
created_at: 2026-01-01T08:05:00Z
updated_at: 2026-01-01T08:05:00Z
depends_on:
  - TASK-001
tags:
  - testing
history:
  - ts: 2026-01-01T08:05:00Z
    who: "@alice"
    action: created
\`\`\`

> Write tests for the authentication system.

### TASK-003 · Deploy to staging

\`\`\`yaml
id: TASK-003
status: todo
priority: low
assigned_to: null
claimed_by: null
created_by: "@alice"
created_at: 2026-01-01T08:10:00Z
updated_at: 2026-01-01T08:10:00Z
depends_on:
  - TASK-002
blocks: []
tags:
  - devops
history:
  - ts: 2026-01-01T08:10:00Z
    who: "@alice"
    action: created
\`\`\`

> Deploy the auth system to the staging environment.
`;

// ─── Tests ───────────────────────────────────────────────────────

describe("Parser: parseTickFile", () => {
  describe("Frontmatter parsing", () => {
    it("parses minimal frontmatter", () => {
      const result = parseTickFile(MINIMAL_TICK);
      assert.equal(result.meta.project, "test-project");
      assert.equal(result.meta.schema_version, "1.0");
      assert.equal(result.meta.id_prefix, "TASK");
      assert.equal(result.meta.next_id, 1);
    });

    it("preserves dates", () => {
      const result = parseTickFile(MINIMAL_TICK);
      // gray-matter parses ISO dates into Date objects, so we compare as dates
      const created = new Date(result.meta.created);
      const updated = new Date(result.meta.updated);
      assert.equal(created.toISOString(), "2026-01-01T00:00:00.000Z");
      assert.equal(updated.toISOString(), "2026-01-01T00:00:00.000Z");
    });

    it("parses default_workflow array", () => {
      const result = parseTickFile(MINIMAL_TICK);
      assert.deepEqual(result.meta.default_workflow, [
        "backlog", "todo", "in_progress", "review", "done",
      ]);
    });

    it("returns empty agents and tasks for minimal file", () => {
      const result = parseTickFile(MINIMAL_TICK);
      assert.equal(result.agents.length, 0);
      assert.equal(result.tasks.length, 0);
    });

    it("provides defaults for missing fields", () => {
      const result = parseTickFile("---\nproject: x\n---\n");
      assert.equal(result.meta.project, "x");
      assert.equal(result.meta.schema_version, "1.0");
      assert.equal(result.meta.id_prefix, "TASK");
      assert.equal(result.meta.next_id, 1);
    });
  });

  describe("Agent table parsing", () => {
    it("parses agents from markdown table", () => {
      const result = parseTickFile(TICK_WITH_AGENTS);
      assert.equal(result.agents.length, 2);
    });

    it("extracts agent properties correctly", () => {
      const result = parseTickFile(TICK_WITH_AGENTS);
      const alice = result.agents[0];
      assert.equal(alice.name, "@alice");
      assert.equal(alice.type, "human");
      assert.deepEqual(alice.roles, ["owner", "developer"]);
      assert.equal(alice.status, "working");
      assert.equal(alice.working_on, "TASK-001");
      assert.equal(alice.trust_level, "owner");
    });

    it("parses bot agent correctly", () => {
      const result = parseTickFile(TICK_WITH_AGENTS);
      const bot = result.agents[1];
      assert.equal(bot.name, "@bot");
      assert.equal(bot.type, "bot");
      assert.equal(bot.status, "idle");
      assert.equal(bot.working_on, null); // "-" becomes null
    });
  });

  describe("Task block parsing", () => {
    it("parses all tasks", () => {
      const result = parseTickFile(TICK_WITH_TASKS);
      assert.equal(result.tasks.length, 3);
    });

    it("extracts task ID and title from header", () => {
      const result = parseTickFile(TICK_WITH_TASKS);
      assert.equal(result.tasks[0].id, "TASK-001");
      assert.equal(result.tasks[0].title, "Build authentication");
    });

    it("parses task metadata from YAML", () => {
      const result = parseTickFile(TICK_WITH_TASKS);
      const task = result.tasks[0];
      assert.equal(task.status, "in_progress");
      assert.equal(task.priority, "high");
      assert.equal(task.assigned_to, "@alice");
      assert.equal(task.claimed_by, "@alice");
      assert.equal(task.created_by, "@alice");
    });

    it("parses tags array", () => {
      const result = parseTickFile(TICK_WITH_TASKS);
      assert.deepEqual(result.tasks[0].tags, ["backend", "security"]);
    });

    it("parses depends_on array", () => {
      const result = parseTickFile(TICK_WITH_TASKS);
      assert.deepEqual(result.tasks[1].depends_on, ["TASK-001"]);
    });

    it("parses description from blockquote", () => {
      const result = parseTickFile(TICK_WITH_TASKS);
      assert.ok(result.tasks[0].description.includes("JWT-based authentication"));
    });

    it("parses history entries", () => {
      const result = parseTickFile(TICK_WITH_TASKS);
      const history = result.tasks[0].history;
      assert.equal(history.length, 2);
      assert.equal(history[0].who, "@alice");
      assert.equal(history[0].action, "created");
      assert.equal(history[1].action, "claimed");
    });

    it("handles null assigned_to and claimed_by", () => {
      const result = parseTickFile(TICK_WITH_TASKS);
      const task = result.tasks[1]; // TASK-002
      assert.equal(task.assigned_to, null);
      assert.equal(task.claimed_by, null);
    });

    it("defaults empty arrays for missing tags/depends_on/blocks", () => {
      const result = parseTickFile(TICK_WITH_TASKS);
      const task = result.tasks[2]; // TASK-003
      assert.ok(Array.isArray(task.tags));
      assert.ok(Array.isArray(task.depends_on));
      assert.ok(Array.isArray(task.blocks));
    });
  });
});

describe("Serializer: serializeTickFile", () => {
  it("generates valid frontmatter", () => {
    const result = parseTickFile(TICK_WITH_TASKS);
    const serialized = serializeTickFile(result);
    assert.ok(serialized.startsWith("---\n"));
    assert.ok(serialized.includes("project: test-project"));
    assert.ok(serialized.includes('schema_version: "1.0"'));
  });

  it("preserves agents table", () => {
    const result = parseTickFile(TICK_WITH_TASKS);
    const serialized = serializeTickFile(result);
    assert.ok(serialized.includes("## Agents"));
    assert.ok(serialized.includes("@alice"));
  });

  it("preserves task blocks", () => {
    const result = parseTickFile(TICK_WITH_TASKS);
    const serialized = serializeTickFile(result);
    assert.ok(serialized.includes("### TASK-001 · Build authentication"));
    assert.ok(serialized.includes("### TASK-002 · Write unit tests"));
    assert.ok(serialized.includes("### TASK-003 · Deploy to staging"));
  });

  it("preserves task YAML metadata", () => {
    const result = parseTickFile(TICK_WITH_TASKS);
    const serialized = serializeTickFile(result);
    assert.ok(serialized.includes("status: in_progress"));
    assert.ok(serialized.includes("priority: high"));
  });

  it("preserves descriptions as blockquotes", () => {
    const result = parseTickFile(TICK_WITH_TASKS);
    const serialized = serializeTickFile(result);
    assert.ok(serialized.includes("> Implement JWT-based authentication"));
  });
});

describe("Serializer: roundtrip", () => {
  it("parse -> serialize -> parse preserves task count", () => {
    const first = parseTickFile(TICK_WITH_TASKS);
    const serialized = serializeTickFile(first);
    const second = parseTickFile(serialized);
    assert.equal(first.tasks.length, second.tasks.length);
  });

  it("parse -> serialize -> parse preserves agent count", () => {
    const first = parseTickFile(TICK_WITH_TASKS);
    const serialized = serializeTickFile(first);
    const second = parseTickFile(serialized);
    assert.equal(first.agents.length, second.agents.length);
  });

  it("parse -> serialize -> parse preserves task IDs", () => {
    const first = parseTickFile(TICK_WITH_TASKS);
    const serialized = serializeTickFile(first);
    const second = parseTickFile(serialized);
    const ids1 = first.tasks.map((t) => t.id).sort();
    const ids2 = second.tasks.map((t) => t.id).sort();
    assert.deepEqual(ids1, ids2);
  });

  it("parse -> serialize -> parse preserves statuses", () => {
    const first = parseTickFile(TICK_WITH_TASKS);
    const serialized = serializeTickFile(first);
    const second = parseTickFile(serialized);
    for (let i = 0; i < first.tasks.length; i++) {
      assert.equal(first.tasks[i].status, second.tasks[i].status);
    }
  });

  it("parse -> serialize -> parse preserves dependencies", () => {
    const first = parseTickFile(TICK_WITH_TASKS);
    const serialized = serializeTickFile(first);
    const second = parseTickFile(serialized);
    for (let i = 0; i < first.tasks.length; i++) {
      assert.deepEqual(first.tasks[i].depends_on, second.tasks[i].depends_on);
    }
  });

  it("parse -> serialize -> parse preserves priorities", () => {
    const first = parseTickFile(TICK_WITH_TASKS);
    const serialized = serializeTickFile(first);
    const second = parseTickFile(serialized);
    for (let i = 0; i < first.tasks.length; i++) {
      assert.equal(first.tasks[i].priority, second.tasks[i].priority);
    }
  });
});

describe("Serializer: generateDefaultTickFile", () => {
  it("generates a valid TICK.md template", () => {
    const content = generateDefaultTickFile("my-project");
    assert.ok(content.includes("project: my-project"));
    assert.ok(content.includes('schema_version: "1.0"'));
    assert.ok(content.includes("next_id: 1"));
  });

  it("generates a parseable file", () => {
    const content = generateDefaultTickFile("my-project");
    const parsed = parseTickFile(content);
    assert.equal(parsed.meta.project, "my-project");
    assert.equal(parsed.tasks.length, 0);
    assert.equal(parsed.agents.length, 0);
  });
});
