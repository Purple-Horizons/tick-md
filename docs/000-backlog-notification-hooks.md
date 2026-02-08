# 000-BACKLOG: Notification Hooks (tick notify)

**Status:** Backlog
**Priority:** Medium
**Effort:** Medium
**Tags:** `cli`, `openclaw`, `notifications`, `gateway`

## Summary

Add `tick notify` command that sends messages to humans (or agents) through OpenClaw Gateway channels — Telegram, WhatsApp, Discord, email. This closes the loop: agents can escalate, report, and request input without the human checking the dashboard.

## Motivation

In a multi-agent squad, the orchestrator needs to:
- Send Telegram/WhatsApp messages when decisions are needed
- Send email if primary channel goes unanswered
- Generate daily digest summaries
- Remind humans about forgotten replies

Currently tick-md is pull-only — humans have to check the dashboard. Notification hooks make it push-capable.

## Proposed Design

### CLI Commands

```bash
# Notify human via their preferred channel
tick notify @gianni "TASK-050 deliverable ready for review" --channel telegram

# Notify with urgency (affects delivery — tries multiple channels)
tick notify @gianni "Production deploy blocked, need approval" --urgent

# Notify agent (triggers via Gateway RPC)
tick notify @vision "New task assigned: TASK-060" --channel gateway-rpc

# Send digest
tick digest @gianni --period 24h
```

### MCP Tool

```javascript
await tick_notify({
  recipient: "@gianni",
  message: "TASK-050 deliverable ready for review",
  channel: "telegram",
  urgent: false,
  taskRef: "TASK-050"  // optional, for deep-linking
})
```

### Notification Configuration

In TICK.md frontmatter or `.tick/config.yaml`:

```yaml
notifications:
  gateway_url: "ws://127.0.0.1:18789"  # OpenClaw Gateway
  
  recipients:
    "@gianni":
      channels:
        - type: telegram
          chat_id: "123456789"
          priority: 1
        - type: email
          address: "gianni@example.com"
          priority: 2  # fallback
      preferences:
        urgent_escalation: true      # try all channels for urgent
        digest: "daily"              # daily/weekly/none
        digest_time: "09:00"         # when to send digest
        quiet_hours: "22:00-08:00"   # no notifications (except urgent)
    
    "@vision":
      channels:
        - type: gateway-rpc
          agent_name: "vision"
```

### Notification Types

| Type | Trigger | Example |
|------|---------|---------|
| **mention** | Agent mentions @human in comment | "Researcher needs session cookie" |
| **deliverable** | Task deliverable attached | "TASK-050 audit complete" |
| **blocked** | Task blocked, needs human input | "Cloudflare blocking agent" |
| **stale** | No task update in 48h+ | "TASK-055 hasn't been updated" |
| **digest** | Scheduled summary | "Daily: 5 done, 3 in progress, 2 blocked" |
| **approval** | Deliverable needs human sign-off | "Review: Homepage redesign spec" |

### OpenClaw Gateway Integration

```
tick notify @gianni "message"
  │
  ├── Reads notification config for @gianni
  ├── Selects channel (telegram, priority 1)
  │
  ▼
OpenClaw Gateway RPC
  POST ws://127.0.0.1:18789/rpc
  {
    "method": "message.send",
    "params": {
      "channel": "telegram",
      "chat_id": "123456789",
      "text": "🔔 tick-md: TASK-050 deliverable ready for review\n\nDashboard: http://localhost:3000/dashboard/task/TASK-050"
    }
  }
```

### Digest Format

```markdown
📊 Daily Digest — Feb 8, 2026

**Completed (5)**
- TASK-048: Homepage keyword research (@vision) ✅
- TASK-049: Competitor analysis (@shuri) ✅
- TASK-050: Homepage audit (@shuri) ✅
- TASK-051: Blog post draft (@content-bot) ✅
- TASK-052: Email sequence v1 (@content-bot) ✅

**In Progress (3)**
- TASK-053: Homepage design spec (@wanda) — 60% done
- TASK-055: SEO backlink analysis (@vision) — started
- TASK-056: Onboarding flow redesign (@shuri) — researching

**Blocked (2)**
- TASK-054: Deploy homepage changes (@friday) — waiting on TASK-053
- TASK-057: Analytics integration (@friday) — needs API key from you

**Squad Insights**
- @vision: "ai chatbot" searches up 40% this month
- @shuri: Found 20 unused testimonials in CMS

**Action needed:** Reply to TASK-057 with analytics API key.
```

### Escalation Chain

```
1. Primary channel (Telegram) — immediate
   ↓ no response in 1h + urgent flag
2. Secondary channel (Email) — with full context
   ↓ no response in 24h
3. Orchestrator reminder in next check-in — "Still waiting on @gianni for TASK-057"
```

## Implementation Phases

### Phase 1: Basic `tick notify` (CLI → stdout)
- Command exists, formats message, prints to stdout
- No Gateway integration yet — can pipe to other tools

### Phase 2: Gateway RPC Integration
- Connect to OpenClaw Gateway WebSocket
- Send to configured channels (Telegram, Discord, etc.)

### Phase 3: Digest + Escalation
- Scheduled digest generation
- Multi-channel escalation
- Quiet hours respect

## Open Questions

- Should notifications be stored in TICK.md or a separate log?
- Rate limiting? (Prevent notification storms from chatty agents)
- Should humans be able to reply to notifications inline (Telegram → tick-md)?
- How to handle Gateway being offline? Queue and retry?

## Related

- Requires: OpenClaw Gateway running
- Complements: Orchestrator role (orchestrator is the primary notifier)
- Enhances: Agent polling skill (agents notify when they find blockers)
- Depends on: Broadcast command (digests pull from squad log)
