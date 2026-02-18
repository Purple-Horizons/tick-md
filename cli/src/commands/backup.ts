import chalk from "chalk";
import {
  listBackups,
  restoreBackup,
  createBackup,
  getBackup,
  type BackupInfo,
} from "../utils/backup.js";

export interface BackupListOptions {
  limit?: number;
}

export interface BackupRestoreOptions {
  force?: boolean;
}

/**
 * List available backups
 */
export async function backupListCommand(
  options: BackupListOptions = {}
): Promise<void> {
  const cwd = process.cwd();
  const backups = await listBackups(cwd);
  const limit = options.limit || 10;

  if (backups.length === 0) {
    console.log("No backups found.");
    console.log(
      chalk.gray("\nBackups are created automatically before destructive operations.")
    );
    console.log(chalk.gray("You can also create a manual backup with: tick backup create"));
    return;
  }

  console.log(`📦 Available Backups (${backups.length} total)\n`);

  const displayBackups = backups.slice(0, limit);
  for (let i = 0; i < displayBackups.length; i++) {
    const backup = displayBackups[i];
    const date = new Date(backup.timestamp);
    const dateStr = date.toLocaleString();
    const sizeKb = (backup.size / 1024).toFixed(1);
    const index = chalk.gray(`[${i}]`);
    const hashShort = chalk.gray(`#${backup.hash.slice(0, 8)}`);

    console.log(`  ${index} ${dateStr}  ${sizeKb}KB  ${hashShort}`);
  }

  if (backups.length > limit) {
    console.log(chalk.gray(`\n  ... and ${backups.length - limit} more backups`));
    console.log(chalk.gray(`  Use --limit to show more`));
  }

  console.log("");
  console.log("Restore commands:");
  console.log(chalk.cyan("  tick backup restore 0") + "          # Most recent backup");
  console.log(
    chalk.cyan("  tick backup restore 2026-02-17") + " # By date prefix"
  );
}

/**
 * Create a manual backup
 */
export async function backupCreateCommand(): Promise<void> {
  const cwd = process.cwd();

  try {
    const backup = await createBackup(cwd);
    const date = new Date(backup.timestamp);

    console.log(chalk.green("✓ Backup created"));
    console.log(`  Timestamp: ${date.toLocaleString()}`);
    console.log(`  Size: ${(backup.size / 1024).toFixed(1)}KB`);
    console.log(`  Hash: ${backup.hash}`);
    console.log(chalk.gray(`  File: ${backup.filepath}`));
  } catch (error: any) {
    if (error.code === "ENOENT") {
      throw new Error("TICK.md not found. Nothing to backup.");
    }
    throw error;
  }
}

/**
 * Restore from a backup
 */
export async function backupRestoreCommand(
  identifier: string,
  options: BackupRestoreOptions = {}
): Promise<void> {
  const cwd = process.cwd();

  // Parse identifier (number or timestamp string)
  const parsedId = /^\d+$/.test(identifier) ? parseInt(identifier, 10) : identifier;

  // Get the backup first to show what we're about to restore
  const backup = await getBackup(parsedId, cwd);

  if (!backup) {
    const backups = await listBackups(cwd);
    if (backups.length === 0) {
      throw new Error("No backups available.");
    }
    throw new Error(
      `Backup not found: ${identifier}\nUse 'tick backup list' to see available backups.`
    );
  }

  const date = new Date(backup.timestamp);
  console.log(`Restoring from backup:`);
  console.log(`  Timestamp: ${date.toLocaleString()}`);
  console.log(`  Hash: ${backup.hash}`);
  console.log("");

  if (!options.force) {
    console.log(
      chalk.yellow("⚠ This will replace your current TICK.md with the backup.")
    );
    console.log(chalk.yellow("  A backup of the current state will be created first."));
    console.log("");
    console.log("Use --force to proceed, or run:");
    console.log(chalk.cyan(`  tick backup restore ${identifier} --force`));
    return;
  }

  const result = await restoreBackup(parsedId, cwd);

  console.log(chalk.green("✓ Restored from backup"));
  console.log(`  Restored: ${date.toLocaleString()}`);

  if (result.previousBackup) {
    console.log(
      chalk.gray(`  Previous state backed up to: ${result.previousBackup.filename}`)
    );
  }

  console.log("");
  console.log("Run 'tick status' to see the restored state.");
}

/**
 * Show info about a specific backup
 */
export async function backupShowCommand(identifier: string): Promise<void> {
  const cwd = process.cwd();
  const parsedId = /^\d+$/.test(identifier) ? parseInt(identifier, 10) : identifier;
  const backup = await getBackup(parsedId, cwd);

  if (!backup) {
    throw new Error(`Backup not found: ${identifier}`);
  }

  const date = new Date(backup.timestamp);

  console.log(`📦 Backup Details\n`);
  console.log(`  Timestamp: ${date.toLocaleString()}`);
  console.log(`  ISO: ${backup.timestamp}`);
  console.log(`  Size: ${(backup.size / 1024).toFixed(1)}KB (${backup.size} bytes)`);
  console.log(`  Hash: ${backup.hash}`);
  console.log(`  File: ${backup.filepath}`);
}

/**
 * Clean up old backups, keeping only the specified number
 */
export async function backupCleanCommand(
  options: { keep?: number } = {}
): Promise<void> {
  const cwd = process.cwd();
  const keep = options.keep || 10;
  const backups = await listBackups(cwd);

  if (backups.length <= keep) {
    console.log(`Only ${backups.length} backups exist. Nothing to clean.`);
    return;
  }

  const toDelete = backups.slice(keep);
  const { unlink } = await import("fs/promises");

  for (const backup of toDelete) {
    await unlink(backup.filepath);
  }

  console.log(chalk.green(`✓ Cleaned up ${toDelete.length} old backups`));
  console.log(`  Kept: ${keep} most recent backups`);
}
