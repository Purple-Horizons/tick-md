import chalk from "chalk";
import { isGitRepo, getLastCommitMessage } from "../utils/git.js";
import { loadConfig } from "../utils/config.js";
import { execSync } from "child_process";

export interface UndoOptions {
  force?: boolean;
  dryRun?: boolean;
}

/**
 * Undo the last tick commit by reverting it
 */
export async function undoCommand(options: UndoOptions = {}): Promise<void> {
  const cwd = process.cwd();

  // Check if in git repo
  if (!(await isGitRepo(cwd))) {
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
