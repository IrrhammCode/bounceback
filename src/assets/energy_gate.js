/**
 * BOUNCEBACK! — Holographic Championship Energy Scoring Gate
 *
 * Arcade Fall Guys / Rocket League aesthetic:
 * - Thick, rounded futuristic goalposts with glowing neon edge runners
 * - Arched top crossbar with illuminated score sensor diodes
 * - Holographic glowing laser energy net with grid scanlines
 * - Floating score multiplier crystal crown atop the gate
 * - Sturdy rounded base pods with neon energy ground rings
 */
export default function generate(THREE) {
  const g = new THREE.Group();

  // Primary team accent material (recolored dynamically by engine.ts)
  const neonMat = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    emissive: 0xffd166,
    emissiveIntensity: 0.75,
    roughness: 0.15,
    metalness: 0.8,
    name: "neon_emissive",
  });

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.2,
    metalness: 0.1,
    name: "metal_painted",
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.4,
    metalness: 0.5,
    name: "metal_dark",
  });

  // Holographic energy curtain texture
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillRect(0, 0, 256, 256);

    // Glowing energy grid / honeycomb lines
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    for (let y = 0; y < 256; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y);
      ctx.stroke();
    }
    for (let x = 0; x < 256; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
  }
  const netTex = new THREE.CanvasTexture(c);
  netTex.wrapS = THREE.RepeatWrapping;
  netTex.wrapT = THREE.RepeatWrapping;
  netTex.repeat.set(4, 4);

  const netMat = new THREE.MeshBasicMaterial({
    map: netTex,
    color: 0xffd166,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
    depthWrite: false,
    name: "neon_emissive",
  });

  const gateWidth = 3.6;
  const halfW = gateWidth / 2;
  const gateHeight = 3.8;

  // 1. Sturdy Base Pods
  for (const bx of [-halfW, halfW]) {
    const basePod = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 0.35, 18), darkMat);
    basePod.position.set(bx, 0.175, 0);
    basePod.receiveShadow = true;
    g.add(basePod);

    const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.05, 8, 24), neonMat);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.set(bx, 0.2, 0);
    g.add(baseRing);
  }

  // 2. Thick Rounded Goalposts
  for (const px of [-halfW, halfW]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, gateHeight, 16), frameMat);
    post.position.set(px, gateHeight / 2 + 0.35, 0);
    post.castShadow = true;
    g.add(post);

    // Glowing Neon Vertical Guide Rod on Post
    const neonRod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, gateHeight, 8), neonMat);
    neonRod.position.set(px + (px < 0 ? 0.22 : -0.22), gateHeight / 2 + 0.35, 0.05);
    g.add(neonRod);
  }

  // 3. Top Crossbar with Neon Header
  const crossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, gateWidth + 0.44, 16), frameMat);
  crossbar.rotation.z = Math.PI / 2;
  crossbar.position.set(0, gateHeight + 0.35, 0);
  crossbar.castShadow = true;
  g.add(crossbar);

  const neonTopStrip = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, gateWidth + 0.35, 8), neonMat);
  neonTopStrip.rotation.z = Math.PI / 2;
  neonTopStrip.position.set(0, gateHeight + 0.58, 0);
  g.add(neonTopStrip);

  // 4. Holographic Glowing Energy Net Curtain
  const netMesh = new THREE.Mesh(new THREE.PlaneGeometry(gateWidth - 0.4, gateHeight - 0.1), netMat);
  netMesh.position.set(0, gateHeight / 2 + 0.35, 0);
  g.add(netMesh);

  // Vertical Laser Light Strands
  const laserMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
  for (let l = -3; l <= 3; l++) {
    const laser = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, gateHeight - 0.2, 6), laserMat);
    laser.position.set((l / 3.5) * (halfW - 0.25), gateHeight / 2 + 0.35, 0);
    g.add(laser);
  }

  // 5. Floating Score Multiplier Crystal Diamond atop Crossbar
  const crownGeo = new THREE.OctahedronGeometry(0.42, 0);
  const crownMesh = new THREE.Mesh(crownGeo, neonMat);
  crownMesh.position.set(0, gateHeight + 1.05, 0);
  crownMesh.scale.set(1.0, 1.35, 1.0);
  g.add(crownMesh);

  for (const ox of [-halfW, halfW]) {
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), neonMat);
    orb.position.set(ox, gateHeight + 0.72, 0);
    g.add(orb);
  }

  // Center alignment normalization
  const box = new THREE.Box3();
  box.setFromObject(g);
  const cVec = box.getCenter(new THREE.Vector3());
  g.children.forEach((o) => {
    o.position.x -= cVec.x;
    o.position.y -= box.min.y;
    o.position.z -= cVec.z;
  });

  return g;
}
