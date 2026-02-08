import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateTickFile } from "../dist/utils/validator.js";

// ─── Helpers ─────────────────────────────────────────────────────

function makeTickFile(overrides = {}) {
  return {
    meta: {
      project: "test",
      schema_version: "1.0",
      created: "2026-01-01T00:00:00Z",
      updated: "2026-01-01T00:00:00Z",
      default_workflow: ["backlog", "todo", "in_progress", "review", "done"],
      id_prefix: "TASK",
      next_id: 1,
    },
    agents: [],
    tasks: [],
    ...overrides,
  };
}

function makeTask(overrides = {}) {
  return {
    id: "TASK-001",
    title: "Test task",
    status: "todo",
    priority: "medium",
    assigned_to: null,
    claimed_by: null,
    created_by: "@alice",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    tags: [],
    depends_on: [],
    blocks: [],
    description: "A test task",
    history: [{ ts: "2026-01-01T00:00:00Z", who: "@alice", action: "created" }],
    ...overrides,
  };
}

function makeAgent(overrides = {}) {
  return {
    name: "@alice",
    type: "human",
    roles: ["owner"],
    status: "idle",
    working_on: null,
    last_active: "2026-01-01T00:00:00Z",
    trust_level: "owner",
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────

describe("Validator: valid files", () => {
  it("returns valid for empty tasks/agents", () => {
    const result = validateTickFile(makeTickFile());
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it("returns valid for well-formed file", () => {
    const result = validateTickFile(
      makeTickFile({
        agents: [makeAgent()],
        tasks: [makeTask({ assigned_to: "@alice" })],
      })
    );
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });
});

describe("Validator: project metadata", () => {
  it("flags missing project name", () => {
    const file = makeTickFile();
    file.meta.project = "";
    const result = validateTickFile(file);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.message.includes("Project name")));
  });

  it("warns on missing schema_version", () => {
    const file = makeTickFile();
    file.meta.schema_version = "";
    const result = validateTickFile(file);
    assert.ok(result.warnings.some((w) => w.message.includes("Schema version")));
  });
});

describe("Validator: duplicate IDs", () => {
  it("detects duplicate task IDs", () => {
    const result = validateTickFile(
      makeTickFile({
        tasks: [
          makeTask({ id: "TASK-001" }),
          makeTask({ id: "TASK-001", title: "Duplicate" }),
        ],
      })
    );
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.message.includes("Duplicate task ID")));
  });

  it("allows unique task IDs", () => {
    const result = validateTickFile(
      makeTickFile({
        tasks: [
          makeTask({ id: "TASK-001" }),
          makeTask({ id: "TASK-002", title: "Second" }),
        ],
      })
    );
    const dupErrors = result.errors.filter((e) =>
      e.message.includes("Duplicate task ID")
    );
    assert.equal(dupErrors.length, 0);
  });
});

describe("Validator: dependency references", () => {
  it("flags depends_on referencing non-existent task", () => {
    const result = validateTickFile(
      makeTickFile({
        tasks: [makeTask({ depends_on: ["TASK-999"] })],
      })
    );
    assert.equal(result.valid, false);
    assert.ok(
      result.errors.some((e) => e.message.includes("non-existent task: TASK-999"))
    );
  });

  it("flags blocks referencing non-existent task", () => {
    const result = validateTickFile(
      makeTickFile({
        tasks: [makeTask({ blocks: ["TASK-999"] })],
      })
    );
    assert.equal(result.valid, false);
    assert.ok(
      result.errors.some((e) => e.message.includes("blocks non-existent task"))
    );
  });

  it("passes when depends_on references a valid task", () => {
    const result = validateTickFile(
      makeTickFile({
        tasks: [
          makeTask({ id: "TASK-001" }),
          makeTask({ id: "TASK-002", depends_on: ["TASK-001"] }),
        ],
      })
    );
    const depErrors = result.errors.filter((e) =>
      e.message.includes("non-existent task")
    );
    assert.equal(depErrors.length, 0);
  });
});

describe("Validator: circular dependencies", () => {
  it("detects simple A -> B -> A cycle", () => {
    const result = validateTickFile(
      makeTickFile({
        tasks: [
          makeTask({ id: "TASK-001", depends_on: ["TASK-002"] }),
          makeTask({ id: "TASK-002", depends_on: ["TASK-001"] }),
        ],
      })
    );
    assert.equal(result.valid, false);
    assert.ok(
      result.errors.some((e) => e.message.includes("Circular dependency"))
    );
  });

  it("detects longer A -> B -> C -> A cycle", () => {
    const result = validateTickFile(
      makeTickFile({
        tasks: [
          makeTask({ id: "TASK-001", depends_on: ["TASK-003"] }),
          makeTask({ id: "TASK-002", depends_on: ["TASK-001"] }),
          makeTask({ id: "TASK-003", depends_on: ["TASK-002"] }),
        ],
      })
    );
    assert.equal(result.valid, false);
    assert.ok(
      result.errors.some((e) => e.message.includes("Circular dependency"))
    );
  });

  it("allows linear dependency chains", () => {
    const result = validateTickFile(
      makeTickFile({
        tasks: [
          makeTask({ id: "TASK-001" }),
          makeTask({ id: "TASK-002", depends_on: ["TASK-001"] }),
          makeTask({ id: "TASK-003", depends_on: ["TASK-002"] }),
        ],
      })
    );
    const circularErrors = result.errors.filter((e) =>
      e.message.includes("Circular dependency")
    );
    assert.equal(circularErrors.length, 0);
  });
});

describe("Validator: agent references", () => {
  it("warns when assigned_to references unregistered agent", () => {
    const result = validateTickFile(
      makeTickFile({
        agents: [],
        tasks: [makeTask({ assigned_to: "@ghost" })],
      })
    );
    assert.ok(
      result.warnings.some((w) =>
        w.message.includes("unregistered agent: @ghost")
      )
    );
  });

  it("warns when claimed_by references unregistered agent", () => {
    const result = validateTickFile(
      makeTickFile({
        agents: [],
        tasks: [makeTask({ claimed_by: "@ghost" })],
      })
    );
    assert.ok(
      result.warnings.some((w) =>
        w.message.includes("unregistered agent: @ghost")
      )
    );
  });

  it("no warning when agent is registered", () => {
    const result = validateTickFile(
      makeTickFile({
        agents: [makeAgent({ name: "@alice" })],
        tasks: [makeTask({ assigned_to: "@alice" })],
      })
    );
    const agentWarnings = result.warnings.filter((w) =>
      w.message.includes("unregistered agent")
    );
    assert.equal(agentWarnings.length, 0);
  });
});

describe("Validator: logical checks", () => {
  it("warns when done task is still claimed", () => {
    const result = validateTickFile(
      makeTickFile({
        tasks: [makeTask({ status: "done", claimed_by: "@alice" })],
      })
    );
    assert.ok(
      result.warnings.some((w) =>
        w.message.includes("done but still claimed")
      )
    );
  });

  it("warns on tasks with no history", () => {
    const result = validateTickFile(
      makeTickFile({
        tasks: [makeTask({ history: [] })],
      })
    );
    assert.ok(
      result.warnings.some((w) => w.message.includes("no history entries"))
    );
  });

  it("warns when actual_hours > 2x estimated", () => {
    const result = validateTickFile(
      makeTickFile({
        tasks: [makeTask({ estimated_hours: 2, actual_hours: 10 })],
      })
    );
    assert.ok(
      result.warnings.some((w) => w.message.includes("2x over estimate"))
    );
  });

  it("no warning when actual_hours is within range", () => {
    const result = validateTickFile(
      makeTickFile({
        tasks: [makeTask({ estimated_hours: 5, actual_hours: 8 })],
      })
    );
    const overWarnings = result.warnings.filter((w) =>
      w.message.includes("2x over estimate")
    );
    assert.equal(overWarnings.length, 0);
  });

  it("flags task missing id", () => {
    const result = validateTickFile(
      makeTickFile({
        tasks: [makeTask({ id: "" })],
      })
    );
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.message.includes("missing ID")));
  });

  it("flags task missing title", () => {
    const result = validateTickFile(
      makeTickFile({
        tasks: [makeTask({ title: "" })],
      })
    );
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.message.includes("missing title")));
  });
});
