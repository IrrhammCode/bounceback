/**
 * BOUNCEBACK! — 5 Distinct Arena Shapes & Boundary Collision System
 *
 * Each round features a fundamentally different physical court footprint:
 * - Round 1: Colosseum Plateau with 4 Corner Cutout Chasms
 * - Round 2: Hourglass "Chasm Crossing" (Cyan & Coral Bowls + Narrow Midfield Bridge)
 * - Round 3: Grand Octagon Hilltop with 4 Open Diagonal Drop Cliffs
 * - Round 4: Banked Pinball Velodrome (Curved Arcade Bowl & Flipper Chutes)
 * - Round 5: Celestial Starcross with Central Black Hole Abyss (Donut/Cross Pit)
 */
import * as THREE from "three";
import * as C from "./config";

export interface BoundaryResult {
  inside: boolean;
  distToEdge: number;
  nx: number;
  nz: number;
  isDropEdge: boolean;
}

export function isPointInsideArena(x: number, z: number, roundNumber: number): boolean {
  switch (roundNumber) {
    case 1: {
      // Round 1: Rectangle (halfW: 14.5, halfL: 27) with 4 corner drop cutouts
      const absX = Math.abs(x);
      const absZ = Math.abs(z);
      if (absX > 14.5 || absZ > 27.0) return false;
      // Cutout corner triangles
      if (absX > 9.5 && absZ > 21.0) {
        if ((absX - 9.5) + (absZ - 21.0) > 5.5) return false;
      }
      return true;
    }

    case 2: {
      // Round 2: Hourglass Chasm Crossing
      // Wide North/South islands (halfW: 14.0), connected by narrow central bridge (halfW: 5.6)
      const absX = Math.abs(x);
      const absZ = Math.abs(z);
      if (absZ > 27.0) return false;

      if (absZ <= 8.5) {
        // Narrow suspension bridge corridor
        return absX <= 5.6;
      } else if (absZ <= 12.0) {
        // Funnel approach ramp from island to bridge
        const t = (absZ - 8.5) / 3.5;
        const allowableW = 5.6 + t * (14.0 - 5.6);
        return absX <= allowableW;
      } else {
        // Full island base
        return absX <= 14.0;
      }
    }

    case 3: {
      // Round 3: Grand Octagon Hilltop
      const absX = Math.abs(x);
      const absZ = Math.abs(z);
      if (absX > 14.2 || absZ > 24.5) return false;
      // Diagonal corner chamfer check: (x / 14.2) + (z / 24.5) <= 1.34
      return (absX / 14.2) + (absZ / 24.5) <= 1.34;
    }

    case 4: {
      // Round 4: Banked Pinball Velodrome (Curved Superellipse)
      const absX = Math.abs(x);
      const absZ = Math.abs(z);
      if (absZ > 26.0) return false;
      // Smooth curved pinball hull
      const nx = absX / 14.0;
      const nz = absZ / 26.0;
      return Math.pow(nx, 2.6) + Math.pow(nz, 2.6) <= 1.0;
    }

    case 5: {
      // Round 5: Celestial Starcross with Central Black Hole Abyss
      const distFromCenter = Math.hypot(x, z);
      // Central Black Hole Void (radius 3.6m) — Instant Ring-Out into Singularity!
      if (distFromCenter < 3.6) return false;

      const absX = Math.abs(x);
      const absZ = Math.abs(z);
      if (absZ > 26.5 || absX > 14.5) return false;

      // Starcross '+' shape: Central corridor plus east/west wing platforms
      const onNorthSouthSpine = absX <= 7.2 && absZ <= 26.5;
      const onEastWestWings = absX <= 14.5 && absZ <= 10.5;
      // Diagonal connecting catwalks
      const onCatwalk = absX <= 10.5 && absZ <= 16.0 && (absX + absZ <= 23.5);

      return onNorthSouthSpine || onEastWestWings || onCatwalk;
    }

    default:
      return Math.abs(x) <= C.ARENA_W * 0.5 && Math.abs(z) <= C.ARENA_L * 0.5;
  }
}

/**
 * Returns distance to closest edge, surface normal, and whether the edge is an open drop cliff
 */
export function getArenaBoundaryInfo(x: number, z: number, roundNumber: number): BoundaryResult {
  const inside = isPointInsideArena(x, z, roundNumber);

  // Sample local neighborhood gradient to find accurate normal vector and distance
  const eps = 0.35;
  const inC = inside ? 1 : -1;
  const inR = isPointInsideArena(x + eps, z, roundNumber) ? 1 : -1;
  const inL = isPointInsideArena(x - eps, z, roundNumber) ? 1 : -1;
  const inF = isPointInsideArena(x, z + eps, roundNumber) ? 1 : -1;
  const inB = isPointInsideArena(x, z - eps, roundNumber) ? 1 : -1;

  // Inward normal (points toward inside of platform)
  let gradX = (inR - inL);
  let gradZ = (inF - inB);
  let len = Math.hypot(gradX, gradZ);

  if (len < 0.001) {
    // Fallback: point towards origin (0, 0)
    const dCenter = Math.hypot(x, z) || 1;
    gradX = -x / dCenter;
    gradZ = -z / dCenter;
    len = 1;
  }

  const nx = gradX / len;
  const nz = gradZ / len;

  // Binary search distance to edge along the normal
  let low = 0;
  let high = 5.0;
  for (let s = 0; s < 5; s++) {
    const mid = (low + high) * 0.5;
    const testX = x - nx * mid * (inside ? 1 : -1);
    const testZ = z - nz * mid * (inside ? 1 : -1);
    const isNowInside = isPointInsideArena(testX, testZ, roundNumber);
    if (isNowInside === inside) {
      low = mid;
    } else {
      high = mid;
    }
  }
  const distToEdge = (low + high) * 0.5;

  // Determine if this specific boundary edge has elastic ropes or is an open cliff drop
  let isDropEdge = false;
  switch (roundNumber) {
    case 1: {
      // Corner chamfers are open drop zones
      const absX = Math.abs(x);
      const absZ = Math.abs(z);
      isDropEdge = absX > 8.5 && absZ > 20.0;
      break;
    }
    case 2: {
      // The sides of the narrow bridge (|z| <= 8.5) are OPEN CHASM DROPS!
      const absZ = Math.abs(z);
      isDropEdge = absZ <= 9.0;
      break;
    }
    case 3: {
      // The 4 diagonal chamfers of the octagon are open cliff drops (no ropes)
      const absX = Math.abs(x);
      const absZ = Math.abs(z);
      isDropEdge = (absX / 14.2) + (absZ / 24.5) > 1.15;
      break;
    }
    case 4: {
      // Pinball velodrome is enclosed by high banked bumper rails
      isDropEdge = false;
      break;
    }
    case 5: {
      // The central hole is an OPEN CHASM DROP! Outer corners are also open
      const distFromCenter = Math.hypot(x, z);
      isDropEdge = distFromCenter < 4.5 || (Math.abs(x) > 10.0 && Math.abs(z) > 12.0);
      break;
    }
  }

  return {
    inside,
    distToEdge,
    nx,
    nz,
    isDropEdge,
  };
}

/**
 * Returns a 2D closed polygon outlining the perimeter of the arena for the given round.
 * Used for building extruded 3D platform geometry and perimeter cables.
 */
export function getArenaPerimeterPolygon(roundNumber: number): THREE.Vector2[] {
  const points: THREE.Vector2[] = [];

  switch (roundNumber) {
    case 1: {
      // Rectangle with chamfered corners
      points.push(new THREE.Vector2(-9.5, -27.0));
      points.push(new THREE.Vector2(9.5, -27.0));
      points.push(new THREE.Vector2(14.5, -21.5));
      points.push(new THREE.Vector2(14.5, 21.5));
      points.push(new THREE.Vector2(9.5, 27.0));
      points.push(new THREE.Vector2(-9.5, 27.0));
      points.push(new THREE.Vector2(-14.5, 21.5));
      points.push(new THREE.Vector2(-14.5, -21.5));
      break;
    }

    case 2: {
      // Hourglass shape (North bowl, narrow bridge, South bowl)
      points.push(new THREE.Vector2(-14.0, -27.0));
      points.push(new THREE.Vector2(14.0, -27.0));
      points.push(new THREE.Vector2(14.0, -12.0));
      points.push(new THREE.Vector2(5.6, -8.5));
      points.push(new THREE.Vector2(5.6, 8.5));
      points.push(new THREE.Vector2(14.0, 12.0));
      points.push(new THREE.Vector2(14.0, 27.0));
      points.push(new THREE.Vector2(-14.0, 27.0));
      points.push(new THREE.Vector2(-14.0, 12.0));
      points.push(new THREE.Vector2(-5.6, 8.5));
      points.push(new THREE.Vector2(-5.6, -8.5));
      points.push(new THREE.Vector2(-14.0, -12.0));
      break;
    }

    case 3: {
      // Symmetrical 8-sided Octagon
      const hw = 14.2;
      const hl = 24.5;
      const cw = 6.2;
      const cl = 10.5;
      points.push(new THREE.Vector2(-cw, -hl));
      points.push(new THREE.Vector2(cw, -hl));
      points.push(new THREE.Vector2(hw, -cl));
      points.push(new THREE.Vector2(hw, cl));
      points.push(new THREE.Vector2(cw, hl));
      points.push(new THREE.Vector2(-cw, hl));
      points.push(new THREE.Vector2(-hw, cl));
      points.push(new THREE.Vector2(-hw, -cl));
      break;
    }

    case 4: {
      // 28-point smooth ellipse
      const N = 28;
      for (let i = 0; i < N; i++) {
        const theta = (i / N) * Math.PI * 2;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);
        const rX = 14.0 * Math.sign(cos) * Math.pow(Math.abs(cos), 0.85);
        const rZ = 26.0 * Math.sign(sin) * Math.pow(Math.abs(sin), 0.85);
        points.push(new THREE.Vector2(rX, rZ));
      }
      break;
    }

    case 5: {
      // Starcross '+' shape
      points.push(new THREE.Vector2(-7.2, -26.5));
      points.push(new THREE.Vector2(7.2, -26.5));
      points.push(new THREE.Vector2(7.2, -10.5));
      points.push(new THREE.Vector2(14.5, -10.5));
      points.push(new THREE.Vector2(14.5, 10.5));
      points.push(new THREE.Vector2(7.2, 10.5));
      points.push(new THREE.Vector2(7.2, 26.5));
      points.push(new THREE.Vector2(-7.2, 26.5));
      points.push(new THREE.Vector2(-7.2, 10.5));
      points.push(new THREE.Vector2(-14.5, 10.5));
      points.push(new THREE.Vector2(-14.5, -10.5));
      points.push(new THREE.Vector2(-7.2, -10.5));
      break;
    }

    default:
      points.push(new THREE.Vector2(-14, -27));
      points.push(new THREE.Vector2(14, -27));
      points.push(new THREE.Vector2(14, 27));
      points.push(new THREE.Vector2(-14, 27));
      break;
  }

  return points;
}
