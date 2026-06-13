import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApi";
import { connectDb, hasMongoUri } from "@/lib/db";
import { AssetModel } from "@/models/Asset";
import { errorResponse } from "@/lib/apiError";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = ["channel-icon", "banner", "other"] as const;

function normalizeAssetInput(input: Record<string, unknown>) {
  const title = String(input.title || "").trim();
  const url = String(input.url || "").trim();
  if (!title) throw new Error("Image title is required");
  if (!url) throw new Error("Image URL is required");

  return {
    title,
    url,
    type: TYPES.includes(input.type as typeof TYPES[number]) ? input.type : "channel-icon",
    alt: String(input.alt || "").trim(),
  };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  if (!hasMongoUri()) return NextResponse.json({ assets: [] });

  try {
    await connectDb();
    const assets = await AssetModel.find({}).sort({ createdAt: -1 }).limit(1000).lean();
    return NextResponse.json({
      assets: assets.map((asset) => ({ ...asset, id: asset._id.toString(), _id: undefined })),
    });
  } catch (error) {
    return errorResponse(error, "Unable to load images from MongoDB");
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  if (!hasMongoUri()) {
    return NextResponse.json({ error: "MONGODB_URI is required to save images" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  let input;
  try {
    input = normalizeAssetInput(body);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid image data" },
      { status: 400 }
    );
  }

  try {
    await connectDb();
    const created = await AssetModel.create(input);
    return NextResponse.json({ asset: { ...input, id: created._id.toString() } }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Unable to save image to MongoDB");
  }
}
