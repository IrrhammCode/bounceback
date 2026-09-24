const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.error('[Console Error]', msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.toString());
    console.error('[Page Error]', err.toString());
  });

  console.log('Navigating to http://localhost:8085/__game__/boi-boian/...');
  await page.goto('http://localhost:8085/__game__/boi-boian/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2500));

  // 1. Capture Wide Overview of Blunderdome Stadium
  const wideShot = await page.evaluate(async () => {
    if (window.__GAME__ && window.__GAME__.camera && window.__GAME__.renderer && window.__GAME__.scene) {
      const origPos = window.__GAME__.camera.position.clone();
      const origFov = window.__GAME__.camera.fov;

      window.__GAME__.camera.position.set(0, 18, 42);
      window.__GAME__.camera.lookAt(0, 4, 0);
      window.__GAME__.camera.fov = 55;
      window.__GAME__.camera.updateProjectionMatrix();

      window.__GAME__.renderer.render(window.__GAME__.scene, window.__GAME__.camera);
      const dataUrl = window.__GAME__.renderer.domElement.toDataURL('image/png');

      // Restore
      window.__GAME__.camera.position.copy(origPos);
      window.__GAME__.camera.fov = origFov;
      window.__GAME__.camera.updateProjectionMatrix();

      return dataUrl;
    }
    return null;
  });

  if (wideShot) {
    fs.writeFileSync(
      '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_blunderdome_wide_overview.png',
      Buffer.from(wideShot.split(',')[1], 'base64')
    );
    console.log('Saved screen_blunderdome_wide_overview.png');
  }

  // 2. Capture Close-Up of Neon Pedestal & Candy Toy Blocks
  const pyramidShot = await page.evaluate(async () => {
    if (window.__GAME__ && window.__GAME__.camera && window.__GAME__.renderer && window.__GAME__.scene) {
      const origPos = window.__GAME__.camera.position.clone();
      const origFov = window.__GAME__.camera.fov;

      window.__GAME__.camera.position.set(0, 1.8, 3.8);
      window.__GAME__.camera.lookAt(0, 0.65, 0);
      window.__GAME__.camera.fov = 42;
      window.__GAME__.camera.updateProjectionMatrix();

      window.__GAME__.renderer.render(window.__GAME__.scene, window.__GAME__.camera);
      const dataUrl = window.__GAME__.renderer.domElement.toDataURL('image/png');

      window.__GAME__.camera.position.copy(origPos);
      window.__GAME__.camera.fov = origFov;
      window.__GAME__.camera.updateProjectionMatrix();

      return dataUrl;
    }
    return null;
  });

  if (pyramidShot) {
    fs.writeFileSync(
      '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_blunderdome_pyramid_closeup.png',
      Buffer.from(pyramidShot.split(',')[1], 'base64')
    );
    console.log('Saved screen_blunderdome_pyramid_closeup.png');
  }

  // 3. Start Match by clicking #startb
  console.log('Starting match...');
  await page.evaluate(() => {
    const btn = document.getElementById('startb');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3500));

  // Skip any intro
  await page.evaluate(() => {
    const skip = document.getElementById('skip-intro-btn');
    if (skip && skip.offsetParent !== null) skip.click();
    const playNow = document.getElementById('teams-play-btn');
    if (playNow && playNow.offsetParent !== null) playNow.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Knock the pyramid
  console.log('Tapping Space to knock pyramid...');
  await page.keyboard.press('Space');
  await new Promise(r => setTimeout(r, 1200));

  // Run forward in match
  console.log('Running forward in match...');
  await page.keyboard.down('KeyW');
  await page.keyboard.down('ShiftLeft');
  await new Promise(r => setTimeout(r, 2000));
  await page.keyboard.up('KeyW');
  await page.keyboard.up('ShiftLeft');

  // Screenshot Match Action
  await page.screenshot({
    path: '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_blunderdome_match_action.png'
  });
  console.log('Saved screen_blunderdome_match_action.png');

  // Turn camera 180 degrees to view Ari and the stadium grandstands
  await page.evaluate(() => {
    if (window.__GAME__ && window.__GAME__.player) {
      window.__GAME__.player.cameraYaw = Math.PI * 0.95;
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({
    path: '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_blunderdome_ari_and_arena.png'
  });
  console.log('Saved screen_blunderdome_ari_and_arena.png');

  await browser.close();

  console.log('Verification Finished. Console errors count:', errors.length);
  if (errors.length > 0) {
    console.log('Errors:', errors);
  }
})();
