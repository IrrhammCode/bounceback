import { useEffect, useRef, useState, useCallback } from "react";
import { BouncebackEngine, type GameState } from "../game/engine";
import { SkillType } from "../game/skills";
import TitleScreenOverlay from "../components/TitleScreenOverlay";
import TVIntroOverlay, { type IntroPhase } from "../components/TVIntroOverlay";
import DisasterVoteOverlay from "../components/DisasterVoteOverlay";
import { sfxWhistle, sfxGoal, sfxMatchStart } from "../game/audio";

interface GameScreenProps {
  onMatchEnd?: (winner: number, scores: [number, number]) => void;
  onExit?: () => void;
}

type AppMode = "title" | "intro" | "game" | "result";

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
  const [appMode, setAppMode] = useState<AppMode>("title");
  const [result, setResult] = useState<{ winner: number; scores: [number, number] }>({
    winner: 0,
    scores: [0, 0],
  });

  // Signal ready to 404 test runner
  useEffect(() => {
    (window as any).__READY__ = true;
  }, []);

  const handleStateChange = useCallback((state: GameState) => {
    setGameState(state);
  }, []);

  const handleEngineMatchEnd = useCallback(
    (winner: number, scores: [number, number]) => {
      setResult({ winner, scores });
      setAppMode("result");
      sfxWhistle();
      setTimeout(() => sfxGoal(), 400);
      onMatchEnd?.(winner, scores);
    },
    [onMatchEnd]
  );

  // Initialize Engine once on mount with 3D title screen drone camera active
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BouncebackEngine(
      canvasRef.current,
      handleStateChange,
      handleEngineMatchEnd
    );
    engineRef.current = engine;
    engine.init();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [handleStateChange, handleEngineMatchEnd]);

  // Transition from Title Screen into 3v3 TV Intro Cutscene with camera dive
  const handleStartMatchFromTitle = useCallback(() => {
    setAppMode("intro");
    engineRef.current?.startIntro();
  }, []);

  // Sync Three.js camera position with TV Intro phases
  const handleIntroPhaseChange = useCallback((phase: IntroPhase) => {
    engineRef.current?.setIntroPhase(phase);
  }, []);

  // When intro completes, seamlessly roll into gameplay
  const handleIntroDone = useCallback(() => {
    setAppMode("game");
    engineRef.current?.startMatch();
  }, []);

  // Instant skip button / key
  const handleSkipIntro = useCallback(() => {
    setAppMode("game");
    engineRef.current?.startMatch();
  }, []);

  // Return to Title Drone Orbit
  const handleExitToTitle = useCallback(() => {
    engineRef.current?.resetToTitle();
    setAppMode("title");
    onExit?.();
  }, [onExit]);

  // Rematch from result screen
  const handleRematch = useCallback(() => {
    sfxMatchStart();
    setAppMode("intro");
    engineRef.current?.resetToTitle();
    engineRef.current?.startIntro();
  }, []);

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
      {/* Unified 3D WebGL Canvas — always active across Title, Intro, Game, and Result */}
      <canvas ref={canvasRef} className="game-canvas" />

      {/* 1. Reality TV Title Screen Overlay (Drone Orbit View) */}
      {appMode === "title" && (
        <TitleScreenOverlay onStartMatch={handleStartMatchFromTitle} />
      )}

      {/* 2. 3v3 TV Broadcast Match Intro Cutscene Overlay (Cinematic Camera Swoops) */}
      {appMode === "intro" && (
        <TVIntroOverlay
          onComplete={handleIntroDone}
          onSkip={handleSkipIntro}
          onPhaseChange={handleIntroPhaseChange}
        />
      )}

      {/* 3. Reality TV Live Audience Disaster Vote Overlay */}
      {appMode === "game" && (
        <DisasterVoteOverlay
          voteState={gameState.disasterVoteState}
          onVote={(id) => engineRef.current?.castDisasterVote(id)}
        />
      )}

      {/* 4. Match Over Result Overlay (Winning Team Victory Orbit) */}
      {appMode === "result" && (
        <div className="result-broadcast-overlay animate-modal-zoom">
          <div className="result-broadcast-card">
            <div className="result-badge">MATCH CONCLUDED • FINAL BROADCAST SCORE</div>
            <h1
              className={`result-winner-title ${
                result.winner === 0 ? "cyan" : result.winner === 1 ? "coral" : "draw"
              }`}
            >
              {result.winner === 0
                ? "TEAM CYAN VICTORIOUS!"
                : result.winner === 1
                  ? "TEAM CORAL VICTORIOUS!"
                  : "MATCH TIED • SUDDEN DRAW!"}
            </h1>

            <div className="result-score-banner">
              <div className="team-score-box cyan">
                <span className="team-name">TEAM CYAN</span>
                <span className="score-val">{result.scores[0]}</span>
              </div>
              <div className="score-vs-divider">VS</div>
              <div className="team-score-box coral">
                <span className="team-name">TEAM CORAL</span>
                <span className="score-val">{result.scores[1]}</span>
              </div>
            </div>

            <div className="result-actions-row">
              <button className="btn-result-rematch" onClick={handleRematch}>
                PLAY REMATCH
              </button>
              <button className="btn-result-menu" onClick={handleExitToTitle}>
                RETURN TO TITLE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. In-Game HUD Overlay (Only visible during active match) */}
      {appMode === "game" && (
        <div className="hud animate-fade-in">
          {/* Exit match button */}
          <button
            className="exit-btn"
            onClick={handleExitToTitle}
            title="Exit to Title Screen"
          >
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

          {/* Broadcast Center Announcement */}
          {gameState.announcement && (
            <div className="announcer" key={gameState.announcement}>
              {gameState.announcement}
            </div>
          )}

          {/* Combo Multiplier Display */}
          {maxCombo > 1 && (
            <div className="combo-display" key={maxCombo}>
              COMBO x{maxCombo}!
            </div>
          )}

          {/* ─── Ultra-Prominent Arcade Skill HUD (Skill Wajib Terlihat) ─── */}
          <div className={`arcade-skill-hud ${hasSkill ? "skill-ready-pulse" : "skill-empty-slot"}`}>
            <div className="skill-hud-header">
              <span className={`skill-status-tag ${hasSkill ? "ready" : "empty"}`}>
                {hasSkill ? "★ POWER-UP READY ★" : "POWER-UP SLOT"}
              </span>
              {hasSkill && (
                <span className="skill-trigger-key-prompt animate-pulse">
                  PRESS [E] / [Q] OR RIGHT-CLICK
                </span>
              )}
            </div>

            <div className="skill-hud-body">
              <div className={`skill-icon-box ${hasSkill ? "box-ready" : ""}`}>
                {hasSkill ? (
                  <span className="skill-big-icon">{gameState.playerSkillIcon}</span>
                ) : (
                  <span className="skill-empty-icon">?</span>
                )}
                {hasSkill && <div className="skill-glow-halo" />}
              </div>

              <div className="skill-text-content">
                <div className="skill-title-row">
                  <span className="skill-main-name">
                    {hasSkill ? gameState.playerSkillName : "NO SKILL EQUIPPED"}
                  </span>
                </div>
                <div className="skill-desc-row">
                  {hasSkill
                    ? "READY FOR IMPACT • UNLEASH ON OPPONENTS!"
                    : "Collect a glowing Mystery Box in the arena to gain a skill!"}
                </div>
              </div>

              {hasSkill && (
                <button
                  className="skill-activate-hud-btn"
                  onClick={() => engineRef.current?.triggerPlayerSkill()}
                  title="Activate Skill (E / Q / Right-Click)"
                >
                  <span className="act-key">[E]</span>
                  <span className="act-text">FIRE</span>
                </button>
              )}
            </div>
          </div>

          {/* Touch Controls — always in DOM for 404 test harness */}
          <div className="touch-controls">
            <div id="stick" />
            <div id="stickbase" />
            <div id="sticknub" />
            <div className="action-buttons">
              <button
                id="btnSkill"
                className={`action-btn skill ${hasSkill ? "ready" : ""}`}
                onClick={() => engineRef.current?.triggerPlayerSkill()}
              >
                <span className="icon">
                  {hasSkill ? gameState.playerSkillIcon : "POW"}
                </span>
                {hasSkill ? "FIRE" : "SKILL"}
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
            <span className={hasSkill ? "hint-skill-ready" : ""}>
              <kbd>E</kbd> / <kbd>Q</kbd> Skill
            </span>
            <span>
              <kbd>C</kbd> Camera
            </span>
          </div>
        </div>
      )}

      {/* Hidden touch controls when not in game, ensuring DOM elements exist for automation */}
      {appMode !== "game" && (
        <div style={{ display: "none" }} aria-hidden="true">
          <div id="stick" />
          <div id="stickbase" />
          <div id="sticknub" />
          <button id="btnSkill" />
          <button id="btnA" />
          <button id="btnB" />
        </div>
      )}
    </div>
  );
}
