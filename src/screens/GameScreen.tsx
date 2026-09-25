import { useEffect, useRef, useState, useCallback } from "react";
import { BouncebackEngine, type GameState } from "../game/engine";
import { SkillType } from "../game/skills";
import SkillIcon, { ActionPunchIcon, ActionDashIcon } from "../components/SkillIcon";
import TitleScreenOverlay from "../components/TitleScreenOverlay";
import TVIntroOverlay, { type IntroPhase } from "../components/TVIntroOverlay";
import DisasterVoteOverlay from "../components/DisasterVoteOverlay";
import RoundVictoryOverlay from "../components/RoundVictoryOverlay";
import ResultScreen from "./ResultScreen";
import { type RoundResult } from "../game/tournament";
import { sfxWhistle, sfxGoal, sfxMatchStart } from "../game/audio";

interface GameScreenProps {
  onMatchEnd?: (winner: number, scores: [number, number]) => void;
  onExit?: () => void;
}

type AppMode = "title" | "intro" | "game" | "result";

const initialState: GameState = {
  timer: "3:00",
  rawTimer: 180,
  finalCountdown: 0,
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
  cameraMode: "third_close",
  disasterVoteState: {
    isActive: false,
    voteTimeLeft: 0,
    candidates: [],
    userVotedId: null,
    activeDisaster: null,
    disasterTimeLeft: 0,
    announcement: "",
  },
  currentRound: 1,
  totalRounds: 5,
  roundWins: [0, 0],
  roundTitle: "SUNNY COLOSSEUM",
  roundSubtitle: "ROUND 1: OPENING CLASH",
  roundBadge: "CLASSIC SHOWDOWN",
  roundTheme: "colosseum",
  celebrationBanner: null,
  kos: [0, 0],
  outs: [0, 0],
  playerKo: 0,
  playerOut: 0,
};

export default function GameScreen({ onMatchEnd, onExit }: GameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BouncebackEngine | null>(null);
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [appMode, setAppMode] = useState<AppMode>("title");
  const [seriesResult, setSeriesResult] = useState<{
    winner: number;
    scores: [number, number];
    history: RoundResult[];
    roundWins: [number, number];
  }>({
    winner: 0,
    scores: [0, 0],
    history: [],
    roundWins: [0, 0],
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
      const history = engineRef.current?.tournament.roundHistory || [];
      const roundWins = engineRef.current?.tournament.roundWins || [0, 0];
      setSeriesResult({ winner, scores, history, roundWins });
      setAppMode("result");
      sfxWhistle();
      setTimeout(() => sfxGoal(), 400);
      onMatchEnd?.(winner, scores);
    },
    [onMatchEnd]
  );

  const handleRoundEnd = useCallback((_result: RoundResult) => {
    // Round victory celebration is now directly animated in-arena
  }, []);

  const handleTournamentEnd = useCallback(
    (winner: number, history: RoundResult[], wins: [number, number]) => {
      const lastScores: [number, number] =
        history.length > 0 ? history[history.length - 1].scores : [0, 0];
      setSeriesResult({ winner, scores: lastScores, history, roundWins: wins });
      setAppMode("result");
    },
    []
  );

  // Initialize Engine once on mount with 3D title screen drone camera active
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BouncebackEngine(
      canvasRef.current,
      handleStateChange,
      handleEngineMatchEnd,
      handleRoundEnd,
      handleTournamentEnd
    );
    engineRef.current = engine;
    (window as any).__ENGINE__ = engine;
    engine.init();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [handleStateChange, handleEngineMatchEnd, handleRoundEnd, handleTournamentEnd]);

  // Skip victory celebration and immediately dive into next round
  const handleSkipCelebration = useCallback(() => {
    engineRef.current?.skipRoundCelebration();
  }, []);

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

  // Skill visual triggers & flashes
  const [skillFiredFlash, setSkillFiredFlash] = useState(false);
  const [skillAcquiredFlash, setSkillAcquiredFlash] = useState(false);
  const prevSkillRef = useRef(gameState.playerSkill);

  const hasSkill = gameState.playerSkill !== SkillType.None;

  const handleActivateSkill = useCallback(() => {
    if (gameState.playerSkill === SkillType.None) return;
    setSkillFiredFlash(true);
    setTimeout(() => setSkillFiredFlash(false), 380);
    engineRef.current?.triggerPlayerSkill();
  }, [gameState.playerSkill]);

  // Flash banner when player collects a new power-up box
  useEffect(() => {
    if (gameState.playerSkill !== SkillType.None && prevSkillRef.current === SkillType.None) {
      setSkillAcquiredFlash(true);
      const t = setTimeout(() => setSkillAcquiredFlash(false), 2000);
      return () => clearTimeout(t);
    } else if (gameState.playerSkill === SkillType.None) {
      setSkillAcquiredFlash(false);
    }
    prevSkillRef.current = gameState.playerSkill;
  }, [gameState.playerSkill]);

  // Desktop keyboard activation for E and Q
  useEffect(() => {
    if (appMode !== "game") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.code === "KeyE" || e.code === "KeyQ") && !e.repeat) {
        if (gameState.playerSkill !== SkillType.None) {
          handleActivateSkill();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [appMode, gameState.playerSkill, handleActivateSkill]);

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

  return (
    <div className="screen" style={{ background: "#111625" }}>
      {/* Cinematic Screen Speedlines Flash on Skill Activation */}
      {skillFiredFlash && (
        <div className="skill-activation-speedlines animate-speedlines-pop" />
      )}

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

      {/* 4. Grand Championship Result Overlay */}
      {appMode === "result" && (
        <ResultScreen
          winner={seriesResult.winner}
          scores={seriesResult.scores}
          roundWins={seriesResult.roundWins}
          history={seriesResult.history}
          onRematch={handleRematch}
          onMenu={handleExitToTitle}
        />
      )}

      {/* 6. In-Game HUD Overlay (Only visible during active match) */}
      {appMode === "game" && (
        <div className="hud animate-fade-in">
          {/* Exit match button */}
          <button
            className="exit-btn"
            onClick={handleExitToTitle}
            title="Exit to Title Screen"
          >
            X
          </button>

          {/* Top Bar: Tournament Series Standings + Scoreboard + Timer */}
          <div className="hud-top">
            {/* 5-Round Grand Championship Series Bar */}
            <div className="hud-tournament-bar">
              <div className="series-pips-mini cyan">
                <span className="pips-mini-label">CYAN</span>
                {[0, 1, 2].map((idx) => (
                  <span
                    key={idx}
                    className={`pip-dot-mini cyan ${idx < (gameState.roundWins?.[0] || 0) ? "active" : ""}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={idx < (gameState.roundWins?.[0] || 0) ? "#27e5ff" : "none"} stroke="#27e5ff" strokeWidth="2.5">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </span>
                ))}
              </div>

              <div className="round-indicator-pill">
                <span className="round-pill-num">
                  ROUND {gameState.currentRound || 1} OF {gameState.totalRounds || 5}
                </span>
                <span className="round-pill-badge">{gameState.roundBadge || "CLASSIC SHOWDOWN"}</span>
              </div>

              <div className="series-pips-mini coral">
                {[0, 1, 2].map((idx) => (
                  <span
                    key={idx}
                    className={`pip-dot-mini coral ${idx < (gameState.roundWins?.[1] || 0) ? "active" : ""}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill={idx < (gameState.roundWins?.[1] || 0) ? "#ff5268" : "none"} stroke="#ff5268" strokeWidth="2.5">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </span>
                ))}
                <span className="pips-mini-label">CORAL</span>
              </div>
            </div>

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

            {/* Real-time Esports K.O. & OUT Battle Counter */}
            <div className="hud-battle-stats-row">
              <div className="team-stats-box cyan">
                <span className="stat-pill ko">
                  <span className="pill-tag">K.O.</span>
                  <span className="pill-val">{gameState.kos?.[0] || 0}</span>
                </span>
                <span className="stat-pill out">
                  <span className="pill-tag">OUT</span>
                  <span className="pill-val">{gameState.outs?.[0] || 0}</span>
                </span>
              </div>

              <div className="player-personal-pill">
                <span className="player-badge">YOU</span>
                <span className="player-stat-item">
                  <span className="p-num">{gameState.playerKo || 0}</span>
                  <span className="p-label">K.O.</span>
                </span>
                <span className="p-divider">•</span>
                <span className="player-stat-item">
                  <span className="p-num">{gameState.playerOut || 0}</span>
                  <span className="p-label">OUT</span>
                </span>
              </div>

              <div className="team-stats-box coral">
                <span className="stat-pill ko">
                  <span className="pill-tag">K.O.</span>
                  <span className="pill-val">{gameState.kos?.[1] || 0}</span>
                </span>
                <span className="stat-pill out">
                  <span className="pill-tag">OUT</span>
                  <span className="pill-val">{gameState.outs?.[1] || 0}</span>
                </span>
              </div>
            </div>
          </div>

          {/* In-Game Animated Round Victory Broadcast Overlay */}
          {gameState.celebrationBanner?.isActive && (
            gameState.celebrationBanner.isGrandChampionship ? (
              <div
                className={`round-celebration-banner ${
                  gameState.celebrationBanner.winner === 0
                    ? "team-cyan"
                    : gameState.celebrationBanner.winner === 1
                      ? "team-coral"
                      : "draw"
                } animate-celebration-enter`}
              >
                <div className="celebration-badge">GRAND CHAMPIONSHIP FINALE</div>
                <div className="celebration-title">
                  {gameState.celebrationBanner.winnerName} WINS THE TOURNAMENT!
                </div>
                <div className="celebration-sub">THE CHAMPIONS HOIST THE GOLDEN TROPHY!</div>
              </div>
            ) : (
              <RoundVictoryOverlay
                winner={gameState.celebrationBanner.winner}
                winnerName={gameState.celebrationBanner.winnerName}
                currentRound={gameState.currentRound}
                scores={gameState.scores}
                roundWins={gameState.roundWins}
                totalRounds={gameState.totalRounds}
                onContinue={handleSkipCelebration}
              />
            )
          )}

          {/* Broadcast Center Announcement */}
          {gameState.announcement && (
            <div className="announcer" key={gameState.announcement}>
              {gameState.announcement}
            </div>
          )}

          {/* Golden Power-Up Acquired Full-Center Flash Banner */}
          {skillAcquiredFlash && hasSkill && gameState.playerSkill !== SkillType.None && (
            <div className="skill-acquired-banner animate-powerup-zoom">
              <div className="acq-glow-halo" />
              <div className="acq-icon-wrap">
                <SkillIcon skill={gameState.playerSkill} size={54} />
              </div>
              <div className="acq-tag">MYSTERY POWER-UP READY</div>
              <div className="acq-name">{gameState.playerSkillName}</div>
              <div className="acq-sub">PRESS [E] / [Q] OR CLICK FIRE TO UNLEASH!</div>
            </div>
          )}

          {/* Combo Multiplier Display */}
          {maxCombo > 1 && (
            <div className="combo-display" key={maxCombo}>
              COMBO x{maxCombo}!
            </div>
          )}

          {/* Ultra-Prominent Arcade Skill HUD */}
          <div className={`arcade-skill-hud ${hasSkill ? "skill-ready-pulse" : "skill-empty-slot"}`}>
            <div className="skill-hud-header">
              <span className={`skill-status-tag ${hasSkill ? "ready" : "empty"}`}>
                {hasSkill ? "POWER-UP READY" : "POWER-UP SLOT"}
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
                  <span className="skill-big-icon">
                    <SkillIcon skill={gameState.playerSkill} size={34} />
                  </span>
                ) : (
                  <span className="skill-empty-icon">
                    <SkillIcon skill={SkillType.None} size={30} />
                  </span>
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
                  onClick={handleActivateSkill}
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
                onClick={handleActivateSkill}
              >
                <span className="icon">
                  {hasSkill ? (
                    <SkillIcon skill={gameState.playerSkill} size={24} />
                  ) : (
                    <SkillIcon skill={SkillType.None} size={24} />
                  )}
                </span>
                {hasSkill ? "FIRE" : "SKILL"}
              </button>
              <button id="btnA" className="action-btn punch">
                <span className="icon">
                  <ActionPunchIcon size={24} />
                </span>
                PUNCH
              </button>
              <button id="btnB" className="action-btn dash">
                <span className="icon">
                  <ActionDashIcon size={24} />
                </span>
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
