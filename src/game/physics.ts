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
  vx = 0;
  vz = 0;
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
  entityIdx: number
) => void;

export function updatePhysics(
  entities: Entity[],
  bumpers: BumperData[],
  gates: GateData[],
  dt: number,
  scoreCallback: ScoreCallback
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

    // Apply velocity
    e.x += e.vx * dt;
    e.z += e.vz * dt;

    // Friction & Launch Auto-Recovery (Soar long distance towards the Giant Gong!)
    if (e.launched) {
      e.launchTimer = (e.launchTimer || 0) + dt;
      const decay = Math.pow(C.LAUNCH_FRICTION, dt * 60);
      e.vx *= decay;
      e.vz *= decay;
      const spd = Math.sqrt(e.vx * e.vx + e.vz * e.vz);
      // Auto-recover after max 1.35s or when speed drops below threshold
      if (spd < C.LAUNCH_THRESHOLD || e.launchTimer > 1.35) {
        e.launched = false;
        e.bounceCount = 0;
        e.launchSpeed = 0;
        e.launchTimer = 0;
        e.stunTimer = 0;
      }
    } else {
      e.launchTimer = 0;
      const gDecay = Math.pow(C.GROUND_FRICTION, dt * 60);
      e.vx *= gDecay;
      e.vz *= gDecay;
    }

    e.speed = Math.sqrt(e.vx * e.vx + e.vz * e.vz);

    // Wall bounces
    if (e.x - e.radius < -halfW) {
      e.x = -halfW + e.radius;
      e.vx = Math.abs(e.vx) * C.WALL_RESTITUTION;
    }
    if (e.x + e.radius > halfW) {
      e.x = halfW - e.radius;
      e.vx = -Math.abs(e.vx) * C.WALL_RESTITUTION;
    }
    if (e.z - e.radius < -halfL) {
      e.z = -halfL + e.radius;
      e.vz = Math.abs(e.vz) * C.WALL_RESTITUTION;
    }
    if (e.z + e.radius > halfL) {
      e.z = halfL - e.radius;
      e.vz = -Math.abs(e.vz) * C.WALL_RESTITUTION;
    }

    // Bumper collisions
    for (const b of bumpers) {
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
        e.x = bx + bnx * br;
        e.z = bz + bnz * br;
        const dot = e.vx * bnx + e.vz * bnz;
        e.vx = (e.vx - 2 * dot * bnx) * C.BUMPER_MULT;
        e.vz = (e.vz - 2 * dot * bnz) * C.BUMPER_MULT;
        if (e.launched) {
          e.bounceCount++;
          if (e.bounceCount >= 3 && e.immuneTimer <= 0) {
            e.immuneTimer = C.IMMUNITY_DUR;
          }
          b.hitFlash = 1.0;
        }
      }
    }

    // Gate scoring
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
          scoreCallback(scoringTeam, gate.multiplier, e.bounceCount, i);
          respawnEntity(e, halfW, halfL);
        }
      }
    }
  }

  // Entity-entity domino collisions
  for (let i = 0; i < entities.length; i++) {
    const a = entities[i];
    if (!a.launched) continue;
    for (let j = 0; j < entities.length; j++) {
      if (i === j) continue;
      const b = entities[j];
      if (b.immuneTimer > 0) continue;
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
  e.x = (Math.random() - 0.5) * (C.ARENA_W * 0.6);
  e.z = side * (halfL * 0.3 + Math.random() * halfL * 0.3);
  e.vx = 0;
  e.vz = 0;
  e.launched = false;
  e.launchTimer = 0;
  e.launchSpeed = 0;
  e.bounceCount = 0;
  e.immuneTimer = C.IMMUNITY_DUR;
  e.stunTimer = 0.5;
}
