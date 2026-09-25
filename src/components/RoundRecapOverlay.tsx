import { useState, useEffect } from "react";
import { RoundResult, RoundDef, TOURNAMENT_ROUNDS } from "../game/tournament";
import {
  sfxWhistle,
  sfxRoundTransitionWhoosh,
  sfxStarDing,
  sfxConfettiPop,
} from "../game/audio";

interface RoundRecapOverlayProps {
  roundResult: RoundResult;
  roundWins: [number, number];
  onNextRound: () => void;
}

export default function RoundRecapOverlay({
  roundResult,
  roundWins,
  onNextRound,
}: RoundRecapOverlayProps) {
  const [countdown, setCountdown] = useState(4);

  const nextRoundNumber = roundResult.roundNumber + 1;
  const nextRoundDef: RoundDef =
    TOURNAMENT_ROUNDS[nextRoundNumber] || TOURNAMENT_ROUNDS[1];

  const winner = roundResult.winner;
  const winnerName =
    winner === 0 ? "TEAM CYAN" : winner === 1 ? "TEAM CORAL" : "TIED ROUND";
  const winnerColor =
    winner === 0 ? "#27e5ff" : winner === 1 ? "#ff5268" : "#ffd166";

  useEffect(() => {
    sfxRoundTransitionWhoosh();
    setTimeout(() => {
      sfxWhistle();
      sfxConfettiPop();
    }, 180);

    const winningTeamIdx = winner === 0 ? 0 : winner === 1 ? 1 : -1;
    if (winningTeamIdx >= 0) {
      setTimeout(() => {
        sfxStarDing(roundWins[winningTeamIdx]);
      }, 550);
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          sfxRoundTransitionWhoosh();
          onNextRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onNextRound, winner, roundWins]);

  const handleManualAdvance = () => {
    sfxRoundTransitionWhoosh();
    onNextRound();
  };

  return (
    <div className="round-recap-screen animate-modal-zoom">
      <div className="round-recap-card">
        {/* TV Header Badge */}
        <div className="recap-broadcast-badge">
          ESPORTS GRAND CHAMPIONSHIP • ROUND {roundResult.roundNumber} CONCLUSION
        </div>

        {/* Round Winner Title */}
        <h1 className="recap-winner-title" style={{ color: winnerColor }}>
          {winnerName} TAKES ROUND {roundResult.roundNumber}!
        </h1>

        {/* Round Score Bar */}
        <div className="recap-score-bar">
          <div className="recap-team-box cyan">
            <span className="recap-team-name">TEAM CYAN</span>
            <span className="recap-score-val">{roundResult.scores[0]}</span>
          </div>
          <div className="recap-vs">VS</div>
          <div className="recap-team-box coral">
            <span className="recap-team-name">TEAM CORAL</span>
            <span className="recap-score-val">{roundResult.scores[1]}</span>
          </div>
        </div>

        {/* Series Pips / Standings */}
        <div className="recap-series-standings">
          <div className="series-title">BEST-OF-5 TOURNAMENT SERIES</div>
          <div className="series-pips-row">
            <div className="pips-group cyan">
              <span className="pips-label">CYAN ({roundWins[0]})</span>
              <div className="pips-dots">
                {[0, 1, 2].map((idx) => (
                  <span
                    key={idx}
                    className={`pip-star cyan ${idx < roundWins[0] ? "filled" : ""}`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill={idx < roundWins[0] ? "#27e5ff" : "none"} stroke="#27e5ff" strokeWidth="2.5">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </span>
                ))}
              </div>
            </div>

            <div className="series-divider">—</div>

            <div className="pips-group coral">
              <span className="pips-label">CORAL ({roundWins[1]})</span>
              <div className="pips-dots">
                {[0, 1, 2].map((idx) => (
                  <span
                    key={idx}
                    className={`pip-star coral ${idx < roundWins[1] ? "filled" : ""}`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill={idx < roundWins[1] ? "#ff5268" : "none"} stroke="#ff5268" strokeWidth="2.5">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Up Next: Next Round Teaser Card */}
        <div className="next-round-preview-card">
          <div className="next-round-tag">UP NEXT: ROUND {nextRoundNumber}</div>
          <h2 className="next-round-title">{nextRoundDef.title}</h2>
          <div className="next-round-badge" style={{ backgroundColor: nextRoundDef.themeColor }}>
            {nextRoundDef.badge}
          </div>
          <p className="next-round-desc">{nextRoundDef.description}</p>
        </div>

        {/* Action Button & Countdown */}
        <div className="recap-actions-row">
          <button className="btn-next-round" onClick={handleManualAdvance}>
            START ROUND {nextRoundNumber} NOW ({countdown}s) →
          </button>
        </div>
      </div>
    </div>
  );
}
