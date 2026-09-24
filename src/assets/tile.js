export default function (THREE) {
  const g = new THREE.Group();

  const caseMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5, metalness: 0.7 });
  const innerMat = new THREE.MeshStandardMaterial({ color: 0x4b5563, roughness: 0.8, metalness: 0.4 });
  const glowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.0, roughness: 0.2 });
  glowMat.name = 'tileGlow'; // For easy color targeting later if needed

  // Core block
  const core = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.4, 0.3), innerMat);
  g.add(core);

  // Armored corners
  const armorSize = 0.12;
  const positions = [
    [1, 1, 1], [-1, 1, 1], [1, -1, 1], [-1, -1, 1],
    [1, 1, -1], [-1, 1, -1], [1, -1, -1], [-1, -1, -1]
  ];
  positions.forEach(([x, y, z]) => {
    const corner = new THREE.Mesh(new THREE.BoxGeometry(armorSize, armorSize, armorSize), caseMat);
    corner.position.set(x * (0.24 - armorSize/2), y * (0.2 - armorSize/2), z * (0.15 - armorSize/2));
    g.add(corner);
  });

  // Top/bottom caps
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.42, 0.1), caseMat);
  g.add(cap);
  
  // Glowing energy cores
  const energy = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.44, 16), glowMat);
  energy.position.set(0.12, 0, 0);
  g.add(energy);
  
  const energy2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.44, 16), glowMat);
  energy2.position.set(-0.12, 0, 0);
  g.add(energy2);

  const energy3 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.44, 16), glowMat);
  energy3.rotation.x = Math.PI / 2;
  energy3.position.set(0, 0, 0);
  g.add(energy3);

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
