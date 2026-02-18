import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import { parseTickFileWithErrors } from "../parser/index.js";
import { serializeTickFile } from "../parser/index.js";
import { createBackup, writeFileAtomic } from "../utils/backup.js";
import type { Task, TaskStatus, Priority } from "../types.js";

export interface RepairOptions {
  dryRun?: boolean;
  force?: boolean;
}

interface RepairResult {
  fixed: string[];
  warnings: string[];
  errors: string[];
}

/**
 * Repair command - auto-fix common TICK.md issues
 */
export async function repairCommand(
  options: RepairOptions = {}
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

  // Read and parse with error collection
  const content = await fs.readFile(tickPath, "utf-8");
  const tickFile = parseTickFileWithErrors(content);

  console.log(chalk.cyan("🔧 Tick Repair\n"));

  // Report parse errors found
  if (tickFile.parseErrors.length > 0) {
    console.log(chalk.yellow(`Found ${tickFile.parseErrors.length} parse issues:\n`));
    for (const error of tickFile.parseErrors) {
      const prefix = error.recoverable ? "⚠" : "✗";
      const taskInfo = error.taskId ? ` [${error.taskId}]` : "";
      console.log(`  ${prefix}${taskInfo} ${error.message}`);
    }
    console.log("");
  }

  // Run repairs
  const result = repairTickFile(tickFile);

  // Report results
  if (result.fixed.length === 0 && result.warnings.length === 0) {
    console.log(chalk.green("✓ No repairs needed - TICK.md looks healthy"));
    return;
  }

  if (result.fixed.length > 0) {
    console.log(chalk.cyan("Repairs to apply:\n"));
    for (const fix of result.fixed) {
      console.log(`  ✓ ${fix}`);
    }
    console.log("");
  }

  if (result.warnings.length > 0) {
    console.log(chalk.yellow("Warnings (manual attention needed):\n"));
    for (const warning of result.warnings) {
      console.log(`  ⚠ ${warning}`);
    }
    console.log("");
  }

  if (result.errors.length > 0) {
    console.log(chalk.red("Errors (cannot auto-fix):\n"));
    for (const error of result.errors) {
      console.log(`  ✗ ${error}`);
    }
    console.log("");
  }

  if (options.dryRun) {
    console.log(chalk.yellow("[DRY RUN] No changes made."));
    return;
  }

  if (result.fixed.length === 0) {
    console.log(chalk.gray("No auto-fixable issues found."));
    return;
  }

  // Apply repairs
  console.log("Applying repairs...\n");

  // Create backup first
  const backup = await createBackup(cwd);
  console.log(chalk.gray(`  Backup created: ${backup.filename}`));

  // Write repaired file
  const repairedContent = serializeTickFile(tickFile);
  await writeFileAtomic(tickPath, repairedContent);

  console.log(chalk.green(`\n✓ Applied ${result.fixed.length} repairs`));
  console.log(chalk.gray("  Run 'tick validate' to verify the repairs"));
}

/**
 * Repair a TickFile in place and return what was fixed
 */
function repairTickFile(tickFile: any): RepairResult {
  const result: RepairResult = {
    fixed: [],
    warnings: [],
    errors: [],
  };

  // 1. Fix invalid status values
  for (const task of tickFile.tasks) {
    const validStatuses: TaskStatus[] = [
      "backlog", "todo", "in_progress", "review", "done", "blocked", "reopened"
    ];
    if (!validStatuses.includes(task.status)) {
      const oldStatus = task.status;
      task.status = "backlog";
      result.fixed.push(`${task.id}: Invalid status "${oldStatus}" → "backlog"`);
    }
  }

  // 2. Fix invalid priority values
  for (const task of tickFile.tasks) {
    const validPriorities: Priority[] = ["urgent", "high", "medium", "low"];
    if (!validPriorities.includes(task.priority)) {
      const oldPriority = task.priority;
      task.priority = "medium";
      result.fixed.push(`${task.id}: Invalid priority "${oldPriority}" → "medium"`);
    }
  }

  // 3. Fix missing required fields
  for (const task of tickFile.tasks) {
    if (!task.id) {
      result.errors.push(`Task missing ID - cannot auto-fix`);
      continue;
    }
    if (!task.title) {
      task.title = `Untitled (${task.id})`;
      result.fixed.push(`${task.id}: Added missing title`);
    }
    if (!task.created_at) {
      task.created_at = new Date().toISOString();
      result.fixed.push(`${task.id}: Added missing created_at`);
    }
    if (!task.updated_at) {
      task.updated_at = new Date().toISOString();
      result.fixed.push(`${task.id}: Added missing updated_at`);
    }
    if (!Array.isArray(task.tags)) {
      task.tags = [];
      result.fixed.push(`${task.id}: Fixed tags (not an array)`);
    }
    if (!Array.isArray(task.depends_on)) {
      task.depends_on = [];
      result.fixed.push(`${task.id}: Fixed depends_on (not an array)`);
    }
    if (!Array.isArray(task.blocks)) {
      task.blocks = [];
      result.fixed.push(`${task.id}: Fixed blocks (not an array)`);
    }
    if (!Array.isArray(task.history)) {
      task.history = [];
      result.fixed.push(`${task.id}: Fixed history (not an array)`);
    }
  }

  // 4. Check for duplicate IDs
  const seenIds = new Set<string>();
  for (const task of tickFile.tasks) {
    if (seenIds.has(task.id)) {
      result.warnings.push(`Duplicate task ID: ${task.id} - manual fix required`);
    }
    seenIds.add(task.id);
  }

  // 5. Check for broken dependencies
  const allIds = new Set(tickFile.tasks.map((t: Task) => t.id));
  for (const task of tickFile.tasks) {
    const brokenDeps = task.depends_on.filter((id: string) => !allIds.has(id));
    if (brokenDeps.length > 0) {
      // Remove broken dependencies
      task.depends_on = task.depends_on.filter((id: string) => allIds.has(id));
      result.fixed.push(`${task.id}: Removed broken dependencies: ${brokenDeps.join(", ")}`);
    }

    const brokenBlocks = task.blocks.filter((id: string) => !allIds.has(id));
    if (brokenBlocks.length > 0) {
      task.blocks = task.blocks.filter((id: string) => allIds.has(id));
      result.fixed.push(`${task.id}: Removed broken blocks: ${brokenBlocks.join(", ")}`);
    }
  }

  // 6. Fix done tasks that are still claimed
  for (const task of tickFile.tasks) {
    if (task.status === "done" && task.claimed_by) {
      task.claimed_by = null;
      result.fixed.push(`${task.id}: Cleared claimed_by for done task`);
    }
  }

  // 7. Check for missing history on tasks
  for (const task of tickFile.tasks) {
    if (task.history.length === 0) {
      result.warnings.push(`${task.id}: No history entries - consider adding creation record`);
    }
  }

  // 8. Fix meta.next_id if it's too low
  const maxTaskNum = Math.max(
    0,
    ...tickFile.tasks.map((t: Task) => {
      const match = t.id.match(/\d+$/);
      return match ? parseInt(match[0], 10) : 0;
    })
  );
  if (tickFile.meta.next_id <= maxTaskNum) {
    const oldNextId = tickFile.meta.next_id;
    tickFile.meta.next_id = maxTaskNum + 1;
    result.fixed.push(`meta.next_id: ${oldNextId} → ${tickFile.meta.next_id} (was too low)`);
  }

  return result;
}
