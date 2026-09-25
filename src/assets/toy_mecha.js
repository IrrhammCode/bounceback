/**
 * BOUNCEBACK! — Ultra-HD Toy Capsule Character (Nintendo / Fall Guys Style)
 * Pure Three.js code asset meeting the asset contract.
 *
 * Professional AAA Nintendo / Fall Guys toy aesthetic:
 * - 2048x2048 ultra-crisp athletic jersey texture with vector crests, hex-weave & bold numbers
 * - High-poly silk-smooth bean capsule body (32x40) with glossy toy plastic finish
 * - Porcelain faceplate with beveled rubber bezel, expressive cartoon pill eyes with catchlights
 * - Cute 3D open smile mouth with pink tongue and rosy blushing cheeks
 * - Detailed chunky retro sneakers with textured rubber toe caps, cross-laces & tread outsoles
 * - Player 1 features the Regal Championship Gold Crown and Gold Captain's Armband
 * - 8 Unique, charming costumes for all bots (DJ headphones, Propeller hat, Cyber shades, Dino spikes, Bunny ears, Ninja headband, Party cone)
 * - Articulated limbs, white cartoon gloves, mini jetpack with dynamic thruster flames
 */

function generateJerseyTexture(THREE, team, number, isPlayer) {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 2048;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const isCyan = team === 0;

  // 1. Ultra-Clean Vibrant Team Base Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 2048);
  if (isCyan) {
    grad.addColorStop(0.00, "#0096c7"); // Crisp azure
    grad.addColorStop(0.30, "#00b4d8"); // Electric cyan
    grad.addColorStop(0.65, "#0077b6");
    grad.addColorStop(1.00, "#023e8a"); // Deep royal athletic tone
  } else {
    grad.addColorStop(0.00, "#e63946"); // Crisp coral red
    grad.addColorStop(0.30, "#ff4d6d"); // Vibrant raspberry
    grad.addColorStop(0.65, "#c9184a");
    grad.addColorStop(1.00, "#590d22"); // Deep rich athletic tone
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 2048, 2048);

  // 2. High-Tech Hexagonal Athletic Mesh / Micro-Weave
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.045)";
  ctx.lineWidth = 3;
  const hexR = 24;
  const hexH = Math.sqrt(3) * hexR;
  for (let y = 0; y < 2048; y += hexH) {
    for (let x = 0; x < 2048; x += hexR * 3) {
      const offsetX = (Math.floor(y / hexH) % 2) * (hexR * 1.5);
      const cx = x + offsetX;
      ctx.beginPath();
      for (let s = 0; s < 6; s++) {
        const a = (s * Math.PI) / 3;
        const hx = cx + Math.cos(a) * hexR;
        const hy = y + Math.sin(a) * hexR;
        if (s === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.restore();

  // 3. Lower Athletic Shorts Zone (Y = 1440 to 2048)
  const darkNavy = "#0f172a";
  ctx.fillStyle = darkNavy;
  ctx.fillRect(0, 1440, 2048, 608);

  // Gold Waistband Piping
  ctx.fillStyle = "#ffd166";
  ctx.fillRect(0, 1412, 2048, 28);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 1432, 2048, 12);

  // 4. Flank Athletic Racing Stripes (X = 0, 1024, 2048)
  const drawFlankStripe = (centerX) => {
    ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
    ctx.fillRect(centerX - 72, 240, 144, 1760);
    ctx.fillStyle = isCyan ? "#38bdf8" : "#fb7185";
    ctx.fillRect(centerX - 32, 240, 64, 1760);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(centerX - 8, 240, 16, 1760);
  };
  drawFlankStripe(0);
  drawFlankStripe(1024);
  drawFlankStripe(2048);

  // 5. Front Chest Graphic (Center at X = 1536 on UV map)
  const frontX = 1536;

  // Athletic Collar V-Neck
  ctx.save();
  ctx.strokeStyle = "#ffd166";
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(frontX - 220, 480);
  ctx.lineTo(frontX, 740);
  ctx.lineTo(frontX + 220, 480);
  ctx.stroke();

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(frontX - 210, 470);
  ctx.lineTo(frontX, 725);
  ctx.lineTo(frontX + 210, 470);
  ctx.stroke();
  ctx.restore();

  // Shield Emblem
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(frontX, 1000, 144, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isCyan ? "#0096c7" : "#e63946";
  ctx.beginPath();
  ctx.arc(frontX, 1000, 124, 0, Math.PI * 2);
  ctx.fill();

  // Golden 5-Point Star
  ctx.fillStyle = "#ffd166";
  ctx.beginPath();
  for (let s = 0; s < 5; s++) {
    const rot = (Math.PI / 2) * 3 + (s * (Math.PI * 2)) / 5;
    const outerX = frontX + Math.cos(rot) * 64;
    const outerY = 1000 + Math.sin(rot) * 64;
    if (s === 0) ctx.moveTo(outerX, outerY);
    else ctx.lineTo(outerX, outerY);
    const innerRot = rot + Math.PI / 5;
    ctx.lineTo(frontX + Math.cos(innerRot) * 28, 1000 + Math.sin(innerRot) * 28);
  }
  ctx.closePath();
  ctx.fill();

  // Bold Squad Number below shield
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.font = '900 220px "Arial Black", Impact, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(number), frontX + 8, 1250);

  ctx.fillStyle = "#ffffff";
  ctx.fillText(String(number), frontX, 1242);

  // Captain Badge for Player
  if (isPlayer) {
    ctx.fillStyle = "#ffd166";
    ctx.font = '900 64px "Outfit", sans-serif';
    ctx.fillText("★ CAPTAIN ★", frontX, 810);
  }
  ctx.restore();

  // 6. Back Graphic (Center at X = 512)
  const backX = 512;
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.font = '900 68px "Outfit", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(isPlayer ? "YOU" : `SQUAD ${number}`, backX, 980);

  // Big squad number on back
  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.font = '900 260px "Arial Black", Impact, sans-serif';
  ctx.fillText(String(number), backX + 8, 1250);

  ctx.fillStyle = "#ffffff";
  ctx.fillText(String(number), backX, 1242);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

export default function generate(THREE, options = {}) {
  const team = typeof options.team === "number" ? options.team : 0;
  const isCyan = team === 0;
  const isPlayer = !!options.isPlayer;
  const number = options.number || (isPlayer ? 7 : team === 0 ? 1 : 2);

  const g = new THREE.Group();
  const root = new THREE.Group();
  g.add(root);

  const teamColorHex = team === 0 ? 0x27e5ff : 0xff5268;
  const darkTrimHex = 0x1e293b;

  // Procedural Jersey Texture (2048x2048)
  const jerseyTex = generateJerseyTexture(THREE, team, number, isPlayer);

  // High-Grade Materials
  const mJersey = new THREE.MeshStandardMaterial({
    color: jerseyTex ? 0xffffff : teamColorHex,
    map: jerseyTex || null,
    roughness: 0.18,
    metalness: 0.05,
    name: "plastic_gloss",
  });

  const mFaceplate = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.08,
    metalness: 0.02,
    name: "glass_frosted",
  });

  const mDarkBezel = new THREE.MeshStandardMaterial({
    color: darkTrimHex,
    roughness: 0.35,
    name: "rubber",
  });

  const mPupil = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.05,
    name: "plastic_gloss",
  });

  const mEyeGlint = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });

  const mWhite = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.2,
    name: "plastic_gloss",
  });

  const mShoe = new THREE.MeshStandardMaterial({
    color: team === 0 ? 0x0284c7 : 0xdc2626,
    roughness: 0.28,
    name: "rubber",
  });

  const mShoeSole = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.45,
  });

  const mOutsole = new THREE.MeshStandardMaterial({
    color: darkTrimHex,
    roughness: 0.6,
  });

  const mGold = new THREE.MeshStandardMaterial({
    color: 0xffd166,
    roughness: 0.15,
    metalness: 0.88,
    emissive: 0xffd166,
    emissiveIntensity: 0.35,
  });

  const mThruster = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.3,
    metalness: 0.75,
  });

  const mFlame = new THREE.MeshBasicMaterial({
    color: 0xffd166,
  });

  const mAura = new THREE.MeshBasicMaterial({
    color: teamColorHex,
    transparent: true,
    opacity: 0.85,
  });

  // 1. Hips (y = 0.52 - elevated for tall, athletic long legs)
  const hips = new THREE.Group();
  hips.position.set(0, 0.52, 0);
  root.add(hips);

  // 2. Torso (Bean Body) — Sleek athletic capsule (y = 0.24 on hips)
  const torso = new THREE.Group();
  torso.position.set(0, 0.24, 0);
  hips.add(torso);

  const torsoGeom = new THREE.CapsuleGeometry(0.33, 0.40, 32, 40);
  torsoGeom.rotateY(Math.PI * 0.5); // Align texture front (+Z)
  torsoGeom.computeVertexNormals();

  const torsoMesh = new THREE.Mesh(torsoGeom, mJersey);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  torso.add(torsoMesh);

  // 3. Head & Faceplate (y = 0.20 on torso)
  const head = new THREE.Group();
  head.position.set(0, 0.20, 0);
  torso.add(head);

  // Faceplate Bezel Frame
  const bezelGeom = new THREE.TorusGeometry(0.128, 0.016, 14, 32);
  bezelGeom.scale(1.15, 0.90, 0.4);
  const bezel = new THREE.Mesh(bezelGeom, mDarkBezel);
  bezel.position.set(0, 0.02, 0.336);
  bezel.rotation.x = -0.12;
  head.add(bezel);

  // Faceplate Dish (Glossy Porcelain White)
  const plateGeom = new THREE.CylinderGeometry(0.124, 0.124, 0.038, 32);
  plateGeom.scale(1.14, 1.0, 0.88);
  plateGeom.rotateX(Math.PI / 2);
  const plate = new THREE.Mesh(plateGeom, mFaceplate);
  plate.position.set(0, 0.02, 0.330);
  plate.rotation.x = -0.12;
  head.add(plate);

  // Vertical Glossy Cartoon Pill Eyes
  const eyeGeom = new THREE.CapsuleGeometry(0.017, 0.040, 12, 20);
  eyeGeom.scale(1.0, 1.0, 0.35);

  const lEye = new THREE.Mesh(eyeGeom, mPupil);
  lEye.position.set(-0.052, 0.024, 0.347);
  lEye.rotation.x = -0.12;
  head.add(lEye);

  const rEye = new THREE.Mesh(eyeGeom, mPupil);
  rEye.position.set(0.052, 0.024, 0.347);
  rEye.rotation.x = -0.12;
  head.add(rEye);

  // Sparkling Eye Catchlights
  const glintBigGeom = new THREE.SphereGeometry(0.0055, 8, 8);
  const glintSmallGeom = new THREE.SphereGeometry(0.0030, 8, 8);

  const lGlint1 = new THREE.Mesh(glintBigGeom, mEyeGlint);
  lGlint1.position.set(-0.046, 0.038, 0.353);
  head.add(lGlint1);

  const lGlint2 = new THREE.Mesh(glintSmallGeom, mEyeGlint);
  lGlint2.position.set(-0.056, 0.016, 0.353);
  head.add(lGlint2);

  const rGlint1 = new THREE.Mesh(glintBigGeom, mEyeGlint);
  rGlint1.position.set(0.058, 0.038, 0.353);
  head.add(rGlint1);

  const rGlint2 = new THREE.Mesh(glintSmallGeom, mEyeGlint);
  rGlint2.position.set(0.048, 0.016, 0.353);
  head.add(rGlint2);

  // Eyebrows
  const browGeom = new THREE.BoxGeometry(0.036, 0.008, 0.008);
  const lBrow = new THREE.Mesh(browGeom, mDarkBezel);
  lBrow.position.set(-0.052, 0.064, 0.342);
  lBrow.rotation.set(-0.12, 0, -0.12);
  head.add(lBrow);

  const rBrow = new THREE.Mesh(browGeom, mDarkBezel);
  rBrow.position.set(0.052, 0.064, 0.342);
  rBrow.rotation.set(-0.12, 0, 0.12);
  head.add(rBrow);

  // Cute Open Cartoon Smile Mouth with Pink Tongue
  const mouthGroup = new THREE.Group();
  mouthGroup.position.set(0, -0.022, 0.346);
  mouthGroup.rotation.x = -0.12;
  head.add(mouthGroup);

  const mouthGeom = new THREE.TorusGeometry(0.018, 0.004, 8, 20, Math.PI * 0.85);
  mouthGeom.rotateZ(Math.PI * 1.08);
  const mouthRim = new THREE.Mesh(mouthGeom, mDarkBezel);
  mouthGroup.add(mouthRim);

  const tongueGeom = new THREE.SphereGeometry(0.009, 8, 8);
  tongueGeom.scale(1.2, 0.7, 0.5);
  const mTongue = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
  const tongue = new THREE.Mesh(tongueGeom, mTongue);
  tongue.position.set(0, -0.006, 0.002);
  mouthGroup.add(tongue);

  // Soft Rosy Blushing Cheeks
  const mBlush = new THREE.MeshBasicMaterial({ color: 0xff3366, transparent: true, opacity: 0.65 });
  const cheekGeom = new THREE.SphereGeometry(0.016, 10, 8);
  cheekGeom.scale(1.5, 0.8, 0.2);

  const lCheek = new THREE.Mesh(cheekGeom, mBlush);
  lCheek.position.set(-0.072, -0.006, 0.346);
  lCheek.rotation.x = -0.12;
  head.add(lCheek);

  const rCheek = new THREE.Mesh(cheekGeom, mBlush);
  rCheek.position.set(0.072, -0.006, 0.346);
  rCheek.rotation.x = -0.12;
  head.add(rCheek);

  // ── Signature Costumes & Accessories ──
  const costumeTypes = [
    "crown",
    "dj_headphones",
    "propeller_hat",
    "pro_shades",
    "bunny_ears",
    "dino_crest",
    "ninja_headband",
    "party_hat",
  ];
  const costume = options.costume || (isPlayer ? "crown" : costumeTypes[number % costumeTypes.length]);

  let animPropeller = null;
  let animBunnyEars = null;

  if (costume === "crown") {
    // Ultra-HD Championship Gold Crown
    const crownGroup = new THREE.Group();
    crownGroup.position.set(0, 0.36, 0.02);

    // Velvet Cushion Dome Inside
    const velvetMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.8 });
    const cushionGeo = new THREE.SphereGeometry(0.13, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
    crownGroup.add(new THREE.Mesh(cushionGeo, velvetMat));

    // Solid Gold Base Ring
    const baseRingGeo = new THREE.CylinderGeometry(0.16, 0.14, 0.09, 24);
    crownGroup.add(new THREE.Mesh(baseRingGeo, mGold));

    // 5 Regal Peaks
    for (let pi = 0; pi < 5; pi++) {
      const angle = (pi / 5) * Math.PI * 2;
      const r = 0.15;
      const px = Math.cos(angle) * r;
      const pz = Math.sin(angle) * r;

      const spikeGeo = new THREE.ConeGeometry(0.038, 0.14, 6);
      const spike = new THREE.Mesh(spikeGeo, mGold);
      spike.position.set(px, 0.09, pz);
      spike.rotation.y = angle;
      crownGroup.add(spike);

      // Pearl ball on top of each peak
      const pearlGeo = new THREE.SphereGeometry(0.017, 8, 8);
      const pearl = new THREE.Mesh(pearlGeo, mWhite);
      pearl.position.set(px, 0.16, pz);
      crownGroup.add(pearl);
    }

    // Faceted Ruby Gem on Front Peak
    const rubyGeo = new THREE.OctahedronGeometry(0.036, 0);
    const rubyMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const ruby = new THREE.Mesh(rubyGeo, rubyMat);
    ruby.position.set(0, 0.045, 0.16);
    crownGroup.add(ruby);

    head.add(crownGroup);
  } else if (costume === "dj_headphones") {
    // Over-Ear DJ Headphones
    const bandGeo = new THREE.TorusGeometry(0.35, 0.022, 10, 24, Math.PI);
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
    const band = new THREE.Mesh(bandGeo, bandMat);
    band.position.set(0, 0.08, 0);
    head.add(band);

    const cupMat = new THREE.MeshStandardMaterial({
      color: team === 0 ? 0x06b6d4 : 0xf43f5e,
      roughness: 0.2,
      emissive: team === 0 ? 0x06b6d4 : 0xf43f5e,
      emissiveIntensity: 0.25,
    });
    for (const side of [-1, 1]) {
      const cupGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.055, 18);
      cupGeo.rotateZ(Math.PI / 2);
      const cup = new THREE.Mesh(cupGeo, cupMat);
      cup.position.set(side * 0.37, 0.06, 0);
      head.add(cup);

      const cushion = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 16), mDarkBezel);
      cushion.rotation.y = Math.PI / 2;
      cushion.position.set(side * 0.34, 0.06, 0);
      head.add(cushion);
    }
  } else if (costume === "propeller_hat") {
    // Colorful Baseball Cap with Spinning Propeller
    const capGroup = new THREE.Group();
    capGroup.position.set(0, 0.34, 0.02);

    const capDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 })
    );
    capGroup.add(capDome);

    const brimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.02, 16, 1, false, -Math.PI * 0.35, Math.PI * 0.7);
    const capBrim = new THREE.Mesh(brimGeo, new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 }));
    capBrim.position.set(0, 0.01, 0.06);
    capGroup.add(capBrim);

    // Propeller rotor assembly
    animPropeller = new THREE.Group();
    animPropeller.position.set(0, 0.20, 0);

    const propMast = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.05, 8), mDarkBezel);
    animPropeller.add(propMast);

    const propBladeGeo = new THREE.BoxGeometry(0.24, 0.01, 0.035);
    const propBlade = new THREE.Mesh(propBladeGeo, new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    propBlade.position.y = 0.025;
    animPropeller.add(propBlade);

    capGroup.add(animPropeller);
    head.add(capGroup);
  } else if (costume === "pro_shades") {
    // Cyber Mirrored Sunglasses
    const shadeGroup = new THREE.Group();
    shadeGroup.position.set(0, 0.025, 0.384);
    shadeGroup.rotation.x = -0.12;

    const frameGeo = new THREE.BoxGeometry(0.26, 0.058, 0.02);
    shadeGroup.add(new THREE.Mesh(frameGeo, mDarkBezel));

    const lensGeo = new THREE.BoxGeometry(0.10, 0.044, 0.022);
    const lensMat = new THREE.MeshBasicMaterial({ color: team === 0 ? 0x00f5d4 : 0xfee440 });
    const leftLens = new THREE.Mesh(lensGeo, lensMat);
    leftLens.position.x = -0.06;
    shadeGroup.add(leftLens);

    const rightLens = new THREE.Mesh(lensGeo, lensMat);
    rightLens.position.x = 0.06;
    shadeGroup.add(rightLens);

    head.add(shadeGroup);
  } else if (costume === "bunny_ears") {
    // Soft Pastel Bouncy Bunny Ears
    animBunnyEars = new THREE.Group();
    animBunnyEars.position.set(0, 0.34, -0.04);

    const earOuterMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const earInnerMat = new THREE.MeshBasicMaterial({ color: 0xf472b6 });

    for (const side of [-1, 1]) {
      const ear = new THREE.Group();
      ear.position.set(side * 0.13, 0, 0);
      ear.rotation.z = side * 0.22;

      const outGeo = new THREE.CapsuleGeometry(0.04, 0.22, 10, 14);
      const outMesh = new THREE.Mesh(outGeo, earOuterMat);
      outMesh.position.y = 0.12;
      ear.add(outMesh);

      const inGeo = new THREE.CapsuleGeometry(0.024, 0.15, 8, 10);
      const inMesh = new THREE.Mesh(inGeo, earInnerMat);
      inMesh.position.set(0, 0.12, 0.02);
      ear.add(inMesh);

      animBunnyEars.add(ear);
    }
    head.add(animBunnyEars);
  } else if (costume === "dino_crest") {
    // Cute Dinosaur Spines & Little Tail
    const dinoMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 });
    for (let di = 0; di < 5; di++) {
      const dGeo = new THREE.ConeGeometry(0.05, 0.12, 6);
      const spike = new THREE.Mesh(dGeo, dinoMat);
      const zOffset = 0.12 - di * 0.13;
      spike.position.set(0, 0.34 - di * 0.04, zOffset);
      spike.rotation.x = -0.2 - di * 0.18;
      head.add(spike);
    }

    // Cute Tail on hips
    const tailGeo = new THREE.ConeGeometry(0.08, 0.22, 8);
    const tail = new THREE.Mesh(tailGeo, dinoMat);
    tail.position.set(0, 0.02, -0.38);
    tail.rotation.x = -Math.PI * 0.45;
    hips.add(tail);
  } else if (costume === "ninja_headband") {
    // Ninja Headband with Trailing Ribbons
    const hbMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
    const hbRing = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.025, 8, 28), hbMat);
    hbRing.position.set(0, 0.12, 0);
    head.add(hbRing);

    // Silver Forehead Plate
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.10, 0.04, 0.015),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 })
    );
    plate.position.set(0, 0.12, 0.37);
    head.add(plate);

    // Trailing ribbons on back
    for (const rx of [-0.04, 0.04]) {
      const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.25, 0.01), hbMat);
      ribbon.position.set(rx, 0.02, -0.38);
      ribbon.rotation.x = 0.2;
      head.add(ribbon);
    }
  } else if (costume === "party_hat") {
    // Striped Festive Cone Hat
    const coneGroup = new THREE.Group();
    coneGroup.position.set(0, 0.35, 0.02);
    coneGroup.rotation.z = -0.12;

    const coneGeo = new THREE.ConeGeometry(0.15, 0.32, 20);
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      roughness: 0.25,
      metalness: 0.1,
    });
    coneGroup.add(new THREE.Mesh(coneGeo, coneMat));

    const pomGeo = new THREE.SphereGeometry(0.048, 12, 10);
    const pomMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const pom = new THREE.Mesh(pomGeo, pomMat);
    pom.position.y = 0.17;
    coneGroup.add(pom);

    head.add(coneGroup);
  }

  // 4. Long Athletic Arms (Pivoting at shoulders)
  const armUpperGeom = new THREE.CapsuleGeometry(0.052, 0.16, 12, 16);
  const armForeGeom = new THREE.CapsuleGeometry(0.048, 0.14, 12, 16);
  const handGeom = new THREE.SphereGeometry(0.058, 16, 12);
  handGeom.scale(1.0, 1.15, 0.85);
  const wristbandGeom = new THREE.CylinderGeometry(0.056, 0.054, 0.04, 16);
  const thumbGeom = new THREE.CapsuleGeometry(0.020, 0.038, 8, 10);

  // Left Arm
  const leftUpperArm = new THREE.Group();
  leftUpperArm.position.set(-0.35, 0.08, 0.04);
  leftUpperArm.rotation.set(-0.25, 0, 0.35);
  torso.add(leftUpperArm);

  const lArmMesh = new THREE.Mesh(armUpperGeom, mJersey);
  lArmMesh.position.y = -0.10;
  lArmMesh.castShadow = true;
  leftUpperArm.add(lArmMesh);

  // Player Captain Armband on left arm!
  if (isPlayer) {
    const cBandGeo = new THREE.CylinderGeometry(0.062, 0.062, 0.05, 16);
    const cBand = new THREE.Mesh(cBandGeo, mGold);
    cBand.position.y = -0.06;
    leftUpperArm.add(cBand);
  }

  const leftForearm = new THREE.Group();
  leftForearm.position.set(0, -0.21, 0);
  leftForearm.rotation.x = -0.28;
  leftUpperArm.add(leftForearm);

  const lForearmMesh = new THREE.Mesh(armForeGeom, mJersey);
  lForearmMesh.position.y = -0.09;
  lForearmMesh.castShadow = true;
  leftForearm.add(lForearmMesh);

  const lWrist = new THREE.Mesh(wristbandGeom, mGold);
  lWrist.position.y = -0.17;
  leftForearm.add(lWrist);

  const leftHand = new THREE.Group();
  leftHand.position.set(0, -0.20, 0);
  leftForearm.add(leftHand);

  const lHandMesh = new THREE.Mesh(handGeom, mWhite);
  lHandMesh.position.y = -0.025;
  lHandMesh.castShadow = true;
  leftHand.add(lHandMesh);

  const lThumb = new THREE.Mesh(thumbGeom, mWhite);
  lThumb.position.set(0.038, 0.005, 0.020);
  lThumb.rotation.z = -0.55;
  leftHand.add(lThumb);

  // Right Arm
  const rightUpperArm = new THREE.Group();
  rightUpperArm.position.set(0.35, 0.08, 0.04);
  rightUpperArm.rotation.set(-0.25, 0, -0.35);
  torso.add(rightUpperArm);

  const rArmMesh = new THREE.Mesh(armUpperGeom, mJersey);
  rArmMesh.position.y = -0.10;
  rArmMesh.castShadow = true;
  rightUpperArm.add(rArmMesh);

  const rightForearm = new THREE.Group();
  rightForearm.position.set(0, -0.21, 0);
  rightForearm.rotation.x = -0.28;
  rightUpperArm.add(rightForearm);

  const rForearmMesh = new THREE.Mesh(armForeGeom, mJersey);
  rForearmMesh.position.y = -0.09;
  rForearmMesh.castShadow = true;
  rightForearm.add(rForearmMesh);

  const rWrist = new THREE.Mesh(wristbandGeom, mGold);
  rWrist.position.y = -0.17;
  rightForearm.add(rWrist);

  const rightHand = new THREE.Group();
  rightHand.position.set(0, -0.20, 0);
  rightForearm.add(rightHand);

  const rHandMesh = new THREE.Mesh(handGeom, mWhite);
  rHandMesh.position.y = -0.025;
  rHandMesh.castShadow = true;
  rightHand.add(rHandMesh);

  const rThumb = new THREE.Mesh(thumbGeom, mWhite);
  rThumb.position.set(-0.038, 0.005, 0.020);
  rThumb.rotation.z = 0.55;
  rightHand.add(rThumb);

  // 5. Long Athletic Legs & Chunky Stylized Sneakers (Nintendo / Mario / Fall Guy Style)
  const thighGeom = new THREE.CylinderGeometry(0.065, 0.056, 0.22, 16);
  const shinGeom = new THREE.CylinderGeometry(0.056, 0.050, 0.20, 16);
  const kneeGeom = new THREE.SphereGeometry(0.056, 12, 10);
  kneeGeom.scale(1.0, 1.05, 0.8);
  const sockGeom = new THREE.CylinderGeometry(0.060, 0.056, 0.09, 16);
  const sockBandGeom = new THREE.CylinderGeometry(0.062, 0.062, 0.016, 16);

  const shoeUpperGeom = new THREE.SphereGeometry(0.086, 16, 12);
  shoeUpperGeom.scale(1.02, 0.80, 1.45);
  const toeCapGeom = new THREE.SphereGeometry(0.080, 14, 10);
  toeCapGeom.scale(0.96, 0.72, 0.90);
  const midsoleGeom = new THREE.BoxGeometry(0.155, 0.046, 0.29);
  const outsoleGeom = new THREE.BoxGeometry(0.160, 0.018, 0.295);

  // Left Leg
  const leftUpperLeg = new THREE.Group();
  leftUpperLeg.position.set(-0.16, -0.04, 0);
  leftUpperLeg.rotation.z = -0.05;
  hips.add(leftUpperLeg);

  const lThighMesh = new THREE.Mesh(thighGeom, mDarkBezel);
  lThighMesh.position.y = -0.11;
  lThighMesh.castShadow = true;
  leftUpperLeg.add(lThighMesh);

  const lKnee = new THREE.Mesh(kneeGeom, mDarkBezel);
  lKnee.position.set(0, -0.22, 0.015);
  leftUpperLeg.add(lKnee);

  const leftLowerLeg = new THREE.Group();
  leftLowerLeg.position.set(0, -0.22, 0);
  leftUpperLeg.add(leftLowerLeg);

  const lShinMesh = new THREE.Mesh(shinGeom, mDarkBezel);
  lShinMesh.position.y = -0.09;
  lShinMesh.castShadow = true;
  leftLowerLeg.add(lShinMesh);

  const lSock = new THREE.Mesh(sockGeom, mWhite);
  lSock.position.y = -0.135;
  leftLowerLeg.add(lSock);

  const lSockBand = new THREE.Mesh(sockBandGeom, mAura);
  lSockBand.position.y = -0.11;
  leftLowerLeg.add(lSockBand);

  const leftFoot = new THREE.Group();
  leftFoot.position.set(0, -0.18, 0.035);
  leftLowerLeg.add(leftFoot);

  const lShoe = new THREE.Mesh(shoeUpperGeom, mShoe);
  lShoe.position.set(0, 0.030, 0.045);
  lShoe.castShadow = true;
  leftFoot.add(lShoe);

  const lToe = new THREE.Mesh(toeCapGeom, mWhite);
  lToe.position.set(0, 0.025, 0.125);
  leftFoot.add(lToe);

  // Shoe Laces (3 crisp horizontal white straps)
  for (const ly of [0.042, 0.062, 0.082]) {
    const lace = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.012, 0.02), mWhite);
    lace.position.set(0, ly, 0.045);
    leftFoot.add(lace);
  }

  const lMidsole = new THREE.Mesh(midsoleGeom, mShoeSole);
  lMidsole.position.set(0, -0.015, 0.045);
  leftFoot.add(lMidsole);

  const lOutsole = new THREE.Mesh(outsoleGeom, mOutsole);
  lOutsole.position.set(0, -0.038, 0.045);
  leftFoot.add(lOutsole);

  // Right Leg
  const rightUpperLeg = new THREE.Group();
  rightUpperLeg.position.set(0.16, -0.04, 0);
  rightUpperLeg.rotation.z = 0.05;
  hips.add(rightUpperLeg);

  const rThighMesh = new THREE.Mesh(thighGeom, mDarkBezel);
  rThighMesh.position.y = -0.11;
  rThighMesh.castShadow = true;
  rightUpperLeg.add(rThighMesh);

  const rKnee = new THREE.Mesh(kneeGeom, mDarkBezel);
  rKnee.position.set(0, -0.22, 0.015);
  rightUpperLeg.add(rKnee);

  const rightLowerLeg = new THREE.Group();
  rightLowerLeg.position.set(0, -0.22, 0);
  rightUpperLeg.add(rightLowerLeg);

  const rShinMesh = new THREE.Mesh(shinGeom, mDarkBezel);
  rShinMesh.position.y = -0.09;
  rShinMesh.castShadow = true;
  rightLowerLeg.add(rShinMesh);

  const rSock = new THREE.Mesh(sockGeom, mWhite);
  rSock.position.y = -0.135;
  rightLowerLeg.add(rSock);

  const rSockBand = new THREE.Mesh(sockBandGeom, mAura);
  rSockBand.position.y = -0.11;
  rightLowerLeg.add(rSockBand);

  const rightFoot = new THREE.Group();
  rightFoot.position.set(0, -0.18, 0.035);
  rightLowerLeg.add(rightFoot);

  const rShoe = new THREE.Mesh(shoeUpperGeom, mShoe);
  rShoe.position.set(0, 0.030, 0.045);
  rShoe.castShadow = true;
  rightFoot.add(rShoe);

  const rToe = new THREE.Mesh(toeCapGeom, mWhite);
  rToe.position.set(0, 0.025, 0.125);
  rightFoot.add(rToe);

  // Right Shoe Laces
  for (const ly of [0.042, 0.062, 0.082]) {
    const lace = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.012, 0.02), mWhite);
    lace.position.set(0, ly, 0.045);
    rightFoot.add(lace);
  }

  const rMidsole = new THREE.Mesh(midsoleGeom, mShoeSole);
  rMidsole.position.set(0, -0.015, 0.045);
  rightFoot.add(rMidsole);

  const rOutsole = new THREE.Mesh(outsoleGeom, mOutsole);
  rOutsole.position.set(0, -0.038, 0.045);
  rightFoot.add(rOutsole);

  // 6. Mini Thruster Backpack (Back -Z)
  const packGeo = new THREE.BoxGeometry(0.32, 0.36, 0.16);
  const pack = new THREE.Mesh(packGeo, mThruster);
  pack.position.set(0, 0.04, -0.34);
  pack.castShadow = true;
  torso.add(pack);

  // Status LED on Thruster
  const thrusterLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.03, 8, 8),
    new THREE.MeshBasicMaterial({ color: isCyan ? 0x06b6d4 : 0xf43f5e })
  );
  thrusterLed.position.set(0, 0.14, -0.43);
  torso.add(thrusterLed);

  const nozzleGeo = new THREE.CylinderGeometry(0.06, 0.085, 0.12, 12);
  const leftNozzle = new THREE.Mesh(nozzleGeo, mDarkBezel);
  leftNozzle.position.set(-0.09, -0.15, -0.34);
  torso.add(leftNozzle);

  const rightNozzle = new THREE.Mesh(nozzleGeo, mDarkBezel);
  rightNozzle.position.set(0.09, -0.15, -0.34);
  torso.add(rightNozzle);

  const flameGeo = new THREE.ConeGeometry(0.055, 0.15, 10);
  const leftFlame = new THREE.Mesh(flameGeo, mFlame);
  leftFlame.rotation.x = Math.PI;
  leftFlame.position.set(-0.09, -0.25, -0.34);
  torso.add(leftFlame);

  const rightFlame = new THREE.Mesh(flameGeo, mFlame);
  rightFlame.rotation.x = Math.PI;
  rightFlame.position.set(0.09, -0.25, -0.34);
  torso.add(rightFlame);

  // 7. Ground Team Aura Ring (Resting right below sneakers)
  const ringGeo = new THREE.RingGeometry(0.48, 0.64, 28);
  const ring = new THREE.Mesh(ringGeo, mAura);
  ring.rotation.x = -Math.PI * 0.5;
  ring.position.y = 0.01;
  root.add(ring);

  // Normalize placement: Base at y=0, centered on X and Z, front faces +Z
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.x = -center.x;
  root.position.y = -box.min.y;
  root.position.z = -center.z;

  // Store limb and animation nodes on userData
  g.userData = {
    root,
    hips,
    baseHipsY: hips.position.y,
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
    leftLowerLeg,
    rightLowerLeg,
    leftFoot,
    rightFoot,
    eyes: [lEye, rEye],
    flames: [leftFlame, rightFlame],
    auraRing: ring,
    propeller: animPropeller,
    bunnyEars: animBunnyEars,
    walkPhase: 0,
    punchPhase: 0,
    team,
    isPlayer,
    costume,
    jerseyMat: mJersey,
  };

  return g;
}
