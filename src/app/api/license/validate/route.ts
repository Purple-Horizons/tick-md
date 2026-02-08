import { NextRequest, NextResponse } from "next/server";
import type { LicenseInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/license/validate
 * Validates a license key.
 *
 * In production, this checks against Neon DB.
 * For now, it accepts any key matching the format: TICK-XXXX-XXXX-XXXX
 * and returns a license info object.
 *
 * Body: { key: string }
 * Returns: LicenseInfo
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json({ error: "License key is required" }, { status: 400 });
    }

    // Validate key format: TICK-XXXX-XXXX-XXXX
    const keyPattern = /^TICK-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    if (!keyPattern.test(key)) {
      return NextResponse.json({ error: "Invalid key format. Expected: TICK-XXXX-XXXX-XXXX" }, { status: 400 });
    }

    // TODO: In production, look up the key in Neon DB:
    // const result = await db.query("SELECT * FROM licenses WHERE key = $1 AND status = 'active'", [key]);
    // if (!result.rows.length) return NextResponse.json({ error: "Invalid or expired license key" }, { status: 403 });

    // For now, return a valid lifetime license for any correctly formatted key
    const license: LicenseInfo = {
      key,
      plan: "lifetime",
      status: "active",
      features: {
        customBranding: true,
        unlimitedAgents: true,
        prioritySupport: true,
      },
    };

    return NextResponse.json({ license, valid: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
