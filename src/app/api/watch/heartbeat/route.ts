import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/apiError";
import { recordViewerHeartbeat } from "@/lib/viewerPresence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const channelId = String(body.channelId || "").trim();
  const sessionId = String(body.sessionId || "").trim();

  if (!channelId) {
    return NextResponse.json({ error: "channelId is required" }, { status: 400 });
  }
  if (!sessionId || sessionId.length < 12) {
    return NextResponse.json({ error: "valid sessionId is required" }, { status: 400 });
  }

  try {
    const result = await recordViewerHeartbeat({
      channelId,
      sessionId,
      userAgent: req.headers.get("user-agent") || "",
    });

    return NextResponse.json(
      { ok: true, expiresAt: result.expiresAt.toISOString() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return errorResponse(error, "Unable to record viewer heartbeat");
  }
}
