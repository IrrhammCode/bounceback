/**
 * BOUNCE TV — Live Commentary Desk & Hype Meter
 *
 * Features:
 * - Two animated hosts:
 *   1. Bobby Bounce (Hyped-up play-by-play host with headset & golden jacket)
 *   2. Professor Clang (Wild-eyed analyst with spectacles & measuring clipboard)
 * - Dynamic Hype Meter (0-100%) that escalates as points, punches, and combos rack up
 * - 4 Hype Tiers with visual status changes ("WARMING UP" -> "SPICY" -> "CARNAGE" -> "MAX HYPE SHOWTIME")
 * - Reactive speech bubbles with cartoon pop animations and mood-dependent expressions
 */
import { useEffect, useState } from "react";
import { sfxCommentatorGasp } from "../game/audio";

export type CommentaryMood = "normal" | "excited" | "shocked" | "crazy";

interface TVCommentaryBoxProps {
  hypeMeter: number; // 0 - 100
  commentaryText: string;
  commentaryMood: CommentaryMood;
  scores: [number, number];
}

export default function TVCommentaryBox({
  hypeMeter,
  commentaryText,
  commentaryMood,
  scores,
}: TVCommentaryBoxProps) {
  const [activeSpeaker, setActiveSpeaker] = useState<"bobby" | "clang">("bobby");
  const [bubbleKey, setBubbleKey] = useState(0);

  // Switch speakers and play comedic reaction when commentary changes
  useEffect(() => {
    if (!commentaryText) return;
    setBubbleKey((prev) => prev + 1);
    setActiveSpeaker((prev) => (prev === "bobby" ? "clang" : "bobby"));

    if (commentaryMood === "shocked" || commentaryMood === "crazy") {
      sfxCommentatorGasp();
    }
  }, [commentaryText, commentaryMood]);

  // Determine Hype Tier
  const tier =
    hypeMeter >= 85
      ? { label: "MAX HYPE SHOWTIME! 🔥", class: "tier-max", color: "#ff0055" }
      : hypeMeter >= 60
        ? { label: "ABSOLUTE CARNAGE! 💥", class: "tier-high", color: "#ff7700" }
        : hypeMeter >= 30
          ? { label: "GETTING SPICY! ⚡", class: "tier-mid", color: "#ffd166" }
          : { label: "WARMING UP 📺", class: "tier-low", color: "#06d6a0" };

  const isCrazy = commentaryMood === "crazy" || hypeMeter >= 80;

  return (
    <div className={`tv-commentary-desk ${tier.class} ${isCrazy ? "crazy-mode" : ""}`}>
      {/* Top Desk Banner: "ON AIR" + Hype Status */}
      <div className="desk-header">
        <div className="on-air-pill">
          <span className="on-air-lamp" />
          <span>ON AIR</span>
        </div>
        <div className="hype-tier-tag" style={{ color: tier.color }}>
          {tier.label}
        </div>
      </div>

      {/* Dynamic Hype Meter Bar */}
      <div className="hype-meter-wrap">
        <div className="hype-meter-label">
          <span>HYPE METER</span>
          <span className="hype-value">{Math.round(hypeMeter)}%</span>
        </div>
        <div className="hype-meter-track">
          <div
            className="hype-meter-fill"
            style={{
              width: `${Math.min(100, Math.max(5, hypeMeter))}%`,
              background:
                hypeMeter >= 85
                  ? "linear-gradient(90deg, #ff007f, #ffdd00, #00f0ff)"
                  : hypeMeter >= 60
                    ? "linear-gradient(90deg, #ff5268, #ff8c00)"
                    : hypeMeter >= 30
                      ? "linear-gradient(90deg, #ffd166, #ff9f1c)"
                      : "linear-gradient(90deg, #06d6a0, #27e5ff)",
            }}
          >
            <div className="hype-stripes" />
          </div>
        </div>
      </div>

      {/* The Two Commentators and Live Speech Bubble */}
      <div className="desk-body">
        {/* Commentator 1: Bobby Bounce */}
        <div
          className={`commentator-avatar bobby ${activeSpeaker === "bobby" ? "speaking" : ""} mood-${commentaryMood}`}
        >
          <div className="avatar-frame">
            <BobbySvg mood={commentaryMood} isSpeaking={activeSpeaker === "bobby"} />
            <div className="mic-prop">🎙️</div>
          </div>
          <span className="commentator-name">BOBBY</span>
        </div>

        {/* Live Speech Bubble */}
        <div className="commentary-bubble-wrap" key={bubbleKey}>
          <div className={`speech-bubble speaker-${activeSpeaker}`}>
            <div className="bubble-speaker-tag">
              {activeSpeaker === "bobby" ? "🎙️ BOBBY BOUNCE" : "👓 PROF. CLANG"}
            </div>
            <p className="bubble-text">
              {commentaryText ||
                (scores[0] === 0 && scores[1] === 0
                  ? "Selamat datang di BATTLE GONG 3v3! Siapa yang bakal terlempar duluan?!"
                  : `Skor sekarang ${scores[0]} - ${scores[1]}! Pertarungan makin gila!`)}
            </p>
          </div>
        </div>

        {/* Commentator 2: Professor Clang */}
        <div
          className={`commentator-avatar clang ${activeSpeaker === "clang" ? "speaking" : ""} mood-${commentaryMood}`}
        >
          <div className="avatar-frame">
            <ClangSvg mood={commentaryMood} isSpeaking={activeSpeaker === "clang"} />
            <div className="note-prop">📋</div>
          </div>
          <span className="commentator-name">PROF. CLANG</span>
        </div>
      </div>
    </div>
  );
}

// ─── Animated SVG Avatars ───

function BobbySvg({ mood, isSpeaking }: { mood: CommentaryMood; isSpeaking: boolean }) {
  const isShocked = mood === "shocked" || mood === "crazy";
  return (
    <svg viewBox="0 0 100 100" className="avatar-svg bobby-svg">
      {/* Headset Band */}
      <path d="M 20 50 A 30 30 0 0 1 80 50" fill="none" stroke="#222" strokeWidth="6" />
      {/* Headset ear pads */}
      <rect x="14" y="44" width="10" height="18" rx="4" fill="#ffd166" />
      <rect x="76" y="44" width="10" height="18" rx="4" fill="#ffd166" />

      {/* Head */}
      <circle cx="50" cy="54" r="26" fill="#fbcfe8" stroke="#333" strokeWidth="3.5" />

      {/* Golden Jacket Collar */}
      <path d="M 28 78 L 50 92 L 72 78 L 80 100 L 20 100 Z" fill="#ffd166" />
      <path d="M 44 80 L 50 90 L 56 80 Z" fill="#222" />

      {/* Eyes */}
      {isShocked ? (
        <>
          <circle cx="40" cy="48" r="7" fill="#fff" stroke="#111" strokeWidth="2" />
          <circle cx="40" cy="48" r="3" fill="#111" />
          <circle cx="60" cy="48" r="7" fill="#fff" stroke="#111" strokeWidth="2" />
          <circle cx="60" cy="48" r="3" fill="#111" />
        </>
      ) : (
        <>
          <ellipse cx="40" cy="50" rx="4" ry="5" fill="#111" />
          <ellipse cx="60" cy="50" rx="4" ry="5" fill="#111" />
          <circle cx="42" cy="48" r="1.5" fill="#fff" />
          <circle cx="62" cy="48" r="1.5" fill="#fff" />
        </>
      )}

      {/* Eyebrows */}
      {isShocked ? (
        <>
          <path d="M 33 37 Q 40 33 46 38" fill="none" stroke="#222" strokeWidth="3" />
          <path d="M 54 38 Q 60 33 67 37" fill="none" stroke="#222" strokeWidth="3" />
        </>
      ) : (
        <>
          <path d="M 34 42 Q 40 40 46 43" fill="none" stroke="#222" strokeWidth="2.5" />
          <path d="M 54 43 Q 60 40 66 42" fill="none" stroke="#222" strokeWidth="2.5" />
        </>
      )}

      {/* Animated Mouth */}
      {isSpeaking || isShocked ? (
        <path
          d={isShocked ? "M 40 64 Q 50 78 60 64 Z" : "M 42 63 Q 50 72 58 63 Z"}
          fill="#ff0055"
          stroke="#222"
          strokeWidth="2"
        />
      ) : (
        <path d="M 43 64 Q 50 68 57 64" fill="none" stroke="#222" strokeWidth="2.5" />
      )}
    </svg>
  );
}

function ClangSvg({ mood, isSpeaking }: { mood: CommentaryMood; isSpeaking: boolean }) {
  const isShocked = mood === "shocked" || mood === "crazy";
  return (
    <svg viewBox="0 0 100 100" className="avatar-svg clang-svg">
      {/* Head */}
      <circle cx="50" cy="54" r="26" fill="#e0e7ff" stroke="#333" strokeWidth="3.5" />

      {/* Hair (wild scientist tufts) */}
      <path d="M 24 45 Q 16 35 24 25 Q 35 32 32 40" fill="#a5b4fc" />
      <path d="M 76 45 Q 84 35 76 25 Q 65 32 68 40" fill="#a5b4fc" />

      {/* Purple Suit */}
      <path d="M 28 78 L 50 92 L 72 78 L 80 100 L 20 100 Z" fill="#8338ec" />
      <path d="M 45 80 L 50 88 L 55 80 Z" fill="#ff006e" />

      {/* Big Nerdy Round Spectacles */}
      <circle cx="39" cy="51" r="9" fill="rgba(255,255,255,0.7)" stroke="#222" strokeWidth="2.5" />
      <circle cx="61" cy="51" r="9" fill="rgba(255,255,255,0.7)" stroke="#222" strokeWidth="2.5" />
      <line x1="48" y1="51" x2="52" y2="51" stroke="#222" strokeWidth="3" />

      {/* Eyes behind glasses */}
      {isShocked ? (
        <>
          <circle cx="39" cy="51" r="4.5" fill="#111" />
          <circle cx="61" cy="51" r="4.5" fill="#111" />
          {/* Sweat droplet */}
          <path d="M 76 40 Q 79 46 76 48 Q 73 46 76 40" fill="#38bdf8" />
        </>
      ) : (
        <>
          <circle cx="39" cy="51" r="2.5" fill="#111" />
          <circle cx="61" cy="51" r="2.5" fill="#111" />
        </>
      )}

      {/* Animated Mouth */}
      {isSpeaking || isShocked ? (
        <ellipse cx="50" cy="67" rx={isShocked ? "6" : "5"} ry={isShocked ? "7" : "4"} fill="#111" />
      ) : (
        <path d="M 44 67 Q 50 64 56 67" fill="none" stroke="#222" strokeWidth="2.5" />
      )}
    </svg>
  );
}
