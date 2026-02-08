import type { TickFile, Task, TaskStatus } from "../types.js";

export interface ValidationError {
  type: "error" | "warning";
  message: string;
  location?: string;
  fix?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validate a TickFile for common issues
 */
export function validateTickFile(tickFile: TickFile): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate project metadata
  if (!tickFile.meta.project) {
    errors.push({
      type: "error",
      message: "Project name is required in frontmatter",
      location: "frontmatter.project",
      fix: "Add 'project: your-project-name' to YAML frontmatter",
    });
  }

  if (!tickFile.meta.schema_version) {
    warnings.push({
      type: "warning",
      message: "Schema version not specified",
      location: "frontmatter.schema_version",
      fix: 'Add \'schema_version: "1.0"\' to frontmatter',
    });
  }

  // Validate task IDs are unique
  const taskIds = new Set<string>();
  for (const task of tickFile.tasks) {
    if (taskIds.has(task.id)) {
      errors.push({
        type: "error",
        message: `Duplicate task ID: ${task.id}`,
        location: task.id,
        fix: `Change one of the duplicate IDs to a unique value`,
      });
    }
    taskIds.add(task.id);
  }

  // Validate each task
  for (const task of tickFile.tasks) {
    validateTask(task, tickFile, errors, warnings);
  }

  // Check for circular dependencies
  const circularDeps = findCircularDependencies(tickFile.tasks);
  for (const cycle of circularDeps) {
    errors.push({
      type: "error",
      message: `Circular dependency detected: ${cycle.join(" → ")}`,
      location: cycle[0],
      fix: "Remove one of the dependencies to break the cycle",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate a single task
 */
function validateTask(
  task: Task,
  tickFile: TickFile,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  // Required fields
  if (!task.id) {
    errors.push({
      type: "error",
      message: "Task missing ID",
      location: task.title || "unknown task",
    });
  }

  if (!task.title) {
    errors.push({
      type: "error",
      message: `Task ${task.id} missing title`,
      location: task.id,
    });
  }

  if (!task.created_by) {
    warnings.push({
      type: "warning",
      message: `Task ${task.id} missing created_by`,
      location: task.id,
    });
  }

  // Validate references
  const allTaskIds = new Set(tickFile.tasks.map((t) => t.id));

  for (const depId of task.depends_on) {
    if (!allTaskIds.has(depId)) {
      errors.push({
        type: "error",
        message: `Task ${task.id} depends on non-existent task: ${depId}`,
        location: task.id,
        fix: `Remove ${depId} from depends_on or create the task`,
      });
    }
  }

  for (const blockId of task.blocks) {
    if (!allTaskIds.has(blockId)) {
      errors.push({
        type: "error",
        message: `Task ${task.id} blocks non-existent task: ${blockId}`,
        location: task.id,
        fix: `Remove ${blockId} from blocks or create the task`,
      });
    }
  }

  // Validate agent references
  const allAgents = new Set(tickFile.agents.map((a) => a.name));

  if (task.assigned_to && !allAgents.has(task.assigned_to)) {
    warnings.push({
      type: "warning",
      message: `Task ${task.id} assigned to unregistered agent: ${task.assigned_to}`,
      location: task.id,
      fix: `Register agent: tick agent register ${task.assigned_to}`,
    });
  }

  if (task.claimed_by && !allAgents.has(task.claimed_by)) {
    warnings.push({
      type: "warning",
      message: `Task ${task.id} claimed by unregistered agent: ${task.claimed_by}`,
      location: task.id,
      fix: `Register agent: tick agent register ${task.claimed_by}`,
    });
  }

  // Logical validations
  if (task.claimed_by && task.status === "done") {
    warnings.push({
      type: "warning",
      message: `Task ${task.id} is done but still claimed by ${task.claimed_by}`,
      location: task.id,
      fix: "Done tasks should have claimed_by set to null",
    });
  }

  if (task.actual_hours && task.estimated_hours) {
    if (task.actual_hours > task.estimated_hours * 2) {
      warnings.push({
        type: "warning",
        message: `Task ${task.id} took ${task.actual_hours}h (estimated ${task.estimated_hours}h) - 2x over estimate`,
        location: task.id,
      });
    }
  }

  // Validate history
  if (!task.history || task.history.length === 0) {
    warnings.push({
      type: "warning",
      message: `Task ${task.id} has no history entries`,
      location: task.id,
      fix: "Add at least a 'created' history entry",
    });
  }
}

/**
 * Find circular dependencies in tasks
 */
function findCircularDependencies(tasks: Task[]): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(taskId: string, path: string[]): void {
    if (recursionStack.has(taskId)) {
      // Found a cycle
      const cycleStart = path.indexOf(taskId);
      if (cycleStart >= 0) {
        cycles.push([...path.slice(cycleStart), taskId]);
      }
      return;
    }

    if (visited.has(taskId)) {
      return;
    }

    visited.add(taskId);
    recursionStack.add(taskId);
    path.push(taskId);

    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      for (const depId of task.depends_on) {
        dfs(depId, [...path]);
      }
    }

    recursionStack.delete(taskId);
  }

  for (const task of tasks) {
    if (!visited.has(task.id)) {
      dfs(task.id, []);
    }
  }

  return cycles;
}
