import fs from "fs";
import path from "path";
import type { TickFile, Task, TaskStatus, HistoryEntry } from "./types";
import { readTickFile, findTickFile } from "./tick-reader";

const TICK_FILENAME = "TICK.md";

/** Write a TickFile back to disk as TICK.md */
export function writeTickFile(tickFile: TickFile, tickPath?: string): void {
  const filePath = tickPath || findTickFile();
  if (!filePath) throw new Error("TICK.md not found.");
  const content = serializeTickFile(tickFile);
  fs.writeFileSync(filePath, content, "utf-8");
}

/** Serialize a TickFile to TICK.md format string */
export function serializeTickFile(tickFile: TickFile): string {
  const parts: string[] = [];

  // Frontmatter
  parts.push("---");
  parts.push(`project: ${tickFile.meta.project}`);
  if (tickFile.meta.title) parts.push(`title: ${tickFile.meta.title}`);
  parts.push(`schema_version: "${tickFile.meta.schema_version}"`);
  parts.push(`created: ${tickFile.meta.created}`);
  parts.push(`updated: ${tickFile.meta.updated}`);
  parts.push(`default_workflow: [${tickFile.meta.default_workflow.join(", ")}]`);
  parts.push(`id_prefix: ${tickFile.meta.id_prefix}`);
  parts.push(`next_id: ${tickFile.meta.next_id}`);
  parts.push("---");
  parts.push("");

  // Agents table
  if (tickFile.agents.length > 0) {
    parts.push("## Agents");
    parts.push("");
    parts.push("| Agent | Type | Role | Status | Working On | Last Active | Trust Level |");
    parts.push("|-------|------|------|--------|------------|-------------|-------------|");
    for (const agent of tickFile.agents) {
      const roles = agent.roles.join(", ");
      const workingOn = agent.working_on || "-";
      parts.push(`| ${agent.name} | ${agent.type} | ${roles} | ${agent.status} | ${workingOn} | ${agent.last_active} | ${agent.trust_level} |`);
    }
    parts.push("");
    parts.push("---");
    parts.push("");
  }

  // Tasks
  if (tickFile.tasks.length > 0) {
    parts.push("## Tasks");
    parts.push("");

    for (const task of tickFile.tasks) {
      parts.push(`### ${task.id} · ${task.title}`);
      parts.push("");
      parts.push("```yaml");

      // Build YAML metadata
      const yamlLines: string[] = [];
      yamlLines.push(`id: ${task.id}`);
      yamlLines.push(`status: ${task.status}`);
      yamlLines.push(`priority: ${task.priority}`);
      yamlLines.push(`assigned_to: ${task.assigned_to || "null"}`);
      yamlLines.push(`claimed_by: ${task.claimed_by || "null"}`);
      yamlLines.push(`created_by: ${task.created_by}`);
      yamlLines.push(`created_at: ${task.created_at}`);
      yamlLines.push(`updated_at: ${task.updated_at}`);
      if (task.due_date) yamlLines.push(`due_date: ${task.due_date}`);
      if (task.tags.length > 0) {
        yamlLines.push("tags:");
        for (const tag of task.tags) yamlLines.push(`  - ${tag}`);
      }
      if (task.depends_on.length > 0) yamlLines.push(`depends_on: [${task.depends_on.join(", ")}]`);
      if (task.blocks.length > 0) yamlLines.push(`blocks: [${task.blocks.join(", ")}]`);
      if (task.estimated_hours) yamlLines.push(`estimated_hours: ${task.estimated_hours}`);
      if (task.actual_hours) yamlLines.push(`actual_hours: ${task.actual_hours}`);
      if (task.detail_file) yamlLines.push(`detail_file: ${task.detail_file}`);

      if (task.history.length > 0) {
        yamlLines.push("history:");
        for (const h of task.history) {
          yamlLines.push(`  - ts: ${h.ts}`);
          yamlLines.push(`    who: ${h.who}`);
          yamlLines.push(`    action: ${h.action}`);
          if (h.note) yamlLines.push(`    note: ${JSON.stringify(h.note)}`);
          if (h.from) yamlLines.push(`    from: ${h.from}`);
          if (h.to) yamlLines.push(`    to: ${h.to}`);
        }
      }

      parts.push(yamlLines.join("\n"));
      parts.push("```");
      parts.push("");

      if (task.description) {
        for (const line of task.description.split("\n")) {
          parts.push(`> ${line}`);
        }
        parts.push("");
      }
    }
  }

  return parts.join("\n");
}

/** Update a task's status (used by kanban drag) */
export function updateTaskStatus(taskId: string, newStatus: TaskStatus, agent: string, tickPath?: string): TickFile {
  const filePath = tickPath || findTickFile();
  if (!filePath) throw new Error("TICK.md not found.");

  const tickFile = readTickFile(filePath);
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

  const tickFile = readTickFile(filePath);
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

  // Update agent record
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

  const tickFile = readTickFile(filePath);
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
