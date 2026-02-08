import fs from "fs";
import path from "path";
import type { TickFile, ProjectMeta, Agent, Task, AgentStatus, AgentType, TrustLevel, TaskStatus, Priority, HistoryEntry } from "./types";

/**
 * Server-side TICK.md reader
 * Self-contained parser that mirrors cli/src/parser/parse.ts
 * so the dashboard doesn't depend on CLI dist/ artifacts.
 */

const TICK_FILENAME = "TICK.md";

/** Find TICK.md starting from the given dir or CWD */
export function findTickFile(baseDir?: string): string | null {
  const dir = baseDir || process.cwd();
  const tickPath = path.join(dir, TICK_FILENAME);
  if (fs.existsSync(tickPath)) return tickPath;
  return null;
}

/** Read and parse TICK.md from disk */
export function readTickFile(tickPath?: string): TickFile {
  const filePath = tickPath || findTickFile();
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error("TICK.md not found. Run 'tick init' to create a project.");
  }
  const content = fs.readFileSync(filePath, "utf-8");
  return parseTickFile(content);
}

/** Parse TICK.md content string into structured data */
export function parseTickFile(content: string): TickFile {
  const { frontmatter, body } = parseFrontmatter(content);

  const meta: ProjectMeta = {
    project: frontmatter.project || "untitled",
    title: frontmatter.title,
    schema_version: frontmatter.schema_version || "1.0",
    created: frontmatter.created || new Date().toISOString(),
    updated: frontmatter.updated || new Date().toISOString(),
    default_workflow: frontmatter.default_workflow || ["backlog", "todo", "in_progress", "review", "done"],
    id_prefix: frontmatter.id_prefix || "TASK",
    next_id: frontmatter.next_id || 1,
  };

  const agents = parseAgentsTable(body);
  const tasks = parseTaskBlocks(body);

  return { meta, agents, tasks, raw_content: content };
}

// --- Internal parsers ---

function parseFrontmatter(content: string): { frontmatter: Record<string, any>; body: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: content };

  const yamlStr = match[1];
  const body = match[2];

  // Simple YAML parser for frontmatter (avoids gray-matter dep in Next.js)
  const frontmatter: Record<string, any> = {};
  for (const line of yamlStr.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value: any = line.slice(colonIdx + 1).trim();

    // Parse arrays like [backlog, todo, in_progress]
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value.slice(1, -1).split(",").map((v: string) => v.trim());
    }
    // Parse numbers
    else if (/^\d+$/.test(value)) {
      value = parseInt(value, 10);
    }
    // Strip quotes
    else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    frontmatter[key] = value;
  }

  return { frontmatter, body };
}

function parseAgentsTable(content: string): Agent[] {
  const agents: Agent[] = [];
  const agentsMatch = content.match(/##\s+Agents\s*\n\n([\s\S]*?)(?=\n##|\n---|\n###|$)/i);
  if (!agentsMatch) return agents;

  const lines = agentsMatch[1].split("\n");
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("|---") || trimmed.startsWith("| ---")) continue;

    if (trimmed.startsWith("|")) {
      const cells = trimmed.split("|").map((c) => c.trim()).filter((c) => c);

      if (cells.some((c) => c === "Agent" || c === "Type" || c === "Role" || c === "Status" || c === "Working On")) {
        inTable = true;
        continue;
      }

      if (inTable && cells.length >= 6) {
        const [name, type, roleStr, status, workingOn, lastActive, trustLevel] = cells;
        agents.push({
          name: name.trim(),
          type: (type.toLowerCase() as AgentType) || "bot",
          roles: roleStr.split(",").map((r) => r.trim()),
          status: (status.toLowerCase() as AgentStatus) || "offline",
          working_on: workingOn === "-" ? null : workingOn.trim(),
          last_active: lastActive.trim(),
          trust_level: (trustLevel?.toLowerCase() as TrustLevel) || "restricted",
        });
      }
    }
  }

  return agents;
}

function parseTaskBlocks(content: string): Task[] {
  const tasks: Task[] = [];
  const taskHeaderRegex = /###\s+([A-Z]+-\d+)\s*·\s*(.+?)$/gm;
  const matches = [...content.matchAll(taskHeaderRegex)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const taskId = match[1];
    const taskTitle = match[2].trim();
    const startIndex = match.index!;
    const nextMatch = matches[i + 1];
    const endIndex = nextMatch ? nextMatch.index! : content.length;
    const taskBlock = content.slice(startIndex, endIndex);

    const yamlMatch = taskBlock.match(/```yaml\s*\n([\s\S]*?)\n```/);
    if (!yamlMatch) continue;

    let metadata: Record<string, any>;
    try {
      metadata = parseSimpleYaml(yamlMatch[1]);
    } catch {
      continue;
    }

    // Extract description
    const afterYaml = taskBlock.slice(taskBlock.indexOf("```", yamlMatch.index! + 3) + 3);
    const descMatch = afterYaml.match(/>\s*(.+?)(?=\n###|\n---|\n##|$)/s);
    const description = descMatch
      ? descMatch[1].split("\n").map((l) => l.replace(/^>\s*/, "").trim()).filter(Boolean).join("\n")
      : "";

    tasks.push({
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
    });
  }

  return tasks;
}

/** Simple YAML parser for task metadata blocks */
function parseSimpleYaml(yamlStr: string): Record<string, any> {
  const result: Record<string, any> = {};
  const lines = yamlStr.split("\n");
  let currentKey = "";
  let currentArray: any[] | null = null;
  let currentArrayItem: Record<string, any> | null = null;
  let isSimpleArray = false; // tracks whether the array has simple values (strings) vs objects

  for (const line of lines) {
    // Array item start (e.g., "  - cli" or "  - ts: ...")
    if (/^\s+-\s/.test(line) && currentKey) {
      if (!currentArray) currentArray = [];

      const rest = line.replace(/^\s+-\s*/, "");
      const colonIdx = rest.indexOf(":");

      if (colonIdx !== -1 && /^[a-zA-Z_]/.test(rest)) {
        // Object array item (e.g., "  - ts: 2026-...")
        if (currentArrayItem) currentArray.push(currentArrayItem);
        isSimpleArray = false;
        currentArrayItem = {};
        const k = rest.slice(0, colonIdx).trim();
        const v = rest.slice(colonIdx + 1).trim();
        currentArrayItem[k] = cleanYamlValue(v);
      } else {
        // Simple array item (e.g., "  - cli" or "  - validation")
        if (currentArrayItem) {
          currentArray.push(currentArrayItem);
          currentArrayItem = null;
        }
        isSimpleArray = true;
        currentArray.push(cleanYamlValue(rest.trim()));
      }
      continue;
    }

    // Continuation of object array item (e.g., "    who: @agent")
    if (/^\s{4,}\w/.test(line) && currentArrayItem) {
      const trimmed = line.trim();
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx !== -1) {
        const k = trimmed.slice(0, colonIdx).trim();
        const v = trimmed.slice(colonIdx + 1).trim();
        currentArrayItem[k] = cleanYamlValue(v);
      }
      continue;
    }

    // End current array if we hit a top-level key
    if (currentArray !== null && !/^\s/.test(line) && line.includes(":")) {
      if (currentArrayItem) currentArray.push(currentArrayItem);
      result[currentKey] = currentArray;
      currentArray = null;
      currentArrayItem = null;
      isSimpleArray = false;
    }

    // Top-level key
    const colonIdx = line.indexOf(":");
    if (colonIdx !== -1 && !/^\s/.test(line)) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();

      if (!value) {
        // This key has a block value (like history: or tags:)
        currentKey = key;
        currentArray = null;
        currentArrayItem = null;
        isSimpleArray = false;
        continue;
      }

      currentKey = key;
      result[key] = cleanYamlValue(value);
    }
  }

  // Flush remaining array
  if (currentArray !== null) {
    if (currentArrayItem) currentArray.push(currentArrayItem);
    result[currentKey] = currentArray;
  }

  return result;
}

function cleanYamlValue(value: string): any {
  if (value === "null" || value === "~") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
  // Inline array
  if (value.startsWith("[") && value.endsWith("]")) {
    return value.slice(1, -1).split(",").map((v) => v.trim()).filter(Boolean);
  }
  // Strip quotes
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

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
