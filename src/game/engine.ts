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
  sfxRingOut,
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
  sfxLethalHit,
} from "./audio";
import { DisasterManager, type DisasterVoteState, type DisasterId } from "./disasters";
// @ts-ignore — JS asset modules following 404 asset contract
import generateMecha from "../assets/toy_mecha.js";
// @ts-ignore
import generateBumper from "../assets/pinball_bumper.js";
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
  // Reality TV Live Audience Disaster Vote
  disasterVoteState: DisasterVoteState;
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
  private lethalCinematicTimer = 0;
  private lethalTargetPos = new THREE.Vector3();
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

  public appMode: "title" | "intro" | "game" | "result" = "title";
  public introPhase: "opener" | "cyan_team" | "vs_clash" | "coral_team" | "countdown" = "opener";
  private titleCamAngle = 0;
  private introCamTarget = new THREE.Vector3(0, 16.0, -22.0);
  private introLookTarget = new THREE.Vector3(0, 2.0, -4.0);
  private winningTeam = 0;

  public cameraMode: "third_wide" | "third_close" | "first_person" = "third_wide";
  private boundCamKeyDown?: (e: KeyboardEvent) => void;

  private announcement = "";
  private announcementTimer = 0;

  // Reality TV Live Audience Disaster Manager
  private disasterManager!: DisasterManager;

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
      sfxRingOut();
      if (combo > 1) sfxCombo(combo);

      this.juice.trigger("ringout", { team, x: 0, y: 1.5, z: 0 });
      this.arenaController?.onGoalCelebration(team);
      const teamName = team === 0 ? "TEAM CYAN" : "TEAM CORAL";
      let txt = `${teamName} RING OUT K.O.! +${points}`;
      if (bounces >= 2) txt += ` [${bounces}x BOUNCE]`;
      if (combo > 1) txt += ` [COMBO x${combo}]`;
      this.showAnnouncement(txt);
    };
    this.match.onPhaseChange = (phase) => {
      if (phase === 2) {
        this.showAnnouncement("PHASE 2 — DOUBLE K.O. VALUE!");
        this.activatePhase2();
      } else if (phase === 3) {
        this.showAnnouncement("OVERDRIVE — TRIPLE K.O. POINTS!");
      }
    };
    this.match.onOverdrive = () => {
      sfxOverdrive();
      this.juice.trigger("overdrive");
      this.activateOverdrive();
    };
    this.match.onMatchEnd = (winner, scores) => {
      sfxGameOver();
      this.appMode = "result";
      this.winningTeam = winner;
      const winTeam = winner === 0 ? "TEAM CYAN" : "TEAM CORAL";
      this.showAnnouncement(`MATCH OVER — ${winTeam} WINS!`);
      if (this.onMatchEnd) this.onMatchEnd(winner, scores);
    };

    // Skill system
    this.skills = new SkillManager(this.scene);
    this.skills.init();
    this.skillSlots = this.entities.map(() => createEmptySkillSlot());

    // Reality TV Live Audience Disaster Manager
    this.disasterManager = new DisasterManager(this.scene);

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

    // Start 3D animation loop immediately so Title Screen has a live dynamic arena background!
    this.running = true;
    this.lastTime = performance.now();
    this.animId = requestAnimationFrame(this.loop);
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
    // 3v3 Official TV Broadcast Match Roster: 3 Cyan vs 3 Coral
    const spawnPositions = [
      // Team 0 (Cyan): YOU (#7), DJ BOUNCE (#1), NINJA BEAN (#2)
      {
        x: 0,
        z: -halfL * 0.62,
        team: 0,
        isPlayer: true,
        number: C.ROSTER_CYAN[0].number,
        costume: C.ROSTER_CYAN[0].costume,
      },
      {
        x: -2.8,
        z: -halfL * 0.56,
        team: 0,
        isPlayer: false,
        number: C.ROSTER_CYAN[1].number,
        costume: C.ROSTER_CYAN[1].costume,
      },
      {
        x: 2.8,
        z: -halfL * 0.56,
        team: 0,
        isPlayer: false,
        number: C.ROSTER_CYAN[2].number,
        costume: C.ROSTER_CYAN[2].costume,
      },
      // Team 1 (Coral): REX CRUSH (#1), HOPPER MAD (#2), SHADY VIP (#3)
      {
        x: 0,
        z: halfL * 0.62,
        team: 1,
        isPlayer: false,
        number: C.ROSTER_CORAL[0].number,
        costume: C.ROSTER_CORAL[0].costume,
      },
      {
        x: -2.8,
        z: halfL * 0.56,
        team: 1,
        isPlayer: false,
        number: C.ROSTER_CORAL[1].number,
        costume: C.ROSTER_CORAL[1].costume,
      },
      {
        x: 2.8,
        z: halfL * 0.56,
        team: 1,
        isPlayer: false,
        number: C.ROSTER_CORAL[2].number,
        costume: C.ROSTER_CORAL[2].costume,
      },
    ];

    for (let i = 0; i < spawnPositions.length; i++) {
      const sp = spawnPositions[i];
      const ent = new Entity(sp.x, sp.z, sp.team, sp.isPlayer || false);
      this.entities.push(ent);

      const mecha = generateMecha(THREE, {
        team: sp.team,
        isPlayer: !!sp.isPlayer,
        number: sp.number,
        costume: sp.costume,
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
    // Goal & Endzone defense markers for bot AI positioning
    const baseConfigs = [
      { x: 0, z: -halfL + 3.0, team: 0, mult: 1 },
      { x: 0, z: halfL - 3.0, team: 1, mult: 1 },
    ];

    for (const bc of baseConfigs) {
      const gData: GateData = {
        x: bc.x,
        z: bc.z,
        team: bc.team,
        axis: "z",
        multiplier: bc.mult,
        active: false,
      };
      this.gates.push(gData);
    }
  }

  private activatePhase2() {
    // Ring-out double value
    if (this.gates[0]) this.gates[0].multiplier = C.GATE_SCORE_2X;
    if (this.gates[1]) this.gates[1].multiplier = C.GATE_SCORE_2X;
    // Move some bumpers
    if (this.bumpers[2]) {
      this.bumpers[2].x = -3;
      this.bumpers[2].z = 4;
    }
  }

  private activateOverdrive() {
    // All ring-outs triple value
    for (const g of this.gates) {
      g.multiplier = C.GATE_SCORE_3X;
    }
  }

  private showAnnouncement(text: string) {
    this.announcement = text;
    this.announcementTimer = 2.5;
  }

  public castDisasterVote(id: DisasterId) {
    this.disasterManager.userVote(id);
  }

  public startIntro() {
    this.appMode = "intro";
    this.introPhase = "opener";
    this.setIntroPhase("opener");
  }

  public setIntroPhase(
    phase: "opener" | "cyan_team" | "vs_clash" | "coral_team" | "countdown"
  ) {
    this.introPhase = phase;
    switch (phase) {
      case "opener":
        // High aerial dive through stadium lights toward midfield
        this.introCamTarget.set(0, 16.0, -22.0);
        this.introLookTarget.set(0, 2.0, -4.0);
        break;
      case "cyan_team":
        // Dynamic close-up hero showcase directly in front of Team Cyan
        this.introCamTarget.set(0, 1.85, -13.5);
        this.introLookTarget.set(0, 1.35, -17.8);
        break;
      case "vs_clash":
        // Low-angle dramatic sweep over the elevated midfield battle deck looking across both teams
        this.introCamTarget.set(-10.5, 3.2, 0);
        this.introLookTarget.set(0, 1.4, 0);
        break;
      case "coral_team":
        // Dynamic close-up rival showcase directly in front of Team Coral
        this.introCamTarget.set(0, 1.85, 13.5);
        this.introLookTarget.set(0, 1.35, 17.8);
        break;
      case "countdown":
        // Sweeping up and dropping into exact 3rd-person gameplay position behind player
        this.introCamTarget.set(0, 9.0, -C.ARENA_L * 0.5 - 2.0);
        this.introLookTarget.set(0, 1.2, -11.0);
        break;
    }
  }

  startMatch() {
    this.appMode = "game";
    resumeAudio();
    sfxMatchStart();
    startBGM();
    this.match.start();
    this.disasterManager.reset();
    this.showAnnouncement("3V3 ARENA MATCH START!");

    // Smoothly lock camera directly behind player into 3rd person follow
    this.camTargetPos.set(0, 8.5, -31.0);
    this.camLookTarget.set(0, 1.2, -11.0);
    this.camera.position.copy(this.camTargetPos);
    this.camera.lookAt(this.camLookTarget);
  }

  public resetToTitle() {
    this.appMode = "title";
    stopBGM();
    this.disasterManager.reset();
    this.resetEntitiesToSpawn();
    this.match.reset();
  }

  private resetEntitiesToSpawn() {
    const halfL = C.ARENA_L * 0.5;
    const spawnPositions = [
      { x: 0, z: -halfL * 0.62 },
      { x: -2.8, z: -halfL * 0.56 },
      { x: 2.8, z: -halfL * 0.56 },
      { x: 0, z: halfL * 0.62 },
      { x: -2.8, z: halfL * 0.56 },
      { x: 2.8, z: halfL * 0.56 },
    ];
    for (let i = 0; i < this.entities.length && i < spawnPositions.length; i++) {
      const ent = this.entities[i];
      const sp = spawnPositions[i];
      ent.x = sp.x;
      ent.z = sp.z;
      ent.vx = 0;
      ent.vz = 0;
      ent.launched = false;
      ent.stunTimer = 0;
      ent.dashTimer = 0;
      ent.immuneTimer = 0;
      if (ent.mesh) {
        const u = ent.mesh.userData;
        const footOffset = u.footOffset || 0.25;
        ent.mesh.position.set(sp.x, getArenaHeight(sp.x, sp.z) + footOffset, sp.z);
        ent.mesh.rotation.set(0, ent.team === 1 ? Math.PI : 0, 0);
        if (u.leftArm) {
          u.leftArm.position.set(-0.36, 0.06, 0.06);
          u.leftArm.rotation.set(-0.25, 0, 0.35);
        }
        if (u.rightArm) {
          u.rightArm.position.set(0.36, 0.06, 0.06);
          u.rightArm.rotation.set(-0.25, 0, -0.35);
        }
        if (u.torso) u.torso.rotation.set(0, 0, 0);
        if (u.head) u.head.rotation.set(0, 0, 0);
      }
    }
  }

  private updateTitleEntities(now: number) {
    for (let i = 0; i < this.entities.length; i++) {
      const ent = this.entities[i];
      if (!ent.mesh) continue;
      const u = ent.mesh.userData;
      const footOffset = u.footOffset || 0.25;
      const baseH = getArenaHeight(ent.x, ent.z);
      ent.mesh.position.set(
        ent.x,
        baseH + footOffset + Math.sin(now * 3.0 + i * 1.2) * 0.08,
        ent.z
      );
      const baseRotY = ent.team === 1 ? Math.PI : 0;
      ent.mesh.rotation.set(0, baseRotY + Math.sin(now * 1.5 + i) * 0.12, 0);
    }
  }

  private updateIntroEntities(now: number) {
    for (let i = 0; i < this.entities.length; i++) {
      const ent = this.entities[i];
      if (!ent.mesh) continue;
      const u = ent.mesh.userData;
      const footOffset = u.footOffset || 0.25;
      const baseH = getArenaHeight(ent.x, ent.z);

      let jumpY = 0;
      let rotY = ent.team === 1 ? Math.PI : 0;
      let rotX = 0;
      let rotZ = 0;

      // ─── TEAM CYAN ANIMATIONS (Phase: cyan_team) ───
      if (ent.team === 0) {
        const isCyanPhase = this.introPhase === "cyan_team";
        const animSpeed = isCyanPhase ? 1.0 : 0.45;
        const t = now * animSpeed;

        if (i === 0) {
          // ── PLAYER (Captain #7 YOU): Martial Arts Shadowboxing Combo & Flex! ──
          const punchCycle = (t * 5.0) % (Math.PI * 2);
          const leftPunch = Math.max(0, Math.sin(punchCycle));
          const rightPunch = Math.max(0, -Math.sin(punchCycle));
          jumpY = isCyanPhase ? Math.abs(Math.sin(t * 7.5)) * 0.12 : 0;

          if (u.leftArm) {
            u.leftArm.position.z = 0.06 + leftPunch * 0.75;
            u.leftArm.rotation.set(-0.25 - leftPunch * 0.8, leftPunch * 0.35, 0.35);
          }
          if (u.rightArm) {
            u.rightArm.position.z = 0.06 + rightPunch * 0.85;
            u.rightArm.rotation.set(-0.25 - rightPunch * 0.8, -rightPunch * 0.35, -0.35);
          }
          if (u.torso) {
            u.torso.rotation.y = (leftPunch - rightPunch) * 0.35;
          }
          if (u.head) {
            u.head.rotation.x = Math.sin(t * 5.0) * 0.1;
            u.head.rotation.y = -(leftPunch - rightPunch) * 0.15;
          }
          if (u.flames && u.flames.length >= 2) {
            const flameScale = 1.0 + (leftPunch + rightPunch) * 2.2;
            u.flames[0].scale.set(flameScale, flameScale, flameScale);
            u.flames[1].scale.set(flameScale, flameScale, flameScale);
          }
        } else if (i === 1) {
          // ── DJ BOUNCE (#1): Bouncing to the Beat & Waving Arm! ──
          jumpY = isCyanPhase ? Math.abs(Math.sin(t * 8.0)) * 0.28 : Math.abs(Math.sin(t * 3.0)) * 0.08;
          rotY += Math.sin(t * 3.5) * 0.15;

          if (u.head) {
            u.head.rotation.x = Math.sin(t * 8.0) * 0.22;
            u.head.rotation.z = Math.sin(t * 4.0) * 0.14;
          }
          if (u.leftArm) {
            u.leftArm.rotation.set(-1.8 + Math.sin(t * 8.0) * 0.3, 0.2, 0.4 + Math.cos(t * 8.0) * 0.25);
          }
          if (u.rightArm) {
            u.rightArm.rotation.set(-0.8, Math.sin(t * 8.0) * 0.4, -0.6);
          }
          if (u.torso) {
            u.torso.rotation.z = Math.sin(t * 4.0) * 0.1;
          }
        } else if (i === 2) {
          // ── NINJA BEAN (#2): Low Agile Ninja Crouch & Rapid Hand Seals! ──
          jumpY = isCyanPhase ? Math.abs(Math.sin(t * 5.0)) * 0.2 : 0;
          const sealCycle = Math.sin(t * 11.0);

          if (u.leftArm) {
            u.leftArm.rotation.set(-1.2 + sealCycle * 0.4, 0.6, 0.3);
          }
          if (u.rightArm) {
            u.rightArm.rotation.set(-1.2 - sealCycle * 0.4, -0.6, -0.3);
          }
          if (u.torso) {
            u.torso.rotation.y = Math.sin(t * 6.0) * 0.22;
            u.torso.rotation.x = 0.12;
          }
          if (u.head) {
            u.head.rotation.y = Math.sin(t * 4.0) * 0.18;
          }
        }
      }

      // ─── TEAM CORAL ANIMATIONS (Phase: coral_team) ───
      else if (ent.team === 1) {
        const isCoralPhase = this.introPhase === "coral_team";
        const animSpeed = isCoralPhase ? 1.0 : 0.45;
        const t = now * animSpeed;

        if (i === 3) {
          // ── REX CRUSH (#1): Massive Gorilla Chest Pounding & Stomps! ──
          const poundCycle = Math.sin(t * 9.0);
          jumpY = isCoralPhase ? Math.abs(Math.sin(t * 6.0)) * 0.16 : 0;

          if (u.leftArm) {
            u.leftArm.rotation.set(-1.5 + poundCycle * 0.5, 0.5, 0.3);
          }
          if (u.rightArm) {
            u.rightArm.rotation.set(-1.5 - poundCycle * 0.5, -0.5, -0.3);
          }
          if (u.torso) {
            u.torso.rotation.x = Math.sin(t * 4.5) * 0.15;
          }
          if (u.head) {
            u.head.rotation.x = -0.25 + Math.sin(t * 4.5) * 0.18;
          }
        } else if (i === 4) {
          // ── HOPPER MAD (#2): Wild Bouncing & Flailing Joy! ──
          jumpY = isCoralPhase ? Math.abs(Math.sin(t * 11.0)) * 0.42 : Math.abs(Math.sin(t * 4.0)) * 0.1;
          const flail = Math.sin(t * 11.0);

          if (u.leftArm) {
            u.leftArm.rotation.set(-0.8 + flail * 0.7, 0, 0.8 + flail * 0.35);
          }
          if (u.rightArm) {
            u.rightArm.rotation.set(-0.8 - flail * 0.7, 0, -0.8 - flail * 0.35);
          }
          if (u.bunnyEars) {
            u.bunnyEars.rotation.z = flail * 0.3;
          }
          if (u.propeller) {
            u.propeller.rotation.y += 0.45;
          }
        } else if (i === 5) {
          // ── SHADY VIP (#3): Cool Confident Arms-Crossed Swagger! ──
          jumpY = isCoralPhase ? Math.sin(t * 3.0) * 0.05 : 0;
          rotY += Math.sin(t * 2.0) * 0.12;

          if (u.leftArm) {
            u.leftArm.rotation.set(-1.1, 0.7, 0.4);
          }
          if (u.rightArm) {
            u.rightArm.rotation.set(-1.1, -0.7, -0.4);
          }
          if (u.head) {
            u.head.rotation.set(0.08, Math.sin(t * 2.5) * 0.2, 0.08);
          }
          if (u.torso) {
            u.torso.rotation.y = Math.sin(t * 2.0) * 0.1;
          }
        }
      }

      ent.mesh.position.set(ent.x, baseH + footOffset + jumpY, ent.z);
      ent.mesh.rotation.set(rotX, rotY, rotZ);
    }
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
      const minCamZ = -C.ARENA_L * 0.5 - 6.5;
      if (targetZ < minCamZ) {
        const over = minCamZ - targetZ;
        targetZ = minCamZ;
        targetY += over * 0.55;
      }

      this.camTargetPos.set(targetX, targetY, targetZ);
      this.camLookTarget.set(p.x * 0.5, pGroundY + 1.3, p.z + 8.0);

      // Smash Bros-Style Cinematic Lethal Zoom Punch
      if (this.lethalCinematicTimer > 0) {
        this.camLookTarget.lerp(this.lethalTargetPos, Math.min(1.0, 15.0 * dt));
      }

      const lerpSpeed = Math.min(1.0, 5.0 * dt);
      this.camera.position.lerp(this.camTargetPos, lerpSpeed);
      this.camera.lookAt(this.camLookTarget);
    } else {
      // Standard Spacious Stadium 3rd-Person (Recommended for spatial awareness)
      const camDist = 14.5;
      const camHeight = 9.0;
      const targetX = p.x * 0.65;
      let targetY = pGroundY + camHeight;
      let targetZ = p.z - camDist;

      // Wall avoidance clamp: never hit north bleachers or turn black
      const minCamZ = -C.ARENA_L * 0.5 - 7.5;
      if (targetZ < minCamZ) {
        const over = minCamZ - targetZ;
        targetZ = minCamZ;
        targetY += over * 0.6; // smoothly tilt and elevate view over own goal
      }

      this.camTargetPos.set(targetX, targetY, targetZ);
      this.camLookTarget.set(p.x * 0.4, pGroundY + 1.2, p.z + 6.0);

      // Smash Bros-Style Cinematic Lethal Zoom Punch
      if (this.lethalCinematicTimer > 0) {
        this.camLookTarget.lerp(this.lethalTargetPos, Math.min(1.0, 15.0 * dt));
      }

      const lerpSpeed = Math.min(1.0, 4.2 * dt);
      this.camera.position.lerp(this.camTargetPos, lerpSpeed);
      this.camera.lookAt(this.camLookTarget);
    }

    // Dynamic FOV (gentle transitions + dramatic lethal punch zoom)
    const playerSlot = this.skillSlots[0];
    if (this.lethalCinematicTimer > 0) {
      this.lethalCinematicTimer = Math.max(0, this.lethalCinematicTimer - dt);
      this.targetFov = 38; // Smash Bros-style dramatic punch-in zoom!
    } else if (playerSlot && playerSlot.rocketTimer > 0) {
      this.targetFov = 66; // Gentle boost during rocket
    } else if (p.dashTimer > 0) {
      this.targetFov = 62; // Gentle boost during dash
    } else {
      this.targetFov = this.baseFov;
    }
    this.camera.fov += (this.targetFov - this.camera.fov) * Math.min(1.0, 12 * dt);
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
        this.showAnnouncement("MEGA SLAP!");
        break;
      case "banana_drop":
        break;
      case "banana_slip":
        sfxBananaSlip();
        this.juice.trigger("banana_slip");
        this.showAnnouncement("BANANA SLIP!");
        break;
      case "rocket_start":
        sfxRocket();
        this.juice.trigger("rocket_start");
        this.showAnnouncement("NITRO DASH!");
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
        this.showAnnouncement("MAGNET PULL!");
        break;
      case "bomb_roll":
        break;
      case "bomb_explode":
        sfxBombExplode();
        this.juice.trigger("bomb_explode");
        this.showAnnouncement("BOMB BLAST!");
        break;
      case "shrink":
        sfxShrink();
        this.juice.trigger("shrink");
        this.showAnnouncement("SHRINK RAY!");
        break;
      case "onepunch":
        sfxOnePunch();
        this.juice.trigger("onepunch", data);
        this.showAnnouncement("ONE PUNCH KNOCKOUT!");
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

    // ─── 1. Title Screen Live 3D Drone Camera Orbit ───
    if (this.appMode === "title") {
      this.titleCamAngle += dt * 0.16;
      const radius = 38.0;
      const h = 21.0 + Math.sin(this.titleCamAngle * 0.6) * 4.0;
      this.camera.position.set(
        Math.sin(this.titleCamAngle) * radius,
        h,
        Math.cos(this.titleCamAngle) * radius
      );
      this.camera.lookAt(0, 2.2, 0);

      this.arenaController?.update(dt, now * 0.001);
      this.skills.updateTitleBoxes();
      this.updateTitleEntities(now * 0.001);

      this.renderer.render(this.scene, this.camera);
      return;
    }

    // ─── 2. TV Intro Cutscene Camera Swoops ───
    if (this.appMode === "intro") {
      const lerpSpeed = Math.min(1.0, (this.introPhase === "vs_clash" ? 6.5 : 4.5) * dt);
      const camTarget = this.introCamTarget.clone();
      const lookTarget = this.introLookTarget.clone();
      if (this.introPhase === "cyan_team" || this.introPhase === "coral_team") {
        camTarget.x += Math.sin(now * 0.001 * 1.4) * 0.75;
        camTarget.y += Math.cos(now * 0.001 * 1.0) * 0.12;
      }
      this.camera.position.lerp(camTarget, lerpSpeed);
      this.camLookTarget.lerp(lookTarget, lerpSpeed);
      this.camera.lookAt(this.camLookTarget);

      this.arenaController?.update(dt, now * 0.001);
      this.skills.updateTitleBoxes();
      this.updateIntroEntities(now * 0.001);

      this.renderer.render(this.scene, this.camera);
      return;
    }

    // ─── 3. Match Result Victory Orbit ───
    if (this.appMode === "result") {
      this.titleCamAngle += dt * 0.28;
      const winZ = this.winningTeam === 0 ? -16.74 : 16.74;
      this.camera.position.set(
        Math.sin(this.titleCamAngle) * 12.0,
        5.2,
        winZ + Math.cos(this.titleCamAngle) * 12.0
      );
      this.camera.lookAt(0, 1.4, winZ);

      this.arenaController?.update(dt, now * 0.001);
      this.renderer.render(this.scene, this.camera);
      return;
    }

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
            const halfW = C.ARENA_W * 0.5;
            const halfL = C.ARENA_L * 0.5;
            const pImpulse = d?.impulse ?? C.PUNCH_IMPULSE;
            const dirX = d?.dirX ?? 0;
            const dirZ = d?.dirZ ?? 1;
            const targetX = d?.x ?? this.entities[0].x;
            const targetZ = d?.z ?? this.entities[0].z;

            // Trajectory Prediction: calculate if target will clear ropes into the abyss
            const projectedDist = pImpulse * 0.35;
            const futureX = targetX + dirX * projectedDist;
            const futureZ = targetZ + dirZ * projectedDist;
            const isLethal = Math.abs(futureX) > halfW || Math.abs(futureZ) > halfL;

            if (isLethal) {
              sfxLethalHit();
              this.lethalCinematicTimer = 0.55;
              this.lethalTargetPos.set(targetX, 1.2, targetZ);
              this.juice.trigger("lethal_finish", {
                x: targetX,
                y: 1.2,
                z: targetZ,
                originX: d?.originX ?? this.entities[0].x,
                originZ: d?.originZ ?? this.entities[0].z,
                dirX,
                dirZ,
                team: d?.team ?? 0,
                isHit: true,
              });
              this.showAnnouncement("CRITICAL LETHAL STRIKE!!");
            } else {
              sfxPunch();
              this.juice.trigger("punch", {
                x: targetX,
                y: 1.2,
                z: targetZ,
                originX: d?.originX ?? this.entities[0].x,
                originZ: d?.originZ ?? this.entities[0].z,
                dirX,
                dirZ,
                team: d?.team ?? 0,
                isHit: true,
              });
            }
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

      // Player debug grant skill via number keys 1-7 (disabled during live disaster voting)
      if (this.disasterManager.state.isActive) {
        this.player.debugGrantSkill = null;
      } else if (this.player.debugGrantSkill !== null) {
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
          const halfW = C.ARENA_W * 0.5;
          const halfL = C.ARENA_L * 0.5;
          const bImpulse = d?.impulse ?? C.PUNCH_IMPULSE;
          const dirX = d?.dirX ?? d?.nx ?? 0;
          const dirZ = d?.dirZ ?? d?.nz ?? 1;
          const targetX = d?.x ?? 0;
          const targetZ = d?.z ?? 0;

          const projectedDist = bImpulse * 0.35;
          const futureX = targetX + dirX * projectedDist;
          const futureZ = targetZ + dirZ * projectedDist;
          const isLethal = Math.abs(futureX) > halfW || Math.abs(futureZ) > halfL;

          if (isLethal) {
            sfxLethalHit();
            this.lethalCinematicTimer = 0.45;
            this.lethalTargetPos.set(targetX, 1.2, targetZ);
            this.juice.trigger("lethal_finish", {
              x: targetX,
              y: 1.2,
              z: targetZ,
              originX: d?.originX,
              originZ: d?.originZ,
              dirX,
              dirZ,
              team: d?.team ?? 1,
              isHit: true,
            });
            this.showAnnouncement("CRITICAL RING-OUT HIT!!");
          } else {
            sfxPunch();
            this.juice.trigger("botpunch", {
              x: targetX,
              y: 1.2,
              z: targetZ,
              originX: d?.originX,
              originZ: d?.originZ,
              dirX,
              dirZ,
              team: d?.team ?? 1,
              isHit: true,
            });
          }
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
                if (ent.immuneTimer > 0) continue; // Respect immunity window!

                // Calculate outward direction away from sweeper hub so player escapes!
                const outDist = Math.hypot(dx, dz) || 1;
                const outNx = dx / outDist;
                const outNz = dz / outDist;

                const armLinearSpeed = Math.abs(arm.rotSpeed) * Math.max(0.6, Math.abs(proj));
                const pushSpeed = Math.max(16.0, armLinearSpeed * 2.8);

                ent.vx = (nx * (arm.rotSpeed > 0 ? 1 : -1) * 0.6 + outNx * 0.8) * pushSpeed;
                ent.vz = (nz * (arm.rotSpeed > 0 ? 1 : -1) * 0.6 + outNz * 0.8) * pushSpeed;
                ent.x += outNx * 0.8;
                ent.z += outNz * 0.8;

                ent.launched = true;
                ent.launchTimer = 0; // Fresh launch timer
                ent.launchSpeed = Math.sqrt(ent.vx * ent.vx + ent.vz * ent.vz);
                ent.bounceCount = 1;
                ent.immuneTimer = 1.4; // 1.4s immunity prevents sweeper multi-hit juggle!

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

        // Visual bounce, comedic abyss tumble, or sky drop
        if (ent.isFalling) {
          // Plunging down into the bottomless abyss!
          ent.mesh.position.y = ent.y + footOffset;
          ent.mesh.rotation.x += dt * 24.0;
          ent.mesh.rotation.z += dt * 20.0;
          if (u.leftArm && u.rightArm) {
            u.leftArm.rotation.set(-2.8, Math.sin(now * 0.05) * 1.5, 1.4);
            u.rightArm.rotation.set(-2.8, -Math.sin(now * 0.05) * 1.5, -1.4);
          }
          if (u.leftLeg && u.rightLeg) {
            u.leftLeg.rotation.x = Math.sin(now * 0.06) * 1.8;
            u.rightLeg.rotation.x = -Math.sin(now * 0.06) * 1.8;
          }
        } else if (ent.respawning) {
          // Dropping in from sky on respawn
          ent.mesh.position.y = groundH + ent.y + footOffset;
          ent.mesh.rotation.x = 0;
          ent.mesh.rotation.z = 0;
          if (u.leftArm && u.rightArm) {
            u.leftArm.rotation.set(0, 0, 1.4);
            u.rightArm.rotation.set(0, 0, -1.4);
          }
        } else if (ent.launched) {
          // High dramatic over-the-top parabolic flight arc (lasts ~2.4s, hard cap 3.0s max)
          const launchDuration = 2.4;
          const tProgress = Math.min(1.0, (ent.launchTimer || 0) / launchDuration);
          const flightArc = Math.sin(tProgress * Math.PI) * (3.0 + Math.min((ent.bounceCount || 0) * 0.4, 1.2));
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

    // Update reality TV live audience disaster manager & physics on entities
    const disasterVoteState = this.disasterManager.update(dt, this.entities);

    // Push game state to React (including player skill & reality TV disaster voting)
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
      disasterVoteState,
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
    this.disasterManager.destroy();
    this.arenaController?.dispose();
    this.renderer.dispose();
    this.scene.clear();
  }
}
