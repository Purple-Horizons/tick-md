#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "node:fs";

// @ts-ignore - CLI imports resolved at runtime
import { parseTickFile } from "../../cli/dist/parser/parse.js";
// @ts-ignore
import { serializeTickFile } from "../../cli/dist/parser/serialize.js";
// @ts-ignore
import { addCommand } from "../../cli/dist/commands/add.js";
// @ts-ignore
import { claimCommand, releaseCommand } from "../../cli/dist/commands/claim.js";
// @ts-ignore
import { doneCommand, commentCommand } from "../../cli/dist/commands/done.js";
// @ts-ignore
import { validateTickFile } from "../../cli/dist/utils/validator.js";
// @ts-ignore
import { registerAgentCommand, listAgentsCommand } from "../../cli/dist/commands/agent.js";

// Types copied from CLI
type Priority = "urgent" | "high" | "medium" | "low";
type TaskStatus = "backlog" | "todo" | "in_progress" | "review" | "done" | "blocked" | "reopened";
type AgentType = "human" | "bot";
type AgentStatus = "working" | "idle" | "offline";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Priority;
  assigned_to: string | null;
  claimed_by: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  due_date?: string;
  tags: string[];
  depends_on: string[];
  blocks: string[];
  estimated_hours?: number;
  actual_hours?: number;
  detail_file?: string;
  description: string;
  history: any[];
}

interface Agent {
  name: string;
  type: AgentType;
  roles: string[];
  status: AgentStatus;
  working_on: string | null;
  last_active: string;
  trust_level: string;
}

interface TickFile {
  meta: {
    project: string;
    updated: string;
    [key: string]: any;
  };
  agents: Agent[];
  tasks: Task[];
}

/**
 * Tick MCP Server
 * 
 * Provides MCP tools for AI agents to coordinate work via Tick.md files.
 * Exposes tick CLI functionality as MCP tools.
 */

const server = new Server(
  {
    name: "tick-mcp-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Helper to check if TICK.md exists
function checkTickFile(): void {
  if (!fs.existsSync("TICK.md")) {
    throw new Error("TICK.md not found. Run 'tick init' first or navigate to a Tick project directory.");
  }
}

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "tick_status",
        description: "Get the current status of the Tick project, including all tasks, agents, and progress summary.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "tick_add",
        description: "Create a new task in the Tick project. Returns the new task ID.",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Task title (required)",
            },
            priority: {
              type: "string",
              enum: ["urgent", "high", "medium", "low"],
              description: "Task priority (default: medium)",
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Tags for the task",
            },
            assignedTo: {
              type: "string",
              description: "Agent to assign the task to",
            },
            description: {
              type: "string",
              description: "Detailed task description",
            },
            dependsOn: {
              type: "array",
              items: { type: "string" },
              description: "Task IDs this task depends on",
            },
            estimatedHours: {
              type: "number",
              description: "Estimated hours to complete",
            },
          },
          required: ["title"],
        },
      },
      {
        name: "tick_claim",
        description: "Claim a task for an agent. Sets status to in_progress and acquires a lock.",
        inputSchema: {
          type: "object",
          properties: {
            taskId: {
              type: "string",
              description: "Task ID to claim (e.g., TASK-001)",
            },
            agent: {
              type: "string",
              description: "Agent name claiming the task (e.g., @agent-name)",
            },
          },
          required: ["taskId", "agent"],
        },
      },
      {
        name: "tick_release",
        description: "Release a claimed task back to todo status and remove the lock.",
        inputSchema: {
          type: "object",
          properties: {
            taskId: {
              type: "string",
              description: "Task ID to release",
            },
            agent: {
              type: "string",
              description: "Agent name releasing the task",
            },
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
            taskId: {
              type: "string",
              description: "Task ID to complete",
            },
            agent: {
              type: "string",
              description: "Agent completing the task",
            },
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
            taskId: {
              type: "string",
              description: "Task ID to comment on",
            },
            agent: {
              type: "string",
              description: "Agent adding the comment",
            },
            note: {
              type: "string",
              description: "Comment text",
            },
          },
          required: ["taskId", "agent", "note"],
        },
      },
      {
        name: "tick_validate",
        description: "Validate the TICK.md file for errors and warnings. Returns validation results.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "tick_agent_list",
        description: "List all registered agents with their current status and task assignments.",
        inputSchema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["working", "idle", "offline"],
              description: "Filter agents by status",
            },
            type: {
              type: "string",
              enum: ["human", "bot"],
              description: "Filter agents by type",
            },
          },
        },
      },
      {
        name: "tick_agent_register",
        description: "Register a new agent (human or bot) in the Tick project.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Agent name (e.g., @bot-name)",
            },
            type: {
              type: "string",
              enum: ["human", "bot"],
              description: "Agent type (default: human)",
            },
            roles: {
              type: "array",
              items: { type: "string" },
              description: "Agent roles (e.g., developer, reviewer)",
            },
            status: {
              type: "string",
              enum: ["working", "idle", "offline"],
              description: "Initial status (default: idle)",
            },
          },
          required: ["name"],
        },
      },
    ],
  };
});

// Tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "tick_status": {
        checkTickFile();
        const content = fs.readFileSync("TICK.md", "utf-8");
        const tickFile = parseTickFile(content);

        // Group tasks by status
        const tasksByStatus = tickFile.tasks.reduce((acc: Record<string, Task[]>, task: Task) => {
          if (!acc[task.status]) acc[task.status] = [];
          acc[task.status].push(task);
          return acc;
        }, {});

        // Calculate progress
        const done = tickFile.tasks.filter((t: Task) => t.status === "done").length;
        const total = tickFile.tasks.length;
        const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  project: tickFile.meta.project,
                  updated: tickFile.meta.updated,
                  agents: tickFile.agents.map((a: Agent) => ({
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
                      count: (tasks as Task[]).length,
                      tasks: (tasks as Task[]).map((t: Task) => ({
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
              ),
            },
          ],
        };
      }

      case "tick_add": {
        checkTickFile();
        const {
          title,
          priority = "medium",
          tags = [],
          assignedTo,
          description,
          dependsOn = [],
          estimatedHours,
        } = args as any;

        // Capture stdout to get task ID
        let taskId = "";
        const originalLog = console.log;
        console.log = (msg: string) => {
          if (msg.includes("Created TASK-")) {
            const match = msg.match(/TASK-\d+/);
            if (match) taskId = match[0];
          }
        };

        await addCommand(title, {
          priority: priority as Priority,
          tags,
          assignedTo,
          description,
          dependsOn,
          estimatedHours,
        });

        console.log = originalLog;

        return {
          content: [
            {
              type: "text",
              text: `Created task ${taskId}: ${title}`,
            },
          ],
        };
      }

      case "tick_claim": {
        checkTickFile();
        const { taskId, agent } = args as any;
        await claimCommand(taskId, agent);
        return {
          content: [
            {
              type: "text",
              text: `Task ${taskId} claimed by ${agent}`,
            },
          ],
        };
      }

      case "tick_release": {
        checkTickFile();
        const { taskId, agent } = args as any;
        await releaseCommand(taskId, agent);
        return {
          content: [
            {
              type: "text",
              text: `Task ${taskId} released by ${agent}`,
            },
          ],
        };
      }

      case "tick_done": {
        checkTickFile();
        const { taskId, agent } = args as any;
        await doneCommand(taskId, agent);
        return {
          content: [
            {
              type: "text",
              text: `Task ${taskId} completed by ${agent}`,
            },
          ],
        };
      }

      case "tick_comment": {
        checkTickFile();
        const { taskId, agent, note } = args as any;
        await commentCommand(taskId, agent, note);
        return {
          content: [
            {
              type: "text",
              text: `Added comment to ${taskId}`,
            },
          ],
        };
      }

      case "tick_validate": {
        checkTickFile();
        const content = fs.readFileSync("TICK.md", "utf-8");
        const tickFile = parseTickFile(content);
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
        checkTickFile();
        const content = fs.readFileSync("TICK.md", "utf-8");
        const tickFile = parseTickFile(content);

        let agents = tickFile.agents;
        const { status, type } = (args as any) || {};

        if (status) {
          agents = agents.filter((a: Agent) => a.status === status);
        }
        if (type) {
          agents = agents.filter((a: Agent) => a.type === type);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  agents: agents.map((a: Agent) => ({
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
        checkTickFile();
        const { name, type = "human", roles = ["developer"], status = "idle" } = args as any;

        // Suppress console output
        const originalLog = console.log;
        const originalError = console.error;
        console.log = () => {};
        console.error = () => {};

        await registerAgentCommand(name, {
          type,
          roles,
          status,
        });

        console.log = originalLog;
        console.error = originalError;

        return {
          content: [
            {
              type: "text",
              text: `Agent ${name} registered (type: ${type}, roles: ${roles.join(", ")})`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${(error as Error).message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Tick MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
