const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  await page.goto('http://localhost:8085/__game__/boi-boian/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  const duoScreenshot = await page.evaluate(async () => {
    const THREE = window.THREE || (await import('three'));
    const { ASSET } = await import('./assetlib.js');

    // Create preview scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8);

    // Camera
    const camera = new THREE.PerspectiveCamera(40, 1440 / 900, 0.1, 100);
    camera.position.set(0, 0.70, 3.2);
    camera.lookAt(0, 0.55, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(1440, 900);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // Lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0x475569, 1.0);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xfffbeb, 1.5);
    dir.position.set(3, 5, 4);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 2048;
    dir.shadow.mapSize.height = 2048;
    scene.add(dir);

    const fill = new THREE.DirectionalLight(0xbae6fd, 0.6);
    fill.position.set(-3, 2, -2);
    scene.add(fill);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 4.5, 0.2, 48),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 })
    );
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Stage platform rings
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(2.2, 2.3, 48),
      new THREE.MeshBasicMaterial({ color: 0x94a3b8, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.005;
    scene.add(ring);

    // Load Ari (player_kid.js) and Budi (hunter_kid.js)
    const ari = await ASSET('./assets/player_kid.js', { keepHierarchy: true, surfaces: true });
    ari.position.set(-0.65, 0, 0);
    ari.rotation.y = 0.20; // slight angle to show 3D bean volume
    scene.add(ari);

    const budi = await ASSET('./assets/hunter_kid.js', { keepHierarchy: true, surfaces: true });
    budi.position.set(0.65, 0, 0);
    budi.rotation.y = -0.20; // slight angle towards Ari
    scene.add(budi);

    // Wait for textures to load and render multiple frames
    await new Promise(r => setTimeout(r, 2000));
    for (let i = 0; i < 5; i++) {
      renderer.render(scene, camera);
      await new Promise(r => setTimeout(r, 100));
    }
    return renderer.domElement.toDataURL('image/png');
  });

  const base64Data = duoScreenshot.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(
    '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_fallguys_duo_showcase.png',
    base64Data,
    'base64'
  );
  console.log('Saved screen_fallguys_duo_showcase.png');

  // Also render a back view to verify the back jerseys ("ARI #7" and "BUDI #10")
  const duoBackScreenshot = await page.evaluate(async () => {
    const THREE = window.THREE || (await import('three'));
    const { ASSET } = await import('./assetlib.js');

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38bdf8);

    const camera = new THREE.PerspectiveCamera(40, 1440 / 900, 0.1, 100);
    camera.position.set(0, 0.70, -3.2);
    camera.lookAt(0, 0.55, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(1440, 900);
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x475569, 1.0);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xfffbeb, 1.5);
    dir.position.set(-3, 5, -4);
    dir.castShadow = true;
    scene.add(dir);

    const fill = new THREE.DirectionalLight(0xbae6fd, 0.6);
    fill.position.set(3, 2, 2);
    scene.add(fill);

    const ground = new THREE.Mesh(
      new THREE.CylinderGeometry(4.5, 4.5, 0.2, 48),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 })
    );
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    const ari = await ASSET('./assets/player_kid.js', { keepHierarchy: true, surfaces: true });
    ari.position.set(-0.65, 0, 0);
    ari.rotation.y = 0.20;
    scene.add(ari);

    const budi = await ASSET('./assets/hunter_kid.js', { keepHierarchy: true, surfaces: true });
    budi.position.set(0.65, 0, 0);
    budi.rotation.y = -0.20;
    scene.add(budi);

    // Wait for textures to load and render multiple frames
    await new Promise(r => setTimeout(r, 1000));
    for (let i = 0; i < 5; i++) {
      renderer.render(scene, camera);
      await new Promise(r => setTimeout(r, 100));
    }
    return renderer.domElement.toDataURL('image/png');
  });

  const backBase64 = duoBackScreenshot.replace(/^data:image\/png;base64,/, '');
  fs.writeFileSync(
    '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_fallguys_duo_back.png',
    backBase64,
    'base64'
  );
  console.log('Saved screen_fallguys_duo_back.png');

  await browser.close();
})();
