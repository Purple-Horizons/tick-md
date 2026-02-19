# Changelog

## [1.3.3] - 2026-02-18

### Security Clarifications

- Updated all role/workflow examples so remote push operations are explicitly approval-gated.
- Replaced default sync examples with pull-only flow unless user approval is given.
- Clarified command cheatsheet to mark `sync --push` as approval-required.

## [1.3.2] - 2026-02-18

### Rename

- Renamed ClawHub skill slug from `tick-coordination` to `tick-md`.
- Updated publishing/install instructions to use the canonical `tick-md` identity.

## [1.3.1] - 2026-02-18

### Security Metadata Alignment

- Added explicit `requirements.binaries` in `skill.json` (`tick`, `tick-mcp`, `git`).
- Added explicit `requirements.config_paths` for common editor MCP config files.
- Added explicit `requirements.network_access` and operational safety notes.
- Added clear consent boundaries in `SKILL.md` for config edits and remote git push actions.
- Added security guidance in `INSTALL.md` (backups, approval, isolated test recommendation).

## [1.0.0] - 2026-02-08

### Initial Release

Complete multi-agent coordination system with CLI and MCP server.

#### Features
- ✅ **CLI Commands**
  - Project management (init, status, validate, sync)
  - Task operations (add, claim, release, done, comment)
  - Advanced features (list with filters, graph visualization, watch mode)
  - Agent management (register, list with filters)

- ✅ **MCP Server**
  - 9 programmatic tools for AI agents
  - JSON-based responses
  - Full CLI feature parity
  - Auto-registers with OpenClaw/Cursor/Claude

- ✅ **Core Protocol**
  - Git-backed TICK.md files
  - YAML frontmatter + Markdown tables + task blocks
  - Dependency tracking with auto-unblocking
  - Circular dependency detection
  - History tracking for audit trails

- ✅ **Advanced Capabilities**
  - Real-time monitoring with `tick watch`
  - Dependency visualization (ASCII tree and Mermaid)
  - Flexible task filtering and search
  - Smart commit message generation
  - Advisory file locking

#### Installation
```bash
npm install -g tick-md tick-mcp-server
```

#### Requirements
- Node.js ≥18
- Git (for sync features)

#### Documentation
- Complete SKILL.md guide
- MCP tools reference
- Quick setup guide
- Example workflows
