const puppeteer = require('/Users/irham/Documents/code/Title Screen Design (1)/404-game-recipe/node_modules/puppeteer');
const path = require('path');

const ARTIFACT_DIR = '/Users/irham/.gemini/antigravity-ide/brain/7d531d02-0af7-41a2-80c5-a112e409e7f1';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  await page.goto('http://localhost:8085/__game__/boi-boian/');
  await page.waitForSelector('#startb');
  await page.click('#startb');
  await new Promise(r => setTimeout(r, 1200));

  // Trigger Round 4 Chase phase where Ari calls pass
  await page.evaluate(() => {
    const { setRound, setState, player, ai } = window.__GAME_MAIN__;
    setRound(4);
    setState('chase');
    player.hasBall = false;

    // Trigger Ari's call pass bark
    ai.spawnBark(player, "Woi oper ke sini!", "yellow");
    // Also trigger hunter bark
    ai.spawnBark(ai.hunters[0], "Siap oper Ari!", "yellow");
    // Attempt to trigger 5 more barks immediately to test rate limiting
    ai.spawnBark(ai.teammates[0], "Spam 1", "blue");
    ai.spawnBark(ai.teammates[1], "Spam 2", "blue");
    ai.spawnBark(ai.teammates[2], "Spam 3", "blue");
  });

  await new Promise(r => setTimeout(r, 400));

  const stats = await page.evaluate(() => {
    const bubbles = document.querySelectorAll('.bark-bubble');
    let visible = 0;
    const texts = [];
    bubbles.forEach(b => {
      if (b.style.display !== 'none' && b.style.opacity > 0.1) {
        visible++;
        texts.push(b.textContent.trim());
      }
    });
    return { visible, texts, totalPool: bubbles.length };
  });

  console.log('Bark throttle test result:', stats);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'feature_clean_throttled_barks.png') });
  console.log('Saved feature_clean_throttled_barks.png');

  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
