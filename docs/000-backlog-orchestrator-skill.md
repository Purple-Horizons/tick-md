# 000-BACKLOG: Orchestrator Role & Skill

**Status:** Backlog
**Priority:** Critical
**Effort:** Medium
**Tags:** `skill`, `openclaw`, `orchestrator`, `multi-agent`

## Summary

Define `orchestrator` as a first-class role in the tick-md protocol and ship a reusable OpenClaw skill template for it. The orchestrator is the squad lead — single point of contact for humans, delegates work to specialists, tracks progress, enforces quality (deliverables required), and escalates blockers. Users name their own orchestrator agent; tick-md defines the behavior.

## Motivation

This is the highest-impact piece. Without an orchestrator:
- Humans have to manually assign tasks to each specialist
- No one tracks whether tasks actually get done
- No prioritization across the squad
- No escalation when things stall

With the orchestrator role:
- Human sends one message → orchestrator breaks it into tasks, assigns specialists
- Orchestrator polls TICK.md, follows up on stale tasks
- Orchestrator reviews deliverables before marking work complete
- Orchestrator sends notifications back to human via OpenClaw Gateway

## Proposed Design

### Protocol: `orchestrator` Role

The `orchestrator` role is a first-class concept in tick-md. An agent registered with this role gets special protocol behavior:

- **Sole human contact**: Only the orchestrator receives messages from humans via channels
- **Delegation authority**: Can assign tasks to any agent in the squad
- **Follow-up loop**: Responsible for polling and escalation
- **Deliverable gating**: Must verify deliverables before accepting task completion
- **Auto-approve mode**: When enabled, orchestrator has final review authority

In TICK.md agents table:

```markdown
| Agent | Type | Roles | Status | Working On |
|-------|------|-------|--------|------------|
| @lead | bot | **orchestrator** | working | TASK-060 |
| @seo  | bot | seo-analyst | idle | - |
| @res  | bot | researcher | working | TASK-055 |
| @dev  | bot | developer | idle | - |
| @design | bot | designer | idle | - |
```

### System Prompt Template

```markdown
# {agent_name} — Squad Orchestrator

You are the orchestrator of this squad, coordinating work across all agents.
You are the ONLY agent that communicates directly with the human.

## Your Responsibilities
1. **Intake**: Receive requests from the human. Break them into tasks.
2. **Delegate**: Assign tasks to the right specialist based on their role.
3. **Track**: Poll TICK.md every cycle. Follow up on stale/blocked tasks.
4. **Quality**: Verify deliverables exist before accepting task completion.
5. **Escalate**: Notify human when decisions are needed or blockers arise.
6. **Prioritize**: When capacity is constrained, decide what matters most.

## Your Squad
(Auto-populated from TICK.md agents table at runtime)

## Rules
- NEVER do specialist work yourself. Delegate.
- ALWAYS require deliverables before marking tasks done.
- When human says "don't wait on me" → enter auto-approve mode.
- When human is unreachable for 24h → send email summary.
- Every cycle: check for blocked tasks, stale tasks (>48h no update),
  and new squad log entries that need action.

## Tools Available
- tick add, tick claim, tick done, tick comment, tick deliver
- tick broadcast (for squad-wide announcements)
- tick status (for monitoring)
- tick log (for squad log entries)
- tick notify (to message human on Telegram/WhatsApp via OpenClaw Gateway)
```

### OpenClaw Agent Config

```json
{
  "name": "<user-chosen-name>",
  "workspace": "~/agents/<name>/",
  "model": "claude-sonnet-4-20250514",
  "system_prompt": "skills/orchestrator.md",
  "tools": ["tick-md", "web-search", "gateway-notify"],
  "channels": ["telegram-main"],
  "polling": {
    "enabled": true,
    "interval_minutes": 15,
    "on_poll": "Check TICK.md status. Follow up on stale tasks. Review new squad log entries. Notify human of anything requiring attention."
  }
}
```

Users choose their own agent name. The `orchestrator` role is what matters, not the name.

### Delegation Flow

```
Human (Telegram): "I want to improve our homepage conversion"
  │
  ▼
@lead (orchestrator) receives message via OpenClaw Gateway
  │
  ├── tick add "Audit homepage as real user" --assigned-to @res --priority high
  ├── tick add "Keyword analysis for homepage" --assigned-to @seo --priority high
  ├── tick add "Design spec for homepage improvements" --assigned-to @design --depends-on TASK-051,TASK-052
  ├── tick add "Implement homepage improvements" --assigned-to @dev --depends-on TASK-053
  │
  ▼
@lead replies on Telegram:
  "Breaking this into 4 tasks:
   1. @res audits the site as a real user
   2. @seo runs keyword analysis
   3. @design creates design spec (after 1+2)
   4. @dev implements (after 3)
   ETA: ~3 days. I'll ping you when deliverables are ready."
```

### Follow-Up Loop (Every 15 Minutes)

```python
# Pseudocode for orchestrator polling behavior
def on_poll(orchestrator_name):
    status = tick_status()
    
    # Check for completed tasks missing deliverables
    for task in status.tasks:
        if task.status == "done" and not task.deliverables:
            tick_comment(task.id, orchestrator_name, 
                f"@{task.claimed_by} — task marked done but no deliverable attached. Please add one.")
    
    # Check for stale tasks (no update in 48h)
    for task in status.tasks:
        if task.status == "in_progress" and task.last_update > 48h:
            tick_comment(task.id, orchestrator_name,
                f"@{task.claimed_by} — no update in 48h. Status?")
    
    # Check squad log for actionable insights
    log = tick_log(since="15m")
    for entry in log:
        if entry.is_actionable and entry.agent != orchestrator_name:
            # Decide whether to create a task from this insight
            evaluate_and_maybe_create_task(entry)
    
    # Notify human of anything requiring attention
    mentions = [t for t in status.tasks if t.needs_human_input]
    if mentions:
        tick_notify(mentions)
```

### Auto-Approve Mode

When human says "don't wait on me":

```bash
tick broadcast "Entering auto-approve mode. Orchestrator has final review authority." --from @lead --tags directive
```

The orchestrator then:
- Reviews deliverables autonomously (checks for completeness, quality)
- Approves or requests revisions without human input
- Queues a daily digest email for human

## Skill File Structure

```
skills/
  orchestrator/
    SKILL.md              # The skill definition
    system-prompt.md      # Orchestrator system prompt template
    delegation-rules.md   # How to match tasks to agents by role
    examples/
      intake-example.md   # Example: human request → task breakdown
      followup-example.md # Example: stale task escalation
```

## OpenClaw Integration Points

- **Gateway RPC** (`agent` / `agent.wait`): Orchestrator triggers specialist agents
- **Channel routing**: Orchestrator owns the human-facing Telegram/WhatsApp channel
- **Polling hook**: Gateway cron or internal timer triggers orchestrator's check-in loop
- **Notification**: Orchestrator uses Gateway to send messages back to human's channel

## Open Questions

- Should the orchestrator have a "budget" (max tasks per day) to prevent busywork?
- How does it handle conflicting priorities from multiple humans?
- Should auto-approve mode have guardrails (e.g., never auto-approve tasks touching production)?
- How to handle the orchestrator itself getting stuck or erroring out?
- Should `tick init` offer to set up the orchestrator role during project scaffolding?

## Related

- Requires: Deliverables field, Broadcast command
- Enables: Full autonomous squad operation
- Complements: Agent polling skill (specialists), Notification hooks
