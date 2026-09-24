const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log('Navigating to game...');
  await page.goto('http://localhost:8085/__game__/boi-boian/', { waitUntil: 'networkidle0' });

  await page.waitForSelector('#startb', { visible: true });
  await page.click('#startb');
  console.log('Clicked start');

  console.log('Charging throw with #throwb...');
  const throwBtn = await page.$('#throwb');
  const box = await throwBtn.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await new Promise((r) => setTimeout(r, 500));
  await page.mouse.up();
  console.log('Released throw!');

  // Set teammates directly seated on West dugout bench
  await page.evaluate(() => {
    if (window.__AI__ && window.__AI__.teammates) {
      const tm0 = window.__AI__.teammates[0];
      const tm1 = window.__AI__.teammates[1];
      const tm2 = window.__AI__.teammates[2];
      if (tm0) {
        tm0.eliminated = true;
        tm0.state = 'seated';
        tm0.pos[0] = -12.6;
        tm0.pos[2] = -0.9;
        if (tm0.mesh) {
          tm0.mesh.position.set(-12.6, 0, -0.9);
          tm0.mesh.rotation.y = Math.PI / 2;
        }
      }
      if (tm1) {
        tm1.eliminated = true;
        tm1.state = 'seated';
        tm1.pos[0] = -12.6;
        tm1.pos[2] = 0.0;
        if (tm1.mesh) {
          tm1.mesh.position.set(-12.6, 0, 0.0);
          tm1.mesh.rotation.y = Math.PI / 2;
        }
      }
      if (tm2) {
        tm2.eliminated = true;
        tm2.state = 'seated';
        tm2.pos[0] = -12.6;
        tm2.pos[2] = 0.9;
        if (tm2.mesh) {
          tm2.mesh.position.set(-12.6, 0, 0.9);
          tm2.mesh.rotation.y = Math.PI / 2;
        }
      }
    }
  });

  console.log('Teammates placed on bench, updating sitting pose...');
  await new Promise((r) => setTimeout(r, 1200));

  // Position player closer to the bench for a perfect framing
  await page.evaluate(() => {
    if (window.__AI__ && window.__AI__.player) {
      const p = window.__AI__.player;
      p.pos[0] = -10.5;
      p.pos[2] = 0.0;
      p.rotY = -Math.PI / 2;
      p.cameraYaw = -Math.PI / 2;
      if (p.mesh) {
        p.mesh.position.set(-10.5, 0, 0.0);
        p.mesh.rotation.y = -Math.PI / 2;
      }
    }
  });

  await new Promise((r) => setTimeout(r, 1500));

  const shotPath = path.join(__dirname, '../_jam/out_bench_closeup.png');
  await page.screenshot({ path: shotPath });
  console.log('Saved close-up screenshot to:', shotPath);

  await browser.close();
})();
