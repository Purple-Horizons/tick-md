# Tick.md

**Multi-agent task coordination via Git-backed Markdown**

[![npm version](https://badge.fury.io/js/tick-md.svg)](https://www.npmjs.com/package/tick-md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Coordinate work across human and AI agents using structured TICK.md files. Built on Git, designed for natural language interaction, optimized for multi-agent workflows.

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

### Install CLI
```bash
npm install -g tick-md
```

### Initialize Project
```bash
cd your-project
tick init
tick status
```

### Create and Claim Tasks
```bash
tick add "Build authentication" --priority high --tags backend
tick claim TASK-001 @yourname
tick done TASK-001 @yourname
```

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

### Install via ClawHub
```bash
clawhub install tick-coordination
```

Bots can now coordinate tasks through natural conversation!

## 📖 Documentation

- **[CLI Commands](cli/README.md)** - Complete command reference
- **[MCP Server](mcp/README.md)** - API for AI agents
- **[ClawHub Skill](clawhub-skill/SKILL.md)** - Bot coordination guide
- **[Build Sessions](BUILD_SESSION_8.md)** - Development notes

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

## 🏗️ Project Structure

```
tick-md/
├── cli/                  # Command-line interface (npm: tick-md)
├── mcp/                  # MCP server (npm: tick-mcp-server)
├── clawhub-skill/        # ClawHub skill package
├── docs/                 # Landing page and documentation
├── TICK.md              # This project's own task tracking
└── LICENSE              # MIT License
```

## 📋 Command Reference

| Command | Description |
|---------|-------------|
| `tick init` | Initialize new project |
| `tick status` | Show project overview |
| `tick list` | List/filter tasks |
| `tick graph` | Visualize dependencies |
| `tick watch` | Monitor changes in real-time |
| `tick add` | Create task |
| `tick claim` | Claim task |
| `tick done` | Complete task |
| `tick validate` | Check for errors |
| `tick sync` | Git integration |
| `tick agent register/list` | Manage agents |

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

- **[tick-md](https://www.npmjs.com/package/tick-md)** - CLI tool
- **[tick-mcp-server](https://www.npmjs.com/package/tick-mcp-server)** - MCP server
- **[tick-coordination](https://clawhub.ai/skills/tick-coordination)** - ClawHub skill

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

- **Website**: https://tick-md.dev (coming soon)
- **Documentation**: [Full Docs](cli/README.md)
- **Issues**: [GitHub Issues](https://github.com/Purple-Horizons/tick-md/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Purple-Horizons/tick-md/discussions)

## 💬 Community

- Share your workflows and integrations
- Ask questions in Discussions
- Join the coordination revolution!

---

**Made with ❤️ by Purple Horizons**

*Coordinate smarter, not harder.*
