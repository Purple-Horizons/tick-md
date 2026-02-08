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
import type { Priority, AgentStatus, AgentType } from "./types.js";

const program = new Command();

program
  .name("tick")
  .description("Multi-agent task coordination via Markdown")
  .version("0.1.0");

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
  .action(async (taskId, agent) => {
    try {
      await claimCommand(taskId, agent);
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Release command
program
  .command("release <task-id> <agent>")
  .description("Release a claimed task")
  .action(async (taskId, agent) => {
    try {
      await releaseCommand(taskId, agent);
    } catch (error: any) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Done command
program
  .command("done <task-id> <agent>")
  .description("Mark a task as complete")
  .action(async (taskId, agent) => {
    try {
      await doneCommand(taskId, agent);
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
  .action(async (taskId, agent, options) => {
    try {
      await commentCommand(taskId, agent, options.note);
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

// Parse arguments
program.parse();
