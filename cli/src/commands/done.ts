import fs from "fs/promises";
import path from "path";
import { parseTickFile, serializeTickFile } from "../parser/index.js";
import { LockManager } from "../utils/lock.js";
import type { TaskStatus } from "../types.js";
import { autoCommit, shouldAutoCommit } from "../utils/auto-commit.js";

export interface DoneCommentOptions {
  commit?: boolean;
  noCommit?: boolean;
}

/**
 * Mark a task as done
 */
export async function doneCommand(
  taskId: string,
  agent: string,
  options: DoneCommentOptions = {}
): Promise<void> {
  const cwd = process.cwd();
  const tickPath = path.join(cwd, "TICK.md");

  // Check if TICK.md exists
  try {
    await fs.access(tickPath);
  } catch {
    throw new Error(
      "TICK.md not found. Run 'tick init' first to create a project."
    );
  }

  // Read and parse TICK.md
  const content = await fs.readFile(tickPath, "utf-8");
  const tickFile = parseTickFile(content);

  // Find the task
  const task = tickFile.tasks.find((t) => t.id === taskId);
  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }

  // Check if already done
  if (task.status === "done") {
    console.log(`Task ${taskId} is already done.`);
    return;
  }

  // Check if claimed by this agent (optional - can be done by anyone)
  if (task.claimed_by && task.claimed_by !== agent) {
    console.warn(
      `Warning: Task ${taskId} is claimed by ${task.claimed_by}, not ${agent}`
    );
    console.warn("Proceeding anyway...");
  }

  // Release lock if exists
  const lockManager = new LockManager(cwd);
  if (task.claimed_by) {
    try {
      await lockManager.release(taskId, task.claimed_by);
    } catch (error: any) {
      console.warn(`Warning: Could not release lock: ${error.message}`);
      // Continue anyway
    }
  }

  // Update task
  const now = new Date().toISOString();
  const previousStatus = task.status;
  task.status = "done" as TaskStatus;
  task.claimed_by = null; // Clear claim when done
  task.updated_at = now;

  // Add history entry
  task.history.push({
    ts: now,
    who: agent,
    action: "completed",
    from: previousStatus,
    to: "done",
  });

  // Update agent status
  const agentRecord = tickFile.agents.find((a) => a.name === agent);
  if (agentRecord) {
    agentRecord.status = "idle";
    agentRecord.working_on = null;
    agentRecord.last_active = now;
  }

  // Check for blocked tasks that can now be unblocked
  const unblockedTasks: string[] = [];
  for (const otherTask of tickFile.tasks) {
    if (otherTask.depends_on.includes(taskId)) {
      // Check if all dependencies are done
      const allDone = otherTask.depends_on.every(
        (depId) =>
          tickFile.tasks.find((t) => t.id === depId)?.status === "done"
      );
      if (allDone && otherTask.status === "blocked") {
        otherTask.status = "todo" as TaskStatus;
        otherTask.updated_at = now;
        otherTask.history.push({
          ts: now,
          who: agent,
          action: "unblocked",
          from: "blocked",
          to: "todo",
          note: `Dependencies completed: ${taskId}`,
        });
        unblockedTasks.push(otherTask.id);
      }
    }
  }

  // Update metadata
  tickFile.meta.updated = now;

  // Serialize and write
  const newContent = serializeTickFile(tickFile);
  await fs.writeFile(tickPath, newContent);

  console.log(`✓ Completed ${taskId}`);
  console.log(`  Status: ${previousStatus} → done`);
  console.log(`  Completed by: ${agent}`);

  if (task.blocks.length > 0) {
    console.log(`  Unblocked tasks: ${task.blocks.join(", ")}`);
  }

  if (unblockedTasks.length > 0) {
    console.log(`  Auto-unblocked: ${unblockedTasks.join(", ")}`);
  }

  // Auto-commit if enabled
  if (await shouldAutoCommit(options, cwd)) {
    await autoCommit(`${taskId} completed by ${agent}`, cwd);
  }

  console.log("");
  console.log("🎉 Task complete!");
}

/**
 * Add a comment to a task
 */
export async function commentCommand(
  taskId: string,
  agent: string,
  note: string,
  options: DoneCommentOptions = {}
): Promise<void> {
  const cwd = process.cwd();
  const tickPath = path.join(cwd, "TICK.md");

  // Check if TICK.md exists
  try {
    await fs.access(tickPath);
  } catch {
    throw new Error(
      "TICK.md not found. Run 'tick init' first to create a project."
    );
  }

  // Read and parse TICK.md
  const content = await fs.readFile(tickPath, "utf-8");
  const tickFile = parseTickFile(content);

  // Find the task
  const task = tickFile.tasks.find((t) => t.id === taskId);
  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }

  // Update task
  const now = new Date().toISOString();
  task.updated_at = now;

  // Add history entry
  task.history.push({
    ts: now,
    who: agent,
    action: "commented",
    note,
  });

  // Update agent last_active
  const agentRecord = tickFile.agents.find((a) => a.name === agent);
  if (agentRecord) {
    agentRecord.last_active = now;
  }

  // Update metadata
  tickFile.meta.updated = now;

  // Serialize and write
  const newContent = serializeTickFile(tickFile);
  await fs.writeFile(tickPath, newContent);

  console.log(`✓ Added comment to ${taskId}`);
  console.log(`  ${agent}: "${note}"`);

  // Auto-commit if enabled
  if (await shouldAutoCommit(options, cwd)) {
    await autoCommit(`${taskId}: comment`, cwd);
  }

  console.log("");
  console.log(`Total history entries: ${task.history.length}`);
}
