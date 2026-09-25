/**
 * BOUNCE TV — Reality TV Live Audience Stream Hazard Poll Overlay
 *
 * Professional broadcast-grade typography and graphics.
 * Strictly ZERO emoji AI slop.
 * Strictly AUDIENCE STREAM ONLY (Player cannot vote; non-intrusive corner placement).
 */
import { useEffect, useState } from "react";
import type { DisasterVoteState } from "../game/disasters";

interface DisasterVoteOverlayProps {
  voteState: DisasterVoteState;
  onVote?: (id: any) => void;
}

const CHAT_REACTIONS = [
  "Viewer99: VOTE METEOR!!",
  "ArcadeBouncer: Tornado pls!",
  "TwitchFan: DO THE LASER!",
  "GigaChad: DROP THE QUAKE",
  "ChaosEnjoyer: BLACKHOLE WINS",
  "SpeedyBean: Meteor strikes now!",
];

export default function DisasterVoteOverlay({ voteState }: DisasterVoteOverlayProps) {
  const [chatIdx, setChatIdx] = useState(0);

  // Rotate simulated audience chat reactions
  useEffect(() => {
    if (!voteState.isActive) return;
    const interval = setInterval(() => {
      setChatIdx((prev) => (prev + 1) % CHAT_REACTIONS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [voteState.isActive]);

  if (!voteState.isActive && !voteState.activeDisaster) {
    return null;
  }

  // Active Disaster Alert Banner (when strike is incoming) — slim and non-intrusive
  if (voteState.activeDisaster && !voteState.isActive) {
    return (
      <div className="stream-hazard-alert-pill animate-hazard-drop">
        <span className="hazard-alert-dot" />
        <span className="hazard-alert-label">AUDIENCE HAZARD DEPLOYED:</span>
        <span className="hazard-alert-name">{voteState.announcement}</span>
      </div>
    );
  }

  // Find leading candidate
  const leadingId = voteState.candidates.reduce((best, curr) =>
    curr.votes > (best?.votes || 0) ? curr : best
  , voteState.candidates[0])?.id;

  // Active Voting Poll UI — Docked neatly in top-right corner, leaving entire arena open
  return (
    <div className="stream-poll-corner-widget animate-slide-left">
      {/* Poll Header Bar */}
      <div className="stream-poll-header">
        <div className="stream-live-tag">
          <span className="stream-live-dot" />
          <span className="stream-live-title">AUDIENCE POLL</span>
        </div>
        <div className="stream-poll-timer">
          CLOSING: <span className="timer-sec">{Math.ceil(voteState.voteTimeLeft)}s</span>
        </div>
      </div>

      <div className="stream-poll-subtitle">
        VIEWER HAZARD VOTE IN PROGRESS
      </div>

      {/* Candidate Rows Grid */}
      <div className="stream-candidates-list">
        {voteState.candidates.map((cand) => {
          const isLeading = cand.id === leadingId;
          return (
            <div
              key={cand.id}
              className={`stream-candidate-row ${isLeading ? "leading-row" : ""}`}
            >
              <div className="cand-info-line">
                <span className="cand-title" style={{ color: cand.color }}>
                  {cand.name}
                </span>
                <span className="cand-pct-badge" style={{ color: cand.color }}>
                  {cand.pct}%
                </span>
              </div>

              {/* Real-time Vote Progress Bar */}
              <div className="stream-bar-track">
                <div
                  className="stream-bar-fill"
                  style={{
                    width: `${cand.pct}%`,
                    backgroundColor: cand.color,
                  }}
                />
              </div>

              <div className="cand-bottom-line">
                <span className="cand-votes-count">{cand.votes.toLocaleString()} votes</span>
                {isLeading && <span className="cand-leading-badge">LEADING</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulated Live Audience Chat Ticker */}
      <div className="stream-chat-preview">
        <span className="chat-msg" key={chatIdx}>
          {CHAT_REACTIONS[chatIdx]}
        </span>
      </div>
    </div>
  );
}
