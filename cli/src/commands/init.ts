import fs from "fs/promises";
import path from "path";
import { generateDefaultTickFile } from "../parser/index.js";

export interface InitOptions {
  projectName?: string;
  force?: boolean;
}

/**
 * Initialize a new Tick project
 */
export async function initCommand(options: InitOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const tickPath = path.join(cwd, "TICK.md");
  const configDir = path.join(cwd, ".tick");

  // Check if TICK.md already exists
  try {
    await fs.access(tickPath);
    if (!options.force) {
      throw new Error(
        "TICK.md already exists. Use --force to overwrite."
      );
    }
  } catch (error: any) {
    if (error.code !== "ENOENT" && !options.force) {
      throw error;
    }
  }

  // Get project name (from option, package.json, or directory name)
  let projectName = options.projectName;

  if (!projectName) {
    // Try to read from package.json
    try {
      const packageJsonPath = path.join(cwd, "package.json");
      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, "utf-8")
      );
      projectName = packageJson.name;
    } catch {
      // Use directory name as fallback
      projectName = path.basename(cwd);
    }
  }

  // Generate default TICK.md
  const tickContent = generateDefaultTickFile(projectName || "untitled");

  // Create .tick directory
  await fs.mkdir(configDir, { recursive: true });

  // Create default config.yml
  const configContent = `# Tick Configuration
# See https://tick.md/docs/config for full options

# Git integration
git:
  auto_commit: true
  commit_prefix: "[tick]"
  push_on_sync: false

# File locking
locking:
  enabled: true
  timeout: 300  # seconds

# Agent defaults
agents:
  default_trust: restricted
  require_registration: true
`;

  await fs.writeFile(path.join(configDir, "config.yml"), configContent);

  // Create empty lock file
  await fs.writeFile(path.join(configDir, "lock"), "");

  // Write TICK.md
  await fs.writeFile(tickPath, tickContent);

  console.log(`✓ Initialized Tick project: ${projectName}`);
  console.log(`  Created: TICK.md`);
  console.log(`  Created: .tick/config.yml`);
  console.log(`  Created: .tick/lock`);
  console.log("");
  console.log("Next steps:");
  console.log("  1. Add your first task:    tick add \"Build authentication\"");
  console.log("  2. Register as an agent:   tick agent register @yourname");
  console.log("  3. Claim a task:           tick claim TASK-001 @yourname");
  console.log("");
  console.log("Learn more: https://tick.md/docs/getting-started");
}
