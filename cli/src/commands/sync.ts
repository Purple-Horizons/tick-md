import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import {
  isGitRepo,
  getGitStatus,
  gitInit,
  gitAdd,
  gitCommit,
  gitPull,
  gitPush,
  hasConflicts,
} from "../utils/git.js";
import { parseTickFile } from "../parser/index.js";

export interface SyncOptions {
  push?: boolean;
  pull?: boolean;
  message?: string;
  init?: boolean;
  remote?: string;
  branch?: string;
}

/**
 * Sync TICK.md changes to git
 */
export async function syncCommand(options: SyncOptions = {}): Promise<void> {
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

  // Check if git repo
  if (!isGitRepo(cwd)) {
    if (options.init) {
      console.log(chalk.yellow("Not a git repository. Initializing..."));
      gitInit(cwd);
      console.log("✓ Initialized git repository");
    } else {
      throw new Error(
        "Not a git repository. Run 'git init' or use 'tick sync --init'"
      );
    }
  }

  // Pull first if requested
  if (options.pull) {
    try {
      console.log(chalk.dim("Pulling from remote..."));
      gitPull(options.remote, options.branch, cwd);
      console.log("✓ Pulled latest changes");

      // Check for conflicts
      if (hasConflicts(cwd)) {
        throw new Error(
          "Merge conflicts detected. Resolve conflicts and run 'tick sync' again."
        );
      }
    } catch (error: any) {
      if (error.message.includes("no tracking information")) {
        console.log(
          chalk.yellow(
            "Warning: No remote tracking branch. Skipping pull."
          )
        );
      } else {
        throw error;
      }
    }
  }

  // Get git status
  const status = getGitStatus(cwd);

  // Check if TICK.md has changes
  const tickHasChanges =
    status.modified.includes("TICK.md") ||
    status.untracked.includes("TICK.md") ||
    status.modified.some((f) => f.startsWith(".tick/")) ||
    status.untracked.some((f) => f.startsWith(".tick/"));

  if (!tickHasChanges && !options.message) {
    console.log(chalk.dim("No changes to sync"));
    return;
  }

  // Parse TICK.md to generate commit message
  let commitMessage = options.message;

  if (!commitMessage) {
    try {
      const content = await fs.readFile(tickPath, "utf-8");
      const tickFile = parseTickFile(content);

      // Find the most recent completed task
      const recentCompletions = tickFile.tasks
        .filter((t) => t.status === "done")
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() -
            new Date(a.updated_at).getTime()
        )
        .slice(0, 1);

      if (recentCompletions.length > 0) {
        const task = recentCompletions[0];
        commitMessage = `[tick] ${task.id}: ${task.title}`;
      } else {
        // Find most recently updated task
        const recentTask = [...tickFile.tasks].sort(
          (a, b) =>
            new Date(b.updated_at).getTime() -
            new Date(a.updated_at).getTime()
        )[0];

        if (recentTask) {
          const lastAction =
            recentTask.history[recentTask.history.length - 1];
          commitMessage = `[tick] ${recentTask.id}: ${lastAction.action}`;
        } else {
          commitMessage = "[tick] Update project tasks";
        }
      }
    } catch {
      commitMessage = "[tick] Update project tasks";
    }
  }

  // Stage TICK.md and .tick/
  try {
    gitAdd(["TICK.md", ".tick/"], cwd);
    console.log("✓ Staged TICK.md and .tick/");
  } catch (error: any) {
    console.warn(chalk.yellow(`Warning: ${error.message}`));
  }

  // Commit
  try {
    const commitHash = gitCommit({ message: commitMessage }, cwd);
    console.log(`✓ Committed: ${chalk.green(commitMessage)}`);
    if (commitHash) {
      console.log(chalk.dim(`  ${commitHash.slice(0, 7)}`));
    }
  } catch (error: any) {
    if (error.message.includes("nothing to commit")) {
      console.log(chalk.dim("No changes to commit"));
    } else {
      throw error;
    }
  }

  // Push if requested
  if (options.push) {
    try {
      console.log(chalk.dim("Pushing to remote..."));
      gitPush(options.remote, options.branch, cwd);
      console.log("✓ Pushed to remote");
    } catch (error: any) {
      if (error.message.includes("no upstream branch")) {
        console.log(
          chalk.yellow(
            `Warning: No upstream branch. Run: git push -u origin ${status.branch}`
          )
        );
      } else {
        throw error;
      }
    }
  }

  console.log("");
  console.log(chalk.green("✓ Sync complete!"));

  if (!options.push) {
    console.log("");
    console.log("Tip: Use 'tick sync --push' to push to remote");
  }
}
