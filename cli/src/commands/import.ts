import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import YAML from "yaml";
import { parseTickFile, serializeTickFile } from "../parser/index.js";
import type { Task, Priority, TaskStatus } from "../types.js";
import { autoCommit, shouldAutoCommit } from "../utils/auto-commit.js";
import { getGitUser } from "../utils/git.js";

export interface ImportOptions {
  commit?: boolean;
  noCommit?: boolean;
  dryRun?: boolean;
}

interface ImportTask {
  title: string;
  priority?: Priority;
  status?: TaskStatus;
  tags?: string[];
  assigned_to?: string;
  description?: string;
  depends_on?: string[];
  blocks?: string[];
  estimated_hours?: number;
  due_date?: string;
}

/**
 * Import tasks from a YAML file or stdin
 */
export async function importCommand(
  source: string | undefined,
  options: ImportOptions = {}
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

  // Read input
  let input: string;

  if (source === "-" || source === undefined) {
    // Read from stdin
    input = await readStdin();
    if (!input.trim()) {
      throw new Error("No input received from stdin. Provide tasks in YAML format.");
    }
  } else {
    // Read from file
    const sourcePath = path.resolve(cwd, source);
    try {
      input = await fs.readFile(sourcePath, "utf-8");
    } catch {
      throw new Error(`Could not read file: ${source}`);
    }
  }

  // Parse YAML input
  let tasks: ImportTask[];
  try {
    const parsed = YAML.parse(input);
    if (Array.isArray(parsed)) {
      tasks = parsed;
    } else if (parsed && typeof parsed === "object" && Array.isArray(parsed.tasks)) {
      tasks = parsed.tasks;
    } else {
      throw new Error("Expected an array of tasks or an object with a 'tasks' array");
    }
  } catch (error: any) {
    throw new Error(`Failed to parse YAML: ${error.message}`);
  }

  if (tasks.length === 0) {
    console.log(chalk.yellow("No tasks to import."));
    return;
  }

  // Validate tasks
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (!task.title) {
      throw new Error(`Task ${i + 1} is missing required field: title`);
    }
    if (task.priority && !["urgent", "high", "medium", "low"].includes(task.priority)) {
      throw new Error(`Task ${i + 1} has invalid priority: ${task.priority}`);
    }
    if (task.status && !["backlog", "todo", "in_progress", "review", "done", "blocked", "reopened"].includes(task.status)) {
      throw new Error(`Task ${i + 1} has invalid status: ${task.status}`);
    }
  }

  // Read and parse TICK.md
  const content = await fs.readFile(tickPath, "utf-8");
  const tickFile = parseTickFile(content);

  // Get creator
  const creator = await getGitUser(cwd) || process.env.USER || "unknown";
  const now = new Date().toISOString();

  // Track created tasks for ID mapping (allows depends_on to reference by title)
  const createdTasks: Map<string, string> = new Map(); // title -> id

  if (options.dryRun) {
    console.log(chalk.cyan("Dry run - would import the following tasks:"));
    console.log("");
    for (const task of tasks) {
      console.log(`  • ${task.title}`);
      if (task.priority) console.log(`    Priority: ${task.priority}`);
      if (task.tags?.length) console.log(`    Tags: ${task.tags.join(", ")}`);
      if (task.depends_on?.length) console.log(`    Depends on: ${task.depends_on.join(", ")}`);
    }
    console.log("");
    console.log(chalk.yellow(`Would create ${tasks.length} task(s).`));
    return;
  }

  // Create tasks
  const created: string[] = [];
  for (const taskData of tasks) {
    // Generate task ID
    const prefix = tickFile.meta.id_prefix || "TASK";
    const nextId = tickFile.meta.next_id || 1;
    const taskId = `${prefix}-${String(nextId).padStart(3, "0")}`;

    // Resolve depends_on (can be task IDs or titles of tasks being imported)
    const resolvedDependsOn: string[] = [];
    if (taskData.depends_on) {
      for (const dep of taskData.depends_on) {
        if (createdTasks.has(dep)) {
          // Reference to another task in this import batch (by title)
          resolvedDependsOn.push(createdTasks.get(dep)!);
        } else if (tickFile.tasks.find((t) => t.id === dep)) {
          // Existing task ID
          resolvedDependsOn.push(dep);
        } else {
          console.warn(chalk.yellow(`Warning: Unknown dependency '${dep}' for task '${taskData.title}'`));
        }
      }
    }

    // Create the task
    const newTask: Task = {
      id: taskId,
      title: taskData.title,
      status: taskData.status || "backlog",
      priority: taskData.priority || "medium",
      assigned_to: taskData.assigned_to || null,
      claimed_by: null,
      created_by: creator,
      created_at: now,
      updated_at: now,
      due_date: taskData.due_date,
      tags: taskData.tags || [],
      depends_on: resolvedDependsOn,
      blocks: taskData.blocks || [],
      estimated_hours: taskData.estimated_hours,
      actual_hours: undefined,
      detail_file: undefined,
      description: taskData.description || "",
      history: [
        {
          ts: now,
          who: creator,
          action: "created",
          note: "Imported via tick import",
        },
      ],
    };

    tickFile.tasks.push(newTask);
    tickFile.meta.next_id = nextId + 1;
    createdTasks.set(taskData.title, taskId);
    created.push(taskId);
  }

  // Update metadata
  tickFile.meta.updated = now;

  // Serialize and write
  const newContent = serializeTickFile(tickFile);
  await fs.writeFile(tickPath, newContent);

  console.log(chalk.green(`✓ Imported ${created.length} task(s)`));
  for (const id of created) {
    const task = tickFile.tasks.find((t) => t.id === id);
    console.log(`  ${id}: ${task?.title}`);
  }

  // Auto-commit if enabled
  if (await shouldAutoCommit(options, cwd)) {
    await autoCommit(`Imported ${created.length} task(s)`, cwd);
  }
}

/**
 * Read all input from stdin
 */
async function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    const stdin = process.stdin;

    // Check if stdin is a TTY (interactive terminal)
    if (stdin.isTTY) {
      resolve("");
      return;
    }

    stdin.setEncoding("utf-8");
    stdin.on("data", (chunk) => {
      data += chunk;
    });
    stdin.on("end", () => {
      resolve(data);
    });
    stdin.on("error", () => {
      resolve("");
    });

    // Set a timeout for stdin
    setTimeout(() => {
      resolve(data);
    }, 100);
  });
}
