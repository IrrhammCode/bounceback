/**
 * Ghibli Realistic HD Environment
 *
 * Procedural Studio Ghibli / Makoto Shinkai cinematic summer afternoon
 * environment built entirely in Three.js code. Zero external files.
 *
 * Creates: sky clouds, terrain with puddles, instanced grass field,
 * volumetric trees, countryside props (utility pole, fences, boulders,
 * bicycle, stone lantern), and the sacred stacking altar.
 */

const TAU = Math.PI * 2;

/* ────────────────────── deterministic noise ────────────────────── */
function makeNoise(seed = 1) {
  const P = new Uint8Array(512);
  let s = seed >>> 0 || 1;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const perm = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < 512; i++) P[i] = perm[i & 255];
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a, b, t) => a + (b - a) * t;
  const grad = (h, x, y) => ((h & 1) ? -x : x) + ((h & 2) ? -y : y);
  return (x, y) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const aa = P[P[X] + Y], ab = P[P[X] + Y + 1], ba = P[P[X + 1] + Y], bb = P[P[X + 1] + Y + 1];
    return lerp(lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u),
                lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u), v);
  };
}

function fbm(noise, x, y, octaves = 4, lac = 2.0, gain = 0.5) {
  let a = 1, f = 1, sum = 0, norm = 0;
  for (let i = 0; i < octaves; i++) { sum += a * noise(x * f, y * f); norm += a; a *= gain; f *= lac; }
  return sum / norm;
}

const clamp = (v, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const mix = (a, b, t) => a + (b - a) * t;

/* ────────────────────── canvas texture helpers ────────────────────── */
function makeCanvas(w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return { canvas: c, ctx: c.getContext('2d') };
}

function canvasTex(THREE, canvas, srgb = true) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ═══════════════════════ TERRAIN ═══════════════════════ */

function createGroundTexture(THREE, size = 2048) {
  const { canvas, ctx } = makeCanvas(size, size);
  const noise = makeNoise(42);
  const img = ctx.createImageData(size, size);
  const d = img.data;

  // Grass colors (multiple shades)
  const grassColors = [
    [104, 176, 77],   // #68B04D - base meadow
    [135, 195, 95],   // #87C35F - chartreuse highlight
    [74, 133, 55],    // #4A8537 - deep clover
    [120, 200, 100],  // brighter green
  ];
  // Court colors
  const courtBase = [216, 177, 122]; // #D8B17A - sun-baked earth
  const courtDark = [180, 145, 95];

  const courtRadius = 0.28; // fraction of canvas = ~7m court radius
  const courtBlend = 0.06;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const i = (y * size + x) * 4;

      // Distance from center (normalized)
      const dx = u - 0.5, dy = v - 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Noise layers for grass variation
      const n1 = fbm(noise, u * 8, v * 8, 4) * 0.5 + 0.5;
      const n2 = fbm(noise, u * 15 + 10, v * 15, 3) * 0.5 + 0.5;
      const n3 = fbm(noise, u * 3 + 20, v * 3, 2) * 0.5 + 0.5;

      // Pick grass shade
      const gi = Math.floor(n1 * grassColors.length) % grassColors.length;
      const gc = grassColors[gi];

      // Blend grass with subtle variation
      let r = gc[0] + (n2 - 0.5) * 30;
      let g = gc[1] + (n2 - 0.5) * 25;
      let b = gc[2] + (n2 - 0.5) * 20;

      // Dry brush strokes effect
      const stroke = Math.sin(u * 60 + n3 * 4) * Math.cos(v * 45 + n3 * 3);
      r += stroke * 8;
      g += stroke * 10;
      b += stroke * 5;

      // Court area blend
      const courtFactor = clamp(1 - (dist - courtRadius) / courtBlend);
      if (courtFactor > 0) {
        const cn = fbm(noise, u * 20, v * 20, 3) * 0.5 + 0.5;
        const cr = mix(courtBase[0], courtDark[0], cn * 0.4) + (Math.random() - 0.5) * 8;
        const cg = mix(courtBase[1], courtDark[1], cn * 0.4) + (Math.random() - 0.5) * 6;
        const cb = mix(courtBase[2], courtDark[2], cn * 0.4) + (Math.random() - 0.5) * 5;
        r = mix(r, cr, courtFactor);
        g = mix(g, cg, courtFactor);
        b = mix(b, cb, courtFactor);
      }

      // Chalk boundary lines (outer court ring)
      const lineRadius = courtRadius - 0.005;
      const lineWidth = 0.004;
      const lineDist = Math.abs(dist - lineRadius);
      if (lineDist < lineWidth && courtFactor > 0.3) {
        const chalkNoise = fbm(noise, u * 80, v * 80, 2) * 0.5 + 0.5;
        const chalkOpacity = clamp(1 - lineDist / lineWidth) * (0.5 + chalkNoise * 0.5);
        r = mix(r, 245, chalkOpacity * 0.7);
        g = mix(g, 240, chalkOpacity * 0.7);
        b = mix(b, 230, chalkOpacity * 0.7);
      }

      d[i]     = clamp(r, 0, 255);
      d[i + 1] = clamp(g, 0, 255);
      d[i + 2] = clamp(b, 0, 255);
      d[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return canvasTex(THREE, canvas);
}

function createTerrain(THREE, scene) {
  const tex = createGroundTexture(THREE);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.85, metalness: 0.0,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Reflective puddles
  const puddleMat = new THREE.MeshStandardMaterial({
    color: 0x8EC8E8, roughness: 0.05, metalness: 0.15,
    transparent: true, opacity: 0.7,
  });
  const puddles = [
    { x: -5.5, z: -4.2, r: 0.7 },
    { x: 4.8, z: -5.5, r: 0.55 },
    { x: -4.0, z: 5.0, r: 0.6 },
    { x: 6.2, z: 3.0, r: 0.45 },
    { x: -2.5, z: -6.5, r: 0.5 },
  ];
  const puddleGroup = new THREE.Group();
  puddles.forEach(p => {
    const m = new THREE.Mesh(new THREE.CircleGeometry(p.r, 24), puddleMat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(p.x, 0.015, p.z);
    m.receiveShadow = true;
    puddleGroup.add(m);
  });
  scene.add(puddleGroup);

  return { ground, puddleGroup, puddleMat };
}

/* ═══════════════════════ CUMULUS CLOUDS ═══════════════════════ */

function createCumulusCloud(THREE, x, y, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Sunlit material (top)
  const sunMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF, roughness: 0.95, metalness: 0,
    emissive: 0xFFF8E0, emissiveIntensity: 0.15,
  });
  // Shadow material (bottom)
  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xBDCBEA, roughness: 1.0, metalness: 0,
  });
  // Deep shadow
  const deepMat = new THREE.MeshStandardMaterial({
    color: 0x9AA5C4, roughness: 1.0, metalness: 0,
  });

  const puffs = 12 + Math.floor(Math.random() * 8);
  for (let i = 0; i < puffs; i++) {
    const r = (2.5 + Math.random() * 4) * scale;
    const geo = new THREE.IcosahedronGeometry(r, 2);

    // Deform vertices for organic shape
    const pos = geo.attributes.position;
    for (let v = 0; v < pos.count; v++) {
      const nx = pos.getX(v), ny = pos.getY(v), nz = pos.getZ(v);
      const noise = Math.sin(nx * 1.5) * Math.cos(ny * 2) * Math.sin(nz * 1.8) * 0.15;
      pos.setXYZ(v, nx * (1 + noise), ny * (1 + noise * 0.8), nz * (1 + noise));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();

    // Assign material based on vertical position (above/below center)
    const offsetY = (Math.random() - 0.3) * 3 * scale;
    const mat = offsetY > 1 ? sunMat : offsetY > -0.5 ? shadeMat : deepMat;

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 8 * scale,
      offsetY,
      (Math.random() - 0.5) * 5 * scale
    );
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    group.add(mesh);
  }

  return group;
}

function createCloudField(THREE, scene) {
  const clouds = new THREE.Group();

  // 5 colossal cumulus formations along the horizon
  const formations = [
    { x: -80, y: 45, z: -120, s: 1.4 },
    { x: 30, y: 50, z: -130, s: 1.8 },
    { x: 100, y: 42, z: -110, s: 1.2 },
    { x: -40, y: 55, z: -140, s: 1.6 },
    { x: 70, y: 48, z: -125, s: 1.3 },
  ];
  formations.forEach(f => {
    clouds.add(createCumulusCloud(THREE, f.x, f.y, f.z, f.s));
  });

  // Cirrus wisps (high altitude flat planes)
  const cirrusMat = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF, transparent: true, opacity: 0.15,
    side: THREE.DoubleSide,
  });
  for (let i = 0; i < 4; i++) {
    const w = 30 + Math.random() * 40;
    const h = 8 + Math.random() * 12;
    const cirrus = new THREE.Mesh(new THREE.PlaneGeometry(w, h), cirrusMat);
    cirrus.position.set(
      (Math.random() - 0.5) * 160,
      70 + Math.random() * 20,
      -80 - Math.random() * 60
    );
    cirrus.rotation.x = -Math.PI / 2 + (Math.random() - 0.5) * 0.1;
    cirrus.rotation.z = (Math.random() - 0.5) * 0.3;
    clouds.add(cirrus);
  }

  scene.add(clouds);
  return clouds;
}

/* ═══════════════════════ GHIBLI TREES ═══════════════════════ */

function createTreeTrunk(THREE, height, baseRadius, topRadius) {
  const geo = new THREE.CylinderGeometry(topRadius, baseRadius, height, 8, 4);

  // Bend trunk slightly
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const bendFactor = (y / height) * (y / height);
    pos.setX(i, pos.getX(i) + bendFactor * 0.3);
    pos.setZ(i, pos.getZ(i) + bendFactor * 0.15);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  return geo;
}

function createFoliageClump(THREE, radius) {
  const geo = new THREE.IcosahedronGeometry(radius, 2);

  // Flatten slightly and deform for organic billowy shape
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const squash = 0.65; // flatten vertically
    const noise = Math.sin(x * 3) * Math.cos(z * 2.5) * 0.12;
    pos.setXYZ(i, x * (1 + noise), y * squash * (1 + noise * 0.5), z * (1 + noise));
  }
  pos.needsUpdate = true;

  // Recompute normals pointing outward from center for pillowy anime shading
  geo.computeVertexNormals();

  return geo;
}

function createGhibliTree(THREE, x, z, scale = 1, variant = 0) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);

  // Bark material
  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x462A1B, roughness: 0.9, metalness: 0,
    name: 'timber',
  });

  // Lichen patches material
  const lichenMat = new THREE.MeshStandardMaterial({
    color: 0x4E7A32, roughness: 1.0, metalness: 0,
  });

  // Foliage materials - three-tone anime shading via vertex colors
  const foliageSunMat = new THREE.MeshStandardMaterial({
    color: 0x88E82A, roughness: 0.85, metalness: 0,
    name: 'foliage',
  });
  const foliageCoreMat = new THREE.MeshStandardMaterial({
    color: 0x1F8A38, roughness: 0.9, metalness: 0,
    name: 'foliage',
  });
  const foliageShadeMat = new THREE.MeshStandardMaterial({
    color: 0x084224, roughness: 0.95, metalness: 0,
    name: 'foliage',
  });

  const trunkHeight = (3.5 + variant * 0.8) * scale;
  const trunkGeo = createTreeTrunk(THREE, trunkHeight, 0.35 * scale, 0.18 * scale);
  const trunk = new THREE.Mesh(trunkGeo, barkMat);
  trunk.position.y = trunkHeight / 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  // Root flares
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * TAU + Math.random() * 0.5;
    const root = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05 * scale, 0.15 * scale, 0.8 * scale, 6),
      barkMat
    );
    root.position.set(Math.cos(ang) * 0.3 * scale, 0.2 * scale, Math.sin(ang) * 0.3 * scale);
    root.rotation.z = (Math.random() - 0.5) * 0.6;
    root.rotation.x = (Math.random() - 0.5) * 0.3;
    root.castShadow = true;
    tree.add(root);
  }

  // Lichen patches on trunk
  for (let i = 0; i < 3; i++) {
    const lichen = new THREE.Mesh(
      new THREE.SphereGeometry(0.12 * scale, 6, 4),
      lichenMat
    );
    lichen.position.set(
      0.3 * scale * Math.cos(i * 2.1),
      1.0 + i * 0.9 * scale,
      0.3 * scale * Math.sin(i * 2.1)
    );
    lichen.scale.set(1, 0.3, 1);
    tree.add(lichen);
  }

  // Foliage canopy - 8-12 billowy clumps
  const canopyGroup = new THREE.Group();
  canopyGroup.position.y = trunkHeight * 0.85;
  const clumpCount = 8 + Math.floor(Math.random() * 5);

  for (let i = 0; i < clumpCount; i++) {
    const r = (0.8 + Math.random() * 0.6) * scale;
    const geo = createFoliageClump(THREE, r);

    // Pick material based on vertical position within canopy
    const offY = (Math.random() - 0.3) * 1.5 * scale;
    const mat = offY > 0.4 * scale ? foliageSunMat
              : offY > -0.3 * scale ? foliageCoreMat
              : foliageShadeMat;

    const clump = new THREE.Mesh(geo, mat);
    clump.position.set(
      (Math.random() - 0.5) * 2.2 * scale,
      offY,
      (Math.random() - 0.5) * 2.2 * scale
    );
    clump.castShadow = true;
    clump.receiveShadow = true;
    canopyGroup.add(clump);
  }

  tree.add(canopyGroup);
  tree.userData._canopy = canopyGroup;
  tree.userData._variant = variant;

  return tree;
}

function plantTrees(THREE, scene) {
  const trees = [];
  // Ring of trees around the arena perimeter
  const positions = [
    { x: -9.5, z: -8, s: 1.2, v: 0 },
    { x: -7, z: -10.5, s: 1.0, v: 1 },
    { x: 0, z: -12, s: 1.5, v: 2 },
    { x: 7.5, z: -10, s: 1.1, v: 0 },
    { x: 10, z: -7, s: 1.3, v: 1 },
    { x: 11, z: 0, s: 1.0, v: 2 },
    { x: 10, z: 7, s: 1.4, v: 0 },
    { x: 5, z: 11, s: 0.9, v: 1 },
    { x: -5, z: 11.5, s: 1.1, v: 2 },
    { x: -11, z: 5, s: 1.3, v: 0 },
    { x: -11.5, z: -2, s: 1.0, v: 1 },
    { x: 3, z: -11.5, s: 0.8, v: 2 },
  ];

  positions.forEach(p => {
    const tree = createGhibliTree(THREE, p.x, p.z, p.s, p.v);
    scene.add(tree);
    trees.push(tree);
  });

  return trees;
}

/* ═══════════════════════ INSTANCED GRASS ═══════════════════════ */

function createGrassField(THREE, scene) {
  // Single blade geometry: slender curved ribbon
  const bladeGeo = new THREE.BufferGeometry();
  const w = 0.06, h = 0.85;
  const verts = new Float32Array([
    -w, 0, 0,   w, 0, 0,
    -w * 0.7, h * 0.4, 0,   w * 0.7, h * 0.4, 0,
    -w * 0.3, h * 0.75, 0.02,   w * 0.3, h * 0.75, 0.02,
    0, h, 0.05,
  ]);
  const indices = new Uint16Array([
    0, 1, 2,  1, 3, 2,
    2, 3, 4,  3, 5, 4,
    4, 5, 6,
  ]);
  bladeGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  bladeGeo.setIndex(new THREE.BufferAttribute(indices, 1));
  bladeGeo.computeVertexNormals();

  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x76C893, roughness: 0.9, metalness: 0,
    side: THREE.DoubleSide,
    name: 'foliage',
  });

  const count = 2500;
  const grass = new THREE.InstancedMesh(bladeGeo, grassMat, count);
  const dummy = new THREE.Object3D();
  const noise = makeNoise(77);

  const courtR = 8.5; // keep grass outside the court area
  let placed = 0;

  for (let i = 0; i < count * 2 && placed < count; i++) {
    const x = (Math.random() - 0.5) * 50;
    const z = (Math.random() - 0.5) * 50;
    const dist = Math.sqrt(x * x + z * z);

    // Skip court area and very far areas
    if (dist < courtR || dist > 24) continue;

    dummy.position.set(x, 0, z);
    dummy.rotation.set(0, Math.random() * TAU, 0);
    const sc = 0.6 + Math.random() * 0.5;
    dummy.scale.set(sc, sc + Math.random() * 0.3, sc);
    dummy.updateMatrix();
    grass.setMatrixAt(placed, dummy.matrix);

    // Color variation: spring green to sunlit yellow-green
    const n = noise(x * 0.3, z * 0.3) * 0.5 + 0.5;
    const color = new THREE.Color();
    color.setHSL(0.28 + n * 0.08, 0.55 + n * 0.2, 0.42 + n * 0.15);
    grass.setColorAt(placed, color);

    placed++;
  }

  grass.count = placed;
  grass.instanceMatrix.needsUpdate = true;
  if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
  grass.castShadow = false;
  grass.receiveShadow = true;
  scene.add(grass);

  // Store original matrices for wind animation
  const origMatrices = new Float32Array(grass.instanceMatrix.array);

  return { grass, origMatrices, count: placed };
}

/* ═══════════════════════ COUNTRYSIDE PROPS ═══════════════════════ */

function createUtilityPole(THREE) {
  const group = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5C4033, roughness: 0.9, metalness: 0, name: 'timber' });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x6B7280, roughness: 0.5, metalness: 0.6, name: 'metal' });
  const wireMat = new THREE.MeshBasicMaterial({ color: 0x1F2937 });

  // Main pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 9, 8), woodMat);
  pole.position.y = 4.5;
  pole.castShadow = true;
  group.add(pole);

  // Cross arm
  const arm = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.12, 0.12), woodMat);
  arm.position.y = 8.5;
  arm.castShadow = true;
  group.add(arm);

  // Insulators (ceramic)
  const insulatorMat = new THREE.MeshStandardMaterial({ color: 0xE8E0D0, roughness: 0.4, metalness: 0.1 });
  for (let i = -1; i <= 1; i++) {
    const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.12, 8), insulatorMat);
    ins.position.set(i * 1.0, 8.65, 0);
    group.add(ins);
  }

  // Transformer box
  const transformer = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 8), metalMat);
  transformer.position.set(0.2, 7.5, 0);
  transformer.castShadow = true;
  group.add(transformer);

  // Step irons
  for (let i = 0; i < 5; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.2), metalMat);
    step.position.set(0.14, 2 + i * 1.2, 0);
    group.add(step);
  }

  return group;
}

function createPowerLines(THREE, pole1Pos, pole2Pos) {
  const group = new THREE.Group();
  const wireMat = new THREE.LineBasicMaterial({ color: 0x1F2937, linewidth: 1 });

  for (let w = -1; w <= 1; w++) {
    const points = [];
    const segments = 20;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = mix(pole1Pos.x + w * 1.0, pole2Pos.x + w * 1.0, t);
      const z = mix(pole1Pos.z, pole2Pos.z, t);
      // Catenary sag
      const sag = -Math.sin(t * Math.PI) * 1.2;
      const y = mix(8.65, 8.65, t) + sag;
      points.push(new THREE.Vector3(x, y, z));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geo, wireMat);
    group.add(line);
  }

  return group;
}

function createMossyBoulder(THREE, x, z, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x7A7D84, roughness: 0.85, metalness: 0, name: 'stone' });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x4E7A32, roughness: 1.0, metalness: 0, name: 'foliage' });

  // Main boulder - deformed dodecahedron
  const bGeo = new THREE.DodecahedronGeometry(0.6 * scale, 1);
  const pos = bGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x2 = pos.getX(i), y2 = pos.getY(i), z2 = pos.getZ(i);
    const n = Math.sin(x2 * 3) * Math.cos(z2 * 4) * 0.08;
    pos.setXYZ(i, x2 * (1 + n), y2 * 0.7, z2 * (1 + n));
  }
  pos.needsUpdate = true;
  bGeo.computeVertexNormals();

  const boulder = new THREE.Mesh(bGeo, stoneMat);
  boulder.position.y = 0.25 * scale;
  boulder.castShadow = true;
  boulder.receiveShadow = true;
  group.add(boulder);

  // Moss cap on top
  const mossGeo = new THREE.SphereGeometry(0.45 * scale, 8, 4, 0, TAU, 0, Math.PI / 3);
  const moss = new THREE.Mesh(mossGeo, mossMat);
  moss.position.y = 0.35 * scale;
  moss.receiveShadow = true;
  group.add(moss);

  return group;
}

function createWoodenBench(THREE, x, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotY;

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x6B4226, roughness: 0.85, metalness: 0, name: 'timber' });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x4A4A4A, roughness: 0.7, metalness: 0.4, name: 'metal' });

  // Seat planks
  for (let i = 0; i < 3; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 0.18), woodMat);
    plank.position.set(0, 0.45, -0.2 + i * 0.2);
    plank.rotation.y = (Math.random() - 0.5) * 0.02; // slight misalignment
    plank.castShadow = true;
    plank.receiveShadow = true;
    group.add(plank);
  }

  // Legs
  for (let lx = -0.6; lx <= 0.6; lx += 1.2) {
    for (let lz = -0.2; lz <= 0.2; lz += 0.4) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.45, 0.06), woodMat);
      leg.position.set(lx, 0.22, lz);
      leg.castShadow = true;
      group.add(leg);
    }
  }

  // Iron bolts
  for (let bx = -0.6; bx <= 0.6; bx += 1.2) {
    const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), metalMat);
    bolt.position.set(bx, 0.48, 0);
    group.add(bolt);
  }

  return group;
}

function createSplitRailFence(THREE, x, z, length = 4, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotY;

  const woodMat = new THREE.MeshStandardMaterial({ color: 0x7B5B3A, roughness: 0.9, metalness: 0, name: 'timber' });
  const ivyMat = new THREE.MeshStandardMaterial({ color: 0x3A7D28, roughness: 0.9, metalness: 0, name: 'foliage' });

  const postCount = Math.ceil(length / 1.5) + 1;

  for (let i = 0; i < postCount; i++) {
    const px = (i / (postCount - 1) - 0.5) * length;

    // Post
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.0, 6), woodMat);
    post.position.set(px, 0.5, 0);
    post.castShadow = true;
    group.add(post);

    // Ivy on random posts
    if (Math.random() > 0.5) {
      const ivy = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 4), ivyMat);
      ivy.position.set(px, 0.6 + Math.random() * 0.3, 0.08);
      ivy.scale.set(0.8, 1.2, 0.6);
      group.add(ivy);
    }
  }

  // Rails
  for (let ry = 0.35; ry <= 0.75; ry += 0.4) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, length, 6), woodMat);
    rail.rotation.z = Math.PI / 2;
    rail.position.set(0, ry, 0);
    rail.castShadow = true;
    group.add(rail);
  }

  return group;
}

function createBicycle(THREE, x, z, rotY = 0) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = rotY;

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x68B684, roughness: 0.5, metalness: 0.3, name: 'metal' });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x2D2D2D, roughness: 0.9, metalness: 0 });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.15, metalness: 0.8, name: 'metal' });
  const basketMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.9, metalness: 0, name: 'timber' });

  // Wheels
  for (let wx = -0.45; wx <= 0.45; wx += 0.9) {
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 8, 24), tireMat);
    tire.position.set(wx, 0.3, 0);
    tire.rotation.y = Math.PI / 2;
    group.add(tire);

    // Spokes (simplified)
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.56, 4), chromeMat);
    spoke.position.set(wx, 0.3, 0);
    spoke.rotation.z = Math.PI / 4;
    group.add(spoke);
    const spoke2 = spoke.clone();
    spoke2.rotation.z = -Math.PI / 4;
    group.add(spoke2);
  }

  // Frame tubes
  const mainTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6), frameMat);
  mainTube.position.set(0, 0.45, 0);
  mainTube.rotation.z = Math.PI / 6;
  mainTube.castShadow = true;
  group.add(mainTube);

  const seatTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), frameMat);
  seatTube.position.set(-0.1, 0.55, 0);
  seatTube.castShadow = true;
  group.add(seatTube);

  // Handlebars
  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35, 6), chromeMat);
  handlebar.position.set(0.35, 0.75, 0);
  handlebar.rotation.x = Math.PI / 2;
  group.add(handlebar);

  // Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.12), new THREE.MeshStandardMaterial({ color: 0x3D2B1F, roughness: 0.8 }));
  seat.position.set(-0.15, 0.82, 0);
  group.add(seat);

  // Front basket
  const basket = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.18, 8, 1, true), basketMat);
  basket.position.set(0.4, 0.6, 0);
  group.add(basket);

  // Lean the bike slightly
  group.rotation.z = 0.12;

  return group;
}

function createStoneLantern(THREE, x, z) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8A8A7A, roughness: 0.9, metalness: 0, name: 'stone' });
  const mossMat = new THREE.MeshStandardMaterial({ color: 0x4A6B3A, roughness: 1.0, metalness: 0 });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0xFFE4B5, emissive: 0xFFD08C, emissiveIntensity: 0.3, roughness: 0.8,
  });

  // Base
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.15, 6), stoneMat);
  base.position.y = 0.075;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Pillar
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.8, 6), stoneMat);
  pillar.position.y = 0.55;
  pillar.castShadow = true;
  group.add(pillar);

  // Lantern chamber
  const chamber = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.35), stoneMat);
  chamber.position.y = 1.1;
  chamber.castShadow = true;
  group.add(chamber);

  // Inner glow
  const glow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.2), glowMat);
  glow.position.y = 1.1;
  group.add(glow);

  // Roof
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.2, 4), stoneMat);
  roof.position.y = 1.35;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  // Moss on roof
  const mossRoof = new THREE.Mesh(new THREE.SphereGeometry(0.22, 6, 4, 0, TAU, 0, Math.PI / 3), mossMat);
  mossRoof.position.y = 1.38;
  group.add(mossRoof);

  return group;
}

/* ═══════════════════════ STACKING ALTAR ═══════════════════════ */

function createSacredAltar(THREE) {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x9A9080, roughness: 0.75, metalness: 0.05, name: 'stone',
  });
  const mossLineMat = new THREE.MeshStandardMaterial({
    color: 0x3D6B2E, roughness: 1.0, metalness: 0,
  });
  const petalMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF, roughness: 0.9, metalness: 0,
  });

  // Main stone dais
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 0.12, 32), stoneMat);
  dais.position.y = 0.06;
  dais.receiveShadow = true;
  dais.castShadow = true;
  group.add(dais);

  // Concentric carved rings
  for (let i = 1; i <= 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.6 * i, 0.025, 6, 32),
      mossLineMat
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.13;
    group.add(ring);
  }

  // River pebbles border
  for (let i = 0; i < 20; i++) {
    const ang = (i / 20) * TAU;
    const r = 2.3 + (Math.random() - 0.5) * 0.2;
    const pebble = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.08 + Math.random() * 0.06, 0),
      stoneMat
    );
    pebble.position.set(Math.cos(ang) * r, 0.04, Math.sin(ang) * r);
    pebble.scale.y = 0.5;
    pebble.receiveShadow = true;
    group.add(pebble);
  }

  // Wildflower clusters (white daisies)
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * TAU + Math.random() * 0.3;
    const r = 2.5 + Math.random() * 0.3;
    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 6, 4),
      petalMat
    );
    flower.position.set(Math.cos(ang) * r, 0.06, Math.sin(ang) * r);
    group.add(flower);
  }

  // Warm zone glow (visible gameplay indicator replacing neon ring)
  const glowRingMat = new THREE.MeshBasicMaterial({
    color: 0xFFD166, transparent: true, opacity: 0.25, side: THREE.DoubleSide,
  });
  const glowRing = new THREE.Mesh(new THREE.RingGeometry(1.72, 1.88, 64), glowRingMat);
  glowRing.rotation.x = -Math.PI / 2;
  glowRing.position.y = 0.14;
  group.add(glowRing);
  group.userData._glowRing = glowRing;
  group.userData._glowRingMat = glowRingMat;

  // Inner zone glow (subtle warmth)
  const innerGlow = new THREE.Mesh(
    new THREE.CircleGeometry(1.72, 64),
    new THREE.MeshBasicMaterial({ color: 0xFFD166, transparent: true, opacity: 0.04 })
  );
  innerGlow.rotation.x = -Math.PI / 2;
  innerGlow.position.y = 0.135;
  group.add(innerGlow);

  return group;
}

/* ═══════════════════════ MAIN EXPORT ═══════════════════════ */

/**
 * Build and return the entire Ghibli environment.
 * Call once in setup(), returns handles needed for the animation loop.
 */
export function createGhibliEnvironment(THREE, scene) {
  const terrain = createTerrain(THREE, scene);
  const clouds = createCloudField(THREE, scene);
  const trees = plantTrees(THREE, scene);
  const grassData = createGrassField(THREE, scene);
  const altar = createSacredAltar(THREE);
  scene.add(altar);

  // Countryside props
  const pole1Pos = { x: -10, z: 9 };
  const pole2Pos = { x: 10, z: 9.5 };
  const pole1 = createUtilityPole(THREE);
  pole1.position.set(pole1Pos.x, 0, pole1Pos.z);
  scene.add(pole1);
  const pole2 = createUtilityPole(THREE);
  pole2.position.set(pole2Pos.x, 0, pole2Pos.z);
  scene.add(pole2);
  const wires = createPowerLines(THREE, pole1Pos, pole2Pos);
  scene.add(wires);

  // Boulders (tactical cover — replacing generic grid)
  const boulders = [
    createMossyBoulder(THREE, -4.5, -3, 1.1),
    createMossyBoulder(THREE, 4.2, -2.5, 0.9),
    createMossyBoulder(THREE, -3, 3.5, 0.8),
    createMossyBoulder(THREE, 5.5, 4, 1.0),
  ];
  boulders.forEach(b => scene.add(b));

  // Benches
  const bench1 = createWoodenBench(THREE, -8, 0, Math.PI / 6);
  const bench2 = createWoodenBench(THREE, 8.5, -1, -Math.PI / 5);
  scene.add(bench1); scene.add(bench2);

  // Fences
  const fence1 = createSplitRailFence(THREE, 0, 9, 8, 0);
  const fence2 = createSplitRailFence(THREE, -9, 0, 6, Math.PI / 2);
  scene.add(fence1); scene.add(fence2);

  // Bicycle
  const bike = createBicycle(THREE, 8.5, 8, -Math.PI / 3);
  scene.add(bike);

  // Stone lantern
  const lantern = createStoneLantern(THREE, -8.5, -7);
  scene.add(lantern);

  // Throw line (chalk on ground instead of neon)
  const throwLine = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 0.08),
    new THREE.MeshStandardMaterial({ color: 0xF5F0E0, roughness: 1.0, metalness: 0, transparent: true, opacity: 0.5 })
  );
  throwLine.rotation.x = -Math.PI / 2;
  throwLine.position.set(0, 0.02, 5);
  throwLine.receiveShadow = true;
  scene.add(throwLine);

  return {
    terrain,
    clouds,
    trees,
    grassData,
    altar,
    boulders,

    /** Call every frame from the game loop */
    update(time, dt) {
      // Cloud drift
      clouds.children.forEach((c, i) => {
        if (c.isGroup) c.position.x += dt * (0.3 + i * 0.1);
        if (c.position && c.position.x > 160) c.position.x = -160;
      });

      // Tree canopy sway
      trees.forEach((tree, i) => {
        const canopy = tree.userData._canopy;
        if (canopy) {
          canopy.rotation.y = Math.sin(time * 1.5 + i * 1.3) * 0.03;
          canopy.rotation.x = Math.sin(time * 1.2 + i * 0.9) * 0.02;
        }
      });

      // Instanced grass wind animation
      const { grass, origMatrices, count } = grassData;
      const mat4 = new THREE.Matrix4();
      const pos = new THREE.Vector3();
      const quat = new THREE.Quaternion();
      const scl = new THREE.Vector3();

      for (let i = 0; i < count; i++) {
        mat4.fromArray(origMatrices, i * 16);
        mat4.decompose(pos, quat, scl);

        // Rolling wind wave
        const windAngle = Math.sin(time * 3.0 + pos.x * 0.4 + pos.z * 0.3) * 0.25
                        + Math.cos(time * 5.0 + pos.x * 0.7) * 0.08;

        quat.setFromEuler(new THREE.Euler(0, 0, windAngle));
        mat4.compose(pos, quat, scl);
        grass.setMatrixAt(i, mat4);
      }
      grass.instanceMatrix.needsUpdate = true;

      // Altar zone glow pulse
      const glowMat = altar.userData._glowRingMat;
      if (glowMat) {
        glowMat.opacity = 0.2 + Math.sin(time * 2) * 0.1;
      }

      // Puddle ripples (subtle material animation)
      if (terrain.puddleMat) {
        terrain.puddleMat.opacity = 0.65 + Math.sin(time * 1.5) * 0.05;
      }
    }
  };
}
