import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import type { TickFile } from "../types.js";
import { parseTickFile } from "../parser/parse.js";

interface CacheEntry {
  hash: string;
  mtime: number;
  size: number;
  tickFile: TickFile;
  cachedAt: number;
}

// In-memory cache
let memoryCache: CacheEntry | null = null;

// Cache file location
const CACHE_DIR = ".tick";
const CACHE_FILE = "parse-cache.json";

/**
 * Compute content hash for change detection
 */
function computeHash(content: string): string {
  return crypto.createHash("md5").update(content).digest("hex");
}

/**
 * Get cache file path
 */
function getCachePath(cwd: string): string {
  return path.join(cwd, CACHE_DIR, CACHE_FILE);
}

/**
 * Load cache from disk
 */
async function loadDiskCache(cwd: string): Promise<CacheEntry | null> {
  try {
    const cachePath = getCachePath(cwd);
    const content = await fs.readFile(cachePath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Save cache to disk
 */
async function saveDiskCache(cwd: string, entry: CacheEntry): Promise<void> {
  try {
    const cachePath = getCachePath(cwd);
    const dir = path.dirname(cachePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify(entry));
  } catch {
    // Ignore cache write errors - not critical
  }
}

/**
 * Parse TICK.md with caching
 * Returns cached result if file hasn't changed
 */
export async function parseTickFileCached(
  cwd: string = process.cwd(),
  options: { forceRefresh?: boolean; persistCache?: boolean } = {}
): Promise<TickFile> {
  const tickPath = path.join(cwd, "TICK.md");

  // Get current file stats
  let stat: Awaited<ReturnType<typeof fs.stat>>;
  let content: string;

  try {
    stat = await fs.stat(tickPath);
    content = await fs.readFile(tickPath, "utf-8");
  } catch (error: any) {
    if (error.code === "ENOENT") {
      throw new Error("TICK.md not found. Run 'tick init' to create a project.");
    }
    throw error;
  }

  const currentHash = computeHash(content);
  const currentMtime = stat.mtimeMs;
  const currentSize = stat.size;

  // Check memory cache first (fastest)
  if (
    !options.forceRefresh &&
    memoryCache &&
    memoryCache.hash === currentHash &&
    memoryCache.mtime === currentMtime &&
    memoryCache.size === currentSize
  ) {
    return memoryCache.tickFile;
  }

  // Check disk cache (useful for CLI invocations)
  if (!options.forceRefresh && options.persistCache) {
    const diskCache = await loadDiskCache(cwd);
    if (
      diskCache &&
      diskCache.hash === currentHash &&
      diskCache.mtime === currentMtime &&
      diskCache.size === currentSize
    ) {
      // Restore to memory cache
      memoryCache = diskCache;
      return diskCache.tickFile;
    }
  }

  // Parse fresh
  const tickFile = parseTickFile(content);

  // Update caches
  const cacheEntry: CacheEntry = {
    hash: currentHash,
    mtime: currentMtime,
    size: currentSize,
    tickFile,
    cachedAt: Date.now(),
  };

  memoryCache = cacheEntry;

  if (options.persistCache) {
    await saveDiskCache(cwd, cacheEntry);
  }

  return tickFile;
}

/**
 * Invalidate all caches (call after writing TICK.md)
 */
export function invalidateCache(): void {
  memoryCache = null;
}

/**
 * Invalidate disk cache
 */
export async function invalidateDiskCache(cwd: string = process.cwd()): Promise<void> {
  memoryCache = null;
  try {
    await fs.unlink(getCachePath(cwd));
  } catch {
    // Ignore - cache may not exist
  }
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats(): {
  hasMemoryCache: boolean;
  cachedAt?: string;
  hash?: string;
  taskCount?: number;
} {
  if (!memoryCache) {
    return { hasMemoryCache: false };
  }

  return {
    hasMemoryCache: true,
    cachedAt: new Date(memoryCache.cachedAt).toISOString(),
    hash: memoryCache.hash.slice(0, 8),
    taskCount: memoryCache.tickFile.tasks.length,
  };
}

/**
 * Preload cache for a directory (call at CLI startup for faster subsequent calls)
 */
export async function preloadCache(cwd: string = process.cwd()): Promise<boolean> {
  try {
    await parseTickFileCached(cwd, { persistCache: true });
    return true;
  } catch {
    return false;
  }
}
