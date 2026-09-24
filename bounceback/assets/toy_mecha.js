/**
 * BOUNCEBACK! — Toy Capsule Mecha Character (Fall Guys Style)
 * Pure Three.js code asset meeting the 404 asset contract.
 */
export default function generate(THREE) {
  const g = new THREE.Group();

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x27e5ff, // Default Team Cyan (tinted at runtime for Team Coral)
    roughness: 0.25,
    metalness: 0.1,
    name: 'plastic_gloss'
  });

  const visorMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    roughness: 0.1,
    metalness: 0.6,
    name: 'glass_frosted'
  });

  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.5,
    metalness: 0.2,
    name: 'rubber'
  });

  const thrusterMat = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.4,
    metalness: 0.7,
    name: 'metal_painted'
  });

  const glowNozzleMat = new THREE.MeshBasicMaterial({
    color: 0xffd166,
    name: 'neon_emissive'
  });

  const teamRingMat = new THREE.MeshBasicMaterial({
    color: 0x27e5ff,
    transparent: true,
    opacity: 0.8,
    name: 'neon_emissive'
  });

  // 1. Main Capsule Bean Body
  // In Three.js, CapsuleGeometry(radius, length, capSubdivisions, radialSegments)
  const bodyGeo = new THREE.CapsuleGeometry(0.42, 0.76, 8, 16);
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.position.y = 0.88;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // 2. Visor Faceplate (curved glass plate facing +Z)
  const visorGeo = new THREE.SphereGeometry(0.32, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.42);
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.rotation.x = Math.PI * 0.5;
  visor.position.set(0, 1.08, 0.26);
  visor.scale.set(1.0, 0.5, 0.8);
  g.add(visor);

  // Visor dark bezel rim
  const bezelGeo = new THREE.TorusGeometry(0.24, 0.03, 8, 16);
  const bezel = new THREE.Mesh(bezelGeo, darkTrimMat);
  bezel.position.set(0, 1.08, 0.36);
  bezel.scale.set(1.15, 0.7, 1);
  g.add(bezel);

  // Eyes (Two glossy oval cartoon eyes inside visor)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
  const eyeGeo = new THREE.SphereGeometry(0.045, 8, 8);
  
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.scale.set(0.6, 1.2, 0.5);
  leftEye.position.set(-0.1, 1.08, 0.39);
  g.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.scale.set(0.6, 1.2, 0.5);
  rightEye.position.set(0.1, 1.08, 0.39);
  g.add(rightEye);

  // 3. Mini Thruster Backpack (attached at -Z)
  const packGeo = new THREE.BoxGeometry(0.38, 0.46, 0.22);
  const pack = new THREE.Mesh(packGeo, thrusterMat);
  pack.position.set(0, 0.95, -0.42);
  pack.castShadow = true;
  g.add(pack);

  // Dual Thruster Nozzles
  const nozzleGeo = new THREE.CylinderGeometry(0.07, 0.1, 0.16, 12);
  const leftNozzle = new THREE.Mesh(nozzleGeo, darkTrimMat);
  leftNozzle.position.set(-0.12, 0.72, -0.42);
  g.add(leftNozzle);

  const leftFlame = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 8), glowNozzleMat);
  leftFlame.rotation.x = Math.PI;
  leftFlame.position.set(-0.12, 0.62, -0.42);
  g.add(leftFlame);

  const rightNozzle = new THREE.Mesh(nozzleGeo, darkTrimMat);
  rightNozzle.position.set(0.12, 0.72, -0.42);
  g.add(rightNozzle);

  const rightFlame = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 8), glowNozzleMat);
  rightFlame.rotation.x = Math.PI;
  rightFlame.position.set(0.12, 0.62, -0.42);
  g.add(rightFlame);

  // 4. Chunky Bouncy Feet & Boots
  const bootGeo = new THREE.CapsuleGeometry(0.15, 0.22, 6, 12);
  
  const leftBoot = new THREE.Mesh(bootGeo, darkTrimMat);
  leftBoot.position.set(-0.24, 0.2, 0.04);
  leftBoot.castShadow = true;
  g.add(leftBoot);

  const rightBoot = new THREE.Mesh(bootGeo, darkTrimMat);
  rightBoot.position.set(0.24, 0.2, 0.04);
  rightBoot.castShadow = true;
  g.add(rightBoot);

  // 5. Chunky Gloves / Hands
  const handGeo = new THREE.SphereGeometry(0.14, 10, 8);
  const leftHand = new THREE.Mesh(handGeo, darkTrimMat);
  leftHand.position.set(-0.52, 0.8, 0.08);
  g.add(leftHand);

  const rightHand = new THREE.Mesh(handGeo, darkTrimMat);
  rightHand.position.set(0.52, 0.8, 0.08);
  g.add(rightHand);

  // 6. Base Team Halo / Ground Aura Ring
  const ringGeo = new THREE.RingGeometry(0.48, 0.62, 24);
  const ring = new THREE.Mesh(ringGeo, teamRingMat);
  ring.rotation.x = -Math.PI * 0.5;
  ring.position.y = 0.02;
  g.add(ring);

  // Normalize placement: Base at y=0, centered on X and Z, front faces +Z
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
