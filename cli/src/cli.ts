#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { initCommand } from "./commands/init.js";
import { addCommand } from "./commands/add.js";
import { claimCommand, releaseCommand } from "./commands/claim.js";
import { doneCommand, commentCommand } from "./commands/done.js";
import { statusCommand } from "./commands/status.js";
import { syncCommand } from "./commands/sync.js";
import { validateCommand } from "./commands/validate.js";
import { registerAgentCommand, listAgentsCommand } from "./commands/agent.js";
import { listCommand } from "./commands/list.js";
import { graphCommand } from "./commands/graph.js";
import { watchCommand } from "./commands/watch.js";
import { reopenCommand } from "./commands/reopen.js";
import { deleteCommand } from "./commands/delete.js";
import { editCommand } from "./commands/edit.js";
import { undoCommand } from "./commands/undo.js";
import { importCommand } from "./commands/import.js";
import {
  batchStartCommand,
  batchCommitCommand,
  batchAbortCommand,
  batchStatusCommand,
} from "./commands/batch.js";
import type { Priority, AgentStatus, AgentType, TaskStatus } from "./types.js";

const program = new Command();

program
  .name("tick")
  .description("Multi-agent task coordination via Markdown")
  .version("1.2.0");

// Init command
program
  .command("init")
  .description("Initialize a new Tick project")
  .option("-n, --name <name>", "Project name")
  .option("-f, --force", "Overwrite existing TICK.md")
  .action(async (options) => {
    try {
      await initCommand({
        projectName: options.name,
        force: options.force,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Status command
program
  .command("status")
  .description("Show project status and task summary")
  .action(async () => {
    try {
      await statusCommand();
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Add command
program
  .command("add <title>")
  .description("Create a new task")
  .option("-p, --priority <priority>", "Priority (urgent|high|medium|low)", "medium")
  .option("-t, --tags <tags>", "Comma-separated tags")
  .option("-a, --assigned-to <agent>", "Assign to agent")
  .option("-d, --description <text>", "Task description")
  .option("--depends-on <tasks>", "Comma-separated task IDs this depends on")
  .option("--blocks <tasks>", "Comma-separated task IDs this blocks")
  .option("--estimated-hours <hours>", "Estimated hours to complete", parseFloat)
  .option("--commit", "Auto-commit after change")
  .option("--no-commit", "Skip auto-commit even if config enables it")
  .action(async (title, options) => {
    try {
      await addCommand(title, {
        priority: options.priority as Priority,
        tags: options.tags ? options.tags.split(",").map((t: string) => t.trim()) : undefined,
        assignedTo: options.assignedTo,
        description: options.description,
        dependsOn: options.dependsOn ? options.dependsOn.split(",").map((t: string) => t.trim()) : undefined,
        blocks: options.blocks ? options.blocks.split(",").map((t: string) => t.trim()) : undefined,
        estimatedHours: options.estimatedHours,
        commit: options.commit,
        noCommit: options.noCommit,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Claim command
program
  .command("claim <task-id> <agent>")
  .description("Claim a task for an agent")
  .option("--commit", "Auto-commit after change")
  .option("--no-commit", "Skip auto-commit even if config enables it")
  .action(async (taskId, agent, options) => {
    try {
      await claimCommand(taskId, agent, {
        commit: options.commit,
        noCommit: options.noCommit,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Release command
program
  .command("release <task-id> <agent>")
  .description("Release a claimed task")
  .option("--commit", "Auto-commit after change")
  .option("--no-commit", "Skip auto-commit even if config enables it")
  .action(async (taskId, agent, options) => {
    try {
      await releaseCommand(taskId, agent, {
        commit: options.commit,
        noCommit: options.noCommit,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Done command
program
  .command("done <task-id> <agent>")
  .description("Mark a task as complete")
  .option("--commit", "Auto-commit after change")
  .option("--no-commit", "Skip auto-commit even if config enables it")
  .option("--skip-workflow", "Skip workflow warning for tasks that were never started")
  .action(async (taskId, agent, options) => {
    try {
      await doneCommand(taskId, agent, {
        commit: options.commit,
        noCommit: options.noCommit,
        skipWorkflow: options.skipWorkflow,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Reopen command
program
  .command("reopen <task-id> <agent>")
  .description("Reopen a completed task")
  .option("-n, --note <text>", "Reason for reopening")
  .option("-s, --status <status>", "Target status (default: reopened)", "reopened")
  .option("--commit", "Auto-commit after change")
  .option("--no-commit", "Skip auto-commit even if config enables it")
  .action(async (taskId, agent, options) => {
    try {
      await reopenCommand(taskId, agent, {
        note: options.note,
        status: options.status as TaskStatus,
        commit: options.commit,
        noCommit: options.noCommit,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Delete command
program
  .command("delete <task-id>")
  .description("Delete a task from TICK.md")
  .option("-f, --force", "Force delete even if task is in progress or has dependents")
  .option("--commit", "Auto-commit after change")
  .option("--no-commit", "Skip auto-commit even if config enables it")
  .action(async (taskId, options) => {
    try {
      await deleteCommand(taskId, {
        force: options.force,
        commit: options.commit,
        noCommit: options.noCommit,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Edit command
program
  .command("edit <task-id> <agent>")
  .description("Edit task fields directly")
  .option("-s, --status <status>", "Set status (backlog|todo|in_progress|review|done|blocked|reopened)")
  .option("-p, --priority <priority>", "Set priority (urgent|high|medium|low)")
  .option("--title <text>", "Set title")
  .option("-d, --description <text>", "Set description")
  .option("-a, --assigned-to <agent>", "Set assigned agent (empty string to unassign)")
  .option("-t, --tags <tags>", "Set tags (comma-separated, replaces existing)")
  .option("--depends-on <tasks>", "Set dependencies (comma-separated task IDs, replaces existing)")
  .option("--blocks <tasks>", "Set blocked tasks (comma-separated task IDs, replaces existing)")
  .option("--estimated-hours <hours>", "Set estimated hours", parseFloat)
  .option("--actual-hours <hours>", "Set actual hours", parseFloat)
  .option("--due-date <date>", "Set due date (ISO format or empty to clear)")
  .option("-n, --note <text>", "Note for history entry")
  .option("--commit", "Auto-commit after change")
  .option("--no-commit", "Skip auto-commit even if config enables it")
  .action(async (taskId, agent, options) => {
    try {
      await editCommand(taskId, agent, {
        status: options.status as TaskStatus | undefined,
        priority: options.priority as Priority | undefined,
        title: options.title,
        description: options.description,
        assignedTo: options.assignedTo,
        tags: options.tags ? options.tags.split(",").map((t: string) => t.trim()) : undefined,
        dependsOn: options.dependsOn ? options.dependsOn.split(",").map((t: string) => t.trim()) : undefined,
        blocks: options.blocks ? options.blocks.split(",").map((t: string) => t.trim()) : undefined,
        estimatedHours: options.estimatedHours,
        actualHours: options.actualHours,
        dueDate: options.dueDate,
        note: options.note,
        commit: options.commit,
        noCommit: options.noCommit,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Comment command
program
  .command("comment <task-id> <agent>")
  .description("Add a comment to a task")
  .requiredOption("-n, --note <text>", "Comment text")
  .option("--commit", "Auto-commit after change")
  .option("--no-commit", "Skip auto-commit even if config enables it")
  .action(async (taskId, agent, options) => {
    try {
      await commentCommand(taskId, agent, options.note, {
        commit: options.commit,
        noCommit: options.noCommit,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Sync command
program
  .command("sync")
  .description("Commit TICK.md changes to git")
  .option("--push", "Push to remote after committing")
  .option("--pull", "Pull from remote before committing")
  .option("-m, --message <text>", "Custom commit message")
  .option("--init", "Initialize git repo if not exists")
  .option("--remote <name>", "Remote name (default: origin)", "origin")
  .option("--branch <name>", "Branch name (default: current)")
  .action(async (options) => {
    try {
      await syncCommand({
        push: options.push,
        pull: options.pull,
        message: options.message,
        init: options.init,
        remote: options.remote,
        branch: options.branch,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Validate command
program
  .command("validate")
  .description("Validate TICK.md for errors and warnings")
  .option("-v, --verbose", "Show detailed validation stats")
  .action(async (options) => {
    try {
      await validateCommand({
        verbose: options.verbose,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Agent commands
const agent = program
  .command("agent")
  .description("Manage agents");

agent
  .command("register <name>")
  .description("Register a new agent")
  .option("-t, --type <type>", "Agent type (human|bot)", "human")
  .option("-r, --roles <roles>", "Comma-separated roles (e.g., developer,reviewer)", "developer")
  .option("-s, --status <status>", "Initial status (working|idle|offline)", "idle")
  .action(async (name, options) => {
    try {
      await registerAgentCommand(name, {
        type: options.type as AgentType,
        roles: options.roles ? options.roles.split(",").map((r: string) => r.trim()) : undefined,
        status: options.status as AgentStatus,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

agent
  .command("list")
  .description("List all registered agents")
  .option("-s, --status <status>", "Filter by status (working|idle|offline)")
  .option("-t, --type <type>", "Filter by type (human|bot)")
  .option("-v, --verbose", "Show detailed agent information")
  .action(async (options) => {
    try {
      await listAgentsCommand({
        status: options.status as AgentStatus | undefined,
        type: options.type as AgentType | undefined,
        verbose: options.verbose,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// List command
program
  .command("list")
  .description("List tasks with filtering")
  .option("-s, --status <status>", "Filter by status (todo|in_progress|blocked|done)")
  .option("-p, --priority <priority>", "Filter by priority (urgent|high|medium|low)")
  .option("-a, --assigned-to <agent>", "Filter by assigned agent")
  .option("-c, --claimed-by <agent>", "Filter by claiming agent")
  .option("-t, --tag <tag>", "Filter by tag")
  .option("-b, --blocked", "Show only blocked tasks")
  .option("--json", "Output as JSON")
  .action(async (options) => {
    try {
      await listCommand({
        status: options.status as TaskStatus | undefined,
        priority: options.priority as Priority | undefined,
        assignedTo: options.assignedTo,
        claimedBy: options.claimedBy,
        tag: options.tag,
        blocked: options.blocked,
        json: options.json,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Graph command
program
  .command("graph")
  .description("Visualize task dependencies")
  .option("-f, --format <format>", "Output format (ascii|mermaid)", "ascii")
  .option("--show-done", "Include completed tasks")
  .action(async (options) => {
    try {
      await graphCommand({
        format: options.format as "ascii" | "mermaid",
        showDone: options.showDone,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Watch command
program
  .command("watch")
  .description("Watch TICK.md for changes in real-time")
  .option("-i, --interval <seconds>", "Polling interval in seconds", "5")
  .option("-f, --filter <status>", "Filter by status (todo|in_progress|blocked|done)")
  .action(async (options) => {
    try {
      await watchCommand({
        interval: parseInt(options.interval),
        filter: options.filter as TaskStatus | undefined,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Import command
program
  .command("import [file]")
  .description("Import tasks from a YAML file or stdin")
  .option("--dry-run", "Show what would be imported without making changes")
  .option("--commit", "Auto-commit after change")
  .option("--no-commit", "Skip auto-commit even if config enables it")
  .action(async (file, options) => {
    try {
      await importCommand(file, {
        dryRun: options.dryRun,
        commit: options.commit,
        noCommit: options.noCommit,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Undo command
program
  .command("undo")
  .description("Undo the last tick commit by reverting it")
  .option("-f, --force", "Force revert even if not a tick commit")
  .option("--dry-run", "Show what would be reverted without making changes")
  .action(async (options) => {
    try {
      await undoCommand({
        force: options.force,
        dryRun: options.dryRun,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Batch commands
const batch = program
  .command("batch")
  .description("Batch mode for grouping multiple changes into one commit");

batch
  .command("start")
  .description("Start batch mode - suppress auto-commits")
  .action(async () => {
    try {
      await batchStartCommand();
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

batch
  .command("commit")
  .description("Commit all batched changes")
  .option("-m, --message <text>", "Custom commit message")
  .action(async (options) => {
    try {
      await batchCommitCommand(options.message);
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

batch
  .command("abort")
  .description("Exit batch mode without committing")
  .action(async () => {
    try {
      await batchAbortCommand();
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

batch
  .command("status")
  .description("Show batch mode status")
  .action(async () => {
    try {
      await batchStatusCommand();
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Parse arguments
program.parse();
