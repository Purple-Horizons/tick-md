---
project: tick-md
title: Tick.md - Multi-Agent Coordination Protocol
schema_version: "1.0"
created: Sun Feb 01 2026 09:00:00 GMT-0500 (Eastern Standard Time)
updated: 2026-02-09T20:27:04.180Z
default_workflow: [backlog, todo, in_progress, review, done]
id_prefix: TASK
next_id: 37
---

## Agents

| Agent | Type | Role | Status | Working On | Last Active | Trust Level |
|-------|------|------|--------|------------|-------------|-------------|
| @gianni | human | owner | working | TASK-003 | 2026-02-07T14:28:00 | owner |
| @ralph | human | owner | offline | - | 2026-02-06T18:00:00 | owner |
| @claude-code | bot | engineer | idle | - | 2026-02-09T19:50:36.194Z | trusted |
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

### TASK-023 · Build native ClawHub plugin (kind: plugin)

```yaml
id: TASK-023
status: backlog
priority: medium
assigned_to: null
claimed_by: null
created_by: "@gianni"
created_at: 2026-02-08T04:10:00.000Z
updated_at: 2026-02-08T04:10:00.000Z
tags:
  - clawhub
  - plugin
  - enhancement
history:
  - ts: 2026-02-08T04:10:00.000Z
    who: "@gianni"
    action: created
```

> Create a native ClawHub plugin that registers tick tools directly instead of requiring separate npm install of tick-mcp-server. This would make it cleaner for OpenClaw bots - they'd get the tools built-in rather than needing external dependencies. Currently we're `kind: skill` (bot follows instructions to install), but a `kind: plugin` would provide the tools natively.

### TASK-024 · Build tick reopen command

```yaml
id: TASK-024
status: done
priority: high
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-09T19:50:21.724Z
updated_at: 2026-02-09T19:50:33.316Z
tags:
  - cli
  - undo
history:
  - ts: 2026-02-09T19:50:21.724Z
    who: "@gianni-d'alerta"
    action: created
  - ts: 2026-02-09T19:50:33.316Z
    who: "@claude-code"
    action: completed
    from: backlog
    to: done
```

### TASK-025 · Build tick delete command

```yaml
id: TASK-025
status: done
priority: high
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-09T19:50:22.215Z
updated_at: 2026-02-09T19:50:33.748Z
tags:
  - cli
  - task-management
history:
  - ts: 2026-02-09T19:50:22.215Z
    who: "@gianni-d'alerta"
    action: created
  - ts: 2026-02-09T19:50:33.748Z
    who: "@claude-code"
    action: completed
    from: backlog
    to: done
```

### TASK-026 · Build tick edit command

```yaml
id: TASK-026
status: done
priority: high
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-09T19:50:22.650Z
updated_at: 2026-02-09T19:50:34.168Z
tags:
  - cli
  - task-management
history:
  - ts: 2026-02-09T19:50:22.650Z
    who: "@gianni-d'alerta"
    action: created
  - ts: 2026-02-09T19:50:34.168Z
    who: "@claude-code"
    action: completed
    from: backlog
    to: done
```

### TASK-027 · Build tick undo command

```yaml
id: TASK-027
status: done
priority: high
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-09T19:50:23.088Z
updated_at: 2026-02-09T19:50:34.595Z
tags:
  - cli
  - git
history:
  - ts: 2026-02-09T19:50:23.088Z
    who: "@gianni-d'alerta"
    action: created
  - ts: 2026-02-09T19:50:34.595Z
    who: "@claude-code"
    action: completed
    from: backlog
    to: done
```

### TASK-028 · Build tick import command for bulk operations

```yaml
id: TASK-028
status: done
priority: medium
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-09T19:50:23.515Z
updated_at: 2026-02-09T19:50:35.045Z
tags:
  - cli
  - bulk
history:
  - ts: 2026-02-09T19:50:23.515Z
    who: "@gianni-d'alerta"
    action: created
  - ts: 2026-02-09T19:50:35.045Z
    who: "@claude-code"
    action: completed
    from: backlog
    to: done
```

### TASK-029 · Build tick batch mode

```yaml
id: TASK-029
status: done
priority: medium
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-09T19:50:23.881Z
updated_at: 2026-02-09T19:50:35.445Z
tags:
  - cli
  - git
history:
  - ts: 2026-02-09T19:50:23.881Z
    who: "@gianni-d'alerta"
    action: created
  - ts: 2026-02-09T19:50:35.445Z
    who: "@claude-code"
    action: completed
    from: backlog
    to: done
```

### TASK-030 · Add workflow warning to tick done

```yaml
id: TASK-030
status: done
priority: low
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-09T19:50:24.247Z
updated_at: 2026-02-09T19:50:35.818Z
tags:
  - cli
  - ux
history:
  - ts: 2026-02-09T19:50:24.247Z
    who: "@gianni-d'alerta"
    action: created
  - ts: 2026-02-09T19:50:35.818Z
    who: "@claude-code"
    action: completed
    from: backlog
    to: done
```

### TASK-031 · Add GitHub Actions workflow for npm publishing

```yaml
id: TASK-031
status: done
priority: medium
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-09T19:50:24.617Z
updated_at: 2026-02-09T19:50:36.194Z
tags:
  - ci
  - npm
history:
  - ts: 2026-02-09T19:50:24.617Z
    who: "@gianni-d'alerta"
    action: created
  - ts: 2026-02-09T19:50:36.194Z
    who: "@claude-code"
    action: completed
    from: backlog
    to: done
```

### TASK-032 · Build orchestrator role & skill

```yaml
id: TASK-032
status: backlog
priority: urgent
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-09T20:26:54.123Z
updated_at: 2026-02-09T20:26:54.123Z
tags:
  - orchestrator
  - skill
  - multi-agent
history:
  - ts: 2026-02-09T20:26:54.123Z
    who: "@gianni-d'alerta"
    action: created
```

### TASK-033 · Build agent polling skill (check-in loop)

```yaml
id: TASK-033
status: backlog
priority: high
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-09T20:26:56.691Z
updated_at: 2026-02-09T20:26:56.691Z
tags:
  - skill
  - polling
  - multi-agent
history:
  - ts: 2026-02-09T20:26:56.691Z
    who: "@gianni-d'alerta"
    action: created
```

### TASK-034 · Add deliverables field to task schema

```yaml
id: TASK-034
status: backlog
priority: high
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-09T20:26:59.200Z
updated_at: 2026-02-09T20:26:59.200Z
tags:
  - parser
  - cli
  - protocol
history:
  - ts: 2026-02-09T20:26:59.200Z
    who: "@gianni-d'alerta"
    action: created
```

### TASK-035 · Build tick broadcast command & squad log

```yaml
id: TASK-035
status: backlog
priority: medium
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-09T20:27:01.671Z
updated_at: 2026-02-09T20:27:01.671Z
tags:
  - cli
  - protocol
  - communication
history:
  - ts: 2026-02-09T20:27:01.671Z
    who: "@gianni-d'alerta"
    action: created
```

### TASK-036 · Build tick notify command (notification hooks)

```yaml
id: TASK-036
status: backlog
priority: medium
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-09T20:27:04.180Z
updated_at: 2026-02-09T20:27:04.180Z
tags:
  - cli
  - notifications
  - gateway
history:
  - ts: 2026-02-09T20:27:04.180Z
    who: "@gianni-d'alerta"
    action: created
```
