import chalk from "chalk";
import { isGitRepo, getLastCommitMessage } from "../utils/git.js";
import { loadConfig } from "../utils/config.js";
import { execSync } from "child_process";
import { listBackups, restoreBackup, getBackup } from "../utils/backup.js";

export interface UndoOptions {
  force?: boolean;
  dryRun?: boolean;
  backup?: boolean | string; // true for most recent, or identifier
  list?: boolean;
}

/**
 * Undo the last tick commit by reverting it, or restore from backup
 */
export async function undoCommand(options: UndoOptions = {}): Promise<void> {
  const cwd = process.cwd();

  // Handle --list: show available backups
  if (options.list) {
    await showBackupList(cwd);
    return;
  }

  // Handle --backup: restore from backup instead of git revert
  if (options.backup !== undefined) {
    await undoFromBackup(options.backup, options.dryRun, cwd);
    return;
  }

  // Default: git revert mode
  // Check if in git repo
  if (!isGitRepo(cwd)) {
    throw new Error("Not a git repository. 'tick undo' requires git.");
  }

  // Get config to find commit prefix
  const config = await loadConfig(cwd);
  const commitPrefix = config?.git?.commit_prefix || "[tick]";

  // Get the last commit message
  const lastCommit = await getLastCommitMessage(cwd);
  if (!lastCommit) {
    throw new Error("No commits found in repository.");
  }

  // Check if it's a tick commit
  if (!lastCommit.startsWith(commitPrefix) && !options.force) {
    throw new Error(
      `Last commit is not a tick commit: "${lastCommit}"\n` +
        `Expected prefix: "${commitPrefix}"\n` +
        `Use --force to revert anyway.`
    );
  }

  // Show what we're about to do
  console.log(chalk.cyan("Last commit:"));
  console.log(`  ${lastCommit}`);
  console.log("");

  if (options.dryRun) {
    console.log(chalk.yellow("Dry run - would revert this commit"));
    return;
  }

  // Check for uncommitted changes
  try {
    const status = execSync("git status --porcelain", { cwd, encoding: "utf-8" });
    if (status.trim()) {
      throw new Error(
        "Working directory has uncommitted changes. Commit or stash them first."
      );
    }
  } catch (error: any) {
    if (error.message.includes("uncommitted changes")) {
      throw error;
    }
    throw new Error(`Failed to check git status: ${error.message}`);
  }

  // Revert the commit
  try {
    execSync('git revert HEAD --no-edit', { cwd, encoding: "utf-8" });
  } catch (error: any) {
    throw new Error(
      `Failed to revert commit: ${error.message}\n` +
        `You may need to resolve conflicts manually.`
    );
  }

  console.log(chalk.green("✓ Reverted last tick commit"));
  console.log("");
  console.log(chalk.gray("A new revert commit has been created."));
  console.log(chalk.gray("Use 'git log' to see the history."));
}

/**
 * Show available backups for undo
 */
async function showBackupList(cwd: string): Promise<void> {
  const backups = await listBackups(cwd);

  if (backups.length === 0) {
    console.log("No backups available.");
    console.log("");
    console.log(chalk.gray("Backups are created automatically before destructive operations"));
    console.log(chalk.gray("(delete, archive) or manually with 'tick backup create'."));
    return;
  }

  console.log(chalk.cyan("Available backups for undo:\n"));

  const limit = Math.min(backups.length, 10);
  for (let i = 0; i < limit; i++) {
    const backup = backups[i];
    const date = new Date(backup.timestamp);
    const dateStr = date.toLocaleString();
    const sizeKb = (backup.size / 1024).toFixed(1);
    const index = chalk.gray(`[${i}]`);
    const hashShort = chalk.gray(`#${backup.hash.slice(0, 8)}`);

    console.log(`  ${index} ${dateStr}  ${sizeKb}KB  ${hashShort}`);
  }

  if (backups.length > limit) {
    console.log(chalk.gray(`\n  ... and ${backups.length - limit} more backups`));
  }

  console.log("");
  console.log("Undo commands:");
  console.log(chalk.cyan("  tick undo --backup") + "     # Restore most recent backup");
  console.log(chalk.cyan("  tick undo --backup 0") + "   # Restore backup at index 0");
  console.log(chalk.cyan("  tick undo --backup 1") + "   # Restore backup at index 1");
}

/**
 * Undo by restoring from a backup
 */
async function undoFromBackup(
  identifier: boolean | string,
  dryRun: boolean | undefined,
  cwd: string
): Promise<void> {
  const backups = await listBackups(cwd);

  if (backups.length === 0) {
    throw new Error(
      "No backups available.\n" +
        "Backups are created before destructive operations (delete, archive)\n" +
        "or manually with 'tick backup create'."
    );
  }

  // Determine which backup to restore
  let backupIndex: number | string;
  if (identifier === true) {
    // --backup with no value: use most recent (index 0)
    backupIndex = 0;
  } else if (typeof identifier === "string") {
    // --backup <value>: parse as index or timestamp
    backupIndex = /^\d+$/.test(identifier) ? parseInt(identifier, 10) : identifier;
  } else {
    // Fallback to most recent
    backupIndex = 0;
  }

  const backup = await getBackup(backupIndex, cwd);
  if (!backup) {
    throw new Error(
      `Backup not found: ${identifier}\n` +
        `Use 'tick undo --list' to see available backups.`
    );
  }

  const date = new Date(backup.timestamp);
  console.log(chalk.cyan("Restoring from backup:"));
  console.log(`  Timestamp: ${date.toLocaleString()}`);
  console.log(`  Size: ${(backup.size / 1024).toFixed(1)}KB`);
  console.log(`  Hash: ${backup.hash}`);
  console.log("");

  if (dryRun) {
    console.log(chalk.yellow("Dry run - would restore this backup"));
    return;
  }

  const result = await restoreBackup(backupIndex, cwd);

  console.log(chalk.green("✓ Restored TICK.md from backup"));
  console.log(`  Restored: ${date.toLocaleString()}`);

  if (result.previousBackup) {
    console.log(
      chalk.gray(`  Current state backed up to: ${result.previousBackup.filename}`)
    );
  }

  console.log("");
  console.log(chalk.gray("Run 'tick status' to see the restored state."));
  console.log(chalk.gray("Use 'tick undo --backup' again to restore a different backup."));
}
