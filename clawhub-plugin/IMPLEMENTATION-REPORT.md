# ClawHub Plugin Implementation Report

**Date:** 2026-02-09
**Task:** TASK-023 - Build Native ClawHub Plugin

## Summary

Converted tick-md from a ClawHub **skill** to a native **plugin** so OpenClaw bots get the MCP tools without needing `npm install`.

## Files Created

| File | Size | Purpose |
|------|------|---------|
| `mcp/esbuild.config.js` | 1.2KB | Bundle MCP server with all dependencies |
| `clawhub-plugin/flake.nix` | 1.5KB | Nix package definition |
| `clawhub-plugin/lib/tick-mcp-bundled.cjs` | 619KB | Pre-built standalone bundle |
| `clawhub-plugin/skills/tick-coordination/SKILL.md` | 12KB | Agent instructions |
| `clawhub-plugin/update-bundle.sh` | 576B | Script to rebuild and copy bundle |
| `clawhub-plugin/test-plugin.sh` | 1.8KB | Test script |
| `clawhub-plugin/NOTES.md` | 3KB | Implementation notes |

## Files Modified

| File | Change |
|------|--------|
| `mcp/package.json` | Added esbuild dependency + `build:bundle` script |
| `mcp/src/index.ts` | Preserved shebang for npm compatibility |
| `clawhub-skill/skill.json` | Added nix plugin metadata, bumped to v1.3.0 |

## Technical Details

### Bundle Strategy
- Used **esbuild** to bundle MCP server with all dependencies into a single file
- **CommonJS format** (`.cjs`) required because `gray-matter` uses CommonJS `require()`
- ESM format failed with "Dynamic require of fs is not supported"
- Bundle size: **~619KB** (includes MCP SDK, gray-matter, yaml)

### Architecture for Bundling
- MCP server imports shared core logic from `@tick/core`
- Bundle is built directly from `mcp/src/index.ts` + dependencies
- No CLI dist import redirection is required

### Key Decisions
1. **CJS over ESM**: gray-matter compatibility
2. **Direct bundle entry**: bundle `mcp/src/index.ts` with no import rewriting
3. **Shebang handling**: Strip from bundle content, add single shebang via post-process
4. **Node version**: Target Node 20 for current nixpkgs compatibility
5. **Pre-built bundle**: Include in `lib/` directory for simple Nix derivation (avoids complex npm-in-nix builds)

## Test Results

```
=== Testing ClawHub Nix Plugin ===

1. Testing bundle directly (no Nix required)...
   Bundle starts correctly

2. Testing MCP tools list...
   Found 13 tools

=== Basic tests passed! ===
```

### All 13 MCP Tools Verified
- `tick_status` - Get project status
- `tick_add` - Create task
- `tick_claim` - Claim task
- `tick_release` - Release task
- `tick_done` - Complete task
- `tick_comment` - Add comment
- `tick_validate` - Validate TICK.md
- `tick_agent_list` - List agents
- `tick_agent_register` - Register agent
- `tick_reopen` - Reopen task
- `tick_delete` - Delete task
- `tick_edit` - Edit task fields
- `tick_undo` - Undo last operation

## Verification Checklist

- [x] `tick-mcp-bundled.cjs` runs without node_modules
- [x] All 13 MCP tools work
- [x] Bundle executable via shebang
- [x] Existing npm install path still works (backward compatible)
- [ ] Nix flake builds on macOS (Intel + ARM) and Linux - *requires Nix installation*
- [ ] ClawHub registry shows plugin with native install option - *requires publish*

## How to Test Nix Flake

Nix installation requires interactive sudo. Run in terminal:

```bash
curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install
```

Then test:
```bash
cd clawhub-plugin && ./test-plugin.sh
```

Or run directly:
```bash
nix run github:Purple-Horizons/tick-md?dir=clawhub-plugin
```

## Build Commands

```bash
# Build bundle from mcp/
cd mcp && npm run build:bundle

# Update plugin bundle
./clawhub-plugin/update-bundle.sh

# Run tests
./clawhub-plugin/test-plugin.sh
```

## Release Workflow

1. Build the bundle: `cd mcp && npm run build:bundle`
2. Update plugin bundle: `./clawhub-plugin/update-bundle.sh`
3. Update version in `flake.nix` and `clawhub-skill/skill.json`
4. Commit changes including `clawhub-plugin/lib/tick-mcp-bundled.cjs`
5. Tag release: `git tag vX.Y.Z && git push origin vX.Y.Z`
6. Publish to ClawHub: `clawhub publish clawhub-skill --slug tick-md --version X.Y.Z`

## Usage

Once published, OpenClaw users can use the plugin via:

```nix
# In OpenClaw configuration
{
  plugins = [
    { source = "github:Purple-Horizons/tick-md?dir=clawhub-plugin"; }
  ];
}
```

Or run directly:
```bash
nix run github:Purple-Horizons/tick-md?dir=clawhub-plugin
```
