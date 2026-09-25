/**
 * BOUNCEBACK! — Mystery Power-Up Skill System (AAA Nintendo Party Visuals)
 *
 * Spawns rotating holographic Mystery Cubes in the arena.
 * When a player/bot collides with one, they receive 1 of 6 random skills.
 * Features full 3D visual FX:
 * - GIGA FIST: 3D Giant Cartoon Spring Boxing Glove punching outward with shockwave
 * - ROCKET BOOST: Twin chrome jet thrusters with billowing flame & smoke particle plumes
 * - GIGA MAGNET: Floating holographic horseshoe magnet + concentric forcefields & lightning tethers
 * - BOUNCE BOMB: Red pulsing pinball bomb + gigantic cartoon mushroom fireball dome with scorch marks
 * - SHRINK ZAP: High-energy electric laser beam + collapsing quantum rings & cartoon pop
 * - BANANA PEEL: Flying spinning peel + 720 degree victim slip spin with orbiting halo stars
 */
import * as THREE from "three";
import * as C from "./config";
import { Entity } from "./physics";
import { sfxSkillSpawn, sfxSkillAcquire } from "./audio";

// ─── Skill Type Enum ───
export enum SkillType {
  None = 0,
  GigaFist = 1,    // Mega punch with 3x range and 3x impulse
  BananaPeel = 2,  // Drop a banana trap on the ground
  RocketBoost = 3, // 2.5s of unstoppable bulldozer mode
  GigaMagnet = 4,  // Pull 3 nearest enemies toward you
  BounceBomb = 5,  // Roll an explosive pinball ball
  ShrinkZap = 6,   // Shrink nearest enemy to half size
  OnePunchMan = 7, // ONE PUNCH MAN: Saitama Serious Punch that blasts enemy straight into the goal!
}

export const SKILL_NAMES: Record<SkillType, string> = {
  [SkillType.None]: "",
  [SkillType.GigaFist]: "GIGA FIST",
  [SkillType.BananaPeel]: "BANANA",
  [SkillType.RocketBoost]: "ROCKET",
  [SkillType.GigaMagnet]: "MAGNET",
  [SkillType.BounceBomb]: "BOMB",
  [SkillType.ShrinkZap]: "SHRINK",
  [SkillType.OnePunchMan]: "ONE PUNCH",
};

export const SKILL_ICONS: Record<SkillType, string> = {
  [SkillType.None]: "",
  [SkillType.GigaFist]: "FIST",
  [SkillType.BananaPeel]: "SLIP",
  [SkillType.RocketBoost]: "NITRO",
  [SkillType.GigaMagnet]: "PULL",
  [SkillType.BounceBomb]: "BLAST",
  [SkillType.ShrinkZap]: "RAY",
  [SkillType.OnePunchMan]: "K.O.",
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
  ownerIdx?: number;
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
  ownerIdx?: number;
}

const BOMB_LIFETIME = 3.0;
const BOMB_SPEED = 12.0;
const BOMB_BLAST_RADIUS = 6.0;
const BOMB_BLAST_IMPULSE = 16.0;

// ─── Skill Durations & Parameters ───
const ROCKET_DURATION = 2.5;
const ROCKET_SPEED = C.PLAYER_SPEED * 2.8;
const SHRINK_DURATION = 4.0;
const SHRINK_SCALE = 0.5;
const MAGNET_PULL_RADIUS = 11.0;
const MAGNET_PULL_COUNT = 3;
const MAGNET_PULL_SPEED = 20.0;
const GIGA_FIST_RANGE = C.PUNCH_RANGE * 2.5;
const GIGA_FIST_IMPULSE = C.PUNCH_IMPULSE * 2.8;

// ─── Mystery Box Data ───
interface MysteryBox {
  x: number;
  z: number;
  active: boolean;
  respawnTimer: number;
  mesh: THREE.Object3D;
  dropAnim: number;
  landed: boolean;
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

export type SkillEventFn = (event: string, data?: unknown) => void;

interface ActiveSkillFX {
  update: (dt: number) => boolean; // return true if finished
  dispose: () => void;
}

// ═══════════════════════════════════════════
//  SKILL MANAGER
// ═══════════════════════════════════════════
export class SkillManager {
  private boxes: MysteryBox[] = [];
  bananas: BananaTrap[] = [];
  bombs: BounceBomb[] = [];
  private scene: THREE.Scene;
  private fxGroup = new THREE.Group();
  private activeFX: ActiveSkillFX[] = [];

  // Shared geometry/material for mystery cubes
  private boxGeo: THREE.BoxGeometry;
  private boxMat: THREE.MeshStandardMaterial;
  private boxInnerMat: THREE.MeshStandardMaterial;
  private bananaMat: THREE.MeshStandardMaterial;
  private bombMat: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.fxGroup.name = "SkillVisualEffects";
    this.scene.add(this.fxGroup);

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
        dropAnim: 0,
        landed: true,
      });
    }
  }

  getActiveBoxes(): { x: number; z: number }[] {
    return this.boxes.filter((b) => b.active).map((b) => ({ x: b.x, z: b.z }));
  }

  private createBoxMesh(): THREE.Object3D {
    const group = new THREE.Group();

    // 1. Translucent Golden Beveled Cube (1.2m size)
    const outerGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const outer = new THREE.Mesh(outerGeo, this.boxMat);
    outer.castShadow = true;
    group.add(outer);

    // 2. Rotating Inner Golden Diamond Star Core
    const innerGeo = new THREE.OctahedronGeometry(0.55, 0);
    const inner = new THREE.Mesh(innerGeo, this.boxInnerMat);
    group.add(inner);
    group.userData.inner = inner;

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
      c.shadowBlur = 16;
      c.fillText("?", 64, 66);
      const tex = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.95 });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(0.9, 0.9, 1);
      group.add(sprite);
    }

    // 4. Orbiting Sparkle Dust Halo Ring (32 particles)
    const sparkCount = 32;
    const sparkPositions = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * Math.PI * 2;
      const r = 1.05;
      sparkPositions[i * 3] = Math.cos(angle) * r;
      sparkPositions[i * 3 + 1] = Math.sin(angle * 3) * 0.28;
      sparkPositions[i * 3 + 2] = Math.sin(angle) * r;
    }
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xfff3b0,
      size: 0.15,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    group.add(sparkPoints);
    group.userData.sparks = sparkPoints;

    // 5. Giant 24m Vertical Volumetric Sky Beacon Light Beam
    const beaconGeo = new THREE.CylinderGeometry(0.35, 0.65, 24, 16);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: 0xffd166,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 12.0;
    group.add(beacon);
    group.userData.beacon = beacon;

    // Top Sky Crown Flare
    const flareGeo = new THREE.SphereGeometry(0.8, 12, 10);
    const flareMat = new THREE.MeshBasicMaterial({
      color: 0xfff066,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const crownFlare = new THREE.Mesh(flareGeo, flareMat);
    crownFlare.position.y = 24.0;
    group.add(crownFlare);

    // 6. Ground Projection Target Ring on arena floor with segmented runes
    const ringGeo = new THREE.RingGeometry(0.8, 1.8, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd166,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const floorRing = new THREE.Mesh(ringGeo, ringMat);
    floorRing.rotation.x = -Math.PI / 2;
    floorRing.position.y = -BOX_FLOAT_HEIGHT + 0.08;
    group.add(floorRing);
    group.userData.floorRing = floorRing;

    // Outer Target Pulse Ring
    const outerRingGeo = new THREE.RingGeometry(2.1, 2.22, 32);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x27e5ff,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const outerFloorRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerFloorRing.rotation.x = -Math.PI / 2;
    outerFloorRing.position.y = -BOX_FLOAT_HEIGHT + 0.08;
    group.add(outerFloorRing);
    group.userData.outerFloorRing = outerFloorRing;

    // 7. Dual Gyroscope Energy Torus Rings
    // Ring A: Cyan (X-axis tilt)
    const torusGeoA = new THREE.TorusGeometry(1.45, 0.045, 8, 32);
    const torusMatA = new THREE.MeshBasicMaterial({
      color: 0x27e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const torusA = new THREE.Mesh(torusGeoA, torusMatA);
    torusA.rotation.x = Math.PI / 3;
    group.add(torusA);
    group.userData.torusA = torusA;

    // Ring B: Gold/Coral (Y-axis tilt)
    const torusGeoB = new THREE.TorusGeometry(1.3, 0.04, 8, 32);
    const torusMatB = new THREE.MeshBasicMaterial({
      color: 0xffd166,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });
    const torusB = new THREE.Mesh(torusGeoB, torusMatB);
    torusB.rotation.y = Math.PI / 3;
    group.add(torusB);
    group.userData.torusB = torusB;

    return group;
  }

  private createBananaMesh(): THREE.Object3D {
    const group = new THREE.Group();
    const darkTipMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.8 });

    // Center stalk
    const stalkGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.22, 6);
    const stalk = new THREE.Mesh(stalkGeo, darkTipMat);
    stalk.position.y = 0.18;
    stalk.castShadow = true;
    group.add(stalk);

    // 4 banana peel flaps
    const flapGeo = new THREE.ConeGeometry(0.14, 0.42, 5);
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const flap = new THREE.Mesh(flapGeo, this.bananaMat);
      flap.rotation.x = -Math.PI / 2;
      flap.rotation.z = angle;
      flap.position.set(Math.cos(angle) * 0.18, 0.06, Math.sin(angle) * 0.18);
      flap.castShadow = true;
      group.add(flap);

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
      SkillType.OnePunchMan,
    ];
    return skills[Math.floor(Math.random() * skills.length)];
  }

  // Check pickup collisions for all entities
  checkPickups(entities: Entity[], skillSlots: SkillSlot[], eventFn?: SkillEventFn) {
    for (let i = 0; i < entities.length; i++) {
      const ent = entities[i];
      const slot = skillSlots[i];
      if (slot.type !== SkillType.None) continue;

      for (const box of this.boxes) {
        if (!box.active) continue;
        const dx = ent.x - box.x;
        const dz = ent.z - box.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < BOX_PICKUP_RADIUS) {
          slot.type = this.randomSkill();
          box.active = false;
          box.respawnTimer = BOX_RESPAWN_TIME;
          box.mesh.visible = false;

          const isPlayer = i === 0 || ent.isPlayer;
          if (isPlayer) {
            sfxSkillAcquire();
          }

          // Trigger 3D Starburst Pickup FX
          this.spawnBoxPickupFX(box.x, box.z, isPlayer);

          if (eventFn) {
            eventFn("pickup", {
              entityIdx: i,
              skill: slot.type,
              skillName: SKILL_NAMES[slot.type],
              isPlayer,
              x: ent.x,
              z: ent.z,
            });
          }

          if (!ent.isPlayer && i !== 0) {
            this.activateSkill(i, ent, entities, skillSlots, eventFn);
          }
          break;
        }
      }
    }
  }

  // ─── Activate Skill ───
  activateSkill(
    idx: number,
    user: Entity,
    entities: Entity[],
    skillSlots: SkillSlot[],
    eventFn?: SkillEventFn,
    gates?: { x: number; z: number; team: number; active: boolean }[]
  ) {
    const slot = skillSlots[idx];
    if (slot.type === SkillType.None) return;

    const skillType = slot.type;
    slot.type = SkillType.None; // consume

    switch (skillType) {
      case SkillType.GigaFist: {
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

        // Spawn 3D Cartoon Spring Boxing Glove Animation!
        this.spawnGigaFistFX(user, bestTarget);

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
          bestTarget.stunTimer = 0.55;
          bestTarget.lastHitBy = idx;
          if (eventFn) eventFn("gigafist", { x: bestTarget.x, z: bestTarget.z });
        } else {
          if (eventFn) eventFn("whiff");
        }
        break;
      }

      case SkillType.BananaPeel: {
        const behindX = user.x - (user.vx > 0 ? 1 : user.vx < 0 ? -1 : 0) * 1.8;
        const behindZ = user.z - (user.vz > 0 ? 1 : user.vz < 0 ? -1 : 0) * 1.8;
        const mesh = this.createBananaMesh();
        mesh.position.set(behindX, 0.05, behindZ);
        this.scene.add(mesh);
        this.bananas.push({
          x: behindX,
          z: behindZ,
          timer: BANANA_LIFETIME,
          mesh,
          ownerIdx: idx,
        });
        if (eventFn) eventFn("banana_drop", { x: behindX, z: behindZ });
        break;
      }

      case SkillType.RocketBoost: {
        slot.rocketTimer = ROCKET_DURATION;
        this.spawnRocketThrusterFX(user, slot);
        if (eventFn) eventFn("rocket_start", { entityIdx: idx });
        break;
      }

      case SkillType.GigaMagnet: {
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

        // Spawn 3D Holographic Horseshoe Magnet & Lightning Tethers!
        this.spawnMagnetFieldFX(user, pulled.map((p) => p.e));

        for (const { e } of pulled) {
          const dx = user.x - e.x;
          const dz = user.z - e.z;
          const d = Math.sqrt(dx * dx + dz * dz) || 0.01;
          e.vx = (dx / d) * MAGNET_PULL_SPEED;
          e.vz = (dz / d) * MAGNET_PULL_SPEED;
          e.stunTimer = 0.35;
        }
        if (eventFn) eventFn("magnet", { count: pulled.length });
        break;
      }

      case SkillType.BounceBomb: {
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
          ownerIdx: idx,
        });
        if (eventFn) eventFn("bomb_roll");
        break;
      }

      case SkillType.ShrinkZap: {
        let bestDist2 = 14;
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
          // Spawn 3D Neon Laser Beam connecting user to target!
          this.spawnShrinkLaserFX(user, bestEnt);
          if (eventFn) eventFn("shrink", { x: bestEnt.x, z: bestEnt.z });
        }
        break;
      }

      case SkillType.OnePunchMan: {
        let bestDist = 26.0;
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

        // Opponent defending gate (which is the goal for the user to score into!)
        let targetGate = gates ? gates.find((g) => g.team !== user.team && g.active) : null;
        if (!targetGate) {
          const halfL = C.ARENA_L * 0.5;
          const targetZ = user.team === 0 ? halfL - 1.2 : -halfL + 1.2;
          targetGate = { x: 0, z: targetZ, team: 1 - user.team, active: true };
        }

        if (bestTarget) {
          // Spawn 3D Anime One Punch Man Giant Glove & Sonic Shockwave FX
          this.spawnOnePunchManFX(user, bestTarget, targetGate);

          // Vector directly from victim into the opponent's Gate!
          const gx = targetGate.x - bestTarget.x;
          const gz = targetGate.z - bestTarget.z;
          const gDist = Math.sqrt(gx * gx + gz * gz) || 0.01;
          const ONE_PUNCH_IMPULSE = 42.0;

          bestTarget.vx = (gx / gDist) * ONE_PUNCH_IMPULSE;
          bestTarget.vz = (gz / gDist) * ONE_PUNCH_IMPULSE;
          bestTarget.launched = true;
          bestTarget.launchTimer = 0;
          bestTarget.launchSpeed = ONE_PUNCH_IMPULSE;
          bestTarget.bounceCount = 0;
          bestTarget.stunTimer = 2.0;
          bestTarget.lastHitBy = idx;

          // User lunges forward with supersonic dash
          const udx = bestTarget.x - user.x;
          const udz = bestTarget.z - user.z;
          const uDist = Math.sqrt(udx * udx + udz * udz) || 1;
          user.vx = (udx / uDist) * 14.0;
          user.vz = (udz / uDist) * 14.0;

          if (eventFn) eventFn("onepunch", { x: bestTarget.x, z: bestTarget.z, userIndex: idx });
        } else {
          this.spawnOnePunchManFX(user, null, targetGate);
          if (eventFn) eventFn("whiff");
        }
        break;
      }
    }
  }

  // ═══════════════════════════════════════════
  //  3D SKILL VISUAL EFFECTS
  // ═══════════════════════════════════════════

  // 1. Giga Fist: 3D Giant Spring Boxing Glove
  private spawnGigaFistFX(user: Entity, target?: Entity | null) {
    const fistGroup = new THREE.Group();
    const fistMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x991b1b,
      roughness: 0.2,
      metalness: 0.3,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.2,
    });

    // Main boxing glove head
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.52, 16, 14), fistMat);
    glove.scale.set(1.0, 1.25, 1.35);
    fistGroup.add(glove);

    // 4 Brass knuckles
    for (let k = -1.5; k <= 1.5; k += 1.0) {
      const knuckle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.18, 8), goldMat);
      knuckle.rotation.x = Math.PI / 2;
      knuckle.position.set(k * 0.22, 0.12, 0.65);
      fistGroup.add(knuckle);
    }

    // Glove cuff
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.32, 16), goldMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.z = -0.55;
    fistGroup.add(cuff);

    // Accordion spring arm
    const spring = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.16, 1.0, 10),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9 })
    );
    spring.rotation.x = Math.PI / 2;
    spring.position.z = -1.1;
    fistGroup.add(spring);

    fistGroup.position.set(user.x, 1.1, user.z);

    // Target direction
    let dir = new THREE.Vector3(0, 0, 1);
    if (target) {
      dir.set(target.x - user.x, 0, target.z - user.z).normalize();
    } else if (user.vx !== 0 || user.vz !== 0) {
      dir.set(user.vx, 0, user.vz).normalize();
    }
    fistGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);

    this.fxGroup.add(fistGroup);

    let age = 0;
    const maxAge = 0.32;
    const maxPunchDist = 3.6;

    this.activeFX.push({
      update: (dt: number) => {
        age += dt;
        const t = age / maxAge;
        if (t >= 1.0) return true;

        // Fast extend out, snappy retract
        const punchDist = Math.sin(t * Math.PI) * maxPunchDist;
        fistGroup.position.set(
          user.x + dir.x * punchDist,
          1.1,
          user.z + dir.z * punchDist
        );
        spring.scale.y = Math.max(0.2, punchDist * 1.5);
        spring.position.z = -punchDist * 0.5 - 0.5;
        return false;
      },
      dispose: () => {
        this.fxGroup.remove(fistGroup);
      },
    });
  }

  // 2. Rocket Boost: Twin Jet Turbines & Trailing Flame Plumes
  private spawnRocketThrusterFX(user: Entity, slot: SkillSlot) {
    const thrusterGroup = new THREE.Group();
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
    const nozzleMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });

    for (const side of [-0.32, 0.32]) {
      const tub = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.65, 12), chromeMat);
      tub.rotation.x = Math.PI / 2;
      tub.position.set(side, 0.75, -0.42);
      thrusterGroup.add(tub);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 8, 16), nozzleMat);
      ring.position.set(side, 0.75, -0.74);
      thrusterGroup.add(ring);
    }

    this.fxGroup.add(thrusterGroup);

    // Particle flame trail
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const trailPuffs: { mesh: THREE.Mesh; life: number; maxLife: number }[] = [];

    this.activeFX.push({
      update: (dt: number) => {
        if (slot.rocketTimer <= 0) return true;

        // Position thrusters with user
        thrusterGroup.position.set(user.x, 0, user.z);
        if (Math.hypot(user.vx, user.vz) > 0.4) {
          thrusterGroup.rotation.y = Math.atan2(user.vx, user.vz);
        }

        // Spawn trailing fire particles
        if (Math.random() < 0.65) {
          const puff = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), flameMat);
          puff.position.set(
            user.x + (Math.random() - 0.5) * 0.4,
            0.8 + (Math.random() - 0.5) * 0.2,
            user.z + (Math.random() - 0.5) * 0.4
          );
          this.fxGroup.add(puff);
          trailPuffs.push({ mesh: puff, life: 0.25, maxLife: 0.25 });
        }

        // Animate trail puffs
        for (let p = trailPuffs.length - 1; p >= 0; p--) {
          const puff = trailPuffs[p];
          puff.life -= dt;
          if (puff.life <= 0) {
            this.fxGroup.remove(puff.mesh);
            trailPuffs.splice(p, 1);
            continue;
          }
          const s = (1.0 - puff.life / puff.maxLife) * 1.8 + 0.5;
          puff.mesh.scale.set(s, s, s);
        }

        return false;
      },
      dispose: () => {
        this.fxGroup.remove(thrusterGroup);
        for (const p of trailPuffs) {
          this.fxGroup.remove(p.mesh);
        }
      },
    });
  }

  // 3. Giga Magnet: Floating Horseshoe Magnet + Electric Tethers
  private spawnMagnetFieldFX(user: Entity, victims: Entity[]) {
    const magnetGroup = new THREE.Group();

    // 3D Horseshoe Magnet Mesh
    const magHalf = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.12, 10, 20, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.6, roughness: 0.3 })
    );
    magHalf.rotation.z = Math.PI;
    magHalf.position.y = 2.4;
    magnetGroup.add(magHalf);

    // Silver tips
    const tipMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.8, roughness: 0.2 });
    for (const tx of [-0.5, 0.5]) {
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.22, 0.26), tipMat);
      tip.position.set(tx, 2.4, 0);
      magnetGroup.add(tip);
    }

    // Concentric Forcefield Rings
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const forceRing = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.9, 32), ringMat);
    forceRing.rotation.x = -Math.PI / 2;
    forceRing.position.y = 0.15;
    magnetGroup.add(forceRing);

    magnetGroup.position.set(user.x, 0, user.z);
    this.fxGroup.add(magnetGroup);

    // Tether lightning arcs
    const tetherLines: THREE.Line[] = [];
    for (const v of victims) {
      const pts = [
        new THREE.Vector3(user.x, 1.8, user.z),
        new THREE.Vector3((user.x + v.x) / 2, 2.2, (user.z + v.z) / 2),
        new THREE.Vector3(v.x, 1.0, v.z),
      ];
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const line = new THREE.Line(
        geom,
        new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 3 })
      );
      this.fxGroup.add(line);
      tetherLines.push(line);
    }

    let age = 0;
    const maxAge = 0.55;

    this.activeFX.push({
      update: (dt: number) => {
        age += dt;
        if (age >= maxAge) return true;

        magnetGroup.position.set(user.x, 0, user.z);
        magHalf.rotation.y += dt * 14;

        // Expanding force ring
        const s = (age / maxAge) * 12.0;
        forceRing.scale.set(s, s, s);
        ringMat.opacity = (1.0 - age / maxAge) * 0.85;

        // Update tether lines
        for (let i = 0; i < victims.length; i++) {
          const v = victims[i];
          const l = tetherLines[i];
          if (!l) continue;
          const posAttr = l.geometry.attributes.position;
          posAttr.setXYZ(0, user.x, 1.8, user.z);
          posAttr.setXYZ(
            1,
            (user.x + v.x) / 2 + (Math.random() - 0.5) * 0.6,
            1.8 + Math.random() * 0.5,
            (user.z + v.z) / 2 + (Math.random() - 0.5) * 0.6
          );
          posAttr.setXYZ(2, v.x, 1.0, v.z);
          posAttr.needsUpdate = true;
        }
        return false;
      },
      dispose: () => {
        this.fxGroup.remove(magnetGroup);
        for (const l of tetherLines) {
          this.fxGroup.remove(l);
        }
      },
    });
  }

  // 4. Bounce Bomb: Monumental 3D Fireball Explosion Sphere
  private spawnBombExplosionFX(x: number, z: number) {
    // 1. Expanding fireball dome
    const fireGeo = new THREE.SphereGeometry(1.0, 16, 12);
    const fireMat = new THREE.MeshBasicMaterial({
      color: 0xff3300,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
    });
    const fireball = new THREE.Mesh(fireGeo, fireMat);
    fireball.position.set(x, 1.2, z);
    this.fxGroup.add(fireball);

    // 2. Ground blast shockwave
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0xffcc00,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const shock = new THREE.Mesh(new THREE.RingGeometry(0.5, 1.2, 32), shockMat);
    shock.rotation.x = -Math.PI / 2;
    shock.position.set(x, 0.08, z);
    this.fxGroup.add(shock);

    // 3. Ground Scorch Decal
    const scorchMat = new THREE.MeshBasicMaterial({
      color: 0x1c1917,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const scorch = new THREE.Mesh(new THREE.CircleGeometry(2.4, 20), scorchMat);
    scorch.rotation.x = -Math.PI / 2;
    scorch.position.set(x, 0.04, z);
    this.fxGroup.add(scorch);

    let age = 0;
    const maxAge = 0.55;

    this.activeFX.push({
      update: (dt: number) => {
        age += dt;
        if (age >= maxAge) return true;

        const t = age / maxAge;
        // Expand fireball from 1 to 6.8m
        const fbScale = 1.0 + t * 5.8;
        fireball.scale.set(fbScale, fbScale * 0.85, fbScale);
        fireMat.opacity = Math.max(0, 1.0 - t * 1.3);

        // Expand ground shock
        const swScale = 1.0 + t * 7.5;
        shock.scale.set(swScale, swScale, swScale);
        shockMat.opacity = Math.max(0, 1.0 - t);

        return false;
      },
      dispose: () => {
        this.fxGroup.remove(fireball);
        this.fxGroup.remove(shock);
        // Scorch stays for a bit or cleans up
        setTimeout(() => {
          this.fxGroup.remove(scorch);
        }, 4000);
      },
    });
  }

  // 5. Shrink Zap: High-Energy Neon Laser Beam + Quantum Rings
  private spawnShrinkLaserFX(user: Entity, target: Entity) {
    const dist = Math.hypot(target.x - user.x, target.z - user.z) || 1.0;
    const beamGeo = new THREE.CylinderGeometry(0.12, 0.12, dist, 12);
    beamGeo.translate(0, dist / 2, 0);
    beamGeo.rotateX(Math.PI / 2);

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(user.x, 1.0, user.z);
    beam.lookAt(target.x, 1.0, target.z);
    this.fxGroup.add(beam);

    // Collapsing quantum rings around target
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const qRing = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.45, 24), ringMat);
    qRing.rotation.x = -Math.PI / 2;
    qRing.position.set(target.x, 1.0, target.z);
    this.fxGroup.add(qRing);

    let age = 0;
    const maxAge = 0.42;

    this.activeFX.push({
      update: (dt: number) => {
        age += dt;
        if (age >= maxAge) return true;

        const alpha = 1.0 - age / maxAge;
        beamMat.opacity = alpha * 0.95;
        // Ring compresses down as target shrinks
        const rs = Math.max(0.2, alpha * 2.2);
        qRing.scale.set(rs, rs, rs);
        qRing.position.set(target.x, 1.0 - (1 - alpha) * 0.5, target.z);
        return false;
      },
      dispose: () => {
        this.fxGroup.remove(beam);
        this.fxGroup.remove(qRing);
      },
    });
  }

  // 6. Banana Slip: 3 Orbiting Cartoon Halo Stars
  private spawnBananaSlipFX(victim: Entity) {
    const haloGroup = new THREE.Group();
    haloGroup.position.set(victim.x, 1.8, victim.z);

    const starGeo = new THREE.OctahedronGeometry(0.12, 0);
    const starMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xf59e0b,
      metalness: 0.8,
    });

    const stars: THREE.Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      const sMesh = new THREE.Mesh(starGeo, starMat);
      haloGroup.add(sMesh);
      stars.push(sMesh);
    }

    this.fxGroup.add(haloGroup);

    let age = 0;
    const maxAge = BANANA_SLIP_DURATION;

    this.activeFX.push({
      update: (dt: number) => {
        age += dt;
        if (age >= maxAge) return true;

        haloGroup.position.set(victim.x, 1.8, victim.z);
        const rot = age * 10;
        for (let i = 0; i < 3; i++) {
          const a = rot + (i / 3) * Math.PI * 2;
          stars[i].position.set(Math.cos(a) * 0.5, Math.sin(age * 8 + i) * 0.08, Math.sin(a) * 0.5);
          stars[i].rotation.y += dt * 12;
        }
        return false;
      },
      dispose: () => {
        this.fxGroup.remove(haloGroup);
      },
    });
  }

  // 7. One Punch Man: 3D Giant Saitama Serious Punch Fist & Hyper Shockwaves
  private spawnOnePunchManFX(user: Entity, target: Entity | null, targetGate: { x: number; z: number }) {
    const punchGroup = new THREE.Group();
    punchGroup.name = "OnePunchManFX";

    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0xff002b,
      emissive: 0xd90429,
      emissiveIntensity: 0.65,
      roughness: 0.15,
      metalness: 0.4,
    });
    const goldAuraMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.85,
      metalness: 0.9,
      roughness: 0.1,
    });
    const energyRingMat = new THREE.MeshBasicMaterial({
      color: 0xfff066,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });

    // 1. Gigantic Comic Serious Boxing Glove
    const giantGlove = new THREE.Mesh(new THREE.SphereGeometry(1.05, 20, 16), gloveMat);
    giantGlove.scale.set(1.1, 1.25, 1.45);
    punchGroup.add(giantGlove);

    // 4 Golden Anime Knuckle studs
    for (let k = -1.5; k <= 1.5; k += 1.0) {
      const knuckle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.35, 12), goldAuraMat);
      knuckle.rotation.x = Math.PI / 2;
      knuckle.position.set(k * 0.42, 0.22, 1.25);
      punchGroup.add(knuckle);
    }

    // Heavy Gold Cuff
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.9, 0.65, 16), goldAuraMat);
    cuff.rotation.x = Math.PI / 2;
    cuff.position.z = -1.1;
    punchGroup.add(cuff);

    // 3 Swirling Anime Energy Rings around the punch
    const rings: THREE.Mesh[] = [];
    for (let r = 0; r < 3; r++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35 + r * 0.35, 0.08, 8, 24), energyRingMat);
      ring.position.z = -0.5 + r * 0.8;
      punchGroup.add(ring);
      rings.push(ring);
    }

    // Fiery Sonic Boom Cone
    const coneGeo = new THREE.ConeGeometry(1.6, 2.8, 16, 1, true);
    coneGeo.rotateX(-Math.PI / 2);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xff5400,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });
    const sonicCone = new THREE.Mesh(coneGeo, coneMat);
    sonicCone.position.z = 1.2;
    punchGroup.add(sonicCone);

    punchGroup.position.set(user.x, 1.2, user.z);

    // Direction to target (or user velocity/forward)
    let dir = new THREE.Vector3(0, 0, user.team === 0 ? 1 : -1);
    if (target) {
      dir.set(target.x - user.x, 0, target.z - user.z).normalize();
    } else if (user.vx !== 0 || user.vz !== 0) {
      dir.set(user.vx, 0, user.vz).normalize();
    }
    punchGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    this.fxGroup.add(punchGroup);

    // Blazing Comet Trail that follows target into the goal
    let cometTrail: THREE.Mesh | null = null;
    if (target) {
      const cometGeo = new THREE.SphereGeometry(0.65, 10, 10);
      const cometMat = new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.85 });
      cometTrail = new THREE.Mesh(cometGeo, cometMat);
      cometTrail.scale.set(1.5, 1.5, 3.2);
      this.fxGroup.add(cometTrail);
    }

    let age = 0;
    const maxAge = 0.55;
    const maxPunchDist = target ? Math.min(10.0, Math.hypot(target.x - user.x, target.z - user.z) + 1.5) : 6.0;

    this.activeFX.push({
      update: (dt: number) => {
        age += dt;
        const t = age / maxAge;
        if (t >= 1.0) {
          if (cometTrail) this.fxGroup.remove(cometTrail);
          return true;
        }

        // Spin energy rings
        for (let r = 0; r < rings.length; r++) {
          rings[r].rotation.z += dt * (18.0 + r * 6.0);
        }

        // Explosive anime punch animation: Windup (0 - 0.2), Hyper Punch (0.2 - 0.6), Retract (0.6 - 1.0)
        let punchDist = 0;
        if (t < 0.2) {
          // Windup pull back
          punchDist = -(t / 0.2) * 1.2;
          punchGroup.scale.setScalar(0.9 + (t / 0.2) * 0.4);
        } else if (t < 0.6) {
          // BLAM! Forward thrust
          const pt = (t - 0.2) / 0.4;
          punchDist = -1.2 + Math.sin(pt * Math.PI * 0.5) * (maxPunchDist + 1.2);
          punchGroup.scale.setScalar(1.3 + Math.sin(pt * Math.PI) * 0.4);
          sonicCone.scale.set(1.0 + pt * 1.5, 1.0 + pt * 1.5, 1.0 + pt * 2.0);
        } else {
          // Snappy retract & fade
          const rt = (t - 0.6) / 0.4;
          punchDist = maxPunchDist * (1.0 - rt);
          punchGroup.scale.setScalar(Math.max(0.1, 1.3 * (1.0 - rt)));
        }

        punchGroup.position.set(
          user.x + dir.x * punchDist,
          1.2,
          user.z + dir.z * punchDist
        );

        // Update comet trail following target as they soar into the goal
        if (cometTrail && target) {
          cometTrail.position.set(target.x, target.mesh ? target.mesh.position.y : 1.2, target.z);
          const velLen = Math.hypot(target.vx, target.vz) || 1;
          cometTrail.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(target.vx / velLen, 0, target.vz / velLen));
        }

        return false;
      },
      dispose: () => {
        this.fxGroup.remove(punchGroup);
        if (cometTrail) this.fxGroup.remove(cometTrail);
      },
    });
  }

  // ─── 8. Mystery Box Pickup Burst FX (3D Starburst & Shockwave) ───
  private spawnBoxPickupFX(x: number, z: number, isPlayer: boolean) {
    const burstGroup = new THREE.Group();
    burstGroup.position.set(x, 1.2, z);

    // 1. Expanding Golden Shockwave Ring
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffd166,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.7, 32), ringMat);
    ring.rotation.x = -Math.PI / 2;
    burstGroup.add(ring);

    // 2. Cyan Concentric Wave for Player
    let cyanRing: THREE.Mesh | null = null;
    let cyanMat: THREE.MeshBasicMaterial | null = null;
    if (isPlayer) {
      cyanMat = new THREE.MeshBasicMaterial({
        color: 0x27e5ff,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      cyanRing = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.5, 32), cyanMat);
      cyanRing.rotation.x = -Math.PI / 2;
      cyanRing.position.y = 0.15;
      burstGroup.add(cyanRing);
    }

    // 3. 36 Starburst Spark Particles bursting in all directions
    const sparkCount = 36;
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocities: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < sparkCount; i++) {
      sparkPositions[i * 3] = 0;
      sparkPositions[i * 3 + 1] = 0;
      sparkPositions[i * 3 + 2] = 0;
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.random() * Math.PI * 0.5; // upward hemisphere
      const spd = 6.0 + Math.random() * 8.0;
      sparkVelocities.push({
        x: Math.cos(phi) * Math.sin(theta) * spd,
        y: Math.cos(theta) * spd + 2.0,
        z: Math.sin(phi) * Math.sin(theta) * spd,
      });
    }
    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xfff066,
      size: 0.22,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
    });
    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    burstGroup.add(sparkPoints);

    this.fxGroup.add(burstGroup);

    let age = 0;
    const maxAge = 0.5;

    this.activeFX.push({
      update: (dt: number) => {
        age += dt;
        const t = age / maxAge;
        if (t >= 1.0) return true;

        // Expand shockwave
        const rScale = 1.0 + t * 6.5;
        ring.scale.set(rScale, rScale, rScale);
        ringMat.opacity = Math.max(0, 1.0 - t * 1.2);

        if (cyanRing && cyanMat) {
          const cScale = 1.0 + t * 7.5;
          cyanRing.scale.set(cScale, cScale, cScale);
          cyanMat.opacity = Math.max(0, 1.0 - t);
        }

        // Animate particles
        const posAttr = sparkGeo.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < sparkCount; i++) {
          const v = sparkVelocities[i];
          posAttr.setXYZ(
            i,
            posAttr.getX(i) + v.x * dt,
            posAttr.getY(i) + v.y * dt - 9.8 * dt * dt,
            posAttr.getZ(i) + v.z * dt
          );
        }
        posAttr.needsUpdate = true;
        sparkMat.opacity = Math.max(0, 1.0 - t * 1.1);

        return false;
      },
      dispose: () => {
        this.fxGroup.remove(burstGroup);
      },
    });
  }

  // ─── 9. Mystery Box Landing Impact FX ───
  private spawnBoxLandingFX(x: number, z: number) {
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0xffd166,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const shock = new THREE.Mesh(new THREE.RingGeometry(0.4, 1.2, 28), shockMat);
    shock.rotation.x = -Math.PI / 2;
    shock.position.set(x, 0.08, z);
    this.fxGroup.add(shock);

    let age = 0;
    const maxAge = 0.35;

    this.activeFX.push({
      update: (dt: number) => {
        age += dt;
        const t = age / maxAge;
        if (t >= 1.0) return true;
        const s = 1.0 + t * 3.5;
        shock.scale.set(s, s, s);
        shockMat.opacity = Math.max(0, 1.0 - t);
        return false;
      },
      dispose: () => {
        this.fxGroup.remove(shock);
      },
    });
  }

  // ─── Title Mode Box Animation ───
  public updateTitleBoxes() {
    const now = performance.now() * 0.001;
    for (const box of this.boxes) {
      if (!box.active) continue;
      box.mesh.rotation.y = now * BOX_SPIN_SPEED;
      box.mesh.position.y = BOX_FLOAT_HEIGHT + Math.sin(now * 2 + box.x) * 0.3;
    }
  }

  // ─── Main Update Loop ───
  update(
    entities: Entity[],
    skillSlots: SkillSlot[],
    dt: number,
    eventFn?: SkillEventFn
  ) {
    // 1. Update Active Skill FX
    for (let f = this.activeFX.length - 1; f >= 0; f--) {
      const fx = this.activeFX[f];
      const isDone = fx.update(dt);
      if (isDone) {
        fx.dispose();
        this.activeFX.splice(f, 1);
      }
    }

    // 2. Mystery Box respawn timers
    for (const box of this.boxes) {
      if (!box.active) {
        box.respawnTimer -= dt;
        if (box.respawnTimer <= 0) {
          box.active = true;
          box.mesh.visible = true;
          box.dropAnim = 0.55;
          box.landed = false;
          box.mesh.position.y = 22.0;
          sfxSkillSpawn();
          if (eventFn) eventFn("box_spawn", { x: box.x, z: box.z });
        }
      }
    }

    // 3. Animate active boxes (spin + bob + beacon pulse + floor ring + torus)
    const now = performance.now() * 0.001;
    for (const box of this.boxes) {
      if (!box.active) continue;
      box.mesh.rotation.y = now * BOX_SPIN_SPEED;

      if (box.dropAnim > 0) {
        box.dropAnim -= dt;
        const t = 1.0 - Math.max(0, box.dropAnim / 0.55);
        // Supersonic ease-in drop
        const dropH = 22.0 - t * t * (22.0 - BOX_FLOAT_HEIGHT);
        box.mesh.position.y = dropH;
        box.mesh.scale.set(0.7 + t * 0.3, 1.3 - t * 0.3, 0.7 + t * 0.3);
        if (box.dropAnim <= 0 && !box.landed) {
          box.landed = true;
          box.mesh.scale.set(1, 1, 1);
          this.spawnBoxLandingFX(box.x, box.z);
        }
      } else {
        box.mesh.position.y = BOX_FLOAT_HEIGHT + Math.sin(now * 2.5 + box.x) * 0.28;
      }

      const u = box.mesh.userData;
      if (u.beacon) {
        u.beacon.material.opacity = 0.28 + Math.sin(now * 4.5) * 0.16;
      }
      if (u.floorRing) {
        const ringScale = 1.0 + Math.sin(now * 3.5) * 0.14;
        u.floorRing.scale.set(ringScale, ringScale, ringScale);
      }
      if (u.outerFloorRing) {
        u.outerFloorRing.rotation.z = now * 1.5;
        const outerScale = 1.0 + Math.cos(now * 2.8) * 0.1;
        u.outerFloorRing.scale.set(outerScale, outerScale, outerScale);
      }
      if (u.torusA) {
        u.torusA.rotation.x = now * 2.2;
        u.torusA.rotation.y = now * 1.6;
      }
      if (u.torusB) {
        u.torusB.rotation.z = -now * 1.9;
        u.torusB.rotation.x = now * 1.3;
      }
      if (u.inner) {
        u.inner.rotation.x = -now * 2.8;
        u.inner.rotation.z = now * 2.0;
      }
      if (u.sparks) {
        u.sparks.rotation.y = now * 1.8;
      }
    }

    // 4. Rocket Boost active state
    for (let i = 0; i < skillSlots.length && i < entities.length; i++) {
      const slot = skillSlots[i];
      const ent = entities[i];
      if (slot.rocketTimer > 0) {
        slot.rocketTimer -= dt;
        const spd = Math.sqrt(ent.vx * ent.vx + ent.vz * ent.vz);
        if (spd > 0.1) {
          ent.vx = (ent.vx / spd) * ROCKET_SPEED;
          ent.vz = (ent.vz / spd) * ROCKET_SPEED;
        }
        // Bulldoze enemies
        for (let j = 0; j < entities.length; j++) {
          if (j === i) continue;
          const e = entities[j];
          if (e.team === ent.team) continue;
          const dx = e.x - ent.x;
          const dz = e.z - ent.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < ent.radius + e.radius + 0.3) {
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

    // 5. Shrink Effect countdown
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

    // 6. Banana Slip Check
    for (let bi = this.bananas.length - 1; bi >= 0; bi--) {
      const banana = this.bananas[bi];
      banana.timer -= dt;
      if (banana.timer <= 0) {
        this.scene.remove(banana.mesh);
        this.bananas.splice(bi, 1);
        continue;
      }
      for (let i = 0; i < entities.length; i++) {
        const ent = entities[i];
        const slot = skillSlots[i];
        if (slot.slipTimer > 0) continue;
        const dx = ent.x - banana.x;
        const dz = ent.z - banana.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < BANANA_SLIP_RADIUS) {
          if (banana.ownerIdx !== undefined) {
            ent.lastHitBy = banana.ownerIdx;
          }
          slot.slipTimer = BANANA_SLIP_DURATION;
          slot.slipSpinAngle = 0;
          ent.stunTimer = BANANA_SLIP_DURATION;
          ent.vx = 0;
          ent.vz = 0;
          this.scene.remove(banana.mesh);
          this.bananas.splice(bi, 1);
          // Spawn orbiting halo stars!
          this.spawnBananaSlipFX(ent);
          if (eventFn) eventFn("banana_slip", { entityIdx: i, x: ent.x, z: ent.z });
          break;
        }
      }
    }

    // 7. Banana Slip Spin
    for (let i = 0; i < skillSlots.length && i < entities.length; i++) {
      const slot = skillSlots[i];
      if (slot.slipTimer > 0) {
        slot.slipTimer -= dt;
        slot.slipSpinAngle += dt * 24; // Fast cartoon spin!
      }
    }

    // 8. Bomb Physics & Blast
    const halfW = C.ARENA_W * 0.5;
    const halfL = C.ARENA_L * 0.5;
    for (let bi = this.bombs.length - 1; bi >= 0; bi--) {
      const bomb = this.bombs[bi];
      bomb.timer -= dt;
      bomb.x += bomb.vx * dt;
      bomb.z += bomb.vz * dt;

      if (bomb.x < -halfW || bomb.x > halfW) {
        bomb.vx *= -0.9;
        bomb.x = Math.max(-halfW, Math.min(halfW, bomb.x));
      }
      if (bomb.z < -halfL || bomb.z > halfL) {
        bomb.vz *= -0.9;
        bomb.z = Math.max(-halfL, Math.min(halfL, bomb.z));
      }

      bomb.vx *= 0.995;
      bomb.vz *= 0.995;

      bomb.mesh.position.set(bomb.x, 0.5, bomb.z);
      bomb.mesh.rotation.x += dt * 6;

      // Pulse red as countdown nears 0
      const pulseSpeed = 10 + (1 - bomb.timer / BOMB_LIFETIME) * 20;
      this.bombMat.emissiveIntensity = 0.4 + Math.sin(now * pulseSpeed) * 0.5;

      if (bomb.timer <= 0) {
        // Blast push
        for (let i = 0; i < entities.length; i++) {
          const ent = entities[i];
          const dx = ent.x - bomb.x;
          const dz = ent.z - bomb.z;
          const d = Math.sqrt(dx * dx + dz * dz);
          if (d < BOMB_BLAST_RADIUS) {
            if (bomb.ownerIdx !== undefined) {
              ent.lastHitBy = bomb.ownerIdx;
            }
            const nd = d || 0.01;
            const power = (1 - d / BOMB_BLAST_RADIUS) * BOMB_BLAST_IMPULSE;
            ent.vx += (dx / nd) * power;
            ent.vz += (dz / nd) * power;
            ent.launched = true;
            ent.launchSpeed = power;
            ent.stunTimer = 0.45;
          }
        }
        // Spawn 3D Cartoon Fireball Dome & Scorch Mark!
        this.spawnBombExplosionFX(bomb.x, bomb.z);

        this.scene.remove(bomb.mesh);
        this.bombs.splice(bi, 1);
        if (eventFn) eventFn("bomb_explode", { x: bomb.x, z: bomb.z });
      }
    }
  }

  destroy() {
    for (const fx of this.activeFX) {
      fx.dispose();
    }
    this.activeFX = [];
    this.scene.remove(this.fxGroup);

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
