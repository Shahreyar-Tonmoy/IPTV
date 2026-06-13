import { connectDb, hasMongoUri } from "@/lib/db";
import { ViewerSessionModel } from "@/models/ViewerSession";

const VIEWER_TTL_MS = 35_000;

type MemoryViewer = {
  channelId: string;
  expiresAt: number;
};

const globalWithPresence = globalThis as typeof globalThis & {
  viewerPresence?: Map<string, MemoryViewer>;
};

const memoryPresence =
  globalWithPresence.viewerPresence || (globalWithPresence.viewerPresence = new Map());

function cleanupMemoryPresence(now = Date.now()) {
  for (const [sessionId, viewer] of memoryPresence.entries()) {
    if (viewer.expiresAt <= now) memoryPresence.delete(sessionId);
  }
}

export async function recordViewerHeartbeat({
  channelId,
  sessionId,
  userAgent,
}: {
  channelId: string;
  sessionId: string;
  userAgent?: string;
}) {
  const expiresAt = new Date(Date.now() + VIEWER_TTL_MS);

  if (!hasMongoUri()) {
    cleanupMemoryPresence();
    memoryPresence.set(sessionId, { channelId, expiresAt: expiresAt.getTime() });
    return { expiresAt };
  }

  await connectDb();
  await ViewerSessionModel.updateOne(
    { sessionId },
    {
      $set: {
        channelId,
        sessionId,
        userAgent: userAgent?.slice(0, 240) || "",
        expiresAt,
      },
    },
    { upsert: true }
  );

  return { expiresAt };
}

export async function getLiveViewerCounts(channelIds: string[]) {
  const counts = new Map<string, number>();
  if (!channelIds.length) return counts;

  if (!hasMongoUri()) {
    const now = Date.now();
    cleanupMemoryPresence(now);
    for (const viewer of memoryPresence.values()) {
      if (channelIds.includes(viewer.channelId) && viewer.expiresAt > now) {
        counts.set(viewer.channelId, (counts.get(viewer.channelId) || 0) + 1);
      }
    }
    return counts;
  }

  await connectDb();
  const rows = await ViewerSessionModel.aggregate<{ _id: string; count: number }>([
    {
      $match: {
        channelId: { $in: channelIds },
        expiresAt: { $gt: new Date() },
      },
    },
    { $group: { _id: "$channelId", count: { $sum: 1 } } },
  ]);

  for (const row of rows) counts.set(row._id, row.count);
  return counts;
}
