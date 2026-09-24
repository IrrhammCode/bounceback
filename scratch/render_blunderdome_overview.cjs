const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900 });

  await page.goto('http://localhost:8085/__game__/boi-boian/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));

  const overviewPng = await page.evaluate(async () => {
    const THREE = window.THREE || (await import('three'));
    const { ASSET } = await import('./assetlib.js');
    const { createEnvironment } = await import('./src/environment.js');

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(46, 1600 / 900, 0.1, 800);
    // Elevated stadium aerial perspective
    camera.position.set(-28, 24, 46);
    camera.lookAt(0, 4, -4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(1600, 900);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // Daylight lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0x0284c7, 1.2);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xfff8ee, 1.7);
    dir.position.set(25, 45, 30);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 150;
    dir.shadow.camera.left = -35;
    dir.shadow.camera.right = 35;
    dir.shadow.camera.top = 35;
    dir.shadow.camera.bottom = -35;
    scene.add(dir);

    // Build Environment
    await createEnvironment(THREE, scene);

    // Add Pedestal & Shards in center
    const pedestal = await ASSET('./assets/neo_pedestal.js', { keepHierarchy: true, surfaces: true });
    pedestal.position.set(0, 0, 0);
    scene.add(pedestal);

    // Add Ari & Budi in stadium
    const ari = await ASSET('./assets/player_kid.js', { keepHierarchy: true, surfaces: true });
    ari.position.set(-3.5, 0, 4);
    ari.rotation.y = 0.3;
    scene.add(ari);

    const budi = await ASSET('./assets/hunter_kid.js', { keepHierarchy: true, surfaces: true });
    budi.position.set(3.5, 0, -4);
    budi.rotation.y = -2.8;
    scene.add(budi);

    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/png');
  });

  fs.writeFileSync(
    '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_blunderdome_wide_overview.png',
    Buffer.from(overviewPng.split(',')[1], 'base64')
  );
  console.log('Saved screen_blunderdome_wide_overview.png');

  await browser.close();
})();
