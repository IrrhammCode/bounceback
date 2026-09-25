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

  // 1. Heavy Rubber Ground Base Disc with Neon Halo
  const discGeo = new THREE.CylinderGeometry(0.98, 1.05, 0.12, 16);
  const disc = new THREE.Mesh(discGeo, darkRubberMat);
  disc.position.y = 0.06;
  g.add(disc);

  // 2. Base Cylinder Pillar with Tapered Waist
  const pillarGeo = new THREE.CylinderGeometry(0.68, 0.86, 0.95, 16);
  const pillar = new THREE.Mesh(pillarGeo, baseMat);
  pillar.position.y = 0.55;
  g.add(pillar);

  // 3. Mushroom Dome Cap (Glossy Bouncy Bumper Head)
  const capGeo = new THREE.SphereGeometry(1.02, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 1.0;
  g.add(cap);

  // 4. Top Bonus Multiplier Crown Gem (Octahedron Beacon)
  const gemGeo = new THREE.OctahedronGeometry(0.26, 0);
  const gem = new THREE.Mesh(gemGeo, goldNeonMat);
  gem.position.y = 1.62;
  g.add(gem);

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
