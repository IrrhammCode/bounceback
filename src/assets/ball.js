export default function (THREE) {
  const g = new THREE.Group();

  const caseMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6, metalness: 0.8 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.4, metalness: 0.5 });
  const glowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.5, roughness: 0.1 });
  glowMat.name = 'ballGlow';

  // Main sphere (core)
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), caseMat);
  g.add(core);

  // Outer ring (disc shape)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 32), trimMat);
  ring.rotation.x = Math.PI / 2;
  g.add(ring);

  // Inner glow rings
  const glow1 = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.015, 8, 32), glowMat);
  glow1.rotation.x = Math.PI / 2;
  glow1.position.y = 0.04;
  g.add(glow1);

  const glow2 = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.015, 8, 32), glowMat);
  glow2.rotation.x = Math.PI / 2;
  glow2.position.y = -0.04;
  g.add(glow2);

  // Hub caps
  const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16), glowMat);
  capTop.position.y = 0.08;
  g.add(capTop);

  const capBot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16), glowMat);
  capBot.position.y = -0.08;
  g.add(capBot);

  // Placement rules (bounding box alignment)
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
