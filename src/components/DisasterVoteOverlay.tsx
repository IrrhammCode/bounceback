/**
 * BOUNCE TV — Reality TV Live Audience Disaster Vote Overlay
 *
 * Professional broadcast-grade typography and graphics.
 * Strictly ZERO emoji AI slop.
 */
import { useEffect, useCallback } from "react";
import type { DisasterVoteState, DisasterId } from "../game/disasters";

interface DisasterVoteOverlayProps {
  voteState: DisasterVoteState;
  onVote: (id: DisasterId) => void;
}

export default function DisasterVoteOverlay({ voteState, onVote }: DisasterVoteOverlayProps) {
  // Allow keyboard voting (1, 2, 3)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!voteState.isActive) return;
      if (e.key === "1" && voteState.candidates[0]) {
        onVote(voteState.candidates[0].id);
      } else if (e.key === "2" && voteState.candidates[1]) {
        onVote(voteState.candidates[1].id);
      } else if (e.key === "3" && voteState.candidates[2]) {
        onVote(voteState.candidates[2].id);
      }
    },
    [voteState, onVote]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!voteState.isActive && !voteState.activeDisaster) {
    return null;
  }

  // Active Disaster Alert Banner (when strike is incoming)
  if (voteState.activeDisaster && !voteState.isActive) {
    return (
      <div className="disaster-strike-alert animate-hazard-drop">
        <div className="hazard-stripes" />
        <div className="hazard-content">
          <div className="hazard-badge">ARENA HAZARD DEPLOYED</div>
          <h2 className="hazard-title">{voteState.announcement}</h2>
          <p className="hazard-subtitle">AUDIENCE VOTE CONFIRMED • BRACE FOR IMPACT</p>
        </div>
        <div className="hazard-stripes" />
      </div>
    );
  }

  // Active Voting Poll UI
  return (
    <div className="audience-poll-modal animate-slide-up">
      {/* Poll Header Bar */}
      <div className="poll-header">
        <div className="poll-live-indicator">
          <span className="poll-live-beacon" />
          <span className="poll-live-text">AUDIENCE HAZARD VOTE</span>
        </div>
        <div className="poll-countdown">
          POLL CLOSING IN:{" "}
          <span className="poll-seconds">{Math.ceil(voteState.voteTimeLeft)}s</span>
        </div>
      </div>

      <div className="poll-prompt">
        VOTE TO RELEASE ARENA DISASTER ON FIGHTERS [PRESS 1, 2, OR 3]
      </div>

      {/* Candidate Cards Grid */}
      <div className="poll-candidates-row">
        {voteState.candidates.map((cand, idx) => {
          const isUserPick = voteState.userVotedId === cand.id;
          return (
            <button
              key={cand.id}
              className={`poll-candidate-btn ${isUserPick ? "user-voted" : ""}`}
              onClick={() => onVote(cand.id)}
              disabled={!!voteState.userVotedId}
              style={{
                borderColor: isUserPick ? cand.color : "rgba(255, 255, 255, 0.18)",
              }}
            >
              <div className="cand-key-num">KEY {idx + 1}</div>
              <div className="cand-name" style={{ color: cand.color }}>
                {cand.name}
              </div>
              <div className="cand-subtitle">{cand.subtitle}</div>

              {/* Real-time Vote Progress Bar */}
              <div className="cand-bar-wrap">
                <div
                  className="cand-bar-fill"
                  style={{
                    width: `${cand.pct}%`,
                    backgroundColor: cand.color,
                  }}
                />
              </div>

              <div className="cand-stats-row">
                <span className="cand-votes">{cand.votes.toLocaleString()} VOTES</span>
                <span className="cand-pct" style={{ color: cand.color }}>
                  {cand.pct}%
                </span>
              </div>

              {isUserPick && <div className="user-pick-tag">YOUR VOTE CAST</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
