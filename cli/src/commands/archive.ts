import fs from "fs/promises";
import path from "path";
import { parseTickFile, serializeTickFile } from "../parser/index.js";
import type { Task, TaskStatus } from "../types.js";
import { autoCommit, shouldAutoCommit } from "../utils/auto-commit.js";
import { createBackup, writeFileAtomic } from "../utils/backup.js";

export interface ArchiveOptions {
  before?: string; // Date string or relative (e.g., "30d", "2026-01-01")
  status?: TaskStatus; // Default: done
  dryRun?: boolean;
  commit?: boolean;
  noCommit?: boolean;
}

/**
 * Archive completed tasks to ARCHIVE.md
 */
export async function archiveCommand(
  options: ArchiveOptions = {}
): Promise<void> {
  const cwd = process.cwd();
  const tickPath = path.join(cwd, "TICK.md");
  const archivePath = path.join(cwd, "ARCHIVE.md");

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

  // Determine which tasks to archive
  const targetStatus = options.status || "done";
  const beforeDate = options.before ? parseRelativeDate(options.before) : null;

  const tasksToArchive: Task[] = [];
  const tasksToKeep: Task[] = [];

  for (const task of tickFile.tasks) {
    const shouldArchive =
      task.status === targetStatus &&
      (!beforeDate || new Date(task.updated_at) < beforeDate);

    if (shouldArchive) {
      tasksToArchive.push(task);
    } else {
      tasksToKeep.push(task);
    }
  }

  if (tasksToArchive.length === 0) {
    console.log("No tasks match the archive criteria.");
    if (beforeDate) {
      console.log(`  Status: ${targetStatus}`);
      console.log(`  Before: ${beforeDate.toISOString()}`);
    }
    return;
  }

  console.log(`Found ${tasksToArchive.length} tasks to archive:\n`);
  for (const task of tasksToArchive) {
    console.log(`  ${task.id}: ${task.title}`);
    console.log(`    Status: ${task.status}, Updated: ${task.updated_at}`);
  }
  console.log("");

  if (options.dryRun) {
    console.log("[DRY RUN] No changes made.");
    return;
  }

  // Load or create archive file
  let archiveContent = "";
  try {
    archiveContent = await fs.readFile(archivePath, "utf-8");
  } catch {
    // Create new archive file
    archiveContent = generateArchiveHeader(tickFile.meta.project);
  }

  // Append archived tasks to ARCHIVE.md
  const now = new Date().toISOString();
  const archiveSection = generateArchiveSection(tasksToArchive, now);
  archiveContent = archiveContent.trimEnd() + "\n\n" + archiveSection;

  // Remove archived tasks from TICK.md
  tickFile.tasks = tasksToKeep;
  tickFile.meta.updated = now;

  // Create backup before destructive operation
  const backup = await createBackup(cwd);

  // Write both files atomically
  const newTickContent = serializeTickFile(tickFile);
  await writeFileAtomic(tickPath, newTickContent);
  await writeFileAtomic(archivePath, archiveContent);

  console.log(`✓ Archived ${tasksToArchive.length} tasks to ARCHIVE.md`);
  console.log(`  Backup created: ${backup.filename}`);
  console.log(`  TICK.md now has ${tasksToKeep.length} tasks`);

  // Auto-commit if enabled
  if (await shouldAutoCommit(options, cwd)) {
    await autoCommit(`archive ${tasksToArchive.length} tasks`, cwd);
  }
}

/**
 * List archived tasks
 */
export async function listArchiveCommand(
  options: { limit?: number } = {}
): Promise<void> {
  const cwd = process.cwd();
  const archivePath = path.join(cwd, "ARCHIVE.md");

  try {
    await fs.access(archivePath);
  } catch {
    console.log("No ARCHIVE.md found. Use 'tick archive' to archive completed tasks.");
    return;
  }

  const content = await fs.readFile(archivePath, "utf-8");

  // Parse archive entries
  const entries = parseArchiveEntries(content);

  const limit = options.limit || 20;
  const recentEntries = entries.slice(0, limit);

  if (recentEntries.length === 0) {
    console.log("Archive is empty.");
    return;
  }

  console.log(`📦 Archived Tasks (${entries.length} total):\n`);

  for (const entry of recentEntries) {
    console.log(`  ${entry.id}: ${entry.title}`);
    if (entry.archivedAt) {
      console.log(`    Archived: ${new Date(entry.archivedAt).toLocaleDateString()}`);
    }
  }

  if (entries.length > limit) {
    console.log(`\n  ... and ${entries.length - limit} more archived tasks`);
  }
}

/**
 * Parse relative date strings like "30d", "1w", "2026-01-01"
 */
function parseRelativeDate(dateStr: string): Date {
  // Check for ISO date
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return new Date(dateStr);
  }

  // Parse relative dates
  const match = dateStr.match(/^(\d+)([dwmy])$/);
  if (!match) {
    throw new Error(`Invalid date format: ${dateStr}. Use ISO date or relative (e.g., 30d, 1w)`);
  }

  const [, amount, unit] = match;
  const now = new Date();

  switch (unit) {
    case "d":
      now.setDate(now.getDate() - parseInt(amount));
      break;
    case "w":
      now.setDate(now.getDate() - parseInt(amount) * 7);
      break;
    case "m":
      now.setMonth(now.getMonth() - parseInt(amount));
      break;
    case "y":
      now.setFullYear(now.getFullYear() - parseInt(amount));
      break;
  }

  return now;
}

/**
 * Generate archive file header
 */
function generateArchiveHeader(projectName: string): string {
  return `# ${projectName} - Task Archive

This file contains archived tasks from TICK.md.
Tasks are archived when they are completed and older than the archive threshold.

---
`;
}

/**
 * Generate archive section for a batch of tasks
 */
function generateArchiveSection(tasks: Task[], archivedAt: string): string {
  const dateStr = new Date(archivedAt).toISOString().split("T")[0];

  let section = `## Archived ${dateStr}\n\n`;

  for (const task of tasks) {
    section += `### ${task.id} · ${task.title}\n\n`;
    section += `- **Status:** ${task.status}\n`;
    section += `- **Priority:** ${task.priority}\n`;
    if (task.assigned_to) {
      section += `- **Assigned to:** ${task.assigned_to}\n`;
    }
    section += `- **Created:** ${task.created_at}\n`;
    section += `- **Completed:** ${task.updated_at}\n`;
    section += `- **Archived:** ${archivedAt}\n`;

    if (task.tags.length > 0) {
      section += `- **Tags:** ${task.tags.join(", ")}\n`;
    }

    if (task.description) {
      section += `\n${task.description}\n`;
    }

    section += "\n";
  }

  return section;
}

/**
 * Parse archive entries from ARCHIVE.md
 */
function parseArchiveEntries(content: string): { id: string; title: string; archivedAt?: string }[] {
  const entries: { id: string; title: string; archivedAt?: string }[] = [];

  // Match task headers: ### TASK-XXX · Title
  const taskRegex = /###\s+([A-Z]+-\d+)\s*·\s*(.+?)$/gm;
  let match;

  while ((match = taskRegex.exec(content)) !== null) {
    const id = match[1];
    const title = match[2].trim();

    // Try to find archived date in the following lines
    const afterHeader = content.slice(match.index);
    const archivedMatch = afterHeader.match(/\*\*Archived:\*\*\s*(.+?)$/m);

    entries.push({
      id,
      title,
      archivedAt: archivedMatch ? archivedMatch[1].trim() : undefined,
    });
  }

  return entries;
}
