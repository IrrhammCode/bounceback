/**
 * BOUNCEBACK! — Smart Balanced AI Bot System (5v5 Championship)
 *
 * Implements:
 * 1. Player-Identical Kinematics:
 *    - Snappy 24.0/s acceleration and 16.0/s deceleration matching PlayerController.
 *    - Intelligent DASH bursts with identical C.DASH_SPEED and C.DASH_DUR.
 *    - Active recovery / teching to break out of launch tumble and land on two feet.
 *    - Punch cooldown set strictly to C.PUNCH_CD (0.28s) ensuring 100% identical punch
 *      extension, arm swing, and cartoon fist visual scaling.
 * 2. Smart & Balanced Tactics:
 *    - Ring-Out Edge Repulsion: Bots never blindly step or dash off the arena boundary.
 *    - 5 Dynamic Championship Roles: Striker, Interceptor, Flanker, Guardian, Sweeper.
 *    - Smart Combo Juggles: Pursues launched/airborne enemies for follow-up hits.
 *    - Gate Defense: Blocks opponent shots threatening their team gate.
 *    - Intelligent Mystery Box Skill Activation.
 */
import * as C from "./config";
import { Entity, applyPunch, type BumperData, type GateData } from "./physics";
import type { JuiceFn } from "./player";
import { SkillType, type SkillSlot } from "./skills";

export const ROLES = ["striker", "interceptor", "flanker", "guardian", "sweeper"] as const;
export type BotRole = typeof ROLES[number];

export function assignRoles(entities: Entity[]) {
  let team0Idx = 0;
  let team1Idx = 0;
  for (let i = 0; i < entities.length; i++) {
    const e = entities[i];
    if (e.isPlayer) continue;
    if (e.team === 0) {
      e.role = ROLES[team0Idx % ROLES.length];
      team0Idx++;
    } else {
      e.role = ROLES[team1Idx % ROLES.length];
      team1Idx++;
    }
  }
}

export function updateBots(
  entities: Entity[],
  _bumpers: BumperData[],
  gates: GateData[],
  dt: number,
  juiceFn?: JuiceFn,
  skillSlots?: SkillSlot[],
  onActivateSkill?: (botIdx: number) => void
) {
  const halfW = C.ARENA_W * 0.5;
  const halfL = C.ARENA_L * 0.5;
  const pursuitCount = new Map<number, number>();

  for (let i = 0; i < entities.length; i++) {
    const bot = entities[i];
    if (bot.isPlayer) continue;

    // 1. Active Recovery / Teching (Identical to PlayerController)
    // When launched/tumbled for > 0.32s, smart bots tech out to stand back up on two feet!
    if (bot.launched && (bot.launchTimer || 0) > 0.32) {
      bot.launched = false;
      bot.stunTimer = 0;
      bot.launchTimer = 0;
      bot.launchSpeed = 0;
      bot.bounceCount = 0;
      bot.immuneTimer = 0.5;
    }

    if (bot.stunTimer > 0) continue;

    // Update attack rhythm cooldown on bot
    if (bot.chargeTimer > 0) {
      bot.chargeTimer -= dt;
    }

    const ownGate = gates.find((g) => g.team === bot.team);
    const opponentGate = gates.find((g) => g.team !== bot.team);

    let moveX = 0;
    let moveZ = 0;
    let shouldDash = false;
    let targetIdx = -1;
    let targetDist = Infinity;

    // 2. Role-Based Tactical AI
    const role: BotRole = (bot.role as BotRole) || "striker";

    switch (role) {
      case "striker": {
        // Aggressive vanguard: pursues highest-priority opponent and aims punch toward opponent gate or ropes
        for (let j = 0; j < entities.length; j++) {
          const e = entities[j];
          if (e.team === bot.team || e.immuneTimer > 0) continue;
          const count = pursuitCount.get(j) || 0;
          if (count >= C.MAX_PURSUERS) continue;

          const dx = e.x - bot.x;
          const dz = e.z - bot.z;
          const d = Math.hypot(dx, dz);
          if (d < targetDist) {
            targetDist = d;
            targetIdx = j;
          }
        }

        if (targetIdx >= 0) {
          pursuitCount.set(targetIdx, (pursuitCount.get(targetIdx) || 0) + 1);
          const t = entities[targetIdx];
          const dx = t.x - bot.x;
          const dz = t.z - bot.z;
          const d = Math.hypot(dx, dz) || 1;
          moveX = dx / d;
          moveZ = dz / d;

          // Dash to close in if lined up at medium distance
          if (d > 3.6 && d < 7.2 && bot.dashCd <= 0 && Math.random() < 0.25) {
            shouldDash = true;
          }

          // Punch execution
          if (d < C.PUNCH_RANGE && bot.punchCd <= 0 && bot.chargeTimer <= 0) {
            const result = applyPunch(bot, t, false);
            t.lastHitBy = i;
            bot.punchCd = C.PUNCH_CD; // Strictly C.PUNCH_CD (0.28s) matching player!
            bot.chargeTimer = 0.42; // Rhythmic attack cooldown
            if (juiceFn) {
              juiceFn("botpunch", {
                ...result,
                originX: bot.x,
                originZ: bot.z,
                dirX: result.nx,
                dirZ: result.nz,
                x: t.x,
                z: t.z,
                team: bot.team,
                isHit: true,
              });
            }
          }
        }
        break;
      }

      case "interceptor": {
        // Midfield controller: prioritizes combo juggles on airborne/launched enemies
        let launchedTarget: Entity | null = null;
        let launchedDist = 18.0;

        for (let j = 0; j < entities.length; j++) {
          const e = entities[j];
          if (e.team === bot.team || !e.launched || e.immuneTimer > 0) continue;
          const d = Math.hypot(e.x - bot.x, e.z - bot.z);
          if (d < launchedDist) {
            launchedDist = d;
            launchedTarget = e;
            targetIdx = j;
          }
        }

        if (launchedTarget) {
          // Predict where launched enemy is tumbling
          const predX = launchedTarget.x + launchedTarget.vx * 0.25;
          const predZ = launchedTarget.z + launchedTarget.vz * 0.25;
          const dx = predX - bot.x;
          const dz = predZ - bot.z;
          const d = Math.hypot(dx, dz) || 1;
          moveX = dx / d;
          moveZ = dz / d;

          if (d > 3.8 && bot.dashCd <= 0) {
            shouldDash = true;
          }

          if (d < C.PUNCH_RANGE && bot.punchCd <= 0 && bot.chargeTimer <= 0) {
            const result = applyPunch(bot, launchedTarget, false);
            launchedTarget.lastHitBy = i;
            bot.punchCd = C.PUNCH_CD;
            bot.chargeTimer = 0.38;
            if (juiceFn) {
              juiceFn("botpunch", {
                ...result,
                originX: bot.x,
                originZ: bot.z,
                dirX: result.nx,
                dirZ: result.nz,
                x: launchedTarget.x,
                z: launchedTarget.z,
                team: bot.team,
                isHit: true,
              });
            }
          }
        } else {
          // Standard midfield patrol
          const patrolZ = bot.team === 0 ? -4.0 : 4.0;
          const dx = 0 - bot.x;
          const dz = patrolZ - bot.z;
          const d = Math.hypot(dx, dz) || 1;
          if (d > 1.8) {
            moveX = dx / d;
            moveZ = dz / d;
          }
        }
        break;
      }

      case "guardian": {
        // Defensive anchor: guards team gate and repels attacking opponents
        if (ownGate) {
          const defendZ = ownGate.z + (bot.team === 0 ? 3.6 : -3.6);
          let threat: Entity | null = null;
          let threatDist = 12.0;

          for (const e of entities) {
            if (e.team === bot.team) continue;
            const d = Math.hypot(e.x - ownGate.x, e.z - ownGate.z);
            if (d < threatDist) {
              threatDist = d;
              threat = e;
            }
          }

          if (threat) {
            // Position directly between threat and gate
            const targetX = threat.x * 0.65;
            const targetZ = defendZ;
            const dx = targetX - bot.x;
            const dz = targetZ - bot.z;
            const d = Math.hypot(dx, dz) || 1;
            moveX = dx / d;
            moveZ = dz / d;

            const distToThreat = Math.hypot(threat.x - bot.x, threat.z - bot.z);
            if (distToThreat < C.PUNCH_RANGE && bot.punchCd <= 0 && bot.chargeTimer <= 0) {
              const result = applyPunch(bot, threat, false);
              threat.lastHitBy = i;
              bot.punchCd = C.PUNCH_CD;
              bot.chargeTimer = 0.45;
              if (juiceFn) {
                juiceFn("botpunch", {
                  ...result,
                  originX: bot.x,
                  originZ: bot.z,
                  dirX: result.nx,
                  dirZ: result.nz,
                  x: threat.x,
                  z: threat.z,
                  team: bot.team,
                  isHit: true,
                });
              }
            }
          } else {
            // Hold guard post
            const dx = ownGate.x - bot.x;
            const dz = defendZ - bot.z;
            const d = Math.hypot(dx, dz) || 1;
            if (d > 1.2) {
              moveX = dx / d;
              moveZ = dz / d;
            }
          }
        }
        break;
      }

      case "flanker": {
        // Wing striker: attacks from flanks, pushes opponents sideways toward boundary
        let bestTargetIdx = -1;
        let bestScore = -Infinity;

        for (let j = 0; j < entities.length; j++) {
          const e = entities[j];
          if (e.team === bot.team || e.immuneTimer > 0) continue;
          const count = pursuitCount.get(j) || 0;
          if (count >= C.MAX_PURSUERS) continue;

          const dx = e.x - bot.x;
          const dz = e.z - bot.z;
          const d = Math.hypot(dx, dz) || 1;
          const edgeFactor = Math.abs(e.x) / halfW;
          const score = 10.0 / d + edgeFactor * 4.0;
          if (score > bestScore) {
            bestScore = score;
            bestTargetIdx = j;
          }
        }

        if (bestTargetIdx >= 0) {
          pursuitCount.set(bestTargetIdx, (pursuitCount.get(bestTargetIdx) || 0) + 1);
          const t = entities[bestTargetIdx];
          const flankOffsetX = t.x > 0 ? -1.8 : 1.8;
          const targetX = t.x + flankOffsetX;
          const targetZ = t.z;
          const dx = targetX - bot.x;
          const dz = targetZ - bot.z;
          const d = Math.hypot(dx, dz) || 1;
          moveX = dx / d;
          moveZ = dz / d;

          const dDirect = Math.hypot(t.x - bot.x, t.z - bot.z);
          if (dDirect > 4.0 && dDirect < 8.0 && bot.dashCd <= 0 && Math.random() < 0.28) {
            shouldDash = true;
          }

          if (dDirect < C.PUNCH_RANGE && bot.punchCd <= 0 && bot.chargeTimer <= 0) {
            const result = applyPunch(bot, t, false);
            t.lastHitBy = i;
            bot.punchCd = C.PUNCH_CD;
            bot.chargeTimer = 0.45;
            if (juiceFn) {
              juiceFn("botpunch", {
                ...result,
                originX: bot.x,
                originZ: bot.z,
                dirX: result.nx,
                dirZ: result.nz,
                x: t.x,
                z: t.z,
                team: bot.team,
                isHit: true,
              });
            }
          }
        }
        break;
      }

      case "sweeper": {
        // High-mobility roamer: roams across center, breaks up enemy formations
        for (let j = 0; j < entities.length; j++) {
          const e = entities[j];
          if (e.team === bot.team || e.immuneTimer > 0) continue;
          const d = Math.hypot(e.x - bot.x, e.z - bot.z);
          if (d < targetDist) {
            targetDist = d;
            targetIdx = j;
          }
        }

        if (targetIdx >= 0) {
          const t = entities[targetIdx];
          const dx = t.x - bot.x;
          const dz = t.z - bot.z;
          const d = Math.hypot(dx, dz) || 1;
          moveX = dx / d;
          moveZ = dz / d;

          if (d > 3.5 && d < 7.0 && bot.dashCd <= 0 && Math.random() < 0.3) {
            shouldDash = true;
          }

          if (d < C.PUNCH_RANGE && bot.punchCd <= 0 && bot.chargeTimer <= 0) {
            const result = applyPunch(bot, t, false);
            t.lastHitBy = i;
            bot.punchCd = C.PUNCH_CD;
            bot.chargeTimer = 0.42;
            if (juiceFn) {
              juiceFn("botpunch", {
                ...result,
                originX: bot.x,
                originZ: bot.z,
                dirX: result.nx,
                dirZ: result.nz,
                x: t.x,
                z: t.z,
                team: bot.team,
                isHit: true,
              });
            }
          }
        }
        break;
      }
    }

    // 3. Smart Edge & Abyss Repulsion (Strict Anti-Suicide Barrier)
    const margin = 3.6;
    let repelX = 0;
    let repelZ = 0;

    if (bot.x < -halfW + margin) repelX += (margin - (bot.x + halfW)) / margin;
    if (bot.x > halfW - margin) repelX -= (margin - (halfW - bot.x)) / margin;
    if (bot.z < -halfL + margin) repelZ += (margin - (bot.z + halfL)) / margin;
    if (bot.z > halfL - margin) repelZ -= (margin - (halfL - bot.z)) / margin;

    if (repelX !== 0 || repelZ !== 0) {
      // Strongly prioritize staying on the platform over chasing
      moveX = moveX * 0.3 + repelX * 1.6;
      moveZ = moveZ * 0.3 + repelZ * 1.6;
      const mLen = Math.hypot(moveX, moveZ) || 1;
      moveX /= mLen;
      moveZ /= mLen;
      // Do not dash toward an edge!
      shouldDash = false;
    }

    // 4. Intelligent Mystery Box Skill Activation
    if (skillSlots && skillSlots[i] && skillSlots[i].type !== SkillType.None && onActivateSkill) {
      const slot = skillSlots[i];
      let shouldActivateSkill = false;

      if (slot.type === SkillType.RocketBoost) {
        // Rocket if target is moderately far
        shouldActivateSkill = targetDist > 6.0;
      } else if (
        slot.type === SkillType.GigaFist ||
        slot.type === SkillType.OnePunchMan ||
        slot.type === SkillType.BounceBomb ||
        slot.type === SkillType.ShrinkZap
      ) {
        // Power punches & projectiles when near enemy
        shouldActivateSkill = targetDist < 6.5;
      } else if (slot.type === SkillType.GigaMagnet) {
        shouldActivateSkill = targetDist < 9.0;
      } else if (slot.type === SkillType.BananaPeel) {
        // Drop peel defensively
        shouldActivateSkill = true;
      }

      if (shouldActivateSkill && Math.random() < 0.45) {
        onActivateSkill(i);
      }
    }

    // 5. Dash Physics (Identical to PlayerController)
    if (shouldDash && bot.dashCd <= 0 && bot.dashTimer <= 0 && !bot.launched) {
      bot.dashTimer = C.DASH_DUR;
      bot.dashCd = C.DASH_CD;
      let dirX = moveX;
      let dirZ = moveZ;
      if (dirX === 0 && dirZ === 0) {
        dirX = bot.vx;
        dirZ = bot.vz;
        if (dirX === 0 && dirZ === 0) dirZ = bot.team === 0 ? 1.0 : -1.0;
      }
      const dLen = Math.hypot(dirX, dirZ) || 1;
      bot.vx = (dirX / dLen) * C.DASH_SPEED;
      bot.vz = (dirZ / dLen) * C.DASH_SPEED;
      if (juiceFn) juiceFn("dash");
    }

    // 6. Smooth Snappy Kinematics (Responsive 24.0/s Accel & 16.0/s Decel Matching Player)
    if (!bot.launched && bot.dashTimer <= 0) {
      const hasInput = Math.hypot(moveX, moveZ) > 0.05;
      const targetVx = moveX * C.PLAYER_SPEED;
      const targetVz = moveZ * C.PLAYER_SPEED;
      const accelRate = hasInput ? 24.0 : 16.0;
      bot.vx += (targetVx - bot.vx) * Math.min(1.0, accelRate * dt);
      bot.vz += (targetVz - bot.vz) * Math.min(1.0, accelRate * dt);
    }
  }
}
