import fs from "fs/promises";
import path from "path";

const QUEUE_FILE = ".tick/webhook-queue.json";
const MAX_RETRIES = 5;
const INITIAL_DELAY_MS = 1000; // 1 second
const MAX_DELAY_MS = 300000; // 5 minutes

export interface QueuedWebhook {
  id: string;
  webhookName: string;
  webhookUrl: string;
  webhookType: string;
  event: string;
  message: string;
  payload: string;
  createdAt: string;
  lastAttempt: string;
  attempts: number;
  nextRetry: string;
  lastError?: string;
}

export interface WebhookQueue {
  items: QueuedWebhook[];
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `wh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Calculate next retry time with exponential backoff
 */
function calculateNextRetry(attempts: number): Date {
  const delay = Math.min(
    INITIAL_DELAY_MS * Math.pow(2, attempts),
    MAX_DELAY_MS
  );
  return new Date(Date.now() + delay);
}

/**
 * Get queue file path
 */
function getQueuePath(cwd: string): string {
  return path.join(cwd, QUEUE_FILE);
}

/**
 * Load the webhook queue
 */
export async function loadQueue(cwd: string = process.cwd()): Promise<WebhookQueue> {
  const queuePath = getQueuePath(cwd);

  try {
    const content = await fs.readFile(queuePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return { items: [] };
  }
}

/**
 * Save the webhook queue
 */
export async function saveQueue(
  queue: WebhookQueue,
  cwd: string = process.cwd()
): Promise<void> {
  const queuePath = getQueuePath(cwd);
  const dir = path.dirname(queuePath);

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(queuePath, JSON.stringify(queue, null, 2));
}

/**
 * Add a failed webhook to the retry queue
 */
export async function enqueueWebhook(
  webhook: {
    name: string;
    url: string;
    type: string;
  },
  event: string,
  message: string,
  payload: string,
  error: string,
  cwd: string = process.cwd()
): Promise<QueuedWebhook> {
  const queue = await loadQueue(cwd);
  const now = new Date().toISOString();

  const item: QueuedWebhook = {
    id: generateId(),
    webhookName: webhook.name,
    webhookUrl: webhook.url,
    webhookType: webhook.type,
    event,
    message,
    payload,
    createdAt: now,
    lastAttempt: now,
    attempts: 1,
    nextRetry: calculateNextRetry(1).toISOString(),
    lastError: error,
  };

  queue.items.push(item);
  await saveQueue(queue, cwd);

  return item;
}

/**
 * Update a queued item after retry attempt
 */
export async function updateQueueItem(
  id: string,
  success: boolean,
  error?: string,
  cwd: string = process.cwd()
): Promise<void> {
  const queue = await loadQueue(cwd);
  const index = queue.items.findIndex((item) => item.id === id);

  if (index === -1) {
    return;
  }

  if (success) {
    // Remove from queue on success
    queue.items.splice(index, 1);
  } else {
    // Update retry info
    const item = queue.items[index];
    item.attempts++;
    item.lastAttempt = new Date().toISOString();
    item.lastError = error;

    if (item.attempts >= MAX_RETRIES) {
      // Move to dead letter (keep in queue but mark as failed)
      item.nextRetry = "failed";
    } else {
      item.nextRetry = calculateNextRetry(item.attempts).toISOString();
    }
  }

  await saveQueue(queue, cwd);
}

/**
 * Get items ready for retry
 */
export async function getRetryableItems(
  cwd: string = process.cwd()
): Promise<QueuedWebhook[]> {
  const queue = await loadQueue(cwd);
  const now = Date.now();

  return queue.items.filter((item) => {
    if (item.nextRetry === "failed") {
      return false;
    }
    return new Date(item.nextRetry).getTime() <= now;
  });
}

/**
 * Get failed items (exceeded max retries)
 */
export async function getFailedItems(
  cwd: string = process.cwd()
): Promise<QueuedWebhook[]> {
  const queue = await loadQueue(cwd);
  return queue.items.filter((item) => item.nextRetry === "failed");
}

/**
 * Get queue statistics
 */
export async function getQueueStats(
  cwd: string = process.cwd()
): Promise<{
  pending: number;
  failed: number;
  total: number;
  nextRetry: string | null;
}> {
  const queue = await loadQueue(cwd);

  const pending = queue.items.filter((i) => i.nextRetry !== "failed").length;
  const failed = queue.items.filter((i) => i.nextRetry === "failed").length;

  const pendingItems = queue.items
    .filter((i) => i.nextRetry !== "failed")
    .sort((a, b) => new Date(a.nextRetry).getTime() - new Date(b.nextRetry).getTime());

  return {
    pending,
    failed,
    total: queue.items.length,
    nextRetry: pendingItems[0]?.nextRetry || null,
  };
}

/**
 * Clear the entire queue
 */
export async function clearQueue(
  cwd: string = process.cwd()
): Promise<number> {
  const queue = await loadQueue(cwd);
  const count = queue.items.length;

  queue.items = [];
  await saveQueue(queue, cwd);

  return count;
}

/**
 * Remove a specific item from the queue
 */
export async function removeFromQueue(
  id: string,
  cwd: string = process.cwd()
): Promise<boolean> {
  const queue = await loadQueue(cwd);
  const index = queue.items.findIndex((item) => item.id === id);

  if (index === -1) {
    return false;
  }

  queue.items.splice(index, 1);
  await saveQueue(queue, cwd);
  return true;
}

/**
 * Retry failed items and remove them from dead letter
 */
export async function retryFailedItems(
  cwd: string = process.cwd()
): Promise<number> {
  const queue = await loadQueue(cwd);
  let count = 0;

  for (const item of queue.items) {
    if (item.nextRetry === "failed") {
      item.attempts = 0;
      item.nextRetry = new Date().toISOString();
      count++;
    }
  }

  if (count > 0) {
    await saveQueue(queue, cwd);
  }

  return count;
}
