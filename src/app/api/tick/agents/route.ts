import { NextResponse } from "next/server";
import { readTickFile, findTickFile } from "@/lib/tick-reader";

export const dynamic = "force-dynamic";

/** GET /api/tick/agents - list all agents */
export async function GET() {
  try {
    const tickPath = findTickFile();
    if (!tickPath) {
      return NextResponse.json({ error: "TICK.md not found." }, { status: 404 });
    }
    const tickFile = readTickFile(tickPath);
    return NextResponse.json({ agents: tickFile.agents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
