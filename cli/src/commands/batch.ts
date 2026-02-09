import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import { isGitRepo, gitAdd, gitCommit } from "../utils/git.js";
import { loadConfig } from "../utils/config.js";

const BATCH_FILE = ".tick/batch";

/**
 * Check if batch mode is active
 */
export async function isBatchMode(cwd: string = process.cwd()): Promise<boolean> {
  const batchPath = path.join(cwd, BATCH_FILE);
  try {
    await fs.access(batchPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Start batch mode - suppresses auto-commit until batch commit
 */
export async function batchStartCommand(): Promise<void> {
  const cwd = process.cwd();
  const tickDir = path.join(cwd, ".tick");
  const batchPath = path.join(cwd, BATCH_FILE);

  // Ensure .tick directory exists
  try {
    await fs.mkdir(tickDir, { recursive: true });
  } catch {
    // Directory exists
  }

  // Check if already in batch mode
  if (await isBatchMode(cwd)) {
    console.log(chalk.yellow("Already in batch mode."));
    console.log(chalk.gray("Use 'tick batch commit' to commit all changes."));
    return;
  }

  // Create batch marker file with timestamp
  const now = new Date().toISOString();
  await fs.writeFile(batchPath, `started: ${now}\n`);

  console.log(chalk.green("✓ Batch mode started"));
  console.log("");
  console.log(chalk.gray("Auto-commit is now suppressed. Changes will accumulate."));
  console.log(chalk.gray("Use 'tick batch commit' to commit all changes at once."));
  console.log(chalk.gray("Use 'tick batch abort' to exit without committing."));
}

/**
 * Commit all batched changes
 */
export async function batchCommitCommand(message?: string): Promise<void> {
  const cwd = process.cwd();
  const batchPath = path.join(cwd, BATCH_FILE);

  // Check if in batch mode
  if (!(await isBatchMode(cwd))) {
    throw new Error("Not in batch mode. Run 'tick batch start' first.");
  }

  // Check if in git repo
  if (!isGitRepo(cwd)) {
    throw new Error("Not a git repository.");
  }

  // Load config to get commit prefix
  const config = await loadConfig(cwd);
  const prefix = config.git.commit_prefix || "[tick]";
  const fullMessage = `${prefix} ${message || "Batch update"}`;

  try {
    // Stage TICK.md and .tick/ (excluding batch file initially)
    gitAdd(["TICK.md", ".tick/"], cwd);

    // Commit
    gitCommit({ message: fullMessage }, cwd);

    // Remove batch marker
    await fs.unlink(batchPath);

    console.log(chalk.green("✓ Batch committed"));
    console.log(`  Message: ${fullMessage}`);
    console.log("");
    console.log(chalk.gray("Batch mode ended. Auto-commit behavior restored."));
  } catch (error: any) {
    throw new Error(`Failed to commit batch: ${error.message}`);
  }
}

/**
 * Abort batch mode without committing
 */
export async function batchAbortCommand(): Promise<void> {
  const cwd = process.cwd();
  const batchPath = path.join(cwd, BATCH_FILE);

  // Check if in batch mode
  if (!(await isBatchMode(cwd))) {
    console.log(chalk.yellow("Not in batch mode."));
    return;
  }

  // Remove batch marker
  await fs.unlink(batchPath);

  console.log(chalk.green("✓ Batch mode aborted"));
  console.log(chalk.gray("Changes remain uncommitted. Auto-commit behavior restored."));
  console.log(chalk.gray("Use 'git add TICK.md && git commit' to manually commit."));
}

/**
 * Show batch status
 */
export async function batchStatusCommand(): Promise<void> {
  const cwd = process.cwd();
  const batchPath = path.join(cwd, BATCH_FILE);

  if (await isBatchMode(cwd)) {
    const content = await fs.readFile(batchPath, "utf-8");
    console.log(chalk.cyan("Batch mode: ACTIVE"));
    console.log(chalk.gray(content.trim()));
    console.log("");
    console.log(chalk.gray("Commands:"));
    console.log(chalk.gray("  tick batch commit  - Commit all changes"));
    console.log(chalk.gray("  tick batch abort   - Exit without committing"));
  } else {
    console.log(chalk.gray("Batch mode: inactive"));
    console.log(chalk.gray("Use 'tick batch start' to begin batching changes."));
  }
}
