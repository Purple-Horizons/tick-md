import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const BACKUP_DIR = ".tick/backup";
const MAX_BACKUPS = 50; // Keep last 50 backups

export interface BackupInfo {
  timestamp: string;
  filename: string;
  filepath: string;
  size: number;
  hash: string;
}

/**
 * Ensure backup directory exists
 */
async function ensureBackupDir(cwd: string): Promise<string> {
  const backupDir = path.join(cwd, BACKUP_DIR);
  await fs.mkdir(backupDir, { recursive: true });
  return backupDir;
}

/**
 * Generate a content hash for integrity verification
 */
function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 12);
}

/**
 * Create a backup of TICK.md before destructive operations
 * Returns the backup info for potential restoration
 */
export async function createBackup(
  cwd: string = process.cwd()
): Promise<BackupInfo> {
  const tickPath = path.join(cwd, "TICK.md");
  const backupDir = await ensureBackupDir(cwd);

  // Read current content
  const content = await fs.readFile(tickPath, "utf-8");
  const hash = hashContent(content);

  // Generate timestamp-based filename
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  const filename = `TICK-${timestamp}.md`;
  const filepath = path.join(backupDir, filename);

  // Write backup
  await fs.writeFile(filepath, content);

  // Get file stats
  const stats = await fs.stat(filepath);

  // Clean up old backups (keep last MAX_BACKUPS)
  await cleanupOldBackups(backupDir);

  return {
    timestamp: now.toISOString(),
    filename,
    filepath,
    size: stats.size,
    hash,
  };
}

/**
 * List all available backups, sorted by date (newest first)
 */
export async function listBackups(
  cwd: string = process.cwd()
): Promise<BackupInfo[]> {
  const backupDir = path.join(cwd, BACKUP_DIR);

  try {
    await fs.access(backupDir);
  } catch {
    return []; // No backup directory yet
  }

  const files = await fs.readdir(backupDir);
  const backups: BackupInfo[] = [];

  for (const filename of files) {
    if (!filename.startsWith("TICK-") || !filename.endsWith(".md")) {
      continue;
    }

    const filepath = path.join(backupDir, filename);
    const stats = await fs.stat(filepath);
    const content = await fs.readFile(filepath, "utf-8");

    // Extract timestamp from filename: TICK-2026-02-17T12-30-45-123Z.md
    const timestampMatch = filename.match(/TICK-(.+)\.md$/);
    const timestamp = timestampMatch
      ? timestampMatch[1].replace(/-/g, (m, i) => (i < 19 ? (i === 10 ? "T" : i === 13 || i === 16 ? ":" : "-") : m))
      : "";

    backups.push({
      timestamp: parseBackupTimestamp(filename),
      filename,
      filepath,
      size: stats.size,
      hash: hashContent(content),
    });
  }

  // Sort by timestamp, newest first
  return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * Parse timestamp from backup filename
 */
function parseBackupTimestamp(filename: string): string {
  // TICK-2026-02-17T12-30-45-123Z.md -> 2026-02-17T12:30:45.123Z
  const match = filename.match(/TICK-(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z\.md$/);
  if (match) {
    const [, year, month, day, hour, min, sec, ms] = match;
    return `${year}-${month}-${day}T${hour}:${min}:${sec}.${ms}Z`;
  }
  return filename;
}

/**
 * Get a specific backup by timestamp or index
 * @param identifier - ISO timestamp string or relative index (0 = most recent)
 */
export async function getBackup(
  identifier: string | number,
  cwd: string = process.cwd()
): Promise<BackupInfo | null> {
  const backups = await listBackups(cwd);

  if (backups.length === 0) {
    return null;
  }

  if (typeof identifier === "number") {
    return backups[identifier] || null;
  }

  // Find by timestamp (partial match allowed)
  return backups.find((b) => b.timestamp.startsWith(identifier)) || null;
}

/**
 * Restore TICK.md from a backup
 * Creates a backup of current state first (unless skipCurrentBackup is true)
 */
export async function restoreBackup(
  identifier: string | number,
  cwd: string = process.cwd(),
  skipCurrentBackup: boolean = false
): Promise<{ restored: BackupInfo; previousBackup?: BackupInfo }> {
  const backup = await getBackup(identifier, cwd);

  if (!backup) {
    throw new Error(`Backup not found: ${identifier}`);
  }

  // Backup current state first (so we can undo the restore if needed)
  let previousBackup: BackupInfo | undefined;
  if (!skipCurrentBackup) {
    try {
      previousBackup = await createBackup(cwd);
    } catch {
      // Ignore if current TICK.md doesn't exist
    }
  }

  // Read backup content
  const content = await fs.readFile(backup.filepath, "utf-8");

  // Restore using atomic write
  const tickPath = path.join(cwd, "TICK.md");
  await writeFileAtomic(tickPath, content);

  return { restored: backup, previousBackup };
}

/**
 * Delete old backups, keeping only the most recent MAX_BACKUPS
 */
async function cleanupOldBackups(backupDir: string): Promise<void> {
  const files = await fs.readdir(backupDir);
  const backupFiles = files
    .filter((f) => f.startsWith("TICK-") && f.endsWith(".md"))
    .sort()
    .reverse(); // Newest first

  if (backupFiles.length <= MAX_BACKUPS) {
    return;
  }

  // Delete oldest backups
  const toDelete = backupFiles.slice(MAX_BACKUPS);
  for (const filename of toDelete) {
    await fs.unlink(path.join(backupDir, filename));
  }
}

/**
 * Write file atomically using temp file + rename pattern
 * This ensures file is never partially written
 */
export async function writeFileAtomic(
  filePath: string,
  content: string
): Promise<void> {
  const dir = path.dirname(filePath);
  const tempPath = path.join(dir, `.${path.basename(filePath)}.tmp.${process.pid}`);

  try {
    // Write to temporary file
    await fs.writeFile(tempPath, content);

    // Atomic rename (on POSIX systems, this is atomic)
    await fs.rename(tempPath, filePath);
  } catch (error) {
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempPath);
    } catch {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Helper to wrap a write operation with backup
 * Use this for destructive operations like delete, archive, etc.
 */
export async function withBackup<T>(
  cwd: string,
  operation: () => Promise<T>
): Promise<{ result: T; backup: BackupInfo }> {
  const backup = await createBackup(cwd);

  try {
    const result = await operation();
    return { result, backup };
  } catch (error) {
    // Operation failed - backup is still there for recovery
    throw error;
  }
}
