import matter from "gray-matter";
import YAML from "yaml";
import type {
  TickFile,
  ProjectMeta,
  Agent,
  Task,
  AgentStatus,
  AgentType,
  TrustLevel,
  TaskStatus,
  Priority,
  HistoryEntry,
  Deliverable,
  ParseError,
} from "../types.js";

/** Re-export ParseError for convenience */
export type { ParseError } from "../types.js";

/**
 * Parse a TICK.md file into structured data
 * Gracefully handles errors and returns partial results with error info
 */
export function parseTickFile(content: string): TickFile {
  const result = parseTickFileWithErrors(content);
  return result;
}

/**
 * Parse a TICK.md file with detailed error reporting
 */
export function parseTickFileWithErrors(content: string): TickFile & { parseErrors: ParseError[] } {
  const parseErrors: ParseError[] = [];
  let frontmatter: Record<string, any> = {};
  let body = content;

  // Parse YAML frontmatter using gray-matter (with error handling)
  try {
    const parsed = matter(content);
    frontmatter = parsed.data || {};
    body = parsed.content;
  } catch (error: any) {
    parseErrors.push({
      type: "frontmatter",
      message: `Failed to parse frontmatter: ${error.message}`,
      recoverable: true,
    });
    // Try to extract body without frontmatter parsing
    const fmEnd = content.indexOf("---", 3);
    if (fmEnd !== -1) {
      body = content.slice(fmEnd + 3);
    }
  }

  // Extract project metadata from frontmatter (with defaults)
  const meta: ProjectMeta = {
    project: safeString(frontmatter.project, "untitled"),
    title: frontmatter.title,
    schema_version: safeString(frontmatter.schema_version, "1.0"),
    created: safeString(frontmatter.created, new Date().toISOString()),
    updated: safeString(frontmatter.updated, new Date().toISOString()),
    default_workflow: safeArray(frontmatter.default_workflow, [
      "backlog",
      "todo",
      "in_progress",
      "review",
      "done",
    ]),
    id_prefix: safeString(frontmatter.id_prefix, "TASK"),
    next_id: safeNumber(frontmatter.next_id, 1),
  };

  // Parse agents table (with error handling)
  let agents: Agent[] = [];
  try {
    agents = parseAgentsTable(body);
  } catch (error: any) {
    parseErrors.push({
      type: "agent",
      message: `Failed to parse agents table: ${error.message}`,
      recoverable: true,
    });
  }

  // Parse task blocks (with error collection)
  const { tasks, errors: taskErrors } = parseTaskBlocksWithErrors(body);
  parseErrors.push(...taskErrors);

  return {
    meta,
    agents,
    tasks,
    raw_content: content,
    parseErrors,
  };
}

/** Safely extract string value with default */
function safeString(value: any, defaultValue: string): string {
  if (typeof value === "string") return value;
  if (value !== undefined && value !== null) return String(value);
  return defaultValue;
}

/** Safely extract number value with default */
function safeNumber(value: any, defaultValue: number): number {
  if (typeof value === "number" && !isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) return parsed;
  }
  return defaultValue;
}

/** Safely extract array value with default */
function safeArray<T>(value: any, defaultValue: T[]): T[] {
  if (Array.isArray(value)) return value;
  return defaultValue;
}

/**
 * Parse the agents table from Markdown
 * Format: | Agent | Type | Role | Status | Working On | Last Active | Trust Level |
 */
function parseAgentsTable(content: string): Agent[] {
  const agents: Agent[] = [];

  // Find the agents section (starts with ## Agents)
  const agentsMatch = content.match(
    /##\s+Agents\s*\n\n([\s\S]*?)(?=\n##|\n---|\n###|$)/i
  );
  if (!agentsMatch) return agents;

  const agentsSection = agentsMatch[1];

  // Split into lines and find table rows
  const lines = agentsSection.split("\n");
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and header separator
    if (!trimmed || trimmed.startsWith("|---") || trimmed.startsWith("| ---")) {
      continue;
    }

    // Check if this is a table row
    if (trimmed.startsWith("|")) {
      const cells = trimmed
        .split("|")
        .map((c) => c.trim())
        .filter((c) => c);

      // Skip header row (contains "Agent" or "Type")
      if (
        cells.some(
          (c) =>
            c === "Agent" ||
            c === "Type" ||
            c === "Role" ||
            c === "Status" ||
            c === "Working On"
        )
      ) {
        inTable = true;
        continue;
      }

      if (inTable && cells.length >= 6) {
        const [name, type, roleStr, status, workingOn, lastActive, trustLevel] =
          cells;

        // Parse roles (can be comma-separated)
        const roles = roleStr.split(",").map((r) => r.trim());

        agents.push({
          name: name.trim(),
          type: (type.toLowerCase() as AgentType) || "bot",
          roles,
          status: (status.toLowerCase() as AgentStatus) || "offline",
          working_on: workingOn === "-" ? null : workingOn.trim(),
          last_active: lastActive.trim(),
          trust_level: (trustLevel.toLowerCase() as TrustLevel) || "restricted",
        });
      }
    }
  }

  return agents;
}

/**
 * Parse task blocks from Markdown
 * Supports two formats:
 *
 * 1. Structured format (tick add):
 *    ### TASK-001 · Task Title
 *    ```yaml
 *    id: TASK-001
 *    status: done
 *    ...
 *    ```
 *    > Task description
 *
 * 2. Freeform format (human/bot written):
 *    ## TASK-001: Task Title ✅ COMPLETE
 *    **Status:** Complete
 *    **Priority:** P0 (Revenue-critical)
 *    **Owner:** @alice
 *    ### Objective
 *    Description content...
 */
function parseTaskBlocks(content: string): Task[] {
  const { tasks } = parseTaskBlocksWithErrors(content);
  return tasks;
}

/**
 * Parse task blocks with error collection
 */
function parseTaskBlocksWithErrors(content: string): {
  tasks: Task[];
  errors: ParseError[];
} {
  const tasks: Task[] = [];
  const errors: ParseError[] = [];
  const seenIds = new Set<string>();

  // First, try structured format (### TASK-XXX · Title with YAML block)
  const { tasks: structuredTasks, errors: structuredErrors } =
    parseStructuredTaskBlocksWithErrors(content);

  // Add tasks, checking for duplicates
  for (const task of structuredTasks) {
    if (seenIds.has(task.id)) {
      errors.push({
        type: "task",
        taskId: task.id,
        message: `Duplicate task ID: ${task.id}`,
        recoverable: true,
      });
      // Keep the first occurrence
      continue;
    }
    seenIds.add(task.id);
    tasks.push(task);
  }
  errors.push(...structuredErrors);

  // Then, try freeform format (## TASK-XXX: Title with markdown metadata)
  const freeformTasks = parseFreeformTaskBlocks(content, seenIds);
  for (const task of freeformTasks) {
    if (seenIds.has(task.id)) {
      // Already seen - skip duplicate from freeform
      continue;
    }
    seenIds.add(task.id);
    tasks.push(task);
  }

  return { tasks, errors };
}

/**
 * Parse structured task blocks (original format with YAML code blocks)
 */
function parseStructuredTaskBlocks(content: string): Task[] {
  const { tasks } = parseStructuredTaskBlocksWithErrors(content);
  return tasks;
}

/**
 * Parse structured task blocks with error collection
 */
function parseStructuredTaskBlocksWithErrors(content: string): {
  tasks: Task[];
  errors: ParseError[];
} {
  const tasks: Task[] = [];
  const errors: ParseError[] = [];

  // Find all task headers (### TASK-XXX · Title)
  const taskHeaderRegex = /###\s+([A-Z]+-\d+)\s*·\s*(.+?)$/gm;
  const matches = [...content.matchAll(taskHeaderRegex)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const taskId = match[1];
    const taskTitle = match[2].trim();
    const startIndex = match.index!;

    // Find the end of this task block (next task header or end of file)
    const nextMatch = matches[i + 1];
    const endIndex = nextMatch ? nextMatch.index! : content.length;
    const taskBlock = content.slice(startIndex, endIndex);

    // Extract YAML metadata from code block
    const yamlMatch = taskBlock.match(/```yaml\s*\n([\s\S]*?)\n```/);
    if (!yamlMatch) {
      // No YAML block - create minimal task from header
      errors.push({
        type: "yaml",
        taskId,
        message: `No YAML block found for ${taskId}, using defaults`,
        recoverable: true,
      });
      tasks.push(createMinimalTask(taskId, taskTitle));
      continue;
    }

    const yamlContent = yamlMatch[1];
    let metadata: Record<string, any>;

    try {
      metadata = YAML.parse(yamlContent);
      if (!metadata || typeof metadata !== "object") {
        throw new Error("YAML parsed to non-object");
      }
    } catch (error: any) {
      errors.push({
        type: "yaml",
        taskId,
        message: `Failed to parse YAML for ${taskId}: ${error.message}`,
        recoverable: true,
      });
      // Create minimal task with error marker
      const minimalTask = createMinimalTask(taskId, taskTitle);
      (minimalTask as any).parse_error = true;
      (minimalTask as any).raw_yaml = yamlContent;
      tasks.push(minimalTask);
      continue;
    }

    // Extract description (text after ```, usually in blockquote)
    const afterYaml = taskBlock.slice(
      taskBlock.indexOf("```", yamlMatch.index! + 3) + 3
    );
    const descMatch = afterYaml.match(/>\s*([\s\S]+?)(?=\n###|\n---|\n##|$)/);
    const description = descMatch
      ? descMatch[1]
          .split("\n")
          .map((line) => line.replace(/^>\s*/, "").trim())
          .filter((line) => line)
          .join("\n")
      : "";

    // Build task object with validated fields
    const task: Task = {
      id: safeString(metadata.id, taskId),
      title: taskTitle,
      status: validateStatus(metadata.status),
      priority: validatePriority(metadata.priority),
      assigned_to: metadata.assigned_to || null,
      claimed_by: metadata.claimed_by || null,
      created_by: safeString(metadata.created_by, ""),
      created_at: safeString(metadata.created_at, new Date().toISOString()),
      updated_at: safeString(metadata.updated_at, new Date().toISOString()),
      due_date: metadata.due_date,
      tags: safeArray(metadata.tags, []),
      depends_on: safeArray(metadata.depends_on, []),
      blocks: safeArray(metadata.blocks, []),
      estimated_hours: metadata.estimated_hours,
      actual_hours: metadata.actual_hours,
      detail_file: metadata.detail_file,
      description: description.trim(),
      history: parseHistory(metadata.history || []),
      deliverables: parseDeliverables(metadata.deliverables || []),
    };

    tasks.push(task);
  }

  return { tasks, errors };
}

/**
 * Create a minimal task with default values
 */
function createMinimalTask(taskId: string, title: string): Task {
  const now = new Date().toISOString();
  return {
    id: taskId,
    title,
    status: "backlog",
    priority: "medium",
    assigned_to: null,
    claimed_by: null,
    created_by: "",
    created_at: now,
    updated_at: now,
    tags: [],
    depends_on: [],
    blocks: [],
    description: "",
    history: [],
  };
}

/**
 * Validate and normalize status value
 */
function validateStatus(status: any): TaskStatus {
  const validStatuses: TaskStatus[] = [
    "backlog",
    "todo",
    "in_progress",
    "review",
    "done",
    "blocked",
    "reopened",
  ];
  if (typeof status === "string" && validStatuses.includes(status as TaskStatus)) {
    return status as TaskStatus;
  }
  // Try to normalize common variations
  if (typeof status === "string") {
    const normalized = status.toLowerCase().replace(/[\s-]/g, "_");
    if (validStatuses.includes(normalized as TaskStatus)) {
      return normalized as TaskStatus;
    }
  }
  return "backlog";
}

/**
 * Validate and normalize priority value
 */
function validatePriority(priority: any): Priority {
  const validPriorities: Priority[] = ["urgent", "high", "medium", "low"];
  if (typeof priority === "string" && validPriorities.includes(priority as Priority)) {
    return priority as Priority;
  }
  // Try to normalize
  if (typeof priority === "string") {
    const text = priority.toLowerCase();
    if (text.includes("urgent") || text.includes("critical") || text.includes("p0")) return "urgent";
    if (text.includes("high") || text.includes("p1")) return "high";
    if (text.includes("medium") || text.includes("normal") || text.includes("p2")) return "medium";
    if (text.includes("low") || text.includes("p3")) return "low";
  }
  return "medium";
}

/**
 * Parse freeform task blocks (human/bot written markdown)
 * Format: ## TASK-XXX: Title [emoji status]
 */
function parseFreeformTaskBlocks(
  content: string,
  excludeIds: Set<string>
): Task[] {
  const tasks: Task[] = [];

  // Find all freeform task headers (## TASK-XXX: Title or ## TASK-XXX · Title at H2 level)
  // Supports: ## TASK-124: Title, ## TASK-124 · Title, ## TASK-124 - Title
  const freeformHeaderRegex =
    /^##\s+([A-Z]+-\d+)\s*[:·\-–—]\s*(.+?)$/gm;
  const matches = [...content.matchAll(freeformHeaderRegex)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const taskId = match[1];

    // Skip if already parsed as structured format
    if (excludeIds.has(taskId)) continue;

    const headerLine = match[2].trim();
    const startIndex = match.index!;

    // Find the end of this task block (next ## header or end of file)
    const nextMatch = matches[i + 1];
    const endIndex = nextMatch ? nextMatch.index! : content.length;
    const taskBlock = content.slice(startIndex, endIndex);

    // Parse header for title and status emoji
    const { title, headerStatus } = parseHeaderLine(headerLine);

    // Parse metadata from bold lines
    const metadata = parseFreeformMetadata(taskBlock);

    // Determine status (header emoji takes precedence, then **Status:** line)
    const status = headerStatus || metadata.status || "backlog";

    // Extract description (everything after metadata lines, before next ## header)
    const description = extractFreeformDescription(taskBlock);

    const task: Task = {
      id: taskId,
      title,
      status: status as TaskStatus,
      priority: (metadata.priority as Priority) || "medium",
      assigned_to: metadata.owner || null,
      claimed_by: metadata.owner || null,
      created_by: metadata.created_by || "",
      created_at: metadata.created_at || new Date().toISOString(),
      updated_at: metadata.updated_at || new Date().toISOString(),
      due_date: metadata.due_date,
      tags: metadata.tags || [],
      depends_on: metadata.depends_on || [],
      blocks: metadata.blocks || [],
      estimated_hours: metadata.estimated_hours,
      actual_hours: metadata.actual_hours,
      detail_file: metadata.detail_file,
      description: description.trim(),
      history: [],
      deliverables: metadata.deliverables || [],
    };

    tasks.push(task);
  }

  return tasks;
}

/**
 * Parse header line for title and status emoji
 * Examples:
 *   "HTTP Proxy Billing System ✅ COMPLETE" -> { title: "HTTP Proxy Billing System", headerStatus: "done" }
 *   "Move Plan from Tenant 🔲 TODO" -> { title: "Move Plan from Tenant", headerStatus: "todo" }
 */
function parseHeaderLine(headerLine: string): {
  title: string;
  headerStatus: TaskStatus | null;
} {
  // Status emoji patterns
  const statusPatterns: { pattern: RegExp; status: TaskStatus }[] = [
    { pattern: /✅\s*(COMPLETE|DONE)/i, status: "done" },
    { pattern: /🔲\s*(TODO|PENDING)/i, status: "todo" },
    { pattern: /🔄\s*(IN[_\s-]?PROGRESS|WIP|WORKING)/i, status: "in_progress" },
    { pattern: /⏸️?\s*(BLOCKED|WAITING)/i, status: "blocked" },
    { pattern: /🔍\s*(REVIEW|IN[_\s-]?REVIEW)/i, status: "review" },
    { pattern: /📋\s*(BACKLOG)/i, status: "backlog" },
    { pattern: /🔁\s*(REOPENED)/i, status: "reopened" },
  ];

  let title = headerLine;
  let headerStatus: TaskStatus | null = null;

  for (const { pattern, status } of statusPatterns) {
    if (pattern.test(headerLine)) {
      headerStatus = status;
      title = headerLine.replace(pattern, "").trim();
      break;
    }
  }

  return { title, headerStatus };
}

/**
 * Parse freeform metadata from bold markdown lines
 * Examples:
 *   **Status:** Complete
 *   **Priority:** P0 (Revenue-critical)
 *   **Owner:** @alice
 *   **Depends on:** TASK-001, TASK-002
 */
function parseFreeformMetadata(taskBlock: string): Record<string, any> {
  const metadata: Record<string, any> = {};

  // Status line
  const statusMatch = taskBlock.match(
    /\*\*Status:\*\*\s*(.+?)(?:\n|$)/i
  );
  if (statusMatch) {
    metadata.status = normalizeStatus(statusMatch[1].trim());
  }

  // Priority line (P0, P1, P2, P3 or urgent/high/medium/low)
  const priorityMatch = taskBlock.match(
    /\*\*Priority:\*\*\s*(.+?)(?:\n|$)/i
  );
  if (priorityMatch) {
    metadata.priority = normalizePriority(priorityMatch[1].trim());
  }

  // Owner/Assignee line
  const ownerMatch = taskBlock.match(
    /\*\*(?:Owner|Assigned(?:\s*to)?|Assignee):\*\*\s*(.+?)(?:\n|$)/i
  );
  if (ownerMatch) {
    let owner = ownerMatch[1].trim();
    // Normalize to @username format
    if (owner && !owner.startsWith("@") && owner !== "-" && owner.toLowerCase() !== "none") {
      owner = `@${owner}`;
    }
    if (owner !== "-" && owner.toLowerCase() !== "none") {
      metadata.owner = owner;
    }
  }

  // Dependencies
  const dependsMatch = taskBlock.match(
    /\*\*(?:Depends\s*on|Dependencies|Blocked\s*by):\*\*\s*(.+?)(?:\n|$)/i
  );
  if (dependsMatch) {
    metadata.depends_on = parseTaskList(dependsMatch[1]);
  }

  // Blocks
  const blocksMatch = taskBlock.match(
    /\*\*Blocks:\*\*\s*(.+?)(?:\n|$)/i
  );
  if (blocksMatch) {
    metadata.blocks = parseTaskList(blocksMatch[1]);
  }

  // Tags
  const tagsMatch = taskBlock.match(
    /\*\*Tags:\*\*\s*(.+?)(?:\n|$)/i
  );
  if (tagsMatch) {
    metadata.tags = tagsMatch[1]
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter((t) => t);
  }

  // Due date
  const dueMatch = taskBlock.match(
    /\*\*(?:Due(?:\s*date)?|Deadline):\*\*\s*(.+?)(?:\n|$)/i
  );
  if (dueMatch) {
    metadata.due_date = dueMatch[1].trim();
  }

  // Created by
  const createdByMatch = taskBlock.match(
    /\*\*Created\s*by:\*\*\s*(.+?)(?:\n|$)/i
  );
  if (createdByMatch) {
    let creator = createdByMatch[1].trim();
    if (creator && !creator.startsWith("@")) {
      creator = `@${creator}`;
    }
    metadata.created_by = creator;
  }

  return metadata;
}

/**
 * Normalize status text to TaskStatus
 */
function normalizeStatus(statusText: string): TaskStatus {
  const text = statusText.toLowerCase().replace(/[^a-z_\s]/g, "").trim();

  const statusMap: Record<string, TaskStatus> = {
    complete: "done",
    completed: "done",
    done: "done",
    finished: "done",
    todo: "todo",
    "to do": "todo",
    pending: "todo",
    "not started": "backlog",
    "in progress": "in_progress",
    in_progress: "in_progress",
    wip: "in_progress",
    working: "in_progress",
    active: "in_progress",
    blocked: "blocked",
    waiting: "blocked",
    "on hold": "blocked",
    review: "review",
    "in review": "review",
    backlog: "backlog",
    reopened: "reopened",
  };

  return statusMap[text] || "backlog";
}

/**
 * Normalize priority text to Priority
 * Supports: P0/P1/P2/P3, urgent/high/medium/low, critical
 */
function normalizePriority(priorityText: string): Priority {
  const text = priorityText.toLowerCase();

  // P0-P3 format
  if (text.includes("p0") || text.includes("critical")) return "urgent";
  if (text.includes("p1")) return "high";
  if (text.includes("p2")) return "medium";
  if (text.includes("p3")) return "low";

  // Direct names
  if (text.includes("urgent")) return "urgent";
  if (text.includes("high")) return "high";
  if (text.includes("medium") || text.includes("normal")) return "medium";
  if (text.includes("low")) return "low";

  return "medium";
}

/**
 * Parse a comma/space separated list of task IDs
 */
function parseTaskList(text: string): string[] {
  return text
    .split(/[,;\s]+/)
    .map((t) => t.trim())
    .filter((t) => /^[A-Z]+-\d+$/.test(t));
}

/**
 * Extract description from freeform task block
 * Everything between metadata lines and the next ## header
 */
function extractFreeformDescription(taskBlock: string): string {
  const lines = taskBlock.split("\n");
  const descriptionLines: string[] = [];
  let inDescription = false;
  let metadataEnded = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines at the start
    if (!metadataEnded && !trimmed) continue;

    // Skip metadata lines (bold key-value pairs at the start)
    if (!metadataEnded && /^\*\*[^*]+:\*\*/.test(trimmed)) {
      continue;
    }

    // Once we hit non-metadata content, we're in description
    metadataEnded = true;
    inDescription = true;

    // Stop at next H2 header
    if (/^##\s+/.test(trimmed)) break;

    descriptionLines.push(line);
  }

  return descriptionLines.join("\n").trim();
}

/**
 * Parse history entries from YAML array
 */
function parseHistory(history: any[]): HistoryEntry[] {
  if (!Array.isArray(history)) return [];

  return history.map((entry) => ({
    ts: entry.ts || "",
    who: entry.who || "",
    action: entry.action || "",
    note: entry.note,
    from: entry.from,
    to: entry.to,
  }));
}

/**
 * Parse deliverables from YAML array
 */
function parseDeliverables(deliverables: any[]): Deliverable[] {
  if (!Array.isArray(deliverables)) return [];

  return deliverables.map((d) => ({
    name: d.name || "",
    type: d.type || "other",
    path: d.path,
    completed: d.completed ?? false,
    notes: d.notes,
  }));
}
