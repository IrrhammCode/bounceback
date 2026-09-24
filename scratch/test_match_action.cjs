const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  console.log('Navigating to http://localhost:8085/__game__/boi-boian/...');
  await page.goto('http://localhost:8085/__game__/boi-boian/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  // Click #startb to launch match
  await page.evaluate(() => {
    const btn = document.getElementById('startb');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  // Now we are in Knock Phase! Tap Space or click to throw the ball at the pyramid
  console.log('Tapping Space to knock the pyramid...');
  await page.keyboard.press('Space');
  await new Promise(r => setTimeout(r, 2500)); // wait for ball throw & tower collapse

  // Now the match is in Active Chase / Rebuild phase!
  console.log('Match active! Pressing W to run forward...');
  await page.keyboard.down('KeyW');
  await page.keyboard.down('ShiftLeft'); // sprint!
  await new Promise(r => setTimeout(r, 1200));

  // Capture Third-Person Running View
  await page.screenshot({
    path: '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_fallguys_sprint_behind.png'
  });
  console.log('Saved screen_fallguys_sprint_behind.png');

  await page.keyboard.up('KeyW');
  await page.keyboard.up('ShiftLeft');
  await new Promise(r => setTimeout(r, 500));

  // Orbit camera around Ari to front view
  await page.evaluate(() => {
    if (window.__GAME__ && window.__GAME__.player) {
      window.__GAME__.player.cameraYaw += Math.PI; // turn 180 deg to face front of Ari
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({
    path: '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_fallguys_ari_front_match.png'
  });
  console.log('Saved screen_fallguys_ari_front_match.png');

  // Closeup on Ari Front Faceplate and Chest #7
  await page.evaluate(() => {
    if (window.__GAME__ && window.__GAME__.camera && window.__GAME__.player) {
      window.__CAMERA_OVERRIDE__ = true;
      const p = window.__GAME__.player.pos;
      // Position camera right in front of Ari's chest & face
      window.__GAME__.camera.position.set(p[0], 0.65, p[2] - 1.8);
      window.__GAME__.camera.lookAt(p[0], 0.60, p[2]);
      window.__GAME__.camera.fov = 40;
      window.__GAME__.camera.updateProjectionMatrix();
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({
    path: '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_fallguys_ari_closeup.png'
  });
  console.log('Saved screen_fallguys_ari_closeup.png');

  // Focus on Hunter Budi in the match
  await page.evaluate(() => {
    if (window.__GAME__ && window.__GAME__.camera && window.__GAME__.ai && window.__GAME__.ai.hunters.length > 0) {
      const h = window.__GAME__.ai.hunters[0];
      const p = [h.mesh.position.x, h.mesh.position.y, h.mesh.position.z];
      window.__GAME__.camera.position.set(p[0], 0.68, p[2] + 2.0);
      window.__GAME__.camera.lookAt(p[0], 0.62, p[2]);
      window.__GAME__.camera.fov = 42;
      window.__GAME__.camera.updateProjectionMatrix();
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({
    path: '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_fallguys_hunter_budi_match.png'
  });
  console.log('Saved screen_fallguys_hunter_budi_match.png');

  // Full arena view showing multiple Fall Guy kids running
  await page.evaluate(() => {
    if (window.__GAME__ && window.__GAME__.camera) {
      window.__GAME__.camera.position.set(0, 7.5, 14.5);
      window.__GAME__.camera.lookAt(0, 0.4, 0);
      window.__GAME__.camera.fov = 55;
      window.__GAME__.camera.updateProjectionMatrix();
    }
  });
  await new Promise(r => setTimeout(r, 1000));

  await page.screenshot({
    path: '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_fallguys_arena_battle.png'
  });
  console.log('Saved screen_fallguys_arena_battle.png');

  await browser.close();
  console.log('All action screenshots captured successfully!');
})();
