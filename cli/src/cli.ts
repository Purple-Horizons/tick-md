#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { TickError, formatError } from "./utils/errors.js";

/**
 * Handle errors with contextual suggestions
 */
function handleError(error: any): never {
  if (error instanceof TickError) {
    console.error(chalk.red("Error:"), formatError(error));
  } else {
    console.error(chalk.red("Error:"), error.message);
  }
  process.exit(1);
}
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
import { broadcastCommand, listBroadcastsCommand } from "./commands/broadcast.js";
import {
  notifyCommand,
  listNotifyCommand,
  testNotifyCommand,
  queueStatusCommand,
  queueListCommand,
  queueClearCommand,
  queueRetryCommand,
  queueRemoveCommand,
} from "./commands/notify.js";
import { archiveCommand, listArchiveCommand } from "./commands/archive.js";
import { repairCommand } from "./commands/repair.js";
import { conflictsCommand } from "./commands/conflicts.js";
import { compactCommand, historyStatsCommand } from "./commands/compact.js";
import { warnAboutActiveAgents } from "./utils/conflict.js";
import { completionCommand, type ShellType } from "./commands/completion.js";
import { getLastAgent, getCurrentTask, rememberAgent, getAvailableTasks } from "./utils/session.js";
import {
  backupListCommand,
  backupCreateCommand,
  backupRestoreCommand,
  backupShowCommand,
  backupCleanCommand,
} from "./commands/backup.js";
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
  .command("claim [task-id] [agent]")
  .description("Claim a task for an agent (shows available tasks if task-id omitted)")
  .option("--commit", "Auto-commit after change")
  .option("--no-commit", "Skip auto-commit even if config enables it")
  .action(async (taskId, agent, options) => {
    try {
      // Smart argument handling: if taskId looks like an agent, swap them
      let resolvedTaskId = taskId;
      let resolvedAgent = agent;

      if (taskId && taskId.startsWith("@") && !agent) {
        // User passed agent as first arg - swap them
        resolvedAgent = taskId;
        resolvedTaskId = undefined;
      }

      // Resolve agent from session if not provided
      if (!resolvedAgent) {
        resolvedAgent = await getLastAgent();
        if (!resolvedAgent) {
          throw new Error("No agent specified. Use: tick claim <task-id> <agent>");
        }
        console.log(chalk.gray(`Using last agent: ${resolvedAgent}`));
      }

      // If no task ID, show available tasks
      if (!resolvedTaskId) {
        const available = await getAvailableTasks();
        if (available.length === 0) {
          console.log("No available tasks to claim.");
          console.log(chalk.gray("All tasks are either claimed, blocked, or done."));
          return;
        }

        console.log(chalk.cyan("Available tasks to claim:\n"));
        for (const task of available.slice(0, 10)) {
          const priorityColor = task.priority === "urgent" || task.priority === "high"
            ? chalk.red
            : task.priority === "low"
            ? chalk.gray
            : chalk.yellow;
          console.log(`  ${task.id}  ${priorityColor(`[${task.priority}]`)}  ${task.title}`);
        }
        if (available.length > 10) {
          console.log(chalk.gray(`\n  ... and ${available.length - 10} more`));
        }
        console.log(chalk.gray(`\nUse: tick claim <task-id> ${resolvedAgent}`));
        return;
      }

      // Warn about other active agents
      const activeWarnings = await warnAboutActiveAgents(resolvedAgent);
      if (activeWarnings.length > 0) {
        console.log(chalk.yellow("Note: Other agents are currently working:"));
        for (const warning of activeWarnings) {
          console.log(chalk.yellow(`  ${warning}`));
        }
        console.log("");
      }

      await claimCommand(resolvedTaskId, resolvedAgent, {
        commit: options.commit,
        noCommit: options.noCommit,
      });

      // Remember agent for next time
      await rememberAgent(resolvedAgent);
    } catch (error: any) {
      handleError(error);
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
  .command("done [task-id] [agent]")
  .description("Mark a task as complete (defaults to current task if omitted)")
  .option("--commit", "Auto-commit after change")
  .option("--no-commit", "Skip auto-commit even if config enables it")
  .option("--skip-workflow", "Skip workflow warning for tasks that were never started")
  .action(async (taskId, agent, options) => {
    try {
      // Smart argument handling: if taskId looks like an agent, swap them
      let argTaskId = taskId;
      let argAgent = agent;

      if (taskId && taskId.startsWith("@") && !agent) {
        // User passed agent as first arg - swap them
        argAgent = taskId;
        argTaskId = undefined;
      }

      // Resolve agent (use last agent if not provided)
      let resolvedAgent = argAgent;
      if (!resolvedAgent) {
        resolvedAgent = await getLastAgent();
        if (!resolvedAgent) {
          throw new Error("No agent specified. Use: tick done <task-id> <agent>");
        }
        console.log(chalk.gray(`Using last agent: ${resolvedAgent}`));
      }

      // Resolve task ID (use current task for agent if not provided)
      let resolvedTaskId = argTaskId;
      if (!resolvedTaskId) {
        resolvedTaskId = await getCurrentTask(resolvedAgent);
        if (!resolvedTaskId) {
          throw new Error(
            `No task specified and ${resolvedAgent} is not working on any task.\n` +
            `Use: tick done <task-id> ${resolvedAgent}`
          );
        }
        console.log(chalk.gray(`Completing current task: ${resolvedTaskId}`));
      }

      await doneCommand(resolvedTaskId, resolvedAgent, {
        commit: options.commit,
        noCommit: options.noCommit,
        skipWorkflow: options.skipWorkflow,
      });

      // Remember agent for next time
      await rememberAgent(resolvedAgent);
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

// Repair command
program
  .command("repair")
  .description("Auto-fix common TICK.md issues")
  .option("--dry-run", "Show what would be fixed without making changes")
  .option("-f, --force", "Apply repairs without confirmation")
  .action(async (options) => {
    try {
      await repairCommand({
        dryRun: options.dryRun,
        force: options.force,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Conflicts command
program
  .command("conflicts")
  .description("Check for conflicts and concurrent agent activity")
  .option("-v, --verbose", "Show detailed information")
  .action(async (options) => {
    try {
      await conflictsCommand({
        verbose: options.verbose,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Compact command
program
  .command("compact")
  .description("Compact task history to reduce file size")
  .option("-n, --max-history <n>", "Keep only last N entries per task (default: 10)", "10")
  .option("-m, --milestones-only", "Keep only milestone events (created, completed, etc.)")
  .option("--dry-run", "Show what would be removed without making changes")
  .option("--no-backup", "Skip creating a backup before compacting")
  .action(async (options) => {
    try {
      await compactCommand({
        maxHistory: parseInt(options.maxHistory, 10),
        milestonesOnly: options.milestonesOnly,
        dryRun: options.dryRun,
        noBackup: options.backup === false,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// History stats command
program
  .command("history-stats")
  .description("Show history statistics and compaction recommendations")
  .action(async () => {
    try {
      await historyStatsCommand();
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
  .option("-f, --format <format>", "Output format (compact|wide|table|ids|oneline)")
  .option("--no-group", "Don't group by status")
  .option("--no-color", "Disable colors (for piping)")
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
        format: options.format,
        noGroup: options.group === false,
        noColor: options.color === false,
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
  .description("Undo the last tick commit or restore from backup")
  .option("-f, --force", "Force revert even if not a tick commit")
  .option("--dry-run", "Show what would be undone without making changes")
  .option("-b, --backup [identifier]", "Restore from backup instead of git revert (index or timestamp)")
  .option("-l, --list", "List available backups for undo")
  .action(async (options) => {
    try {
      await undoCommand({
        force: options.force,
        dryRun: options.dryRun,
        backup: options.backup,
        list: options.list,
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

// Broadcast command
program
  .command("broadcast <agent> <message>")
  .description("Send a message to the squad log")
  .option("--commit", "Auto-commit after change")
  .option("--no-commit", "Skip auto-commit even if config enables it")
  .action(async (agent, message, options) => {
    try {
      await broadcastCommand(agent, message, {
        commit: options.commit,
        noCommit: options.noCommit,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Broadcasts list command
program
  .command("broadcasts")
  .description("List recent broadcasts from the squad log")
  .option("-l, --limit <count>", "Number of broadcasts to show", "10")
  .action(async (options) => {
    try {
      await listBroadcastsCommand({
        limit: parseInt(options.limit),
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Notify commands
const notify = program
  .command("notify")
  .description("Send notifications to configured webhooks");

notify
  .command("send <event> <message>")
  .description("Send a notification")
  .option("-w, --webhook <url>", "Send to specific webhook URL")
  .option("-t, --type <type>", "Webhook type (slack|discord|generic)", "generic")
  .option("--dry-run", "Show what would be sent without sending")
  .action(async (event, message, options) => {
    try {
      await notifyCommand(event, message, {
        webhook: options.webhook,
        type: options.type,
        dryRun: options.dryRun,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

notify
  .command("list")
  .description("List configured webhooks")
  .action(async () => {
    try {
      await listNotifyCommand();
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

notify
  .command("test <webhook-name>")
  .description("Test a configured webhook")
  .action(async (webhookName) => {
    try {
      await testNotifyCommand(webhookName);
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Queue subcommands
const queue = notify
  .command("queue")
  .description("Manage webhook retry queue");

queue
  .command("status")
  .description("Show queue status")
  .action(async () => {
    try {
      await queueStatusCommand();
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

queue
  .command("list")
  .description("List queued webhooks")
  .action(async () => {
    try {
      await queueListCommand();
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

queue
  .command("clear")
  .description("Clear all queued webhooks")
  .action(async () => {
    try {
      await queueClearCommand();
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

queue
  .command("retry")
  .description("Retry failed webhooks")
  .action(async () => {
    try {
      await queueRetryCommand();
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

queue
  .command("remove <id>")
  .description("Remove a specific item from queue")
  .action(async (id) => {
    try {
      await queueRemoveCommand(id);
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Archive command
program
  .command("archive")
  .description("Archive completed tasks to ARCHIVE.md")
  .option("-b, --before <date>", "Archive tasks completed before date (e.g., 30d, 2026-01-01)")
  .option("-s, --status <status>", "Status to archive (default: done)", "done")
  .option("--dry-run", "Show what would be archived without making changes")
  .option("--commit", "Auto-commit after change")
  .option("--no-commit", "Skip auto-commit even if config enables it")
  .action(async (options) => {
    try {
      await archiveCommand({
        before: options.before,
        status: options.status as TaskStatus,
        dryRun: options.dryRun,
        commit: options.commit,
        noCommit: options.noCommit,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Archive list command
program
  .command("archived")
  .description("List archived tasks from ARCHIVE.md")
  .option("-l, --limit <count>", "Number of tasks to show", "20")
  .action(async (options) => {
    try {
      await listArchiveCommand({
        limit: parseInt(options.limit),
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Backup commands
const backup = program
  .command("backup")
  .description("Manage TICK.md backups");

backup
  .command("list")
  .description("List available backups")
  .option("-l, --limit <count>", "Number of backups to show", "10")
  .action(async (options) => {
    try {
      await backupListCommand({
        limit: parseInt(options.limit),
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

backup
  .command("create")
  .description("Create a manual backup of TICK.md")
  .action(async () => {
    try {
      await backupCreateCommand();
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

backup
  .command("restore <identifier>")
  .description("Restore TICK.md from a backup (index number or timestamp)")
  .option("-f, --force", "Proceed with restore without confirmation")
  .action(async (identifier, options) => {
    try {
      await backupRestoreCommand(identifier, {
        force: options.force,
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

backup
  .command("show <identifier>")
  .description("Show details about a specific backup")
  .action(async (identifier) => {
    try {
      await backupShowCommand(identifier);
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

backup
  .command("clean")
  .description("Remove old backups, keeping recent ones")
  .option("-k, --keep <count>", "Number of backups to keep", "10")
  .action(async (options) => {
    try {
      await backupCleanCommand({
        keep: parseInt(options.keep),
      });
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Completion command
program
  .command("completion <shell>")
  .description("Generate shell completion script (bash, zsh, fish)")
  .action(async (shell) => {
    try {
      await completionCommand(shell as ShellType);
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Parse arguments
program.parse();
