/**
 * BOUNCEBACK! — 2.5D Arena Physics Engine
 * All movement on XZ plane. Y is only for visual bounce/squash.
 */
import * as THREE from "three";
import * as C from "./config";

export interface BumperData {
  x: number;
  z: number;
  hitFlash: number;
}

export interface GateData {
  x: number;
  z: number;
  team: number;
  axis: "x" | "z";
  multiplier: number;
  active: boolean;
}

export class Entity {
  x: number;
  z: number;
  y = 0;
  vx = 0;
  vz = 0;
  vy = 0;
  radius = C.PLAYER_RADIUS;
  team: number;
  isPlayer: boolean;
  launched = false;
  launchTimer = 0;
  launchSpeed = 0;
  immuneTimer = 0;
  bounceCount = 0;
  lastHitBy = -1;
  stunTimer = 0;
  isFalling = false;
  respawning = false;
  mesh: THREE.Object3D | null = null;
  role: string | null = null;
  fsm = "idle";
  fsmTarget = -1;
  dashTimer = 0;
  dashCd = 0;
  punchCd = 0;
  chargeTimer = 0;
  charging = false;
  speed = 0;

  constructor(x: number, z: number, team: number, isPlayer = false) {
    this.x = x;
    this.z = z;
    this.team = team;
    this.isPlayer = isPlayer;
  }
}

export function applyPunch(
  attacker: Entity,
  target: Entity,
  charged: boolean
): { nx: number; nz: number; impulse: number } {
  const dx = target.x - attacker.x;
  const dz = target.z - attacker.z;
  const dist = Math.sqrt(dx * dx + dz * dz) || 0.01;
  const nx = dx / dist;
  const nz = dz / dist;
  const impulse = charged ? C.CHARGE_IMPULSE : C.PUNCH_IMPULSE;
  target.vx = nx * impulse;
  target.vz = nz * impulse;
  target.launched = true;
  target.launchTimer = 0;
  target.launchSpeed = impulse;
  target.bounceCount = 0;
  target.immuneTimer = 0;
  target.stunTimer = 0.25;
  return { nx, nz, impulse };
}

export type ScoreCallback = (
  scoringTeam: number,
  multiplier: number,
  bounceCount: number,
  entityIdx: number,
  killerIdx?: number
) => void;

export function updatePhysics(
  entities: Entity[],
  bumpers: BumperData[],
  gates: GateData[],
  dt: number,
  scoreCallback: ScoreCallback,
  customFriction?: number
) {
  const halfW = C.ARENA_W * 0.5;
  const halfL = C.ARENA_L * 0.5;

  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];

    // Timers
    if (e.immuneTimer > 0) e.immuneTimer -= dt;
    if (e.stunTimer > 0) e.stunTimer -= dt;
    if (e.dashCd > 0) e.dashCd -= dt;
    if (e.punchCd > 0) e.punchCd -= dt;
    if (e.dashTimer > 0) e.dashTimer -= dt;

    // 1. Ring-Out Abyss Fall State
    if (e.isFalling) {
      e.vy -= 42.0 * dt;
      e.y += e.vy * dt;
      e.x += e.vx * dt;
      e.z += e.vz * dt;

      if (e.y < -10.0) {
        // TRIGGER RING-OUT K.O. SCORE
        const scoringTeam =
          e.lastHitBy >= 0 && entities[e.lastHitBy]
            ? entities[e.lastHitBy].team
            : 1 - e.team;
        scoreCallback(scoringTeam, 2, Math.max(1, e.bounceCount), i, e.lastHitBy);
        respawnEntity(e, halfW, halfL);
      }
      continue;
    }

    // 2. Sky Drop Respawn Descent
    if (e.respawning) {
      e.y += e.vy * dt;
      if (e.y <= 0) {
        e.y = 0;
        e.vy = 0;
        e.respawning = false;
        e.immuneTimer = C.IMMUNITY_DUR;
      }
      continue;
    }

    // Apply horizontal velocity
    e.x += e.vx * dt;
    e.z += e.vz * dt;

    // Friction & Launch Auto-Recovery (Strictly capped at max 3.0 seconds!)
    if (e.launched) {
      e.launchTimer = (e.launchTimer || 0) + dt;
      const decay = Math.pow(C.LAUNCH_FRICTION, dt * 60);
      e.vx *= decay;
      e.vz *= decay;
      const spd = Math.sqrt(e.vx * e.vx + e.vz * e.vz);
      if (e.launchTimer >= 3.0 || (e.launchTimer > 0.8 && spd < C.LAUNCH_THRESHOLD)) {
        e.launched = false;
        e.bounceCount = 0;
        e.launchSpeed = 0;
        e.launchTimer = 0;
        e.stunTimer = 0;
        e.immuneTimer = 0.8;
      }
    } else {
      e.launchTimer = 0;
      const friction = customFriction ?? C.GROUND_FRICTION;
      const gDecay = Math.pow(friction, dt * 60);
      e.vx *= gDecay;
      e.vz *= gDecay;
    }

    e.speed = Math.sqrt(e.vx * e.vx + e.vz * e.vz);

    // 3. Perimeter Boundary Check (Elastic Ropes vs Ring-Out Vault)
    const beyondWest = e.x - e.radius < -halfW;
    const beyondEast = e.x + e.radius > halfW;
    const beyondNorth = e.z - e.radius < -halfL;
    const beyondSouth = e.z + e.radius > halfL;

    if (beyondWest || beyondEast || beyondNorth || beyondSouth) {
      const isHighVelocity = e.launched || e.launchSpeed > 10.0 || e.speed > 11.0;
      if (isHighVelocity) {
        // Vault over boundary ropes into the void abyss!
        e.isFalling = true;
        e.vy = 5.0; // Initial upward arc over rope
        e.launched = true;
      } else {
        // Elastic rebound off ring ropes
        if (beyondWest) {
          e.x = -halfW + e.radius;
          e.vx = Math.abs(e.vx) * C.WALL_RESTITUTION;
        }
        if (beyondEast) {
          e.x = halfW - e.radius;
          e.vx = -Math.abs(e.vx) * C.WALL_RESTITUTION;
        }
        if (beyondNorth) {
          e.z = -halfL + e.radius;
          e.vz = Math.abs(e.vz) * C.WALL_RESTITUTION;
        }
        if (beyondSouth) {
          e.z = halfL - e.radius;
          e.vz = -Math.abs(e.vz) * C.WALL_RESTITUTION;
        }
      }
    }

    // Bumper collisions — Authentic arcade pinball solenoid kick!
    for (const b of bumpers) {
      if (e.immuneTimer > 0) continue;
      const bx = b.x,
        bz = b.z,
        br = C.BUMPER_RADIUS + e.radius;
      const ddx = e.x - bx,
        ddz = e.z - bz;
      const d2 = ddx * ddx + ddz * ddz;
      if (d2 < br * br && d2 > 0.001) {
        const d = Math.sqrt(d2);
        const bnx = ddx / d,
          bnz = ddz / d;
        e.x = bx + bnx * (br + 0.16);
        e.z = bz + bnz * (br + 0.16);

        // Explosive arcade solenoid kick: minimum 26m/s blast speed!
        const curSpeed = Math.hypot(e.vx, e.vz);
        const kickSpeed = Math.max(curSpeed * 1.65, 26.5);
        e.vx = bnx * kickSpeed;
        e.vz = bnz * kickSpeed;
        e.launched = true;
        e.bounceCount = Math.min((e.bounceCount || 0) + 1, 5);
        e.immuneTimer = 0.22;
        b.hitFlash = 1.0;
      }
    }

    // Goal/Gate scoring support
    if (e.launched) {
      for (const gate of gates) {
        if (!gate.active) continue;
        if (e.team === gate.team) continue;
        const gx = gate.x,
          gz = gate.z;
        const hw = C.GATE_WIDTH * 0.5;
        const hd = C.GATE_DEPTH * 0.5;
        let scored = false;
        if (gate.axis === "z") {
          if (
            Math.abs(e.x - gx) < hw &&
            Math.abs(e.z - gz) < hd + e.radius
          ) {
            scored = true;
          }
        } else {
          if (
            Math.abs(e.z - gz) < hw &&
            Math.abs(e.x - gx) < hd + e.radius
          ) {
            scored = true;
          }
        }
        if (scored) {
          const scoringTeam = 1 - e.team;
          scoreCallback(scoringTeam, gate.multiplier, e.bounceCount, i, e.lastHitBy);
          respawnEntity(e, halfW, halfL);
        }
      }
    }
  }

  // Entity-entity domino collisions
  for (let i = 0; i < entities.length; i++) {
    const a = entities[i];
    if (!a.launched || a.isFalling) continue;
    for (let j = 0; j < entities.length; j++) {
      if (i === j) continue;
      const b = entities[j];
      if (b.immuneTimer > 0 || b.isFalling) continue;
      if (b.launched) continue;
      if (a.team === b.team) continue;
      const dx = b.x - a.x,
        dz = b.z - a.z;
      const minD = a.radius + b.radius;
      const d2 = dx * dx + dz * dz;
      if (d2 < minD * minD && d2 > 0.001) {
        const d = Math.sqrt(d2);
        const nx = dx / d,
          nz = dz / d;
        b.vx = nx * a.speed * 0.7;
        b.vz = nz * a.speed * 0.7;
        b.launched = true;
        b.launchTimer = 0;
        b.launchSpeed = a.speed * 0.7;
        b.bounceCount = 0;
        b.lastHitBy = a.lastHitBy;
        a.vx *= 0.5;
        a.vz *= 0.5;
      }
    }
  }
}

function respawnEntity(e: Entity, halfW: number, halfL: number) {
  const side = e.team === 0 ? -1 : 1;
  e.x = (Math.random() - 0.5) * (halfW * 1.1);
  e.z = side * (halfL * 0.35 + Math.random() * halfL * 0.35);
  e.y = 12.0; // Drops from the sky!
  e.vy = -18.0;
  e.vx = 0;
  e.vz = 0;
  e.isFalling = false;
  e.respawning = true;
  e.launched = false;
  e.launchTimer = 0;
  e.launchSpeed = 0;
  e.bounceCount = 0;
  e.immuneTimer = C.IMMUNITY_DUR + 0.4;
  e.stunTimer = 0.35;
  e.lastHitBy = -1;
}
