import fs from "fs/promises";
import path from "path";
import {
  checkForConflicts,
  getActiveAgents,
  detectGitConflicts,
  formatConflict,
} from "../utils/conflict.js";

export interface ConflictsOptions {
  verbose?: boolean;
}

/**
 * Check for conflicts and concurrent activity in TICK.md
 */
export async function conflictsCommand(
  options: ConflictsOptions = {}
): Promise<void> {
  const cwd = process.cwd();
  const tickPath = path.join(cwd, "TICK.md");

  // Check if TICK.md exists
  try {
    await fs.access(tickPath);
  } catch {
    throw new Error("TICK.md not found. Run 'tick init' to create a project.");
  }

  console.log("Checking for conflicts...\n");

  // Check for git conflicts
  const content = await fs.readFile(tickPath, "utf-8");
  const gitConflict = detectGitConflicts(content);

  let hasIssues = false;

  if (gitConflict) {
    hasIssues = true;
    console.log("❌ " + formatConflict(gitConflict));
    console.log("");
  }

  // Check for active agents
  const activeAgents = await getActiveAgents(cwd);

  if (activeAgents.length > 0) {
    console.log("Active agents:\n");
    for (const agent of activeAgents) {
      console.log(`  ${agent.agent}`);
      console.log(`    Working on: ${agent.workingOn}`);
      console.log(`    Last active: ${agent.lastActive}`);
      console.log("");
    }
  } else {
    console.log("No agents currently working.\n");
  }

  // Check for stale locks
  const lockPath = path.join(cwd, ".tick", "lock");
  try {
    const lockContent = await fs.readFile(lockPath, "utf-8");
    if (lockContent.trim()) {
      const locks = lockContent.trim().split("\n");
      console.log(`Lock file has ${locks.length} active lock(s).\n`);

      if (options.verbose) {
        console.log("Locks:");
        for (const line of locks) {
          const [taskId, agent, pid, timestamp] = line.split("\t");
          console.log(`  ${taskId}: ${agent} (PID ${pid}, since ${timestamp})`);
        }
        console.log("");
      }
    }
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      console.log(`Warning: Could not read lock file: ${error.message}\n`);
    }
  }

  // Check git status for TICK.md
  try {
    const { execSync } = await import("child_process");

    // Check if in a git repo
    try {
      execSync("git rev-parse --git-dir", { cwd, stdio: "pipe" });
    } catch {
      console.log("Not a git repository - skipping git checks.\n");
      if (!hasIssues) {
        console.log("✓ No conflicts detected.");
      }
      return;
    }

    // Check git status of TICK.md
    const status = execSync("git status --porcelain TICK.md", {
      cwd,
      encoding: "utf-8",
    }).trim();

    if (status) {
      const [flag] = status.split(" ");
      const statusMap: Record<string, string> = {
        M: "modified (staged)",
        " M": "modified (unstaged)",
        MM: "modified (staged + unstaged)",
        A: "added (staged)",
        "??": "untracked",
        UU: "unmerged (conflict)",
        AA: "both added (conflict)",
        DD: "both deleted (conflict)",
      };

      const statusText = statusMap[flag] || flag;
      console.log(`Git status: TICK.md is ${statusText}\n`);

      if (["UU", "AA", "DD"].includes(flag)) {
        hasIssues = true;
        console.log("❌ Git reports unmerged conflicts in TICK.md");
        console.log("   Run 'git status' for details.\n");
      }
    } else {
      console.log("Git status: TICK.md is clean (committed)\n");
    }

    // Check for uncommitted changes
    const diff = execSync("git diff --name-only TICK.md", {
      cwd,
      encoding: "utf-8",
    }).trim();

    const diffStaged = execSync("git diff --cached --name-only TICK.md", {
      cwd,
      encoding: "utf-8",
    }).trim();

    if (diff || diffStaged) {
      if (options.verbose) {
        console.log("Uncommitted changes in TICK.md:");
        if (diffStaged) {
          console.log("  - Staged changes ready to commit");
        }
        if (diff) {
          console.log("  - Unstaged changes in working directory");
        }
        console.log("");
      }
    }
  } catch (error: any) {
    if (options.verbose) {
      console.log(`Note: Git check failed: ${error.message}\n`);
    }
  }

  if (!hasIssues) {
    console.log("✓ No conflicts detected.");
  }
}
