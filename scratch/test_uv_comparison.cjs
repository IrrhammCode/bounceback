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

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.75, 3.2);
    camera.lookAt(0, 0.65, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(960, 960);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x444455, 0.9);
    scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xfff5e6, 1.4);
    dir.position.set(3, 5, 4);
    scene.add(dir);

    // Canvas with Front at X=768 and Back at X=256
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(0, 0, 1024, 1024);

    // Back at X=256
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 60px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ARI BACK', 256, 450);
    ctx.fillStyle = '#facc15';
    ctx.font = '900 120px sans-serif';
    ctx.fillText('7', 256, 560);

    // Front at X=768
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 60px sans-serif';
    ctx.fillText('GARUDA FRONT', 768, 450);
    ctx.fillStyle = '#facc15';
    ctx.font = '900 120px sans-serif';
    ctx.fillText('7', 768, 560);

    // Side stripes at X=0/1024 and X=512
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(512 - 20, 100, 40, 900);
    ctx.fillRect(0, 100, 20, 900);
    ctx.fillRect(1004, 100, 20, 900);

    const testTex = new THREE.CanvasTexture(canvas);

    const mJersey = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: testTex,
      roughness: 0.32,
    });

    const g = new THREE.Group();

    // Model 1: Front Facing Camera (showing X=768)
    const geom1 = new THREE.CapsuleGeometry(0.35, 0.48, 20, 32);
    geom1.rotateY(-Math.PI * 0.5); // let's see which rotation faces camera
    const mesh1 = new THREE.Mesh(geom1, mJersey);
    mesh1.position.set(-0.55, 0.65, 0);
    g.add(mesh1);

    // Model 2: Back Facing Camera (showing X=256)
    const geom2 = new THREE.CapsuleGeometry(0.35, 0.48, 20, 32);
    geom2.rotateY(Math.PI * 0.5);
    const mesh2 = new THREE.Mesh(geom2, mJersey);
    mesh2.position.set(0.55, 0.65, 0);
    g.add(mesh2);

    scene.add(g);

    renderer.render(scene, camera);
    return renderer.domElement.toDataURL('image/png').split(',')[1];
  });

  fs.writeFileSync(
    '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_front_and_back_test.png',
    Buffer.from(screenshotBase64, 'base64')
  );
  console.log('Saved screen_front_and_back_test.png');
  await browser.close();
})();
