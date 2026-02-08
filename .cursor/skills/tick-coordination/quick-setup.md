# Quick Setup Guide

Get Tick running in under 2 minutes.

## For New Projects

```bash
# 1. Navigate to your project
cd /path/to/your/project

# 2. Initialize Tick
tick init

# 3. Register yourself
tick agent register @your-bot-name --type bot --roles "engineer"

# 4. Check status
tick status
```

Done! You can now create and manage tasks.

## For Existing Tick Projects

```bash
# 1. Check project status
tick status

# 2. Register yourself (if not already)
tick agent register @your-bot-name --type bot --roles "engineer"

# 3. Find available work
tick status  # Look for todo items

# 4. Claim a task
tick claim TASK-XXX @your-bot-name
```

## Installing the CLI

### Option 1: Local Development
```bash
cd /path/to/tick-md/cli
npm install
npm run build
npm link  # Makes 'tick' available globally
```

### Option 2: From npm (when published)
```bash
npm install -g tick-md
```

### Option 3: Use without installing
```bash
npx tick-md init
```

## MCP Server Setup

### For Claude Desktop

1. Open Claude Desktop settings
2. Add to MCP servers config:

```json
{
  "mcpServers": {
    "tick": {
      "command": "node",
      "args": ["/absolute/path/to/tick-md/mcp/dist/index.js"],
      "cwd": "/absolute/path/to/your/project"
    }
  }
}
```

3. Restart Claude Desktop

### For Cursor

Add to Cursor's MCP settings (similar configuration).

### Verify MCP Server Works

In your MCP client:
```
"List available Tick tools"
```

You should see 9 tools: tick_status, tick_add, tick_claim, etc.

## First Task Workflow

```bash
# Create your first task
tick add "Set up project structure" --priority high

# Claim it
tick claim TASK-001 @your-name

# Work on it...

# Add progress notes
tick comment TASK-001 @your-name --note "Created directory structure"

# Complete it
tick done TASK-001 @your-name

# View updated status
tick status
```

## Git Integration

```bash
# Initialize git if needed
git init
git add .
git commit -m "Initial commit"

# Sync Tick changes
tick sync --push
```

## Common First-Time Issues

### "tick: command not found"
**Solution**: Install CLI or use full path:
```bash
node /path/to/tick-md/cli/dist/cli.js init
```

### "TICK.md not found"
**Solution**: Run `tick init` first

### "Agent not registered"
**Solution**: 
```bash
tick agent register @your-name --type bot
```

### MCP tools not showing
**Solution**: 
1. Check MCP config paths are absolute
2. Ensure `cwd` points to directory with TICK.md
3. Restart MCP client

## Directory Structure After Setup

```
your-project/
├── TICK.md              # Main coordination file
├── .tick/
│   ├── config.yml      # Project config
│   └── lock            # Advisory locks
└── ... your project files ...
```

## What's in TICK.md?

After `tick init`, you'll have:
```markdown
---
project: your-project-name
schema_version: "1.0"
created: 2026-02-07T20:00:00Z
updated: 2026-02-07T20:00:00Z
next_id: 1
---

# Agents

| Name | Type | Roles | Status | Working On |
|------|------|-------|--------|------------|

# Tasks

(No tasks yet)
```

## Next Steps

1. **Read the main SKILL.md** for complete usage guide
2. **Create your first real task** based on actual work
3. **Try the dashboard** at http://localhost:3000/dashboard (if you have the Next.js app running)
4. **Validate frequently** with `tick validate`
5. **Sync to git** with `tick sync --push`

## Getting Help

```bash
tick --help                    # General help
tick add --help               # Command-specific help
tick validate --verbose       # Detailed validation
cat .cursor/skills/tick-coordination/SKILL.md  # Read full guide
```

## Tips for Bots

1. **Always register yourself first** - One time per project
2. **Use consistent agent name** - Same name across all commands
3. **Check status before claiming** - Make sure task exists and is available
4. **Comment frequently** - Keep humans informed of progress
5. **Validate before syncing** - Catch errors early
6. **Read TICK.md directly** - It's plain Markdown, you can inspect it anytime

## Integration Checklist

- [ ] CLI installed or accessible
- [ ] Project initialized (`tick init`)
- [ ] Agent registered (`tick agent register`)
- [ ] Can view status (`tick status`)
- [ ] Can create tasks (`tick add`)
- [ ] Can claim tasks (`tick claim`)
- [ ] Can complete tasks (`tick done`)
- [ ] (Optional) MCP server configured
- [ ] (Optional) Git integration working (`tick sync`)

You're ready to coordinate! 🚀
