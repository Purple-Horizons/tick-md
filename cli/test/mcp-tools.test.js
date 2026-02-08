/**
 * MCP tool logic tests.
 * These test the same operations the MCP server calls (parser + serializer + validator)
 * but without the stdio transport layer, validating the data flow that MCP tools rely on.
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import os from "os";
import { parseTickFile } from "../dist/parser/parse.js";
import { serializeTickFile, generateDefaultTickFile } from "../dist/parser/serialize.js";
import { validateTickFile } from "../dist/utils/validator.js";

let tmpDir;
let tickPath;

// Simulate what the MCP tick_status handler does
function mcp_tick_status(tickFile) {
  const tasksByStatus = tickFile.tasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = [];
    acc[task.status].push(task);
    return acc;
  }, {});
  const done = tickFile.tasks.filter((t) => t.status === "done").length;
  const total = tickFile.tasks.length;
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
  return {
    project: tickFile.meta.project,
    tasks: { total, done, percentage },
    agents: tickFile.agents.map((a) => ({
      name: a.name, type: a.type, status: a.status,
    })),
  };
}

// Simulate tick_add (the same logic the MCP handler delegates to)
function mcp_tick_add(tickFile, title, opts = {}) {
  const taskId = `${tickFile.meta.id_prefix}-${String(tickFile.meta.next_id).padStart(3, "0")}`;
  const now = new Date().toISOString();
  tickFile.tasks.push({
    id: taskId, title,
    status: "backlog",
    priority: opts.priority || "medium",
    assigned_to: opts.assignedTo || null,
    claimed_by: null,
    created_by: "@mcp-agent",
    created_at: now, updated_at: now,
    tags: opts.tags || [],
    depends_on: opts.dependsOn || [],
    blocks: [],
    description: opts.description || "",
    history: [{ ts: now, who: "@mcp-agent", action: "created" }],
  });
  tickFile.meta.next_id++;
  tickFile.meta.updated = now;
  return taskId;
}

// Simulate tick_claim
function mcp_tick_claim(tickFile, taskId, agent) {
  const task = tickFile.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  if (task.claimed_by) throw new Error(`Already claimed by ${task.claimed_by}`);
  const now = new Date().toISOString();
  const prev = task.status;
  task.claimed_by = agent;
  task.updated_at = now;
  if (task.status === "backlog" || task.status === "todo") task.status = "in_progress";
  task.history.push({ ts: now, who: agent, action: "claimed", from: prev, to: task.status });
  tickFile.meta.updated = now;
}

// Simulate tick_done
function mcp_tick_done(tickFile, taskId, agent) {
  const task = tickFile.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  const now = new Date().toISOString();
  const prev = task.status;
  task.status = "done";
  task.claimed_by = null;
  task.updated_at = now;
  task.history.push({ ts: now, who: agent, action: "completed", from: prev, to: "done" });
  for (const other of tickFile.tasks) {
    if (other.depends_on.includes(taskId)) {
      const allDone = other.depends_on.every((dep) =>
        tickFile.tasks.find((t) => t.id === dep)?.status === "done"
      );
      if (allDone && other.status === "blocked") {
        other.status = "todo";
        other.updated_at = now;
      }
    }
  }
  tickFile.meta.updated = now;
}

// Simulate tick_validate
function mcp_tick_validate(tickFile) {
  const result = validateTickFile(tickFile);
  return {
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings,
    summary: {
      tasks_validated: tickFile.tasks.length,
      agents_registered: tickFile.agents.length,
    },
  };
}

// Simulate tick_comment
function mcp_tick_comment(tickFile, taskId, agent, note) {
  const task = tickFile.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  const now = new Date().toISOString();
  task.updated_at = now;
  task.history.push({ ts: now, who: agent, action: "commented", note });
  tickFile.meta.updated = now;
}

// Simulate tick_agent_list
function mcp_tick_agent_list(tickFile, filters = {}) {
  let agents = tickFile.agents;
  if (filters.status) agents = agents.filter((a) => a.status === filters.status);
  if (filters.type) agents = agents.filter((a) => a.type === filters.type);
  return { agents };
}

// ─── Tests ───────────────────────────────────────────────────────

describe("MCP tool: tick_status", () => {
  it("returns correct summary for empty project", () => {
    const tickFile = parseTickFile(generateDefaultTickFile("mcp-test"));
    const result = mcp_tick_status(tickFile);
    assert.equal(result.project, "mcp-test");
    assert.equal(result.tasks.total, 0);
    assert.equal(result.tasks.percentage, 0);
    assert.equal(result.agents.length, 0);
  });

  it("calculates progress correctly", () => {
    const tickFile = parseTickFile(generateDefaultTickFile("mcp-test"));
    mcp_tick_add(tickFile, "Task A");
    mcp_tick_add(tickFile, "Task B");
    mcp_tick_done(tickFile, "TASK-001", "@bot");

    const result = mcp_tick_status(tickFile);
    assert.equal(result.tasks.total, 2);
    assert.equal(result.tasks.done, 1);
    assert.equal(result.tasks.percentage, 50);
  });
});

describe("MCP tool: tick_add", () => {
  it("creates a task and returns ID", () => {
    const tickFile = parseTickFile(generateDefaultTickFile("mcp-test"));
    const id = mcp_tick_add(tickFile, "New task", {
      priority: "high", tags: ["api"], description: "Build the API",
    });
    assert.equal(id, "TASK-001");
    assert.equal(tickFile.tasks.length, 1);
    assert.equal(tickFile.tasks[0].priority, "high");
    assert.deepEqual(tickFile.tasks[0].tags, ["api"]);
  });

  it("increments next_id", () => {
    const tickFile = parseTickFile(generateDefaultTickFile("mcp-test"));
    mcp_tick_add(tickFile, "First");
    mcp_tick_add(tickFile, "Second");
    assert.equal(tickFile.meta.next_id, 3);
    assert.equal(tickFile.tasks[1].id, "TASK-002");
  });
});

describe("MCP tool: tick_claim", () => {
  it("claims task and transitions to in_progress", () => {
    const tickFile = parseTickFile(generateDefaultTickFile("mcp-test"));
    mcp_tick_add(tickFile, "Claimable");
    mcp_tick_claim(tickFile, "TASK-001", "@bot");
    assert.equal(tickFile.tasks[0].claimed_by, "@bot");
    assert.equal(tickFile.tasks[0].status, "in_progress");
  });

  it("rejects double claim", () => {
    const tickFile = parseTickFile(generateDefaultTickFile("mcp-test"));
    mcp_tick_add(tickFile, "Claimable");
    mcp_tick_claim(tickFile, "TASK-001", "@bot");
    assert.throws(() => mcp_tick_claim(tickFile, "TASK-001", "@other"), /Already claimed/);
  });

  it("rejects claim on non-existent task", () => {
    const tickFile = parseTickFile(generateDefaultTickFile("mcp-test"));
    assert.throws(() => mcp_tick_claim(tickFile, "TASK-999", "@bot"), /not found/);
  });
});

describe("MCP tool: tick_done", () => {
  it("marks task done and clears claim", () => {
    const tickFile = parseTickFile(generateDefaultTickFile("mcp-test"));
    mcp_tick_add(tickFile, "Do this");
    mcp_tick_claim(tickFile, "TASK-001", "@bot");
    mcp_tick_done(tickFile, "TASK-001", "@bot");
    assert.equal(tickFile.tasks[0].status, "done");
    assert.equal(tickFile.tasks[0].claimed_by, null);
  });

  it("auto-unblocks dependent tasks", () => {
    const tickFile = parseTickFile(generateDefaultTickFile("mcp-test"));
    mcp_tick_add(tickFile, "Prerequisite");
    mcp_tick_add(tickFile, "Dependent", { dependsOn: ["TASK-001"] });
    tickFile.tasks[1].status = "blocked";
    mcp_tick_done(tickFile, "TASK-001", "@bot");
    assert.equal(tickFile.tasks[1].status, "todo");
  });
});

describe("MCP tool: tick_comment", () => {
  it("adds comment to history", () => {
    const tickFile = parseTickFile(generateDefaultTickFile("mcp-test"));
    mcp_tick_add(tickFile, "Commentable");
    mcp_tick_comment(tickFile, "TASK-001", "@bot", "WIP on auth");
    const h = tickFile.tasks[0].history;
    assert.equal(h.length, 2); // created + commented
    assert.equal(h[1].action, "commented");
    assert.equal(h[1].note, "WIP on auth");
  });

  it("rejects comment on non-existent task", () => {
    const tickFile = parseTickFile(generateDefaultTickFile("mcp-test"));
    assert.throws(() => mcp_tick_comment(tickFile, "TASK-999", "@bot", "nope"), /not found/);
  });
});

describe("MCP tool: tick_validate", () => {
  it("validates a clean file", () => {
    const tickFile = parseTickFile(generateDefaultTickFile("mcp-test"));
    const result = mcp_tick_validate(tickFile);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
  });

  it("detects validation errors", () => {
    const tickFile = parseTickFile(generateDefaultTickFile("mcp-test"));
    mcp_tick_add(tickFile, "Has bad dep", { dependsOn: ["TASK-999"] });
    const result = mcp_tick_validate(tickFile);
    assert.equal(result.valid, false);
    assert.ok(result.errors.some((e) => e.message.includes("non-existent")));
  });
});

describe("MCP tool: tick_agent_list", () => {
  it("returns agents", () => {
    const tickFile = parseTickFile(generateDefaultTickFile("mcp-test"));
    tickFile.agents.push({
      name: "@bot", type: "bot", roles: ["engineer"],
      status: "idle", working_on: null, last_active: new Date().toISOString(),
      trust_level: "trusted",
    });
    const result = mcp_tick_agent_list(tickFile);
    assert.equal(result.agents.length, 1);
    assert.equal(result.agents[0].name, "@bot");
  });

  it("filters by status", () => {
    const tickFile = parseTickFile(generateDefaultTickFile("mcp-test"));
    tickFile.agents.push(
      { name: "@a", type: "human", roles: [], status: "working", working_on: "T-1", last_active: "", trust_level: "owner" },
      { name: "@b", type: "bot", roles: [], status: "idle", working_on: null, last_active: "", trust_level: "trusted" }
    );
    const result = mcp_tick_agent_list(tickFile, { status: "working" });
    assert.equal(result.agents.length, 1);
    assert.equal(result.agents[0].name, "@a");
  });
});

describe("MCP tool: file roundtrip via disk", () => {
  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "tick-mcp-e2e-"));
    tickPath = path.join(tmpDir, "TICK.md");
  });

  after(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("full MCP workflow survives disk roundtrip", async () => {
    // 1. Init
    const content = generateDefaultTickFile("mcp-e2e");
    await fs.writeFile(tickPath, content);

    // 2. Add task (read -> modify -> write)
    let tickFile = parseTickFile(await fs.readFile(tickPath, "utf-8"));
    mcp_tick_add(tickFile, "MCP task", { priority: "urgent" });
    await fs.writeFile(tickPath, serializeTickFile(tickFile));

    // 3. Claim
    tickFile = parseTickFile(await fs.readFile(tickPath, "utf-8"));
    mcp_tick_claim(tickFile, "TASK-001", "@mcp-bot");
    await fs.writeFile(tickPath, serializeTickFile(tickFile));

    // 4. Comment
    tickFile = parseTickFile(await fs.readFile(tickPath, "utf-8"));
    mcp_tick_comment(tickFile, "TASK-001", "@mcp-bot", "Starting work");
    await fs.writeFile(tickPath, serializeTickFile(tickFile));

    // 5. Done
    tickFile = parseTickFile(await fs.readFile(tickPath, "utf-8"));
    mcp_tick_done(tickFile, "TASK-001", "@mcp-bot");
    await fs.writeFile(tickPath, serializeTickFile(tickFile));

    // 6. Validate final state
    tickFile = parseTickFile(await fs.readFile(tickPath, "utf-8"));
    const status = mcp_tick_status(tickFile);
    assert.equal(status.tasks.total, 1);
    assert.equal(status.tasks.done, 1);
    assert.equal(status.tasks.percentage, 100);

    const validation = mcp_tick_validate(tickFile);
    assert.equal(validation.valid, true, `Errors: ${JSON.stringify(validation.errors)}`);

    // 7. Verify history survived all roundtrips
    // created + claimed + commented + completed = 4
    assert.equal(tickFile.tasks[0].history.length, 4);
  });
});
