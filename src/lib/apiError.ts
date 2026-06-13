import { NextResponse } from "next/server";

export function errorResponse(error: unknown, fallback: string, status = 500) {
  const detail = error instanceof Error ? error.message : fallback;
  return NextResponse.json(
    {
      error: fallback,
      detail: process.env.NODE_ENV === "development" ? detail : undefined,
    },
    { status }
  );
}
