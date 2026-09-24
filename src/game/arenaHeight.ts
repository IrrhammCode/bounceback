/**
 * BOUNCEBACK! — Multi-Level Arena Elevation System ("Tanjakan & Tiers")
 *
 * Smooth, gentle, spacious elevation across 28m x 54m arena:
 * - Cyan Endzone Base (z = -27 to -16): y = 0.0m (spacious defense zone)
 * - Ascending Ramp (z = -16 to -6): gentle 10m climb from 0.0m up to 1.2m
 * - Midfield Battle Deck (z = -6 to +6): elevated at 1.2m (12m x 28m plateau)
 *   - Center Dais (r < 4.2m at 0,0): subtle gold plateau up to 1.5m
 * - Descending Ramp (z = +6 to +16): gentle 10m descent from 1.2m down to 0.0m
 * - Coral Endzone Base (z = +16 to +27): y = 0.0m (spacious goal approach)
 * - Side Wings (|x| > 9.0m): gentle side elevated curbs
 */

function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

export function getArenaHeight(x: number, z: number): number {
  let baseH = 0.0;

  // Main longitudinal ramp profile (gentle 10-meter transitions, no dizziness)
  if (z >= -16 && z <= -6) {
    // Ascending ramp up to midfield
    const t = smoothstep(-16, -6, z);
    baseH = t * 1.2;
  } else if (z > -6 && z < 6) {
    // Upper Midfield Plateau
    baseH = 1.2;

    // Center Crown Dais
    const distToCenter = Math.sqrt(x * x + z * z);
    if (distToCenter < 4.2) {
      const daisT = 1.0 - smoothstep(2.0, 4.2, distToCenter);
      baseH += daisT * 0.3; // up to 1.5m in center
    }
  } else if (z >= 6 && z <= 16) {
    // Descending ramp down to Coral endzone
    const t = smoothstep(6, 16, z);
    baseH = (1.0 - t) * 1.2;
  } else {
    // Endzones
    baseH = 0.0;
  }

  // Side wing curbs (|x| > 9.0m between z = -14 and +14)
  const absX = Math.abs(x);
  if (absX > 9.0 && Math.abs(z) <= 14) {
    const sideT = smoothstep(9.0, 11.5, absX);
    const zFade = 1.0 - smoothstep(12, 15, Math.abs(z));
    const wingH = 1.2 * zFade;
    baseH = Math.max(baseH, wingH * sideT);
  }

  return baseH;
}

/**
 * Returns pitch and roll tilt angles (in radians) for an entity grounded on the terrain
 */
export function getArenaSlope(x: number, z: number): { pitch: number; roll: number } {
  const eps = 0.5;
  const hL = getArenaHeight(x - eps, z);
  const hR = getArenaHeight(x + eps, z);
  const hB = getArenaHeight(x, z - eps);
  const hF = getArenaHeight(x, z + eps);

  const roll = Math.atan2(hR - hL, eps * 2);
  const pitch = -Math.atan2(hF - hB, eps * 2);

  return { pitch, roll };
}
