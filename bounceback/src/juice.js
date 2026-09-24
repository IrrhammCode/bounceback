/**
 * BOUNCEBACK! — Juice System (Hit-stop, Screen Shake, Particles, Trails)
 */

export class JuiceSystem {
  constructor(camera) {
    this.camera = camera;
    this.baseCamPos = null;
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;
    this.hitStopTimer = 0;
    this.hitStopDuration = 0;
    this.comboPopups = [];      // {text, x, y, timer, maxTimer}
    this.trails = [];           // {points:[], color, timer}
  }

  init(camPos) {
    this.baseCamPos = { x: camPos.x, y: camPos.y, z: camPos.z };
  }

  isHitStopped() {
    return this.hitStopTimer > 0;
  }

  trigger(type, data) {
    switch (type) {
      case 'punch':
        this.shakeIntensity = 0.15;
        this.hitStopTimer = 0.04;
        this.hitStopDuration = 0.04;
        break;
      case 'botpunch':
        this.shakeIntensity = 0.06;
        break;
      case 'dash':
        this.shakeIntensity = 0.04;
        break;
      case 'whiff':
        break;
      case 'goal':
        this.shakeIntensity = 0.3;
        this.hitStopTimer = 0.08;
        this.hitStopDuration = 0.08;
        break;
      case 'combo':
        this.shakeIntensity = 0.12;
        break;
      case 'overdrive':
        this.shakeIntensity = 0.25;
        break;
    }
  }

  addComboPopup(text, screenX, screenY) {
    this.comboPopups.push({
      text,
      x: screenX,
      y: screenY,
      timer: 1.5,
      maxTimer: 1.5
    });
  }

  update(dt) {
    // Hit-stop countdown
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
    }

    // Screen shake
    if (this.shakeIntensity > 0.001) {
      const sx = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      const sy = (Math.random() - 0.5) * 2 * this.shakeIntensity;
      if (this.baseCamPos) {
        this.camera.position.x = this.baseCamPos.x + sx;
        this.camera.position.y = this.baseCamPos.y + sy * 0.5;
      }
      this.shakeIntensity *= this.shakeDecay;
    } else if (this.baseCamPos) {
      this.camera.position.x = this.baseCamPos.x;
      this.camera.position.y = this.baseCamPos.y;
    }

    // Combo popups
    for (let i = this.comboPopups.length - 1; i >= 0; i--) {
      this.comboPopups[i].timer -= dt;
      if (this.comboPopups[i].timer <= 0) this.comboPopups.splice(i, 1);
    }
  }

  renderPopups(ctx2d, w, h) {
    if (!ctx2d) return;
    for (const p of this.comboPopups) {
      const progress = 1 - (p.timer / p.maxTimer);
      const alpha = Math.max(0, 1 - progress * 1.2);
      const yOff = progress * 40;
      const scale = 1 + progress * 0.5;
      ctx2d.save();
      ctx2d.globalAlpha = alpha;
      ctx2d.font = `bold ${Math.round(28 * scale)}px "Lilita One", sans-serif`;
      ctx2d.textAlign = 'center';
      ctx2d.fillStyle = '#FFD166';
      ctx2d.strokeStyle = '#111625';
      ctx2d.lineWidth = 3;
      ctx2d.strokeText(p.text, p.x * w, (p.y * h) - yOff);
      ctx2d.fillText(p.text, p.x * w, (p.y * h) - yOff);
      ctx2d.restore();
    }
  }
}
