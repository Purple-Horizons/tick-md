import * as fs from "node:fs";
import chalk from "chalk";
import { parseTickFile } from "../parser/parse.js";
import type { TaskStatus, Priority, AgentStatus } from "../types.js";

export interface ListOptions {
  status?: TaskStatus;
  priority?: Priority;
  assignedTo?: string;
  claimedBy?: string;
  tag?: string;
  blocked?: boolean;
  json?: boolean;
}

/**
 * List tasks with filtering and search
 */
export async function listCommand(options: ListOptions = {}): Promise<void> {
  const tickPath = "TICK.md";

  if (!fs.existsSync(tickPath)) {
    console.error(chalk.red("✗ TICK.md not found"));
    console.log(chalk.gray("Run 'tick init' to initialize a project"));
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(tickPath, "utf-8");
    const tickFile = parseTickFile(content);

    // Apply filters
    let tasks = tickFile.tasks;

    if (options.status) {
      tasks = tasks.filter((t) => t.status === options.status);
    }

    if (options.priority) {
      tasks = tasks.filter((t) => t.priority === options.priority);
    }

    if (options.assignedTo) {
      tasks = tasks.filter((t) => t.assigned_to === options.assignedTo);
    }

    if (options.claimedBy) {
      tasks = tasks.filter((t) => t.claimed_by === options.claimedBy);
    }

    if (options.tag) {
      tasks = tasks.filter((t) => t.tags.includes(options.tag!));
    }

    if (options.blocked) {
      tasks = tasks.filter((t) => t.status === "blocked");
    }

    // JSON output
    if (options.json) {
      console.log(JSON.stringify(tasks, null, 2));
      return;
    }

    // No tasks
    if (tasks.length === 0) {
      console.log(chalk.yellow("No tasks match filters"));
      return;
    }

    // Display tasks
    console.log(chalk.cyan.bold(`📋 Tasks (${tasks.length})`));
    console.log();

    // Group by status
    const byStatus = tasks.reduce((acc, task) => {
      if (!acc[task.status]) acc[task.status] = [];
      acc[task.status].push(task);
      return acc;
    }, {} as Record<string, typeof tasks>);

    for (const [status, statusTasks] of Object.entries(byStatus)) {
      const statusColor =
        status === "done"
          ? chalk.green
          : status === "in_progress"
          ? chalk.blue
          : status === "blocked"
          ? chalk.red
          : chalk.gray;

      console.log(statusColor.bold(`  ${status.toUpperCase()} (${statusTasks.length})`));
      console.log();

      for (const task of statusTasks) {
        const priorityIcon =
          task.priority === "urgent"
            ? "🔴"
            : task.priority === "high"
            ? "🟠"
            : task.priority === "medium"
            ? "🟡"
            : "⚪";

        console.log(`    ${priorityIcon} ${chalk.white.bold(task.id)} ${task.title}`);

        if (task.claimed_by) {
          console.log(chalk.gray(`       Claimed by: ${task.claimed_by}`));
        } else if (task.assigned_to) {
          console.log(chalk.gray(`       Assigned to: ${task.assigned_to}`));
        }

        if (task.tags.length > 0) {
          console.log(chalk.gray(`       Tags: ${task.tags.map((t) => `#${t}`).join(" ")}`));
        }

        if (task.depends_on.length > 0) {
          console.log(chalk.gray(`       Depends on: ${task.depends_on.join(", ")}`));
        }

        if (task.blocks.length > 0) {
          console.log(chalk.yellow(`       Blocks: ${task.blocks.join(", ")}`));
        }

        console.log();
      }
    }

    // Summary
    console.log(chalk.gray("─".repeat(60)));
    console.log(
      chalk.gray(
        `Total: ${tasks.length} · By priority: ${
          tasks.filter((t) => t.priority === "urgent").length
        } urgent, ${tasks.filter((t) => t.priority === "high").length} high, ${
          tasks.filter((t) => t.priority === "medium").length
        } medium, ${tasks.filter((t) => t.priority === "low").length} low`
      )
    );
  } catch (error) {
    console.error(chalk.red("✗ Failed to list tasks"));
    console.error(chalk.gray((error as Error).message));
    process.exit(1);
  }
}
