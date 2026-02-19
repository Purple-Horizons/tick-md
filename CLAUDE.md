# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tick.md is a multi-agent task coordination system using Git-backed Markdown files. It consists of these packages in a monorepo:

- **cli/** - Command-line tool (`tick-md` npm package)
- **mcp/** - Model Context Protocol server for AI agents (`tick-mcp-server` npm package)
- **src/** - Next.js dashboard/landing page
- **clawhub-skill/** - ClawHub skill definition (SKILL.md, skill.json)
- **clawhub-plugin/** - Nix flake plugin for OpenClaw (pre-built MCP bundle)

## Build Commands

```bash
# Install dependencies (monorepo uses npm workspaces)
npm install

# Build all packages
npm run build:all

# Build individual packages
cd cli && npm run build     # TypeScript → dist/
cd mcp && npm run build     # TypeScript → dist/
cd mcp && npm run build:bundle  # Creates standalone bundle for Nix plugin

# Run Next.js dashboard
npm run dev                 # Development server
npm run build               # Production build

# Run CLI tests
cd cli && npm test

# Run single test file
cd cli && node --test test/parser.test.js
```

## Architecture

### TICK.md File Format

The core protocol uses a structured Markdown file with three sections:

1. **YAML Frontmatter** - Project metadata (project name, schema_version, next_id, id_prefix)
2. **Agents Table** - Markdown table listing registered agents with status
3. **Task Blocks** - Each task is a `### TASK-XXX · Title` heading followed by a YAML code block and description

### CLI Package (`cli/src/`)

- **cli.ts** - Entry point, Commander.js command definitions
- **types.ts** - Core TypeScript types (Task, Agent, Priority, TaskStatus, etc.)
- **parser/parse.ts** - Reads TICK.md into structured data using gray-matter + custom parsers
- **parser/serialize.ts** - Writes structured data back to TICK.md format
- **commands/** - Individual command implementations (init, add, claim, done, list, graph, watch, sync, validate, agent)
- **utils/validator.ts** - Validation logic including circular dependency detection
- **utils/lock.ts** - Advisory file locking for concurrent access
- **utils/git.ts** - Git operations wrapper

### MCP Server (`mcp/src/index.ts`)

Single-file MCP server that wraps CLI functionality as MCP tools. Imports from CLI's dist/ folder. Exposes tools like `tick_status`, `tick_add`, `tick_claim`, `tick_done`, `tick_validate`, `tick_agent_register`, etc.

### Dashboard (`src/`)

Next.js 16 app with React 19. Key files:
- **src/lib/types.ts** - Re-exports types from CLI
- **src/lib/tick-reader.ts** - Self-contained TICK.md parser (mirrors cli/src/parser/parse.ts) to avoid runtime dependency on CLI dist
- **src/lib/tick-writer.ts** - Write operations for dashboard
- **src/app/api/tick/** - API routes for task operations
- **src/components/dashboard/** - Dashboard UI components (KanbanBoard, DependencyGraph, AgentMonitor, etc.)

## Key Patterns

### Parser Architecture

The CLI uses `gray-matter` for frontmatter, `yaml` library for task metadata, and custom parsers for the agents table. The dashboard has a self-contained parser in `src/lib/tick-reader.ts` that doesn't require gray-matter (simpler YAML parsing for server components).

### Type System

All core types are defined in `cli/src/types.ts`:
- `TaskStatus`: backlog | todo | in_progress | review | done | blocked | reopened
- `Priority`: urgent | high | medium | low
- `AgentType`: human | bot
- `AgentStatus`: working | idle | offline
- `TrustLevel`: owner | trusted | restricted | read-only

### Task Dependencies

Tasks have `depends_on` and `blocks` arrays. When a task is completed via `tick done`, dependent tasks are automatically unblocked. The validator detects circular dependencies.

### Auto-commit

Commands support `--commit` / `--no-commit` flags. Configuration can enable auto-commit after task modifications.

## Testing

Tests are in `cli/test/` using Node.js built-in test runner:
- `parser.test.js` - TICK.md parsing
- `validator.test.js` - Validation logic
- `e2e-workflow.test.js` - End-to-end command workflows
- `mcp-tools.test.js` - MCP tool functionality

## Adding New CLI Commands

1. Create `cli/src/commands/your-command.ts` with async function
2. Wire in `cli/src/cli.ts` using Commander.js pattern
3. Add tests in `cli/test/`
4. Update `cli/README.md`
5. If adding MCP tool, see "Adding New MCP Tools" below

## Adding New MCP Tools

1. Add tool definition in the `ListToolsRequestSchema` handler in `mcp/src/index.ts`
2. Add implementation in the `CallToolRequestSchema` switch statement
3. Update `clawhub-skill/mcp-reference.md`
4. Rebuild the Nix plugin bundle: `./clawhub-plugin/update-bundle.sh`
5. Sync SKILL.md: `cp clawhub-skill/SKILL.md clawhub-plugin/skills/tick-coordination/`

## Release Workflow

Publishing to npm is automated via GitHub Actions. When you push a version tag, both packages are built, tested, and published.

### Steps to Release

1. **Bump version numbers** in both package.json files:
   ```bash
   # Edit cli/package.json and mcp/package.json
   # Also update version in cli/src/cli.ts (.version("x.x.x"))
   ```

2. **Rebuild to include version change:**
   ```bash
   cd cli && npm run build
   ```

3. **Commit the version bump:**
   ```bash
   git add -A
   git commit -m "chore: bump version to vX.Y.Z"
   git push
   ```

4. **Create and push a version tag:**
   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

5. **GitHub Actions automatically:**
   - Builds and tests the CLI
   - Publishes `tick-md` to npm
   - Builds and publishes `tick-mcp-server` to npm

### Version Conventions

- **CLI and MCP versions** should stay in sync for major/minor releases
- Use semantic versioning: `MAJOR.MINOR.PATCH`
  - MAJOR: Breaking changes
  - MINOR: New features (like new commands)
  - PATCH: Bug fixes

### Manual Publishing (if needed)

```bash
cd cli && npm publish
cd ../mcp && npm publish
```

Requires `NPM_TOKEN` configured locally via `npm login` or:
```bash
npm config set //registry.npmjs.org/:_authToken=<your-token>
```

## ClawHub Skill Publishing

The skill is published to ClawHub at: https://clawhub.ai/gianni-dalerta/tick-md

### Publishing Updates

```bash
clawhub publish clawhub-skill --slug tick-md --version X.Y.Z --changelog "Description of changes"
```

**Important**:
- The slug is `tick-md` (not `tick-coordination`)
- Keep `clawhub-skill/skill.json` version in sync with CLI version
- Update `clawhub-skill/SKILL.md` and `clawhub-skill/mcp-reference.md` when adding new commands/tools

## ClawHub Nix Plugin

The `clawhub-plugin/` directory contains a Nix flake that packages the MCP server for OpenClaw environments. This allows bots to use tick-md without running `npm install`.

### Plugin Structure

```
clawhub-plugin/
  flake.nix                              # Nix package definition
  lib/tick-mcp-bundled.cjs               # Pre-built standalone bundle (~619KB)
  skills/tick-coordination/SKILL.md      # Agent instructions (copy of clawhub-skill/SKILL.md)
  update-bundle.sh                       # Rebuilds and copies bundle
  test-plugin.sh                         # Test script
```

### How It Works

- **esbuild** bundles the MCP server + all dependencies into a single `.cjs` file
- The bundle is committed to git in `clawhub-plugin/lib/`
- Nix flake wraps the bundle with Node.js 18
- No npm install needed - everything is self-contained

### Adding New Features (Updated Workflow)

When adding a new command like `archive`:

1. **Add CLI command**: `cli/src/commands/archive.ts`
2. **Wire in CLI**: Update `cli/src/cli.ts`
3. **Add MCP tool** (if exposing to agents): Update `mcp/src/index.ts`
4. **Update docs**: Edit `clawhub-skill/SKILL.md`
5. **Rebuild bundle**:
   ```bash
   ./clawhub-plugin/update-bundle.sh
   ```
6. **Sync SKILL.md to plugin**:
   ```bash
   cp clawhub-skill/SKILL.md clawhub-plugin/skills/tick-coordination/
   ```
7. **Commit everything** (including the updated bundle)

### Testing the Plugin

```bash
# Basic test (no Nix required)
./clawhub-plugin/test-plugin.sh

# Full Nix test (requires Nix installed)
cd clawhub-plugin && nix build .#tick-mcp
./result/bin/tick-mcp
```

### Bundle Details

- Format: CommonJS (`.cjs`) - required because `gray-matter` uses `require()`
- Size: ~619KB (includes MCP SDK, gray-matter, yaml)
- The `mcp/esbuild.config.js` uses a plugin to redirect CLI imports from `dist/` to `src/` during bundling
- Shebang is added post-build for direct execution

### Version Sync

Keep these in sync:
- `cli/package.json` version
- `mcp/package.json` version
- `clawhub-skill/skill.json` version
- `clawhub-plugin/flake.nix` version
