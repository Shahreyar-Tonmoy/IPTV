import { CHANNELS, Channel } from "@/lib/channels";
import { connectDb, hasMongoUri } from "@/lib/db";
import { ChannelModel, ChannelDocument } from "@/models/Channel";

const CATEGORIES = ["main", "highlights", "analysis", "local"] as const;
const QUALITIES = ["4K", "FHD", "HD", "SD"] as const;

function toPublicChannel(channel: ChannelDocument): Channel & { imageUrl?: string; sortOrder?: number } {
  const id = channel._id.toString();
  return {
    id,
    name: channel.name,
    streamUrl: `/api/stream?channelId=${id}`,
    backupUrls: (channel.backupUrls || []).map((_, index) => `/api/stream?channelId=${id}&backup=${index}`),
    logo: channel.logo,
    imageUrl: channel.imageUrl,
    category: channel.category,
    language: channel.language,
    quality: channel.quality,
    viewers: channel.viewers,
    isLive: channel.isLive,
    currentMatch: channel.currentMatch || undefined,
    region: channel.region,
    sortOrder: channel.sortOrder,
  };
}

function toAdminChannel(channel: ChannelDocument): Channel & { imageUrl?: string; sortOrder?: number } {
  return {
    ...toPublicChannel(channel),
    streamUrl: channel.streamUrl,
    backupUrls: channel.backupUrls || [],
  };
}

export async function getPublicChannels() {
  if (!hasMongoUri()) return CHANNELS;

  await connectDb();
  const channels = await ChannelModel.find({ isLive: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(1000)
    .lean<ChannelDocument[]>();

  return channels.map(toPublicChannel);
}

export async function getAdminChannels() {
  if (!hasMongoUri()) return CHANNELS;

  await connectDb();
  const channels = await ChannelModel.find({})
    .sort({ sortOrder: 1, createdAt: -1 })
    .limit(5000)
    .lean<ChannelDocument[]>();

  return channels.map(toAdminChannel);
}

export function normalizeChannelInput(input: Record<string, unknown>) {
  const name = String(input.name || "").trim();
  const streamUrl = String(input.streamUrl || "").trim();
  if (!name) throw new Error("Channel name is required");
  if (!streamUrl) throw new Error("Stream URL is required");

  const category = CATEGORIES.includes(input.category as typeof CATEGORIES[number])
    ? input.category
    : "main";
  const quality = QUALITIES.includes(input.quality as typeof QUALITIES[number])
    ? input.quality
    : "HD";

  return {
    name,
    streamUrl,
    backupUrls: String(input.backupUrls || "")
      .split(/\r?\n|,/)
      .map((url) => url.trim())
      .filter(Boolean),
    logo: String(input.logo || "TV").trim(),
    imageUrl: String(input.imageUrl || "").trim(),
    category,
    language: String(input.language || "EN").trim().toUpperCase(),
    quality,
    viewers: Math.max(0, Number(input.viewers || 0)),
    isLive:
      typeof input.isLive === "boolean"
        ? input.isLive
        : String(input.isLive ?? "true") !== "false",
    currentMatch: String(input.currentMatch || "").trim(),
    region: String(input.region || "Global").trim(),
    sortOrder: Number(input.sortOrder || 0),
  };
}
