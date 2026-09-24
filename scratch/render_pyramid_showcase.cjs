const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 1280 });

  await page.goto('http://localhost:8085/__game__/boi-boian/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  const showcasePng = await page.evaluate(async () => {
    const THREE = window.THREE || (await import('three'));
    const { ASSET } = await import('./assetlib.js');

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(0, 1.35, 2.6);
    camera.lookAt(0, 0.42, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(1280, 1280);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // Lights
    const hemi = new THREE.HemisphereLight(0xffffff, 0x0284c7, 1.2);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xfffbeb, 1.7);
    dir.position.set(2.5, 4.5, 3.5);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    scene.add(dir);

    const fill = new THREE.DirectionalLight(0xf472b6, 0.45);
    fill.position.set(-3, 2, -2);
    scene.add(fill);

    // Ground Platform
    const ground = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.4, 0.15, 48),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.2,
      })
    );
    ground.position.y = -0.075;
    ground.receiveShadow = true;
    scene.add(ground);

    // Neon Target Pedestal
    const pedestal = await ASSET('./assets/neo_pedestal.js', { keepHierarchy: true, surfaces: true });
    pedestal.position.set(0, 0, 0);
    scene.add(pedestal);

    // Target Slots for the 12-block pyramid
    const TOWER_COURSES = [
      { course: 1, count: 5, radius: 0.22, height: 0.08 },
      { course: 2, count: 4, radius: 0.14, height: 0.19 },
      { course: 3, count: 2, radius: 0.075, height: 0.30 },
      { course: 4, count: 1, radius: 0.0, height: 0.41 },
    ];
    const TIER_COLORS = [0xec4899, 0x06b6d4, 0xfacc15, 0xa855f7];

    for (const c of TOWER_COURSES) {
      for (let i = 0; i < c.count; i++) {
        let x = 0, z = 0, rotY = 0;
        if (c.course === 1) {
          const ang = (i / 5) * Math.PI * 2;
          x = Math.cos(ang) * c.radius;
          z = Math.sin(ang) * c.radius;
          rotY = -ang;
        } else if (c.course === 2) {
          const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
          x = Math.cos(ang) * c.radius;
          z = Math.sin(ang) * c.radius;
          rotY = -ang + Math.PI / 4;
        } else if (c.course === 3) {
          x = (i === 0 ? -1 : 1) * c.radius;
          z = 0;
        } else {
          rotY = Math.PI / 4;
        }

        const shard = await ASSET('./assets/neo_prism_shard.js', { keepHierarchy: true, surfaces: true });
        const tierColor = TIER_COLORS[c.course - 1];
        shard.traverse(n => {
          if (n.isMesh) {
            n.castShadow = true;
            n.receiveShadow = true;
            if (n.geometry?.type === 'BoxGeometry' && n.geometry.parameters.width > 0.2) {
              n.material = n.material.clone();
              n.material.color.setHex(tierColor);
            }
          }
        });
        shard.position.set(x, c.height, z);
        shard.rotation.y = rotY;
        scene.add(shard);
      }
    }

    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/png');
  });

  fs.writeFileSync(
    '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_blunderdome_pyramid_closeup.png',
    Buffer.from(showcasePng.split(',')[1], 'base64')
  );
  console.log('Saved screen_blunderdome_pyramid_closeup.png');

  await browser.close();
})();
