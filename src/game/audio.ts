/**
 * BOUNCEBACK! — Procedural Audio (Web Audio API, zero external file downloads)
 * Features:
 * - 100% MUTED by default to protect user's hearing
 * - Soft, comfortable low-gain synthesizer with gentle sine & triangle waveforms
 * - All ear-piercing frequencies (>550 Hz), harsh sawtooth/square buzzes, and noise screams removed
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let bgmGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let muted = true; // Start MUTED by default to protect user's ears

// BGM State
const BGM_VOLUME = 0.06; // Very gentle background music level
let bgmAudio: HTMLAudioElement | null = null;
let bgmPlaying = false;

let currentMasterVol = 0.20;
let currentBgmVol = BGM_VOLUME;
let currentSfxVol = 0.10;

export function initAudio() {
  if (ctx) return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AudioCtx();

    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : currentMasterVol;
    masterGain.connect(ctx.destination);

    bgmGain = ctx.createGain();
    bgmGain.gain.value = muted ? 0 : currentBgmVol;
    bgmGain.connect(masterGain);

    sfxGain = ctx.createGain();
    sfxGain.gain.value = muted ? 0 : currentSfxVol;
    sfxGain.connect(masterGain);
  } catch {
    // Audio context initialization fallback
  }
}

export function resumeAudio() {
  if (!ctx) initAudio();
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  if (!muted && bgmPlaying && bgmAudio && bgmAudio.paused) {
    bgmAudio.play().catch(() => {});
  }
}

// Auto-unlock audio context on user interaction (honors muted state strictly)
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    resumeAudio();
    if (!muted) {
      if (!bgmPlaying) {
        startBGM();
      } else if (bgmAudio && bgmAudio.paused) {
        bgmAudio.play().catch(() => {});
      }
    }
    window.removeEventListener("pointerdown", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
    window.removeEventListener("click", unlockAudio);
  };
  window.addEventListener("pointerdown", unlockAudio, { once: true });
  window.addEventListener("keydown", unlockAudio, { once: true });
  window.addEventListener("click", unlockAudio, { once: true });
}

export function setMuted(v: boolean) {
  muted = v;
  if (masterGain) {
    masterGain.gain.value = v ? 0 : currentMasterVol;
  }
  if (bgmAudio) {
    bgmAudio.volume = v ? 0 : currentBgmVol;
    if (v && !bgmAudio.paused) {
      bgmAudio.pause();
    } else if (!v && bgmPlaying && bgmAudio.paused) {
      bgmAudio.play().catch(() => {});
    }
  }
}

export function isMuted() {
  return muted;
}

export function setMasterVolume(val: number) {
  currentMasterVol = Math.max(0, Math.min(1, val));
  if (masterGain && !muted) {
    masterGain.gain.value = currentMasterVol;
  }
}

export function setBgmVolume(val: number) {
  currentBgmVol = Math.max(0, Math.min(1, val));
  if (bgmGain && !muted) {
    bgmGain.gain.value = currentBgmVol;
  }
  if (bgmAudio && !muted) {
    bgmAudio.volume = currentBgmVol;
  }
}

export function setSfxVolume(val: number) {
  currentSfxVol = Math.max(0, Math.min(1, val));
  if (sfxGain && !muted) {
    sfxGain.gain.value = currentSfxVol;
  }
}

export function getAudioSettings() {
  return {
    muted,
    masterVolume: currentMasterVol,
    bgmVolume: currentBgmVol,
    sfxVolume: currentSfxVol,
  };
}

/**
 * Safe procedural sound generator:
 * - Always clamped below 550 Hz (no high-frequency screeching)
 * - Safe low gain (max 0.05)
 * - Soft waveforms only (sine & triangle)
 */
function playTone(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.05,
  decay = true
) {
  if (!ctx || !sfxGain || muted) return;
  const safeFreq = Math.min(Math.max(freq, 40), 550);
  const safeVol = Math.min(vol * 0.25, 0.05);
  const safeType: OscillatorType = (type === "sawtooth" || type === "square") ? "triangle" : type;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = safeType;
    osc.frequency.setValueAtTime(safeFreq, ctx.currentTime);
    gain.gain.setValueAtTime(safeVol, ctx.currentTime);
    if (decay) {
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    }
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch {}
}

/**
 * Safe noise generator:
 * - Lowpass filtered below 350 Hz (soft muffled rumble only, zero hiss)
 * - Safe low gain (max 0.03)
 */
function playNoise(dur: number, vol = 0.03, filterFreq = 320) {
  if (!ctx || !sfxGain || muted) return;
  try {
    const safeVol = Math.min(vol * 0.2, 0.03);
    const bufSize = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.15;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(safeVol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = Math.min(filterFreq, 350);

    src.connect(lp);
    lp.connect(gain);
    gain.connect(sfxGain);
    src.start(ctx.currentTime);
  } catch {}
}

// ─── BGM Player ───
export function startBGM() {
  if (!ctx) initAudio();
  resumeAudio();
  if (bgmPlaying && bgmAudio && !bgmAudio.paused) return;
  bgmPlaying = true;

  try {
    if (!bgmAudio) {
      bgmAudio = new Audio("/Yellow_Shell_Hustle.mp3");
      bgmAudio.loop = true;
      bgmAudio.preload = "auto";
    }
    bgmAudio.volume = muted ? 0 : currentBgmVol;
    if (!muted) {
      bgmAudio.play().catch(() => {});
    }
  } catch {}
}

export function stopBGM() {
  bgmPlaying = false;
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio.currentTime = 0;
  }
}

// ─── Silenced Aggressive Sounds (Zero ear irritation) ───
export function sfxCrowdCheer(_intensity = 1.0) {
  // Silenced white noise hiss
  return;
}

export function sfxPunchCheer() {
  // Silenced referee whistle & high beeps
  return;
}

export function sfxWhistle() {
  // Silenced screeching whistle
  return;
}

export function sfxBoxingBell() {
  // Silenced loud ringing bell
  return;
}

export function sfxRoundCountdownTick(_remaining: number) {
  // Silenced countdown alarm
  return;
}

export function sfxRoundBuzzer() {
  // Silenced loud buzzer horn
  return;
}

export function sfxStarDing(_starIndex: number = 1) {
  // Silenced piercing high chime
  return;
}

export function sfxDisasterSiren() {
  // Silenced screeching emergency siren
  return;
}

export function sfxTornado() {
  // Silenced howling whistling noise
  return;
}

export function sfxEarthquake() {
  // Silenced harsh buzzing
  return;
}

export function sfxGongHit() {
  // Silenced metal gong
  return;
}

// ─── Soft & Gentle Action SFX ───
export function sfxPunch() {
  if (!ctx || !sfxGain || muted) return;
  // Soft, warm cartoon pop/thump
  playTone(85, 0.1, "sine", 0.05);
  playTone(55, 0.12, "triangle", 0.04);
}

export function sfxWhiff() {
  if (!ctx || !sfxGain || muted) return;
  playTone(180, 0.05, "sine", 0.02);
}

export function sfxBoing() {
  if (!ctx || !sfxGain || muted) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.3);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.32);
  } catch {}
}

export function sfxBumperHit(_comboCount: number = 0) {
  if (!ctx || !sfxGain || muted) return;
  try {
    const now = ctx.currentTime;
    // Pleasant warm rubber cartoon bounce (no high metal bell)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.14);
  } catch {}
}

export function sfxStadiumAirhorn() {
  if (!ctx || !sfxGain || muted) return;
  try {
    // Gentle warm brass triad chord
    const hornNotes = [233.08, 293.66, 349.23]; // Bb3, D4, F4
    const now = ctx.currentTime;
    for (const freq of hornNotes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 450;

      osc.connect(lp);
      lp.connect(gain);
      gain.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch {}
}

export function sfxGoal() {
  if (!ctx || !sfxGain || muted) return;
  sfxStadiumAirhorn();
  playTone(261.63, 0.3, "triangle", 0.04);
  playTone(329.63, 0.3, "triangle", 0.04);
  playTone(392.00, 0.3, "triangle", 0.04);
}

export function sfxLethalHit() {
  if (!ctx || !sfxGain || muted) return;
  playNoise(0.15, 0.04, 250);
  playTone(95, 0.2, "sine", 0.05);
}

/**
 * Gentle warm bell (soft low chime ~440 Hz)
 */
export function sfxQuizDing() {
  if (!ctx || !sfxGain || muted) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, now);
    g.gain.setValueAtTime(0.04, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch {}
}

export function sfxRingOut() {
  sfxGoal();
}

export function sfxDash() {
  playTone(160, 0.08, "triangle", 0.03);
}

export function sfxOverdrive() {
  if (!ctx || !sfxGain || muted) return;
  playTone(280, 0.3, "triangle", 0.04);
}

export function sfxCombo(level: number) {
  playTone(220 + Math.min(level, 5) * 30, 0.08, "sine", 0.03);
}

export function sfxGameOver() {
  stopBGM();
  playTone(180, 0.4, "triangle", 0.04);
}

export function sfxCountBeep() {
  playTone(380, 0.08, "sine", 0.03);
}

export function sfxRoundVictoryFanfare(_team: number) {
  if (!ctx || !sfxGain || muted) return;
  const notes = [261.63, 329.63, 392.0, 523.25];
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playTone(freq, 0.2, "triangle", 0.04);
    }, idx * 100);
  });
}

export function sfxRoundTransitionWhoosh() {
  if (!ctx || !sfxGain || muted) return;
  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.1);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.25);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.03, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(t);
    osc.stop(t + 0.25);
  } catch {}
}

export function sfxGrandChampionshipVictory() {
  if (!ctx || !sfxGain || muted) return;
  const notes = [261.63, 329.63, 392.0, 523.25];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.3, "triangle", 0.04), i * 150);
  });
}

export function sfxConfettiPop() {
  if (!ctx || !sfxGain || muted) return;
  playTone(180, 0.08, "sine", 0.03);
}

export function sfxMatchStart() {
  playTone(261.63, 0.12, "triangle", 0.04);
  setTimeout(() => playTone(329.63, 0.12, "triangle", 0.04), 100);
  setTimeout(() => playTone(392.00, 0.2, "triangle", 0.04), 200);
}

// ─── Skill SFX ───
export function sfxSkillSpawn() {
  playTone(349.23, 0.1, "sine", 0.03);
  setTimeout(() => playTone(440.0, 0.12, "sine", 0.03), 80);
}

export function sfxSkillAcquire() {
  playTone(261.63, 0.08, "triangle", 0.04);
  setTimeout(() => playTone(329.63, 0.08, "triangle", 0.04), 70);
  setTimeout(() => playTone(392.0, 0.12, "triangle", 0.04), 140);
}

export function sfxSkillActivate() {
  playTone(160, 0.15, "sine", 0.04);
}

export function sfxVoteCheer() {
  playTone(392, 0.06, "sine", 0.03);
}

export function sfxPickup() {
  playTone(330, 0.06, "sine", 0.03);
  setTimeout(() => playTone(440, 0.08, "sine", 0.03), 60);
}

export function sfxGigaFist() {
  playTone(70, 0.18, "sine", 0.05);
  playNoise(0.12, 0.03, 240);
}

export function sfxBananaSlip() {
  sfxBoing();
}

export function sfxRocket() {
  if (!ctx || !sfxGain || muted) return;
  playTone(120, 0.25, "triangle", 0.04);
}

export function sfxMagnet() {
  playTone(180, 0.25, "sine", 0.03);
}

export function sfxBombExplode() {
  playTone(55, 0.25, "sine", 0.05);
  playNoise(0.2, 0.04, 250);
}

export function sfxShrink() {
  playTone(260, 0.15, "triangle", 0.03);
}

export function sfxOnePunch() {
  playTone(60, 0.3, "sine", 0.06);
  playNoise(0.15, 0.04, 250);
}

// ─── Broadcast / Show SFX ───
export function sfxTVOpener() {
  playTone(261.63, 0.15, "triangle", 0.04);
  setTimeout(() => playTone(329.63, 0.15, "triangle", 0.04), 90);
  setTimeout(() => playTone(392.0, 0.2, "triangle", 0.04), 180);
}

export function sfxTVCountdown(step: number) {
  if (step > 0) {
    playTone(260 + (3 - step) * 40, 0.08, "sine", 0.03);
  } else {
    playTone(440, 0.2, "triangle", 0.04);
  }
}

export function sfxCommentatorGasp() {
  playNoise(0.04, 0.03, 300);
}

export function sfxVoteStart() {
  playTone(329.63, 0.08, "sine", 0.03);
  setTimeout(() => playTone(440.0, 0.12, "triangle", 0.03), 80);
}

export function sfxVoteTick() {
  playTone(392, 0.03, "sine", 0.02);
}

export function sfxMeteorIncoming() {
  playTone(180, 0.25, "sine", 0.03);
}

export function sfxMeteorExplode() {
  playTone(50, 0.3, "sine", 0.05);
  playNoise(0.2, 0.04, 250);
}

export function sfxLaserBeam() {
  playTone(240, 0.2, "triangle", 0.03);
}

export function sfxBlackHole() {
  playTone(120, 0.3, "sine", 0.04);
}
