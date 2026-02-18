import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import { parseTickFile, serializeTickFile } from "../parser/index.js";
import { createBackup } from "../utils/backup.js";

export interface CompactOptions {
  maxHistory?: number;
  milestonesOnly?: boolean;
  dryRun?: boolean;
  noBackup?: boolean;
}

// Milestone actions to keep when using --milestones-only
const MILESTONE_ACTIONS = ["created", "completed", "reopened", "blocked"];

/**
 * Compact task history to reduce file size
 */
export async function compactCommand(
  options: CompactOptions = {}
): Promise<void> {
  const cwd = process.cwd();
  const tickPath = path.join(cwd, "TICK.md");
  const maxHistory = options.maxHistory ?? 10;

  // Check if TICK.md exists
  try {
    await fs.access(tickPath);
  } catch {
    throw new Error("TICK.md not found. Run 'tick init' to create a project.");
  }

  // Read and parse TICK.md
  const content = await fs.readFile(tickPath, "utf-8");
  const originalSize = content.length;
  const tickFile = parseTickFile(content);

  let totalRemoved = 0;
  let tasksAffected = 0;

  // Process each task
  for (const task of tickFile.tasks) {
    const originalCount = task.history.length;

    if (originalCount <= maxHistory && !options.milestonesOnly) {
      continue; // Nothing to compact
    }

    let newHistory = task.history;

    // Filter to milestones only if requested
    if (options.milestonesOnly) {
      newHistory = newHistory.filter((h) =>
        MILESTONE_ACTIONS.includes(h.action)
      );
    }

    // Keep only the last N entries
    if (newHistory.length > maxHistory) {
      // Always keep the first (created) entry
      const created = newHistory.find((h) => h.action === "created");
      const rest = newHistory
        .filter((h) => h.action !== "created")
        .slice(-(maxHistory - 1));

      newHistory = created ? [created, ...rest] : rest;
    }

    if (newHistory.length < originalCount) {
      const removed = originalCount - newHistory.length;
      totalRemoved += removed;
      tasksAffected++;

      if (options.dryRun) {
        console.log(
          chalk.gray(
            `  ${task.id}: ${originalCount} → ${newHistory.length} entries (-${removed})`
          )
        );
      }

      task.history = newHistory;
    }
  }

  // Check if anything changed
  if (totalRemoved === 0) {
    console.log("No history entries to compact.");
    console.log(
      chalk.gray(
        `All tasks have ${maxHistory} or fewer history entries.`
      )
    );
    return;
  }

  // Show summary
  console.log(
    chalk.cyan(`Found ${totalRemoved} history entries to remove across ${tasksAffected} task(s).`)
  );

  if (options.dryRun) {
    console.log("");
    console.log(chalk.yellow("Dry run - no changes made."));
    console.log(chalk.gray("Run without --dry-run to apply changes."));
    return;
  }

  // Create backup before compacting
  if (!options.noBackup) {
    const backup = await createBackup(cwd);
    console.log(chalk.gray(`Backup created: ${backup.filename}`));
  }

  // Serialize and write
  const newContent = serializeTickFile(tickFile);
  await fs.writeFile(tickPath, newContent);

  const newSize = newContent.length;
  const savedBytes = originalSize - newSize;
  const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);

  console.log("");
  console.log(chalk.green("✓ History compacted successfully"));
  console.log(
    chalk.gray(
      `  Removed ${totalRemoved} history entries from ${tasksAffected} task(s)`
    )
  );
  console.log(
    chalk.gray(
      `  File size: ${originalSize} → ${newSize} bytes (saved ${savedBytes} bytes, ${savedPercent}%)`
    )
  );
}

/**
 * Show history statistics
 */
export async function historyStatsCommand(): Promise<void> {
  const cwd = process.cwd();
  const tickPath = path.join(cwd, "TICK.md");

  // Check if TICK.md exists
  try {
    await fs.access(tickPath);
  } catch {
    throw new Error("TICK.md not found. Run 'tick init' to create a project.");
  }

  // Read and parse TICK.md
  const content = await fs.readFile(tickPath, "utf-8");
  const tickFile = parseTickFile(content);

  // Collect statistics
  const historyByTask: { id: string; count: number }[] = [];
  const actionCounts: Record<string, number> = {};
  let totalEntries = 0;

  for (const task of tickFile.tasks) {
    historyByTask.push({ id: task.id, count: task.history.length });
    totalEntries += task.history.length;

    for (const entry of task.history) {
      actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;
    }
  }

  // Sort by history count descending
  historyByTask.sort((a, b) => b.count - a.count);

  // Display statistics
  console.log(chalk.cyan.bold("History Statistics"));
  console.log("");
  console.log(`Total tasks: ${tickFile.tasks.length}`);
  console.log(`Total history entries: ${totalEntries}`);
  console.log(
    `Average per task: ${(totalEntries / tickFile.tasks.length).toFixed(1)}`
  );
  console.log("");

  // Action breakdown
  console.log(chalk.bold("Actions:"));
  const sortedActions = Object.entries(actionCounts).sort(
    ([, a], [, b]) => b - a
  );
  for (const [action, count] of sortedActions) {
    const percent = ((count / totalEntries) * 100).toFixed(1);
    console.log(`  ${action}: ${count} (${percent}%)`);
  }
  console.log("");

  // Top tasks by history
  console.log(chalk.bold("Tasks with most history:"));
  for (const { id, count } of historyByTask.slice(0, 10)) {
    console.log(`  ${id}: ${count} entries`);
  }

  // Compaction recommendation
  const tasksOver10 = historyByTask.filter((t) => t.count > 10).length;
  if (tasksOver10 > 0) {
    console.log("");
    console.log(
      chalk.yellow(
        `${tasksOver10} task(s) have more than 10 history entries.`
      )
    );
    console.log(chalk.gray("Run 'tick compact' to reduce history size."));
  }
}
