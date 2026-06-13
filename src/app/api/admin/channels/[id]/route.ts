import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApi";
import { normalizeChannelInput } from "@/lib/channelService";
import { connectDb, hasMongoUri } from "@/lib/db";
import { ChannelModel } from "@/models/Channel";
import { errorResponse } from "@/lib/apiError";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  if (!hasMongoUri()) {
    return NextResponse.json({ error: "MONGODB_URI is required to update channels" }, { status: 503 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  let input;
  try {
    input = normalizeChannelInput(body);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid channel data" },
      { status: 400 }
    );
  }

  try {
    await connectDb();
    const updated = await ChannelModel.findByIdAndUpdate(id, input, { new: true }).lean();
    if (!updated) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Unable to update channel in MongoDB");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  if (!hasMongoUri()) {
    return NextResponse.json({ error: "MONGODB_URI is required to delete channels" }, { status: 503 });
  }

  const { id } = await params;
  try {
    await connectDb();
    const deleted = await ChannelModel.findByIdAndDelete(id).lean();
    if (!deleted) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Unable to delete channel from MongoDB");
  }
}
