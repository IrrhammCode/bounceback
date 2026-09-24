const puppeteer = require('/Users/irham/Documents/code/Title Screen Design (1)/404-game-recipe/node_modules/puppeteer');
const path = require('path');

const ARTIFACT_DIR = '/Users/irham/.gemini/antigravity-ide/brain/7d531d02-0af7-41a2-80c5-a112e409e7f1';

async function run() {
  console.log('--- Testing Bark Throttle & Anti-Lag Optimization ---');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  await page.goto('http://localhost:8085/__game__/boi-boian/');
  await page.waitForSelector('#startb');
  await page.click('#startb');
  console.log('Started game...');

  // Wait 1.5s
  await new Promise(r => setTimeout(r, 1500));

  // Let bots run and gather shards for 8 seconds, check bark bubble counts
  let maxVisibleBubbles = 0;
  for (let t = 0; t < 16; t++) {
    await new Promise(r => setTimeout(r, 500));
    const stats = await page.evaluate(() => {
      const bubbles = document.querySelectorAll('.bark-bubble');
      let visibleCount = 0;
      bubbles.forEach(b => {
        if (b.style.display !== 'none' && b.style.opacity > 0.05) visibleCount++;
      });
      const barksInAI = window.__AI__ ? window.__AI__.barks.length : 0;
      return { visibleCount, barksInAI, totalInDOM: bubbles.length };
    });
    if (stats.visibleCount > maxVisibleBubbles) {
      maxVisibleBubbles = stats.visibleCount;
    }
    console.log(`[T+${(t*0.5).toFixed(1)}s] Visible bubbles: ${stats.visibleCount} (Total pool in DOM: ${stats.totalInDOM}, in AI queue: ${stats.barksInAI})`);
  }

  console.log(`Peak visible bubbles at any single moment: ${maxVisibleBubbles}`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'feature_clean_no_lag_barks.png') });
  console.log('Saved feature_clean_no_lag_barks.png');

  await browser.close();
  console.log('--- Test Completed Successfully! ---');
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
