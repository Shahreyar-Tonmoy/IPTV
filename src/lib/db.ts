import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "world-cup-iptv";
const MONGODB_USER = process.env.MONGODB_USERNAME;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;

type CachedConnection = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalWithMongoose = globalThis as typeof globalThis & {
  mongooseCache?: CachedConnection;
};

const cached =
  globalWithMongoose.mongooseCache ||
  (globalWithMongoose.mongooseCache = { conn: null, promise: null });

function buildMongoUri() {
  if (!MONGODB_URI) return "";

  try {
    const url = new URL(MONGODB_URI);
    if (MONGODB_USER) url.username = MONGODB_USER;
    if (MONGODB_PASSWORD) url.password = MONGODB_PASSWORD;
    if (MONGODB_DB_NAME) url.pathname = `/${MONGODB_DB_NAME}`;
    return url.toString();
  } catch {
    return MONGODB_URI;
  }
}

export function hasMongoUri() {
  return Boolean(MONGODB_URI);
}

export async function connectDb() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (cached.conn) return cached.conn;

  const connectionUri = buildMongoUri();

  cached.promise ||= mongoose.connect(connectionUri, {
    bufferCommands: false,
    maxPoolSize: 20,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    dbName: MONGODB_DB_NAME,
  });

  cached.conn = await cached.promise;
  return cached.conn;
}
