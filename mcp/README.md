# Tick MCP Server

Model Context Protocol (MCP) server for Tick.md multi-agent coordination. Enables AI agents to use Tick commands for task management and coordination.

## Features

- **Task Management**: Create, claim, release, and complete tasks
- **Agent Coordination**: Register agents and track their work
- **Validation**: Validate TICK.md files for errors
- **Status Tracking**: Get real-time project status
- **Comments**: Add notes to task history

## Installation

### From npm (when published)

```bash
npm install -g tick-mcp-server
```

### Local Development

```bash
cd mcp
npm install
npm run build
```

## MCP Configuration

Add to your MCP settings file (e.g., `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "tick": {
      "command": "node",
      "args": ["/path/to/tick-md/mcp/dist/index.js"],
      "cwd": "/path/to/your/tick/project"
    }
  }
}
```

Or use npx (when published):

```json
{
  "mcpServers": {
    "tick": {
      "command": "npx",
      "args": ["tick-mcp-server"],
      "cwd": "/path/to/your/tick/project"
    }
  }
}
```

## Available Tools

### `tick_status`

Get current project status including tasks, agents, and progress.

**Returns:** JSON with project overview, agent list, task summary by status

### `tick_add`

Create a new task.

**Parameters:**
- `title` (required): Task title
- `priority`: urgent|high|medium|low (default: medium)
- `tags`: Array of tags
- `assignedTo`: Agent to assign to
- `description`: Detailed description
- `dependsOn`: Array of task IDs this depends on
- `estimatedHours`: Estimated hours to complete

**Returns:** Task ID of created task

### `tick_claim`

Claim a task for an agent.

**Parameters:**
- `taskId` (required): Task ID (e.g., "TASK-001")
- `agent` (required): Agent name (e.g., "@agent-name")

**Returns:** Confirmation message

### `tick_release`

Release a claimed task back to todo.

**Parameters:**
- `taskId` (required): Task ID
- `agent` (required): Agent name

**Returns:** Confirmation message

### `tick_done`

Mark a task as complete. Automatically unblocks dependent tasks.

**Parameters:**
- `taskId` (required): Task ID
- `agent` (required): Agent name

**Returns:** Confirmation message

### `tick_comment`

Add a comment to a task's history.

**Parameters:**
- `taskId` (required): Task ID
- `agent` (required): Agent name
- `note` (required): Comment text

**Returns:** Confirmation message

### `tick_validate`

Validate TICK.md for errors and warnings.

**Returns:** JSON with validation results (errors, warnings, summary)

### `tick_agent_list`

List all registered agents.

**Parameters:**
- `status` (optional): Filter by status (working|idle|offline)
- `type` (optional): Filter by type (human|bot)

**Returns:** JSON with agent list

### `tick_agent_register`

Register a new agent.

**Parameters:**
- `name` (required): Agent name (e.g., "@bot-name")
- `type`: human|bot (default: human)
- `roles`: Array of roles (default: ["developer"])
- `status`: working|idle|offline (default: idle)

**Returns:** Confirmation message

## Usage Example

Once configured, AI agents (like Claude) can use these tools:

```
AI: I'll help you create a task for the authentication system.

[Uses tick_add tool with:
  title: "Build authentication system"
  priority: "high"
  tags: ["backend", "security"]
]

AI: I've created TASK-023. Now let me claim it for myself.

[Uses tick_claim tool with:
  taskId: "TASK-023"
  agent: "@claude-agent"
]

AI: I've claimed the task and I'm working on it now.
```

## Architecture

The MCP server acts as a bridge between AI agents and the Tick CLI:

```
AI Agent (Claude/etc)
    ↓
MCP Protocol
    ↓
Tick MCP Server
    ↓
Tick CLI Commands
    ↓
TICK.md File
```

### Key Features

- **Reuses CLI Logic**: Imports commands from `../cli/src/commands/`
- **Stateless**: Each tool call reads/writes TICK.md
- **Safe**: All CLI validation and locking apply
- **JSON Responses**: Returns structured data for AI consumption

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Test (requires a Tick project in the directory)
node dist/index.js
```

## Requirements

- Node.js 18+
- A Tick project (with TICK.md file)
- MCP-compatible AI client

## Error Handling

All tools return error messages in the response if something goes wrong:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Task TASK-999 not found"
    }
  ],
  "isError": true
}
```

## Best Practices

1. **Check Status First**: Use `tick_status` to understand the project state
2. **Validate Often**: Run `tick_validate` after making changes
3. **Descriptive Comments**: Use `tick_comment` to explain progress
4. **Proper Workflow**: claim → work → comment → done
5. **Register First**: Register as an agent before claiming tasks

## License

MIT · Purple Horizons
