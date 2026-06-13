import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectDb, hasMongoUri } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { errorResponse } from "@/lib/apiError";
import { AdminUserModel } from "@/models/AdminUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function adminCount() {
  await connectDb();
  return AdminUserModel.countDocuments({});
}

export async function GET() {
  if (!hasMongoUri()) {
    return NextResponse.json({ setupRequired: false, error: "MONGODB_URI is required" }, { status: 503 });
  }

  try {
    const count = await adminCount();
    return NextResponse.json({ setupRequired: count === 0, adminCount: count });
  } catch (error) {
    return errorResponse(error, "Unable to inspect admin registration state");
  }
}

export async function POST(req: NextRequest) {
  if (!hasMongoUri()) {
    return NextResponse.json({ error: "MONGODB_URI is required to register admins" }, { status: 503 });
  }

  try {
    await connectDb();
    const existingAdmins = await AdminUserModel.countDocuments({});
    const session = await getAdminSession();

    if (existingAdmins > 0 && !session) {
      return NextResponse.json({ error: "Admin authentication required to create another admin" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const username = String(body.username || "").trim().toLowerCase();
    const displayName = String(body.displayName || "").trim();
    const password = String(body.password || "");

    if (!username || username.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const created = await AdminUserModel.create({
      username,
      displayName,
      passwordHash: hashPassword(password),
      role: "admin",
      isActive: true,
    });

    return NextResponse.json(
      {
        admin: {
          id: created._id.toString(),
          username: created.username,
          displayName: created.displayName,
          role: created.role,
          isActive: created.isActive,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error && "code" in error && error.code === 11000
      ? "Admin username already exists"
      : "Unable to register admin";
    return errorResponse(error, message, message.includes("already") ? 409 : 500);
  }
}
