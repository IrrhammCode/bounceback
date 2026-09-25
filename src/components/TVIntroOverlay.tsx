/**
 * BOUNCE TV — 3v3 Live Broadcast Match Intro Cutscene & Roster Showcase
 *
 * Features:
 * - Retro-arcade TV scanlines, "ON AIR" broadcast badges, and lower-third ticker
 * - Cinematic sequential presentation of Team Cyan (our team) and Team Coral (rivals)
 * - Animated fighter cards with portraits, nicknames, quotes, and quirky stats
 * - Dynamic "VS" clash explosion with lightning sparks
 * - Dramatic 3... 2... 1... BOUNCE!! countdown with broadcast SFX
 * - Instant Skip button via mouse or Space/Esc key
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
      t = setTimeout(() => setPhase("cyan_team"), 1200);
    } else if (phase === "cyan_team") {
      t = setTimeout(() => {
        setPhase("vs_clash");
        sfxBoxingBell();
      }, 3000);
    } else if (phase === "vs_clash") {
      t = setTimeout(() => setPhase("coral_team"), 1200);
    } else if (phase === "coral_team") {
      t = setTimeout(() => {
        setPhase("countdown");
        setCountdownNum(3);
        sfxTVCountdown(3);
      }, 3000);
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
        <div className="tv-channel-title">BOUNCE TV: 3v3 REALITY SHOWDOWN</div>
        <button className="tv-skip-btn" onClick={onSkip} title="Skip Intro (Space / Esc)">
          SKIP INTRO <span className="key-hint">[SPACE]</span>
        </button>
      </div>

      {/* Phase 1: Opener Card */}
      {phase === "opener" && (
        <div className="tv-opener-banner animate-pop">
          <div className="tv-badge-pill">OFFICIAL MATCH #420</div>
          <h1 className="tv-hero-title">RING-OUT K.O. CHAMPIONSHIP</h1>
          <p className="tv-hero-subtitle">3 VS 3 REALITY TV TOURNAMENT</p>
        </div>
      )}

      {/* Phase 2: Team Cyan Presentation */}
      {phase === "cyan_team" && (
        <div className="tv-roster-showcase cyan-theme">
          <div className="team-banner cyan animate-slide-down">
            <span className="team-tag">TEAM CYAN</span>
            <h2 className="team-name">THE BOUNCING BLUES</h2>
            <p className="team-slogan">Defending North Platform • Fast, Punchy & Relentless</p>
          </div>

          <div className="fighter-cards-grid">
            {ROSTER_CYAN.map((f, idx) => (
              <FighterCard key={f.id} fighter={f} delay={idx * 0.15} team="cyan" />
            ))}
          </div>
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
          <div className="vs-caption">WHO WILL SURVIVE THE RING?!</div>
        </div>
      )}

      {/* Phase 4: Team Coral Presentation */}
      {phase === "coral_team" && (
        <div className="tv-roster-showcase coral-theme">
          <div className="team-banner coral animate-slide-down">
            <span className="team-tag">TEAM CORAL</span>
            <h2 className="team-name">THE RED CRUSHERS</h2>
            <p className="team-slogan">Defending South Platform • Heavy Hitters & Chaos Bringers</p>
          </div>

          <div className="fighter-cards-grid">
            {ROSTER_CORAL.map((f, idx) => (
              <FighterCard key={f.id} fighter={f} delay={idx * 0.15} team="coral" />
            ))}
          </div>
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

      {/* Bottom TV News Ticker */}
      <div className="tv-ticker-bar">
        <div className="ticker-label">BREAKING:</div>
        <div className="ticker-content">
          <span>
            TARGET GOAL: KNOCK OPPONENTS OFF THE ARENA • PUNCH WITH AUTO-AIM ASSIST • BEWARE OF THE ROTATING SWEEPER ARM • AUDIENCE DISASTER VOTES TRIGGER EVERY 30 SECONDS!
          </span>
        </div>
      </div>
    </div>
  );
}

function FighterCard({
  fighter,
  delay,
  team,
}: {
  fighter: FighterProfile;
  delay: number;
  team: "cyan" | "coral";
}) {
  return (
    <div
      className={`fighter-card ${team} animate-card-pop`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="card-top">
        <span className="fighter-jersey">#{fighter.number}</span>
        <span className="fighter-badge">{fighter.id === "cyan_player" ? "CAPTAIN" : "FIGHTER"}</span>
      </div>

      <div className="card-avatar-wrap">
        <div className="card-avatar-halo" />
        <span className="card-avatar-icon font-mono font-bold text-2xl tracking-wider">{fighter.avatarIcon}</span>
      </div>

      <div className="card-info">
        <h3 className="card-name">{fighter.name}</h3>
        <p className="card-title">{fighter.title}</p>
        <p className="card-quote">"{fighter.quote}"</p>
      </div>

      {/* Fighter Mini Stats */}
      <div className="card-stats">
        <div className="stat-row">
          <span>PUNCH</span>
          <div className="stat-bars">
            <div className="stat-meter" style={{ width: `${fighter.statPunch * 20}%` }} />
          </div>
        </div>
        <div className="stat-row">
          <span>SPEED</span>
          <div className="stat-bars">
            <div className="stat-meter" style={{ width: `${fighter.statSpeed * 20}%` }} />
          </div>
        </div>
        <div className="stat-row">
          <span>CHAOS</span>
          <div className="stat-bars">
            <div className="stat-meter" style={{ width: `${fighter.statChaos * 20}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
