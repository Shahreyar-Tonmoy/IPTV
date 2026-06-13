"use client";
import { useState, useEffect } from "react";
import { useLiveChannels } from "@/hooks/useLiveChannels";

function formatBdTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Dhaka",
  }).format(date);
}

export default function Header() {
  const [currentTime, setCurrentTime] = useState("");
  const { channels } = useLiveChannels();
  const totalViewers = channels.reduce((sum, ch) => sum + ch.viewers, 0);
  const liveCount = channels.filter((channel) => channel.isLive).length;

  useEffect(() => {
    const tick = () => {
      setCurrentTime(formatBdTime(new Date()));
    };
    const timeout = setTimeout(tick, 0);
    const interval = setInterval(tick, 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const formatLarge = (n: number) => {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    return new Intl.NumberFormat("en-US").format(n);
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand">
          <div className="brand-logo">
            <span className="logo-trophy">🏆</span>
          </div>
          <div className="brand-text">
            <span className="brand-name">FIFA WORLD CUP</span>
            <span className="brand-sub">LIVE STREAMING 2026</span>
          </div>
        </div>

        <div className="header-stats">
          <div className="stat-pill">
            <span className="stat-pill-dot live" />
            <span className="stat-pill-val">{liveCount}</span>
            <span className="stat-pill-label">Live Channels</span>
          </div>
          <div className="stat-pill">
            <span className="stat-pill-dot viewers" />
            <span className="stat-pill-val">{formatLarge(totalViewers)}</span>
            <span className="stat-pill-label">Watching Now</span>
          </div>
          <div className="stat-pill clock">
            <span className="stat-pill-label">BDT</span>
            <span className="stat-pill-val mono" suppressHydrationWarning>
              {currentTime}
            </span>
          </div>
        </div>

        {/* <nav className="header-nav">
          <button className="nav-btn active">Watch</button>
          <a className="nav-btn" href="/admin">Admin</a>
          <button className="nav-btn">Schedule</button>
        </nav> */}
      </div>

      {/* Ticker */}
      {/* <div className="ticker-bar">
        <span className="ticker-label">⚽ LATEST</span>
        <div className="ticker-track">
          <span className="ticker-content">
            🇧🇷 Brazil 2-1 Argentina 🔴 67&apos; &nbsp;|&nbsp;
            🇫🇷 France 1-1 Germany 🔴 44&apos; &nbsp;|&nbsp;
            🇰🇷 Korea 0-0 Australia 🔴 12&apos; &nbsp;|&nbsp;
            NEXT: Saudi Arabia vs Japan — 21:00 UTC &nbsp;|&nbsp;
            YESTERDAY: England 3-2 Spain (FT) &nbsp;|&nbsp;
          </span>
        </div>
      </div> */}
    </header>
  );
}
