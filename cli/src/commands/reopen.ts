import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import { parseTickFile, serializeTickFile } from "../parser/index.js";
import type { TaskStatus } from "../types.js";
import { autoCommit, shouldAutoCommit } from "../utils/auto-commit.js";

export interface ReopenOptions {
  note?: string;
  status?: TaskStatus;
  commit?: boolean;
  noCommit?: boolean;
}

/**
 * Reopen a completed task
 */
export async function reopenCommand(
  taskId: string,
  agent: string,
  options: ReopenOptions = {}
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

  // Check if task is done
  if (task.status !== "done") {
    throw new Error(
      `Task ${taskId} is not done (status: ${task.status}). Only completed tasks can be reopened.`
    );
  }

  // Determine target status
  const targetStatus = options.status || "reopened";
  const validStatuses: TaskStatus[] = ["backlog", "todo", "in_progress", "reopened"];
  if (!validStatuses.includes(targetStatus)) {
    throw new Error(
      `Invalid target status: ${targetStatus}. Must be one of: ${validStatuses.join(", ")}`
    );
  }

  // Update task
  const now = new Date().toISOString();
  const previousStatus = task.status;
  task.status = targetStatus;
  task.updated_at = now;

  // Add history entry
  task.history.push({
    ts: now,
    who: agent,
    action: "reopened",
    from: previousStatus,
    to: targetStatus,
    note: options.note,
  });

  // Update agent last_active
  const agentRecord = tickFile.agents.find((a) => a.name === agent);
  if (agentRecord) {
    agentRecord.last_active = now;
  }

  // Check if this task blocks others - they may need to be re-blocked
  const reBlockedTasks: string[] = [];
  for (const otherTask of tickFile.tasks) {
    if (
      otherTask.depends_on.includes(taskId) &&
      otherTask.status !== "done" &&
      otherTask.status !== "blocked"
    ) {
      // Task depends on this one and isn't done - should be blocked
      const oldStatus = otherTask.status;
      otherTask.status = "blocked" as TaskStatus;
      otherTask.updated_at = now;
      otherTask.history.push({
        ts: now,
        who: agent,
        action: "blocked",
        from: oldStatus,
        to: "blocked",
        note: `Dependency ${taskId} was reopened`,
      });
      reBlockedTasks.push(otherTask.id);
    }
  }

  // Update metadata
  tickFile.meta.updated = now;

  // Serialize and write
  const newContent = serializeTickFile(tickFile);
  await fs.writeFile(tickPath, newContent);

  console.log(chalk.green(`✓ Reopened ${taskId}`));
  console.log(`  Status: ${previousStatus} → ${targetStatus}`);
  console.log(`  Reopened by: ${agent}`);

  if (options.note) {
    console.log(`  Note: ${options.note}`);
  }

  if (reBlockedTasks.length > 0) {
    console.log(chalk.yellow(`  Re-blocked dependent tasks: ${reBlockedTasks.join(", ")}`));
  }

  // Auto-commit if enabled
  if (await shouldAutoCommit(options, cwd)) {
    await autoCommit(`${taskId} reopened by ${agent}`, cwd);
  }

  console.log("");
  console.log(chalk.cyan("Task reopened. Use 'tick claim' to start working on it."));
}
