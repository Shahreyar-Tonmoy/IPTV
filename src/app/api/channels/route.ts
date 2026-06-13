import { NextResponse } from "next/server";
import { getPublicChannels } from "@/lib/channelService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const channels = await getPublicChannels();

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
