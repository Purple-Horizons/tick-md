import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import { parseTickFile, serializeTickFile } from "../parser/index.js";
import type { TaskStatus } from "../types.js";
import { autoCommit, shouldAutoCommit } from "../utils/auto-commit.js";
import { tickFileNotFoundError, taskNotFoundError } from "../utils/errors.js";

export interface BlockOptions {
  on: string;
  note?: string;
  commit?: boolean;
  noCommit?: boolean;
}

export interface UnblockOptions {
  status?: TaskStatus;
  note?: string;
  commit?: boolean;
  noCommit?: boolean;
}

async function load(cwd: string) {
  const tickPath = path.join(cwd, "TICK.md");
  try {
    await fs.access(tickPath);
  } catch {
    throw tickFileNotFoundError();
  }
  const tickFile = parseTickFile(await fs.readFile(tickPath, "utf-8"));
  return { tickPath, tickFile };
}

function touchAgent(tickFile: ReturnType<typeof parseTickFile>, agent: string, now: string) {
  const record = tickFile.agents.find((a) => a.name === agent);
  if (record) record.last_active = now;
}

/**
 * Mark a task blocked and record who/what it is waiting on.
 * The claim is kept so ownership stays visible while blocked.
 */
export async function blockCommand(
  taskId: string,
  agent: string,
  options: BlockOptions
): Promise<void> {
  const waitingOn = options.on?.trim();
  if (!waitingOn) {
    throw new Error("Blocked tasks must say what they are waiting on: --on <who>");
  }

  const cwd = process.cwd();
  const { tickPath, tickFile } = await load(cwd);
  const task = tickFile.tasks.find((t) => t.id === taskId);
  if (!task) throw taskNotFoundError(taskId, tickFile.tasks);
  if (task.status === "done") {
    throw new Error(`Task ${taskId} is done; reopen it before blocking.`);
  }

  const now = new Date().toISOString();
  const previous = task.status;
  task.status = "blocked";
  task.waiting_on = waitingOn;
  task.updated_at = now;
  task.history.push({
    ts: now,
    who: agent,
    action: "blocked",
    ...(previous !== "blocked" ? { from: previous, to: "blocked" } : {}),
    note: `waiting on ${waitingOn}${options.note ? `: ${options.note}` : ""}`,
  });
  touchAgent(tickFile, agent, now);
  tickFile.meta.updated = now;

  await fs.writeFile(tickPath, serializeTickFile(tickFile));

  console.log(chalk.yellow(`⏸ ${taskId} blocked — waiting on ${waitingOn}`));
  if (previous !== "blocked") console.log(`  Status: ${previous} → blocked`);

  if (await shouldAutoCommit(options, cwd)) {
    await autoCommit(`${taskId} blocked on ${waitingOn} by ${agent}`, cwd);
  }
}

/**
 * Clear a block. Defaults to in_progress if the task is claimed, else todo.
 */
export async function unblockCommand(
  taskId: string,
  agent: string,
  options: UnblockOptions = {}
): Promise<void> {
  const cwd = process.cwd();
  const { tickPath, tickFile } = await load(cwd);
  const task = tickFile.tasks.find((t) => t.id === taskId);
  if (!task) throw taskNotFoundError(taskId, tickFile.tasks);
  if (task.status !== "blocked" && !task.waiting_on) {
    throw new Error(`Task ${taskId} is not blocked (status: ${task.status})`);
  }

  const target: TaskStatus = options.status ?? (task.claimed_by ? "in_progress" : "todo");
  if (target === "blocked" || target === "done") {
    throw new Error(`Use 'tick done' to complete; unblock target must not be ${target}.`);
  }

  const now = new Date().toISOString();
  const previous = task.status;
  const wasWaitingOn = task.waiting_on;
  task.status = target;
  task.waiting_on = undefined;
  task.updated_at = now;
  task.history.push({
    ts: now,
    who: agent,
    action: "unblocked",
    from: previous,
    to: target,
    note: options.note ?? (wasWaitingOn ? `no longer waiting on ${wasWaitingOn}` : undefined),
  });
  touchAgent(tickFile, agent, now);
  tickFile.meta.updated = now;

  await fs.writeFile(tickPath, serializeTickFile(tickFile));

  console.log(chalk.green(`▶ ${taskId} unblocked`));
  console.log(`  Status: ${previous} → ${target}`);

  if (await shouldAutoCommit(options, cwd)) {
    await autoCommit(`${taskId} unblocked by ${agent}`, cwd);
  }
}
