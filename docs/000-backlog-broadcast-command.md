# 000-BACKLOG: Broadcast Command & Squad Log

**Status:** Backlog
**Priority:** Medium
**Effort:** Small
**Tags:** `cli`, `protocol`, `communication`

## Summary

Add `tick broadcast` command and a `## Squad Log` section to TICK.md for informal cross-agent communication that isn't tied to a specific task. Equivalent to Bhanu's "squad chat" where agents share insights, coordinate informally, and post announcements.

## Motivation

Not everything is a task. Sometimes an agent discovers something useful:
- "Users who send 5+ messages convert 3x better"
- "New competitor launched a free tier"
- "Google algorithm update detected"

These insights need a place to land where other agents can see them during their polling loop and decide whether to act. Currently, the only option is task comments, which forces you to create a task for every observation.

## Proposed Design

### TICK.md Section

New section between Agents and Tasks:

```markdown
## Squad Log

| Timestamp | Agent | Message | Tags |
|-----------|-------|---------|------|
| 2026-02-08T14:00:00Z | @vision | Search volume for "ai chatbot" up 40% this month | seo,insight |
| 2026-02-08T14:15:00Z | @shuri | Found 20+ unused testimonials in the CMS | content,opportunity |
| 2026-02-08T14:30:00Z | @jarvis | Broadcast: Focus on homepage conversion this sprint | priority,directive |
```

### CLI Commands

```bash
# Post to squad log
tick broadcast "Search volume for 'ai chatbot' up 40% this month" --from @vision --tags seo,insight

# Post a directive (orchestrator → all agents)
tick broadcast "Focus on homepage conversion this sprint" --from @jarvis --tags priority,directive

# Read recent squad log entries
tick log                        # Last 10 entries
tick log --since 1h             # Last hour
tick log --from @vision         # From specific agent
tick log --tags seo             # Filter by tag
```

### MCP Tools

```javascript
// Post broadcast
await tick_broadcast({
  message: "Search volume for 'ai chatbot' up 40%",
  agent: "@vision",
  tags: ["seo", "insight"]
})

// Read log
await tick_log({
  since: "1h",
  tags: ["seo"]
})
```

## Agent Polling Integration

During the 15-minute check-in loop, each agent:

1. Runs `tick log --since 15m`
2. Scans for entries relevant to their domain
3. If actionable → creates a task or contributes to existing one
4. If informational → stores in their own context for future reference

Example flow:
```
@vision broadcasts: "ai chatbot" keyword trending
  ↓  (15 min later)
@shuri polls, sees it → tick add "Update homepage H1 with trending keyword" --tags seo,homepage
  ↓
@jarvis polls, sees new task → reviews, assigns priority, delegates
```

## Dashboard Integration

- New "Squad Log" tab or panel in dashboard
- Real-time feed (SSE updates)
- Filter by agent, tags, time range
- Highlight directives from orchestrator differently

## Retention Policy

- Squad log grows unbounded if unchecked
- Options:
  - Roll old entries to `squad-log/YYYY-MM.md` archive files
  - Keep last N entries in TICK.md (default 50)
  - Configurable in frontmatter: `squad_log_retention: 50`

## Open Questions

- Should broadcast entries have a TTL (auto-expire)?
- Allow agents to "react" to entries (👍 / 🔥 / ❓)?
- Should directives from orchestrator be visually distinct in TICK.md?

## Related

- Depends on: Agent polling skill (consumers of broadcasts)
- Enables: Autonomous insight-driven task creation
- Complements: Deliverables (insights can reference deliverables)
