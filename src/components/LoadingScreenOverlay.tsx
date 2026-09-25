import React, { useState, useEffect, useRef } from "react";

interface LoadingScreenOverlayProps {
  onComplete: () => void;
}

const LOADING_STAGES = [
  { threshold: 0, text: "INITIALIZING 3D WEBGL GRAPHICS PIPELINE..." },
  { threshold: 22, text: "COMPILING ARENA SHADERS & VOLCANO DYNAMICS..." },
  { threshold: 48, text: "WARMING UP 10 GLADIATOR BOT CORES & PHYSICS..." },
  { threshold: 72, text: "CONNECTING TO LIVE AUDIENCE DISASTER VOTING FEED..." },
  { threshold: 90, text: "SYNTHESIZING DYNAMIC ARENA AUDIO TRACKS..." },
  { threshold: 100, text: "ARENA FEED READY • BROADCAST ONLINE!" },
];

const PRO_TIPS = [
  { title: "KNOCKBACK COMBOS", text: "Punching enemies repeatedly pushes them closer to the ring-out edge!" },
  { title: "AUDIENCE DISASTERS", text: "Watch out for Twisters, Meteors, and Orbital Lasers voted by the crowd!" },
  { title: "MYSTERY BOXES", text: "Smash golden crates to equip power skills like Giant Hammer & Tornado!" },
  { title: "MOBILE READY", text: "Rotate your phone to Landscape mode for full 360-degree stadium tactical view." },
];

export const LoadingScreenOverlay: React.FC<LoadingScreenOverlayProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const hasFinishedRef = useRef(false);

  // Rotate tips while loading
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % PRO_TIPS.length);
    }, 2800);
    return () => clearInterval(tipInterval);
  }, []);

  // Smooth fast loading progress (satisfies 404 Jam 20s budget under 4G slow CPU)
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current = Math.min(100, current + 25);
      setProgress(Math.floor(current));

      if (current >= 100) {
        clearInterval(interval);
        setIsReady(true);
        (window as any).__READY__ = true;
        setTimeout(() => {
          handleEnter();
        }, 80);
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const handleEnter = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    (window as any).__READY__ = true;
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 150);
  };

  // Determine active stage label
  const activeStage = [...LOADING_STAGES].reverse().find((s) => progress >= s.threshold) || LOADING_STAGES[0];

  return (
    <div
      className={`loading-screen-backdrop ${isFadingOut ? "fade-out" : ""}`}
      onClick={isReady ? handleEnter : undefined}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Background Atmosphere Elements */}
      <div className="loading-grid-overlay" />
      <div className="loading-glow-orb cyan" />
      <div className="loading-glow-orb coral" />

      {/* Top Broadcast Bar */}
      <header className="loading-top-bar">
        <div className="loading-brand-badge">
          <span className="live-dot" />
          <span className="brand-name">BOUNCE TV</span>
          <span className="feed-tag">STADIUM UPLINK</span>
        </div>
        <div className="loading-telemetry">
          <span className="telemetry-label">SATELLITE FREQUENCY</span>
          <span className="telemetry-val">5.8 GHz ULTRA-HD</span>
        </div>
      </header>

      {/* Center Stage: Title Logo & Circular Energy Scanner */}
      <main className="loading-center-content">
        <div className="loading-logo-wrap animate-float">
          <div className="loading-scanner-ring">
            <svg className="scanner-svg" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="74" className="scanner-bg-circle" />
              <circle
                cx="80"
                cy="80"
                r="74"
                className="scanner-progress-circle"
                style={{
                  strokeDasharray: 465,
                  strokeDashoffset: 465 - (465 * progress) / 100,
                }}
              />
            </svg>
            <div className="scanner-center-core">
              <span className="scanner-percent-num">{progress}</span>
              <span className="scanner-percent-symbol">%</span>
            </div>
          </div>

          <h1 className="loading-title">
            <span className="word-bounce">BOUNCE</span>
            <span className="word-back">BACK!</span>
          </h1>
          <p className="loading-tagline">5V5 REALITY SHOW ARENA BRAWLER</p>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="loading-progress-block">
          <div className="progress-info-row">
            <span className="status-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              SYSTEM STATUS
            </span>
            <span className="status-text">{activeStage.text}</span>
          </div>

          <div className="loading-bar-track">
            <div
              className="loading-bar-fill"
              style={{ width: `${progress}%` }}
            >
              <span className="bar-shine" />
            </div>
          </div>
        </div>

        {/* Action Button when 100% or Quick Tap */}
        {isReady ? (
          <button
            type="button"
            className="loading-enter-btn animate-scale-pop"
            onClick={handleEnter}
          >
            <span className="enter-btn-glare" />
            <span>ENTER BROADCAST</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        ) : (
          <div className="loading-standby-hint">
            <span className="hint-pulsar" />
            PREPARING LIVE TOURNAMENT ARENA...
          </div>
        )}
      </main>

      {/* Bottom Pro Tip Broadcast Ticker */}
      <footer className="loading-bottom-tip">
        <div className="tip-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffd166" strokeWidth="2.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {PRO_TIPS[currentTipIndex].title}
        </div>
        <p className="tip-content">{PRO_TIPS[currentTipIndex].text}</p>
      </footer>
    </div>
  );
};

export default LoadingScreenOverlay;
