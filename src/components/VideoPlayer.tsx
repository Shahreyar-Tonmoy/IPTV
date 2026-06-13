"use client";
import { useRef, useState, useCallback, useEffect } from "react";
import { useHLSPlayer } from "@/hooks/useHLSPlayer";
import { useLiveChannels } from "@/hooks/useLiveChannels";
import { usePlayerStore } from "@/store/player";

function formatViewers(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

const QUALITY_OPTIONS = [
  { value: "resolution-144", label: "144p", min: 0, max: 180 },
  { value: "resolution-240", label: "240p", min: 181, max: 300 },
  { value: "resolution-480", label: "480p", min: 301, max: 600 },
  { value: "resolution-720", label: "720p", min: 601, max: 900 },
  { value: "resolution-1080", label: "1080p", min: 901, max: 1260 },
  { value: "resolution-1440", label: "2K", min: 1261, max: 1800 },
  { value: "resolution-2160", label: "4K", min: 1801, max: Number.POSITIVE_INFINITY },
];

const activeIconClass = (base: string, active: boolean) =>
  `${base} ${active ? "is-active" : ""}`;

export default function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showControls, setShowControls] = useState(true);
  const { channels } = useLiveChannels();

  const {
    activeChannel,
    isPlaying,
    isMuted,
    volume,
    isFullscreen,
    isTheaterMode,
    bufferHealth,
    latency,
    bitrate,
    quality,
    qualityLevels,
    isLoading,
    setIsPlaying,
    setIsMuted,
    setVolume,
    setQuality,
    setIsLoading,
    setIsFullscreen,
    setIsTheaterMode,
  } = usePlayerStore();

  const displayChannel =
    channels.find((channel) => channel.id === activeChannel?.id) || activeChannel;

  useHLSPlayer(videoRef);
  const availableHeights = qualityLevels.map((level) => level.height).filter(Boolean);

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!playerContainerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await playerContainerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Unable to toggle fullscreen", error);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, [setIsFullscreen]);

  if (!displayChannel) {
    return (
      <div className="player-empty">
        <div className="empty-content">
          <div className="empty-icon">⚽</div>
          <h2>Select a Channel to Watch</h2>
          <p>Choose from {channels.length} live streams below</p>
          <div className="live-channels-hint">
            {channels.filter((c) => c.isLive)
              .slice(0, 3)
              .map((c) => (
                <span key={c.id} className="hint-chip">
                  {c.logo} {c.name}
                </span>
              ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={playerContainerRef}
      className={`video-player-container ${isTheaterMode ? "theater" : ""} ${isFullscreen ? "fullscreen" : ""}`}
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <div className={`player-overlays ${showControls || !isPlaying ? "visible" : ""}`}>
        <div className="stream-badges" aria-label="Stream information">
          <span className="live-badge">
            <span className="live-dot" />
            LIVE
          </span>
          <span className="quality-badge">{displayChannel.quality}</span>
          <span className="lang-badge">{displayChannel.language}</span>
        </div>

        <div className="stats-overlay" aria-label="Playback status">
          <span className="stat">
            <span className="stat-label">BUF</span>
            <span className="stat-bar">
              <span className="stat-fill" style={{ width: `${bufferHealth}%` }} />
            </span>
          </span>
          {bitrate > 0 && (
            <span className="stat-text">
              {bitrate > 1000 ? `${(bitrate / 1000).toFixed(1)}Mbps` : `${bitrate}Kbps`}
            </span>
          )}
          {latency > 0 && <span className="stat-text">{latency}ms</span>}
        </div>
      </div>

      <video
        ref={videoRef}
        className="video-el"
        playsInline
        onClick={() => setIsPlaying(!isPlaying)}
        onWaiting={() => setIsLoading(true)}
        onStalled={() => setIsLoading(true)}
        onLoadStart={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onPlaying={() => setIsLoading(false)}
        onError={() => setIsLoading(false)}
      />

      {isLoading && !isPlaying && (
        <div className="loading-overlay" aria-live="polite" aria-label="Loading stream">
          <div className="loading-spinner" />
        </div>
      )}

      {/* Play/Pause overlay */}
      {!isPlaying && !isLoading && (
        <div className="play-overlay" onClick={() => setIsPlaying(true)}>
          <div className="play-btn-large">▶</div>
        </div>
      )}

      {/* Controls */}
      <div className={`player-controls ${showControls ? "visible" : ""}`}>
        <div className="controls-gradient" />

        {/* Channel info */}
        <div className="channel-info-bar">
          <span className="channel-logo-sm">{displayChannel.logo}</span>
          <div>
            <div className="channel-name-sm">{displayChannel.name}</div>
            {displayChannel.currentMatch && (
              <div className="match-label-sm">{displayChannel.currentMatch}</div>
            )}
          </div>
          {/* <div className="viewer-count">
            <span className="viewer-dot">●</span>
            {formatViewers(displayChannel.viewers)} watching
          </div> */}
        </div>

        {/* Control buttons */}
        <div className="controls-row">
          <div className="controls-left">
            <button
              className={activeIconClass("ctrl-btn play-pause", isPlaying)}
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? "Pause" : "Play"}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "⏸" : "▶"}
            </button>

            <div className="volume-group">
              <button
                className={`ctrl-btn volume-btn ${isMuted || volume === 0 ? "is-muted" : ""} ${volume > 50 && !isMuted ? "is-loud" : ""
                  }`}
                onClick={() => setIsMuted(!isMuted)}
                aria-label={isMuted ? "Unmute" : "Mute"}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? "🔇" : volume > 50 ? "🔊" : "🔉"}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (isMuted && Number(e.target.value) > 0) setIsMuted(false);
                }}
                className="volume-slider"
                aria-label="Volume"
              />
            </div>
          </div>

          <div className="controls-right">
            <label className="quality-control">
              <span className="quality-control-label">Quality</span>
              <select
                className="quality-select"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                aria-label="Video quality"
              >
                <option value="auto">Auto</option>
                {QUALITY_OPTIONS.map((option) => {
                  const isAvailable = availableHeights.some(
                    (height) => height >= option.min && height <= option.max
                  );

                  return (
                    <option key={option.value} value={option.value} disabled={!isAvailable}>
                      {option.label}
                    </option>
                  );
                })}
                {qualityLevels.length > 0 && (
                  <option value="available-levels" disabled>
                    Available
                  </option>
                )}
                {qualityLevels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              className={activeIconClass("ctrl-btn theater-btn", isTheaterMode)}
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              aria-label="Theater mode"
              title="Theater Mode"
            >
              {isTheaterMode ? "⊡" : "⊞"}
            </button>
            <button
              className={activeIconClass("ctrl-btn fullscreen-btn", isFullscreen)}
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? "⤓" : "⤢"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
