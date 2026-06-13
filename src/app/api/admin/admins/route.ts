import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminApi";
import { connectDb, hasMongoUri } from "@/lib/db";
import { errorResponse } from "@/lib/apiError";
import { AdminUserModel } from "@/models/AdminUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  if (!hasMongoUri()) {
    return NextResponse.json({ error: "MONGODB_URI is required to load admins" }, { status: 503 });
  }

  try {
    await connectDb();
    const admins = await AdminUserModel.find({})
      .select("username displayName role isActive lastLoginAt createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      admins: admins.map((admin) => ({
        id: admin._id.toString(),
        username: admin.username,
        displayName: admin.displayName,
        role: admin.role,
        isActive: admin.isActive,
        lastLoginAt: admin.lastLoginAt,
        createdAt: admin.createdAt,
      })),
    });
  } catch (error) {
    return errorResponse(error, "Unable to load admins from MongoDB");
  }
}
