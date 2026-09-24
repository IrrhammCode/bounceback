/**
 * BOUNCEBACK! — 2.5D Arena Physics Engine
 * All movement on XZ plane. Y is only for visual bounce/squash.
 */
import * as C from './config.js';

export class Entity {
  constructor(x, z, team, isPlayer = false) {
    this.x = x;
    this.z = z;
    this.vx = 0;
    this.vz = 0;
    this.radius = C.PLAYER_RADIUS;
    this.team = team;           // 0 = cyan, 1 = coral
    this.isPlayer = isPlayer;
    this.launched = false;      // true when knocked / projectile state
    this.launchSpeed = 0;
    this.immuneTimer = 0;       // brief immunity after multi-bounce
    this.bounceCount = 0;       // how many bumpers hit during this launch
    this.lastHitBy = -1;        // index of entity that launched this one
    this.stunTimer = 0;
    this.mesh = null;           // assigned later
    this.role = null;           // AI role
    this.fsm = 'idle';
    this.fsmTarget = -1;
    this.dashTimer = 0;
    this.dashCd = 0;
    this.punchCd = 0;
    this.chargeTimer = 0;
    this.charging = false;
    this.speed = 0;             // for telemetry
  }
}

export function applyPunch(attacker, target, charged) {
  const dx = target.x - attacker.x;
  const dz = target.z - attacker.z;
  const dist = Math.sqrt(dx * dx + dz * dz) || 0.01;
  const nx = dx / dist;
  const nz = dz / dist;
  const impulse = charged ? C.CHARGE_IMPULSE : C.PUNCH_IMPULSE;
  target.vx = nx * impulse;
  target.vz = nz * impulse;
  target.launched = true;
  target.launchSpeed = impulse;
  target.bounceCount = 0;
  target.immuneTimer = 0;
  target.stunTimer = 0.3;
  return { nx, nz, impulse };
}

export function updatePhysics(entities, bumpers, gates, dt, scoreCallback) {
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

    // Friction
    if (e.launched) {
      e.vx *= C.LAUNCH_FRICTION;
      e.vz *= C.LAUNCH_FRICTION;
      const spd = Math.sqrt(e.vx * e.vx + e.vz * e.vz);
      if (spd < C.LAUNCH_THRESHOLD) {
        e.launched = false;
        e.bounceCount = 0;
        e.launchSpeed = 0;
      }
    } else {
      e.vx *= C.GROUND_FRICTION;
      e.vz *= C.GROUND_FRICTION;
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
      const bx = b.x, bz = b.z, br = C.BUMPER_RADIUS + e.radius;
      const ddx = e.x - bx, ddz = e.z - bz;
      const d2 = ddx * ddx + ddz * ddz;
      if (d2 < br * br && d2 > 0.001) {
        const d = Math.sqrt(d2);
        const nx = ddx / d, nz = ddz / d;
        // Push out
        e.x = bx + nx * br;
        e.z = bz + nz * br;
        // Reflect velocity
        const dot = e.vx * nx + e.vz * nz;
        e.vx = (e.vx - 2 * dot * nx) * C.BUMPER_MULT;
        e.vz = (e.vz - 2 * dot * nz) * C.BUMPER_MULT;
        if (e.launched) {
          e.bounceCount++;
          if (e.bounceCount >= 3 && e.immuneTimer <= 0) {
            e.immuneTimer = C.IMMUNITY_DUR;
          }
          b.hitFlash = 1.0; // visual feedback
        }
      }
    }

    // Gate scoring: only launched entities from OPPOSING team score
    if (e.launched) {
      for (const gate of gates) {
        if (e.team === gate.team) continue; // can't score own gate
        const gx = gate.x, gz = gate.z;
        const hw = C.GATE_WIDTH * 0.5;
        const hd = C.GATE_DEPTH * 0.5;
        if (gate.axis === 'z') {
          // Gate spans X, thin in Z
          if (Math.abs(e.x - gx) < hw && Math.abs(e.z - gz) < hd + e.radius) {
            const scoringTeam = 1 - e.team; // team that hit this entity scores
            scoreCallback(scoringTeam, gate.multiplier, e.bounceCount, i);
            // Reset entity
            respawnEntity(e, entities, halfW, halfL);
          }
        } else {
          // Gate spans Z, thin in X
          if (Math.abs(e.z - gz) < hw && Math.abs(e.x - gx) < hd + e.radius) {
            const scoringTeam = 1 - e.team;
            scoreCallback(scoringTeam, gate.multiplier, e.bounceCount, i);
            respawnEntity(e, entities, halfW, halfL);
          }
        }
      }
    }
  }

  // Entity-entity collisions (launched entities hitting standing ones = domino)
  for (let i = 0; i < entities.length; i++) {
    const a = entities[i];
    if (!a.launched) continue;
    for (let j = 0; j < entities.length; j++) {
      if (i === j) continue;
      const b = entities[j];
      if (b.immuneTimer > 0) continue;
      if (b.launched) continue; // two launched don't interact
      if (a.team === b.team) continue; // no friendly fire while launched
      const dx = b.x - a.x, dz = b.z - a.z;
      const minD = a.radius + b.radius;
      const d2 = dx * dx + dz * dz;
      if (d2 < minD * minD && d2 > 0.001) {
        const d = Math.sqrt(d2);
        const nx = dx / d, nz = dz / d;
        // Transfer a fraction of velocity to standing target (domino)
        b.vx = nx * a.speed * 0.7;
        b.vz = nz * a.speed * 0.7;
        b.launched = true;
        b.launchSpeed = a.speed * 0.7;
        b.bounceCount = 0;
        b.lastHitBy = a.lastHitBy;
        // Slow down attacker
        a.vx *= 0.5;
        a.vz *= 0.5;
      }
    }
  }
}

function respawnEntity(e, entities, halfW, halfL) {
  // Respawn near own team's side
  const side = e.team === 0 ? -1 : 1;
  e.x = (Math.random() - 0.5) * (C.ARENA_W * 0.6);
  e.z = side * (halfL * 0.3 + Math.random() * halfL * 0.3);
  e.vx = 0;
  e.vz = 0;
  e.launched = false;
  e.launchSpeed = 0;
  e.bounceCount = 0;
  e.immuneTimer = C.IMMUNITY_DUR;
  e.stunTimer = 0.5;
}
