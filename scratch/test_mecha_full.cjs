const THREE = require('three');

function generateMecha(THREE, options = {}) {
  const { team = 0, isPlayer = false, number = 7 } = options;
  const g = new THREE.Group();
  const root = new THREE.Group();
  g.add(root);

  const teamColor = team === 0 ? 0x27e5ff : 0xff5268;
  const darkTrimColor = 0x1e293b;

  // Materials
  const mJersey = new THREE.MeshStandardMaterial({
    color: teamColor,
    roughness: 0.28,
    metalness: 0.08,
  });

  const mFaceplate = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.15,
    metalness: 0.02,
  });

  const mDarkBezel = new THREE.MeshStandardMaterial({
    color: darkTrimColor,
    roughness: 0.45,
  });

  const mPupil = new THREE.MeshStandardMaterial({
    color: 0x080d1a,
    roughness: 0.05,
  });

  const mEyeGlint = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 1.0,
    roughness: 0.0,
  });

  const mWhite = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.30,
  });

  const mShoe = new THREE.MeshStandardMaterial({
    color: team === 0 ? 0x0284c7 : 0xdc2626,
    roughness: 0.35,
  });

  const mHeadband = new THREE.MeshStandardMaterial({
    color: isPlayer ? 0xef4444 : (team === 0 ? 0x06b6d4 : 0xf43f5e),
    roughness: 0.35,
  });

  const mThruster = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.4,
    metalness: 0.7,
  });

  const mFlame = new THREE.MeshBasicMaterial({
    color: 0xffd166,
  });

  const mAura = new THREE.MeshBasicMaterial({
    color: teamColor,
    transparent: true,
    opacity: 0.75,
  });

  // 1. Hips
  const hips = new THREE.Group();
  hips.position.set(0, 0.34, 0);
  root.add(hips);

  // 2. Torso (Bean Body)
  const torso = new THREE.Group();
  torso.position.set(0, 0.28, 0);
  hips.add(torso);

  const torsoGeom = new THREE.CapsuleGeometry(0.35, 0.48, 16, 24);
  torsoGeom.rotateY(Math.PI * 0.5);
  torsoGeom.computeVertexNormals();

  const torsoMesh = new THREE.Mesh(torsoGeom, mJersey);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  torso.add(torsoMesh);

  // 3. Head & Faceplate
  const head = new THREE.Group();
  head.position.set(0, 0.23, 0);
  torso.add(head);

  // Faceplate Bezel
  const bezelGeom = new THREE.TorusGeometry(0.120, 0.014, 10, 24);
  bezelGeom.scale(1.15, 0.88, 0.4);
  const bezel = new THREE.Mesh(bezelGeom, mDarkBezel);
  bezel.position.set(0, 0.02, 0.356);
  bezel.rotation.x = -0.12;
  head.add(bezel);

  // Faceplate Plate
  const plateGeom = new THREE.CylinderGeometry(0.118, 0.118, 0.035, 24);
  plateGeom.scale(1.14, 1.0, 0.86);
  plateGeom.rotateX(Math.PI / 2);
  const plate = new THREE.Mesh(plateGeom, mFaceplate);
  plate.position.set(0, 0.02, 0.350);
  plate.rotation.x = -0.12;
  head.add(plate);

  // Pill Cartoon Eyes
  const eyeGeom = new THREE.CapsuleGeometry(0.014, 0.034, 8, 16);
  eyeGeom.scale(1.0, 1.0, 0.35);

  const lEye = new THREE.Mesh(eyeGeom, mPupil);
  lEye.position.set(-0.048, 0.024, 0.366);
  lEye.rotation.x = -0.12;
  head.add(lEye);

  const rEye = new THREE.Mesh(eyeGeom, mPupil);
  rEye.position.set(0.048, 0.024, 0.366);
  rEye.rotation.x = -0.12;
  head.add(rEye);

  // Specular Catchlights
  const glintGeom = new THREE.SphereGeometry(0.0052, 8, 8);
  const lGlint = new THREE.Mesh(glintGeom, mEyeGlint);
  lGlint.position.set(-0.042, 0.036, 0.372);
  head.add(lGlint);

  const rGlint = new THREE.Mesh(glintGeom, mEyeGlint);
  rGlint.position.set(0.054, 0.036, 0.372);
  head.add(rGlint);

  // Eyebrows
  const browGeom = new THREE.BoxGeometry(0.032, 0.006, 0.006);
  const lBrow = new THREE.Mesh(browGeom, mDarkBezel);
  lBrow.position.set(-0.048, 0.060, 0.362);
  lBrow.rotation.x = -0.12;
  lBrow.rotation.z = -0.12;
  head.add(lBrow);

  const rBrow = new THREE.Mesh(browGeom, mDarkBezel);
  rBrow.position.set(0.048, 0.060, 0.362);
  rBrow.rotation.x = -0.12;
  rBrow.rotation.z = 0.12;
  head.add(rBrow);

  // Tournament Headband
  const hbGeom = new THREE.TorusGeometry(0.332, 0.018, 10, 32);
  const headband = new THREE.Mesh(hbGeom, mHeadband);
  headband.position.set(0, 0.118, 0.015);
  headband.rotation.x = Math.PI / 2 + 0.12;
  head.add(headband);

  const hbStripeGeom = new THREE.TorusGeometry(0.333, 0.0055, 8, 32);
  const hbStripe = new THREE.Mesh(hbStripeGeom, mWhite);
  hbStripe.position.set(0, 0.118, 0.015);
  hbStripe.rotation.x = Math.PI / 2 + 0.12;
  head.add(hbStripe);

  // Back knot and tails
  const knotGeom = new THREE.SphereGeometry(0.024, 10, 8);
  const knot = new THREE.Mesh(knotGeom, mHeadband);
  knot.position.set(0, 0.118, -0.332);
  head.add(knot);

  // 4. Arms
  const armGeom = new THREE.CapsuleGeometry(0.062, 0.10, 8, 12);
  const handGeom = new THREE.SphereGeometry(0.058, 12, 10);
  handGeom.scale(1.0, 1.15, 0.80);
  const wristbandGeom = new THREE.CylinderGeometry(0.066, 0.064, 0.035, 12);
  const thumbGeom = new THREE.CapsuleGeometry(0.018, 0.030, 6, 8);

  // Left Arm
  const leftUpperArm = new THREE.Group();
  leftUpperArm.position.set(-0.35, 0.06, 0.06);
  leftUpperArm.rotation.z = 0.35;
  leftUpperArm.rotation.x = -0.25;
  torso.add(leftUpperArm);

  const lArmMesh = new THREE.Mesh(armGeom, mJersey);
  lArmMesh.position.y = -0.06;
  lArmMesh.castShadow = true;
  leftUpperArm.add(lArmMesh);

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.12, 0);
  leftForearm.rotation.x = -0.30;
  leftUpperArm.add(leftForearm);

  const lForearmMesh = new THREE.Mesh(armGeom, mJersey);
  lForearmMesh.position.y = -0.06;
  lForearmMesh.castShadow = true;
  leftForearm.add(lForearmMesh);

  const lWrist = new THREE.Mesh(wristbandGeom, mWhite);
  lWrist.position.y = -0.085;
  leftForearm.add(lWrist);

  const leftHand = new THREE.Group();
  leftHand.position.set(0, -0.12, 0);
  leftForearm.add(leftHand);

  const lHandMesh = new THREE.Mesh(handGeom, mWhite);
  lHandMesh.position.y = -0.02;
  lHandMesh.castShadow = true;
  leftHand.add(lHandMesh);

  const lThumb = new THREE.Mesh(thumbGeom, mWhite);
  lThumb.position.set(0.038, 0.005, 0.025);
  lThumb.rotation.z = -0.55;
  leftHand.add(lThumb);

  // Right Arm
  const rightUpperArm = new THREE.Group();
  rightUpperArm.position.set(0.35, 0.06, 0.06);
  rightUpperArm.rotation.z = -0.35;
  rightUpperArm.rotation.x = -0.25;
  torso.add(rightUpperArm);

  const rArmMesh = new THREE.Mesh(armGeom, mJersey);
  rArmMesh.position.y = -0.06;
  rArmMesh.castShadow = true;
  rightUpperArm.add(rArmMesh);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.12, 0);
  rightForearm.rotation.x = -0.30;
  rightUpperArm.add(rightForearm);

  const rForearmMesh = new THREE.Mesh(armGeom, mJersey);
  rForearmMesh.position.y = -0.06;
  rForearmMesh.castShadow = true;
  rightForearm.add(rForearmMesh);

  const rWrist = new THREE.Mesh(wristbandGeom, mWhite);
  rWrist.position.y = -0.085;
  rightForearm.add(rWrist);

  const rightHand = new THREE.Group();
  rightHand.position.set(0, -0.12, 0);
  rightForearm.add(rightHand);

  const rHandMesh = new THREE.Mesh(handGeom, mWhite);
  rHandMesh.position.y = -0.02;
  rHandMesh.castShadow = true;
  rightHand.add(rHandMesh);

  const rThumb = new THREE.Mesh(thumbGeom, mWhite);
  rThumb.position.set(-0.038, 0.005, 0.025);
  rThumb.rotation.z = 0.55;
  rightHand.add(rThumb);

  // 5. Chunky Legs & Sneakers
  const legGeom = new THREE.CylinderGeometry(0.076, 0.070, 0.12, 12);
  const sockGeom = new THREE.CylinderGeometry(0.072, 0.068, 0.08, 12);
  const shoeUpperGeom = new THREE.SphereGeometry(0.088, 14, 10);
  shoeUpperGeom.scale(1.0, 0.68, 1.45);
  const soleGeom = new THREE.BoxGeometry(0.14, 0.040, 0.23);

  // Left Leg
  const leftUpperLeg = new THREE.Group();
  leftUpperLeg.position.set(-0.16, -0.08, 0);
  leftUpperLeg.rotation.z = -0.06;
  hips.add(leftUpperLeg);

  const lLegMesh = new THREE.Mesh(legGeom, mDarkBezel);
  lLegMesh.position.y = -0.06;
  lLegMesh.castShadow = true;
  leftUpperLeg.add(lLegMesh);

  const leftLowerLeg = new THREE.Group();
  leftLowerLeg.position.set(0, -0.12, 0);
  leftUpperLeg.add(leftLowerLeg);

  const lSock = new THREE.Mesh(sockGeom, mWhite);
  lSock.position.y = -0.04;
  leftLowerLeg.add(lSock);

  const leftFoot = new THREE.Group();
  leftFoot.position.set(0, -0.08, 0.03);
  leftLowerLeg.add(leftFoot);

  const lShoe = new THREE.Mesh(shoeUpperGeom, mShoe);
  lShoe.position.set(0, 0.022, 0.03);
  lShoe.castShadow = true;
  leftFoot.add(lShoe);

  const lSole = new THREE.Mesh(soleGeom, mWhite);
  lSole.position.set(0, -0.016, 0.03);
  leftFoot.add(lSole);

  // Right Leg
  const rightUpperLeg = new THREE.Group();
  rightUpperLeg.position.set(0.16, -0.08, 0);
  rightUpperLeg.rotation.z = 0.06;
  hips.add(rightUpperLeg);

  const rLegMesh = new THREE.Mesh(legGeom, mDarkBezel);
  rLegMesh.position.y = -0.06;
  rLegMesh.castShadow = true;
  rightUpperLeg.add(rLegMesh);

  const rightLowerLeg = new THREE.Group();
  rightLowerLeg.position.set(0, -0.12, 0);
  rightUpperLeg.add(rightLowerLeg);

  const rSock = new THREE.Mesh(sockGeom, mWhite);
  rSock.position.y = -0.04;
  rightLowerLeg.add(rSock);

  const rightFoot = new THREE.Group();
  rightFoot.position.set(0, -0.08, 0.03);
  rightLowerLeg.add(rightFoot);

  const rShoe = new THREE.Mesh(shoeUpperGeom, mShoe);
  rShoe.position.set(0, 0.022, 0.03);
  rShoe.castShadow = true;
  rightFoot.add(rShoe);

  const rSole = new THREE.Mesh(soleGeom, mWhite);
  rSole.position.set(0, -0.016, 0.03);
  rightFoot.add(rSole);

  // 6. Thruster Backpack
  const packGeo = new THREE.BoxGeometry(0.32, 0.38, 0.18);
  const pack = new THREE.Mesh(packGeo, mThruster);
  pack.position.set(0, 0.05, -0.36);
  pack.castShadow = true;
  torso.add(pack);

  const nozzleGeo = new THREE.CylinderGeometry(0.06, 0.085, 0.12, 10);
  const leftNozzle = new THREE.Mesh(nozzleGeo, mDarkBezel);
  leftNozzle.position.set(-0.10, -0.15, -0.36);
  torso.add(leftNozzle);

  const rightNozzle = new THREE.Mesh(nozzleGeo, mDarkBezel);
  rightNozzle.position.set(0.10, -0.15, -0.36);
  torso.add(rightNozzle);

  const flameGeo = new THREE.ConeGeometry(0.055, 0.14, 8);
  const leftFlame = new THREE.Mesh(flameGeo, mFlame);
  leftFlame.rotation.x = Math.PI;
  leftFlame.position.set(-0.10, -0.24, -0.36);
  torso.add(leftFlame);

  const rightFlame = new THREE.Mesh(flameGeo, mFlame);
  rightFlame.rotation.x = Math.PI;
  rightFlame.position.set(0.10, -0.24, -0.36);
  torso.add(rightFlame);

  // 7. Ground Team Aura Ring
  const auraGeo = new THREE.RingGeometry(0.48, 0.62, 24);
  const auraMesh = new THREE.Mesh(auraGeo, mAura);
  auraMesh.rotation.x = -Math.PI / 2;
  auraMesh.position.y = 0.02;
  root.add(auraMesh);

  // Normalization: center on X/Z and sit base at y = 0
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.x = -center.x;
  root.position.y = -box.min.y;
  root.position.z = -center.z;

  // Store references for animations in engine.ts
  g.userData = {
    root,
    hips,
    torso,
    head,
    leftArm: leftUpperArm,
    rightArm: rightUpperArm,
    leftForearm,
    rightForearm,
    leftHand,
    rightHand,
    leftLeg: leftUpperLeg,
    rightLeg: rightUpperLeg,
    flames: [leftFlame, rightFlame],
    auraMesh,
    walkPhase: 0,
    team,
    isPlayer,
  };

  return g;
}

const mecha = generateMecha(THREE, { team: 0, isPlayer: true, number: 7 });
console.log('Mecha generated successfully!');
console.log('User data keys:', Object.keys(mecha.userData));
const box = new THREE.Box3().setFromObject(mecha);
console.log('Bounds:', { min: box.min, max: box.max, size: box.getSize(new THREE.Vector3()) });
