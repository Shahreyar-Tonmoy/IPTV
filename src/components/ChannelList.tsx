"use client";
import { useState } from "react";
import { Channel } from "@/lib/channels";
import { useLiveChannels } from "@/hooks/useLiveChannels";
import { usePlayerStore } from "@/store/player";

function formatViewers(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toString();
}

const QUALITY_COLOR: Record<string, string> = {
  "4K": "#FFD700",
  FHD: "#00C851",
  HD: "#4A9EFF",
  SD: "#888",
};

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "main", label: "Main" },
  { id: "highlights", label: "Highlights" },
  { id: "analysis", label: "Analysis" },
  { id: "local", label: "Local" },
];

export default function ChannelList() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const { activeChannel, setActiveChannel } = usePlayerStore();
  const { channels, isLoading, isValidating, error, refresh } = useLiveChannels();

  const filtered = channels.filter((ch) => {
    const matchCat = activeCategory === "all" || ch.category === activeCategory;
    const matchSearch =
      ch.name.toLowerCase().includes(search.toLowerCase()) ||
      ch.currentMatch?.toLowerCase().includes(search.toLowerCase()) ||
      ch.language.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => Number(b.isLive) - Number(a.isLive) || b.viewers - a.viewers);

  const totalViewers = channels.reduce((sum, channel) => sum + channel.viewers, 0);

  return (
    <aside className="channel-sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">
          <span className="sidebar-icon">📡</span> Live Channels
          <span className="channel-count">{channels.filter((c) => c.isLive).length}</span>
        </h2>
        <div className="sidebar-tools">
          <span>{formatViewers(totalViewers)} watching</span>
          <button type="button" onClick={() => refresh()} disabled={isValidating}>
            {isValidating ? "Syncing" : "Refresh"}
          </button>
        </div>
        <input
          type="text"
          placeholder="Search channels…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="channel-search"
        />
        <div className="category-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`cat-tab ${activeCategory === cat.id ? "active" : ""}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="channel-list">
        {isLoading && <div className="no-results">Loading channels...</div>}
        {error && <div className="no-results">Unable to load channels</div>}
        {filtered.map((channel) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            isActive={activeChannel?.id === channel.id}
            onSelect={() => setActiveChannel(channel)}
          />
        ))}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="no-results">No channels found</div>
        )}
      </div>
    </aside>
  );
}

function ChannelCard({
  channel,
  isActive,
  onSelect,
}: {
  channel: Channel;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={`channel-card ${isActive ? "active" : ""}`}
      onClick={onSelect}
      aria-pressed={isActive}
    >
      <div className="card-logo">
        {channel.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={channel.imageUrl} alt="" className="card-logo-img" />
        ) : (
          channel.logo
        )}
      </div>
      <div className="card-info">
        <div className="card-name">{channel.name}</div>
        {channel.currentMatch && (
          <div className="card-match">{channel.currentMatch}</div>
        )}
        <div className="card-meta">
          <span className="card-region">{channel.region}</span>
          <span className="card-lang">{channel.language}</span>
        </div>
      </div>
      <div className="card-right">
        <span
          className="quality-tag"
          style={{ color: QUALITY_COLOR[channel.quality] }}
        >
          {channel.quality}
        </span>
        {channel.isLive && (
          <span className="live-tag">
            <span className="live-dot-sm" />
            LIVE
          </span>
        )}
        <span className="viewer-tag">{formatViewers(channel.viewers)} total</span>
        {!!channel.liveViewers && (
          <span className="viewer-tag live-viewer-tag">
            {formatViewers(channel.liveViewers)} live
          </span>
        )}
      </div>
    </button>
  );
}
