/**
 * BOUNCEBACK! — Reality TV Live Audience Disaster Mayhem System
 *
 * 5 Audience-Voted Disasters:
 * 1. TORNADO: Roaring 3D vortex that sucks entities in and spins them sky-high
 * 2. METEOR: Warning blast decals followed by supersonic fiery meteor bombardments
 * 3. EARTHQUAKE: Faultline eruptions and seismic vertical upheavals
 * 4. LASER: Orbital satellite death-ray laser sweep across the turf
 * 5. BLACKHOLE: Gravitational singularity pulling all fighters in, followed by anti-grav burst
 */
import * as THREE from "three";
import { Entity } from "./physics";
import { getArenaHeight } from "./arenaHeight";
import {
  sfxVoteStart,
  sfxVoteTick,
  sfxDisasterSiren,
  sfxTornado,
  sfxMeteorIncoming,
  sfxMeteorExplode,
  sfxEarthquake,
  sfxLaserBeam,
  sfxBlackHole,
} from "./audio";

export type DisasterId = "tornado" | "meteor" | "earthquake" | "laser" | "blackhole";

export interface DisasterDef {
  id: DisasterId;
  name: string;
  subtitle: string;
  color: string;
  desc: string;
}

export const ALL_DISASTERS: Record<DisasterId, DisasterDef> = {
  tornado: {
    id: "tornado",
    name: "TWISTER TORNADO",
    subtitle: "ANGIN PUTING BELIUNG",
    color: "#38bdf8",
    desc: "Vortex putar raksasa menyedot dan melemparkan pemain ke angkasa!",
  },
  meteor: {
    id: "meteor",
    name: "METEOR STRIKE",
    subtitle: "HUJAN METEOR",
    color: "#ff5268",
    desc: "Pengeboman meteor jatuh membakar arena dan meledakkan petarung!",
  },
  earthquake: {
    id: "earthquake",
    name: "SEISMIC QUAKE",
    subtitle: "GEMPA BUMI TEKTONIK",
    color: "#ffd166",
    desc: "Patahan tanah terbelah dan melontarkan semua pemain ke udara!",
  },
  laser: {
    id: "laser",
    name: "ORBITAL LASER",
    subtitle: "SATELIT LASER PLASMA",
    color: "#8338ec",
    desc: "Sinar laser satelit menyapu arena dengan gelombang kejut mematikan!",
  },
  blackhole: {
    id: "blackhole",
    name: "GRAVITY SINGULARITY",
    subtitle: "LUBANG HITAM",
    color: "#ec4899",
    desc: "Medan gravitasi menyedot semua petarung lalu meledakkannya keluar!",
  },
};

export interface VoteCandidate {
  id: DisasterId;
  name: string;
  subtitle: string;
  color: string;
  votes: number;
  pct: number;
}

export interface DisasterVoteState {
  isActive: boolean;
  voteTimeLeft: number;
  candidates: VoteCandidate[];
  userVotedId: DisasterId | null;
  activeDisaster: DisasterId | null;
  disasterTimeLeft: number;
  announcement: string;
}

export class DisasterManager {
  private scene: THREE.Scene;
  private timeSinceLastVote = 0;
  private voteInterval = 30.0; // Every 30s reality TV vote
  private voteDuration = 6.0;  // 6s live voting
  private disasterDuration = 9.0; // 9s active mayhem

  public state: DisasterVoteState = {
    isActive: false,
    voteTimeLeft: 0,
    candidates: [],
    userVotedId: null,
    activeDisaster: null,
    disasterTimeLeft: 0,
    announcement: "",
  };

  // 3D Objects & State for Disasters
  private disasterRoot: THREE.Group;
  private tornadoMesh: THREE.Group | null = null;
  private tornadoPos = new THREE.Vector3(0, 0, 0);
  private tornadoVel = new THREE.Vector3(2.5, 0, 3.5);

  private meteors: Array<{
    mesh: THREE.Mesh;
    targetPos: THREE.Vector3;
    decal: THREE.Mesh;
    progress: number;
    exploded: boolean;
  }> = [];

  private earthquakePillars: THREE.Mesh[] = [];

  private laserBeamMesh: THREE.Group | null = null;
  private laserAngle = 0;

  private blackHoleMesh: THREE.Group | null = null;
  private blackHoleStage: "pull" | "burst" = "pull";
  private blackHoleTimer = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.disasterRoot = new THREE.Group();
    this.disasterRoot.name = "disaster_root";
    this.scene.add(this.disasterRoot);
  }

  public reset() {
    this.timeSinceLastVote = 10.0; // First vote in 20 seconds!
    this.clearAllVisuals();
    this.state = {
      isActive: false,
      voteTimeLeft: 0,
      candidates: [],
      userVotedId: null,
      activeDisaster: null,
      disasterTimeLeft: 0,
      announcement: "",
    };
  }

  public userVote(disasterId: DisasterId) {
    if (!this.state.isActive || this.state.userVotedId) return;
    this.state.userVotedId = disasterId;
    sfxVoteTick();
    const c = this.state.candidates.find((cand) => cand.id === disasterId);
    if (c) {
      c.votes += 45; // Player vote has big audience weight!
      this.recalculateVotePercentages();
    }
  }

  public update(dt: number, entities: Entity[]): DisasterVoteState {
    // 1. Voting Phase Active
    if (this.state.isActive) {
      this.state.voteTimeLeft -= dt;

      // Simulate live incoming audience votes
      if (Math.random() < 0.8) {
        const randCand = this.state.candidates[Math.floor(Math.random() * this.state.candidates.length)];
        if (randCand) {
          randCand.votes += Math.floor(Math.random() * 8) + 1;
        }
        this.recalculateVotePercentages();
      }

      if (this.state.voteTimeLeft <= 0) {
        this.resolveVote();
      }
      return this.state;
    }

    // 2. Active Disaster Striking Arena
    if (this.state.activeDisaster) {
      this.state.disasterTimeLeft -= dt;
      this.updateActiveDisaster(dt, entities);

      if (this.state.disasterTimeLeft <= 0) {
        this.endActiveDisaster();
      }
      return this.state;
    }

    // 3. Countdown to Next Vote (Every 30 seconds)
    this.timeSinceLastVote += dt;
    if (this.timeSinceLastVote >= this.voteInterval) {
      this.startVote();
    }

    return this.state;
  }

  private startVote() {
    this.timeSinceLastVote = 0;
    this.clearAllVisuals();

    // Pick 3 random distinct disasters from the 5
    const keys = Object.keys(ALL_DISASTERS) as DisasterId[];
    const shuffled = [...keys].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, 3);

    const candidates: VoteCandidate[] = chosen.map((id) => {
      const def = ALL_DISASTERS[id];
      const initialVotes = Math.floor(Math.random() * 30) + 15;
      return {
        id: def.id,
        name: def.name,
        subtitle: def.subtitle,
        color: def.color,
        votes: initialVotes,
        pct: 33,
      };
    });

    this.state = {
      isActive: true,
      voteTimeLeft: this.voteDuration,
      candidates,
      userVotedId: null,
      activeDisaster: null,
      disasterTimeLeft: 0,
      announcement: "AUDIENCE DISASTER POLL ACTIVE",
    };

    this.recalculateVotePercentages();
    sfxVoteStart();
  }

  private recalculateVotePercentages() {
    const total = this.state.candidates.reduce((sum, c) => sum + c.votes, 0) || 1;
    for (const c of this.state.candidates) {
      c.pct = Math.round((c.votes / total) * 100);
    }
  }

  private resolveVote() {
    this.state.isActive = false;
    // Determine winner (highest votes)
    let winner = this.state.candidates[0];
    for (const c of this.state.candidates) {
      if (c.votes > winner.votes) {
        winner = c;
      }
    }

    this.state.activeDisaster = winner.id;
    this.state.disasterTimeLeft = this.disasterDuration;
    this.state.announcement = `AUDIENCE SELECTED: ${winner.name}!`;

    sfxDisasterSiren();
    this.spawnDisaster(winner.id);
  }

  private endActiveDisaster() {
    this.state.activeDisaster = null;
    this.state.disasterTimeLeft = 0;
    this.state.announcement = "";
    this.clearAllVisuals();
  }

  // ─── Disaster Spawning & Physics Execution ───

  private spawnDisaster(id: DisasterId) {
    this.clearAllVisuals();

    switch (id) {
      case "tornado":
        this.spawnTornado();
        break;
      case "meteor":
        this.spawnMeteors();
        break;
      case "earthquake":
        this.spawnEarthquake();
        break;
      case "laser":
        this.spawnLaser();
        break;
      case "blackhole":
        this.spawnBlackHole();
        break;
    }
  }

  // 1. TORNADO
  private spawnTornado() {
    sfxTornado();
    this.tornadoPos.set((Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 12);
    this.tornadoVel.set((Math.random() > 0.5 ? 1 : -1) * 3.5, 0, (Math.random() > 0.5 ? 1 : -1) * 4.5);

    const group = new THREE.Group();
    // 7 stacked spinning rings expanding upwards
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.75,
    });

    for (let i = 0; i < 8; i++) {
      const radius = 0.8 + i * 0.45;
      const ringGeo = new THREE.TorusGeometry(radius, 0.08, 6, 18);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI * 0.5;
      ring.position.y = i * 1.4;
      group.add(ring);
    }

    // Swirling funnel dust cone
    const coneGeo = new THREE.ConeGeometry(4.2, 11, 16, 1, true);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xbae6fd,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 5.5;
    cone.rotation.x = Math.PI;
    group.add(cone);

    this.tornadoMesh = group;
    this.disasterRoot.add(group);
  }

  // 2. METEOR BARRAGE
  private spawnMeteors() {
    sfxMeteorIncoming();
    this.meteors = [];

    const meteorGeo = new THREE.DodecahedronGeometry(1.2, 1);
    const meteorMat = new THREE.MeshStandardMaterial({
      color: 0xff3b30,
      emissive: 0xff5268,
      emissiveIntensity: 0.8,
      roughness: 0.3,
    });

    const decalGeo = new THREE.RingGeometry(0.8, 3.2, 24);
    const decalMat = new THREE.MeshBasicMaterial({
      color: 0xff3b30,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });

    // Spawn 5 target strikes across the stadium
    for (let i = 0; i < 5; i++) {
      const tx = (Math.random() - 0.5) * 18;
      const tz = (Math.random() - 0.5) * 36;
      const ty = getArenaHeight(tx, tz) + 0.08;

      const decal = new THREE.Mesh(decalGeo, decalMat.clone());
      decal.rotation.x = -Math.PI * 0.5;
      decal.position.set(tx, ty, tz);
      this.disasterRoot.add(decal);

      const meteor = new THREE.Mesh(meteorGeo, meteorMat);
      meteor.position.set(tx + (Math.random() - 0.5) * 6, 38 + i * 4, tz + (Math.random() - 0.5) * 6);
      this.disasterRoot.add(meteor);

      this.meteors.push({
        mesh: meteor,
        targetPos: new THREE.Vector3(tx, ty, tz),
        decal,
        progress: -i * 0.8, // Staggered incoming
        exploded: false,
      });
    }
  }

  // 3. EARTHQUAKE
  private spawnEarthquake() {
    sfxEarthquake();
    this.earthquakePillars = [];

    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x78716c,
      roughness: 0.8,
      metalness: 0.1,
    });

    // Erupt 8 jagged faultline rock slabs along the turf
    for (let i = 0; i < 8; i++) {
      const w = 2.5 + Math.random() * 2;
      const d = 2.5 + Math.random() * 2;
      const h = 1.2 + Math.random() * 1.8;
      const geo = new THREE.BoxGeometry(w, h, d);
      const pillar = new THREE.Mesh(geo, pillarMat);

      const px = (Math.random() - 0.5) * 20;
      const pz = (Math.random() - 0.5) * 40;
      const py = getArenaHeight(px, pz) - h * 0.4;
      pillar.position.set(px, py, pz);
      pillar.rotation.y = (Math.random() - 0.5) * 0.8;
      pillar.rotation.z = (Math.random() - 0.5) * 0.2;

      this.earthquakePillars.push(pillar);
      this.disasterRoot.add(pillar);
    }
  }

  // 4. ORBITAL LASER
  private spawnLaser() {
    sfxLaserBeam();
    this.laserAngle = 0;

    const group = new THREE.Group();
    // Central blinding laser core
    const beamGeo = new THREE.CylinderGeometry(0.8, 1.4, 40, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.85,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 20;
    group.add(beam);

    // Glowing impact ring decal on ground
    const ringGeo = new THREE.RingGeometry(0.4, 3.5, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc084fc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI * 0.5;
    ring.position.y = 0.1;
    group.add(ring);

    this.laserBeamMesh = group;
    this.disasterRoot.add(group);
  }

  // 5. BLACK HOLE
  private spawnBlackHole() {
    sfxBlackHole();
    this.blackHoleStage = "pull";
    this.blackHoleTimer = 0;

    const group = new THREE.Group();
    // Event horizon core
    const coreGeo = new THREE.SphereGeometry(2.0, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 2.4;
    group.add(core);

    // Swirling purple accretion ring
    const ringGeo = new THREE.TorusGeometry(3.6, 0.35, 12, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xec4899,
      wireframe: true,
      transparent: true,
      opacity: 0.9,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI * 0.5;
    ring.position.y = 2.4;
    group.add(ring);

    this.blackHoleMesh = group;
    this.disasterRoot.add(group);
  }

  // ─── Continuous Physics & Animation Updates ───

  private updateActiveDisaster(dt: number, entities: Entity[]) {
    switch (this.state.activeDisaster) {
      case "tornado":
        this.updateTornado(dt, entities);
        break;
      case "meteor":
        this.updateMeteors(dt, entities);
        break;
      case "earthquake":
        this.updateEarthquake(dt, entities);
        break;
      case "laser":
        this.updateLaser(dt, entities);
        break;
      case "blackhole":
        this.updateBlackHole(dt, entities);
        break;
    }
  }

  private updateTornado(dt: number, entities: Entity[]) {
    if (!this.tornadoMesh) return;

    // Move tornado around arena
    this.tornadoPos.x += this.tornadoVel.x * dt;
    this.tornadoPos.z += this.tornadoVel.z * dt;

    // Bounce off stadium boundaries (28x54 arena)
    if (Math.abs(this.tornadoPos.x) > 11) this.tornadoVel.x *= -1;
    if (Math.abs(this.tornadoPos.z) > 22) this.tornadoVel.z *= -1;

    const groundY = getArenaHeight(this.tornadoPos.x, this.tornadoPos.z);
    this.tornadoMesh.position.set(this.tornadoPos.x, groundY, this.tornadoPos.z);
    this.tornadoMesh.rotation.y += dt * 8.0;

    // Tornado suction & launch physics on all entities within 9.0m
    const suctionRadius = 9.0;
    for (const ent of entities) {
      const dx = this.tornadoPos.x - ent.x;
      const dz = this.tornadoPos.z - ent.z;
      const dist = Math.hypot(dx, dz);

      if (dist < suctionRadius && dist > 0.3) {
        const pullStr = (1 - dist / suctionRadius) * 28.0;
        // Inward suction + tangent vortex swirl force
        const nx = dx / dist;
        const nz = dz / dist;
        const tx = -nz;
        const tz = nx;

        ent.vx += (nx * 0.4 + tx * 0.6) * pullStr * dt;
        ent.vz += (nz * 0.4 + tz * 0.6) * pullStr * dt;

        // Throw skyward if very close to center
        if (dist < 2.5) {
          ent.launched = true;
          ent.launchTimer = 0;
          ent.launchSpeed = 24.0;
          ent.bounceCount = 2;
          ent.vx = (Math.random() - 0.5) * 32.0;
          ent.vz = (Math.random() - 0.5) * 32.0;
          if (ent.mesh) ent.mesh.position.y += dt * 14.0;
        }
      }
    }
  }

  private updateMeteors(dt: number, entities: Entity[]) {
    for (const m of this.meteors) {
      if (m.exploded) continue;
      m.progress += dt * 0.9;

      if (m.progress > 0) {
        // Falling down to target
        const t = Math.min(1.0, m.progress);
        m.mesh.position.y = THREE.MathUtils.lerp(35, m.targetPos.y + 0.8, t * t);
        m.mesh.rotation.x += dt * 5;
        m.mesh.rotation.y += dt * 6;

        // Decal pulsates red
        m.decal.scale.setScalar(0.7 + Math.sin(m.progress * 15) * 0.3);

        if (t >= 1.0) {
          // Impact explosion!
          m.exploded = true;
          sfxMeteorExplode();
          this.disasterRoot.remove(m.mesh);
          this.disasterRoot.remove(m.decal);

          // Radial blast wave (radius 6.5m, launch speed 36 m/s)
          for (const ent of entities) {
            const dx = ent.x - m.targetPos.x;
            const dz = ent.z - m.targetPos.z;
            const dist = Math.hypot(dx, dz) || 1;
            if (dist < 6.5) {
              const blastPower = (1 - dist / 6.5) * 36.0;
              ent.launched = true;
              ent.launchTimer = 0;
              ent.launchSpeed = blastPower;
              ent.vx = (dx / dist) * blastPower;
              ent.vz = (dz / dist) * blastPower;
              ent.bounceCount = 2;
            }
          }
        }
      }
    }
  }

  private updateEarthquake(dt: number, entities: Entity[]) {
    // Slabs rumble and shake
    for (const p of this.earthquakePillars) {
      p.position.y += Math.sin(performance.now() * 0.02 + p.position.x) * dt * 0.8;
    }

    // Seismic heave launches entities up and removes traction
    for (const ent of entities) {
      if (Math.random() < 0.12 && !ent.launched) {
        ent.vx += (Math.random() - 0.5) * 14;
        ent.vz += (Math.random() - 0.5) * 14;
        ent.launched = true;
        ent.launchTimer = 0;
        ent.launchSpeed = 12.0;
      }
    }
  }

  private updateLaser(dt: number, entities: Entity[]) {
    if (!this.laserBeamMesh) return;
    this.laserAngle += dt * 1.8;

    // Sweep across the stadium in figure-8 infinity loop
    const lx = Math.sin(this.laserAngle) * 9.0;
    const lz = Math.sin(this.laserAngle * 2.0) * 18.0;
    const ly = getArenaHeight(lx, lz);

    this.laserBeamMesh.position.set(lx, ly, lz);

    // Cutting beam knocks entities flying
    const beamRadius = 3.2;
    for (const ent of entities) {
      const dx = ent.x - lx;
      const dz = ent.z - lz;
      const dist = Math.hypot(dx, dz) || 1;
      if (dist < beamRadius) {
        ent.launched = true;
        ent.launchTimer = 0;
        ent.launchSpeed = 32.0;
        ent.vx = (dx / dist) * 32.0;
        ent.vz = (dz / dist) * 32.0;
        ent.bounceCount = 2;
      }
    }
  }

  private updateBlackHole(dt: number, entities: Entity[]) {
    if (!this.blackHoleMesh) return;
    this.blackHoleTimer += dt;
    this.blackHoleMesh.rotation.y += dt * 4;

    const cx = 0, cz = 0; // Black hole at stadium center

    if (this.blackHoleTimer < 4.5) {
      // Stage 1: Gravitational suction pull
      for (const ent of entities) {
        const dx = cx - ent.x;
        const dz = cz - ent.z;
        const dist = Math.hypot(dx, dz) || 1;
        const pull = Math.min(26.0, 180.0 / (dist + 2.0));
        ent.vx += (dx / dist) * pull * dt;
        ent.vz += (dz / dist) * pull * dt;
      }
    } else if (this.blackHoleStage === "pull") {
      // Stage 2: Anti-gravity repulsive explosion!
      this.blackHoleStage = "burst";
      sfxBlackHole();

      for (const ent of entities) {
        const dx = ent.x - cx;
        const dz = ent.z - cz;
        const dist = Math.hypot(dx, dz) || 1;
        ent.launched = true;
        ent.launchTimer = 0;
        ent.launchSpeed = 42.0;
        ent.vx = (dx / dist) * 42.0;
        ent.vz = (dz / dist) * 42.0;
        ent.bounceCount = 3;
      }
    }
  }

  private clearAllVisuals() {
    while (this.disasterRoot.children.length > 0) {
      const obj = this.disasterRoot.children[0];
      this.disasterRoot.remove(obj);
    }
    this.tornadoMesh = null;
    this.meteors = [];
    this.earthquakePillars = [];
    this.laserBeamMesh = null;
    this.blackHoleMesh = null;
  }

  public destroy() {
    this.clearAllVisuals();
    this.scene.remove(this.disasterRoot);
  }
}
