/**
 * BOUNCEBACK! — Multi-Level Dynamic Arena Elevation System ("Bentuk Arena Per Round")
 *
 * 5 Unique Physical 3D Court Shapes:
 * - Round 1 (Kado 1: Kamar Masa Kecil - Elevated Midfield Plateau)
 *   Classic Fall Guys plateau at +1.2m with smooth 9m approach ramps from Cyan and Coral endzones.
 *
 * - Round 2 (Kado 2: Kota Mainan - Speedway Dual-Channel Bowl)
 *   Elevated center bridge spine (+0.9m) connecting goals, flanked by dual sunken racing channels
 *   (-0.45m) where high-speed conveyor belts run, banking gently up at the outer curbs (+0.4m).
 *
 * - Round 3 (Kado 3: Layangan Sore - Rolling Hilltop Crest)
 *   Sunny grassy knoll! Central hilltop crest peaking at +1.5m at (0, 0), sloping smoothly down
 *   in all directions toward the perimeter fences and goal zones.
 *
 * - Round 4 (Kado 4: Pasar Malam - Banked Pinball Velodrome & Bumper Mounds)
 *   Banked arcade bowl! The perimeter rims curve upward (+0.9m), funnelling balls toward a sunken
 *   central floor (-0.3m) with 4 raised spring mounds (+0.65m) under the pinball bumpers.
 *
 * - Round 5 (Kado 5: Atap Penuh Bintang - Cosmic Singularity & Champion's Star Dais)
 *   Midnight cosmic stage! Raised outer celestial rim (+0.6m), shallow gravitational dip (-0.4m),
 *   and an elevated Champion's Star Dais (+1.0m) at the exact center (r <= 3.2m).
 */

import { isPointInsideArena, getArenaBoundaryInfo } from "./arenaShapes";

let currentArenaRound = 1;

export function setArenaRound(roundNumber: number): void {
  currentArenaRound = Math.max(1, Math.min(5, Math.floor(roundNumber)));
}

export function getArenaRound(): number {
  return currentArenaRound;
}

function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

export function getArenaHeight(x: number, z: number, roundNumber: number = currentArenaRound): number {
  const bInfo = getArenaBoundaryInfo(x, z, roundNumber);
  if (!bInfo.inside) {
    // Sheer vertical drop into the 18m canyon abyss
    const dropT = Math.min(1.0, bInfo.distToEdge / 1.2);
    return -18.0 * dropT;
  }

  switch (roundNumber) {
    case 1: {
      // Round 1: Elevated midfield plateau
      if (z >= -14 && z <= -5) {
        const t = smoothstep(-14, -5, z);
        return t * 1.2;
      } else if (z > -5 && z < 5) {
        return 1.2;
      } else if (z >= 5 && z <= 14) {
        const t = smoothstep(5, 14, z);
        return (1.0 - t) * 1.2;
      }
      return 0.0;
    }

    case 2: {
      // Round 2: Speedway Dual-Channel Bowl
      const absX = Math.abs(x);
      const absZ = Math.abs(z);
      const endzoneDamp = absZ > 20 ? 1.0 - smoothstep(20, 26, absZ) : 1.0;

      let crossSection = 0.0;
      if (absX <= 4.0) {
        // Center spine bridge
        const spineT = smoothstep(4.0, 2.0, absX);
        crossSection = 0.9 * spineT;
      } else if (absX > 4.0 && absX <= 13.0) {
        // Sunken speedway channel (trough at -0.45m)
        const channelT = Math.sin(((absX - 4.0) / 9.0) * Math.PI);
        crossSection = -0.45 * channelT;
      } else {
        // Outer banking curb
        const bankT = smoothstep(13.0, 14.5, absX);
        crossSection = 0.4 * bankT;
      }

      return crossSection * endzoneDamp;
    }

    case 3: {
      // Round 3: Rolling Hilltop Crest (King of the Hill)
      const absZ = Math.abs(z);
      const endzoneDamp = absZ > 20 ? 1.0 - smoothstep(20, 26, absZ) : 1.0;

      const r = Math.hypot(x * 1.35, z);
      const hillRadius = 22.0;
      if (r < hillRadius) {
        const t = 1.0 - r / hillRadius;
        const hillH = 1.5 * Math.pow(Math.sin((t * Math.PI) / 2), 1.8);
        return hillH * endzoneDamp;
      }
      return 0.0;
    }

    case 4: {
      // Round 4: Banked Pinball Velodrome & Bumper Launch Mounds
      const absX = Math.abs(x);
      const absZ = Math.abs(z);

      const bankX = smoothstep(6.0, 13.8, absX) * 0.85;
      const bankZ = smoothstep(12.0, 26.0, absZ) * 0.85;
      const rimElevation = Math.max(bankX, bankZ);

      const centerDist = Math.hypot(x * 1.2, z * 0.7);
      const dip = centerDist < 10.0 ? (1.0 - centerDist / 10.0) * -0.3 : 0.0;

      let bumperMound = 0.0;
      for (const bx of [-5.5, 5.5]) {
        for (const bz of [-8.0, 8.0]) {
          const d = Math.hypot(x - bx, z - bz);
          if (d < 3.2) {
            bumperMound = Math.max(bumperMound, 0.65 * (1.0 - smoothstep(0, 3.2, d)));
          }
        }
      }

      return rimElevation + dip + bumperMound;
    }

    case 5: {
      // Round 5: Cosmic Singularity & Champion's Star Dais
      const absZ = Math.abs(z);
      const r = Math.hypot(x, z);

      if (r <= 3.2) {
        return 1.0;
      } else if (r <= 5.0) {
        const t = smoothstep(3.2, 5.0, r);
        return (1.0 - t) * 1.0 - t * 0.35;
      } else if (r <= 13.0) {
        const t = Math.sin(((r - 5.0) / 8.0) * Math.PI);
        return -0.4 * t;
      }

      const absX = Math.abs(x);
      const outerBank = smoothstep(9.0, 13.5, absX) * 0.55 + smoothstep(16.0, 26.0, absZ) * 0.45;
      return outerBank;
    }

    default:
      return 0.0;
  }
}

/**
 * Returns pitch and roll tilt angles (in radians) for an entity grounded on the terrain
 */
export function getArenaSlope(
  x: number,
  z: number,
  roundNumber: number = currentArenaRound
): { pitch: number; roll: number } {
  const eps = 0.4;
  const hB = getArenaHeight(x, z - eps, roundNumber);
  const hF = getArenaHeight(x, z + eps, roundNumber);
  const hL = getArenaHeight(x - eps, z, roundNumber);
  const hR = getArenaHeight(x + eps, z, roundNumber);

  // Pitch tilt forward/backward according to ramp slope
  const pitch = -Math.atan2(hF - hB, eps * 2);
  // Roll tilt left/right according to cross slope
  const roll = Math.atan2(hR - hL, eps * 2);

  return { pitch, roll };
}

