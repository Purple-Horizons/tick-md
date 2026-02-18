import chalk from "chalk";
import type { Task, TaskStatus, Priority } from "../types.js";

/**
 * Error with suggestions for recovery
 */
export class TickError extends Error {
  suggestions: string[];

  constructor(message: string, suggestions: string[] = []) {
    super(message);
    this.name = "TickError";
    this.suggestions = suggestions;
  }
}

/**
 * Format error message with suggestions
 */
export function formatError(error: TickError | Error): string {
  if (error instanceof TickError && error.suggestions.length > 0) {
    const suggestions = error.suggestions
      .map((s) => `  ${chalk.cyan("→")} ${s}`)
      .join("\n");
    return `${error.message}\n\n${chalk.gray("Suggestions:")}\n${suggestions}`;
  }
  return error.message;
}

/**
 * Task not found error with suggestions
 */
export function taskNotFoundError(
  taskId: string,
  availableTasks: Task[]
): TickError {
  const suggestions: string[] = [];

  // Find similar task IDs
  const similar = findSimilarIds(taskId, availableTasks.map((t) => t.id));
  if (similar.length > 0) {
    suggestions.push(`Did you mean: ${similar.join(", ")}?`);
  }

  // Suggest listing tasks
  suggestions.push(`Run 'tick list' to see available tasks`);

  return new TickError(`Task not found: ${taskId}`, suggestions);
}

/**
 * Find similar IDs using simple string matching
 */
function findSimilarIds(target: string, candidates: string[]): string[] {
  const targetNum = target.match(/\d+$/)?.[0] || "";
  const similar: string[] = [];

  for (const candidate of candidates) {
    // Check for transposed digits (TASK-123 vs TASK-132)
    const candidateNum = candidate.match(/\d+$/)?.[0] || "";
    if (
      candidateNum.length === targetNum.length &&
      [...candidateNum].sort().join("") === [...targetNum].sort().join("")
    ) {
      similar.push(candidate);
    }
    // Check for off-by-one (TASK-123 vs TASK-124)
    else if (
      Math.abs(parseInt(candidateNum, 10) - parseInt(targetNum, 10)) === 1
    ) {
      similar.push(candidate);
    }
  }

  return similar.slice(0, 3); // Max 3 suggestions
}

/**
 * Invalid status transition error
 */
export function invalidStatusTransitionError(
  taskId: string,
  currentStatus: TaskStatus,
  targetAction: string
): TickError {
  const suggestions: string[] = [];

  const transitionHelp: Record<string, string[]> = {
    "done→claim": [
      `Task is already done. Use 'tick reopen ${taskId} @agent' to reopen it first`,
    ],
    "done→in_progress": [
      `Task is completed. Use 'tick reopen ${taskId} @agent' to work on it again`,
    ],
    "blocked→done": [
      `Task is blocked. Resolve blocking tasks first, or use 'tick edit ${taskId} @agent --status in_progress'`,
    ],
    "backlog→done": [
      `Task was never started. Use 'tick done ${taskId} @agent --skip-workflow' to complete anyway`,
      `Or claim it first: 'tick claim ${taskId} @agent'`,
    ],
  };

  const key = `${currentStatus}→${targetAction}`;
  if (transitionHelp[key]) {
    suggestions.push(...transitionHelp[key]);
  } else {
    suggestions.push(
      `Current status is '${currentStatus}'. Use 'tick edit ${taskId} @agent --status <status>' to change it`
    );
  }

  return new TickError(
    `Cannot ${targetAction} task ${taskId} (status: ${currentStatus})`,
    suggestions
  );
}

/**
 * Task already claimed error
 */
export function taskAlreadyClaimedError(
  taskId: string,
  claimedBy: string
): TickError {
  return new TickError(`Task ${taskId} is already claimed by ${claimedBy}`, [
    `Ask ${claimedBy} to release it: 'tick release ${taskId} ${claimedBy}'`,
    `Or use 'tick claim ${taskId} @your-name --force' to take over`,
  ]);
}

/**
 * Blocked task error with dependency chain
 */
export function taskBlockedError(
  taskId: string,
  blockingTasks: Task[]
): TickError {
  const chain = blockingTasks
    .map((t) => `${t.id} (${t.status})`)
    .join(" → ");

  return new TickError(
    `Cannot complete ${taskId}: blocked by dependencies`,
    [
      `Blocking chain: ${chain}`,
      `Complete blocking tasks first, or use 'tick edit ${taskId} @agent --depends-on ""' to remove dependencies`,
    ]
  );
}

/**
 * Circular dependency error
 */
export function circularDependencyError(
  taskId: string,
  cycle: string[]
): TickError {
  return new TickError(
    `Circular dependency detected: ${cycle.join(" → ")} → ${taskId}`,
    [
      `Remove one dependency to break the cycle`,
      `Use 'tick edit ${taskId} @agent --depends-on ""' to clear dependencies`,
      `Use 'tick graph' to visualize the dependency structure`,
    ]
  );
}

/**
 * Agent not found error
 */
export function agentNotFoundError(
  agentName: string,
  registeredAgents: string[]
): TickError {
  const suggestions: string[] = [];

  // Suggest similar names
  const normalized = agentName.startsWith("@") ? agentName : `@${agentName}`;
  const similar = registeredAgents.filter(
    (a) =>
      a.toLowerCase().includes(normalized.toLowerCase().slice(1)) ||
      normalized.toLowerCase().includes(a.toLowerCase().slice(1))
  );
  if (similar.length > 0) {
    suggestions.push(`Did you mean: ${similar.join(", ")}?`);
  }

  suggestions.push(
    `Register the agent first: 'tick agent register ${normalized}'`
  );
  suggestions.push(`Run 'tick agent list' to see registered agents`);

  return new TickError(`Agent not found: ${normalized}`, suggestions);
}

/**
 * Invalid priority error
 */
export function invalidPriorityError(priority: string): TickError {
  return new TickError(`Invalid priority: ${priority}`, [
    `Valid priorities: urgent, high, medium, low`,
    `Example: --priority high`,
  ]);
}

/**
 * Invalid status error
 */
export function invalidStatusError(status: string): TickError {
  return new TickError(`Invalid status: ${status}`, [
    `Valid statuses: backlog, todo, in_progress, review, done, blocked, reopened`,
    `Example: --status in_progress`,
  ]);
}

/**
 * No tasks match filter error
 */
export function noTasksMatchError(filters: Record<string, string>): TickError {
  const filterDesc = Object.entries(filters)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${v}`)
    .join(", ");

  return new TickError(`No tasks match filters: ${filterDesc}`, [
    `Try removing some filters`,
    `Run 'tick list' to see all tasks`,
  ]);
}

/**
 * File not found error with init suggestion
 */
export function tickFileNotFoundError(): TickError {
  return new TickError(`TICK.md not found in current directory`, [
    `Initialize a new project: 'tick init'`,
    `Or navigate to a directory with TICK.md`,
  ]);
}

/**
 * Not a git repo error
 */
export function notGitRepoError(command: string): TickError {
  return new TickError(`Not a git repository`, [
    `Initialize git: 'git init'`,
    command === "undo"
      ? `Or use 'tick undo --backup' to restore from backups instead`
      : `Some tick commands require git for version control`,
  ]);
}
