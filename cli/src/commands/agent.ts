import * as fs from "node:fs";
import chalk from "chalk";
import { parseTickFile } from "../parser/parse.js";
import { serializeTickFile } from "../parser/serialize.js";
import type { Agent, AgentStatus, AgentType } from "../types.js";

export interface AgentRegisterOptions {
  type?: AgentType;
  roles?: string[];
  status?: AgentStatus;
}

export interface AgentListOptions {
  status?: AgentStatus;
  type?: AgentType;
  verbose?: boolean;
}

/**
 * Register a new agent in TICK.md
 */
export async function registerAgentCommand(
  name: string,
  options: AgentRegisterOptions = {}
): Promise<void> {
  const tickPath = "TICK.md";

  if (!fs.existsSync(tickPath)) {
    console.error(chalk.red("✗ TICK.md not found"));
    console.log(chalk.gray("Run 'tick init' to initialize a project"));
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(tickPath, "utf-8");
    const tickFile = parseTickFile(content);

    // Check if agent already exists
    const existingAgent = tickFile.agents.find((a) => a.name === name);
    if (existingAgent) {
      console.error(chalk.red(`✗ Agent '${name}' already registered`));
      console.log(chalk.gray("Use 'tick agent list' to see all agents"));
      process.exit(1);
    }

    // Create new agent
    const newAgent: Agent = {
      name,
      type: options.type || "human",
      roles: options.roles || ["developer"],
      status: options.status || "idle",
      working_on: null,
      last_active: new Date().toISOString(),
      trust_level: "trusted",
    };

    tickFile.agents.push(newAgent);
    tickFile.meta.updated = new Date().toISOString();

    // Save
    const updated = serializeTickFile(tickFile);
    fs.writeFileSync(tickPath, updated);

    console.log(chalk.green(`✓ Agent '${name}' registered`));
    console.log();
    console.log(chalk.gray(`  Type: ${newAgent.type}`));
    console.log(chalk.gray(`  Roles: ${newAgent.roles.join(", ")}`));
    console.log(chalk.gray(`  Status: ${newAgent.status}`));

    console.log();
  } catch (error) {
    console.error(chalk.red("✗ Failed to register agent"));
    console.error(chalk.gray((error as Error).message));
    process.exit(1);
  }
}

/**
 * List all agents in TICK.md
 */
export async function listAgentsCommand(options: AgentListOptions = {}): Promise<void> {
  const tickPath = "TICK.md";

  if (!fs.existsSync(tickPath)) {
    console.error(chalk.red("✗ TICK.md not found"));
    console.log(chalk.gray("Run 'tick init' to initialize a project"));
    process.exit(1);
  }

  try {
    const content = fs.readFileSync(tickPath, "utf-8");
    const tickFile = parseTickFile(content);

    // Filter agents
    let agents = tickFile.agents;

    if (options.status) {
      agents = agents.filter((a) => a.status === options.status);
    }

    if (options.type) {
      agents = agents.filter((a) => a.type === options.type);
    }

    if (agents.length === 0) {
      console.log(chalk.yellow("No agents found"));
      return;
    }

    // Display agents
    console.log(chalk.cyan.bold(`📋 Agents (${agents.length})`));
    console.log();

    for (const agent of agents) {
      const statusColor =
        agent.status === "working"
          ? chalk.green
          : agent.status === "idle"
          ? chalk.yellow
          : chalk.gray;

      const typeIcon = agent.type === "bot" ? "🤖" : "👤";
      console.log(`${typeIcon} ${chalk.white.bold(agent.name)}`);
      console.log(chalk.gray(`   Status: ${statusColor(agent.status)}`));
      console.log(chalk.gray(`   Roles: ${agent.roles.join(", ")}`));

      if (options.verbose) {
        console.log(chalk.gray(`   Trust Level: ${agent.trust_level}`));

        // Show tasks this agent is working on
        const claimedTasks = tickFile.tasks.filter((t) => t.claimed_by === agent.name);
        if (claimedTasks.length > 0) {
          console.log(
            chalk.gray(
              `   Current tasks: ${claimedTasks.map((t) => t.id).join(", ")}`
            )
          );
        }

        // Show completed tasks
        const completedTasks = tickFile.tasks.filter((t) =>
          t.history.some(
            (h) => h.action === "done" && h.who === agent.name
          )
        );
        if (completedTasks.length > 0) {
          console.log(chalk.gray(`   Completed: ${completedTasks.length} tasks`));
        }
      }

      console.log();
    }

    // Summary
    if (!options.verbose) {
      const byStatus = agents.reduce((acc, agent) => {
        acc[agent.status] = (acc[agent.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log(chalk.gray("─".repeat(50)));
      console.log(chalk.gray("Status summary:"));
      for (const [status, count] of Object.entries(byStatus)) {
        console.log(chalk.gray(`  ${status}: ${count}`));
      }
    }
  } catch (error) {
    console.error(chalk.red("✗ Failed to list agents"));
    console.error(chalk.gray((error as Error).message));
    process.exit(1);
  }
}
