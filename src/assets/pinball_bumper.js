/**
 * BOUNCEBACK! — Pinball Bumper (Neon Mushroom Cylinder with Multiplier Gem)
 * Pure Three.js code asset meeting the 404 asset contract.
 */
export default function generate(THREE) {
  const g = new THREE.Group();

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x8338ec,
    roughness: 0.25,
    metalness: 0.2,
    name: 'plastic_gloss'
  });

  const capMat = new THREE.MeshStandardMaterial({
    color: 0x9333ea,
    roughness: 0.18,
    metalness: 0.35,
    name: 'plastic_gloss'
  });

  const goldNeonMat = new THREE.MeshBasicMaterial({
    color: 0xffd166,
    name: 'neon_emissive'
  });

  const cyanNeonMat = new THREE.MeshBasicMaterial({
    color: 0x27e5ff,
    name: 'neon_emissive'
  });

  const whiteStripeMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.85,
    name: 'neon_emissive'
  });

  const darkRubberMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.6,
    metalness: 0.1,
    name: 'rubber'
  });

  // 1. Heavy Rubber Ground Base Disc
  const discGeo = new THREE.CylinderGeometry(0.98, 1.05, 0.1, 24);
  const disc = new THREE.Mesh(discGeo, darkRubberMat);
  disc.position.y = 0.05;
  disc.receiveShadow = true;
  g.add(disc);

  // Ground Neon Halo Ring
  const haloGeo = new THREE.RingGeometry(1.05, 1.18, 24);
  const halo = new THREE.Mesh(haloGeo, cyanNeonMat);
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.02;
  g.add(halo);

  // 2. Base Cylinder Pillar with Tapered Waist
  const pillarGeo = new THREE.CylinderGeometry(0.68, 0.86, 0.95, 20);
  const pillar = new THREE.Mesh(pillarGeo, baseMat);
  pillar.position.y = 0.52;
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  g.add(pillar);

  // 3. Lower & Mid Neon Shock Absorber Rings
  const ring1Geo = new THREE.TorusGeometry(0.88, 0.055, 8, 24);
  const ring1 = new THREE.Mesh(ring1Geo, goldNeonMat);
  ring1.rotation.x = -Math.PI * 0.5;
  ring1.position.y = 0.16;
  g.add(ring1);

  const ring2Geo = new THREE.TorusGeometry(0.74, 0.055, 8, 24);
  const ring2 = new THREE.Mesh(ring2Geo, goldNeonMat);
  ring2.rotation.x = -Math.PI * 0.5;
  ring2.position.y = 0.62;
  g.add(ring2);

  // 4. Mushroom Dome Cap (Glossy Bouncy Bumper Head)
  const capGeo = new THREE.SphereGeometry(1.02, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 0.98;
  cap.castShadow = true;
  g.add(cap);

  // Decorative Accent Ring on Cap Edge
  const capLipGeo = new THREE.TorusGeometry(1.02, 0.07, 8, 28);
  const capLip = new THREE.Mesh(capLipGeo, goldNeonMat);
  capLip.rotation.x = -Math.PI * 0.5;
  capLip.position.y = 0.98;
  g.add(capLip);

  // Upper Concentric White Striping Band
  const stripeGeo = new THREE.TorusGeometry(0.72, 0.035, 6, 24);
  const stripe = new THREE.Mesh(stripeGeo, whiteStripeMat);
  stripe.rotation.x = -Math.PI * 0.5;
  stripe.position.y = 1.34;
  g.add(stripe);

  // 5. Cartoon Polka Dots / Star Decals around Dome Cap
  const dotGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.02, 12);
  const dotCount = 6;
  for (let i = 0; i < dotCount; i++) {
    const angle = (i / dotCount) * Math.PI * 2;
    const r = 0.78;
    const dot = new THREE.Mesh(dotGeo, whiteStripeMat);
    dot.position.set(Math.cos(angle) * r, 1.25, Math.sin(angle) * r);
    dot.rotation.x = 0.45 * Math.sin(angle);
    dot.rotation.z = -0.45 * Math.cos(angle);
    g.add(dot);
  }

  // 6. Top Bonus Multiplier Crown Gem (Octahedron Beacon)
  const gemGeo = new THREE.OctahedronGeometry(0.24, 0);
  const gem = new THREE.Mesh(gemGeo, goldNeonMat);
  gem.position.y = 1.62;
  g.add(gem);

  // Gem Base Bezel
  const bezelGeo = new THREE.CylinderGeometry(0.26, 0.22, 0.08, 12);
  const bezel = new THREE.Mesh(bezelGeo, darkRubberMat);
  bezel.position.y = 1.48;
  g.add(bezel);

  // Normalize placement: Base at y=0, centered on X and Z, front faces +Z
  const box = new THREE.Box3();
  box.setFromObject(g);
  const c = box.getCenter(new THREE.Vector3());
  g.children.forEach((o) => {
    o.position.x -= c.x;
    o.position.y -= box.min.y;
    o.position.z -= c.z;
  });

  return g;
}
