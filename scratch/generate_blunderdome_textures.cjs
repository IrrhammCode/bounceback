const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Generate 1024x1024 High-Gloss Hexagonal Court Texture
  console.log('Generating blunderdome_hex_floor.png (1024x1024)...');
  await page.setViewport({ width: 1024, height: 1024 });
  const floorPng = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Vibrant base teal/cyan gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1024, 1024);
    bgGrad.addColorStop(0, '#06b6d4');   // bright cyan
    bgGrad.addColorStop(0.5, '#0ea5e9'); // electric sky
    bgGrad.addColorStop(1, '#0284c7');   // deep cobalt
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Draw Hexagonal Honeycomb Tiles
    const hexRadius = 40;
    const hexHeight = Math.sqrt(3) * hexRadius;
    const horizDist = hexRadius * 1.5;
    const vertDist = hexHeight;

    function drawHexagon(cx, cy, r, fill, stroke) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
      }
      if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 3.5;
        ctx.stroke();
      }
    }

    let col = 0;
    for (let x = -hexRadius; x < 1024 + hexRadius * 2; x += horizDist, col++) {
      let row = 0;
      for (let y = -hexHeight; y < 1024 + hexHeight * 2; y += vertDist, row++) {
        const cy = (col % 2 === 1) ? y + vertDist / 2 : y;

        // Subtle color variation across tiles
        const hash = Math.sin(col * 12.9898 + row * 78.233) * 43758.5453;
        const rand = hash - Math.floor(hash);

        let tileColor;
        if (rand > 0.85) {
          tileColor = 'rgba(255, 255, 255, 0.18)'; // bright highlight tile
        } else if (rand > 0.70) {
          tileColor = 'rgba(244, 114, 182, 0.22)'; // pastel pink accent
        } else if (rand > 0.50) {
          tileColor = 'rgba(56, 189, 248, 0.15)';  // cyan glow
        } else {
          tileColor = 'rgba(2, 132, 199, 0.12)';   // deeper blue
        }

        drawHexagon(x, cy, hexRadius - 3, tileColor, 'rgba(255, 255, 255, 0.35)');

        // Inner circular grip dot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
        ctx.beginPath();
        ctx.arc(x, cy, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Outer subtle boundary vignettes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 1012, 1012);

    return canvas.toDataURL('image/png').split(',')[1];
  });

  const texDir = path.resolve(__dirname, '../boi-boian/assets/textures');
  if (!fs.existsSync(texDir)) fs.mkdirSync(texDir, { recursive: true });

  fs.writeFileSync(path.join(texDir, 'blunderdome_hex_floor.png'), Buffer.from(floorPng, 'base64'));
  console.log('Saved blunderdome_hex_floor.png');

  // 2. Generate 1024x512 Inflatable Tubular Hazard Chevron Texture
  console.log('Generating blunderdome_inflatable_hazard.png (1024x512)...');
  await page.setViewport({ width: 1024, height: 512 });
  const hazardPng = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base safety yellow
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 0, 1024, 512);

    // Diagonal Hot Pink & Yellow Hazard Chevrons on Top Half (Y = 0 to 256)
    const stripeWidth = 64;
    ctx.fillStyle = '#ec4899'; // Vibrant hot bubblegum pink
    for (let x = -512; x < 1024 + 512; x += stripeWidth * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + stripeWidth, 0);
      ctx.lineTo(x + stripeWidth - 160, 256);
      ctx.lineTo(x - 160, 256);
      ctx.closePath();
      ctx.fill();
    }

    // White vinyl gloss highlight across the middle of the tube
    const glossGrad = ctx.createLinearGradient(0, 0, 0, 256);
    glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    glossGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.65)');
    glossGrad.addColorStop(0.4, 'rgba(255, 255, 255, 0.15)');
    glossGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.15)');
    glossGrad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = glossGrad;
    ctx.fillRect(0, 0, 1024, 256);

    // Lower Half (Y = 256 to 512): Cyan & Yellow Chevrons
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 256, 1024, 256);

    ctx.fillStyle = '#06b6d4'; // Vibrant Electric Cyan
    for (let x = -512; x < 1024 + 512; x += stripeWidth * 2) {
      ctx.beginPath();
      ctx.moveTo(x, 256);
      ctx.lineTo(x + stripeWidth, 256);
      ctx.lineTo(x + stripeWidth - 160, 512);
      ctx.lineTo(x - 160, 512);
      ctx.closePath();
      ctx.fill();
    }

    const glossGrad2 = ctx.createLinearGradient(0, 256, 0, 512);
    glossGrad2.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
    glossGrad2.addColorStop(0.2, 'rgba(255, 255, 255, 0.65)');
    glossGrad2.addColorStop(0.4, 'rgba(255, 255, 255, 0.15)');
    glossGrad2.addColorStop(0.8, 'rgba(0, 0, 0, 0.15)');
    glossGrad2.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = glossGrad2;
    ctx.fillRect(0, 256, 1024, 256);

    // Dividing seam line
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 254, 1024, 4);

    return canvas.toDataURL('image/png').split(',')[1];
  });

  fs.writeFileSync(path.join(texDir, 'blunderdome_inflatable_hazard.png'), Buffer.from(hazardPng, 'base64'));
  console.log('Saved blunderdome_inflatable_hazard.png');

  // 3. Generate 2048x1024 Pastel Sky Panorama Texture
  console.log('Generating blunderdome_sky_gradient.png (2048x1024)...');
  await page.setViewport({ width: 2048, height: 1024 });
  const skyPng = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Vertical pastel gradient from electric cyan to bubblegum pink and soft lilac
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    skyGrad.addColorStop(0, '#0284c7');    // Electric azure sky at zenith
    skyGrad.addColorStop(0.35, '#38bdf8'); // Bright cheerful cyan
    skyGrad.addColorStop(0.65, '#f472b6'); // Soft bubblegum pink
    skyGrad.addColorStop(0.85, '#e879f9'); // Pastel lilac near horizon
    skyGrad.addColorStop(1.0, '#c084fc');  // Soft lavender at horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Warm cheerful sun glow in the upper sky
    const sunGrad = ctx.createRadialGradient(1024, 260, 20, 1024, 260, 480);
    sunGrad.addColorStop(0, 'rgba(255, 254, 240, 0.85)');
    sunGrad.addColorStop(0.25, 'rgba(254, 240, 138, 0.45)');
    sunGrad.addColorStop(0.6, 'rgba(251, 191, 36, 0.15)');
    sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Stylized cartoon puffy clouds painted onto the horizon rim
    function drawPuffyCloud(cx, cy, scale) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      const r = 45 * scale;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.8, cy - r * 0.2, r * 0.85, 0, Math.PI * 2);
      ctx.arc(cx + r * 1.5, cy, r * 0.9, 0, Math.PI * 2);
      ctx.arc(cx - r * 0.7, cy + r * 0.1, r * 0.75, 0, Math.PI * 2);
      ctx.fill();

      // Soft pink cloud underbelly shading
      ctx.fillStyle = 'rgba(244, 114, 182, 0.35)';
      ctx.beginPath();
      ctx.arc(cx, cy + r * 0.3, r * 0.8, 0, Math.PI * 2);
      ctx.arc(cx + r * 0.8, cy + r * 0.2, r * 0.7, 0, Math.PI * 2);
      ctx.arc(cx + r * 1.5, cy + r * 0.3, r * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let x = 80; x < 2048; x += 180) {
      const y = 720 + Math.sin(x * 0.015) * 45;
      const s = 0.8 + Math.cos(x * 0.02) * 0.4;
      drawPuffyCloud(x, y, s);
    }

    return canvas.toDataURL('image/png').split(',')[1];
  });

  fs.writeFileSync(path.join(texDir, 'blunderdome_sky_gradient.png'), Buffer.from(skyPng, 'base64'));
  console.log('Saved blunderdome_sky_gradient.png');

  await browser.close();
  console.log('All Blunderdome textures generated successfully!');
})();
