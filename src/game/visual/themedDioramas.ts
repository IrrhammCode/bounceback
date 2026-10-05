/**
 * BOUNCEBACK! — 5 Kado 3D Perimeter Dioramas (Full Three.js + Tripo Assets)
 *
 * For Tripothon: "Build a world as a Gift"
 * Provides razor-sharp, Ultra-HD 3D diorama environments around the stadium perimeter:
 * - Round 1: Kamar Masa Kecil (Grand toy bookshelf, giant teddy bear, retro tin robot, hanging mobile, blocks, planes)
 * - Round 2: Kota Mainan (Cardboard towers with glowing windows, toy construction crane, train cars)
 * - Round 3: Layangan Sore (Floating grassy knolls, picket fences, 3D flying Indonesian kites with tails)
 * - Round 4: Pasar Malam (Rotating neon Ferris wheel, Indonesian gerobak cart, circus awnings, festive bulbs)
 * - Round 5: Atap Penuh Bintang (Grand illuminated city skyline, giant glowing crescent moon in frame, champion dais, stars)
 *
 * Optimized so every element is directly in the camera's eye line (X = -20 to +20, Z = +32 to +50, Y = 0 to 16)
 * without ever clipping the gameplay camera!
 */
import * as THREE from "three";
import { makeToon } from "./toon";
import { getLoadedGLTF, loadGLTF, MODEL_PATHS } from "./assets";

export interface ThemedDioramaManager {
  root: THREE.Group;
  setTheme: (roundNumber: number) => void;
  update: (dt: number, time: number) => void;
  dispose: () => void;
}

// ─── HELPER: Canvas Texture Generator ────────────────────────────────────────
function createLabelCanvas(
  text: string,
  bgColor: string,
  textColor: string,
  subText?: string,
  w = 256,
  h = 256
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  ctx.fillStyle = textColor;
  ctx.font = `900 ${Math.floor(h * 0.48)}px Outfit, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, subText ? h * 0.42 : h / 2);

  if (subText) {
    ctx.font = `800 ${Math.floor(h * 0.16)}px Outfit, sans-serif`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText(subText, w / 2, h * 0.78);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// ─── HELPER: Kite Texture Generator ──────────────────────────────────────────
function createKiteCanvas(style: "stripes" | "diamond" | "sunburst", colorA: string, colorB: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = colorA;
  ctx.fillRect(0, 0, 512, 512);

  if (style === "stripes") {
    ctx.fillStyle = colorB;
    for (let x = 0; x < 512; x += 64) {
      ctx.fillRect(x, 0, 32, 512);
    }
  } else if (style === "diamond") {
    ctx.fillStyle = colorB;
    ctx.beginPath();
    ctx.moveTo(256, 30);
    ctx.lineTo(480, 256);
    ctx.lineTo(256, 480);
    ctx.lineTo(32, 256);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = colorB;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(256, 256);
      const a1 = (i / 8) * Math.PI * 2;
      const a2 = ((i + 0.5) / 8) * Math.PI * 2;
      ctx.arc(256, 256, 360, a1, a2);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.strokeStyle = "rgba(70, 30, 10, 0.7)";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.moveTo(0, 200);
  ctx.lineTo(512, 200);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createThemedPerimeterDioramas(parent: THREE.Group): ThemedDioramaManager {
  const root = new THREE.Group();
  root.name = "ThemedPerimeterDioramas";
  parent.add(root);

  // Groups for each round
  const groups: THREE.Group[] = [];
  for (let i = 1; i <= 5; i++) {
    const g = new THREE.Group();
    g.name = `Diorama_Round_${i}`;
    g.visible = i === 1;
    root.add(g);
    groups.push(g);
  }

  const updaters: ((dt: number, time: number) => void)[] = [];

  const placeTripoModel = (
    modelKey: keyof typeof MODEL_PATHS,
    targetGroup: THREE.Group,
    pos: THREE.Vector3,
    rot: THREE.Euler,
    scale: number
  ) => {
    const attach = (scene: THREE.Group) => {
      const clone = scene.clone(true);
      clone.position.copy(pos);
      clone.rotation.copy(rot);
      clone.scale.setScalar(scale);
      clone.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      targetGroup.add(clone);
    };

    const preloaded = getLoadedGLTF(modelKey as string);
    if (preloaded?.scene) {
      attach(preloaded.scene);
    } else {
      loadGLTF(MODEL_PATHS[modelKey]).then((gltf) => {
        if (gltf?.scene) attach(gltf.scene);
      }).catch(() => {});
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // ─── ROUND 1: KAMAR MASA KECIL (Cozy Childhood Bedroom Diorama) ─────────────
  // ════════════════════════════════════════════════════════════════════════════
  {
    const r1 = groups[0];

    // 1. GRAND CHILDHOOD TOY BOOKSHELF & WALL UNIT (Z = +40, X = -22 to +22)
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(0, 0, 40);

    const woodShelfMat = makeToon({ color: 0x9a3412 }); // Warm cedar/pine
    const woodBackMat = makeToon({ color: 0x7c2d12 });

    // Back wall panel of bookshelf
    const backPanel = new THREE.Mesh(new THREE.BoxGeometry(40, 14, 0.4), woodBackMat);
    backPanel.position.set(0, 7, 1.2);
    shelfGroup.add(backPanel);

    // Outer frame (Top, Bottom, Left, Right)
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(40.4, 0.6, 2.8), woodShelfMat);
    topBar.position.set(0, 14, 0);
    const bottomBar = new THREE.Mesh(new THREE.BoxGeometry(40.4, 0.8, 2.8), woodShelfMat);
    bottomBar.position.set(0, 0.4, 0);
    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 14, 2.8), woodShelfMat);
    sideL.position.set(-20, 7, 0);
    const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 14, 2.8), woodShelfMat);
    sideR.position.set(20, 7, 0);
    shelfGroup.add(topBar, bottomBar, sideL, sideR);

    // Horizontal Shelves
    const shelfY = [4.5, 9.0];
    for (const sy of shelfY) {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(39.6, 0.4, 2.6), woodShelfMat);
      sh.position.set(0, sy, 0);
      shelfGroup.add(sh);
    }

    // Vertical Dividers
    const divX = [-10, 0, 10];
    for (const dx of divX) {
      const div = new THREE.Mesh(new THREE.BoxGeometry(0.5, 13.6, 2.6), woodShelfMat);
      div.position.set(dx, 7, 0);
      shelfGroup.add(div);
    }

    // --- SHELF CONTENTS (Directly visible to gameplay camera) ---

    // A. Multi-colored Storybooks on Shelf 1 (Y = 4.7)
    const bookColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xec4899];
    const placeBookRow = (startX: number, count: number, yLevel: number) => {
      for (let b = 0; b < count; b++) {
        const h = 2.4 + (b % 3) * 0.3;
        const bookMat = makeToon({ color: bookColors[(b + count) % bookColors.length] });
        const book = new THREE.Mesh(new THREE.BoxGeometry(0.4, h, 1.8), bookMat);
        book.position.set(startX + b * 0.48, yLevel + h / 2, 0);
        if (b === count - 1) book.rotation.z = -0.22; // Leaning book
        shelfGroup.add(book);
      }
    };
    placeBookRow(-19, 14, 4.7);
    placeBookRow(11, 14, 4.7);
    placeBookRow(-9, 10, 9.2);

    // B. Retro Twin-Bell Cartoon Alarm Clock at center shelf (X = 0, Y = 9.2)
    const clockGroup = new THREE.Group();
    clockGroup.position.set(0, 9.2, 0);

    const clockBody = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.8, 24), makeToon({ color: 0xef4444 }));
    clockBody.rotation.x = Math.PI / 2;
    clockBody.position.y = 1.8;
    clockGroup.add(clockBody);

    // Clock face
    const clockFaceTex = createLabelCanvas("10:10", "#ffffff", "#1e293b", undefined, 256, 256);
    const clockFace = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), new THREE.MeshBasicMaterial({ map: clockFaceTex }));
    clockFace.position.set(0, 1.8, -0.42);
    clockFace.rotation.y = Math.PI;
    clockGroup.add(clockFace);

    // Twin ringing bells on top
    for (const bx of [-1.2, 1.2]) {
      const bell = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 12), makeToon({ color: 0xfacc15 }));
      bell.position.set(bx, 3.4, 0);
      clockGroup.add(bell);
    }
    shelfGroup.add(clockGroup);

    // C. Desktop World Globe at shelf (X = -4.5, Y = 4.7)
    const globeGroup = new THREE.Group();
    globeGroup.position.set(-4.5, 4.7, 0);
    const globeSphere = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), makeToon({ color: 0x0284c7 }));
    globeSphere.position.y = 2.2;
    const globeStand = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 0.4, 16), makeToon({ color: 0xfacc15 }));
    globeStand.position.y = 0.2;
    const globeRing = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.1, 8, 24), makeToon({ color: 0xfacc15 }));
    globeRing.position.y = 2.2;
    globeRing.rotation.y = Math.PI / 6;
    globeGroup.add(globeSphere, globeStand, globeRing);
    shelfGroup.add(globeGroup);

    // D. Potted Green Succulent Plant (X = 4.5, Y = 4.7)
    const potGroup = new THREE.Group();
    potGroup.position.set(4.5, 4.7, 0);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.7, 1.2, 16), makeToon({ color: 0xd97706 }));
    pot.position.y = 0.6;
    const plant = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 10), makeToon({ color: 0x22c55e }));
    plant.position.y = 1.7;
    potGroup.add(pot, plant);
    shelfGroup.add(potGroup);

    r1.add(shelfGroup);

    // 2. GIANT PLUSH TEDDY BEAR SITTING IN THE NORTH COURT VIEW (X = -7.5, Z = 33)
    const teddyGroup = new THREE.Group();
    teddyGroup.position.set(-7.5, 0, 33);
    teddyGroup.rotation.y = 0.25;

    const furMat = makeToon({ color: 0xb45309 }); // Honey brown fur
    const snoutMat = makeToon({ color: 0xfde68a }); // Beige snout
    const noseMat = makeToon({ color: 0x1f2937 });
    const bowMat = makeToon({ color: 0xef4444 });

    // Body
    const tBody = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 14), furMat);
    tBody.position.y = 2.2;
    tBody.scale.set(1.1, 1.0, 1.0);
    teddyGroup.add(tBody);

    // Head
    const tHead = new THREE.Mesh(new THREE.SphereGeometry(1.9, 16, 14), furMat);
    tHead.position.set(0, 4.6, 0.2);
    teddyGroup.add(tHead);

    // Snout & Nose
    const tSnout = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 10), snoutMat);
    tSnout.position.set(0, 4.3, 1.6);
    tSnout.scale.set(1.1, 0.8, 0.8);
    const tNose = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), noseMat);
    tNose.position.set(0, 4.6, 2.2);
    teddyGroup.add(tSnout, tNose);

    // Ears
    for (const ex of [-1.5, 1.5]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 10), furMat);
      ear.position.set(ex, 6.0, 0.2);
      teddyGroup.add(ear);
    }

    // Arms & Paws resting forward
    for (const ax of [-1.8, 1.8]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 2.6, 12), furMat);
      arm.position.set(ax, 2.0, 1.2);
      arm.rotation.x = -Math.PI / 4;
      teddyGroup.add(arm);
    }

    // Big Satin Red Bow Tie
    const bowCenter = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), bowMat);
    bowCenter.position.set(0, 3.5, 1.5);
    const bowWingL = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 4), bowMat);
    bowWingL.rotation.z = Math.PI / 2;
    bowWingL.position.set(-0.9, 3.5, 1.5);
    const bowWingR = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 4), bowMat);
    bowWingR.rotation.z = -Math.PI / 2;
    bowWingR.position.set(0.9, 3.5, 1.5);
    teddyGroup.add(bowCenter, bowWingL, bowWingR);

    r1.add(teddyGroup);

    // 3. GIANT RETRO TIN TOY ROBOT (X = +7.5, Z = 33)
    const robotGroup = new THREE.Group();
    robotGroup.position.set(7.5, 0, 33);
    robotGroup.rotation.y = -0.25;

    const botBodyMat = makeToon({ color: 0x06b6d4 }); // Mint-cyan tin
    const botJointMat = makeToon({ color: 0x475569 });
    const botGoldMat = makeToon({ color: 0xfacc15 });

    // Legs
    for (const lx of [-0.9, 0.9]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.0, 1.0), botBodyMat);
      leg.position.set(lx, 1.0, 0);
      robotGroup.add(leg);
    }

    // Body
    const rBody = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.2, 2.0), botBodyMat);
    rBody.position.y = 3.6;
    robotGroup.add(rBody);

    // Chest meter panel
    const meterTex = createLabelCanvas("99", "#1e293b", "#facc15", "POWER", 128, 128);
    const meter = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.2), new THREE.MeshBasicMaterial({ map: meterTex }));
    meter.position.set(0, 3.6, -1.02);
    meter.rotation.y = Math.PI;
    robotGroup.add(meter);

    // Head
    const rHead = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 1.8), botBodyMat);
    rHead.position.set(0, 6.2, 0);
    robotGroup.add(rHead);

    // Glowing Eyes
    for (const ex of [-0.6, 0.6]) {
      const eye = new THREE.Mesh(new THREE.CircleGeometry(0.35, 12), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
      eye.position.set(ex, 6.3, -0.92);
      eye.rotation.y = Math.PI;
      robotGroup.add(eye);
    }

    // Antenna on head
    const antPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), botJointMat);
    antPole.position.set(0, 7.8, 0);
    const antBall = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), botGoldMat);
    antBall.position.set(0, 8.4, 0);
    robotGroup.add(antPole, antBall);

    // Wind-up Key on Back
    const keyShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 8), botGoldMat);
    keyShaft.rotation.x = Math.PI / 2;
    keyShaft.position.set(0, 4.0, 1.4);
    const keyRing = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.12, 8, 16), botGoldMat);
    keyRing.position.set(0, 4.0, 1.9);
    robotGroup.add(keyShaft, keyRing);

    r1.add(robotGroup);

    // 4. SUSPENDED CHILDHOOD ROOM MOBILE (X = 0, Y = 12.5, Z = 32)
    const mobileGroup = new THREE.Group();
    mobileGroup.position.set(0, 12.5, 32);

    // Cross bars
    const mobileMat = makeToon({ color: 0xf59e0b });
    const bar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 7.0, 8), mobileMat);
    bar1.rotation.z = Math.PI / 2;
    const bar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 7.0, 8), mobileMat);
    bar2.rotation.x = Math.PI / 2;
    mobileGroup.add(bar1, bar2);

    // Dangling Stars and Clouds
    const plushStarMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });
    const plushCloudMat = makeToon({ color: 0xffffff });

    const mobileHangers = [
      { x: -3.2, z: 0, mesh: new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), plushStarMat) },
      { x: 3.2, z: 0, mesh: new THREE.Mesh(new THREE.OctahedronGeometry(0.9, 0), plushStarMat) },
      { x: 0, z: -3.2, mesh: new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 10), plushCloudMat) },
      { x: 0, z: 3.2, mesh: new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 10), plushCloudMat) },
    ];

    mobileHangers.forEach((h) => {
      const line = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 2.5),
        new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
      );
      line.position.set(h.x, -1.25, h.z);
      h.mesh.position.set(h.x, -2.6, h.z);
      mobileGroup.add(line, h.mesh);
    });

    r1.add(mobileGroup);

    // 5. Stacked Wooden Alphabet Blocks around side podiums
    const blockData = [
      { text: "A", bg: "#f43f5e", tc: "#ffffff", pos: new THREE.Vector3(-19, 1.2, 28), size: 2.4, rot: 0.15 },
      { text: "B", bg: "#0284c7", tc: "#ffffff", pos: new THREE.Vector3(-19, 3.6, 28), size: 2.2, rot: -0.2 },
      { text: "C", bg: "#eab308", tc: "#ffffff", pos: new THREE.Vector3(-19, 5.8, 28), size: 2.0, rot: 0.35 },
      { text: "1", bg: "#10b981", tc: "#ffffff", pos: new THREE.Vector3(19, 1.2, 28), size: 2.4, rot: -0.1 },
      { text: "2", bg: "#8b5cf6", tc: "#ffffff", pos: new THREE.Vector3(19, 3.6, 28), size: 2.2, rot: 0.25 },
      { text: "3", bg: "#f97316", tc: "#ffffff", pos: new THREE.Vector3(19, 5.8, 28), size: 2.0, rot: -0.18 },
    ];

    const blockGeo = new THREE.BoxGeometry(1, 1, 1);
    for (const b of blockData) {
      const tex = createLabelCanvas(b.text, b.bg, b.tc, undefined, 256, 256);
      const mesh = new THREE.Mesh(blockGeo, makeToon({ map: tex }));
      mesh.scale.set(b.size, b.size, b.size);
      mesh.position.copy(b.pos);
      mesh.rotation.y = b.rot;
      r1.add(mesh);
    }

    // 6. Flying Paper Airplanes looping in the sky
    const planeGeo = new THREE.BufferGeometry();
    const pVerts = new Float32Array([
      0, 0, 1.8,   -1.4, 0.25, -1.2,   0, 0.35, -0.9,
      0, 0, 1.8,    0, 0.35, -0.9,     1.4, 0.25, -1.2,
      0, 0, 1.8,    0, -0.3, -0.9,     -1.4, 0.25, -1.2,
      0, 0, 1.8,    1.4, 0.25, -1.2,    0, -0.3, -0.9,
    ]);
    planeGeo.setAttribute("position", new THREE.BufferAttribute(pVerts, 3));
    planeGeo.computeVertexNormals();

    const planeMat = makeToon({ color: 0xffffff });
    const planes: THREE.Mesh[] = [];
    const planeConfigs = [
      { radius: 20, speed: 0.45, y: 13, offset: 0 },
      { radius: 24, speed: -0.38, y: 15, offset: Math.PI * 0.7 },
      { radius: 18, speed: 0.52, y: 11, offset: Math.PI * 1.4 },
    ];

    for (const pc of planeConfigs) {
      const pm = new THREE.Mesh(planeGeo, planeMat);
      pm.scale.setScalar(1.4);
      r1.add(pm);
      planes.push(pm);
    }

    updaters.push((_dt, time) => {
      if (!r1.visible) return;
      // Gentle spin of childhood mobile
      mobileGroup.rotation.y = time * 0.4;
      // Robot wind-up key spin
      keyRing.rotation.x = time * 3.0;

      // Airplanes circling
      for (let i = 0; i < planes.length; i++) {
        const pc = planeConfigs[i];
        const theta = time * pc.speed + pc.offset;
        const x = Math.cos(theta) * pc.radius;
        const z = Math.sin(theta) * (pc.radius * 1.1) + 10;
        const y = pc.y + Math.sin(time * 1.5 + i) * 0.8;
        planes[i].position.set(x, y, z);
        planes[i].rotation.y = -theta + (pc.speed > 0 ? -Math.PI / 2 : Math.PI / 2);
        planes[i].rotation.z = Math.sin(time * 2 + i) * 0.15;
      }
    });

    // Place Tripo Mystery Gifts in view
    placeTripoModel("mystery-gift", r1, new THREE.Vector3(-14, 0.5, 30), new THREE.Euler(0, 0.4, 0), 2.2);
    placeTripoModel("mystery-gift", r1, new THREE.Vector3(14, 0.5, 30), new THREE.Euler(0, -0.3, 0), 2.2);
    placeTripoModel("mystery-gift", r1, new THREE.Vector3(0, 0.5, 32), new THREE.Euler(0, 0, 0), 2.6);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── ROUND 2: KOTA MAINAN (Cardboard Towers, Construction Crane, Train) ────
  // ════════════════════════════════════════════════════════════════════════════
  {
    const r2 = groups[1];

    const buildingCanvas = document.createElement("canvas");
    buildingCanvas.width = 256;
    buildingCanvas.height = 512;
    const bCtx = buildingCanvas.getContext("2d")!;
    bCtx.fillStyle = "#b45309";
    bCtx.fillRect(0, 0, 256, 512);
    bCtx.fillStyle = "rgba(0, 0, 0, 0.08)";
    for (let y = 0; y < 512; y += 12) bCtx.fillRect(0, y, 256, 4);
    bCtx.fillStyle = "#fef08a";
    bCtx.shadowColor = "#f59e0b";
    bCtx.shadowBlur = 10;
    for (let wy = 30; wy < 480; wy += 45) {
      for (let wx = 25; wx < 230; wx += 52) {
        if (Math.random() > 0.15) bCtx.fillRect(wx, wy, 34, 28);
      }
    }
    const bTex = new THREE.CanvasTexture(buildingCanvas);
    bTex.colorSpace = THREE.SRGBColorSpace;
    const bMat = makeToon({ map: bTex });

    const towers = [
      { x: -24, z: 28, w: 5, h: 18, d: 5 },
      { x: -25, z: 12, w: 4, h: 14, d: 4 },
      { x: -26, z: -8, w: 4.5, h: 16, d: 4.5 },
      { x: 24, z: 28, w: 5, h: 20, d: 5 },
      { x: 25, z: 12, w: 4, h: 15, d: 4 },
      { x: 26, z: -8, w: 4.5, h: 17, d: 4.5 },
      { x: -12, z: 42, w: 6, h: 22, d: 6 },
      { x: 12, z: 42, w: 6, h: 24, d: 6 },
    ];

    for (const t of towers) {
      const towerMesh = new THREE.Mesh(new THREE.BoxGeometry(t.w, t.h, t.d), bMat);
      towerMesh.position.set(t.x, t.h / 2 - 2, t.z);
      r2.add(towerMesh);
    }

    // Toy Construction Crane
    const craneGroup = new THREE.Group();
    craneGroup.position.set(0, 0, 36);
    const craneMat = makeToon({ color: 0xfacc15 });
    const craneBlackMat = makeToon({ color: 0x1f2937 });

    const craneTower = new THREE.Mesh(new THREE.BoxGeometry(1.4, 15, 1.4), craneMat);
    craneTower.position.y = 7.5;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 2.2), craneBlackMat);
    cabin.position.set(0, 15, 0);
    const boom = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 16), craneMat);
    boom.position.set(0, 16, -4);
    craneGroup.add(craneTower, cabin, boom);

    const danglingGift = new THREE.Group();
    danglingGift.position.set(0, 8.5, -9);
    const giftCube = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2), makeToon({ color: 0xef4444 }));
    danglingGift.add(giftCube);
    craneGroup.add(danglingGift);
    r2.add(craneGroup);

    updaters.push((_dt, time) => {
      if (!r2.visible) return;
      boom.rotation.y = Math.sin(time * 1.2) * 0.12;
      danglingGift.position.x = Math.sin(time * 1.2) * 1.1;
      danglingGift.rotation.y = time * 0.8;
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── ROUND 3: LAYANGAN SORE (Picket Fences, Green Knolls, 3D Kites) ────────
  // ════════════════════════════════════════════════════════════════════════════
  {
    const r3 = groups[2];

    const knollMat = makeToon({ color: 0x4ade80 });
    const trunkMat = makeToon({ color: 0x854d0e });
    const foliageMat = makeToon({ color: 0x22c55e });

    const knollConfigs = [
      { x: -22, z: 18, r: 4.5, h: 2.2 },
      { x: 22, z: 18, r: 4.5, h: 2.2 },
      { x: 0, z: 38, r: 6.5, h: 2.8 },
    ];

    for (const kc of knollConfigs) {
      const kg = new THREE.Group();
      kg.position.set(kc.x, 0, kc.z);
      const grass = new THREE.Mesh(new THREE.CylinderGeometry(kc.r, kc.r * 1.1, 0.8, 16), knollMat);
      grass.position.y = kc.h;
      kg.add(grass);

      const tree = new THREE.Group();
      tree.position.y = kc.h + 0.4;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2.5, 8), trunkMat);
      trunk.position.y = 1.25;
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 10), foliageMat);
      foliage.position.set(0, 3.2, 0);
      tree.add(trunk, foliage);
      kg.add(tree);
      r3.add(kg);
    }

    // 3D Flying Indonesian Kites
    const kiteTex1 = createKiteCanvas("stripes", "#ef4444", "#ffffff");
    const kiteTex2 = createKiteCanvas("diamond", "#3b82f6", "#fde047");
    const kiteMat1 = makeToon({ map: kiteTex1 });
    const kiteMat2 = makeToon({ map: kiteTex2 });

    const kiteGeo = new THREE.BufferGeometry();
    const kVerts = new Float32Array([
      0, 2.0, 0,     -1.4, 0.5, 0.05,   0, -2.0, 0,
      0, 2.0, 0,      0, -2.0, 0,       1.4, 0.5, 0.05,
    ]);
    const kUvs = new Float32Array([
      0.5, 1.0,   0.0, 0.6,   0.5, 0.0,
      0.5, 1.0,   0.5, 0.0,   1.0, 0.6,
    ]);
    kiteGeo.setAttribute("position", new THREE.BufferAttribute(kVerts, 3));
    kiteGeo.setAttribute("uv", new THREE.BufferAttribute(kUvs, 2));
    kiteGeo.computeVertexNormals();

    const kites: { group: THREE.Group; basePos: THREE.Vector3; speed: number; phase: number }[] = [];
    const kiteConfigs = [
      { mat: kiteMat1, pos: new THREE.Vector3(-10, 14, 25), scale: 1.5, speed: 1.4, phase: 0.0 },
      { mat: kiteMat2, pos: new THREE.Vector3(10, 16, 28), scale: 1.6, speed: 1.1, phase: 1.8 },
      { mat: kiteMat1, pos: new THREE.Vector3(0, 18, 34), scale: 1.8, speed: 0.9, phase: 3.5 },
    ];

    for (const kc of kiteConfigs) {
      const kg = new THREE.Group();
      kg.position.copy(kc.pos);
      const body = new THREE.Mesh(kiteGeo, kc.mat);
      body.scale.setScalar(kc.scale);
      kg.add(body);
      r3.add(kg);
      kites.push({ group: kg, basePos: kc.pos.clone(), speed: kc.speed, phase: kc.phase });
    }

    updaters.push((_dt, time) => {
      if (!r3.visible) return;
      for (const k of kites) {
        const t = time * k.speed + k.phase;
        k.group.position.x = k.basePos.x + Math.sin(t * 0.8) * 1.8;
        k.group.position.y = k.basePos.y + Math.cos(t * 1.2) * 0.9;
        k.group.rotation.z = Math.sin(t * 1.5) * 0.25;
      }
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── ROUND 4: PASAR MALAM (Mini Ferris Wheel, Gerobak Cart, Circus Tents) ──
  // ════════════════════════════════════════════════════════════════════════════
  {
    const r4 = groups[3];

    // 1. 3D Mini Rotating Ferris Wheel on North Overlook (Z = +38)
    const ferrisGroup = new THREE.Group();
    ferrisGroup.position.set(0, 0, 38);

    const frameMat = makeToon({ color: 0x3b82f6 });
    const legGeo = new THREE.CylinderGeometry(0.3, 0.45, 16, 8);
    const legL = new THREE.Mesh(legGeo, frameMat);
    legL.position.set(-4.5, 7.5, 0);
    legL.rotation.z = -0.32;
    const legR = new THREE.Mesh(legGeo, frameMat);
    legR.position.set(4.5, 7.5, 0);
    legR.rotation.z = 0.32;
    ferrisGroup.add(legL, legR);

    const wheelCenter = new THREE.Group();
    wheelCenter.position.set(0, 14, 0);
    ferrisGroup.add(wheelCenter);

    const neonRimMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const rim1 = new THREE.Mesh(new THREE.TorusGeometry(8.5, 0.25, 8, 36), neonRimMat);
    const rim2 = new THREE.Mesh(new THREE.TorusGeometry(6.0, 0.2, 8, 32), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    wheelCenter.add(rim1, rim2);

    const spokeMat = makeToon({ color: 0xffffff });
    const spokeGeo = new THREE.CylinderGeometry(0.12, 0.12, 17, 6);
    for (let i = 0; i < 4; i++) {
      const sp = new THREE.Mesh(spokeGeo, spokeMat);
      sp.rotation.z = (i / 4) * Math.PI;
      wheelCenter.add(sp);
    }

    const gondolas: THREE.Group[] = [];
    const gondolaColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0xec4899, 0x8b5cf6, 0x06b6d4, 0xf97316];
    for (let i = 0; i < 8; i++) {
      const theta = (i / 8) * Math.PI * 2;
      const gx = Math.cos(theta) * 8.5;
      const gy = Math.sin(theta) * 8.5;
      const gondola = new THREE.Group();
      gondola.position.set(gx, gy, 0);

      const cart = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.4), makeToon({ color: gondolaColors[i] }));
      cart.position.y = -0.7;
      gondola.add(cart);
      wheelCenter.add(gondola);
      gondolas.push(gondola);
    }
    r4.add(ferrisGroup);

    updaters.push((_dt, time) => {
      if (!r4.visible) return;
      const rotAngle = time * 0.45;
      wheelCenter.rotation.z = rotAngle;
      for (const g of gondolas) g.rotation.z = -rotAngle;
    });

    // 2. Indonesian Gerobak Cart & Bumper Props
    const gerobakGroup = new THREE.Group();
    gerobakGroup.position.set(-20, 0, -2);
    gerobakGroup.rotation.y = Math.PI / 2;
    const cartBody = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.8, 2.2), makeToon({ color: 0x92400e }));
    cartBody.position.y = 1.6;
    gerobakGroup.add(cartBody);
    r4.add(gerobakGroup);

    placeTripoModel("bumper", r4, new THREE.Vector3(-19, 0.5, 12), new THREE.Euler(0, 0, 0), 2.0);
    placeTripoModel("bumper", r4, new THREE.Vector3(19, 0.5, 12), new THREE.Euler(0, 0, 0), 2.0);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── ROUND 5: ATAP PENUH BINTANG (Starlight City Rooftop Finale) ───────────
  // ════════════════════════════════════════════════════════════════════════════
  {
    const r5 = groups[4];

    // 1. GRAND 3D ILLUMINATED SKYLINE ACROSS HORIZON (Z = 44 to 52, X = -28 to +28)
    const skylineGroup = new THREE.Group();
    skylineGroup.position.set(0, 0, 46);

    // Canvas texture with thousands of glowing warm & cyan windows
    const cityCanvas = document.createElement("canvas");
    cityCanvas.width = 512;
    cityCanvas.height = 512;
    const cCtx = cityCanvas.getContext("2d")!;
    cCtx.fillStyle = "#0f172a"; // Deep night navy skyscraper facade
    cCtx.fillRect(0, 0, 512, 512);

    for (let wy = 20; wy < 500; wy += 32) {
      for (let wx = 15; wx < 500; wx += 28) {
        const rand = Math.random();
        if (rand > 0.35) {
          cCtx.fillStyle = rand > 0.8 ? "#38bdf8" : "#fef08a"; // Cyan or warm gold windows
          cCtx.fillRect(wx, wy, 16, 20);
        }
      }
    }
    const cityTex = new THREE.CanvasTexture(cityCanvas);
    cityTex.colorSpace = THREE.SRGBColorSpace;
    const cityBuildingMat = makeToon({ map: cityTex });

    const skyTowers = [
      { x: -24, z: 2, w: 7, h: 22, d: 7 },
      { x: -16, z: -2, w: 6, h: 18, d: 6 },
      { x: -9, z: 4, w: 7, h: 26, d: 7 },
      { x: 0, z: 6, w: 9, h: 30, d: 9 }, // Monumental Center Tower
      { x: 9, z: 4, w: 7, h: 25, d: 7 },
      { x: 16, z: -2, w: 6, h: 19, d: 6 },
      { x: 24, z: 2, w: 7, h: 23, d: 7 },
      // Secondary depth towers
      { x: -28, z: 6, w: 6, h: 16, d: 6 },
      { x: -5, z: 8, w: 5, h: 28, d: 5 },
      { x: 5, z: 8, w: 5, h: 27, d: 5 },
      { x: 28, z: 6, w: 6, h: 17, d: 6 },
    ];

    for (const st of skyTowers) {
      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(st.w, st.h, st.d), cityBuildingMat);
      bMesh.position.set(st.x, st.h / 2 - 2, st.z);
      skylineGroup.add(bMesh);

      // Red blinking beacon antenna on tall towers
      if (st.h >= 22) {
        const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 4.0, 6), makeToon({ color: 0x94a3b8 }));
        ant.position.set(st.x, st.h - 0.5, st.z);
        const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
        beacon.position.set(st.x, st.h + 1.6, st.z);
        skylineGroup.add(ant, beacon);
      }
    }

    // Glowing Neon Billboard "BOUNCEBACK CHAMPIONSHIP" across center tower
    const neonSignTex = createLabelCanvas("BOUNCEBACK", "#000000", "#38bdf8", "CHAMPIONSHIP FINALE", 512, 160);
    const neonSign = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 3.8),
      new THREE.MeshBasicMaterial({ map: neonSignTex })
    );
    neonSign.position.set(0, 16, 2.4);
    neonSign.rotation.y = Math.PI;
    skylineGroup.add(neonSign);

    r5.add(skylineGroup);

    // 2. GIANT GLOWING 3D CRESCENT MOON (Positioned DIRECTLY in camera view: X=0, Y=11.5, Z=35)
    const moonGroup = new THREE.Group();
    moonGroup.position.set(0, 11.5, 35);

    // 3D Crescent Moon Geometry
    const moonShape = new THREE.Shape();
    moonShape.absarc(0, 0, 4.5, Math.PI * 0.15, Math.PI * 1.85, false);
    moonShape.absarc(1.5, 0, 3.8, Math.PI * 1.8, Math.PI * 0.2, true);

    const extrudeSettings = { depth: 0.8, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.2, bevelThickness: 0.2 };
    const moon3DGeo = new THREE.ExtrudeGeometry(moonShape, extrudeSettings);

    const moonEmissiveMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a, // Radiant golden moon
    });
    const moon3DMesh = new THREE.Mesh(moon3DGeo, moonEmissiveMat);
    moon3DMesh.rotation.z = 0.45;
    moonGroup.add(moon3DMesh);

    // Soft volumetric core starlight aura
    const moonCorona = new THREE.Mesh(
      new THREE.SphereGeometry(3.6, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfef3c7, transparent: true, opacity: 0.65 })
    );
    moonCorona.position.set(0, 0, -0.6);
    moonGroup.add(moonCorona);

    r5.add(moonGroup);

    // 3. ELEVATED GRAND CHAMPION DAIS & STADIUM BRIDGE (Z = +32, Y = 3.5)
    const daisGroup = new THREE.Group();
    daisGroup.position.set(0, 2.8, 32);

    const daisMat = makeToon({ color: 0x1e1b4b });
    const goldTrimMat = makeToon({ color: 0xfacc15 });

    // Raised Victory Stage
    const stagePlinth = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 8.2, 2.0, 28), daisMat);
    stagePlinth.position.y = 1.0;
    const stageRing = new THREE.Mesh(new THREE.TorusGeometry(7.6, 0.2, 8, 36), goldTrimMat);
    stageRing.rotation.x = Math.PI / 2;
    stageRing.position.y = 2.0;

    // Center Pedestal
    const cupPillar = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 1.8, 20), daisMat);
    cupPillar.position.y = 2.8;
    const cupRing = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.15, 8, 24), goldTrimMat);
    cupRing.rotation.x = Math.PI / 2;
    cupRing.position.y = 3.7;

    daisGroup.add(stagePlinth, stageRing, cupPillar, cupRing);

    // Twin Monumental Golden Flame Braziers
    const brazierMat = makeToon({ color: 0xfacc15 });
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 }); // Starlight cyan flame
    for (const bx of [-6.0, 6.0]) {
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 0.4, 1.4, 16), brazierMat);
      bowl.position.set(bx, 2.6, 0);
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.8, 8), flameMat);
      flame.position.set(bx, 3.8, 0);
      daisGroup.add(bowl, flame);
    }

    r5.add(daisGroup);

    // Place Grand Golden Tripo Trophy and Host Gift atop the raised Champion Dais
    placeTripoModel("trophy", daisGroup, new THREE.Vector3(0, 3.8, 0), new THREE.Euler(0, 0, 0), 3.2);
    placeTripoModel("host-gift", daisGroup, new THREE.Vector3(-3.8, 2.2, 0), new THREE.Euler(0, 0.4, 0), 2.2);
    placeTripoModel("host-gift", daisGroup, new THREE.Vector3(3.8, 2.2, 0), new THREE.Euler(0, -0.4, 0), 2.2);

    // 4. DENSE 3D TWINKLING STARLIGHT CRYSTALS (Floating directly in view around moon)
    const starGeo = new THREE.OctahedronGeometry(0.8, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffe66d });
    const stars: THREE.Mesh[] = [];

    for (let i = 0; i < 32; i++) {
      const st = new THREE.Mesh(starGeo, starMat);
      const angle = (i / 32) * Math.PI * 2;
      const dist = 14 + (i % 6) * 4;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * (dist * 0.7) + 36;
      const y = 6.0 + (i % 8) * 1.5;

      st.position.set(x, y, z);
      st.scale.setScalar(0.7 + (i % 3) * 0.35);
      r5.add(st);
      stars.push(st);
    }

    updaters.push((_dt, time) => {
      if (!r5.visible) return;
      // Gentle moon floating & slow breathing
      moonGroup.position.y = 11.5 + Math.sin(time * 0.8) * 0.6;
      moon3DMesh.rotation.z = 0.45 + Math.sin(time * 0.5) * 0.08;

      // Twinkling starlight
      for (let i = 0; i < stars.length; i++) {
        const st = stars[i];
        st.rotation.x = time * (1.2 + (i % 3) * 0.4);
        st.rotation.y = time * (0.9 + (i % 2) * 0.5);
        st.scale.setScalar((0.8 + Math.sin(time * 3 + i) * 0.25) * ((i % 3) * 0.3 + 0.7));
      }
    });

    // 5. Rooftop Brick Chimneys and Parapet Railings
    const chimneyMat = makeToon({ color: 0x991b1b });
    const capMat = makeToon({ color: 0x475569 });
    for (const c of [{ x: -21, z: -16, h: 5.5 }, { x: 21, z: -16, h: 5.5 }, { x: -20, z: 20, h: 5.0 }, { x: 20, z: 20, h: 5.0 }]) {
      const cg = new THREE.Group();
      cg.position.set(c.x, 0, c.z);
      const stack = new THREE.Mesh(new THREE.BoxGeometry(2.0, c.h, 2.0), chimneyMat);
      stack.position.y = c.h / 2;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 2.4), capMat);
      cap.position.y = c.h + 0.2;
      cg.add(stack, cap);
      r5.add(cg);
    }
  }

  // ─── Theme Switcher ────────────────────────────────────────────────────────
  function setTheme(roundNumber: number) {
    for (let i = 0; i < groups.length; i++) {
      groups[i].visible = i + 1 === roundNumber;
    }
  }

  // ─── Animation Loop ────────────────────────────────────────────────────────
  function update(dt: number, time: number) {
    for (const fn of updaters) {
      fn(dt, time);
    }
  }

  function dispose() {
    parent.remove(root);
  }

  return {
    root,
    setTheme,
    update,
    dispose,
  };
}
