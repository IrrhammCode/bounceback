import React from "react";
import { SkillType } from "../game/skills";

interface SkillIconProps {
  skill: SkillType | number | string;
  size?: number;
  className?: string;
}

export const SkillIcon: React.FC<SkillIconProps> = ({ skill, size = 32, className = "" }) => {
  // Normalize skill type
  let type: SkillType = SkillType.None;
  if (typeof skill === "number") {
    type = skill as SkillType;
  } else if (typeof skill === "string") {
    switch (skill.toUpperCase()) {
      case "GIGAFIST":
      case "GIGA FIST":
      case "FIST":
        type = SkillType.GigaFist;
        break;
      case "BANANAPEEL":
      case "BANANA":
      case "SLIP":
        type = SkillType.BananaPeel;
        break;
      case "ROCKETBOOST":
      case "ROCKET":
      case "NITRO":
        type = SkillType.RocketBoost;
        break;
      case "GIGAMAGNET":
      case "MAGNET":
      case "PULL":
        type = SkillType.GigaMagnet;
        break;
      case "BOUNCEBOMB":
      case "BOMB":
      case "BLAST":
        type = SkillType.BounceBomb;
        break;
      case "SHRINKZAP":
      case "SHRINK":
      case "RAY":
        type = SkillType.ShrinkZap;
        break;
      case "ONEPUNCHMAN":
      case "ONE PUNCH":
      case "K.O.":
        type = SkillType.OnePunchMan;
        break;
      default:
        type = SkillType.None;
    }
  }

  const s = size;

  switch (type) {
    case SkillType.GigaFist:
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`skill-svg-icon giga-fist-icon ${className}`}
        >
          <defs>
            <linearGradient id="gfGlove" x1="8" y1="12" x2="38" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff4b72" />
              <stop offset="60%" stopColor="#d90429" />
              <stop offset="100%" stopColor="#7a0018" />
            </linearGradient>
            <linearGradient id="gfGold" x1="14" y1="8" x2="36" y2="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fff3b0" />
              <stop offset="50%" stopColor="#ffd166" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="gfImpact" x1="32" y1="6" x2="46" y2="24" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#ffe600" />
              <stop offset="100%" stopColor="#ff4500" />
            </linearGradient>
          </defs>
          {/* Speed / Impact Shockwave Arcs */}
          <path
            d="M36 8 C42 14 44 24 38 32"
            stroke="url(#gfImpact)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M41 12 C47 18 48 26 44 32"
            stroke="url(#gfImpact)"
            strokeWidth="2"
            strokeDasharray="2 3"
            strokeLinecap="round"
          />
          {/* Fist Arm Plate */}
          <path
            d="M6 34 L16 23 L22 28 L11 40 Z"
            fill="#334155"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Main Armored Boxing Glove */}
          <path
            d="M13 25 C11 20 14 12 22 10 C29 8 36 12 37 19 C38 25 35 31 29 33 C23 35 15 32 13 25 Z"
            fill="url(#gfGlove)"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          {/* Gold Knuckle Reinforcement Armor */}
          <path
            d="M26 10 C32 12 37 16 37 22 C37 26 34 29 30 30 C34 26 34 18 26 10 Z"
            fill="url(#gfGold)"
          />
          {/* Thumb Guard */}
          <path
            d="M17 19 C18 15 22 15 25 18 C26 21 24 25 20 25 C17 25 16 22 17 19 Z"
            fill="url(#gfGlove)"
            stroke="#ff8fab"
            strokeWidth="1"
          />
          {/* High Energy Knuckle Spark */}
          <circle cx="34" cy="18" r="2" fill="#ffffff" />
          <path d="M34 13 L34 23 M29 18 L39 18" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case SkillType.BananaPeel:
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`skill-svg-icon banana-icon ${className}`}
        >
          <defs>
            <linearGradient id="bnSkin" x1="24" y1="8" x2="24" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fff9a6" />
              <stop offset="40%" stopColor="#ffda1f" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id="bnInside" x1="24" y1="16" x2="24" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>
          </defs>
          {/* Dynamic Slip Swirl Lines Underneath */}
          <path
            d="M8 38 C14 43 32 44 42 36"
            stroke="#38bdf8"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M14 43 C22 46 32 46 38 41"
            stroke="#93c5fd"
            strokeWidth="1.5"
            strokeDasharray="2 3"
            strokeLinecap="round"
          />
          {/* Top Stem */}
          <rect x="22" y="7" width="4" height="6" rx="1.5" fill="#4d7c0f" stroke="#1e3a10" strokeWidth="0.8" />
          {/* Left Peeling Skin */}
          <path
            d="M23 13 C16 16 10 24 7 34 C12 33 19 28 22 22 Z"
            fill="url(#bnSkin)"
            stroke="#b45309"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Right Peeling Skin */}
          <path
            d="M25 13 C32 16 38 24 41 34 C36 33 29 28 26 22 Z"
            fill="url(#bnSkin)"
            stroke="#b45309"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Center Peeling Skin Drooping Down */}
          <path
            d="M21 15 C21 24 19 32 24 37 C29 32 27 24 27 15 Z"
            fill="url(#bnInside)"
            stroke="#ca8a04"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M23 17 L23 33"
            stroke="#eab308"
            strokeWidth="1"
            strokeLinecap="round"
          />
          {/* Sparkle Tip */}
          <polygon points="35,12 37,16 41,17 37,19 35,23 34,19 30,17 34,16" fill="#fff" />
        </svg>
      );

    case SkillType.RocketBoost:
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`skill-svg-icon rocket-icon ${className}`}
        >
          <defs>
            <linearGradient id="rkFuselage" x1="12" y1="36" x2="38" y2="10" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="60%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#e0f2fe" />
            </linearGradient>
            <linearGradient id="rkFlame" x1="16" y1="30" x2="4" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#ffea00" />
              <stop offset="70%" stopColor="#ff4500" />
              <stop offset="100%" stopColor="#990000" />
            </linearGradient>
          </defs>
          {/* Roaring Jet Flame Plume */}
          <path
            d="M17 29 L7 41 C9 36 6 34 5 44 C13 41 12 38 20 32 Z"
            fill="url(#rkFlame)"
          />
          <path
            d="M16 29 L10 37 C11 34 9 33 8 39 C14 36 13 34 18 31 Z"
            fill="#ffffff"
          />
          {/* Rocket Wings / Stabilizer Fins */}
          <path d="M14 26 L10 28 L13 22 Z" fill="#f43f5e" />
          <path d="M22 34 L20 38 L26 35 Z" fill="#f43f5e" />
          {/* Aerodynamic Rocket Fuselage */}
          <path
            d="M16 32 C14 28 20 20 30 14 C35 11 39 8 40 8 C40 9 37 13 34 18 C28 28 20 34 16 32 Z"
            fill="url(#rkFuselage)"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
          {/* Rocket Nose Cone Cap */}
          <path
            d="M34 14 C36 12 39 8 40 8 C40 9 36 12 34 14 Z"
            fill="#f43f5e"
          />
          {/* Round Glass Cockpit Visor */}
          <circle cx="28" cy="18" r="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
          <circle cx="27" cy="17" r="1" fill="#ffffff" />
          {/* Thrust Speed Streaks */}
          <path d="M28 8 L38 5" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M42 12 L45 19" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case SkillType.GigaMagnet:
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`skill-svg-icon magnet-icon ${className}`}
        >
          <defs>
            <linearGradient id="mgRed" x1="10" y1="12" x2="20" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff4d6d" />
              <stop offset="100%" stopColor="#c9184a" />
            </linearGradient>
            <linearGradient id="mgBlue" x1="28" y1="12" x2="38" y2="34" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00b4d8" />
              <stop offset="100%" stopColor="#0077b6" />
            </linearGradient>
            <linearGradient id="mgFlux" x1="12" y1="6" x2="36" y2="6" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff4d6d" />
              <stop offset="50%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#00b4d8" />
            </linearGradient>
          </defs>
          {/* Magnetic Field Force Pulse Waves */}
          <path
            d="M13 10 C16 4 32 4 35 10"
            stroke="url(#mgFlux)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M17 14 C19 10 29 10 31 14"
            stroke="url(#mgFlux)"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            strokeLinecap="round"
          />
          {/* Horseshoe Magnet Arch Body */}
          <path
            d="M9 22 C9 32 15 42 24 42 C33 42 39 32 39 22 L33 22 C33 28 29 35 24 35 C19 35 15 28 15 22 Z"
            fill="#475569"
            stroke="#94a3b8"
            strokeWidth="1.2"
          />
          {/* North Pole (Red Left Limb) */}
          <path
            d="M9 16 L15 16 L15 24 L9 24 Z"
            fill="url(#mgRed)"
            stroke="#ffffff"
            strokeWidth="0.8"
          />
          <rect x="9" y="12" width="6" height="4" fill="#ffffff" />
          {/* South Pole (Blue Right Limb) */}
          <path
            d="M33 16 L39 16 L39 24 L33 24 Z"
            fill="url(#mgBlue)"
            stroke="#ffffff"
            strokeWidth="0.8"
          />
          <rect x="33" y="12" width="6" height="4" fill="#ffffff" />
          {/* Pole Labels (N and S) */}
          <text x="12" y="22" fill="#ffffff" fontSize="7" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
            N
          </text>
          <text x="36" y="22" fill="#ffffff" fontSize="7" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
            S
          </text>
        </svg>
      );

    case SkillType.BounceBomb:
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`skill-svg-icon bomb-icon ${className}`}
        >
          <defs>
            <radialGradient id="bbBody" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="45%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#090d16" />
            </radialGradient>
            <linearGradient id="bbSpark" x1="32" y1="4" x2="42" y2="14" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#ffb703" />
              <stop offset="100%" stopColor="#d90429" />
            </linearGradient>
          </defs>
          {/* Lit Fuse Rope */}
          <path
            d="M26 14 C27 9 32 8 36 9"
            stroke="#b45309"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Exploding Fuse Star Spark */}
          <path
            d="M36 9 L40 5 M36 9 L41 11 M36 9 L35 4 M36 9 L38 13"
            stroke="url(#bbSpark)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="36" cy="9" r="2.5" fill="#fff" />
          {/* Bomb Brass Cap Collar */}
          <rect
            x="21"
            y="13"
            width="8"
            height="4"
            rx="1.5"
            fill="#eab308"
            stroke="#a16207"
            strokeWidth="0.8"
          />
          {/* Main Round Bomb Sphere */}
          <circle
            cx="24"
            cy="27"
            r="15"
            fill="url(#bbBody)"
            stroke="#ffffff"
            strokeWidth="1.5"
          />
          {/* Specular 3D Light Reflection */}
          <ellipse cx="19" cy="20" rx="4" ry="2.5" transform="rotate(-30 19 20)" fill="rgba(255, 255, 255, 0.45)" />
          {/* Hazard Emblem (Bouncing Flame/Skull) */}
          <path
            d="M24 23 L28 31 L20 31 Z"
            fill="#ffb703"
            stroke="#d90429"
            strokeWidth="0.8"
          />
          <circle cx="24" cy="29" r="1.5" fill="#0f172a" />
        </svg>
      );

    case SkillType.ShrinkZap:
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`skill-svg-icon shrink-icon ${className}`}
        >
          <defs>
            <linearGradient id="szRays" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <radialGradient id="szCore" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6b21a8" />
            </radialGradient>
          </defs>
          {/* Outer Quantum Target Reticle Ring */}
          <circle
            cx="24"
            cy="24"
            r="18"
            stroke="url(#szRays)"
            strokeWidth="2"
            strokeDasharray="4 3"
          />
          <circle
            cx="24"
            cy="24"
            r="12"
            stroke="#38bdf8"
            strokeWidth="1"
            opacity="0.6"
          />
          {/* 4 Inward Collapsing Arrows (Compressing target to mini size) */}
          {/* Top Arrow */}
          <path d="M24 9 L24 16 M21 13 L24 16 L27 13" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Bottom Arrow */}
          <path d="M24 39 L24 32 M21 35 L24 32 L27 35" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Left Arrow */}
          <path d="M9 24 L16 24 M13 21 L16 24 L13 27" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Right Arrow */}
          <path d="M39 24 L32 24 M35 21 L32 24 L35 27" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* High Energy Micro-Core */}
          <circle cx="24" cy="24" r="4.5" fill="url(#szCore)" stroke="#ffffff" strokeWidth="1.2" />
        </svg>
      );

    case SkillType.OnePunchMan:
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`skill-svg-icon one-punch-icon ${className}`}
        >
          <defs>
            <radialGradient id="opmAura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#ffd166" />
              <stop offset="70%" stopColor="#ff5400" />
              <stop offset="100%" stopColor="#9d0208" />
            </radialGradient>
            <linearGradient id="opmGold" x1="16" y1="12" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="40%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          {/* Hyper-Radiant Solar Starburst Rays */}
          <path
            d="M24 2 L27 17 L42 12 L31 22 L46 28 L30 31 L37 46 L24 35 L12 45 L17 31 L2 27 L16 22 L6 11 L21 16 Z"
            fill="url(#opmAura)"
            opacity="0.85"
          />
          {/* Sonic Shockwave Ring */}
          <circle
            cx="24"
            cy="24"
            r="16"
            stroke="#ffffff"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          {/* Central God-Level Serious Punch Fist */}
          <path
            d="M17 29 C15 24 17 17 24 15 C31 13 36 17 36 24 C36 29 33 34 27 35 C22 36 18 34 17 29 Z"
            fill="url(#opmGold)"
            stroke="#ffffff"
            strokeWidth="2"
          />
          {/* Fiery Knuckle Plates */}
          <circle cx="28" cy="19" r="2.5" fill="#ffffff" />
          <circle cx="32" cy="23" r="2.5" fill="#ffffff" />
          <circle cx="29" cy="28" r="2" fill="#ffd166" />
          {/* Power Flash Cross */}
          <path d="M24 10 L24 38 M10 24 L38 24" stroke="#ffffff" strokeWidth="1" opacity="0.75" />
        </svg>
      );

    case SkillType.None:
    default:
      return (
        <svg
          width={s}
          height={s}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`skill-svg-icon empty-slot-icon ${className}`}
        >
          {/* Holographic Mystery Hexagon / Question Box */}
          <polygon
            points="24,6 40,15 40,33 24,42 8,33 8,15"
            fill="rgba(255, 209, 102, 0.08)"
            stroke="rgba(255, 209, 102, 0.35)"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <text
            x="24"
            y="29"
            fill="rgba(255, 209, 102, 0.5)"
            fontSize="18"
            fontWeight="900"
            textAnchor="middle"
            fontFamily="var(--font-head), sans-serif"
          >
            ?
          </text>
        </svg>
      );
  }
};

/**
 * Clean Vector Icons for Action Buttons (Touch/Mobile Controls)
 */
export const ActionPunchIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 22,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`action-btn-svg ${className}`}
  >
    <path
      d="M4 14L8 10L12 13L6 18Z"
      fill="#f59e0b"
      stroke="#ffffff"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path
      d="M8 10C7 7 10 3 15 3C18 3 20 6 20 10C20 13 18 16 15 17C12 18 8 15 8 10Z"
      fill="#ff3b5c"
      stroke="#ffffff"
      strokeWidth="1.5"
    />
    <path d="M17 5L22 7M19 11L23 13" stroke="#ffd166" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const ActionDashIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 22,
  className = "",
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`action-btn-svg ${className}`}
  >
    {/* Dual Forward Hyper-Chevrons */}
    <path
      d="M3 5L10 12L3 19"
      stroke="#38bdf8"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 5L17 12L10 19"
      stroke="#ffffff"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 8L20 12L16 16"
      stroke="#00f0ff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default SkillIcon;
