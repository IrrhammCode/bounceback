/**
 * BOUNCEBACK! — Multi-Level Arena Elevation System ("Tanjakan & Tiers")
 *
 * Smooth, gentle, spacious elevation across 28m x 54m arena:
 * - Cyan Endzone Base (z = -27 to -14): y = 0.0m (clean, flat defense zone)
 * - Ascending Ramp (z = -14 to -5): gentle 9m climb from 0.0m up to 1.2m
 * - Midfield Battle Deck (z = -5 to +5): elevated at 1.2m (10m x 28m battle plateau)
 * - Descending Ramp (z = +5 to +14): gentle 9m descent from 1.2m down to 0.0m
 * - Coral Endzone Base (z = +14 to +27): y = 0.0m (clean, flat attack zone)
 *
 * Longitudinal elevation profile eliminates side-warping and camera distortion.
 */

function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

export function getArenaHeight(_x: number, z: number): number {
  if (z >= -14 && z <= -5) {
    // Ascending ramp up to midfield plateau
    const t = smoothstep(-14, -5, z);
    return t * 1.2;
  } else if (z > -5 && z < 5) {
    // Elevated midfield battle plateau
    return 1.2;
  } else if (z >= 5 && z <= 14) {
    // Descending ramp down to Coral endzone
    const t = smoothstep(5, 14, z);
    return (1.0 - t) * 1.2;
  }
  // Endzones (Cyan & Coral bases)
  return 0.0;
}

/**
 * Returns pitch and roll tilt angles (in radians) for an entity grounded on the terrain
 */
export function getArenaSlope(x: number, z: number): { pitch: number; roll: number } {
  const eps = 0.5;
  const hB = getArenaHeight(x, z - eps);
  const hF = getArenaHeight(x, z + eps);

  // Pitch tilt forward/backward according to ramp slope
  const pitch = -Math.atan2(hF - hB, eps * 2);
  const roll = 0; // Pure longitudinal profile has zero sideways roll

  return { pitch, roll };
}
