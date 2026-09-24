/**
 * BOUNCEBACK! — Mystery Power-Up Skill System (Nintendo Party Style)
 *
 * Spawns rotating holographic Mystery Cubes in the arena.
 * When a player/bot collides with one, they receive 1 of 6 random skills.
 * Skills are activated instantly (bots) or on player input.
 */
import * as THREE from "three";
import * as C from "./config";
import { Entity, applyPunch } from "./physics";

// ─── Skill Type Enum ───
export enum SkillType {
  None = 0,
  GigaFist = 1,    // Mega punch with 3x range and 3x impulse
  BananaPeel = 2,  // Drop a banana trap on the ground
  RocketBoost = 3, // 2.5s of unstoppable bulldozer mode
  GigaMagnet = 4,  // Pull 3 nearest enemies toward you
  BounceBomb = 5,  // Roll an explosive pinball ball
  ShrinkZap = 6,   // Shrink nearest enemy to half size
}

export const SKILL_NAMES: Record<SkillType, string> = {
  [SkillType.None]: "",
  [SkillType.GigaFist]: "GIGA FIST",
  [SkillType.BananaPeel]: "BANANA",
  [SkillType.RocketBoost]: "ROCKET",
  [SkillType.GigaMagnet]: "MAGNET",
  [SkillType.BounceBomb]: "BOMB",
  [SkillType.ShrinkZap]: "SHRINK",
};

export const SKILL_ICONS: Record<SkillType, string> = {
  [SkillType.None]: "",
  [SkillType.GigaFist]: "🥊",
  [SkillType.BananaPeel]: "🍌",
  [SkillType.RocketBoost]: "🚀",
  [SkillType.GigaMagnet]: "🧲",
  [SkillType.BounceBomb]: "💣",
  [SkillType.ShrinkZap]: "🩳",
};

// ─── Mystery Box Config ───
const BOX_COUNT = 4;
const BOX_RESPAWN_TIME = 6.0;  // seconds before a collected box reappears
const BOX_PICKUP_RADIUS = 1.5; // collision radius
const BOX_FLOAT_HEIGHT = 1.8;  // hover Y
const BOX_SPIN_SPEED = 1.5;    // radians/sec

// ─── Banana Trap ───
export interface BananaTrap {
  x: number;
  z: number;
  timer: number;       // lifetime countdown
  mesh: THREE.Object3D;
}

const BANANA_LIFETIME = 12.0;
const BANANA_SLIP_RADIUS = 1.2;
const BANANA_SLIP_DURATION = 1.5;

// ─── Bounce Bomb ───
export interface BounceBomb {
  x: number;
  z: number;
  vx: number;
  vz: number;
  timer: number;       // detonation countdown
  mesh: THREE.Object3D;
}

const BOMB_LIFETIME = 3.0;
const BOMB_SPEED = 12.0;
const BOMB_RADIUS = 1.0;
const BOMB_BLAST_RADIUS = 6.0;
const BOMB_BLAST_IMPULSE = 16.0;

// ─── Skill Durations ───
const ROCKET_DURATION = 2.5;
const ROCKET_SPEED = C.PLAYER_SPEED * 3;
const SHRINK_DURATION = 4.0;
const SHRINK_SCALE = 0.5;
const MAGNET_PULL_RADIUS = 10.0;
const MAGNET_PULL_COUNT = 3;
const MAGNET_PULL_SPEED = 20.0;
const GIGA_FIST_RANGE = C.PUNCH_RANGE * 2.5;
const GIGA_FIST_IMPULSE = C.PUNCH_IMPULSE * 3;

// ─── Mystery Box Data ───
interface MysteryBox {
  x: number;
  z: number;
  active: boolean;
  respawnTimer: number;
  mesh: THREE.Object3D;
}

// ─── Skill State per Entity ───
export interface SkillSlot {
  type: SkillType;
  // Active effect timers
  rocketTimer: number;
  shrinkTimer: number;
  shrinkScale: number;
  slipTimer: number;
  slipSpinAngle: number;
  magnetCooldown: number;
}

export function createEmptySkillSlot(): SkillSlot {
  return {
    type: SkillType.None,
    rocketTimer: 0,
    shrinkTimer: 0,
    shrinkScale: 1.0,
    slipTimer: 0,
    slipSpinAngle: 0,
    magnetCooldown: 0,
  };
}

// ─── Callback types ───
export type SkillEventFn = (event: string, data?: unknown) => void;

// ═══════════════════════════════════════════
//  SKILL MANAGER
// ═══════════════════════════════════════════
export class SkillManager {
  private boxes: MysteryBox[] = [];
  bananas: BananaTrap[] = [];
  bombs: BounceBomb[] = [];
  private scene: THREE.Scene;

  // Shared geometry/material for mystery cubes
  private boxGeo: THREE.BoxGeometry;
  private boxMat: THREE.MeshStandardMaterial;
  private boxInnerMat: THREE.MeshStandardMaterial;
  // Banana mesh material
  private bananaMat: THREE.MeshStandardMaterial;
  // Bomb mesh material
  private bombMat: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Golden holographic cube
    this.boxGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
    this.boxMat = new THREE.MeshStandardMaterial({
      color: C.GOLD,
      emissive: new THREE.Color(C.GOLD),
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.15,
      transparent: true,
      opacity: 0.85,
    });
    this.boxInnerMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.4,
    });
    this.bananaMat = new THREE.MeshStandardMaterial({
      color: 0xffe135,
      emissive: new THREE.Color(0xffe135),
      emissiveIntensity: 0.3,
      roughness: 0.3,
    });
    this.bombMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      emissive: new THREE.Color(C.TEAM_CORAL),
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.6,
    });
  }

  init() {
    // Spawn mystery boxes at 4 positions
    const halfW = C.ARENA_W * 0.35;
    const halfL = C.ARENA_L * 0.25;
    const positions = [
      { x: -halfW, z: -halfL },
      { x: halfW, z: -halfL },
      { x: -halfW, z: halfL },
      { x: halfW, z: halfL },
    ];

    for (let i = 0; i < BOX_COUNT; i++) {
      const pos = positions[i];
      const mesh = this.createBoxMesh();
      mesh.position.set(pos.x, BOX_FLOAT_HEIGHT, pos.z);
      this.scene.add(mesh);

      this.boxes.push({
        x: pos.x,
        z: pos.z,
        active: true,
        respawnTimer: 0,
        mesh,
      });
    }
  }

  private createBoxMesh(): THREE.Object3D {
    const group = new THREE.Group();

    // 1. Translucent Golden Beveled Cube
    const outer = new THREE.Mesh(this.boxGeo, this.boxMat);
    outer.castShadow = true;
    group.add(outer);

    // 2. Rotating Inner Golden Diamond Star
    const innerGeo = new THREE.OctahedronGeometry(0.38, 0);
    const inner = new THREE.Mesh(innerGeo, this.boxInnerMat);
    group.add(inner);

    // 3. Question mark canvas sprite inside cube
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      canvas.width = 128;
      canvas.height = 128;
      const c = canvas.getContext("2d")!;
      c.fillStyle = "#ffffff";
      c.font = "900 84px 'Arial Black', sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.shadowColor = "#ffd166";
      c.shadowBlur = 12;
      c.fillText("?", 64, 66);
      const tex = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.95 });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(0.68, 0.68, 1);
      group.add(sprite);
    }

    // 4. Orbiting Sparkle Dust Halo Ring
    const sparkCount = 16;
    const sparkPositions = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * Math.PI * 2;
      const r = 0.72;
      sparkPositions[i * 3] = Math.cos(angle) * r;
      sparkPositions[i * 3 + 1] = (Math.sin(angle * 2) * 0.18);
      sparkPositions[i * 3 + 2] = Math.sin(angle) * r;
    }
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xffd166,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    group.add(sparks);

    // 5. Point Light Glow
    const light = new THREE.PointLight(C.GOLD, 0.8, 5);
    light.position.y = 0.1;
    group.add(light);

    // 6. Ground Projection Ring (at local y = -BOX_FLOAT_HEIGHT + 0.02)
    const haloGeo = new THREE.RingGeometry(0.45, 0.65, 24);
    const haloMat = new THREE.MeshBasicMaterial({
      color: C.GOLD,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const groundHalo = new THREE.Mesh(haloGeo, haloMat);
    groundHalo.rotation.x = -Math.PI / 2;
    groundHalo.position.y = -BOX_FLOAT_HEIGHT + 0.02;
    group.add(groundHalo);

    return group;
  }

  private createBananaMesh(): THREE.Object3D {
    const group = new THREE.Group();

    // Banana peel core
    const coreGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.35, 8);
    const core = new THREE.Mesh(coreGeo, this.bananaMat);
    core.position.y = 0.16;
    core.castShadow = true;
    group.add(core);

    // 3 curved peel flaps
    const peelMat = this.bananaMat;
    const darkTipMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.6 });

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const flapGeo = new THREE.TorusGeometry(0.32, 0.09, 6, 12, Math.PI * 0.7);
      const flap = new THREE.Mesh(flapGeo, peelMat);
      flap.rotation.x = -Math.PI / 2;
      flap.rotation.z = angle;
      flap.position.set(Math.cos(angle) * 0.18, 0.06, Math.sin(angle) * 0.18);
      flap.castShadow = true;
      group.add(flap);

      // Tip
      const tipGeo = new THREE.SphereGeometry(0.045, 6, 6);
      const tip = new THREE.Mesh(tipGeo, darkTipMat);
      tip.position.set(Math.cos(angle) * 0.46, 0.04, Math.sin(angle) * 0.46);
      group.add(tip);
    }

    return group;
  }

  private createBombMesh(): THREE.Object3D {
    const group = new THREE.Group();

    // 1. Bomb Sphere Body
    const geo = new THREE.SphereGeometry(0.48, 16, 12);
    const mesh = new THREE.Mesh(geo, this.bombMat);
    mesh.position.y = 0.48;
    mesh.castShadow = true;
    group.add(mesh);

    // 2. Collar Neck
    const neckGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.15, 12);
    const neck = new THREE.Mesh(neckGeo, new THREE.MeshStandardMaterial({ color: 0x78716c, metalness: 0.8 }));
    neck.position.y = 0.95;
    neck.castShadow = true;
    group.add(neck);

    // 3. Glowing Fuse Spark
    const fuseGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.18, 6);
    const fuse = new THREE.Mesh(fuseGeo, new THREE.MeshBasicMaterial({ color: 0xd97706 }));
    fuse.position.set(0.04, 1.05, 0);
    fuse.rotation.z = -0.3;
    group.add(fuse);

    const sparkGeo = new THREE.OctahedronGeometry(0.1, 0);
    const sparkMesh = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color: 0xffedd5 }));
    sparkMesh.position.set(0.08, 1.15, 0);
    group.add(sparkMesh);

    // Fuse spark point light
    const spark = new THREE.PointLight(0xff4422, 1.2, 3.5);
    spark.position.set(0.08, 1.15, 0);
    group.add(spark);

    return group;
  }

  private randomSkill(): SkillType {
    const skills = [
      SkillType.GigaFist,
      SkillType.BananaPeel,
      SkillType.RocketBoost,
      SkillType.GigaMagnet,
      SkillType.BounceBomb,
      SkillType.ShrinkZap,
    ];
    return skills[Math.floor(Math.random() * skills.length)];
  }

  // Check pickup collisions for all entities
  checkPickups(entities: Entity[], skillSlots: SkillSlot[], eventFn?: SkillEventFn) {
    for (let i = 0; i < entities.length; i++) {
      const ent = entities[i];
      const slot = skillSlots[i];
      if (slot.type !== SkillType.None) continue; // already holding a skill

      for (const box of this.boxes) {
        if (!box.active) continue;
        const dx = ent.x - box.x;
        const dz = ent.z - box.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < BOX_PICKUP_RADIUS) {
          // Pickup!
          slot.type = this.randomSkill();
          box.active = false;
          box.respawnTimer = BOX_RESPAWN_TIME;
          box.mesh.visible = false;
          if (eventFn) eventFn("pickup", { entityIdx: i, skill: slot.type });

          // Bots instantly use their skill
          if (!ent.isPlayer) {
            this.activateSkill(i, ent, entities, skillSlots, eventFn);
          }
          break;
        }
      }
    }
  }

  // Activate the skill for entity at index
  activateSkill(
    idx: number,
    user: Entity,
    entities: Entity[],
    skillSlots: SkillSlot[],
    eventFn?: SkillEventFn
  ) {
    const slot = skillSlots[idx];
    if (slot.type === SkillType.None) return;

    const skillType = slot.type;
    slot.type = SkillType.None; // consume

    switch (skillType) {
      case SkillType.GigaFist: {
        // Find nearest enemy in extended range and mega-punch them
        let bestDist = GIGA_FIST_RANGE;
        let bestTarget: Entity | null = null;
        for (const e of entities) {
          if (e === user || e.team === user.team) continue;
          if (e.immuneTimer > 0) continue;
          const dx = e.x - user.x;
          const dz = e.z - user.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < bestDist) {
            bestDist = d;
            bestTarget = e;
          }
        }
        if (bestTarget) {
          const dx = bestTarget.x - user.x;
          const dz = bestTarget.z - user.z;
          const dist = Math.sqrt(dx * dx + dz * dz) || 0.01;
          const nx = dx / dist;
          const nz = dz / dist;
          bestTarget.vx = nx * GIGA_FIST_IMPULSE;
          bestTarget.vz = nz * GIGA_FIST_IMPULSE;
          bestTarget.launched = true;
          bestTarget.launchSpeed = GIGA_FIST_IMPULSE;
          bestTarget.bounceCount = 0;
          bestTarget.stunTimer = 0.5;
          bestTarget.lastHitBy = idx;
          if (eventFn) eventFn("gigafist", { x: bestTarget.x, z: bestTarget.z });
        } else {
          if (eventFn) eventFn("whiff");
        }
        break;
      }

      case SkillType.BananaPeel: {
        // Drop banana behind the user
        const behindX = user.x - (user.vx > 0 ? 1 : user.vx < 0 ? -1 : 0) * 2;
        const behindZ = user.z - (user.vz > 0 ? 1 : user.vz < 0 ? -1 : 0) * 2;
        const mesh = this.createBananaMesh();
        mesh.position.set(behindX, 0.05, behindZ);
        this.scene.add(mesh);
        this.bananas.push({
          x: behindX,
          z: behindZ,
          timer: BANANA_LIFETIME,
          mesh,
        });
        if (eventFn) eventFn("banana_drop", { x: behindX, z: behindZ });
        break;
      }

      case SkillType.RocketBoost: {
        slot.rocketTimer = ROCKET_DURATION;
        if (eventFn) eventFn("rocket_start", { entityIdx: idx });
        break;
      }

      case SkillType.GigaMagnet: {
        // Pull 3 nearest enemies toward user
        const enemies: { e: Entity; d: number }[] = [];
        for (const e of entities) {
          if (e === user || e.team === user.team) continue;
          const dx = e.x - user.x;
          const dz = e.z - user.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < MAGNET_PULL_RADIUS) {
            enemies.push({ e, d });
          }
        }
        enemies.sort((a, b) => a.d - b.d);
        const pulled = enemies.slice(0, MAGNET_PULL_COUNT);
        for (const { e } of pulled) {
          const dx = user.x - e.x;
          const dz = user.z - e.z;
          const d = Math.sqrt(dx * dx + dz * dz) || 0.01;
          e.vx = (dx / d) * MAGNET_PULL_SPEED;
          e.vz = (dz / d) * MAGNET_PULL_SPEED;
          e.stunTimer = 0.3;
        }
        if (eventFn) eventFn("magnet", { count: pulled.length });
        break;
      }

      case SkillType.BounceBomb: {
        // Roll a bomb in the direction the user faces
        const dirX = user.vx || 0;
        const dirZ = user.vz || 0;
        const dirLen = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;
        const mesh = this.createBombMesh();
        mesh.position.set(user.x, 0.5, user.z);
        this.scene.add(mesh);
        this.bombs.push({
          x: user.x + (dirX / dirLen) * 1.5,
          z: user.z + (dirZ / dirLen) * 1.5,
          vx: (dirX / dirLen) * BOMB_SPEED,
          vz: (dirZ / dirLen) * BOMB_SPEED,
          timer: BOMB_LIFETIME,
          mesh,
        });
        if (eventFn) eventFn("bomb_roll");
        break;
      }

      case SkillType.ShrinkZap: {
        // Shrink nearest enemy
        let bestDist2 = 12;
        let bestSlotIdx = -1;
        let bestEnt: Entity | null = null;
        for (let j = 0; j < entities.length; j++) {
          const e = entities[j];
          if (e === user || e.team === user.team) continue;
          const dx = e.x - user.x;
          const dz = e.z - user.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < bestDist2) {
            bestDist2 = d;
            bestSlotIdx = j;
            bestEnt = e;
          }
        }
        if (bestSlotIdx >= 0 && bestEnt) {
          skillSlots[bestSlotIdx].shrinkTimer = SHRINK_DURATION;
          skillSlots[bestSlotIdx].shrinkScale = SHRINK_SCALE;
          if (eventFn) eventFn("shrink", { x: bestEnt.x, z: bestEnt.z });
        }
        break;
      }
    }
  }

  // Update all active effects per frame
  update(
    entities: Entity[],
    skillSlots: SkillSlot[],
    dt: number,
    eventFn?: SkillEventFn
  ) {
    // ─── Mystery Box respawn timers ───
    for (const box of this.boxes) {
      if (!box.active) {
        box.respawnTimer -= dt;
        if (box.respawnTimer <= 0) {
          box.active = true;
          box.mesh.visible = true;
        }
      }
    }

    // ─── Animate active boxes (spin + bob) ───
    const now = performance.now() * 0.001;
    for (const box of this.boxes) {
      if (!box.active) continue;
      box.mesh.rotation.y = now * BOX_SPIN_SPEED;
      box.mesh.position.y = BOX_FLOAT_HEIGHT + Math.sin(now * 2 + box.x) * 0.3;
    }

    // ─── Rocket Boost ───
    for (let i = 0; i < skillSlots.length && i < entities.length; i++) {
      const slot = skillSlots[i];
      const ent = entities[i];
      if (slot.rocketTimer > 0) {
        slot.rocketTimer -= dt;
        // Override speed: bulldozer mode
        const spd = Math.sqrt(ent.vx * ent.vx + ent.vz * ent.vz);
        if (spd > 0.1) {
          ent.vx = (ent.vx / spd) * ROCKET_SPEED;
          ent.vz = (ent.vz / spd) * ROCKET_SPEED;
        }
        // Bulldoze: knock away enemies in path
        for (let j = 0; j < entities.length; j++) {
          if (j === i) continue;
          const e = entities[j];
          if (e.team === ent.team) continue;
          const dx = e.x - ent.x;
          const dz = e.z - ent.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < ent.radius + e.radius + 0.3) {
            // Bulldoze hit
            const nd = d || 0.01;
            e.vx = (dx / nd) * 18;
            e.vz = (dz / nd) * 18;
            e.launched = true;
            e.launchSpeed = 18;
            e.stunTimer = 0.5;
            e.lastHitBy = i;
            if (eventFn) eventFn("rocket_hit", { x: e.x, z: e.z });
          }
        }
        if (slot.rocketTimer <= 0) {
          if (eventFn) eventFn("rocket_end");
        }
      }
    }

    // ─── Shrink Effect ───
    for (let i = 0; i < skillSlots.length && i < entities.length; i++) {
      const slot = skillSlots[i];
      if (slot.shrinkTimer > 0) {
        slot.shrinkTimer -= dt;
        slot.shrinkScale = SHRINK_SCALE;
        if (slot.shrinkTimer <= 0) {
          slot.shrinkScale = 1.0;
        }
      }
    }

    // ─── Banana Slip Check ───
    for (let bi = this.bananas.length - 1; bi >= 0; bi--) {
      const banana = this.bananas[bi];
      banana.timer -= dt;
      if (banana.timer <= 0) {
        this.scene.remove(banana.mesh);
        this.bananas.splice(bi, 1);
        continue;
      }
      // Check entity collisions
      for (let i = 0; i < entities.length; i++) {
        const ent = entities[i];
        const slot = skillSlots[i];
        if (slot.slipTimer > 0) continue; // already slipping
        const dx = ent.x - banana.x;
        const dz = ent.z - banana.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < BANANA_SLIP_RADIUS) {
          slot.slipTimer = BANANA_SLIP_DURATION;
          slot.slipSpinAngle = 0;
          ent.stunTimer = BANANA_SLIP_DURATION;
          ent.vx = 0;
          ent.vz = 0;
          this.scene.remove(banana.mesh);
          this.bananas.splice(bi, 1);
          if (eventFn) eventFn("banana_slip", { entityIdx: i, x: ent.x, z: ent.z });
          break;
        }
      }
    }

    // ─── Slip Spin Visual ───
    for (let i = 0; i < skillSlots.length && i < entities.length; i++) {
      const slot = skillSlots[i];
      if (slot.slipTimer > 0) {
        slot.slipTimer -= dt;
        slot.slipSpinAngle += dt * 12; // fast spin
      }
    }

    // ─── Bomb Physics ───
    const halfW = C.ARENA_W * 0.5;
    const halfL = C.ARENA_L * 0.5;
    for (let bi = this.bombs.length - 1; bi >= 0; bi--) {
      const bomb = this.bombs[bi];
      bomb.timer -= dt;
      bomb.x += bomb.vx * dt;
      bomb.z += bomb.vz * dt;

      // Wall bounce
      if (bomb.x < -halfW || bomb.x > halfW) {
        bomb.vx *= -0.9;
        bomb.x = Math.max(-halfW, Math.min(halfW, bomb.x));
      }
      if (bomb.z < -halfL || bomb.z > halfL) {
        bomb.vz *= -0.9;
        bomb.z = Math.max(-halfL, Math.min(halfL, bomb.z));
      }

      // Friction
      bomb.vx *= 0.995;
      bomb.vz *= 0.995;

      // Update mesh
      bomb.mesh.position.set(bomb.x, 0.5, bomb.z);
      bomb.mesh.rotation.x += dt * 5;

      // Detonate on timer
      if (bomb.timer <= 0) {
        // Blast: push all entities in radius
        for (let i = 0; i < entities.length; i++) {
          const ent = entities[i];
          const dx = ent.x - bomb.x;
          const dz = ent.z - bomb.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < BOMB_BLAST_RADIUS) {
            const nd = d || 0.01;
            const power = (1 - d / BOMB_BLAST_RADIUS) * BOMB_BLAST_IMPULSE;
            ent.vx += (dx / nd) * power;
            ent.vz += (dz / nd) * power;
            ent.launched = true;
            ent.launchSpeed = power;
            ent.stunTimer = 0.4;
          }
        }
        this.scene.remove(bomb.mesh);
        this.bombs.splice(bi, 1);
        if (eventFn) eventFn("bomb_explode", { x: bomb.x, z: bomb.z });
      }
    }
  }

  destroy() {
    for (const box of this.boxes) {
      this.scene.remove(box.mesh);
    }
    for (const banana of this.bananas) {
      this.scene.remove(banana.mesh);
    }
    for (const bomb of this.bombs) {
      this.scene.remove(bomb.mesh);
    }
    this.boxes = [];
    this.bananas = [];
    this.bombs = [];
  }
}
