import { NextRequest, NextResponse } from "next/server";
import { claimTask, releaseTask } from "@/lib/tick-writer";
import { enforceMutationPolicy } from "@/app/api/_lib/runtime-guard";

export const dynamic = "force-dynamic";

/** POST /api/tick/claim - claim or release a task */
export async function POST(req: NextRequest) {
  try {
    const guard = enforceMutationPolicy(req);
    if (guard) return guard;

    const body = await req.json();
    const { taskId, agent, action } = body;

    if (!taskId || !agent) {
      return NextResponse.json({ error: "taskId and agent required" }, { status: 400 });
    }

    let tickFile;
    if (action === "release") {
      tickFile = releaseTask(taskId, agent);
    } else {
      tickFile = claimTask(taskId, agent);
    }

    const task = tickFile.tasks.find((t) => t.id === taskId);
    return NextResponse.json({ task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
