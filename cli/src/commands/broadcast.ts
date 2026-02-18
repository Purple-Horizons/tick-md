import fs from "fs/promises";
import path from "path";
import { parseTickFile, serializeTickFile } from "../parser/index.js";
import { autoCommit, shouldAutoCommit } from "../utils/auto-commit.js";

export interface BroadcastOptions {
  commit?: boolean;
  noCommit?: boolean;
}

export interface BroadcastEntry {
  ts: string;
  who: string;
  message: string;
  type?: "info" | "warning" | "alert" | "update";
}

/**
 * Broadcast a message to the squad log
 */
export async function broadcastCommand(
  agent: string,
  message: string,
  options: BroadcastOptions = {}
): Promise<void> {
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

  // Read content
  const content = await fs.readFile(tickPath, "utf-8");
  const tickFile = parseTickFile(content);

  const now = new Date().toISOString();

  // Normalize agent name
  const normalizedAgent = agent.startsWith("@") ? agent : `@${agent}`;

  // Create broadcast entry
  const entry: BroadcastEntry = {
    ts: now,
    who: normalizedAgent,
    message,
  };

  // Add to squad log section
  const updatedContent = addToSquadLog(content, entry);

  // Update the updated timestamp
  tickFile.meta.updated = now;

  // Write the updated content
  await fs.writeFile(tickPath, updatedContent);

  const timestamp = new Date(now).toLocaleTimeString();
  console.log(`📢 Broadcast sent at ${timestamp}`);
  console.log(`   From: ${normalizedAgent}`);
  console.log(`   Message: ${message}`);

  // Auto-commit if enabled
  if (await shouldAutoCommit(options, cwd)) {
    await autoCommit(`broadcast from ${normalizedAgent}`, cwd);
  }
}

/**
 * Add an entry to the Squad Log section
 */
function addToSquadLog(content: string, entry: BroadcastEntry): string {
  const logEntry = `- **[${entry.ts}]** ${entry.who}: ${entry.message}`;

  // Check if Squad Log section exists
  const squadLogMatch = content.match(/^## Squad Log\s*$/m);

  if (squadLogMatch) {
    // Find where to insert the new entry (after the header)
    const insertIndex = squadLogMatch.index! + squadLogMatch[0].length;
    const beforeLog = content.slice(0, insertIndex);
    const afterLog = content.slice(insertIndex);

    // Insert entry after the header, with proper newlines
    return `${beforeLog}\n\n${logEntry}${afterLog.startsWith("\n\n") ? afterLog : "\n" + afterLog}`;
  } else {
    // Create new Squad Log section at the end of the file
    const newSection = `\n## Squad Log\n\n${logEntry}\n`;

    // Insert before the Tasks section if it exists, otherwise at the end
    const tasksMatch = content.match(/^## Tasks\s*$/m);
    if (tasksMatch) {
      const insertIndex = tasksMatch.index!;
      return content.slice(0, insertIndex) + newSection + "\n" + content.slice(insertIndex);
    }

    return content.trimEnd() + "\n" + newSection;
  }
}

/**
 * List recent broadcasts from the squad log
 */
export async function listBroadcastsCommand(
  options: { limit?: number } = {}
): Promise<void> {
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

  const content = await fs.readFile(tickPath, "utf-8");

  // Extract Squad Log section
  const squadLogMatch = content.match(/^## Squad Log\s*\n([\s\S]*?)(?=\n## |\n---|\n$|$)/m);

  if (!squadLogMatch) {
    console.log("No broadcasts yet. Use 'tick broadcast @agent \"message\"' to send one.");
    return;
  }

  const logContent = squadLogMatch[1].trim();
  const entries = logContent.split("\n").filter(line => line.startsWith("- **["));

  const limit = options.limit || 10;
  const recentEntries = entries.slice(0, limit);

  if (recentEntries.length === 0) {
    console.log("No broadcasts yet. Use 'tick broadcast @agent \"message\"' to send one.");
    return;
  }

  console.log("📋 Recent Broadcasts:\n");

  for (const entry of recentEntries) {
    // Parse entry: - **[timestamp]** @agent: message
    const match = entry.match(/^- \*\*\[([^\]]+)\]\*\* (@\S+): (.+)$/);
    if (match) {
      const [, ts, who, message] = match;
      const date = new Date(ts);
      const timeStr = date.toLocaleString();
      console.log(`  ${timeStr}`);
      console.log(`  ${who}: ${message}`);
      console.log("");
    }
  }

  if (entries.length > limit) {
    console.log(`  ... and ${entries.length - limit} more broadcasts`);
  }
}
