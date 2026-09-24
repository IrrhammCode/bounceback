/**
 * BOUNCEBACK! — Player Controller (Smooth Keyboard + Touch Joystick)
 *
 * Features:
 * - Robust multi-layout WASD & Arrow Key detection (case-insensitive + code-fallback)
 * - Window blur safety to eliminate stuck keys
 * - Camera-aware 3D movement projection (forward is towards opponent goal in 3rd-person, look-relative in 1st-person)
 * - Responsive acceleration & smooth ground momentum (no robotic jerky stops)
 * - Snappy directional dashing & skill triggers
 */
import * as C from "./config";
import { Entity, applyPunch } from "./physics";

export type JuiceFn = (type: string, data?: unknown) => void;

export class PlayerController {
  stickX = 0;
  stickZ = 0;
  stickActive = false;
  private stickId: number | null = null;
  private stickOriginX = 0;
  private stickOriginY = 0;

  punchPressed = false;
  dashPressed = false;
  skillPressed = false;

  private keys: Record<string, boolean> = {};
  private _boundKeyDown: (e: KeyboardEvent) => void;
  private _boundKeyUp: (e: KeyboardEvent) => void;
  private _boundBlur: () => void;

  constructor() {
    this._boundKeyDown = (e) => {
      this.keys[e.code] = true;
      if (e.key) {
        this.keys[e.key] = true;
        this.keys[e.key.toLowerCase()] = true;
        this.keys[e.key.toUpperCase()] = true;
      }
      // Prevent browser default scroll for game controls
      if (
        ["KeyW", "KeyS", "KeyA", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
          e.code
        )
      ) {
        e.preventDefault();
      }
    };

    this._boundKeyUp = (e) => {
      this.keys[e.code] = false;
      if (e.key) {
        this.keys[e.key] = false;
        this.keys[e.key.toLowerCase()] = false;
        this.keys[e.key.toUpperCase()] = false;
      }
    };

    this._boundBlur = () => {
      // Clear all pressed keys on window blur to eliminate stuck movement
      this.keys = {};
      this.punchPressed = false;
      this.dashPressed = false;
      this.skillPressed = false;
    };
  }

  init() {
    window.addEventListener("keydown", this._boundKeyDown);
    window.addEventListener("keyup", this._boundKeyUp);
    window.addEventListener("blur", this._boundBlur);

    const stickEl = document.getElementById("stick");
    const baseEl = document.getElementById("stickbase");
    const nubEl = document.getElementById("sticknub");
    if (!stickEl) return;

    const DEAD = 12;
    const MAX = 56;

    stickEl.addEventListener(
      "touchstart",
      (ev) => {
        ev.preventDefault();
        const t = ev.changedTouches[0];
        this.stickId = t.identifier;
        this.stickOriginX = t.clientX;
        this.stickOriginY = t.clientY;
        this.stickActive = true;
        if (baseEl) {
          baseEl.style.left = t.clientX + "px";
          baseEl.style.top = t.clientY + "px";
          baseEl.style.opacity = "1";
        }
        if (nubEl) {
          nubEl.style.left = t.clientX + "px";
          nubEl.style.top = t.clientY + "px";
          nubEl.style.opacity = "1";
        }
      },
      { passive: false }
    );

    stickEl.addEventListener(
      "touchmove",
      (ev) => {
        ev.preventDefault();
        for (const t of Array.from(ev.changedTouches)) {
          if (t.identifier !== this.stickId) continue;
          const dx = t.clientX - this.stickOriginX;
          const dy = t.clientY - this.stickOriginY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < DEAD) {
            this.stickX = 0;
            this.stickZ = 0;
          } else {
            const clamped = Math.min(dist, MAX);
            this.stickX = (dx / dist) * (clamped / MAX);
            this.stickZ = (-dy / dist) * (clamped / MAX);
          }
          if (nubEl) {
            const cx = Math.min(Math.max(dx, -MAX), MAX);
            const cy = Math.min(Math.max(dy, -MAX), MAX);
            nubEl.style.left = this.stickOriginX + cx + "px";
            nubEl.style.top = this.stickOriginY + cy + "px";
          }
        }
      },
      { passive: false }
    );

    const endStick = (ev: TouchEvent) => {
      for (const t of Array.from(ev.changedTouches)) {
        if (t.identifier !== this.stickId) continue;
        this.stickActive = false;
        this.stickX = 0;
        this.stickZ = 0;
        this.stickId = null;
        if (baseEl) baseEl.style.opacity = "0";
        if (nubEl) nubEl.style.opacity = "0";
      }
    };
    stickEl.addEventListener("touchend", endStick);
    stickEl.addEventListener("touchcancel", endStick);

    // Touch action buttons
    const btnA = document.getElementById("btnA");
    const btnB = document.getElementById("btnB");
    if (btnA) {
      btnA.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          this.punchPressed = true;
          btnA.classList.add("dn");
        },
        { passive: false }
      );
      btnA.addEventListener("touchend", () => {
        this.punchPressed = false;
        btnA.classList.remove("dn");
      });
    }
    if (btnB) {
      btnB.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          this.dashPressed = true;
          btnB.classList.add("dn");
        },
        { passive: false }
      );
      btnB.addEventListener("touchend", () => {
        this.dashPressed = false;
        btnB.classList.remove("dn");
      });
    }

    // Skill button (touch)
    const btnSkill = document.getElementById("btnSkill");
    if (btnSkill) {
      btnSkill.addEventListener(
        "touchstart",
        (e) => {
          e.preventDefault();
          this.skillPressed = true;
          btnSkill.classList.add("dn");
        },
        { passive: false }
      );
      btnSkill.addEventListener("touchend", () => {
        this.skillPressed = false;
        btnSkill.classList.remove("dn");
      });
    }

    // Right-click / contextmenu for skill on desktop
    window.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.skillPressed = true;
      setTimeout(() => {
        this.skillPressed = false;
      }, 100);
    });
  }

  destroy() {
    window.removeEventListener("keydown", this._boundKeyDown);
    window.removeEventListener("keyup", this._boundKeyUp);
    window.removeEventListener("blur", this._boundBlur);
  }

  getInput() {
    let mx = this.stickX;
    let mz = this.stickZ;

    // Multi-key checking: accepts KeyW, "w", "W", ArrowUp, etc.
    const up = !!(
      this.keys["KeyW"] ||
      this.keys["w"] ||
      this.keys["W"] ||
      this.keys["ArrowUp"]
    );
    const down = !!(
      this.keys["KeyS"] ||
      this.keys["s"] ||
      this.keys["S"] ||
      this.keys["ArrowDown"]
    );
    const left = !!(
      this.keys["KeyA"] ||
      this.keys["a"] ||
      this.keys["A"] ||
      this.keys["ArrowLeft"]
    );
    const right = !!(
      this.keys["KeyD"] ||
      this.keys["d"] ||
      this.keys["D"] ||
      this.keys["ArrowRight"]
    );

    // Forward (+Z) / Backward (-Z)
    if (up && !down) mz = 1;
    else if (down && !up) mz = -1;

    // Left (-X) / Right (+X)
    if (left && !right) mx = -1;
    else if (right && !left) mx = 1;

    // Diagonal speed normalization
    const len = Math.sqrt(mx * mx + mz * mz);
    if (len > 1) {
      mx /= len;
      mz /= len;
    }

    const punch =
      this.punchPressed ||
      this.keys["Space"] ||
      this.keys["KeyJ"] ||
      this.keys["j"] ||
      this.keys["J"];

    const dash =
      this.dashPressed ||
      this.keys["ShiftLeft"] ||
      this.keys["ShiftRight"] ||
      this.keys["KeyK"] ||
      this.keys["k"] ||
      this.keys["K"];

    const skill =
      this.skillPressed ||
      this.keys["KeyE"] ||
      this.keys["e"] ||
      this.keys["E"] ||
      this.keys["KeyQ"] ||
      this.keys["q"] ||
      this.keys["Q"];

    return { mx, mz, punch, dash, skill };
  }

  update(
    player: Entity,
    entities: Entity[],
    dt: number,
    juiceFn?: JuiceFn,
    cameraFacingAngle = 0,
    isFirstPerson = false
  ) {
    if (player.stunTimer > 0) return;

    let { mx, mz, punch, dash } = this.getInput();

    // In 1st-person camera mode, rotate movement vector according to player's look direction
    if (isFirstPerson && (mx !== 0 || mz !== 0)) {
      const cosA = Math.cos(cameraFacingAngle);
      const sinA = Math.sin(cameraFacingAngle);
      // Camera forward is facing vector
      const forwardX = sinA;
      const forwardZ = cosA;
      const rightX = cosA;
      const rightZ = -sinA;

      const rX = forwardX * mz + rightX * mx;
      const rZ = forwardZ * mz + rightZ * mx;
      mx = rX;
      mz = rZ;
    }

    // Dash with dynamic direction
    if (
      dash &&
      player.dashCd <= 0 &&
      player.dashTimer <= 0 &&
      !player.launched
    ) {
      player.dashTimer = C.DASH_DUR;
      player.dashCd = C.DASH_CD;
      let dirX = mx;
      let dirZ = mz;
      // If dashing while standing still, dash in current movement/facing direction
      if (dirX === 0 && dirZ === 0) {
        dirX = player.vx;
        dirZ = player.vz;
        if (dirX === 0 && dirZ === 0) dirZ = 1.0;
      }
      const dLen = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;
      player.vx = (dirX / dLen) * C.DASH_SPEED;
      player.vz = (dirZ / dLen) * C.DASH_SPEED;
      if (juiceFn) juiceFn("dash");
    }

    // Smooth snappy movement physics (responsive acceleration + juicy momentum)
    if (!player.launched && player.dashTimer <= 0) {
      const targetVx = mx * C.PLAYER_SPEED;
      const targetVz = mz * C.PLAYER_SPEED;
      const hasInput = mx !== 0 || mz !== 0;

      // Snappy 24.0/s acceleration (instant responsivity) + smooth 16.0/s ground deceleration
      const accelRate = hasInput ? 24.0 : 16.0;
      player.vx += (targetVx - player.vx) * Math.min(1.0, accelRate * dt);
      player.vz += (targetVz - player.vz) * Math.min(1.0, accelRate * dt);
    }

    // Punch attack
    if (punch && player.punchCd <= 0 && !player.launched) {
      player.punchCd = C.PUNCH_CD;
      let bestDist = C.PUNCH_RANGE;
      let bestIdx = -1;
      for (let i = 0; i < entities.length; i++) {
        const t = entities[i];
        if (t === player || t.team === player.team) continue;
        if (t.immuneTimer > 0) continue;
        const dx = t.x - player.x;
        const dz = t.z - player.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      if (bestIdx >= 0) {
        const result = applyPunch(player, entities[bestIdx], false);
        entities[bestIdx].lastHitBy = entities.indexOf(player);
        if (juiceFn) juiceFn("punch", result);
      } else {
        if (juiceFn) juiceFn("whiff");
      }
    }
  }
}
