/**
 * BOUNCEBACK! — Three.js Game Engine Orchestrator
 * Manages 3D scene, entities, animation loop.
 * Controlled by React via callbacks.
 *
 * v2: 3rd-person camera (ala Boi-Boian) + Mystery Power-Up Skill System
 */
import * as THREE from "three";
import * as C from "./config";
import { Entity, updatePhysics, type BumperData, type GateData } from "./physics";
import { PlayerController } from "./player";
import { JuiceSystem } from "./juice";
import { Match } from "./match";
import { assignRoles, updateBots } from "./ai";
import {
  SkillManager,
  createEmptySkillSlot,
  SkillType,
  SKILL_NAMES,
  SKILL_ICONS,
  type SkillSlot,
} from "./skills";
import {
  initAudio,
  resumeAudio,
  startBGM,
  stopBGM,
  sfxBoing,
  sfxCrowdCheer,
  sfxStadiumAirhorn,
  sfxPunch,
  sfxWhiff,
  sfxDash,
  sfxGoal,
  sfxBumperHit,
  sfxOverdrive,
  sfxCombo,
  sfxWhistle,
  sfxGameOver,
  sfxMatchStart,
  sfxPickup,
  sfxGigaFist,
  sfxBananaSlip,
  sfxRocket,
  sfxMagnet,
  sfxBombExplode,
  sfxShrink,
  sfxOnePunch,
} from "./audio";
// @ts-ignore — JS asset modules following 404 asset contract
import generateMecha from "../assets/toy_mecha.js";
// @ts-ignore
import generateBumper from "../assets/pinball_bumper.js";
// @ts-ignore
import generateGate from "../assets/energy_gate.js";
import { createFallGuysArena, type ArenaController } from "./fallguysArena";
import { getArenaHeight, getArenaSlope } from "./arenaHeight";

export interface GameState {
  timer: string;
  scores: [number, number];
  phase: number;
  combo: [number, number];
  over: boolean;
  winner: number;
  announcement: string;
  announcementTimer: number;
  // Skill state for player (entity 0)
  playerSkill: SkillType;
  playerSkillName: string;
  playerSkillIcon: string;
  cameraMode: "third_wide" | "third_close" | "first_person";
}

export type GameStateCallback = (state: GameState) => void;

export class BouncebackEngine {
  private canvas: HTMLCanvasElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private entities: Entity[] = [];
  private bumpers: BumperData[] = [];
  private gates: GateData[] = [];
  private bumperMeshes: THREE.Object3D[] = [];
  private gateMeshes: THREE.Object3D[] = [];
  private player!: PlayerController;
  private juice!: JuiceSystem;
  private match!: Match;
  private skills!: SkillManager;
  private skillSlots: SkillSlot[] = [];
  private animId = 0;
  private lastTime = 0;
  private running = false;
  private onStateChange: GameStateCallback;
  private onMatchEnd: ((winner: number, scores: [number, number]) => void) | null = null;

  public cameraMode: "third_wide" | "third_close" | "first_person" = "third_wide";
  private boundCamKeyDown?: (e: KeyboardEvent) => void;

  private announcement = "";
  private announcementTimer = 0;

  // Camera follow state (starts behind Cyan player at z=-17, looking downfield toward Coral at +Z)
  private camTargetPos = new THREE.Vector3(0, 8.5, -31.0);
  private camLookTarget = new THREE.Vector3(0, 1.2, -11.0);
  private baseFov = 58;
  private targetFov = 58;

  // Arena visual meshes & controller
  private floorMesh!: THREE.Mesh;
  private arenaController: ArenaController | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    onStateChange: GameStateCallback,
    onMatchEnd?: (winner: number, scores: [number, number]) => void
  ) {
    this.canvas = canvas;
    this.onStateChange = onStateChange;
    this.onMatchEnd = onMatchEnd || null;
  }

  init() {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x38bdf8);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // Scene — Crisp linear fog that keeps arena and surrounding islands 100% sharp and clear
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x7dd3fc, 90, 260);

    // Camera — 3rd-person stadium perspective looking downfield
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(this.baseFov, aspect, 0.1, 350);
    this.camera.position.set(0, 8.5, -31.0);
    this.camera.lookAt(0, 1.2, -11.0);

    // Juice system
    this.juice = new JuiceSystem(this.camera, this.scene);
    this.juice.init(this.camera.position);

    // Lighting
    this.setupLighting();

    // Arena
    this.buildArena();

    // Entities (5v5)
    this.spawnEntities();

    // Bumpers
    this.spawnBumpers();

    // Gates
    this.spawnGates();

    // Player controller
    this.player = new PlayerController();
    this.player.init();

    // Match
    this.match = new Match();
    this.match.onGoal = (team, points, combo, bounces) => {
      sfxGoal();
      if (combo > 1) sfxCombo(combo);
      const goalZ = team === 0 ? C.ARENA_L * 0.5 : -C.ARENA_L * 0.5;
      this.juice.trigger("goal", { team, x: 0, y: 1.5, z: goalZ });
      this.arenaController?.onGoalCelebration(team);
      const teamName = team === 0 ? "CYAN" : "CORAL";
      let txt = `${teamName} +${points}!`;
      if (bounces >= 2) txt += ` ${bounces}x BOUNCE!`;
      if (combo > 1) txt += ` COMBO x${combo}!`;
      this.showAnnouncement(txt);
    };
    this.match.onPhaseChange = (phase) => {
      if (phase === 2) {
        this.showAnnouncement("⚡ PHASE 2 — DOUBLE GATE!");
        this.activatePhase2();
      } else if (phase === 3) {
        this.showAnnouncement("🔥 OVERDRIVE!");
      }
    };
    this.match.onOverdrive = () => {
      sfxOverdrive();
      this.juice.trigger("overdrive");
      this.activateOverdrive();
    };
    this.match.onMatchEnd = (winner, scores) => {
      sfxGameOver();
      this.running = false;
      if (this.onMatchEnd) this.onMatchEnd(winner, scores);
    };

    // Skill system
    this.skills = new SkillManager(this.scene);
    this.skills.init();
    this.skillSlots = this.entities.map(() => createEmptySkillSlot());

    // Audio
    initAudio();

    // Resize handler
    this.handleResize();
    window.addEventListener("resize", this.handleResize);

    // Camera toggle key listener (C or V)
    this.boundCamKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyC" || e.code === "KeyV") {
        this.toggleCamera();
      }
    };
    window.addEventListener("keydown", this.boundCamKeyDown);
  }

  private setupLighting() {
    // 1. Cheerful sunny sky / ground hemisphere light (signature Fall Guys / Nintendo lighting)
    const hemi = new THREE.HemisphereLight(0x7dd3fc, 0xfde047, 0.95);
    this.scene.add(hemi);

    // 2. Warm bright direct sunlight with ultra-crisp shadows
    const sun = new THREE.DirectionalLight(0xfff8ee, 1.85);
    sun.position.set(18, 38, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 110;
    sun.shadow.camera.left = -26;
    sun.shadow.camera.right = 26;
    sun.shadow.camera.top = 40;
    sun.shadow.camera.bottom = -40;
    sun.shadow.bias = -0.0003;
    this.scene.add(sun);

    // 3. Soft cyan fill from opposite side
    const fill = new THREE.DirectionalLight(0x38bdf8, 0.45);
    fill.position.set(-14, 20, -14);
    this.scene.add(fill);

    // 4. Bubblegum pink rim light from rear
    const rim = new THREE.DirectionalLight(0xff4081, 0.35);
    rim.position.set(0, 16, -24);
    this.scene.add(rim);
  }

  private buildArena() {
    // Build Ultra-HD Fall Guys Arena World
    this.arenaController = createFallGuysArena(this.scene);
    this.floorMesh = this.arenaController.floorMesh;
  }

  private spawnEntities() {
    const halfL = C.ARENA_L * 0.5;
    const spawnPositions = [
      // Team 0 (cyan) — player + 4 bots (spacious spread across 28m width)
      { x: 0, z: -halfL * 0.62, team: 0, isPlayer: true },
      { x: -6.0, z: -halfL * 0.38, team: 0 },
      { x: 6.0, z: -halfL * 0.38, team: 0 },
      { x: -4.5, z: -halfL * 0.82, team: 0 },
      { x: 4.5, z: -halfL * 0.82, team: 0 },
      // Team 1 (coral) — 5 bots
      { x: 0, z: halfL * 0.62, team: 1 },
      { x: -6.0, z: halfL * 0.38, team: 1 },
      { x: 6.0, z: halfL * 0.38, team: 1 },
      { x: -4.5, z: halfL * 0.82, team: 1 },
      { x: 4.5, z: halfL * 0.82, team: 1 },
    ];

    for (let i = 0; i < spawnPositions.length; i++) {
      const sp = spawnPositions[i];
      const ent = new Entity(sp.x, sp.z, sp.team, sp.isPlayer || false);
      this.entities.push(ent);

      // Create Fall Guy capsule mecha with team jersey & number
      const squadNum = sp.isPlayer ? 7 : (sp.team === 0 ? i + 1 : i - 4);
      const botCostumes = [
        "crown",          // Player (Team 0 #7)
        "dj_headphones",  // Team 0 #1
        "pro_shades",     // Team 0 #2
        "ninja_headband", // Team 0 #3
        "propeller_hat",  // Team 0 #4
        "dino_crest",     // Team 1 #1
        "bunny_ears",     // Team 1 #2
        "party_hat",      // Team 1 #3
        "pro_shades",     // Team 1 #4
        "dj_headphones",  // Team 1 #5
      ];
      const assignedCostume = sp.isPlayer ? "crown" : botCostumes[i % botCostumes.length];

      const mecha = generateMecha(THREE, {
        team: sp.team,
        isPlayer: !!sp.isPlayer,
        number: squadNum,
        costume: assignedCostume,
      });

      const desiredHeight = 1.6;
      const box = new THREE.Box3().setFromObject(mecha);
      const currentHeight = box.max.y - box.min.y;
      const scl = desiredHeight / (currentHeight || 1);
      mecha.scale.setScalar(scl);
      mecha.userData.baseScale = scl;

      // Exact bottom sole contact offset so feet never sink into turf
      const scaledBox = new THREE.Box3().setFromObject(mecha);
      const footOffset = Math.max(0.18, -scaledBox.min.y + 0.05);
      mecha.userData.footOffset = footOffset;
      const initH = getArenaHeight(sp.x, sp.z);
      mecha.position.set(sp.x, initH + footOffset, sp.z);
      mecha.rotation.y = sp.team === 1 ? Math.PI : 0;
      ent.mesh = mecha;
      this.scene.add(mecha);
    }

    assignRoles(this.entities);
  }

  private spawnBumpers() {
    // 13 strategic bumpers spaced across spacious 28x54 arena
    const positions = [
      { x: 0, z: 0 },           // Center Dais Peak (y = 1.5m)
      { x: -7.0, z: -4 },       // Midfield plateau flanking (y = 1.2m)
      { x: 7.0, z: -4 },
      { x: -7.0, z: 4 },
      { x: 7.0, z: 4 },
      { x: -10.5, z: 0 },       // Side launch wings
      { x: 10.5, z: 0 },
      { x: 0, z: -11 },         // Ascending ramp crest
      { x: 0, z: 11 },          // Descending ramp crest
      { x: -5.5, z: -21 },      // Goal defense zone
      { x: 5.5, z: -21 },
      { x: -5.5, z: 21 },
      { x: 5.5, z: 21 },
    ];

    for (const pos of positions) {
      const bData: BumperData = { x: pos.x, z: pos.z, hitFlash: 0 };
      this.bumpers.push(bData);

      const mesh = generateBumper(THREE);
      const desiredH = 1.2;
      const box = new THREE.Box3().setFromObject(mesh);
      const h = box.max.y - box.min.y;
      const bscl = desiredH / (h || 1);
      mesh.scale.setScalar(bscl);
      mesh.userData.baseScale = bscl;
      const bH = getArenaHeight(pos.x, pos.z);
      mesh.position.set(pos.x, bH, pos.z);
      this.bumperMeshes.push(mesh);
      this.scene.add(mesh);
    }
  }

  private spawnGates() {
    const halfL = C.ARENA_L * 0.5;
    // 4 gates: 2 per team (on opposite ends of spacious 54m court)
    const gateConfigs = [
      // Team 0 gates (coral scores here — at cyan end)
      { x: -6.5, z: -halfL + 1.2, team: 0, axis: "z" as const, mult: 1 },
      { x: 6.5, z: -halfL + 1.2, team: 0, axis: "z" as const, mult: 1 },
      // Team 1 gates (cyan scores here — at coral end)
      { x: -6.5, z: halfL - 1.2, team: 1, axis: "z" as const, mult: 1 },
      { x: 6.5, z: halfL - 1.2, team: 1, axis: "z" as const, mult: 1 },
    ];

    for (const gc of gateConfigs) {
      const gData: GateData = {
        x: gc.x,
        z: gc.z,
        team: gc.team,
        axis: gc.axis,
        multiplier: gc.mult,
        active: true,
      };
      this.gates.push(gData);

      const mesh = generateGate(THREE);
      const desiredH = 4.0;
      const box = new THREE.Box3().setFromObject(mesh);
      const h = box.max.y - box.min.y;
      mesh.scale.setScalar(desiredH / (h || 1));
      const gH = getArenaHeight(gc.x, gc.z);
      mesh.position.set(gc.x, gH, gc.z);
      // Color gate by defending team
      mesh.traverse((child: THREE.Object3D) => {
        const m = child as THREE.Mesh;
        if (!m.isMesh) return;
        const mat = m.material as any;
        if (mat && mat.color && mat.color.getHex() === 0xffd166) {
          m.material = mat.clone();
          (m.material as any).color.setHex(
            gc.team === 0 ? C.TEAM_CYAN : C.TEAM_CORAL
          );
        }
      });
      this.gateMeshes.push(mesh);
      this.scene.add(mesh);
    }
  }

  private activatePhase2() {
    // Make one gate per team double-value
    if (this.gates[0]) this.gates[0].multiplier = C.GATE_SCORE_2X;
    if (this.gates[2]) this.gates[2].multiplier = C.GATE_SCORE_2X;
    // Move some bumpers
    if (this.bumpers[2]) {
      this.bumpers[2].x = -3;
      this.bumpers[2].z = 4;
    }
  }

  private activateOverdrive() {
    // All gates triple value
    for (const g of this.gates) {
      g.multiplier = C.GATE_SCORE_3X;
    }
  }

  private showAnnouncement(text: string) {
    this.announcement = text;
    this.announcementTimer = 2.5;
  }

  startMatch() {
    resumeAudio();
    sfxMatchStart();
    startBGM();
    this.match.start();
    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private handleResize = () => {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  // ─── Camera System (3rd-Person Wide, 3rd-Person Close, 1st-Person POV) ───
  public toggleCamera(): string {
    if (this.cameraMode === "third_wide") {
      this.cameraMode = "third_close";
      this.announce("CAM: 3RD PERSON (ACTION CLOSE)");
      return "3rd Close";
    } else if (this.cameraMode === "third_close") {
      this.cameraMode = "first_person";
      this.announce("CAM: 1ST PERSON (ACTION POV)");
      return "1st Person";
    } else {
      this.cameraMode = "third_wide";
      this.announce("CAM: 3RD PERSON (STADIUM WIDE)");
      return "3rd Wide";
    }
  }

  private updateCamera(dt: number) {
    const p = this.entities[0];
    if (!p) return;

    const pGroundY = getArenaHeight(p.x, p.z);
    const isFirstPerson = this.cameraMode === "first_person";

    // Auto-hide player mecha mesh in 1st-person POV so inside of head doesn't clip
    if (p.mesh) {
      p.mesh.visible = !isFirstPerson;
    }

    if (isFirstPerson) {
      // 1st Person: Camera directly at player's eye level looking forward
      const eyeY = pGroundY + 1.15;
      this.camTargetPos.set(p.x, eyeY, p.z);

      // Facing angle from velocity or rotation
      let facingAngle = 0;
      if (Math.hypot(p.vx, p.vz) > 0.3) {
        facingAngle = Math.atan2(p.vx, p.vz);
      }
      this.camLookTarget.set(
        p.x + Math.sin(facingAngle) * 14.0,
        eyeY - 0.05,
        p.z + Math.cos(facingAngle) * 14.0
      );
      this.camera.position.copy(this.camTargetPos);
      this.camera.lookAt(this.camLookTarget);
    } else if (this.cameraMode === "third_close") {
      // Close Over-The-Shoulder Action Cam
      const camDist = 6.8;
      const camHeight = 3.8;
      const targetX = p.x * 0.82;
      let targetY = pGroundY + camHeight;
      let targetZ = p.z - camDist;

      // Wall avoidance clamp: never hit north bleachers or turn black
      const minCamZ = -28.0;
      if (targetZ < minCamZ) {
        const over = minCamZ - targetZ;
        targetZ = minCamZ;
        targetY += over * 0.55;
      }

      this.camTargetPos.set(targetX, targetY, targetZ);
      this.camLookTarget.set(p.x * 0.5, pGroundY + 1.3, p.z + 8.0);

      const lerpSpeed = Math.min(1.0, 5.0 * dt);
      this.camera.position.lerp(this.camTargetPos, lerpSpeed);
      this.camera.lookAt(this.camLookTarget);
    } else {
      // Standard Spacious Stadium 3rd-Person (Recommended for spatial awareness)
      const camDist = 13.5;
      const camHeight = 8.5;
      const targetX = p.x * 0.65;
      let targetY = pGroundY + camHeight;
      let targetZ = p.z - camDist;

      // Wall avoidance clamp: never hit north bleachers or turn black
      const minCamZ = -28.5;
      if (targetZ < minCamZ) {
        const over = minCamZ - targetZ;
        targetZ = minCamZ;
        targetY += over * 0.6; // smoothly tilt and elevate view over own goal
      }

      this.camTargetPos.set(targetX, targetY, targetZ);
      this.camLookTarget.set(p.x * 0.4, pGroundY + 1.2, p.z + 6.0);

      const lerpSpeed = Math.min(1.0, 4.2 * dt);
      this.camera.position.lerp(this.camTargetPos, lerpSpeed);
      this.camera.lookAt(this.camLookTarget);
    }

    // Dynamic FOV (gentle transitions)
    const playerSlot = this.skillSlots[0];
    if (playerSlot && playerSlot.rocketTimer > 0) {
      this.targetFov = 66; // Gentle boost during rocket
    } else if (p.dashTimer > 0) {
      this.targetFov = 62; // Gentle boost during dash
    } else {
      this.targetFov = this.baseFov;
    }
    this.camera.fov += (this.targetFov - this.camera.fov) * Math.min(1.0, 8 * dt);
    this.camera.updateProjectionMatrix();

    // Update juice baseCamPos for shake
    this.juice.baseCamPos = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z,
    };
  }

  // ─── Skill Event Handler (SFX + Juice + Announcements) ───
  private handleSkillEvent = (event: string, data?: unknown) => {
    switch (event) {
      case "pickup":
        sfxPickup();
        this.juice.trigger("pickup");
        break;
      case "gigafist":
        sfxGigaFist();
        this.juice.trigger("gigafist");
        this.showAnnouncement("🥊 MEGA SLAP!");
        break;
      case "banana_drop":
        break;
      case "banana_slip":
        sfxBananaSlip();
        this.juice.trigger("banana_slip");
        this.showAnnouncement("🍌 SLIP!");
        break;
      case "rocket_start":
        sfxRocket();
        this.juice.trigger("rocket_start");
        this.showAnnouncement("🚀 NITRO!");
        break;
      case "rocket_hit":
        sfxPunch();
        this.juice.trigger("rocket_hit");
        break;
      case "rocket_end":
        break;
      case "magnet":
        sfxMagnet();
        this.juice.trigger("magnet");
        this.showAnnouncement("🧲 MAGNET!");
        break;
      case "bomb_roll":
        break;
      case "bomb_explode":
        sfxBombExplode();
        this.juice.trigger("bomb_explode");
        this.showAnnouncement("💣 BOOOM!");
        break;
      case "shrink":
        sfxShrink();
        this.juice.trigger("shrink");
        this.showAnnouncement("🩳 SHRINK!");
        break;
      case "onepunch":
        sfxOnePunch();
        this.juice.trigger("onepunch", data);
        this.showAnnouncement("💥 ONE PUNCH!!");
        break;
      case "whiff":
        sfxWhiff();
        this.juice.trigger("whiff", data);
        break;
    }
  };

  private loop = (now: number) => {
    if (!this.running) return;
    this.animId = requestAnimationFrame(this.loop);

    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    const dt = Math.min(rawDt, 0.05) * this.juice.getTimeScale();

    // Hit-stop: skip physics when frozen
    if (!this.juice.isHitStopped()) {
      // Player input with camera orientation awareness
      const isFirstPerson = this.cameraMode === "first_person";
      let camAngle = 0;
      if (this.camera) {
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);
        camAngle = Math.atan2(camDir.x, camDir.z);
      }

      this.player.update(
        this.entities[0],
        this.entities,
        dt,
        (type, data) => {
          const d = data as any;
          if (type === "punch") {
            sfxPunch();
            this.juice.trigger("punch", {
              x: d?.x ?? this.entities[0].x,
              y: 1.2,
              z: d?.z ?? this.entities[0].z,
              originX: d?.originX ?? this.entities[0].x,
              originZ: d?.originZ ?? this.entities[0].z,
              dirX: d?.dirX ?? 0,
              dirZ: d?.dirZ ?? 1,
              team: d?.team ?? 0,
              isHit: true,
            });
          } else if (type === "whiff") {
            sfxWhiff();
            this.juice.trigger("whiff", {
              x: d?.x ?? this.entities[0].x,
              z: d?.z ?? this.entities[0].z,
              originX: d?.originX ?? this.entities[0].x,
              originZ: d?.originZ ?? this.entities[0].z,
              dirX: d?.dirX ?? 0,
              dirZ: d?.dirZ ?? 1,
              team: d?.team ?? 0,
              isHit: false,
            });
          } else if (type === "dash") {
            sfxDash();
            this.juice.trigger("dash", { x: this.entities[0].x, z: this.entities[0].z });
          } else {
            this.juice.trigger(type, data);
          }
        },
        camAngle,
        isFirstPerson
      );

      // Player debug grant skill via number keys 1-7
      if (this.player.debugGrantSkill !== null) {
        this.skillSlots[0].type = this.player.debugGrantSkill;
        this.player.debugGrantSkill = null;
      }

      // Player skill activation
      const input = this.player.getInput();
      if (input.skill && this.skillSlots[0] && this.skillSlots[0].type !== SkillType.None) {
        this.skills.activateSkill(
          0,
          this.entities[0],
          this.entities,
          this.skillSlots,
          this.handleSkillEvent,
          this.gates
        );
      }

      // AI
      updateBots(this.entities, this.bumpers, this.gates, dt, (type, data) => {
        const d = data as any;
        if (type === "botpunch") {
          sfxPunch();
          this.juice.trigger("botpunch", {
            x: d?.x ?? 0,
            y: 1.2,
            z: d?.z ?? 0,
            originX: d?.originX,
            originZ: d?.originZ,
            dirX: d?.dirX,
            dirZ: d?.dirZ,
            team: d?.team ?? 1,
            isHit: true,
          });
        } else {
          this.juice.trigger(type, data);
        }
      });

      // Physics
      updatePhysics(
        this.entities,
        this.bumpers,
        this.gates,
        dt,
        (scoringTeam, multiplier, bounceCount, entityIdx) => {
          this.match.score(scoringTeam, multiplier, bounceCount, entityIdx);
        }
      );

      // Sweeper Arm Obstacle Collisions (The Whirlygig!)
      if (this.arenaController && this.arenaController.sweeperArms.length > 0) {
        for (const arm of this.arenaController.sweeperArms) {
          const cosA = Math.cos(arm.angle);
          const sinA = Math.sin(arm.angle);
          const nx = -sinA;
          const nz = cosA;

          for (const ent of this.entities) {
            const dx = ent.x - arm.center.x;
            const dz = ent.z - arm.center.z;
            const proj = dx * cosA + dz * sinA;

            if (Math.abs(proj) <= arm.armLength) {
              const perp = dx * nx + dz * nz;
              const threshold = arm.armRadius + ent.radius;

              if (Math.abs(perp) < threshold) {
                const sign = perp >= 0 ? 1 : -1;
                ent.x = arm.center.x + proj * cosA + nx * sign * (threshold + 0.05);
                ent.z = arm.center.z + proj * sinA + nz * sign * (threshold + 0.05);

                const armLinearSpeed = Math.abs(arm.rotSpeed) * Math.max(0.6, Math.abs(proj));
                const pushSpeed = Math.max(13.0, armLinearSpeed * 2.4);

                ent.vx = nx * (arm.rotSpeed > 0 ? 1 : -1) * pushSpeed * (proj >= 0 ? 1 : -1);
                ent.vz = nz * (arm.rotSpeed > 0 ? 1 : -1) * pushSpeed * (proj >= 0 ? 1 : -1);
                ent.launched = true;
                ent.launchSpeed = Math.sqrt(ent.vx * ent.vx + ent.vz * ent.vz);
                ent.bounceCount++;

                sfxBoing();
                this.juice.trigger("bumper", {
                  x: ent.x,
                  y: getArenaHeight(ent.x, ent.z) + 1.0,
                  z: ent.z,
                  text: "BOING!",
                });
              }
            }
          }
        }
      }

      // Skill system update (pickups, effects, bombs, bananas)
      this.skills.checkPickups(this.entities, this.skillSlots, this.handleSkillEvent);
      this.skills.update(this.entities, this.skillSlots, dt, this.handleSkillEvent);

      // Match timer
      this.match.update(dt);
    }

    // Juice
    this.juice.update(dt);

    // 3rd-person camera follow
    this.updateCamera(dt);

    // Announcement timer
    if (this.announcementTimer > 0) {
      this.announcementTimer -= dt;
      if (this.announcementTimer <= 0) this.announcement = "";
    }

    // Sync meshes to entity positions
    for (let i = 0; i < this.entities.length; i++) {
      const ent = this.entities[i];
      const slot = this.skillSlots[i];
      if (ent.mesh) {
        const u = ent.mesh.userData;
        const spd = Math.sqrt(ent.vx * ent.vx + ent.vz * ent.vz);

        const groundH = getArenaHeight(ent.x, ent.z);
        const slope = getArenaSlope(ent.x, ent.z);
        const footOffset = u.footOffset || 0.25;
        ent.mesh.position.x = ent.x;
        ent.mesh.position.z = ent.z;
        ent.mesh.rotation.order = "YXZ";

        // Visual bounce & comedic tumble on Y when launched
        if (ent.launched) {
          // High dramatic over-the-top parabolic flight arc (soaring 2.8m - 3.8m in the sky!)
          const launchDuration = 0.95;
          const tProgress = Math.min(1.0, (ent.launchTimer || 0) / launchDuration);
          const flightArc = Math.sin(tProgress * Math.PI) * (2.8 + Math.min((ent.bounceCount || 0) * 0.45, 1.4));
          ent.mesh.position.y = groundH + footOffset + flightArc;

          // Over-the-top wild 360° backflips & cartwheels (pure cartoon comedy!)
          ent.mesh.rotation.x += dt * 18.0;
          ent.mesh.rotation.z += dt * 15.0;
          while (ent.mesh.rotation.x > Math.PI) ent.mesh.rotation.x -= Math.PI * 2;
          while (ent.mesh.rotation.x < -Math.PI) ent.mesh.rotation.x += Math.PI * 2;
          while (ent.mesh.rotation.z > Math.PI) ent.mesh.rotation.z -= Math.PI * 2;
          while (ent.mesh.rotation.z < -Math.PI) ent.mesh.rotation.z += Math.PI * 2;

          // Panicked flailing arms & kicking legs
          if (u.leftArm && u.rightArm) {
            u.leftArm.rotation.set(-2.6 + Math.sin(now * 0.035) * 1.5, Math.cos(now * 0.03) * 1.2, 1.4);
            u.rightArm.rotation.set(-2.6 - Math.sin(now * 0.035) * 1.5, -Math.cos(now * 0.03) * 1.2, -1.4);
          }
          if (u.leftLeg && u.rightLeg) {
            u.leftLeg.rotation.x = Math.sin(now * 0.045) * 1.6;
            u.rightLeg.rotation.x = -Math.sin(now * 0.045) * 1.6;
          }
          if (u.torso) {
            u.torso.rotation.x = Math.sin(now * 0.02) * 0.8;
          }
        } else {
          // STANDING UPRIGHT FIRMLY ON TWO FEET!
          ent.mesh.position.y = groundH + footOffset;
          // Strictly zero out pitch X tilt
          ent.mesh.rotation.x = 0;
          // Quickly spring back to 0 roll Z (standing straight)
          ent.mesh.rotation.z += (0 - ent.mesh.rotation.z) * Math.min(1.0, 24.0 * dt);
          if (Math.abs(ent.mesh.rotation.z) < 0.03) ent.mesh.rotation.z = 0;

          if (u.torso && !ent.stunTimer && spd > 0.4) {
            u.torso.rotation.x = slope.pitch * 0.65;
            u.torso.rotation.y = 0;
          } else if (u.torso && !ent.stunTimer) {
            u.torso.rotation.x = 0;
            u.torso.rotation.y = 0;
          }
        }

        // Face movement direction with smooth turning & dynamic lean banking
        if (Math.abs(ent.vx) > 0.35 || Math.abs(ent.vz) > 0.35) {
          const targetRotY = Math.atan2(ent.vx, ent.vz);
          let diffY = targetRotY - ent.mesh.rotation.y;
          while (diffY < -Math.PI) diffY += Math.PI * 2;
          while (diffY > Math.PI) diffY -= Math.PI * 2;

          // Snappy turning lerp
          ent.mesh.rotation.y += diffY * Math.min(1.0, 16.0 * dt);

          // Dynamic banking lean into turn (clamped subtle lean [-0.22, 0.22])
          if (!ent.launched && !ent.stunTimer) {
            const leanZ = Math.max(-0.22, Math.min(0.22, -diffY * 0.25));
            ent.mesh.rotation.z += (leanZ - ent.mesh.rotation.z) * Math.min(1.0, 18.0 * dt);
            ent.mesh.rotation.x = 0;
          }
        } else if (!ent.launched && !ent.stunTimer) {
          ent.mesh.rotation.z += (0 - ent.mesh.rotation.z) * Math.min(1.0, 24.0 * dt);
          if (Math.abs(ent.mesh.rotation.z) < 0.03) ent.mesh.rotation.z = 0;
          ent.mesh.rotation.x = 0;
        }

        // Scale effects & Stun wobble
        const baseScale = ent.mesh.userData.baseScale || 1;
        if (ent.launched) {
          // Airborne squash & stretch
          const launchDuration = 0.95;
          const tProgress = Math.min(1.0, (ent.launchTimer || 0) / launchDuration);
          const airborneStretch = Math.sin(tProgress * Math.PI);
          ent.mesh.scale.set(
            baseScale * (1 - airborneStretch * 0.22),
            baseScale * (1 + airborneStretch * 0.45),
            baseScale * (1 - airborneStretch * 0.22)
          );
        } else if (ent.stunTimer > 0) {
          // Squash/stretch & comedic wobble on stun
          const t = ent.stunTimer / 0.3;
          ent.mesh.scale.set(
            baseScale * (1 + t * 0.15),
            baseScale * (1 - t * 0.3),
            baseScale * (1 + t * 0.15)
          );
          ent.mesh.rotation.z = Math.sin(now * 0.025) * 0.35;
          if (u.torso) u.torso.rotation.x = -0.35;
          if (u.leftArm && u.rightArm) {
            u.leftArm.rotation.set(-2.4, 0, 0.45);
            u.rightArm.rotation.set(-2.4, 0, -0.45);
          }
        } else if (slot && slot.shrinkScale < 1.0) {
          // Shrunk!
          const s = baseScale * slot.shrinkScale;
          ent.mesh.scale.setScalar(s);
        } else {
          ent.mesh.scale.setScalar(baseScale);
        }

        // Adorable Eye Blinking (squash pupil for 130ms every ~3.2s)
        if (u.eyes && u.eyes.length > 0) {
          const blinkCycle = (now + i * 450) % 3200;
          const isBlinking = blinkCycle < 130;
          const eyeScaleY = isBlinking ? 0.15 : 1.0;
          for (const eye of u.eyes) {
            eye.scale.set(1.0, eyeScaleY, 0.35);
          }
        }

        // Procedural Fall Guy Waddle & Limb Animations
        if (u.leftArm && u.rightArm && u.leftLeg && u.rightLeg && u.torso && !ent.launched) {
          if (spd > 0.4 && !ent.stunTimer) {
            u.walkPhase = (u.walkPhase || 0) + dt * spd * 5.2;
            // Body waddle roll
            u.torso.rotation.z = Math.sin(u.walkPhase) * 0.14;
            // Alternating arm swing
            u.leftArm.rotation.x = -0.25 + Math.sin(u.walkPhase) * 0.55;
            u.rightArm.rotation.x = -0.25 - Math.sin(u.walkPhase) * 0.55;
            // Alternating leg kick & foot tilt
            u.leftLeg.rotation.x = -Math.sin(u.walkPhase) * 0.48;
            u.rightLeg.rotation.x = Math.sin(u.walkPhase) * 0.48;
            if (u.leftFoot && u.rightFoot) {
              u.leftFoot.rotation.x = Math.sin(u.walkPhase) * 0.22;
              u.rightFoot.rotation.x = -Math.sin(u.walkPhase) * 0.22;
            }
          } else {
            // Idle breathing sway & gentle bounce
            u.torso.rotation.z = 0;
            u.leftArm.rotation.x = -0.25 + Math.sin(now * 0.003) * 0.06;
            u.rightArm.rotation.x = -0.25 - Math.sin(now * 0.003) * 0.06;
            u.leftLeg.rotation.x = 0;
            u.rightLeg.rotation.x = 0;
            if (u.leftFoot && u.rightFoot) {
              u.leftFoot.rotation.x = 0;
              u.rightFoot.rotation.x = 0;
            }
          }

          // Spin propeller hat if equipped
          if (u.propeller) {
            u.propeller.rotation.y += dt * (spd > 0.4 ? 24 : 6);
          }

          // Bounce bunny ears if equipped
          if (u.bunnyEars) {
            u.bunnyEars.rotation.x = Math.sin(spd > 0.4 ? u.walkPhase * 1.5 : now * 0.004) * 0.12;
          }

          // Punch extension animation (satisfying snappy punch thrust & recovery)
          if (ent.punchCd > 0) {
            const punchProgress = 1.0 - (ent.punchCd / C.PUNCH_CD);
            const punchDist = punchProgress < 0.35 ? (punchProgress / 0.35) : (1.0 - (punchProgress - 0.35) / 0.65);
            u.rightArm.rotation.x = -1.6;
            u.rightArm.rotation.y = 0.25;
            u.rightArm.position.z = 0.06 + punchDist * 0.95;
            // Dramatically balloon right arm into a huge cartoon punching fist!
            const armScale = 1.0 + punchDist * 2.5;
            u.rightArm.scale.set(armScale, armScale, armScale * 1.3);
            if (u.torso) u.torso.rotation.y = -punchDist * 0.45;
          } else {
            u.rightArm.position.z = 0.06;
            u.rightArm.scale.set(1.0, 1.0, 1.0);
          }

          // Thruster flames scaling
          if (u.flames && u.flames.length > 0) {
            const isRocket = slot && slot.rocketTimer > 0;
            const isDash = ent.dashTimer > 0;
            const flameScale = isRocket ? 2.6 : (isDash ? 1.8 : (spd > 0.4 ? 1.0 : 0.35));
            for (const f of u.flames) {
              f.scale.set(flameScale, flameScale * (0.8 + Math.random() * 0.4), flameScale);
            }
          }
        }

        // Banana slip spin
        if (slot && slot.slipTimer > 0) {
          ent.mesh.rotation.y = slot.slipSpinAngle;
          if (u.leftArm && u.rightArm) {
            u.leftArm.rotation.z = 0.9;
            u.rightArm.rotation.z = -0.9;
          }
        }

        // Rocket visual: glow trail
        if (slot && slot.rocketTimer > 0) {
          ent.mesh.traverse((child: THREE.Object3D) => {
            const m = child as THREE.Mesh;
            if (m.isMesh && (m.material as any).emissiveIntensity !== undefined) {
              (m.material as any).emissiveIntensity = 0.6 + Math.sin(now * 0.02) * 0.4;
            }
          });
        }
      }
    }

    // Update Fall Guys Arena (orbiting clouds, hot air balloons, rotating crowns, crowd cheering, confetti)
    this.arenaController?.update(dt, now * 0.001);

    // Sync bumper meshes (hit flash)
    for (let i = 0; i < this.bumpers.length; i++) {
      const b = this.bumpers[i];
      const mesh = this.bumperMeshes[i];
      if (!mesh) continue;
      mesh.position.set(b.x, getArenaHeight(b.x, b.z), b.z);
      if (b.hitFlash > 0) {
        if (b.hitFlash > 0.9) {
          sfxBumperHit(0);
          this.juice.trigger("bumper", {
            x: b.x,
            y: getArenaHeight(b.x, b.z) + 1.0,
            z: b.z,
            text: "BOING!",
          });
        }
        b.hitFlash -= dt * 3;
        const bscl = mesh.userData.baseScale || 1;
        const s = bscl * (1 + b.hitFlash * 0.25);
        mesh.scale.setScalar(s);
      }
    }

    // Push game state to React (including player skill)
    const pSlot = this.skillSlots[0];
    this.onStateChange({
      timer: this.match.getTimerDisplay(),
      scores: [...this.match.scores] as [number, number],
      phase: this.match.phase,
      combo: [...this.match.combo] as [number, number],
      over: this.match.over,
      winner: this.match.winner,
      announcement: this.announcement,
      announcementTimer: this.announcementTimer,
      playerSkill: pSlot ? pSlot.type : SkillType.None,
      playerSkillName: pSlot ? SKILL_NAMES[pSlot.type] : "",
      playerSkillIcon: pSlot ? SKILL_ICONS[pSlot.type] : "",
      cameraMode: this.cameraMode,
    });

    this.renderer.render(this.scene, this.camera);

    const p = this.entities[0];
    const speed = p ? Math.hypot(p.vx, p.vz) : 0;
    (window as any).__GAME__ = {
      fps: Math.round(1 / Math.max(dt, 0.001)),
      draws: this.renderer.info.render.calls,
      tris: this.renderer.info.render.triangles,
      pos: p ? [p.x, p.z] : [0, 0],
      speed: Number(speed.toFixed(2)),
    };
  };

  destroy() {
    stopBGM();
    this.juice.dispose();
    this.running = false;
    cancelAnimationFrame(this.animId);
    window.removeEventListener("resize", this.handleResize);
    if (this.boundCamKeyDown) {
      window.removeEventListener("keydown", this.boundCamKeyDown);
    }
    this.player.destroy();
    this.skills.destroy();
    this.arenaController?.dispose();
    this.renderer.dispose();
    this.scene.clear();
  }
}
