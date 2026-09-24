/**
 * BOUNCEBACK! — Procedural Audio (Web Audio API, zero file downloads)
 */

let ctx = null;
let masterGain = null;

export function initAudio() {
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.4;
  masterGain.connect(ctx.destination);
}

export function resumeAudio() {
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

function playTone(freq, dur, type = 'sine', vol = 0.3, decay = true) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  if (decay) gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + dur);
}

function playNoise(dur, vol = 0.2) {
  if (!ctx) return;
  const bufSize = ctx.sampleRate * dur;
  const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const gain = ctx.createGain();
  gain.gain.value = vol;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 800;
  src.connect(lp);
  lp.connect(gain);
  gain.connect(masterGain);
  src.start(ctx.currentTime);
}

export function sfxPunch() {
  playNoise(0.12, 0.35);
  playTone(120, 0.15, 'square', 0.2);
  playTone(80, 0.08, 'sawtooth', 0.15);
}

export function sfxWhiff() {
  playTone(300, 0.08, 'sine', 0.1);
}

export function sfxBumperHit(comboCount) {
  // Rising pitch arpeggio based on combo
  const baseFreq = 440 + comboCount * 80;
  playTone(baseFreq, 0.12, 'sine', 0.25);
  playTone(baseFreq * 1.25, 0.1, 'sine', 0.2);
}

export function sfxGoal() {
  // Stadium horn
  playTone(220, 0.4, 'sawtooth', 0.3, false);
  playTone(330, 0.4, 'sawtooth', 0.2, false);
  playTone(440, 0.5, 'sawtooth', 0.25);
  setTimeout(() => {
    playTone(554, 0.6, 'sawtooth', 0.25);
  }, 200);
}

export function sfxDash() {
  playTone(200, 0.08, 'sawtooth', 0.15);
  playNoise(0.06, 0.15);
}

export function sfxOverdrive() {
  // Alarm siren
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.value = 600;
  osc.frequency.linearRampToValueAtTime(900, ctx.currentTime + 0.3);
  osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.6);
  gain.gain.value = 0.2;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.8);
}

export function sfxCombo(level) {
  const base = 523 + level * 120; // C5 and up
  playTone(base, 0.1, 'sine', 0.2);
  setTimeout(() => playTone(base * 1.5, 0.12, 'sine', 0.18), 60);
}

export function sfxWhistle() {
  playTone(880, 0.15, 'sine', 0.3);
  setTimeout(() => playTone(1100, 0.3, 'sine', 0.25), 160);
}

export function sfxGameOver() {
  playTone(440, 0.3, 'sawtooth', 0.2);
  setTimeout(() => playTone(330, 0.3, 'sawtooth', 0.2), 300);
  setTimeout(() => playTone(220, 0.5, 'sawtooth', 0.25), 600);
}
