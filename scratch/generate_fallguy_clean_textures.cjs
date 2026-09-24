const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1024, height: 1024 });

  // 1. Generate Ari's Garuda Elite #7 Texture (Front at X=768, Back at X=256)
  const ariPngBase64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base Blue Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    bgGrad.addColorStop(0, '#1d4ed8');
    bgGrad.addColorStop(0.35, '#2563eb');
    bgGrad.addColorStop(0.65, '#1e40af');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle Fall Guys Halftone Dotted Pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    const dotSpacing = 32;
    for (let y = 0; y < 1024; y += dotSpacing) {
      for (let x = 0; x < 1024; x += dotSpacing) {
        ctx.beginPath();
        const offsetX = (Math.floor(y / dotSpacing) % 2 === 0) ? dotSpacing / 2 : 0;
        ctx.arc(x + offsetX, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Lower Athletic Shorts Section (Y = 700 to 1024)
    const shortsGrad = ctx.createLinearGradient(0, 700, 0, 1024);
    shortsGrad.addColorStop(0, '#0f172a');
    shortsGrad.addColorStop(1, '#020617');
    ctx.fillStyle = shortsGrad;
    ctx.fillRect(0, 700, 1024, 324);

    // Waistband Trim at Y = 690
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, 688, 1024, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 702, 1024, 6);

    // Flank Racing Stripes (X = 0, X = 512, X = 1024)
    const drawSideStripes = (centerX) => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillRect(centerX - 35, 100, 70, 924);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(centerX - 12, 100, 24, 924);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(centerX - 3, 100, 6, 924);
    };
    drawSideStripes(0);
    drawSideStripes(512);
    drawSideStripes(1024);

    // ==========================================
    // FRONT CHEST GRAPHIC (Centered at X = 768)
    // ==========================================
    const frontX = 768;

    // Stylized Garuda Wings Emblem (Y = 530)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(frontX - 65, 515);
    ctx.lineTo(frontX, 535);
    ctx.lineTo(frontX + 65, 515);
    ctx.lineTo(frontX + 55, 528);
    ctx.lineTo(frontX, 548);
    ctx.lineTo(frontX - 55, 528);
    ctx.closePath();
    ctx.fill();

    // Red wing accent
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(frontX - 42, 525);
    ctx.lineTo(frontX, 538);
    ctx.lineTo(frontX + 42, 525);
    ctx.lineTo(frontX + 34, 534);
    ctx.lineTo(frontX, 546);
    ctx.lineTo(frontX - 34, 534);
    ctx.closePath();
    ctx.fill();

    // Gold Star in center
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(frontX, 532, 6, 0, Math.PI * 2);
    ctx.fill();

    // Bold Athletic #7
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.font = '900 110px "Arial Black", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('7', frontX + 3, 608);

    ctx.fillStyle = '#ffffff';
    ctx.fillText('7', frontX, 605);

    // "GARUDA" Ribbon Badge
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(frontX - 75, 655, 150, 26, 13);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 14px sans-serif';
    ctx.fillText('GARUDA', frontX, 668);

    // ==========================================
    // BACK GRAPHIC (Centered at X = 256)
    // ==========================================
    const backX = 256;

    // "ARI" Player Name
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.font = '900 32px sans-serif';
    ctx.fillText('ARI', backX + 2, 527);

    ctx.fillStyle = '#ffffff';
    ctx.fillText('ARI', backX, 525);

    // Bold Varsity #7 on Back
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.font = '900 110px "Arial Black", Impact, sans-serif';
    ctx.fillText('7', backX + 3, 608);

    ctx.fillStyle = '#ffffff';
    ctx.fillText('7', backX, 605);

    // SDN 01 Badge
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(backX - 55, 656, 110, 24, 12);
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '900 12px sans-serif';
    ctx.fillText('SDN 01', backX, 668);

    return canvas.toDataURL('image/png').split(',')[1];
  });

  fs.writeFileSync(
    '/Users/irham/Documents/code/Title Screen Design (1)/boi-boian/assets/textures/jersey_fallguy_blue_garuda.png',
    Buffer.from(ariPngBase64, 'base64')
  );
  console.log('Saved refined jersey_fallguy_blue_garuda.png');

  // 2. Generate Budi's Harimau Nusantara #10 Texture (Front at X=768, Back at X=256)
  const budiPngBase64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base Warm Amber Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    bgGrad.addColorStop(0, '#f59e0b');
    bgGrad.addColorStop(0.35, '#fbbf24');
    bgGrad.addColorStop(0.65, '#d97706');
    bgGrad.addColorStop(1, '#0f766e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Dynamic Tiger Claws on Flanks
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    const drawTigerClaw = (cx, cy, scaleX, scaleY) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.bezierCurveTo(cx + 60 * scaleX, cy - 15 * scaleY, cx + 110 * scaleX, cy - 8 * scaleY, cx + 140 * scaleX, cy);
      ctx.bezierCurveTo(cx + 100 * scaleX, cy + 20 * scaleY, cx + 50 * scaleX, cy + 15 * scaleY, cx, cy);
      ctx.fill();
    };

    for (let s = 0; s < 4; s++) {
      drawTigerClaw(40, 200 + s * 100, 1, 1);
      drawTigerClaw(470, 200 + s * 100, -1, 1);
      drawTigerClaw(550, 200 + s * 100, 1, 1);
      drawTigerClaw(980, 200 + s * 100, -1, 1);
    }

    // Lower Teal Shorts Section (Y = 700 to 1024)
    const shortsGrad = ctx.createLinearGradient(0, 700, 0, 1024);
    shortsGrad.addColorStop(0, '#0f766e');
    shortsGrad.addColorStop(1, '#042f2e');
    ctx.fillStyle = shortsGrad;
    ctx.fillRect(0, 700, 1024, 324);

    // Waistband Trim at Y = 690
    ctx.fillStyle = '#0d9488';
    ctx.fillRect(0, 688, 1024, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 702, 1024, 6);

    // Flank Racing Stripes (X = 0, X = 512, X = 1024)
    const drawSideStripes = (centerX) => {
      ctx.fillStyle = 'rgba(19, 78, 74, 0.7)';
      ctx.fillRect(centerX - 35, 100, 70, 924);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(centerX - 12, 100, 24, 924);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(centerX - 3, 100, 6, 924);
    };
    drawSideStripes(0);
    drawSideStripes(512);
    drawSideStripes(1024);

    // ==========================================
    // FRONT CHEST GRAPHIC (Centered at X = 768)
    // ==========================================
    const frontX = 768;

    // Stylized Harimau Tiger Chevron (Y = 530)
    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.moveTo(frontX - 65, 515);
    ctx.lineTo(frontX, 535);
    ctx.lineTo(frontX + 65, 515);
    ctx.lineTo(frontX + 55, 528);
    ctx.lineTo(frontX, 548);
    ctx.lineTo(frontX - 55, 528);
    ctx.closePath();
    ctx.fill();

    // White chevron accent
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(frontX - 42, 525);
    ctx.lineTo(frontX, 538);
    ctx.lineTo(frontX + 42, 525);
    ctx.lineTo(frontX + 34, 534);
    ctx.lineTo(frontX, 546);
    ctx.lineTo(frontX - 34, 534);
    ctx.closePath();
    ctx.fill();

    // Teal Star in center
    ctx.fillStyle = '#14b8a6';
    ctx.beginPath();
    ctx.arc(frontX, 532, 6, 0, Math.PI * 2);
    ctx.fill();

    // Bold Athletic #10
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.font = '900 100px "Arial Black", Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('10', frontX + 3, 608);

    ctx.fillStyle = '#ffffff';
    ctx.fillText('10', frontX, 605);

    // "HARIMAU" Ribbon Badge
    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.roundRect(frontX - 75, 655, 150, 26, 13);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('HARIMAU', frontX, 668);

    // ==========================================
    // BACK GRAPHIC (Centered at X = 256)
    // ==========================================
    const backX = 256;

    // "BUDI" Player Name
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.font = '900 32px sans-serif';
    ctx.fillText('BUDI', backX + 2, 527);

    ctx.fillStyle = '#ffffff';
    ctx.fillText('BUDI', backX, 525);

    // Bold Varsity #10 on Back
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.font = '900 100px "Arial Black", Impact, sans-serif';
    ctx.fillText('10', backX + 3, 608);

    ctx.fillStyle = '#ffffff';
    ctx.fillText('10', backX, 605);

    // SDN 02 Badge
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(backX - 55, 656, 110, 24, 12);
    ctx.fill();

    ctx.fillStyle = '#2dd4bf';
    ctx.font = '900 12px sans-serif';
    ctx.fillText('SDN 02', backX, 668);

    return canvas.toDataURL('image/png').split(',')[1];
  });

  fs.writeFileSync(
    '/Users/irham/Documents/code/Title Screen Design (1)/boi-boian/assets/textures/jersey_fallguy_yellow_harimau.png',
    Buffer.from(budiPngBase64, 'base64')
  );
  console.log('Saved refined jersey_fallguy_yellow_harimau.png');

  await browser.close();
  console.log('All refined Fall Guys textures generated successfully!');
})();
