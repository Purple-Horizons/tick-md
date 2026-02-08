# Tick CLI

The command-line interface for the Tick.md multi-agent coordination protocol.

## Installation

```bash
npm install -g tick-md
```

Or use without installing:

```bash
npx tick-md init
```

## Quick Start

```bash
# Initialize a new Tick project
tick init

# Check project status
tick status

# Add a new task
tick add "Build authentication system" --priority high --tags backend,security

# Register as an agent
tick agent register @yourname --role engineer

# Claim a task
tick claim TASK-001 @yourname

# Update task status
tick done TASK-001 @yourname

# Sync to git
tick sync
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run locally
node dist/cli.js init
```

## Architecture

### Parser (`src/parser/`)

- **parse.ts** - Reads TICK.md files into structured data
  - Uses `gray-matter` for YAML frontmatter
  - Custom parser for agent tables (Markdown tables)
  - Custom parser for task blocks (YAML + Markdown)
  
- **serialize.ts** - Writes structured data back to TICK.md format
  - Uses `yaml` library for proper multi-line YAML
  - Generates compliant task blocks
  - Template generation for new projects

### Commands (`src/commands/`)

- **init.ts** - Initialize new Tick projects
- **add.ts** - Create new tasks with auto-ID generation
- **claim.ts** - Claim and release tasks with locking
- **done.ts** - Complete tasks and add comments
- **status.ts** - Terminal UI with colored output
- **sync.ts** - Git integration with smart commit messages
- **validate.ts** - Comprehensive TICK.md validation
- **agent.ts** - Agent registration and listing

### Utils (`src/utils/`)

- **lock.ts** - Advisory file locking manager
- **git.ts** - Git operations (status, commit, push, pull)
- **validator.ts** - Validation logic with circular dependency detection

### Types (`src/types.ts`)

Full TypeScript definitions for:
- Tasks, Agents, History entries
- Project metadata
- Status, priority, trust level enums

## File Structure

```
cli/
├── src/
│   ├── parser/
│   │   ├── parse.ts       # TICK.md → JavaScript objects
│   │   ├── serialize.ts   # JavaScript objects → TICK.md
│   │   └── index.ts
│   ├── commands/
│   │   ├── init.ts        # tick init
│   │   └── ...            # Future commands
│   ├── types.ts           # TypeScript types
│   ├── cli.ts             # Main CLI entry
│   └── index.ts
├── dist/                  # Compiled JavaScript
├── package.json
└── tsconfig.json
```

## Commands

### Core Workflow

```bash
# Initialize project
tick init [--name <name>] [--force]

# View project status
tick status

# Add tasks
tick add <title> [--priority <level>] [--tags <list>] [--assigned-to <agent>]

# Register agents
tick agent register <name> [--type human|bot] [--roles <list>] [--status <status>]
tick agent list [--status <filter>] [--type <filter>] [--verbose]

# Claim and work on tasks
tick claim <task-id> <agent>
tick release <task-id> <agent>
tick done <task-id> <agent>
tick comment <task-id> <agent> --note <text>

# Validation
tick validate [--verbose]

# Git sync
tick sync [--push] [--pull] [--message <text>] [--init]
```

### Command Reference

| Command | Status | Description |
|---------|--------|-------------|
| `tick init` | ✅ | Initialize new Tick project |
| `tick status` | ✅ | Show project summary with progress |
| `tick add` | ✅ | Create new tasks with metadata |
| `tick claim` | ✅ | Claim task for agent (sets in_progress) |
| `tick release` | ✅ | Release claimed task (back to todo) |
| `tick done` | ✅ | Mark task complete, unblock dependents |
| `tick comment` | ✅ | Add notes to task history |
| `tick sync` | ✅ | Commit TICK.md to git with smart messages |
| `tick validate` | ✅ | Validate TICK.md structure and references |
| `tick agent register` | ✅ | Register new agent (human or bot) |
| `tick agent list` | ✅ | List agents with filtering |

## Technical Decisions

### Parser Strategy: Hybrid
- **Frontmatter**: `gray-matter` (battle-tested, 13M weekly downloads)
- **Agent tables**: Custom Markdown table parser
- **Task blocks**: Custom YAML code block + description parser

### CLI Language: Node.js/TypeScript
- Matches frontend stack
- Easy npm distribution (`npx tick-md`)
- Shared types with dashboard
- Fast enough for file operations

### Locking: Optimistic + Advisory
- `.tick/lock` file provides advisory hint (PID, agent, timestamp)
- Git is source of truth for conflicts
- CLI warns on conflicts, shows diff
- Works offline (lock is local)

## Next Steps (Roadmap)

### Planned Features

1. **MCP Server** - Model Context Protocol integration
   - Enable AI agents to use tick commands
   - Real-time collaboration between human and AI agents
   
2. **Watch Mode** - Real-time file monitoring
   - `tick watch` for live updates
   - Auto-validation on changes
   
3. **Advanced Filtering** - Task discovery
   - `tick list --status todo --priority high`
   - `tick search <query>`
   - JSON output for scripting

4. **Dependency Visualization**
   - `tick graph` - ASCII dependency graph
   - Critical path analysis
   - Blocked task detection

5. **Cloud Sync** - Optional hosted dashboard
   - Push local TICK.md to cloud
   - Web-based visualization
   - Team collaboration

## License

MIT · Purple Horizons
