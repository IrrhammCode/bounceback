import { useEffect } from "react";
import { sfxGoal, sfxWhistle } from "../game/audio";
import { RoundResult } from "../game/tournament";

interface ResultScreenProps {
  winner: number;
  scores: [number, number];
  roundWins?: [number, number];
  history?: RoundResult[];
  onRematch: () => void;
  onMenu: () => void;
}

export default function ResultScreen({
  winner,
  scores,
  roundWins = [3, 1],
  history = [],
  onRematch,
  onMenu,
}: ResultScreenProps) {
  useEffect(() => {
    sfxWhistle();
    const t = setTimeout(() => sfxGoal(), 400);
    return () => clearTimeout(t);
  }, []);

  const winnerClass = winner === 0 ? "cyan" : winner === 1 ? "coral" : "draw";
  const winnerText =
    winner === 0
      ? "TEAM CYAN GRAND CHAMPIONS!"
      : winner === 1
        ? "TEAM CORAL GRAND CHAMPIONS!"
        : "CHAMPIONSHIP DRAW!";

  return (
    <div className="screen">
      {/* Animated Background */}
      <div className="bg-arena" aria-hidden="true">
        <div className="neon-grid" />
        <div className="glow-orb cyan" />
        <div className="glow-orb coral" />
      </div>

      <div className="result-card grand-championship-card animate-modal-zoom">
        <div className="trophy-header-badge">
          GRAND CHAMPIONSHIP CUP • 5-ROUND SHOWDOWN
        </div>

        <h1 className={`result-winner ${winnerClass}`}>{winnerText}</h1>

        {/* Series Score Banner */}
        <div className="series-score-hero">
          <div className="series-hero-team cyan">
            <span className="series-hero-name">TEAM CYAN</span>
            <span className="series-hero-wins">{roundWins[0]} WINS</span>
          </div>
          <div className="series-hero-divider">—</div>
          <div className="series-hero-team coral">
            <span className="series-hero-name">TEAM CORAL</span>
            <span className="series-hero-wins">{roundWins[1]} WINS</span>
          </div>
        </div>

        {/* Round by Round Scorecard Table */}
        {history.length > 0 && (
          <div className="round-scorecard-table">
            <div className="table-header-row">
              <span>ROUND</span>
              <span>MAP THEME</span>
              <span>SCORES</span>
              <span>WINNER</span>
            </div>
            {history.map((r) => (
              <div key={r.roundNumber} className="table-data-row">
                <span className="col-round">R{r.roundNumber}</span>
                <span className="col-title">{r.title}</span>
                <span className="col-scores">
                  <span className="c-val">{r.scores[0]}</span> : <span className="r-val">{r.scores[1]}</span>
                </span>
                <span className={`col-win ${r.winner === 0 ? "cyan" : r.winner === 1 ? "coral" : "draw"}`}>
                  {r.winner === 0 ? "CYAN" : r.winner === 1 ? "CORAL" : "TIE"}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="result-actions">
          <button className="btn-play" onClick={onRematch}>
            PLAY NEW CHAMPIONSHIP
          </button>
          <button className="btn-secondary" onClick={onMenu}>
            ← Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
