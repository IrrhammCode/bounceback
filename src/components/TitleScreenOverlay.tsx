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
          SEASON 1 • REALITY SHOW SHOWDOWN
        </div>

        <h1 className="title-logo-3d animate-scale-pop">
          <span className="logo-word-1">BOUNCE</span>
          <span className="logo-word-2">BACK!</span>
        </h1>

        <p className="title-tagline animate-fade-in-delayed">
          PUNCH OPPONENTS OFF THE ARENA • SURVIVE LIVE AUDIENCE DISASTERS
        </p>

        {/* Feature Highlight Pills */}
        <div className="title-feature-pills animate-fade-in-delayed">
          <div className="feature-pill">
            <span className="pill-dot cyan" />
            <span className="pill-text">5V5 ARENA BRAWLER</span>
          </div>
          <div className="feature-pill">
            <span className="pill-dot coral" />
            <span className="pill-text">5-ROUND GRAND CHAMPIONSHIP</span>
          </div>
          <div className="feature-pill">
            <span className="pill-dot gold" />
            <span className="pill-text">K.O. & OUT BATTLE STATS</span>
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
            5-ROUND GRAND CHAMPIONSHIP • AUDIENCE DISASTERS: TWISTER TORNADO, METEOR STRIKE, SEISMIC QUAKE, ORBITAL LASER, GRAVITY SINGULARITY • SMASH MYSTERY BOXES FOR POWER SKILLS • TRACK REAL-TIME K.O. AND OUT BATTLE STATS!
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
                X
              </button>
            </div>

            <div className="guide-sections-grid">
              {/* Section 1: 5-Round Series & Ring-Out Scoring */}
              <div className="guide-card">
                <div className="guide-card-header cyan">
                  <span className="card-num">01</span>
                  <h3>5-ROUND TOURNAMENT & K.O.</h3>
                </div>
                <p>
                  Compete in a best-of-5 tournament series across 5 distinct stadiums! Punch opponents over the perimeter ropes into the void abyss to score points with crowd combo multipliers. First team to 3 wins clinches the Golden Trophy!
                </p>
                <div className="guide-callout">
                  <strong>BATTLE STATS:</strong> Real-time K.O. (knockouts scored) and OUT (falls suffered) counters track both team standings and your personal MVP record on your HUD!
                </div>
              </div>

              {/* Section 2: Audience Disaster Voting & Mystery Skills */}
              <div className="guide-card">
                <div className="guide-card-header coral">
                  <span className="card-num">02</span>
                  <h3>AUDIENCE DISASTERS & SKILLS</h3>
                </div>
                <p>
                  Throughout each round, live audience viewers trigger emergency disaster votes! Grab glowing Mystery Boxes in the arena to wield game-changing super skills:
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
                <div className="guide-callout" style={{ marginTop: "12px" }}>
                  <strong>MYSTERY SKILLS:</strong> Giga Fist, Rocket Boost, Giga Magnet, Bounce Bomb, Shrink Zap, and One Punch Man!
                </div>
              </div>

              {/* Section 3: Controls & Camera */}
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
                    <span className="ctrl-name">Punch / Hit (Magnetic Auto-Aim)</span>
                  </div>
                  <div className="ctrl-item">
                    <span className="key-badge">SHIFT</span>
                    <span className="ctrl-name">Speed Dash (Evade / Chase)</span>
                  </div>
                  <div className="ctrl-item">
                    <span className="key-badge">E / Q</span>
                    <span className="ctrl-name">Activate Mystery Skill</span>
                  </div>
                  <div className="ctrl-item">
                    <span className="key-badge">1, 2, 3</span>
                    <span className="ctrl-name">Vote in Audience Polls</span>
                  </div>
                  <div className="ctrl-item">
                    <span className="key-badge">3RD CAM</span>
                    <span className="ctrl-name">Locked 3rd-Person Close Action View</span>
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
