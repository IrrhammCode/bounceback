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
      {/* Ambient CRT Vignette */}
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

      {/* 5v5 Overhead Character Badges (Di atas karakter, persingkat biar cukup semua) */}
      {(phase === "cyan_team" || phase === "coral_team") && (
        <div className="tv-overhead-tags-layer">
          {/* Top Broadcast Team Showcase Banner */}
          <div className={`tv-team-top-banner ${phase === "cyan_team" ? "cyan" : "coral"} animate-deck-appear`}>
            <div className={`banner-content-pill ${phase === "cyan_team" ? "cyan" : "coral"}`}>
              <span className="banner-team-name">
                {phase === "cyan_team" ? "TEAM CYAN // THE BOUNCING BLUES" : "TEAM CORAL // THE RED CRUSHERS"}
              </span>
              <span className="banner-divider">•</span>
              <span className="banner-meta">
                {phase === "cyan_team" ? "North Deck Defenders • 5 VS 5 Showcase" : "South Deck Challengers • 5 VS 5 Showcase"}
              </span>
            </div>
          </div>

          {/* Floating Overhead Badges Anchored Right Above Each Character's Head */}
          {phase === "cyan_team" && (
            <>
              {/* Slot 1: TURBO COPTER (Entity 3) */}
              <OverheadBadge5v5
                fighter={ROSTER_CYAN[3]}
                entityIndex={3}
                team="cyan"
                isCaptain={false}
                slotRole="WINGMAN"
                defaultLeft={20}
                delay={0.05}
              />
              {/* Slot 2: DJ BOUNCE (Entity 1) */}
              <OverheadBadge5v5
                fighter={ROSTER_CYAN[1]}
                entityIndex={1}
                team="cyan"
                isCaptain={false}
                slotRole="STRIKER"
                defaultLeft={35}
                delay={0.10}
              />
              {/* Slot 3: YOU (Entity 0) - Center Captain */}
              <OverheadBadge5v5
                fighter={ROSTER_CYAN[0]}
                entityIndex={0}
                team="cyan"
                isCaptain={true}
                slotRole="CAPTAIN"
                defaultLeft={50}
                delay={0.15}
              />
              {/* Slot 4: NINJA BEAN (Entity 2) */}
              <OverheadBadge5v5
                fighter={ROSTER_CYAN[2]}
                entityIndex={2}
                team="cyan"
                isCaptain={false}
                slotRole="FLANKER"
                defaultLeft={65}
                delay={0.20}
              />
              {/* Slot 5: PARTY POPPER (Entity 4) */}
              <OverheadBadge5v5
                fighter={ROSTER_CYAN[4]}
                entityIndex={4}
                team="cyan"
                isCaptain={false}
                slotRole="FINISHER"
                defaultLeft={80}
                delay={0.25}
              />
            </>
          )}

          {phase === "coral_team" && (
            <>
              {/* Slot 1: CYBER BEAST (Entity 9) */}
              <OverheadBadge5v5
                fighter={ROSTER_CORAL[4]}
                entityIndex={9}
                team="coral"
                isCaptain={false}
                slotRole="SWEEPER"
                defaultLeft={20}
                delay={0.05}
              />
              {/* Slot 2: SHADY VIP (Entity 7) */}
              <OverheadBadge5v5
                fighter={ROSTER_CORAL[2]}
                entityIndex={7}
                team="coral"
                isCaptain={false}
                slotRole="DEFENDER"
                defaultLeft={35}
                delay={0.10}
              />
              {/* Slot 3: REX CRUSH (Entity 5) - Center Captain */}
              <OverheadBadge5v5
                fighter={ROSTER_CORAL[0]}
                entityIndex={5}
                team="coral"
                isCaptain={true}
                slotRole="CAPTAIN"
                defaultLeft={50}
                delay={0.15}
              />
              {/* Slot 4: HOPPER MAD (Entity 6) */}
              <OverheadBadge5v5
                fighter={ROSTER_CORAL[1]}
                entityIndex={6}
                team="coral"
                isCaptain={false}
                slotRole="STRIKER"
                defaultLeft={65}
                delay={0.20}
              />
              {/* Slot 5: SPIKE TYRANT (Entity 8) */}
              <OverheadBadge5v5
                fighter={ROSTER_CORAL[3]}
                entityIndex={8}
                team="coral"
                isCaptain={false}
                slotRole="BRUISER"
                defaultLeft={80}
                delay={0.25}
              />
            </>
          )}
        </div>
      )}

      {/* Bottom Broadcast Hub — ONLY the slim news ticker bar, arena completely unobstructed */}
      <div className="tv-bottom-hub">
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

function OverheadBadge5v5({
  fighter,
  entityIndex,
  team,
  isCaptain,
  slotRole,
  defaultLeft,
  delay,
}: {
  fighter: FighterProfile;
  entityIndex: number;
  team: "cyan" | "coral";
  isCaptain: boolean;
  slotRole: string;
  defaultLeft: number;
  delay: number;
}) {
  return (
    <div
      id={`intro-tag-ent-${entityIndex}`}
      className={`overhead-badge-5v5 ${team} ${isCaptain ? "captain-badge" : ""}`}
      style={{
        left: `${defaultLeft}%`,
        top: isCaptain ? "33%" : "36%",
        animationDelay: `${delay}s`,
      }}
    >
      <div className="badge-role-row">
        <span className={`badge-role-pill ${isCaptain ? "captain" : ""}`}>
          {isCaptain ? "CAPTAIN" : slotRole}
        </span>
        <span className="badge-type-pill">
          {fighter.statPunch >= 5 ? "PWR" : fighter.statSpeed >= 5 ? "SPD" : "CHS"}
        </span>
      </div>

      <div className="badge-name-row">
        <span className="badge-num">#{fighter.number < 10 ? `0${fighter.number}` : fighter.number}</span>
        <span className="badge-name">{fighter.name}</span>
      </div>

      <div className="badge-sub-row">
        <span className="badge-title">{fighter.title}</span>
      </div>

      <div className="badge-arrow">▼</div>
    </div>
  );
}
