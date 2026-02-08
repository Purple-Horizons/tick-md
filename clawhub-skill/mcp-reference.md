# Tick Coordination Skill - MCP Tools Reference

Complete reference for all Model Context Protocol (MCP) tools exposed by `tick-mcp-server`.

## Installation

```bash
npm install -g tick-mcp-server
```

Add to MCP config:
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

## Available Tools

### 1. tick_status

Get complete project status including agents, tasks, and progress.

**Arguments**: None

**Returns**:
```json
{
  "project": "my-app",
  "agents": [
    {
      "name": "@alice",
      "type": "human",
      "roles": ["owner"],
      "status": "working",
      "working_on": "TASK-003"
    }
  ],
  "tasks": {
    "todo": 3,
    "in_progress": 2,
    "blocked": 1,
    "done": 5
  },
  "summary": "📊 Project Status\n..."
}
```

**Example**:
```javascript
const status = await tick_status();
console.log(status.summary);
```

### 2. tick_add

Create a new task.

**Arguments**:
- `title` (required): Task title
- `priority` (optional): "urgent" | "high" | "medium" | "low" (default: "medium")
- `tags` (optional): Array of strings
- `assignedTo` (optional): Agent name (e.g., "@alice")
- `description` (optional): Task description
- `dependsOn` (optional): Array of task IDs this depends on
- `blocks` (optional): Array of task IDs this blocks
- `estimatedHours` (optional): Number

**Returns**:
```json
{
  "taskId": "TASK-023",
  "message": "Task created successfully"
}
```

**Example**:
```javascript
const result = await tick_add({
  title: "Refactor authentication system",
  priority: "high",
  tags: ["backend", "security"],
  assignedTo: "@bot",
  estimatedHours: 8
});
// result.taskId => "TASK-023"
```

### 3. tick_claim

Claim a task for an agent (sets status to `in_progress`).

**Arguments**:
- `taskId` (required): Task ID (e.g., "TASK-001")
- `agent` (required): Agent name (e.g., "@bot")

**Returns**:
```json
{
  "success": true,
  "message": "🔒 @bot claimed TASK-001"
}
```

**Example**:
```javascript
await tick_claim({
  taskId: "TASK-023",
  agent: "@bot"
});
```

### 4. tick_release

Release a claimed task (sets status back to `todo`).

**Arguments**:
- `taskId` (required): Task ID
- `agent` (required): Agent name

**Returns**:
```json
{
  "success": true,
  "message": "🔓 @bot released TASK-001"
}
```

**Example**:
```javascript
await tick_release({
  taskId: "TASK-023",
  agent: "@bot"
});
```

### 5. tick_done

Mark a task as complete. Automatically unblocks dependent tasks.

**Arguments**:
- `taskId` (required): Task ID
- `agent` (required): Agent name

**Returns**:
```json
{
  "success": true,
  "message": "✅ @bot completed TASK-001\nUnblocked: TASK-002, TASK-003"
}
```

**Example**:
```javascript
await tick_done({
  taskId: "TASK-023",
  agent: "@bot"
});
```

### 6. tick_comment

Add a comment/note to a task.

**Arguments**:
- `taskId` (required): Task ID
- `agent` (required): Agent name
- `note` (required): Comment text

**Returns**:
```json
{
  "success": true,
  "message": "💬 @bot commented on TASK-001"
}
```

**Example**:
```javascript
await tick_comment({
  taskId: "TASK-023",
  agent: "@bot",
  note: "Completed JWT integration, starting refresh token logic"
});
```

### 7. tick_validate

Validate TICK.md for structural and logical errors.

**Arguments**:
- `verbose` (optional): Boolean (default: false)

**Returns**:
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    {
      "type": "orphaned_task",
      "taskId": "TASK-005",
      "message": "Task has no dependencies and is not claimed"
    }
  ],
  "summary": "✅ Validation passed (0 errors, 1 warning)"
}
```

**Example**:
```javascript
const validation = await tick_validate({ verbose: true });
if (!validation.valid) {
  console.error("Validation errors:", validation.errors);
}
```

### 8. tick_agent_register

Register a new agent in the project.

**Arguments**:
- `name` (required): Agent name (e.g., "@bot-qa")
- `type` (optional): "human" | "bot" (default: "bot")
- `roles` (optional): Array of strings (default: ["developer"])
- `status` (optional): "working" | "idle" | "offline" (default: "idle")

**Returns**:
```json
{
  "success": true,
  "message": "✅ Registered @bot-qa as bot"
}
```

**Example**:
```javascript
await tick_agent_register({
  name: "@bot-qa",
  type: "bot",
  roles: ["qa", "testing"],
  status: "idle"
});
```

### 9. tick_agent_list

List all registered agents with optional filtering.

**Arguments**:
- `status` (optional): Filter by status ("working" | "idle" | "offline")
- `type` (optional): Filter by type ("human" | "bot")
- `verbose` (optional): Boolean for detailed output (default: false)

**Returns**:
```json
{
  "agents": [
    {
      "name": "@alice",
      "type": "human",
      "roles": ["owner", "developer"],
      "status": "working",
      "working_on": "TASK-003",
      "created": "2026-02-07T10:00:00Z",
      "updated": "2026-02-07T15:30:00Z"
    },
    {
      "name": "@bot",
      "type": "bot",
      "roles": ["engineer"],
      "status": "idle",
      "working_on": null
    }
  ],
  "count": 2,
  "summary": "👥 2 agents (1 human, 1 bot)"
}
```

**Example**:
```javascript
// List all bot agents
const bots = await tick_agent_list({ type: "bot", verbose: true });

// List currently working agents
const working = await tick_agent_list({ status: "working" });
```

## Common Patterns

### Pattern 1: Full Task Lifecycle

```javascript
// Create task
const { taskId } = await tick_add({
  title: "Implement user search",
  priority: "high",
  tags: ["feature", "search"]
});

// Register bot (first time only)
await tick_agent_register({
  name: "@search-bot",
  type: "bot",
  roles: ["backend-engineer"]
});

// Claim task
await tick_claim({ taskId, agent: "@search-bot" });

// Add progress updates
await tick_comment({
  taskId,
  agent: "@search-bot",
  note: "Set up Elasticsearch client"
});

await tick_comment({
  taskId,
  agent: "@search-bot",
  note: "Implemented fuzzy matching"
});

// Complete
await tick_done({ taskId, agent: "@search-bot" });
```

### Pattern 2: Dependency Chain

```javascript
// Create main task
const { taskId: mainTask } = await tick_add({
  title: "Deploy to production",
  priority: "high"
});

// Create dependencies
const { taskId: testsTask } = await tick_add({
  title: "Run integration tests",
  priority: "high",
  blocks: [mainTask]
});

const { taskId: docsTask } = await tick_add({
  title: "Update deployment docs",
  priority: "medium",
  blocks: [mainTask]
});

// Work through dependencies
await tick_claim({ taskId: testsTask, agent: "@bot" });
// ... do work ...
await tick_done({ taskId: testsTask, agent: "@bot" });
// mainTask automatically unblocks if all dependencies complete
```

### Pattern 3: Status Monitoring

```javascript
// Get current status
const status = await tick_status();

// Find tasks needing attention
const needsWork = status.tasks.todo + status.tasks.blocked;

if (needsWork > 0) {
  console.log(`${needsWork} tasks need attention`);
  
  // Validate for issues
  const validation = await tick_validate({ verbose: true });
  
  if (validation.warnings.length > 0) {
    console.log("Warnings:", validation.warnings);
  }
}
```

### Pattern 4: Agent Coordination

```javascript
// Register multiple specialized bots
await tick_agent_register({
  name: "@code-bot",
  type: "bot",
  roles: ["developer", "code-gen"]
});

await tick_agent_register({
  name: "@qa-bot",
  type: "bot",
  roles: ["qa", "testing"]
});

await tick_agent_register({
  name: "@docs-bot",
  type: "bot",
  roles: ["documentation"]
});

// List to see team composition
const team = await tick_agent_list({ verbose: true });
console.log(`Team size: ${team.count}`);
```

## Error Handling

All tools return structured errors when operations fail:

```javascript
try {
  await tick_claim({
    taskId: "TASK-999",  // doesn't exist
    agent: "@bot"
  });
} catch (error) {
  console.error(error.message);
  // "Task TASK-999 not found"
}

try {
  await tick_claim({
    taskId: "TASK-001",  // already claimed
    agent: "@bot"
  });
} catch (error) {
  console.error(error.message);
  // "Task TASK-001 is already claimed by @alice"
}
```

## Tips for AI Agents

1. **Always check status first** before claiming tasks
2. **Register yourself once** at the start of a session
3. **Validate before major operations** to catch issues early
4. **Comment frequently** to show progress
5. **Use verbose flags** when debugging issues

## Combining with CLI

MCP tools and CLI commands can be used interchangeably:

```javascript
// Via MCP
await tick_add({ title: "Feature X", priority: "high" });

// Via CLI (same result)
// $ tick add "Feature X" --priority high
```

Use MCP tools for programmatic access, CLI for manual operations.
