import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  generateDefaultTickFile,
  readTickFileStateSync,
  writeTickFileAtomicSync,
} from "@tick/core";

describe("Core I/O concurrency guard", () => {
  it("rejects stale writes when file changed after read", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "tick-concurrency-"));
    const tickPath = path.join(tmpDir, "TICK.md");

    await fs.writeFile(tickPath, generateDefaultTickFile("concurrency-test"), "utf-8");

    const { tickFile, state } = readTickFileStateSync(tickPath);

    const externalChange = JSON.parse(JSON.stringify(tickFile));
    externalChange.meta.updated = new Date().toISOString();
    externalChange.meta.next_id += 1;
    writeTickFileAtomicSync(externalChange, tickPath);

    tickFile.meta.next_id += 1;

    assert.throws(
      () => writeTickFileAtomicSync(tickFile, tickPath, state),
      /Concurrent modification detected/
    );

    await fs.rm(tmpDir, { recursive: true, force: true });
  });
});
