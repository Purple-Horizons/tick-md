import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface FileState {
  mtime: number;
  hash: string;
  size: number;
}

export interface ConflictInfo {
  type: "modified" | "git_conflict" | "concurrent_agent";
  message: string;
  details?: Record<string, any>;
}

/**
 * Compute a quick hash of file content for change detection
 */
export function computeHash(content: string): string {
  return crypto.createHash("md5").update(content).digest("hex");
}

/**
 * Get the current state of a file for later comparison
 */
export async function getFileState(filePath: string): Promise<FileState | null> {
  try {
    const stat = await fs.stat(filePath);
    const content = await fs.readFile(filePath, "utf-8");
    return {
      mtime: stat.mtimeMs,
      hash: computeHash(content),
      size: stat.size,
    };
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

/**
 * Check if a file has been modified since a given state
 */
export async function hasFileChanged(
  filePath: string,
  previousState: FileState
): Promise<boolean> {
  const currentState = await getFileState(filePath);
  if (!currentState) {
    return true; // File deleted
  }

  // Quick check: mtime and size
  if (
    currentState.mtime === previousState.mtime &&
    currentState.size === previousState.size
  ) {
    return false;
  }

  // Slower check: content hash (in case mtime changed but content didn't)
  return currentState.hash !== previousState.hash;
}

/**
 * Detect git merge conflicts in file content
 */
export function detectGitConflicts(content: string): ConflictInfo | null {
  const conflictMarkers = [
    /^<<<<<<< /m,
    /^=======/m,
    /^>>>>>>> /m,
  ];

  const hasConflict = conflictMarkers.every((marker) => marker.test(content));

  if (hasConflict) {
    // Extract conflict sections
    const matches = content.match(/<<<<<<< ([^\n]+)/g);
    const branches = matches
      ? matches.map((m) => m.replace("<<<<<<< ", ""))
      : [];

    return {
      type: "git_conflict",
      message: "TICK.md contains unresolved git merge conflicts",
      details: {
        branches,
        conflictCount: matches?.length || 0,
      },
    };
  }

  return null;
}

/**
 * Check for concurrent modifications by other agents
 */
export async function checkConcurrentModification(
  filePath: string,
  expectedState: FileState
): Promise<ConflictInfo | null> {
  const changed = await hasFileChanged(filePath, expectedState);

  if (changed) {
    return {
      type: "modified",
      message: "TICK.md was modified by another process since you last read it",
      details: {
        expectedHash: expectedState.hash,
        expectedMtime: new Date(expectedState.mtime).toISOString(),
      },
    };
  }

  return null;
}

/**
 * Get list of currently active agents (for warning purposes)
 */
export async function getActiveAgents(
  cwd: string = process.cwd()
): Promise<{ agent: string; workingOn: string; lastActive: string }[]> {
  const tickPath = path.join(cwd, "TICK.md");

  try {
    const content = await fs.readFile(tickPath, "utf-8");

    // Parse agents table
    const lines = content.split("\n");
    const tableStart = lines.findIndex((l) =>
      l.includes("| Agent | Type | Role | Status |")
    );

    if (tableStart === -1) {
      return [];
    }

    const activeAgents: { agent: string; workingOn: string; lastActive: string }[] = [];

    // Skip header and separator
    for (let i = tableStart + 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith("|") || line === "---") {
        break;
      }

      const cells = line
        .split("|")
        .map((c) => c.trim())
        .filter((c) => c);

      if (cells.length >= 6) {
        const [agent, , , status, workingOn, lastActive] = cells;

        if (status === "working" && workingOn && workingOn !== "-") {
          activeAgents.push({
            agent,
            workingOn,
            lastActive,
          });
        }
      }
    }

    return activeAgents;
  } catch {
    return [];
  }
}

/**
 * Warn about other active agents working on tasks
 */
export async function warnAboutActiveAgents(
  currentAgent: string,
  cwd: string = process.cwd()
): Promise<string[]> {
  const activeAgents = await getActiveAgents(cwd);
  const warnings: string[] = [];

  const otherAgents = activeAgents.filter((a) => a.agent !== currentAgent);

  if (otherAgents.length > 0) {
    for (const agent of otherAgents) {
      warnings.push(
        `${agent.agent} is working on ${agent.workingOn} (last active: ${agent.lastActive})`
      );
    }
  }

  return warnings;
}

/**
 * Comprehensive conflict check before modifying TICK.md
 */
export async function checkForConflicts(
  cwd: string = process.cwd(),
  expectedState?: FileState
): Promise<ConflictInfo[]> {
  const conflicts: ConflictInfo[] = [];
  const tickPath = path.join(cwd, "TICK.md");

  try {
    // Check for git conflicts
    const content = await fs.readFile(tickPath, "utf-8");
    const gitConflict = detectGitConflicts(content);
    if (gitConflict) {
      conflicts.push(gitConflict);
    }

    // Check for concurrent modifications
    if (expectedState) {
      const modConflict = await checkConcurrentModification(tickPath, expectedState);
      if (modConflict) {
        conflicts.push(modConflict);
      }
    }
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  return conflicts;
}

/**
 * Format conflict info for display
 */
export function formatConflict(conflict: ConflictInfo): string {
  const lines: string[] = [];

  switch (conflict.type) {
    case "git_conflict":
      lines.push("Git Merge Conflict Detected");
      lines.push(conflict.message);
      if (conflict.details?.conflictCount) {
        lines.push(`  ${conflict.details.conflictCount} conflict(s) found`);
      }
      lines.push("");
      lines.push("To resolve:");
      lines.push("  1. Open TICK.md in your editor");
      lines.push("  2. Look for <<<<<<< markers");
      lines.push("  3. Choose the correct version for each conflict");
      lines.push("  4. Remove the conflict markers");
      lines.push("  5. Run: git add TICK.md && git commit");
      break;

    case "modified":
      lines.push("Concurrent Modification Detected");
      lines.push(conflict.message);
      lines.push("");
      lines.push("Another agent or process modified TICK.md while you were working.");
      lines.push("To resolve:");
      lines.push("  1. Re-read the current state: tick status");
      lines.push("  2. Re-run your command to get the latest version");
      break;

    case "concurrent_agent":
      lines.push("Concurrent Agent Warning");
      lines.push(conflict.message);
      break;
  }

  return lines.join("\n");
}

/**
 * Create a conflict-aware file modifier
 * This wraps a modification function with conflict detection
 */
export async function withConflictDetection<T>(
  cwd: string,
  operation: () => Promise<T>,
  options: { strict?: boolean } = {}
): Promise<T> {
  const tickPath = path.join(cwd, "TICK.md");

  // Get initial state before operation
  const initialState = await getFileState(tickPath);

  // Check for pre-existing conflicts
  const preConflicts = await checkForConflicts(cwd);
  if (preConflicts.length > 0 && options.strict) {
    const formatted = preConflicts.map(formatConflict).join("\n\n");
    throw new Error(`Cannot proceed due to conflicts:\n\n${formatted}`);
  }

  // Perform the operation
  const result = await operation();

  return result;
}
