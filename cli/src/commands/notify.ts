import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";
import chalk from "chalk";
import {
  enqueueWebhook,
  getRetryableItems,
  updateQueueItem,
  getQueueStats,
  loadQueue,
  clearQueue,
  retryFailedItems,
  removeFromQueue,
} from "../utils/webhook-queue.js";

export interface NotifyOptions {
  webhook?: string;
  type?: "slack" | "discord" | "generic";
  dryRun?: boolean;
  noQueue?: boolean;
}

export interface NotifyConfig {
  webhooks: {
    name: string;
    url: string;
    type: "slack" | "discord" | "generic";
    events?: string[]; // e.g., ["task.done", "task.created", "broadcast"]
  }[];
}

/**
 * Send a notification to configured webhooks
 */
export async function notifyCommand(
  event: string,
  message: string,
  options: NotifyOptions = {}
): Promise<void> {
  const cwd = process.cwd();

  // Load notify config from .tick/notify.json or TICK.md frontmatter
  const config = await loadNotifyConfig(cwd);

  if (config.webhooks.length === 0 && !options.webhook) {
    console.log("No notification webhooks configured.");
    console.log("\nTo configure webhooks, create .tick/notify.json:");
    console.log(`
{
  "webhooks": [
    {
      "name": "slack-general",
      "url": "https://hooks.slack.com/services/...",
      "type": "slack",
      "events": ["task.done", "broadcast"]
    }
  ]
}
`);
    return;
  }

  const webhooks = options.webhook
    ? [{ name: "cli", url: options.webhook, type: options.type || "generic" as const, events: [] }]
    : config.webhooks.filter(
        (w) => !w.events || w.events.length === 0 || w.events.includes(event)
      );

  if (webhooks.length === 0) {
    console.log(`No webhooks configured for event: ${event}`);
    return;
  }

  // Process any pending retries first
  if (!options.dryRun && !options.noQueue) {
    await processRetryQueue(cwd);
  }

  for (const webhook of webhooks) {
    if (options.dryRun) {
      console.log(`[DRY RUN] Would notify ${webhook.name} (${webhook.type})`);
      console.log(`  Event: ${event}`);
      console.log(`  Message: ${message}`);
      continue;
    }

    const payload = buildPayload(webhook.type, event, message);

    try {
      await sendNotification(webhook, payload);
      console.log(`✓ Notified ${webhook.name}`);
    } catch (error: any) {
      console.error(`✗ Failed to notify ${webhook.name}: ${error.message}`);

      // Queue for retry unless disabled
      if (!options.noQueue) {
        const queued = await enqueueWebhook(
          webhook,
          event,
          message,
          payload,
          error.message,
          cwd
        );
        console.log(chalk.gray(`  Queued for retry (ID: ${queued.id})`));
      }
    }
  }
}

/**
 * List configured notification webhooks
 */
export async function listNotifyCommand(): Promise<void> {
  const cwd = process.cwd();
  const config = await loadNotifyConfig(cwd);

  if (config.webhooks.length === 0) {
    console.log("No notification webhooks configured.");
    console.log("\nTo configure webhooks, create .tick/notify.json");
    return;
  }

  console.log("Configured Webhooks:\n");
  for (const webhook of config.webhooks) {
    console.log(`  ${webhook.name}`);
    console.log(`    Type: ${webhook.type}`);
    console.log(`    URL: ${webhook.url.substring(0, 50)}...`);
    if (webhook.events && webhook.events.length > 0) {
      console.log(`    Events: ${webhook.events.join(", ")}`);
    } else {
      console.log(`    Events: all`);
    }
    console.log("");
  }
}

/**
 * Load notification config from .tick/notify.json
 */
async function loadNotifyConfig(cwd: string): Promise<NotifyConfig> {
  const configPath = path.join(cwd, ".tick", "notify.json");

  try {
    const content = await fs.readFile(configPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return { webhooks: [] };
  }
}

/**
 * Build payload for a webhook type
 */
function buildPayload(type: string, event: string, message: string): string {
  switch (type) {
    case "slack":
      return JSON.stringify({
        text: `*[${event}]* ${message}`,
        unfurl_links: false,
      });

    case "discord":
      return JSON.stringify({
        content: `**[${event}]** ${message}`,
      });

    default:
      return JSON.stringify({
        event,
        message,
        timestamp: new Date().toISOString(),
      });
  }
}

/**
 * Send notification to a webhook
 */
async function sendNotification(
  webhook: { name: string; url: string; type: string },
  payload: string
): Promise<void> {
  // Use curl for HTTP request (works cross-platform)
  const curlCmd = `curl -s -X POST -H "Content-Type: application/json" -d '${payload.replace(/'/g, "\\'")}' "${webhook.url}"`;

  try {
    execSync(curlCmd, { stdio: "pipe" });
  } catch (error: any) {
    throw new Error(`HTTP request failed: ${error.message}`);
  }
}

/**
 * Process pending retries from the queue
 */
async function processRetryQueue(cwd: string): Promise<void> {
  const retryable = await getRetryableItems(cwd);

  if (retryable.length === 0) {
    return;
  }

  console.log(chalk.gray(`Processing ${retryable.length} queued notification(s)...`));

  for (const item of retryable) {
    try {
      await sendNotification(
        { name: item.webhookName, url: item.webhookUrl, type: item.webhookType },
        item.payload
      );
      await updateQueueItem(item.id, true, undefined, cwd);
      console.log(chalk.green(`✓ Retry successful: ${item.webhookName}`));
    } catch (error: any) {
      await updateQueueItem(item.id, false, error.message, cwd);
      console.log(
        chalk.yellow(`⟳ Retry ${item.attempts + 1} failed: ${item.webhookName}`)
      );
    }
  }
}

/**
 * Test a webhook by sending a test notification
 */
export async function testNotifyCommand(
  webhookName: string
): Promise<void> {
  const cwd = process.cwd();
  const config = await loadNotifyConfig(cwd);

  const webhook = config.webhooks.find((w) => w.name === webhookName);
  if (!webhook) {
    throw new Error(`Webhook not found: ${webhookName}`);
  }

  console.log(`Testing webhook: ${webhook.name}...`);

  const payload = buildPayload(webhook.type, "test", "This is a test notification from tick-md");

  try {
    await sendNotification(webhook, payload);
    console.log("✓ Test notification sent successfully");
  } catch (error: any) {
    console.error(`✗ Test failed: ${error.message}`);
  }
}

/**
 * Show webhook queue status
 */
export async function queueStatusCommand(): Promise<void> {
  const cwd = process.cwd();
  const stats = await getQueueStats(cwd);

  console.log(chalk.cyan.bold("Webhook Queue Status"));
  console.log("");
  console.log(`  Pending: ${stats.pending}`);
  console.log(`  Failed: ${stats.failed}`);
  console.log(`  Total: ${stats.total}`);

  if (stats.nextRetry) {
    const nextTime = new Date(stats.nextRetry);
    const now = Date.now();
    const diff = nextTime.getTime() - now;

    if (diff > 0) {
      const seconds = Math.ceil(diff / 1000);
      console.log(`  Next retry: in ${seconds}s`);
    } else {
      console.log(`  Next retry: ready now`);
    }
  }

  if (stats.total > 0) {
    console.log("");
    console.log(chalk.gray("Run 'tick notify queue list' to see details"));
    console.log(chalk.gray("Run 'tick notify queue retry' to force retry"));
  }
}

/**
 * List queued webhooks
 */
export async function queueListCommand(): Promise<void> {
  const cwd = process.cwd();
  const queue = await loadQueue(cwd);

  if (queue.items.length === 0) {
    console.log("No webhooks in queue.");
    return;
  }

  console.log(chalk.cyan.bold("Queued Webhooks"));
  console.log("");

  for (const item of queue.items) {
    const status = item.nextRetry === "failed"
      ? chalk.red("FAILED")
      : chalk.yellow("PENDING");

    console.log(`  ${status} ${item.id}`);
    console.log(`    Webhook: ${item.webhookName}`);
    console.log(`    Event: ${item.event}`);
    console.log(`    Attempts: ${item.attempts}`);
    console.log(`    Last error: ${item.lastError || "none"}`);

    if (item.nextRetry !== "failed") {
      const nextTime = new Date(item.nextRetry);
      console.log(`    Next retry: ${nextTime.toLocaleString()}`);
    }
    console.log("");
  }
}

/**
 * Clear the webhook queue
 */
export async function queueClearCommand(): Promise<void> {
  const cwd = process.cwd();
  const count = await clearQueue(cwd);

  if (count === 0) {
    console.log("Queue was already empty.");
  } else {
    console.log(`✓ Cleared ${count} item(s) from queue.`);
  }
}

/**
 * Force retry of failed items
 */
export async function queueRetryCommand(): Promise<void> {
  const cwd = process.cwd();
  const count = await retryFailedItems(cwd);

  if (count === 0) {
    console.log("No failed items to retry.");
  } else {
    console.log(`✓ Queued ${count} failed item(s) for retry.`);
    console.log(chalk.gray("Run 'tick notify send' or wait for next notification to process."));
  }

  // Also process any ready items
  await processRetryQueue(cwd);
}

/**
 * Remove a specific item from the queue
 */
export async function queueRemoveCommand(id: string): Promise<void> {
  const cwd = process.cwd();
  const removed = await removeFromQueue(id, cwd);

  if (removed) {
    console.log(`✓ Removed ${id} from queue.`);
  } else {
    console.log(`Item not found: ${id}`);
  }
}
