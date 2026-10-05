/**
 * BOUNCEBACK! — Themed Sky & Horizon Accents ("Atmosphere Per Round")
 *
 * Designed to preserve 100% unobstructed views of the iconic 360° Olympic Colosseum
 * stadium and all 4 grandstands with 600+ animated cheering Fall Guys beans (left, right, front, back).
 *
 * Each round features high-altitude sky accents and horizon setpieces (Y >= 18m, or far distance):
 * - Round 1: Kamar Masa Kecil (Paper Airplanes & Floating Mobile in the morning sky)
 * - Round 2: Kota Mainan (Distant Skyline Crane & Toy Zeppelin soaring overhead)
 * - Round 3: Layangan Sore (Fluttering 3D Kites swaying in the sunset sky)
 * - Round 4: Pasar Malam (Glowing Carnival Festoon Garlands & Distant Horizon Ferris Wheel)
 * - Round 5: Atap Penuh Bintang (Glowing 3D Crescent Moon & Twinkling Constellation Stars)
 */
import * as THREE from "three";
import { makeToon } from "./toon";

export interface ThemedDioramaManager {
  root: THREE.Group;
  setTheme: (roundNumber: number) => void;
  update: (dt: number, time: number) => void;
  dispose: () => void;
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

  const groups: THREE.Group[] = [];
  for (let i = 1; i <= 5; i++) {
    const g = new THREE.Group();
    g.name = `Diorama_Round_${i}`;
    g.visible = i === 1;
    root.add(g);
    groups.push(g);
  }

  const updaters: ((dt: number, time: number) => void)[] = [];

  // ════════════════════════════════════════════════════════════════════════════
  // ─── ROUND 1: KAMAR MASA KECIL (Paper Planes & Hanging Star Mobile) ─────────
  // ════════════════════════════════════════════════════════════════════════════
  {
    const r1 = groups[0];

    // Soaring 3D Paper Airplanes in high elliptical orbit (Y = 19m to 23m)
    const paperPlaneGeo = new THREE.BufferGeometry();
    const planeVerts = new Float32Array([
      // Left Wing
      0, 0, 2.5,  -2.2, 0.4, -1.5,  0, 0.3, -1.0,
      // Right Wing
      0, 0, 2.5,   0, 0.3, -1.0,   2.2, 0.4, -1.5,
      // Keel Left
      0, 0, 2.5,   0, -0.6, -1.0,  0, 0.3, -1.0,
      // Keel Right
      0, 0, 2.5,   0, 0.3, -1.0,   0, -0.6, -1.0,
    ]);
    paperPlaneGeo.setAttribute("position", new THREE.BufferAttribute(planeVerts, 3));
    paperPlaneGeo.computeVertexNormals();

    const planeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.6,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });

    const planes: { mesh: THREE.Mesh; radius: number; speed: number; phase: number; y: number }[] = [];
    for (let p = 0; p < 4; p++) {
      const pm = new THREE.Mesh(paperPlaneGeo, planeMat);
      pm.castShadow = true;
      r1.add(pm);
      planes.push({
        mesh: pm,
        radius: 26 + p * 6,
        speed: 0.35 + p * 0.08,
        phase: (p / 4) * Math.PI * 2,
        y: 20 + p * 1.5,
      });
    }

    // Floating Hanging Star Mobile high overhead (Y = 22m)
    const mobileGroup = new THREE.Group();
    mobileGroup.position.set(0, 22.0, 0);

    const crossBar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 12, 8), makeToon({ color: 0xf59e0b }));
    crossBar1.rotation.z = Math.PI / 2;
    const crossBar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 12, 8), makeToon({ color: 0xf59e0b }));
    crossBar2.rotation.x = Math.PI / 2;
    mobileGroup.add(crossBar1, crossBar2);

    const starColors = [0x38bdf8, 0xfacc15, 0xf43f5e, 0x10b981];
    for (let s = 0; s < 4; s++) {
      const ang = (s / 4) * Math.PI * 2;
      const star = new THREE.Mesh(new THREE.OctahedronGeometry(1.2, 0), makeToon({ color: starColors[s] }));
      star.position.set(Math.cos(ang) * 5.5, -2.5, Math.sin(ang) * 5.5);
      mobileGroup.add(star);
    }
    r1.add(mobileGroup);

    updaters.push((_dt, time) => {
      if (!r1.visible) return;
      mobileGroup.rotation.y = time * 0.3;

      for (const p of planes) {
        const ang = time * p.speed + p.phase;
        p.mesh.position.set(
          Math.cos(ang) * p.radius,
          p.y + Math.sin(time * 1.2 + p.phase) * 0.8,
          Math.sin(ang) * (p.radius * 0.7)
        );
        // Tangent heading with smooth banking tilt
        p.mesh.rotation.y = -ang + Math.PI / 2;
        p.mesh.rotation.z = 0.25;
        p.mesh.rotation.x = Math.sin(time * 1.5) * 0.08;
      }
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── ROUND 2: KOTA MAINAN (Distant Crane & High Toy Zeppelin) ───────────────
  // ════════════════════════════════════════════════════════════════════════════
  {
    const r2 = groups[1];

    // High Construction Tower Crane on far horizon (Z = 52m, well behind stadium)
    const crane = new THREE.Group();
    crane.position.set(0, 0, 52);
    const mast = new THREE.Mesh(new THREE.BoxGeometry(2.0, 28, 2.0), makeToon({ color: 0xfacc15 }));
    mast.position.y = 14;
    const boom = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 28), makeToon({ color: 0xfacc15 }));
    boom.position.set(0, 27, -6);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.8, 3.2, 3.2), makeToon({ color: 0x0284c7 }));
    cab.position.set(0, 25.5, 0);
    const hook = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.4), makeToon({ color: 0xef4444 }));
    hook.position.set(0, 18, -14);
    crane.add(mast, boom, cab, hook);
    r2.add(crane);

    // Floating Toy Zeppelin high overhead (Y = 24m)
    const zeppelin = new THREE.Group();
    zeppelin.position.set(0, 24, 0);
    const hull = new THREE.Mesh(new THREE.SphereGeometry(3.5, 16, 12), makeToon({ color: 0x06b6d4 }));
    hull.scale.set(1.0, 0.8, 2.8);
    const gondola = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 3.2), makeToon({ color: 0xfbbf24 }));
    gondola.position.y = -3.2;
    zeppelin.add(hull, gondola);
    r2.add(zeppelin);

    updaters.push((_dt, time) => {
      if (!r2.visible) return;
      boom.rotation.y = Math.sin(time * 0.8) * 0.18;
      hook.position.x = Math.sin(time * 0.8) * 1.5;

      const zAng = time * 0.25;
      zeppelin.position.set(Math.sin(zAng) * 32, 24 + Math.sin(time * 0.6) * 1.2, Math.cos(zAng) * 22);
      zeppelin.rotation.y = zAng + Math.PI / 2;
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── ROUND 3: LAYANGAN SORE (Fluttering 3D Kites in Sunset Sky) ─────────────
  // ════════════════════════════════════════════════════════════════════════════
  {
    const r3 = groups[2];
    const kiteTex = createKiteCanvas("stripes", "#ef4444", "#ffffff");
    const kiteGeo = new THREE.BufferGeometry();
    const kVerts = new Float32Array([
      0, 2.2, 0,   -1.5, 0.5, 0.08,  0, -2.2, 0,
      0, 2.2, 0,    0, -2.2, 0,     1.5, 0.5, 0.08,
    ]);
    kiteGeo.setAttribute("position", new THREE.BufferAttribute(kVerts, 3));
    kiteGeo.computeVertexNormals();

    const kites: { mesh: THREE.Mesh; basePos: THREE.Vector3; speed: number; phase: number }[] = [];
    const kitePositions = [
      new THREE.Vector3(-14, 21, 22),
      new THREE.Vector3(16, 23, 26),
      new THREE.Vector3(-22, 19, -15),
      new THREE.Vector3(22, 22, -10),
      new THREE.Vector3(0, 24, -28),
    ];

    for (let k = 0; k < kitePositions.length; k++) {
      const km = new THREE.Mesh(kiteGeo, makeToon({ map: kiteTex }));
      km.scale.setScalar(1.6);
      km.position.copy(kitePositions[k]);
      r3.add(km);
      kites.push({
        mesh: km,
        basePos: kitePositions[k].clone(),
        speed: 1.0 + k * 0.22,
        phase: k * 1.4,
      });
    }

    updaters.push((_dt, time) => {
      if (!r3.visible) return;
      for (const k of kites) {
        const t = time * k.speed + k.phase;
        k.mesh.position.x = k.basePos.x + Math.sin(t * 0.9) * 2.2;
        k.mesh.position.y = k.basePos.y + Math.cos(t * 1.3) * 1.1;
        k.mesh.rotation.z = Math.sin(t * 1.6) * 0.28;
        k.mesh.rotation.y = Math.cos(t * 0.8) * 0.15;
      }
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── ROUND 4: PASAR MALAM (Festoon Lights & Distant Horizon Ferris Wheel) ───
  // ════════════════════════════════════════════════════════════════════════════
  {
    const r4 = groups[3];

    // Distant spinning Ferris Wheel high against the night sky (Z = 62m)
    const ferrisGroup = new THREE.Group();
    ferrisGroup.position.set(0, 0, 62);
    const aFrameL = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 28, 8), makeToon({ color: 0x3b82f6 }));
    aFrameL.position.set(-6, 14, 0);
    aFrameL.rotation.z = -0.22;
    const aFrameR = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.6, 28, 8), makeToon({ color: 0x3b82f6 }));
    aFrameR.position.set(6, 14, 0);
    aFrameR.rotation.z = 0.22;
    ferrisGroup.add(aFrameL, aFrameR);

    const wheelCenter = new THREE.Group();
    wheelCenter.position.set(0, 26, 0);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(12, 0.35, 8, 36), new THREE.MeshBasicMaterial({ color: 0xf43f5e }));
    wheelCenter.add(rim);

    const gondolas: THREE.Group[] = [];
    for (let i = 0; i < 10; i++) {
      const th = (i / 10) * Math.PI * 2;
      const g = new THREE.Group();
      g.position.set(Math.cos(th) * 12, Math.sin(th) * 12, 0);
      const cart = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.8, 1.8), makeToon({ color: 0xfacc15 }));
      cart.position.y = -0.9;
      g.add(cart);
      wheelCenter.add(g);
      gondolas.push(g);
    }
    ferrisGroup.add(wheelCenter);
    r4.add(ferrisGroup);

    // Glowing festoon string lights draped across upper stadium canopy (Y = 16m)
    const bulbCols = [0xef4444, 0xfacc15, 0x10b981, 0x3b82f6, 0xec4899];
    const garland = new THREE.Group();
    for (let a = 0; a < 36; a++) {
      const th = (a / 36) * Math.PI * 2;
      const rx = Math.cos(th) * 22;
      const rz = Math.sin(th) * 34;
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), new THREE.MeshBasicMaterial({ color: bulbCols[a % bulbCols.length] }));
      bulb.position.set(rx, 15.5 + Math.sin(a * 2.0) * 0.9, rz);
      garland.add(bulb);
    }
    r4.add(garland);

    updaters.push((_dt, time) => {
      if (!r4.visible) return;
      const rot = time * 0.35;
      wheelCenter.rotation.z = rot;
      for (const g of gondolas) g.rotation.z = -rot;
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── ROUND 5: ATAP PENUH BINTANG (Glowing 3D Crescent Moon & Starlight) ─────
  // ════════════════════════════════════════════════════════════════════════════
  {
    const r5 = groups[4];

    // High 3D Glowing Crescent Moon in northern midnight sky (Z = 46m, Y = 28m)
    const moonGroup = new THREE.Group();
    moonGroup.position.set(0, 28, 46);

    const moonShape = new THREE.Shape();
    moonShape.absarc(0, 0, 5.5, Math.PI * 0.15, Math.PI * 1.85, false);
    moonShape.absarc(1.8, 0, 4.6, Math.PI * 1.8, Math.PI * 0.2, true);
    const moonGeo = new THREE.ExtrudeGeometry(moonShape, { depth: 1.0, bevelEnabled: true, bevelSize: 0.25, bevelThickness: 0.25 });
    const moonMesh = new THREE.Mesh(moonGeo, new THREE.MeshBasicMaterial({ color: 0xfef08a }));
    moonMesh.rotation.z = 0.42;
    moonGroup.add(moonMesh);

    // Warm lunar halo glow
    const haloGeo = new THREE.RingGeometry(5.0, 9.5, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    moonGroup.add(halo);
    r5.add(moonGroup);

    // Twinkling 3D Gift Constellation Stars overhead
    const starField = new THREE.Group();
    const starGeo = new THREE.OctahedronGeometry(0.45, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const stars: { mesh: THREE.Mesh; baseScale: number; speed: number; phase: number }[] = [];

    for (let s = 0; s < 45; s++) {
      const sm = new THREE.Mesh(starGeo, starMat);
      const sx = (Math.random() - 0.5) * 60;
      const sy = 24 + Math.random() * 14;
      const sz = (Math.random() - 0.5) * 80;
      sm.position.set(sx, sy, sz);
      starField.add(sm);
      stars.push({
        mesh: sm,
        baseScale: 0.8 + Math.random() * 0.6,
        speed: 2.0 + Math.random() * 3.0,
        phase: Math.random() * Math.PI * 2,
      });
    }
    r5.add(starField);

    updaters.push((_dt, time) => {
      if (!r5.visible) return;
      moonMesh.rotation.z = 0.42 + Math.sin(time * 0.5) * 0.05;
      for (const st of stars) {
        const scl = st.baseScale * (0.8 + Math.sin(time * st.speed + st.phase) * 0.4);
        st.mesh.scale.setScalar(scl);
      }
    });
  }

  return {
    root,
    setTheme: (roundNumber: number) => {
      const rn = Math.max(1, Math.min(5, Math.floor(roundNumber)));
      for (let i = 0; i < groups.length; i++) {
        groups[i].visible = i === rn - 1;
      }
    },
    update: (dt: number, time: number) => {
      for (const fn of updaters) fn(dt, time);
    },
    dispose: () => {
      parent.remove(root);
    },
  };
}
