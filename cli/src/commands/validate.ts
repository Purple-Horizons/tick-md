import * as fs from "node:fs";
import chalk from "chalk";
import { parseTickFile } from "../parser/parse.js";
import { validateTickFile } from "../utils/validator.js";

export interface ValidateOptions {
  verbose?: boolean;
}

/**
 * Validate the current TICK.md file
 */
export async function validateCommand(options: ValidateOptions = {}): Promise<void> {
  const tickPath = "TICK.md";

  if (!fs.existsSync(tickPath)) {
    console.error(chalk.red("✗ TICK.md not found"));
    console.log(chalk.gray("Run 'tick init' to initialize a project"));
    process.exit(1);
  }

  console.log(chalk.cyan("🔍 Validating TICK.md..."));
  console.log();

  try {
    const content = fs.readFileSync(tickPath, "utf-8");
    const tickFile = parseTickFile(content);
    const result = validateTickFile(tickFile);

    // Display errors
    if (result.errors.length > 0) {
      console.log(chalk.red.bold(`✗ ${result.errors.length} error(s) found:`));
      console.log();

      for (const error of result.errors) {
        console.log(chalk.red("  ✗"), chalk.white.bold(error.message));
        if (error.location) {
          console.log(chalk.gray(`    Location: ${error.location}`));
        }
        if (error.fix) {
          console.log(chalk.cyan(`    Fix: ${error.fix}`));
        }
        console.log();
      }
    }

    // Display warnings
    if (result.warnings.length > 0) {
      console.log(chalk.yellow.bold(`⚠ ${result.warnings.length} warning(s) found:`));
      console.log();

      for (const warning of result.warnings) {
        console.log(chalk.yellow("  ⚠"), chalk.white(warning.message));
        if (warning.location) {
          console.log(chalk.gray(`    Location: ${warning.location}`));
        }
        if (warning.fix) {
          console.log(chalk.cyan(`    Fix: ${warning.fix}`));
        }
        console.log();
      }
    }

    // Display summary
    console.log(chalk.gray("─".repeat(60)));
    
    if (result.valid && result.warnings.length === 0) {
      console.log(chalk.green.bold("✓ TICK.md is valid!"));
      console.log();
      console.log(chalk.gray(`  ${tickFile.tasks.length} tasks validated`));
      console.log(chalk.gray(`  ${tickFile.agents.length} agents registered`));
    } else if (result.valid) {
      console.log(chalk.yellow.bold("✓ TICK.md is valid (with warnings)"));
      console.log();
      console.log(chalk.gray(`  ${tickFile.tasks.length} tasks validated`));
      console.log(chalk.gray(`  ${tickFile.agents.length} agents registered`));
      console.log(chalk.yellow(`  ${result.warnings.length} warnings to address`));
    } else {
      console.log(chalk.red.bold("✗ TICK.md has errors"));
      console.log();
      console.log(chalk.red(`  ${result.errors.length} errors to fix`));
      console.log(chalk.yellow(`  ${result.warnings.length} warnings to address`));
      process.exit(1);
    }

    // Verbose stats
    if (options.verbose) {
      console.log();
      console.log(chalk.cyan.bold("Detailed Stats:"));
      console.log();

      const statuses = tickFile.tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      for (const [status, count] of Object.entries(statuses)) {
        console.log(chalk.gray(`  ${status}: ${count}`));
      }

      const blockedTasks = tickFile.tasks.filter((t) => t.status === "blocked");
      if (blockedTasks.length > 0) {
        console.log();
        console.log(chalk.yellow(`  ${blockedTasks.length} blocked tasks`));
      }

      const unassigned = tickFile.tasks.filter(
        (t) => !t.assigned_to && t.status !== "done"
      ).length;
      if (unassigned > 0) {
        console.log(chalk.gray(`  ${unassigned} unassigned tasks`));
      }
    }

    console.log();
  } catch (error) {
    console.error(chalk.red("✗ Failed to parse TICK.md"));
    console.error(chalk.gray((error as Error).message));
    process.exit(1);
  }
}
