const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 960, height: 960 });

  await page.goto('http://localhost:8085/__game__/boi-boian/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  const screenshotBase64 = await page.evaluate(async () => {
    const THREE = window.THREE || (await import('three'));
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0.65, 2.6);
    camera.lookAt(0, 0.58, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(960, 960);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444455, 0.95);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xfff8ee, 1.4);
    dir.position.set(2.5, 4.5, 3.5);
    dir.castShadow = true;
    scene.add(dir);

    const fill = new THREE.DirectionalLight(0x90e0ef, 0.45);
    fill.position.set(-2.5, 1.5, -1.5);
    scene.add(fill);

    // Ground plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // --- Generate Refined Texture ---
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base Blue Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    bgGrad.addColorStop(0, '#1d4ed8');
    bgGrad.addColorStop(0.35, '#2563eb');
    bgGrad.addColorStop(0.65, '#1e40af');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Fall Guys Halftone Dots
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    const dotSpacing = 32;
    for (let y = 0; y < 1024; y += dotSpacing) {
      for (let x = 0; x < 1024; x += dotSpacing) {
        ctx.beginPath();
        const offsetX = (Math.floor(y / dotSpacing) % 2 === 0) ? dotSpacing / 2 : 0;
        ctx.arc(x + offsetX, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Lower Shorts (Y = 700 to 1024)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 700, 1024, 324);

    // Red & White Waist Trim
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, 690, 1024, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 702, 1024, 6);

    // Flank Stripes at X=0, X=512, X=1024
    const drawSideStripes = (centerX) => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.fillRect(centerX - 35, 100, 70, 924);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(centerX - 12, 100, 24, 924);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(centerX - 3, 100, 6, 924);
    };
    drawSideStripes(0);
    drawSideStripes(512);
    drawSideStripes(1024);

    // FRONT CHEST GRAPHIC (X = 768, safely below faceplate in range Y = 520 to 680)
    const frontX = 768;

    // Garuda Wings at Y = 525
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(frontX - 65, 510);
    ctx.lineTo(frontX, 530);
    ctx.lineTo(frontX + 65, 510);
    ctx.lineTo(frontX + 55, 522);
    ctx.lineTo(frontX, 542);
    ctx.lineTo(frontX - 55, 522);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(frontX - 40, 520);
    ctx.lineTo(frontX, 532);
    ctx.lineTo(frontX + 40, 520);
    ctx.lineTo(frontX + 32, 528);
    ctx.lineTo(frontX, 540);
    ctx.lineTo(frontX - 32, 528);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(frontX, 526, 6, 0, Math.PI * 2);
    ctx.fill();

    // Bold Athletic #7
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.font = '900 110px "Arial Black", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('7', frontX + 3, 608);

    ctx.fillStyle = '#ffffff';
    ctx.fillText('7', frontX, 605);

    // "GARUDA" Ribbon Badge
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(frontX - 75, 655, 150, 26, 13);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GARUDA', frontX, 668);

    // BACK GRAPHIC (X = 256)
    const backX = 256;
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 32px sans-serif';
    ctx.fillText('ARI', backX, 525);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.font = '900 110px "Arial Black", Impact, sans-serif';
    ctx.fillText('7', backX + 3, 608);

    ctx.fillStyle = '#ffffff';
    ctx.fillText('7', backX, 605);

    const jerseyTex = new THREE.CanvasTexture(canvas);
    jerseyTex.wrapS = THREE.RepeatWrapping;
    jerseyTex.wrapT = THREE.ClampToEdgeWrapping;

    // --- Build Full Fall Guy Ari ---
    const g = new THREE.Group();

    // Materials
    const mJersey = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: jerseyTex,
      roughness: 0.30,
      metalness: 0.05,
    });
    const mFaceplate = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.18,
      metalness: 0.02,
    });
    const mDarkBezel = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
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
    const mRed = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.38,
    });
    const mWhite = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.30,
    });
    const mShoe = new THREE.MeshStandardMaterial({
      color: 0x1d4ed8,
      roughness: 0.35,
    });
    const mShoeSole = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.30,
    });
    const mMouth = new THREE.MeshStandardMaterial({
      color: 0xbe123c,
      roughness: 0.40,
    });

    // 1. Hips (y = 0.34)
    const hips = new THREE.Group();
    hips.position.set(0, 0.34, 0);
    g.add(hips);

    // 2. Torso (Bean Body)
    const torso = new THREE.Group();
    torso.position.set(0, 0.28, 0);
    hips.add(torso);

    const torsoGeom = new THREE.CapsuleGeometry(0.35, 0.48, 20, 32);
    torsoGeom.rotateY(Math.PI * 0.5);
    torsoGeom.computeVertexNormals();

    const torsoMesh = new THREE.Mesh(torsoGeom, mJersey);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    torso.add(torsoMesh);

    // 3. Head & Faceplate (y = 0.23 on torso)
    const head = new THREE.Group();
    head.position.set(0, 0.23, 0);
    torso.add(head);

    // Faceplate Bezel (Sleek dark rubber rim, pushed forward to z = 0.355 to avoid clipping)
    const bezelGeom = new THREE.TorusGeometry(0.120, 0.014, 12, 32);
    bezelGeom.scale(1.15, 0.88, 0.4);
    const bezel = new THREE.Mesh(bezelGeom, mDarkBezel);
    bezel.position.set(0, 0.02, 0.356);
    bezel.rotation.x = -0.12;
    head.add(bezel);

    // Faceplate Plate (Solid Pure White Oval)
    const plateGeom = new THREE.CylinderGeometry(0.118, 0.118, 0.035, 32);
    plateGeom.scale(1.14, 1.0, 0.86);
    plateGeom.rotateX(Math.PI / 2);
    const plate = new THREE.Mesh(plateGeom, mFaceplate);
    plate.position.set(0, 0.02, 0.350);
    plate.rotation.x = -0.12;
    head.add(plate);

    // Vertical Glossy Pill Eyes
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

    // Mouth
    const mouthGeom = new THREE.TorusGeometry(0.014, 0.003, 6, 16, Math.PI * 0.75);
    mouthGeom.rotateZ(Math.PI * 1.12);
    const mouth = new THREE.Mesh(mouthGeom, mMouth);
    mouth.position.set(0, -0.018, 0.366);
    mouth.rotation.x = -0.12;
    head.add(mouth);

    // Tournament Headband (Snug fit around brow)
    const hbGeom = new THREE.TorusGeometry(0.332, 0.018, 10, 32);
    const headband = new THREE.Mesh(hbGeom, mRed);
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
    const knot = new THREE.Mesh(knotGeom, mRed);
    knot.position.set(0, 0.118, -0.332);
    head.add(knot);

    // 4. Arms (Angled Forward with Visible Mitten Hands)
    const armGeom = new THREE.CapsuleGeometry(0.062, 0.10, 10, 16);
    const handGeom = new THREE.SphereGeometry(0.058, 14, 12);
    handGeom.scale(1.0, 1.15, 0.80);
    const wristbandGeom = new THREE.CylinderGeometry(0.066, 0.064, 0.035, 16);

    // Left Arm
    const leftUpperArm = new THREE.Group();
    leftUpperArm.position.set(-0.35, 0.06, 0.06);
    leftUpperArm.rotation.z = 0.38;
    leftUpperArm.rotation.x = -0.32; // Reaching forward
    torso.add(leftUpperArm);

    const lArmMesh = new THREE.Mesh(armGeom, mJersey);
    lArmMesh.position.y = -0.06;
    lArmMesh.castShadow = true;
    leftUpperArm.add(lArmMesh);

    const leftForearm = new THREE.Group();
    leftForearm.position.set(0, -0.12, 0);
    leftForearm.rotation.x = -0.35; // Forearm bent forward
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

    const thumbGeom = new THREE.CapsuleGeometry(0.018, 0.030, 6, 8);
    const lThumb = new THREE.Mesh(thumbGeom, mWhite);
    lThumb.position.set(0.038, 0.005, 0.025);
    lThumb.rotation.z = -0.55;
    leftHand.add(lThumb);

    // Right Arm
    const rightUpperArm = new THREE.Group();
    rightUpperArm.position.set(0.35, 0.06, 0.06);
    rightUpperArm.rotation.z = -0.38;
    rightUpperArm.rotation.x = -0.32; // Reaching forward
    torso.add(rightUpperArm);

    const rArmMesh = new THREE.Mesh(armGeom, mJersey);
    rArmMesh.position.y = -0.06;
    rArmMesh.castShadow = true;
    rightUpperArm.add(rArmMesh);

    const rightForearm = new THREE.Group();
    rightForearm.position.set(0, -0.12, 0);
    rightForearm.rotation.x = -0.35; // Forearm bent forward
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

    // 5. Chunky Stubby Legs & Rounded Sneakers
    const legGeom = new THREE.CylinderGeometry(0.076, 0.070, 0.12, 16);
    const sockGeom = new THREE.CylinderGeometry(0.072, 0.068, 0.08, 16);

    const shoeUpperGeom = new THREE.SphereGeometry(0.088, 16, 12);
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

    const lSole = new THREE.Mesh(soleGeom, mShoeSole);
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

    const rSole = new THREE.Mesh(soleGeom, mShoeSole);
    rSole.position.set(0, -0.016, 0.03);
    rightFoot.add(rSole);

    scene.add(g);

    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/png').split(',')[1];
  });

  fs.writeFileSync(
    '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_fallguy_ari_perfected.png',
    Buffer.from(screenshotBase64, 'base64')
  );
  console.log('Saved screen_fallguy_ari_perfected.png');
  await browser.close();
})();
