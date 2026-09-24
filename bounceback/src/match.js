/**
 * BOUNCEBACK! — Match Flow Controller (100s, 3 phases)
 */
import * as C from './config.js';

export class Match {
  constructor() {
    this.timer = C.MATCH_DURATION;
    this.scores = [0, 0]; // [cyan, coral]
    this.phase = 1;
    this.started = false;
    this.over = false;
    this.winner = -1;
    this.combo = [0, 0];      // current combo streak per team
    this.comboTimer = [0, 0]; // decay timers
    this.overdriveFired = false;
    this.onPhaseChange = null;
    this.onGoal = null;
    this.onOverdrive = null;
    this.onMatchEnd = null;
  }

  start() {
    this.timer = C.MATCH_DURATION;
    this.scores = [0, 0];
    this.phase = 1;
    this.started = true;
    this.over = false;
    this.winner = -1;
    this.combo = [0, 0];
    this.comboTimer = [0, 0];
    this.overdriveFired = false;
  }

  getPhaseForTime(elapsed) {
    if (elapsed >= C.PHASE3_TIME) return 3;
    if (elapsed >= C.PHASE2_TIME) return 2;
    return 1;
  }

  score(team, gateMultiplier, bounceCount, entityIdx) {
    if (this.over) return;
    // Base score + combo bonus
    const comboMult = 1 + this.combo[team] * 0.5;
    const bumperBonus = Math.min(bounceCount, 5);
    const points = Math.round(gateMultiplier * (1 + bumperBonus * 0.5) * comboMult);

    this.scores[team] += points;
    this.combo[team]++;
    this.comboTimer[team] = C.COMBO_WINDOW;

    if (this.onGoal) this.onGoal(team, points, this.combo[team], bounceCount);
    return points;
  }

  update(dt) {
    if (!this.started || this.over) return;

    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0;
      this.over = true;
      this.winner = this.scores[0] > this.scores[1] ? 0 :
                    this.scores[1] > this.scores[0] ? 1 : -1; // -1 = draw
      if (this.onMatchEnd) this.onMatchEnd(this.winner, this.scores);
      return;
    }

    // Phase tracking
    const elapsed = C.MATCH_DURATION - this.timer;
    const newPhase = this.getPhaseForTime(elapsed);
    if (newPhase !== this.phase) {
      this.phase = newPhase;
      if (this.onPhaseChange) this.onPhaseChange(this.phase);
      if (this.phase === 3 && !this.overdriveFired) {
        this.overdriveFired = true;
        if (this.onOverdrive) this.onOverdrive();
      }
    }

    // Combo decay
    for (let t = 0; t < 2; t++) {
      if (this.comboTimer[t] > 0) {
        this.comboTimer[t] -= dt;
        if (this.comboTimer[t] <= 0) {
          this.combo[t] = 0;
        }
      }
    }
  }

  getTimerDisplay() {
    const secs = Math.ceil(this.timer);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
