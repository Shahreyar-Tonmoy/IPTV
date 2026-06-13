import { NextResponse } from "next/server";
import { getPublicChannels } from "@/lib/channelService";
import { getLiveViewerCounts } from "@/lib/viewerPresence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sourceChannels = await getPublicChannels();
    const liveCounts = await getLiveViewerCounts(sourceChannels.map((channel) => channel.id));
    const channels = sourceChannels.map((channel) => {
      const liveViewers = liveCounts.get(channel.id) || 0;
      const baseViewers = channel.viewers;
      return {
        ...channel,
        baseViewers,
        liveViewers,
        viewers: baseViewers + liveViewers,
      };
    });

    return NextResponse.json(
      { channels, updatedAt: Date.now() },
      {
        headers: {
          "Cache-Control": "no-store",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load channels";
    return NextResponse.json(
      {
        error: "Unable to load channels from MongoDB",
        detail: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }
}
