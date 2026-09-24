import { useEffect, useRef, useState, useCallback } from "react";
import { BouncebackEngine, type GameState } from "../game/engine";
import { SkillType } from "../game/skills";
import TVIntroOverlay from "../components/TVIntroOverlay";
import DisasterVoteOverlay from "../components/DisasterVoteOverlay";

interface GameScreenProps {
  onMatchEnd: (winner: number, scores: [number, number]) => void;
  onExit: () => void;
}

const initialState: GameState = {
  timer: "1:40",
  scores: [0, 0],
  phase: 1,
  combo: [0, 0],
  over: false,
  winner: -1,
  announcement: "",
  announcementTimer: 0,
  playerSkill: SkillType.None,
  playerSkillName: "",
  playerSkillIcon: "",
  cameraMode: "third_wide",
  disasterVoteState: {
    isActive: false,
    voteTimeLeft: 0,
    candidates: [],
    userVotedId: null,
    activeDisaster: null,
    disasterTimeLeft: 0,
    announcement: "",
  },
};

export default function GameScreen({ onMatchEnd, onExit }: GameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BouncebackEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [showIntro, setShowIntro] = useState(true);

  const handleStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  const handleIntroDone = useCallback(() => {
    setShowIntro(false);
    engineRef.current?.startMatch();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BouncebackEngine(
      canvasRef.current,
      handleStateChange,
      onMatchEnd
    );
    engineRef.current = engine;

    engine.init();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [handleStateChange, onMatchEnd]);

  const timerSecs = parseInt(gameState.timer.split(":")[1] || "0");
  const isUrgent =
    gameState.timer.startsWith("0:") && timerSecs <= 15 && timerSecs > 0;

  const phaseName =
    gameState.phase === 3
      ? "OVERDRIVE"
      : gameState.phase === 2
        ? "PHASE 2"
        : "PHASE 1";

  const maxCombo = Math.max(gameState.combo[0], gameState.combo[1]);
  const hasSkill = gameState.playerSkill !== SkillType.None;

  return (
    <div className="screen" style={{ background: "#111625" }}>
      {/* Three.js Canvas */}
      <canvas ref={canvasRef} className="game-canvas" />

      {/* 3v3 TV Broadcast Match Intro Cutscene Overlay */}
      {showIntro && (
        <TVIntroOverlay
          onComplete={handleIntroDone}
          onSkip={handleIntroDone}
        />
      )}

      {/* Reality TV Live Audience Disaster Vote Overlay */}
      <DisasterVoteOverlay
        voteState={gameState.disasterVoteState}
        onVote={(id) => engineRef.current?.castDisasterVote(id)}
      />

      {/* HUD Overlay — always visible during match */}
      <div className="hud">
        {/* Exit button */}
        <button className="exit-btn" onClick={onExit} title="Exit Match">
          ✕
        </button>

        {/* Camera mode toggle button */}
        <button
          className="cam-toggle-btn"
          onClick={() => engineRef.current?.toggleCamera()}
          title="Toggle Camera (or press C / V)"
        >
          {gameState.cameraMode === "first_person"
            ? "CAM: 1ST POV"
            : gameState.cameraMode === "third_close"
              ? "CAM: 3RD CLOSE"
              : "CAM: 3RD WIDE"}
        </button>

        {/* Top Bar: Scoreboard + Timer */}
        <div className="hud-top">
          <div className="scoreboard">
            <div className="score-team cyan">
              <span className="label">CYN</span>
              {gameState.scores[0]}
            </div>
            <div className="score-divider" />
            <div className={`timer-badge ${isUrgent ? "urgent" : ""}`}>
              {gameState.timer}
              <span
                className={`phase-tag ${gameState.phase === 3 ? "overdrive" : ""}`}
              >
                {phaseName}
              </span>
            </div>
            <div className="score-divider" />
            <div className="score-team coral">
              {gameState.scores[1]}
              <span className="label">CRL</span>
            </div>
          </div>
        </div>

        {/* Announcer */}
        {gameState.announcement && (
          <div className="announcer" key={gameState.announcement}>
            {gameState.announcement}
          </div>
        )}

        {/* Combo Display */}
        {maxCombo > 1 && (
          <div className="combo-display" key={maxCombo}>
            COMBO x{maxCombo}!
          </div>
        )}

        {/* Skill Card HUD Slot */}
        <div className={`skill-slot ${hasSkill ? "has-skill" : ""}`}>
          {hasSkill ? (
            <>
              <span className="skill-icon">{gameState.playerSkillIcon}</span>
              <span className="skill-name">{gameState.playerSkillName}</span>
              <span className="skill-hint">E / Q / RMB</span>
            </>
          ) : (
            <span className="skill-empty">—</span>
          )}
        </div>

        {/* Touch Controls — always rendered so #stick is in DOM for jam.mjs */}
        <div className="touch-controls">
          <div id="stick" />
          <div id="stickbase" />
          <div id="sticknub" />
          <div className="action-buttons">
            <button
              id="btnSkill"
              className={`action-btn skill ${hasSkill ? "ready" : ""}`}
            >
              <span className="icon">
                {hasSkill ? gameState.playerSkillIcon : "POW"}
              </span>
              {hasSkill ? "USE" : "SKILL"}
            </button>
            <button id="btnA" className="action-btn punch">
              <span className="icon">HIT</span>
              PUNCH
            </button>
            <button id="btnB" className="action-btn dash">
              <span className="icon">RUN</span>
              DASH
            </button>
          </div>
        </div>

        {/* Desktop Keyboard Hints */}
        <div className="kb-hints">
          <span>
            <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Move
          </span>
          <span>
            <kbd>Space</kbd> Punch
          </span>
          <span>
            <kbd>Shift</kbd> Dash
          </span>
          <span>
            <kbd>E</kbd> Skill
          </span>
          <span>
            <kbd>C</kbd> Camera
          </span>
        </div>
      </div>
    </div>
  );
}
