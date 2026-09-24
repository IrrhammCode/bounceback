/**
 * BOUNCE TV — Reality TV Show Title Screen Overlay
 *
 * Professional broadcast-grade typography and graphics.
 * Strictly ZERO emoji AI slop.
 * Renders on top of the live 3D Three.js stadium camera.
 */
import { useState, useEffect, useCallback } from "react";
import { isMuted, setMuted, sfxPunch, resumeAudio } from "../game/audio";
import { ALL_DISASTERS, type DisasterId } from "../game/disasters";

interface TitleScreenOverlayProps {
  onStartMatch: () => void;
}

export default function TitleScreenOverlay({ onStartMatch }: TitleScreenOverlayProps) {
  const [showGuide, setShowGuide] = useState(false);
  const [muted, setMutedState] = useState(isMuted());

  const handleToggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }, [muted]);

  const handleStart = useCallback(() => {
    resumeAudio();
    sfxPunch();
    onStartMatch();
  }, [onStartMatch]);

  // Space / Enter shortcut to start match
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (showGuide) {
        if (e.key === "Escape") setShowGuide(false);
        return;
      }
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        handleStart();
      }
    },
    [handleStart, showGuide]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const disasterList = Object.values(ALL_DISASTERS);

  return (
    <div className="title-screen-overlay">
      {/* Broadcast CRT Vignette & Subtle Scanline Effect */}
      <div className="title-crt-vignette" />

      {/* Top TV Broadcast Studio Bar */}
      <header className="title-header-bar">
        <div className="title-network-brand">
          <span className="net-badge">BOUNCE TV</span>
          <span className="net-subtitle">GLADIATOR ARENA • LIVE FEED</span>
        </div>

        <div className="title-header-right">
          <div className="title-live-indicator">
            <span className="title-live-dot" />
            <span className="title-live-text">ON AIR</span>
          </div>

          <button
            className="title-sound-btn"
            onClick={handleToggleMute}
            title={muted ? "Unmute Audio" : "Mute Audio"}
            aria-label="Toggle Sound"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {muted ? (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </>
              ) : (
                <>
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </>
              )}
            </svg>
            <span className="btn-label">{muted ? "MUTED" : "SOUND ON"}</span>
          </button>
        </div>
      </header>

      {/* Centerpiece Hero Titleplate */}
      <main className="title-center-plate">
        <div className="title-season-tag animate-fade-in">
          ★ SEASON 1 • REALITY SHOW SHOWDOWN ★
        </div>

        <h1 className="title-logo-3d animate-scale-pop">
          <span className="logo-word-1">BOUNCE</span>
          <span className="logo-word-2">BACK!</span>
        </h1>

        <p className="title-tagline animate-fade-in-delayed">
          PUNCH OPPONENTS INTO GIANT GONGS • SURVIVE LIVE AUDIENCE DISASTERS
        </p>

        {/* Feature Highlight Pills */}
        <div className="title-feature-pills animate-fade-in-delayed">
          <div className="feature-pill">
            <span className="pill-dot cyan" />
            <span className="pill-text">3V3 ARENA BRAWLER</span>
          </div>
          <div className="feature-pill">
            <span className="pill-dot coral" />
            <span className="pill-text">AUDIENCE DISASTERS (EVERY 30S)</span>
          </div>
          <div className="feature-pill">
            <span className="pill-dot gold" />
            <span className="pill-text">GIANT GONG SLAM GOALS</span>
          </div>
        </div>

        {/* CTA Button Group */}
        <div className="title-cta-group animate-slide-up-buttons">
          <button className="btn-enter-arena" onClick={handleStart}>
            <span className="btn-glare" />
            <span className="btn-main-text">ENTER ARENA • START MATCH</span>
            <span className="btn-sub-text">PRESS SPACE OR CLICK TO BEGIN</span>
          </button>

          <button
            className="btn-show-guide"
            onClick={() => setShowGuide(true)}
          >
            ARENA RULES & DISASTER GUIDE
          </button>
        </div>
      </main>

      {/* Bottom Live Studio Ticker */}
      <footer className="title-bottom-ticker">
        <div className="ticker-badge">LIVE TICKER</div>
        <div className="ticker-track">
          <span>
            NEXT LIVE ARENA POLL IN 30 SECONDS • AUDIENCE DISASTERS: TWISTER TORNADO, METEOR STRIKE, SEISMIC QUAKE, ORBITAL LASER, GRAVITY SINGULARITY • SMASH MYSTERY BOXES FOR POWER SKILLS • HIT ENEMY GONG TO SCORE POINTS!
          </span>
        </div>
      </footer>

      {/* Interactive Arena Rules & Disasters Guide Modal */}
      {showGuide && (
        <div className="guide-modal-backdrop" onClick={() => setShowGuide(false)}>
          <div
            className="guide-modal-content animate-modal-zoom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="guide-modal-header">
              <div>
                <span className="guide-tag">ARENA BROADCAST MANUAL</span>
                <h2 className="guide-title">HOW TO PLAY & SURVIVE</h2>
              </div>
              <button
                className="guide-close-btn"
                onClick={() => setShowGuide(false)}
                title="Close Guide"
              >
                ✕
              </button>
            </div>

            <div className="guide-sections-grid">
              {/* Section 1: Objective & Gong Scoring */}
              <div className="guide-card">
                <div className="guide-card-header cyan">
                  <span className="card-num">01</span>
                  <h3>THE GONG GOAL</h3>
                </div>
                <p>
                  Punch opponents with high velocity to launch them flying across the stadium turf! Knocking an enemy into their Giant Gong scores points with crowd combo multipliers.
                </p>
                <div className="guide-callout">
                  <strong>TIP:</strong> More bumper bounces before hitting the gong awards up to 3x bonus points!
                </div>
              </div>

              {/* Section 2: Audience Disaster Voting (Every 30s) */}
              <div className="guide-card">
                <div className="guide-card-header coral">
                  <span className="card-num">02</span>
                  <h3>AUDIENCE DISASTERS (EVERY 30S)</h3>
                </div>
                <p>
                  Every 30 seconds, millions of live viewers trigger a 6-second emergency vote! Press Key <strong>1, 2, or 3</strong> to cast your vote. The winning hazard strikes the arena:
                </p>
                <ul className="disaster-bullet-list">
                  {disasterList.map((d) => (
                    <li key={d.id}>
                      <span className="disaster-tag" style={{ borderColor: d.color, color: d.color }}>
                        {d.name}
                      </span>
                      <span className="disaster-desc">{d.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 3: Controls & Skills */}
              <div className="guide-card full-width">
                <div className="guide-card-header gold">
                  <span className="card-num">03</span>
                  <h3>FIGHTER CONTROLS & CAMERA</h3>
                </div>
                <div className="controls-grid">
                  <div className="ctrl-item">
                    <span className="key-badge">W A S D</span>
                    <span className="ctrl-name">Move Fighter</span>
                  </div>
                  <div className="ctrl-item">
                    <span className="key-badge">SPACE</span>
                    <span className="ctrl-name">Punch / Hit Opponents</span>
                  </div>
                  <div className="ctrl-item">
                    <span className="key-badge">SHIFT</span>
                    <span className="ctrl-name">Speed Dash</span>
                  </div>
                  <div className="ctrl-item">
                    <span className="key-badge">E / Q</span>
                    <span className="ctrl-name">Activate Mystery Skill</span>
                  </div>
                  <div className="ctrl-item">
                    <span className="key-badge">C / V</span>
                    <span className="ctrl-name">Toggle Camera (3rd / 1st POV)</span>
                  </div>
                  <div className="ctrl-item">
                    <span className="key-badge">1, 2, 3</span>
                    <span className="ctrl-name">Vote in Audience Polls</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="guide-modal-footer">
              <button
                className="btn-modal-close"
                onClick={() => setShowGuide(false)}
              >
                CLOSE MANUAL [ESC]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
