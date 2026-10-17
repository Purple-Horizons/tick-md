import fs from "fs/promises";
import path from "path";
import { parseTickFile } from "../parser/index.js";
import type { Task, TaskStatus, TickFile } from "../types.js";
import { tickFileNotFoundError } from "../utils/errors.js";

export interface DigestOptions {
  /** Tasks not updated in this many hours are flagged stale. */
  staleHours?: number;
  /** Include tasks completed within this many hours. */
  doneSinceHours?: number;
  /** Only tasks owned (claimed or assigned) by this agent. */
  owner?: string;
  json?: boolean;
}

export interface DigestItem {
  id: string;
  title: string;
  status: TaskStatus;
  priority: Task["priority"];
  owner: string | null;
  waiting_on: string | null;
  updated_at: string;
  age_hours: number;
  stale: boolean;
  last_note: string | null;
}

export interface Digest {
  project: string;
  generated_at: string;
  stale_hours: number;
  done_since_hours: number;
  counts: Record<string, number>;
  sections: {
    blocked: DigestItem[];
    working: DigestItem[];
    review: DigestItem[];
    todo: DigestItem[];
    done: DigestItem[];
  };
  stale: DigestItem[];
}

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

function ownerOf(task: Task): string | null {
  return task.claimed_by || task.assigned_to || null;
}

function lastNote(task: Task): string | null {
  for (let i = task.history.length - 1; i >= 0; i--) {
    if (task.history[i].note) return task.history[i].note!;
  }
  return null;
}

function completedAt(task: Task): string {
  for (let i = task.history.length - 1; i >= 0; i--) {
    if (task.history[i].to === "done" || task.history[i].action === "completed") {
      return task.history[i].ts;
    }
  }
  return task.updated_at;
}

/**
 * Build a board digest: tasks grouped by status with owner, waiting_on,
 * age, and stale flags. Pure function so it can be tested and reused.
 */
export function buildDigest(
  tickFile: TickFile,
  options: DigestOptions = {},
  now: Date = new Date()
): Digest {
  const staleHours = options.staleHours ?? 48;
  const doneSinceHours = options.doneSinceHours ?? 24;
  const nowMs = now.getTime();

  let tasks = tickFile.tasks;
  if (options.owner) {
    const o = options.owner.startsWith("@") ? options.owner : `@${options.owner}`;
    tasks = tasks.filter((t) => ownerOf(t) === o);
  }

  const toItem = (t: Task): DigestItem => {
    const updatedMs = Date.parse(t.updated_at);
    const ageHours = Number.isFinite(updatedMs) ? (nowMs - updatedMs) / 3_600_000 : 0;
    return {
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      owner: ownerOf(t),
      waiting_on: t.waiting_on ?? null,
      updated_at: t.updated_at,
      age_hours: Math.round(ageHours * 10) / 10,
      stale: t.status !== "done" && t.status !== "backlog" && ageHours >= staleHours,
      last_note: lastNote(t),
    };
  };

  const sort = (items: DigestItem[]) =>
    items.sort(
      (a, b) =>
        (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9) ||
        b.age_hours - a.age_hours
    );

  const pick = (statuses: TaskStatus[]) =>
    sort(tasks.filter((t) => statuses.includes(t.status)).map(toItem));

  const done = tasks
    .filter((t) => t.status === "done")
    .filter((t) => {
      const ms = Date.parse(completedAt(t));
      return Number.isFinite(ms) && nowMs - ms <= doneSinceHours * 3_600_000;
    })
    .map(toItem);

  const sections = {
    blocked: pick(["blocked"]),
    working: pick(["in_progress"]),
    review: pick(["review"]),
    todo: pick(["todo", "reopened"]),
    done,
  };

  const counts: Record<string, number> = {
    todo: sections.todo.length,
    working: sections.working.length,
    blocked: sections.blocked.length,
    review: sections.review.length,
    done_recent: done.length,
    backlog: tasks.filter((t) => t.status === "backlog").length,
  };

  const stale = sort(
    [...sections.blocked, ...sections.working, ...sections.review, ...sections.todo].filter(
      (i) => i.stale
    )
  );

  return {
    project: tickFile.meta.title || tickFile.meta.project,
    generated_at: now.toISOString(),
    stale_hours: staleHours,
    done_since_hours: doneSinceHours,
    counts,
    sections,
    stale,
  };
}

function fmtAge(hours: number): string {
  if (hours < 1) return `${Math.max(0, Math.round(hours * 60))}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

function line(i: DigestItem, opts: { showWaiting?: boolean } = {}): string {
  const parts = [`- **${i.id}** ${i.title}`, i.owner ?? "unowned"];
  if (opts.showWaiting) parts.push(`waiting on ${i.waiting_on ?? "?"}`);
  parts.push(`${i.priority}`, `updated ${fmtAge(i.age_hours)} ago${i.stale ? " ⚠️" : ""}`);
  let out = parts.join(" — ");
  if (i.last_note) {
    const note = i.last_note.replace(/\s+/g, " ").trim();
    out += `\n  - last: ${note.length > 160 ? note.slice(0, 157) + "…" : note}`;
  }
  return out;
}

/** Render a digest as Markdown (suitable for a morning brief or chat). */
export function renderDigestMarkdown(d: Digest): string {
  const out: string[] = [];
  out.push(`# ${d.project} — board digest`);
  out.push("");
  out.push(`_Generated ${d.generated_at}_`);
  out.push("");
  out.push(
    `Todo ${d.counts.todo} · Working ${d.counts.working} · Blocked ${d.counts.blocked} · ` +
      `Ready for review ${d.counts.review} · Done (last ${d.done_since_hours}h) ${d.counts.done_recent}`
  );

  const section = (title: string, items: DigestItem[], showWaiting = false) => {
    out.push("");
    out.push(`## ${title} (${items.length})`);
    out.push("");
    if (items.length === 0) out.push("_none_");
    for (const i of items) out.push(line(i, { showWaiting }));
  };

  section("⏸ Blocked", d.sections.blocked, true);
  section("👀 Ready for review", d.sections.review);
  section("🔨 Working", d.sections.working);
  section("📋 Todo", d.sections.todo);
  section(`✅ Done (last ${d.done_since_hours}h)`, d.sections.done);
  if (d.stale.length > 0) {
    out.push("");
    out.push(`## ⚠️ Stale — no update in ${d.stale_hours}h+ (${d.stale.length})`);
    out.push("");
    for (const i of d.stale) {
      out.push(`- **${i.id}** ${i.title} — ${i.owner ?? "unowned"} — ${i.status} — ${fmtAge(i.age_hours)}`);
    }
  }
  out.push("");
  return out.join("\n");
}

export async function digestCommand(options: DigestOptions = {}): Promise<void> {
  const tickPath = path.join(process.cwd(), "TICK.md");
  let content: string;
  try {
    content = await fs.readFile(tickPath, "utf-8");
  } catch {
    throw tickFileNotFoundError();
  }
  const digest = buildDigest(parseTickFile(content), options);
  if (options.json) {
    console.log(JSON.stringify(digest, null, 2));
  } else {
    process.stdout.write(renderDigestMarkdown(digest));
  }
}
