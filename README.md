# TICK.md

**Multi-agent task coordination via Git-backed Markdown**

[![npm version](https://img.shields.io/npm/v/tick-md.svg?style=flat-square&color=a78bfa)](https://www.npmjs.com/package/tick-md)
[![npm downloads](https://img.shields.io/npm/dm/tick-md.svg?style=flat-square&color=a78bfa)](https://www.npmjs.com/package/tick-md)
[![MCP Server](https://img.shields.io/npm/v/tick-mcp-server.svg?style=flat-square&label=mcp-server&color=7c3aed)](https://www.npmjs.com/package/tick-mcp-server)
[![ClawHub](https://img.shields.io/badge/ClawHub-tick--md-6366f1?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUgMTNsNCA0TDE5IDciIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIzIiBmaWxsPSJub25lIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+)](https://clawhub.ai/gianni-dalerta/tick-md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub stars](https://img.shields.io/github/stars/Purple-Horizons/tick-md?style=flat-square&color=a78bfa)](https://github.com/Purple-Horizons/tick-md)

Coordinate work across human and AI agents using structured TICK.md files. Built on Git, designed for natural language interaction, optimized for multi-agent workflows.

> **100% open source.** Protocol, CLI, dashboard, MCP server — all free forever.

## 💡 Why tick-md?

AI agents speak Markdown. So does your documentation, your notes, and your Git history. **tick-md** turns that into a coordination protocol — no databases, no APIs, no vendor lock-in. Just a `TICK.md` file that humans can read and bots can parse.

When you have multiple agents (or humans) working on a project, they need a shared source of truth. tick-md gives you that through Git: every claim, every status change, every completion is a commit. Conflicts resolve the same way code conflicts do. History is built in.

## ✨ Features

- 🤖 **AI-Native**: MCP server for seamless bot integration
- 📝 **Human-Readable**: Plain Markdown with YAML frontmatter
- 🔄 **Git-Backed**: Full version control and audit trail
- 🎯 **Dependency Tracking**: Automatic task unblocking
- 🔍 **Advanced Filtering**: Find tasks by status, priority, tags
- 📊 **Visualization**: Dependency graphs (ASCII and Mermaid)
- 👀 **Real-Time Monitoring**: Watch mode for live updates
- 🌐 **Local-First**: No cloud required, works offline

## 🚀 Quick Start

```bash
# Install
npm install -g tick-md

# Initialize in your project
cd your-project
tick init

# Add a task
tick add "Build authentication" --priority high --tags backend

# Claim it and get to work
tick claim TASK-001 @yourname

# Mark it done (auto-unblocks dependent tasks)
tick done TASK-001 @yourname

# See your progress
tick status
```

**That's it.** Your tasks live in `TICK.md` — human-readable, Git-tracked, AI-compatible.

## 🤖 For AI Agents

### Install MCP Server
```bash
npm install -g tick-mcp-server
```

### Configure (see [INSTALL.md](clawhub-skill/INSTALL.md) for editor-specific setup)

Add to your MCP config:
```json
{
  "mcpServers": {
    "tick": {
      "command": "tick-mcp",
      "args": []
    }
  }
}
```

### Install via ClawHub (for OpenClaw Bots)
```bash
clawhub install tick-md
```

OpenClaw bots can now coordinate tasks through natural conversation!

## 📖 Documentation

- **[CLI Commands](cli/README.md)** - Complete command reference
- **[MCP Server](mcp/README.md)** - API for AI agents
- **[ClawHub Skill](clawhub-skill/SKILL.md)** - Bot coordination guide
- **[Changelog](https://tick.md/docs/changelog)** - Release highlights
- **[Build Sessions](BUILD_SESSION_8.md)** - Development notes

## 🆕 Latest Release Highlights

### tick-md `1.3.0` / tick-core `1.1.0`
- **Safe for many agents on one board:** a cross-process write lock means concurrent agents no longer overwrite each other's changes.
- **`tick block --on <who>` / `tick unblock`:** blocked tasks record what they're waiting on (`waiting_on`).
- **`tick digest`:** a board summary grouped by status, with stale-task detection (Markdown or `--json`).
- `TICK_DIR` and `TICK_AGENT` for shared boards. `--no-commit` now works.
- Published with npm provenance via trusted publishing.

### tick-md `1.2.1`
- Shared `@tick/core` package introduced as the single source of truth for parser, serializer, types, validation, and atomic file I/O.
- CLI reliability improvements (archive, backup, broadcast, notify queue, conflict helpers, parse cache, completion, repair).
- Safer destructive operations: `tick delete` now creates a backup before mutation.
- Concurrency hardening with stale-write detection in core file writes.

### tick-mcp-server `1.1.1`
- MCP server now uses `@tick/core` directly (no dist-bridge imports).
- Cleaner type safety and reduced build coupling.
- Improved compatibility for bundling and plugin distribution.

### ClawHub Plugin
- Added native Nix plugin package in `clawhub-plugin/` with prebuilt MCP bundle.
- Added orchestrator/worker role instructions for agent coordination.
- Added plugin test and bundle update scripts for release workflow.

## 🎯 Core Workflow

```bash
# Project setup
tick init                          # Initialize TICK.md
tick agent register @bot --type bot # Register agent

# Task management
tick add "Task title" --priority high
tick list --status todo            # Filter tasks
tick graph                         # Visualize dependencies

# Work coordination
tick claim TASK-001 @bot           # Claim task
tick comment TASK-001 @bot --note "Making progress"
tick done TASK-001 @bot            # Complete (auto-unblocks dependents)

# Real-time monitoring
tick watch                         # Watch for changes

# Git integration
tick sync --push                   # Commit and push
```

## 🤝 Multi-Agent Boards (bot teams)

One `TICK.md` can coordinate a whole team of agents on the same machine.

**Point every agent at the board and identify it**
```bash
export TICK_DIR=/srv/team-board   # run tick from any directory against this board
export TICK_AGENT=@devy           # who "I" am; overrides the shared .tick/session
```
Still pass your handle explicitly (`tick claim TASK-007 @devy`). The session file is shared by every agent on the board.

**Write lock.** Every mutating command holds `.tick/write.lock` while it runs, so 17 agents adding or claiming at once never lose an update. Locks from crashed processes are reclaimed automatically. Tune with `TICK_LOCK_TIMEOUT_MS` (default 15000) and `TICK_LOCK_STALE_MS` (default 60000).

**Blocked means "waiting on X"**
```bash
tick block TASK-004 @salesy --on "Baptist Health" -n "awaiting call confirmation"
tick block TASK-006 @cigary --on @gianni -n "needs hero image pick"
tick unblock TASK-004 @salesy -n "confirmed Tue 11:30"   # back to in_progress if claimed, else todo
```
`waiting_on` shows up in `tick list` and `tick digest`. `tick validate` warns about blocked tasks that don't say what they're waiting on. `tick done` clears it.

**Digest for the morning brief**
```bash
tick digest                      # Markdown: Blocked (waiting on), Ready for review, Working, Todo, Done (24h), Stale
tick digest --owner @devy        # one agent's tasks (claimed or assigned)
tick digest --json               # for bots and dashboards
tick digest --stale-hours 24 --done-since-hours 48
```
Open tasks with no update in `--stale-hours` (default 48) are listed under **Stale**.

### Example: running a bot team on tick
```bash
# once
mkdir -p /srv/team-board && cd /srv/team-board && git init && tick init --name team
for b in @geny @devy @salesy; do tick agent register $b --type bot; done

# a chief-of-staff bot files work
tick add "Ship intake endpoint" --assigned-to @devy --priority high -d "PR: <link>"

# the owner works it (rule: a task isn't done until the board says it is)
tick claim TASK-001 @devy
tick comment TASK-001 @devy -n "Opened PR #60"
tick edit TASK-001 @devy --status review -n "Ready: PR #60, tests green"
tick comment TASK-001 @devy -n "Verified: merged + prod returns 200"
tick done TASK-001 @devy

# every morning
tick digest > DIGEST.md
```
With `git init` and `auto_commit: true` (the default in `.tick/config.yml`), every change becomes a commit, so the board's history is `git log`.

## 🏗️ Project Structure

```
tick-md/
├── packages/tick-core/   # Shared core logic (types/parser/serializer/validator/I-O)
├── cli/                  # Command-line interface (npm: tick-md)
├── mcp/                  # MCP server (npm: tick-mcp-server)
├── clawhub-skill/        # ClawHub skill package
├── clawhub-plugin/       # Native Nix plugin for OpenClaw
├── src/                  # Website, docs, dashboard (Next.js)
├── TICK.md              # This project's own task tracking
└── LICENSE              # MIT License
```

## 📋 Command Reference

| Command | Description |
|---------|-------------|
| `tick init` | Initialize new project |
| `tick status` | Show project overview |
| `tick list` | List/filter tasks |
| `tick add` | Create task |
| `tick claim` | Claim task |
| `tick done` | Complete task |
| `tick reopen` | Reopen completed task |
| `tick delete` | Delete a task |
| `tick edit` | Direct field edits |
| `tick block` | Mark blocked with `--on <who>` (waiting_on) |
| `tick unblock` | Clear a block |
| `tick digest` | Board digest: blocked/waiting, review, working, todo, stale |
| `tick undo` | Undo last operation |
| `tick import` | Bulk import from YAML |
| `tick batch` | Batch mode (start/commit/abort) |
| `tick graph` | Visualize dependencies |
| `tick watch` | Monitor changes in real-time |
| `tick validate` | Check for errors |
| `tick sync` | Git integration |
| `tick agent` | Manage agents (register/list) |

## 🤝 Use Cases

### For Development Teams
- Coordinate work across multiple developers
- Track dependencies and blockers
- Maintain audit trail via Git
- Natural language task management

### For AI Agent Swarms
- Multi-bot task coordination
- Transparent work tracking
- Prevent duplicate effort
- Enable bot-to-bot handoffs

### For Solo Developers
- Structure your work
- Track progress visually
- Integrate with Git workflow
- Command-line productivity

## 🌟 Example Workflows

### Bot Creates and Claims Task
```javascript
// Via MCP
await tick_add({
  title: "Refactor authentication system",
  priority: "high",
  tags: ["backend", "security"]
});

await tick_claim({ taskId: "TASK-023", agent: "@bot" });
await tick_comment({ 
  taskId: "TASK-023", 
  agent: "@bot",
  note: "Analyzing current implementation"
});
await tick_done({ taskId: "TASK-023", agent: "@bot" });
```

### Human Monitors Progress
```bash
tick watch
# [20:15:32] ✓ Added: TASK-023 - Refactor authentication system
# [20:15:35] 🔒 TASK-023 claimed by @bot
# [20:17:42] ⟳ TASK-023: in_progress → done
```

## 🔧 Advanced Features

### Dependency Management
```bash
tick add "Deploy to production" --priority high
tick add "Run tests" --blocks TASK-001
tick add "Update docs" --blocks TASK-001

# When tests and docs complete, deploy automatically unblocks
```

### Task Filtering
```bash
tick list --status blocked         # Find blockers
tick list --priority urgent --json # Export data
tick list --claimed-by @bot        # Bot's tasks
tick list --tag security           # Security tasks
```

### Dependency Visualization
```bash
tick graph                         # ASCII tree
tick graph --format mermaid        # For documentation
```

## 🛠️ Development

```bash
# Clone repo
git clone https://github.com/Purple-Horizons/tick-md.git
cd tick-md

# Build CLI
cd cli
npm install
npm run build

# Build MCP server
cd ../mcp
npm install
npm run build

# Test locally
npm link
tick init
```

## 📦 Packages

- **[tick-md](https://www.npmjs.com/package/tick-md)** - CLI tool (v1.3.0)
- **[@gianni-dalerta/tick-core](https://www.npmjs.com/package/@gianni-dalerta/tick-core)** - Shared parser/serializer/types (v1.1.0)
- **[tick-mcp-server](https://www.npmjs.com/package/tick-mcp-server)** - MCP server for AI agents (v1.1.3)
- **[tick-md](https://clawhub.ai/gianni-dalerta/tick-md)** - ClawHub skill for OpenClaw bots

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Ways to contribute**:
- 🐛 Report bugs
- 💡 Suggest features
- 📖 Improve documentation
- 🔧 Submit pull requests

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Built with:
- [commander.js](https://github.com/tj/commander.js) - CLI framework
- [chalk](https://github.com/chalk/chalk) - Terminal styling
- [gray-matter](https://github.com/jonschlinkert/gray-matter) - YAML frontmatter
- [Model Context Protocol](https://github.com/modelcontextprotocol) - AI agent integration

## 🔗 Links

- **Website**: [tick.md](https://tick.md)
- **npm**: [tick-md](https://www.npmjs.com/package/tick-md) · [tick-mcp-server](https://www.npmjs.com/package/tick-mcp-server)
- **ClawHub**: [tick-md skill](https://clawhub.ai/gianni-dalerta/tick-md)
- **Documentation**: [Full Docs](cli/README.md)
- **Issues**: [GitHub Issues](https://github.com/Purple-Horizons/tick-md/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Purple-Horizons/tick-md/discussions)

## 💬 Community

- Share your workflows and integrations
- Ask questions in Discussions
- Join the coordination revolution!

## ❤️ Support

TICK.md is 100% free and open source. If it helps you, consider supporting development:

- [Sponsor on GitHub](https://github.com/sponsors/Purple-Horizons)
- ⭐ Star this repo

---

**Created by [@giannidalerta](https://twitter.com/giannidalerta) and his mass of agents**

*Coordinate smarter, not harder.*
