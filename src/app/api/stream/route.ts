import { NextRequest, NextResponse } from "next/server";
import { CHANNELS } from "@/lib/channels";
import { connectDb, hasMongoUri } from "@/lib/db";
import { ChannelModel } from "@/models/Channel";
import { errorResponse } from "@/lib/apiError";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getViewerRegion(req: NextRequest): string {
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    "XX";

  const asia = [
    "IN",
    "BD",
    "PK",
    "SG",
    "MY",
    "TH",
    "JP",
    "KR",
    "CN",
    "VN",
    "ID",
    "PH",
  ];
  const europe = [
    "GB",
    "DE",
    "FR",
    "IT",
    "ES",
    "NL",
    "PL",
    "SE",
    "NO",
    "DK",
    "FI",
    "BE",
    "CH",
    "AT",
    "PT",
  ];

  if (asia.includes(country)) return "asia";
  if (europe.includes(country)) return "europe";
  return "global";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId");
  const backupIndex = Number(searchParams.get("backup") ?? -1);

  if (!channelId) {
    return NextResponse.json({ error: "channelId required" }, { status: 400 });
  }

  if (hasMongoUri()) {
    try {
      await connectDb();
      const channel = await ChannelModel.findOne({
        _id: channelId,
        isLive: true,
      })
        .select("streamUrl backupUrls name quality")
        .lean();

      if (!channel) {
        return NextResponse.json(
          { error: "Channel not found or offline" },
          { status: 404 },
        );
      }

      const backupUrl =
        Number.isInteger(backupIndex) && backupIndex >= 0
          ? channel.backupUrls?.[backupIndex]
          : "";

      return NextResponse.json(
        {
          channelId,
          streamUrl: backupUrl || channel.streamUrl,
          backupUrls: (channel.backupUrls || []).map(
            (_: string, index: number) =>
              `/api/stream?channelId=${channelId}&backup=${index}`,
          ),
          region: getViewerRegion(req),
          quality: channel.quality,
          timestamp: Date.now(),
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    } catch (error) {
      return errorResponse(error, "Unable to resolve stream from MongoDB");
    }
  }

  const channel = CHANNELS.find((item) => item.id === channelId && item.isLive);
  if (!channel) {
    return NextResponse.json(
      { error: "Channel not found or offline" },
      { status: 404 },
    );
  }

  const backupUrl =
    Number.isInteger(backupIndex) && backupIndex >= 0
      ? channel.backupUrls?.[backupIndex]
      : "";

  return NextResponse.json(
    {
      channelId,
      streamUrl: backupUrl || channel.streamUrl,
      backupUrls: (channel.backupUrls || []).map(
        (_, index) => `/api/stream?channelId=${channelId}&backup=${index}`,
      ),
      region: getViewerRegion(req),
      quality: channel.quality,
      timestamp: Date.now(),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
