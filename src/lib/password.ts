import { pbkdf2Sync, randomBytes, timingSafeEqual } from "crypto";

const ITERATIONS = 120_000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const key = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("base64url");
  return `pbkdf2:${ITERATIONS}:${salt}:${key}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [scheme, iterationsText, salt, key] = storedHash.split(":");
  if (scheme !== "pbkdf2" || !iterationsText || !salt || !key) return false;

  const iterations = Number(iterationsText);
  if (!Number.isInteger(iterations) || iterations <= 0) return false;

  const expected = Buffer.from(key, "base64url");
  const actual = pbkdf2Sync(password, salt, iterations, expected.length, DIGEST);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
