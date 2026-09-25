const puppeteer = require("../404-game-recipe/node_modules/puppeteer");
const fs = require("fs");
const path = require("path");

(async () => {
  const outDir = path.join(__dirname, "docs", "screenshots");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--use-gl=angle"]
  });

  const page = await browser.newPage();
  
  // 1. Desktop 16:9 Showcase
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });
  console.log("Navigating to live build for desktop...");
  await page.goto("http://localhost:4173", { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 2000));

  await page.screenshot({ path: path.join(outDir, "title_screen.png") });
  console.log("Captured title_screen.png");

  // Click start match
  const startBtn = await page.$("#startb");
  if (startBtn) {
    await startBtn.click();
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(outDir, "arena_action.png") });
    console.log("Captured arena_action.png");
  }

  // 2. Mobile 390x844 Phone View
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await mobilePage.goto("http://localhost:4173", { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 1500));
  await mobilePage.screenshot({ path: path.join(outDir, "mobile_title.png") });
  console.log("Captured mobile_title.png");

  const mStart = await mobilePage.$("#startb");
  if (mStart) {
    await mStart.tap();
    await new Promise(r => setTimeout(r, 2000));
    await mobilePage.screenshot({ path: path.join(outDir, "mobile_gameplay.png") });
    console.log("Captured mobile_gameplay.png");
  }

  await browser.close();
  console.log("All screenshots captured successfully!");
})();
