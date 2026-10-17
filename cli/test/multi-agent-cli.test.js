/**
 * CLI-level tests for multi-agent use: cross-process write lock and TICK_DIR.
 * These spawn the real built CLI (dist/cli.js) as separate processes.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/cli.js");

function tick(args, { cwd, env = {} } = {}) {
  const res = spawnSync(process.execPath, [CLI, ...args], {
    cwd,
    env: { ...process.env, FORCE_COLOR: "0", ...env },
    encoding: "utf-8",
  });
  return res;
}

function tickAsync(args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [CLI, ...args], {
      cwd,
      env: { ...process.env, FORCE_COLOR: "0" },
    });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("close", (code) => resolve({ code, out }));
  });
}

function mkProject(name = "multi") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tick-multi-"));
  const r = tick(["init", "--name", name], { cwd: dir });
  assert.equal(r.status, 0, r.stderr);
  return dir;
}

describe("cross-process write lock", () => {
  it("does not lose tasks when many agents add concurrently", async () => {
    const dir = mkProject();
    const N = 12;
    const results = await Promise.all(
      Array.from({ length: N }, (_, i) => tickAsync(["add", `task ${i}`], dir))
    );
    for (const r of results) assert.equal(r.code, 0, r.out);
    const content = fs.readFileSync(path.join(dir, "TICK.md"), "utf-8");
    const count = (content.match(/^### TASK-\d+ · /gm) || []).length;
    assert.equal(count, N);
    assert.match(content, new RegExp(`next_id: ${N + 1}`));
    assert.equal(fs.existsSync(path.join(dir, ".tick", "write.lock")), false);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("reclaims a lock left by a dead process", () => {
    const dir = mkProject();
    fs.writeFileSync(
      path.join(dir, ".tick", "write.lock"),
      JSON.stringify({ pid: 2147483646, host: os.hostname(), acquired_at: new Date().toISOString() })
    );
    const r = tick(["add", "after crash"], { cwd: dir });
    assert.equal(r.status, 0, r.stderr);
    assert.match(fs.readFileSync(path.join(dir, "TICK.md"), "utf-8"), /after crash/);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("times out instead of clobbering when a live process holds the lock", () => {
    const dir = mkProject();
    fs.writeFileSync(
      path.join(dir, ".tick", "write.lock"),
      JSON.stringify({ pid: process.pid, host: os.hostname(), acquired_at: new Date().toISOString() })
    );
    const r = tick(["add", "should wait"], { cwd: dir, env: { TICK_LOCK_TIMEOUT_MS: "300" } });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /write lock/);
    assert.doesNotMatch(fs.readFileSync(path.join(dir, "TICK.md"), "utf-8"), /should wait/);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe("TICK_DIR", () => {
  it("runs against the board in TICK_DIR from any working directory", () => {
    const dir = mkProject();
    const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), "tick-elsewhere-"));
    const r = tick(["add", "from elsewhere"], { cwd: elsewhere, env: { TICK_DIR: dir } });
    assert.equal(r.status, 0, r.stderr);
    assert.match(fs.readFileSync(path.join(dir, "TICK.md"), "utf-8"), /from elsewhere/);
    assert.equal(fs.existsSync(path.join(elsewhere, "TICK.md")), false);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(elsewhere, { recursive: true, force: true });
  });
});

describe("TICK_AGENT precedence", () => {
  it("uses TICK_AGENT over the shared session's last agent", () => {
    const dir = mkProject();
    tick(["add", "one"], { cwd: dir });
    tick(["add", "two"], { cwd: dir });
    // @alpha becomes the shared session's last agent
    assert.equal(tick(["claim", "TASK-001", "@alpha"], { cwd: dir }).status, 0);
    // @beta omits the agent arg but has TICK_AGENT set
    const r = tick(["claim", "TASK-002"], { cwd: dir, env: { TICK_AGENT: "beta" } });
    assert.equal(r.status, 0, r.stderr);
    const content = fs.readFileSync(path.join(dir, "TICK.md"), "utf-8");
    const block = content.split("### TASK-002")[1];
    assert.match(block, /claimed_by: "?@beta"?/);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe("block / unblock with waiting_on", () => {
  it("records waiting_on, survives round-trip, and clears on unblock", () => {
    const dir = mkProject();
    tick(["add", "Call Baptist"], { cwd: dir });
    assert.equal(tick(["claim", "TASK-001", "@salesy"], { cwd: dir }).status, 0);

    let r = tick(["block", "TASK-001", "@salesy", "--on", "Baptist Health", "-n", "awaiting confirmation"], { cwd: dir });
    assert.equal(r.status, 0, r.stderr);
    let content = fs.readFileSync(path.join(dir, "TICK.md"), "utf-8");
    assert.match(content, /status: blocked/);
    assert.match(content, /waiting_on: Baptist Health/);
    assert.match(content, /claimed_by: "?@salesy"?/);
    assert.match(content, /note: "?waiting on Baptist Health: awaiting confirmation"?/);

    // round-trip through another mutating command keeps waiting_on
    tick(["comment", "TASK-001", "@salesy", "-n", "pinged again"], { cwd: dir });
    content = fs.readFileSync(path.join(dir, "TICK.md"), "utf-8");
    assert.match(content, /waiting_on: Baptist Health/);

    r = tick(["unblock", "TASK-001", "@salesy", "-n", "confirmed"], { cwd: dir });
    assert.equal(r.status, 0, r.stderr);
    content = fs.readFileSync(path.join(dir, "TICK.md"), "utf-8");
    assert.match(content, /status: in_progress/);
    assert.doesNotMatch(content, /waiting_on:/);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("requires --on", () => {
    const dir = mkProject();
    tick(["add", "x"], { cwd: dir });
    const r = tick(["block", "TASK-001", "@geny"], { cwd: dir });
    assert.notEqual(r.status, 0);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("done clears waiting_on", () => {
    const dir = mkProject();
    tick(["add", "x"], { cwd: dir });
    tick(["block", "TASK-001", "@geny", "--on", "@gianni"], { cwd: dir });
    assert.equal(tick(["done", "TASK-001", "@geny", "--skip-workflow"], { cwd: dir }).status, 0);
    const content = fs.readFileSync(path.join(dir, "TICK.md"), "utf-8");
    assert.match(content, /status: done/);
    assert.doesNotMatch(content, /waiting_on:/);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe("--no-commit", () => {
  it("skips auto-commit even when config enables it", () => {
    const dir = mkProject();
    spawnSync("git", ["init", "-q"], { cwd: dir });
    spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "--allow-empty", "-m", "base"], { cwd: dir });
    const before = spawnSync("git", ["rev-list", "--count", "HEAD"], { cwd: dir, encoding: "utf-8" }).stdout.trim();
    const r = tick(["add", "no commit please", "--no-commit"], {
      cwd: dir,
      env: { GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" },
    });
    assert.equal(r.status, 0, r.stderr);
    const after = spawnSync("git", ["rev-list", "--count", "HEAD"], { cwd: dir, encoding: "utf-8" }).stdout.trim();
    assert.equal(after, before);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});
