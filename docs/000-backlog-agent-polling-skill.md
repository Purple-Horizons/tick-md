# 000-BACKLOG: Agent Polling Skill (Specialist Check-In Loop)

**Status:** Backlog
**Priority:** High
**Effort:** Small–Medium
**Tags:** `skill`, `openclaw`, `polling`, `multi-agent`

## Summary

Create a reusable OpenClaw skill that gives any specialist agent a "check-in loop" — the pattern from Bhanu's setup where every 15 minutes, each agent checks the dashboard for new activity and contributes if they can. This turns passive agents (wait for assignment) into proactive ones (discover and contribute).

## Motivation

Without polling, agents only work when explicitly assigned tasks. With polling:
- @vision sees @shuri's homepage audit → adds keyword data unprompted
- @wanda sees a new content task → starts design spec before being asked
- @friday sees a blocked deployment task → investigates and unblocks

This is what made Bhanu's system feel alive — agents chiming in on their own.

## Proposed Design

### Skill Template (Per-Specialist)

```markdown
# Agent Polling Skill

## Check-In Behavior

Every {interval} minutes, you MUST:

1. **Check your tasks**: `tick status`
   - Claimed tasks: continue working, post progress comment
   - New tasks assigned to you: claim and start

2. **Scan recent activity**: `tick log --since {interval}m`
   - Look for entries relevant to your domain ({domain_tags})
   - If you can contribute → comment on the task or create a follow-up

3. **Review new/updated tasks**: Look at tasks updated since your last check
   - Even if not assigned to you
   - If your expertise applies → add a comment with your input
   - Do NOT claim tasks assigned to someone else

4. **Report blockers**: If you're stuck on anything
   - Comment on the task with what you need
   - Broadcast to squad log if it affects others

## Domain Tags
{domain_tags}

## Contribution Rules
- Only contribute to tasks where your expertise is clearly relevant
- Keep contributions concise — one comment, not a novel
- If you think a new task should be created, propose it to the orchestrator first
- Never override another agent's work — add to it
```

### OpenClaw Agent Config Pattern

```json
{
  "name": "vision",
  "workspace": "~/agents/vision/",
  "model": "claude-sonnet-4-20250514",
  "system_prompt": "skills/seo-specialist.md",
  "skills": ["skills/agent-polling.md"],
  "tools": ["tick-md", "web-search", "analytics-api"],
  "polling": {
    "enabled": true,
    "interval_minutes": 15,
    "on_poll": "Run your check-in loop as defined in agent-polling skill."
  }
}
```

### Polling Trigger Mechanisms

Three options (from simplest to most robust):

#### Option A: Cron + OpenClaw CLI
```bash
# crontab entry — triggers agent every 15 min
*/15 * * * * openclaw agent @vision --message "Check-in time. Run your polling loop."
```

#### Option B: Gateway RPC (Orchestrator triggers specialists)
```
@lead (orchestrator) on_poll:
  for agent in squad:
    gateway.rpc("agent", { agent: agent.name, message: "Check-in" })
```

#### Option C: OpenClaw Plugin Hook
```javascript
// OpenClaw plugin that fires on interval
export default {
  name: "tick-polling",
  hooks: {
    "gateway.interval": {
      every: "15m",
      agents: ["@seo", "@res", "@dev", "@design"],
      message: "Run your check-in loop."
    }
  }
}
```

Option A is the simplest to start. Option C is the cleanest long-term.

### Example Check-In Cycle (@seo agent)

```
[15:00] @seo check-in starts
  │
  ├── tick status → sees TASK-055 assigned to me, status: todo
  │   → tick claim TASK-055 @seo
  │   → starts keyword research
  │
  ├── tick log --since 15m → sees @res broadcast:
  │   "Found 20+ unused testimonials in CMS"
  │   → tick comment TASK-050 @seo
  │     "These testimonials could target 'ai chatbot reviews'
  │      keyword (1.2K monthly searches)"
  │
  └── reviews TASK-048 (not assigned to me) →
      sees it's about landing page copy →
      tick comment TASK-048 @seo
        "Consider adding 'free ai chatbot' to H1 —
         8K monthly searches, low competition"

[15:02] @seo check-in complete
```

## Dashboard Integration

- Agent monitor shows "Last check-in: 2 min ago" per agent
- Activity feed shows check-in contributions clearly
- Agents that miss 3+ check-ins get flagged as potentially offline

## Configuration

In TICK.md frontmatter:

```yaml
polling:
  default_interval: 15  # minutes
  agents:
    "@seo": { interval: 15, domain_tags: [seo, keywords, search] }
    "@res": { interval: 15, domain_tags: [research, ux, product] }
    "@dev": { interval: 30, domain_tags: [dev, code, deploy] }
    "@design": { interval: 15, domain_tags: [design, visual, brand] }
```

## Open Questions

- Should agents be able to adjust their own polling interval based on workload?
- What happens if a check-in takes longer than the interval? (Skip next? Queue?)
- Should check-ins be staggered to avoid all agents writing TICK.md simultaneously?
- How to handle file lock contention during simultaneous check-ins?

## Related

- Requires: Broadcast command (for reading squad log)
- Complements: Orchestrator role (orchestrator also polls, but with different responsibilities)
- Enables: Autonomous cross-agent contribution
