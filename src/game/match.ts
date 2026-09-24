/**
 * BOUNCEBACK! — Match Flow Controller (100s, 3 phases)
 */
import * as C from "./config";

export type GoalCallback = (
  team: number,
  points: number,
  combo: number,
  bounces: number
) => void;

export class Match {
  timer = C.MATCH_DURATION;
  scores: [number, number] = [0, 0];
  phase = 1;
  started = false;
  over = false;
  winner = -1;
  combo: [number, number] = [0, 0];
  comboTimer: [number, number] = [0, 0];
  overdriveFired = false;

  onPhaseChange: ((phase: number) => void) | null = null;
  onGoal: GoalCallback | null = null;
  onOverdrive: (() => void) | null = null;
  onMatchEnd: ((winner: number, scores: [number, number]) => void) | null =
    null;

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

  reset() {
    this.timer = C.MATCH_DURATION;
    this.scores = [0, 0];
    this.phase = 1;
    this.started = false;
    this.over = false;
    this.winner = -1;
    this.combo = [0, 0];
    this.comboTimer = [0, 0];
    this.overdriveFired = false;
  }

  getPhaseForTime(elapsed: number): number {
    if (elapsed >= C.PHASE3_TIME) return 3;
    if (elapsed >= C.PHASE2_TIME) return 2;
    return 1;
  }

  score(
    team: number,
    gateMultiplier: number,
    bounceCount: number,
    _entityIdx: number
  ): number {
    if (this.over) return 0;
    const comboMult = 1 + this.combo[team] * 0.5;
    const bumperBonus = Math.min(bounceCount, 5);
    const points = Math.round(
      gateMultiplier * (1 + bumperBonus * 0.5) * comboMult
    );

    this.scores[team] += points;
    this.combo[team]++;
    this.comboTimer[team] = C.COMBO_WINDOW;

    if (this.onGoal) this.onGoal(team, points, this.combo[team], bounceCount);
    return points;
  }

  update(dt: number) {
    if (!this.started || this.over) return;

    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0;
      this.over = true;
      this.winner =
        this.scores[0] > this.scores[1]
          ? 0
          : this.scores[1] > this.scores[0]
            ? 1
            : -1;
      if (this.onMatchEnd) this.onMatchEnd(this.winner, this.scores);
      return;
    }

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

    for (let t = 0; t < 2; t++) {
      if (this.comboTimer[t] > 0) {
        this.comboTimer[t] -= dt;
        if (this.comboTimer[t] <= 0) {
          this.combo[t] = 0;
        }
      }
    }
  }

  getTimerDisplay(): string {
    const secs = Math.ceil(this.timer);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
}
