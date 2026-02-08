# 000-BACKLOG: Deliverables Field

**Status:** Backlog
**Priority:** High
**Effort:** Small
**Tags:** `parser`, `cli`, `protocol`

## Summary

Add a `deliverables:` field to task blocks in TICK.md so every task can attach concrete outputs — files, documents, links, or inline markdown. Borrowed from Bhanu/SiteGPT's pattern: a task isn't done until there's a deliverable.

## Motivation

Right now tasks go from `in_progress` → `done` with only comments as evidence. There's no structured way to attach the *output* of work. An agent that researches your homepage can't formally hand off a spec doc to the developer agent — it just writes a comment.

Deliverables make the handoff explicit:
- Orchestrator can verify: "Is there actually something attached?"
- Downstream agents can consume: "Read the deliverable from TASK-050"
- Humans can review: Dashboard shows deliverables inline on each card

## Proposed Design

### TICK.md Schema Addition

```yaml
id: TASK-050
title: Homepage improvement research
status: done
priority: high
claimed_by: @shuri
deliverables:
  - type: document
    path: deliverables/TASK-050-homepage-audit.md
    title: "Homepage Audit & Recommendations"
    added_by: @shuri
    added_at: 2026-02-08T14:00:00Z
  - type: link
    url: https://docs.google.com/spreadsheets/d/...
    title: "Keyword Analysis Spreadsheet"
    added_by: @vision
    added_at: 2026-02-08T15:30:00Z
```

### Deliverable Types

| Type | Fields | Use Case |
|------|--------|----------|
| `document` | `path`, `title` | Markdown files in repo |
| `link` | `url`, `title` | External resources |
| `artifact` | `path`, `title`, `mime` | Images, PDFs, exports |
| `inline` | `content`, `title` | Short text directly in TICK.md |

### CLI Commands

```bash
# Attach a file deliverable
tick deliver TASK-050 --file deliverables/TASK-050-audit.md --title "Homepage Audit"

# Attach a link
tick deliver TASK-050 --url https://example.com/sheet --title "Keyword Data"

# Attach inline content
tick deliver TASK-050 --inline "Recommended H1: 'AI Chatbot for Customer Support'" --title "SEO Rec"

# List deliverables for a task
tick deliverables TASK-050
```

### MCP Tool

```javascript
await tick_deliver({
  taskId: "TASK-050",
  type: "document",
  path: "deliverables/TASK-050-audit.md",
  title: "Homepage Audit & Recommendations",
  agent: "@shuri"
})
```

## Dashboard Integration

- Task cards show deliverable count badge
- Task detail view lists deliverables with type icons
- Document deliverables render inline (markdown preview)
- Link deliverables open in new tab

## Validation Rules

- `tick done` warns if task has zero deliverables (configurable)
- Deliverable `path` must exist in repo (for document/artifact types)
- Each deliverable must have `added_by` agent

## Open Questions

- Should deliverables be required before `tick done`? (Configurable per-project?)
- Store deliverable files in `deliverables/` dir or alongside TICK.md?
- Max inline content length?

## Related

- Enables orchestrator pattern (Jarvis can verify outputs)
- Required for agent polling skill (specialists consume upstream deliverables)
