import fs from "fs/promises";
import path from "path";

export interface LockInfo {
  taskId: string;
  agent: string;
  pid: number;
  timestamp: string;
}

/**
 * Lock manager for coordination between agents
 */
export class LockManager {
  private lockPath: string;
  private locks: Map<string, LockInfo> = new Map();

  constructor(projectRoot: string = process.cwd()) {
    this.lockPath = path.join(projectRoot, ".tick", "lock");
  }

  /**
   * Load locks from file
   */
  async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.lockPath, "utf-8");
      if (!content.trim()) {
        this.locks.clear();
        return;
      }

      const lines = content.split("\n").filter((l) => l.trim());
      for (const line of lines) {
        const parts = line.split("\t");
        if (parts.length >= 4) {
          const [taskId, agent, pid, timestamp] = parts;
          this.locks.set(taskId, {
            taskId,
            agent,
            pid: parseInt(pid, 10),
            timestamp,
          });
        }
      }
    } catch (error: any) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      // File doesn't exist yet, that's ok
      this.locks.clear();
    }
  }

  /**
   * Save locks to file
   */
  async save(): Promise<void> {
    const lines = Array.from(this.locks.values()).map(
      (lock) => `${lock.taskId}\t${lock.agent}\t${lock.pid}\t${lock.timestamp}`
    );
    await fs.writeFile(this.lockPath, lines.join("\n") + "\n");
  }

  /**
   * Check if a task is locked
   */
  isLocked(taskId: string): boolean {
    return this.locks.has(taskId);
  }

  /**
   * Get lock info for a task
   */
  getLock(taskId: string): LockInfo | null {
    return this.locks.get(taskId) || null;
  }

  /**
   * Acquire a lock for a task
   */
  async acquire(taskId: string, agent: string): Promise<void> {
    await this.load();

    if (this.isLocked(taskId)) {
      const existing = this.getLock(taskId)!;
      throw new Error(
        `Task ${taskId} is already locked by ${existing.agent} (PID ${existing.pid})`
      );
    }

    this.locks.set(taskId, {
      taskId,
      agent,
      pid: process.pid,
      timestamp: new Date().toISOString(),
    });

    await this.save();
  }

  /**
   * Release a lock for a task
   */
  async release(taskId: string, agent: string): Promise<void> {
    await this.load();

    const existing = this.getLock(taskId);
    if (!existing) {
      throw new Error(`Task ${taskId} is not locked`);
    }

    if (existing.agent !== agent) {
      throw new Error(
        `Task ${taskId} is locked by ${existing.agent}, not ${agent}`
      );
    }

    this.locks.delete(taskId);
    await this.save();
  }

  /**
   * Get all locks
   */
  getAllLocks(): LockInfo[] {
    return Array.from(this.locks.values());
  }

  /**
   * Clean up stale locks (optional, for maintenance)
   */
  async cleanup(maxAgeMs: number = 300000): Promise<number> {
    await this.load();

    const now = Date.now();
    let cleaned = 0;

    for (const [taskId, lock] of this.locks.entries()) {
      const lockAge = now - new Date(lock.timestamp).getTime();
      if (lockAge > maxAgeMs) {
        // Check if process still exists (advisory check)
        try {
          process.kill(lock.pid, 0); // Signal 0 checks if process exists
        } catch {
          // Process doesn't exist, safe to clean up
          this.locks.delete(taskId);
          cleaned++;
        }
      }
    }

    if (cleaned > 0) {
      await this.save();
    }

    return cleaned;
  }
}
