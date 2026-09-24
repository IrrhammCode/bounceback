/**
 * BOUNCEBACK! — AI Bot System (FSM with Max-Pursuers Rule)
 * 4 friendly bots + 5 enemy bots, each with a role.
 */
import * as C from "./config";
import { Entity, applyPunch, type BumperData, type GateData } from "./physics";
import type { JuiceFn } from "./player";

const ROLES = ["setter", "guard", "flanker", "finisher"] as const;

export function assignRoles(entities: Entity[]) {
  for (let team = 0; team < 2; team++) {
    const start = team === 0 ? 1 : 5;
    const count = team === 0 ? 4 : 5;
    for (let i = 0; i < count; i++) {
      const idx = start + i;
      if (idx < entities.length) {
        entities[idx].role = ROLES[i % ROLES.length];
      }
    }
  }
}

export function updateBots(
  entities: Entity[],
  _bumpers: BumperData[],
  gates: GateData[],
  _dt: number,
  juiceFn?: JuiceFn
) {
  const pursuitCount = new Map<number, number>();

  for (let i = 0; i < entities.length; i++) {
    const bot = entities[i];
    if (bot.isPlayer) continue;
    if (bot.launched || bot.stunTimer > 0) continue;

    const ownGate = gates.find((g) => g.team === bot.team);

    let targetIdx = -1;
    let targetDist = Infinity;
    let moveX = 0,
      moveZ = 0;

    switch (bot.role) {
      case "setter": {
        for (let j = 0; j < entities.length; j++) {
          const e = entities[j];
          if (e.team === bot.team || e.launched || e.immuneTimer > 0) continue;
          const dx = e.x - bot.x,
            dz = e.z - bot.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          const count = pursuitCount.get(j) || 0;
          if (count >= C.MAX_PURSUERS) continue;
          if (d < targetDist) {
            targetDist = d;
            targetIdx = j;
          }
        }
        if (targetIdx >= 0) {
          pursuitCount.set(
            targetIdx,
            (pursuitCount.get(targetIdx) || 0) + 1
          );
          const t = entities[targetIdx];
          const dx = t.x - bot.x,
            dz = t.z - bot.z;
          const d = Math.sqrt(dx * dx + dz * dz) || 1;
          moveX = dx / d;
          moveZ = dz / d;
          if (d < C.BOT_PUNCH_RANGE && bot.punchCd <= 0) {
            const result = applyPunch(bot, t, false);
            t.lastHitBy = i;
            bot.punchCd = C.PUNCH_CD + 0.2;
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

      case "guard": {
        if (ownGate) {
          let guardX = ownGate.x;
          let guardZ = ownGate.z + (bot.team === 0 ? 3 : -3);
          let threatDist = 8;
          let threat: Entity | null = null;
          for (const e of entities) {
            if (e.team === bot.team || !e.launched) continue;
            const dx = e.x - ownGate.x,
              dz = e.z - ownGate.z;
            const d = Math.sqrt(dx * dx + dz * dz);
            if (d < threatDist) {
              threatDist = d;
              threat = e;
            }
          }
          if (threat) {
            guardX = threat.x + threat.vx * 0.3;
            guardZ = threat.z + threat.vz * 0.3;
          }
          const dx = guardX - bot.x,
            dz = guardZ - bot.z;
          const d = Math.sqrt(dx * dx + dz * dz) || 1;
          moveX = dx / d;
          moveZ = dz / d;
          if (d < 1.0) {
            moveX = 0;
            moveZ = 0;
          }
        }
        break;
      }

      case "flanker": {
        let bestEdgeEnemy = -1,
          bestEdgeDist = Infinity;
        const halfW = C.ARENA_W * 0.5;
        const halfL = C.ARENA_L * 0.5;
        for (let j = 0; j < entities.length; j++) {
          const e = entities[j];
          if (e.team === bot.team || e.launched || e.immuneTimer > 0) continue;
          const count = pursuitCount.get(j) || 0;
          if (count >= C.MAX_PURSUERS) continue;
          const edgeness = Math.max(
            Math.abs(e.x) / halfW,
            Math.abs(e.z) / halfL
          );
          const dx = e.x - bot.x,
            dz = e.z - bot.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          const score = d - edgeness * 5;
          if (score < bestEdgeDist) {
            bestEdgeDist = score;
            bestEdgeEnemy = j;
          }
        }
        if (bestEdgeEnemy >= 0) {
          pursuitCount.set(
            bestEdgeEnemy,
            (pursuitCount.get(bestEdgeEnemy) || 0) + 1
          );
          const t = entities[bestEdgeEnemy];
          const px = t.x + t.vx * 0.5;
          const pz = t.z + t.vz * 0.5;
          const dx = px - bot.x,
            dz = pz - bot.z;
          const d = Math.sqrt(dx * dx + dz * dz) || 1;
          moveX = dx / d;
          moveZ = dz / d;
          const actualD = Math.sqrt(
            (t.x - bot.x) ** 2 + (t.z - bot.z) ** 2
          );
          if (actualD < C.BOT_PUNCH_RANGE && bot.punchCd <= 0) {
            const result = applyPunch(bot, t, false);
            t.lastHitBy = i;
            bot.punchCd = C.PUNCH_CD + 0.25;
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

      case "finisher": {
        let bestLaunched: Entity | null = null,
          bestLD = 12;
        for (const e of entities) {
          if (e.team === bot.team || !e.launched) continue;
          if (e.immuneTimer > 0) continue;
          const dx = e.x - bot.x,
            dz = e.z - bot.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < bestLD) {
            bestLD = d;
            bestLaunched = e;
          }
        }
        if (bestLaunched) {
          const px = bestLaunched.x + bestLaunched.vx * 0.2;
          const pz = bestLaunched.z + bestLaunched.vz * 0.2;
          const dx = px - bot.x,
            dz = pz - bot.z;
          const d = Math.sqrt(dx * dx + dz * dz) || 1;
          moveX = dx / d;
          moveZ = dz / d;
        } else {
          for (let j = 0; j < entities.length; j++) {
            const e = entities[j];
            if (e.team === bot.team || e.launched || e.immuneTimer > 0)
              continue;
            const count = pursuitCount.get(j) || 0;
            if (count >= C.MAX_PURSUERS) continue;
            const dx = e.x - bot.x,
              dz = e.z - bot.z;
            const d = Math.sqrt(dx * dx + dz * dz);
            if (d < targetDist) {
              targetDist = d;
              targetIdx = j;
            }
          }
          if (targetIdx >= 0) {
            pursuitCount.set(
              targetIdx,
              (pursuitCount.get(targetIdx) || 0) + 1
            );
            const t = entities[targetIdx];
            const dx = t.x - bot.x,
              dz = t.z - bot.z;
            const d = Math.sqrt(dx * dx + dz * dz) || 1;
            moveX = dx / d;
            moveZ = dz / d;
            if (d < C.BOT_PUNCH_RANGE && bot.punchCd <= 0) {
              const result = applyPunch(bot, t, false);
              t.lastHitBy = i;
              bot.punchCd = C.PUNCH_CD + 0.3;
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
        }
        break;
      }
    }

    const botSpeed = C.PLAYER_SPEED * 0.85;
    bot.vx = moveX * botSpeed;
    bot.vz = moveZ * botSpeed;
  }
}
