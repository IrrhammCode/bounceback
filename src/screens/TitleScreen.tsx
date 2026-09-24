import { useEffect, useState } from "react";
import { resumeAudio, sfxMatchStart } from "../game/audio";
import { isMuted, setMuted } from "../game/audio";

interface TitleScreenProps {
  onPlay: () => void;
}

const RULES = [
  {
    icon: "👊",
    iconClass: "coral",
    text: (
      <>
        <strong>Punch</strong> opponents to launch them across the arena like
        bouncy pinballs.
      </>
    ),
  },
  {
    icon: "🏁",
    iconClass: "cyan",
    text: (
      <>
        Score by knocking opponents through <strong>Energy Gates</strong> on
        their side of the arena.
      </>
    ),
  },
  {
    icon: "🎁",
    iconClass: "gold",
    text: (
      <>
        Smash <strong>Mystery Boxes</strong> for 6 party skills: 🥊 Mega Fist, 🍌 Banana, 🚀 Rocket, 🧲 Magnet, 💣 Bomb, 🩳 Shrink! (Press <strong>E</strong> to use).
      </>
    ),
  },
  {
    icon: "💎",
    iconClass: "gold",
    text: (
      <>
        Hit <strong>Pinball Bumpers</strong> for combo multipliers. More bounces = more
        points!
      </>
    ),
  },
  {
    icon: "⚡",
    iconClass: "purple",
    text: (
      <>
        <strong>3 Phases</strong>: Normal → Double Gate → OVERDRIVE. Last 25
        seconds are chaos!
      </>
    ),
  },
];

export default function TitleScreen({ onPlay }: TitleScreenProps) {
  const [showRules, setShowRules] = useState(false);
  const [muted, setMutedState] = useState(isMuted());

  // 404 Jam gate: mark ready as soon as title screen renders
  useEffect(() => {
    (window as any).__READY__ = true;
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  return (
    <div className="screen">
      {/* Animated Background */}
      <div className="bg-arena" aria-hidden="true">
        <div className="neon-grid" />
        <div className="glow-orb cyan" />
        <div className="glow-orb coral" />
        <div className="glow-orb gold" />
      </div>

      {/* Sound Toggle */}
      <button className="sound-toggle" onClick={toggleMute} aria-label="Toggle Sound">
        {muted ? "🔇" : "🔊"}
      </button>

      {/* Arcade Party Sub-Badge */}
      <div className="arcade-badge">
        ★ NINTENDO 3D ARCADE BRAWLER ★
      </div>

      {/* Logo */}
      <h1 className="title-logo">
        BOUNCE
        <br />
        BACK!
        <small>Punch them. Bounce them. Score.</small>
      </h1>

      {/* Visual Feature Tag Pills */}
      <div className="title-feature-pills">
        <span className="feature-pill cyan">🎮 3rd-Person Follow</span>
        <span className="feature-pill gold">🎁 Mystery Power-Ups</span>
        <span className="feature-pill purple">💎 Pinball Combos</span>
      </div>

      {/* Actions */}
      <div className="title-actions">
        <button
          id="startb"
          className="btn-play"
          onClick={() => {
            resumeAudio();
            sfxMatchStart();
            onPlay();
          }}
        >
          ▶ PLAY
        </button>
        <button className="btn-secondary" onClick={() => setShowRules(true)}>
          📖 How to play
        </button>
      </div>

      {/* Rules Sheet */}
      {showRules && (
        <div className="sheet-backdrop" onClick={() => setShowRules(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-header">
              <h3>How to Play</h3>
              <button onClick={() => setShowRules(false)}>×</button>
            </div>
            {RULES.map((rule, i) => (
              <div className="rule-item" key={i}>
                <div className={`rule-icon ${rule.iconClass}`}>{rule.icon}</div>
                <div className="rule-text">{rule.text}</div>
              </div>
            ))}
            <div className="rule-item">
              <div className="rule-icon cyan">⌨️</div>
              <div className="rule-text">
                <strong>Controls:</strong> WASD to move, Space to punch, Shift
                to dash, E / Q to use Skill. On mobile: virtual joystick + buttons.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
