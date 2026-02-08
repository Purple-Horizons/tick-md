import { NextResponse } from "next/server";
import fs from "fs";
import { findTickFile } from "@/lib/tick-reader";

export const dynamic = "force-dynamic";

/** GET /api/tick/watch - SSE stream for TICK.md file changes */
export async function GET() {
  const tickPath = findTickFile();
  if (!tickPath) {
    return NextResponse.json({ error: "TICK.md not found." }, { status: 404 });
  }

  const encoder = new TextEncoder();
  let watcher: fs.FSWatcher | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected", ts: new Date().toISOString() })}\n\n`));

      let debounceTimer: NodeJS.Timeout | null = null;

      watcher = fs.watch(tickPath!, (eventType) => {
        if (eventType === "change") {
          // Debounce rapid file changes
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "change", ts: new Date().toISOString() })}\n\n`)
              );
            } catch {
              // Stream closed
              watcher?.close();
            }
          }, 200);
        }
      });

      // Heartbeat every 30s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "heartbeat" })}\n\n`));
        } catch {
          clearInterval(heartbeat);
          watcher?.close();
        }
      }, 30000);
    },
    cancel() {
      watcher?.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
