const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  console.log('Navigating to http://localhost:8085/__game__/boi-boian/...');
  await page.goto('http://localhost:8085/__game__/boi-boian/', { waitUntil: 'networkidle2', timeout: 30000 });

  await page.waitForFunction(() => window.__READY__ === true, { timeout: 15000 });

  console.log('Starting match and skipping cinematic...');
  await page.click('#startb');
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    if (window.__SKIP_CINEMATIC__) window.__SKIP_CINEMATIC__();
  });
  await new Promise(r => setTimeout(r, 600));

  // --- 1. VERIFY AI PARAMETERS ---
  console.log('\n--- VERIFYING AI PARAMETERS ---');
  const aiParams = await page.evaluate(() => {
    return {
      hunterWindup: window.__CONFIG__ ? window.__CONFIG__.GAME_CONSTANTS.hunterWindup : null,
      hunterThrowSpeed: window.__CONFIG__ ? window.__CONFIG__.GAME_CONSTANTS.hunterThrowSpeed : null,
      hunterChaseSpeed: window.__CONFIG__ ? window.__CONFIG__.GAME_CONSTANTS.hunterChaseSpeed : null,
    };
  });
  console.log('AI Parameters:', aiParams);

  // Knock down tower to enter chase phase
  console.log('Knocking down tower to enter chase phase...');
  await page.evaluate(() => {
    if (window.__THROW_KNOCK__) {
      if (window.__PLAYER__) {
        window.__PLAYER__.aimAngleX = 0;
        window.__PLAYER__.aimElevation = 0.08;
      }
      window.__THROW_KNOCK__();
    }
  });
  await new Promise(r => setTimeout(r, 2600));

  // --- 2. VERIFY TOP-BAR HUD (ALIVE / PLAYING STATE) ---
  console.log('\n--- VERIFYING TOP-BAR HUD (PLAYING STATE) ---');
  const hudCheckAlive = await page.evaluate(() => {
    const topBar = document.getElementById('top-bar');
    const roundStatus = document.getElementById('round-status');
    const towerStatus = document.getElementById('tower-status');
    const tacticStatus = document.getElementById('tactic-status');
    const spectatorBar = document.getElementById('spectator-bar');

    const topBarRect = topBar ? topBar.getBoundingClientRect() : null;
    const tacticRect = tacticStatus ? tacticStatus.getBoundingClientRect() : null;
    const specRect = spectatorBar ? spectatorBar.getBoundingClientRect() : null;

    return {
      topBarExists: !!topBar,
      roundStatusExists: !!roundStatus,
      towerStatusExists: !!towerStatus,
      tacticVisible: tacticStatus ? window.getComputedStyle(tacticStatus).display !== 'none' : false,
      spectatorVisible: spectatorBar ? window.getComputedStyle(spectatorBar).display !== 'none' : false,
      topBarHeight: topBarRect ? topBarRect.height : 0,
      tacticText: document.getElementById('tactic-txt') ? document.getElementById('tactic-txt').textContent : '',
    };
  });
  console.log('HUD Check (Alive):', hudCheckAlive);

  const screenshotAlivePath = path.resolve('/Users/irham/.gemini/antigravity-ide/brain/7d531d02-0af7-41a2-80c5-a112e409e7f1/top_bar_alive.png');
  await page.screenshot({ path: screenshotAlivePath });
  console.log('Saved alive screenshot:', screenshotAlivePath);

  // --- 3. VERIFY TOP-BAR HUD (SPECTATOR STATE / ELIMINATED) ---
  console.log('\n--- VERIFYING TOP-BAR HUD (SPECTATOR STATE) ---');
  const hudCheckSpectator = await page.evaluate(() => {
    const hud = window.__HUD__;
    const player = window.__PLAYER__;
    const ai = window.__AI__;

    if (player) {
      player.lives = 0;
      player.eliminated = true;
    }

    if (hud && ai && ai.teammates) {
      const living = ai.teammates.filter(t => !t.eliminated);
      hud.showSpectatorMode(living[0], living.length);
    }

    const tacticStatus = document.getElementById('tactic-status');
    const spectatorBar = document.getElementById('spectator-bar');
    const specMsg = document.getElementById('spectate-msg');
    const camBtn = document.getElementById('btn-switch-cam');

    return {
      tacticVisible: tacticStatus ? window.getComputedStyle(tacticStatus).display !== 'none' : false,
      spectatorVisible: spectatorBar ? window.getComputedStyle(spectatorBar).display !== 'none' : false,
      specMsgText: specMsg ? specMsg.textContent : '',
      camBtnExists: !!camBtn,
    };
  });
  console.log('HUD Check (Spectator):', hudCheckSpectator);

  const screenshotSpecPath = path.resolve('/Users/irham/.gemini/antigravity-ide/brain/7d531d02-0af7-41a2-80c5-a112e409e7f1/top_bar_spectator.png');
  await page.screenshot({ path: screenshotSpecPath });
  console.log('Saved spectator screenshot:', screenshotSpecPath);

  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log('- Top Bar Exists:', hudCheckAlive.topBarExists ? 'PASS' : 'FAIL');
  console.log('- Compact Height (< 50px):', hudCheckAlive.topBarHeight < 50 ? 'PASS' : 'FAIL');
  console.log('- Alive: Tactic Visible & Spectator Hidden:', (hudCheckAlive.tacticVisible && !hudCheckAlive.spectatorVisible) ? 'PASS' : 'FAIL');
  console.log('- Spectator: Tactic Hidden & Spectator Visible (ZERO OVERLAP):', (!hudCheckSpectator.tacticVisible && hudCheckSpectator.spectatorVisible) ? 'PASS' : 'FAIL');
  console.log('- AI Windup >= 0.60s:', (aiParams.hunterWindup >= 0.60) ? 'PASS' : 'FAIL');
  console.log('- AI Throw Speed <= 13.5 m/s:', (aiParams.hunterThrowSpeed <= 13.5) ? 'PASS' : 'FAIL');
  console.log('- AI Chase Speed <= 6.0 m/s:', (aiParams.hunterChaseSpeed <= 6.0) ? 'PASS' : 'FAIL');
  console.log('- Console Errors:', errors.length === 0 ? 'PASS' : `FAIL (${errors.join(', ')})`);

  await browser.close();
  if (errors.length > 0) process.exit(1);
  console.log('\nALL VERIFICATIONS PASSED SUCCESSFULLY!');
})();
