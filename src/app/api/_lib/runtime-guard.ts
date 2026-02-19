import { NextRequest, NextResponse } from "next/server";

function unauthorized(message: string, status = 401) {
  return NextResponse.json({ error: message }, { status });
}

export function enforceMutationPolicy(req: NextRequest): NextResponse | null {
  if (process.env.TICK_READONLY === "1") {
    return NextResponse.json(
      { error: "Dashboard mutations are disabled (TICK_READONLY=1)." },
      { status: 403 }
    );
  }

  const expectedToken = process.env.TICK_DASHBOARD_TOKEN;
  if (!expectedToken) {
    return null;
  }

  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const explicitHeader = req.headers.get("x-tick-token");
  const provided = explicitHeader || bearer;

  if (!provided) {
    return unauthorized("Missing dashboard mutation token");
  }

  if (provided !== expectedToken) {
    return unauthorized("Invalid dashboard mutation token", 403);
  }

  return null;
}
