/**
 * BOUNCEBACK! — Pinball Bumper (Neon Mushroom Cylinder)
 * Pure Three.js code asset meeting the 404 asset contract.
 */
export default function generate(THREE) {
  const g = new THREE.Group();

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x8338ec, roughness: 0.3, metalness: 0.2, name: 'plastic_gloss'
  });
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x8338ec, roughness: 0.2, metalness: 0.4, name: 'plastic_gloss'
  });
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffd166, name: 'neon_emissive'
  });
  const stripeMat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.6, name: 'neon_emissive'
  });

  // Base cylinder pillar
  const pillarGeo = new THREE.CylinderGeometry(0.7, 0.8, 1.0, 16);
  const pillar = new THREE.Mesh(pillarGeo, baseMat);
  pillar.position.y = 0.5;
  pillar.castShadow = true;
  pillar.receiveShadow = true;
  g.add(pillar);

  // Mushroom dome cap
  const capGeo = new THREE.SphereGeometry(1.0, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const cap = new THREE.Mesh(capGeo, capMat);
  cap.position.y = 1.0;
  cap.castShadow = true;
  g.add(cap);

  // Neon ring at base
  const ring1Geo = new THREE.TorusGeometry(0.85, 0.06, 8, 24);
  const ring1 = new THREE.Mesh(ring1Geo, ringMat);
  ring1.rotation.x = -Math.PI * 0.5;
  ring1.position.y = 0.12;
  g.add(ring1);

  // Neon ring at mid
  const ring2 = new THREE.Mesh(ring1Geo.clone(), ringMat);
  ring2.rotation.x = -Math.PI * 0.5;
  ring2.position.y = 0.56;
  g.add(ring2);

  // Decorative stripe bands on cap
  const stripe1Geo = new THREE.TorusGeometry(0.92, 0.04, 6, 24);
  const stripe1 = new THREE.Mesh(stripe1Geo, stripeMat);
  stripe1.rotation.x = -Math.PI * 0.5;
  stripe1.position.y = 1.18;
  g.add(stripe1);

  // Top nub (impact indicator)
  const nubGeo = new THREE.SphereGeometry(0.18, 12, 8);
  const nub = new THREE.Mesh(nubGeo, ringMat);
  nub.position.y = 1.5;
  g.add(nub);

  // Ground contact disc
  const discGeo = new THREE.CylinderGeometry(0.92, 0.92, 0.06, 20);
  const disc = new THREE.Mesh(discGeo, new THREE.MeshStandardMaterial({
    color: 0x1e293b, roughness: 0.6, metalness: 0.1, name: 'rubber'
  }));
  disc.position.y = 0.03;
  disc.receiveShadow = true;
  g.add(disc);

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
