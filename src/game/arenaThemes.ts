/**
 * BOUNCEBACK! — 5-Round Map Biomes & Dynamic Arena Themes
 *
 * Provides dedicated procedural skyboxes, pitch textures, atmospheric lighting,
 * and physical interactive obstacles for each of the 5 Championship Rounds:
 * - Round 1: Sunny Grand Colosseum
 * - Round 2: Sunset Neon Speedway (2 Sideline Conveyor Belts)
 * - Round 3: Thunderstorm Chasm (Slick Drift Turf & Lightning Strobe)
 * - Round 4: Cyberpunk Pinball Arcade (8 Supersonic Bumpers + 4 Jump Pads)
 * - Round 5: Midnight Cosmic Final (Grand Champion Porcelain & Singularity Core)
 */
import * as THREE from "three";
import * as C from "./config";
import { getArenaHeight } from "./arenaHeight";

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

// ─── 1. PROCEDURAL 360° SKYBOX TEXTURES ─────────────────────────────────────
export function createSkyTexture(roundNumber: number): THREE.CanvasTexture {
  return makeCanvasTex(2048, 1024, (ctx) => {
    if (roundNumber === 1) {
      // Round 1: Sunny Grand Colosseum (Crisp daytime blue & golden sunshine)
      const g = ctx.createLinearGradient(0, 0, 0, 1024);
      g.addColorStop(0.00, "#0284c7");
      g.addColorStop(0.35, "#38bdf8");
      g.addColorStop(0.68, "#7dd3fc");
      g.addColorStop(0.88, "#bae6fd");
      g.addColorStop(0.96, "#fef08a");
      g.addColorStop(1.00, "#fde68a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 2048, 1024);

      // Warm Sunburst
      const sunGrad = ctx.createRadialGradient(1024, 240, 10, 1024, 240, 280);
      sunGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
      sunGrad.addColorStop(0.18, "rgba(254, 240, 138, 0.95)");
      sunGrad.addColorStop(0.45, "rgba(253, 224, 71, 0.4)");
      sunGrad.addColorStop(1.0, "rgba(253, 224, 71, 0.0)");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(1024, 240, 280, 0, Math.PI * 2);
      ctx.fill();

      // Fluffy white cartoon clouds
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
    } else if (roundNumber === 2) {
      // Round 2: Sunset Neon Speedway (Twilight magenta, radiant orange & amber glow)
      const g = ctx.createLinearGradient(0, 0, 0, 1024);
      g.addColorStop(0.00, "#3b0764");
      g.addColorStop(0.25, "#701a75");
      g.addColorStop(0.55, "#c2410c");
      g.addColorStop(0.78, "#ea580c");
      g.addColorStop(0.92, "#f59e0b");
      g.addColorStop(1.00, "#fde047");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 2048, 1024);

      // Giant Twilight Sun
      const sunGrad = ctx.createRadialGradient(1024, 600, 20, 1024, 600, 340);
      sunGrad.addColorStop(0.0, "rgba(254, 240, 138, 1.0)");
      sunGrad.addColorStop(0.3, "rgba(249, 115, 22, 0.8)");
      sunGrad.addColorStop(0.7, "rgba(236, 72, 153, 0.3)");
      sunGrad.addColorStop(1.0, "rgba(112, 26, 117, 0.0)");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(1024, 600, 340, 0, Math.PI * 2);
      ctx.fill();

      // Silhouetted speedway skyline clouds
      ctx.fillStyle = "rgba(88, 28, 135, 0.45)";
      for (let i = 0; i < 20; i++) {
        const cx = (i / 20) * 2048 + 20;
        const cy = 720 + ((i * 29) % 70);
        ctx.beginPath();
        ctx.ellipse(cx, cy, 140, 45, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (roundNumber === 3) {
      // Round 3: Thunderstorm Chasm (Menacing stormclouds, deep charcoal & violet thunder)
      const g = ctx.createLinearGradient(0, 0, 0, 1024);
      g.addColorStop(0.00, "#030712");
      g.addColorStop(0.30, "#0f172a");
      g.addColorStop(0.60, "#1e1b4b");
      g.addColorStop(0.85, "#312e81");
      g.addColorStop(1.00, "#1e293b");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 2048, 1024);

      // Volumetric ominous storm clouds
      ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
      for (let i = 0; i < 30; i++) {
        const cx = (i / 30) * 2048;
        const cy = 350 + ((i * 53) % 250);
        const cr = 120 + ((i * 31) % 110);
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.arc(cx + cr * 0.8, cy - cr * 0.2, cr * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Distant atmospheric lightning veins
      ctx.strokeStyle = "rgba(165, 180, 252, 0.35)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(600, 100);
      ctx.lineTo(630, 240);
      ctx.lineTo(610, 310);
      ctx.lineTo(660, 460);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(1500, 80);
      ctx.lineTo(1470, 220);
      ctx.lineTo(1510, 330);
      ctx.lineTo(1480, 500);
      ctx.stroke();
    } else if (roundNumber === 4) {
      // Round 4: Cyberpunk Pinball Arcade (Retro-futuristic neon laser grid)
      const g = ctx.createLinearGradient(0, 0, 0, 1024);
      g.addColorStop(0.00, "#030712");
      g.addColorStop(0.40, "#180424");
      g.addColorStop(0.70, "#3b0764");
      g.addColorStop(0.90, "#831843");
      g.addColorStop(1.00, "#be185d");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 2048, 1024);

      // Neon horizon laser wireframe grid
      ctx.strokeStyle = "rgba(236, 72, 153, 0.4)";
      ctx.lineWidth = 2;
      for (let y = 700; y < 1024; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(2048, y);
        ctx.stroke();
      }
      for (let x = 0; x < 2048; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, 700);
        ctx.lineTo(x, 1024);
        ctx.stroke();
      }

      // Neon Synthwave Sun
      const synthGrad = ctx.createLinearGradient(1024, 400, 1024, 750);
      synthGrad.addColorStop(0.0, "#f43f5e");
      synthGrad.addColorStop(0.5, "#ec4899");
      synthGrad.addColorStop(1.0, "#fbbf24");
      ctx.fillStyle = synthGrad;
      ctx.beginPath();
      ctx.arc(1024, 575, 180, Math.PI, 0);
      ctx.fill();
    } else {
      // Round 5: Midnight Cosmic Final (Grand deep-space galaxy with golden nebulae)
      const g = ctx.createLinearGradient(0, 0, 0, 1024);
      g.addColorStop(0.00, "#020617");
      g.addColorStop(0.35, "#0b0f19");
      g.addColorStop(0.70, "#17122e");
      g.addColorStop(0.90, "#2a1548");
      g.addColorStop(1.00, "#3e1e68");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 2048, 1024);

      // Cosmic Nebula Clouds (Golden & Cyan stardust)
      const neb1 = ctx.createRadialGradient(500, 400, 20, 500, 400, 450);
      neb1.addColorStop(0.0, "rgba(251, 191, 36, 0.4)");
      neb1.addColorStop(0.4, "rgba(217, 70, 239, 0.2)");
      neb1.addColorStop(1.0, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = neb1;
      ctx.beginPath();
      ctx.arc(500, 400, 450, 0, Math.PI * 2);
      ctx.fill();

      const neb2 = ctx.createRadialGradient(1600, 350, 30, 1600, 350, 500);
      neb2.addColorStop(0.0, "rgba(34, 211, 238, 0.35)");
      neb2.addColorStop(0.5, "rgba(168, 85, 247, 0.15)");
      neb2.addColorStop(1.0, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = neb2;
      ctx.beginPath();
      ctx.arc(1600, 350, 500, 0, Math.PI * 2);
      ctx.fill();

      // Sparkling Starfield (hundreds of multi-sized stars)
      ctx.fillStyle = "#ffffff";
      for (let s = 0; s < 280; s++) {
        const sx = ((s * 137.5) % 2048);
        const sy = ((s * 93.1) % 850);
        const sr = (s % 3 === 0) ? 2.5 : (s % 2 === 0) ? 1.5 : 0.9;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

// ─── 2. PROCEDURAL ARENA FLOOR TEXTURES ─────────────────────────────────────
export function createFloorTexture(roundNumber: number): THREE.CanvasTexture {
  return makeCanvasTex(2048, 4096, (ctx) => {
    const W = 2048;
    const H = 4096;

    if (roundNumber === 1) {
      // Round 1: Lush Striped Olympic Turf
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0.0, "#083344");
      g.addColorStop(0.12, "#0d9488");
      g.addColorStop(0.5, "#14b8a6");
      g.addColorStop(0.88, "#0d9488");
      g.addColorStop(1.0, "#083344");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Lawn mowed alternating athletic stripes
      const stripeH = 128;
      for (let y = 0; y < H; y += stripeH * 2) {
        ctx.fillStyle = "rgba(20, 184, 166, 0.22)";
        ctx.fillRect(0, y, W, stripeH);
      }

      // Crisp White Pitch Lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = 24;
      ctx.strokeRect(120, 120, W - 240, H - 240);

      // Center Field Circle & Line
      ctx.beginPath();
      ctx.moveTo(120, H / 2);
      ctx.lineTo(W - 120, H / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 340, 0, Math.PI * 2);
      ctx.stroke();

      // Center golden star
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 45, 0, Math.PI * 2);
      ctx.fill();
    } else if (roundNumber === 2) {
      // Round 2: Sunset Neon Speedway (Asphalt track with vibrant neon chevron lanes)
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, W, H);

      // Asphalt texture grain
      ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
      for (let y = 0; y < H; y += 8) {
        ctx.fillRect(0, y, W, 2);
      }

      // Cyan & Coral Outer Speed Lanes
      ctx.fillStyle = "rgba(6, 182, 212, 0.18)";
      ctx.fillRect(100, 120, 240, H - 240); // West lane
      ctx.fillStyle = "rgba(244, 63, 94, 0.18)";
      ctx.fillRect(W - 340, 120, 240, H - 240); // East lane

      // Glowing Neon Boundary Lines
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.moveTo(340, 120);
      ctx.lineTo(340, H - 120);
      ctx.stroke();

      ctx.strokeStyle = "#ff3366";
      ctx.beginPath();
      ctx.moveTo(W - 340, 120);
      ctx.lineTo(W - 340, H - 120);
      ctx.stroke();

      // Speedway Chevrons on Sidelines
      ctx.fillStyle = "#facc15";
      for (let y = 200; y < H - 200; y += 180) {
        // West Arrows pointing South
        ctx.beginPath();
        ctx.moveTo(220, y);
        ctx.lineTo(160, y + 40);
        ctx.lineTo(190, y + 40);
        ctx.lineTo(220, y + 70);
        ctx.lineTo(250, y + 40);
        ctx.lineTo(280, y + 40);
        ctx.closePath();
        ctx.fill();

        // East Arrows pointing North
        ctx.beginPath();
        ctx.moveTo(W - 220, y + 70);
        ctx.lineTo(W - 160, y + 30);
        ctx.lineTo(W - 190, y + 30);
        ctx.lineTo(W - 220, y);
        ctx.lineTo(W - 250, y + 30);
        ctx.lineTo(W - 280, y + 30);
        ctx.closePath();
        ctx.fill();
      }

      // Checkered Centerline
      const chSize = 32;
      for (let x = 340; x < W - 340; x += chSize) {
        const isBlack = (Math.floor(x / chSize) % 2 === 0);
        ctx.fillStyle = isBlack ? "#ffffff" : "#18181b";
        ctx.fillRect(x, H / 2 - 16, chSize, 32);
      }
    } else if (roundNumber === 3) {
      // Round 3: Thunderstorm Chasm (Slick dark wet asphalt/ice with rain puddles)
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0.0, "#020617");
      g.addColorStop(0.3, "#0f172a");
      g.addColorStop(0.5, "#1e293b");
      g.addColorStop(0.7, "#0f172a");
      g.addColorStop(1.0, "#020617");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Slick wet gloss puddles
      ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
      for (let p = 0; p < 18; p++) {
        const px = 300 + ((p * 277) % (W - 600));
        const py = 400 + ((p * 491) % (H - 800));
        const pr = 120 + ((p * 37) % 140);
        ctx.beginPath();
        ctx.ellipse(px, py, pr, pr * 0.55, (p * 0.4), 0, Math.PI * 2);
        ctx.fill();
      }

      // Yellow/Black Hazard Caution Stripes around perimeter
      ctx.lineWidth = 26;
      ctx.strokeStyle = "#eab308";
      ctx.strokeRect(140, 140, W - 280, H - 280);

      // Hazard Warning Text
      ctx.fillStyle = "#eab308";
      ctx.font = '900 68px "Arial Black", Impact, sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("! CAUTION: SLIPPERY DRIFT TURF !", W / 2, H / 2 - 120);
      ctx.fillText("! ROTATING HAZARD BLADE ACTIVE !", W / 2, H / 2 + 150);
    } else if (roundNumber === 4) {
      // Round 4: Cyberpunk Pinball Arcade (Retro-Tron dark neon grid floor)
      ctx.fillStyle = "#05050a";
      ctx.fillRect(0, 0, W, H);

      // Neon Magenta & Cyan Grid
      const gridSize = 96;
      ctx.strokeStyle = "rgba(236, 72, 153, 0.28)";
      ctx.lineWidth = 4;
      for (let x = 0; x <= W; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Glowing Pinball Target Rings
      const targetLocations = [
        { x: W * 0.3, y: H * 0.25 },
        { x: W * 0.7, y: H * 0.25 },
        { x: W * 0.3, y: H * 0.75 },
        { x: W * 0.7, y: H * 0.75 },
        { x: W * 0.5, y: H * 0.5 },
      ];

      for (const t of targetLocations) {
        ctx.strokeStyle = "#00f0ff";
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 160, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = "#ec4899";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 110, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#ffd166";
        ctx.font = '900 48px "Arial Black", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("500 PTS", t.x, t.y);
      }
    } else {
      // Round 5: Midnight Cosmic Final (Grand Championship Royal White & Gold Court)
      ctx.fillStyle = "#f8fafc"; // Polished porcelain white
      ctx.fillRect(0, 0, W, H);

      // Marble subtle veining
      ctx.fillStyle = "rgba(226, 232, 240, 0.6)";
      for (let m = 0; m < 35; m++) {
        const mx = (m * 179) % W;
        const my = (m * 347) % H;
        ctx.fillRect(mx, my, 220, 14);
      }

      // Solid Rich Gold Inlay Lines
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 32;
      ctx.strokeRect(140, 140, W - 280, H - 280);

      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 18;
      ctx.strokeRect(170, 170, W - 340, H - 340);

      // Giant Center Court Grand Champion Emblem
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 24;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 420, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 380, 0, Math.PI * 2);
      ctx.stroke();

      // Center Court Text
      ctx.fillStyle = "#1e1b4b";
      ctx.font = '900 76px "Outfit", sans-serif';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("GRAND CHAMPIONSHIP FINAL", W / 2, H / 2);
    }
  });
}

// ─── 3. ROUND-SPECIFIC PHYSICAL OBSTACLE GROUPS ─────────────────────────────

/**
 * Map 2: Dual Sideline Speed Conveyor Belts
 */
export function createSpeedwayBelts(root: THREE.Group) {
  const group = new THREE.Group();
  group.name = "Map2_SpeedwayObstacles";
  group.visible = false;

  const beltMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.3,
    metalness: 0.6,
  });

  const arrowMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
  });

  // West & East Belts
  const beltLength = 44;
  const beltWidth = 3.2;
  const beltGeo = new THREE.BoxGeometry(beltWidth, 0.12, beltLength);

  for (const side of [-1, 1]) {
    const beltX = side * 13.2;
    const belt = new THREE.Mesh(beltGeo, beltMat);
    const bY = getArenaHeight(beltX, 0);
    belt.position.set(beltX, bY + 0.04, 0);
    belt.receiveShadow = true;
    group.add(belt);

    // Glowing animated chevron markers
    for (let z = -20; z <= 20; z += 4) {
      const chevronGeo = new THREE.ConeGeometry(0.7, 1.4, 3);
      chevronGeo.rotateX(side > 0 ? Math.PI : 0);
      const chevron = new THREE.Mesh(chevronGeo, arrowMat);
      chevron.rotation.x = -Math.PI / 2;
      chevron.position.set(beltX, bY + 0.11, z);
      group.add(chevron);
    }
  }

  root.add(group);

  const conveyorBelts = [
    { x: -13.2, zMin: -22, zMax: 22, width: 3.2, directionZ: -1, speed: 16 },
    { x: 13.2, zMin: -22, zMax: 22, width: 3.2, directionZ: 1, speed: 16 },
  ];

  return {
    group,
    conveyorBelts,
    update: (dt: number, time: number) => {
      arrowMat.color.setHex((Math.sin(time * 6) > 0) ? 0x38bdf8 : 0x06b6d4);
    },
  };
}

/**
 * Map 3: Stormland Lightning Flash & Slick Ice Puddle Markers
 */
export function createStormlandFeatures(root: THREE.Group) {
  const group = new THREE.Group();
  group.name = "Map3_StormlandFeatures";
  group.visible = false;

  // Full-arena lightning strobe light
  const lightningLight = new THREE.DirectionalLight(0xe0e7ff, 0.0);
  lightningLight.position.set(0, 50, 0);
  group.add(lightningLight);

  root.add(group);

  let nextFlashTime = 6.0;
  let flashDuration = 0;

  return {
    group,
    triggerLightning: () => {
      lightningLight.intensity = 4.5;
      flashDuration = 0.22;
    },
    update: (dt: number, _time: number) => {
      if (flashDuration > 0) {
        flashDuration -= dt;
        lightningLight.intensity = (flashDuration / 0.22) * 4.5;
        if (flashDuration <= 0) lightningLight.intensity = 0;
      } else {
        nextFlashTime -= dt;
        if (nextFlashTime <= 0) {
          nextFlashTime = 7.0 + Math.random() * 8.0;
          flashDuration = 0.22;
          lightningLight.intensity = 4.5;
        }
      }
    },
  };
}

/**
 * Map 4: Cyberpunk Pinball Supersonic Bumpers & Jump Pads
 */
export function createPinballJumpPads(root: THREE.Group) {
  const group = new THREE.Group();
  group.name = "Map4_PinballObstacles";
  group.visible = false;

  const padGeo = new THREE.CylinderGeometry(1.4, 1.6, 0.16, 24);
  const padMat = new THREE.MeshStandardMaterial({
    color: 0x180424,
    roughness: 0.2,
    metalness: 0.8,
  });

  const neonRingMat = new THREE.MeshBasicMaterial({
    color: 0xec4899,
  });

  const jumpPadConfigs = [
    { x: -6.5, z: -10, impulseY: 20, impulseZ: 8 },
    { x: 6.5, z: -10, impulseY: 20, impulseZ: 8 },
    { x: -6.5, z: 10, impulseY: 20, impulseZ: -8 },
    { x: 6.5, z: 10, impulseY: 20, impulseZ: -8 },
  ];

  for (const pc of jumpPadConfigs) {
    const pMesh = new THREE.Mesh(padGeo, padMat);
    const bH = getArenaHeight(pc.x, pc.z);
    pMesh.position.set(pc.x, bH + 0.08, pc.z);
    group.add(pMesh);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.08, 8, 24), neonRingMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(pc.x, bH + 0.18, pc.z);
    group.add(ring);
  }

  root.add(group);

  return {
    group,
    jumpPads: jumpPadConfigs.map(c => ({ x: c.x, z: c.z, radius: 1.6, impulseY: c.impulseY, impulseZ: c.impulseZ })),
    update: (_dt: number, time: number) => {
      neonRingMat.color.setHex((Math.sin(time * 8) > 0) ? 0xec4899 : 0x00f0ff);
    },
  };
}

/**
 * Map 5: Midnight Cosmic Singularity Core (Active in final 30s)
 */
export function createCosmicSingularity(root: THREE.Group) {
  const group = new THREE.Group();
  group.name = "Map5_CosmicSingularity";
  group.visible = false;

  const coreGroup = new THREE.Group();
  coreGroup.position.set(0, getArenaHeight(0, 0) + 0.05, 0);

  const ring1 = new THREE.Mesh(
    new THREE.RingGeometry(2.4, 3.2, 36),
    new THREE.MeshBasicMaterial({ color: 0xffd166, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
  );
  ring1.rotation.x = -Math.PI / 2;
  coreGroup.add(ring1);

  const ring2 = new THREE.Mesh(
    new THREE.RingGeometry(3.6, 4.2, 36),
    new THREE.MeshBasicMaterial({ color: 0x8b5cf6, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
  );
  ring2.rotation.x = -Math.PI / 2;
  coreGroup.add(ring2);

  group.add(coreGroup);
  root.add(group);

  let vortexActive = false;

  return {
    group,
    setVortexActive: (active: boolean) => {
      vortexActive = active;
      ring1.scale.setScalar(active ? 1.4 : 1.0);
    },
    isVortexActive: () => vortexActive,
    update: (dt: number, time: number) => {
      ring1.rotation.z += dt * (vortexActive ? 4.5 : 1.2);
      ring2.rotation.z -= dt * (vortexActive ? 3.5 : 0.9);
      if (vortexActive) {
        ring1.position.y = 0.05 + Math.sin(time * 12) * 0.08;
      }
    },
  };
}
