import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import { parseTickFile, serializeTickFile } from "../parser/index.js";
import type { TaskStatus, Priority } from "../types.js";
import { autoCommit, shouldAutoCommit } from "../utils/auto-commit.js";

export interface EditOptions {
  status?: TaskStatus;
  priority?: Priority;
  title?: string;
  description?: string;
  assignedTo?: string;
  tags?: string[];
  dependsOn?: string[];
  blocks?: string[];
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: string;
  note?: string;
  commit?: boolean;
  noCommit?: boolean;
}

const VALID_STATUSES: TaskStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
  "blocked",
  "reopened",
];

const VALID_PRIORITIES: Priority[] = ["urgent", "high", "medium", "low"];

/**
 * Edit task fields directly
 */
export async function editCommand(
  taskId: string,
  agent: string,
  options: EditOptions = {}
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

  // Check that at least one field is being edited
  const editableFields = [
    "status",
    "priority",
    "title",
    "description",
    "assignedTo",
    "tags",
    "dependsOn",
    "blocks",
    "estimatedHours",
    "actualHours",
    "dueDate",
  ];
  const hasEdits = editableFields.some(
    (field) => options[field as keyof EditOptions] !== undefined
  );

  if (!hasEdits) {
    throw new Error(
      "No fields to edit. Use --status, --priority, --title, --description, --assigned-to, --tags, --depends-on, --blocks, --estimated-hours, --actual-hours, or --due-date."
    );
  }

  // Validate status if provided
  if (options.status && !VALID_STATUSES.includes(options.status)) {
    throw new Error(
      `Invalid status: ${options.status}. Must be one of: ${VALID_STATUSES.join(", ")}`
    );
  }

  // Validate priority if provided
  if (options.priority && !VALID_PRIORITIES.includes(options.priority)) {
    throw new Error(
      `Invalid priority: ${options.priority}. Must be one of: ${VALID_PRIORITIES.join(", ")}`
    );
  }

  // Read and parse TICK.md
  const content = await fs.readFile(tickPath, "utf-8");
  const tickFile = parseTickFile(content);

  // Find the task
  const task = tickFile.tasks.find((t) => t.id === taskId);
  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }

  // Validate dependency references if provided
  if (options.dependsOn) {
    for (const depId of options.dependsOn) {
      if (!tickFile.tasks.find((t) => t.id === depId)) {
        throw new Error(`Dependency ${depId} not found`);
      }
      if (depId === taskId) {
        throw new Error("Task cannot depend on itself");
      }
    }
  }

  if (options.blocks) {
    for (const blockId of options.blocks) {
      if (!tickFile.tasks.find((t) => t.id === blockId)) {
        throw new Error(`Blocked task ${blockId} not found`);
      }
      if (blockId === taskId) {
        throw new Error("Task cannot block itself");
      }
    }
  }

  // Track changes for history
  const changes: string[] = [];
  const now = new Date().toISOString();

  // Apply edits
  if (options.status !== undefined && options.status !== task.status) {
    const oldStatus = task.status;
    task.status = options.status;
    changes.push(`status: ${oldStatus} → ${options.status}`);
  }

  if (options.priority !== undefined && options.priority !== task.priority) {
    const oldPriority = task.priority;
    task.priority = options.priority;
    changes.push(`priority: ${oldPriority} → ${options.priority}`);
  }

  if (options.title !== undefined && options.title !== task.title) {
    const oldTitle = task.title;
    task.title = options.title;
    changes.push(`title: "${oldTitle}" → "${options.title}"`);
  }

  if (options.description !== undefined) {
    task.description = options.description;
    changes.push("description updated");
  }

  if (options.assignedTo !== undefined) {
    const oldAssigned = task.assigned_to;
    task.assigned_to = options.assignedTo || null;
    changes.push(`assigned_to: ${oldAssigned || "none"} → ${options.assignedTo || "none"}`);
  }

  if (options.tags !== undefined) {
    const oldTags = task.tags.join(", ");
    task.tags = options.tags;
    changes.push(`tags: [${oldTags}] → [${options.tags.join(", ")}]`);
  }

  if (options.dependsOn !== undefined) {
    const oldDeps = task.depends_on.join(", ");
    task.depends_on = options.dependsOn;
    changes.push(`depends_on: [${oldDeps}] → [${options.dependsOn.join(", ")}]`);
  }

  if (options.blocks !== undefined) {
    const oldBlocks = task.blocks.join(", ");
    task.blocks = options.blocks;
    changes.push(`blocks: [${oldBlocks}] → [${options.blocks.join(", ")}]`);
  }

  if (options.estimatedHours !== undefined) {
    const oldHours = task.estimated_hours;
    task.estimated_hours = options.estimatedHours;
    changes.push(`estimated_hours: ${oldHours ?? "none"} → ${options.estimatedHours}`);
  }

  if (options.actualHours !== undefined) {
    const oldHours = task.actual_hours;
    task.actual_hours = options.actualHours;
    changes.push(`actual_hours: ${oldHours ?? "none"} → ${options.actualHours}`);
  }

  if (options.dueDate !== undefined) {
    const oldDate = task.due_date;
    task.due_date = options.dueDate || undefined;
    changes.push(`due_date: ${oldDate || "none"} → ${options.dueDate || "none"}`);
  }

  // Update timestamp
  task.updated_at = now;

  // Add history entry
  task.history.push({
    ts: now,
    who: agent,
    action: "edited",
    note: options.note || changes.join("; "),
  });

  // Update agent last_active
  const agentRecord = tickFile.agents.find((a) => a.name === agent);
  if (agentRecord) {
    agentRecord.last_active = now;
  }

  // Update metadata
  tickFile.meta.updated = now;

  // Serialize and write
  const newContent = serializeTickFile(tickFile);
  await fs.writeFile(tickPath, newContent);

  console.log(chalk.green(`✓ Edited ${taskId}`));
  for (const change of changes) {
    console.log(`  ${change}`);
  }
  console.log(`  Edited by: ${agent}`);

  // Auto-commit if enabled
  if (await shouldAutoCommit(options, cwd)) {
    await autoCommit(`${taskId} edited by ${agent}`, cwd);
  }
}
