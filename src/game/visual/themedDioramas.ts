/**
 * BOUNCEBACK! — 360° Immersive Themed Dioramas (Full Three.js + Tripo Assets)
 *
 * For Tripothon: "Build a world as a Gift"
 * Full 360-degree environment wrapping ALL 4 SIDES (North, South, East, West):
 * - Round 1: Kamar Masa Kecil (360° Giant Bedroom: Bookshelf, Child's Bed, Study Desk, Wardrobe, Mobile)
 * - Round 2: Kota Mainan (360° Cardboard Box Metropolis: North Crane, West Overpass, East Train Trestle, South Warehouses)
 * - Round 3: Layangan Sore (360° Countryside Hills: North Kites, West Windmill, East Cottages, South Barn)
 * - Round 4: Pasar Malam (360° Night Carnival: North Ferris Wheel, West Game Stalls, East Gerobak Carts, South Entrance Arch)
 * - Round 5: Atap Penuh Bintang (360° Midnight Rooftop Skyline: North Crescent Moon & Dais, 360° Skyscraper Panorama)
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

// ─── HELPER: Cardboard Texture with Lit Windows ───────────────────────────────
function createCardboardTex(w = 256, h = 512): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#b45309";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
  for (let y = 0; y < h; y += 12) ctx.fillRect(0, y, w, 4);
  ctx.fillStyle = "#fef08a";
  for (let wy = 30; wy < h - 40; wy += 45) {
    for (let wx = 25; wx < w - 35; wx += 48) {
      if (Math.random() > 0.18) ctx.fillRect(wx, wy, 30, 26);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ─── HELPER: City Night Skyscraper Texture ───────────────────────────────────
function createCityNightTex(w = 512, h = 512): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, w, h);
  for (let wy = 20; wy < h - 20; wy += 30) {
    for (let wx = 15; wx < w - 20; wx += 26) {
      const rand = Math.random();
      if (rand > 0.35) {
        ctx.fillStyle = rand > 0.8 ? "#38bdf8" : "#fef08a";
        ctx.fillRect(wx, wy, 16, 18);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createThemedPerimeterDioramas(parent: THREE.Group): ThemedDioramaManager {
  const root = new THREE.Group();
  root.name = "ThemedPerimeterDioramas";
  parent.add(root);

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
  // ─── ROUND 1: KAMAR MASA KECIL (360° Giant Childhood Bedroom Enclosure) ─────
  // ════════════════════════════════════════════════════════════════════════════
  {
    const r1 = groups[0];
    const woodMat = makeToon({ color: 0x9a3412 });
    const woodBackMat = makeToon({ color: 0x7c2d12 });

    // 1. NORTH (+Z = 38): Grand Toy Bookshelf & Cubby Wall Unit
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(0, 0, 38);

    const backPanel = new THREE.Mesh(new THREE.BoxGeometry(40, 14, 0.4), woodBackMat);
    backPanel.position.set(0, 7, 1.2);
    shelfGroup.add(backPanel);

    const topBar = new THREE.Mesh(new THREE.BoxGeometry(40.4, 0.6, 2.8), woodMat);
    topBar.position.set(0, 14, 0);
    const bottomBar = new THREE.Mesh(new THREE.BoxGeometry(40.4, 0.8, 2.8), woodMat);
    bottomBar.position.set(0, 0.4, 0);
    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 14, 2.8), woodMat);
    sideL.position.set(-20, 7, 0);
    const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 14, 2.8), woodMat);
    sideR.position.set(20, 7, 0);
    shelfGroup.add(topBar, bottomBar, sideL, sideR);

    for (const sy of [4.5, 9.0]) {
      const sh = new THREE.Mesh(new THREE.BoxGeometry(39.6, 0.4, 2.6), woodMat);
      sh.position.set(0, sy, 0);
      shelfGroup.add(sh);
    }
    for (const dx of [-10, 0, 10]) {
      const div = new THREE.Mesh(new THREE.BoxGeometry(0.5, 13.6, 2.6), woodMat);
      div.position.set(dx, 7, 0);
      shelfGroup.add(div);
    }

    // Books, Clock, Globe on North Shelf
    const bookCols = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6];
    for (let b = 0; b < 16; b++) {
      const h = 2.4 + (b % 3) * 0.3;
      const bk = new THREE.Mesh(new THREE.BoxGeometry(0.4, h, 1.8), makeToon({ color: bookCols[b % bookCols.length] }));
      bk.position.set(-18 + b * 0.48, 4.7 + h / 2, 0);
      if (b === 15) bk.rotation.z = -0.22;
      shelfGroup.add(bk);
    }

    const clockBody = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.8, 24), makeToon({ color: 0xef4444 }));
    clockBody.rotation.x = Math.PI / 2;
    clockBody.position.set(0, 11.0, 0);
    shelfGroup.add(clockBody);

    const globe = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), makeToon({ color: 0x0284c7 }));
    globe.position.set(-5, 6.9, 0);
    shelfGroup.add(globe);

    r1.add(shelfGroup);

    // Giant Plush Teddy Bear & Tin Toy Robot in North View
    const teddyGroup = new THREE.Group();
    teddyGroup.position.set(-8, 0, 33);
    const tBody = new THREE.Mesh(new THREE.SphereGeometry(2.4, 16, 14), makeToon({ color: 0xb45309 }));
    tBody.position.y = 2.2;
    const tHead = new THREE.Mesh(new THREE.SphereGeometry(1.9, 16, 14), makeToon({ color: 0xb45309 }));
    tHead.position.set(0, 4.6, 0.2);
    teddyGroup.add(tBody, tHead);
    r1.add(teddyGroup);

    const robotGroup = new THREE.Group();
    robotGroup.position.set(8, 0, 33);
    const rBody = new THREE.Mesh(new THREE.BoxGeometry(3.0, 3.2, 2.0), makeToon({ color: 0x06b6d4 }));
    rBody.position.y = 3.6;
    const rHead = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 1.8), makeToon({ color: 0x06b6d4 }));
    rHead.position.set(0, 6.2, 0);
    const rKey = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.12, 8, 16), makeToon({ color: 0xfacc15 }));
    rKey.position.set(0, 4.0, 1.6);
    robotGroup.add(rBody, rHead, rKey);
    r1.add(robotGroup);

    // 2. WEST / KIRI (X = -26): Giant Cozy Child's Bed
    const bedGroup = new THREE.Group();
    bedGroup.position.set(-26, 0, 0);

    // Headboard & Footboard
    const headboard = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 0.8), woodMat);
    headboard.position.set(0, 4, 20);
    const footboard = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 0.8), woodMat);
    footboard.position.set(0, 2, -20);
    const mattress = new THREE.Mesh(new THREE.BoxGeometry(9.4, 2.2, 39.2), makeToon({ color: 0x38bdf8 }));
    mattress.position.set(0, 2.0, 0);
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(7.0, 1.4, 3.2), makeToon({ color: 0xffffff }));
    pillow.position.set(0, 3.6, 16);
    const nightstand = new THREE.Mesh(new THREE.BoxGeometry(4.0, 3.2, 4.0), woodMat);
    nightstand.position.set(0, 1.6, -24);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(1.2, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfde047 }));
    lamp.position.set(0, 4.2, -24);
    bedGroup.add(headboard, footboard, mattress, pillow, nightstand, lamp);
    r1.add(bedGroup);

    // 3. EAST / KANAN (X = +26): Giant Toy Study Desk & Drawing Station
    const deskGroup = new THREE.Group();
    deskGroup.position.set(26, 0, 0);

    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(10, 0.8, 38), woodMat);
    deskTop.position.set(0, 3.5, 0);
    const deskLeg1 = new THREE.Mesh(new THREE.BoxGeometry(9.6, 3.5, 0.8), woodMat);
    deskLeg1.position.set(0, 1.75, 17);
    const deskLeg2 = new THREE.Mesh(new THREE.BoxGeometry(9.6, 3.5, 0.8), woodMat);
    deskLeg2.position.set(0, 1.75, -17);
    // Pencil Mug with Crayons
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.6, 3.2, 16), makeToon({ color: 0xef4444 }));
    mug.position.set(0, 5.5, 8);
    const crayon = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 4.5, 8), makeToon({ color: 0xfacc15 }));
    crayon.position.set(0, 6.5, 8);
    crayon.rotation.z = 0.2;
    // Sketchbook
    const book = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.2, 8.5), makeToon({ color: 0xffffff }));
    book.position.set(0, 4.0, -4);
    deskGroup.add(deskTop, deskLeg1, deskLeg2, mug, crayon, book);
    r1.add(deskGroup);

    // 4. SOUTH / BELAKANG (Z = -42): Giant Bedroom Closet Wardrobe & Toy Chest
    const closetGroup = new THREE.Group();
    closetGroup.position.set(0, 0, -42);

    const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(26, 14, 4.0), woodMat);
    wardrobe.position.set(0, 7, 0);
    // Closet doors line
    const doorDivider = new THREE.Mesh(new THREE.BoxGeometry(0.2, 13.6, 0.2), woodBackMat);
    doorDivider.position.set(0, 7, 2.05);
    // Toy Trunk
    const toyChest = new THREE.Mesh(new THREE.BoxGeometry(10, 3.5, 4.5), makeToon({ color: 0x0284c7 }));
    toyChest.position.set(0, 1.75, 5);
    closetGroup.add(wardrobe, doorDivider, toyChest);
    r1.add(closetGroup);

    // Hanging Mobile in Center Sky
    const mobileGroup = new THREE.Group();
    mobileGroup.position.set(0, 12.5, 20);
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 8.0, 8), makeToon({ color: 0xf59e0b }));
    bar.rotation.z = Math.PI / 2;
    mobileGroup.add(bar);
    r1.add(mobileGroup);

    updaters.push((_dt, time) => {
      if (!r1.visible) return;
      mobileGroup.rotation.y = time * 0.4;
      rKey.rotation.x = time * 3.0;
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── ROUND 2: KOTA MAINAN (360° Dense Cardboard Box Metropolis) ────────────
  // ════════════════════════════════════════════════════════════════════════════
  {
    const r2 = groups[1];
    const cardTex = createCardboardTex();
    const cardMat = makeToon({ map: cardTex });

    const createCardTower = (x: number, y: number, z: number, w: number, h: number, d: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cardMat);
      mesh.position.set(x, h / 2 + y, z);
      return mesh;
    };

    // 1. NORTH Skyline (+Z = 38 to 48)
    r2.add(createCardTower(-18, 0, 42, 7, 22, 7));
    r2.add(createCardTower(-8, 0, 44, 8, 26, 8));
    r2.add(createCardTower(8, 0, 44, 8, 28, 8));
    r2.add(createCardTower(18, 0, 42, 7, 24, 7));

    // Toy Crane on North
    const crane = new THREE.Group();
    crane.position.set(0, 0, 36);
    const mast = new THREE.Mesh(new THREE.BoxGeometry(1.4, 16, 1.4), makeToon({ color: 0xfacc15 }));
    mast.position.y = 8;
    const boom = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 16), makeToon({ color: 0xfacc15 }));
    boom.position.set(0, 16, -4);
    const danglingGift = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2), makeToon({ color: 0xef4444 }));
    danglingGift.position.set(0, 8.5, -9);
    crane.add(mast, boom, danglingGift);
    r2.add(crane);

    // 2. WEST Skyline / Kiri (X = -26, Z = -28 to +28)
    for (let zi = -24; zi <= 24; zi += 12) {
      r2.add(createCardTower(-26, 0, zi, 7, 16 + (zi % 5) * 2, 8));
    }
    // Cardboard Highway Overpass
    const overpass = new THREE.Mesh(new THREE.BoxGeometry(6, 0.6, 52), cardMat);
    overpass.position.set(-20, 5, 0);
    r2.add(overpass);

    // 3. EAST Skyline / Kanan (X = +26, Z = -28 to +28)
    for (let zi = -24; zi <= 24; zi += 12) {
      r2.add(createCardTower(26, 0, zi, 7, 17 + (zi % 4) * 2.5, 8));
    }
    // Wooden Toy Train Trestle
    const trestle = new THREE.Mesh(new THREE.BoxGeometry(4, 0.5, 52), makeToon({ color: 0x78350f }));
    trestle.position.set(20, 3, 0);
    r2.add(trestle);

    // 4. SOUTH Skyline / Belakang (Z = -42, X = -24 to +24)
    for (let xi = -20; xi <= 20; xi += 10) {
      r2.add(createCardTower(xi, 0, -42, 8, 18 + (xi % 3) * 3, 8));
    }

    updaters.push((_dt, time) => {
      if (!r2.visible) return;
      boom.rotation.y = Math.sin(time * 1.2) * 0.12;
      danglingGift.position.x = Math.sin(time * 1.2) * 1.1;
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── ROUND 3: LAYANGAN SORE (360° Rolling Sunset Hills, Windmill & Village) ─
  // ════════════════════════════════════════════════════════════════════════════
  {
    const r3 = groups[2];
    const grassMat = makeToon({ color: 0x4ade80 });
    const trunkMat = makeToon({ color: 0x854d0e });
    const foliageMat = makeToon({ color: 0x22c55e });
    const cottageRoofMat = makeToon({ color: 0xb91c1c });

    const createKnollWithTree = (x: number, y: number, z: number, r: number) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      const knoll = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.15, 1.2, 16), grassMat);
      knoll.position.y = 0.6;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.8, 8), trunkMat);
      trunk.position.y = 2.4;
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(1.8, 12, 10), foliageMat);
      foliage.position.set(0, 4.4, 0);
      g.add(knoll, trunk, foliage);
      return g;
    };

    // 1. NORTH: Grassy Knolls & Trees
    r3.add(createKnollWithTree(-12, 0, 36, 5));
    r3.add(createKnollWithTree(0, 0, 42, 7));
    r3.add(createKnollWithTree(12, 0, 36, 5));

    // 2. WEST: Rolling Green Ridge with Dutch Windmill!
    const windmillGroup = new THREE.Group();
    windmillGroup.position.set(-25, 0, 0);
    const millTower = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.8, 12, 12), makeToon({ color: 0xf8fafc }));
    millTower.position.y = 6;
    const millRoof = new THREE.Mesh(new THREE.ConeGeometry(3.2, 3.0, 12), makeToon({ color: 0x7c2d12 }));
    millRoof.position.y = 13.5;
    const sailsCenter = new THREE.Group();
    sailsCenter.position.set(2.6, 11.5, 0);
    for (let s = 0; s < 4; s++) {
      const sail = new THREE.Mesh(new THREE.BoxGeometry(0.6, 10, 0.1), makeToon({ color: 0xfacc15 }));
      sail.rotation.z = (s / 4) * Math.PI * 2;
      sailsCenter.add(sail);
    }
    windmillGroup.add(millTower, millRoof, sailsCenter);
    r3.add(windmillGroup);

    // 3. EAST: Country Village Cottages
    for (let zi = -20; zi <= 20; zi += 14) {
      const cottage = new THREE.Group();
      cottage.position.set(26, 0, zi);
      const walls = new THREE.Mesh(new THREE.BoxGeometry(6, 4.5, 8), makeToon({ color: 0xfef08a }));
      walls.position.y = 2.25;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(5.5, 3.0, 4), cottageRoofMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 5.8;
      cottage.add(walls, roof);
      r3.add(cottage);
    }

    // 4. SOUTH: Rustic Country Barn & Sunset Ridge
    const barnGroup = new THREE.Group();
    barnGroup.position.set(0, 0, -42);
    const barn = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 8), makeToon({ color: 0x991b1b }));
    barn.position.y = 4;
    const barnRoof = new THREE.Mesh(new THREE.ConeGeometry(12, 4.5, 4), makeToon({ color: 0x451a03 }));
    barnRoof.rotation.y = Math.PI / 4;
    barnRoof.position.y = 10;
    barnGroup.add(barn, barnRoof);
    r3.add(barnGroup);

    // Flying Kites in 360° Sky
    const kiteTex = createKiteCanvas("stripes", "#ef4444", "#ffffff");
    const kiteGeo = new THREE.BufferGeometry();
    const kVerts = new Float32Array([
      0, 2.0, 0, -1.4, 0.5, 0.05, 0, -2.0, 0,
      0, 2.0, 0, 0, -2.0, 0, 1.4, 0.5, 0.05,
    ]);
    kiteGeo.setAttribute("position", new THREE.BufferAttribute(kVerts, 3));
    kiteGeo.computeVertexNormals();

    const kites: { mesh: THREE.Mesh; basePos: THREE.Vector3; speed: number; phase: number }[] = [];
    const kitePos = [
      new THREE.Vector3(-10, 16, 26),
      new THREE.Vector3(12, 18, 30),
      new THREE.Vector3(-20, 15, -10),
      new THREE.Vector3(20, 17, 10),
      new THREE.Vector3(0, 16, -30),
    ];
    for (let k = 0; k < kitePos.length; k++) {
      const km = new THREE.Mesh(kiteGeo, makeToon({ map: kiteTex }));
      km.scale.setScalar(1.5);
      km.position.copy(kitePos[k]);
      r3.add(km);
      kites.push({ mesh: km, basePos: kitePos[k].clone(), speed: 1.0 + k * 0.2, phase: k * 1.5 });
    }

    updaters.push((_dt, time) => {
      if (!r3.visible) return;
      sailsCenter.rotation.x = time * 0.8;
      for (const k of kites) {
        const t = time * k.speed + k.phase;
        k.mesh.position.x = k.basePos.x + Math.sin(t * 0.8) * 1.8;
        k.mesh.position.y = k.basePos.y + Math.cos(t * 1.2) * 0.9;
        k.mesh.rotation.z = Math.sin(t * 1.5) * 0.25;
      }
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── ROUND 4: PASAR MALAM (360° Vibrant Indonesian Night Carnival) ─────────
  // ════════════════════════════════════════════════════════════════════════════
  {
    const r4 = groups[3];

    // 1. NORTH: Rotating Neon Ferris Wheel (Bianglala)
    const ferrisGroup = new THREE.Group();
    ferrisGroup.position.set(0, 0, 38);
    const legGeo = new THREE.CylinderGeometry(0.3, 0.45, 16, 8);
    const legL = new THREE.Mesh(legGeo, makeToon({ color: 0x3b82f6 }));
    legL.position.set(-4.5, 7.5, 0);
    legL.rotation.z = -0.32;
    const legR = new THREE.Mesh(legGeo, makeToon({ color: 0x3b82f6 }));
    legR.position.set(4.5, 7.5, 0);
    legR.rotation.z = 0.32;
    ferrisGroup.add(legL, legR);

    const wheelCenter = new THREE.Group();
    wheelCenter.position.set(0, 14, 0);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(8.5, 0.25, 8, 36), new THREE.MeshBasicMaterial({ color: 0xf43f5e }));
    wheelCenter.add(rim);
    const gondolas: THREE.Group[] = [];
    for (let i = 0; i < 8; i++) {
      const th = (i / 8) * Math.PI * 2;
      const g = new THREE.Group();
      g.position.set(Math.cos(th) * 8.5, Math.sin(th) * 8.5, 0);
      const cart = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.4), makeToon({ color: 0xfacc15 }));
      cart.position.y = -0.7;
      g.add(cart);
      wheelCenter.add(g);
      gondolas.push(g);
    }
    ferrisGroup.add(wheelCenter);
    r4.add(ferrisGroup);

    // 2. WEST: Row of Carnival Game Booths with Striped Circus Awnings
    for (let zi = -22; zi <= 22; zi += 11) {
      const booth = new THREE.Group();
      booth.position.set(-22, 0, zi);
      const counter = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.2, 7.5), makeToon({ color: 0x9333ea }));
      counter.position.y = 1.1;
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(5.0, 2.2, 4), makeToon({ color: 0xef4444 }));
      canopy.position.y = 4.2;
      canopy.rotation.y = Math.PI / 4;
      booth.add(counter, canopy);
      r4.add(booth);
    }

    // 3. EAST: Authentic Indonesian Gerobak Street Food Stalls
    for (let zi = -20; zi <= 20; zi += 13) {
      const gerobak = new THREE.Group();
      gerobak.position.set(22, 0, zi);
      const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.8, 2.2), makeToon({ color: 0x92400e }));
      body.position.y = 1.6;
      const roof = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.3, 2.6), makeToon({ color: 0xd97706 }));
      roof.position.y = 5.0;
      const lant = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
      lant.position.set(0, 4.3, 0.8);
      gerobak.add(body, roof, lant);
      r4.add(gerobak);
    }

    // 4. SOUTH: Grand Entrance Arch "PASAR MALAM"
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0, -40);
    const archPillar1 = new THREE.Mesh(new THREE.BoxGeometry(3, 12, 3), makeToon({ color: 0xef4444 }));
    archPillar1.position.set(-10, 6, 0);
    const archPillar2 = new THREE.Mesh(new THREE.BoxGeometry(3, 12, 3), makeToon({ color: 0xef4444 }));
    archPillar2.position.set(10, 6, 0);
    const archBeam = new THREE.Mesh(new THREE.BoxGeometry(24, 3.5, 3), makeToon({ color: 0xfacc15 }));
    archBeam.position.set(0, 11, 0);
    const archSignTex = createLabelCanvas("PASAR MALAM", "#000000", "#facc15", "NIGHT CARNIVAL", 512, 128);
    const archSign = new THREE.Mesh(new THREE.PlaneGeometry(16, 2.8), new THREE.MeshBasicMaterial({ map: archSignTex }));
    archSign.position.set(0, 11, 1.55);
    archGroup.add(archPillar1, archPillar2, archBeam, archSign);
    r4.add(archGroup);

    // 360° Festoon Garland Bulbs Encircling Stadium
    const bulbCols = [0xef4444, 0xfacc15, 0x10b981, 0x3b82f6, 0xec4899];
    const garlandGroup = new THREE.Group();
    for (let a = 0; a < 48; a++) {
      const th = (a / 48) * Math.PI * 2;
      const rx = Math.cos(th) * 25;
      const rz = Math.sin(th) * 36;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: bulbCols[a % bulbCols.length] }));
      bulb.position.set(rx, 6.0 + Math.sin(a * 1.5) * 0.8, rz);
      garlandGroup.add(bulb);
    }
    r4.add(garlandGroup);

    updaters.push((_dt, time) => {
      if (!r4.visible) return;
      const rot = time * 0.45;
      wheelCenter.rotation.z = rot;
      for (const g of gondolas) g.rotation.z = -rot;
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── ROUND 5: ATAP PENUH BINTANG (360° Midnight Rooftop Metropolis) ────────
  // ════════════════════════════════════════════════════════════════════════════
  {
    const r5 = groups[4];
    const cityTex = createCityNightTex();
    const cityMat = makeToon({ map: cityTex });

    const createSkyTower = (x: number, z: number, w: number, h: number, d: number) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cityMat);
      mesh.position.set(x, h / 2 - 2, z);
      return mesh;
    };

    // 1. NORTH: Crescent Moon & Champion Dais & Horizon Skyscrapers
    const moonGroup = new THREE.Group();
    moonGroup.position.set(0, 11.5, 35);
    const moonShape = new THREE.Shape();
    moonShape.absarc(0, 0, 4.5, Math.PI * 0.15, Math.PI * 1.85, false);
    moonShape.absarc(1.5, 0, 3.8, Math.PI * 1.8, Math.PI * 0.2, true);
    const moon3DGeo = new THREE.ExtrudeGeometry(moonShape, { depth: 0.8, bevelEnabled: true, bevelSize: 0.2, bevelThickness: 0.2 });
    const moon3DMesh = new THREE.Mesh(moon3DGeo, new THREE.MeshBasicMaterial({ color: 0xfef08a }));
    moon3DMesh.rotation.z = 0.45;
    moonGroup.add(moon3DMesh);
    r5.add(moonGroup);

    // Champion Dais
    const daisGroup = new THREE.Group();
    daisGroup.position.set(0, 2.8, 32);
    const stagePlinth = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 8.2, 2.0, 28), makeToon({ color: 0x1e1b4b }));
    stagePlinth.position.y = 1.0;
    daisGroup.add(stagePlinth);
    placeTripoModel("trophy", daisGroup, new THREE.Vector3(0, 3.8, 0), new THREE.Euler(0, 0, 0), 3.2);
    r5.add(daisGroup);

    // North Towers (+Z = 44)
    r5.add(createSkyTower(-18, 44, 8, 24, 8));
    r5.add(createSkyTower(0, 48, 10, 30, 10));
    r5.add(createSkyTower(18, 44, 8, 25, 8));

    // 2. WEST Rooftop Towers (X = -28, Z = -28 to +28)
    for (let zi = -24; zi <= 24; zi += 12) {
      r5.add(createSkyTower(-28, zi, 8, 20 + (zi % 5) * 2, 8));
    }

    // 3. EAST Rooftop Towers (X = +28, Z = -28 to +28)
    for (let zi = -24; zi <= 24; zi += 12) {
      r5.add(createSkyTower(28, zi, 8, 21 + (zi % 4) * 2.5, 8));
    }

    // 4. SOUTH Rooftop Towers (Z = -44, X = -24 to +24)
    for (let xi = -20; xi <= 20; xi += 10) {
      r5.add(createSkyTower(xi, -44, 8, 22 + (xi % 3) * 3, 8));
    }

    // 360° Starlight Crystals
    const starGeo = new THREE.OctahedronGeometry(0.8, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffe66d });
    const stars: THREE.Mesh[] = [];
    for (let i = 0; i < 48; i++) {
      const th = (i / 48) * Math.PI * 2;
      const dist = 22 + (i % 6) * 5;
      const st = new THREE.Mesh(starGeo, starMat);
      st.position.set(Math.cos(th) * dist, 8.0 + (i % 8) * 1.5, Math.sin(th) * dist);
      r5.add(st);
      stars.push(st);
    }

    updaters.push((_dt, time) => {
      if (!r5.visible) return;
      moonGroup.position.y = 11.5 + Math.sin(time * 0.8) * 0.6;
      for (let i = 0; i < stars.length; i++) {
        stars[i].rotation.x = time * 1.2;
        stars[i].rotation.y = time * 0.9;
      }
    });
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
