import React, { useEffect, useCallback } from "react";

interface RoundVictoryOverlayProps {
  winner: number;
  winnerName: string;
  currentRound: number;
  scores: [number, number];
  roundWins: [number, number];
  totalRounds?: number;
  onContinue?: () => void;
}

export const RoundVictoryOverlay: React.FC<RoundVictoryOverlayProps> = ({
  winner,
  winnerName,
  currentRound,
  scores,
  roundWins,
  totalRounds = 5,
  onContinue,
}) => {
  const isCyan = winner === 0;
  const isCoral = winner === 1;
  const isTie = winner < 0;

  const teamColor = isCyan ? "#22d3ee" : isCoral ? "#ff3366" : "#ffd166";
  const teamClass = isCyan ? "winner-cyan" : isCoral ? "winner-coral" : "winner-tie";

  // Allow clicking or pressing space/enter to instantly advance to next round
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Enter" || e.code === "Escape") {
        onContinue?.();
      }
    },
    [onContinue]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const targetWins = Math.ceil(totalRounds / 2); // 3 wins for Best-of-5

  return (
    <div
      className={`round-victory-overlay ${teamClass}`}
      onClick={onContinue}
      title="Click or press Space to proceed to next round"
    >
      {/* Dynamic Animated Ambient Rays in Winner Color */}
      <div className="victory-ambient-glow" style={{ "--glow-color": teamColor } as React.CSSProperties} />
      <div className="victory-radial-speedlines" />

      {/* Main Broadcast Centerpiece */}
      <div className="victory-center-card animate-victory-pop">
        {/* Top TV Championship Ribbon */}
        <div className="victory-round-tag">
          <span className="live-dot-pulse" />
          ESPORTS SHOWDOWN • ROUND {currentRound} FINALE
        </div>

        {/* Vector Animated Trophy / Star Emblem */}
        <div className="victory-emblem-wrap animate-emblem-float">
          <svg width="68" height="68" viewBox="0 0 48 48" fill="none" className="victory-svg-emblem">
            <defs>
              <linearGradient id="vicGold" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fff8db" />
                <stop offset="50%" stopColor="#ffd166" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <radialGradient id="vicAura" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={teamColor} stopOpacity="0.8" />
                <stop offset="100%" stopColor={teamColor} stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Pulsing Aura Circle */}
            <circle cx="24" cy="24" r="22" fill="url(#vicAura)" />
            {/* Laurel Wreath */}
            <path
              d="M10 28 C9 20 13 13 18 10 M8 24 C10 18 14 14 18 12 M38 28 C39 20 35 13 30 10 M40 24 C38 18 34 14 30 12"
              stroke="url(#vicGold)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Victory Cup / Star Trophy */}
            <path
              d="M16 14 H32 V24 C32 28.5 28.5 32 24 32 C19.5 32 16 28.5 16 24 Z"
              fill="url(#vicGold)"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
            <path d="M16 16 H11 C9.5 16 9.5 22 13 23 L16 23" stroke="url(#vicGold)" strokeWidth="2" strokeLinecap="round" />
            <path d="M32 16 H37 C38.5 16 38.5 22 35 23 L32 23" stroke="url(#vicGold)" strokeWidth="2" strokeLinecap="round" />
            <path d="M21 32 H27 V38 H21 Z" fill="url(#vicGold)" />
            <rect x="18" y="38" width="12" height="3" rx="1.5" fill="#ffffff" />
            {/* Star Glint */}
            <polygon points="24,17 25.5,21 30,21 26.5,23.5 28,28 24,25 20,28 21.5,23.5 18,21 22.5,21" fill="#ffffff" />
          </svg>
        </div>

        {/* Big Animated Winner Title */}
        <h1 className="victory-headline-title">
          {isTie ? (
            <span className="title-tie">ROUND {currentRound} DRAW!</span>
          ) : (
            <>
              <span className="title-team" style={{ color: teamColor }}>
                {winnerName}
              </span>{" "}
              <span className="title-takes">WINS ROUND {currentRound}!</span>
            </>
          )}
        </h1>

        {/* Live Arena Score Comparison Bar */}
        <div className="victory-score-pill">
          <div className="score-team cyan">
            <span className="name">TEAM CYAN</span>
            <span className="val">{scores[0]}</span>
          </div>
          <div className="score-divider">VS</div>
          <div className="score-team coral">
            <span className="val">{scores[1]}</span>
            <span className="name">TEAM CORAL</span>
          </div>
        </div>

        {/* Series Standings Stars (Best of 5) */}
        <div className="victory-series-bar">
          <div className="series-label">TOURNAMENT STANDINGS (FIRST TO {targetWins})</div>
          <div className="series-matchup">
            {/* Cyan Side */}
            <div className="series-squad cyan">
              <span className="squad-name">CYAN ({roundWins[0]})</span>
              <div className="squad-stars">
                {Array.from({ length: targetWins }).map((_, idx) => (
                  <span
                    key={`cyan-star-${idx}`}
                    className={`star-pill ${idx < roundWins[0] ? "filled cyan" : "empty"}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
                    </svg>
                  </span>
                ))}
              </div>
            </div>

            <div className="series-hyphen">—</div>

            {/* Coral Side */}
            <div className="series-squad coral">
              <div className="squad-stars">
                {Array.from({ length: targetWins }).map((_, idx) => (
                  <span
                    key={`coral-star-${idx}`}
                    className={`star-pill ${idx < roundWins[1] ? "filled coral" : "empty"}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
                    </svg>
                  </span>
                ))}
              </div>
              <span className="squad-name">CORAL ({roundWins[1]})</span>
            </div>
          </div>
        </div>

        {/* Auto Progress Bar & Fast Forward Prompt */}
        <div className="victory-footer-row">
          <div className="victory-progress-track">
            <div className="victory-progress-bar" />
          </div>
          <div className="victory-prompt-text">
            NEXT ROUND COMMENCING • PRESS <kbd className="kb-chip">[SPACE]</kbd> OR CLICK TO DIVE IN
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoundVictoryOverlay;
