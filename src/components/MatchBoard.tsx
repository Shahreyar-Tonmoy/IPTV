"use client";
import { useState, useEffect } from "react";
import { MATCHES, Match } from "@/lib/channels";

function formatKickoffTime(kickoff: string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(kickoff));
}

export default function MatchBoard() {
  const [matches, setMatches] = useState(MATCHES);
  const [activeTab, setActiveTab] = useState<"live" | "upcoming" | "finished">("live");

  // Simulate live ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setMatches((prev) =>
        prev.map((m) =>
          m.status === "live" && m.minute !== undefined
            ? { ...m, minute: Math.min(90, m.minute + 1) }
            : m
        )
      );
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const filtered = matches.filter((m) => m.status === activeTab);
  const liveCt = matches.filter((m) => m.status === "live").length;

  return (
    <section className="match-board">
      <div className="board-header">
        <h2 className="board-title">
          <span>🏟️</span> Fixtures
        </h2>
        <div className="board-tabs">
          <button
            className={`board-tab ${activeTab === "live" ? "active" : ""}`}
            onClick={() => setActiveTab("live")}
          >
            <span className="tab-live-dot" />
            Live {liveCt > 0 && <span className="tab-badge">{liveCt}</span>}
          </button>
          <button
            className={`board-tab ${activeTab === "upcoming" ? "active" : ""}`}
            onClick={() => setActiveTab("upcoming")}
          >
            Upcoming
          </button>
          <button
            className={`board-tab ${activeTab === "finished" ? "active" : ""}`}
            onClick={() => setActiveTab("finished")}
          >
            Results
          </button>
        </div>
      </div>

      <div className="match-list">
        {filtered.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
        {filtered.length === 0 && (
          <div className="no-matches">No {activeTab} matches</div>
        )}
      </div>
    </section>
  );
}

function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === "live";
  const isUpcoming = match.status === "upcoming";

  const kickoffTime = formatKickoffTime(match.kickoff);

  return (
    <div className={`match-card ${isLive ? "live" : ""}`}>
      <div className="match-stage">
        {isLive && (
          <span className="match-live-badge">
            <span className="pulse-dot" />
            {match.minute}&apos;
          </span>
        )}
        {isUpcoming && <span className="match-time">{kickoffTime}</span>}
        {match.status === "finished" && <span className="match-ft">FT</span>}
        <span className="match-stage-label">{match.stage}</span>
      </div>

      <div className="match-teams">
        <div className="team home">
          <span className="team-flag">{match.homeFlag}</span>
          <span className="team-name">{match.homeTeam}</span>
          {match.homeScore !== null && (
            <span className={`team-score ${isLive && match.homeScore > (match.awayScore ?? 0) ? "winning" : ""}`}>
              {match.homeScore}
            </span>
          )}
        </div>
        <div className="match-vs">{isUpcoming ? "vs" : ":"}</div>
        <div className="team away">
          {match.awayScore !== null && (
            <span className={`team-score ${isLive && match.awayScore > (match.homeScore ?? 0) ? "winning" : ""}`}>
              {match.awayScore}
            </span>
          )}
          <span className="team-name">{match.awayTeam}</span>
          <span className="team-flag">{match.awayFlag}</span>
        </div>
      </div>

      <div className="match-venue">📍 {match.venue}</div>
    </div>
  );
}
