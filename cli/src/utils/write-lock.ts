import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Cross-process write lock for TICK.md.
 *
 * Every mutating command does read → modify → write on the whole file.
 * Without a mutex, two agents writing at the same moment silently lose
 * one of the updates (e.g. 12 concurrent `tick add` calls leave 1 task).
 *
 * The lock is a `.tick/write.lock` file created with O_EXCL. It is held for
 * the lifetime of one CLI invocation and released on process exit. Locks
 * left behind by a crashed process are reclaimed when the owning PID is gone
 * (same host) or the lock is older than `staleMs`.
 */

export interface WriteLockOptions {
  /** Max time to wait for the lock before giving up (ms). */
  timeoutMs?: number;
  /** Age after which a lock is considered abandoned (ms). */
  staleMs?: number;
  /** Poll interval while waiting (ms). */
  retryMs?: number;
}

interface LockPayload {
  pid: number;
  host: string;
  acquired_at: string;
  command?: string;
}

const DEFAULTS: Required<WriteLockOptions> = {
  timeoutMs: Number(process.env.TICK_LOCK_TIMEOUT_MS) || 15000,
  staleMs: Number(process.env.TICK_LOCK_STALE_MS) || 60000,
  retryMs: 25,
};

let heldLockPath: string | null = null;
let exitHookInstalled = false;

export function writeLockPath(projectRoot: string = process.cwd()): string {
  return path.join(projectRoot, ".tick", "write.lock");
}

function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error: any) {
    // EPERM means the process exists but belongs to another user.
    return error?.code === "EPERM";
  }
}

function isStale(lockPath: string, staleMs: number): boolean {
  try {
    const stat = fs.statSync(lockPath);
    if (Date.now() - stat.mtimeMs > staleMs) return true;
    const payload = JSON.parse(fs.readFileSync(lockPath, "utf-8")) as LockPayload;
    if (payload.host === os.hostname() && !pidAlive(payload.pid)) return true;
    return false;
  } catch (error: any) {
    // Missing lock: not stale, just gone. Unreadable/half-written: treat as
    // live until it ages out via mtime.
    return false;
  }
}

function installExitHook(): void {
  if (exitHookInstalled) return;
  exitHookInstalled = true;
  process.on("exit", releaseWriteLock);
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
    process.on(signal, () => {
      releaseWriteLock();
      process.exit(128 + (os.constants.signals[signal] ?? 1));
    });
  }
}

/**
 * Acquire the project write lock, blocking until it is free or the timeout
 * elapses. Re-entrant within one process.
 */
export function acquireWriteLock(
  projectRoot: string = process.cwd(),
  options: WriteLockOptions & { command?: string } = {}
): void {
  const { timeoutMs, staleMs, retryMs } = { ...DEFAULTS, ...options };
  const lockPath = writeLockPath(projectRoot);
  if (heldLockPath === lockPath) return;

  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  const payload: LockPayload = {
    pid: process.pid,
    host: os.hostname(),
    acquired_at: new Date().toISOString(),
    command: options.command,
  };

  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const fd = fs.openSync(lockPath, "wx");
      fs.writeSync(fd, JSON.stringify(payload));
      fs.closeSync(fd);
      heldLockPath = lockPath;
      installExitHook();
      return;
    } catch (error: any) {
      if (error?.code !== "EEXIST") throw error;
    }

    if (isStale(lockPath, staleMs)) {
      try {
        fs.unlinkSync(lockPath);
      } catch {
        // Someone else reclaimed it first; loop and race for it.
      }
      continue;
    }

    if (Date.now() >= deadline) {
      let holder = "another process";
      try {
        const p = JSON.parse(fs.readFileSync(lockPath, "utf-8")) as LockPayload;
        holder = `PID ${p.pid}${p.command ? ` (tick ${p.command})` : ""}`;
      } catch {
        // ignore
      }
      throw new Error(
        `Timed out after ${timeoutMs}ms waiting for TICK.md write lock held by ${holder}. ` +
          `If no tick process is running, remove ${lockPath}.`
      );
    }
    sleepSync(retryMs + Math.floor(Math.random() * retryMs));
  }
}

/** Release the lock if this process holds it. Safe to call repeatedly. */
export function releaseWriteLock(): void {
  if (!heldLockPath) return;
  try {
    const payload = JSON.parse(fs.readFileSync(heldLockPath, "utf-8")) as LockPayload;
    if (payload.pid === process.pid && payload.host === os.hostname()) {
      fs.unlinkSync(heldLockPath);
    }
  } catch {
    // Already gone.
  }
  heldLockPath = null;
}

/**
 * Commands that mutate TICK.md (or .tick state) and must hold the write lock.
 * Keys are space-joined command paths, e.g. "agent register".
 */
export const MUTATING_COMMANDS = new Set<string>([
  "add",
  "claim",
  "release",
  "done",
  "reopen",
  "delete",
  "edit",
  "comment",
  "block",
  "unblock",
  "undo",
  "import",
  "batch start",
  "batch commit",
  "batch abort",
  "agent register",
  "broadcast",
  "archive",
  "repair",
  "compact",
  "backup create",
  "backup restore",
  "sync",
]);
