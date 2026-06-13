import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApi";
import { connectDb, hasMongoUri } from "@/lib/db";
import { AssetModel } from "@/models/Asset";
import { errorResponse } from "@/lib/apiError";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  if (!hasMongoUri()) {
    return NextResponse.json({ error: "MONGODB_URI is required to delete images" }, { status: 503 });
  }

  const { id } = await params;
  try {
    await connectDb();
    const deleted = await AssetModel.findByIdAndDelete(id).lean();
    if (!deleted) return NextResponse.json({ error: "Image not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Unable to delete image from MongoDB");
  }
}
