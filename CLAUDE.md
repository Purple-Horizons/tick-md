# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tick.md is a multi-agent task coordination system using Git-backed Markdown files. It consists of three main packages in a monorepo:

- **cli/** - Command-line tool (`tick-md` npm package)
- **mcp/** - Model Context Protocol server for AI agents (`tick-mcp-server` npm package)
- **src/** - Next.js dashboard/landing page

## Build Commands

```bash
# Install dependencies (monorepo uses npm workspaces)
npm install

# Build all packages
npm run build:all

# Build individual packages
cd cli && npm run build     # TypeScript → dist/
cd mcp && npm run build     # TypeScript → dist/

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

## Adding New MCP Tools

1. Add tool definition in the `ListToolsRequestSchema` handler in `mcp/src/index.ts`
2. Add implementation in the `CallToolRequestSchema` switch statement
3. Update `clawhub-skill/mcp-reference.md`
