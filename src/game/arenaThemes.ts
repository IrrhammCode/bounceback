/**
 * BOUNCEBACK! — 5 Kado Biomes & Painted Cartoon Silhouette Skies
 *
 * For Tripothon: "Build a world as a Gift"
 * Provides lightweight 2D procedural sky textures with hand-drawn cartoon silhouettes,
 * theme pitch floors, and toybox-restyled physical gimmicks:
 * - Kado 1: Kamar Masa Kecil (Bedroom Sunrise with window silhouette, toys, paper planes)
 * - Kado 2: Kota Mainan (Cardboard Toy City Sunset with train trestle, crane, glowing windows)
 * - Kado 3: Layangan Sore (Backyard Kite Skies with flying kites, rolling hills, tree silhouettes)
 * - Kado 4: Pasar Malam (Night Carnival with glowing Ferris wheel, circus tents, festoon bulbs)
 * - Kado 5: Atap Penuh Bintang (Rooftop Starlight with crescent moon, gift constellation, rooftop cat)
 */
import * as THREE from "three";
import { getArenaHeight } from "./arenaHeight";

function makeCanvasTex(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
  scaleFactor: number = 2
): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = w * scaleFactor;
  c.height = h * scaleFactor;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.scale(scaleFactor, scaleFactor);
  draw(ctx);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

// ─── 1. PROCEDURAL 360° PAINTED SILHOUETTE SKYBOX TEXTURES ──────────────────
export function createSkyTexture(roundNumber: number): THREE.CanvasTexture {
  return makeCanvasTex(2048, 1024, (ctx) => {
    if (roundNumber === 1) {
      // ════════════════════════════════════════════════════════════════════════
      // KADO #1: KAMAR MASA KECIL (Bedroom Sunrise)
      // ════════════════════════════════════════════════════════════════════════
      const g = ctx.createLinearGradient(0, 0, 0, 1024);
      g.addColorStop(0.00, "#5b9bd5");
      g.addColorStop(0.35, "#8ec5ff");
      g.addColorStop(0.70, "#bae6fd");
      g.addColorStop(0.90, "#fff4d6");
      g.addColorStop(1.00, "#fde68a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 2048, 1024);

      // Warm Morning Sunburst through window
      const sunGrad = ctx.createRadialGradient(1024, 300, 15, 1024, 300, 320);
      sunGrad.addColorStop(0.0, "rgba(255, 255, 255, 1.0)");
      sunGrad.addColorStop(0.2, "rgba(254, 240, 138, 0.9)");
      sunGrad.addColorStop(0.5, "rgba(253, 224, 71, 0.35)");
      sunGrad.addColorStop(1.0, "rgba(253, 224, 71, 0.0)");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(1024, 300, 320, 0, Math.PI * 2);
      ctx.fill();

      // Soft puffy morning clouds
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      for (let i = 0; i < 18; i++) {
        const cx = (i / 18) * 2048 + 40;
        const cy = 460 + ((i * 37) % 70);
        const cr = 65 + ((i * 17) % 45);
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.arc(cx + cr * 0.7, cy - cr * 0.3, cr * 0.8, 0, Math.PI * 2);
        ctx.arc(cx - cr * 0.7, cy - cr * 0.2, cr * 0.75, 0, Math.PI * 2);
        ctx.fill();
      }

      // Whimsical Paper Airplanes drifting in the morning sky
      const planes = [
        { x: 380, y: 220, scale: 0.9, rot: 0.2 },
        { x: 720, y: 340, scale: 0.7, rot: -0.15 },
        { x: 1350, y: 260, scale: 0.85, rot: 0.1 },
        { x: 1680, y: 380, scale: 0.65, rot: -0.25 },
      ];
      for (const pl of planes) {
        ctx.save();
        ctx.translate(pl.x, pl.y);
        ctx.rotate(pl.rot);
        ctx.scale(pl.scale, pl.scale);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(35, 0);
        ctx.lineTo(-25, -15);
        ctx.lineTo(-10, 0);
        ctx.lineTo(-25, 15);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(203, 213, 225, 0.8)";
        ctx.beginPath();
        ctx.moveTo(35, 0);
        ctx.lineTo(-10, 0);
        ctx.lineTo(-25, 15);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Bedroom Frame & Toy Silhouette Layer
      ctx.fillStyle = "rgba(27, 38, 59, 0.85)";

      // Left desk lamp & toy shelf
      ctx.fillRect(0, 700, 240, 324);
      // Desk lamp neck & bell head
      ctx.beginPath();
      ctx.arc(130, 640, 36, 0, Math.PI * 2);
      ctx.rect(120, 640, 20, 70);
      ctx.fill();
      // Glowing warm bulb
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(130, 645, 16, 0, Math.PI * 2);
      ctx.fill();

      // Teddy bear ears on left shelf
      ctx.fillStyle = "rgba(27, 38, 59, 0.85)";
      ctx.beginPath();
      ctx.arc(70, 680, 28, 0, Math.PI * 2);
      ctx.arc(50, 656, 12, 0, Math.PI * 2);
      ctx.arc(90, 656, 12, 0, Math.PI * 2);
      ctx.fill();

      // Right toy shelf & blocks
      ctx.fillRect(1808, 680, 240, 344);
      // Toy robot antenna & head
      ctx.fillRect(1870, 620, 48, 48);
      ctx.fillRect(1890, 595, 8, 25);
      ctx.beginPath();
      ctx.arc(1894, 592, 7, 0, Math.PI * 2);
      ctx.fill();

      // Grand Window Sill Muntin Cross Silhouettes across horizon
      for (const wx of [512, 1024, 1536]) {
        ctx.fillRect(wx - 8, 0, 16, 1024);
      }
      ctx.fillRect(0, 720, 2048, 24);

    } else if (roundNumber === 2) {
      // ════════════════════════════════════════════════════════════════════════
      // KADO #2: KOTA MAINAN (Cardboard Toy City Sunset)
      // ════════════════════════════════════════════════════════════════════════
      const g = ctx.createLinearGradient(0, 0, 0, 1024);
      g.addColorStop(0.00, "#581c87");
      g.addColorStop(0.25, "#831843");
      g.addColorStop(0.55, "#e63946");
      g.addColorStop(0.80, "#f4a261");
      g.addColorStop(0.95, "#ffd60a");
      g.addColorStop(1.00, "#fff176");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 2048, 1024);

      // Giant Sinking Golden Toy Sun
      const sunGrad = ctx.createRadialGradient(1024, 620, 25, 1024, 620, 320);
      sunGrad.addColorStop(0.0, "rgba(255, 241, 118, 1.0)");
      sunGrad.addColorStop(0.35, "rgba(251, 191, 36, 0.85)");
      sunGrad.addColorStop(0.70, "rgba(230, 57, 70, 0.3)");
      sunGrad.addColorStop(1.0, "rgba(230, 57, 70, 0.0)");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(1024, 620, 320, 0, Math.PI * 2);
      ctx.fill();

      // Distant Cardboard Silhouette Towers (Soft crimson)
      ctx.fillStyle = "rgba(74, 14, 23, 0.55)";
      const dHeights = [280, 340, 220, 390, 260, 320, 420, 290, 350, 240, 380, 270, 330, 300];
      for (let i = 0; i < dHeights.length; i++) {
        const tw = 155;
        const tx = i * tw - 20;
        const th = dHeights[i];
        ctx.fillRect(tx, 720 - th, tw - 12, th + 304);
        // Triangle rooftop on select towers
        if (i % 3 === 0) {
          ctx.beginPath();
          ctx.moveTo(tx, 720 - th);
          ctx.lineTo(tx + (tw - 12) / 2, 720 - th - 45);
          ctx.lineTo(tx + tw - 12, 720 - th);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Foreground Cardboard Toy City & Trestle Bridge
      ctx.fillStyle = "rgba(43, 9, 16, 0.92)";

      // City blocks with cutout glowing windows
      const fgTowers = [
        { x: 40, w: 140, h: 260 },
        { x: 210, w: 180, h: 320 },
        { x: 420, w: 130, h: 220 },
        { x: 1280, w: 160, h: 290 },
        { x: 1470, w: 190, h: 340 },
        { x: 1690, w: 150, h: 250 },
        { x: 1870, w: 140, h: 310 },
      ];

      for (const tw of fgTowers) {
        ctx.fillRect(tw.x, 740 - tw.h, tw.w, tw.h + 284);
        // Cutout glowing windows
        ctx.fillStyle = "#ffd60a";
        for (let wy = 740 - tw.h + 25; wy < 700; wy += 38) {
          for (let wx = tw.x + 18; wx < tw.x + tw.w - 24; wx += 32) {
            ctx.fillRect(wx, wy, 18, 22);
          }
        }
        ctx.fillStyle = "rgba(43, 9, 16, 0.92)";
      }

      // Toy Train Trestle Bridge across the Center (x = 580 to 1250)
      ctx.fillRect(580, 710, 680, 18);
      for (let bx = 620; bx <= 1220; bx += 80) {
        ctx.fillRect(bx, 728, 14, 296);
      }

      // Toy Train chugging on the bridge (x = 880)
      ctx.fillRect(860, 655, 110, 55); // Train Engine
      ctx.fillRect(975, 670, 75, 40);  // Coal Car
      ctx.fillRect(875, 620, 24, 35);  // Chimney
      ctx.fillRect(930, 635, 35, 20);  // Cabin Roof
      // Circular Steam Puffs from Train Chimney
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      for (let sp = 0; sp < 5; sp++) {
        const sx = 875 - sp * 42;
        const sy = 600 - sp * 24;
        const sr = 12 + sp * 7;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Construction Toy Crane on Right
      ctx.fillStyle = "rgba(43, 9, 16, 0.92)";
      ctx.fillRect(1430, 360, 16, 380); // Crane Mast
      ctx.fillRect(1350, 370, 200, 12);  // Crane Jib
      ctx.fillRect(1436, 330, 6, 40);
      // Crane Cable & Dangling Toy Gift Box
      ctx.strokeStyle = "rgba(43, 9, 16, 0.92)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(1510, 382);
      ctx.lineTo(1510, 480);
      ctx.stroke();
      ctx.fillRect(1495, 480, 30, 30); // Dangling Gift Box

    } else if (roundNumber === 3) {
      // ════════════════════════════════════════════════════════════════════════
      // KADO #3: LAYANGAN SORE (Backyard Kite Skies)
      // ════════════════════════════════════════════════════════════════════════
      const g = ctx.createLinearGradient(0, 0, 0, 1024);
      g.addColorStop(0.00, "#d97706");
      g.addColorStop(0.35, "#ff9f43");
      g.addColorStop(0.70, "#fca5a5");
      g.addColorStop(0.88, "#fed7aa");
      g.addColorStop(0.96, "#86efac");
      g.addColorStop(1.00, "#6bcb77");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 2048, 1024);

      // Golden Afternoon Sun with soft radial haze
      const sunGrad = ctx.createRadialGradient(480, 280, 15, 480, 280, 300);
      sunGrad.addColorStop(0.0, "rgba(255, 255, 255, 0.95)");
      sunGrad.addColorStop(0.25, "rgba(254, 215, 170, 0.8)");
      sunGrad.addColorStop(0.65, "rgba(255, 159, 67, 0.25)");
      sunGrad.addColorStop(1.0, "rgba(255, 159, 67, 0.0)");
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(480, 280, 300, 0, Math.PI * 2);
      ctx.fill();

      // Flock of flying birds heading home in "V" formation
      const birds = [
        { x: 320, y: 160 }, { x: 350, y: 175 }, { x: 380, y: 190 },
        { x: 300, y: 180 }, { x: 280, y: 200 }
      ];
      ctx.strokeStyle = "rgba(40, 20, 10, 0.65)";
      ctx.lineWidth = 2.5;
      for (const b of birds) {
        ctx.beginPath();
        ctx.arc(b.x - 7, b.y, 8, Math.PI, 0);
        ctx.arc(b.x + 7, b.y, 8, Math.PI, 0);
        ctx.stroke();
      }

      // Colorful Traditional Kites (Layangan Aduan / Layangan Hias)
      const kites = [
        { x: 620, y: 220, size: 48, rot: 0.25, color: "#ef4444", tailLen: 120 },
        { x: 880, y: 150, size: 56, rot: -0.35, color: "#3b82f6", tailLen: 160 },
        { x: 1220, y: 260, size: 42, rot: 0.15, color: "#facc15", tailLen: 100 },
        { x: 1540, y: 180, size: 52, rot: -0.22, color: "#ec4899", tailLen: 140 },
        { x: 1780, y: 290, size: 38, rot: 0.40, color: "#10b981", tailLen: 90 },
      ];

      for (const kt of kites) {
        ctx.save();
        ctx.translate(kt.x, kt.y);
        ctx.rotate(kt.rot);

        // Kite diamond body
        ctx.fillStyle = kt.color;
        ctx.beginPath();
        ctx.moveTo(0, -kt.size);
        ctx.lineTo(kt.size * 0.7, 0);
        ctx.lineTo(0, kt.size);
        ctx.lineTo(-kt.size * 0.7, 0);
        ctx.closePath();
        ctx.fill();

        // Cross bamboo spars
        ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -kt.size);
        ctx.lineTo(0, kt.size);
        ctx.moveTo(-kt.size * 0.7, 0);
        ctx.lineTo(kt.size * 0.7, 0);
        ctx.stroke();

        // Fluttering ribbon tail
        ctx.strokeStyle = kt.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, kt.size);
        for (let t = 0; t < kt.tailLen; t += 15) {
          const tx = Math.sin(t * 0.2) * 16;
          ctx.lineTo(tx, kt.size + t);
        }
        ctx.stroke();

        // White tether string trailing down to the earth
        ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-150, 300, -300, 720);
        ctx.stroke();

        ctx.restore();
      }

      // Rolling Backyard Hills & Picket Fence Silhouette
      ctx.fillStyle = "rgba(19, 42, 19, 0.9)";

      // Hills
      ctx.beginPath();
      ctx.moveTo(0, 720);
      ctx.quadraticCurveTo(500, 640, 1024, 700);
      ctx.quadraticCurveTo(1500, 760, 2048, 680);
      ctx.lineTo(2048, 1024);
      ctx.lineTo(0, 1024);
      ctx.closePath();
      ctx.fill();

      // Tree canopies on left & right margins
      for (const tx of [80, 220, 1850, 1980]) {
        ctx.beginPath();
        ctx.arc(tx, 610, 85, 0, Math.PI * 2);
        ctx.arc(tx + 40, 580, 75, 0, Math.PI * 2);
        ctx.arc(tx - 40, 590, 70, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(tx - 12, 650, 24, 80);
      }

      // Kids flying kites on a hill silhouette
      ctx.beginPath();
      ctx.arc(780, 650, 14, 0, Math.PI * 2); // Head
      ctx.fillRect(772, 664, 16, 28);        // Torso
      ctx.fill();

    } else if (roundNumber === 4) {
      // ════════════════════════════════════════════════════════════════════════
      // KADO #4: PASAR MALAM (Night Carnival & Bianglala)
      // ════════════════════════════════════════════════════════════════════════
      const g = ctx.createLinearGradient(0, 0, 0, 1024);
      g.addColorStop(0.00, "#180424");
      g.addColorStop(0.30, "#3b0764");
      g.addColorStop(0.65, "#831843");
      g.addColorStop(0.85, "#be185d");
      g.addColorStop(0.95, "#e0218a");
      g.addColorStop(1.00, "#ffc93c");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 2048, 1024);

      // Distant carnival lighting glow
      const ambGrad = ctx.createRadialGradient(1550, 660, 40, 1550, 660, 380);
      ambGrad.addColorStop(0.0, "rgba(255, 201, 60, 0.4)");
      ambGrad.addColorStop(0.5, "rgba(224, 33, 138, 0.2)");
      ambGrad.addColorStop(1.0, "rgba(0, 0, 0, 0.0)");
      ctx.fillStyle = ambGrad;
      ctx.beginPath();
      ctx.arc(1550, 660, 380, 0, Math.PI * 2);
      ctx.fill();

      // Deep Carnival Midnight Silhouette Layer
      ctx.fillStyle = "rgba(20, 5, 27, 0.94)";

      // Big-Top Circus Tents with waving pennant flags
      const tents = [
        { x: 340, w: 280, h: 200 },
        { x: 700, w: 220, h: 160 },
      ];
      for (const t of tents) {
        ctx.beginPath();
        ctx.moveTo(t.x, 720);
        ctx.lineTo(t.x + t.w / 2, 720 - t.h);
        ctx.lineTo(t.x + t.w, 720);
        ctx.closePath();
        ctx.fill();
        // Flag pole & pennant flag
        ctx.fillRect(t.x + t.w / 2 - 2, 720 - t.h - 30, 4, 30);
        ctx.fillStyle = "#ffd166";
        ctx.beginPath();
        ctx.moveTo(t.x + t.w / 2 + 2, 720 - t.h - 30);
        ctx.lineTo(t.x + t.w / 2 + 28, 720 - t.h - 20);
        ctx.lineTo(t.x + t.w / 2 + 2, 720 - t.h - 10);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(20, 5, 27, 0.94)";
      }

      // Giant Ferris Wheel (Bianglala) Silhouette on Right (hub at 1550, 650)
      const fX = 1550;
      const fY = 650;
      const fR = 210;

      // Wheel A-frame support tower
      ctx.beginPath();
      ctx.moveTo(fX, fY);
      ctx.lineTo(fX - 90, 720 + 304);
      ctx.lineTo(fX + 90, 720 + 304);
      ctx.closePath();
      ctx.fill();

      // Outer rings & spokes
      ctx.strokeStyle = "rgba(20, 5, 27, 0.94)";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(fX, fY, fR, 0, Math.PI * 2);
      ctx.arc(fX, fY, fR - 35, 0, Math.PI * 2);
      ctx.stroke();

      const spokeCount = 12;
      const bulbColors = ["#ffd166", "#00f0ff", "#ff2a85", "#38ef7d"];

      for (let s = 0; s < spokeCount; s++) {
        const ang = (s / spokeCount) * Math.PI * 2;
        const px = fX + Math.cos(ang) * fR;
        const py = fY + Math.sin(ang) * fR;

        // Spoke line
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(fX, fY);
        ctx.lineTo(px, py);
        ctx.stroke();

        // Gondola cabin box
        ctx.fillRect(px - 14, py, 28, 22);

        // Glowing Carnival Bulb Dots along outer rim
        ctx.fillStyle = bulbColors[s % bulbColors.length];
        ctx.beginPath();
        ctx.arc(px, py - 4, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(20, 5, 27, 0.94)";
      }

      // Drooping Festoon String Lights across horizon (Catenary curves)
      const stringPoles = [0, 480, 960, 1440, 1920, 2048];
      ctx.strokeStyle = "rgba(20, 5, 27, 0.9)";
      ctx.lineWidth = 3;

      for (let p = 0; p < stringPoles.length - 1; p++) {
        const x1 = stringPoles[p];
        const x2 = stringPoles[p + 1];
        const midX = (x1 + x2) / 2;
        ctx.beginPath();
        ctx.moveTo(x1, 580);
        ctx.quadraticCurveTo(midX, 640, x2, 580);
        ctx.stroke();

        // Hanging glowing bulb dots
        for (let bx = x1 + 40; bx < x2; bx += 55) {
          const t = (bx - x1) / (x2 - x1);
          const by = 580 * (1 - t) * (1 - t) + 640 * 2 * (1 - t) * t + 580 * t * t;
          ctx.fillStyle = bulbColors[(Math.floor(bx / 50)) % bulbColors.length];
          ctx.beginPath();
          ctx.arc(bx, by + 5, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

    } else {
      // ════════════════════════════════════════════════════════════════════════
      // KADO #5: ATAP PENUH BINTANG (Midnight Rooftop Stars)
      // ════════════════════════════════════════════════════════════════════════
      const g = ctx.createLinearGradient(0, 0, 0, 1024);
      g.addColorStop(0.00, "#070a14");
      g.addColorStop(0.30, "#0f122c");
      g.addColorStop(0.65, "#1b1f4b");
      g.addColorStop(0.88, "#2e1a47");
      g.addColorStop(1.00, "#3e206d");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 2048, 1024);

      // Glowing Crescent Moon on Right
      const mX = 1600;
      const mY = 240;
      const moonHalo = ctx.createRadialGradient(mX, mY, 20, mX, mY, 180);
      moonHalo.addColorStop(0.0, "rgba(255, 209, 102, 0.45)");
      moonHalo.addColorStop(0.5, "rgba(255, 209, 102, 0.15)");
      moonHalo.addColorStop(1.0, "rgba(255, 209, 102, 0.0)");
      ctx.fillStyle = moonHalo;
      ctx.beginPath();
      ctx.arc(mX, mY, 180, 0, Math.PI * 2);
      ctx.fill();

      // Moon Crescent
      ctx.fillStyle = "#fff4d6";
      ctx.beginPath();
      ctx.arc(mX, mY, 65, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0f122c";
      ctx.beginPath();
      ctx.arc(mX - 22, mY - 14, 58, 0, Math.PI * 2);
      ctx.fill();

      // Sparkling Starfield (300+ stars with 4-point sparkle stars)
      ctx.fillStyle = "#ffffff";
      for (let s = 0; s < 320; s++) {
        const sx = ((s * 137.5) % 2048);
        const sy = ((s * 93.1) % 700);
        const sr = (s % 5 === 0) ? 2.8 : (s % 3 === 0) ? 1.8 : 1.0;

        if (s % 20 === 0) {
          // 4-point sparkling star
          ctx.fillStyle = (s % 40 === 0) ? "#ffd166" : "#7dd3fc";
          ctx.beginPath();
          ctx.moveTo(sx, sy - sr * 3);
          ctx.lineTo(sx + sr, sy);
          ctx.lineTo(sx, sy + sr * 3);
          ctx.lineTo(sx - sr, sy);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#ffffff";
        } else {
          ctx.beginPath();
          ctx.arc(sx, sy, sr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Constellation of the "Gift Box" in Starlight (left sky: x=500, y=280)
      const constStars = [
        { x: 440, y: 220 }, { x: 560, y: 220 },
        { x: 560, y: 320 }, { x: 440, y: 320 },
        { x: 500, y: 175 }, // Bow knot
        { x: 460, y: 155 }, { x: 540, y: 155 } // Bow loops
      ];
      ctx.strokeStyle = "rgba(255, 209, 102, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      // Box perimeter
      ctx.moveTo(440, 220); ctx.lineTo(560, 220);
      ctx.lineTo(560, 320); ctx.lineTo(440, 320); ctx.closePath();
      // Ribbon cross
      ctx.moveTo(500, 220); ctx.lineTo(500, 320);
      ctx.moveTo(440, 270); ctx.lineTo(560, 270);
      // Bow
      ctx.moveTo(500, 220); ctx.lineTo(500, 175);
      ctx.lineTo(460, 155); ctx.lineTo(500, 175);
      ctx.lineTo(540, 155);
      ctx.stroke();

      // Shooting Star Streak
      ctx.strokeStyle = "rgba(255, 240, 180, 0.85)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(920, 120);
      ctx.lineTo(1120, 220);
      ctx.stroke();

      // Nostalgic Neighborhood Rooftop Silhouette across bottom
      ctx.fillStyle = "rgba(8, 9, 20, 0.95)";
      ctx.beginPath();
      ctx.moveTo(0, 720);

      // Rooftop ridges (genteng rumah)
      const roofs = [
        { x: 0, w: 280, peakY: 630 },
        { x: 260, w: 340, peakY: 600 },
        { x: 580, w: 300, peakY: 640 },
        { x: 860, w: 380, peakY: 590 },
        { x: 1220, w: 320, peakY: 620 },
        { x: 1520, w: 360, peakY: 610 },
        { x: 1860, w: 220, peakY: 635 },
      ];

      for (const rf of roofs) {
        ctx.lineTo(rf.x, 700);
        ctx.lineTo(rf.x + rf.w / 2, rf.peakY);
        ctx.lineTo(rf.x + rf.w, 700);
      }
      ctx.lineTo(2048, 700);
      ctx.lineTo(2048, 1024);
      ctx.lineTo(0, 1024);
      ctx.closePath();
      ctx.fill();

      // Chimneys & TV antennae silhouettes
      for (const cx of [340, 740, 1380, 1760]) {
        ctx.fillRect(cx, 570, 22, 60);
      }
      // Antenna cross
      ctx.fillRect(940, 520, 4, 80);
      ctx.fillRect(920, 545, 44, 3);
      ctx.fillRect(926, 560, 32, 3);

      // Sweet Cat sitting on Rooftop gazing at the stars
      const catX = 640;
      const catY = 620;
      ctx.beginPath();
      ctx.arc(catX, catY, 14, 0, Math.PI * 2); // Body
      ctx.arc(catX, catY - 14, 9, 0, Math.PI * 2); // Head
      ctx.moveTo(catX - 6, catY - 21); ctx.lineTo(catX - 2, catY - 27); ctx.lineTo(catX, catY - 21); // Left ear
      ctx.moveTo(catX + 6, catY - 21); ctx.lineTo(catX + 2, catY - 27); ctx.lineTo(catX, catY - 21); // Right ear
      ctx.fill();
      // Curled Tail
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "rgba(8, 9, 20, 0.95)";
      ctx.beginPath();
      ctx.arc(catX + 16, catY + 4, 10, Math.PI * 0.5, Math.PI * 1.8);
      ctx.stroke();
    }
  });
}

// ─── 2. PROCEDURAL ARENA FLOOR TEXTURES ─────────────────────────────────────
export function createFloorTexture(roundNumber: number): THREE.CanvasTexture {
  return makeCanvasTex(2048, 4096, (ctx) => {
    const W = 2048;
    const H = 4096;

    if (roundNumber === 1) {
      // Round 1: Playroom Morning Soft Court
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0.0, "#083344");
      g.addColorStop(0.15, "#0d9488");
      g.addColorStop(0.5, "#14b8a6");
      g.addColorStop(0.85, "#0d9488");
      g.addColorStop(1.0, "#083344");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Playful alternating floor stripes
      const stripeH = 128;
      for (let y = 0; y < H; y += stripeH * 2) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.fillRect(0, y, W, stripeH);
      }

      // Crisp White Pitch Lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      ctx.lineWidth = 24;
      ctx.strokeRect(120, 120, W - 240, H - 240);

      // Center Field Circle & Star
      ctx.beginPath();
      ctx.moveTo(120, H / 2);
      ctx.lineTo(W - 120, H / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 340, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 50, 0, Math.PI * 2);
      ctx.fill();

    } else if (roundNumber === 2) {
      // Round 2: Toy City Cardboard & Express Tracks
      ctx.fillStyle = "#1e1b18";
      ctx.fillRect(0, 0, W, H);

      // Cyan & Coral Outer Speed Lanes
      ctx.fillStyle = "rgba(6, 182, 212, 0.22)";
      ctx.fillRect(100, 120, 240, H - 240);
      ctx.fillStyle = "rgba(244, 63, 94, 0.22)";
      ctx.fillRect(W - 340, 120, 240, H - 240);

      // Glowing boundary rails
      ctx.strokeStyle = "#ffd60a";
      ctx.lineWidth = 18;
      ctx.strokeRect(120, 120, W - 240, H - 240);

      // Railroad Ties / Sleepers along Sideline Conveyor Lanes
      ctx.fillStyle = "#78350f";
      for (let y = 140; y < H - 140; y += 70) {
        ctx.fillRect(110, y, 220, 18);
        ctx.fillRect(W - 330, y, 220, 18);
      }

      // Center toy city cross
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 340, 0, Math.PI * 2);
      ctx.stroke();

    } else if (roundNumber === 3) {
      // Round 3: Layangan Sore Backyard Slick Grass Court
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0.0, "#14361b");
      g.addColorStop(0.3, "#1b4d24");
      g.addColorStop(0.5, "#246b32");
      g.addColorStop(0.7, "#1b4d24");
      g.addColorStop(1.0, "#14361b");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Wet slick dew glisten
      ctx.fillStyle = "rgba(255, 209, 102, 0.08)";
      for (let p = 0; p < 20; p++) {
        const px = 300 + ((p * 277) % (W - 600));
        const py = 400 + ((p * 491) % (H - 800));
        ctx.beginPath();
        ctx.ellipse(px, py, 150, 80, p * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 20;
      ctx.strokeRect(120, 120, W - 240, H - 240);

      // Center Kite Emblem
      ctx.fillStyle = "#ff9f43";
      ctx.beginPath();
      ctx.moveTo(W / 2, H / 2 - 120);
      ctx.lineTo(W / 2 + 90, H / 2);
      ctx.lineTo(W / 2, H / 2 + 120);
      ctx.lineTo(W / 2 - 90, H / 2);
      ctx.closePath();
      ctx.fill();

    } else if (roundNumber === 4) {
      // Round 4: Pasar Malam Carnival Parquet & Glowing Neon Ring
      ctx.fillStyle = "#1a0826";
      ctx.fillRect(0, 0, W, H);

      // Parquet checkerboard
      const pSize = 128;
      for (let y = 120; y < H - 120; y += pSize) {
        for (let x = 120; x < W - 120; x += pSize) {
          if ((Math.floor(x / pSize) + Math.floor(y / pSize)) % 2 === 0) {
            ctx.fillStyle = "rgba(224, 33, 138, 0.08)";
            ctx.fillRect(x, y, pSize, pSize);
          }
        }
      }

      // Neon Magenta & Bulb Yellow Borders
      ctx.strokeStyle = "#e0218a";
      ctx.lineWidth = 24;
      ctx.strokeRect(120, 120, W - 240, H - 240);

      ctx.strokeStyle = "#ffc93c";
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 360, 0, Math.PI * 2);
      ctx.stroke();

    } else {
      // Round 5: Rooftop Starlight Obsidian & Gold Ribbon Floor
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0.0, "#080a14");
      g.addColorStop(0.3, "#0d1024");
      g.addColorStop(0.5, "#151838");
      g.addColorStop(0.7, "#0d1024");
      g.addColorStop(1.0, "#080a14");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Gold Satin Pitch Lines
      ctx.strokeStyle = "#ffd166";
      ctx.lineWidth = 22;
      ctx.strokeRect(120, 120, W - 240, H - 240);

      // Center Grand Starlight Rosette
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 380, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 60, 0, Math.PI * 2);
      ctx.fill();
    }
  }, 1);
}

// ─── 3. ROUND-SPECIFIC PHYSICAL OBSTACLE GROUPS ─────────────────────────────

/**
 * Map 1: Kamar Masa Kecil — Giant Alphabet Toy Blocks & Pop-Up Scissor Fists
 */
export function createPlaygroundObstacles(root: THREE.Group) {
  const group = new THREE.Group();
  group.name = "Map1_PlaygroundObstacles";
  group.visible = false;

  const blockDefs = [
    { x: -8.5, z: -7.0, char: "A", color: 0x38bdf8, border: "#0284c7" },
    { x: 8.5, z: -7.0, char: "B", color: 0xf43f5e, border: "#be123c" },
    { x: -8.5, z: 7.0, char: "C", color: 0xfacc15, border: "#b45309" },
    { x: 8.5, z: 7.0, char: "1", color: 0xa855f7, border: "#7e22ce" },
  ];

  const blocks: THREE.Mesh[] = [];
  for (const bd of blockDefs) {
    const bY = getArenaHeight(bd.x, bd.z, 1);
    const blockTex = makeCanvasTex(512, 512, (ctx) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = bd.border;
      ctx.lineWidth = 28;
      ctx.strokeRect(16, 16, 480, 480);
      ctx.font = "900 300px Outfit, sans-serif";
      ctx.fillStyle = bd.border;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(bd.char, 256, 256);
    });

    const blockMat = new THREE.MeshStandardMaterial({
      map: blockTex,
      roughness: 0.35,
      metalness: 0.1,
    });
    const blockMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.4), blockMat);
    blockMesh.position.set(bd.x, bY + 1.2, bd.z);
    blockMesh.castShadow = true;
    blockMesh.receiveShadow = true;
    group.add(blockMesh);
    blocks.push(blockMesh);
  }

  // 2 Sideline Accordion Pop-Up Scissor Fists
  const puncherGroups: { group: THREE.Group; side: number }[] = [];
  for (const side of [-1, 1]) {
    const pGroup = new THREE.Group();
    const floorH = getArenaHeight(side * 14.0, 0, 1);
    pGroup.position.set(side * 14.0, floorH, 0);
    pGroup.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;

    const baseBox = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 1.8, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 })
    );
    baseBox.position.y = 0.9;
    pGroup.add(baseBox);

    const gloveMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 16, 16),
      new THREE.MeshStandardMaterial({ color: side > 0 ? 0xf43f5e : 0x06b6d4, roughness: 0.25 })
    );
    gloveMesh.scale.set(1.0, 1.2, 1.4);
    gloveMesh.position.set(0, 0.9, 1.0);
    pGroup.add(gloveMesh);

    group.add(pGroup);
    puncherGroups.push({ group: pGroup, side });
  }

  root.add(group);

  return {
    group,
    update: (_dt: number, time: number) => {
      for (let i = 0; i < blocks.length; i++) {
        blocks[i].position.y = getArenaHeight(blockDefs[i].x, blockDefs[i].z, 1) + 1.2 + Math.sin(time * 3 + i) * 0.06;
      }
      for (const pg of puncherGroups) {
        const ext = Math.max(0, Math.sin(time * 2.5 + pg.side * 1.5)) * 2.4;
        pg.group.children[1].position.z = 1.0 + ext;
      }
    },
  };
}

/**
 * Map 2: Kota Mainan — Narrow Chasm Bridge Conveyors & Center Whirlygig Propeller
 */
export function createSpeedwayBelts(root: THREE.Group) {
  const group = new THREE.Group();
  group.name = "Map2_SpeedwayObstacles";
  group.visible = false;

  const trackBedMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.3 });
  const railMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.8 });
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });

  const beltLength = 18; // spans across the 17m narrow bridge corridor
  const beltWidth = 2.4;
  const beltGeo = new THREE.BoxGeometry(beltWidth, 0.1, beltLength);

  // Dual contra-directional belts along the narrow bridge
  const conveyorBelts = [
    { x: -2.4, zMin: -9, zMax: 9, width: 2.4, directionZ: -1, speed: 18 },
    { x: 2.4, zMin: -9, zMax: 9, width: 2.4, directionZ: 1, speed: 18 },
  ];

  for (const b of conveyorBelts) {
    const bY = getArenaHeight(b.x, 0, 2);
    const belt = new THREE.Mesh(beltGeo, trackBedMat);
    belt.position.set(b.x, bY + 0.04, 0);
    belt.receiveShadow = true;
    group.add(belt);

    for (const rx of [-1.0, 1.0]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, beltLength), railMat);
      rail.position.set(b.x + rx, bY + 0.1, 0);
      group.add(rail);
    }

    for (let z = -7.5; z <= 7.5; z += 3.0) {
      const chevronGeo = new THREE.ConeGeometry(0.45, 0.9, 3);
      chevronGeo.rotateX(b.directionZ > 0 ? Math.PI : 0);
      const chevron = new THREE.Mesh(chevronGeo, arrowMat);
      chevron.rotation.x = -Math.PI / 2;
      chevron.position.set(b.x, bY + 0.12, z);
      group.add(chevron);
    }
  }

  // Center 3-Arm Whirlygig Rotary Propeller right at (0, 0) on the bridge!
  const propGroup = new THREE.Group();
  const propY = getArenaHeight(0, 0, 2);
  propGroup.position.set(0, propY, 0);

  const hubMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.8, 1.2, 16),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.8 })
  );
  hubMesh.position.y = 0.6;
  propGroup.add(hubMesh);

  const bladeGroup = new THREE.Group();
  bladeGroup.position.y = 0.85;

  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.3,
    metalness: 0.6,
  });

  const armLength = 3.6;
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const armMesh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, armLength), bladeMat);
    armMesh.position.set(Math.sin(angle) * (armLength * 0.5), 0, Math.cos(angle) * (armLength * 0.5));
    armMesh.rotation.y = angle;
    bladeGroup.add(armMesh);
  }
  propGroup.add(bladeGroup);
  group.add(propGroup);

  // Side Chasm Laser Warning Fences along x = +/-5.6m
  const fenceMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
  for (const side of [-1, 1]) {
    const fenceMesh = new THREE.Mesh(new THREE.PlaneGeometry(17, 0.8), fenceMat);
    fenceMesh.position.set(side * 5.6, propY + 0.4, 0);
    fenceMesh.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
    group.add(fenceMesh);
  }

  root.add(group);

  const sweeperArmDef = {
    center: new THREE.Vector3(0, propY + 0.85, 0),
    angle: 0,
    armLength: 3.6,
    armRadius: 0.45,
    rotSpeed: 2.2,
  };

  return {
    group,
    conveyorBelts,
    sweeperArms: [sweeperArmDef],
    update: (dt: number, time: number) => {
      arrowMat.color.setHex((Math.sin(time * 6) > 0) ? 0xfacc15 : 0x00f0ff);
      bladeGroup.rotation.y += sweeperArmDef.rotSpeed * dt;
      sweeperArmDef.angle = bladeGroup.rotation.y;
    },
  };
}

/**
 * Map 3: Layangan Sore — Grand Octagon Hilltop & Monumental 4-Blade Sky Windmill
 */
export function createStormlandFeatures(root: THREE.Group) {
  const group = new THREE.Group();
  group.name = "Map3_StormlandFeatures";
  group.visible = false;

  const hillH = getArenaHeight(0, 0, 3);

  // Monumental 4-Blade Sky Meadow Windmill at (0, 0)
  const windmillGroup = new THREE.Group();
  windmillGroup.position.set(0, hillH, 0);

  const postMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 1.1, 1.4, 16),
    new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
  );
  postMesh.position.y = 0.7;
  windmillGroup.add(postMesh);

  const sailsGroup = new THREE.Group();
  sailsGroup.position.y = 0.95;

  const bladeColors = [0xef4444, 0x06b6d4, 0xfacc15, 0x22c55e];
  const sailLength = 5.2;

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const sailMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.35, sailLength),
      new THREE.MeshStandardMaterial({ color: bladeColors[i], roughness: 0.3 })
    );
    sailMesh.position.set(Math.sin(angle) * (sailLength * 0.5), 0, Math.cos(angle) * (sailLength * 0.5));
    sailMesh.rotation.y = angle;
    sailsGroup.add(sailMesh);
  }
  windmillGroup.add(sailsGroup);
  group.add(windmillGroup);

  // 4 Giant Bouncy Mushroom Trampolines
  const mushroomConfigs = [
    { x: -10.5, z: 0 },
    { x: 10.5, z: 0 },
    { x: 0, z: -17.0 },
    { x: 0, z: 17.0 },
  ];

  const mushroomMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
  const stalkMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.6 });

  for (const mc of mushroomConfigs) {
    const mY = getArenaHeight(mc.x, mc.z, 3);
    const mGroup = new THREE.Group();
    mGroup.position.set(mc.x, mY, mc.z);

    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 0.6, 12), stalkMat);
    stalk.position.y = 0.3;
    mGroup.add(stalk);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), mushroomMat);
    cap.position.y = 0.55;
    mGroup.add(cap);

    group.add(mGroup);
  }

  // Warm Golden Sunset Sunbeam Flash
  const sunsetFlashLight = new THREE.DirectionalLight(0xffedd5, 0.0);
  sunsetFlashLight.position.set(0, 50, 0);
  group.add(sunsetFlashLight);

  root.add(group);

  let nextFlashTime = 6.0;
  let flashDuration = 0;

  const sweeperArmDef = {
    center: new THREE.Vector3(0, hillH + 0.95, 0),
    angle: 0,
    armLength: 5.2,
    armRadius: 0.5,
    rotSpeed: 1.45,
  };

  return {
    group,
    sweeperArms: [sweeperArmDef],
    jumpPads: mushroomConfigs.map(c => ({ x: c.x, z: c.z, radius: 1.8, impulseY: 22, impulseZ: 0 })),
    triggerLightning: () => {
      sunsetFlashLight.intensity = 4.2;
      flashDuration = 0.25;
    },
    update: (dt: number, _time: number) => {
      sailsGroup.rotation.y += sweeperArmDef.rotSpeed * dt;
      sweeperArmDef.angle = sailsGroup.rotation.y;

      if (flashDuration > 0) {
        flashDuration -= dt;
        sunsetFlashLight.intensity = (flashDuration / 0.25) * 4.2;
        if (flashDuration <= 0) sunsetFlashLight.intensity = 0;
      } else {
        nextFlashTime -= dt;
        if (nextFlashTime <= 0) {
          nextFlashTime = 7.0 + Math.random() * 8.0;
          flashDuration = 0.25;
          sunsetFlashLight.intensity = 4.2;
        }
      }
    },
  };
}

/**
 * Map 4: Pasar Malam — Banked Pinball Velodrome & 4 Active Motorized Flippers
 */
export function createPinballJumpPads(root: THREE.Group) {
  const group = new THREE.Group();
  group.name = "Map4_PinballObstacles";
  group.visible = false;

  const flipperMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.7 });
  const flipperRubberMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });

  // 4 Active Motorized Pinball Flippers
  const flipperConfigs = [
    { x: -4.5, z: -17.5, restAngle: -0.4, activeAngle: 0.6, team: 0, dir: 1 },
    { x: 4.5, z: -17.5, restAngle: 0.4, activeAngle: -0.6, team: 0, dir: -1 },
    { x: -4.5, z: 17.5, restAngle: Math.PI + 0.4, activeAngle: Math.PI - 0.6, team: 1, dir: -1 },
    { x: 4.5, z: 17.5, restAngle: Math.PI - 0.4, activeAngle: Math.PI + 0.6, team: 1, dir: 1 },
  ];

  const flippers: {
    pivot: THREE.Vector3;
    angle: number;
    length: number;
    thickness: number;
    restAngle: number;
    activeAngle: number;
    isFlipping: boolean;
    flipTimer: number;
    mesh: THREE.Object3D;
    dir: number;
  }[] = [];

  for (const fc of flipperConfigs) {
    const fY = getArenaHeight(fc.x, fc.z, 4);
    const fGroup = new THREE.Group();
    fGroup.position.set(fc.x, fY + 0.15, fc.z);
    fGroup.rotation.y = fc.restAngle;

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.5, 16), flipperMat);
    fGroup.add(post);

    const bat = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 3.2), flipperRubberMat);
    bat.position.set(0, 0, 1.6);
    fGroup.add(bat);

    group.add(fGroup);

    flippers.push({
      pivot: new THREE.Vector3(fc.x, fY + 0.15, fc.z),
      angle: fc.restAngle,
      length: 3.2,
      thickness: 0.4,
      restAngle: fc.restAngle,
      activeAngle: fc.activeAngle,
      isFlipping: false,
      flipTimer: 0,
      mesh: fGroup,
      dir: fc.dir,
    });
  }

  // 4 Circus Spring Trampolines
  const jumpPadConfigs = [
    { x: -6.5, z: -8, impulseY: 18, impulseZ: 8 },
    { x: 6.5, z: -8, impulseY: 18, impulseZ: 8 },
    { x: -6.5, z: 8, impulseY: 18, impulseZ: -8 },
    { x: 6.5, z: 8, impulseY: 18, impulseZ: -8 },
  ];

  const frameMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.2, metalness: 0.8 });
  const canvasMat = new THREE.MeshStandardMaterial({ color: 0xe0218a, roughness: 0.4 });
  const neonRingMat = new THREE.MeshBasicMaterial({ color: 0xffd166 });

  for (const pc of jumpPadConfigs) {
    const bH = getArenaHeight(pc.x, pc.z, 4);
    const frame = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.6, 0.16, 24), frameMat);
    frame.position.set(pc.x, bH + 0.08, pc.z);
    group.add(frame);

    const mat = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.18, 24), canvasMat);
    mat.position.set(pc.x, bH + 0.09, pc.z);
    group.add(mat);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.07, 8, 24), neonRingMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(pc.x, bH + 0.18, pc.z);
    group.add(ring);
  }

  root.add(group);

  return {
    group,
    flippers,
    jumpPads: jumpPadConfigs.map(c => ({ x: c.x, z: c.z, radius: 1.6, impulseY: c.impulseY, impulseZ: c.impulseZ })),
    update: (dt: number, time: number) => {
      neonRingMat.color.setHex((Math.sin(time * 8) > 0) ? 0xffd166 : 0x00f0ff);

      // Automatic arcade flipper cadence
      for (const f of flippers) {
        if (!f.isFlipping) {
          f.flipTimer += dt;
          if (f.flipTimer >= 1.8 + Math.random() * 0.8) {
            f.isFlipping = true;
            f.flipTimer = 0;
          }
        } else {
          f.flipTimer += dt;
          const strokeT = Math.sin((f.flipTimer / 0.35) * Math.PI);
          f.angle = THREE.MathUtils.lerp(f.restAngle, f.activeAngle, Math.max(0, strokeT));
          f.mesh.rotation.y = f.angle;
          if (f.flipTimer >= 0.35) {
            f.isFlipping = false;
            f.flipTimer = 0;
            f.angle = f.restAngle;
            f.mesh.rotation.y = f.restAngle;
          }
        }
      }
    },
  };
}

/**
 * Map 5: Atap Penuh Bintang — Central Black Hole Abyss & Sweeping Orbital Laser Gate
 */
export function createCosmicSingularity(root: THREE.Group) {
  const group = new THREE.Group();
  group.name = "Map5_CosmicSingularity";
  group.visible = false;

  const coreGroup = new THREE.Group();
  coreGroup.position.set(0, -2.4, 0); // Sunk down in the 7m void pit!

  // Central Event Horizon Sphere
  const singularitySphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x050510 })
  );
  coreGroup.add(singularitySphere);

  // Swirling Purple Accretion Disk
  const ring1 = new THREE.Mesh(
    new THREE.RingGeometry(2.6, 3.8, 48),
    new THREE.MeshBasicMaterial({ color: 0xa855f7, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
  );
  ring1.rotation.x = -Math.PI / 2;
  coreGroup.add(ring1);

  // Swirling Cyan Outer Accretion Ribbon
  const ring2 = new THREE.Mesh(
    new THREE.RingGeometry(4.0, 5.2, 48),
    new THREE.MeshBasicMaterial({ color: 0x06b6d4, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
  );
  ring2.rotation.x = -Math.PI / 2;
  coreGroup.add(ring2);

  // Sweeping Orbital Double Laser Beam across the Cross Bridges
  const laserBeamMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
  const laserBeam = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 14.0), laserBeamMat);
  laserBeam.position.y = 2.8; // player waist height above void pit
  coreGroup.add(laserBeam);

  group.add(coreGroup);

  // 4 Zero-G Nebula Jump Wells on the 4 Cross Wings
  const jumpWellConfigs = [
    { x: -11.5, z: 0 },
    { x: 11.5, z: 0 },
    { x: 0, z: -21.0 },
    { x: 0, z: 21.0 },
  ];

  const wellMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
  for (const jc of jumpWellConfigs) {
    const jY = getArenaHeight(jc.x, jc.z, 5);
    const well = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.8, 24), wellMat);
    well.rotation.x = -Math.PI / 2;
    well.position.set(jc.x, jY + 0.05, jc.z);
    group.add(well);
  }

  root.add(group);

  let vortexActive = false;

  return {
    group,
    jumpPads: jumpWellConfigs.map(c => ({ x: c.x, z: c.z, radius: 1.8, impulseY: 22, impulseZ: 0 })),
    setVortexActive: (active: boolean) => {
      vortexActive = active;
      singularitySphere.scale.setScalar(active ? 1.3 : 1.0);
    },
    isVortexActive: () => vortexActive,
    update: (dt: number, time: number) => {
      ring1.rotation.z += dt * (vortexActive ? 4.5 : 1.2);
      ring2.rotation.z -= dt * (vortexActive ? 3.5 : 0.9);
      laserBeam.rotation.y += dt * 1.1;

      if (vortexActive) {
        ring1.position.y = Math.sin(time * 12) * 0.12;
      }
    },
  };
}
