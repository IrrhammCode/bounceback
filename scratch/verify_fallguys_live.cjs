const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.error('[Browser Error]', msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.toString());
    console.error('[Page Error]', err.toString());
  });

  console.log('Navigating to http://localhost:8085/__game__/boi-boian/...');
  await page.goto('http://localhost:8085/__game__/boi-boian/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  // Click #startb button to launch game
  console.log('Clicking #startb to launch match...');
  await page.evaluate(() => {
    const btn = document.getElementById('startb');
    if (btn) btn.click();
  });
  // Wait for intro transition
  await new Promise(r => setTimeout(r, 3500));

  // Skip any intro overlay if active
  await page.evaluate(() => {
    const skip = document.getElementById('skip-intro-btn');
    if (skip && skip.offsetParent !== null) skip.click();
    const playNow = document.getElementById('teams-play-btn');
    if (playNow && playNow.offsetParent !== null) playNow.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Capture Third Person Gameplay View
  await page.screenshot({
    path: '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_fallguys_gameplay_behind.png'
  });
  console.log('Saved screen_fallguys_gameplay_behind.png');

  // Turn camera to front of Ari
  await page.evaluate(() => {
    if (window.__GAME__ && window.__GAME__.player) {
      window.__GAME__.player.cameraYaw = 0.0;
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({
    path: '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_fallguys_ari_front.png'
  });
  console.log('Saved screen_fallguys_ari_front.png');

  // Close-up Front Portrait of Ari
  await page.evaluate(() => {
    if (window.__GAME__ && window.__GAME__.camera && window.__GAME__.player) {
      window.__CAMERA_OVERRIDE__ = true;
      const p = window.__GAME__.player.pos;
      window.__GAME__.camera.position.set(p[0], 0.72, p[2] + 1.8);
      window.__GAME__.camera.lookAt(p[0], 0.72, p[2]);
      window.__GAME__.camera.fov = 42;
      window.__GAME__.camera.updateProjectionMatrix();
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({
    path: '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_fallguys_ari_portrait_live.png'
  });
  console.log('Saved screen_fallguys_ari_portrait_live.png');

  // Focus Camera on Hunter Budi
  await page.evaluate(() => {
    if (window.__GAME__ && window.__GAME__.ai && window.__GAME__.ai.hunters.length > 0) {
      const hunter = window.__GAME__.ai.hunters[0];
      const hp = hunter.pos || [hunter.mesh.position.x, hunter.mesh.position.y, hunter.mesh.position.z];
      window.__GAME__.camera.position.set(hp[0], 0.70, hp[2] + 2.0);
      window.__GAME__.camera.lookAt(hp[0], 0.65, hp[2]);
      window.__GAME__.camera.fov = 44;
      window.__GAME__.camera.updateProjectionMatrix();
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({
    path: '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_fallguys_hunter_budi_live.png'
  });
  console.log('Saved screen_fallguys_hunter_budi_live.png');

  // Focus Camera on Teammate (Nina)
  await page.evaluate(() => {
    if (window.__GAME__ && window.__GAME__.ai && window.__GAME__.ai.teammates.length > 0) {
      const teammate = window.__GAME__.ai.teammates[0];
      const tp = teammate.pos || [teammate.mesh.position.x, teammate.mesh.position.y, teammate.mesh.position.z];
      window.__GAME__.camera.position.set(tp[0], 0.70, tp[2] + 2.0);
      window.__GAME__.camera.lookAt(tp[0], 0.65, tp[2]);
      window.__GAME__.camera.fov = 44;
      window.__GAME__.camera.updateProjectionMatrix();
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({
    path: '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_fallguys_teammate_live.png'
  });
  console.log('Saved screen_fallguys_teammate_live.png');

  await browser.close();

  console.log('Total Console Errors:', errors.length);
  if (errors.length > 0) {
    console.log('Errors:', errors);
  }
})();
