# Tick MCP Tools Reference

Complete reference for using Tick via Model Context Protocol instead of CLI.

## When to Use MCP vs CLI

**Use MCP when**:
- Running in an MCP-enabled environment (Claude Desktop, Cursor, etc.)
- Want structured JSON responses
- Building automated workflows
- Need programmatic access

**Use CLI when**:
- Working in terminal
- Need colored output
- Want human-readable formatting
- Using in shell scripts

## Tool Catalog

### tick_status

Get comprehensive project status including all tasks, agents, and progress.

**Arguments**: None

**Returns**:
```json
{
  "project": "my-app",
  "updated": "2026-02-07T20:00:00Z",
  "agents": [
    {
      "name": "@bot",
      "type": "bot",
      "status": "working",
      "roles": ["engineer"],
      "working_on": "TASK-001"
    }
  ],
  "tasks": {
    "total": 10,
    "done": 7,
    "percentage": 70,
    "by_status": [
      {
        "status": "todo",
        "count": 2,
        "tasks": [...]
      },
      {
        "status": "in_progress",
        "count": 1,
        "tasks": [...]
      }
    ]
  }
}
```

**Usage**:
```javascript
const status = await tick_status({});
console.log(`Project: ${status.project}`);
console.log(`Progress: ${status.tasks.percentage}%`);
```

### tick_add

Create a new task. Returns the task ID.

**Arguments**:
- `title` (required): Task title
- `priority`: "urgent" | "high" | "medium" | "low" (default: "medium")
- `tags`: Array of tag strings
- `assignedTo`: Agent name to assign to
- `description`: Detailed task description
- `dependsOn`: Array of task IDs this depends on
- `estimatedHours`: Number of hours estimated

**Returns**: `"Created task TASK-XXX: [title]"`

**Example**:
```javascript
await tick_add({
  title: "Implement user authentication",
  priority: "high",
  tags: ["backend", "security", "auth"],
  assignedTo: "@backend-bot",
  description: "Add JWT-based authentication with refresh tokens",
  estimatedHours: 8
});
// Returns: "Created task TASK-023: Implement user authentication"
```

### tick_claim

Claim a task for an agent. Sets status to `in_progress` and acquires lock.

**Arguments**:
- `taskId` (required): Task ID (e.g., "TASK-001")
- `agent` (required): Agent name (e.g., "@bot-name")

**Returns**: `"Task TASK-XXX claimed by @agent"`

**Example**:
```javascript
await tick_claim({
  taskId: "TASK-023",
  agent: "@backend-bot"
});
```

### tick_release

Release a claimed task back to `todo` status and remove lock.

**Arguments**:
- `taskId` (required): Task ID
- `agent` (required): Agent name

**Returns**: `"Task TASK-XXX released by @agent"`

**Example**:
```javascript
await tick_release({
  taskId: "TASK-023",
  agent: "@backend-bot"
});
```

### tick_done

Mark task as complete. Automatically unblocks dependent tasks.

**Arguments**:
- `taskId` (required): Task ID
- `agent` (required): Agent name

**Returns**: `"Task TASK-XXX completed by @agent"`

**Example**:
```javascript
await tick_done({
  taskId: "TASK-023",
  agent: "@backend-bot"
});
```

**Side effects**:
- Sets task status to "done"
- Clears `claimed_by`
- Releases lock
- Iterates through all tasks and unblocks any with this task in `depends_on`

### tick_comment

Add a comment/note to task history.

**Arguments**:
- `taskId` (required): Task ID
- `agent` (required): Agent name
- `note` (required): Comment text

**Returns**: `"Added comment to TASK-XXX"`

**Example**:
```javascript
await tick_comment({
  taskId: "TASK-023",
  agent: "@backend-bot",
  note: "Completed JWT token generation, working on refresh token logic"
});
```

### tick_validate

Validate TICK.md for errors and warnings.

**Arguments**: None

**Returns**:
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    {
      "type": "warning",
      "message": "Task TASK-005 has no history entries",
      "location": "TASK-005",
      "fix": "Add at least a 'created' history entry"
    }
  ],
  "summary": {
    "tasks_validated": 10,
    "agents_registered": 3
  }
}
```

**Validation checks**:
- Duplicate task IDs
- Invalid task references (depends_on, blocks)
- Circular dependencies
- Missing required fields
- Logical consistency (e.g., done tasks shouldn't be claimed)

### tick_agent_list

List all registered agents with optional filtering.

**Arguments**:
- `status`: Filter by "working" | "idle" | "offline"
- `type`: Filter by "human" | "bot"

**Returns**:
```json
{
  "agents": [
    {
      "name": "@backend-bot",
      "type": "bot",
      "status": "working",
      "roles": ["engineer", "backend"],
      "working_on": "TASK-023",
      "trust_level": "trusted"
    }
  ]
}
```

**Example**:
```javascript
// List all working bots
const agents = await tick_agent_list({
  type: "bot",
  status: "working"
});
```

### tick_agent_register

Register a new agent in the project.

**Arguments**:
- `name` (required): Agent name (e.g., "@bot-name")
- `type`: "human" | "bot" (default: "human")
- `roles`: Array of role strings (default: ["developer"])
- `status`: "working" | "idle" | "offline" (default: "idle")

**Returns**: `"Agent @name registered (type: bot, roles: engineer, qa)"`

**Example**:
```javascript
await tick_agent_register({
  name: "@qa-bot",
  type: "bot",
  roles: ["qa", "testing", "automation"],
  status: "idle"
});
```

## Error Handling

All tools return errors in this format:

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

**Common errors**:
- "TICK.md not found" - Run `tick init` first
- "Task TASK-XXX not found" - Check `tick_status` for valid IDs
- "Task already claimed by @other" - Release first or choose different task
- "Agent not registered" - Use `tick_agent_register`

## Workflow Examples

### Complete Workflow

```javascript
// 1. Check status
const status = await tick_status({});
console.log(`${status.tasks.done}/${status.tasks.total} tasks complete`);

// 2. Register if needed
await tick_agent_register({
  name: "@my-bot",
  type: "bot",
  roles: ["engineer"]
});

// 3. Create task
await tick_add({
  title: "Build API endpoint",
  priority: "high",
  tags: ["backend", "api"]
});

// 4. Claim it (use ID from response)
await tick_claim({
  taskId: "TASK-024",
  agent: "@my-bot"
});

// 5. Work and comment
await tick_comment({
  taskId: "TASK-024",
  agent: "@my-bot",
  note: "Implemented GET /api/users endpoint"
});

// 6. Complete
await tick_done({
  taskId: "TASK-024",
  agent: "@my-bot"
});

// 7. Validate
const validation = await tick_validate({});
if (!validation.valid) {
  console.error("Validation errors:", validation.errors);
}
```

### Parallel Task Creation

```javascript
// Create multiple related tasks
const tasks = [
  "Design database schema",
  "Implement data models",
  "Add API endpoints",
  "Write integration tests"
];

for (const title of tasks) {
  await tick_add({
    title,
    priority: "medium",
    tags: ["backend", "database"]
  });
}
```

### Dependency Chain

```javascript
// Create task chain with dependencies
await tick_add({
  title: "Design API contract",
  priority: "high",
  tags: ["api", "design"]
});

await tick_add({
  title: "Implement API",
  priority: "high",
  tags: ["api", "backend"],
  dependsOn: ["TASK-025"]  // Depends on design
});

await tick_add({
  title: "Write API tests",
  priority: "medium",
  tags: ["api", "testing"],
  dependsOn: ["TASK-026"]  // Depends on implementation
});
```

### Find Available Tasks

```javascript
const status = await tick_status({});

// Find unassigned tasks
const available = status.tasks.by_status
  .find(s => s.status === "todo")
  ?.tasks
  .filter(t => !t.assigned_to && !t.claimed_by);

if (available.length > 0) {
  console.log("Available tasks:", available);
  // Claim one
  await tick_claim({
    taskId: available[0].id,
    agent: "@my-bot"
  });
}
```

### Check Agent Workload

```javascript
const agents = await tick_agent_list({ type: "bot" });

for (const agent of agents.agents) {
  console.log(`${agent.name}: ${agent.status}`);
  if (agent.working_on) {
    console.log(`  Currently on: ${agent.working_on}`);
  }
}
```

## Performance Tips

1. **Cache status**: Don't call `tick_status` too frequently
2. **Batch operations**: Create multiple tasks in sequence
3. **Validate sparingly**: Only before important operations
4. **Use filters**: `tick_agent_list` with filters is faster

## Integration with CLI

MCP tools and CLI commands can be used together:

```bash
# CLI for setup
tick init
tick sync --pull

# MCP for automation
# (use tools here)

# CLI for git sync
tick sync --push
```

## MCP Server Configuration

To use these tools, configure the MCP server:

```json
{
  "mcpServers": {
    "tick": {
      "command": "node",
      "args": ["/path/to/tick-md/mcp/dist/index.js"],
      "cwd": "/path/to/your/project"
    }
  }
}
```

The server must run in a directory containing TICK.md.
