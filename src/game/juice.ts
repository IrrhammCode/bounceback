/**
 * BOUNCEBACK! — Juice System (Hit-stop, Screen Shake, Combo Popups)
 */
import * as THREE from "three";

export interface ComboPopup {
  text: string;
  x: number;
  y: number;
  timer: number;
  maxTimer: number;
}

export class JuiceSystem {
  camera: THREE.Camera;
  baseCamPos: { x: number; y: number; z: number } | null = null;
  shakeIntensity = 0;
  shakeDecay = 0.9;
  hitStopTimer = 0;
  hitStopDuration = 0;
  comboPopups: ComboPopup[] = [];

  constructor(camera: THREE.Camera) {
    this.camera = camera;
  }

  init(camPos: THREE.Vector3) {
    this.baseCamPos = { x: camPos.x, y: camPos.y, z: camPos.z };
  }

  isHitStopped() {
    return this.hitStopTimer > 0;
  }

  trigger(type: string, _data?: unknown) {
    switch (type) {
      case "punch":
        this.shakeIntensity = 0.15;
        this.hitStopTimer = 0.04;
        this.hitStopDuration = 0.04;
        break;
      case "botpunch":
        this.shakeIntensity = 0.06;
        break;
      case "dash":
        this.shakeIntensity = 0.04;
        break;
      case "whiff":
        break;
      case "goal":
        this.shakeIntensity = 0.3;
        this.hitStopTimer = 0.08;
        this.hitStopDuration = 0.08;
        break;
      case "combo":
        this.shakeIntensity = 0.12;
        break;
      case "overdrive":
        this.shakeIntensity = 0.25;
        break;
      case "gigafist":
        this.shakeIntensity = 0.35;
        this.hitStopTimer = 0.06;
        this.hitStopDuration = 0.06;
        break;
      case "banana_slip":
        this.shakeIntensity = 0.08;
        break;
      case "rocket_hit":
        this.shakeIntensity = 0.2;
        this.hitStopTimer = 0.03;
        this.hitStopDuration = 0.03;
        break;
      case "rocket_start":
        this.shakeIntensity = 0.1;
        break;
      case "magnet":
        this.shakeIntensity = 0.12;
        break;
      case "bomb_explode":
        this.shakeIntensity = 0.4;
        this.hitStopTimer = 0.07;
        this.hitStopDuration = 0.07;
        break;
      case "shrink":
        this.shakeIntensity = 0.06;
        break;
      case "pickup":
        this.shakeIntensity = 0.03;
        break;
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

  update(dt: number) {
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
    }

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

    for (let i = this.comboPopups.length - 1; i >= 0; i--) {
      this.comboPopups[i].timer -= dt;
      if (this.comboPopups[i].timer <= 0) this.comboPopups.splice(i, 1);
    }
  }
}
