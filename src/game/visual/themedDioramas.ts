/**
 * BOUNCEBACK! — 5 Kado 3D Perimeter Dioramas (Full Three.js + Tripo Assets)
 *
 * For Tripothon: "Build a world as a Gift"
 * Provides razor-sharp, Ultra-HD 3D diorama environments around the stadium perimeter:
 * - Round 1: Kamar Masa Kecil (Wooden alphabet blocks, giant crayons, flying paper planes, gift boxes)
 * - Round 2: Kota Mainan (Cardboard towers with glowing windows, toy construction crane, train cars)
 * - Round 3: Layangan Sore (Floating grassy knolls, picket fences, 3D flying Indonesian kites with tails)
 * - Round 4: Pasar Malam (Rotating neon Ferris wheel, Indonesian gerobak cart, circus awnings, festive bulbs)
 * - Round 5: Atap Penuh Bintang (Rooftop skyline, giant glowing crescent moon, 3D stars, champion trophy pedestal)
 *
 * Placed outside the arena ring-out boundaries (X = ±18 to ±26, Z = +32 to +46, Y = 0 to 22)
 * so camera frustum (at Z = -31, Y = 8.5) is 100% clean and unobstructed!
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

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);

  // Inner border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 14;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  // Main Text
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

  // Cross ribs
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
    g.visible = i === 1; // Default to round 1
    root.add(g);
    groups.push(g);
  }

  // Updaters for animations
  const updaters: ((dt: number, time: number) => void)[] = [];

  // Async helper to load and place Tripo models safely
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
  // ─── ROUND 1: KAMAR MASA KECIL (Toy Alphabet Blocks, Crayons, Paper Planes) ─
  // ════════════════════════════════════════════════════════════════════════════
  {
    const r1 = groups[0];

    // 1. Stacked 3D Wooden Toy Alphabet Blocks (A, B, C, 1, 2, 3) at outer corners
    const blockData = [
      // West corner stack
      { text: "A", bg: "#f43f5e", tc: "#ffffff", pos: new THREE.Vector3(-21, 1.2, -18), size: 2.4, rot: 0.15 },
      { text: "B", bg: "#0284c7", tc: "#ffffff", pos: new THREE.Vector3(-21, 3.6, -18), size: 2.2, rot: -0.2 },
      { text: "C", bg: "#eab308", tc: "#ffffff", pos: new THREE.Vector3(-21, 5.8, -18), size: 2.0, rot: 0.35 },

      // East corner stack
      { text: "1", bg: "#10b981", tc: "#ffffff", pos: new THREE.Vector3(21, 1.2, -18), size: 2.4, rot: -0.1 },
      { text: "2", bg: "#8b5cf6", tc: "#ffffff", pos: new THREE.Vector3(21, 3.6, -18), size: 2.2, rot: 0.25 },
      { text: "3", bg: "#f97316", tc: "#ffffff", pos: new THREE.Vector3(21, 5.8, -18), size: 2.0, rot: -0.18 },

      // North side towers
      { text: "★", bg: "#ec4899", tc: "#ffffff", pos: new THREE.Vector3(-18, 1.3, 34), size: 2.6, rot: 0.12 },
      { text: "K", bg: "#3b82f6", tc: "#ffffff", pos: new THREE.Vector3(-18, 3.8, 34), size: 2.3, rot: -0.22 },
      { text: "D", bg: "#14b8a6", tc: "#ffffff", pos: new THREE.Vector3(18, 1.3, 34), size: 2.6, rot: -0.15 },
      { text: "O", bg: "#eab308", tc: "#ffffff", pos: new THREE.Vector3(18, 3.8, 34), size: 2.3, rot: 0.2 },
    ];

    const blockGeo = new THREE.BoxGeometry(1, 1, 1);
    for (const b of blockData) {
      const tex = createLabelCanvas(b.text, b.bg, b.tc, undefined, 256, 256);
      const mat = makeToon({ map: tex });
      const mesh = new THREE.Mesh(blockGeo, mat);
      mesh.scale.set(b.size, b.size, b.size);
      mesh.position.copy(b.pos);
      mesh.rotation.y = b.rot;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      r1.add(mesh);
    }

    // 2. Oversized 3D Colored Crayons / Pencils standing at corners
    const crayonColors = [0x0284c7, 0xf43f5e, 0x10b981, 0xf59e0b];
    const crayonPositions = [
      new THREE.Vector3(-24, 0, -5),
      new THREE.Vector3(24, 0, -5),
      new THREE.Vector3(-24, 0, 15),
      new THREE.Vector3(24, 0, 15),
    ];

    crayonPositions.forEach((pos, idx) => {
      const col = crayonColors[idx % crayonColors.length];
      const crayonGroup = new THREE.Group();
      crayonGroup.position.copy(pos);
      crayonGroup.rotation.z = (idx % 2 === 0 ? 0.08 : -0.08);
      crayonGroup.rotation.y = idx * 0.7;

      // Shaft
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7, 0.7, 7.5, 6),
        makeToon({ color: col })
      );
      shaft.position.y = 3.75;
      shaft.castShadow = true;
      crayonGroup.add(shaft);

      // Tip (Cone)
      const tip = new THREE.Mesh(
        new THREE.ConeGeometry(0.7, 1.6, 6),
        makeToon({ color: col })
      );
      tip.position.y = 8.3;
      tip.castShadow = true;
      crayonGroup.add(tip);

      // Paper wrapper band
      const label = new THREE.Mesh(
        new THREE.CylinderGeometry(0.72, 0.72, 3.5, 6),
        makeToon({ color: 0xffffff })
      );
      label.position.y = 3.8;
      crayonGroup.add(label);

      r1.add(crayonGroup);
    });

    // 3. Floating 3D Paper Airplanes looping smoothly in the sky
    const planeGeo = new THREE.BufferGeometry();
    // Low-poly paper plane vertices (folded origami)
    const pVerts = new Float32Array([
      // Top left wing
      0, 0, 1.8,   -1.4, 0.25, -1.2,   0, 0.35, -0.9,
      // Top right wing
      0, 0, 1.8,   0, 0.35, -0.9,      1.4, 0.25, -1.2,
      // Left keel
      0, 0, 1.8,   0, -0.3, -0.9,      -1.4, 0.25, -1.2,
      // Right keel
      0, 0, 1.8,   1.4, 0.25, -1.2,    0, -0.3, -0.9,
    ]);
    planeGeo.setAttribute("position", new THREE.BufferAttribute(pVerts, 3));
    planeGeo.computeVertexNormals();

    const planeMat = makeToon({ color: 0xffffff });
    const planes: THREE.Mesh[] = [];
    const planeConfigs = [
      { radius: 24, speed: 0.45, y: 16, offset: 0 },
      { radius: 28, speed: -0.38, y: 19, offset: Math.PI * 0.7 },
      { radius: 22, speed: 0.52, y: 14, offset: Math.PI * 1.4 },
    ];

    for (const pc of planeConfigs) {
      const pm = new THREE.Mesh(planeGeo, planeMat);
      pm.scale.setScalar(1.2);
      r1.add(pm);
      planes.push(pm);
    }

    updaters.push((_dt, time) => {
      if (!r1.visible) return;
      for (let i = 0; i < planes.length; i++) {
        const pc = planeConfigs[i];
        const theta = time * pc.speed + pc.offset;
        const x = Math.cos(theta) * pc.radius;
        const z = Math.sin(theta) * (pc.radius * 1.15) + 5;
        const y = pc.y + Math.sin(time * 1.5 + i) * 1.2;

        planes[i].position.set(x, y, z);
        planes[i].rotation.y = -theta + (pc.speed > 0 ? -Math.PI / 2 : Math.PI / 2);
        planes[i].rotation.z = Math.sin(time * 2 + i) * 0.15;
      }
    });

    // 4. Place Tripo Mystery Gift models around the outer platforms
    placeTripoModel("mystery-gift", r1, new THREE.Vector3(-20, 0.5, 5), new THREE.Euler(0, 0.4, 0), 1.6);
    placeTripoModel("mystery-gift", r1, new THREE.Vector3(20, 0.5, 5), new THREE.Euler(0, -0.3, 0), 1.6);
    placeTripoModel("mystery-gift", r1, new THREE.Vector3(0, 0.5, 38), new THREE.Euler(0, 0, 0), 2.2);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── ROUND 2: KOTA MAINAN (Cardboard Towers, Construction Crane, Train) ────
  // ════════════════════════════════════════════════════════════════════════════
  {
    const r2 = groups[1];

    // 1. 3D Cardboard Skyscraper Skyline with illuminated warm windows
    const buildingCanvas = document.createElement("canvas");
    buildingCanvas.width = 256;
    buildingCanvas.height = 512;
    const bCtx = buildingCanvas.getContext("2d")!;
    // Corrugated cardboard tan base
    bCtx.fillStyle = "#b45309";
    bCtx.fillRect(0, 0, 256, 512);
    // Subtle cardboard stripes
    bCtx.fillStyle = "rgba(0, 0, 0, 0.08)";
    for (let y = 0; y < 512; y += 12) {
      bCtx.fillRect(0, y, 256, 4);
    }
    // Glowing warm windows
    bCtx.fillStyle = "#fef08a";
    bCtx.shadowColor = "#f59e0b";
    bCtx.shadowBlur = 10;
    for (let wy = 30; wy < 480; wy += 45) {
      for (let wx = 25; wx < 230; wx += 52) {
        if (Math.random() > 0.15) {
          bCtx.fillRect(wx, wy, 34, 28);
        }
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
      towerMesh.castShadow = true;
      towerMesh.receiveShadow = true;
      r2.add(towerMesh);

      // Flat roof tape detail
      const tape = new THREE.Mesh(
        new THREE.BoxGeometry(t.w + 0.1, 0.4, t.d + 0.1),
        makeToon({ color: 0xd97706 })
      );
      tape.position.set(t.x, t.h - 2, t.z);
      r2.add(tape);
    }

    // 2. Toy Construction Crane on North Endzone (Z = +36)
    const craneGroup = new THREE.Group();
    craneGroup.position.set(0, 0, 36);

    const craneMat = makeToon({ color: 0xfacc15 }); // Bright toy yellow
    const craneBlackMat = makeToon({ color: 0x1f2937 });

    // Tower base
    const craneTower = new THREE.Mesh(new THREE.BoxGeometry(1.4, 15, 1.4), craneMat);
    craneTower.position.y = 7.5;
    craneTower.castShadow = true;
    craneGroup.add(craneTower);

    // Operator cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 2.2), craneBlackMat);
    cabin.position.set(0, 15, 0);
    craneGroup.add(cabin);

    // Boom arm
    const boom = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 16), craneMat);
    boom.position.set(0, 16, -4);
    boom.castShadow = true;
    craneGroup.add(boom);

    // Counterweight
    const counterweight = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 3.2), craneBlackMat);
    counterweight.position.set(0, 16, 3.5);
    craneGroup.add(counterweight);

    // Dangling Cable & Gift Box
    const cableGeo = new THREE.CylinderGeometry(0.04, 0.04, 7);
    const cableMat = new THREE.MeshBasicMaterial({ color: 0x374151 });
    const cable = new THREE.Mesh(cableGeo, cableMat);
    cable.position.set(0, 12, -9);
    craneGroup.add(cable);

    // Dangling Gift
    const danglingGift = new THREE.Group();
    danglingGift.position.set(0, 8.5, -9);
    const giftCube = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2), makeToon({ color: 0xef4444 }));
    giftCube.castShadow = true;
    danglingGift.add(giftCube);

    // Ribbon
    const ribMat = makeToon({ color: 0xfacc15 });
    const rib1 = new THREE.Mesh(new THREE.BoxGeometry(2.25, 2.25, 0.4), ribMat);
    const rib2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.25, 2.25), ribMat);
    danglingGift.add(rib1);
    danglingGift.add(rib2);
    craneGroup.add(danglingGift);

    r2.add(craneGroup);

    updaters.push((_dt, time) => {
      if (!r2.visible) return;
      // Gentle sway of crane arm and dangling gift
      const sway = Math.sin(time * 1.2) * 0.12;
      boom.rotation.y = sway;
      danglingGift.position.x = Math.sin(time * 1.2) * 1.1;
      danglingGift.rotation.y = time * 0.8;
      danglingGift.rotation.z = Math.sin(time * 1.5) * 0.08;
    });

    // 3. Low-poly Toy Wooden Train Cars on Side Platforms
    const trainMat = makeToon({ color: 0x0284c7 });
    const trainRedMat = makeToon({ color: 0xf43f5e });
    const trainWheelMat = makeToon({ color: 0x1e293b });

    const createTrainCar = (col: THREE.ColorRepresentation, isEngine: boolean) => {
      const car = new THREE.Group();
      // Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 3.2), makeToon({ color: col }));
      body.position.y = 1.0;
      body.castShadow = true;
      car.add(body);

      if (isEngine) {
        // Cab
        const engCab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 1.4), makeToon({ color: col }));
        engCab.position.set(0, 2.3, 0.8);
        car.add(engCab);
        // Smokestack
        const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 1.2, 10), trainWheelMat);
        stack.position.set(0, 2.1, -0.9);
        car.add(stack);
      }

      // Wheels
      for (const wx of [-0.95, 0.95]) {
        for (const wz of [-1.0, 1.0]) {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.2, 12), trainWheelMat);
          w.rotation.z = Math.PI / 2;
          w.position.set(wx, 0.4, wz);
          car.add(w);
        }
      }
      return car;
    };

    const trainWest = new THREE.Group();
    trainWest.position.set(-19.5, 0, 0);
    const engineW = createTrainCar(0x0284c7, true);
    engineW.position.z = 4;
    const carW1 = createTrainCar(0xf43f5e, false);
    carW1.position.z = 0;
    const carW2 = createTrainCar(0xfacc15, false);
    carW2.position.z = -4;
    trainWest.add(engineW, carW1, carW2);
    r2.add(trainWest);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── ROUND 3: LAYANGAN SORE (Picket Fences, Green Knolls, 3D Kites) ────────
  // ════════════════════════════════════════════════════════════════════════════
  {
    const r3 = groups[2];

    // 1. Floating Grassy Knolls with Low-poly Puffy Trees
    const knollMat = makeToon({ color: 0x4ade80 }); // Vibrant grass green
    const earthMat = makeToon({ color: 0x78350f }); // Brown soil
    const trunkMat = makeToon({ color: 0x854d0e });
    const foliageMat = makeToon({ color: 0x22c55e });

    const knollConfigs = [
      { x: -22, z: 18, r: 4.5, h: 2.2 },
      { x: -23, z: -14, r: 4.0, h: 2.0 },
      { x: 22, z: 18, r: 4.5, h: 2.2 },
      { x: 23, z: -14, r: 4.0, h: 2.0 },
      { x: 0, z: 38, r: 6.5, h: 2.8 },
    ];

    for (const kc of knollConfigs) {
      const kg = new THREE.Group();
      kg.position.set(kc.x, 0, kc.z);

      // Grassy top cap
      const grass = new THREE.Mesh(new THREE.CylinderGeometry(kc.r, kc.r * 1.1, 0.8, 16), knollMat);
      grass.position.y = kc.h;
      grass.receiveShadow = true;
      kg.add(grass);

      // Earth bottom
      const earth = new THREE.Mesh(new THREE.ConeGeometry(kc.r * 1.1, kc.h * 1.8, 16), earthMat);
      earth.rotation.x = Math.PI;
      earth.position.y = kc.h * 0.4;
      kg.add(earth);

      // Cute Cartoon Tree on top
      const tree = new THREE.Group();
      tree.position.y = kc.h + 0.4;

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 2.5, 8), trunkMat);
      trunk.position.y = 1.25;
      trunk.castShadow = true;
      tree.add(trunk);

      // Puffy foliage cluster (3 spheres)
      const f1 = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 10), foliageMat);
      f1.position.set(0, 3.2, 0);
      f1.castShadow = true;
      tree.add(f1);

      const f2 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 8), foliageMat);
      f2.position.set(-0.7, 2.8, 0.4);
      tree.add(f2);

      const f3 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 10, 8), foliageMat);
      f3.position.set(0.6, 2.9, -0.4);
      tree.add(f3);

      kg.add(tree);
      r3.add(kg);
    }

    // 2. White Picket Fences along outer perimeter
    const fenceMat = makeToon({ color: 0xf8fafc });
    const fenceGeo = new THREE.BoxGeometry(0.2, 1.2, 0.08);

    const makeFenceRow = (startX: number, startZ: number, count: number, dirZ: boolean) => {
      const fGroup = new THREE.Group();
      for (let i = 0; i < count; i++) {
        const post = new THREE.Mesh(fenceGeo, fenceMat);
        const x = dirZ ? startX : startX + i * 0.6;
        const z = dirZ ? startZ + i * 0.6 : startZ;
        post.position.set(x, 0.6, z);
        post.castShadow = true;
        fGroup.add(post);
      }
      // Horizontal rails
      const len = count * 0.6;
      const railGeo = dirZ ? new THREE.BoxGeometry(0.12, 0.1, len) : new THREE.BoxGeometry(len, 0.1, 0.12);
      const rail1 = new THREE.Mesh(railGeo, fenceMat);
      rail1.position.set(
        dirZ ? startX : startX + len / 2 - 0.3,
        0.4,
        dirZ ? startZ + len / 2 - 0.3 : startZ
      );
      const rail2 = rail1.clone();
      rail2.position.y = 0.9;
      fGroup.add(rail1, rail2);
      return fGroup;
    };

    r3.add(makeFenceRow(-19, -18, 20, true));
    r3.add(makeFenceRow(19, -18, 20, true));

    // 3. 3D Flying Indonesian Kites (Layang-layang) floating & swaying in the sunset sky
    const kiteTex1 = createKiteCanvas("stripes", "#ef4444", "#ffffff");
    const kiteTex2 = createKiteCanvas("diamond", "#3b82f6", "#fde047");
    const kiteTex3 = createKiteCanvas("sunburst", "#8b5cf6", "#ec4899");

    const kiteMat1 = makeToon({ map: kiteTex1 });
    const kiteMat2 = makeToon({ map: kiteTex2 });
    const kiteMat3 = makeToon({ map: kiteTex3 });

    // Diamond kite geometry
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

    const kites: { group: THREE.Group; tailRibbons: THREE.Mesh[]; basePos: THREE.Vector3; speed: number; phase: number }[] = [];

    const kiteConfigs = [
      { mat: kiteMat1, pos: new THREE.Vector3(-12, 17, 10), scale: 1.4, speed: 1.4, phase: 0.0 },
      { mat: kiteMat2, pos: new THREE.Vector3(14, 20, 18), scale: 1.6, speed: 1.1, phase: 1.8 },
      { mat: kiteMat3, pos: new THREE.Vector3(-4, 22, 28), scale: 1.8, speed: 0.9, phase: 3.5 },
      { mat: kiteMat1, pos: new THREE.Vector3(10, 15, -6), scale: 1.3, speed: 1.6, phase: 4.8 },
    ];

    for (const kc of kiteConfigs) {
      const kg = new THREE.Group();
      kg.position.copy(kc.pos);

      // Kite Body
      const body = new THREE.Mesh(kiteGeo, kc.mat);
      body.scale.setScalar(kc.scale);
      kg.add(body);

      // Segmented Ribbon Tail (3 segments)
      const tailRibbons: THREE.Mesh[] = [];
      const tailMat = makeToon({ color: 0xfacc15 });
      for (let s = 0; s < 4; s++) {
        const seg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.9, 0.04), tailMat);
        seg.position.set(0, -2.2 - s * 0.9, 0);
        kg.add(seg);
        tailRibbons.push(seg);
      }

      r3.add(kg);
      kites.push({ group: kg, tailRibbons, basePos: kc.pos.clone(), speed: kc.speed, phase: kc.phase });
    }

    updaters.push((_dt, time) => {
      if (!r3.visible) return;
      for (const k of kites) {
        const t = time * k.speed + k.phase;
        // Natural wind swaying
        k.group.position.x = k.basePos.x + Math.sin(t * 0.8) * 1.8;
        k.group.position.y = k.basePos.y + Math.cos(t * 1.2) * 0.9;
        k.group.rotation.z = Math.sin(t * 1.5) * 0.25;
        k.group.rotation.x = 0.35 + Math.sin(t * 1.0) * 0.12;

        // Tail undulating wave
        for (let s = 0; s < k.tailRibbons.length; s++) {
          const seg = k.tailRibbons[s];
          seg.position.x = Math.sin(t * 2.2 - s * 0.8) * (0.3 + s * 0.2);
          seg.rotation.z = Math.cos(t * 2.0 - s * 0.7) * 0.35;
        }
      }
    });

    // 4. Spinning Colorful Pinwheels (Kincir Angin) on fences
    const pinwheelGeo = new THREE.ConeGeometry(0.6, 0.2, 4);
    pinwheelGeo.rotateX(Math.PI / 2);
    const pinwheelMat = makeToon({ color: 0xef4444 });
    const pinwheels: THREE.Mesh[] = [];

    for (const px of [-18, 18]) {
      for (const pz of [-8, 8]) {
        const pw = new THREE.Mesh(pinwheelGeo, pinwheelMat);
        pw.position.set(px, 2.2, pz);
        r3.add(pw);
        pinwheels.push(pw);
      }
    }

    updaters.push((_dt, time) => {
      if (!r3.visible) return;
      for (const pw of pinwheels) {
        pw.rotation.z = time * 8.0;
      }
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── ROUND 4: PASAR MALAM (Mini Ferris Wheel, Gerobak Cart, Circus Tents) ──
  // ════════════════════════════════════════════════════════════════════════════
  {
    const r4 = groups[3];

    // 1. 3D Mini Rotating Ferris Wheel (Bianglala Pasar Malam) on North Overlook (Z = +38)
    const ferrisGroup = new THREE.Group();
    ferrisGroup.position.set(0, 0, 38);

    // Support A-frame legs
    const frameMat = makeToon({ color: 0x3b82f6 });
    const legGeo = new THREE.CylinderGeometry(0.3, 0.45, 16, 8);

    const legL = new THREE.Mesh(legGeo, frameMat);
    legL.position.set(-4.5, 7.5, 0);
    legL.rotation.z = -0.32;
    legL.castShadow = true;

    const legR = new THREE.Mesh(legGeo, frameMat);
    legR.position.set(4.5, 7.5, 0);
    legR.rotation.z = 0.32;
    legR.castShadow = true;

    ferrisGroup.add(legL, legR);

    // Rotating Wheel Assembly
    const wheelCenter = new THREE.Group();
    wheelCenter.position.set(0, 14, 0);
    ferrisGroup.add(wheelCenter);

    // Outer & Inner Neon Rims
    const neonRimMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const rim1 = new THREE.Mesh(new THREE.TorusGeometry(8.5, 0.25, 8, 36), neonRimMat);
    const rim2 = new THREE.Mesh(new THREE.TorusGeometry(6.0, 0.2, 8, 32), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    wheelCenter.add(rim1, rim2);

    // 8 Spokes
    const spokeMat = makeToon({ color: 0xffffff });
    const spokeGeo = new THREE.CylinderGeometry(0.12, 0.12, 17, 6);
    for (let i = 0; i < 4; i++) {
      const sp = new THREE.Mesh(spokeGeo, spokeMat);
      sp.rotation.z = (i / 4) * Math.PI;
      wheelCenter.add(sp);
    }

    // 8 Hanging Gondolas (Passenger Carts)
    const gondolas: THREE.Group[] = [];
    const gondolaColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0xec4899, 0x8b5cf6, 0x06b6d4, 0xf97316];

    for (let i = 0; i < 8; i++) {
      const theta = (i / 8) * Math.PI * 2;
      const gx = Math.cos(theta) * 8.5;
      const gy = Math.sin(theta) * 8.5;

      const gondola = new THREE.Group();
      gondola.position.set(gx, gy, 0);

      // Cabin box
      const cart = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 1.4, 1.4),
        makeToon({ color: gondolaColors[i] })
      );
      cart.position.y = -0.7;
      cart.castShadow = true;
      gondola.add(cart);

      // Roof canopy
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(1.3, 0.8, 4),
        makeToon({ color: 0xffffff })
      );
      roof.position.y = 0.4;
      roof.rotation.y = Math.PI / 4;
      gondola.add(roof);

      wheelCenter.add(gondola);
      gondolas.push(gondola);
    }

    r4.add(ferrisGroup);

    updaters.push((_dt, time) => {
      if (!r4.visible) return;
      const rotAngle = time * 0.45;
      wheelCenter.rotation.z = rotAngle;
      // Keep gondolas hanging upright (counter-rotation)
      for (const g of gondolas) {
        g.rotation.z = -rotAngle;
      }
    });

    // 2. Traditional Indonesian *Gerobak* Carnival Street Food Cart on West Sideline (X = -20)
    const gerobakGroup = new THREE.Group();
    gerobakGroup.position.set(-20, 0, -2);
    gerobakGroup.rotation.y = Math.PI / 2;

    const woodCartMat = makeToon({ color: 0x92400e });
    const woodRoofMat = makeToon({ color: 0xd97706 });

    // Table body
    const cartBody = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.8, 2.2), woodCartMat);
    cartBody.position.y = 1.6;
    cartBody.castShadow = true;
    gerobakGroup.add(cartBody);

    // Glass display case on cart
    const glassCase = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.4, 1.8),
      makeToon({ color: 0x38bdf8, transparent: true, opacity: 0.8 })
    );
    glassCase.position.set(-0.6, 3.2, 0);
    gerobakGroup.add(glassCase);

    // Roof pillars & Awning
    for (const px of [-1.9, 1.9]) {
      for (const pz of [-0.9, 0.9]) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 6), woodCartMat);
        pillar.position.set(px, 3.8, pz);
        gerobakGroup.add(pillar);
      }
    }
    const cartRoof = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.3, 2.6), woodRoofMat);
    cartRoof.position.y = 5.3;
    gerobakGroup.add(cartRoof);

    // Glowing Hanging Warm Lanterns
    const lanternMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const lant1 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), lanternMat);
    lant1.position.set(-1.2, 4.6, 1.0);
    const lant2 = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), lanternMat);
    lant2.position.set(1.2, 4.6, 1.0);
    gerobakGroup.add(lant1, lant2);

    // Cart Big Wooden Spoke Wheels
    const cartWheelMat = makeToon({ color: 0x451a03 });
    for (const wz of [-1.15, 1.15]) {
      const cw = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.15, 8, 24), cartWheelMat);
      cw.position.set(0, 1.0, wz);
      gerobakGroup.add(cw);
    }
    r4.add(gerobakGroup);

    // 3. Glowing Carnival Festoon Light Garland across East and West sides
    const garlandColors = [0xef4444, 0xfacc15, 0x10b981, 0x3b82f6, 0xec4899];
    for (const side of [-1, 1]) {
      const garland = new THREE.Group();
      garland.position.set(side * 17.5, 6, 0);
      for (let i = 0; i < 18; i++) {
        const z = -20 + i * 2.3;
        const sag = Math.sin((i / 18) * Math.PI) * 1.5;
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.24, 8, 8),
          new THREE.MeshBasicMaterial({ color: garlandColors[i % garlandColors.length] })
        );
        bulb.position.set(0, -sag, z);
        garland.add(bulb);
      }
      r4.add(garland);
    }

    // 4. Place Tripo Bumper Props around the carnival arena perimeter
    placeTripoModel("bumper", r4, new THREE.Vector3(-19, 0.5, 12), new THREE.Euler(0, 0, 0), 2.0);
    placeTripoModel("bumper", r4, new THREE.Vector3(19, 0.5, 12), new THREE.Euler(0, 0, 0), 2.0);
    placeTripoModel("bumper", r4, new THREE.Vector3(19, 0.5, -12), new THREE.Euler(0, 0, 0), 2.0);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── ROUND 5: ATAP PENUH BINTANG (Rooftop City, Crescent Moon, Stars) ─────
  // ════════════════════════════════════════════════════════════════════════════
  {
    const r5 = groups[4];

    // 1. Giant Glowing 3D Golden Crescent Moon floating in the midnight sky (Z = +32, Y = 24)
    const moonGroup = new THREE.Group();
    moonGroup.position.set(0, 24, 32);

    // Subtractive shape simulation: outer gold ring arc with tapered tips
    const moonGeo = new THREE.RingGeometry(4.0, 5.5, 32, 1, 0, Math.PI * 1.25);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      side: THREE.DoubleSide,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.rotation.z = 0.55;
    moonGroup.add(moonMesh);

    // Glowing core sphere for volumetric glow
    const moonGlow = new THREE.Mesh(
      new THREE.SphereGeometry(2.8, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xfef3c7, transparent: true, opacity: 0.85 })
    );
    moonGlow.position.set(2.2, 2.0, -0.5);
    moonGroup.add(moonGlow);

    r5.add(moonGroup);

    updaters.push((_dt, time) => {
      if (!r5.visible) return;
      moonGroup.position.y = 24 + Math.sin(time * 0.8) * 0.8;
      moonGroup.rotation.y = Math.sin(time * 0.5) * 0.15;
    });

    // 2. 3D Twinkling Starlight Crystals (Faceted 3D Stars)
    const starGeo = new THREE.OctahedronGeometry(0.9, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffe66d });
    const stars: THREE.Mesh[] = [];

    for (let i = 0; i < 24; i++) {
      const st = new THREE.Mesh(starGeo, starMat);
      const angle = (i / 24) * Math.PI * 2;
      const dist = 22 + (i % 5) * 5;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist + 5;
      const y = 14 + (i % 6) * 2.2;

      st.position.set(x, y, z);
      st.scale.setScalar(0.7 + (i % 3) * 0.35);
      r5.add(st);
      stars.push(st);
    }

    updaters.push((_dt, time) => {
      if (!r5.visible) return;
      for (let i = 0; i < stars.length; i++) {
        const st = stars[i];
        st.rotation.x = time * (1.2 + (i % 3) * 0.4);
        st.rotation.y = time * (0.9 + (i % 2) * 0.5);
        st.scale.setScalar((0.8 + Math.sin(time * 3 + i) * 0.25) * ((i % 3) * 0.3 + 0.7));
      }
    });

    // 3. Rooftop Architecture: Brick Chimney Stacks & Steel Railings along perimeter
    const chimneyMat = makeToon({ color: 0x991b1b }); // Brick red
    const capMat = makeToon({ color: 0x475569 }); // Slate grey

    const chimneys = [
      { x: -21, z: -16, h: 5.5 },
      { x: -22, z: 8, h: 4.5 },
      { x: 21, z: -16, h: 5.5 },
      { x: 22, z: 8, h: 4.5 },
    ];

    for (const c of chimneys) {
      const cg = new THREE.Group();
      cg.position.set(c.x, 0, c.z);

      const stack = new THREE.Mesh(new THREE.BoxGeometry(2.0, c.h, 2.0), chimneyMat);
      stack.position.y = c.h / 2;
      stack.castShadow = true;
      cg.add(stack);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.4, 2.4), capMat);
      cap.position.y = c.h + 0.2;
      cg.add(cap);

      // Twin clay pots
      for (const px of [-0.4, 0.4]) {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.8, 8), capMat);
        pot.position.set(px, c.h + 0.8, 0);
        cg.add(pot);
      }
      r5.add(cg);
    }

    // 4. Grand Champion Trophy & Master Gift Pedestal on North Overlook (Z = +36)
    const daisGroup = new THREE.Group();
    daisGroup.position.set(0, 0, 36);

    // Marble Dais steps
    const daisMat = makeToon({ color: 0x1e1b4b });
    const goldTrimMat = makeToon({ color: 0xffd166 });

    const step1 = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.5, 1.2, 24), daisMat);
    step1.position.y = 0.6;
    step1.receiveShadow = true;
    daisGroup.add(step1);

    const step2 = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.8, 1.0, 24), daisMat);
    step2.position.y = 1.7;
    step2.receiveShadow = true;
    daisGroup.add(step2);

    const trim = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.15, 8, 32), goldTrimMat);
    trim.rotation.x = Math.PI / 2;
    trim.position.y = 2.2;
    daisGroup.add(trim);

    r5.add(daisGroup);

    // Place Tripo Trophy and Host Gift atop the Champion Dais
    placeTripoModel("trophy", daisGroup, new THREE.Vector3(0, 2.3, 0), new THREE.Euler(0, 0, 0), 2.5);
    placeTripoModel("host-gift", daisGroup, new THREE.Vector3(-3.2, 2.3, -1), new THREE.Euler(0, 0.4, 0), 1.8);
    placeTripoModel("host-gift", daisGroup, new THREE.Vector3(3.2, 2.3, -1), new THREE.Euler(0, -0.4, 0), 1.8);
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
