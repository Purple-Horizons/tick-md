import { findTickFile, readTickFileSync, writeTickFileAtomicSync } from "@tick/core";
import type { TickFile, TaskStatus } from "./types";

/** Write a TickFile back to disk as TICK.md */
export function writeTickFile(tickFile: TickFile, tickPath?: string): void {
  const filePath = tickPath || findTickFile();
  if (!filePath) throw new Error("TICK.md not found.");
  writeTickFileAtomicSync(tickFile, filePath);
}

/** Update a task's status (used by kanban drag) */
export function updateTaskStatus(taskId: string, newStatus: TaskStatus, agent: string, tickPath?: string): TickFile {
  const filePath = tickPath || findTickFile();
  if (!filePath) throw new Error("TICK.md not found.");

  const tickFile = readTickFileSync(filePath);
  const task = tickFile.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  const now = new Date().toISOString();
  const previousStatus = task.status;
  task.status = newStatus;
  task.updated_at = now;

  task.history.push({
    ts: now,
    who: agent,
    action: "status_change",
    from: previousStatus,
    to: newStatus,
  });

  tickFile.meta.updated = now;
  writeTickFile(tickFile, filePath);
  return tickFile;
}

/** Claim a task for an agent */
export function claimTask(taskId: string, agent: string, tickPath?: string): TickFile {
  const filePath = tickPath || findTickFile();
  if (!filePath) throw new Error("TICK.md not found.");

  const tickFile = readTickFileSync(filePath);
  const task = tickFile.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  if (task.claimed_by) throw new Error(`Task ${taskId} is already claimed by ${task.claimed_by}`);
  if (task.status === "done") throw new Error(`Task ${taskId} is already done`);

  const now = new Date().toISOString();
  const previousStatus = task.status;
  task.claimed_by = agent;
  task.updated_at = now;

  if (task.status === "backlog" || task.status === "todo") {
    task.status = "in_progress";
  }

  task.history.push({
    ts: now,
    who: agent,
    action: "claimed",
    ...(previousStatus !== task.status ? { from: previousStatus, to: task.status } : {}),
  });

  const agentRecord = tickFile.agents.find((a) => a.name === agent);
  if (agentRecord) {
    agentRecord.status = "working";
    agentRecord.working_on = taskId;
    agentRecord.last_active = now;
  }

  tickFile.meta.updated = now;
  writeTickFile(tickFile, filePath);
  return tickFile;
}

/** Release a claimed task */
export function releaseTask(taskId: string, agent: string, tickPath?: string): TickFile {
  const filePath = tickPath || findTickFile();
  if (!filePath) throw new Error("TICK.md not found.");

  const tickFile = readTickFileSync(filePath);
  const task = tickFile.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  if (task.claimed_by !== agent) throw new Error(`Task ${taskId} is not claimed by ${agent}`);

  const now = new Date().toISOString();
  const previousStatus = task.status;
  task.claimed_by = null;
  task.updated_at = now;

  if (task.status === "in_progress") {
    task.status = "todo";
  }

  task.history.push({
    ts: now,
    who: agent,
    action: "released",
    ...(previousStatus !== task.status ? { from: previousStatus, to: task.status } : {}),
  });

  const agentRecord = tickFile.agents.find((a) => a.name === agent);
  if (agentRecord) {
    agentRecord.status = "idle";
    agentRecord.working_on = null;
    agentRecord.last_active = now;
  }

  tickFile.meta.updated = now;
  writeTickFile(tickFile, filePath);
  return tickFile;
}
