import chalk from "chalk";
import { parseTickFileCached } from "../utils/parse-cache.js";
import type { Task, TaskStatus, Priority, AgentStatus } from "../types.js";

export type OutputFormat = "default" | "compact" | "wide" | "table" | "ids" | "oneline";

export interface ListOptions {
  status?: TaskStatus;
  priority?: Priority;
  assignedTo?: string;
  claimedBy?: string;
  tag?: string;
  blocked?: boolean;
  json?: boolean;
  format?: OutputFormat;
  noGroup?: boolean;
  noColor?: boolean;
}

/**
 * List tasks with filtering and search
 */
export async function listCommand(options: ListOptions = {}): Promise<void> {
  try {
    // Use cached parser
    const tickFile = await parseTickFileCached();

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

    // Output based on format
    const format = options.format || "default";
    const c = options.noColor ? {
      cyan: { bold: (s: string) => s },
      gray: (s: string) => s,
      green: { bold: (s: string) => s },
      blue: { bold: (s: string) => s },
      red: { bold: (s: string) => s },
      white: { bold: (s: string) => s },
      yellow: (s: string) => s,
    } : chalk;

    switch (format) {
      case "ids":
        // Just IDs for scripting
        for (const task of tasks) {
          console.log(task.id);
        }
        break;

      case "oneline":
        // Ultra-compact: ID STATUS TITLE (no colors, pipe-friendly)
        for (const task of tasks) {
          console.log(`${task.id}\t${task.status}\t${task.priority}\t${task.title}`);
        }
        break;

      case "compact":
        // Compact: one line per task with status icon
        for (const task of tasks) {
          const statusIcon = getStatusIcon(task.status);
          const priorityIcon = getPriorityIcon(task.priority, options.noColor);
          const claimed = task.claimed_by ? c.gray(` (${task.claimed_by})`) : "";
          console.log(`${statusIcon} ${priorityIcon} ${task.id} ${task.title}${claimed}`);
        }
        break;

      case "table":
        // Table format
        printTable(tasks, options.noColor);
        break;

      case "wide":
        // Wide format: show all details
        printWide(tasks, c as any);
        break;

      default:
        // Default format with grouping
        if (options.noGroup) {
          printFlat(tasks, c as any);
        } else {
          printGrouped(tasks, c as any);
        }
        break;
    }
  } catch (error) {
    console.error(chalk.red("✗ Failed to list tasks"));
    console.error(chalk.gray((error as Error).message));
    process.exit(1);
  }
}

/**
 * Get status icon
 */
function getStatusIcon(status: TaskStatus): string {
  const icons: Record<TaskStatus, string> = {
    backlog: "📋",
    todo: "📝",
    in_progress: "🔄",
    review: "👀",
    done: "✅",
    blocked: "🚫",
    reopened: "🔁",
  };
  return icons[status] || "❓";
}

/**
 * Get priority icon
 */
function getPriorityIcon(priority: Priority, noColor?: boolean): string {
  if (noColor) {
    return `[${priority[0].toUpperCase()}]`;
  }
  const icons: Record<Priority, string> = {
    urgent: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "⚪",
  };
  return icons[priority] || "⚪";
}

/**
 * Print tasks as a table
 */
function printTable(tasks: Task[], noColor?: boolean): void {
  const c = noColor ? {
    cyan: { bold: (s: string) => s },
    gray: (s: string) => s,
  } : chalk;

  // Calculate column widths
  const idWidth = Math.max(4, ...tasks.map((t) => t.id.length));
  const statusWidth = Math.max(6, ...tasks.map((t) => t.status.length));
  const prioWidth = 8;
  const titleWidth = Math.max(20, Math.min(50, ...tasks.map((t) => t.title.length)));
  const agentWidth = Math.max(8, ...tasks.map((t) => (t.claimed_by || t.assigned_to || "").length));

  // Header
  const header = [
    "ID".padEnd(idWidth),
    "STATUS".padEnd(statusWidth),
    "PRIORITY".padEnd(prioWidth),
    "TITLE".padEnd(titleWidth),
    "AGENT".padEnd(agentWidth),
  ].join("  ");

  console.log(c.cyan.bold(header));
  console.log(c.gray("─".repeat(header.length)));

  // Rows
  for (const task of tasks) {
    const agent = task.claimed_by || task.assigned_to || "-";
    const title = task.title.length > titleWidth
      ? task.title.slice(0, titleWidth - 3) + "..."
      : task.title;

    const row = [
      task.id.padEnd(idWidth),
      task.status.padEnd(statusWidth),
      task.priority.padEnd(prioWidth),
      title.padEnd(titleWidth),
      agent.padEnd(agentWidth),
    ].join("  ");

    console.log(row);
  }

  console.log(c.gray("─".repeat(header.length)));
  console.log(c.gray(`${tasks.length} task(s)`));
}

/**
 * Print tasks in wide format with all details
 */
function printWide(tasks: Task[], c: typeof chalk): void {
  for (const task of tasks) {
    console.log(c.white.bold(`${task.id}: ${task.title}`));
    console.log(`  Status: ${task.status}  Priority: ${task.priority}`);

    if (task.claimed_by) {
      console.log(`  Claimed by: ${task.claimed_by}`);
    } else if (task.assigned_to) {
      console.log(`  Assigned to: ${task.assigned_to}`);
    }

    if (task.tags.length > 0) {
      console.log(`  Tags: ${task.tags.map((t) => `#${t}`).join(" ")}`);
    }

    if (task.depends_on.length > 0) {
      console.log(`  Depends on: ${task.depends_on.join(", ")}`);
    }

    if (task.blocks.length > 0) {
      console.log(`  Blocks: ${task.blocks.join(", ")}`);
    }

    if (task.description) {
      const desc = task.description.length > 80
        ? task.description.slice(0, 77) + "..."
        : task.description;
      console.log(c.gray(`  ${desc}`));
    }

    console.log();
  }

  console.log(c.gray(`${tasks.length} task(s)`));
}

/**
 * Print tasks flat (no grouping)
 */
function printFlat(tasks: Task[], c: typeof chalk): void {
  console.log(c.cyan.bold(`📋 Tasks (${tasks.length})`));
  console.log();

  for (const task of tasks) {
    const priorityIcon = getPriorityIcon(task.priority);
    const statusIcon = getStatusIcon(task.status);

    console.log(`  ${statusIcon} ${priorityIcon} ${c.white.bold(task.id)} ${task.title}`);

    if (task.claimed_by) {
      console.log(c.gray(`       Claimed by: ${task.claimed_by}`));
    }
  }

  console.log();
  console.log(c.gray(`${tasks.length} task(s)`));
}

/**
 * Print tasks grouped by status (default)
 */
function printGrouped(tasks: Task[], c: typeof chalk): void {
  console.log(c.cyan.bold(`📋 Tasks (${tasks.length})`));
  console.log();

  // Group by status
  const byStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = [];
    acc[task.status].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

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
      const priorityIcon = getPriorityIcon(task.priority);

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
}
