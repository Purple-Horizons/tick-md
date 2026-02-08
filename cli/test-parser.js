#!/usr/bin/env node

import fs from "fs/promises";
import path from "path";
import { parseTickFile } from "./dist/parser/index.js";

async function test() {
  console.log("Testing parser with existing TICK.md...\n");

  const tickPath = path.join(process.cwd(), "../TICK.md");

  try {
    const content = await fs.readFile(tickPath, "utf-8");
    console.log(`✓ Read TICK.md (${content.length} bytes)\n`);

    const parsed = parseTickFile(content);

    console.log("📋 Project Metadata:");
    console.log(`  Project: ${parsed.meta.project}`);
    console.log(`  Title: ${parsed.meta.title || "(none)"}`);
    console.log(`  Schema: ${parsed.meta.schema_version}`);
    console.log(`  ID Prefix: ${parsed.meta.id_prefix}`);
    console.log(`  Next ID: ${parsed.meta.next_id}`);
    console.log(
      `  Workflow: ${parsed.meta.default_workflow.join(" → ")}\n`
    );

    console.log(`👥 Agents: ${parsed.agents.length}`);
    parsed.agents.forEach((agent) => {
      console.log(
        `  ${agent.name} (${agent.type}) - ${agent.status} - ${agent.working_on || "idle"}`
      );
    });
    console.log();

    console.log(`📝 Tasks: ${parsed.tasks.length}`);
    const byStatus = {};
    parsed.tasks.forEach((task) => {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
    });
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    console.log();

    // Show a sample task
    if (parsed.tasks.length > 0) {
      const task = parsed.tasks[0];
      console.log(`📌 Sample Task: ${task.id}`);
      console.log(`  Title: ${task.title}`);
      console.log(`  Status: ${task.status}`);
      console.log(`  Priority: ${task.priority}`);
      console.log(`  Tags: ${task.tags.join(", ") || "(none)"}`);
      console.log(`  History entries: ${task.history.length}`);
      console.log(`  Description: ${task.description.slice(0, 80)}...`);
      console.log();
    }

    console.log("✅ Parser test passed!");
  } catch (error) {
    console.error("❌ Parser test failed:", error.message);
    if (error.stack) console.error(error.stack);
    process.exit(1);
  }
}

test();
