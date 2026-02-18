import chalk from "chalk";
import { parseTickFileCached } from "../utils/parse-cache.js";
import type { TaskStatus, Priority } from "../types.js";

/**
 * Show project status and task summary
 */
export async function statusCommand(): Promise<void> {
  const cwd = process.cwd();

  // Parse with caching
  const tickFile = await parseTickFileCached(cwd);

  console.log("");
  console.log(chalk.bold.cyan(`📋 ${tickFile.meta.title || tickFile.meta.project}`));
  console.log(chalk.dim(`   Schema: ${tickFile.meta.schema_version} · Updated: ${new Date(tickFile.meta.updated).toLocaleString()}`));
  console.log("");

  // Agents section
  console.log(chalk.bold("👥 Agents"));
  if (tickFile.agents.length === 0) {
    console.log(chalk.dim("   No agents registered"));
  } else {
    for (const agent of tickFile.agents) {
      const statusColor =
        agent.status === "working"
          ? chalk.green
          : agent.status === "idle"
          ? chalk.yellow
          : chalk.gray;
      const statusIcon =
        agent.status === "working"
          ? "●"
          : agent.status === "idle"
          ? "○"
          : "◌";

      const workingOn = agent.working_on
        ? chalk.dim(` → ${agent.working_on}`)
        : "";
      console.log(
        `   ${statusColor(statusIcon)} ${agent.name} ${chalk.dim(`(${agent.type})`)}${workingOn}`
      );
    }
  }
  console.log("");

  // Tasks by status
  console.log(chalk.bold("📝 Tasks"));

  const tasksByStatus: Record<TaskStatus, typeof tickFile.tasks> = {
    backlog: [],
    todo: [],
    in_progress: [],
    review: [],
    done: [],
    blocked: [],
    reopened: [],
  };

  for (const task of tickFile.tasks) {
    tasksByStatus[task.status].push(task);
  }

  const statusOrder: TaskStatus[] = [
    "in_progress",
    "review",
    "todo",
    "backlog",
    "blocked",
    "done",
  ];

  for (const status of statusOrder) {
    const tasks = tasksByStatus[status];
    if (tasks.length === 0) continue;

    const statusLabel = status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const statusColor =
      status === "done"
        ? chalk.green
        : status === "in_progress"
        ? chalk.cyan
        : status === "blocked"
        ? chalk.red
        : status === "review"
        ? chalk.yellow
        : chalk.white;

    console.log(statusColor(`   ${statusLabel} (${tasks.length})`));

    // Sort by priority
    const sortedTasks = [...tasks].sort((a, b) => {
      const priorityOrder: Record<Priority, number> = {
        urgent: 0,
        high: 1,
        medium: 2,
        low: 3,
      };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    for (const task of sortedTasks.slice(0, 5)) {
      const priorityColor =
        task.priority === "urgent"
          ? chalk.red
          : task.priority === "high"
          ? chalk.yellow
          : chalk.dim;

      const claimedBy = task.claimed_by
        ? chalk.cyan(` [${task.claimed_by}]`)
        : "";
      const tags = task.tags.length > 0 ? chalk.dim(` #${task.tags.join(" #")}`) : "";

      console.log(
        `     ${priorityColor("■")} ${task.id} ${chalk.white(task.title)}${claimedBy}${tags}`
      );
    }

    if (tasks.length > 5) {
      console.log(chalk.dim(`     ... and ${tasks.length - 5} more`));
    }
  }

  console.log("");

  // Summary stats
  const totalTasks = tickFile.tasks.length;
  const doneTasks = tasksByStatus.done.length;
  const inProgressTasks = tasksByStatus.in_progress.length;
  const blockedTasks = tasksByStatus.blocked.length;

  console.log(chalk.bold("📊 Summary"));
  console.log(
    `   Total: ${totalTasks} · Done: ${chalk.green(doneTasks)} · In Progress: ${chalk.cyan(inProgressTasks)} · Blocked: ${chalk.red(blockedTasks)}`
  );

  if (totalTasks > 0) {
    const completionRate = Math.round((doneTasks / totalTasks) * 100);
    const progressBar = createProgressBar(completionRate, 20);
    console.log(`   Completion: ${progressBar} ${completionRate}%`);
  }

  console.log("");
}

/**
 * Create a simple progress bar
 */
function createProgressBar(percentage: number, width: number): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return chalk.green("█".repeat(filled)) + chalk.dim("░".repeat(empty));
}
