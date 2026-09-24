/**
 * BOUNCEBACK! — Ultra-HD Grand Olympic Colosseum World
 *
 * Professional AAA Nintendo / Fall Guys Championship Stadium:
 * - Fully Enclosed 360° Monolithic Colosseum Stadium Shell wrapping all 4 sides (Zero Empty Sky Voids)
 * - 2 Tiers of Classical-Modern Stadium Arcades with Roman Arches, Gold Cornices, and Team Heraldry Banners
 * - VIP Skybox Suites with warm illuminated tinted glass bay windows & VIP spectator balconies
 * - Sweeping Cantilevered Canopy Roofs with Curved Steel Trusses & Striped Carnival Canvas Awnings
 * - 600+ Animated Fall Guys Spectators across 4 grandstands with official white faceplates & black oval eyes
 * - South Endzone 3-Tier Victory Pavilion (directly in camera view):
 *   1. 5-Tier Grandstand directly facing camera
 *   2. VIP Presidential Balcony with dancing Fall Guys
 *   3. Giant 22m x 7m Curved LED Jumbotron Matrix with live esports championship graphics
 *   4. Giant 10-Meter Fall Guy Mascot peeking over the center roof canopy, waving at the court
 *   5. Twin 28m Monumental Spire Towers with spiraling neon ribbons & fluttering tournament flags
 * - 2 Monumental 7-Meter Inflatable Mascots on Left & Right Sidelines (Golden Crown Cyan & Boxing Coral)
 * - 4 Sweeping Dynamic Esport Stadium Searchlights criss-crossing the sky
 * - Moving Sky Rollercoaster with 4-Car Train & cheering mini-beans looping through the clouds
 * - Rich Sky Theme Park: Giant Floating Donut Obstacle, Golden Star Ring, Bouncy Mushroom Island, & 16 Horizon Peaks
 * - Holographic Neon Energy Scoring Gates with animated honeycomb laser curtains
 */
import * as THREE from "three";
import * as C from "./config";
import { getArenaHeight } from "./arenaHeight";

export interface ArenaController {
  update: (dt: number, time: number) => void;
  onGoalCelebration: (team: number) => void;
  sweeperArms: {
    center: THREE.Vector3;
    angle: number;
    armLength: number;
    armRadius: number;
    rotSpeed: number;
  }[];
  floorMesh: THREE.Mesh;
  dispose: () => void;
}

function makeCanvasTex(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

export function createFallGuysArena(scene: THREE.Scene): ArenaController {
  const root = new THREE.Group();
  root.name = "UltraHDFallGuysWorld";
  scene.add(root);

  const W = C.ARENA_W; // 28
  const L = C.ARENA_L; // 54
  const hW = W / 2;    // 14
  const hL = L / 2;    // 27

  const texLoader = new THREE.TextureLoader();

  // ─── 1. CRISP PROCEDURAL SKY DOME (ULTRA-HD) ───
  const skyTex = makeCanvasTex(2048, 1024, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 1024);
    g.addColorStop(0.00, "#0284c7");
    g.addColorStop(0.35, "#38bdf8");
    g.addColorStop(0.68, "#7dd3fc");
    g.addColorStop(0.88, "#bae6fd");
    g.addColorStop(0.96, "#fef08a");
    g.addColorStop(1.00, "#fde68a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2048, 1024);

    const sunGrad = ctx.createRadialGradient(1024, 240, 10, 1024, 240, 280);
    sunGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
    sunGrad.addColorStop(0.18, "rgba(254, 240, 138, 0.95)");
    sunGrad.addColorStop(0.45, "rgba(253, 224, 71, 0.4)");
    sunGrad.addColorStop(1.0, "rgba(253, 224, 71, 0.0)");
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(1024, 240, 280, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    for (let i = 0; i < 24; i++) {
      const cx = (i / 24) * 2048 + 40;
      const cy = 760 + ((i * 37) % 80);
      const cr = 70 + ((i * 17) % 50);
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.arc(cx + cr * 0.7, cy - cr * 0.3, cr * 0.8, 0, Math.PI * 2);
      ctx.arc(cx - cr * 0.7, cy - cr * 0.2, cr * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  const skyGeo = new THREE.SphereGeometry(220, 36, 24);
  skyGeo.scale(-1, 1, 1);
  const skyMat = new THREE.MeshBasicMaterial({ map: skyTex, depthWrite: false, fog: false });
  const skyDome = new THREE.Mesh(skyGeo, skyMat);
  skyDome.position.y = 20;
  root.add(skyDome);

  // ─── 2. ROLLING 3D CUMULUS CLOUD SEA (Beneath Stadium at y = -45m) ───
  const cloudSeaMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.0,
    emissive: 0xffffff,
    emissiveIntensity: 0.25,
  });

  const cloudSea = new THREE.Group();
  cloudSea.position.y = -45;
  root.add(cloudSea);

  for (let ci = 0; ci < 32; ci++) {
    const angle = (ci / 32) * Math.PI * 2;
    const dist = 85 + (ci % 4) * 16;
    const r = 16 + (ci % 5) * 4;
    const cg = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), cloudSeaMat);
    cg.scale.set(2.2, 0.65, 2.2);
    cg.position.set(Math.cos(angle) * dist, (ci % 5) * 2.5 - 4, Math.sin(angle) * dist);
    cloudSea.add(cg);
  }

  // ─── 3. SPACIOUS 3D SCULPTED ARENA FLOOR (28m x 54m) ───
  const segX = 56;
  const segZ = 108;
  const floorGeo = new THREE.PlaneGeometry(W, L, segX, segZ);
  floorGeo.rotateX(-Math.PI / 2);

  const posAttr = floorGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vz = posAttr.getZ(i);
    const vy = getArenaHeight(vx, vz);
    posAttr.setY(i, vy);
  }
  floorGeo.computeVertexNormals();

  const floorTex = makeCanvasTex(2048, 4096, (ctx) => {
    // 1. Cyan Endzone Field (Top, -Z)
    const cyanGrad = ctx.createLinearGradient(0, 0, 0, 1200);
    cyanGrad.addColorStop(0.0, "#0096c7");
    cyanGrad.addColorStop(0.6, "#00b4d8");
    cyanGrad.addColorStop(1.0, "#48cae4");
    ctx.fillStyle = cyanGrad;
    ctx.fillRect(0, 0, 2048, 1200);

    // 2. Ascending Gentle Ramp (Y = 1200 to 1800)
    const ramp1Grad = ctx.createLinearGradient(0, 1200, 0, 1800);
    ramp1Grad.addColorStop(0.0, "#48cae4");
    ramp1Grad.addColorStop(0.5, "#93c5fd");
    ramp1Grad.addColorStop(1.0, "#f59e0b");
    ctx.fillStyle = ramp1Grad;
    ctx.fillRect(0, 1200, 2048, 600);

    // 3. Elevated Midfield Battle Plateau (Y = 1800 to 2296)
    const midGrad = ctx.createLinearGradient(0, 1800, 0, 2296);
    midGrad.addColorStop(0.0, "#fbbf24");
    midGrad.addColorStop(0.5, "#f59e0b");
    midGrad.addColorStop(1.0, "#fbbf24");
    ctx.fillStyle = midGrad;
    ctx.fillRect(0, 1800, 2048, 496);

    // 4. Descending Gentle Ramp (Y = 2296 to 2896)
    const ramp2Grad = ctx.createLinearGradient(0, 2296, 0, 2896);
    ramp2Grad.addColorStop(0.0, "#f59e0b");
    ramp2Grad.addColorStop(0.5, "#fb7185");
    ramp2Grad.addColorStop(1.0, "#f43f5e");
    ctx.fillStyle = ramp2Grad;
    ctx.fillRect(0, 2296, 2048, 600);

    // 5. Coral Endzone Field (Bottom, +Z)
    const coralGrad = ctx.createLinearGradient(0, 2896, 0, 4096);
    coralGrad.addColorStop(0.0, "#f43f5e");
    coralGrad.addColorStop(0.4, "#e11d48");
    coralGrad.addColorStop(1.0, "#be123c");
    ctx.fillStyle = coralGrad;
    ctx.fillRect(0, 2896, 2048, 1200);

    // Transverse track lines
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "#ffffff";
    for (let y = 0; y < 4096; y += 96) {
      ctx.fillRect(0, y, 2048, 48);
    }
    ctx.globalAlpha = 1.0;

    // Speed Chevrons on Ascending Ramp
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 26;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let cy = 1320; cy <= 1700; cy += 120) {
      for (const cx of [512, 1024, 1536]) {
        ctx.beginPath();
        ctx.moveTo(cx - 56, cy - 32);
        ctx.lineTo(cx, cy + 28);
        ctx.lineTo(cx + 56, cy - 32);
        ctx.stroke();
      }
    }

    // Speed Chevrons on Descending Ramp
    for (let cy = 2400; cy <= 2780; cy += 120) {
      for (const cx of [512, 1024, 1536]) {
        ctx.beginPath();
        ctx.moveTo(cx - 56, cy - 32);
        ctx.lineTo(cx, cy + 28);
        ctx.lineTo(cx + 56, cy - 32);
        ctx.stroke();
      }
    }

    // Center Gold Battle Ring
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 26;
    ctx.beginPath();
    ctx.arc(1024, 2048, 340, 0, Math.PI * 2);
    ctx.stroke();

    // Court Text: Rotated 180° so it reads right-side up to camera
    ctx.save();
    ctx.translate(1024, 2048);
    ctx.rotate(Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 112px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★ BATTLE ARENA ★", 0, 0);
    ctx.restore();

    // Goal zone arcs
    ctx.lineWidth = 24;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.beginPath();
    ctx.arc(1024, 120, 520, 0, Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(1024, 3976, 520, Math.PI, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 36;
    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(36, 36, 1976, 4024);
  });

  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex,
    roughness: 0.25,
    metalness: 0.05,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -4.0,
  });

  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.receiveShadow = true;
  root.add(floorMesh);

  // ─── 4. FLOATING COLOSSEUM ISLAND FOUNDATION & CORE ─────
  const foundationMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.45, metalness: 0.2 });
  const coliseumStoneMat = new THREE.MeshStandardMaterial({ color: 0x27244d, roughness: 0.55, metalness: 0.15 });
  const goldDecoMat = new THREE.MeshStandardMaterial({ color: C.GOLD, roughness: 0.15, metalness: 0.85 });
  const skyboxGlassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.1,
    metalness: 0.9,
    emissive: 0x0284c7,
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.85,
  });

  // Base foundation slab safely 30cm below floor to prevent Z-fighting
  const baseSlab = new THREE.Mesh(new THREE.BoxGeometry(W + 18, 2.0, L + 24), foundationMat);
  baseSlab.position.y = -1.3;
  baseSlab.receiveShadow = true;
  root.add(baseSlab);

  const keelStep1 = new THREE.Mesh(new THREE.BoxGeometry(W + 12, 2.5, L + 16), coliseumStoneMat);
  keelStep1.position.y = -3.25;
  keelStep1.receiveShadow = true;
  root.add(keelStep1);

  const keelStep2 = new THREE.Mesh(new THREE.BoxGeometry(W + 4, 3.0, L + 6), coliseumStoneMat);
  keelStep2.position.y = -6.0;
  keelStep2.receiveShadow = true;
  root.add(keelStep2);

  const keelStep3 = new THREE.Mesh(new THREE.BoxGeometry(W - 6, 3.5, L - 10), coliseumStoneMat);
  keelStep3.position.y = -9.25;
  keelStep3.receiveShadow = true;
  root.add(keelStep3);

  // Central Anti-Gravity Floating Thruster Core
  const thrusterRing = new THREE.Mesh(
    new THREE.TorusGeometry(6.0, 0.5, 12, 32),
    new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    })
  );
  thrusterRing.rotation.x = Math.PI / 2;
  thrusterRing.position.y = -11.5;
  root.add(thrusterRing);

  // Raised Center Gold Ring Rim (r = 4.4m)
  const daisRingGeo = new THREE.TorusGeometry(4.4, 0.08, 12, 48);
  daisRingGeo.rotateX(Math.PI / 2);
  const daisRing = new THREE.Mesh(daisRingGeo, goldDecoMat);
  daisRing.position.set(0, 1.24, 0);
  root.add(daisRing);

  // ─── 5. SEAMLESS INFLATABLE PERIMETER BARRIER WALLS ─────
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.20,
    metalness: 0.05,
  });

  const wallR = 0.45;
  const numSamplePts = 48;

  for (const side of [-1, 1]) {
    const wx = side * (hW + 0.35);
    const pts: THREE.Vector3[] = [];
    const neonPts: THREE.Vector3[] = [];

    for (let i = 0; i <= numSamplePts; i++) {
      const z = -hL + (i / numSamplePts) * L;
      const y = getArenaHeight(0, z) + wallR + 0.05;
      pts.push(new THREE.Vector3(wx, y, z));
      neonPts.push(new THREE.Vector3(wx, y + wallR + 0.02, z));
    }

    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeGeo = new THREE.TubeGeometry(curve, 64, wallR, 16, false);
    const tubeMesh = new THREE.Mesh(tubeGeo, wallMat);
    tubeMesh.castShadow = true;
    tubeMesh.receiveShadow = true;
    root.add(tubeMesh);

    const neonCurve = new THREE.CatmullRomCurve3(neonPts);
    const neonGeo = new THREE.TubeGeometry(neonCurve, 64, 0.08, 10, false);
    const neonMat = new THREE.MeshStandardMaterial({
      color: side < 0 ? C.TEAM_CYAN : C.TEAM_CORAL,
      emissive: side < 0 ? C.TEAM_CYAN : C.TEAM_CORAL,
      emissiveIntensity: 0.6,
    });
    const neonMesh = new THREE.Mesh(neonGeo, neonMat);
    root.add(neonMesh);
  }

  // End Barriers (North Cyan & South Coral)
  const addEndBarrier = (pz: number, color: number) => {
    const geo = new THREE.CapsuleGeometry(wallR, W + 0.7, 14, 24);
    geo.rotateZ(Math.PI / 2);
    const m = new THREE.Mesh(geo, wallMat);
    m.position.set(0, wallR + 0.05, pz);
    m.castShadow = true;
    root.add(m);

    const sGeo = new THREE.CylinderGeometry(0.09, 0.09, W + 0.7, 12);
    sGeo.rotateZ(Math.PI / 2);
    const sMesh = new THREE.Mesh(
      sGeo,
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 })
    );
    sMesh.position.set(0, wallR * 2 + 0.07, pz);
    root.add(sMesh);
  };
  addEndBarrier(-hL - 0.35, C.TEAM_CYAN);
  addEndBarrier(hL + 0.35, C.TEAM_CORAL);

  // ─── 6. DYNAMIC 360° SCROLLING LED RIBBON VIDEO BOARDS ───
  const ribbonTex = makeCanvasTex(2048, 128, (ctx) => {
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, 2048, 128);

    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(0, 0, 2048, 8);
    ctx.fillStyle = "#06b6d4";
    ctx.fillRect(0, 120, 2048, 8);

    ctx.font = "900 52px Outfit, sans-serif";
    ctx.textBaseline = "middle";

    const messages = [
      { text: "⚡ BOUNCEBACK CHAMPIONSHIP ⚡", color: "#fef08a" },
      { text: "★ SMASH & SCORE ★", color: "#38bdf8" },
      { text: ">>> SPEED RUSH >>>", color: "#f43f5e" },
      { text: "👑 OVERDRIVE READY 👑", color: "#a855f7" },
    ];

    let curX = 40;
    for (let rep = 0; rep < 2; rep++) {
      for (const m of messages) {
        ctx.fillStyle = m.color;
        ctx.fillText(m.text, curX, 64);
        curX += ctx.measureText(m.text).width + 120;
      }
    }
  });
  ribbonTex.wrapS = THREE.RepeatWrapping;
  ribbonTex.wrapT = THREE.ClampToEdgeWrapping;
  ribbonTex.repeat.set(3, 1);

  const ribbonMat = new THREE.MeshBasicMaterial({ map: ribbonTex });
  for (const side of [-1, 1]) {
    const ribbonMesh = new THREE.Mesh(new THREE.PlaneGeometry(L + 4, 0.9), ribbonMat);
    ribbonMesh.position.set(side * (hW + 1.15), 1.9, 0);
    ribbonMesh.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    root.add(ribbonMesh);
  }

  // ─── 7. GRAND ENCLOSING COLOSSEUM WALLS & VIP SKYBOXES (ELIMINATES ALL VOIDS) ─
  const coliseumShellGroup = new THREE.Group();
  root.add(coliseumShellGroup);

  const wallW = W + 20; // 48m
  const wallL = L + 22; // 76m

  // 7.1 Massive Outer Colosseum Walls (Height 17m, wrapping behind all bleachers)
  const outerWallMat = new THREE.MeshStandardMaterial({
    color: 0x1e1838,
    roughness: 0.6,
    metalness: 0.2,
  });
  const arcadePillarMat = new THREE.MeshStandardMaterial({
    color: 0x2e2759,
    roughness: 0.45,
    metalness: 0.3,
  });

  // West & East Colosseum Facade Walls
  for (const side of [-1, 1]) {
    const fx = side * (hW + 10.5); // ±24.5m
    const facadeMesh = new THREE.Mesh(new THREE.BoxGeometry(2.0, 16.5, wallL), outerWallMat);
    facadeMesh.position.set(fx, 8.25, 0);
    facadeMesh.receiveShadow = true;
    coliseumShellGroup.add(facadeMesh);

    // Gold Top Cornice Parapet
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.8, wallL + 1), goldDecoMat);
    cornice.position.set(fx, 16.5, 0);
    coliseumShellGroup.add(cornice);

    // Classical Arched Windows & Roman Pillars along facade
    for (let pz = -30; pz <= 30; pz += 10) {
      const colPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.0, 16, 12), arcadePillarMat);
      colPillar.position.set(fx - side * 0.7, 8.0, pz);
      coliseumShellGroup.add(colPillar);

      // VIP Skybox Bay Windows overlooking field (Upper tier)
      const skyboxWindow = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.2, 7.5), skyboxGlassMat);
      skyboxWindow.position.set(fx - side * 0.9, 10.5, pz);
      coliseumShellGroup.add(skyboxWindow);
    }

    // Overhead Curved Cantilevered Steel Trusses & Striped Festival Canopy
    for (let tz = -24; tz <= 24; tz += 12) {
      const trussArch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 11, 8),
        new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 })
      );
      trussArch.position.set(fx - side * 4.5, 17.5, tz);
      trussArch.rotation.z = side > 0 ? 0.45 : -0.45;
      coliseumShellGroup.add(trussArch);

      // Suspended Floodlight Array on Truss
      const gantryLamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xfffae0 })
      );
      gantryLamp.position.set(fx - side * 8.5, 15.5, tz);
      coliseumShellGroup.add(gantryLamp);
    }
  }

  // ─── 7.3 FULL 360° OLYMPIC STADIUM CANOPY DOME ROOF & SUSPENDED JUMBOTRON ─
  const stadiumRoofGroup = new THREE.Group();
  stadiumRoofGroup.name = "StadiumDomeRoof";

  // Modern architectural tensile roof panel texture (Sleek off-white composite with cyan/gold seams)
  const stadiumCanopyTex = makeCanvasTex(1024, 512, (ctx) => {
    // Base pristine architectural white-grey
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(0, 0, 1024, 512);

    // Subtle ribbed standing-seam panels
    for (let x = 0; x < 1024; x += 32) {
      ctx.fillStyle = (x / 32) % 2 === 0 ? "rgba(226, 232, 240, 0.7)" : "rgba(255, 255, 255, 0.9)";
      ctx.fillRect(x, 0, 32, 512);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }

    // Elegant tournament trim stripes along the inner fascia
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(0, 0, 1024, 28);
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(0, 28, 1024, 10);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 480, 1024, 32);
  });
  stadiumCanopyTex.wrapS = THREE.RepeatWrapping;
  stadiumCanopyTex.wrapT = THREE.RepeatWrapping;
  stadiumCanopyTex.repeat.set(4, 2);

  const canopyRoofMat = new THREE.MeshStandardMaterial({
    map: stadiumCanopyTex,
    roughness: 0.3,
    metalness: 0.15,
    side: THREE.DoubleSide,
  });

  const steelTrussMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.85,
    roughness: 0.2,
  });

  const goldTrussMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.9,
    roughness: 0.25,
  });

  const darkFasciaMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.8,
    roughness: 0.3,
  });

  // 1. Sideline Cantilevered Bleacher Canopies (West & East)
  // These sit atop the outer walls (y = 16.8m) and cantilever inward to y = 18.8m over the stands
  for (const side of [-1, 1]) {
    const sideCanopy = new THREE.Mesh(
      new THREE.BoxGeometry(10.5, 0.45, wallL + 6),
      canopyRoofMat
    );
    sideCanopy.position.set(side * 20.0, 18.2, 0);
    sideCanopy.rotation.z = side * 0.16; // Tilted upward toward the field (lowest at outer wall = 17.3m, lip = 19.1m)
    sideCanopy.castShadow = true;
    sideCanopy.receiveShadow = true;
    stadiumRoofGroup.add(sideCanopy);

    // Front edge fascia trim (glowing edge bar)
    const edgeTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.65, wallL + 6),
      darkFasciaMat
    );
    edgeTrim.position.set(side * 14.8, 19.1, 0);
    stadiumRoofGroup.add(edgeTrim);

    // Accent LED strip under the canopy edge
    const ledStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.12, wallL + 6),
      new THREE.MeshBasicMaterial({ color: side < 0 ? 0x38bdf8 : 0xf43f5e })
    );
    ledStrip.position.set(side * 14.85, 18.8, 0);
    stadiumRoofGroup.add(ledStrip);
  }

  // 2. Endzone Cantilevered Bleacher Canopies (North & South)
  // Behind Cyan and Coral goals, sheltering endzone bleachers at y = 17.3m to 19.1m
  for (const end of [-1, 1]) {
    const endCanopy = new THREE.Mesh(
      new THREE.BoxGeometry(34.0, 0.45, 10.5),
      canopyRoofMat
    );
    endCanopy.position.set(0, 18.2, end * 32.8);
    endCanopy.rotation.x = -end * 0.16; // Tilted upward toward field
    endCanopy.castShadow = true;
    endCanopy.receiveShadow = true;
    stadiumRoofGroup.add(endCanopy);

    // Front edge fascia trim
    const endEdgeTrim = new THREE.Mesh(
      new THREE.BoxGeometry(34.0, 0.65, 0.3),
      darkFasciaMat
    );
    endEdgeTrim.position.set(0, 19.1, end * 27.6);
    stadiumRoofGroup.add(endEdgeTrim);

    // Accent LED strip
    const endLed = new THREE.Mesh(
      new THREE.BoxGeometry(34.0, 0.12, 0.12),
      new THREE.MeshBasicMaterial({ color: end < 0 ? 0x38bdf8 : 0xfbbf24 })
    );
    endLed.position.set(0, 18.8, end * 27.65);
    stadiumRoofGroup.add(endLed);
  }

  // 3. High Overhead Olympic Arch Trusses (Spanning West to East at y = 17.5m to 27.5m)
  const archZPositions = [-26, -13, 0, 13, 26];
  for (const az of archZPositions) {
    const archPoints = [
      new THREE.Vector3(-24.5, 17.2, az),
      new THREE.Vector3(-15.0, 24.5, az),
      new THREE.Vector3(0, 27.8, az),
      new THREE.Vector3(15.0, 24.5, az),
      new THREE.Vector3(24.5, 17.2, az),
    ];
    const archCurve = new THREE.CatmullRomCurve3(archPoints);
    const archGeo = new THREE.TubeGeometry(archCurve, 36, 0.32, 8, false);
    const archMesh = new THREE.Mesh(archGeo, steelTrussMat);
    stadiumRoofGroup.add(archMesh);

    // Secondary lower tension chord forming a true 3D space-truss
    const chordPoints = [
      new THREE.Vector3(-24.0, 17.8, az),
      new THREE.Vector3(-14.0, 23.3, az),
      new THREE.Vector3(0, 26.2, az),
      new THREE.Vector3(14.0, 23.3, az),
      new THREE.Vector3(24.0, 17.8, az),
    ];
    const chordCurve = new THREE.CatmullRomCurve3(chordPoints);
    const chordGeo = new THREE.TubeGeometry(chordCurve, 36, 0.18, 6, false);
    const chordMesh = new THREE.Mesh(chordGeo, goldTrussMat);
    stadiumRoofGroup.add(chordMesh);

    // Downward Floodlight Pods mounted on each arch
    for (const fx of [-14.0, 14.0]) {
      const floodlightHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.45, 0.6, 12),
        goldTrussMat
      );
      floodlightHousing.position.set(fx, 23.5, az);
      floodlightHousing.rotation.x = Math.PI / 2;
      stadiumRoofGroup.add(floodlightHousing);

      const floodlightGlow = new THREE.Mesh(
        new THREE.CircleGeometry(0.38, 12),
        new THREE.MeshBasicMaterial({ color: 0xfffbeb, side: THREE.DoubleSide })
      );
      floodlightGlow.position.set(fx, 23.18, az);
      floodlightGlow.rotation.x = Math.PI / 2;
      stadiumRoofGroup.add(floodlightGlow);
    }
  }

  // Longitudinal Spine Beams connecting the arch crowns along Z (at x = -15, 0, 15)
  for (const bx of [-15.0, 0, 15.0]) {
    const by = bx === 0 ? 27.8 : 24.5;
    const spineGeo = new THREE.CylinderGeometry(0.24, 0.24, 56.0, 8);
    spineGeo.rotateX(Math.PI / 2);
    const spineMesh = new THREE.Mesh(spineGeo, steelTrussMat);
    spineMesh.position.set(bx, by, 0);
    stadiumRoofGroup.add(spineMesh);
  }

  // 4. Central Suspended 4-Sided Holographic Stadium Cube Jumbotron (At y = 22.0m)
  const centerJumboGroup = new THREE.Group();
  centerJumboGroup.position.set(0, 22.0, 0);

  const centerJumboFrame = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 3.2, 5.2),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 })
  );
  centerJumboGroup.add(centerJumboFrame);

  // 4 Animated Screen Panels
  const jumboScreenTex = makeCanvasTex(512, 256, (ctx) => {
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 500, 244);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 44px 'Arial Black', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("★ BOUNCEBACK! ★", 256, 75);
    ctx.font = "700 30px 'Arial Black', sans-serif";
    ctx.fillStyle = "#fef08a";
    ctx.fillText("CHAMPIONSHIP ARENA", 256, 140);
    ctx.fillStyle = "#f43f5e";
    ctx.fillText("CYAN vs CORAL", 256, 200);
  });
  const jumboScreenMat = new THREE.MeshBasicMaterial({ map: jumboScreenTex });

  for (let face = 0; face < 4; face++) {
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.8), jumboScreenMat);
    screen.position.set(0, 0, 2.62);
    screen.rotation.y = face * (Math.PI / 2);
    screen.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), face * (Math.PI / 2));
    centerJumboGroup.add(screen);
  }

  // 4 Steel Suspension Cables hanging the Jumbotron from Central Arch (y = 27.8m down to 22.0m)
  for (const sx of [-2.2, 2.2]) {
    for (const sz of [-2.2, 2.2]) {
      const cable = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 5.8, 6),
        steelTrussMat
      );
      cable.position.set(sx, 3.0, sz);
      centerJumboGroup.add(cable);
    }
  }

  stadiumRoofGroup.add(centerJumboGroup);

  coliseumShellGroup.add(stadiumRoofGroup);

  // 7.2 North Outer Colosseum Wall (Behind Cyan Goal, z = -38m)
  const northWall = new THREE.Mesh(new THREE.BoxGeometry(wallW, 16.5, 2.0), outerWallMat);
  northWall.position.set(0, 8.25, -hL - 10.5);
  northWall.receiveShadow = true;
  coliseumShellGroup.add(northWall);

  const northCornice = new THREE.Mesh(new THREE.BoxGeometry(wallW + 1, 0.8, 2.6), goldDecoMat);
  northCornice.position.set(0, 16.5, -hL - 10.5);
  coliseumShellGroup.add(northCornice);

  // 4 Grand Colosseum Corner Towers (Diameter 6m, Height 22m)
  for (const cx of [-hW - 10.5, hW + 10.5]) {
    for (const cz of [-hL - 10.5, hL + 11.5]) {
      const cTower = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.4, 22, 16), coliseumStoneMat);
      cTower.position.set(cx, 11, cz);
      coliseumShellGroup.add(cTower);

      const cRoof = new THREE.Mesh(
        new THREE.ConeGeometry(3.6, 7.5, 16),
        new THREE.MeshStandardMaterial({ color: cz > 0 ? 0xe11d48 : 0x0284c7, roughness: 0.3 })
      );
      cRoof.position.set(cx, 25.5, cz);
      coliseumShellGroup.add(cRoof);
    }
  }

  // ─── 8. 360° GRANDSTAND TIERS & 600 FALL GUYS SPECTATORS ─
  const tierColors = [0x06b6d4, 0xfbbf24, 0xf43f5e, 0x8b5cf6, 0x10b981];
  const riserMat = new THREE.MeshStandardMaterial({ color: 0x181438, roughness: 0.5, metalness: 0.1 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.8 });

  // 8.1 Left & Right Sideline Bleachers (5 tiers each)
  for (const side of [-1, 1]) {
    for (let tier = 0; tier < 5; tier++) {
      const tierSeatMat = new THREE.MeshStandardMaterial({
        color: tierColors[tier % tierColors.length],
        roughness: 0.35,
      });
      const tierX = side * (hW + 2.2 + tier * 1.5);
      const tierY = 1.7 + tier * 0.75;

      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, L + 6), tierSeatMat);
      bench.position.set(tierX, tierY, 0);
      bench.receiveShadow = true;
      root.add(bench);

      const riserH = tierY - 0.15;
      const riser = new THREE.Mesh(new THREE.BoxGeometry(1.36, riserH, L + 6), riserMat);
      riser.position.set(tierX, riserH / 2, 0);
      riser.receiveShadow = true;
      root.add(riser);

      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, L + 6), railMat);
      rail.position.set(tierX - side * 0.65, tierY + 0.4, 0);
      root.add(rail);
    }
  }

  // 8.2 South Endzone Grandstand (Directly in main camera view! Behind Coral Goal)
  for (let tier = 0; tier < 5; tier++) {
    const tierSeatMat = new THREE.MeshStandardMaterial({
      color: tierColors[(tier + 2) % tierColors.length],
      roughness: 0.35,
    });
    const tierZ = hL + 2.6 + tier * 1.5;
    const tierY = 1.8 + tier * 0.75;
    const benchW = W + 8;

    const bench = new THREE.Mesh(new THREE.BoxGeometry(benchW, 0.3, 1.4), tierSeatMat);
    bench.position.set(0, tierY, tierZ);
    bench.receiveShadow = true;
    root.add(bench);

    const riserH = tierY - 0.15;
    const riser = new THREE.Mesh(new THREE.BoxGeometry(benchW, riserH, 1.36), riserMat);
    riser.position.set(0, riserH / 2, tierZ);
    riser.receiveShadow = true;
    root.add(riser);

    const rail = new THREE.Mesh(new THREE.BoxGeometry(benchW, 0.5, 0.08), railMat);
    rail.position.set(0, tierY + 0.4, tierZ - 0.65);
    root.add(rail);
  }

  // 8.3 North Endzone Grandstand (Behind Cyan Goal)
  for (let tier = 0; tier < 4; tier++) {
    const tierSeatMat = new THREE.MeshStandardMaterial({
      color: tierColors[(tier + 1) % tierColors.length],
      roughness: 0.35,
    });
    const tierZ = -hL - 2.6 - tier * 1.5;
    const tierY = 1.8 + tier * 0.75;
    const benchW = W + 6;

    const bench = new THREE.Mesh(new THREE.BoxGeometry(benchW, 0.3, 1.4), tierSeatMat);
    bench.position.set(0, tierY, tierZ);
    bench.receiveShadow = true;
    root.add(bench);

    const riserH = tierY - 0.15;
    const riser = new THREE.Mesh(new THREE.BoxGeometry(benchW, riserH, 1.36), riserMat);
    riser.position.set(0, riserH / 2, tierZ);
    riser.receiveShadow = true;
    root.add(riser);
  }

  // Fall Guys Faceplate Texture (White Oval + 2 Black Pill Eyes + Glints)
  const faceplateTex = makeCanvasTex(256, 256, (ctx) => {
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(128, 128, 110, 118, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#09090b";
    ctx.beginPath();
    ctx.ellipse(92, 124, 15, 34, 0, 0, Math.PI * 2);
    ctx.ellipse(164, 124, 15, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(88, 108, 6.5, 0, Math.PI * 2);
    ctx.arc(160, 108, 6.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // 600 Instanced Fall Guys Spectator Beans + Waving Arms + Party Hats (360° Colosseum)
  const totalSpecCount = 600;
  const specGeo = new THREE.CapsuleGeometry(0.24, 0.42, 8, 10);
  const specMat = new THREE.MeshStandardMaterial({ roughness: 0.25, metalness: 0.05 });
  const specMesh = new THREE.InstancedMesh(specGeo, specMat, totalSpecCount);
  specMesh.castShadow = true;

  const faceGeo = new THREE.PlaneGeometry(0.23, 0.23);
  const faceMat = new THREE.MeshBasicMaterial({ map: faceplateTex, transparent: true });
  const faceMesh = new THREE.InstancedMesh(faceGeo, faceMat, totalSpecCount);

  // Instanced Cheering Left & Right Arms
  const armGeo = new THREE.CapsuleGeometry(0.065, 0.22, 6, 8);
  const armMeshL = new THREE.InstancedMesh(armGeo, specMat, totalSpecCount);
  const armMeshR = new THREE.InstancedMesh(armGeo, specMat, totalSpecCount);

  // Instanced Party Hats on every 3rd spectator
  const hatCount = Math.floor(totalSpecCount / 3);
  const hatGeo = new THREE.ConeGeometry(0.12, 0.32, 8);
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.2, metalness: 0.8 });
  const hatMesh = new THREE.InstancedMesh(hatGeo, hatMat, hatCount);

  const specColors = [
    0x27e5ff, 0xff5268, 0xffd166, 0x8338ec, 0x06d6a0, 0xf472b6, 0xfb923c, 0xa855f7, 0x38bdf8, 0xe11d48,
  ];

  interface SpecData {
    base: THREE.Vector3;
    rotY: number;
    faceOffset: THREE.Vector3;
    phase: number;
    speed: number;
  }
  const specData: SpecData[] = [];
  const dummy = new THREE.Object3D();
  const faceDummy = new THREE.Object3D();
  const armLDummy = new THREE.Object3D();
  const armRDummy = new THREE.Object3D();
  const hatDummy = new THREE.Object3D();
  let si = 0;

  const addSpecBean = (x: number, y: number, z: number, facingRotY: number, faceOffX: number, faceOffZ: number) => {
    if (si >= totalSpecCount) return;
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, facingRotY, 0);
    dummy.updateMatrix();
    specMesh.setMatrixAt(si, dummy.matrix);
    const col = new THREE.Color(specColors[si % specColors.length]);
    specMesh.setColorAt(si, col);

    faceDummy.position.set(x + faceOffX, y + 0.12, z + faceOffZ);
    faceDummy.rotation.set(0, facingRotY, 0);
    faceDummy.updateMatrix();
    faceMesh.setMatrixAt(si, faceDummy.matrix);

    const perpX = Math.cos(facingRotY);
    const perpZ = -Math.sin(facingRotY);

    armLDummy.position.set(x - perpX * 0.26, y + 0.08, z - perpZ * 0.26);
    armLDummy.rotation.set(0, facingRotY, 0.3);
    armLDummy.updateMatrix();
    armMeshL.setMatrixAt(si, armLDummy.matrix);
    armMeshL.setColorAt(si, col);

    armRDummy.position.set(x + perpX * 0.26, y + 0.08, z + perpZ * 0.26);
    armRDummy.rotation.set(0, facingRotY, -0.3);
    armRDummy.updateMatrix();
    armMeshR.setMatrixAt(si, armRDummy.matrix);
    armMeshR.setColorAt(si, col);

    if (si % 3 === 0 && Math.floor(si / 3) < hatCount) {
      const hi = Math.floor(si / 3);
      hatDummy.position.set(x, y + 0.52, z);
      hatDummy.rotation.set(0, facingRotY, 0.1);
      hatDummy.updateMatrix();
      hatMesh.setMatrixAt(hi, hatDummy.matrix);
    }

    specData.push({
      base: new THREE.Vector3(x, y, z),
      rotY: facingRotY,
      faceOffset: new THREE.Vector3(faceOffX, 0.12, faceOffZ),
      phase: Math.random() * 6.28,
      speed: 2.2 + Math.random() * 2.8,
    });
    si++;
  };

  // 1. Left & Right Sidelines (175 each)
  for (const side of [-1, 1]) {
    for (let tier = 0; tier < 5; tier++) {
      const perRow = 35;
      for (let r = 0; r < perRow; r++) {
        const z = -hL + 2.0 + (r / (perRow - 1)) * (L - 4);
        const x = side * (hW + 2.2 + tier * 1.5);
        const y = 1.7 + tier * 0.75 + 0.38;
        const rotY = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        const fOffX = side < 0 ? 0.23 : -0.23;
        addSpecBean(x, y, z, rotY, fOffX, 0);
      }
    }
  }

  // 2. South Endzone (150 spectators directly in front of camera view!)
  for (let tier = 0; tier < 5; tier++) {
    const perRow = 30;
    const tierZ = hL + 2.6 + tier * 1.5;
    const tierY = 1.8 + tier * 0.75 + 0.38;
    for (let r = 0; r < perRow; r++) {
      const x = -hW - 2.5 + (r / (perRow - 1)) * (W + 5);
      const rotY = Math.PI;
      addSpecBean(x, tierY, tierZ, rotY, 0, -0.23);
    }
  }

  // 3. North Endzone (100 spectators behind Cyan goal)
  for (let tier = 0; tier < 4; tier++) {
    const perRow = 25;
    const tierZ = -hL - 2.6 - tier * 1.5;
    const tierY = 1.8 + tier * 0.75 + 0.38;
    for (let r = 0; r < perRow; r++) {
      const x = -hW - 1.5 + (r / (perRow - 1)) * (W + 3);
      const rotY = 0;
      addSpecBean(x, tierY, tierZ, rotY, 0, 0.23);
    }
  }

  if (specMesh.instanceColor) specMesh.instanceColor.needsUpdate = true;
  if (armMeshL.instanceColor) armMeshL.instanceColor.needsUpdate = true;
  if (armMeshR.instanceColor) armMeshR.instanceColor.needsUpdate = true;
  specMesh.instanceMatrix.needsUpdate = true;
  faceMesh.instanceMatrix.needsUpdate = true;
  armMeshL.instanceMatrix.needsUpdate = true;
  armMeshR.instanceMatrix.needsUpdate = true;
  hatMesh.instanceMatrix.needsUpdate = true;
  root.add(specMesh);
  root.add(faceMesh);
  root.add(armMeshL);
  root.add(armMeshR);
  root.add(hatMesh);

  // ─── 9. SOUTH ENDZONE 3-TIER VICTORY PAVILION & MEGA-STRUCTURE ─
  // Frames the entire background behind the Coral Goal with grand architecture
  const southPavilion = new THREE.Group();
  southPavilion.position.set(0, 0, hL + 11.5);
  root.add(southPavilion);

  // 9.1 Massive South Colosseum Facade Wall (Width 48m, Height 18m)
  const southBackWall = new THREE.Mesh(new THREE.BoxGeometry(wallW, 18, 2.5), outerWallMat);
  southBackWall.position.set(0, 9.0, 0);
  southBackWall.receiveShadow = true;
  southPavilion.add(southBackWall);

  const southCornice = new THREE.Mesh(new THREE.BoxGeometry(wallW + 1, 1.0, 3.2), goldDecoMat);
  southCornice.position.set(0, 18.0, 0);
  southPavilion.add(southCornice);

  // Arched Carnival Canopy Roof (Striped Yellow & Coral Awning over bleachers)
  const canopyArchGeo = new THREE.CylinderGeometry(19, 19, 14, 24, 1, true, -Math.PI * 0.5, Math.PI);
  canopyArchGeo.rotateZ(Math.PI / 2);
  const canopyTex = makeCanvasTex(512, 256, (ctx) => {
    for (let s = 0; s < 8; s++) {
      ctx.fillStyle = s % 2 === 0 ? "#f43f5e" : "#fbbf24";
      ctx.fillRect(s * 64, 0, 64, 256);
    }
  });
  canopyTex.wrapS = THREE.RepeatWrapping;
  canopyTex.repeat.set(2, 1);
  const canopyMat = new THREE.MeshStandardMaterial({
    map: canopyTex,
    side: THREE.DoubleSide,
    roughness: 0.35,
  });
  const canopyMesh = new THREE.Mesh(canopyArchGeo, canopyMat);
  canopyMesh.position.set(0, 12, -2.5);
  southPavilion.add(canopyMesh);

  // 9.2 Curved Ultra-HD Jumbotron Screen (22m x 7m)
  const southJumboTex = makeCanvasTex(1024, 384, (ctx) => {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, 1024, 384);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 14;
    ctx.strokeRect(8, 8, 1008, 368);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 68px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("⚡ BOUNCEBACK ARENA ⚡", 512, 110);

    ctx.fillStyle = "#38bdf8";
    ctx.font = "800 48px Outfit, sans-serif";
    ctx.fillText("★ CORAL CHAMPIONSHIP CUP ★", 512, 190);

    ctx.fillStyle = "#f43f5e";
    ctx.font = "900 56px Outfit, sans-serif";
    ctx.fillText("👑 WIN THE CROWN 👑", 512, 280);
  });
  const southJumbo = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 6.5),
    new THREE.MeshBasicMaterial({ map: southJumboTex, side: THREE.DoubleSide })
  );
  southJumbo.position.set(0, 11.5, -4.8);
  southJumbo.rotation.y = Math.PI;
  southPavilion.add(southJumbo);

  // 9.3 Rotating 3D Golden Championship Crown atop Pavilion Arch
  const crownGroup = new THREE.Group();
  crownGroup.position.set(0, 17.5, -3.0);
  const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.5, 0.7, 20), goldDecoMat);
  crownGroup.add(crownBase);

  for (let pt = 0; pt < 5; pt++) {
    const angle = (pt / 5) * Math.PI * 2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.6, 6), goldDecoMat);
    spike.position.set(Math.cos(angle) * 1.55, 1.0, Math.sin(angle) * 1.55);
    crownGroup.add(spike);

    const ruby = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.1, metalness: 0.9, emissive: 0xef4444, emissiveIntensity: 0.5 })
    );
    ruby.position.set(Math.cos(angle) * 1.55, 1.8, Math.sin(angle) * 1.55);
    crownGroup.add(ruby);
  }
  southPavilion.add(crownGroup);

  // 9.4 GIGANTIC 10-METER FALL GUY MASCOT PEEKING OVER ROOF!
  const giantPeeker = new THREE.Group();
  giantPeeker.position.set(0, 14.5, 1.0);
  southPavilion.add(giantPeeker);

  const peekerBodyMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.25 });
  const peekerHead = new THREE.Mesh(new THREE.SphereGeometry(3.6, 20, 16), peekerBodyMat);
  giantPeeker.add(peekerHead);

  const peekerFace = new THREE.Mesh(
    new THREE.SphereGeometry(2.1, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
  );
  peekerFace.scale.set(1.0, 1.25, 0.45);
  peekerFace.position.set(0, 0.2, -2.8);
  giantPeeker.add(peekerFace);

  const peekerEyeMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
  for (const ex of [-0.65, 0.65]) {
    const eye = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.55, 8, 10), peekerEyeMat);
    eye.position.set(ex, 0.3, -3.5);
    giantPeeker.add(eye);
  }

  const peekerCrown = new THREE.Mesh(
    new THREE.CylinderGeometry(2.4, 2.0, 1.2, 16),
    goldDecoMat
  );
  peekerCrown.position.set(0, 4.2, 0);
  giantPeeker.add(peekerCrown);

  const gloveMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  const peekerHands: THREE.Mesh[] = [];
  for (const hx of [-4.5, 4.5]) {
    const hand = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 10), gloveMat);
    hand.scale.set(1.2, 0.8, 1.0);
    hand.position.set(hx, -1.2, -3.8);
    giantPeeker.add(hand);
    peekerHands.push(hand);
  }

  // ─── 10. TWO 7-METER INFLATABLE MASCOTS (Left & Right Sidelines) ─
  const giantMascots: { group: THREE.Group; arm: THREE.Group; baseY: number }[] = [];

  const createGiantMascot = (team: "cyan" | "coral", side: number) => {
    const mg = new THREE.Group();
    const mx = side * (hW + 3.8);
    const my = 0.6;
    mg.position.set(mx, my, 0);

    const stage = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 2.9, 1.2, 24),
      foundationMat
    );
    mg.add(stage);

    const stageNeon = new THREE.Mesh(
      new THREE.TorusGeometry(2.8, 0.1, 8, 32),
      new THREE.MeshStandardMaterial({
        color: team === "cyan" ? C.TEAM_CYAN : C.TEAM_CORAL,
        emissive: team === "cyan" ? C.TEAM_CYAN : C.TEAM_CORAL,
        emissiveIntensity: 0.8,
      })
    );
    stageNeon.rotation.x = Math.PI / 2;
    stageNeon.position.y = 0.6;
    mg.add(stageNeon);

    const beanBodyMat = new THREE.MeshStandardMaterial({
      color: team === "cyan" ? 0x00b4d8 : 0xf43f5e,
      roughness: 0.25,
    });
    const beanMesh = new THREE.Mesh(new THREE.CapsuleGeometry(1.4, 2.4, 16, 20), beanBodyMat);
    beanMesh.position.y = 3.2;
    beanMesh.castShadow = true;
    mg.add(beanMesh);

    const faceplateMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
    );
    faceplateMesh.scale.set(0.9, 1.35, 0.45);
    faceplateMesh.position.set(side < 0 ? 1.05 : -1.05, 3.8, 0);
    mg.add(faceplateMesh);

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
    for (const ez of [-0.28, 0.28]) {
      const eye = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.22, 6, 8), eyeMat);
      eye.position.set(side < 0 ? 1.36 : -1.36, 3.82, ez);
      eye.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      mg.add(eye);
    }

    let wavingArm = new THREE.Group();
    if (team === "cyan") {
      const crown = new THREE.Group();
      crown.position.set(0, 5.75, 0);
      const cBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.95, 0.85, 0.45, 16),
        goldDecoMat
      );
      crown.add(cBase);
      for (let p = 0; p < 5; p++) {
        const cAngle = (p / 5) * Math.PI * 2;
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.24, 0.9, 5),
          goldDecoMat
        );
        spike.position.set(Math.cos(cAngle) * 0.85, 0.65, Math.sin(cAngle) * 0.85);
        crown.add(spike);
      }
      mg.add(crown);

      wavingArm.position.set(side < 0 ? 1.3 : -1.3, 3.8, 0.9);
      const armTube = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.8, 8), beanBodyMat);
      armTube.position.y = 0.9;
      armTube.rotation.z = side < 0 ? 0.4 : -0.4;
      wavingArm.add(armTube);

      const fingerMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });
      const palm = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.28), fingerMat);
      palm.position.set(0, 2.0, 0);
      wavingArm.add(palm);

      const pointer = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.9, 0.25), fingerMat);
      pointer.position.set(0.12, 2.8, 0);
      wavingArm.add(pointer);
      mg.add(wavingArm);
    } else {
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(1.42, 0.14, 8, 24),
        goldDecoMat
      );
      band.rotation.x = Math.PI / 2;
      band.position.y = 4.8;
      mg.add(band);

      wavingArm.position.set(side < 0 ? 1.3 : -1.3, 3.8, -0.9);
      const armTube = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.8, 8), beanBodyMat);
      armTube.position.y = 0.9;
      armTube.rotation.z = side < 0 ? -0.4 : 0.4;
      wavingArm.add(armTube);

      const glove = new THREE.Mesh(
        new THREE.SphereGeometry(0.75, 12, 10),
        new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
      );
      glove.scale.set(1.0, 1.25, 0.9);
      glove.position.set(0, 2.2, 0);
      wavingArm.add(glove);
      mg.add(wavingArm);
    }

    root.add(mg);
    giantMascots.push({ group: mg, arm: wavingArm, baseY: my });
  };

  createGiantMascot("cyan", -1);
  createGiantMascot("coral", 1);

  // ─── 11. 4 SWEEPING DYNAMIC ESPORT STADIUM SEARCHLIGHTS ──
  const searchlights: { mesh: THREE.Mesh; baseAngle: number; speed: number }[] = [];
  const searchPositions = [
    { x: -hW - 4, z: -20, col: 0x38bdf8 },
    { x: hW + 4, z: -20, col: 0xfbbf24 },
    { x: -hW - 4, z: 20, col: 0xf43f5e },
    { x: hW + 4, z: 20, col: 0x22d3ee },
  ];

  for (let s = 0; s < searchPositions.length; s++) {
    const sp = searchPositions[s];
    const beamGeo = new THREE.CylinderGeometry(0.4, 4.5, 48, 12, 1, true);
    beamGeo.translate(0, 24, 0);
    const beamMat = new THREE.MeshBasicMaterial({
      color: sp.col,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(sp.x, 8, sp.z);
    root.add(beam);
    searchlights.push({ mesh: beam, baseAngle: s * 1.57, speed: 0.8 + s * 0.2 });
  }

  // ─── 11.B 4 VOLUMETRIC PITCH FLOODLIGHTS FROM CORNER TOWERS ──
  const towerFloodlights: {
    cone: THREE.Mesh;
    pool: THREE.Mesh;
    origin: THREE.Vector3;
    baseTarget: THREE.Vector3;
    sweepRadius: number;
    sweepSpeed: number;
    phase: number;
  }[] = [];

  const towerPositions = [
    { x: -hW - 10.5, y: 21.0, z: -hL - 10.5, col: 0x38bdf8, tx: -6, tz: -10 },
    { x: hW + 10.5, y: 21.0, z: -hL - 10.5, col: 0xfbbf24, tx: 6, tz: -10 },
    { x: -hW - 10.5, y: 21.0, z: hL + 11.5, col: 0xf43f5e, tx: -6, tz: 10 },
    { x: hW + 10.5, y: 21.0, z: hL + 11.5, col: 0x22d3ee, tx: 6, tz: 10 },
  ];

  for (let tf = 0; tf < towerPositions.length; tf++) {
    const tp = towerPositions[tf];
    // Cone: apex at top (radius 0.6), base on field (radius 7.5), length 48
    const fConeGeo = new THREE.CylinderGeometry(0.6, 7.5, 48, 16, 1, true);
    fConeGeo.translate(0, 24, 0);
    fConeGeo.rotateX(-Math.PI / 2); // Point along +Z

    const fConeMat = new THREE.MeshBasicMaterial({
      color: tp.col,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const fCone = new THREE.Mesh(fConeGeo, fConeMat);
    fCone.position.set(tp.x, tp.y, tp.z);
    root.add(fCone);

    // Floor light pool decal
    const poolGeo = new THREE.CircleGeometry(5.5, 24);
    poolGeo.rotateX(-Math.PI / 2);
    const poolMat = new THREE.MeshBasicMaterial({
      color: tp.col,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const pool = new THREE.Mesh(poolGeo, poolMat);
    pool.position.set(tp.tx, 0.06, tp.tz);
    root.add(pool);

    towerFloodlights.push({
      cone: fCone,
      pool,
      origin: new THREE.Vector3(tp.x, tp.y, tp.z),
      baseTarget: new THREE.Vector3(tp.tx, 0.05, tp.tz),
      sweepRadius: 5.0,
      sweepSpeed: 0.7 + tf * 0.15,
      phase: tf * 1.57,
    });
  }

  // ─── 11.C 4 CORNER PYROTECHNIC CANNONS ───────────────────
  const cannonMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.85,
    roughness: 0.25,
  });
  const cannonGoldMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.9,
    roughness: 0.2,
  });
  const cannonGlowMat = new THREE.MeshBasicMaterial({
    color: 0xff0055,
  });

  const cannonCorners = [
    { x: -hW + 0.8, z: -hL + 1.2, rotY: 0.78 },
    { x: hW - 0.8, z: -hL + 1.2, rotY: -0.78 },
    { x: -hW + 0.8, z: hL - 1.2, rotY: 2.35 },
    { x: hW - 0.8, z: hL - 1.2, rotY: -2.35 },
  ];

  for (const cc of cannonCorners) {
    const cg = new THREE.Group();
    cg.position.set(cc.x, 0.2, cc.z);
    cg.rotation.y = cc.rotY;

    // Base podium
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.1, 0.45, 16), cannonMat);
    cg.add(base);

    // Gold swivel bracket
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.8), cannonGoldMat);
    bracket.position.y = 0.5;
    cg.add(bracket);

    // Twin angled cannon barrels (angled 48° upward)
    for (const bx of [-0.26, 0.26]) {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 1.6, 14), cannonMat);
      barrel.position.set(bx, 1.0, 0);
      barrel.rotation.x = -0.8;
      cg.add(barrel);

      // Glowing muzzle ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.04, 8, 16), cannonGlowMat);
      ring.position.set(bx, 1.5, 0.6);
      ring.rotation.x = -0.8;
      cg.add(ring);
    }

    root.add(cg);
  }

  // ─── 12. MOVING SKY ROLLERCOASTER WITH 4-CAR TRAIN ─────
  const coasterPts: THREE.Vector3[] = [
    new THREE.Vector3(-42, 14, -20),
    new THREE.Vector3(-34, 22, 10),
    new THREE.Vector3(-14, 24, 42),
    new THREE.Vector3(14, 22, 44),
    new THREE.Vector3(38, 16, 22),
    new THREE.Vector3(44, 13, -15),
    new THREE.Vector3(12, 20, -38),
    new THREE.Vector3(-22, 18, -32),
  ];
  const coasterLoop = new THREE.CatmullRomCurve3(coasterPts, true);

  const coasterRailGeo = new THREE.TubeGeometry(coasterLoop, 96, 0.22, 8, true);
  const coasterRailMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.6,
    roughness: 0.2,
    metalness: 0.8,
  });
  const coasterRailMesh = new THREE.Mesh(coasterRailGeo, coasterRailMat);
  root.add(coasterRailMesh);

  const coasterCarts: THREE.Group[] = [];
  const cartColors = [0xf43f5e, 0x06b6d4, 0xfbbf24, 0x10b981];

  for (let c = 0; c < 4; c++) {
    const cart = new THREE.Group();
    const cartBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.9, 1.2),
      new THREE.MeshStandardMaterial({ color: cartColors[c], roughness: 0.3 })
    );
    cartBox.position.y = 0.45;
    cart.add(cartBox);

    const rider = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.28, 0.4, 6, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    rider.position.set(0, 0.85, 0);
    cart.add(rider);

    root.add(cart);
    coasterCarts.push(cart);
  }

  // ─── 13. DENSE THEME PARK ARCHIPELAGO IN DISTANCE ───────
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.65 });
  const rockCliffMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
  const waterMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.88 });
  const roofRedMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.35 });
  const wallPastelMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });

  // 13.1 Floating Donut Ring (North-West, x = -36, z = -20, y = 15)
  const donutGroup = new THREE.Group();
  donutGroup.position.set(-36, 15, -20);
  donutGroup.rotation.set(0.3, 0.4, 0.2);

  const donutMesh = new THREE.Mesh(
    new THREE.TorusGeometry(5.2, 1.6, 16, 32),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.5 })
  );
  donutGroup.add(donutMesh);

  const icingMesh = new THREE.Mesh(
    new THREE.TorusGeometry(5.25, 1.62, 16, 32, Math.PI * 1.6),
    new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.2, metalness: 0.1 })
  );
  donutGroup.add(icingMesh);

  const sprinkleColors = [0x22d3ee, 0xfde047, 0xa855f7, 0xffffff, 0x4ade80];
  for (let sp = 0; sp < 24; sp++) {
    const spAngle = (sp / 24) * Math.PI * 2;
    const spMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.7, 6),
      new THREE.MeshBasicMaterial({ color: sprinkleColors[sp % sprinkleColors.length] })
    );
    spMesh.position.set(Math.cos(spAngle) * 5.2, Math.sin(spAngle) * 5.2, 1.65);
    spMesh.rotation.z = spAngle + 0.4;
    donutGroup.add(spMesh);
  }
  root.add(donutGroup);

  // 13.2 Floating Golden Star Championship Ring (East Sky, x = 36, z = 22, y = 16)
  const starRingGroup = new THREE.Group();
  starRingGroup.position.set(36, 16, 22);
  starRingGroup.rotation.set(-0.2, -0.5, 0.1);

  const starRingMesh = new THREE.Mesh(new THREE.TorusGeometry(5.0, 0.5, 12, 32), goldDecoMat);
  starRingGroup.add(starRingMesh);

  for (let s = 0; s < 5; s++) {
    const sAngle = (s / 5) * Math.PI * 2;
    const starCone = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 5), goldDecoMat);
    starCone.position.set(Math.cos(sAngle) * 5.0, Math.sin(sAngle) * 5.0, 0);
    starCone.rotation.z = sAngle - Math.PI / 2;
    starRingGroup.add(starCone);
  }
  root.add(starRingGroup);

  // 13.3 Bouncy Polka-Dot Mushroom Island (South-West Sky, x = -30, z = 36, y = 6)
  const mushIsland = new THREE.Group();
  mushIsland.position.set(-30, 6, 36);
  root.add(mushIsland);

  const mushPlateau = new THREE.Mesh(new THREE.CylinderGeometry(11, 9, 2.5, 14), grassMat);
  mushIsland.add(mushPlateau);

  const mushCone = new THREE.Mesh(new THREE.ConeGeometry(9, 10, 12), rockCliffMat);
  mushCone.rotation.x = Math.PI;
  mushCone.position.y = -5;
  mushIsland.add(mushCone);

  const mushStem = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 4.0, 12), new THREE.MeshStandardMaterial({ color: 0xffedd5 }));
  mushStem.position.y = 2.0;
  mushIsland.add(mushStem);

  const mushCap = new THREE.Mesh(
    new THREE.SphereGeometry(3.6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
  );
  mushCap.position.y = 3.6;
  mushIsland.add(mushCap);

  for (let d = 0; d < 8; d++) {
    const dAngle = (d / 8) * Math.PI * 2;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.65, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    dot.position.set(Math.cos(dAngle) * 2.5, 4.8, Math.sin(dAngle) * 2.5);
    dot.scale.set(1.0, 0.4, 1.0);
    mushIsland.add(dot);
  }

  const miniBeans: { mesh: THREE.Group; baseY: number; phase: number }[] = [];
  for (let mb = 0; mb < 2; mb++) {
    const beanG = new THREE.Group();
    const bMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 0.55, 8, 10),
      new THREE.MeshStandardMaterial({ color: mb === 0 ? 0x22d3ee : 0xfbbf24 })
    );
    bMesh.position.y = 0.45;
    beanG.add(bMesh);

    const fMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), faceMat);
    fMesh.position.set(0, 0.55, 0.36);
    beanG.add(fMesh);

    beanG.position.set(mb === 0 ? -1.0 : 1.0, 6.2, 0);
    mushIsland.add(beanG);
    miniBeans.push({ mesh: beanG, baseY: 6.2, phase: mb * 3.14 });
  }

  // 13.4 16 Pastel Horizon Mountain Peaks (Completely Fills 360° Horizon)
  const horizonPeaksMat = new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.1 });
  const peakColors = [0x818cf8, 0x38bdf8, 0xf472b6, 0xfbbf24, 0x34d399, 0xa78bfa, 0x60a5fa, 0xf87171];

  for (let hp = 0; hp < 16; hp++) {
    const hAngle = (hp / 16) * Math.PI * 2;
    const hDist = 120 + (hp % 4) * 12;
    const hHeight = 35 + (hp % 5) * 10;
    const hRadius = 18 + (hp % 3) * 6;

    const peakGeo = new THREE.ConeGeometry(hRadius, hHeight, 6);
    const pMesh = new THREE.Mesh(peakGeo, horizonPeaksMat.clone());
    (pMesh.material as THREE.MeshStandardMaterial).color.setHex(peakColors[hp % peakColors.length]);
    pMesh.position.set(Math.cos(hAngle) * hDist, -45 + hHeight / 2, Math.sin(hAngle) * hDist);
    root.add(pMesh);
  }

  // 13.5 West Windmill Island
  const island1 = new THREE.Group();
  island1.position.set(-46, 2.0, 0);
  root.add(island1);

  const is1Plateau = new THREE.Mesh(new THREE.CylinderGeometry(14, 12, 3.2, 16), grassMat);
  is1Plateau.position.y = 1.6;
  island1.add(is1Plateau);

  const is1Cone = new THREE.Mesh(new THREE.ConeGeometry(12, 14, 14), rockCliffMat);
  is1Cone.rotation.x = Math.PI;
  is1Cone.position.y = -7;
  island1.add(is1Cone);

  const windmillGroup = new THREE.Group();
  windmillGroup.position.set(0, 3.2, 0);
  island1.add(windmillGroup);

  const wmTower = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.4, 7.5, 12), wallPastelMat);
  wmTower.position.y = 3.75;
  windmillGroup.add(wmTower);

  const wmRoof = new THREE.Mesh(new THREE.ConeGeometry(2.1, 2.4, 12), roofRedMat);
  wmRoof.position.y = 8.7;
  windmillGroup.add(wmRoof);

  const windmillBlades = new THREE.Group();
  windmillBlades.position.set(0, 6.8, 1.9);
  windmillBlades.rotation.y = Math.PI / 2;

  const bladeColors = [0xf43f5e, 0x06b6d4, 0xfbbf24, 0x10b981];
  for (let b = 0; b < 4; b++) {
    const bAngle = (b / 4) * Math.PI * 2;
    const bladeArm = new THREE.Group();
    bladeArm.rotation.z = bAngle;

    const spar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 5.2, 0.12), woodMat);
    spar.position.y = 2.6;
    bladeArm.add(spar);

    const sail = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 3.8),
      new THREE.MeshBasicMaterial({ color: bladeColors[b], side: THREE.DoubleSide })
    );
    sail.position.set(0.65, 3.0, 0.05);
    bladeArm.add(sail);

    windmillBlades.add(bladeArm);
  }
  windmillGroup.add(windmillBlades);

  // 13.6 East Carnival Ferris Wheel Island
  const island2 = new THREE.Group();
  island2.position.set(46, 2.0, 2);
  root.add(island2);

  const is2Plateau = new THREE.Mesh(new THREE.CylinderGeometry(15, 13, 3.2, 16), grassMat);
  is2Plateau.position.y = 1.6;
  island2.add(is2Plateau);

  const is2Cone = new THREE.Mesh(new THREE.ConeGeometry(13, 15, 14), rockCliffMat);
  is2Cone.rotation.x = Math.PI;
  is2Cone.position.y = -7.5;
  island2.add(is2Cone);

  const ferrisWheelGroup = new THREE.Group();
  ferrisWheelGroup.position.set(0, 3.2, 0);
  island2.add(ferrisWheelGroup);

  const legMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.6 });
  for (const lz of [-1.8, 1.8]) {
    for (const lx of [-2.4, 2.4]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 9.5, 8), legMat);
      leg.position.set(lx * 0.5, 4.5, lz);
      leg.rotation.z = -lx * 0.12;
      ferrisWheelGroup.add(leg);
    }
  }

  const ferrisWheelRotor = new THREE.Group();
  ferrisWheelRotor.position.set(0, 8.8, 0);
  ferrisWheelRotor.rotation.y = Math.PI / 2;

  const wheelRim = new THREE.Mesh(
    new THREE.TorusGeometry(5.4, 0.16, 10, 32),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.8 })
  );
  ferrisWheelRotor.add(wheelRim);

  const gondolaMeshes: THREE.Group[] = [];
  const gondolaColors = [0x06b6d4, 0xf43f5e, 0xfbbf24, 0x10b981, 0x8b5cf6, 0xec4899, 0x3b82f6, 0xeab308];

  for (let g = 0; g < 8; g++) {
    const angle = (g / 8) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5.4, 6), legMat);
    spoke.position.set(Math.cos(angle) * 2.7, Math.sin(angle) * 2.7, 0);
    spoke.rotation.z = angle - Math.PI / 2;
    ferrisWheelRotor.add(spoke);

    const gondola = new THREE.Group();
    gondola.position.set(Math.cos(angle) * 5.4, Math.sin(angle) * 5.4, 0);
    const car = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.55, 0.65, 8, 10),
      new THREE.MeshStandardMaterial({ color: gondolaColors[g % gondolaColors.length], roughness: 0.25 })
    );
    gondola.add(car);
    ferrisWheelRotor.add(gondola);
    gondolaMeshes.push(gondola);
  }
  ferrisWheelGroup.add(ferrisWheelRotor);

  // ─── 14. MATCH BROADCAST CAMERA DRONE ─────────────────
  const droneGroup = new THREE.Group();
  droneGroup.position.set(12, 7.5, -4);
  root.add(droneGroup);

  const droneBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.35, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 })
  );
  droneGroup.add(droneBody);

  const droneDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.9 })
  );
  droneDome.position.y = 0.18;
  droneGroup.add(droneDome);

  const recLedMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const recLed = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), recLedMat);
  recLed.position.set(0, 0, 0.65);
  droneGroup.add(recLed);

  const rotorBlades: THREE.Mesh[] = [];
  const armOffsets = [
    { x: -0.9, z: -0.9 },
    { x: 0.9, z: -0.9 },
    { x: -0.9, z: 0.9 },
    { x: 0.9, z: 0.9 },
  ];
  for (const ao of armOffsets) {
    const dArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x0f172a })
    );
    dArm.position.set(ao.x * 0.5, 0.05, ao.z * 0.5);
    dArm.rotation.z = Math.PI / 2;
    dArm.rotation.y = Math.atan2(ao.z, ao.x);
    droneGroup.add(dArm);

    const rProp = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.03, 0.14),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee })
    );
    rProp.position.set(ao.x, 0.18, ao.z);
    droneGroup.add(rProp);
    rotorBlades.push(rProp);
  }

  // ─── 15. SPECTATOR AIRSHIP & STRIPED HOT AIR BALLOONS ─
  interface OrbitProp {
    mesh: THREE.Group;
    baseY: number;
    orbitAngle: number;
    orbitDist: number;
    orbitSpeed: number;
  }
  const orbitProps: OrbitProp[] = [];

  const createBalloon = (angle: number, dist: number, y: number, primaryColor: number, stripeColor: number) => {
    const bg = new THREE.Group();
    const envGeo = new THREE.SphereGeometry(4.4, 16, 14);
    envGeo.scale(1.0, 1.38, 1.0);
    const envMesh = new THREE.Mesh(
      envGeo,
      new THREE.MeshStandardMaterial({ color: primaryColor, roughness: 0.25 })
    );
    envMesh.position.y = 6.0;
    bg.add(envMesh);

    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(4.45, 4.45, 1.2, 16),
      new THREE.MeshStandardMaterial({ color: stripeColor, roughness: 0.25 })
    );
    band.position.y = 6.0;
    bg.add(band);

    const basket = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.3, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
    );
    basket.position.y = 0.65;
    bg.add(basket);

    root.add(bg);
    orbitProps.push({
      mesh: bg,
      baseY: y,
      orbitAngle: angle,
      orbitDist: dist,
      orbitSpeed: 0.018,
    });
  };

  createBalloon(0.4, 56, 18, 0xf43f5e, 0xfbbf24);
  createBalloon(2.2, 58, 22, 0x06b6d4, 0xffffff);
  createBalloon(3.8, 54, 20, 0x8b5cf6, 0xfde047);
  createBalloon(5.2, 56, 16, 0x10b981, 0xffffff);

  // Spectator Zeppelin
  const blimpGroup = new THREE.Group();
  const hullGeo = new THREE.SphereGeometry(3.6, 18, 14);
  hullGeo.scale(1.0, 1.0, 3.2);
  const hull = new THREE.Mesh(
    hullGeo,
    new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.25, metalness: 0.3 })
  );
  blimpGroup.add(hull);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.2, 5.0),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
  );
  cabin.position.y = -3.8;
  blimpGroup.add(cabin);

  const blimpProps: THREE.Mesh[] = [];
  for (const px of [-1.5, 1.5]) {
    const pMesh = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.04), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    pMesh.position.set(px, -2.5, -9.8);
    blimpGroup.add(pMesh);
    blimpProps.push(pMesh);
  }

  root.add(blimpGroup);
  orbitProps.push({
    mesh: blimpGroup,
    baseY: 28,
    orbitAngle: 1.5,
    orbitDist: 68,
    orbitSpeed: 0.014,
  });

  // ─── 16. MIDFIELD HAZARD SWEEPERS ON ELEVATED PLATEAU ──
  interface SweeperData {
    center: THREE.Vector3;
    angle: number;
    armLength: number;
    armRadius: number;
    rotSpeed: number;
  }
  const sweepers: SweeperData[] = [];
  const sweeperGroups: THREE.Group[] = [];

  const sweeperConfigs = [
    { x: -7.5, z: -4.5, speed: 1.25 },
    { x: 7.5, z: 4.5, speed: -1.25 },
  ];

  const hubMat = new THREE.MeshStandardMaterial({ color: 0x3b0764, roughness: 0.25, metalness: 0.5 });
  const armMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.2, metalness: 0.1 });
  const armStripeMat = new THREE.MeshBasicMaterial({ color: 0x18181b });

  for (let i = 0; i < sweeperConfigs.length; i++) {
    const sc = sweeperConfigs[i];
    const floorH = getArenaHeight(sc.x, sc.z);

    const sg = new THREE.Group();
    sg.position.set(sc.x, floorH, sc.z);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.8, 0.55, 18), hubMat);
    hub.position.y = 0.28;
    sg.add(hub);

    const armGroup = new THREE.Group();
    armGroup.position.y = 0.50;

    const armLen = 3.6;
    const armR = 0.25;
    const armGeo = new THREE.CapsuleGeometry(armR, armLen * 2, 8, 16);
    armGeo.rotateZ(Math.PI / 2);
    const arm = new THREE.Mesh(armGeo, armMat);
    arm.castShadow = true;
    armGroup.add(arm);

    for (const sx of [-2.6, -1.5, 1.5, 2.6]) {
      const sMesh = new THREE.Mesh(new THREE.CylinderGeometry(armR + 0.012, armR + 0.012, 0.25, 12), armStripeMat);
      sMesh.rotateZ(Math.PI / 2);
      sMesh.position.x = sx;
      armGroup.add(sMesh);
    }

    sg.add(armGroup);
    root.add(sg);

    sweepers.push({
      center: new THREE.Vector3(sc.x, floorH + 0.50, sc.z),
      angle: (i * Math.PI) / 2,
      armLength: armLen,
      armRadius: armR,
      rotSpeed: sc.speed,
    });
    sweeperGroups.push(armGroup);
  }

  // ─── 17. CELEBRATION CONFETTI CANNONS ─────────────────
  const confCount = 140;
  const confGeo = new THREE.PlaneGeometry(0.24, 0.38);
  const confMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
  });
  const confMesh = new THREE.InstancedMesh(confGeo, confMat, confCount);

  interface ConfData {
    x: number;
    y: number;
    z: number;
    vy: number;
    rx: number;
    ry: number;
    vrx: number;
    vry: number;
  }
  const confData: ConfData[] = [];
  const confColors = [0xfbbf24, 0x27e5ff, 0xff5268, 0x8338ec, 0x06d6a0, 0xf472b6, 0x38bdf8];

  for (let i = 0; i < confCount; i++) {
    confData.push({
      x: (Math.random() - 0.5) * W,
      y: 4 + Math.random() * 8,
      z: (Math.random() - 0.5) * L,
      vy: -0.4 - Math.random() * 0.5,
      rx: Math.random() * 6.28,
      ry: Math.random() * 6.28,
      vrx: 2.0 + Math.random() * 2.2,
      vry: 1.5 + Math.random() * 1.8,
    });
    confMesh.setColorAt(i, new THREE.Color(confColors[i % confColors.length]));
  }
  if (confMesh.instanceColor) confMesh.instanceColor.needsUpdate = true;
  root.add(confMesh);

  // ─── STATE & ANIMATION LOOP ───────────────────────────
  let goalCelebTimer = 0;
  let goalCelebTeam = 0;

  function update(dt: number, time: number) {
    // 1. Scroll LED Ribbon Boards
    ribbonTex.offset.x -= dt * 0.12;

    // 2. Rotate Windmill Blades & Ferris Wheel
    windmillBlades.rotation.z += dt * 0.9;
    ferrisWheelRotor.rotation.z += dt * 0.35;
    for (const g of gondolaMeshes) {
      g.rotation.z = -ferrisWheelRotor.rotation.z;
    }

    // 3. Rotate Floating Donut, Star Ring, & Crown
    donutGroup.rotation.z += dt * 0.4;
    starRingGroup.rotation.z -= dt * 0.3;
    crownGroup.rotation.y = time * 0.8;

    // 4. Animate Giant Fall Guys Mascots on Sidelines
    for (let mIdx = 0; mIdx < giantMascots.length; mIdx++) {
      const gm = giantMascots[mIdx];
      const breathing = Math.sin(time * 2.2 + mIdx * 1.5) * 0.08;
      gm.group.position.y = gm.baseY + breathing;
      gm.arm.rotation.z = Math.sin(time * 3.5 + mIdx * 2.0) * 0.22;
    }

    // 5. Animate Giant Peeker Mascot Over South Canopy Roof
    giantPeeker.position.y = 14.5 + Math.sin(time * 1.8) * 0.25;
    for (let h = 0; h < peekerHands.length; h++) {
      peekerHands[h].position.y = -1.2 + Math.sin(time * 3.0 + h * 1.5) * 0.18;
    }

    // 6. Animate Sweeping Searchlights
    for (const sl of searchlights) {
      const angle = time * sl.speed + sl.baseAngle;
      sl.mesh.rotation.z = Math.sin(angle) * 0.35;
      sl.mesh.rotation.x = Math.cos(angle * 0.8) * 0.3;
    }

    // 6.B Animate Volumetric Tower Pitch Floodlights
    for (const tfl of towerFloodlights) {
      const curTarget = tfl.baseTarget.clone();
      if (goalCelebTimer > 0) {
        // Converge dynamically onto scoring goal
        const targetZ = goalCelebTeam === 0 ? 23.0 : -23.0;
        curTarget.set(Math.sin(time * 5.0) * 3.0, 0.05, targetZ);
      } else {
        curTarget.x += Math.cos(time * tfl.sweepSpeed + tfl.phase) * tfl.sweepRadius;
        curTarget.z += Math.sin(time * tfl.sweepSpeed * 0.75 + tfl.phase) * (tfl.sweepRadius * 1.5);
      }
      tfl.cone.position.copy(tfl.origin);
      tfl.cone.lookAt(curTarget);
      tfl.pool.position.set(curTarget.x, 0.06, curTarget.z);
    }

    // 7. Animate Sky Rollercoaster Train
    for (let c = 0; c < coasterCarts.length; c++) {
      const cart = coasterCarts[c];
      const u = (time * 0.04 + c * 0.024) % 1.0;
      const pt = coasterLoop.getPointAt(u);
      const tangent = coasterLoop.getTangentAt(u);
      cart.position.copy(pt);
      cart.lookAt(pt.clone().add(tangent));
    }

    // 8. Animate Mini Beans Bouncing on Mushroom Island
    for (let mb = 0; mb < miniBeans.length; mb++) {
      const minB = miniBeans[mb];
      const bounceH = Math.abs(Math.sin(time * 5.0 + minB.phase)) * 0.8;
      minB.mesh.position.y = minB.baseY + bounceH;
    }

    // 9. Orbit Airships & Hot Air Balloons
    for (const p of orbitProps) {
      p.orbitAngle += p.orbitSpeed * dt;
      p.mesh.position.set(
        Math.cos(p.orbitAngle) * p.orbitDist,
        p.baseY + Math.sin(time * 0.6 + p.orbitAngle) * 0.9,
        Math.sin(p.orbitAngle) * p.orbitDist
      );
      p.mesh.rotation.y = -p.orbitAngle + Math.PI / 2;
    }

    for (const bp of blimpProps) {
      bp.rotation.z += dt * 18;
    }

    // 10. Animate Camera Drone
    droneGroup.position.set(
      12 + Math.sin(time * 0.8) * 2.2,
      7.5 + Math.sin(time * 1.4) * 0.6,
      -4 + Math.cos(time * 0.6) * 3.5
    );
    droneGroup.rotation.y = Math.sin(time * 0.5) * 0.4;
    for (const rb of rotorBlades) {
      rb.rotation.y += dt * 32;
    }
    recLedMat.color.setHex((Math.floor(time * 3) % 2 === 0) ? 0xef4444 : 0x450a0a);

    // 11. Rotate Sweepers
    for (let i = 0; i < sweepers.length; i++) {
      sweepers[i].angle += sweepers[i].rotSpeed * dt;
      sweeperGroups[i].rotation.y = sweepers[i].angle;
    }

    // 12. Animate All 600 Fall Guys Spectators & Mexican Wave ("La Ola")
    if (goalCelebTimer > 0) goalCelebTimer -= dt;
    for (let i = 0; i < specData.length; i++) {
      const s = specData[i];

      // Traveling stadium Mexican Wave around the bowl!
      const wavePhase = time * 3.4 - (s.base.z * 0.12 + s.base.x * 0.06);
      const waveSin = Math.sin(wavePhase);
      const isWave = waveSin > 0.35;
      const waveBoost = isWave ? Math.pow((waveSin - 0.35) / 0.65, 1.8) * 0.48 : 0;

      let bob = Math.sin(time * s.speed + s.phase) * 0.08 + waveBoost;
      let sway = 0;

      // Arm wave angles
      let armAngleX = -0.3 + Math.sin(time * s.speed * 1.5 + s.phase) * 0.4;
      let armAngleZ = 0.4;

      if (isWave) {
        // Hands straight up in the air!
        armAngleX = -2.7 + Math.sin(time * 10) * 0.3;
        armAngleZ = 0.2;
      }

      if (goalCelebTimer > 0) {
        // Goal frenzy!
        bob += Math.abs(Math.sin(time * 16 + s.phase)) * 0.65;
        sway = Math.sin(time * 14 + s.phase) * 0.22;
        armAngleX = -2.6 + Math.sin(time * 16 + s.phase) * 0.5;
      }

      dummy.position.copy(s.base);
      dummy.position.y += bob;
      dummy.rotation.set(0, s.rotY, sway);
      dummy.updateMatrix();
      specMesh.setMatrixAt(i, dummy.matrix);

      faceDummy.position.set(
        s.base.x + s.faceOffset.x,
        s.base.y + s.faceOffset.y + bob,
        s.base.z + s.faceOffset.z
      );
      faceDummy.rotation.set(0, s.rotY, sway);
      faceDummy.updateMatrix();
      faceMesh.setMatrixAt(i, faceDummy.matrix);

      // Waving arms
      const perpX = Math.cos(s.rotY);
      const perpZ = -Math.sin(s.rotY);

      armLDummy.position.set(s.base.x - perpX * 0.26, s.base.y + 0.1 + bob, s.base.z - perpZ * 0.26);
      armLDummy.rotation.set(armAngleX, s.rotY, armAngleZ);
      armLDummy.updateMatrix();
      armMeshL.setMatrixAt(i, armLDummy.matrix);

      armRDummy.position.set(s.base.x + perpX * 0.26, s.base.y + 0.1 + bob, s.base.z + perpZ * 0.26);
      armRDummy.rotation.set(armAngleX, s.rotY, -armAngleZ);
      armRDummy.updateMatrix();
      armMeshR.setMatrixAt(i, armRDummy.matrix);

      if (i % 3 === 0 && Math.floor(i / 3) < hatCount) {
        const hi = Math.floor(i / 3);
        hatDummy.position.set(s.base.x, s.base.y + 0.52 + bob, s.base.z);
        hatDummy.rotation.set(0, s.rotY, sway);
        hatDummy.updateMatrix();
        hatMesh.setMatrixAt(hi, hatDummy.matrix);
      }
    }
    specMesh.instanceMatrix.needsUpdate = true;
    faceMesh.instanceMatrix.needsUpdate = true;
    armMeshL.instanceMatrix.needsUpdate = true;
    armMeshR.instanceMatrix.needsUpdate = true;
    hatMesh.instanceMatrix.needsUpdate = true;

    // 13. Confetti Fluttering
    const cd = new THREE.Object3D();
    for (let i = 0; i < confData.length; i++) {
      const cf = confData[i];
      cf.y += cf.vy * dt;
      cf.rx += cf.vrx * dt;
      cf.ry += cf.vry * dt;
      const groundH = getArenaHeight(cf.x, cf.z);
      if (cf.y < groundH + 0.2) {
        cf.y = 8 + Math.random() * 6;
        cf.x = (Math.random() - 0.5) * W;
        cf.z = (Math.random() - 0.5) * L;
      }
      cd.position.set(cf.x, cf.y, cf.z);
      cd.rotation.set(cf.rx, cf.ry, 0);
      cd.updateMatrix();
      confMesh.setMatrixAt(i, cd.matrix);
    }
    confMesh.instanceMatrix.needsUpdate = true;
  }

  function onGoalCelebration(team: number) {
    goalCelebTimer = 3.5;
    goalCelebTeam = team;
  }

  function dispose() {
    scene.remove(root);
  }

  return { update, onGoalCelebration, sweeperArms: sweepers, floorMesh, dispose };
}
