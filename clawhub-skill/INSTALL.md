# Quick Setup Guide

## For End Users (Installation)

**Note**: This is an installation guide. Once installed, the skill teaches your AI agent how to coordinate tasks - no editor-specific code needed.

### Step 1: Install CLI
```bash
npm install -g tick-md
```

### Step 2: Install MCP Server
```bash
npm install -g tick-mcp-server
```

### Step 3: Configure MCP (Editor-Specific)

The configuration varies by editor. Add this to your editor's MCP config file:

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

**Config file locations**:
- **Cursor**: `~/.cursor/mcp_config.json`
- **Claude Code** (VS Code): `.vscode/claude_code_config.json` in your project
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Cline**: `.vscode/cline_mcp_settings.json`
- **Other**: Check your editor's MCP documentation

### Security Note (Important)

- Back up config files before editing them.
- Only apply MCP config changes with explicit user approval.
- Prefer testing in a throwaway repository first.
- `tick sync --push` and `git push` can send data to remotes; only run with explicit user approval.

### Step 4: Initialize Project
```bash
cd your-project
tick init
```

### Step 5: Test It
```bash
tick status
```

## First-Time Bot Setup

When your bot first interacts with a Tick project:

```bash
# Register yourself
tick agent register @bot-name --type bot --roles "engineer,qa"

# Create your first task
tick add "Test Tick integration" --priority medium

# Claim it
tick claim TASK-001 @bot-name

# Work on it...

# Complete it
tick done TASK-001 @bot-name
```

## Verifying MCP Connection

After configuring MCP, restart your AI assistant and check:

```
User: "Can you check the tick status?"
Bot: [calls tick_status MCP tool]
```

If the bot doesn't have access to tick_* tools, check:
1. MCP config file location is correct
2. `tick-mcp-server` is installed globally
3. AI assistant was restarted after config change

## Common First-Time Issues

### Issue: `tick: command not found`
**Solution**: Install CLI globally
```bash
npm install -g tick-md
```

### Issue: MCP tools not available
**Solutions**:
1. Verify `tick-mcp-server` is installed: `npm list -g tick-mcp-server`
2. Check config file path matches your editor
3. Restart your AI assistant completely

### Issue: `TICK.md not found`
**Solution**: Initialize the project
```bash
cd /path/to/your/project
tick init
```

### Issue: Can't claim task
**Solutions**:
1. Register as agent first: `tick agent register @your-name --type bot`
2. Check task isn't already claimed: `tick status`
3. Verify task ID is correct: `tick list`

## Next Steps

1. **Read the main SKILL.md** for complete usage guide
2. **Try the workflows** in the skill documentation
3. **Customize** your agent roles and tags
4. **Integrate with Git**: `tick sync --init` to enable version control

## Getting Help

```bash
tick --help                    # General help
tick <command> --help          # Command-specific help
tick validate --verbose        # Check for issues
```

## Quick Reference

```bash
# Essentials
tick init              # Start new project
tick status            # See overview
tick list              # List tasks
tick graph             # Visualize

# Task workflow
tick add "..."         # Create
tick claim <id> @me    # Claim
tick comment <id> @me  # Update
tick done <id> @me     # Complete

# Coordination
tick agent register @name --type bot
tick agent list
tick watch             # Monitor changes
```
