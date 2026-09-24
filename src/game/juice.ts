/**
 * BOUNCEBACK! — Juice & Visual Effects System (AAA Arcade Impact)
 *
 * Features:
 * - Visceral Screen Trauma & Rotational Camera Kick
 * - Hit-stop Freeze Frames & Slow-Motion Goal Cinematics
 * - Floating 3D Comic Popups ("BOING!", "SMASH!", "WHAM!", "SUPER HIT!", "GOAL!")
 * - Expanding Holographic Neon Shockwave Rings
 * - Radial 3D Hit Sparks & Starburst Particle Bursts
 * - Grand Pyrotechnic Confetti & Firework Fountains on Goal Celebrations
 */
import * as THREE from "three";

export interface ComboPopup {
  text: string;
  x: number;
  y: number;
  timer: number;
  maxTimer: number;
}

interface ComicPopup3D {
  sprite: THREE.Sprite;
  vy: number;
  life: number;
  maxLife: number;
  baseScale: number;
}

interface ShockwaveRing3D {
  mesh: THREE.Mesh;
  scaleSpeed: number;
  maxScale: number;
  currentScale: number;
  life: number;
  maxLife: number;
}

interface Spark3D {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  rotSpeed: THREE.Vector3;
}

export class JuiceSystem {
  camera: THREE.Camera;
  scene?: THREE.Scene;
  baseCamPos: { x: number; y: number; z: number } | null = null;
  baseCamRotZ = 0;

  // Screen Shake & Camera Trauma
  trauma = 0; // 0 to 1, actual shake = trauma^2
  shakeDecay = 2.4; // Decay per second
  rollTrauma = 0;

  // Hit-stop & Slow-motion
  hitStopTimer = 0;
  timeScale = 1.0;
  slowMoTimer = 0;
  slowMoDuration = 0;

  // 2D Combo Popups (legacy UI sync)
  comboPopups: ComboPopup[] = [];

  // 3D FX Containers
  private fxGroup = new THREE.Group();
  private comicPopups: ComicPopup3D[] = [];
  private shockwaves: ShockwaveRing3D[] = [];
  private sparks: Spark3D[] = [];

  // Canvas Texture Cache
  private textureCache = new Map<string, THREE.CanvasTexture>();

  // Shared Geometries & Materials
  private ringGeo = new THREE.RingGeometry(0.2, 0.45, 32);
  private sparkGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
  private starGeo = new THREE.PlaneGeometry(0.25, 0.25);

  constructor(camera: THREE.Camera, scene?: THREE.Scene) {
    this.camera = camera;
    this.scene = scene;
    this.ringGeo.rotateX(-Math.PI / 2);

    if (this.scene) {
      this.fxGroup.name = "JuiceVisualEffects";
      this.scene.add(this.fxGroup);
    }
  }

  init(camPos: THREE.Vector3) {
    this.baseCamPos = { x: camPos.x, y: camPos.y, z: camPos.z };
    this.baseCamRotZ = this.camera.rotation.z;
  }

  isHitStopped(): boolean {
    return this.hitStopTimer > 0;
  }

  getTimeScale(): number {
    return this.timeScale;
  }

  // ─── Trigger Handler ───
  trigger(type: string, data?: unknown) {
    const d = (data || {}) as {
      x?: number;
      y?: number;
      z?: number;
      text?: string;
      team?: number;
      combo?: number;
    };
    const x = d.x ?? 0;
    const y = d.y ?? 1.2;
    const z = d.z ?? 0;

    switch (type) {
      case "punch":
        this.addTrauma(0.45);
        this.hitStopTimer = 0.045;
        this.spawnComicPopup(d.text || "SMASH!", x, y + 0.6, z, "crimson");
        this.spawnShockwave(x, y, z, 0xff0055, 2.2);
        this.spawnHitSparks(x, y + 0.2, z, 0xffd700, 16);
        break;

      case "botpunch":
        this.addTrauma(0.25);
        this.spawnShockwave(x, y, z, 0x38bdf8, 1.4);
        this.spawnHitSparks(x, y + 0.2, z, 0x00f0ff, 8);
        break;

      case "bumper":
        this.addTrauma(0.5);
        this.spawnComicPopup("BOING!", x, y + 0.8, z, "gold");
        this.spawnShockwave(x, y, z, 0xfbbf24, 2.6);
        this.spawnHitSparks(x, y + 0.3, z, 0xffa500, 18);
        break;

      case "dash":
        this.addTrauma(0.18);
        this.spawnShockwave(x, 0.1, z, 0x00ffff, 1.2);
        break;

      case "whiff":
        break;

      case "goal":
        this.addTrauma(0.85);
        this.triggerSlowMo(0.7, 0.22);
        this.spawnComicPopup("GOAL!!", x, y + 1.8, z, "rainbow");
        this.spawnShockwave(x, 0.2, z, 0xffd700, 6.0);
        this.spawnGoalCelebration(d.team ?? 0, x, z);
        break;

      case "combo": {
        this.addTrauma(0.35);
        const count = d.combo || 2;
        this.spawnComicPopup(`COMBO x${count}!`, x, y + 1.0, z, "violet");
        this.spawnShockwave(x, y, z, 0xa855f7, 2.8);
        this.spawnHitSparks(x, y + 0.4, z, 0xe879f9, 20);
        break;
      }

      case "overdrive":
        this.addTrauma(0.65);
        this.spawnComicPopup("OVERDRIVE!", 0, 3.5, 0, "hotpink");
        this.spawnShockwave(0, 0.2, 0, 0xff0077, 8.0);
        this.spawnHitSparks(0, 1.5, 0, 0xff1493, 35);
        break;

      case "gigafist":
        this.addTrauma(0.7);
        this.hitStopTimer = 0.06;
        this.spawnComicPopup("GIGA FIST!!", x, y + 1.0, z, "crimson");
        this.spawnShockwave(x, y, z, 0xff2200, 3.5);
        this.spawnHitSparks(x, y + 0.5, z, 0xff4500, 24);
        break;

      case "banana_slip":
        this.addTrauma(0.3);
        this.spawnComicPopup("SLIP!!", x, y + 0.8, z, "gold");
        this.spawnHitSparks(x, y + 0.1, z, 0xfacc15, 12);
        break;

      case "rocket_hit":
        this.addTrauma(0.55);
        this.hitStopTimer = 0.05;
        this.spawnComicPopup("KABOOM!", x, y + 0.9, z, "orange");
        this.spawnShockwave(x, y, z, 0xff6600, 3.0);
        this.spawnHitSparks(x, y + 0.5, z, 0xff3300, 25);
        break;

      case "rocket_start":
        this.addTrauma(0.2);
        break;

      case "magnet":
        this.addTrauma(0.25);
        this.spawnShockwave(x, y, z, 0x06b6d4, 2.0);
        break;

      case "bomb_explode":
        this.addTrauma(0.8);
        this.hitStopTimer = 0.07;
        this.spawnComicPopup("EXPLOSION!!", x, y + 1.2, z, "crimson");
        this.spawnShockwave(x, y, z, 0xff1100, 4.5);
        this.spawnHitSparks(x, y + 0.6, z, 0xffaa00, 35);
        break;

      case "shrink":
        this.addTrauma(0.2);
        this.spawnComicPopup("ZAP!", x, y + 0.6, z, "cyan");
        this.spawnHitSparks(x, y + 0.2, z, 0x00f5ff, 12);
        break;

      case "pickup":
        this.addTrauma(0.12);
        this.spawnShockwave(x, y, z, 0x10b981, 1.2);
        this.spawnHitSparks(x, y + 0.3, z, 0x34d399, 10);
        break;
    }
  }

  addTrauma(amount: number) {
    this.trauma = Math.min(this.trauma + amount, 1.0);
    this.rollTrauma = Math.min(this.rollTrauma + amount * 0.7, 1.0);
  }

  triggerSlowMo(duration = 0.8, minScale = 0.25) {
    this.slowMoDuration = duration;
    this.slowMoTimer = duration;
    this.timeScale = minScale;
  }

  // ─── 3D Comic Book Billboard Popups ───
  spawnComicPopup(text: string, x: number, y: number, z: number, style: string = "gold") {
    if (!this.scene) return;

    const cacheKey = `${text}_${style}`;
    let tex = this.textureCache.get(cacheKey);
    if (!tex) {
      tex = this.createComicTexture(text, style);
      this.textureCache.set(cacheKey, tex);
    }

    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(x, y, z);

    // Initial scale with juicy pop
    const baseW = 2.4;
    const baseH = 1.2;
    sprite.scale.set(baseW * 1.4, baseH * 1.4, 1.0);

    this.fxGroup.add(sprite);

    this.comicPopups.push({
      sprite,
      vy: 1.8,
      life: 0.85,
      maxLife: 0.85,
      baseScale: baseW,
    });
  }

  private createComicTexture(text: string, style: string): THREE.CanvasTexture {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    ctx.clearRect(0, 0, 512, 256);

    // Style colors
    let topCol = "#fef08a";
    let botCol = "#f59e0b";
    let strokeCol = "#000000";
    let glowCol = "rgba(255, 230, 0, 0.8)";

    if (style === "crimson") {
      topCol = "#fca5a5";
      botCol = "#dc2626";
      glowCol = "rgba(239, 68, 68, 0.8)";
    } else if (style === "rainbow" || style === "hotpink") {
      topCol = "#f472b6";
      botCol = "#db2777";
      glowCol = "rgba(244, 114, 182, 0.8)";
    } else if (style === "violet") {
      topCol = "#d8b4fe";
      botCol = "#9333ea";
      glowCol = "rgba(168, 85, 247, 0.8)";
    } else if (style === "cyan") {
      topCol = "#67e8f9";
      botCol = "#06b6d4";
      glowCol = "rgba(6, 182, 212, 0.8)";
    } else if (style === "orange") {
      topCol = "#fdba74";
      botCol = "#ea580c";
      glowCol = "rgba(249, 115, 22, 0.8)";
    }

    // Outer Glow / Shadow
    ctx.shadowColor = glowCol;
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;

    // Draw comic starburst badge backdrop
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    const cx = 256;
    const cy = 128;
    const spikes = 12;
    const outerR = 210;
    const innerR = 175;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * (r * 0.55);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = "#0f172a";
    ctx.fill();

    // Inner badge
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    // Comic Text
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 6;

    ctx.font = '900 68px "Impact", "Arial Black", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Text Outline
    ctx.lineWidth = 14;
    ctx.strokeStyle = strokeCol;
    ctx.strokeText(text, 256, 128);

    // Text Gradient Fill
    const grad = ctx.createLinearGradient(0, 80, 0, 170);
    grad.addColorStop(0, topCol);
    grad.addColorStop(1, botCol);
    ctx.fillStyle = grad;
    ctx.fillText(text, 256, 128);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // ─── Expanding Holographic Shockwave Rings ───
  spawnShockwave(x: number, y: number, z: number, color = 0x38bdf8, maxScale = 2.5) {
    if (!this.scene) return;

    const mat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(this.ringGeo, mat);
    mesh.position.set(x, y + 0.05, z);
    mesh.scale.set(0.2, 0.2, 0.2);

    this.fxGroup.add(mesh);

    this.shockwaves.push({
      mesh,
      scaleSpeed: maxScale / 0.35,
      maxScale,
      currentScale: 0.2,
      life: 0.35,
      maxLife: 0.35,
    });
  }

  // ─── Radial 3D Hit Sparks ───
  spawnHitSparks(x: number, y: number, z: number, color = 0xffd700, count = 16) {
    if (!this.scene) return;

    const sparkMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const speed = 4.0 + Math.random() * 7.0;
      const elevation = Math.random() * 4.5 + 1.5;

      const pMesh = new THREE.Mesh(this.sparkGeo, sparkMat);
      pMesh.position.set(x, y, z);
      const s = 0.5 + Math.random() * 0.6;
      pMesh.scale.set(s, s, s);

      this.fxGroup.add(pMesh);

      this.sparks.push({
        pos: new THREE.Vector3(x, y, z),
        vel: new THREE.Vector3(
          Math.cos(angle) * speed,
          elevation,
          Math.sin(angle) * speed
        ),
        mesh: pMesh,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15
        ),
      });
    }
  }

  // ─── Monumental Goal Celebration Pyro / Confetti Fountains ───
  spawnGoalCelebration(team: number, goalX: number, goalZ: number) {
    if (!this.scene) return;

    const primaryCol = team === 0 ? 0x00f0ff : 0xff2a5f;
    const secondaryCol = team === 0 ? 0xfef08a : 0xffbb00;

    // 1. Double shockwaves at goal
    this.spawnShockwave(goalX, 0.2, goalZ, primaryCol, 7.5);
    setTimeout(() => {
      this.spawnShockwave(goalX, 0.2, goalZ, secondaryCol, 5.0);
    }, 120);

    // 2. 4 Corner Pyrotechnic Cannons soaring 16m high
    const corners = [
      { x: -13.5, z: -25 },
      { x: 13.5, z: -25 },
      { x: -13.5, z: 25 },
      { x: 13.5, z: 25 },
    ];

    for (const c of corners) {
      const confettiColors = [0x00f0ff, 0xff2a5f, 0xfacc15, 0x10b981, 0xa855f7, 0xffffff];
      for (let i = 0; i < 28; i++) {
        const cCol = confettiColors[i % confettiColors.length];
        const confMat = new THREE.MeshBasicMaterial({
          color: cCol,
          transparent: true,
          opacity: 1.0,
          side: THREE.DoubleSide,
          depthWrite: false,
        });

        const pMesh = new THREE.Mesh(this.starGeo, confMat);
        pMesh.position.set(c.x, 2.0, c.z);

        const launchAngle = Math.random() * Math.PI * 2;
        const launchSpeed = 3.5 + Math.random() * 8.0;
        const vY = 12.0 + Math.random() * 9.0; // Shoot high into stadium sky!

        this.fxGroup.add(pMesh);

        this.sparks.push({
          pos: new THREE.Vector3(c.x, 2.0, c.z),
          vel: new THREE.Vector3(
            Math.cos(launchAngle) * launchSpeed,
            vY,
            Math.sin(launchAngle) * launchSpeed
          ),
          mesh: pMesh,
          life: 1.8 + Math.random() * 0.8,
          maxLife: 2.6,
          rotSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 12
          ),
        });
      }
    }
  }

  addComboPopup(text: string, screenX: number, screenY: number) {
    this.comboPopups.push({
      text,
      x: screenX,
      y: screenY,
      timer: 1.5,
      maxTimer: 1.5,
    });
  }

  // ─── Main Update Loop ───
  update(dt: number) {
    // 1. Hit-stop timer
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
    }

    // 2. Slow-motion goal celebration
    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= dt;
      const progress = 1.0 - this.slowMoTimer / (this.slowMoDuration || 1.0);
      // Smoothly recover from 0.25 to 1.0
      this.timeScale = 0.25 + 0.75 * Math.sin((progress * Math.PI) / 2);
      if (this.slowMoTimer <= 0) {
        this.timeScale = 1.0;
      }
    } else {
      this.timeScale = 1.0;
    }

    // 3. Screen Shake & Rotational Camera Trauma
    if (this.trauma > 0.001) {
      this.trauma = Math.max(0, this.trauma - this.shakeDecay * dt);
      const shake = this.trauma * this.trauma; // Non-linear feel
      const maxOffset = 0.55 * shake;
      const maxRoll = 0.035 * (this.rollTrauma * this.rollTrauma);

      const sx = (Math.random() - 0.5) * 2 * maxOffset;
      const sy = (Math.random() - 0.5) * 2 * maxOffset;
      const roll = (Math.random() - 0.5) * 2 * maxRoll;

      if (this.baseCamPos) {
        this.camera.position.x = this.baseCamPos.x + sx;
        this.camera.position.y = this.baseCamPos.y + sy;
        this.camera.rotation.z = this.baseCamRotZ + roll;
      }
    } else if (this.baseCamPos) {
      this.camera.position.x = this.baseCamPos.x;
      this.camera.position.y = this.baseCamPos.y;
      this.camera.rotation.z = this.baseCamRotZ;
    }
    this.rollTrauma = Math.max(0, this.rollTrauma - this.shakeDecay * dt);

    // 4. Update 3D Comic Popups
    for (let i = this.comicPopups.length - 1; i >= 0; i--) {
      const p = this.comicPopups[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.fxGroup.remove(p.sprite);
        p.sprite.material.dispose();
        this.comicPopups.splice(i, 1);
        continue;
      }

      // Float up
      p.sprite.position.y += p.vy * dt;
      p.vy *= 0.94; // Decelerate upward

      // Scale bounce (squash & stretch spring)
      const t = 1.0 - p.life / p.maxLife;
      const bounceS = 1.0 + 0.35 * Math.sin(t * Math.PI * 3) * Math.exp(-t * 3);
      p.sprite.scale.set(p.baseScale * bounceS, (p.baseScale * 0.5) * bounceS, 1.0);

      // Fade out near end of life
      if (p.life < 0.25) {
        p.sprite.material.opacity = p.life / 0.25;
      }
    }

    // 5. Update Shockwave Rings
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.life -= dt;
      if (sw.life <= 0) {
        this.fxGroup.remove(sw.mesh);
        (sw.mesh.material as THREE.Material).dispose();
        this.shockwaves.splice(i, 1);
        continue;
      }

      sw.currentScale += sw.scaleSpeed * dt;
      sw.mesh.scale.set(sw.currentScale, sw.currentScale, sw.currentScale);
      const alpha = sw.life / sw.maxLife;
      (sw.mesh.material as THREE.MeshBasicMaterial).opacity = alpha * 0.85;
    }

    // 6. Update 3D Sparks & Confetti
    const gravity = -14.0;
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const sp = this.sparks[i];
      sp.life -= dt;
      if (sp.life <= 0) {
        this.fxGroup.remove(sp.mesh);
        (sp.mesh.material as THREE.Material).dispose();
        this.sparks.splice(i, 1);
        continue;
      }

      sp.vel.y += gravity * dt;
      sp.pos.x += sp.vel.x * dt;
      sp.pos.y += sp.vel.y * dt;
      sp.pos.z += sp.vel.z * dt;

      // Ground bounce
      if (sp.pos.y < 0.05) {
        sp.pos.y = 0.05;
        sp.vel.y = -sp.vel.y * 0.35;
        sp.vel.x *= 0.65;
        sp.vel.z *= 0.65;
      }

      sp.mesh.position.copy(sp.pos);
      sp.mesh.rotation.x += sp.rotSpeed.x * dt;
      sp.mesh.rotation.y += sp.rotSpeed.y * dt;
      sp.mesh.rotation.z += sp.rotSpeed.z * dt;

      // Fade out
      const alpha = sp.life / sp.maxLife;
      (sp.mesh.material as THREE.MeshBasicMaterial).opacity = alpha;
    }

    // 7. Legacy 2D popups
    for (let i = this.comboPopups.length - 1; i >= 0; i--) {
      this.comboPopups[i].timer -= dt;
      if (this.comboPopups[i].timer <= 0) this.comboPopups.splice(i, 1);
    }
  }

  dispose() {
    if (this.scene) {
      this.scene.remove(this.fxGroup);
    }
    for (const p of this.comicPopups) {
      p.sprite.material.dispose();
    }
    for (const sw of this.shockwaves) {
      (sw.mesh.material as THREE.Material).dispose();
    }
    for (const sp of this.sparks) {
      (sp.mesh.material as THREE.Material).dispose();
    }
    this.comicPopups = [];
    this.shockwaves = [];
    this.sparks = [];
    this.textureCache.forEach((tex) => tex.dispose());
    this.textureCache.clear();
    this.ringGeo.dispose();
    this.sparkGeo.dispose();
    this.starGeo.dispose();
  }
}
