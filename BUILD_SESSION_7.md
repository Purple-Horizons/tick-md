# Build Session 7: Tick Coordination SKILL for AI Agents

**Date:** February 7-8, 2026  
**Duration:** ~20 minutes  
**Focus:** Create comprehensive SKILL for bots to easily adopt and use the Tick system

## Objective

Enable AI agents to:
1. **Understand** the Tick protocol quickly
2. **Interact naturally** with users (conversation-first approach)
3. **Maintain tasks transparently** in background
4. **Use dashboard for inspection**, not primary interaction

## What We Built

### Primary SKILL File
**Location**: `.cursor/skills/tick-coordination/SKILL.md`

**Key Sections**:
- Core concept (Tick = Git-based task coordination)
- Quick start (check status → init if needed)
- Common workflows (4 primary scenarios)
- Command reference (all CLI commands)
- MCP tools (alternative to CLI)
- Best practices (natural conversation first)
- Troubleshooting guide
- Integration patterns

**Features**:
- **Concise**: ~500 lines (optimal for context window)
- **Actionable**: Step-by-step workflows with actual commands
- **Practical**: Real scenarios bots will encounter
- **Complete**: Covers CLI, MCP, git integration

### Supporting Documents

#### mcp-reference.md
Complete MCP tools documentation:
- All 9 tools with full signatures
- JSON request/response examples
- Workflow examples in JavaScript
- Error handling guide
- Performance tips

#### quick-setup.md
2-minute setup guide:
- New project setup (4 commands)
- Existing project join (4 commands)
- CLI installation options
- MCP server configuration
- Common first-time issues
- Integration checklist

## SKILL Design Principles

### 1. Conversation-First Philosophy

**Core Principle**: Users interact with bots naturally, bots maintain structure transparently.

**Example**:
```
User: "Can you refactor the auth system?"
Bot: (internally creates task, claims it, works on it, marks done)
Bot: "I've refactored the authentication to use JWT tokens. 
     Updated TASK-023 with the changes."
```

**NOT**:
```
User: "Can you refactor the auth system?"
Bot: "Sure! Please create a task first by running: tick add..."
```

### 2. Progressive Disclosure

**Main SKILL.md** (500 lines):
- Essential workflows
- Common commands
- Quick reference

**Reference docs** (read when needed):
- Complete tool signatures
- Edge cases
- Advanced features

### 3. Concrete Examples Over Abstract Explanation

**Good** (concrete):
```bash
tick add "Refactor auth" --priority high --tags backend
tick claim TASK-001 @bot
tick done TASK-001 @bot
```

**Bad** (abstract):
"Use the add command to create tasks, then claim them..."

### 4. Real Scenarios

Included 4 primary scenarios bots will encounter:
1. User asks bot to do something
2. User asks about project status
3. Coordination with other agents
4. Breaking down complex work

## Key Innovation: Natural Task Management

Traditional approach:
```
User → Explicit task creation → Explicit updates → Manual tracking
```

Tick + AI approach:
```
User → Natural conversation with bot → Bot maintains tasks transparently → Dashboard for inspection
```

**Benefits**:
- Lower friction (no learning curve for users)
- Structured output (tasks tracked in TICK.md)
- Audit trail (full history in git)
- Multi-agent coordination (bots and humans work together)

## SKILL Metadata

```yaml
name: tick-coordination
description: Coordinate multi-agent work using the Tick protocol via CLI commands or MCP tools. Use when managing tasks, coordinating with other agents, tracking project progress, or when the user mentions tasks, coordination, agents, or project management. Enables natural conversation about work while maintaining structured task tracking.
```

**Trigger terms**:
- tasks, coordination, agents, project management
- Managing tasks, tracking progress
- Coordinating with other agents
- Natural conversation about work

## Usage Pattern

### Phase 1: Discovery (First Interaction)

```bash
# Bot checks if Tick exists
if [ ! -f TICK.md ]; then
  tick init
fi

# Bot registers itself (one time)
tick agent register @bot-name --type bot --roles "engineer"

# Bot checks status
tick status
```

### Phase 2: Natural Interaction

```
User: "Build a user dashboard"

Bot thinks:
1. Create task for dashboard
2. Break into subtasks if complex
3. Claim main task
4. Start working
5. Add comments for progress
6. Complete when done

Bot responds:
"I'll build the user dashboard. I've created TASK-024 and broken it into 
design, implementation, and testing subtasks. Starting with the layout now."
```

### Phase 3: Maintenance

```bash
# Bot adds progress comments
tick comment TASK-024 @bot --note "Completed layout, working on data integration"

# Bot completes
tick done TASK-024 @bot

# Bot validates
tick validate
```

## Integration Points

### 1. With CLI
Bots use CLI commands for task operations:
```bash
tick status
tick add "..."
tick claim TASK-XXX @bot
tick done TASK-XXX @bot
```

### 2. With MCP Tools
Or use MCP for programmatic access:
```javascript
await tick_status({})
await tick_add({ title: "...", priority: "high" })
await tick_claim({ taskId: "TASK-XXX", agent: "@bot" })
```

### 3. With Git
Background sync for version control:
```bash
tick sync --push
```

### 4. With Dashboard
Users inspect visually (read-only focus):
- Kanban board
- Dependency graph
- Activity feed
- Agent monitor

## Documentation Structure

```
.cursor/skills/tick-coordination/
├── SKILL.md              # Main guide (500 lines)
│   ├── Core concepts
│   ├── Quick start
│   ├── Common workflows
│   ├── Command reference
│   ├── Best practices
│   └── Troubleshooting
├── mcp-reference.md      # MCP tools detail
│   ├── Tool signatures
│   ├── Examples
│   ├── Error handling
│   └── Performance tips
└── quick-setup.md        # 2-minute setup
    ├── New project
    ├── Join existing
    ├── Installation
    └── Troubleshooting
```

## Key Sections Breakdown

### Quick Start (lines 20-35)
Absolute minimum to get started:
1. Check if TICK.md exists
2. Run `tick init` if not
3. Get status with `tick status`

### Common Workflows (lines 37-130)
4 essential patterns every bot needs:
1. User asks bot to do something → create, claim, work, done
2. User asks about status → read and summarize
3. Coordination with others → check status, validate
4. Breaking down work → create subtasks with dependencies

### Command Reference (lines 132-210)
All CLI commands with syntax:
- Project management (init, status, validate, sync)
- Task operations (add, claim, release, done, comment)
- Agent management (register, list)

### MCP Tools (lines 212-250)
Alternative to CLI for programmatic use:
- 9 tools listed with brief descriptions
- JavaScript examples
- When to use MCP vs CLI

### Best Practices (lines 252-290)
5 critical patterns:
1. Natural conversation first
2. Always use same agent name
3. Provide context in comments
4. Break down large tasks
5. Check status before claiming

## Testing the SKILL

Once this SKILL is in place, a bot should be able to:

```
Bot reads SKILL → Understands Tick → User says "build X" → Bot:
1. Creates task automatically
2. Registers if needed
3. Claims task
4. Works on it
5. Comments progress
6. Completes task
7. User sees result + structured history
```

## Benefits of This Approach

### For Users
- **Natural interaction**: Just talk to bot normally
- **Structured output**: Tasks tracked in TICK.md
- **Transparency**: Can see what bot did
- **Reversible**: Full git history
- **Inspectable**: Dashboard shows everything

### For Bots
- **Clear guide**: Knows exactly what to do
- **CLI or MCP**: Choose best tool for environment
- **Safe operations**: Validation and locking
- **Coordination**: Work with other agents
- **History**: Full audit trail

### For Teams
- **Human-AI collaboration**: Humans and bots coordinate
- **Git-based**: Standard version control
- **No cloud required**: Runs locally
- **Markdown format**: Human-readable
- **Tool-parseable**: Machine-actionable

## Real-World Usage Example

```
Developer: "Hey bot, I need a login page with Google OAuth"

Bot (internally):
1. tick add "Build login page with Google OAuth" --priority high --tags auth,frontend
2. tick claim TASK-025 @bot
3. (works on implementation)
4. tick comment TASK-025 @bot --note "Added OAuth configuration"
5. tick comment TASK-025 @bot --note "Implemented login UI"
6. tick comment TASK-025 @bot --note "Added redirect handling"
7. tick done TASK-025 @bot
8. tick validate

Bot (to user):
"I've built the login page with Google OAuth integration. The page handles 
authentication, token storage, and redirects. Created TASK-025 with full 
implementation details."

Developer can then:
- Check TICK.md for task details
- Review git history for changes
- View dashboard for visual overview
- See bot's progress comments
```

## Metrics

**SKILL File**:
- Main: 500 lines (optimal size)
- MCP reference: 400 lines
- Quick setup: 180 lines
- Total: ~1,100 lines of documentation

**Coverage**:
- 11 CLI commands documented
- 9 MCP tools explained
- 4 primary workflows
- 5 best practices
- 3 troubleshooting sections
- 10+ code examples

**Design Quality**:
- ✅ Concise (under 500 lines main file)
- ✅ Third-person description
- ✅ Specific trigger terms
- ✅ Concrete examples
- ✅ Progressive disclosure
- ✅ One-level references
- ✅ Consistent terminology

## What This Enables

With this SKILL in place:

1. **Any AI agent** can quickly adopt Tick
2. **Users interact naturally** without learning commands
3. **Tasks are tracked automatically** with full history
4. **Multiple agents coordinate** via shared TICK.md
5. **Dashboard provides oversight** for humans
6. **Git provides version control** and audit trail

## Next Steps (Optional)

1. **Video tutorial**: Record screencast of bot using Tick
2. **Example projects**: Sample repos with TICK.md
3. **Bot templates**: Starter configs for common bot types
4. **Dashboard widgets**: Real-time bot activity monitoring
5. **Slack/Discord integration**: Post updates to channels

## Conclusion

The tick-coordination SKILL completes the Tick ecosystem:

**For CLI**: Humans use commands directly  
**For MCP**: AI agents use tools programmatically  
**For SKILL**: AI agents understand the entire system  
**For Dashboard**: Everyone inspects visually  

The result: **Seamless human-AI collaboration** on structured tasks with full transparency and version control.

## Files Changed

```
.cursor/skills/tick-coordination/
├── SKILL.md              # Main coordination guide
├── mcp-reference.md      # Complete MCP tools reference
└── quick-setup.md        # 2-minute setup guide
```

## Git Status

```bash
git add .cursor/skills/
git commit -m "feat: add tick-coordination SKILL for AI agents"
```

**Commit**: e0bae06  
**Files**: 3 new files, 1,158 insertions  
**Status**: Committed and ready

---

🎉 **The Tick protocol is now complete and ready for AI agents!**
