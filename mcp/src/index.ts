#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import {
  findTickFile,
  readTickFileStateSync,
  writeTickFileAtomicSync,
  validateTickFile,
} from "@tick/core";
import { execSync } from "node:child_process";
import type { Agent, Priority, Task, TaskStatus, TickFile } from "@tick/core";

const server = new Server(
  { name: "tick-mcp-server", version: "1.2.0" },
  { capabilities: { tools: {} } }
);

function checkTickFile(): string {
  const file = findTickFile(process.cwd());
  if (!file) {
    throw new Error("TICK.md not found. Run 'tick init' first or navigate to a Tick project directory.");
  }
  return file;
}

function loadTickFile(): { tickPath: string; tickFile: TickFile; readState: { filePath: string; mtimeMs: number; size: number } } {
  const tickPath = checkTickFile();
  const { tickFile, state } = readTickFileStateSync(tickPath);
  return { tickPath, tickFile, readState: state };
}

function saveTickFile(
  tickPath: string,
  tickFile: TickFile,
  readState?: { filePath: string; mtimeMs: number; size: number }
): void {
  tickFile.meta.updated = new Date().toISOString();
  writeTickFileAtomicSync(tickFile, tickPath, readState);
}

function toArrayStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function nowIso(): string {
  return new Date().toISOString();
}

function addTask(
  tickFile: TickFile,
  params: {
    title: string;
    priority?: Priority;
    tags?: string[];
    assignedTo?: string;
    description?: string;
    dependsOn?: string[];
    estimatedHours?: number;
  }
): Task {
  const id = `${tickFile.meta.id_prefix}-${String(tickFile.meta.next_id).padStart(3, "0")}`;
  const now = nowIso();

  const task: Task = {
    id,
    title: params.title,
    status: "backlog",
    priority: params.priority || "medium",
    assigned_to: params.assignedTo || null,
    claimed_by: null,
    created_by: "@mcp",
    created_at: now,
    updated_at: now,
    tags: params.tags || [],
    depends_on: params.dependsOn || [],
    blocks: [],
    estimated_hours: params.estimatedHours,
    description: params.description || "",
    history: [{ ts: now, who: "@mcp", action: "created" }],
  };

  tickFile.tasks.push(task);
  tickFile.meta.next_id += 1;
  return task;
}

function getTaskOrThrow(tickFile: TickFile, taskId: string): Task {
  const task = tickFile.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);
  return task;
}

function claimTask(tickFile: TickFile, taskId: string, agent: string): void {
  const task = getTaskOrThrow(tickFile, taskId);
  if (task.claimed_by) throw new Error(`Task ${taskId} is already claimed by ${task.claimed_by}`);
  if (task.status === "done") throw new Error(`Task ${taskId} is already done`);

  const now = nowIso();
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
    ...(task.status !== previousStatus ? { from: previousStatus, to: task.status } : {}),
  });

  const agentRecord = tickFile.agents.find((a) => a.name === agent);
  if (agentRecord) {
    agentRecord.status = "working";
    agentRecord.working_on = task.id;
    agentRecord.last_active = now;
  }
}

function releaseTask(tickFile: TickFile, taskId: string, agent: string): void {
  const task = getTaskOrThrow(tickFile, taskId);
  if (task.claimed_by !== agent) {
    throw new Error(`Task ${taskId} is not claimed by ${agent}`);
  }

  const now = nowIso();
  const previousStatus = task.status;
  task.claimed_by = null;
  task.updated_at = now;
  if (task.status === "in_progress") task.status = "todo";

  task.history.push({
    ts: now,
    who: agent,
    action: "released",
    ...(task.status !== previousStatus ? { from: previousStatus, to: task.status } : {}),
  });

  const agentRecord = tickFile.agents.find((a) => a.name === agent);
  if (agentRecord) {
    agentRecord.status = "idle";
    agentRecord.working_on = null;
    agentRecord.last_active = now;
  }
}

function completeTask(tickFile: TickFile, taskId: string, agent: string): string[] {
  const task = getTaskOrThrow(tickFile, taskId);
  if (task.status === "done") return [];

  const now = nowIso();
  const previousStatus = task.status;
  task.status = "done";
  task.claimed_by = null;
  task.updated_at = now;
  task.history.push({ ts: now, who: agent, action: "completed", from: previousStatus, to: "done" });

  const agentRecord = tickFile.agents.find((a) => a.name === agent);
  if (agentRecord) {
    agentRecord.status = "idle";
    agentRecord.working_on = null;
    agentRecord.last_active = now;
  }

  const unblocked: string[] = [];
  for (const otherTask of tickFile.tasks) {
    if (!otherTask.depends_on.includes(taskId)) continue;
    const allDone = otherTask.depends_on.every((depId) => tickFile.tasks.find((t) => t.id === depId)?.status === "done");
    if (allDone && otherTask.status === "blocked") {
      otherTask.status = "todo";
      otherTask.updated_at = now;
      otherTask.history.push({
        ts: now,
        who: agent,
        action: "unblocked",
        from: "blocked",
        to: "todo",
        note: `Dependencies completed: ${taskId}`,
      });
      unblocked.push(otherTask.id);
    }
  }

  return unblocked;
}

function commentTask(tickFile: TickFile, taskId: string, agent: string, note: string): void {
  const task = getTaskOrThrow(tickFile, taskId);
  const now = nowIso();
  task.updated_at = now;
  task.history.push({ ts: now, who: agent, action: "commented", note });

  const agentRecord = tickFile.agents.find((a) => a.name === agent);
  if (agentRecord) {
    agentRecord.last_active = now;
  }
}

function registerAgent(
  tickFile: TickFile,
  params: { name: string; type?: "human" | "bot"; roles?: string[]; status?: "working" | "idle" | "offline" }
): Agent {
  const existing = tickFile.agents.find((a) => a.name === params.name);
  if (existing) return existing;

  const agent: Agent = {
    name: params.name,
    type: params.type || "human",
    roles: params.roles && params.roles.length > 0 ? params.roles : ["developer"],
    status: params.status || "idle",
    working_on: null,
    last_active: nowIso(),
    trust_level: "trusted",
  };

  tickFile.agents.push(agent);
  return agent;
}

function reopenTask(
  tickFile: TickFile,
  params: { taskId: string; agent: string; note?: string; status?: "backlog" | "todo" | "in_progress" | "reopened" }
): void {
  const task = getTaskOrThrow(tickFile, params.taskId);
  const now = nowIso();
  const previousStatus = task.status;
  task.status = params.status || "reopened";
  task.claimed_by = null;
  task.updated_at = now;
  task.history.push({
    ts: now,
    who: params.agent,
    action: "reopened",
    from: previousStatus,
    to: task.status,
    ...(params.note ? { note: params.note } : {}),
  });
}

function deleteTask(tickFile: TickFile, taskId: string, force = false): void {
  const task = getTaskOrThrow(tickFile, taskId);

  if (!force) {
    if (task.claimed_by || task.status === "in_progress") {
      throw new Error(`Task ${taskId} is active. Pass force=true to delete.`);
    }

    const dependents = tickFile.tasks.filter((t) => t.depends_on.includes(taskId) || t.blocks.includes(taskId));
    if (dependents.length > 0) {
      throw new Error(`Task ${taskId} has dependents (${dependents.map((d) => d.id).join(", ")}). Pass force=true to delete.`);
    }
  }

  tickFile.tasks = tickFile.tasks.filter((t) => t.id !== taskId);
}

function editTask(
  tickFile: TickFile,
  params: {
    taskId: string;
    agent: string;
    status?: TaskStatus;
    priority?: Priority;
    title?: string;
    description?: string;
    assignedTo?: string;
    tags?: string[];
    dependsOn?: string[];
    note?: string;
  }
): void {
  const task = getTaskOrThrow(tickFile, params.taskId);
  const now = nowIso();

  if (params.status && params.status !== task.status) {
    const prev = task.status;
    task.status = params.status;
    task.history.push({ ts: now, who: params.agent, action: "status_change", from: prev, to: params.status });
  }
  if (params.priority && params.priority !== task.priority) {
    const prev = task.priority;
    task.priority = params.priority;
    task.history.push({ ts: now, who: params.agent, action: "priority_change", from: prev, to: params.priority });
  }
  if (params.title) task.title = params.title;
  if (params.description !== undefined) task.description = params.description;
  if (params.assignedTo !== undefined) task.assigned_to = params.assignedTo || null;
  if (params.tags) task.tags = params.tags;
  if (params.dependsOn) task.depends_on = params.dependsOn;
  if (params.note) task.history.push({ ts: now, who: params.agent, action: "commented", note: params.note });

  task.updated_at = now;
}

function statusPayload(tickFile: TickFile): string {
  const tasksByStatus = tickFile.tasks.reduce((acc: Record<string, Task[]>, task: Task) => {
    if (!acc[task.status]) acc[task.status] = [];
    acc[task.status].push(task);
    return acc;
  }, {});

  const done = tickFile.tasks.filter((t) => t.status === "done").length;
  const total = tickFile.tasks.length;
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

  return JSON.stringify(
    {
      project: tickFile.meta.project,
      updated: tickFile.meta.updated,
      agents: tickFile.agents.map((a) => ({
        name: a.name,
        type: a.type,
        status: a.status,
        roles: a.roles,
        working_on: a.working_on,
      })),
      tasks: {
        total,
        done,
        percentage,
        by_status: Object.entries(tasksByStatus).map(([status, tasks]) => ({
          status,
          count: tasks.length,
          tasks: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            assigned_to: t.assigned_to,
            claimed_by: t.claimed_by,
          })),
        })),
      },
    },
    null,
    2
  );
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    { name: "tick_status", description: "Get the current status of the Tick project, including all tasks, agents, and progress summary.", inputSchema: { type: "object", properties: {} } },
    {
      name: "tick_add",
      description: "Create a new task in the Tick project. Returns the new task ID.",
      inputSchema: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title (required)" },
          priority: { type: "string", enum: ["urgent", "high", "medium", "low"], description: "Task priority (default: medium)" },
          tags: { type: "array", items: { type: "string" }, description: "Tags for the task" },
          assignedTo: { type: "string", description: "Agent to assign the task to" },
          description: { type: "string", description: "Detailed task description" },
          dependsOn: { type: "array", items: { type: "string" }, description: "Task IDs this task depends on" },
          estimatedHours: { type: "number", description: "Estimated hours to complete" },
        },
        required: ["title"],
      },
    },
    {
      name: "tick_claim",
      description: "Claim a task for an agent. Sets status to in_progress.",
      inputSchema: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "Task ID to claim (e.g., TASK-001)" },
          agent: { type: "string", description: "Agent name claiming the task (e.g., @agent-name)" },
        },
        required: ["taskId", "agent"],
      },
    },
    {
      name: "tick_release",
      description: "Release a claimed task back to todo status.",
      inputSchema: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "Task ID to release" },
          agent: { type: "string", description: "Agent name releasing the task" },
        },
        required: ["taskId", "agent"],
      },
    },
    {
      name: "tick_done",
      description: "Mark a task as complete. Automatically unblocks dependent tasks.",
      inputSchema: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "Task ID to complete" },
          agent: { type: "string", description: "Agent completing the task" },
        },
        required: ["taskId", "agent"],
      },
    },
    {
      name: "tick_comment",
      description: "Add a comment/note to a task's history.",
      inputSchema: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "Task ID to comment on" },
          agent: { type: "string", description: "Agent adding the comment" },
          note: { type: "string", description: "Comment text" },
        },
        required: ["taskId", "agent", "note"],
      },
    },
    { name: "tick_validate", description: "Validate the TICK.md file for errors and warnings.", inputSchema: { type: "object", properties: {} } },
    {
      name: "tick_agent_list",
      description: "List all registered agents with their current status and task assignments.",
      inputSchema: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["working", "idle", "offline"], description: "Filter agents by status" },
          type: { type: "string", enum: ["human", "bot"], description: "Filter agents by type" },
        },
      },
    },
    {
      name: "tick_agent_register",
      description: "Register a new agent (human or bot) in the Tick project.",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Agent name (e.g., @bot-name)" },
          type: { type: "string", enum: ["human", "bot"], description: "Agent type (default: human)" },
          roles: { type: "array", items: { type: "string" }, description: "Agent roles" },
          status: { type: "string", enum: ["working", "idle", "offline"], description: "Initial status (default: idle)" },
        },
        required: ["name"],
      },
    },
    {
      name: "tick_reopen",
      description: "Reopen a completed task.",
      inputSchema: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "Task ID to reopen" },
          agent: { type: "string", description: "Agent reopening the task" },
          note: { type: "string", description: "Reason for reopening" },
          status: { type: "string", enum: ["backlog", "todo", "in_progress", "reopened"], description: "Target status" },
        },
        required: ["taskId", "agent"],
      },
    },
    {
      name: "tick_delete",
      description: "Delete a task from the project.",
      inputSchema: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "Task ID to delete" },
          force: { type: "boolean", description: "Force delete" },
        },
        required: ["taskId"],
      },
    },
    {
      name: "tick_edit",
      description: "Edit task fields directly.",
      inputSchema: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "Task ID to edit" },
          agent: { type: "string", description: "Agent making the edit" },
          status: { type: "string", enum: ["backlog", "todo", "in_progress", "review", "done", "blocked", "reopened"], description: "New status" },
          priority: { type: "string", enum: ["urgent", "high", "medium", "low"], description: "New priority" },
          title: { type: "string", description: "New title" },
          description: { type: "string", description: "New description" },
          assignedTo: { type: "string", description: "New assignee" },
          tags: { type: "array", items: { type: "string" }, description: "New tags" },
          dependsOn: { type: "array", items: { type: "string" }, description: "New dependencies" },
          note: { type: "string", description: "Note for history entry" },
        },
        required: ["taskId", "agent"],
      },
    },
    {
      name: "tick_undo",
      description: "Undo the last tick commit by reverting it.",
      inputSchema: {
        type: "object",
        properties: {
          force: { type: "boolean", description: "Force revert even if not a tick commit" },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: rawArgs } = request.params;
  const args = (rawArgs || {}) as Record<string, unknown>;

  try {
    switch (name) {
      case "tick_status": {
        const { tickFile } = loadTickFile();
        return { content: [{ type: "text", text: statusPayload(tickFile) }] };
      }

      case "tick_add": {
        const title = asString(args.title);
        if (!title) throw new Error("title is required");

        const { tickPath, tickFile, readState } = loadTickFile();
        const task = addTask(tickFile, {
          title,
          priority: asString(args.priority) as Priority | undefined,
          tags: toArrayStrings(args.tags),
          assignedTo: asString(args.assignedTo),
          description: asString(args.description),
          dependsOn: toArrayStrings(args.dependsOn),
          estimatedHours: asNumber(args.estimatedHours),
        });
        saveTickFile(tickPath, tickFile, readState);

        return { content: [{ type: "text", text: `Created task ${task.id}: ${task.title}` }] };
      }

      case "tick_claim": {
        const taskId = asString(args.taskId);
        const agent = asString(args.agent);
        if (!taskId || !agent) throw new Error("taskId and agent are required");

        const { tickPath, tickFile, readState } = loadTickFile();
        claimTask(tickFile, taskId, agent);
        saveTickFile(tickPath, tickFile, readState);

        return { content: [{ type: "text", text: `Task ${taskId} claimed by ${agent}` }] };
      }

      case "tick_release": {
        const taskId = asString(args.taskId);
        const agent = asString(args.agent);
        if (!taskId || !agent) throw new Error("taskId and agent are required");

        const { tickPath, tickFile, readState } = loadTickFile();
        releaseTask(tickFile, taskId, agent);
        saveTickFile(tickPath, tickFile, readState);

        return { content: [{ type: "text", text: `Task ${taskId} released by ${agent}` }] };
      }

      case "tick_done": {
        const taskId = asString(args.taskId);
        const agent = asString(args.agent);
        if (!taskId || !agent) throw new Error("taskId and agent are required");

        const { tickPath, tickFile, readState } = loadTickFile();
        const unblocked = completeTask(tickFile, taskId, agent);
        saveTickFile(tickPath, tickFile, readState);

        const suffix = unblocked.length > 0 ? ` (unblocked: ${unblocked.join(", ")})` : "";
        return { content: [{ type: "text", text: `Task ${taskId} completed by ${agent}${suffix}` }] };
      }

      case "tick_comment": {
        const taskId = asString(args.taskId);
        const agent = asString(args.agent);
        const note = asString(args.note);
        if (!taskId || !agent || !note) throw new Error("taskId, agent, and note are required");

        const { tickPath, tickFile, readState } = loadTickFile();
        commentTask(tickFile, taskId, agent, note);
        saveTickFile(tickPath, tickFile, readState);

        return { content: [{ type: "text", text: `Added comment to ${taskId}` }] };
      }

      case "tick_validate": {
        const { tickFile } = loadTickFile();
        const result = validateTickFile(tickFile);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  valid: result.valid,
                  errors: result.errors,
                  warnings: result.warnings,
                  summary: {
                    tasks_validated: tickFile.tasks.length,
                    agents_registered: tickFile.agents.length,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "tick_agent_list": {
        const { tickFile } = loadTickFile();
        const status = asString(args.status);
        const type = asString(args.type);

        let agents = tickFile.agents;
        if (status) agents = agents.filter((a) => a.status === status);
        if (type) agents = agents.filter((a) => a.type === type);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  agents: agents.map((a) => ({
                    name: a.name,
                    type: a.type,
                    status: a.status,
                    roles: a.roles,
                    working_on: a.working_on,
                    trust_level: a.trust_level,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "tick_agent_register": {
        const nameValue = asString(args.name);
        if (!nameValue) throw new Error("name is required");

        const { tickPath, tickFile, readState } = loadTickFile();
        const registered = registerAgent(tickFile, {
          name: nameValue,
          type: (asString(args.type) as "human" | "bot" | undefined) || "human",
          roles: toArrayStrings(args.roles),
          status: (asString(args.status) as "working" | "idle" | "offline" | undefined) || "idle",
        });
        saveTickFile(tickPath, tickFile, readState);

        return {
          content: [
            {
              type: "text",
              text: `Agent ${registered.name} registered (type: ${registered.type}, roles: ${registered.roles.join(", ")})`,
            },
          ],
        };
      }

      case "tick_reopen": {
        const taskId = asString(args.taskId);
        const agent = asString(args.agent);
        if (!taskId || !agent) throw new Error("taskId and agent are required");

        const { tickPath, tickFile, readState } = loadTickFile();
        reopenTask(tickFile, {
          taskId,
          agent,
          note: asString(args.note),
          status: asString(args.status) as "backlog" | "todo" | "in_progress" | "reopened" | undefined,
        });
        saveTickFile(tickPath, tickFile, readState);

        return { content: [{ type: "text", text: `Task ${taskId} reopened by ${agent}` }] };
      }

      case "tick_delete": {
        const taskId = asString(args.taskId);
        if (!taskId) throw new Error("taskId is required");

        const { tickPath, tickFile, readState } = loadTickFile();
        deleteTask(tickFile, taskId, asBoolean(args.force) || false);
        saveTickFile(tickPath, tickFile, readState);

        return { content: [{ type: "text", text: `Task ${taskId} deleted` }] };
      }

      case "tick_edit": {
        const taskId = asString(args.taskId);
        const agent = asString(args.agent);
        if (!taskId || !agent) throw new Error("taskId and agent are required");

        const { tickPath, tickFile, readState } = loadTickFile();
        editTask(tickFile, {
          taskId,
          agent,
          status: asString(args.status) as TaskStatus | undefined,
          priority: asString(args.priority) as Priority | undefined,
          title: asString(args.title),
          description: asString(args.description),
          assignedTo: asString(args.assignedTo),
          tags: toArrayStrings(args.tags),
          dependsOn: toArrayStrings(args.dependsOn),
          note: asString(args.note),
        });
        saveTickFile(tickPath, tickFile, readState);

        return { content: [{ type: "text", text: `Task ${taskId} edited by ${agent}` }] };
      }

      case "tick_undo": {
        const force = asBoolean(args.force) || false;
        const log = execSync("git log -1 --pretty=%B", { encoding: "utf-8" }).trim();
        if (!force && !log.includes("[tick]")) {
          throw new Error("Last commit is not a tick commit. Use force=true to override.");
        }
        execSync("git revert --no-edit HEAD", { stdio: "pipe" });
        return { content: [{ type: "text", text: "Last tick commit reverted" }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${(error as Error).message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Tick MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
