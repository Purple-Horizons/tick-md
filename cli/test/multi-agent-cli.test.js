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
