import * as fs from "node:fs";
import chalk from "chalk";
import { parseTickFile } from "../parser/parse.js";
import type { Task, TaskStatus } from "../types.js";

export interface WatchOptions {
  interval?: number; // seconds
  filter?: TaskStatus;
}

/**
 * Watch TICK.md for changes and display updates in real-time
 */
export async function watchCommand(options: WatchOptions = {}): Promise<void> {
  const tickPath = "TICK.md";

  if (!fs.existsSync(tickPath)) {
    console.error(chalk.red("✗ TICK.md not found"));
    console.log(chalk.gray("Run 'tick init' to initialize a project"));
    process.exit(1);
  }

  const interval = (options.interval || 5) * 1000; // Convert to ms
  let lastContent = "";
  let lastTasks: Task[] = [];

  console.log(chalk.cyan.bold("👀 Watching TICK.md for changes..."));
  console.log(chalk.gray(`Polling every ${options.interval || 5}s · Press Ctrl+C to stop`));
  console.log();

  // Initial load
  try {
    lastContent = fs.readFileSync(tickPath, "utf-8");
    const tickFile = parseTickFile(lastContent);
    lastTasks = tickFile.tasks;

    displaySummary(lastTasks, options.filter);
  } catch (error) {
    console.error(chalk.red("✗ Failed to parse TICK.md"));
    console.error(chalk.gray((error as Error).message));
    process.exit(1);
  }

  // Watch for changes
  const watchInterval = setInterval(() => {
    try {
      const currentContent = fs.readFileSync(tickPath, "utf-8");

      // Check if content changed
      if (currentContent === lastContent) {
        return;
      }

      lastContent = currentContent;
      const tickFile = parseTickFile(currentContent);
      const currentTasks = tickFile.tasks;

      // Detect changes
      const changes = detectChanges(lastTasks, currentTasks);

      if (changes.length > 0) {
        console.log(chalk.gray(`[${new Date().toLocaleTimeString()}]`));
        
        for (const change of changes) {
          switch (change.type) {
            case "added":
              console.log(chalk.green(`  ✓ Added: ${change.task.id} - ${change.task.title}`));
              break;
            case "removed":
              console.log(chalk.red(`  ✗ Removed: ${change.task.id}`));
              break;
            case "status":
              console.log(
                chalk.blue(
                  `  ⟳ ${change.task.id}: ${change.oldValue} → ${change.task.status}`
                )
              );
              break;
            case "claimed":
              console.log(
                chalk.yellow(
                  `  🔒 ${change.task.id} claimed by ${change.task.claimed_by}`
                )
              );
              break;
            case "released":
              console.log(
                chalk.gray(
                  `  🔓 ${change.task.id} released`
                )
              );
              break;
          }
        }

        console.log();
        displaySummary(currentTasks, options.filter);
      }

      lastTasks = currentTasks;
    } catch (error) {
      console.error(chalk.red(`✗ Error reading TICK.md: ${(error as Error).message}`));
    }
  }, interval);

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    clearInterval(watchInterval);
    console.log();
    console.log(chalk.gray("Stopped watching"));
    process.exit(0);
  });
}

interface TaskChange {
  type: "added" | "removed" | "status" | "claimed" | "released";
  task: Task;
  oldValue?: string;
}

/**
 * Detect changes between task lists
 */
function detectChanges(oldTasks: Task[], newTasks: Task[]): TaskChange[] {
  const changes: TaskChange[] = [];
  const oldMap = new Map(oldTasks.map((t) => [t.id, t]));
  const newMap = new Map(newTasks.map((t) => [t.id, t]));

  // Check for added and modified tasks
  for (const [id, newTask] of newMap) {
    const oldTask = oldMap.get(id);

    if (!oldTask) {
      changes.push({ type: "added", task: newTask });
    } else {
      // Check for status change
      if (oldTask.status !== newTask.status) {
        changes.push({ type: "status", task: newTask, oldValue: oldTask.status });
      }

      // Check for claim change
      if (!oldTask.claimed_by && newTask.claimed_by) {
        changes.push({ type: "claimed", task: newTask });
      } else if (oldTask.claimed_by && !newTask.claimed_by) {
        changes.push({ type: "released", task: newTask });
      }
    }
  }

  // Check for removed tasks
  for (const [id, oldTask] of oldMap) {
    if (!newMap.has(id)) {
      changes.push({ type: "removed", task: oldTask });
    }
  }

  return changes;
}

/**
 * Display task summary
 */
function displaySummary(tasks: Task[], filter?: TaskStatus): void {
  const filteredTasks = filter ? tasks.filter((t) => t.status === filter) : tasks;

  const byStatus = filteredTasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<TaskStatus, number>);

  const parts = [
    byStatus.todo ? chalk.white(`${byStatus.todo} todo`) : null,
    byStatus.in_progress ? chalk.blue(`${byStatus.in_progress} in progress`) : null,
    byStatus.blocked ? chalk.red(`${byStatus.blocked} blocked`) : null,
    byStatus.done ? chalk.green(`${byStatus.done} done`) : null,
  ].filter(Boolean);

  console.log(chalk.gray(`  Status: ${parts.join(" · ")}`));
  console.log();
}
