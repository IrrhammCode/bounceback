export default function (THREE) {
  const g = new THREE.Group();
  g.userData.joints = {};

  const armorMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.3, metalness: 0.8 });
  const jointMat = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.7, metalness: 0.3 });
  const visorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.1, emissive: 0xaaaaaa, emissiveIntensity: 0.5 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.5, metalness: 0.5 });
  // A specific material we will search for in MatchStage to set the team color
  const teamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, emissive: 0xffffff, emissiveIntensity: 0.5 });
  teamMat.name = 'teamColor';

  // Helper to place pivot
  function makeJoint(name, yPos, xPos = 0, zPos = 0) {
    const pivot = new THREE.Group();
    pivot.position.set(xPos, yPos, zPos);
    g.userData.joints[name] = pivot;
    return pivot;
  }

  // Torso
  const torso = new THREE.Group();
  torso.position.set(0, 0.9, 0); // hips at 0.9m
  g.add(torso);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.5, 0.25), armorMat);
  chest.position.set(0, 0.25, 0);
  torso.add(chest);

  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.2, 16), jointMat);
  core.position.set(0, 0, 0);
  torso.add(core);

  // Backpack / Power core (team colored)
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.15), trimMat);
  backpack.position.set(0, 0.3, -0.18);
  torso.add(backpack);

  const powerCore = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.16, 16), teamMat);
  powerCore.rotation.z = Math.PI / 2;
  powerCore.position.set(0, 0.3, -0.25);
  torso.add(powerCore);

  // Head
  const neck = makeJoint('neck', 0.55, 0, 0);
  torso.add(neck);

  const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.28, 0.25), armorMat);
  headMesh.position.set(0, 0.14, 0);
  neck.add(headMesh);

  // Visor (team colored)
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.1), teamMat);
  visor.position.set(0, 0.14, 0.1);
  neck.add(visor);

  // Arms
  const shoulderY = 0.45;
  const shoulderX = 0.28;

  // Left Arm
  const leftShoulder = makeJoint('leftShoulder', shoulderY, shoulderX, 0);
  torso.add(leftShoulder);
  
  const lShoulderPad = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), teamMat);
  leftShoulder.add(lShoulderPad);

  const lUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.12), armorMat);
  lUpperArm.position.set(0, -0.15, 0);
  leftShoulder.add(lUpperArm);

  const leftElbow = makeJoint('leftElbow', -0.35, 0, 0);
  leftShoulder.add(leftElbow);

  const lElbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), jointMat);
  leftElbow.add(lElbowJoint);

  const lLowerArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.1), trimMat);
  lLowerArm.position.set(0, -0.15, 0);
  leftElbow.add(lLowerArm);

  // Right Arm
  const rightShoulder = makeJoint('rightShoulder', shoulderY, -shoulderX, 0);
  torso.add(rightShoulder);
  
  const rShoulderPad = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), teamMat);
  rightShoulder.add(rShoulderPad);

  const rUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.12), armorMat);
  rUpperArm.position.set(0, -0.15, 0);
  rightShoulder.add(rUpperArm);

  const rightElbow = makeJoint('rightElbow', -0.35, 0, 0);
  rightShoulder.add(rightElbow);

  const rElbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), jointMat);
  rightElbow.add(rElbowJoint);

  const rLowerArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.1), trimMat);
  rLowerArm.position.set(0, -0.15, 0);
  rightElbow.add(rLowerArm);

  // Legs
  const hipX = 0.15;
  const legStartY = 0.9;

  // Left Leg
  const leftHip = makeJoint('leftHip', legStartY, hipX, 0);
  g.add(leftHip);

  const lHipJoint = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), jointMat);
  leftHip.add(lHipJoint);

  const lUpperLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.45, 0.16), armorMat);
  lUpperLeg.position.set(0, -0.22, 0);
  leftHip.add(lUpperLeg);

  const leftKnee = makeJoint('leftKnee', -0.45, 0, 0);
  leftHip.add(leftKnee);

  const lKneeJoint = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), jointMat);
  leftKnee.add(lKneeJoint);

  const lLowerLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.14), trimMat);
  lLowerLeg.position.set(0, -0.2, 0);
  leftKnee.add(lLowerLeg);

  const lFoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.25), teamMat);
  lFoot.position.set(0, -0.4, 0.05);
  leftKnee.add(lFoot);

  // Right Leg
  const rightHip = makeJoint('rightHip', legStartY, -hipX, 0);
  g.add(rightHip);

  const rHipJoint = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 16), jointMat);
  rightHip.add(rHipJoint);

  const rUpperLeg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.45, 0.16), armorMat);
  rUpperLeg.position.set(0, -0.22, 0);
  rightHip.add(rUpperLeg);

  const rightKnee = makeJoint('rightKnee', -0.45, 0, 0);
  rightHip.add(rightKnee);

  const rKneeJoint = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), jointMat);
  rightKnee.add(rKneeJoint);

  const rLowerLeg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.45, 0.14), trimMat);
  rLowerLeg.position.set(0, -0.2, 0);
  rightKnee.add(rLowerLeg);

  const rFoot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.25), teamMat);
  rFoot.position.set(0, -0.4, 0.05);
  rightKnee.add(rFoot);
  
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
