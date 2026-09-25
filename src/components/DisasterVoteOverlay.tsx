/**
 * BOUNCE TV — Reality TV Live Audience Stream Hazard Poll Overlay
 *
 * Professional broadcast-grade typography and graphics.
 * Strictly ZERO emoji in text, code, or badges.
 * Strictly AUDIENCE STREAM ONLY (Player cannot vote; non-intrusive corner placement).
 */
import { useEffect, useState, useRef } from "react";
import type { DisasterVoteState } from "../game/disasters";

interface DisasterVoteOverlayProps {
  voteState: DisasterVoteState;
  onVote?: (id: any) => void;
}

interface ChatMessage {
  id: number;
  badge: "VIP" | "SUB" | "FAN" | "MOD";
  user: string;
  text: string;
}

const STREAM_CHAT_POOL: Omit<ChatMessage, "id">[] = [
  { badge: "VIP", user: "ApexStriker", text: "VOTE METEOR FOR TOTAL MAYHEM!" },
  { badge: "SUB", user: "ArcadeFanatic", text: "Tornado will launch them out!" },
  { badge: "MOD", user: "NeonBouncer", text: "Orbital laser is closing the gap!!" },
  { badge: "FAN", user: "ChaosEnjoyer", text: "EARTHQUAKE WILL SHATTER MIDFIELD" },
  { badge: "VIP", user: "GigaChad", text: "Black Hole vortex wins this 100%" },
  { badge: "SUB", user: "TurboBean", text: "Meteor strike incoming let's go!!" },
  { badge: "FAN", user: "SpeedyGonz", text: "Tornado spin them sky-high!" },
  { badge: "MOD", user: "RefereeDan", text: "Vote count surging in real time!" },
];

export default function DisasterVoteOverlay({ voteState }: DisasterVoteOverlayProps) {
  // Live audience viewer count that breathes slightly around 48,000
  const [viewerCount, setViewerCount] = useState(48250);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 1, badge: "VIP", user: "ApexStriker", text: "VOTE METEOR FOR TOTAL MAYHEM!" },
    { id: 2, badge: "SUB", user: "ArcadeFanatic", text: "Tornado will launch them out!" },
    { id: 3, badge: "MOD", user: "NeonBouncer", text: "Orbital laser is closing the gap!!" },
  ]);
  const [voteSurges, setVoteSurges] = useState<{ id: string; delta: number; key: number }[]>([]);
  const prevVotesRef = useRef<Record<string, number>>({});
  const surgeKeyRef = useRef(0);

  // Fluctuating stream viewer count
  useEffect(() => {
    if (!voteState.isActive) return;
    const interval = setInterval(() => {
      setViewerCount((prev) => prev + Math.floor(Math.random() * 41) - 18);
    }, 1200);
    return () => clearInterval(interval);
  }, [voteState.isActive]);

  // Rolling live stream chat feed
  useEffect(() => {
    if (!voteState.isActive) return;
    const interval = setInterval(() => {
      const nextMsg = STREAM_CHAT_POOL[Math.floor(Math.random() * STREAM_CHAT_POOL.length)];
      setChatMessages((prev) => [
        ...prev.slice(-2),
        { ...nextMsg, id: Date.now() + Math.random() },
      ]);
    }, 1400);
    return () => clearInterval(interval);
  }, [voteState.isActive]);

  // Detect vote surges to spawn floating "+XX" vote counts
  useEffect(() => {
    if (!voteState.isActive) return;
    voteState.candidates.forEach((c) => {
      const prev = prevVotesRef.current[c.id] || c.votes;
      const diff = c.votes - prev;
      if (diff > 0) {
        surgeKeyRef.current += 1;
        const newSurge = { id: c.id, delta: diff, key: surgeKeyRef.current };
        setVoteSurges((curr) => [...curr.slice(-3), newSurge]);
      }
      prevVotesRef.current[c.id] = c.votes;
    });
  }, [voteState.candidates, voteState.isActive]);

  if (!voteState.isActive && !voteState.activeDisaster) {
    return null;
  }

  // Active Disaster Alert Banner (when strike is actively hitting the stadium)
  if (voteState.activeDisaster && !voteState.isActive) {
    return (
      <div className="stream-hazard-alert-pill animate-hazard-drop">
        <div className="hazard-siren-beacon">
          <span className="siren-light" />
        </div>
        <div className="hazard-text-column">
          <div className="hazard-alert-sub">AUDIENCE HAZARD DEPLOYED</div>
          <div className="hazard-alert-name">{voteState.announcement}</div>
        </div>
        <div className="hazard-timer-badge">
          {Math.ceil(voteState.disasterTimeLeft)}s
        </div>
      </div>
    );
  }

  // Find leading candidate
  const leadingId = voteState.candidates.reduce((best, curr) =>
    curr.votes > (best?.votes || 0) ? curr : best
  , voteState.candidates[0])?.id;

  const timeLeft = Math.ceil(voteState.voteTimeLeft);
  const isUrgent = timeLeft <= 3;

  return (
    <div className="stream-poll-corner-widget animate-slide-left">
      {/* Poll Header Bar */}
      <div className="stream-poll-header">
        <div className="stream-live-tag">
          <span className="stream-live-beacon">
            <span className="beacon-ring" />
            <span className="beacon-core" />
          </span>
          <div className="stream-title-group">
            <span className="stream-live-title">AUDIENCE POLL</span>
            <span className="stream-viewer-count">{viewerCount.toLocaleString()} VIEWERS</span>
          </div>
        </div>
        <div className={`stream-poll-timer-badge ${isUrgent ? "urgent-closing" : ""}`}>
          <span className="timer-label">{isUrgent ? "CLOSING" : "TIME"}</span>
          <span className="timer-sec">{timeLeft}s</span>
        </div>
      </div>

      <div className="stream-poll-subtitle-bar">
        <span className="sub-glow-line" />
        <span className="sub-text">LIVE CHAT HAZARD VOTING</span>
        <span className="sub-glow-line" />
      </div>

      {/* Candidate Rows Grid */}
      <div className="stream-candidates-list">
        {voteState.candidates.map((cand, idx) => {
          const isLeading = cand.id === leadingId;
          const candidateSurges = voteSurges.filter((s) => s.id === cand.id);

          return (
            <div
              key={cand.id}
              className={`stream-candidate-row ${isLeading ? "leading-row" : ""}`}
            >
              <div className="cand-info-line">
                <div className="cand-name-group">
                  <span className="cand-rank">#{idx + 1}</span>
                  <span className="cand-title" style={{ color: cand.color }}>
                    {cand.name}
                  </span>
                </div>
                <div className="cand-pct-wrap">
                  {candidateSurges.map((s) => (
                    <span key={s.key} className="floating-vote-surge">
                      +{s.delta}
                    </span>
                  ))}
                  <span className="cand-pct-badge" style={{ color: cand.color }}>
                    {cand.pct}%
                  </span>
                </div>
              </div>

              {/* Dynamic Animated Striped Vote Bar */}
              <div className="stream-bar-track">
                <div
                  className={`stream-bar-fill ${isLeading ? "leading-bar-glow" : ""}`}
                  style={{
                    width: `${Math.max(4, cand.pct)}%`,
                    backgroundColor: cand.color,
                  }}
                >
                  <div className="bar-sheen-highlight" />
                </div>
              </div>

              <div className="cand-bottom-line">
                <span className="cand-votes-count">{cand.votes.toLocaleString()} votes</span>
                {isLeading && (
                  <span className="cand-leading-badge">
                    LEADING PICK
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Stream Chat Stream Feed */}
      <div className="stream-chat-feed">
        <div className="chat-feed-header">
          <span className="chat-dot" />
          <span className="chat-header-text">LIVE STREAM CHAT</span>
        </div>
        <div className="chat-messages-container">
          {chatMessages.map((msg) => (
            <div key={msg.id} className="stream-chat-row animate-chat-slide">
              <span className={`chat-badge ${msg.badge.toLowerCase()}`}>
                [{msg.badge}]
              </span>
              <span className="chat-user">{msg.user}:</span>
              <span className="chat-text">{msg.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
