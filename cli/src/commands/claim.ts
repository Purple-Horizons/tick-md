import fs from "fs/promises";
import path from "path";
import { parseTickFile, serializeTickFile } from "../parser/index.js";
import { LockManager } from "../utils/lock.js";
import type { TaskStatus } from "../types.js";
import { autoCommit, shouldAutoCommit } from "../utils/auto-commit.js";
import {
  tickFileNotFoundError,
  taskNotFoundError,
  taskAlreadyClaimedError,
  invalidStatusTransitionError,
} from "../utils/errors.js";

export interface ClaimReleaseOptions {
  commit?: boolean;
  noCommit?: boolean;
}

/**
 * Claim a task for an agent
 */
export async function claimCommand(
  taskId: string,
  agent: string,
  options: ClaimReleaseOptions = {}
): Promise<void> {
  const cwd = process.cwd();
  const tickPath = path.join(cwd, "TICK.md");

  // Check if TICK.md exists
  try {
    await fs.access(tickPath);
  } catch {
    throw tickFileNotFoundError();
  }

  // Read and parse TICK.md
  const content = await fs.readFile(tickPath, "utf-8");
  const tickFile = parseTickFile(content);

  // Find the task
  const task = tickFile.tasks.find((t) => t.id === taskId);
  if (!task) {
    throw taskNotFoundError(taskId, tickFile.tasks);
  }

  // Check if already claimed
  if (task.claimed_by) {
    throw taskAlreadyClaimedError(taskId, task.claimed_by);
  }

  // Check if task is in a claimable state
  if (task.status === "done") {
    throw invalidStatusTransitionError(taskId, task.status, "claim");
  }

  // Acquire lock
  const lockManager = new LockManager(cwd);
  try {
    await lockManager.acquire(taskId, agent);
  } catch (error: any) {
    throw new Error(`Failed to acquire lock: ${error.message}`);
  }

  // Update task
  const now = new Date().toISOString();
  task.claimed_by = agent;
  task.updated_at = now;

  // Transition to in_progress if currently in backlog or todo
  const previousStatus = task.status;
  if (task.status === "backlog" || task.status === "todo") {
    task.status = "in_progress" as TaskStatus;
  }

  // Add history entry
  const historyEntry: any = {
    ts: now,
    who: agent,
    action: "claimed",
  };

  if (previousStatus !== task.status) {
    historyEntry.from = previousStatus;
    historyEntry.to = task.status;
  }

  task.history.push(historyEntry);

  // Update agent status
  const agentRecord = tickFile.agents.find((a) => a.name === agent);
  if (agentRecord) {
    agentRecord.status = "working";
    agentRecord.working_on = taskId;
    agentRecord.last_active = now;
  }

  // Update metadata
  tickFile.meta.updated = now;

  // Serialize and write
  const newContent = serializeTickFile(tickFile);
  await fs.writeFile(tickPath, newContent);

  console.log(`✓ Claimed ${taskId} for ${agent}`);
  if (previousStatus !== task.status) {
    console.log(`  Status: ${previousStatus} → ${task.status}`);
  }

  // Auto-commit if enabled
  if (await shouldAutoCommit(options, cwd)) {
    await autoCommit(`${taskId} claimed by ${agent}`, cwd);
  }

  console.log("");
  console.log("Next steps:");
  console.log(`  Work on the task`);
  console.log(`  Add comment: tick comment ${taskId} ${agent} --note "Progress update"`);
  console.log(`  Complete: tick done ${taskId} ${agent}`);
  console.log(`  Release: tick release ${taskId} ${agent}`);
}

/**
 * Release a claimed task
 */
export async function releaseCommand(
  taskId: string,
  agent: string,
  options: ClaimReleaseOptions = {}
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

  // Check if claimed by this agent
  if (task.claimed_by !== agent) {
    if (!task.claimed_by) {
      throw new Error(`Task ${taskId} is not claimed`);
    }
    throw new Error(
      `Task ${taskId} is claimed by ${task.claimed_by}, not ${agent}`
    );
  }

  // Release lock
  const lockManager = new LockManager(cwd);
  try {
    await lockManager.release(taskId, agent);
  } catch (error: any) {
    console.warn(`Warning: ${error.message}`);
    // Continue anyway - file state is more important
  }

  // Update task
  const now = new Date().toISOString();
  task.claimed_by = null;
  task.updated_at = now;

  // Optionally transition back to todo if in progress
  const previousStatus = task.status;
  if (task.status === "in_progress") {
    task.status = "todo" as TaskStatus;
  }

  // Add history entry
  const historyEntry: any = {
    ts: now,
    who: agent,
    action: "released",
  };

  if (previousStatus !== task.status) {
    historyEntry.from = previousStatus;
    historyEntry.to = task.status;
  }

  task.history.push(historyEntry);

  // Update agent status
  const agentRecord = tickFile.agents.find((a) => a.name === agent);
  if (agentRecord) {
    agentRecord.status = "idle";
    agentRecord.working_on = null;
    agentRecord.last_active = now;
  }

  // Update metadata
  tickFile.meta.updated = now;

  // Serialize and write
  const newContent = serializeTickFile(tickFile);
  await fs.writeFile(tickPath, newContent);

  console.log(`✓ Released ${taskId} from ${agent}`);
  if (previousStatus !== task.status) {
    console.log(`  Status: ${previousStatus} → ${task.status}`);
  }

  // Auto-commit if enabled
  if (await shouldAutoCommit(options, cwd)) {
    await autoCommit(`${taskId} released by ${agent}`, cwd);
  }

  console.log("");
  console.log("Task is now available for other agents to claim.");
}
