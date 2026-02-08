import { isGitRepo, gitAdd, gitCommit } from "./git.js";
import { loadConfig } from "./config.js";

/**
 * Auto-commit changes to TICK.md if configured
 * Silently skips if not in a git repo
 */
export async function autoCommit(
  message: string,
  cwd: string = process.cwd()
): Promise<void> {
  // Skip if not a git repo
  if (!isGitRepo(cwd)) {
    return;
  }

  try {
    // Load config to get commit prefix
    const config = await loadConfig(cwd);
    const prefix = config.git.commit_prefix || "[tick]";
    const fullMessage = `${prefix} ${message}`;

    // Stage TICK.md and .tick/ directory
    gitAdd(["TICK.md", ".tick/"], cwd);

    // Commit with prefixed message
    gitCommit({ message: fullMessage }, cwd);
  } catch (error: any) {
    // Silently ignore commit errors - user can still manually commit
    // This prevents auto-commit from breaking the workflow
    console.warn(`Warning: Auto-commit failed: ${error.message}`);
    console.warn("You can manually commit with: git add TICK.md .tick/ && git commit");
  }
}

/**
 * Determine if auto-commit should run based on flags and config
 */
export async function shouldAutoCommit(
  options: { commit?: boolean; noCommit?: boolean },
  cwd: string = process.cwd()
): Promise<boolean> {
  // --no-commit forces skip
  if (options.noCommit) {
    return false;
  }

  // --commit forces commit
  if (options.commit) {
    return true;
  }

  // Otherwise, use config
  const config = await loadConfig(cwd);
  return config.git.auto_commit;
}
