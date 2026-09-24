/**
 * BOUNCEBACK! — Giant 3D Battle Gong
 *
 * Features:
 * - Monumental Pagoda / Torii Temple Frame with crimson pillars & gold dragon brackets
 * - Massive 4.8m diameter hammered golden bronze gong disc
 * - Realistic pendulum swing physics when smashed by flying players
 * - Metallic impact flash and vibrant team-colored glowing crest
 */
import * as THREE from "three";
import * as C from "./config";
import { getArenaHeight } from "./arenaHeight";

export interface GongController {
  mesh: THREE.Group;
  pivot: THREE.Group;
  discMesh: THREE.Mesh;
  team: number;
  swingAngle: number;
  swingVel: number;
  hit: () => void;
  update: (dt: number) => void;
  dispose: () => void;
}

export function createGiantGong(
  three: typeof THREE,
  team: number,
  x: number,
  z: number
): GongController {
  const root = new three.Group();
  root.name = `GiantGong_Team${team}`;

  const groundH = getArenaHeight(x, z);
  root.position.set(x, groundH, z);
  // Face towards the arena center (Team 0 at -z faces +z, Team 1 at +z faces -z)
  root.rotation.y = team === 0 ? 0 : Math.PI;

  const teamColor = team === 0 ? C.TEAM_CYAN : C.TEAM_CORAL;
  const goldColor = 0xffc107;
  const pillarColor = 0xa31621; // Deep temple crimson lacquer
  const darkWood = 0x2b1e16;

  // Shared Materials
  const goldMat = new three.MeshStandardMaterial({
    color: goldColor,
    metalness: 0.88,
    roughness: 0.2,
    emissive: 0x664400,
    emissiveIntensity: 0.25,
  });

  const pillarMat = new three.MeshStandardMaterial({
    color: pillarColor,
    roughness: 0.35,
    metalness: 0.15,
  });

  const darkWoodMat = new three.MeshStandardMaterial({
    color: darkWood,
    roughness: 0.6,
    metalness: 0.05,
  });

  const teamGlowMat = new three.MeshStandardMaterial({
    color: teamColor,
    roughness: 0.2,
    metalness: 0.4,
    emissive: teamColor,
    emissiveIntensity: 0.75,
  });

  // 1. Two Massive Red Temple Pillars
  const pillarGeo = new three.CylinderGeometry(0.38, 0.46, 7.6, 20);
  const pillarBaseGeo = new three.CylinderGeometry(0.65, 0.75, 0.6, 20);
  const pillarCapGeo = new three.BoxGeometry(1.1, 0.45, 1.1);

  const pillarDistance = 3.2; // Left: -3.2, Right: +3.2 (6.4m total span)
  for (const px of [-pillarDistance, pillarDistance]) {
    // Base stone/gold footing
    const baseMesh = new three.Mesh(pillarBaseGeo, goldMat);
    baseMesh.position.set(px, 0.3, 0);
    root.add(baseMesh);

    // Main pillar column
    const colMesh = new three.Mesh(pillarGeo, pillarMat);
    colMesh.position.set(px, 3.8, 0);
    root.add(colMesh);

    // Decorative golden mid-rings
    const ringGeo = new three.TorusGeometry(0.44, 0.07, 8, 20);
    ringGeo.rotateX(Math.PI / 2);
    const midRing1 = new three.Mesh(ringGeo, goldMat);
    midRing1.position.set(px, 2.2, 0);
    root.add(midRing1);
    const midRing2 = new three.Mesh(ringGeo, goldMat);
    midRing2.position.set(px, 5.4, 0);
    root.add(midRing2);

    // Capital bracket
    const capMesh = new three.Mesh(pillarCapGeo, goldMat);
    capMesh.position.set(px, 7.4, 0);
    root.add(capMesh);

    // Hanging Neon Lantern / Banner on each pillar
    const lanternGeo = new three.CylinderGeometry(0.24, 0.28, 0.85, 12);
    const lantern = new three.Mesh(lanternGeo, teamGlowMat);
    lantern.position.set(px + (px > 0 ? -0.75 : 0.75), 5.8, 0.5);
    root.add(lantern);
  }

  // 2. Grand Pagoda Crossbeam & Roof Structure
  const beamGeo = new three.BoxGeometry(8.2, 0.6, 0.85);
  const beamMesh = new three.Mesh(beamGeo, darkWoodMat);
  beamMesh.position.set(0, 7.3, 0);
  root.add(beamMesh);

  // Secondary Top Ridge Beam with curved pagoda ends
  const topBeamGeo = new three.BoxGeometry(9.2, 0.45, 1.1);
  const topBeam = new three.Mesh(topBeamGeo, pillarMat);
  topBeam.position.set(0, 7.8, 0);
  root.add(topBeam);

  // Pagoda roof tiles / golden eaves
  const eaveGeo = new three.BoxGeometry(9.6, 0.18, 1.4);
  const eaveMesh = new three.Mesh(eaveGeo, goldMat);
  eaveMesh.position.set(0, 8.05, 0);
  root.add(eaveMesh);

  // Central Golden Plaque / Crest ("GONG")
  const plaqueGeo = new three.BoxGeometry(2.4, 0.9, 0.3);
  const plaque = new three.Mesh(plaqueGeo, goldMat);
  plaque.position.set(0, 7.3, 0.45);
  root.add(plaque);

  const emblemDiscGeo = new three.CylinderGeometry(0.42, 0.42, 0.1, 24);
  emblemDiscGeo.rotateX(Math.PI / 2);
  const emblemDisc = new three.Mesh(emblemDiscGeo, teamGlowMat);
  emblemDisc.position.set(0, 7.3, 0.62);
  root.add(emblemDisc);

  // 3. Pendulum Pivot Group (Swings from top beam at y = 6.8)
  const pivot = new three.Group();
  pivot.name = `GongPivot_Team${team}`;
  pivot.position.set(0, 6.8, 0);
  root.add(pivot);

  // Hanging Golden Chains (connected from pivot down to the gong)
  const chainDistance = 1.6;
  const chainMat = goldMat;
  const linkGeo = new three.TorusGeometry(0.12, 0.04, 6, 12);
  for (const cx of [-chainDistance, chainDistance]) {
    const chainGroup = new three.Group();
    chainGroup.position.set(cx, 0, 0);
    const linkCount = 8;
    for (let l = 0; l < linkCount; l++) {
      const link = new three.Mesh(linkGeo, chainMat);
      link.position.set(0, -l * 0.38 - 0.2, 0);
      if (l % 2 === 1) link.rotation.y = Math.PI / 2;
      chainGroup.add(link);
    }
    pivot.add(chainGroup);
  }

  // 4. The Giant Golden Gong Disc (Suspended at local y = -3.8, world y = 3.0)
  const gongGroup = new three.Group();
  gongGroup.position.set(0, -3.8, 0);
  pivot.add(gongGroup);

  // Main Golden Gong Body (Diameter: 4.8m, Radius: 2.4m)
  const gongRadius = 2.4;
  const discGeo = new three.CylinderGeometry(gongRadius, gongRadius, 0.28, 48);
  discGeo.rotateX(Math.PI / 2);
  const discMat = new three.MeshStandardMaterial({
    color: 0xffb703,
    metalness: 0.92,
    roughness: 0.18,
    emissive: 0x4a2c00,
    emissiveIntensity: 0.2,
  });
  const discMesh = new three.Mesh(discGeo, discMat);
  gongGroup.add(discMesh);

  // Heavy Rim Flange (Dark Bronze Border)
  const rimGeo = new three.TorusGeometry(gongRadius, 0.2, 12, 48);
  const rimMat = new three.MeshStandardMaterial({
    color: 0x78350f,
    metalness: 0.85,
    roughness: 0.3,
  });
  const rimMesh = new three.Mesh(rimGeo, rimMat);
  gongGroup.add(rimMesh);

  // Concentric Embossed Rings
  const ring1Geo = new three.TorusGeometry(1.2, 0.08, 8, 36);
  const ring1Mesh = new three.Mesh(ring1Geo, goldMat);
  ring1Mesh.position.z = 0.14;
  gongGroup.add(ring1Mesh);

  const ring2Geo = new three.TorusGeometry(1.8, 0.08, 8, 36);
  const ring2Mesh = new three.Mesh(ring2Geo, goldMat);
  ring2Mesh.position.z = 0.14;
  gongGroup.add(ring2Mesh);

  // Central Raised Striking Boss (The striking dome)
  const bossGeo = new three.SphereGeometry(0.85, 32, 24);
  bossGeo.scale(1, 1, 0.45);
  const bossMat = new three.MeshStandardMaterial({
    color: goldColor,
    metalness: 0.95,
    roughness: 0.15,
    emissive: 0x996500,
    emissiveIntensity: 0.35,
  });
  const bossMesh = new three.Mesh(bossGeo, bossMat);
  bossMesh.position.set(0, 0, 0.18);
  gongGroup.add(bossMesh);

  // Team Glowing Crest on the Boss
  const crestGeo = new three.CylinderGeometry(0.48, 0.48, 0.08, 24);
  crestGeo.rotateX(Math.PI / 2);
  const crestMesh = new three.Mesh(crestGeo, teamGlowMat);
  crestMesh.position.set(0, 0, 0.42);
  gongGroup.add(crestMesh);

  // Ring of Dragon Studs / Rivets
  const studGeo = new three.SphereGeometry(0.09, 8, 8);
  const studCount = 16;
  for (let s = 0; s < studCount; s++) {
    const angle = (s / studCount) * Math.PI * 2;
    const sm = new three.Mesh(studGeo, goldMat);
    sm.position.set(
      Math.cos(angle) * (gongRadius - 0.35),
      Math.sin(angle) * (gongRadius - 0.35),
      0.15
    );
    gongGroup.add(sm);
  }

  // Controller state
  let hitFlashTimer = 0;

  const controller: GongController = {
    mesh: root,
    pivot,
    discMesh,
    team,
    swingAngle: 0,
    swingVel: 0,
    hit: () => {
      // Violent cartoon kickback swing!
      controller.swingVel = -16.0;
      hitFlashTimer = 0.35;
      discMat.emissive.setHex(0xffffff);
      discMat.emissiveIntensity = 1.0;
    },
    update: (dt: number) => {
      // Hit flash recovery
      if (hitFlashTimer > 0) {
        hitFlashTimer -= dt;
        if (hitFlashTimer <= 0) {
          discMat.emissive.setHex(0x4a2c00);
          discMat.emissiveIntensity = 0.2;
        } else {
          discMat.emissiveIntensity = 0.2 + (hitFlashTimer / 0.35) * 0.8;
        }
      }

      // Realistic pendulum physics equation: d2θ/dt2 = -(g/L)*sin(θ) - damping*v
      const gravity = 22.0;
      const length = 3.6;
      const damping = 0.955;

      controller.swingVel += (-gravity / length) * Math.sin(controller.swingAngle) * dt;
      controller.swingVel *= Math.pow(damping, dt * 60);
      controller.swingAngle += controller.swingVel * dt;

      // Small secondary z-wobble shudder when swinging fast
      const shudder = Math.sin(Date.now() * 0.05) * Math.min(0.08, Math.abs(controller.swingVel) * 0.005);

      pivot.rotation.x = controller.swingAngle;
      pivot.rotation.z = shudder;
    },
    dispose: () => {
      pillarGeo.dispose();
      pillarBaseGeo.dispose();
      pillarCapGeo.dispose();
      beamGeo.dispose();
      topBeamGeo.dispose();
      eaveGeo.dispose();
      plaqueGeo.dispose();
      emblemDiscGeo.dispose();
      linkGeo.dispose();
      discGeo.dispose();
      rimGeo.dispose();
      ring1Geo.dispose();
      ring2Geo.dispose();
      bossGeo.dispose();
      crestGeo.dispose();
      studGeo.dispose();
      goldMat.dispose();
      pillarMat.dispose();
      darkWoodMat.dispose();
      teamGlowMat.dispose();
      discMat.dispose();
      rimMat.dispose();
      bossMat.dispose();
    },
  };

  return controller;
}
