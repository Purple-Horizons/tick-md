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
} from "../types.js";

/**
 * Parse a TICK.md file into structured data
 */
export function parseTickFile(content: string): TickFile {
  // Parse YAML frontmatter using gray-matter
  const { data: frontmatter, content: body } = matter(content);

  // Extract project metadata from frontmatter
  const meta: ProjectMeta = {
    project: frontmatter.project || "untitled",
    title: frontmatter.title,
    schema_version: frontmatter.schema_version || "1.0",
    created: frontmatter.created || new Date().toISOString(),
    updated: frontmatter.updated || new Date().toISOString(),
    default_workflow: frontmatter.default_workflow || [
      "backlog",
      "todo",
      "in_progress",
      "review",
      "done",
    ],
    id_prefix: frontmatter.id_prefix || "TASK",
    next_id: frontmatter.next_id || 1,
  };

  // Parse agents table
  const agents = parseAgentsTable(body);

  // Parse task blocks
  const tasks = parseTaskBlocks(body);

  return {
    meta,
    agents,
    tasks,
    raw_content: content,
  };
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
 * Format:
 * ### TASK-001 · Task Title
 * ```yaml
 * id: TASK-001
 * status: done
 * ...
 * ```
 * > Task description
 */
function parseTaskBlocks(content: string): Task[] {
  const tasks: Task[] = [];

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
    if (!yamlMatch) continue;

    const yamlContent = yamlMatch[1];
    let metadata: Record<string, any>;

    try {
      metadata = YAML.parse(yamlContent);
    } catch (error) {
      console.warn(`Failed to parse YAML for ${taskId}:`, error);
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

    // Build task object
    const task: Task = {
      id: metadata.id || taskId,
      title: taskTitle,
      status: (metadata.status as TaskStatus) || "backlog",
      priority: (metadata.priority as Priority) || "medium",
      assigned_to: metadata.assigned_to || null,
      claimed_by: metadata.claimed_by || null,
      created_by: metadata.created_by || "",
      created_at: metadata.created_at || new Date().toISOString(),
      updated_at: metadata.updated_at || new Date().toISOString(),
      due_date: metadata.due_date,
      tags: Array.isArray(metadata.tags) ? metadata.tags : [],
      depends_on: Array.isArray(metadata.depends_on) ? metadata.depends_on : [],
      blocks: Array.isArray(metadata.blocks) ? metadata.blocks : [],
      estimated_hours: metadata.estimated_hours,
      actual_hours: metadata.actual_hours,
      detail_file: metadata.detail_file,
      description: description.trim(),
      history: parseHistory(metadata.history || []),
    };

    tasks.push(task);
  }

  return tasks;
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
