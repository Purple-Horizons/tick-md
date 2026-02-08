---
project: tick-md
title: Tick.md - Multi-Agent Coordination Protocol
schema_version: "1.0"
created: Sun Feb 01 2026 09:00:00 GMT-0500 (Eastern Standard Time)
updated: 2026-02-08T01:14:38.477Z
default_workflow: [backlog, todo, in_progress, review, done]
id_prefix: TASK
next_id: 23
---

## Agents

| Agent | Type | Role | Status | Working On | Last Active | Trust Level |
|-------|------|------|--------|------------|-------------|-------------|
| @gianni | human | owner | working | TASK-003 | 2026-02-07T14:28:00 | owner |
| @ralph | human | owner | offline | - | 2026-02-06T18:00:00 | owner |
| @claude-code | bot | engineer | idle | - | 2026-02-08T01:14:38.477Z | trusted |
| @content-bot | bot | copywriter | working | TASK-012 | 2026-02-07T14:32:00 | trusted |
| @qa-bot | bot | tester | idle | - | 2026-02-07T14:15:00 | trusted |
| test-bot | bot | backend, api | idle | - | 2026-02-08T01:14:03.522Z | trusted |

---

## Tasks

### TASK-020 · Build tick validate command

```yaml
id: TASK-020
status: done
priority: high
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-08T01:14:22.398Z
updated_at: 2026-02-08T01:14:28.374Z
tags:
  - cli
  - validation
history:
  - ts: 2026-02-08T01:14:22.398Z
    who: "@gianni-d'alerta"
    action: created
  - ts: 2026-02-08T01:14:28.374Z
    who: "@claude-code"
    action: completed
    from: backlog
    to: done
```

### TASK-021 · Build tick agent register command

```yaml
id: TASK-021
status: done
priority: high
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-08T01:14:33.487Z
updated_at: 2026-02-08T01:14:33.584Z
tags:
  - cli
  - agents
history:
  - ts: 2026-02-08T01:14:33.487Z
    who: "@gianni-d'alerta"
    action: created
  - ts: 2026-02-08T01:14:33.584Z
    who: "@claude-code"
    action: completed
    from: backlog
    to: done
```

### TASK-022 · Build tick agent list command

```yaml
id: TASK-022
status: done
priority: high
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-08T01:14:38.385Z
updated_at: 2026-02-08T01:14:38.477Z
tags:
  - cli
  - agents
history:
  - ts: 2026-02-08T01:14:38.385Z
    who: "@gianni-d'alerta"
    action: created
  - ts: 2026-02-08T01:14:38.477Z
    who: "@claude-code"
    action: completed
    from: backlog
    to: done
```
