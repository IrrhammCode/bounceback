const puppeteer = require('/Users/irham/Documents/code/Title Screen Design (1)/404-game-recipe/node_modules/puppeteer');
const path = require('path');

const ARTIFACT_DIR = '/Users/irham/.gemini/antigravity-ide/brain/7d531d02-0af7-41a2-80c5-a112e409e7f1';

async function run() {
  console.log('--- Starting Puppeteer Over-The-Shoulder (OTS) Aim Zoom Test ---');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Round') || text.includes('Pass') || text.includes('AIM') || text.includes('error')) {
      console.log(`[Browser Console] ${msg.type()}: ${text}`);
    }
  });
  page.on('pageerror', err => {
    console.error(`[Page Error]`, err);
  });

  await page.goto('http://localhost:8085/__game__/boi-boian/');
  console.log('Navigated to game page.');

  await page.waitForSelector('#startb');
  console.log('Start button is present.');

  await page.waitForFunction(() => typeof window.__GAME_MAIN__ !== 'undefined', { timeout: 10000 });
  console.log('Game initialized, window.__GAME_MAIN__ is ready.');

  // Click start button
  await page.click('#startb');
  console.log('Clicked #startb');
  await new Promise(r => setTimeout(r, 1200));

  // Set game directly to Round 4 (Yellow Hunter Team) in chase phase
  const setupResult = await page.evaluate(() => {
    const { player, ai, ball, setRound, setState } = window.__GAME_MAIN__;

    setRound(4);
    setState('chase');

    // Position Ari at z=6 facing North
    player.team = 'yellow';
    player.hasBall = true;
    player.eliminated = false;
    player.active = true;
    player.pos = [0, 0, 6];
    player.rotY = Math.PI; // Face North toward pedestal

    ball.holder = player;
    ball.isLive = false;
    ball.isPass = false;

    // Position Nina at (0, 0, -1) (7m ahead)
    ai.teammates[0].name = 'Nina';
    ai.teammates[0].pos = [0, 0, -1];
    ai.teammates[0].eliminated = false;

    return {
      success: true,
      playerTeam: player.team,
      playerHasBall: player.hasBall,
      aimZoom: player.aimZoom,
      fov: player.camera.fov
    };
  });

  console.log('Setup Round 4 Yellow Hunter state:', setupResult);
  await new Promise(r => setTimeout(r, 600));

  // Capture Screenshot 1: Normal 3rd Person Running Camera
  const normalCamInfo = await page.evaluate(() => {
    const { player } = window.__GAME_MAIN__;
    return {
      camPos: [Number(player.camera.position.x.toFixed(2)), Number(player.camera.position.y.toFixed(2)), Number(player.camera.position.z.toFixed(2))],
      fov: Math.round(player.camera.fov),
      aimZoom: Number(player.aimZoom.toFixed(2)),
      reticleVisible: document.getElementById('aim-reticle')?.classList.contains('active')
    };
  });
  console.log('Normal TPS Camera State:', normalCamInfo);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'feature_tps_normal_camera.png') });
  console.log('Saved feature_tps_normal_camera.png');

  // STEP 2: HOLD KEYF TO ENGAGE DYNAMIC OVER-THE-SHOULDER AIM ZOOM
  console.log('--- Pressing and holding KeyF (Charging Throw / Aim Windup) ---');
  await page.keyboard.down('KeyF');
  await new Promise(r => setTimeout(r, 800));

  const otsCamInfo = await page.evaluate(() => {
    const { player } = window.__GAME_MAIN__;
    const reticle = document.getElementById('aim-reticle');
    const distEl = document.getElementById('reticle-dist');
    return {
      camPos: [Number(player.camera.position.x.toFixed(2)), Number(player.camera.position.y.toFixed(2)), Number(player.camera.position.z.toFixed(2))],
      fov: Math.round(player.camera.fov),
      aimZoom: Number(player.aimZoom.toFixed(2)),
      aimLaserVisible: player.aimLaser ? player.aimLaser.visible : false,
      reticleActive: reticle ? reticle.classList.contains('active') : false,
      reticleLocked: reticle ? reticle.classList.contains('locked') : false,
      reticleDist: distEl ? distEl.textContent : '',
      currentTargetName: player.currentTarget ? player.currentTarget.name : null
    };
  });
  console.log('Over-The-Shoulder Aim State:', otsCamInfo);

  // Capture Screenshot 2: Over-The-Shoulder Camera with Reticle & Laser
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'feature_ots_aim_camera.png') });
  console.log('Saved feature_ots_aim_camera.png');

  // STEP 3: RELEASE KEYF TO LAUNCH AND RETURN TO NORMAL TPS CAMERA
  console.log('--- Releasing KeyF (Throw Release) ---');
  await page.keyboard.up('KeyF');
  await new Promise(r => setTimeout(r, 600));

  const afterReleaseInfo = await page.evaluate(() => {
    const { player, ball } = window.__GAME_MAIN__;
    return {
      camPos: [Number(player.camera.position.x.toFixed(2)), Number(player.camera.position.y.toFixed(2)), Number(player.camera.position.z.toFixed(2))],
      fov: Math.round(player.camera.fov),
      aimZoom: Number(player.aimZoom.toFixed(2)),
      ballIsLive: ball.isLive,
      ballSpeed: Number(Math.hypot(ball.vel[0], ball.vel[1], ball.vel[2]).toFixed(2)),
      reticleActive: document.getElementById('aim-reticle')?.classList.contains('active')
    };
  });
  console.log('After Throw Release Camera State:', afterReleaseInfo);

  await browser.close();
  console.log('--- Puppeteer OTS Aim Zoom Test Completed Successfully! ---');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
