import { build } from "esbuild";
import { chmodSync, readFileSync, writeFileSync } from "fs";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/tick-mcp-bundled.cjs",
  format: "cjs",
  platform: "node",
  target: "node18",
  minify: false,
  sourcemap: false,
  logLevel: "info",
});

// Add shebang and remove any duplicate from source
const bundlePath = "dist/tick-mcp-bundled.cjs";
let content = readFileSync(bundlePath, "utf-8");
content = content.replace(/^#!.*\n/gm, "");
writeFileSync(bundlePath, "#!/usr/bin/env node\n" + content);
chmodSync(bundlePath, "755");

console.log("Bundle created: dist/tick-mcp-bundled.cjs");
