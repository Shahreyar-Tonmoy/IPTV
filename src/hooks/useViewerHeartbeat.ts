"use client";

import { useEffect } from "react";
import { useSWRConfig } from "swr";

const VIEWER_ID_KEY = "iptv_viewer_session_id";
const HEARTBEAT_MS = 12_000;

function makeViewerId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getViewerId() {
  const existing = window.localStorage.getItem(VIEWER_ID_KEY);
  if (existing) return existing;

  const created = makeViewerId();
  window.localStorage.setItem(VIEWER_ID_KEY, created);
  return created;
}

export function useViewerHeartbeat(channelId?: string, enabled = true) {
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (!channelId || !enabled) return;

    let disposed = false;
    const sessionId = getViewerId();

    async function beat() {
      try {
        await fetch("/api/watch/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channelId, sessionId }),
          keepalive: true,
        });
        if (!disposed) void mutate("/api/channels");
      } catch {
        // Retry on the next heartbeat.
      }
    }

    void beat();
    const interval = window.setInterval(() => void beat(), HEARTBEAT_MS);
    return () => {
      disposed = true;
      window.clearInterval(interval);
    };
  }, [channelId, enabled, mutate]);
}
