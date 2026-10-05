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

  const totalCyanKo = history.reduce((acc, r) => acc + (r.kos?.[0] || 0), 0);
  const totalCyanOut = history.reduce((acc, r) => acc + (r.outs?.[0] || 0), 0);
  const totalCoralKo = history.reduce((acc, r) => acc + (r.kos?.[1] || 0), 0);
  const totalCoralOut = history.reduce((acc, r) => acc + (r.outs?.[1] || 0), 0);
  const totalPlayerKo = history.reduce((acc, r) => acc + (r.playerKo || 0), 0);
  const totalPlayerOut = history.reduce((acc, r) => acc + (r.playerOut || 0), 0);

  return (
    <div className="screen result-screen-wrap">
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

        <div className="tripothon-gift-quote">
          <span className="quote-icon inline-flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12" />
              <rect x="2" y="7" width="20" height="5" />
              <line x1="12" y1="22" x2="12" y2="7" />
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
            </svg>
          </span>
          <em>"This world was a gift to me as a kid."</em>
        </div>

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

        {/* Tournament Total Knockout & Out Aggregates */}
        <div className="series-combat-totals">
          <div className="totals-team cyan">
            <span className="totals-label">CYAN TOTALS</span>
            <span className="totals-val">{totalCyanKo} K.O. • {totalCyanOut} OUT</span>
          </div>

          <div className="totals-player">
            <span className="totals-player-title">YOUR PERSONAL RECORD</span>
            <span className="totals-player-val">{totalPlayerKo} K.O. • {totalPlayerOut} OUT</span>
          </div>

          <div className="totals-team coral">
            <span className="totals-label">CORAL TOTALS</span>
            <span className="totals-val">{totalCoralKo} K.O. • {totalCoralOut} OUT</span>
          </div>
        </div>

        {/* Round by Round Scorecard Table */}
        {history.length > 0 && (
          <div className="round-scorecard-table">
            <div className="table-header-row">
              <span>ROUND</span>
              <span>MAP THEME</span>
              <span>SCORES</span>
              <span>K.O. / OUT</span>
              <span>WINNER</span>
            </div>
            {history.map((r) => (
              <div key={r.roundNumber} className="table-data-row">
                <span className="col-round">R{r.roundNumber}</span>
                <span className="col-title">{r.title}</span>
                <span className="col-scores">
                  <span className="c-val">{r.scores[0]}</span> : <span className="r-val">{r.scores[1]}</span>
                </span>
                <span className="col-ko-out">
                  <span className="c-ko">{r.kos?.[0] || 0}/{r.outs?.[0] || 0}</span>
                  <span className="ko-div">vs</span>
                  <span className="r-ko">{r.kos?.[1] || 0}/{r.outs?.[1] || 0}</span>
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
