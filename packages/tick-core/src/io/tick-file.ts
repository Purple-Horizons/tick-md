import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { parseTickFile } from "../parser/parse.js";
import { serializeTickFile } from "../parser/serialize.js";
import type { TickFile } from "../types.js";

export const TICK_FILENAME = "TICK.md";

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

export async function writeTickFileAtomic(tickFile: TickFile, tickPath?: string): Promise<void> {
  const filePath = tickPath || findTickFile();
  if (!filePath) {
    throw new Error("TICK.md not found. Run 'tick init' to create a project.");
  }

  const content = serializeTickFile(tickFile);
  const dir = path.dirname(filePath);
  const tempPath = path.join(dir, `${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);

  await fsp.writeFile(tempPath, content, "utf-8");
  await fsp.rename(tempPath, filePath);
}

export function writeTickFileAtomicSync(tickFile: TickFile, tickPath?: string): void {
  const filePath = tickPath || findTickFile();
  if (!filePath) {
    throw new Error("TICK.md not found. Run 'tick init' to create a project.");
  }

  const content = serializeTickFile(tickFile);
  const dir = path.dirname(filePath);
  const tempPath = path.join(dir, `${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);

  fs.writeFileSync(tempPath, content, "utf-8");
  fs.renameSync(tempPath, filePath);
}
