import fs from "fs/promises";
import path from "path";

const SESSION_FILE = ".tick/session.json";

export interface SessionData {
  lastAgent?: string;
  lastTaskId?: string;
  updatedAt?: string;
}

/**
 * Load session data from .tick/session.json
 */
export async function loadSession(cwd: string = process.cwd()): Promise<SessionData> {
  const sessionPath = path.join(cwd, SESSION_FILE);

  try {
    const content = await fs.readFile(sessionPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

/**
 * Save session data to .tick/session.json
 */
export async function saveSession(
  data: Partial<SessionData>,
  cwd: string = process.cwd()
): Promise<void> {
  const sessionPath = path.join(cwd, SESSION_FILE);
  const dir = path.dirname(sessionPath);

  // Ensure .tick directory exists
  await fs.mkdir(dir, { recursive: true });

  // Load existing and merge
  const existing = await loadSession(cwd);
  const merged: SessionData = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await fs.writeFile(sessionPath, JSON.stringify(merged, null, 2));
}

/**
 * Get the last used agent, or try to determine from environment
 */
export async function getLastAgent(cwd: string = process.cwd()): Promise<string | null> {
  const session = await loadSession(cwd);

  if (session.lastAgent) {
    return session.lastAgent;
  }

  // Try environment variable
  if (process.env.TICK_AGENT) {
    return process.env.TICK_AGENT.startsWith("@")
      ? process.env.TICK_AGENT
      : `@${process.env.TICK_AGENT}`;
  }

  return null;
}

/**
 * Remember the agent for future commands
 */
export async function rememberAgent(
  agent: string,
  cwd: string = process.cwd()
): Promise<void> {
  await saveSession({ lastAgent: agent }, cwd);
}

/**
 * Get the current working task for an agent
 */
export async function getCurrentTask(
  agent: string,
  cwd: string = process.cwd()
): Promise<string | null> {
  // Import parseTickFile dynamically to avoid circular dependency
  const { parseTickFile } = await import("../parser/index.js");

  try {
    const tickPath = path.join(cwd, "TICK.md");
    const content = await fs.readFile(tickPath, "utf-8");
    const tickFile = parseTickFile(content);

    // Find task claimed by this agent
    const task = tickFile.tasks.find(
      (t) => t.claimed_by === agent && t.status === "in_progress"
    );

    return task?.id || null;
  } catch {
    return null;
  }
}

/**
 * Get available tasks that can be claimed (not done, not claimed)
 */
export async function getAvailableTasks(
  cwd: string = process.cwd()
): Promise<{ id: string; title: string; priority: string }[]> {
  const { parseTickFile } = await import("../parser/index.js");

  try {
    const tickPath = path.join(cwd, "TICK.md");
    const content = await fs.readFile(tickPath, "utf-8");
    const tickFile = parseTickFile(content);

    return tickFile.tasks
      .filter(
        (t) =>
          !t.claimed_by &&
          t.status !== "done" &&
          t.status !== "blocked"
      )
      .map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
      }));
  } catch {
    return [];
  }
}
