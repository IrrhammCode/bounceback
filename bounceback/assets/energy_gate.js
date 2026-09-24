/**
 * BOUNCEBACK! — Energy Scoring Gate (Sci-Fi Archway with Laser Curtain)
 * Pure Three.js code asset meeting the 404 asset contract.
 */
export default function generate(THREE) {
  const g = new THREE.Group();

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0xffd166, roughness: 0.25, metalness: 0.5, name: 'metal_painted'
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b, roughness: 0.5, metalness: 0.3, name: 'metal_painted'
  });
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xffd166, transparent: true, opacity: 0.35, side: THREE.DoubleSide, name: 'neon_emissive'
  });
  const rimMat = new THREE.MeshBasicMaterial({
    color: 0xffd166, name: 'neon_emissive'
  });

  // Left pillar
  const pillarGeo = new THREE.BoxGeometry(0.35, 4.0, 0.35);
  const leftPillar = new THREE.Mesh(pillarGeo, frameMat);
  leftPillar.position.set(-1.75, 2.0, 0);
  leftPillar.castShadow = true;
  g.add(leftPillar);

  // Right pillar
  const rightPillar = new THREE.Mesh(pillarGeo, frameMat);
  rightPillar.position.set(1.75, 2.0, 0);
  rightPillar.castShadow = true;
  g.add(rightPillar);

  // Top crossbar (arch)
  const crossGeo = new THREE.BoxGeometry(3.85, 0.35, 0.35);
  const cross = new THREE.Mesh(crossGeo, frameMat);
  cross.position.set(0, 4.0, 0);
  cross.castShadow = true;
  g.add(cross);

  // Dark inset panels on pillars
  const insetGeo = new THREE.BoxGeometry(0.12, 3.2, 0.22);
  const leftInset = new THREE.Mesh(insetGeo, darkMat);
  leftInset.position.set(-1.75, 1.8, 0.15);
  g.add(leftInset);
  const rightInset = new THREE.Mesh(insetGeo, darkMat);
  rightInset.position.set(1.75, 1.8, 0.15);
  g.add(rightInset);

  // Neon edge strips on pillars
  const stripGeo = new THREE.BoxGeometry(0.05, 3.6, 0.05);
  [-1.57, -1.93, 1.57, 1.93].forEach(x => {
    const strip = new THREE.Mesh(stripGeo, rimMat);
    strip.position.set(x, 2.0, 0.2);
    g.add(strip);
  });

  // Top arch neon strip
  const topStripGeo = new THREE.BoxGeometry(3.5, 0.05, 0.05);
  const topStrip = new THREE.Mesh(topStripGeo, rimMat);
  topStrip.position.set(0, 4.18, 0.2);
  g.add(topStrip);

  // Energy curtain (translucent plane)
  const curtainGeo = new THREE.PlaneGeometry(3.15, 3.7);
  const curtain = new THREE.Mesh(curtainGeo, beamMat);
  curtain.position.set(0, 2.05, 0);
  g.add(curtain);

  // Base ground plates
  const baseGeo = new THREE.BoxGeometry(0.7, 0.12, 0.7);
  const leftBase = new THREE.Mesh(baseGeo, darkMat);
  leftBase.position.set(-1.75, 0.06, 0);
  leftBase.receiveShadow = true;
  g.add(leftBase);
  const rightBase = new THREE.Mesh(baseGeo, darkMat);
  rightBase.position.set(1.75, 0.06, 0);
  rightBase.receiveShadow = true;
  g.add(rightBase);

  // Multiplier orbs on top corners
  const orbGeo = new THREE.SphereGeometry(0.16, 10, 8);
  const leftOrb = new THREE.Mesh(orbGeo, rimMat);
  leftOrb.position.set(-1.75, 4.3, 0);
  g.add(leftOrb);
  const rightOrb = new THREE.Mesh(orbGeo, rimMat);
  rightOrb.position.set(1.75, 4.3, 0);
  g.add(rightOrb);

  // Normalize placement
  const box = new THREE.Box3(), v = new THREE.Vector3(), m = new THREE.Matrix4(), im = new THREE.Matrix4();
  g.updateMatrixWorld(true);
  g.traverse((n) => {
    const p = n.isMesh && n.geometry.attributes.position; if (!p) return;
    const put = (mat) => { for (let i = 0; i < p.count; i++) box.expandByPoint(v.fromBufferAttribute(p, i).applyMatrix4(mat)); };
    if (n.isInstancedMesh) { for (let c = 0; c < n.count; c++) { n.getMatrixAt(c, im); put(m.multiplyMatrices(n.matrixWorld, im)); } return; }
    put(n.matrixWorld);
  });
  const c = box.getCenter(new THREE.Vector3());
  g.children.forEach((o) => { o.position.x -= c.x; o.position.y -= box.min.y; o.position.z -= c.z; });

  return g;
}
