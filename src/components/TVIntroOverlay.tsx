/**
 * BOUNCE TV — 3v3 Live Broadcast Match Intro Cutscene & Roster Showcase
 *
 * Professional Esports / Fighting Game Broadcast Intro:
 * - Unobstructed 3D viewport showcasing the live animated 3D characters
 * - Floating holographic overhead nameplates pointing to each player model
 * - Sleek broadcast lower-third lineup ticker docked to the bottom
 * - High-impact VS clash & dramatic 3... 2... 1... BOUNCE!! countdown
 * - 100% English broadcast dialog and quotes
 */
import { useEffect, useState, useCallback } from "react";
import { ROSTER_CYAN, ROSTER_CORAL, type FighterProfile } from "../game/config";
import { sfxTVOpener, sfxTVCountdown, sfxBoxingBell } from "../game/audio";

interface TVIntroOverlayProps {
  onComplete: () => void;
  onSkip: () => void;
  onPhaseChange?: (phase: IntroPhase) => void;
}

export type IntroPhase = "opener" | "cyan_team" | "vs_clash" | "coral_team" | "countdown";

export default function TVIntroOverlay({ onComplete, onSkip, onPhaseChange }: TVIntroOverlayProps) {
  const [phase, setPhase] = useState<IntroPhase>("opener");
  const [countdownNum, setCountdownNum] = useState<number>(3);

  // Play opening TV fanfare on mount and notify phase
  useEffect(() => {
    sfxTVOpener();
    onPhaseChange?.("opener");
  }, [onPhaseChange]);

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  // Keyboard shortcut for skipping
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "Escape" || e.code === "Enter") {
        onSkip();
      }
    },
    [onSkip]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Phase sequencing timers
  useEffect(() => {
    let t: NodeJS.Timeout;

    if (phase === "opener") {
      t = setTimeout(() => setPhase("cyan_team"), 1300);
    } else if (phase === "cyan_team") {
      t = setTimeout(() => {
        setPhase("vs_clash");
        sfxBoxingBell();
      }, 3400);
    } else if (phase === "vs_clash") {
      t = setTimeout(() => setPhase("coral_team"), 1300);
    } else if (phase === "coral_team") {
      t = setTimeout(() => {
        setPhase("countdown");
        setCountdownNum(3);
        sfxTVCountdown(3);
      }, 3400);
    } else if (phase === "countdown") {
      if (countdownNum > 1) {
        t = setTimeout(() => {
          setCountdownNum((prev) => {
            const next = prev - 1;
            sfxTVCountdown(next);
            return next;
          });
        }, 850);
      } else if (countdownNum === 1) {
        t = setTimeout(() => {
          setCountdownNum(0); // 0 = BOUNCE!
          sfxTVCountdown(0);
        }, 850);
      } else {
        // Finished!
        t = setTimeout(() => {
          onComplete();
        }, 650);
      }
    }

    return () => clearTimeout(t);
  }, [phase, countdownNum, onComplete]);

  return (
    <div className="tv-intro-overlay">
      {/* TV Screen Scanlines & Ambient CRT Vignette */}
      <div className="tv-scanlines" />
      <div className="tv-vignette" />

      {/* Top TV Broadcast Header */}
      <div className="tv-header-bar">
        <div className="tv-live-badge">
          <span className="live-dot" />
          <span className="live-text">LIVE BROADCAST</span>
        </div>
        <div className="tv-channel-title">BOUNCE TV // 5v5 REALITY SHOWDOWN</div>
        <button className="tv-skip-btn" onClick={onSkip} title="Skip Intro (Space / Esc)">
          SKIP INTRO <span className="key-hint">[SPACE]</span>
        </button>
      </div>

      {/* Center Stage for Opener, VS Clash, and Countdown */}
      <div className="tv-center-stage">
        {/* Phase 1: Opener Banner */}
        {phase === "opener" && (
          <div className="tv-opener-banner animate-pop">
            <div className="tv-badge-pill">OFFICIAL 5V5 MATCH #420</div>
            <h1 className="tv-hero-title">RING-OUT K.O. CHAMPIONSHIP</h1>
            <p className="tv-hero-subtitle">5 VS 5 OLYMPIC ARENA CLASH</p>
          </div>
        )}

        {/* Phase 3: Explosive VS Clash */}
        {phase === "vs_clash" && (
          <div className="tv-vs-clash animate-scale-bang">
            <div className="vs-lightning-left" />
            <div className="vs-emblem-wrap">
              <div className="vs-ring" />
              <h1 className="vs-text">VS</h1>
            </div>
            <div className="vs-lightning-right" />
            <div className="vs-caption">TEAM CYAN  vs  TEAM CORAL // 5v5 RING-OUT SHOWDOWN!</div>
          </div>
        )}

        {/* Phase 5: Live Dramatic Countdown */}
        {phase === "countdown" && (
          <div className="tv-countdown-wrap">
            {countdownNum > 0 ? (
              <div className="countdown-number animate-zoom-beat" key={countdownNum}>
                <span className="num">{countdownNum}</span>
                <span className="sub">
                  {countdownNum === 3 ? "READY!" : countdownNum === 2 ? "SET!" : "SMASH!"}
                </span>
              </div>
            ) : (
              <div className="countdown-go animate-boom" key="go">
                <span className="go-text">BOUNCE &amp; SCORE!</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Broadcast Hub (Docked 5v5 Lower-Third & News Ticker) */}
      <div className="tv-bottom-hub">
        {/* Phase 2: Team Cyan Presentation — Symmetrical 5-Fighter Lineup */}
        {phase === "cyan_team" && (
          <div className="tv-lower-third cyan animate-deck-appear">
            <div className="lower-third-header-bar cyan">
              <div className="header-accent-line left" />
              <span className="team-pill cyan">TEAM CYAN // THE BOUNCING BLUES</span>
              <span className="team-meta-desc">North Deck Defenders • 5v5 Fast &amp; Relentless</span>
              <div className="header-accent-line right" />
            </div>

            <div className="roster-grid-5v5">
              {/* Slot 1 (Far Left 3D): TURBO COPTER (#04) */}
              <FighterChip5v5
                fighter={ROSTER_CYAN[3]}
                delay={0.05}
                team="cyan"
                isCaptain={false}
                slotRole="WINGMAN"
              />
              {/* Slot 2 (Left Inner 3D): DJ BOUNCE (#01) */}
              <FighterChip5v5
                fighter={ROSTER_CYAN[1]}
                delay={0.10}
                team="cyan"
                isCaptain={false}
                slotRole="STRIKER"
              />
              {/* Slot 3 (Center Vanguard 3D): YOU (#07) CAPTAIN */}
              <FighterChip5v5
                fighter={ROSTER_CYAN[0]}
                delay={0.15}
                team="cyan"
                isCaptain={true}
                slotRole="CAPTAIN"
              />
              {/* Slot 4 (Right Inner 3D): NINJA BEAN (#02) */}
              <FighterChip5v5
                fighter={ROSTER_CYAN[2]}
                delay={0.20}
                team="cyan"
                isCaptain={false}
                slotRole="FLANKER"
              />
              {/* Slot 5 (Far Right 3D): PARTY POPPER (#05) */}
              <FighterChip5v5
                fighter={ROSTER_CYAN[4]}
                delay={0.25}
                team="cyan"
                isCaptain={false}
                slotRole="FINISHER"
              />
            </div>
          </div>
        )}

        {/* Phase 4: Team Coral Presentation — Symmetrical 5-Fighter Lineup */}
        {phase === "coral_team" && (
          <div className="tv-lower-third coral animate-deck-appear">
            <div className="lower-third-header-bar coral">
              <div className="header-accent-line left" />
              <span className="team-pill coral">TEAM CORAL // THE RED CRUSHERS</span>
              <span className="team-meta-desc">South Deck Challengers • 5v5 Heavy Hitters &amp; Chaos</span>
              <div className="header-accent-line right" />
            </div>

            <div className="roster-grid-5v5">
              {/* Slot 1 (Far Left 3D): SPIKE TYRANT (#04) */}
              <FighterChip5v5
                fighter={ROSTER_CORAL[3]}
                delay={0.05}
                team="coral"
                isCaptain={false}
                slotRole="BRUISER"
              />
              {/* Slot 2 (Left Inner 3D): HOPPER MAD (#02) */}
              <FighterChip5v5
                fighter={ROSTER_CORAL[1]}
                delay={0.10}
                team="coral"
                isCaptain={false}
                slotRole="STRIKER"
              />
              {/* Slot 3 (Center Vanguard 3D): REX CRUSH (#01) CAPTAIN */}
              <FighterChip5v5
                fighter={ROSTER_CORAL[0]}
                delay={0.15}
                team="coral"
                isCaptain={true}
                slotRole="CAPTAIN"
              />
              {/* Slot 4 (Right Inner 3D): SHADY VIP (#03) */}
              <FighterChip5v5
                fighter={ROSTER_CORAL[2]}
                delay={0.20}
                team="coral"
                isCaptain={false}
                slotRole="DEFENDER"
              />
              {/* Slot 5 (Far Right 3D): CYBER BEAST (#05) */}
              <FighterChip5v5
                fighter={ROSTER_CORAL[4]}
                delay={0.25}
                team="coral"
                isCaptain={false}
                slotRole="SWEEPER"
              />
            </div>
          </div>
        )}

        {/* Bottom TV News Ticker */}
        <div className="tv-ticker-bar">
          <div className="ticker-label">BREAKING:</div>
          <div className="ticker-content">
            <span>
              5VS5 ARENA OBJECTIVE: KNOCK OPPONENTS OFF THE ARENA INTO THE ABYSS • AUTO-AIM PUNCH LOCKS TARGETS • BEWARE ROTATING SWEEPER ARM • AUDIENCE DISASTER VOTES FIRE EVERY 30 SECONDS!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FighterChip5v5({
  fighter,
  delay,
  team,
  isCaptain,
  slotRole,
}: {
  fighter: FighterProfile;
  delay: number;
  team: "cyan" | "coral";
  isCaptain: boolean;
  slotRole: string;
}) {
  return (
    <div
      className={`fighter-card-5v5 ${team} ${isCaptain ? "captain-card" : ""}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="card-top-row">
        <span className="jersey-num">#{fighter.number < 10 ? `0${fighter.number}` : fighter.number}</span>
        <span className={`role-badge ${isCaptain ? "captain" : ""}`}>
          {isCaptain ? "★ CAPTAIN" : slotRole}
        </span>
      </div>

      <div className="card-identity">
        <span className="fighter-name">{fighter.name}</span>
        <span className="fighter-title">{fighter.title}</span>
      </div>

      <p className="fighter-quote">"{fighter.quote}"</p>

      <div className="card-bottom-row">
        <span className="archetype-tag">
          {fighter.statPunch >= 5 ? "POWER" : fighter.statSpeed >= 5 ? "AGILE" : "CHAOS"}
        </span>
      </div>
    </div>
  );
}
