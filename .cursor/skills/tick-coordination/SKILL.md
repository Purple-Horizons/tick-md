---
name: tick-coordination
description: Coordinate multi-agent work using the Tick protocol via CLI commands or MCP tools. Use when managing tasks, coordinating with other agents, tracking project progress, or when the user mentions tasks, coordination, agents, or project management. Enables natural conversation about work while maintaining structured task tracking.
---

# Tick Multi-Agent Coordination

Coordinate work across human and AI agents using structured Markdown files. Users interact naturally with you, and you maintain tasks transparently in TICK.md.

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

# Or get specific info
tick agent list --verbose
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

# Create subtasks
tick add "Design dashboard layout" --priority high --tags frontend,design
tick add "Implement data charts" --priority medium --tags frontend,charts --depends-on TASK-XXX
tick add "Add CSV export" --priority low --tags frontend,export --depends-on TASK-XXX

# Show user the plan
tick status
```

## Command Reference

### Project Management
```bash
tick init                          # Initialize new project
tick status                        # View project overview
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

## Common Scenarios

### Scenario 1: Starting Fresh

```bash
# Project doesn't have Tick yet
tick init

# Register yourself
tick agent register @bot --type bot --roles "assistant,developer"

# Ask user what they want to accomplish
# Create tasks based on conversation
tick add "First task based on user input" --priority high

# Claim and start working
tick claim TASK-001 @bot
```

### Scenario 2: Joining Existing Project

```bash
# Check current status
tick status

# Register yourself
tick agent register @new-bot --type bot --roles "qa,testing"

# Look for unassigned tasks
tick status  # Review todo items

# Claim relevant task
tick claim TASK-XXX @new-bot
```

### Scenario 3: Coordinating with Humans

```bash
# Human asks: "What's left to do?"
tick status  # Show tasks by status

# Human: "Can you take the API task?"
tick claim TASK-API @bot

# Work on it, provide updates
tick comment TASK-API @bot --note "Completed 3 of 5 endpoints"

# Complete when done
tick done TASK-API @bot
```

### Scenario 4: Handling Blockers

```bash
# You're blocked on something
tick comment TASK-XXX @bot --note "Blocked: waiting for API credentials"

# Release the task if you can't proceed
tick release TASK-XXX @bot

# Or keep it claimed if you're actively working around the blocker
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

```yaml
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

## Troubleshooting

### Task Not Found
```bash
tick status  # List all tasks to find correct ID
```

### Can't Claim Task
- Task might already be claimed: `tick status`
- Task might be blocked: Check `depends_on` in task details
- You might not be registered: `tick agent register @your-name --type bot`

### Validation Errors
```bash
tick validate --verbose  # See detailed errors
```

Common issues:
- Circular dependencies (A depends on B, B depends on A)
- Invalid task references in `depends_on`
- Malformed YAML

### Sync Conflicts
```bash
tick sync --pull  # Pull latest changes first
# Resolve conflicts in TICK.md manually
tick sync --push  # Push your changes
```

## Integration Patterns

### Pattern 1: Conversational Task Creation

```python
# User: "I need a login page"
# Bot internally:
task_id = create_task("Build login page", priority="high", tags=["frontend", "auth"])
claim_task(task_id, "@bot")
# Bot to user: "I'll build the login page. Creating task TASK-023 and working on it now."
```

### Pattern 2: Progress Reporting

```python
# After each significant step
add_comment(task_id, "@bot", "Completed user input validation")
add_comment(task_id, "@bot", "Added password strength indicator")
# User sees progress without asking
```

### Pattern 3: Delegation

```python
# Bot realizes it needs help
create_task("Design login UI mockup", assigned_to="@designer", depends_on=current_task)
add_comment(current_task, "@bot", "Created TASK-XXX for UI design, blocked until design is ready")
```

## Dashboard Usage

The web dashboard at `/dashboard` provides:
- Visual kanban board (drag-and-drop)
- Dependency graph visualization
- Activity feed (who did what)
- Agent status monitoring
- Task details and history

**Use for**:
- Quick visual inspection
- Team coordination meetings
- Progress presentations
- Identifying bottlenecks

**Don't use for**:
- Creating/editing tasks (use CLI/MCP)
- Day-to-day work (use commands)

The dashboard is **read-focused** for human oversight.

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

### Lock File Coordination

When you claim a task, `.tick/lock` prevents conflicts:
- Advisory locking (not enforced, but tools respect it)
- Includes PID and timestamp for stale lock detection
- Git is ultimate source of truth for conflicts

## Quick Reference Card

```
Workflow:      init → add → claim → work → comment → done → sync
Essential:     status | add | claim | done
Coordination:  agent register | agent list | validate
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

## Getting Help

If stuck:
```bash
tick --help              # General help
tick <command> --help    # Command-specific help
tick validate --verbose  # Detailed validation
cat TICK.md             # Read the file directly
```

The TICK.md file is plain Markdown - you can always read it directly to understand the current state.
