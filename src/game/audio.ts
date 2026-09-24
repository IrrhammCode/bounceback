/**
 * BOUNCEBACK! — Procedural Audio (Web Audio API, zero file downloads)
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = false;

export function initAudio() {
  ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.4;
  masterGain.connect(ctx.destination);
}

export function resumeAudio() {
  if (ctx && ctx.state === "suspended") ctx.resume();
}

export function setMuted(v: boolean) {
  muted = v;
  if (masterGain) masterGain.gain.value = v ? 0 : 0.4;
}
export function isMuted() {
  return muted;
}

function playTone(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.3,
  decay = true
) {
  if (!ctx || !masterGain) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  if (decay)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + dur);
}

function playNoise(dur: number, vol = 0.2) {
  if (!ctx || !masterGain) return;
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
  lp.type = "lowpass";
  lp.frequency.value = 800;
  src.connect(lp);
  lp.connect(gain);
  gain.connect(masterGain);
  src.start(ctx.currentTime);
}

export function sfxPunch() {
  playNoise(0.12, 0.35);
  playTone(120, 0.15, "square", 0.2);
  playTone(80, 0.08, "sawtooth", 0.15);
}

export function sfxWhiff() {
  playTone(300, 0.08, "sine", 0.1);
}

export function sfxBumperHit(comboCount: number) {
  const baseFreq = 440 + comboCount * 80;
  playTone(baseFreq, 0.12, "sine", 0.25);
  playTone(baseFreq * 1.25, 0.1, "sine", 0.2);
}

export function sfxGoal() {
  playTone(220, 0.4, "sawtooth", 0.3, false);
  playTone(330, 0.4, "sawtooth", 0.2, false);
  playTone(440, 0.5, "sawtooth", 0.25);
  setTimeout(() => {
    playTone(554, 0.6, "sawtooth", 0.25);
  }, 200);
}

export function sfxDash() {
  playTone(200, 0.08, "sawtooth", 0.15);
  playNoise(0.06, 0.15);
}

export function sfxOverdrive() {
  if (!ctx || !masterGain) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
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

export function sfxCombo(level: number) {
  const base = 523 + level * 120;
  playTone(base, 0.1, "sine", 0.2);
  setTimeout(() => playTone(base * 1.5, 0.12, "sine", 0.18), 60);
}

export function sfxWhistle() {
  playTone(880, 0.15, "sine", 0.3);
  setTimeout(() => playTone(1100, 0.3, "sine", 0.25), 160);
}

export function sfxGameOver() {
  playTone(440, 0.3, "sawtooth", 0.2);
  setTimeout(() => playTone(330, 0.3, "sawtooth", 0.2), 300);
  setTimeout(() => playTone(220, 0.5, "sawtooth", 0.25), 600);
}

export function sfxCountBeep() {
  playTone(660, 0.12, "sine", 0.25);
}

export function sfxMatchStart() {
  playTone(440, 0.15, "sine", 0.3);
  setTimeout(() => playTone(660, 0.15, "sine", 0.3), 120);
  setTimeout(() => playTone(880, 0.3, "sine", 0.35), 240);
}

// ─── Skill SFX ───

export function sfxPickup() {
  // Coin collect jingle: two ascending bright tones
  playTone(880, 0.08, "sine", 0.3);
  setTimeout(() => playTone(1320, 0.15, "sine", 0.35), 70);
}

export function sfxGigaFist() {
  // Honk + heavy impact
  playTone(80, 0.2, "sawtooth", 0.4);
  playNoise(0.15, 0.4);
  playTone(150, 0.15, "square", 0.25);
  setTimeout(() => playTone(60, 0.3, "sawtooth", 0.2), 100);
}

export function sfxBananaSlip() {
  // Descending slide whistle
  if (!ctx || !masterGain) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 1200;
  osc.frequency.linearRampToValueAtTime(300, ctx.currentTime + 0.4);
  gain.gain.value = 0.25;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);
}

export function sfxRocket() {
  // Ascending roar
  if (!ctx || !masterGain) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.value = 100;
  osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.3);
  gain.gain.value = 0.3;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.6);
  playNoise(0.3, 0.25);
}

export function sfxMagnet() {
  // Warble hum
  if (!ctx || !masterGain) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 220;
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 8;
  lfoGain.gain.value = 40;
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  lfo.start(ctx.currentTime);
  lfo.stop(ctx.currentTime + 0.6);
  gain.gain.value = 0.25;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.6);
}

export function sfxBombExplode() {
  // Heavy boom + noise
  playTone(60, 0.5, "sawtooth", 0.4);
  playTone(40, 0.4, "square", 0.3);
  playNoise(0.4, 0.5);
  setTimeout(() => playNoise(0.3, 0.2), 150);
}

export function sfxShrink() {
  // Ascending zap
  if (!ctx || !masterGain) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = 400;
  osc.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 0.2);
  gain.gain.value = 0.2;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}
