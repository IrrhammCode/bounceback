import { useEffect } from "react";
import { sfxGoal, sfxWhistle } from "../game/audio";

interface ResultScreenProps {
  winner: number;
  scores: [number, number];
  onRematch: () => void;
  onMenu: () => void;
}

export default function ResultScreen({
  winner,
  scores,
  onRematch,
  onMenu,
}: ResultScreenProps) {
  useEffect(() => {
    sfxWhistle();
    const t = setTimeout(() => sfxGoal(), 400);
    return () => clearTimeout(t);
  }, []);

  const winnerClass =
    winner === 0 ? "cyan" : winner === 1 ? "coral" : "draw";
  const winnerText =
    winner === 0
      ? "CYAN WINS!"
      : winner === 1
        ? "CORAL WINS!"
        : "DRAW!";

  return (
    <div className="screen">
      {/* Animated Background */}
      <div className="bg-arena" aria-hidden="true">
        <div className="neon-grid" />
        <div className="glow-orb cyan" />
        <div className="glow-orb coral" />
      </div>

      <div className="result-card">
        <p
          style={{
            fontFamily: "var(--font-head)",
            fontWeight: 600,
            fontSize: "0.85rem",
            color: "var(--color-bb-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            marginBottom: "8px",
          }}
        >
          Match Over
        </p>

        <h1 className={`result-winner ${winnerClass}`}>{winnerText}</h1>

        <div className="result-score">
          <span className="cyan-score">{scores[0]}</span>
          <span className="vs">—</span>
          <span className="coral-score">{scores[1]}</span>
        </div>

        <div className="result-actions">
          <button className="btn-play" onClick={onRematch}>
            PLAY REMATCH
          </button>
          <button className="btn-secondary" onClick={onMenu}>
            ← Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
