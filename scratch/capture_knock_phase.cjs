const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  console.log('Navigating to http://localhost:8085/__game__/boi-boian/...');
  await page.goto('http://localhost:8085/__game__/boi-boian/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  // Click #startb to launch match
  await page.evaluate(() => {
    const btn = document.getElementById('startb');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 3500));

  // Skip intro to land right in Knock Phase
  await page.evaluate(() => {
    const skip = document.getElementById('skip-intro-btn');
    if (skip && skip.offsetParent !== null) skip.click();
    const playNow = document.getElementById('teams-play-btn');
    if (playNow && playNow.offsetParent !== null) playNow.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // 1. Capture Knock Phase View looking at Pyramid and Stadium
  await page.screenshot({
    path: '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_blunderdome_knock_phase.png'
  });
  console.log('Saved screen_blunderdome_knock_phase.png');

  // 2. Capture Close-up of Pyramid Tower of Candy Blocks on Neon Pedestal
  await page.evaluate(() => {
    if (window.__GAME__ && window.__GAME__.camera) {
      window.__GAME__.camera.position.set(0, 1.25, 3.4);
      window.__GAME__.camera.lookAt(0, 0.65, 0);
      window.__GAME__.camera.fov = 38;
      window.__GAME__.camera.updateProjectionMatrix();
    }
  });
  await new Promise(r => setTimeout(r, 800));

  await page.screenshot({
    path: '/Users/irham/.gemini/antigravity-ide/brain/e65527ea-d074-474a-85a8-f2865059b77c/screen_blunderdome_pyramid_tower.png'
  });
  console.log('Saved screen_blunderdome_pyramid_tower.png');

  await browser.close();
})();
