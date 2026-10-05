import React, { useEffect, useState } from "react";
import { sfxQuizDing } from "../game/audio";
import { getRoundPalette } from "../game/visual/palettes";

interface GiftTitleCardProps {
  roundNumber: number;
  onDismiss?: () => void;
  durationMs?: number;
}

const KADO_SUBTITLES: Record<number, string> = {
  1: "Kotak kenangan pertama terbuka • Pagi yang hangat di kamar masa kecil",
  2: "Kota balok kardus & rel kereta • Meluncurkan bola ganda melintasi kota",
  3: "Angin sepoi di halaman belakang • Layangan menari riang di langit senja",
  4: "Gemerlap bianglala & musik sirkus • Melompat tinggi di atas trampolin",
  5: "Malam syahdu penuh bintang • \"Sebuah dunia yang menjadi hadiah masa kecil\"",
};

export default function GiftTitleCard({
  roundNumber,
  onDismiss,
  durationMs = 2200,
}: GiftTitleCardProps) {
  const [stage, setStage] = useState<"opening" | "open" | "closing">("opening");
  const palette = getRoundPalette(roundNumber);

  useEffect(() => {
    // Play celebratory quiz ding
    try {
      sfxQuizDing();
    } catch {
      // Audio context might be restricted before user gesture
    }

    const openTimer = setTimeout(() => {
      setStage("open");
    }, 150);

    const closeTimer = setTimeout(() => {
      setStage("closing");
    }, durationMs - 350);

    const endTimer = setTimeout(() => {
      onDismiss?.();
    }, durationMs);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(closeTimer);
      clearTimeout(endTimer);
    };
  }, [roundNumber, durationMs, onDismiss]);

  const handleCardClick = () => {
    setStage("closing");
    setTimeout(() => {
      onDismiss?.();
    }, 200);
  };

  return (
    <div
      className={`gift-title-card-overlay ${stage}`}
      onClick={handleCardClick}
      role="banner"
      aria-label={`Title card for Kado ${roundNumber}`}
    >
      <div className="gift-card-backdrop" />

      <div
        className="gift-card-modal animate-gift-pop"
        style={{
          borderColor: palette.accent,
          boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${palette.primary}44`,
        }}
      >
        {/* Animated Gift Box Unboxing Visual */}
        <div className="gift-box-anim-wrap">
          {/* Confetti & Ribbon Explosion Particles */}
          <div className="gift-burst-particles">
            {[...Array(14)].map((_, i) => (
              <span
                key={i}
                className={`burst-particle p-${i + 1}`}
                style={{
                  backgroundColor: i % 2 === 0 ? palette.primary : palette.accent,
                }}
              />
            ))}
          </div>

          <div className={`gift-box-3d ${stage === "open" ? "unboxed" : ""}`}>
            {/* Popping Lid */}
            <div className="gift-lid">
              <div className="gift-lid-bow">
                <span className="bow-loop left" />
                <span className="bow-knot" />
                <span className="bow-loop right" />
              </div>
              <div className="gift-lid-top" />
            </div>

            {/* Box Body */}
            <div className="gift-body">
              <div className="ribbon-v" />
              <div className="ribbon-h" />
              <div className="gift-core-sparkle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Text Header */}
        <div className="gift-badge-pill" style={{ color: palette.accent }}>
          <span className="gift-badge-star inline-flex items-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 0 15 9 24 12 15 15 12 24 9 15 0 12 9 9 12 0" />
            </svg>
          </span>
          <span>KADO #{roundNumber} DIBUKA</span>
          <span className="gift-badge-star inline-flex items-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 0 15 9 24 12 15 15 12 24 9 15 0 12 9 9 12 0" />
            </svg>
          </span>
        </div>

        <h2 className="gift-main-title" style={{ color: "#ffffff" }}>
          {palette.title.replace(/^KADO #\d+:\s*/, "")}
        </h2>

        <p className="gift-subtitle-text">
          {KADO_SUBTITLES[roundNumber] || palette.subtitle}
        </p>

        <div className="gift-theme-badge">
          <span className="theme-dot" style={{ backgroundColor: palette.primary }} />
          <span>{palette.themeTitle}</span>
        </div>

        <span className="gift-dismiss-hint">Klik layar untuk lanjut</span>
      </div>
    </div>
  );
}
