/**
 * BOUNCEBACK! — Player Controller (Touch + Keyboard)
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

  constructor() {
    this._boundKeyDown = (e) => {
      this.keys[e.code] = true;
    };
    this._boundKeyUp = (e) => {
      this.keys[e.code] = false;
    };
  }

  init() {
    window.addEventListener("keydown", this._boundKeyDown);
    window.addEventListener("keyup", this._boundKeyUp);

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
          let dx = t.clientX - this.stickOriginX;
          let dy = t.clientY - this.stickOriginY;
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
      setTimeout(() => { this.skillPressed = false; }, 100);
    });
  }

  destroy() {
    window.removeEventListener("keydown", this._boundKeyDown);
    window.removeEventListener("keyup", this._boundKeyUp);
  }

  getInput() {
    let mx = this.stickX;
    let mz = this.stickZ;

    const up = !!(this.keys["KeyW"] || this.keys["ArrowUp"]);
    const down = !!(this.keys["KeyS"] || this.keys["ArrowDown"]);
    const left = !!(this.keys["KeyA"] || this.keys["ArrowLeft"]);
    const right = !!(this.keys["KeyD"] || this.keys["ArrowRight"]);

    if (up && !down) mz = 1;       // W / ArrowUp = MAJU (+Z, forward towards opponent goal)
    else if (down && !up) mz = -1; // S / ArrowDown = MUNDUR (-Z, backward towards own goal)

    if (left && !right) mx = -1;   // A / ArrowLeft = KIRI (-X)
    else if (right && !left) mx = 1; // D / ArrowRight = KANAN (+X)

    const len = Math.sqrt(mx * mx + mz * mz);
    if (len > 1) {
      mx /= len;
      mz /= len;
    }

    const punch =
      this.punchPressed ||
      this.keys["Space"] ||
      this.keys["KeyJ"];
    const dash =
      this.dashPressed ||
      this.keys["ShiftLeft"] ||
      this.keys["ShiftRight"] ||
      this.keys["KeyK"];
    const skill =
      this.skillPressed ||
      this.keys["KeyE"] ||
      this.keys["KeyQ"];

    return { mx, mz, punch, dash, skill };
  }

  update(player: Entity, entities: Entity[], dt: number, juiceFn?: JuiceFn) {
    if (player.stunTimer > 0) return;

    const input = this.getInput();

    // Dash
    if (
      input.dash &&
      player.dashCd <= 0 &&
      player.dashTimer <= 0 &&
      !player.launched
    ) {
      player.dashTimer = C.DASH_DUR;
      player.dashCd = C.DASH_CD;
      const dirX = input.mx || 0;
      const dirZ = input.mz || 0;
      const dLen = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1;
      player.vx = (dirX / dLen) * C.DASH_SPEED;
      player.vz = (dirZ / dLen) * C.DASH_SPEED;
      if (juiceFn) juiceFn("dash");
    }

    // Movement (only when not launched and not dashing)
    if (!player.launched && player.dashTimer <= 0) {
      player.vx = input.mx * C.PLAYER_SPEED;
      player.vz = input.mz * C.PLAYER_SPEED;
    }

    // Punch
    if (input.punch && player.punchCd <= 0 && !player.launched) {
      player.punchCd = C.PUNCH_CD;
      let bestDist = C.PUNCH_RANGE;
      let bestIdx = -1;
      for (let i = 0; i < entities.length; i++) {
        const t = entities[i];
        if (t === player || t.team === player.team) continue;
        if (t.immuneTimer > 0) continue;
        const dx = t.x - player.x,
          dz = t.z - player.z;
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
