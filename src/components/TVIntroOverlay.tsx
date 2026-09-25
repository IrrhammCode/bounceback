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
        <div className="tv-channel-title">BOUNCE TV // 3v3 REALITY SHOWDOWN</div>
        <button className="tv-skip-btn" onClick={onSkip} title="Skip Intro (Space / Esc)">
          SKIP INTRO <span className="key-hint">[SPACE]</span>
        </button>
      </div>

      {/* Phase 1: Opener Banner (Minimalist, doesn't block viewport) */}
      {phase === "opener" && (
        <div className="tv-opener-banner animate-pop">
          <div className="tv-badge-pill">OFFICIAL MATCH #420</div>
          <h1 className="tv-hero-title">RING-OUT K.O. CHAMPIONSHIP</h1>
          <p className="tv-hero-subtitle">3 VS 3 OLYMPIC ARENA CLASH</p>
        </div>
      )}

      {/* Phase 2: Team Cyan Presentation — 3D Character Spotlight with Floating Badges & Sleek Lower-Third */}
      {phase === "cyan_team" && (
        <>
          {/* Floating Overhead Holographic Tags Pointing Directly to the 3D Players */}
          <div className="tv-overhead-markers">
            <div className="overhead-tag left animate-pop">
              <span className="tag-label">DJ BOUNCE #01</span>
              <span className="tag-arrow">▼</span>
            </div>
            <div className="overhead-tag center captain animate-pop">
              <span className="captain-star">★ CAPTAIN ★</span>
              <span className="tag-label">YOU #07</span>
              <span className="tag-arrow">▼</span>
            </div>
            <div className="overhead-tag right animate-pop">
              <span className="tag-label">NINJA BEAN #02</span>
              <span className="tag-arrow">▼</span>
            </div>
          </div>

          {/* Sleek Broadcast Lower-Third Lineup (Docked at bottom, unobstructed 3D view) */}
          <div className="tv-lower-third cyan animate-slide-up">
            <div className="lower-third-header">
              <span className="team-pill cyan">TEAM CYAN // THE BOUNCING BLUES</span>
              <span className="team-tagline">North Deck Defenders • Fast, Punchy &amp; Relentless</span>
            </div>

            <div className="roster-chips-row">
              {ROSTER_CYAN.map((f, idx) => (
                <FighterChip
                  key={f.id}
                  fighter={f}
                  delay={idx * 0.1}
                  team="cyan"
                  isCaptain={idx === 0}
                />
              ))}
            </div>
          </div>
        </>
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
          <div className="vs-caption">TEAM CYAN  vs  TEAM CORAL // WHO SURVIVES THE RING?!</div>
        </div>
      )}

      {/* Phase 4: Team Coral Presentation — 3D Character Spotlight with Floating Badges & Sleek Lower-Third */}
      {phase === "coral_team" && (
        <>
          {/* Floating Overhead Holographic Tags Pointing Directly to the 3D Players */}
          <div className="tv-overhead-markers coral">
            <div className="overhead-tag left animate-pop">
              <span className="tag-label">HOPPER MAD #02</span>
              <span className="tag-arrow">▼</span>
            </div>
            <div className="overhead-tag center captain coral animate-pop">
              <span className="captain-star">★ RIVAL CAPTAIN ★</span>
              <span className="tag-label">REX CRUSH #01</span>
              <span className="tag-arrow">▼</span>
            </div>
            <div className="overhead-tag right animate-pop">
              <span className="tag-label">SHADY VIP #03</span>
              <span className="tag-arrow">▼</span>
            </div>
          </div>

          {/* Sleek Broadcast Lower-Third Lineup */}
          <div className="tv-lower-third coral animate-slide-up">
            <div className="lower-third-header">
              <span className="team-pill coral">TEAM CORAL // THE RED CRUSHERS</span>
              <span className="team-tagline">South Deck Challengers • Heavy Hitters &amp; Chaos Bringers</span>
            </div>

            <div className="roster-chips-row">
              {ROSTER_CORAL.map((f, idx) => (
                <FighterChip
                  key={f.id}
                  fighter={f}
                  delay={idx * 0.1}
                  team="coral"
                  isCaptain={idx === 0}
                />
              ))}
            </div>
          </div>
        </>
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

      {/* Bottom TV News Ticker */}
      <div className="tv-ticker-bar">
        <div className="ticker-label">BREAKING:</div>
        <div className="ticker-content">
          <span>
            TARGET OBJECTIVE: KNOCK OPPONENTS OFF THE ARENA INTO THE ABYSS • AUTO-AIM PUNCH LOCKS TARGETS • BEWARE THE ROTATING SWEEPER ARM • AUDIENCE DISASTER VOTES FIRE EVERY 30 SECONDS!
          </span>
        </div>
      </div>
    </div>
  );
}

function FighterChip({
  fighter,
  delay,
  team,
  isCaptain,
}: {
  fighter: FighterProfile;
  delay: number;
  team: "cyan" | "coral";
  isCaptain: boolean;
}) {
  return (
    <div
      className={`fighter-chip ${team} ${isCaptain ? "captain-chip" : ""} animate-card-pop`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="chip-badge-col">
        <span className="chip-num">#{fighter.number < 10 ? `0${fighter.number}` : fighter.number}</span>
        <span className="chip-role">{isCaptain ? "CAPTAIN" : "FIGHTER"}</span>
      </div>

      <div className="chip-info-col">
        <div className="chip-name-row">
          <span className="chip-name">{fighter.name}</span>
          <span className="chip-title">{fighter.title}</span>
        </div>
        <p className="chip-quote">"{fighter.quote}"</p>
      </div>

      <div className="chip-stat-col">
        <div className="chip-spec-tag">
          {fighter.statPunch >= 5 ? "POWER HITTER" : fighter.statSpeed >= 5 ? "HIGH AGILITY" : "BALANCED"}
        </div>
      </div>
    </div>
  );
}
