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
  console.log('Game initialized and window.__READY__ is true.');

  // Save title screen
  const titleShotPath = path.join(ARTIFACT_DIR, 'tactics_title_screen.png');
  await page.screenshot({ path: titleShotPath });
  console.log('Saved title screenshot:', titleShotPath);

  // Start game and transition to chase
  console.log('Starting game and triggering knock throw...');
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

  console.log('Waiting for tower knockdown and chase phase transition...');
  await new Promise(r => setTimeout(r, 2600));

  // Verify we are in chase phase
  const isChase = await page.evaluate(() => {
    return window.__TOWER__ && window.__TOWER__.isKnocked;
  });
  console.log('Is in chase phase:', isChase);

  // Test 1: Stack shards and verify live ball hitting pedestal DOES NOT disrupt the tower
  console.log('\n--- TEST 1: TOWER PROTECTION (NO DISRUPTION ON BALL HIT) ---');
  await page.evaluate(() => {
    const tower = window.__TOWER__;
    const ball = window.__BALL__;

    // Simulate restacking 4 shards on pedestal
    const scattered = tower.shards.filter(s => s.state === 'scattered');
    for (let i = 0; i < Math.min(4, scattered.length); i++) {
      scattered[i].state = 'carried';
      tower.restackNextShard(scattered[i]);
    }

    // Fire ball directly through pedestal center [0, 0.4, 0]
    ball.pos = [0, 0.4, 0.5];
    ball.prevPos = [0, 0.4, 1.8];
    ball.vel = [0, 0, -12];
    ball.isLive = true;
    ball.thrownBy = 'hunter';
  });

  // Wait 100ms for active requestAnimationFrame tick to process collision
  await new Promise(r => setTimeout(r, 100));

  const testDisruptionResult = await page.evaluate(() => {
    const tower = window.__TOWER__;
    const ball = window.__BALL__;
    const disruptToast = document.getElementById('disrupt-toast');

    return {
      stackedCount: tower.stackedCount,
      protected: (tower.stackedCount >= 4),
      disruptToastPresent: !!disruptToast,
      ballLiveAfterHit: ball.isLive,
    };
  });

  console.log('Test Disruption Result:', testDisruptionResult);

  // Test 2: Verify Blue team smart tactics (Single Stacker & Decoys)
  console.log('\n--- TEST 2: BLUE TEAM TACTICS (1 STACKER & DECOY BAIT) ---');
  const tacticsResult = await page.evaluate(() => {
    const ai = window.__AI__;
    const teammates = ai.teammates.filter(tm => !tm.eliminated);

    const stackers = teammates.filter(tm => tm.role === 'stacker');
    const decoys = teammates.filter(tm => tm.role === 'decoy' || tm.isDecoy);
    const activeBuilders = teammates.filter(tm => tm.isBuilding);

    const teammateDetails = teammates.map(tm => ({
      name: tm.name,
      role: tm.role,
      isDecoy: !!tm.isDecoy,
      isBuilding: !!tm.isBuilding,
      carriedShard: !!tm.carriedShard,
      distToPed: Math.hypot(tm.pos[0], tm.pos[2]).toFixed(2)
    }));

    const tacticPill = document.getElementById('tactic-status');
    const tacticTxt = document.getElementById('tactic-txt') ? document.getElementById('tactic-txt').textContent : '';

    return {
      livingTeammatesCount: teammates.length,
      stackersCount: stackers.length,
      decoysCount: decoys.length,
      activeBuildersCount: activeBuilders.length,
      singleStackerEnforced: stackers.length <= 1 && activeBuilders.length <= 1,
      tacticPillVisible: tacticPill ? tacticPill.style.display !== 'none' : false,
      tacticTxt,
      teammateDetails,
    };
  });

  console.log('Tactics Evaluation Result:', tacticsResult);

  // Take chase phase screenshot showing clean HUD and tactical positions
  const chaseShotPath = path.join(ARTIFACT_DIR, 'tactics_chase_gameplay.png');
  await page.screenshot({ path: chaseShotPath });
  console.log('Saved chase gameplay screenshot:', chaseShotPath);

  // Let game simulate for 2 seconds of dynamic action
  console.log('Running 2 seconds of dynamic gameplay...');
  await new Promise(r => setTimeout(r, 2000));
  const actionShotPath = path.join(ARTIFACT_DIR, 'tactics_action_live.png');
  await page.screenshot({ path: actionShotPath });
  console.log('Saved action live screenshot:', actionShotPath);

  await browser.close();

  const success = testDisruptionResult.protected &&
                  tacticsResult.singleStackerEnforced &&
                  !testDisruptionResult.disruptToastPresent &&
                  !testDisruptionResult.ballLiveAfterHit;

  console.log('\n=== FINAL VERIFICATION SUMMARY ===');
  console.log('- Tower Protected Against Ball Disruption:', testDisruptionResult.protected ? 'PASS' : 'FAIL');
  console.log('- Ball Impact Rebounded (isLive = false):', !testDisruptionResult.ballLiveAfterHit ? 'PASS' : 'FAIL');
  console.log('- Disrupt Toast Permanently Removed:', !testDisruptionResult.disruptToastPresent ? 'PASS' : 'FAIL');
  console.log('- Single Stacker Enforced (1 per satu nyusun):', tacticsResult.singleStackerEnforced ? 'PASS' : 'FAIL');
  console.log('- Active Builders at Pedestal:', tacticsResult.activeBuildersCount, '(max 1 allowed)');
  console.log('- Decoy Teammates Active (Umpan):', tacticsResult.decoysCount > 0 ? 'PASS' : 'FAIL');
  console.log('- Clean Tactical HUD Pill Active:', tacticsResult.tacticPillVisible ? 'PASS' : 'FAIL', `("${tacticsResult.tacticTxt}")`);
  console.log('- Error count:', errors.length);

  if (!success || errors.length > 0) {
    console.error('VERIFICATION FAILED!');
    process.exit(1);
  } else {
    console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  }
}

run().catch(err => {
  console.error('SCRIPT RUNTIME ERROR:', err);
  process.exit(1);
});
