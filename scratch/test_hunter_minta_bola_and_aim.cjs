const puppeteer = require('/Users/irham/Documents/code/Title Screen Design (1)/404-game-recipe/node_modules/puppeteer');
const path = require('path');

const ARTIFACT_DIR = '/Users/irham/.gemini/antigravity-ide/brain/7d531d02-0af7-41a2-80c5-a112e409e7f1';

async function run() {
  console.log('--- Starting Puppeteer Hunter Minta Bola & Aim Test ---');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Round') || text.includes('Pass') || text.includes('PASS') || text.includes('MINTA') || text.includes('error')) {
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

  // Click start button to dismiss start screen
  await page.click('#startb');
  console.log('Clicked #startb');
  await new Promise(r => setTimeout(r, 1200));

  // Set game directly to Round 4 (Yellow Hunter Team) in chase phase
  const setupResult = await page.evaluate(() => {
    const { player, ai, ball, setRound, setState } = window.__GAME_MAIN__;

    // Use setRound(4) which properly triggers role inversion
    setRound(4);
    setState('chase');

    // Position Ari at z=6 facing center
    player.team = 'yellow';
    player.hasBall = false;
    player.eliminated = false;
    player.active = true;
    player.pos = [0, 0, 6];
    player.rotY = Math.PI; // Face North towards pedestal

    // AI hunters
    ai.isReversed = true;
    ai.hunters.forEach((h, idx) => {
      h.active = true;
      h.team = 'yellow';
      h.hasBall = false;
      h.pos = [-5 + idx * 2.8, 0, 4];
    });

    // Hunter 0 gets the ball and stands 7m to Ari's left
    ai.hunters[0].pos = [-5, 0, 6];
    ai.hunters[0].hasBall = true;
    ball.holder = ai.hunters[0];
    ball.isLive = false;
    ball.isPass = false;
    ball.pos = [...ai.hunters[0].pos];
    ball.pos[1] = 0.85;

    // Blue opponents (Nina, Budi, etc.) standing near pedestal
    ai.teammates.forEach((t, idx) => {
      t.active = true;
      t.eliminated = false;
      t.team = 'blue';
      t.pos = [-2 + idx * 2.0, 0, -2 - idx * 1.5];
    });

    return {
      success: true,
      playerTeam: player.team,
      hunter0HasBall: ai.hunters[0].hasBall,
      playerHasBall: player.hasBall,
      bpassText: document.getElementById('bpass')?.textContent
    };
  });

  console.log('Setup Round 4 Yellow Hunter state:', setupResult);
  await new Promise(r => setTimeout(r, 600));

  // Verify HUD: #bpass should say "MINTA BOLA" and have "call-ball-pulse" class
  const passBtnInfo = await page.evaluate(() => {
    const btn = document.getElementById('bpass');
    return {
      visible: btn && btn.style.display !== 'none',
      text: btn ? btn.textContent : null,
      hasPulseClass: btn ? btn.classList.contains('call-ball-pulse') : false
    };
  });
  console.log('Pass Button state before calling:', passBtnInfo);

  // Take screenshot of Minta Bola HUD
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'feature_hunter_minta_bola_ready.png') });
  console.log('Saved feature_hunter_minta_bola_ready.png');

  // TRIGGER MINTA BOLA via click on #bpass or input.callPass
  // TRIGGER MINTA BOLA via KeyQ (or touch mousedown/mouseup)
  console.log('Triggering MINTA BOLA via KeyQ...');
  await page.keyboard.press('KeyQ');

  // Wait a few frames for AI hunter to evaluate and pass ball to Ari
  let caught = false;
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 100));
    const status = await page.evaluate(() => {
      const { player, ball, ai } = window.__GAME_MAIN__;
      return {
        playerHasBall: player.hasBall,
        ballIsPass: ball.isPass,
        ballHolderName: ball.holder ? (ball.holder === player ? 'Ari' : ball.holder.name) : 'none',
        passTargetName: ball.passTarget ? (ball.passTarget === player ? 'Ari' : ball.passTarget.name) : 'none',
        playerCalledPass: ai.playerCalledPass,
        bpassText: document.getElementById('bpass')?.textContent
      };
    });
    if (status.playerHasBall) {
      console.log(`Ari received the pass at frame ${i}! Status:`, status);
      caught = true;
      break;
    }
  }

  // Take screenshot after pass reception
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'feature_hunter_minta_bola_received.png') });
  console.log('Saved feature_hunter_minta_bola_received.png');

  // TEST 2: AIMING & BALLISTIC THROW
  console.log('--- Testing Hold-to-Aim & Ballistic Trajectory ---');
  // Ensure player has ball
  await page.evaluate(() => {
    const { player, ball, ai } = window.__GAME_MAIN__;
    player.hasBall = true;
    ball.holder = player;
    ball.isLive = false;
    ball.isPass = false;

    // Place Nina directly ahead of Ari at (0, 0, -1) (7m in front)
    ai.teammates[0].name = 'Nina';
    ai.teammates[0].pos = [0, 0, -1];
    ai.teammates[0].eliminated = false;
    player.pos = [0, 0, 6];
    player.rotY = Math.PI; // Face North toward Nina
  });

  await new Promise(r => setTimeout(r, 400));

  // Check target lock HUD
  const targetLockState = await page.evaluate(() => {
    const banner = document.getElementById('target-lock-banner');
    const text = document.getElementById('target-lock-text');
    const { player } = window.__GAME_MAIN__;
    return {
      bannerVisible: banner ? banner.classList.contains('on') : false,
      bannerText: text ? text.textContent : '',
      currentTargetName: player.currentTarget ? player.currentTarget.name : null,
      currentTargetDist: player.currentTargetDist,
      aimLaserVisible: player.aimLaser ? player.aimLaser.visible : false,
      targetRingVisible: player.targetRing ? player.targetRing.visible : false
    };
  });
  console.log('Target Lock State while holding ball:', targetLockState);

  // Press and hold KeyF to activate Aim Laser & Windup pose
  console.log('Charging throw (Hold to Aim via KeyF)...');
  await page.keyboard.down('KeyF');
  await new Promise(r => setTimeout(r, 600));

  const aimingState = await page.evaluate(() => {
    const { player } = window.__GAME_MAIN__;
    return {
      aimWindup: player.aimWindup,
      aimLaserVisible: player.aimLaser ? player.aimLaser.visible : false,
      targetRingVisible: player.targetRing ? player.targetRing.visible : false,
      rotY: player.rotY
    };
  });
  console.log('Aiming State while charging:', aimingState);

  // Take screenshot of Hold-to-Aim Laser trajectory & Target Lock
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'feature_hunter_aim_trajectory.png') });
  console.log('Saved feature_hunter_aim_trajectory.png');

  // Release KeyF to launch ballistic projectile
  console.log('Releasing KeyF...');
  await page.keyboard.up('KeyF');
  await new Promise(r => setTimeout(r, 200));

  const throwResult = await page.evaluate(() => {
    const { ball, player } = window.__GAME_MAIN__;
    return {
      ballIsLive: ball.isLive,
      ballThrownBy: ball.thrownBy,
      ballSpeed: Math.hypot(ball.vel[0], ball.vel[1], ball.vel[2]),
      ballVel: ball.vel,
      playerHasBall: player.hasBall
    };
  });
  console.log('Throw Released Result:', throwResult);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'feature_hunter_ballistic_flight.png') });
  console.log('Saved feature_hunter_ballistic_flight.png');

  await browser.close();
  console.log('--- Puppeteer Test Completed Successfully! ---');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
