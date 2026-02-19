# ClawHub Plugin Implementation Notes

## Research Findings

### ClawHub Plugin Format
- Plugins are **Nix subflakes** that export an `openclawPlugin` attribute
- Each plugin bundles: compiled binary + SKILL.md + configuration
- Referenced via: `{ source = "github:Purple-Horizons/tick-md?dir=clawhub-plugin"; }`
- Skill frontmatter declares the Nix plugin:
  ```yaml
  metadata: {"clawhub":{"nix":{"plugin":"github:Purple-Horizons/tick-md?dir=clawhub-plugin"}}}
  ```

### Bundle Strategy
- Used esbuild to bundle MCP server with all dependencies
- CommonJS format (`.cjs`) required because `gray-matter` uses CommonJS `require()`
- ESM format failed with "Dynamic require of fs is not supported"
- Bundle size: ~618KB (includes MCP SDK, gray-matter, yaml)
- **Bundle is included in `lib/` directory** for Nix to use directly

### Architecture for Bundling
- MCP server imports shared core logic from `@tick/core`
- Bundle is built directly from `mcp/src/index.ts` + dependencies
- No CLI dist import redirection is required

### Key Decisions
1. **CJS over ESM**: gray-matter compatibility
2. **Direct bundle entry**: bundle `mcp/src/index.ts` with no import rewriting
3. **Shebang handling**: Strip from bundle, add via post-process
4. **Node version**: Target Node 20 for current nixpkgs compatibility
5. **Pre-built bundle**: Include in `lib/` for simple Nix derivation

## Building & Updating

```bash
# Build bundle and update plugin
cd mcp && npm run build:bundle
cp dist/tick-mcp-bundled.cjs ../clawhub-plugin/lib/

# Or use the update script
./clawhub-plugin/update-bundle.sh
```

## Testing Commands

```bash
# Test bundle directly
node clawhub-plugin/lib/tick-mcp-bundled.cjs

# Test MCP protocol
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node clawhub-plugin/lib/tick-mcp-bundled.cjs

# Test Nix flake (requires Nix)
cd clawhub-plugin && nix flake check
nix build .#tick-mcp
nix run .#tick-mcp
```

## File Structure

```
clawhub-plugin/
  flake.nix              # Nix package definition
  lib/
    tick-mcp-bundled.cjs # Pre-built bundle (~618KB)
  skills/
    tick-coordination/
      SKILL.md           # Agent instructions
  update-bundle.sh       # Script to update bundle
  test-plugin.sh         # Nix test script

mcp/
  esbuild.config.js      # Bundle configuration
  dist/
    tick-mcp-bundled.cjs # Build output (gitignored)
    index.js             # TypeScript compiled (for npm)
```

## Verification Checklist

- [x] `tick-mcp-bundled.cjs` runs without node_modules
- [x] All 13 MCP tools work (tick_status, tick_add, tick_claim, etc.)
- [ ] Nix flake builds on macOS (Intel + ARM) and Linux
- [ ] ClawHub registry shows plugin with native install option
- [x] Existing npm install path still works (backward compatible)

## Release Workflow

1. Build the bundle: `cd mcp && npm run build:bundle`
2. Update plugin bundle: `cp dist/tick-mcp-bundled.cjs ../clawhub-plugin/lib/`
3. Update version in `flake.nix` and `skill.json`
4. Commit changes including `clawhub-plugin/lib/tick-mcp-bundled.cjs`
5. Tag release: `git tag vX.Y.Z && git push origin vX.Y.Z`
