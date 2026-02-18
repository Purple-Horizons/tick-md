---
project: tick-md
title: Tick.md - Multi-Agent Coordination Protocol
schema_version: "1.0"
created: Sun Feb 01 2026 09:00:00 GMT-0500 (Eastern Standard Time)
updated: 2026-02-18T03:30:56.777Z
default_workflow: [backlog, todo, in_progress, review, done]
id_prefix: TASK
next_id: 52
---

## Agents

| Agent | Type | Role | Status | Working On | Last Active | Trust Level |
|-------|------|------|--------|------------|-------------|-------------|
| @gianni | human | owner | working | TASK-003 | 2026-02-07T14:28:00 | owner |
| @ralph | human | owner | offline | - | 2026-02-06T18:00:00 | owner |
| @claude-code | bot | engineer | idle | - | 2026-02-18T03:30:56.777Z | trusted |
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
created_by: "@gianni-dalerta"
created_at: 2026-02-08T01:14:22.398Z
updated_at: 2026-02-08T01:14:28.374Z
tags:
  - cli
  - validation
history:
  - ts: 2026-02-08T01:14:22.398Z
    who: "@gianni-dalerta"
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
created_by: "@gianni-dalerta"
created_at: 2026-02-08T01:14:33.487Z
updated_at: 2026-02-08T01:14:33.584Z
tags:
  - cli
  - agents
history:
  - ts: 2026-02-08T01:14:33.487Z
    who: "@gianni-dalerta"
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
created_by: "@gianni-dalerta"
created_at: 2026-02-08T01:14:38.385Z
updated_at: 2026-02-08T01:14:38.477Z
tags:
  - cli
  - agents
history:
  - ts: 2026-02-08T01:14:38.385Z
    who: "@gianni-dalerta"
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
status: done
priority: medium
assigned_to: null
claimed_by: null
created_by: "@gianni"
created_at: 2026-02-08T04:10:00.000Z
updated_at: 2026-02-17T21:56:50.510Z
tags:
  - clawhub
  - plugin
  - enhancement
history:
  - ts: 2026-02-08T04:10:00.000Z
    who: "@gianni"
    action: created
  - ts: 2026-02-17T21:56:50.510Z
    who: "@claude-code"
    action: completed
    from: backlog
    to: done
```

> Create a native ClawHub plugin that registers tick tools directly instead of requiring separate npm install of tick-mcp-server. This would make it cleaner for OpenClaw bots - they'd get the tools built-in rather than needing external dependencies. Currently we're `kind: skill` (bot follows instructions to install), but a `kind: plugin` would provide the tools natively.

### TASK-024 · Build tick reopen command

```yaml
id: TASK-024
status: done
priority: high
assigned_to: null
claimed_by: null
created_by: "@gianni-dalerta"
created_at: 2026-02-09T19:50:21.724Z
updated_at: 2026-02-09T19:50:33.316Z
tags:
  - cli
  - undo
history:
  - ts: 2026-02-09T19:50:21.724Z
    who: "@gianni-dalerta"
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
created_by: "@gianni-dalerta"
created_at: 2026-02-09T19:50:22.215Z
updated_at: 2026-02-09T19:50:33.748Z
tags:
  - cli
  - task-management
history:
  - ts: 2026-02-09T19:50:22.215Z
    who: "@gianni-dalerta"
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
created_by: "@gianni-dalerta"
created_at: 2026-02-09T19:50:22.650Z
updated_at: 2026-02-09T19:50:34.168Z
tags:
  - cli
  - task-management
history:
  - ts: 2026-02-09T19:50:22.650Z
    who: "@gianni-dalerta"
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
created_by: "@gianni-dalerta"
created_at: 2026-02-09T19:50:23.088Z
updated_at: 2026-02-09T19:50:34.595Z
tags:
  - cli
  - git
history:
  - ts: 2026-02-09T19:50:23.088Z
    who: "@gianni-dalerta"
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
created_by: "@gianni-dalerta"
created_at: 2026-02-09T19:50:23.515Z
updated_at: 2026-02-09T19:50:35.045Z
tags:
  - cli
  - bulk
history:
  - ts: 2026-02-09T19:50:23.515Z
    who: "@gianni-dalerta"
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
created_by: "@gianni-dalerta"
created_at: 2026-02-09T19:50:23.881Z
updated_at: 2026-02-09T19:50:35.445Z
tags:
  - cli
  - git
history:
  - ts: 2026-02-09T19:50:23.881Z
    who: "@gianni-dalerta"
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
created_by: "@gianni-dalerta"
created_at: 2026-02-09T19:50:24.247Z
updated_at: 2026-02-09T19:50:35.818Z
tags:
  - cli
  - ux
history:
  - ts: 2026-02-09T19:50:24.247Z
    who: "@gianni-dalerta"
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
created_by: "@gianni-dalerta"
created_at: 2026-02-09T19:50:24.617Z
updated_at: 2026-02-09T19:50:36.194Z
tags:
  - ci
  - npm
history:
  - ts: 2026-02-09T19:50:24.617Z
    who: "@gianni-dalerta"
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
status: done
priority: urgent
assigned_to: null
claimed_by: null
created_by: "@gianni-dalerta"
created_at: 2026-02-09T20:26:54.123Z
updated_at: 2026-02-17T21:53:40.363Z
tags:
  - orchestrator
  - skill
  - multi-agent
history:
  - ts: 2026-02-09T20:26:54.123Z
    who: "@gianni-dalerta"
    action: created
  - ts: 2026-02-17T21:53:40.363Z
    who: "@claude-code"
    action: completed
    from: backlog
    to: done
```

### TASK-033 · Build agent polling skill (check-in loop)

```yaml
id: TASK-033
status: done
priority: high
assigned_to: null
claimed_by: null
created_by: "@gianni-dalerta"
created_at: 2026-02-09T20:26:56.691Z
updated_at: 2026-02-17T21:53:40.657Z
tags:
  - skill
  - polling
  - multi-agent
history:
  - ts: 2026-02-09T20:26:56.691Z
    who: "@gianni-dalerta"
    action: created
  - ts: 2026-02-17T21:53:40.657Z
    who: "@claude-code"
    action: completed
    from: backlog
    to: done
```

### TASK-034 · Add deliverables field to task schema

```yaml
id: TASK-034
status: done
priority: high
assigned_to: null
claimed_by: null
created_by: "@gianni-dalerta"
created_at: 2026-02-09T20:26:59.200Z
updated_at: 2026-02-17T21:56:05.462Z
tags:
  - parser
  - cli
  - protocol
history:
  - ts: 2026-02-09T20:26:59.200Z
    who: "@gianni-dalerta"
    action: created
  - ts: 2026-02-17T21:56:05.462Z
    who: "@claude-code"
    action: completed
    from: backlog
    to: done
```

### TASK-035 · Build tick broadcast command & squad log

```yaml
id: TASK-035
status: done
priority: medium
assigned_to: null
claimed_by: null
created_by: "@gianni-dalerta"
created_at: 2026-02-09T20:27:01.671Z
updated_at: 2026-02-17T21:58:09.003Z
tags:
  - cli
  - protocol
  - communication
history:
  - ts: 2026-02-09T20:27:01.671Z
    who: "@gianni-dalerta"
    action: created
  - ts: 2026-02-17T21:58:09.003Z
    who: "@claude-code"
    action: completed
    from: backlog
    to: done
```

### TASK-036 · Build tick notify command (notification hooks)

```yaml
id: TASK-036
status: done
priority: medium
assigned_to: null
claimed_by: null
created_by: "@gianni-dalerta"
created_at: 2026-02-09T20:27:04.180Z
updated_at: 2026-02-17T22:00:01.634Z
tags:
  - cli
  - notifications
  - gateway
history:
  - ts: 2026-02-09T20:27:04.180Z
    who: "@gianni-dalerta"
    action: created
  - ts: 2026-02-17T22:00:01.634Z
    who: "@claude-code"
    action: completed
    from: backlog
    to: done
```

### TASK-037 · Build tick archive command for completed tasks

```yaml
id: TASK-037
status: done
priority: medium
assigned_to: null
claimed_by: null
created_by: "@gianni-dalerta"
created_at: 2026-02-10T03:14:27.857Z
updated_at: 2026-02-17T22:00:01.771Z
tags:
  - cli
  - cleanup
  - feature-request
history:
  - ts: 2026-02-10T03:14:27.857Z
    who: "@gianni-dalerta"
    action: created
  - ts: 2026-02-17T22:00:01.771Z
    who: "@claude-code"
    action: completed
    from: backlog
    to: done
```

> Currently, TICK.md grows indefinitely as tasks accumulate. Add a `tick archive` command to move completed tasks to an ARCHIVE.md file. Options: `--before <date>` (e.g. `30d`, `2026-01-01`), `--status done` (default), `--dry-run`. Archived tasks remain recoverable via git history and the separate archive file. This keeps the main TICK.md lean for active work.

### TASK-038 · Implement atomic writes with backup system

```yaml
id: TASK-038
status: done
priority: high
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-17T23:16:07.630Z
updated_at: 2026-02-18T03:18:42.671Z
tags:
  - reliability
  - core
history:
  - ts: 2026-02-17T23:16:07.630Z
    who: "@gianni-d'alerta"
    action: created
  - ts: 2026-02-18T03:15:47.223Z
    who: "@claude-code"
    action: claimed
    from: backlog
    to: in_progress
  - ts: 2026-02-18T03:18:42.671Z
    who: "@claude-code"
    action: completed
    from: in_progress
    to: done
```

### TASK-039 · Extend tick undo to restore from backup stack

```yaml
id: TASK-039
status: done
priority: high
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-17T23:16:07.909Z
updated_at: 2026-02-18T03:23:51.945Z
tags:
  - reliability
  - undo
depends_on:
  - TASK-038
history:
  - ts: 2026-02-17T23:16:07.909Z
    who: "@gianni-d'alerta"
    action: created
  - ts: 2026-02-17T23:16:35.006Z
    who: "@claude-code"
    action: edited
    note: "depends_on: [] → [TASK-038]"
  - ts: 2026-02-18T03:22:15.700Z
    who: "@claude-code"
    action: claimed
    from: backlog
    to: in_progress
  - ts: 2026-02-18T03:23:51.945Z
    who: "@claude-code"
    action: completed
    from: in_progress
    to: done
```

### TASK-040 · Add conflict detection for multi-agent scenarios

```yaml
id: TASK-040
status: backlog
priority: high
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-17T23:16:08.183Z
updated_at: 2026-02-17T23:16:08.183Z
tags:
  - reliability
  - multi-agent
history:
  - ts: 2026-02-17T23:16:08.183Z
    who: "@gianni-d'alerta"
    action: created
```

### TASK-041 · Harden parser with graceful degradation

```yaml
id: TASK-041
status: done
priority: high
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-17T23:16:08.458Z
updated_at: 2026-02-18T03:26:58.857Z
tags:
  - reliability
  - parser
history:
  - ts: 2026-02-17T23:16:08.458Z
    who: "@gianni-d'alerta"
    action: created
  - ts: 2026-02-18T03:24:03.138Z
    who: "@claude-code"
    action: claimed
    from: backlog
    to: in_progress
  - ts: 2026-02-18T03:26:58.857Z
    who: "@claude-code"
    action: completed
    from: in_progress
    to: done
```

### TASK-042 · Add contextual error messages with suggestions

```yaml
id: TASK-042
status: done
priority: medium
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-17T23:16:08.732Z
updated_at: 2026-02-18T03:28:35.834Z
tags:
  - ergonomics
  - ux
history:
  - ts: 2026-02-17T23:16:08.732Z
    who: "@gianni-d'alerta"
    action: created
  - ts: 2026-02-18T03:27:10.078Z
    who: "@claude-code"
    action: claimed
    from: backlog
    to: in_progress
  - ts: 2026-02-18T03:28:35.834Z
    who: "@claude-code"
    action: completed
    from: in_progress
    to: done
```

### TASK-043 · Generate shell completion scripts

```yaml
id: TASK-043
status: done
priority: medium
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-17T23:16:14.650Z
updated_at: 2026-02-18T03:30:56.777Z
tags:
  - ergonomics
  - cli
history:
  - ts: 2026-02-17T23:16:14.650Z
    who: "@gianni-d'alerta"
    action: created
  - ts: 2026-02-18T03:29:24.464Z
    who: "@claude-code"
    action: claimed
    from: backlog
    to: in_progress
  - ts: 2026-02-18T03:30:56.777Z
    who: "@claude-code"
    action: completed
    from: in_progress
    to: done
```

### TASK-044 · Add smart defaults for common operations

```yaml
id: TASK-044
status: backlog
priority: medium
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-17T23:16:14.933Z
updated_at: 2026-02-17T23:16:14.933Z
tags:
  - ergonomics
  - ux
history:
  - ts: 2026-02-17T23:16:14.933Z
    who: "@gianni-d'alerta"
    action: created
```

### TASK-045 · Add compact and customizable output formats

```yaml
id: TASK-045
status: backlog
priority: medium
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-17T23:16:15.227Z
updated_at: 2026-02-17T23:16:15.227Z
tags:
  - ergonomics
  - cli
history:
  - ts: 2026-02-17T23:16:15.227Z
    who: "@gianni-d'alerta"
    action: created
```

### TASK-046 · Implement incremental parsing cache

```yaml
id: TASK-046
status: backlog
priority: medium
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-17T23:16:15.516Z
updated_at: 2026-02-17T23:16:15.516Z
tags:
  - performance
  - parser
history:
  - ts: 2026-02-17T23:16:15.516Z
    who: "@gianni-d'alerta"
    action: created
```

### TASK-047 · Add webhook retry queue

```yaml
id: TASK-047
status: backlog
priority: low
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-17T23:16:15.794Z
updated_at: 2026-02-17T23:16:15.794Z
tags:
  - integration
  - notify
history:
  - ts: 2026-02-17T23:16:15.794Z
    who: "@gianni-d'alerta"
    action: created
```

### TASK-048 · Implement GitHub Issues sync

```yaml
id: TASK-048
status: backlog
priority: low
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-17T23:16:20.712Z
updated_at: 2026-02-17T23:16:35.286Z
tags:
  - integration
  - github
  - future
depends_on:
  - TASK-040
  - TASK-041
history:
  - ts: 2026-02-17T23:16:20.712Z
    who: "@gianni-d'alerta"
    action: created
  - ts: 2026-02-17T23:16:35.286Z
    who: "@claude-code"
    action: edited
    note: "depends_on: [] → [TASK-040, TASK-041]"
```

### TASK-049 · Add history compaction command

```yaml
id: TASK-049
status: backlog
priority: low
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-17T23:16:20.995Z
updated_at: 2026-02-17T23:16:20.995Z
tags:
  - performance
  - maintenance
history:
  - ts: 2026-02-17T23:16:20.995Z
    who: "@gianni-d'alerta"
    action: created
```

### TASK-050 · Interactive TUI mode

```yaml
id: TASK-050
status: backlog
priority: low
assigned_to: null
claimed_by: null
created_by: "@gianni-d'alerta"
created_at: 2026-02-17T23:16:21.269Z
updated_at: 2026-02-17T23:16:35.563Z
tags:
  - future
  - tui
depends_on:
  - TASK-043
  - TASK-044
  - TASK-045
history:
  - ts: 2026-02-17T23:16:21.269Z
    who: "@gianni-d'alerta"
    action: created
  - ts: 2026-02-17T23:16:35.563Z
    who: "@claude-code"
    action: edited
    note: "depends_on: [] → [TASK-043, TASK-044, TASK-045]"
```
