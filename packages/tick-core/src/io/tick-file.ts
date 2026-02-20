import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { parseTickFile } from "../parser/parse.js";
import { serializeTickFile } from "../parser/serialize.js";
import type { TickFile } from "../types.js";

export const TICK_FILENAME = "TICK.md";

export interface TickFileReadState {
  filePath: string;
  mtimeMs: number;
  size: number;
}

function assertNotSymlink(filePath: string): void {
  const stat = fs.lstatSync(filePath);
  if (stat.isSymbolicLink() && process.env.TICK_ALLOW_SYMLINK_WRITE !== "1") {
    throw new Error(
      "Refusing to write through symlinked TICK.md. Set TICK_ALLOW_SYMLINK_WRITE=1 to override."
    );
  }
}

export function findTickFile(baseDir: string = process.cwd()): string | null {
  const tickPath = path.join(baseDir, TICK_FILENAME);
  return fs.existsSync(tickPath) ? tickPath : null;
}

export async function readTickFile(tickPath?: string): Promise<TickFile> {
  const filePath = tickPath || findTickFile();
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error("TICK.md not found. Run 'tick init' to create a project.");
  }
  const content = await fsp.readFile(filePath, "utf-8");
  return parseTickFile(content);
}

export function readTickFileSync(tickPath?: string): TickFile {
  const filePath = tickPath || findTickFile();
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error("TICK.md not found. Run 'tick init' to create a project.");
  }
  const content = fs.readFileSync(filePath, "utf-8");
  return parseTickFile(content);
}

export function readTickFileStateSync(tickPath?: string): { tickFile: TickFile; state: TickFileReadState } {
  const filePath = tickPath || findTickFile();
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error("TICK.md not found. Run 'tick init' to create a project.");
  }
  const stat = fs.statSync(filePath);
  const content = fs.readFileSync(filePath, "utf-8");
  return {
    tickFile: parseTickFile(content),
    state: {
      filePath,
      mtimeMs: stat.mtimeMs,
      size: stat.size,
    },
  };
}

function assertFileUnchanged(filePath: string, expected?: TickFileReadState): void {
  if (!expected) return;
  const current = fs.statSync(filePath);
  if (current.mtimeMs !== expected.mtimeMs || current.size !== expected.size) {
    throw new Error("Concurrent modification detected. Re-read TICK.md and retry.");
  }
}

export async function writeTickFileAtomic(
  tickFile: TickFile,
  tickPath?: string,
  expected?: TickFileReadState
): Promise<void> {
  const filePath = tickPath || findTickFile();
  if (!filePath) {
    throw new Error("TICK.md not found. Run 'tick init' to create a project.");
  }

  assertNotSymlink(filePath);
  assertFileUnchanged(filePath, expected);
  const content = serializeTickFile(tickFile);
  const dir = path.dirname(filePath);
  const tempPath = path.join(dir, `${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);

  await fsp.writeFile(tempPath, content, "utf-8");
  await fsp.rename(tempPath, filePath);
}

export function writeTickFileAtomicSync(
  tickFile: TickFile,
  tickPath?: string,
  expected?: TickFileReadState
): void {
  const filePath = tickPath || findTickFile();
  if (!filePath) {
    throw new Error("TICK.md not found. Run 'tick init' to create a project.");
  }

  assertNotSymlink(filePath);
  assertFileUnchanged(filePath, expected);
  const content = serializeTickFile(tickFile);
  const dir = path.dirname(filePath);
  const tempPath = path.join(dir, `${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);

  fs.writeFileSync(tempPath, content, "utf-8");
  fs.renameSync(tempPath, filePath);
}
