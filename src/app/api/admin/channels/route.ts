import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApi";
import { getAdminChannels, normalizeChannelInput } from "@/lib/channelService";
import { connectDb, hasMongoUri } from "@/lib/db";
import { ChannelModel } from "@/models/Channel";
import { errorResponse } from "@/lib/apiError";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    return NextResponse.json({ channels: await getAdminChannels() });
  } catch (error) {
    return errorResponse(error, "Unable to load channels from MongoDB");
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  if (!hasMongoUri()) {
    return NextResponse.json({ error: "MONGODB_URI is required to save channels" }, { status: 503 });
  }

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
    const created = await ChannelModel.create(input);
    return NextResponse.json({ channel: { ...input, id: created._id.toString() } }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Unable to save channel to MongoDB");
  }
}
