/**
 * BOUNCEBACK! — Ultra-HD Spacious Fall Guys Championship World
 *
 * Professional AAA Nintendo / Fall Guys arcade aesthetic:
 * - Spacious 28m x 54m arena with gentle 10m ramps (0m -> 1.2m -> 0m)
 * - 100% Vector-sharp, Ultra-HD court graphics with PBR glossy sheen (zero blur)
 * - Correct camera orientation: Court text "★ BATTLE ARENA ★" and speed chevrons face player right-side up
 * - Seamless continuous TubeGeometry inflatable barrier bumpers (zero kinks or gaps)
 * - Grand Colosseum Stadium Bowl wrapping around the pitch with 5 elevated seating tiers (y = 1.7m to 4.8m)
 * - 350+ animated 3D Fall Guys bean spectators with signature white faceplates & black oval eyes!
 * - Team cheering banners draped along stadium railings ("GO CYAN BEANS", "CORAL SMASH", "WIN THE CROWN")
 * - 2 Monumental 7-Meter Inflatable Fall Guys Mascots on Left & Right Sidelines:
 *   1. West Giant Cyan Mascot wearing a Golden Crown and holding a giant "#1" Foam Finger!
 *   2. East Giant Coral Mascot wearing a Champion Sweatband and giant Boxing Glove!
 * - 360° Animated LED Ribbon Video Boards scrolling live esports championship graphics
 * - 4 Monumental Stadium Floodlight Masts with festoon party pennants overhead
 * - South Victory Arch with giant rotating 3D Golden Championship Crown & digital scoreboard
 * - North Championship Jumbotron with twin golden victory trophy cups
 * - Floating Colosseum Island Keel with glowing anti-gravity thrusters underneath
 * - Rich, Packed Surrounding Sky World (Zero Empty Voids):
 *   1. Giant Floating Donut Obstacle Ring with pink strawberry glaze & 3D rainbow sprinkles
 *   2. Giant Floating Golden Star Championship Ring rotating in the sky
 *   3. Bouncy Polka-Dot Mushroom Island with mini bouncing beans
 *   4. Carnival Party Canopy Island with spinning carousel top
 *   5. Theme Park Windmill Island with 4 rotating rainbow-colored blades & pastel cottages
 *   6. Carnival Island with a working 3D rotating Ferris Wheel & upright passenger gondolas
 *   7. Crystal Cascade Island with twin turquoise waterfalls pouring into the cloud sea
 *   8. Amethyst Spire Island with glowing pastel crystal clusters & party umbrellas
 *   9. Distant Castle Island with towers & rainbow arch bridge
 *   10. Sweeping Neon Sky Rollercoaster Rails weaving through clouds
 *   11. 16 Pastel Horizon Mountain Peaks circling the 360° horizon
 * - Match Broadcast Camera Drone hovering with 4 spinning rotors & blinking red recording light
 * - Spectator Zeppelin with twin spinning propellers & 4 striped hot air balloons
 * - Distant 3D sea of fluffy cumulus clouds far below the floating stadium (y = -45m, dist > 85m)
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
    // Vibrant Nintendo / Fall Guys sunny daylight sky
    const g = ctx.createLinearGradient(0, 0, 0, 1024);
    g.addColorStop(0.00, "#0284c7"); // Deep vibrant sky blue
    g.addColorStop(0.35, "#38bdf8"); // Cheerful bright cyan
    g.addColorStop(0.68, "#7dd3fc"); // Soft horizon cyan
    g.addColorStop(0.88, "#bae6fd"); // Light sunny haze
    g.addColorStop(0.96, "#fef08a"); // Warm golden horizon glow
    g.addColorStop(1.00, "#fde68a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 2048, 1024);

    // Glowing sun corona in upper sky
    const sunGrad = ctx.createRadialGradient(1024, 240, 10, 1024, 240, 280);
    sunGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
    sunGrad.addColorStop(0.18, "rgba(254, 240, 138, 0.95)");
    sunGrad.addColorStop(0.45, "rgba(253, 224, 71, 0.4)");
    sunGrad.addColorStop(1.0, "rgba(253, 224, 71, 0.0)");
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(1024, 240, 280, 0, Math.PI * 2);
    ctx.fill();

    // Stylized vector cumulus cloud silhouettes along horizon
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

  // ─── 2. DISTANT CUMULUS CLOUD SEA (Safely Far Below at y = -45m, dist > 85m) ───
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

  for (let ci = 0; ci < 28; ci++) {
    const angle = (ci / 28) * Math.PI * 2;
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

  // Ultra-HD 2048x4096 Floor Texture (Oriented Right-Side Up Facing Camera)
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

    // Clean court track stripes
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "#ffffff";
    for (let y = 0; y < 4096; y += 96) {
      ctx.fillRect(0, y, 2048, 48);
    }
    ctx.globalAlpha = 1.0;

    // Speed Chevrons on Ascending Ramp (pointing toward +Z downfield)
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

    // Speed Chevrons on Descending Ramp (pointing toward +Z downfield)
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

    // Court Text: Rotated 180° so it reads right-side up to the camera viewing from -Z
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

    // Outer Stadium Boundary Border
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

  // ─── 4. FLOATING COLOSSEUM ISLAND UNDERSIDE & FOUNDATION ───
  const foundationMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.45, metalness: 0.2 });
  const rockKeelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85, metalness: 0.1 });
  const energyCoreMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.7,
    roughness: 0.2,
    metalness: 0.8,
  });

  // Main ground foundation slab under pitch (safely 30cm below floor to prevent z-fighting)
  const baseSlab = new THREE.Mesh(new THREE.BoxGeometry(W + 3, 2.0, L + 3), foundationMat);
  baseSlab.position.y = -1.3;
  baseSlab.receiveShadow = true;
  root.add(baseSlab);

  // Stepped Inverted Floating Island Rock Keel beneath colosseum
  const keelStep1 = new THREE.Mesh(new THREE.BoxGeometry(W - 2, 2.5, L - 4), rockKeelMat);
  keelStep1.position.y = -3.25;
  keelStep1.receiveShadow = true;
  root.add(keelStep1);

  const keelStep2 = new THREE.Mesh(new THREE.BoxGeometry(W - 8, 3.0, L - 12), rockKeelMat);
  keelStep2.position.y = -6.0;
  keelStep2.receiveShadow = true;
  root.add(keelStep2);

  const keelStep3 = new THREE.Mesh(new THREE.BoxGeometry(W - 14, 3.5, L - 22), rockKeelMat);
  keelStep3.position.y = -9.25;
  keelStep3.receiveShadow = true;
  root.add(keelStep3);

  // Central Anti-Gravity Floating Thruster Core
  const thrusterRing = new THREE.Mesh(
    new THREE.TorusGeometry(5.0, 0.4, 12, 32),
    energyCoreMat
  );
  thrusterRing.rotation.x = Math.PI / 2;
  thrusterRing.position.y = -11.5;
  root.add(thrusterRing);

  // Side foundation skirts under elevated midfield plateau (z = -5 to +5)
  for (const side of [-1, 1]) {
    const skirtGeo = new THREE.BoxGeometry(0.5, 1.1, 10);
    const skirtMesh = new THREE.Mesh(skirtGeo, foundationMat);
    skirtMesh.position.set(side * (hW + 0.35), 0.55, 0);
    skirtMesh.receiveShadow = true;
    root.add(skirtMesh);
  }

  // Raised Center Gold Ring Rim (r = 4.4m)
  const daisRingGeo = new THREE.TorusGeometry(4.4, 0.08, 12, 48);
  daisRingGeo.rotateX(Math.PI / 2);
  const daisRing = new THREE.Mesh(
    daisRingGeo,
    new THREE.MeshStandardMaterial({
      color: C.GOLD,
      roughness: 0.15,
      metalness: 0.85,
      emissive: C.GOLD,
      emissiveIntensity: 0.35,
    })
  );
  daisRing.position.set(0, 1.24, 0);
  root.add(daisRing);

  // ─── 5. SEAMLESS CONTINUOUS INFLATABLE PERIMETER BARRIERS ─
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

    // Glowing Neon Guide Rail along top of barrier
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

  // Seamless End Barriers (North Cyan & South Coral)
  const addEndBarrier = (pz: number, color: number) => {
    const endMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.20,
      metalness: 0.05,
    });
    const geo = new THREE.CapsuleGeometry(wallR, W + 0.7, 14, 24);
    geo.rotateZ(Math.PI / 2);
    const m = new THREE.Mesh(geo, endMat);
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

  // ─── 7. GRAND COLOSSEUM STADIUM TIERS & 350 FALL GUYS BEAN SPECTATORS ───
  const tierColors = [0x06b6d4, 0xfbbf24, 0xf43f5e, 0x8b5cf6, 0x10b981];
  const riserMat = new THREE.MeshStandardMaterial({ color: 0x181438, roughness: 0.5, metalness: 0.1 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.8 });

  for (const side of [-1, 1]) {
    for (let tier = 0; tier < 5; tier++) {
      const tierSeatMat = new THREE.MeshStandardMaterial({
        color: tierColors[tier % tierColors.length],
        roughness: 0.35,
      });

      const tierX = side * (hW + 2.2 + tier * 1.5);
      const tierY = 1.7 + tier * 0.75;

      // Tier bench slab
      const bench = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, L + 6), tierSeatMat);
      bench.position.set(tierX, tierY, 0);
      bench.receiveShadow = true;
      root.add(bench);

      // Concrete riser underneath
      const riserH = tierY - 0.15;
      const riser = new THREE.Mesh(new THREE.BoxGeometry(1.36, riserH, L + 6), riserMat);
      riser.position.set(tierX, riserH / 2, 0);
      riser.receiveShadow = true;
      root.add(riser);

      // Safety rail
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, L + 6), railMat);
      rail.position.set(tierX - side * 0.65, tierY + 0.4, 0);
      root.add(rail);
    }
  }

  // Signature Fall Guys Faceplate Texture with 2 Black Pill Eyes & White Glints
  const faceplateTex = makeCanvasTex(256, 256, (ctx) => {
    // White oval headplate
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(128, 128, 110, 118, 0, 0, Math.PI * 2);
    ctx.fill();

    // Signature Fall Guys 2 black vertical pill eyes
    ctx.fillStyle = "#09090b";
    ctx.beginPath();
    ctx.ellipse(92, 124, 15, 34, 0, 0, Math.PI * 2);
    ctx.ellipse(164, 124, 15, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute white sparkle glints in eyes
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(88, 108, 6.5, 0, Math.PI * 2);
    ctx.arc(160, 108, 6.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // 350 Instanced Fall Guys Bean Bodies
  const specCount = 350;
  const specGeo = new THREE.CapsuleGeometry(0.24, 0.42, 8, 10);
  const specMat = new THREE.MeshStandardMaterial({ roughness: 0.25, metalness: 0.05 });
  const specMesh = new THREE.InstancedMesh(specGeo, specMat, specCount);
  specMesh.castShadow = true;

  // 350 Instanced Fall Guys Faceplates (facing the arena pitch)
  const faceGeo = new THREE.PlaneGeometry(0.23, 0.23);
  const faceMat = new THREE.MeshBasicMaterial({ map: faceplateTex, transparent: true });
  const faceMesh = new THREE.InstancedMesh(faceGeo, faceMat, specCount);

  const specColors = [
    0x27e5ff, 0xff5268, 0xffd166, 0x8338ec, 0x06d6a0, 0xf472b6, 0xfb923c, 0xa855f7, 0x38bdf8, 0xe11d48,
  ];
  interface SpecData { base: THREE.Vector3; side: number; phase: number; speed: number }
  const specData: SpecData[] = [];
  const dummy = new THREE.Object3D();
  const faceDummy = new THREE.Object3D();
  let si = 0;

  for (const side of [-1, 1]) {
    for (let tier = 0; tier < 5; tier++) {
      const perRow = 35;
      for (let r = 0; r < perRow && si < specCount; r++) {
        const z = -hL + 2.0 + (r / (perRow - 1)) * (L - 4);
        const x = side * (hW + 2.2 + tier * 1.5);
        const y = 1.7 + tier * 0.75 + 0.38;

        // Bean body
        dummy.position.set(x, y, z);
        dummy.updateMatrix();
        specMesh.setMatrixAt(si, dummy.matrix);
        specMesh.setColorAt(si, new THREE.Color(specColors[si % specColors.length]));

        // Faceplate mounted on the front face looking toward field (x = 0)
        const faceX = x + (side < 0 ? 0.23 : -0.23);
        const faceY = y + 0.12;
        faceDummy.position.set(faceX, faceY, z);
        faceDummy.rotation.set(0, side < 0 ? Math.PI / 2 : -Math.PI / 2, 0);
        faceDummy.updateMatrix();
        faceMesh.setMatrixAt(si, faceDummy.matrix);

        specData.push({
          base: new THREE.Vector3(x, y, z),
          side,
          phase: Math.random() * 6.28,
          speed: 2.2 + Math.random() * 2.8,
        });
        si++;
      }
    }
  }
  if (specMesh.instanceColor) specMesh.instanceColor.needsUpdate = true;
  specMesh.instanceMatrix.needsUpdate = true;
  faceMesh.instanceMatrix.needsUpdate = true;
  root.add(specMesh);
  root.add(faceMesh);

  // Grandstand Cheering Banners along Railings
  const addBleacherBanner = (x: number, y: number, z: number, text: string, bg: string, border: string, side: number) => {
    const bannerTex = makeCanvasTex(512, 128, (ctx) => {
      ctx.fillStyle = bg;
      ctx.fillRect(4, 4, 504, 120);
      ctx.strokeStyle = border;
      ctx.lineWidth = 10;
      ctx.strokeRect(4, 4, 504, 120);
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 44px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 256, 64);
    });
    const bMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(8.0, 1.4),
      new THREE.MeshBasicMaterial({ map: bannerTex, side: THREE.DoubleSide })
    );
    bMesh.position.set(x, y, z);
    bMesh.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
    root.add(bMesh);
  };

  addBleacherBanner(-(hW + 1.4), 1.9, -12, "★ GO CYAN BEANS ⚡", "#0369a1", "#38bdf8", -1);
  addBleacherBanner(-(hW + 1.4), 1.9, 12, "👑 WIN THE CROWN 👑", "#854d0e", "#fef08a", -1);
  addBleacherBanner(hW + 1.4, 1.9, -12, "🔥 CORAL SMASH 🔥", "#9f1239", "#fb7185", 1);
  addBleacherBanner(hW + 1.4, 1.9, 12, "⚡ SPEED RUSH ⚡", "#701a75", "#e879f9", 1);

  // ─── 8. TWO MONUMENTAL 7-METER INFLATABLE FALL GUYS MASCOTS (Left & Right Sidelines) ─
  const giantMascots: { group: THREE.Group; arm: THREE.Group; baseY: number }[] = [];

  const createGiantMascot = (team: "cyan" | "coral", side: number) => {
    const mg = new THREE.Group();
    const mx = side * (hW + 3.8);
    const my = 0.6;
    const mz = 0;
    mg.position.set(mx, my, mz);

    // 1. Stage Winner's Podium
    const stageMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.3, metalness: 0.4 });
    const stage = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.9, 1.2, 24), stageMat);
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

    // 2. Giant Bean Body (6.5m high)
    const beanBodyMat = new THREE.MeshStandardMaterial({
      color: team === "cyan" ? 0x00b4d8 : 0xf43f5e,
      roughness: 0.25,
      metalness: 0.05,
    });
    const beanMesh = new THREE.Mesh(new THREE.CapsuleGeometry(1.4, 2.4, 16, 20), beanBodyMat);
    beanMesh.position.y = 3.2;
    beanMesh.castShadow = true;
    mg.add(beanMesh);

    // 3. Iconic White Faceplate & Eyes
    const faceplateMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
    );
    faceplateMesh.scale.set(0.9, 1.35, 0.45);
    faceplateMesh.position.set(side < 0 ? 1.05 : -1.05, 3.8, 0);
    mg.add(faceplateMesh);

    // Two Black Oval Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
    for (const ez of [-0.28, 0.28]) {
      const eye = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.22, 6, 8), eyeMat);
      eye.position.set(side < 0 ? 1.36 : -1.36, 3.82, ez);
      eye.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      mg.add(eye);
    }

    // 4. Team-Specific Championship Headgear & Cheering Arm Props
    let wavingArm = new THREE.Group();

    if (team === "cyan") {
      // Golden 5-point Crown on Cyan Mascot
      const crown = new THREE.Group();
      crown.position.set(0, 5.75, 0);
      const cBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.95, 0.85, 0.45, 16),
        new THREE.MeshStandardMaterial({ color: C.GOLD, roughness: 0.15, metalness: 0.85 })
      );
      crown.add(cBase);

      for (let p = 0; p < 5; p++) {
        const cAngle = (p / 5) * Math.PI * 2;
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(0.24, 0.9, 5),
          new THREE.MeshStandardMaterial({ color: C.GOLD, roughness: 0.15, metalness: 0.85 })
        );
        spike.position.set(Math.cos(cAngle) * 0.85, 0.65, Math.sin(cAngle) * 0.85);
        crown.add(spike);
      }
      mg.add(crown);

      // Cheering Arm with Giant "#1" Foam Finger
      wavingArm.position.set(side < 0 ? 1.3 : -1.3, 3.8, 0.9);
      const armTube = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.8, 8), beanBodyMat);
      armTube.position.y = 0.9;
      armTube.rotation.z = side < 0 ? 0.4 : -0.4;
      wavingArm.add(armTube);

      // Foam Finger Hand
      const fingerMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });
      const palm = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.28), fingerMat);
      palm.position.set(0, 2.0, 0);
      wavingArm.add(palm);

      const pointer = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.9, 0.25), fingerMat);
      pointer.position.set(0.12, 2.8, 0);
      wavingArm.add(pointer);

      mg.add(wavingArm);
    } else {
      // Sporty Athletic Headband on Coral Mascot
      const band = new THREE.Mesh(
        new THREE.TorusGeometry(1.42, 0.14, 8, 24),
        new THREE.MeshStandardMaterial({ color: C.GOLD, roughness: 0.3 })
      );
      band.rotation.x = Math.PI / 2;
      band.position.y = 4.8;
      mg.add(band);

      // Star emblem on headband
      const star = new THREE.Mesh(
        new THREE.ConeGeometry(0.35, 0.2, 5),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
      );
      star.position.set(side < 0 ? 1.45 : -1.45, 4.8, 0);
      star.rotation.z = side < 0 ? -Math.PI / 2 : Math.PI / 2;
      mg.add(star);

      // Cheering Arm with Giant Red Boxing Glove
      wavingArm.position.set(side < 0 ? 1.3 : -1.3, 3.8, -0.9);
      const armTube = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.8, 8), beanBodyMat);
      armTube.position.y = 0.9;
      armTube.rotation.z = side < 0 ? -0.4 : 0.4;
      wavingArm.add(armTube);

      // Giant Boxing Glove
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

  createGiantMascot("cyan", -1); // Left Sideline Mascot
  createGiantMascot("coral", 1);  // Right Sideline Mascot

  // ─── 9. 4 MONUMENTAL STADIUM FLOODLIGHT TOWERS & BUNTING ─
  const towerPositions = [
    { x: -hW - 8.5, z: -25 },
    { x: hW + 8.5, z: -25 },
    { x: -hW - 8.5, z: 25 },
    { x: hW + 8.5, z: 25 },
  ];

  const towerMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.3, metalness: 0.7 });
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });

  for (const tp of towerPositions) {
    const tower = new THREE.Group();
    tower.position.set(tp.x, 0, tp.z);

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.85, 20, 10), towerMat);
    mast.position.y = 10;
    mast.castShadow = true;
    tower.add(mast);

    const head = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.8, 0.8), towerMat);
    head.position.set(0, 20, 0);
    head.rotation.y = tp.x < 0 ? 0.35 : -0.35;
    tower.add(head);

    for (let lx = -1.3; lx <= 1.3; lx += 0.86) {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), lampMat);
      lamp.position.set(lx, 20, tp.x < 0 ? 0.45 : -0.45);
      tower.add(lamp);
    }

    const cannon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.45, 1.4, 8),
      new THREE.MeshStandardMaterial({ color: C.GOLD, metalness: 0.8, roughness: 0.2 })
    );
    cannon.position.set(0, 11, 0);
    cannon.rotation.z = tp.x < 0 ? -0.5 : 0.5;
    tower.add(cannon);

    root.add(tower);
  }

  // Overhead catenary bunting ropes
  const pennantColors = [0xf43f5e, 0x06b6d4, 0xfbbf24, 0x10b981, 0x8b5cf6];
  const pennantGeo = new THREE.ConeGeometry(0.35, 0.8, 3);
  pennantGeo.rotateX(Math.PI);

  const addBuntingLine = (x0: number, z0: number, x1: number, z1: number) => {
    const count = 18;
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const px = THREE.MathUtils.lerp(x0, x1, t);
      const pz = THREE.MathUtils.lerp(z0, z1, t);
      const sag = Math.sin(t * Math.PI) * 2.8;
      const py = 18 - sag;

      const pMat = new THREE.MeshBasicMaterial({ color: pennantColors[i % pennantColors.length] });
      const pennant = new THREE.Mesh(pennantGeo, pMat);
      pennant.position.set(px, py, pz);
      pennant.rotation.y = Math.atan2(z1 - z0, x1 - x0);
      root.add(pennant);
    }
  };

  addBuntingLine(-hW - 8.5, -25, hW + 8.5, -25);
  addBuntingLine(-hW - 8.5, 25, hW + 8.5, 25);
  addBuntingLine(-hW - 8.5, -25, -hW - 8.5, 25);
  addBuntingLine(hW + 8.5, -25, hW + 8.5, 25);

  // ─── 10. SOUTH VICTORY ARCH & CROWN MONUMENT ───────────
  const southArch = new THREE.Group();
  southArch.position.set(0, 0, hL + 6.5);
  root.add(southArch);

  const archPylonMat = new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.25, metalness: 0.3 });
  const goldDecoMat = new THREE.MeshStandardMaterial({ color: C.GOLD, roughness: 0.15, metalness: 0.85 });

  for (const px of [-7.5, 7.5]) {
    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.2, 13, 14), archPylonMat);
    pylon.position.set(px, 6.5, 0);
    pylon.castShadow = true;
    southArch.add(pylon);

    for (const ry of [2, 6, 11]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.12, 8, 24), goldDecoMat);
      ring.position.set(px, ry, 0);
      ring.rotation.x = Math.PI / 2;
      southArch.add(ring);
    }
  }

  const crossbar = new THREE.Mesh(new THREE.BoxGeometry(16, 1.6, 1.6), archPylonMat);
  crossbar.position.set(0, 12.2, 0);
  southArch.add(crossbar);

  const victoryTex = makeCanvasTex(1024, 256, (ctx) => {
    ctx.fillStyle = "#1e1145";
    ctx.fillRect(8, 8, 1008, 240);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 14;
    ctx.strokeRect(8, 8, 1008, 240);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 68px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("★ CORAL ARENA ★", 512, 128);
  });
  const victoryBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(13, 3.2),
    new THREE.MeshBasicMaterial({ map: victoryTex, side: THREE.DoubleSide })
  );
  victoryBoard.position.set(0, 10.5, 0);
  victoryBoard.rotation.y = Math.PI;
  southArch.add(victoryBoard);

  const crownGroup = new THREE.Group();
  crownGroup.position.set(0, 14.5, 0);
  const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.3, 0.6, 20), goldDecoMat);
  crownGroup.add(crownBase);

  for (let pt = 0; pt < 5; pt++) {
    const angle = (pt / 5) * Math.PI * 2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.4, 6), goldDecoMat);
    spike.position.set(Math.cos(angle) * 1.35, 0.9, Math.sin(angle) * 1.35);
    crownGroup.add(spike);

    const ruby = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.1, metalness: 0.9, emissive: 0xef4444, emissiveIntensity: 0.4 })
    );
    ruby.position.set(Math.cos(angle) * 1.35, 1.6, Math.sin(angle) * 1.35);
    crownGroup.add(ruby);
  }
  southArch.add(crownGroup);

  // Metallic Party Balloon Clusters beside towers
  const balloonMatCyan = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.15, metalness: 0.5 });
  const balloonMatPink = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.15, metalness: 0.5 });
  const balloonMatGold = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.15, metalness: 0.8 });

  for (const bx of [-9.5, 9.5]) {
    for (let bi = 0; bi < 5; bi++) {
      const bMat = bi % 3 === 0 ? balloonMatGold : bi % 3 === 1 ? balloonMatPink : balloonMatCyan;
      const bMesh = new THREE.Mesh(new THREE.SphereGeometry(0.75, 14, 12), bMat);
      bMesh.scale.set(1.0, 1.25, 1.0);
      bMesh.position.set(bx + (bi % 2 === 0 ? 0.6 : -0.6), 7 + bi * 1.2, (bi - 2) * 0.5);
      southArch.add(bMesh);
    }
  }

  // ─── 11. NORTH CHAMPIONSHIP JUMBOTRON & TROPHIES ───────
  const jumbotronGroup = new THREE.Group();
  jumbotronGroup.position.set(0, 14.5, -hL - 7.5);
  root.add(jumbotronGroup);

  const screenW = 20;
  const screenH = 11.25;
  const jumbotronMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });

  texLoader.load("/stadium_jumbotron.jpg", (jumboTex) => {
    jumboTex.colorSpace = THREE.SRGBColorSpace;
    jumboTex.anisotropy = 16;
    jumbotronMat.map = jumboTex;
    jumbotronMat.needsUpdate = true;
  });

  const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(screenW, screenH), jumbotronMat);
  jumbotronGroup.add(screenMesh);

  const jFrameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 });
  const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(screenW + 1.0, screenH + 1.0, 0.5), jFrameMat);
  frameMesh.position.z = -0.26;
  jumbotronGroup.add(frameMesh);

  for (const tx of [-screenW * 0.46, screenW * 0.46]) {
    const truss = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 17, 10), jFrameMat);
    truss.position.set(tx, -8.5, -0.5);
    jumbotronGroup.add(truss);
  }

  const createTrophyCup = (x: number) => {
    const tg = new THREE.Group();
    tg.position.set(x, 2, 0);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.4, 1.2, 16), goldDecoMat);
    tg.add(base);

    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.8, 12), goldDecoMat);
    stem.position.y = 1.5;
    tg.add(stem);

    const bowl = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), goldDecoMat);
    bowl.position.y = 2.4;
    tg.add(bowl);

    jumbotronGroup.add(tg);
  };
  createTrophyCup(-screenW * 0.55);
  createTrophyCup(screenW * 0.55);

  // ─── 12. RICH THEME PARK SKY ARCHIPELAGO (ZERO EMPTY VOIDS) ─
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.65 });
  const rockCliffMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85 });
  const waterMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.88 });
  const roofRedMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.35 });
  const wallPastelMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.5 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });

  // 12.1 GIANT FLOATING DONUT OBSTACLE RING (North-West Sky, x = -36, z = -20, y = 15)
  const donutGroup = new THREE.Group();
  donutGroup.position.set(-36, 15, -20);
  donutGroup.rotation.set(0.3, 0.4, 0.2);

  const donutDoughMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.5 });
  const donutIcingMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.2, metalness: 0.1 });
  const donutGeo = new THREE.TorusGeometry(5.2, 1.6, 16, 32);
  const donutMesh = new THREE.Mesh(donutGeo, donutDoughMat);
  donutGroup.add(donutMesh);

  const icingGeo = new THREE.TorusGeometry(5.25, 1.62, 16, 32, Math.PI * 1.6);
  const icingMesh = new THREE.Mesh(icingGeo, donutIcingMat);
  donutGroup.add(icingMesh);

  // Candy Sprinkles on Donut
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

  // 12.2 GIANT FLOATING GOLDEN STAR CHAMPIONSHIP RING (East Sky, x = 36, z = 22, y = 16)
  const starRingGroup = new THREE.Group();
  starRingGroup.position.set(36, 16, 22);
  starRingGroup.rotation.set(-0.2, -0.5, 0.1);

  const starRingMesh = new THREE.Mesh(
    new THREE.TorusGeometry(5.0, 0.5, 12, 32),
    goldDecoMat
  );
  starRingGroup.add(starRingMesh);

  for (let s = 0; s < 5; s++) {
    const sAngle = (s / 5) * Math.PI * 2;
    const starCone = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 5), goldDecoMat);
    starCone.position.set(Math.cos(sAngle) * 5.0, Math.sin(sAngle) * 5.0, 0);
    starCone.rotation.z = sAngle - Math.PI / 2;
    starRingGroup.add(starCone);
  }
  root.add(starRingGroup);

  // 12.3 BOUNCY POLKA-DOT MUSHROOM ISLAND (South-West Sky, x = -30, z = 36, y = 6)
  const mushIsland = new THREE.Group();
  mushIsland.position.set(-30, 6, 36);
  root.add(mushIsland);

  const mushPlateau = new THREE.Mesh(new THREE.CylinderGeometry(11, 9, 2.5, 14), grassMat);
  mushIsland.add(mushPlateau);

  const mushCone = new THREE.Mesh(new THREE.ConeGeometry(9, 10, 12), rockCliffMat);
  mushCone.rotation.x = Math.PI;
  mushCone.position.y = -5;
  mushIsland.add(mushCone);

  // Giant Red Bouncy Mushroom
  const mushStem = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 4.0, 12), new THREE.MeshStandardMaterial({ color: 0xffedd5 }));
  mushStem.position.y = 2.0;
  mushIsland.add(mushStem);

  const mushCap = new THREE.Mesh(
    new THREE.SphereGeometry(3.6, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 })
  );
  mushCap.position.y = 3.6;
  mushIsland.add(mushCap);

  // White Polka Dots on Mushroom Cap
  for (let d = 0; d < 8; d++) {
    const dAngle = (d / 8) * Math.PI * 2;
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    dot.position.set(Math.cos(dAngle) * 2.5, 4.8, Math.sin(dAngle) * 2.5);
    dot.scale.set(1.0, 0.4, 1.0);
    mushIsland.add(dot);
  }

  // 2 Mini Bouncing Beans on Mushroom
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

  // 12.4 SWEEPING NEON ROLLERCOASTER RAILS (Connecting islands through the sky)
  const railPts: THREE.Vector3[] = [
    new THREE.Vector3(-44, 12, -15),
    new THREE.Vector3(-36, 18, 0),
    new THREE.Vector3(-28, 14, 25),
    new THREE.Vector3(0, 22, 45),
    new THREE.Vector3(32, 16, 25),
    new THREE.Vector3(42, 12, -10),
  ];
  const skyRailCurve = new THREE.CatmullRomCurve3(railPts);
  const skyRailGeo = new THREE.TubeGeometry(skyRailCurve, 64, 0.22, 8, false);
  const skyRailMesh = new THREE.Mesh(
    skyRailGeo,
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.8,
    })
  );
  root.add(skyRailMesh);

  // 12.5 16 PASTEL HORIZON MOUNTAIN PEAKS (Completely fills 360° horizon)
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

  // 12.6 WEST WINDMILL ISLAND (x = -44, z = 0, y = 2.0)
  const island1 = new THREE.Group();
  island1.position.set(-44, 2.0, 0);
  root.add(island1);

  const is1Plateau = new THREE.Mesh(new THREE.CylinderGeometry(14, 12, 3.2, 16), grassMat);
  is1Plateau.position.y = 1.6;
  is1Plateau.receiveShadow = true;
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

  for (const cx of [-4.5, 4.2]) {
    const cottage = new THREE.Group();
    cottage.position.set(cx, 3.2, cx < 0 ? -3 : 3);
    const house = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 2.8), wallPastelMat);
    house.position.y = 1.1;
    cottage.add(house);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.3, 1.6, 4), roofRedMat);
    roof.position.y = 3.0;
    roof.rotation.y = Math.PI / 4;
    cottage.add(roof);
    island1.add(cottage);
  }

  // 12.7 EAST CARNIVAL ISLAND (x = 44, z = 2, y = 2.0)
  const island2 = new THREE.Group();
  island2.position.set(44, 2.0, 2);
  root.add(island2);

  const is2Plateau = new THREE.Mesh(new THREE.CylinderGeometry(15, 13, 3.2, 16), grassMat);
  is2Plateau.position.y = 1.6;
  is2Plateau.receiveShadow = true;
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

  // Circus tents
  const tentColors = [0xf43f5e, 0x06b6d4];
  for (let t = 0; t < 2; t++) {
    const tent = new THREE.Mesh(
      new THREE.ConeGeometry(2.8, 3.6, 10),
      new THREE.MeshStandardMaterial({ color: tentColors[t], roughness: 0.4 })
    );
    tent.position.set(t === 0 ? -5 : 5, 5.0, t === 0 ? 4 : -4);
    island2.add(tent);
  }

  // 12.8 NORTH-WEST WATERFALL ISLAND (x = -48, z = -34, y = 5.0)
  const island3 = new THREE.Group();
  island3.position.set(-48, 5.0, -34);
  root.add(island3);

  const is3Plateau = new THREE.Mesh(new THREE.CylinderGeometry(15, 13, 3.5, 16), grassMat);
  is3Plateau.position.y = 1.75;
  island3.add(is3Plateau);

  const is3Cone = new THREE.Mesh(new THREE.ConeGeometry(13, 15, 14), rockCliffMat);
  is3Cone.rotation.x = Math.PI;
  is3Cone.position.y = -7.5;
  island3.add(is3Cone);

  for (const wfX of [-3.5, 3.5]) {
    const wf = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 16), waterMat);
    wf.position.set(wfX, -6.5, 12.8);
    island3.add(wf);
  }

  // Palm Trees on island 3
  const palmTrunkMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.9 });
  const palmLeafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });

  for (let p = 0; p < 4; p++) {
    const palm = new THREE.Group();
    palm.position.set((p - 1.5) * 4, 3.5, -2 + (p % 2) * 4);

    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 5.5, 7), palmTrunkMat);
    trunk.position.y = 2.75;
    trunk.rotation.z = (p % 2 === 0 ? 0.15 : -0.15);
    palm.add(trunk);

    for (let f = 0; f < 6; f++) {
      const frondAngle = (f / 6) * Math.PI * 2;
      const frond = new THREE.Mesh(new THREE.ConeGeometry(0.8, 3.6, 4), palmLeafMat);
      frond.position.set(Math.cos(frondAngle) * 1.8, 5.2, Math.sin(frondAngle) * 1.8);
      frond.rotation.set(0.6 * Math.sin(frondAngle), frondAngle, 0.6 * Math.cos(frondAngle));
      palm.add(frond);
    }
    island3.add(palm);
  }

  // 12.9 SOUTH-EAST CRYSTAL SPIRE ISLAND (x = 48, z = 34, y = 5.0)
  const island4 = new THREE.Group();
  island4.position.set(48, 5.0, 34);
  root.add(island4);

  const is4Plateau = new THREE.Mesh(new THREE.CylinderGeometry(14, 12, 3.2, 16), grassMat);
  is4Plateau.position.y = 1.6;
  island4.add(is4Plateau);

  const is4Cone = new THREE.Mesh(new THREE.ConeGeometry(12, 14, 14), rockCliffMat);
  is4Cone.rotation.x = Math.PI;
  is4Cone.position.y = -7;
  island4.add(is4Cone);

  const crystalMatCyan = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.5,
    roughness: 0.1,
    metalness: 0.8,
  });
  const crystalMatPurple = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    emissive: 0xa855f7,
    emissiveIntensity: 0.5,
    roughness: 0.1,
    metalness: 0.8,
  });

  for (let c = 0; c < 6; c++) {
    const angle = (c / 6) * Math.PI * 2;
    const cryGeo = new THREE.ConeGeometry(0.8, 4.5 + (c % 3) * 1.5, 6);
    const cry = new THREE.Mesh(cryGeo, c % 2 === 0 ? crystalMatCyan : crystalMatPurple);
    cry.position.set(Math.cos(angle) * 4.5, 4.0, Math.sin(angle) * 4.5);
    cry.rotation.set(0.2 * Math.sin(angle), 0, 0.2 * Math.cos(angle));
    island4.add(cry);
  }

  // 12.10 SOUTH DISTANT CASTLE ISLAND (x = 0, z = 62, y = 1.0)
  const island5 = new THREE.Group();
  island5.position.set(0, 1.0, 62);
  root.add(island5);

  const is5Plateau = new THREE.Mesh(new THREE.CylinderGeometry(18, 16, 4, 18), grassMat);
  is5Plateau.position.y = 2.0;
  island5.add(is5Plateau);

  const is5Cone = new THREE.Mesh(new THREE.ConeGeometry(16, 18, 16), rockCliffMat);
  is5Cone.rotation.x = Math.PI;
  is5Cone.position.y = -9;
  island5.add(is5Cone);

  const castleWallMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4 });
  const castleKeep = new THREE.Mesh(new THREE.BoxGeometry(8, 7, 8), castleWallMat);
  castleKeep.position.y = 5.5;
  island5.add(castleKeep);

  for (const cx of [-4, 4]) {
    for (const cz of [-4, 4]) {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 11, 10), castleWallMat);
      tower.position.set(cx, 7.5, cz);
      island5.add(tower);

      const spire = new THREE.Mesh(new THREE.ConeGeometry(1.6, 4.5, 10), roofRedMat);
      spire.position.set(cx, 15, cz);
      island5.add(spire);
    }
  }

  const rainbowMat = new THREE.MeshBasicMaterial({ color: 0xffd166, side: THREE.DoubleSide });
  const rainbowArch = new THREE.Mesh(new THREE.TorusGeometry(8, 0.6, 8, 24, Math.PI), rainbowMat);
  rainbowArch.position.set(12, 4, 0);
  island5.add(rainbowArch);

  // ─── 13. MATCH BROADCAST CAMERA DRONE ─────────────────
  const droneGroup = new THREE.Group();
  droneGroup.position.set(12, 7.5, -4);
  root.add(droneGroup);

  const droneBodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 });
  const droneBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 1.2), droneBodyMat);
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
    const dArm = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6), droneBodyMat);
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

  // ─── 14. SPECTATOR AIRSHIP & STRIPED HOT AIR BALLOONS ─
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

    const bandGeo = new THREE.CylinderGeometry(4.45, 4.45, 1.2, 16);
    const band = new THREE.Mesh(
      bandGeo,
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

  createBalloon(0.4, 52, 16, 0xf43f5e, 0xfbbf24);
  createBalloon(2.2, 56, 22, 0x06b6d4, 0xffffff);
  createBalloon(3.8, 50, 18, 0x8b5cf6, 0xfde047);
  createBalloon(5.2, 54, 14, 0x10b981, 0xffffff);

  // Sleek Spectator Zeppelin
  const blimpGroup = new THREE.Group();
  const blimpHullMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.25, metalness: 0.3 });
  const blimpWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

  const hullGeo = new THREE.SphereGeometry(3.6, 18, 14);
  hullGeo.scale(1.0, 1.0, 3.2);
  const hull = new THREE.Mesh(hullGeo, blimpHullMat);
  blimpGroup.add(hull);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(7.3, 0.8, 20), blimpWhiteMat);
  blimpGroup.add(stripe);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 5.0), blimpWhiteMat);
  cabin.position.y = -3.8;
  blimpGroup.add(cabin);

  const windowStrip = new THREE.Mesh(
    new THREE.BoxGeometry(1.65, 0.4, 4.4),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
  );
  windowStrip.position.y = -3.8;
  blimpGroup.add(windowStrip);

  for (const rz of [0, Math.PI / 2]) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5.5, 2.6), blimpWhiteMat);
    fin.position.set(0, 0, -9.5);
    fin.rotation.z = rz;
    blimpGroup.add(fin);
  }

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
    orbitDist: 66,
    orbitSpeed: 0.014,
  });

  // ─── 15. MIDFIELD HAZARD SWEEPERS ON ELEVATED PLATEAU ──
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

  // ─── 16. CELEBRATION CONFETTI CANNONS ─────────────────
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

  function update(dt: number, time: number) {
    // 1. Scroll LED Ribbon Boards
    ribbonTex.offset.x -= dt * 0.12;

    // 2. Rotate Windmill Blades
    windmillBlades.rotation.z += dt * 0.9;

    // 3. Rotate Ferris Wheel & Keep Gondolas Vertically Upright
    ferrisWheelRotor.rotation.z += dt * 0.35;
    for (const g of gondolaMeshes) {
      g.rotation.z = -ferrisWheelRotor.rotation.z;
    }

    // 4. Rotate Crown on South Arch
    crownGroup.rotation.y = time * 0.8;

    // 5. Rotate Floating Donut & Star Ring
    donutGroup.rotation.z += dt * 0.4;
    starRingGroup.rotation.z -= dt * 0.3;

    // 6. Animate Giant Fall Guys Mascots (Left & Right Sidelines)
    for (let mIdx = 0; mIdx < giantMascots.length; mIdx++) {
      const gm = giantMascots[mIdx];
      const breathing = Math.sin(time * 2.2 + mIdx * 1.5) * 0.08;
      gm.group.position.y = gm.baseY + breathing;
      gm.arm.rotation.z = Math.sin(time * 3.5 + mIdx * 2.0) * 0.22;
    }

    // 7. Animate Mini Beans Bouncing on Mushroom Island
    for (let mb = 0; mb < miniBeans.length; mb++) {
      const minB = miniBeans[mb];
      const bounceH = Math.abs(Math.sin(time * 5.0 + minB.phase)) * 0.8;
      minB.mesh.position.y = minB.baseY + bounceH;
    }

    // 8. Orbit Airships & Hot Air Balloons with subtle parallax
    for (const p of orbitProps) {
      p.orbitAngle += p.orbitSpeed * dt;
      p.mesh.position.set(
        Math.cos(p.orbitAngle) * p.orbitDist,
        p.baseY + Math.sin(time * 0.6 + p.orbitAngle) * 0.9,
        Math.sin(p.orbitAngle) * p.orbitDist
      );
      p.mesh.rotation.y = -p.orbitAngle + Math.PI / 2;
    }

    // Spin blimp propellers
    for (const bp of blimpProps) {
      bp.rotation.z += dt * 18;
    }

    // 9. Animate Camera Drone
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

    // 10. Rotate Sweepers
    for (let i = 0; i < sweepers.length; i++) {
      sweepers[i].angle += sweepers[i].rotSpeed * dt;
      sweeperGroups[i].rotation.y = sweepers[i].angle;
    }

    // 11. Animate 350 Fall Guys Spectators & Faceplates
    if (goalCelebTimer > 0) goalCelebTimer -= dt;
    for (let i = 0; i < specData.length; i++) {
      const s = specData[i];
      let bob = Math.sin(time * s.speed + s.phase) * 0.08;
      if (goalCelebTimer > 0) {
        bob += Math.abs(Math.sin(time * 14 + s.phase)) * 0.55;
      }

      // Bean body
      dummy.position.copy(s.base);
      dummy.position.y += bob;
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      specMesh.setMatrixAt(i, dummy.matrix);

      // White faceplate (follows bean bobbing exactly)
      const fX = s.base.x + (s.side < 0 ? 0.23 : -0.23);
      const fY = s.base.y + 0.12 + bob;
      faceDummy.position.set(fX, fY, s.base.z);
      faceDummy.rotation.set(0, s.side < 0 ? Math.PI / 2 : -Math.PI / 2, 0);
      faceDummy.updateMatrix();
      faceMesh.setMatrixAt(i, faceDummy.matrix);
    }
    specMesh.instanceMatrix.needsUpdate = true;
    faceMesh.instanceMatrix.needsUpdate = true;

    // 12. Confetti Fluttering
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

  function onGoalCelebration(_team: number) {
    goalCelebTimer = 3.5;
  }

  function dispose() {
    scene.remove(root);
  }

  return { update, onGoalCelebration, sweeperArms: sweepers, floorMesh, dispose };
}
