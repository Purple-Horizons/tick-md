import * as fs from "node:fs";
import chalk from "chalk";
import { parseTickFile } from "../parser/parse.js";
import type { Task } from "../types.js";

export interface GraphOptions {
  format?: "ascii" | "mermaid";
  showDone?: boolean;
}

/**
 * Visualize task dependencies as a graph
 */
export async function graphCommand(options: GraphOptions = {}): Promise<void> {
  const tickPath = "TICK.md";

  if (!fs.existsSync(tickPath)) {
    console.error(chalk.red("✗ TICK.md not found"));
    console.log(chalk.gray("Run 'tick init' to initialize a project"));
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(tickPath, "utf-8");
    const tickFile = parseTickFile(content);

    let tasks = tickFile.tasks;

    // Filter out done tasks unless explicitly shown
    if (!options.showDone) {
      tasks = tasks.filter((t) => t.status !== "done");
    }

    if (tasks.length === 0) {
      console.log(chalk.yellow("No tasks to display"));
      return;
    }

    const format = options.format || "ascii";

    if (format === "mermaid") {
      generateMermaidGraph(tasks);
    } else {
      generateAsciiGraph(tasks, tickFile.tasks);
    }
  } catch (error) {
    console.error(chalk.red("✗ Failed to generate graph"));
    console.error(chalk.gray((error as Error).message));
    process.exit(1);
  }
}

/**
 * Generate ASCII dependency graph
 */
function generateAsciiGraph(tasks: Task[], allTasks: Task[]): void {
  console.log(chalk.cyan.bold("📊 Task Dependency Graph"));
  console.log();

  // Build adjacency map
  const taskMap = new Map(allTasks.map((t) => [t.id, t]));
  const printed = new Set<string>();

  function printTask(task: Task, indent: string, isLast: boolean): void {
    if (printed.has(task.id)) {
      console.log(`${indent}${isLast ? "└─" : "├─"} ${chalk.gray(`${task.id} (shown above)`)}`);
      return;
    }

    printed.add(task.id);

    const statusColor =
      task.status === "done"
        ? chalk.green
        : task.status === "in_progress"
        ? chalk.blue
        : task.status === "blocked"
        ? chalk.red
        : chalk.white;

    const icon = task.claimed_by ? "🔒" : "📝";
    
    console.log(
      `${indent}${isLast ? "└─" : "├─"} ${icon} ${statusColor.bold(task.id)} ${chalk.white(task.title)}`
    );

    if (task.claimed_by) {
      console.log(`${indent}${isLast ? "  " : "│ "}   ${chalk.gray(`by ${task.claimed_by}`)}`);
    }

    // Show dependencies
    if (task.depends_on.length > 0) {
      const newIndent = indent + (isLast ? "  " : "│ ");
      console.log(`${newIndent}   ${chalk.gray("depends on:")}`);
      
      task.depends_on.forEach((depId, i) => {
        const depTask = taskMap.get(depId);
        if (depTask) {
          const isLastDep = i === task.depends_on.length - 1;
          printTask(depTask, newIndent + "   ", isLastDep);
        } else {
          console.log(`${newIndent}   ${isLast ? "└─" : "├─"} ${chalk.red(`${depId} (missing)`)}`);
        }
      });
    }
  }

  // Find root tasks (no dependencies)
  const rootTasks = tasks.filter((t) => t.depends_on.length === 0);

  if (rootTasks.length === 0) {
    console.log(chalk.yellow("All tasks have dependencies (potential circular dependency)"));
    console.log(chalk.gray("Run 'tick validate' to check for cycles"));
    return;
  }

  // Print each root and its tree
  rootTasks.forEach((task, i) => {
    printTask(task, "", i === rootTasks.length - 1);
    console.log();
  });

  // Show tasks that only block (no deps)
  const blockerTasks = tasks.filter(
    (t) => t.depends_on.length === 0 && t.blocks.length > 0
  );

  if (blockerTasks.length > 0) {
    console.log(chalk.gray("─".repeat(60)));
    console.log(chalk.yellow.bold("⚠ Blocking Tasks (no dependencies):"));
    console.log();

    blockerTasks.forEach((task) => {
      console.log(`  🚧 ${chalk.white.bold(task.id)} ${task.title}`);
      console.log(chalk.gray(`     Blocks: ${task.blocks.join(", ")}`));
      console.log();
    });
  }
}

/**
 * Generate Mermaid flowchart syntax
 */
function generateMermaidGraph(tasks: Task[]): void {
  console.log(chalk.cyan.bold("📊 Task Dependency Graph (Mermaid)"));
  console.log();
  console.log("```mermaid");
  console.log("graph TD");

  // Define nodes
  for (const task of tasks) {
    const statusStyle =
      task.status === "done"
        ? ":::done"
        : task.status === "in_progress"
        ? ":::inProgress"
        : task.status === "blocked"
        ? ":::blocked"
        : "";

    const label = `${task.id}<br/>${task.title.substring(0, 30)}${task.title.length > 30 ? "..." : ""}`;
    console.log(`  ${task.id}["${label}"]${statusStyle}`);
  }

  // Define edges (dependencies)
  for (const task of tasks) {
    for (const depId of task.depends_on) {
      console.log(`  ${depId} --> ${task.id}`);
    }
  }

  // Styles
  console.log();
  console.log("  classDef done fill:#22d3a7,stroke:#1a9e7e,color:#000");
  console.log("  classDef inProgress fill:#60a5fa,stroke:#3b82f6,color:#000");
  console.log("  classDef blocked fill:#ef4444,stroke:#dc2626,color:#fff");
  console.log("```");
  console.log();
  console.log(chalk.gray("Copy the above Mermaid code to visualize in GitHub, Notion, or mermaid.live"));
}
