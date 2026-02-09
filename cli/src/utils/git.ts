import { execSync } from "child_process";
import path from "path";

export interface GitStatus {
  isGitRepo: boolean;
  hasChanges: boolean;
  branch: string;
  modified: string[];
  untracked: string[];
}

export interface CommitOptions {
  message: string;
  allowEmpty?: boolean;
}

export interface SyncOptions {
  push?: boolean;
  pull?: boolean;
  remote?: string;
  branch?: string;
}

/**
 * Check if current directory is a git repository
 */
export function isGitRepo(cwd: string = process.cwd()): boolean {
  try {
    execSync("git rev-parse --git-dir", {
      cwd,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get git status information
 */
export function getGitStatus(cwd: string = process.cwd()): GitStatus {
  if (!isGitRepo(cwd)) {
    return {
      isGitRepo: false,
      hasChanges: false,
      branch: "",
      modified: [],
      untracked: [],
    };
  }

  try {
    // Get current branch (handle new repos with no commits)
    let branch = "main";
    try {
      branch = execSync("git rev-parse --abbrev-ref HEAD", {
        cwd,
        encoding: "utf-8",
      }).trim();
    } catch {
      // New repo with no commits, use default branch name
      branch = "main";
    }

    // Get modified files
    const modifiedOutput = execSync("git diff --name-only", {
      cwd,
      encoding: "utf-8",
    }).trim();
    const modified = modifiedOutput ? modifiedOutput.split("\n") : [];

    // Get untracked files
    const untrackedOutput = execSync(
      "git ls-files --others --exclude-standard",
      {
        cwd,
        encoding: "utf-8",
      }
    ).trim();
    const untracked = untrackedOutput ? untrackedOutput.split("\n") : [];

    return {
      isGitRepo: true,
      hasChanges: modified.length > 0 || untracked.length > 0,
      branch,
      modified,
      untracked,
    };
  } catch (error: any) {
    throw new Error(`Failed to get git status: ${error.message}`);
  }
}

/**
 * Stage files for commit
 */
export function gitAdd(
  files: string[],
  cwd: string = process.cwd()
): void {
  if (!isGitRepo(cwd)) {
    throw new Error("Not a git repository");
  }

  try {
    const fileList = files.join(" ");
    execSync(`git add ${fileList}`, {
      cwd,
      stdio: "ignore",
    });
  } catch (error: any) {
    throw new Error(`Failed to stage files: ${error.message}`);
  }
}

/**
 * Commit changes
 */
export function gitCommit(
  options: CommitOptions,
  cwd: string = process.cwd()
): string {
  if (!isGitRepo(cwd)) {
    throw new Error("Not a git repository");
  }

  try {
    const emptyFlag = options.allowEmpty ? "--allow-empty " : "";
    const message = options.message.replace(/"/g, '\\"');
    
    const commitHash = execSync(
      `git commit ${emptyFlag}-m "${message}"`,
      {
        cwd,
        encoding: "utf-8",
      }
    ).trim();

    // Extract commit hash from output
    const match = commitHash.match(/\[.+?\s+([a-f0-9]+)\]/);
    return match ? match[1] : "";
  } catch (error: any) {
    throw new Error(`Failed to commit: ${error.message}`);
  }
}

/**
 * Pull from remote
 */
export function gitPull(
  remote: string = "origin",
  branch?: string,
  cwd: string = process.cwd()
): void {
  if (!isGitRepo(cwd)) {
    throw new Error("Not a git repository");
  }

  try {
    const branchArg = branch ? ` ${branch}` : "";
    execSync(`git pull ${remote}${branchArg}`, {
      cwd,
      stdio: "pipe",
    });
  } catch (error: any) {
    throw new Error(`Failed to pull: ${error.message}`);
  }
}

/**
 * Push to remote
 */
export function gitPush(
  remote: string = "origin",
  branch?: string,
  cwd: string = process.cwd()
): void {
  if (!isGitRepo(cwd)) {
    throw new Error("Not a git repository");
  }

  try {
    const branchArg = branch ? ` ${branch}` : "";
    execSync(`git push ${remote}${branchArg}`, {
      cwd,
      stdio: "pipe",
    });
  } catch (error: any) {
    throw new Error(`Failed to push: ${error.message}`);
  }
}

/**
 * Initialize git repository
 */
export function gitInit(cwd: string = process.cwd()): void {
  try {
    execSync("git init", {
      cwd,
      stdio: "ignore",
    });
  } catch (error: any) {
    throw new Error(`Failed to initialize git: ${error.message}`);
  }
}

/**
 * Check if there are conflicts
 */
export function hasConflicts(cwd: string = process.cwd()): boolean {
  if (!isGitRepo(cwd)) {
    return false;
  }

  try {
    const conflicts = execSync("git diff --name-only --diff-filter=U", {
      cwd,
      encoding: "utf-8",
    }).trim();
    return conflicts.length > 0;
  } catch {
    return false;
  }
}

/**
 * Get the last commit message
 */
export function getLastCommitMessage(cwd: string = process.cwd()): string {
  if (!isGitRepo(cwd)) {
    return "";
  }

  try {
    return execSync("git log -1 --pretty=%B", {
      cwd,
      encoding: "utf-8",
    }).trim();
  } catch {
    return "";
  }
}

/**
 * Get the git user name from config
 */
export function getGitUser(cwd: string = process.cwd()): string | null {
  try {
    const gitName = execSync("git config user.name", {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (gitName) {
      return `@${gitName.toLowerCase().replace(/\s+/g, "-")}`;
    }
  } catch {
    // Git not available or not configured
  }
  return null;
}
