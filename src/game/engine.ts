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
  sfxSkillActivate,
  sfxRoundCountdownTick,
  sfxRoundBuzzer,
  sfxRoundVictoryFanfare,
  sfxRoundTransitionWhoosh,
  sfxGrandChampionshipVictory,
} from "./audio";
import { DisasterManager, type DisasterVoteState, type DisasterId } from "./disasters";
// @ts-ignore — JS asset modules following 404 asset contract
import generateMecha from "../assets/toy_mecha.js";
// @ts-ignore
import generateBumper from "../assets/pinball_bumper.js";
import { createFallGuysArena, type ArenaController } from "./fallguysArena";
import { getArenaHeight, getArenaSlope } from "./arenaHeight";
import { TournamentManager, type RoundResult, type RoundDef } from "./tournament";

export interface GameState {
  timer: string;
  rawTimer: number;
  finalCountdown: number; // 3, 2, 1, or 0
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
  cameraMode: "third_close";
  // Reality TV Live Audience Disaster Vote
  disasterVoteState: DisasterVoteState;
  // 5-Round Championship Tournament Metadata
  currentRound: number;
  totalRounds: number;
  roundWins: [number, number];
  roundTitle: string;
  roundSubtitle: string;
  roundBadge: string;
  roundTheme: string;
  // Celebration state
  celebrationBanner: {
    isActive: boolean;
    winner: number;
    winnerName: string;
    isGrandChampionship: boolean;
  } | null;
  // Knockout & Ring-Out Stats
  kos: [number, number];
  outs: [number, number];
  playerKo: number;
  playerOut: number;
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
  public onRoundEnd: ((result: RoundResult) => void) | null = null;
  public onTournamentEnd: ((winner: number, history: RoundResult[], wins: [number, number]) => void) | null = null;

  public appMode: "title" | "intro" | "game" | "result" | "round_recap" = "title";
  public introPhase: "opener" | "cyan_team" | "vs_clash" | "coral_team" | "countdown" = "opener";
  private titleCamAngle = 0;
  private introCamTarget = new THREE.Vector3(0, 16.0, -22.0);
  private introLookTarget = new THREE.Vector3(0, 2.0, -4.0);
  private winningTeam = 0;

  public tournament = new TournamentManager();

  public cameraMode: "third_close" = "third_close";

  private announcement = "";
  private announcementTimer = 0;

  // Reality TV Live Audience Disaster Manager
  private disasterManager!: DisasterManager;

  // Camera follow state (starts behind Cyan player at z=-17, looking downfield toward Coral at +Z)
  private camTargetPos = new THREE.Vector3(0, 8.5, -31.0);
  private camLookTarget = new THREE.Vector3(0, 1.2, -11.0);
  private baseFov = 58;
  private targetFov = 58;

  // Match-start cinematic swoop dive camera (animates wide countdown view down into 3rd person close)
  private isMatchStartDiving = false;
  private matchStartDiveTimer = 0;
  private readonly MATCH_START_DIVE_DURATION = 0.95;
  private diveStartCamPos = new THREE.Vector3();
  private diveStartCamLook = new THREE.Vector3();

  // Arena visual meshes & controller
  private floorMesh!: THREE.Mesh;
  private arenaController: ArenaController | null = null;

  // Round Celebration & Grand Championship State
  public isCelebratingRound = false;
  private roundCelebrationTimer = 0;
  private isGrandChampionship = false;
  private celebrationWinner = 0;
  private lastCountdownSec = 0;
  private trophyMesh!: THREE.Group;

  constructor(
    canvas: HTMLCanvasElement,
    onStateChange: GameStateCallback,
    onMatchEnd?: (winner: number, scores: [number, number]) => void,
    onRoundEnd?: (result: RoundResult) => void,
    onTournamentEnd?: (winner: number, history: RoundResult[], wins: [number, number]) => void
  ) {
    this.canvas = canvas;
    this.onStateChange = onStateChange;
    this.onMatchEnd = onMatchEnd || null;
    this.onRoundEnd = onRoundEnd || null;
    this.onTournamentEnd = onTournamentEnd || null;
  }

  private isMobileDevice(): boolean {
    if (typeof navigator === "undefined") return false;
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      ("ontouchstart" in window) ||
      (typeof window !== "undefined" && (window.innerWidth <= 840 || window.innerHeight <= 450))
    );
  }

  init() {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    const isMobile = this.isMobileDevice();
    this.renderer.setPixelRatio(
      isMobile ? Math.min(window.devicePixelRatio || 1, 1.5) : Math.min(window.devicePixelRatio || 1, 2)
    );
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

    // 3D Grand Championship Trophy
    this.trophyMesh = this.createChampionshipTrophy();
    this.scene.add(this.trophyMesh);

    // Match
    this.match = new Match();
    this.match.onGoal = (team, points, combo, bounces, _entityIdx, killerIdx) => {
      sfxRingOut();
      if (combo > 1) sfxCombo(combo);

      this.juice.trigger("ringout", { team, x: 0, y: 1.5, z: 0 });
      this.arenaController?.onGoalCelebration(team);
      const teamName = team === 0 ? "TEAM CYAN" : "TEAM CORAL";
      let txt =
        killerIdx === 0
          ? `YOU SCORED A RING-OUT K.O.! +${points}`
          : `${teamName} RING-OUT K.O.! +${points}`;
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
      sfxWhistle();
      sfxCrowdCheer(1.8);

      const roundResult = this.tournament.recordRoundResult(
        winner,
        scores,
        this.match.kos,
        this.match.outs,
        this.match.playerKo,
        this.match.playerOut
      );
      this.winningTeam = winner;
      this.celebrationWinner = winner;
      this.isGrandChampionship = this.tournament.isTournamentOver;
      this.isCelebratingRound = true;
      this.roundCelebrationTimer = this.isGrandChampionship ? 5.2 : 3.6;

      if (this.isGrandChampionship) {
        this.winningTeam = this.tournament.tournamentWinner;
        this.celebrationWinner = this.tournament.tournamentWinner;
        this.trophyMesh.visible = true;
        this.juice.spawnGrandChampionshipFireworks();
        sfxGrandChampionshipVictory();
        const winTeam =
          this.winningTeam === 0
            ? "TEAM CYAN"
            : this.winningTeam === 1
              ? "TEAM CORAL"
              : "DRAW";
        this.showAnnouncement(`GRAND CHAMPIONS: ${winTeam} WINS THE TOURNAMENT!`);
      } else {
        this.juice.spawnRoundCelebration(winner);
        sfxRoundVictoryFanfare(winner);
        const winTeam =
          winner === 0 ? "TEAM CYAN" : winner === 1 ? "TEAM CORAL" : "TIED ROUND";
        this.showAnnouncement(`ROUND ${roundResult.roundNumber} OVER — ${winTeam} WINS!`);
      }
    };

    // Skill system
    this.skills = new SkillManager(this.scene);
    this.skills.init();
    this.skillSlots = this.entities.map(() => createEmptySkillSlot());

    // Reality TV Live Audience Disaster Manager
    this.disasterManager = new DisasterManager(this.scene);

    // Audio
    initAudio();

    // Resize & screen orientation handlers
    this.handleResize();
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("orientationchange", this.handleResize);
    document.addEventListener("fullscreenchange", this.handleResize);
    document.addEventListener("webkitfullscreenchange", this.handleResize);

    // Start 3D animation loop immediately so Title Screen has a live dynamic arena background!
    this.running = true;
    this.lastTime = performance.now();
    this.animId = requestAnimationFrame(this.loop);
  }

  private setupLighting() {
    // 1. Cheerful sunny sky / ground hemisphere light (signature Fall Guys / Nintendo lighting)
    const hemi = new THREE.HemisphereLight(0x7dd3fc, 0xfde047, 0.95);
    this.scene.add(hemi);

    // 2. Warm bright direct sunlight with ultra-crisp shadows (optimized for mobile 60 FPS)
    const sun = new THREE.DirectionalLight(0xfff8ee, 1.85);
    sun.position.set(18, 38, 18);
    sun.castShadow = true;
    const isMobile = this.isMobileDevice();
    const shadowMapSize = isMobile ? 1024 : 2048;
    sun.shadow.mapSize.set(shadowMapSize, shadowMapSize);
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
    // 5v5 Official TV Broadcast Match Roster: 5 Cyan vs 5 Coral
    // Symmetrical 5-person chevron squad formation: Captain at center vanguard, inner flankers & outer wings
    const spawnPositions = [
      // Team 0 (Cyan): YOU (#7), DJ BOUNCE (#1), NINJA BEAN (#2), TURBO COPTER (#4), PARTY POPPER (#5)
      {
        x: 0,
        z: -halfL * 0.58,
        team: 0,
        isPlayer: true,
        number: C.ROSTER_CYAN[0].number,
        costume: C.ROSTER_CYAN[0].costume,
      },
      {
        x: -1.7,
        z: -halfL * 0.62,
        team: 0,
        isPlayer: false,
        number: C.ROSTER_CYAN[1].number,
        costume: C.ROSTER_CYAN[1].costume,
      },
      {
        x: 1.7,
        z: -halfL * 0.62,
        team: 0,
        isPlayer: false,
        number: C.ROSTER_CYAN[2].number,
        costume: C.ROSTER_CYAN[2].costume,
      },
      {
        x: -3.4,
        z: -halfL * 0.66,
        team: 0,
        isPlayer: false,
        number: C.ROSTER_CYAN[3].number,
        costume: C.ROSTER_CYAN[3].costume,
      },
      {
        x: 3.4,
        z: -halfL * 0.66,
        team: 0,
        isPlayer: false,
        number: C.ROSTER_CYAN[4].number,
        costume: C.ROSTER_CYAN[4].costume,
      },
      // Team 1 (Coral): REX CRUSH (#1), HOPPER MAD (#2), SHADY VIP (#3), SPIKE TYRANT (#4), CYBER BEAST (#5)
      {
        x: 0,
        z: halfL * 0.58,
        team: 1,
        isPlayer: false,
        number: C.ROSTER_CORAL[0].number,
        costume: C.ROSTER_CORAL[0].costume,
      },
      {
        x: -1.7,
        z: halfL * 0.62,
        team: 1,
        isPlayer: false,
        number: C.ROSTER_CORAL[1].number,
        costume: C.ROSTER_CORAL[1].costume,
      },
      {
        x: 1.7,
        z: halfL * 0.62,
        team: 1,
        isPlayer: false,
        number: C.ROSTER_CORAL[2].number,
        costume: C.ROSTER_CORAL[2].costume,
      },
      {
        x: -3.4,
        z: halfL * 0.66,
        team: 1,
        isPlayer: false,
        number: C.ROSTER_CORAL[3].number,
        costume: C.ROSTER_CORAL[3].costume,
      },
      {
        x: 3.4,
        z: halfL * 0.66,
        team: 1,
        isPlayer: false,
        number: C.ROSTER_CORAL[4].number,
        costume: C.ROSTER_CORAL[4].costume,
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
      const footOffset = Math.max(0.04, -scaledBox.min.y + 0.04);
      mecha.userData.footOffset = footOffset;
      const initH = getArenaHeight(sp.x, sp.z);
      mecha.position.set(sp.x, initH + footOffset, sp.z);
      mecha.rotation.y = sp.team === 1 ? Math.PI : 0;

      // Attach 3D Power-Up Aura (activated when entity gains a Mystery Box skill)
      const aura = this.createCharacterSkillAura(!!sp.isPlayer);
      aura.visible = false;
      mecha.add(aura);
      mecha.userData.skillAura = aura;

      ent.mesh = mecha;
      this.scene.add(mecha);
    }

    assignRoles(this.entities);
  }

  // ─── 3D Character Power-Up Skill Aura ───
  private createCharacterSkillAura(isPlayer: boolean): THREE.Group {
    const auraGroup = new THREE.Group();
    auraGroup.name = "CharacterSkillAura";

    // 1. Swirling ground energy ring
    const ringMat = new THREE.MeshBasicMaterial({
      color: isPlayer ? 0xffd166 : 0x27e5ff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.88, 24), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    auraGroup.add(ring);

    // 2. Orbiting luminous powerup orbs
    const orbMat = new THREE.MeshStandardMaterial({
      color: isPlayer ? 0xfff066 : 0x38bdf8,
      emissive: isPlayer ? 0xffd166 : 0x00f0ff,
      emissiveIntensity: 0.9,
      roughness: 0.1,
    });
    const orbs: THREE.Mesh[] = [];
    for (let o = 0; o < 2; o++) {
      const orb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), orbMat);
      auraGroup.add(orb);
      orbs.push(orb);
    }
    auraGroup.userData.orbs = orbs;

    // 3. For Player: Hovering golden crown star over head
    if (isPlayer) {
      const starGeo = new THREE.OctahedronGeometry(0.18, 0);
      const starMat = new THREE.MeshStandardMaterial({
        color: 0xffd166,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.85,
        metalness: 0.9,
      });
      const star = new THREE.Mesh(starGeo, starMat);
      star.position.y = 2.1;
      auraGroup.add(star);
      auraGroup.userData.crown = star;
    }

    return auraGroup;
  }

  // ─── 3D Grand Championship Golden Trophy ───
  private createChampionshipTrophy(): THREE.Group {
    const trophy = new THREE.Group();
    trophy.name = "GrandChampionshipTrophy";

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.92,
      roughness: 0.18,
      emissive: 0xff9900,
      emissiveIntensity: 0.35,
    });

    const marbleMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.2,
    });

    // 1. Heavy Marble Plinth
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.45, 16), marbleMat);
    plinth.position.y = 0.225;
    trophy.add(plinth);

    // 2. Golden Plinth Trim
    const trim = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.08, 16), goldMat);
    trim.position.y = 0.48;
    trophy.add(trim);

    // 3. Fluted Golden Stem
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 0.65, 16), goldMat);
    stem.position.y = 0.82;
    trophy.add(stem);

    // 4. Golden Trophy Cup Bowl
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.35, 1.1, 20), goldMat);
    bowl.position.y = 1.65;
    trophy.add(bowl);

    // 5. Flanged Golden Cup Rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.08, 12, 24), goldMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 2.2;
    trophy.add(rim);

    // 6. Sweeping Dual Golden Handles
    const handleGeo = new THREE.TorusGeometry(0.48, 0.07, 10, 20, Math.PI * 1.3);
    const leftHandle = new THREE.Mesh(handleGeo, goldMat);
    leftHandle.position.set(-0.95, 1.65, 0);
    leftHandle.rotation.z = Math.PI * 0.45;
    trophy.add(leftHandle);

    const rightHandle = new THREE.Mesh(handleGeo, goldMat);
    rightHandle.position.set(0.95, 1.65, 0);
    rightHandle.rotation.z = -Math.PI * 0.45;
    trophy.add(rightHandle);

    // 7. Golden Star Crest on Front
    const star = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffd700,
      emissiveIntensity: 1.2,
    }));
    star.position.set(0, 1.75, 0.85);
    trophy.add(star);

    // 8. Sparkling Halo Ring
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffea00,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const halo = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.55, 24), haloMat);
    halo.rotation.x = Math.PI / 2;
    halo.position.y = 0.04;
    trophy.add(halo);

    trophy.position.set(0, 0, 0);
    trophy.visible = false;
    return trophy;
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

  public triggerPlayerSkill() {
    if (this.appMode !== "game") return;
    if (this.skillSlots[0] && this.skillSlots[0].type !== SkillType.None) {
      sfxSkillActivate();
      this.skills.activateSkill(
        0,
        this.entities[0],
        this.entities,
        this.skillSlots,
        this.handleSkillEvent,
        this.gates
      );
    }
  }

  public startIntro() {
    this.appMode = "intro";
    this.tournament.startNewTournament();
    if (this.arenaController) {
      this.arenaController.setMapTheme(1);
    }
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
        // Golden 5v5 squad framing: 8.2m distance comfortably frames entire 5-person squad within center 48% of screen
        this.introCamTarget.set(0, 1.95, -9.8);
        this.introLookTarget.set(0, 1.15, -18.0);
        break;
      case "vs_clash":
        // Low-angle dramatic sweep over the elevated midfield battle deck looking across both teams
        this.introCamTarget.set(-11.5, 3.4, 0);
        this.introLookTarget.set(0, 1.4, 0);
        break;
      case "coral_team":
        // Golden 5v5 squad framing: 8.2m distance comfortably frames entire 5-person squad within center 48% of screen
        this.introCamTarget.set(0, 1.95, 9.8);
        this.introLookTarget.set(0, 1.15, 18.0);
        break;
      case "countdown":
        // Sweeping up and dropping into exact 3rd-person gameplay position behind player
        this.introCamTarget.set(0, 9.0, -C.ARENA_L * 0.5 - 2.0);
        this.introLookTarget.set(0, 1.2, -11.0);
        break;
    }
  }

  public startMatch(roundNumber?: number) {
    if (roundNumber !== undefined) {
      this.tournament.currentRound = roundNumber;
    }
    const currentRoundDef = this.tournament.getCurrentRoundDef();

    this.isCelebratingRound = false;
    this.roundCelebrationTimer = 0;
    this.lastCountdownSec = 0;
    if (this.trophyMesh) this.trophyMesh.visible = false;

    this.appMode = "game";
    resumeAudio();
    sfxMatchStart();
    startBGM();

    // Set map theme on arena controller (skybox, floor texture, obstacle visibility)
    if (this.arenaController) {
      this.arenaController.setMapTheme(currentRoundDef.roundNumber);
    }

    this.match.start();
    this.disasterManager.reset();
    this.resetEntitiesToSpawn();
    this.showAnnouncement(`${currentRoundDef.title} — ROUND ${currentRoundDef.roundNumber} START!`);

    // Initialize cinematic swoop dive transition from current camera orientation
    this.diveStartCamPos.copy(this.camera.position);
    this.diveStartCamLook.copy(this.camLookTarget);
    this.isMatchStartDiving = true;
    this.matchStartDiveTimer = 0;

    const halfL = C.ARENA_L * 0.5;
    const spawnZ = -halfL * 0.58;
    this.camTargetPos.set(0, 3.8, spawnZ - 6.8);
    this.camLookTarget.set(0, 1.3, spawnZ + 8.0);
    sfxRoundTransitionWhoosh();
  }

  public advanceToNextRound() {
    this.isCelebratingRound = false;
    this.roundCelebrationTimer = 0;
    if (this.trophyMesh) this.trophyMesh.visible = false;
    sfxRoundTransitionWhoosh();
    if (this.tournament.advanceToNextRound()) {
      this.startMatch(this.tournament.currentRound);
    } else {
      this.appMode = "result";
      if (this.onTournamentEnd) {
        this.onTournamentEnd(
          this.tournament.tournamentWinner,
          this.tournament.roundHistory,
          this.tournament.roundWins
        );
      } else if (this.onMatchEnd) {
        this.onMatchEnd(this.winningTeam, this.match.scores);
      }
    }
  }

  public skipRoundCelebration() {
    if (this.isCelebratingRound && !this.isGrandChampionship) {
      this.advanceToNextRound();
    }
  }

  public startNewTournament() {
    this.isCelebratingRound = false;
    this.roundCelebrationTimer = 0;
    this.lastCountdownSec = 0;
    if (this.trophyMesh) this.trophyMesh.visible = false;
    this.tournament.startNewTournament();
    if (this.arenaController) {
      this.arenaController.setMapTheme(1);
    }
    this.startMatch(1);
  }

  public resetToTitle() {
    this.isCelebratingRound = false;
    this.isMatchStartDiving = false;
    this.roundCelebrationTimer = 0;
    this.lastCountdownSec = 0;
    if (this.trophyMesh) this.trophyMesh.visible = false;
    this.appMode = "title";
    stopBGM();
    this.tournament.startNewTournament();
    if (this.arenaController) {
      this.arenaController.setMapTheme(1);
    }
    this.disasterManager.reset();
    this.resetEntitiesToSpawn();
    this.match.reset();
  }

  private resetEntitiesToSpawn() {
    const halfL = C.ARENA_L * 0.5;
    const spawnPositions = [
      { x: 0, z: -halfL * 0.58 },
      { x: -1.7, z: -halfL * 0.62 },
      { x: 1.7, z: -halfL * 0.62 },
      { x: -3.4, z: -halfL * 0.66 },
      { x: 3.4, z: -halfL * 0.66 },
      { x: 0, z: halfL * 0.58 },
      { x: -1.7, z: halfL * 0.62 },
      { x: 1.7, z: halfL * 0.62 },
      { x: -3.4, z: halfL * 0.66 },
      { x: 3.4, z: halfL * 0.66 },
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
        const footOffset = u.footOffset || 0.04;
        ent.mesh.position.set(sp.x, getArenaHeight(sp.x, sp.z) + footOffset, sp.z);
        ent.mesh.rotation.set(0, ent.team === 1 ? Math.PI : 0, 0);
        if (u.leftArm) {
          u.leftArm.position.set(-0.35, 0.08, 0.04);
          u.leftArm.rotation.set(-0.25, 0, 0.35);
        }
        if (u.rightArm) {
          u.rightArm.position.set(0.35, 0.08, 0.04);
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
      const footOffset = u.footOffset || 0.04;
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
      const footOffset = u.footOffset || 0.04;
      const baseH = getArenaHeight(ent.x, ent.z);

      let jumpY = 0;
      let rotY = ent.team === 1 ? Math.PI : 0;
      let rotX = 0;
      let rotZ = 0;

      // ─── TEAM CYAN ANIMATIONS (Phase: cyan_team, indices 0..4) ───
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
          rotY = (isCyanPhase ? 0.16 : 0) + Math.sin(t * 3.5) * 0.12;

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
          rotY = isCyanPhase ? -0.16 : 0;
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
        } else if (i === 3) {
          // ── TURBO COPTER (#4): Propeller Spinning & Rapid Aerial Hops! ──
          jumpY = isCyanPhase ? Math.abs(Math.sin(t * 9.0)) * 0.24 : 0;
          rotY = (isCyanPhase ? 0.28 : 0);
          if (u.propeller) {
            u.propeller.rotation.y += 0.55;
          }
          if (u.leftArm) {
            u.leftArm.rotation.set(-1.5 + Math.sin(t * 7.0) * 0.3, 0.3, 0.5);
          }
          if (u.rightArm) {
            u.rightArm.rotation.set(-1.5 - Math.sin(t * 7.0) * 0.3, -0.3, -0.5);
          }
          if (u.head) {
            u.head.rotation.z = Math.sin(t * 5.0) * 0.15;
          }
        } else if (i === 4) {
          // ── PARTY POPPER (#5): Confetti Cannon Victory Pump & Celebrations! ──
          jumpY = isCyanPhase ? Math.abs(Math.sin(t * 7.0)) * 0.26 : 0;
          rotY = (isCyanPhase ? -0.28 : 0);
          const pump = Math.sin(t * 8.0);
          if (u.leftArm) {
            u.leftArm.rotation.set(-1.8 + pump * 0.4, 0, 0.3);
          }
          if (u.rightArm) {
            u.rightArm.rotation.set(-1.8 + pump * 0.4, 0, -0.3);
          }
          if (u.torso) {
            u.torso.rotation.x = -pump * 0.1;
          }
        }
      }

      // ─── TEAM CORAL ANIMATIONS (Phase: coral_team, indices 5..9) ───
      else if (ent.team === 1) {
        const isCoralPhase = this.introPhase === "coral_team";
        const animSpeed = isCoralPhase ? 1.0 : 0.45;
        const t = now * animSpeed;

        if (i === 5) {
          // ── REX CRUSH (#1): Massive Gorilla Chest Pounding & Stomps! ──
          const poundCycle = Math.sin(t * 9.0);
          jumpY = isCoralPhase ? Math.abs(Math.sin(t * 6.0)) * 0.16 : 0;
          rotY = Math.PI;

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
        } else if (i === 6) {
          // ── HOPPER MAD (#2): Wild Bouncing & Flailing Joy! ──
          jumpY = isCoralPhase ? Math.abs(Math.sin(t * 11.0)) * 0.42 : Math.abs(Math.sin(t * 4.0)) * 0.1;
          rotY = isCoralPhase ? (Math.PI - 0.16) : Math.PI;
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
        } else if (i === 7) {
          // ── SHADY VIP (#3): Cool Confident Arms-Crossed Swagger! ──
          jumpY = isCoralPhase ? Math.sin(t * 3.0) * 0.05 : 0;
          rotY = (isCoralPhase ? (Math.PI + 0.16) : Math.PI) + Math.sin(t * 2.0) * 0.10;

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
        } else if (i === 8) {
          // ── SPIKE TYRANT (#4): Brutal Heavy Boxer Intimidation Sway! ──
          jumpY = isCoralPhase ? Math.abs(Math.sin(t * 5.0)) * 0.12 : 0;
          rotY = isCoralPhase ? (Math.PI - 0.28) : Math.PI;
          const punch = Math.sin(t * 6.0);
          if (u.leftArm) {
            u.leftArm.rotation.set(-1.2 - punch * 0.5, 0.4, 0.4);
          }
          if (u.rightArm) {
            u.rightArm.rotation.set(-1.2 + punch * 0.5, -0.4, -0.4);
          }
          if (u.torso) {
            u.torso.rotation.y = punch * 0.25;
          }
        } else if (i === 9) {
          // ── CYBER BEAST (#5): Calculated Robotic Guard Stance! ──
          jumpY = isCoralPhase ? Math.sin(t * 4.0) * 0.06 : 0;
          rotY = isCoralPhase ? (Math.PI + 0.28) : Math.PI;
          if (u.leftArm) {
            u.leftArm.rotation.set(-1.3, 0.6, 0.2);
          }
          if (u.rightArm) {
            u.rightArm.rotation.set(-0.6, -0.3, -0.6);
          }
          if (u.head) {
            u.head.rotation.x = Math.sin(t * 3.0) * 0.1;
          }
        }
      }

      ent.mesh.position.set(ent.x, baseH + footOffset + jumpY, ent.z);
      ent.mesh.rotation.set(rotX, rotY, rotZ);
    }
  }

  private introTagTempV = new THREE.Vector3();

  private updateIntroOverheadTags() {
    if (this.introPhase !== "cyan_team" && this.introPhase !== "coral_team") {
      return;
    }
    const isCyan = this.introPhase === "cyan_team";
    const indices = isCyan ? [3, 1, 0, 2, 4] : [9, 7, 5, 6, 8];

    this.camera.updateMatrixWorld();

    for (const entIdx of indices) {
      const ent = this.entities[entIdx];
      const el = document.getElementById(`intro-tag-ent-${entIdx}`);
      if (!ent || !ent.mesh || !el) continue;

      ent.mesh.updateMatrixWorld();
      ent.mesh.getWorldPosition(this.introTagTempV);

      // Height offset to place tag right above head / crown / hat
      const isCaptain = entIdx === 0 || entIdx === 5;
      this.introTagTempV.y += isCaptain ? 1.62 : 1.48;

      this.introTagTempV.project(this.camera);

      // In front of camera
      if (this.introTagTempV.z < 1.0) {
        const screenX = (this.introTagTempV.x * 0.5 + 0.5) * 100;
        const screenY = (-this.introTagTempV.y * 0.5 + 0.5) * 100;

        el.style.left = `${screenX.toFixed(2)}%`;
        el.style.top = `${screenY.toFixed(2)}%`;
      }
    }
  }

  private handleResize = () => {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    if (w === 0 || h === 0) return;
    const isMobile = this.isMobileDevice();
    const dpr = isMobile
      ? Math.min(window.devicePixelRatio || 1, 1.5)
      : Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  // ─── Camera System (Exclusively 3rd-Person Close Action Cam) ───
  public toggleCamera(): string {
    return "3rd Close";
  }

  private updateCamera(dt: number) {
    if (this.isCelebratingRound) return; // Celebration camera controls orientation and position

    const p = this.entities[0];
    if (!p) return;

    // Player mecha mesh is always visible in 3rd person close cam
    if (p.mesh) {
      p.mesh.visible = true;
    }

    const pGroundY = getArenaHeight(p.x, p.z);

    // Close Over-The-Shoulder Action Cam (Single Exclusive Camera)
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

    // Smooth Gimbal Look Target (interpolates smoothly to eliminate angular snap and jitter)
    const desiredLookX = p.x * 0.45;
    const desiredLookY = pGroundY + 1.35;
    const desiredLookZ = p.z + 7.5;

    if (this.isMatchStartDiving) {
      this.matchStartDiveTimer += dt;
      const progress = Math.min(1.0, this.matchStartDiveTimer / this.MATCH_START_DIVE_DURATION);
      // Smootherstep (Ken Perlin quintic S-curve: zero velocity and acceleration at start & end)
      const ease = progress * progress * progress * (progress * (progress * 6 - 15) + 10);

      // Lerp camera position from wide countdown position to the 3rd-person target position
      this.camera.position.lerpVectors(this.diveStartCamPos, this.camTargetPos, ease);

      // Interpolate look target smoothly toward desired look
      const desiredLook = new THREE.Vector3(desiredLookX, desiredLookY, desiredLookZ);
      this.camLookTarget.lerpVectors(this.diveStartCamLook, desiredLook, ease);
      this.camera.lookAt(this.camLookTarget);

      // Dynamic cinematic FOV rush during dive (widens slightly then settles cleanly)
      const fovBump = Math.sin(progress * Math.PI) * 4.5;
      this.camera.fov = this.baseFov + fovBump;
      this.camera.updateProjectionMatrix();

      if (progress >= 1.0) {
        this.isMatchStartDiving = false;
      }
    } else {
      // Smooth Gimbal Look Target (interpolates smoothly to eliminate angular snap and jitter)
      const lookSpeed = Math.min(1.0, 9.0 * dt);
      this.camLookTarget.x += (desiredLookX - this.camLookTarget.x) * lookSpeed;
      this.camLookTarget.y += (desiredLookY - this.camLookTarget.y) * lookSpeed;
      this.camLookTarget.z += (desiredLookZ - this.camLookTarget.z) * lookSpeed;

      // Smooth Gimbal Camera Position Tracking
      const posSpeed = Math.min(1.0, 8.0 * dt);
      this.camera.position.lerp(this.camTargetPos, posSpeed);
      this.camera.lookAt(this.camLookTarget);

      // Dynamic FOV (gentle, nausea-free transitions)
      const playerSlot = this.skillSlots[0];
      if (playerSlot && playerSlot.rocketTimer > 0) {
        this.targetFov = 62;
      } else if (p.dashTimer > 0) {
        this.targetFov = 60;
      } else {
        this.targetFov = this.baseFov;
      }
      this.camera.fov += (this.targetFov - this.camera.fov) * Math.min(1.0, 6.0 * dt);
      this.camera.updateProjectionMatrix();
    }

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
      case "pickup": {
        const d = data as any;
        sfxPickup();
        this.juice.trigger("pickup", d);
        if (d?.isPlayer) {
          this.showAnnouncement(`POWER-UP READY: ${d.skillName}! [PRESS E]`);
        }
        break;
      }
      case "box_spawn": {
        this.showAnnouncement("POWER-UP MYSTERY BOX SPAWNED!");
        break;
      }
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

    try {

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
      this.updateIntroOverheadTags();

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
      const isFirstPerson = (this.cameraMode as string) === "first_person";
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
      updateBots(
        this.entities,
        this.bumpers,
        this.gates,
        dt,
        (type, data) => {
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
        },
        this.skillSlots,
        (botIdx) => {
          this.skills.activateSkill(
            botIdx,
            this.entities[botIdx],
            this.entities,
            this.skillSlots,
            this.handleSkillEvent,
            this.gates
          );
        },
        this.skills.getActiveBoxes()
      );

      // Current round definition & modifiers
      const currentRoundDef = this.tournament.getCurrentRoundDef();

      // Physics
      updatePhysics(
        this.entities,
        this.bumpers,
        this.gates,
        dt,
        (scoringTeam, multiplier, bounceCount, entityIdx, killerIdx) => {
          const scaledPoints = Math.round(multiplier * currentRoundDef.goalMultiplier);
          this.match.score(scoringTeam, scaledPoints, bounceCount, entityIdx, killerIdx);
        },
        currentRoundDef.groundFriction
      );

      // Sweeper Arm Obstacle Collisions (The Whirlygig!) — active in rounds 1, 2, 3
      if (this.arenaController && this.arenaController.sweeperArms.length > 0 && currentRoundDef.roundNumber <= 3) {
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

      // Round 2: Neon Speedway Flank Conveyor Belts
      if (this.arenaController?.conveyorBelts && currentRoundDef.roundNumber === 2) {
        for (const belt of this.arenaController.conveyorBelts) {
          const halfWidth = belt.width * 0.5;
          for (const ent of this.entities) {
            if (
              Math.abs(ent.x - belt.x) <= halfWidth + ent.radius &&
              ent.z >= belt.zMin &&
              ent.z <= belt.zMax
            ) {
              ent.vz += belt.directionZ * belt.speed * dt;
            }
          }
        }
      }

      // Round 3: Stormland Lightning Flash
      if (currentRoundDef.roundNumber === 3 && Math.random() < 0.008) {
        this.arenaController?.triggerLightning?.();
      }

      // Round 4: Cyberpinball Jump Pads
      if (this.arenaController?.jumpPads && currentRoundDef.roundNumber === 4) {
        for (const pad of this.arenaController.jumpPads) {
          for (const ent of this.entities) {
            const dx = ent.x - pad.x;
            const dz = ent.z - pad.z;
            const dist = Math.hypot(dx, dz);
            if (dist < pad.radius + ent.radius && ent.y <= 0.25 && ent.immuneTimer <= 0) {
              ent.vy = pad.impulseY;
              ent.vz += pad.impulseZ;
              ent.immuneTimer = 0.6;
              sfxBoing();
              this.juice.trigger("bumper", {
                x: pad.x,
                y: 1.0,
                z: pad.z,
                text: "BOING!",
              });
            }
          }
        }
      }

      // Round 5: Midnight Cosmic Singularity Vortex in Final 30 Seconds
      if (currentRoundDef.roundNumber === 5) {
        const isFinal30s = this.match.timer <= 30 && this.match.timer > 0;
        this.arenaController?.setCosmicVortexActive?.(isFinal30s);
        if (isFinal30s) {
          for (const ent of this.entities) {
            const dist = Math.hypot(ent.x, ent.z);
            if (dist > 1.0) {
              const pull = Math.min(10.0, 32.0 / dist) * dt;
              ent.vx -= (ent.x / dist) * pull;
              ent.vz -= (ent.z / dist) * pull;
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

    // Final Seconds countdown tracking (audio alarm silenced per user request)
    if (this.appMode === "game" && this.match.started && !this.match.over && !this.isCelebratingRound) {
      const rem = Math.ceil(this.match.timer);
      if (rem <= 3 && rem >= 1 && rem !== this.lastCountdownSec) {
        this.lastCountdownSec = rem;
      }
    }

    // ─── Round / Tournament Celebration Orchestrator ───
    if (this.isCelebratingRound) {
      this.roundCelebrationTimer -= dt;

      if (this.isGrandChampionship) {
        // Championship Gathering: Winning team members run to center trophy
        const winTeam = this.celebrationWinner;
        const teamStart = winTeam === 0 ? 0 : 5;
        const offsets = [
          { x: 0, z: -1.6 },      // Captain / MVP (front center)
          { x: -2.4, z: -0.4 },   // Wing Left
          { x: 2.4, z: -0.4 },    // Wing Right
          { x: -1.6, z: 1.5 },    // Rear Left
          { x: 1.6, z: 1.5 },     // Rear Right
        ];

        for (let k = 0; k < 5; k++) {
          const ent = this.entities[teamStart + k];
          if (!ent) continue;
          const target = offsets[k];
          const stepRate = Math.min(1.0, 5.0 * dt);
          ent.x += (target.x - ent.x) * stepRate;
          ent.z += (target.z - ent.z) * stepRate;
          ent.vx = 0;
          ent.vz = 0;

          if (ent.mesh) {
            const lookAngle = Math.atan2(-target.x, -target.z);
            ent.mesh.rotation.y = lookAngle;
          }
        }

        // Rotate trophy
        if (this.trophyMesh) {
          this.trophyMesh.visible = true;
          this.trophyMesh.rotation.y += dt * 0.85;
        }

        // 360-degree Orbiting Championship Camera
        this.titleCamAngle += dt * 0.38;
        this.camera.position.set(
          Math.sin(this.titleCamAngle) * 9.5,
          4.2,
          Math.cos(this.titleCamAngle) * 9.5
        );
        this.camera.lookAt(0, 1.4, 0);
      } else {
        // Regular Round Victory Camera: Frames winning team
        const winZ = this.celebrationWinner === 0 ? -12.0 : 12.0;
        this.camLookTarget.lerp(new THREE.Vector3(0, 1.4, winZ), Math.min(1.0, 5.0 * dt));
        this.camera.position.lerp(
          new THREE.Vector3(0, 4.5, winZ - (this.celebrationWinner === 0 ? 8.0 : -8.0)),
          Math.min(1.0, 4.0 * dt)
        );
        this.camera.lookAt(this.camLookTarget);
      }

      // Check for celebration expiration
      if (this.roundCelebrationTimer <= 0) {
        this.isCelebratingRound = false;
        if (this.isGrandChampionship) {
          this.appMode = "result";
          if (this.onTournamentEnd) {
            this.onTournamentEnd(
              this.tournament.tournamentWinner,
              this.tournament.roundHistory,
              this.tournament.roundWins
            );
          } else if (this.onMatchEnd) {
            this.onMatchEnd(this.winningTeam, this.match.scores);
          }
        } else {
          // Seamlessly flow directly to the next round with camera dive!
          this.advanceToNextRound();
        }
      }
    }

    // 3rd-person camera follow (stabilized tracking)
    this.updateCamera(dt);

    // Juice (particles, shockwaves, comic popups, subtle micro-offset)
    this.juice.update(dt);

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
        const footOffset = u.footOffset || 0.04;
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

        // ─── Realistic Procedural Locomotion (Alternating Stride, Knee Bend, Arm Pump, Stance Push-Off) ───
        if (u.leftArm && u.rightArm && u.leftLeg && u.rightLeg && u.torso && !ent.launched) {
          const baseHipsY = u.baseHipsY ?? 0.52;

          // In-Round Victory Celebration vs Defeat Slump
          if (this.isCelebratingRound) {
            if (ent.team === this.celebrationWinner) {
              // Jump bounce
              const bounce = Math.abs(Math.sin(now * 0.008 + i * 0.9)) * 0.72;
              ent.mesh.position.y = groundH + footOffset + bounce;

              // Fist pumping in air
              u.leftArm.rotation.x = -2.6 + Math.sin(now * 0.009 + i) * 0.35;
              u.leftArm.rotation.z = 0.42;
              u.rightArm.rotation.x = -2.6 - Math.sin(now * 0.009 + i) * 0.35;
              u.rightArm.rotation.z = -0.42;
              if (u.leftForearm) u.leftForearm.rotation.x = -0.65;
              if (u.rightForearm) u.rightForearm.rotation.x = -0.65;

              // Cheering head & torso
              if (u.head) u.head.rotation.x = -0.25;
              u.torso.rotation.x = 0;
              u.torso.rotation.y = Math.sin(now * 0.006 + i) * 0.15;
              u.torso.rotation.z = Math.sin(now * 0.008) * 0.08;
              continue;
            } else {
              // Defeated slump posture
              ent.mesh.position.y = groundH + footOffset;
              if (u.head) u.head.rotation.x = 0.55;
              u.torso.rotation.x = 0.38;
              u.torso.rotation.y = 0;
              u.torso.rotation.z = 0;
              u.leftArm.rotation.x = 0.35;
              u.leftArm.rotation.z = 0.15;
              u.rightArm.rotation.x = 0.35;
              u.rightArm.rotation.z = -0.15;
              if (u.leftForearm) u.leftForearm.rotation.x = -0.15;
              if (u.rightForearm) u.rightForearm.rotation.x = -0.15;
              continue;
            }
          }
          if (spd > 0.35 && !ent.stunTimer) {
            const isRun = spd > 7.0 || ent.dashTimer > 0 || (slot && slot.rocketTimer > 0);

            // Dynamic stride frequency: walks briskly, sprints fast during dash/high speed
            const cadence = isRun ? 12.0 + (spd - 7.0) * 0.8 : 6.8 + spd * 0.85;
            u.walkPhase = (u.walkPhase || 0) + dt * cadence;
            const phase = u.walkPhase;

            const sinL = Math.sin(phase);
            const sinR = -sinL; // 180° alternating mirror stride

            // 1. Long Thighs / Upper Legs (Alternating stride forward/backward)
            const thighAmp = isRun ? 0.85 : 0.55;
            u.leftLeg.rotation.x = -sinL * thighAmp;
            u.rightLeg.rotation.x = -sinR * thighAmp;

            // 2. Articulated Knees (Bends backward during swing-forward to clear ground, straightens on plant/push-off)
            if (u.leftLowerLeg && u.rightLowerLeg) {
              const kneeBendMax = isRun ? 1.25 : 0.75;
              // Left knee bends backward when swinging forward (sinL > 0)
              u.leftLowerLeg.rotation.x = Math.max(0, sinL * kneeBendMax);
              // Right knee bends backward when swinging forward (sinR > 0)
              u.rightLowerLeg.rotation.x = Math.max(0, sinR * kneeBendMax);
            }

            // 3. Sneakers / Feet (Toe push-off backward, heel strike forward)
            if (u.leftFoot && u.rightFoot) {
              const footAmp = isRun ? 0.38 : 0.22;
              u.leftFoot.rotation.x = -sinL * footAmp;
              u.rightFoot.rotation.x = -sinR * footAmp;
            }

            // 4. Pelvis & Hips (Yaw swivel with advancing leg + vertical step bounce)
            if (u.hips) {
              // Pelvis swivels slightly toward the forward stepping leg
              u.hips.rotation.y = -sinL * (isRun ? 0.16 : 0.09);
              // Up-and-down double-frequency step bounce (peaks mid-stride, dips at foot strike)
              const stepBounce = Math.abs(Math.sin(phase)) * (isRun ? 0.045 : 0.022);
              u.hips.position.y = baseHipsY + stepBounce;
            }

            // 5. Torso (Aerodynamic forward lean + counter-twist + side sway)
            const forwardLean = isRun ? Math.min(0.36, 0.16 + (spd - 7.0) * 0.02) : 0.06;
            u.torso.rotation.x = forwardLean + (slope ? slope.pitch * 0.45 : 0);
            u.torso.rotation.y = sinL * (isRun ? 0.14 : 0.08); // Counter-twist opposite hips
            u.torso.rotation.z = Math.sin(phase) * (isRun ? 0.05 : 0.08); // Side-to-side weight transfer

            // 6. Long Arms & Forearms (Alternating opposition swing)
            // Left arm swings forward with right leg (when sinL < 0)
            const armSwingAmp = isRun ? 1.05 : 0.60;
            u.leftArm.rotation.x = -0.22 + sinL * armSwingAmp;
            u.leftArm.rotation.z = 0.28 + Math.sin(phase) * 0.06;

            if (u.leftForearm) {
              // Forearm bends into running pump on forward swing
              const elbowBend = isRun ? -0.80 - Math.max(0, -sinL) * 0.65 : -0.32 - Math.max(0, -sinL) * 0.38;
              u.leftForearm.rotation.x = elbowBend;
            }

            // Right arm (unless currently punching)
            if (ent.punchCd <= 0) {
              u.rightArm.rotation.x = -0.22 - sinL * armSwingAmp;
              u.rightArm.rotation.z = -0.28 - Math.sin(phase) * 0.06;
              if (u.rightForearm) {
                const elbowBend = isRun ? -0.80 - Math.max(0, sinL) * 0.65 : -0.32 - Math.max(0, sinL) * 0.38;
                u.rightForearm.rotation.x = elbowBend;
              }
            }
          } else {
            // Idle Stance: Smooth natural return to standing resting pose
            const lerpSpeed = Math.min(1.0, 14.0 * dt);
            u.torso.rotation.x += (0 - u.torso.rotation.x) * lerpSpeed;
            u.torso.rotation.y += (0 - u.torso.rotation.y) * lerpSpeed;
            u.torso.rotation.z += (0 - u.torso.rotation.z) * lerpSpeed;

            if (u.hips) {
              u.hips.rotation.y += (0 - u.hips.rotation.y) * lerpSpeed;
              u.hips.position.y += (baseHipsY - u.hips.position.y) * lerpSpeed;
            }

            u.leftLeg.rotation.x += (0 - u.leftLeg.rotation.x) * lerpSpeed;
            u.rightLeg.rotation.x += (0 - u.rightLeg.rotation.x) * lerpSpeed;

            if (u.leftLowerLeg) u.leftLowerLeg.rotation.x += (0 - u.leftLowerLeg.rotation.x) * lerpSpeed;
            if (u.rightLowerLeg) u.rightLowerLeg.rotation.x += (0 - u.rightLowerLeg.rotation.x) * lerpSpeed;

            if (u.leftFoot) u.leftFoot.rotation.x += (0 - u.leftFoot.rotation.x) * lerpSpeed;
            if (u.rightFoot) u.rightFoot.rotation.x += (0 - u.rightFoot.rotation.x) * lerpSpeed;

            // Idle breathing sway on long arms
            u.leftArm.rotation.x = -0.18 + Math.sin(now * 0.003) * 0.04;
            u.leftArm.rotation.z = 0.28;
            if (u.leftForearm) u.leftForearm.rotation.x = -0.22;

            if (ent.punchCd <= 0) {
              u.rightArm.rotation.x = -0.18 - Math.sin(now * 0.003) * 0.04;
              u.rightArm.rotation.z = -0.28;
              if (u.rightForearm) u.rightForearm.rotation.x = -0.22;
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
            const punchProgress = Math.max(0, Math.min(1.0, 1.0 - (ent.punchCd / C.PUNCH_CD)));
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

        // 3D Character Power-Up Skill Aura Update
        if (u.skillAura) {
          const hasSkill = slot && slot.type !== SkillType.None;
          u.skillAura.visible = hasSkill;
          if (hasSkill) {
            u.skillAura.rotation.y += dt * 3.5;
            if (u.skillAuraOrbs) {
              for (let o = 0; o < u.skillAuraOrbs.length; o++) {
                const orb = u.skillAuraOrbs[o];
                const a = now * 0.005 + (o * Math.PI);
                orb.position.set(Math.cos(a) * 0.82, 0.35 + Math.sin(now * 0.006 + o) * 0.12, Math.sin(a) * 0.82);
              }
            }
            if (u.skillCrown) {
              u.skillCrown.rotation.y = -now * 0.004;
              u.skillCrown.position.y = 2.1 + Math.sin(now * 0.005) * 0.1;
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
        b.hitFlash -= dt * 3.5;
        const bscl = mesh.userData.baseScale || 1;
        // Arcade pinball solenoid squash & stretch!
        const radialScale = bscl * (1 + Math.max(0, b.hitFlash) * 0.45);
        const verticalScale = bscl * (1 - Math.max(0, b.hitFlash) * 0.32);
        mesh.scale.set(radialScale, verticalScale, radialScale);
      } else {
        const bscl = mesh.userData.baseScale || 1;
        mesh.scale.set(bscl, bscl, bscl);
      }
    }

    // Update reality TV live audience disaster manager & physics on entities
    const disasterVoteState = this.disasterManager.update(dt, this.entities);

    // Push game state to React (including player skill & reality TV disaster voting & 5-round tournament info)
    const pSlot = this.skillSlots[0];
    const currentRoundDef = this.tournament.getCurrentRoundDef();
    const remSeconds = Math.ceil(this.match.timer);
    const finalCountdown =
      this.appMode === "game" &&
      this.match.started &&
      !this.match.over &&
      !this.isCelebratingRound &&
      remSeconds <= 3 &&
      remSeconds >= 1
        ? remSeconds
        : 0;

    const celebrationBanner = this.isCelebratingRound
      ? {
          isActive: true,
          winner: this.celebrationWinner,
          winnerName:
            this.celebrationWinner === 0
              ? "TEAM CYAN"
              : this.celebrationWinner === 1
                ? "TEAM CORAL"
                : "DRAW",
          isGrandChampionship: this.isGrandChampionship,
        }
      : null;

    this.onStateChange({
      timer: this.match.getTimerDisplay(),
      rawTimer: this.match.timer,
      finalCountdown,
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
      currentRound: this.tournament.currentRound,
      totalRounds: this.tournament.maxRounds,
      roundWins: [...this.tournament.roundWins] as [number, number],
      roundTitle: currentRoundDef.title,
      roundSubtitle: currentRoundDef.subtitle,
      roundBadge: currentRoundDef.badge,
      roundTheme: currentRoundDef.theme,
      celebrationBanner,
      kos: [...this.match.kos] as [number, number],
      outs: [...this.match.outs] as [number, number],
      playerKo: this.match.playerKo,
      playerOut: this.match.playerOut,
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
    } catch (err) {
      console.error("[BouncebackEngine Error in loop]", err);
    }
  };

  destroy() {
    stopBGM();
    this.juice.dispose();
    this.running = false;
    cancelAnimationFrame(this.animId);
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("orientationchange", this.handleResize);
    document.removeEventListener("fullscreenchange", this.handleResize);
    document.removeEventListener("webkitfullscreenchange", this.handleResize);
    this.player.destroy();
    this.skills.destroy();
    this.disasterManager.destroy();
    this.arenaController?.dispose();
    this.renderer.dispose();
    this.scene.clear();
  }
}
