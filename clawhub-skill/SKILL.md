# Tick Multi-Agent Coordination

Coordinate work across human and AI agents using structured Markdown files. Users interact naturally with you, and you maintain tasks transparently in TICK.md.

## Installation

**Prerequisites**: The Tick CLI and MCP server should already be installed and configured by your environment.

**First time setup?** See `INSTALL.md` for editor-specific installation instructions.

**Quick Check**:
```bash
# Verify CLI is available
tick --version

# Check if TICK.md exists in project
ls TICK.md

# If not, initialize
tick init
```

## Core Concept

**Tick Protocol** = Git-based task coordination via TICK.md files
- **Human-readable**: Standard Markdown with YAML
- **Machine-parseable**: Structured for tools
- **Git-backed**: Full version control and audit trail
- **Local-first**: No cloud required

## Quick Start

### Check if Tick is initialized
```bash
ls TICK.md
```

### If not initialized
```bash
tick init
```

### Get current status
```bash
tick status
```

## Common Workflows

### 1. User Asks You to Do Something

**User**: "Can you refactor the authentication system?"

**Your Actions**:
```bash
# 1. Create task
tick add "Refactor authentication system" --priority high --tags backend,security

# 2. Register yourself (first time only)
tick agent register @your-name --type bot --roles "engineer,refactoring"

# 3. Claim the task
tick claim TASK-XXX @your-name

# 4. Work on it (do the actual work)

# 5. Add progress comments
tick comment TASK-XXX @your-name --note "Analyzing current auth flow"
tick comment TASK-XXX @your-name --note "Refactored to use JWT tokens"

# 6. Mark complete
tick done TASK-XXX @your-name
```

### 2. User Asks About Project Status

**User**: "What tasks are we working on?"

```bash
# Get comprehensive status
tick status

# Or filter and list tasks
tick list --status in_progress
tick list --claimed-by @bot-name
```

Summarize the output naturally for the user.

### 3. Coordination with Other Agents

**User**: "Have the other agents finished their tasks?"

```bash
# Check overall status
tick status

# List agents and their work
tick agent list --verbose

# Validate the project
tick validate
```

### 4. Breaking Down Complex Work

**User**: "Build a user dashboard with charts and data export"

**Your Actions**:
```bash
# Create parent task
tick add "Build user dashboard" --priority high --tags frontend

# Create subtasks with dependencies
tick add "Design dashboard layout" --priority high --tags frontend,design
tick add "Implement data charts" --priority medium --tags frontend,charts --depends-on TASK-XXX
tick add "Add CSV export" --priority low --tags frontend,export --depends-on TASK-XXX

# Visualize dependencies
tick graph
```

## Command Reference

### Project Management
```bash
tick init                          # Initialize new project
tick status                        # View project overview
tick list                          # List tasks with filters
tick graph                         # Visualize dependencies
tick watch                         # Monitor changes in real-time
tick validate                      # Check for errors
tick sync --push                   # Commit and push to git
```

### Task Operations
```bash
tick add "Task title" \
  --priority high \                # urgent|high|medium|low
  --tags backend,api \             # Comma-separated tags
  --assigned-to @agent \           # Assign to agent
  --depends-on TASK-001 \          # Dependencies
  --estimated-hours 4              # Time estimate

tick claim TASK-001 @agent         # Claim task (sets in_progress)
tick release TASK-001 @agent       # Release task (back to todo)
tick done TASK-001 @agent          # Complete task
tick comment TASK-001 @agent \     # Add note
  --note "Progress update"
```

### Advanced Task Listing
```bash
tick list                          # All tasks, grouped by status
tick list --status blocked         # Only blocked tasks
tick list --priority urgent        # High-priority tasks
tick list --assigned-to @alice     # Tasks for specific agent
tick list --tag backend            # Tasks with tag
tick list --json                   # JSON output for scripts
```

### Dependency Visualization
```bash
tick graph                         # ASCII dependency tree
tick graph --format mermaid        # Mermaid flowchart
tick graph --show-done             # Include completed tasks
```

### Real-time Monitoring
```bash
tick watch                         # Watch for changes
tick watch --interval 10           # Custom polling interval
tick watch --filter in_progress    # Only show specific status
```

### Agent Management
```bash
tick agent register @name \        # Register new agent
  --type bot \                     # human|bot
  --roles "dev,qa" \               # Comma-separated roles
  --status idle                    # working|idle|offline

tick agent list                    # List all agents
tick agent list --verbose          # Detailed info
tick agent list --type bot         # Filter by type
tick agent list --status working   # Filter by status
```

## MCP Tools (Alternative to CLI)

If using Model Context Protocol, use these tools instead of CLI commands:

### Status and Inspection
- `tick_status` - Get project status (agents, tasks, progress)
- `tick_validate` - Validate TICK.md structure
- `tick_agent_list` - List agents with optional filters

### Task Management
- `tick_add` - Create new task
- `tick_claim` - Claim task for agent
- `tick_release` - Release claimed task
- `tick_done` - Complete task (auto-unblocks dependents)
- `tick_comment` - Add note to task

### Agent Operations
- `tick_agent_register` - Register new agent

**MCP Example**:
```javascript
// Create task via MCP
await tick_add({
  title: "Refactor authentication",
  priority: "high",
  tags: ["backend", "security"],
  assignedTo: "@bot-name"
})

// Claim it
await tick_claim({
  taskId: "TASK-023",
  agent: "@bot-name"
})
```

## Best Practices

### 1. Natural Conversation First

✅ **Good**: User says "refactor the auth", you create task automatically
❌ **Bad**: Making user explicitly create tasks

### 2. Always Use Your Agent Name

Register once:
```bash
tick agent register @your-bot-name --type bot --roles "engineer"
```

Then use consistently:
```bash
tick claim TASK-001 @your-bot-name
tick done TASK-001 @your-bot-name
```

### 3. Provide Context in Comments

```bash
# ✅ Good - explains what and why
tick comment TASK-005 @bot --note "Switched from REST to GraphQL for better type safety and reduced over-fetching"

# ❌ Bad - too vague
tick comment TASK-005 @bot --note "Updated API"
```

### 4. Break Down Large Tasks

Create subtasks with dependencies:
```bash
tick add "Set up CI/CD pipeline" --priority high
tick add "Configure GitHub Actions" --depends-on TASK-010
tick add "Add deployment scripts" --depends-on TASK-011
tick add "Set up staging environment" --depends-on TASK-011
```

### 5. Check Status Before Claiming

```bash
# Make sure task exists and isn't claimed
tick status

# Then claim
tick claim TASK-XXX @your-name
```

## Understanding TICK.md Structure

The file has three sections:

1. **Frontmatter** (YAML): Project metadata
2. **Agents Table** (Markdown): Who's working on what
3. **Task Blocks** (YAML + Markdown): Individual tasks with history

**Example**:
```markdown
---
project: my-app
schema_version: "1.0"
next_id: 5
---

# Agents

| Name | Type | Roles | Status | Working On |
|------|------|-------|--------|------------|
| @alice | human | owner | working | TASK-003 |
| @bot | bot | engineer | idle | - |

# Tasks

\```yaml
id: TASK-001
title: Build authentication
status: done
priority: high
claimed_by: null
# ... more fields
history:
  - ts: 2026-02-07T10:00:00Z
    who: @bot
    action: created
  - ts: 2026-02-07T14:00:00Z
    who: @bot
    action: done
\```

Implemented JWT-based authentication with token refresh...
```

## Advanced Features

### Automatic Dependency Unblocking

When you complete a task, dependent tasks automatically unblock:
```bash
# TASK-002 depends on TASK-001
# TASK-002 status: blocked

tick done TASK-001 @bot
# TASK-002 automatically changes to: todo
```

### Circular Dependency Detection

Validation catches circular dependencies:
```bash
tick validate
# Error: Circular dependency detected: TASK-001 → TASK-002 → TASK-003 → TASK-001
```

### Smart Commit Messages

```bash
tick sync --push
# Automatically generates: "feat: complete TASK-001, TASK-002; update TASK-003"
```

### Real-time Monitoring

```bash
tick watch
# [10:23:45] ✓ Added: TASK-015 - Implement user search
# [10:24:12] 🔒 TASK-015 claimed by @bot
# [10:26:33] ⟳ TASK-015: in_progress → done
```

## Quick Reference Card

```
Workflow:      init → add → claim → work → comment → done → sync
Essential:     status | add | claim | done | list | graph
Coordination:  agent register | agent list | validate | watch
Git:           sync --pull | sync --push
```

## Key Reminders

1. **Users interact with YOU, not with Tick directly**
2. **YOU maintain the TICK.md transparently**
3. **Dashboard is for inspection, not primary interaction**
4. **Always use your agent name consistently**
5. **Comment frequently to show progress**
6. **Validate before syncing**
7. **Check status before claiming**
8. **Break down complex work into subtasks**

## Resources

- **GitHub**: https://github.com/your-org/tick-md
- **Documentation**: https://tick-md.dev/docs
- **CLI npm**: https://npmjs.com/package/tick-md
- **MCP Server npm**: https://npmjs.com/package/tick-mcp-server

## License

MIT
