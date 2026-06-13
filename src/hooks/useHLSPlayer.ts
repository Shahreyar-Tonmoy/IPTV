"use client";
import { useEffect, useRef, useCallback } from "react";
import type Hls from "hls.js";
import type { Level } from "hls.js";
import type mpegts from "mpegts.js";
import { usePlayerStore } from "@/store/player";

type StreamKind = "hls" | "mpegts" | "direct";
type HlsLevelWithIndex = { level: Level; index: number };
type MpegTsPlayer = ReturnType<typeof mpegts.createPlayer>;

const MAX_RETRIES = 3;
const RESOLUTION_RANGES: Record<number, { min: number; max: number }> = {
  144: { min: 0, max: 180 },
  240: { min: 181, max: 300 },
  480: { min: 301, max: 600 },
  720: { min: 601, max: 900 },
  1080: { min: 901, max: 1260 },
  1440: { min: 1261, max: 1800 },
  2160: { min: 1801, max: Number.POSITIVE_INFINITY },
};

function getUrlExtension(url: string) {
  try {
    const parsed = new URL(url, window.location.href);
    const path = parsed.pathname.toLowerCase();
    return path.split(".").pop() || "";
  } catch {
    return url.split("?")[0]?.split(".").pop()?.toLowerCase() || "";
  }
}

function toAbsoluteUrl(url: string, baseUrl: string) {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}

function parseM3uPlaylist(playlist: string, playlistUrl: string) {
  const firstPlayableLine = playlist
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#"));

  return firstPlayableLine ? toAbsoluteUrl(firstPlayableLine, playlistUrl) : playlistUrl;
}

async function resolveStreamUrl(url: string): Promise<string> {
  if (url.startsWith("/api/stream") || url.includes("/api/stream?")) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Unable to resolve stream: ${response.status}`);
    const payload = (await response.json()) as { streamUrl?: string };
    if (!payload.streamUrl) throw new Error("Stream URL missing from resolver response");
    return payload.streamUrl;
  }

  const ext = getUrlExtension(url);

  if (ext !== "m3u") return url;

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load playlist: ${response.status}`);

  return parseM3uPlaylist(await response.text(), url);
}

function detectStreamKind(url: string): StreamKind {
  const ext = getUrlExtension(url);
  if (ext === "m3u8") return "hls";
  if (ext === "ts" || url.toLowerCase().includes(".ts?")) return "mpegts";
  return "direct";
}

function formatBitrate(bitsPerSecond: number) {
  if (!bitsPerSecond) return "";
  if (bitsPerSecond >= 1_000_000) return `${(bitsPerSecond / 1_000_000).toFixed(1)} Mbps`;
  return `${Math.round(bitsPerSecond / 1000)} Kbps`;
}

function getResolutionRange(height: number) {
  return RESOLUTION_RANGES[height] || null;
}

export function useHLSPlayer(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const hlsRef = useRef<Hls | null>(null);
  const mpegTsRef = useRef<MpegTsPlayer | null>(null);
  const bufferIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadStreamRef = useRef<((url: string) => Promise<void>) | null>(null);
  const qualityRef = useRef("auto");
  const retryCount = useRef(0);

  const {
    activeChannel,
    isPlaying,
    isMuted,
    volume,
    quality,
    setIsPlaying,
    setBufferHealth,
    setLatency,
    setBitrate,
    setQualityLevels,
    setIsLoading,
  } = usePlayerStore();
  const backupUrls = activeChannel?.backupUrls;

  const stopBufferPolling = useCallback(() => {
    if (bufferIntervalRef.current) {
      clearInterval(bufferIntervalRef.current);
      bufferIntervalRef.current = null;
    }
  }, []);

  const startBufferPolling = useCallback(() => {
    stopBufferPolling();
    bufferIntervalRef.current = setInterval(() => {
      if (!videoRef.current) return;
      const video = videoRef.current;
      const buf = video.buffered;
      if (buf.length > 0) {
        const bufEnd = buf.end(buf.length - 1);
        const health = Math.min(100, Math.max(0, ((bufEnd - video.currentTime) / 30) * 100));
        setBufferHealth(Math.round(health));
      }
    }, 1000);
  }, [setBufferHealth, stopBufferPolling, videoRef]);

  const destroyPlayers = useCallback(() => {
    stopBufferPolling();
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (mpegTsRef.current) {
      mpegTsRef.current.destroy();
      mpegTsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }
    setQualityLevels([]);
  }, [setQualityLevels, stopBufferPolling, videoRef]);

  const applyQuality = useCallback((selectedQuality: string) => {
    const hls = hlsRef.current;
    if (!hls) return;

    if (selectedQuality === "auto") {
      hls.currentLevel = -1;
      hls.loadLevel = -1;
      hls.nextLevel = -1;
      hls.autoLevelCapping = -1;
      return;
    }

    const levels = hls.levels || [];
    if (!levels.length) return;

    const sortedByBandwidth = levels
      .map((level, index) => ({ level, index }))
      .sort((a: HlsLevelWithIndex, b: HlsLevelWithIndex) => (a.level.bitrate || 0) - (b.level.bitrate || 0));

    const requestedHeight = selectedQuality.startsWith("resolution-")
      ? Number(selectedQuality.replace("resolution-", ""))
      : null;

    const requestedRange = requestedHeight ? getResolutionRange(requestedHeight) : null;

    const chosenIndex: number | undefined =
      selectedQuality === "low"
        ? sortedByBandwidth[0]?.index
        : selectedQuality === "high"
          ? sortedByBandwidth[sortedByBandwidth.length - 1]?.index
          : requestedRange && requestedHeight
            ? sortedByBandwidth.reduce((best, current) => {
                const height = current.level.height || 0;
                if (height < requestedRange.min || height > requestedRange.max) return best;
                if (!best) return current;
                return Math.abs(height - requestedHeight) <
                  Math.abs((best.level.height || 0) - requestedHeight)
                  ? current
                  : best;
              }, null as HlsLevelWithIndex | null)?.index
            : Number(selectedQuality.replace("level-", ""));

    if (typeof chosenIndex === "number" && Number.isInteger(chosenIndex) && chosenIndex >= 0 && chosenIndex < levels.length) {
      setIsLoading(true);
      hls.stopLoad();
      hls.currentLevel = chosenIndex;
      hls.loadLevel = chosenIndex;
      hls.nextLevel = chosenIndex;
      hls.autoLevelCapping = -1;
      setBitrate(Math.round((levels[chosenIndex]?.bitrate || 0) / 1000));
      hls.startLoad();
    }
  }, [setBitrate, setIsLoading]);

  const initPlayer = useCallback(
    async (url: string) => {
      if (!videoRef.current) return;

      destroyPlayers();
      retryCount.current = 0;
      setIsLoading(true);

      const resolvedUrl = await resolveStreamUrl(url);
      const streamKind = detectStreamKind(resolvedUrl);
      const video = videoRef.current;

      if (streamKind === "hls") {
        const Hls = (await import("hls.js")).default;

        if (!Hls.isSupported()) {
          if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = resolvedUrl;
            await video.play().catch(console.error);
            setIsPlaying(true);
            setIsLoading(false);
          }
          return;
        }

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          highBufferWatchdogPeriod: 2,
          nudgeOffset: 0.1,
          nudgeMaxRetry: 3,
          maxFragLookUpTolerance: 0.25,
          startLevel: -1, // auto quality
          abrEwmaDefaultEstimate: 500000,
          abrBandWidthFactor: 0.95,
          abrBandWidthUpFactor: 0.7,
          progressive: true,
          testBandwidth: true,
          xhrSetup: (xhr: XMLHttpRequest) => {
            xhr.withCredentials = false;
          },
        });

        hls.loadSource(resolvedUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          const levels = (hls.levels || []).map((level, index) => ({
            id: `level-${index}`,
            index,
            height: level.height || 0,
            bitrate: level.bitrate || 0,
            label: level.height
              ? `${level.height}p${level.bitrate ? ` (${formatBitrate(level.bitrate)})` : ""}`
              : formatBitrate(level.bitrate) || `Level ${index + 1}`,
          }));

          setQualityLevels(levels);
          applyQuality(qualityRef.current);
          video.play().catch(console.error);
          retryCount.current = 0;
          setIsPlaying(true);
        });

        hls.on(Hls.Events.FRAG_BUFFERED, (event, data) => {
          void event;
          if (data?.stats) {
            const levelIndex = data.frag?.level;
            const mediaBitrate =
              typeof levelIndex === "number" ? hls.levels[levelIndex]?.bitrate || 0 : 0;
            const bitrate = mediaBitrate || data.stats.bwEstimate || 0;
            setBitrate(Math.round(bitrate / 1000));
          }
          setIsLoading(false);
        });

        hls.on(Hls.Events.LEVEL_UPDATED, (event) => {
          void event;
          const latency = hls.latency || 0;
          setLatency(Math.round(latency * 1000));
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          void event;
          if (data.fatal) {
            setIsLoading(true);
            if (retryCount.current < MAX_RETRIES) {
              retryCount.current++;
              setTimeout(() => hls.startLoad(), 1000 * retryCount.current);
            } else if (backupUrls?.length) {
              const backup = backupUrls[0];
              if (backup) loadStreamRef.current?.(backup);
            }
          }
        });

        hlsRef.current = hls;
        startBufferPolling();
        return;
      }

      if (streamKind === "mpegts") {
        const mpegts = await import("mpegts.js");

        if (mpegts.default.isSupported()) {
          const player = mpegts.default.createPlayer({
            type: "mpegts",
            isLive: true,
            url: resolvedUrl,
          });

          player.attachMediaElement(video);
          player.load();
          const playResult = player.play();
          if (playResult instanceof Promise) playResult.catch(console.error);
          mpegTsRef.current = player;
          startBufferPolling();
          setIsPlaying(true);
          setQualityLevels([]);
          setIsLoading(false);
          return;
        }

        if (video.canPlayType("video/mp2t")) {
          video.src = resolvedUrl;
          await video.play().catch(console.error);
          startBufferPolling();
          setIsPlaying(true);
          setQualityLevels([]);
          setIsLoading(false);
          return;
        }
      }

      video.src = resolvedUrl;
      video.addEventListener(
        "loadedmetadata",
        () => {
          if (video.videoHeight || video.videoWidth) {
            setQualityLevels([
              {
                id: "direct",
                index: 0,
                height: video.videoHeight,
                bitrate: 0,
                label: video.videoHeight ? `${video.videoHeight}p` : "Direct",
              },
            ]);
          }
        },
        { once: true }
      );
      await video.play().catch(console.error);
      startBufferPolling();
      setIsPlaying(true);
      setIsLoading(false);
    },
    [
      applyQuality,
      backupUrls,
      destroyPlayers,
      setBitrate,
      setIsPlaying,
      setLatency,
      setIsLoading,
      setQualityLevels,
      startBufferPolling,
      videoRef,
    ]
  );

  useEffect(() => {
    loadStreamRef.current = initPlayer;
  }, [initPlayer]);

  useEffect(() => {
    if (activeChannel?.streamUrl) {
      initPlayer(activeChannel.streamUrl).catch(console.error);
    }
    return destroyPlayers;
  }, [activeChannel?.streamUrl, destroyPlayers, initPlayer]);

  useEffect(() => {
    qualityRef.current = quality;
    applyQuality(quality);
  }, [applyQuality, quality]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = isMuted;
    videoRef.current.volume = volume / 100;
  }, [isMuted, volume, videoRef]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.play().catch(console.error);
    else videoRef.current.pause();
  }, [isPlaying, videoRef]);

  return { hlsRef };
}
