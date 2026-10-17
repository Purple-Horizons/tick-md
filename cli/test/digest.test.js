import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildDigest, renderDigestMarkdown } from "../dist/commands/digest.js";

const NOW = new Date("2026-10-17T12:00:00Z");
const hoursAgo = (h) => new Date(NOW.getTime() - h * 3600000).toISOString();

function task(id, overrides = {}) {
  return {
    id,
    title: `Task ${id}`,
    status: "todo",
    priority: "medium",
    assigned_to: null,
    claimed_by: null,
    created_by: "@geny",
    created_at: hoursAgo(100),
    updated_at: hoursAgo(1),
    tags: [],
    depends_on: [],
    blocks: [],
    description: "",
    history: [{ ts: hoursAgo(100), who: "@geny", action: "created" }],
    ...overrides,
  };
}

const tickFile = {
  meta: { project: "board", title: "PH Board", schema_version: "1.0", created: "", updated: "", default_workflow: [], id_prefix: "TASK", next_id: 9 },
  agents: [],
  tasks: [
    task("TASK-001", { status: "in_progress", claimed_by: "@devy", priority: "high" }),
    task("TASK-002", { status: "blocked", assigned_to: "@salesy", waiting_on: "Baptist Health", updated_at: hoursAgo(72),
      history: [{ ts: hoursAgo(72), who: "@salesy", action: "blocked", note: "waiting on Baptist Health: confirm" }] }),
    task("TASK-003", { status: "review", assigned_to: "@devy" }),
    task("TASK-004", { status: "done", history: [{ ts: hoursAgo(2), who: "@devy", action: "completed", from: "review", to: "done" }] }),
    task("TASK-005", { status: "done", history: [{ ts: hoursAgo(50), who: "@devy", action: "completed", to: "done" }] }),
    task("TASK-006", { status: "backlog", updated_at: hoursAgo(500) }),
    task("TASK-007", { status: "todo", assigned_to: "@geny" }),
  ],
};

describe("digest", () => {
  it("groups by status with owner and waiting_on", () => {
    const d = buildDigest(tickFile, {}, NOW);
    assert.deepEqual(d.sections.working.map((i) => i.id), ["TASK-001"]);
    assert.deepEqual(d.sections.blocked.map((i) => i.id), ["TASK-002"]);
    assert.equal(d.sections.blocked[0].waiting_on, "Baptist Health");
    assert.equal(d.sections.blocked[0].owner, "@salesy");
    assert.deepEqual(d.sections.review.map((i) => i.id), ["TASK-003"]);
    assert.deepEqual(d.sections.todo.map((i) => i.id), ["TASK-007"]);
    assert.deepEqual(d.sections.done.map((i) => i.id), ["TASK-004"]);
    assert.equal(d.counts.backlog, 1);
  });

  it("flags stale open tasks but not backlog or done", () => {
    const d = buildDigest(tickFile, { staleHours: 48 }, NOW);
    assert.deepEqual(d.stale.map((i) => i.id), ["TASK-002"]);
  });

  it("filters by owner", () => {
    const d = buildDigest(tickFile, { owner: "devy" }, NOW);
    assert.deepEqual(d.sections.working.map((i) => i.id), ["TASK-001"]);
    assert.deepEqual(d.sections.review.map((i) => i.id), ["TASK-003"]);
    assert.equal(d.sections.blocked.length, 0);
  });

  it("renders markdown with waiting-on and stale sections", () => {
    const md = renderDigestMarkdown(buildDigest(tickFile, {}, NOW));
    assert.match(md, /# PH Board — board digest/);
    assert.match(md, /TASK-002\*\* Task TASK-002 — @salesy — waiting on Baptist Health/);
    assert.match(md, /## ⚠️ Stale/);
    assert.match(md, /last: waiting on Baptist Health: confirm/);
  });
});
