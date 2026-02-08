/**
 * E2E workflow test: init -> add -> claim -> comment -> done -> validate
 * Exercises the actual file system through the parser/serializer.
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { parseTickFile } from "../dist/parser/parse.js";
import { serializeTickFile, generateDefaultTickFile } from "../dist/parser/serialize.js";
import { validateTickFile } from "../dist/utils/validator.js";

let tmpDir;

// Helpers that simulate what the CLI commands do
// (without console.log and process.cwd coupling)

function addTask(tickFile, title, options = {}) {
  const taskId = `${tickFile.meta.id_prefix}-${String(tickFile.meta.next_id).padStart(3, "0")}`;
  const now = new Date().toISOString();
  const task = {
    id: taskId,
    title,
    status: "backlog",
    priority: options.priority || "medium",
    assigned_to: options.assignedTo || null,
    claimed_by: null,
    created_by: options.creator || "@test-agent",
    created_at: now,
    updated_at: now,
    tags: options.tags || [],
    depends_on: options.dependsOn || [],
    blocks: options.blocks || [],
    estimated_hours: options.estimatedHours,
    description: options.description || "",
    history: [{ ts: now, who: options.creator || "@test-agent", action: "created" }],
  };
  tickFile.tasks.push(task);
  tickFile.meta.next_id++;
  tickFile.meta.updated = now;
  return taskId;
}

function claimTask(tickFile, taskId, agent) {
  const task = tickFile.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  if (task.claimed_by) throw new Error(`Already claimed by ${task.claimed_by}`);
  if (task.status === "done") throw new Error("Task already done");

  const now = new Date().toISOString();
  const prev = task.status;
  task.claimed_by = agent;
  task.updated_at = now;
  if (task.status === "backlog" || task.status === "todo") {
    task.status = "in_progress";
  }
  task.history.push({ ts: now, who: agent, action: "claimed", from: prev, to: task.status });
  tickFile.meta.updated = now;
}

function completeTask(tickFile, taskId, agent) {
  const task = tickFile.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  if (task.status === "done") return;

  const now = new Date().toISOString();
  const prev = task.status;
  task.status = "done";
  task.claimed_by = null;
  task.updated_at = now;
  task.history.push({ ts: now, who: agent, action: "completed", from: prev, to: "done" });

  // Auto-unblock dependents
  for (const other of tickFile.tasks) {
    if (other.depends_on.includes(taskId)) {
      const allDone = other.depends_on.every(
        (dep) => tickFile.tasks.find((t) => t.id === dep)?.status === "done"
      );
      if (allDone && other.status === "blocked") {
        other.status = "todo";
        other.updated_at = now;
        other.history.push({
          ts: now, who: agent, action: "unblocked", from: "blocked", to: "todo",
          note: `Dependencies completed: ${taskId}`,
        });
      }
    }
  }
  tickFile.meta.updated = now;
}

function commentTask(tickFile, taskId, agent, note) {
  const task = tickFile.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  const now = new Date().toISOString();
  task.updated_at = now;
  task.history.push({ ts: now, who: agent, action: "commented", note });
  tickFile.meta.updated = now;
}

function addAgent(tickFile, agent) {
  tickFile.agents.push({
    name: agent.name,
    type: agent.type || "human",
    roles: agent.roles || ["developer"],
    status: agent.status || "idle",
    working_on: agent.working_on || null,
    last_active: new Date().toISOString(),
    trust_level: agent.trust_level || "trusted",
  });
}

// ─── Tests ───────────────────────────────────────────────────────

describe("E2E: Full workflow via file system", () => {
  before(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "tick-e2e-"));
  });

  after(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("Step 1: init creates valid TICK.md", async () => {
    const content = generateDefaultTickFile("e2e-test");
    const tickPath = path.join(tmpDir, "TICK.md");
    await fs.writeFile(tickPath, content);

    const raw = await fs.readFile(tickPath, "utf-8");
    const parsed = parseTickFile(raw);

    assert.equal(parsed.meta.project, "e2e-test");
    assert.equal(parsed.meta.next_id, 1);
    assert.equal(parsed.tasks.length, 0);
    assert.equal(parsed.agents.length, 0);

    const validation = validateTickFile(parsed);
    assert.equal(validation.valid, true, `Init file invalid: ${JSON.stringify(validation.errors)}`);
  });

  it("Step 2: add tasks", async () => {
    const tickPath = path.join(tmpDir, "TICK.md");
    const raw = await fs.readFile(tickPath, "utf-8");
    const tickFile = parseTickFile(raw);

    const id1 = addTask(tickFile, "Build authentication", {
      priority: "high",
      tags: ["backend", "security"],
      description: "Implement JWT auth",
    });
    const id2 = addTask(tickFile, "Write tests", {
      dependsOn: [id1],
      tags: ["testing"],
    });
    const id3 = addTask(tickFile, "Deploy to staging", {
      dependsOn: [id2],
      tags: ["devops"],
    });

    assert.equal(id1, "TASK-001");
    assert.equal(id2, "TASK-002");
    assert.equal(id3, "TASK-003");
    assert.equal(tickFile.tasks.length, 3);
    assert.equal(tickFile.meta.next_id, 4);

    // Write back
    await fs.writeFile(tickPath, serializeTickFile(tickFile));

    // Verify roundtrip
    const re = parseTickFile(await fs.readFile(tickPath, "utf-8"));
    assert.equal(re.tasks.length, 3);
    assert.equal(re.tasks[0].title, "Build authentication");
    assert.deepEqual(re.tasks[1].depends_on, ["TASK-001"]);
  });

  it("Step 3: register agents", async () => {
    const tickPath = path.join(tmpDir, "TICK.md");
    const tickFile = parseTickFile(await fs.readFile(tickPath, "utf-8"));

    addAgent(tickFile, { name: "@alice", type: "human", roles: ["owner", "developer"], trust_level: "owner" });
    addAgent(tickFile, { name: "@claude", type: "bot", roles: ["engineer"], trust_level: "trusted" });

    assert.equal(tickFile.agents.length, 2);

    await fs.writeFile(tickPath, serializeTickFile(tickFile));

    const re = parseTickFile(await fs.readFile(tickPath, "utf-8"));
    assert.equal(re.agents.length, 2);
    assert.equal(re.agents[0].name, "@alice");
    assert.equal(re.agents[1].type, "bot");
  });

  it("Step 4: claim task", async () => {
    const tickPath = path.join(tmpDir, "TICK.md");
    const tickFile = parseTickFile(await fs.readFile(tickPath, "utf-8"));

    claimTask(tickFile, "TASK-001", "@alice");

    assert.equal(tickFile.tasks[0].claimed_by, "@alice");
    assert.equal(tickFile.tasks[0].status, "in_progress");

    await fs.writeFile(tickPath, serializeTickFile(tickFile));

    const re = parseTickFile(await fs.readFile(tickPath, "utf-8"));
    assert.equal(re.tasks[0].status, "in_progress");
    assert.equal(re.tasks[0].claimed_by, "@alice");
  });

  it("Step 4b: cannot double-claim", async () => {
    const tickPath = path.join(tmpDir, "TICK.md");
    const tickFile = parseTickFile(await fs.readFile(tickPath, "utf-8"));

    assert.throws(
      () => claimTask(tickFile, "TASK-001", "@claude"),
      /Already claimed/
    );
  });

  it("Step 5: add comment", async () => {
    const tickPath = path.join(tmpDir, "TICK.md");
    const tickFile = parseTickFile(await fs.readFile(tickPath, "utf-8"));

    commentTask(tickFile, "TASK-001", "@alice", "Auth module 80% complete");

    const task = tickFile.tasks[0];
    assert.equal(task.history.length, 3); // created + claimed + commented
    assert.equal(task.history[2].action, "commented");
    assert.equal(task.history[2].note, "Auth module 80% complete");

    await fs.writeFile(tickPath, serializeTickFile(tickFile));

    const re = parseTickFile(await fs.readFile(tickPath, "utf-8"));
    assert.equal(re.tasks[0].history.length, 3);
  });

  it("Step 6: complete task and auto-unblock", async () => {
    const tickPath = path.join(tmpDir, "TICK.md");
    const tickFile = parseTickFile(await fs.readFile(tickPath, "utf-8"));

    // Set TASK-002 to blocked so auto-unblock works
    tickFile.tasks[1].status = "blocked";

    completeTask(tickFile, "TASK-001", "@alice");

    assert.equal(tickFile.tasks[0].status, "done");
    assert.equal(tickFile.tasks[0].claimed_by, null);
    // TASK-002 should be auto-unblocked since its only dependency (TASK-001) is done
    assert.equal(tickFile.tasks[1].status, "todo");

    await fs.writeFile(tickPath, serializeTickFile(tickFile));

    const re = parseTickFile(await fs.readFile(tickPath, "utf-8"));
    assert.equal(re.tasks[0].status, "done");
    assert.equal(re.tasks[1].status, "todo");
  });

  it("Step 7: full file validates", async () => {
    const tickPath = path.join(tmpDir, "TICK.md");
    const tickFile = parseTickFile(await fs.readFile(tickPath, "utf-8"));

    const result = validateTickFile(tickFile);
    assert.equal(result.valid, true, `Validation errors: ${JSON.stringify(result.errors)}`);
  });

  it("Step 8: full roundtrip preserves all data", async () => {
    const tickPath = path.join(tmpDir, "TICK.md");
    const original = parseTickFile(await fs.readFile(tickPath, "utf-8"));

    // Double roundtrip
    const ser1 = serializeTickFile(original);
    const parsed1 = parseTickFile(ser1);
    const ser2 = serializeTickFile(parsed1);
    const parsed2 = parseTickFile(ser2);

    assert.equal(parsed2.meta.project, original.meta.project);
    assert.equal(parsed2.tasks.length, original.tasks.length);
    assert.equal(parsed2.agents.length, original.agents.length);

    for (let i = 0; i < original.tasks.length; i++) {
      assert.equal(parsed2.tasks[i].id, original.tasks[i].id);
      assert.equal(parsed2.tasks[i].status, original.tasks[i].status);
      assert.equal(parsed2.tasks[i].priority, original.tasks[i].priority);
      assert.deepEqual(parsed2.tasks[i].depends_on, original.tasks[i].depends_on);
      assert.deepEqual(parsed2.tasks[i].tags, original.tasks[i].tags);
    }
  });
});

describe("E2E: Edge cases", () => {
  it("handles empty description", async () => {
    const content = generateDefaultTickFile("edge-test");
    const tickFile = parseTickFile(content);
    addTask(tickFile, "No description task");

    const ser = serializeTickFile(tickFile);
    const re = parseTickFile(ser);
    assert.equal(re.tasks[0].description, "");
  });

  it("handles special characters in title", async () => {
    const content = generateDefaultTickFile("edge-test");
    const tickFile = parseTickFile(content);
    addTask(tickFile, 'Fix "quotes" & <angles>');

    const ser = serializeTickFile(tickFile);
    const re = parseTickFile(ser);
    assert.ok(re.tasks[0].title.includes('"quotes"'));
    assert.ok(re.tasks[0].title.includes("<angles>"));
  });

  it("handles many tasks without corruption", async () => {
    const content = generateDefaultTickFile("scale-test");
    const tickFile = parseTickFile(content);

    for (let i = 0; i < 50; i++) {
      addTask(tickFile, `Task number ${i + 1}`, {
        tags: [`batch-${Math.floor(i / 10)}`],
      });
    }

    assert.equal(tickFile.tasks.length, 50);
    assert.equal(tickFile.meta.next_id, 51);

    const ser = serializeTickFile(tickFile);
    const re = parseTickFile(ser);
    assert.equal(re.tasks.length, 50);
    assert.equal(re.tasks[49].title, "Task number 50");
  });

  it("preserves multi-line descriptions across roundtrip", async () => {
    const content = generateDefaultTickFile("ml-test");
    const tickFile = parseTickFile(content);
    addTask(tickFile, "Multi-line task", {
      description: "Line one\nLine two\nLine three",
    });

    const ser = serializeTickFile(tickFile);
    const re = parseTickFile(ser);
    assert.ok(re.tasks[0].description.includes("Line one"));
    assert.ok(re.tasks[0].description.includes("Line two"));
    assert.ok(re.tasks[0].description.includes("Line three"));
  });
});
