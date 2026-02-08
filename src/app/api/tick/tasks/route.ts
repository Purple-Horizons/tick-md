import { NextRequest, NextResponse } from "next/server";
import { readTickFile, findTickFile } from "@/lib/tick-reader";
import { updateTaskStatus, claimTask, releaseTask } from "@/lib/tick-writer";

export const dynamic = "force-dynamic";

/** GET /api/tick/tasks - list all tasks */
export async function GET() {
  try {
    const tickPath = findTickFile();
    if (!tickPath) {
      return NextResponse.json({ error: "TICK.md not found." }, { status: 404 });
    }
    const tickFile = readTickFile(tickPath);
    return NextResponse.json({ tasks: tickFile.tasks, workflow: tickFile.meta.default_workflow });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** PATCH /api/tick/tasks - update task status (kanban drag) */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, status, agent } = body;

    if (!taskId || !status) {
      return NextResponse.json({ error: "taskId and status required" }, { status: 400 });
    }

    const tickFile = updateTaskStatus(taskId, status, agent || "@dashboard");
    const task = tickFile.tasks.find((t) => t.id === taskId);
    return NextResponse.json({ task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
