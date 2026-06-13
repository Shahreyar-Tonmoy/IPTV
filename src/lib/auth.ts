import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { connectDb, hasMongoUri } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { AdminUserModel } from "@/models/AdminUser";

export const ADMIN_COOKIE = "iptv_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || "change-this-admin-session-secret";
}

function getAdminUser() {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "admin12345",
  };
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function validateEnvAdminCredentials(username: string, password: string) {
  const admin = getAdminUser();
  return safeEqual(username, admin.username) && safeEqual(password, admin.password);
}

export async function validateAdminCredentials(username: string, password: string) {
  const normalizedUsername = username.trim().toLowerCase();

  if (hasMongoUri()) {
    await connectDb();
    const admin = await AdminUserModel.findOne({
      username: normalizedUsername,
      isActive: true,
    }).select("username passwordHash").lean();

    if (admin && verifyPassword(password, admin.passwordHash)) {
      await AdminUserModel.updateOne({ _id: admin._id }, { $set: { lastLoginAt: new Date() } });
      return true;
    }
  }

  return validateEnvAdminCredentials(username, password);
}

export function createSessionToken(username: string) {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const payload = Buffer.from(JSON.stringify({ username, expiresAt })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string) {
  if (!token) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      username: string;
      expiresAt: number;
    };

    if (!session.username || session.expiresAt < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
