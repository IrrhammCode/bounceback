const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACT_DIR = '/Users/irham/.gemini/antigravity-ide/brain/7d531d02-0af7-41a2-80c5-a112e409e7f1';

async function run() {
  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  const errors = [];
  page.on('console', msg => {
    const txt = msg.text();
    if (msg.type() === 'error' && !txt.includes('AudioContext') && !txt.includes('WebGL')) {
      errors.push(txt);
      console.log('PAGE ERROR:', txt);
    }
  });

  page.on('pageerror', err => {
    errors.push(err.message);
    console.log('PAGE UNCAUGHT:', err.message);
  });

  console.log('Navigating to http://localhost:8085/__game__/boi-boian/...');
  await page.goto('http://localhost:8085/__game__/boi-boian/', { waitUntil: 'networkidle2', timeout: 20000 });

  await page.waitForFunction('window.__READY__ === true', { timeout: 15000 });

  // Start game and transition to chase
  console.log('Starting match...');
  await page.click('#startb');
  await new Promise(r => setTimeout(r, 600));

  await page.evaluate(() => {
    if (window.__SKIP_CINEMATIC__) window.__SKIP_CINEMATIC__();
  });
  await new Promise(r => setTimeout(r, 600));

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

  // Verify 1 life settings in game state
  console.log('\n--- VERIFYING 1 LIFE CONFIGURATION ---');
  const livesCheck = await page.evaluate(() => {
    const player = window.__PLAYER__;
    const ai = window.__AI__;
    const pips = document.querySelectorAll('#lives .life-pip');

    const teammatesLives = ai.teammates.map(t => ({
      name: t.name,
      lives: t.lives,
      eliminated: t.eliminated
    }));

    return {
      playerLives: player.lives,
      pipCount: pips.length,
      pipActive: pips.length > 0 ? pips[0].classList.contains('active') : false,
      teammatesLives,
    };
  });

  console.log('Lives Check Result:', livesCheck);

  // Take screenshot of HUD showing 1 life pip
  const shotPath = path.join(ARTIFACT_DIR, 'one_life_verified.png');
  await page.screenshot({ path: shotPath });
  console.log('Saved one life screenshot:', shotPath);

  // Test 1-hit elimination: simulate ball tagging a teammate
  console.log('\n--- VERIFYING 1-HIT ELIMINATION ---');
  const hitResult = await page.evaluate(() => {
    const ai = window.__AI__;
    const ball = window.__BALL__;
    const living = ai.teammates.find(t => !t.eliminated);
    if (!living) return { error: 'No living teammate found' };

    const targetName = living.name;
    const livesBefore = living.lives;

    // Simulate ball striking this teammate
    ball.pos = [living.pos[0], 0.7, living.pos[2]];
    ball.vel = [0, 0, -10];
    ball.isLive = true;
    ball.thrownBy = 'hunter';

    ai.checkLiveBallHits();

    return {
      targetName,
      livesBefore,
      livesAfter: living.lives,
      eliminatedAfterHit: living.eliminated,
    };
  });

  console.log('Hit Elimination Result:', hitResult);

  await browser.close();

  const success = (livesCheck.playerLives === 1) &&
                  (livesCheck.pipCount === 1) &&
                  livesCheck.pipActive &&
                  livesCheck.teammatesLives.every(t => t.lives === 1) &&
                  hitResult.eliminatedAfterHit;

  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log('- Player Initial Lives == 1:', livesCheck.playerLives === 1 ? 'PASS' : 'FAIL');
  console.log('- UI Life Pip Count == 1:', livesCheck.pipCount === 1 ? 'PASS' : 'FAIL');
  console.log('- Teammates Initial Lives == 1:', livesCheck.teammatesLives.every(t => t.lives === 1) ? 'PASS' : 'FAIL');
  console.log('- 1-Hit Immediate Elimination:', hitResult.eliminatedAfterHit ? 'PASS' : 'FAIL');
  console.log('- Errors:', errors.length);

  if (!success || errors.length > 0) {
    console.error('VERIFICATION FAILED!');
    process.exit(1);
  } else {
    console.log('1 LIFE VERIFICATION PASSED SUCCESSFULLY!');
  }
}

run().catch(err => {
  console.error('SCRIPT RUNTIME ERROR:', err);
  process.exit(1);
});
