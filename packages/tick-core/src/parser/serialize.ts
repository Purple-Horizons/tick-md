import YAML from "yaml";
import type { TickFile, Agent, Task, HistoryEntry, Deliverable } from "../types.js";

/**
 * Serialize a TickFile back to TICK.md format
 */
export function serializeTickFile(tickFile: TickFile): string {
  const parts: string[] = [];

  // 1. Frontmatter
  parts.push("---");
  parts.push(`project: ${tickFile.meta.project}`);
  if (tickFile.meta.title) {
    parts.push(`title: ${tickFile.meta.title}`);
  }
  parts.push(`schema_version: "${tickFile.meta.schema_version}"`);
  parts.push(`created: ${tickFile.meta.created}`);
  parts.push(`updated: ${tickFile.meta.updated}`);
  parts.push(
    `default_workflow: [${tickFile.meta.default_workflow.join(", ")}]`
  );
  parts.push(`id_prefix: ${tickFile.meta.id_prefix}`);
  parts.push(`next_id: ${tickFile.meta.next_id}`);
  parts.push("---");
  parts.push("");

  // 2. Agents table
  if (tickFile.agents.length > 0) {
    parts.push("## Agents");
    parts.push("");
    parts.push(
      "| Agent | Type | Role | Status | Working On | Last Active | Trust Level |"
    );
    parts.push(
      "|-------|------|------|--------|------------|-------------|-------------|"
    );

    for (const agent of tickFile.agents) {
      const roles = agent.roles.join(", ");
      const workingOn = agent.working_on || "-";
      parts.push(
        `| ${agent.name} | ${agent.type} | ${roles} | ${agent.status} | ${workingOn} | ${agent.last_active} | ${agent.trust_level} |`
      );
    }
    parts.push("");
    parts.push("---");
    parts.push("");
  }

  // 3. Tasks
  if (tickFile.tasks.length > 0) {
    parts.push("## Tasks");
    parts.push("");

    for (const task of tickFile.tasks) {
      parts.push(`### ${task.id} · ${task.title}`);
      parts.push("");

      // Task YAML metadata
      const metadata: Record<string, any> = {
        id: task.id,
        status: task.status,
        priority: task.priority,
        assigned_to: task.assigned_to,
        claimed_by: task.claimed_by,
        created_by: task.created_by,
        created_at: task.created_at,
        updated_at: task.updated_at,
      };

      if (task.due_date) metadata.due_date = task.due_date;
      if (task.tags.length > 0) metadata.tags = task.tags;
      if (task.depends_on.length > 0) metadata.depends_on = task.depends_on;
      if (task.blocks.length > 0) metadata.blocks = task.blocks;
      if (task.estimated_hours) metadata.estimated_hours = task.estimated_hours;
      if (task.actual_hours) metadata.actual_hours = task.actual_hours;
      if (task.detail_file) metadata.detail_file = task.detail_file;

      // Format deliverables
      if (task.deliverables && task.deliverables.length > 0) {
        metadata.deliverables = task.deliverables.map((d: Deliverable) => {
          const entry: Record<string, any> = {
            name: d.name,
            type: d.type,
          };
          if (d.path) entry.path = d.path;
          if (d.completed) entry.completed = d.completed;
          if (d.notes) entry.notes = d.notes;
          return entry;
        });
      }

      // Format history for better readability
      if (task.history.length > 0) {
        metadata.history = task.history.map((h: HistoryEntry) => {
          const entry: Record<string, any> = {
            ts: h.ts,
            who: h.who,
            action: h.action,
          };
          if (h.note) entry.note = h.note;
          if (h.from) entry.from = h.from;
          if (h.to) entry.to = h.to;
          return entry;
        });
      }

      parts.push("```yaml");
      parts.push(YAML.stringify(metadata).trim());
      parts.push("```");
      parts.push("");

      // Task description
      if (task.description) {
        const descLines = task.description
          .split("\n")
          .map((line) => `> ${line}`)
          .join("\n");
        parts.push(descLines);
        parts.push("");
      }
    }
  }

  return parts.join("\n");
}

/**
 * Generate a default TICK.md template for a new project
 */
export function generateDefaultTickFile(projectName: string): string {
  const now = new Date().toISOString();

  const defaultFile: TickFile = {
    meta: {
      project: projectName,
      schema_version: "1.0",
      created: now,
      updated: now,
      default_workflow: ["backlog", "todo", "in_progress", "review", "done"],
      id_prefix: "TASK",
      next_id: 1,
    },
    agents: [],
    tasks: [],
  };

  return serializeTickFile(defaultFile);
}
