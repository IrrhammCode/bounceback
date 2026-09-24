/**
 * BOUNCEBACK! — Energy Scoring Gate (Sci-Fi Archway with Laser Curtain & Multiplier Crown)
 * Pure Three.js code asset meeting the 404 asset contract.
 */
export default function generate(THREE) {
  const g = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    roughness: 0.25,
    metalness: 0.45,
    name: 'metal_painted'
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.5,
    metalness: 0.3,
    name: 'metal_painted'
  });

  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xffd166,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    name: 'neon_emissive'
  });

  const laserLineMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.75,
    name: 'neon_emissive'
  });

  const rimMat = new THREE.MeshBasicMaterial({
    color: 0xffd166,
    name: 'neon_emissive'
  });

  // 1. Heavy Base Ground Pedestals
  const baseGeo = new THREE.BoxGeometry(0.85, 0.16, 0.85);
  const leftBase = new THREE.Mesh(baseGeo, darkMat);
  leftBase.position.set(-1.75, 0.08, 0);
  leftBase.receiveShadow = true;
  g.add(leftBase);

  const rightBase = new THREE.Mesh(baseGeo, darkMat);
  rightBase.position.set(1.75, 0.08, 0);
  rightBase.receiveShadow = true;
  g.add(rightBase);

  // Pedestal Neon Rings
  const baseRingGeo = new THREE.BoxGeometry(0.92, 0.04, 0.92);
  const leftBaseRing = new THREE.Mesh(baseRingGeo, rimMat);
  leftBaseRing.position.set(-1.75, 0.16, 0);
  g.add(leftBaseRing);

  const rightBaseRing = new THREE.Mesh(baseRingGeo, rimMat);
  rightBaseRing.position.set(1.75, 0.16, 0);
  g.add(rightBaseRing);

  // 2. Pillars (Sturdy Cyberpunk Arch Towers)
  const pillarGeo = new THREE.BoxGeometry(0.42, 4.0, 0.42);
  const leftPillar = new THREE.Mesh(pillarGeo, frameMat);
  leftPillar.position.set(-1.75, 2.0, 0);
  leftPillar.castShadow = true;
  g.add(leftPillar);

  const rightPillar = new THREE.Mesh(pillarGeo, frameMat);
  rightPillar.position.set(1.75, 2.0, 0);
  rightPillar.castShadow = true;
  g.add(rightPillar);

  // Dark Recessed Panels on Pillars
  const insetGeo = new THREE.BoxGeometry(0.16, 3.4, 0.28);
  const leftInset = new THREE.Mesh(insetGeo, darkMat);
  leftInset.position.set(-1.75, 1.9, 0.12);
  g.add(leftInset);

  const rightInset = new THREE.Mesh(insetGeo, darkMat);
  rightInset.position.set(1.75, 1.9, 0.12);
  g.add(rightInset);

  // Vertical Neon Piping on Pillars
  const stripGeo = new THREE.BoxGeometry(0.06, 3.7, 0.06);
  [-1.52, -1.98, 1.52, 1.98].forEach(x => {
    const strip = new THREE.Mesh(stripGeo, rimMat);
    strip.position.set(x, 2.0, 0.22);
    g.add(strip);
  });

  // 3. Top Crossbar Header Arch
  const crossGeo = new THREE.BoxGeometry(4.1, 0.45, 0.45);
  const cross = new THREE.Mesh(crossGeo, frameMat);
  cross.position.set(0, 4.05, 0);
  cross.castShadow = true;
  g.add(cross);

  // Top Neon Runner Strip
  const topStripGeo = new THREE.BoxGeometry(3.9, 0.06, 0.06);
  const topStrip = new THREE.Mesh(topStripGeo, rimMat);
  topStrip.position.set(0, 4.28, 0.24);
  g.add(topStrip);

  // 4. Energy Laser Curtain (Translucent Glow Sheet + Individual Laser Rods)
  const curtainGeo = new THREE.PlaneGeometry(3.08, 3.75);
  const curtain = new THREE.Mesh(curtainGeo, beamMat);
  curtain.position.set(0, 2.05, 0);
  g.add(curtain);

  // Individual laser beams
  const laserBeamGeo = new THREE.CylinderGeometry(0.018, 0.018, 3.7, 8);
  const beamCount = 7;
  for (let i = 0; i < beamCount; i++) {
    const lx = -1.2 + (i / (beamCount - 1)) * 2.4;
    const beam = new THREE.Mesh(laserBeamGeo, laserLineMat);
    beam.position.set(lx, 2.05, 0);
    g.add(beam);
  }

  // 5. Crown & Multiplier Crystals on Top
  const crownGeo = new THREE.OctahedronGeometry(0.28, 0);
  const centerCrown = new THREE.Mesh(crownGeo, rimMat);
  centerCrown.position.set(0, 4.58, 0);
  g.add(centerCrown);

  const orbGeo = new THREE.SphereGeometry(0.18, 12, 10);
  const leftOrb = new THREE.Mesh(orbGeo, rimMat);
  leftOrb.position.set(-1.75, 4.38, 0);
  g.add(leftOrb);

  const rightOrb = new THREE.Mesh(orbGeo, rimMat);
  rightOrb.position.set(1.75, 4.38, 0);
  g.add(rightOrb);

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
