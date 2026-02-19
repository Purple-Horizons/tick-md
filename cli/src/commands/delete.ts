import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import { parseTickFile, serializeTickFile } from "../parser/index.js";
import { autoCommit, shouldAutoCommit } from "../utils/auto-commit.js";
import { createBackup, writeFileAtomic } from "../utils/backup.js";

export interface DeleteOptions {
  force?: boolean;
  commit?: boolean;
  noCommit?: boolean;
}

/**
 * Delete a task from TICK.md
 */
export async function deleteCommand(
  taskId: string,
  options: DeleteOptions = {}
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
  const taskIndex = tickFile.tasks.findIndex((t) => t.id === taskId);
  if (taskIndex === -1) {
    throw new Error(`Task ${taskId} not found`);
  }

  const task = tickFile.tasks[taskIndex];

  // Check if task is in progress or claimed (require --force)
  if (!options.force) {
    if (task.status === "in_progress") {
      throw new Error(
        `Task ${taskId} is in progress. Use --force to delete anyway.`
      );
    }

    if (task.claimed_by) {
      throw new Error(
        `Task ${taskId} is claimed by ${task.claimed_by}. Use --force to delete anyway.`
      );
    }
  }

  // Check for tasks that depend on this one
  const dependentTasks = tickFile.tasks.filter((t) =>
    t.depends_on.includes(taskId)
  );

  if (dependentTasks.length > 0 && !options.force) {
    throw new Error(
      `Task ${taskId} is a dependency for: ${dependentTasks.map((t) => t.id).join(", ")}. Use --force to delete anyway.`
    );
  }

  // Remove the task
  tickFile.tasks.splice(taskIndex, 1);

  // Clean up references in other tasks
  const now = new Date().toISOString();
  for (const otherTask of tickFile.tasks) {
    // Remove from depends_on
    const depIndex = otherTask.depends_on.indexOf(taskId);
    if (depIndex !== -1) {
      otherTask.depends_on.splice(depIndex, 1);
      otherTask.updated_at = now;
      otherTask.history.push({
        ts: now,
        who: "system",
        action: "updated",
        note: `Removed deleted dependency: ${taskId}`,
      });

      // If task was blocked only by this task, unblock it
      if (otherTask.status === "blocked" && otherTask.depends_on.length === 0) {
        otherTask.status = "todo";
        otherTask.history.push({
          ts: now,
          who: "system",
          action: "unblocked",
          from: "blocked",
          to: "todo",
          note: `Dependency ${taskId} was deleted`,
        });
      }
    }

    // Remove from blocks
    const blocksIndex = otherTask.blocks.indexOf(taskId);
    if (blocksIndex !== -1) {
      otherTask.blocks.splice(blocksIndex, 1);
      otherTask.updated_at = now;
    }
  }

  // Update metadata
  tickFile.meta.updated = now;

  // Create backup before destructive operation
  const backup = await createBackup(cwd);

  // Serialize and write atomically
  const newContent = serializeTickFile(tickFile);
  await writeFileAtomic(tickPath, newContent);

  console.log(chalk.green(`✓ Deleted ${taskId}`));
  console.log(chalk.gray(`  Backup created: ${backup.filename}`));
  console.log(`  Title: ${task.title}`);
  console.log(`  Status was: ${task.status}`);

  if (dependentTasks.length > 0) {
    console.log(
      chalk.yellow(`  Cleaned up references in: ${dependentTasks.map((t) => t.id).join(", ")}`)
    );
  }

  // Auto-commit if enabled
  if (await shouldAutoCommit(options, cwd)) {
    await autoCommit(`${taskId} deleted`, cwd);
  }

  console.log("");
  console.log(chalk.gray("Task permanently removed from TICK.md"));
}
