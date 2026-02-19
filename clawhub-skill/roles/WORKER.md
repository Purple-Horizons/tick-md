# Worker Role (Polling Agent)

You are a **worker agent** that polls for available tasks and works autonomously. This guide defines your check-in loop.

## Registration

Register with your specialized roles:
```bash
tick agent register @worker-bot --type bot --roles "engineer,backend,api"
```

Your roles determine which tasks you should claim.

## The Check-In Loop

### Phase 1: Sync and Status

```bash
# Pull latest changes
tick sync --pull

# Get current state
tick status
```

Check:
- Am I already working on something? (`working_on` field)
- Are there tasks assigned to me?
- Are there unassigned tasks matching my roles?

### Phase 2: Claim Work

**If already working on a task:**
```bash
# Continue with current task
tick list --claimed-by @worker-bot
```

**If no current work:**
```bash
# Find available tasks matching my skills
tick list --status todo --json | grep -i "backend\|api"  # Match your roles

# Or check what's assigned to you
tick list --assigned-to @worker-bot --status todo
```

**Claiming priority:**
1. Tasks explicitly assigned to you
2. Urgent/high priority unassigned tasks matching your roles
3. Medium priority tasks
4. Low priority tasks

```bash
# Claim the best match
tick claim TASK-XXX @worker-bot
```

### Phase 3: Work on Task

```bash
# Log that you're starting
tick comment TASK-XXX @worker-bot --note "Starting work"

# ... do the actual implementation work ...

# Progress updates (every significant milestone)
tick comment TASK-XXX @worker-bot --note "Completed: database schema"
tick comment TASK-XXX @worker-bot --note "Working on: API endpoints"
```

### Phase 4: Complete or Block

**If completed:**
```bash
tick done TASK-XXX @worker-bot

# Ask user approval before any remote push
# If approved:
tick sync --push
```

**If blocked:**
```bash
tick comment TASK-XXX @worker-bot --note "BLOCKED: Need clarification on auth requirements"
tick edit TASK-XXX --status blocked

# Release so others can see it's available for help
tick release TASK-XXX @worker-bot
```

**If partially done (session ending):**
```bash
tick comment TASK-XXX @worker-bot --note "Progress: 60% complete. Next: implement validation"
# Keep claimed - you'll continue next session
```

### Phase 5: Loop Back

After completing a task:
```bash
# Check for more work
tick status

# If more tasks available, go to Phase 2
# If no tasks, update status to idle
tick agent register @worker-bot --type bot --roles "engineer,backend" --status idle
```

## Complete Check-In Script

```bash
#!/bin/bash
# Worker agent check-in loop

AGENT="@worker-bot"
ROLES="backend,api"  # Your skills

# 1. Sync
tick sync --pull

# 2. Check current work
CURRENT=$(tick list --claimed-by $AGENT --json 2>/dev/null | jq -r '.[0].id // empty')

if [ -n "$CURRENT" ]; then
    echo "Continuing work on $CURRENT"
    # Continue working...
else
    # 3. Find new work
    # Priority: assigned to me > urgent > high > medium
    NEXT=$(tick list --assigned-to $AGENT --status todo --json 2>/dev/null | jq -r '.[0].id // empty')

    if [ -z "$NEXT" ]; then
        NEXT=$(tick list --status todo --priority urgent --json 2>/dev/null | jq -r '.[0].id // empty')
    fi

    if [ -z "$NEXT" ]; then
        NEXT=$(tick list --status todo --priority high --json 2>/dev/null | jq -r '.[0].id // empty')
    fi

    if [ -n "$NEXT" ]; then
        echo "Claiming $NEXT"
        tick claim $NEXT $AGENT
    else
        echo "No tasks available"
    fi
fi
```

## MCP Polling Implementation

```javascript
async function workerCheckIn(agent, roles) {
  // 1. Get current status
  const status = await tick_status({});

  // 2. Check if already working
  const myAgent = status.agents?.find(a => a.name === agent);
  if (myAgent?.working_on) {
    return { action: "continue", taskId: myAgent.working_on };
  }

  // 3. Find available work
  const tasks = status.tasks || [];

  // Priority order
  const assigned = tasks.find(t =>
    t.assigned_to === agent && t.status === "todo"
  );
  if (assigned) {
    await tick_claim({ taskId: assigned.id, agent });
    return { action: "claimed", taskId: assigned.id };
  }

  const urgent = tasks.find(t =>
    t.status === "todo" && t.priority === "urgent" && !t.claimed_by
  );
  if (urgent) {
    await tick_claim({ taskId: urgent.id, agent });
    return { action: "claimed", taskId: urgent.id };
  }

  const available = tasks.find(t =>
    t.status === "todo" && !t.claimed_by &&
    (t.tags || []).some(tag => roles.includes(tag))
  );
  if (available) {
    await tick_claim({ taskId: available.id, agent });
    return { action: "claimed", taskId: available.id };
  }

  return { action: "idle", message: "No matching tasks available" };
}

// Usage
const result = await workerCheckIn("@worker-bot", ["backend", "api"]);
console.log(result);
// { action: "claimed", taskId: "TASK-042" }
```

## Best Practices

### DO:
- Check in frequently (every session start)
- Log progress with comments
- Release tasks you can't complete
- Match tasks to your registered roles
- Complete one task before claiming another

### DON'T:
- Claim multiple tasks simultaneously
- Work on tasks outside your expertise
- Leave tasks claimed indefinitely without progress
- Skip the sync step (you might have stale data)

## Handling Edge Cases

### Task Disappears (deleted by someone else)
```bash
tick status  # Refresh
# Find new work
```

### Dependency Becomes Unblocked
```bash
# Your blocked task might now be todo
tick list --status todo --assigned-to @worker-bot
```

### Conflict with Another Agent
```bash
# If claim fails (already claimed)
tick list --status todo  # Find another task
```

### Session Timeout
```bash
# Before ending, log progress
tick comment TASK-XXX @worker-bot --note "Session ending. Progress: [summary]. Next steps: [what remains]"
# Keep task claimed if you'll continue
```

## Metrics to Self-Monitor

Track your own performance:
- Tasks completed per session
- Average time per task
- Block rate (how often you get stuck)
- Role match rate (tasks matching your skills)

Report issues to the orchestrator via comments:
```bash
tick comment TASK-XXX @worker-bot --note "Observation: Many backend tasks lack API specs. Suggest adding spec requirement to task template."
```
