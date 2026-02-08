import fs from "fs/promises";
import path from "path";
import { parseTickFile, serializeTickFile } from "../parser/index.js";
import type { Task, Priority, TaskStatus } from "../types.js";
import { autoCommit, shouldAutoCommit } from "../utils/auto-commit.js";

export interface AddOptions {
  priority?: Priority;
  tags?: string[];
  assignedTo?: string;
  dependsOn?: string[];
  blocks?: string[];
  description?: string;
  estimatedHours?: number;
  commit?: boolean;
  noCommit?: boolean;
}

/**
 * Add a new task to TICK.md
 */
export async function addCommand(
  title: string,
  options: AddOptions = {}
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

  // Generate new task ID
  const taskId = `${tickFile.meta.id_prefix}-${String(tickFile.meta.next_id).padStart(3, "0")}`;

  // Get creator from git or environment
  const creator = await getCreator();

  // Create new task
  const now = new Date().toISOString();
  const newTask: Task = {
    id: taskId,
    title,
    status: "backlog" as TaskStatus,
    priority: options.priority || "medium",
    assigned_to: options.assignedTo || null,
    claimed_by: null,
    created_by: creator,
    created_at: now,
    updated_at: now,
    tags: options.tags || [],
    depends_on: options.dependsOn || [],
    blocks: options.blocks || [],
    estimated_hours: options.estimatedHours,
    description: options.description || "",
    history: [
      {
        ts: now,
        who: creator,
        action: "created",
      },
    ],
  };

  // Add task to file
  tickFile.tasks.push(newTask);

  // Increment next_id
  tickFile.meta.next_id++;
  tickFile.meta.updated = now;

  // Serialize and write
  const newContent = serializeTickFile(tickFile);
  await fs.writeFile(tickPath, newContent);

  console.log(`✓ Created ${taskId}: ${title}`);
  console.log(`  Priority: ${newTask.priority}`);
  if (newTask.tags.length > 0) {
    console.log(`  Tags: ${newTask.tags.join(", ")}`);
  }
  if (newTask.assigned_to) {
    console.log(`  Assigned to: ${newTask.assigned_to}`);
  }

  // Auto-commit if enabled
  if (await shouldAutoCommit(options, cwd)) {
    await autoCommit(`${taskId}: created`, cwd);
  }

  console.log("");
  console.log("Next steps:");
  console.log(`  Claim task:  tick claim ${taskId} @yourname`);
  console.log(`  View tasks:  tick status`);
}

/**
 * Get the creator name from git config or environment
 */
async function getCreator(): Promise<string> {
  // Try git config
  try {
    const { execSync } = await import("child_process");
    const gitName = execSync("git config user.name", {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (gitName) {
      return `@${gitName.toLowerCase().replace(/\s+/g, "-")}`;
    }
  } catch {
    // Git not available or not configured
  }

  // Try environment variables
  const envName =
    process.env.TICK_AGENT ||
    process.env.USER ||
    process.env.USERNAME ||
    "unknown";
  return `@${envName.toLowerCase()}`;
}
