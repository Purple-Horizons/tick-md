import { NextResponse } from "next/server";
import { readTickFile, findTickFile } from "@/lib/tick-reader";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tickPath = findTickFile();
    if (!tickPath) {
      return NextResponse.json(
        { error: "TICK.md not found. Run 'tick init' to create a project." },
        { status: 404 }
      );
    }

    const tickFile = readTickFile(tickPath);

    // Compute summary stats
    const tasksByStatus: Record<string, number> = {};
    for (const task of tickFile.tasks) {
      tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
    }

    const done = tickFile.tasks.filter((t) => t.status === "done").length;
    const total = tickFile.tasks.length;

    return NextResponse.json({
      meta: tickFile.meta,
      agents: tickFile.agents,
      tasks: tickFile.tasks,
      summary: {
        total,
        done,
        percentage: total > 0 ? Math.round((done / total) * 100) : 0,
        by_status: tasksByStatus,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
