/**
 * BOUNCEBACK! — Procedural Audio (Web Audio API, zero external file downloads)
 * Features:
 * - Upbeat Fall Guys / Nintendo Arcade procedural BGM synthesizer
 * - Realistic crowd cheering roar ("Wooo!") via resonant noise bandpass
 * - Stadium goal airhorn, cartoon boing, whistle trill, and juicy impact SFX
 */

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let bgmGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let muted = false;

// BGM State
let bgmInterval: number | null = null;
let bgmStep = 0;
let bgmPlaying = false;

export function initAudio() {
  if (ctx) return;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new AudioCtx();

  masterGain = ctx.createGain();
  masterGain.gain.value = 0.45;
  masterGain.connect(ctx.destination);

  bgmGain = ctx.createGain();
  bgmGain.gain.value = 0.22;
  bgmGain.connect(masterGain);

  sfxGain = ctx.createGain();
  sfxGain.gain.value = 0.55;
  sfxGain.connect(masterGain);
}

export function resumeAudio() {
  if (!ctx) initAudio();
  if (ctx && ctx.state === "suspended") {
    ctx.resume();
  }
}

export function setMuted(v: boolean) {
  muted = v;
  if (masterGain) {
    masterGain.gain.value = v ? 0 : 0.45;
  }
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
  if (!ctx || !sfxGain || muted) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    if (decay) {
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    }
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch {
    // Audio safe fallback
  }
}

function playNoise(dur: number, vol = 0.2, filterFreq = 800) {
  if (!ctx || !sfxGain || muted) return;
  try {
    const bufSize = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;

    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = filterFreq;

    src.connect(lp);
    lp.connect(gain);
    gain.connect(sfxGain);
    src.start(ctx.currentTime);
  } catch {
    // Audio safe fallback
  }
}

// ─── Procedural Fall Guys Arcade BGM Loop ───
export function startBGM() {
  if (!ctx) initAudio();
  resumeAudio();
  if (bgmPlaying) return;
  bgmPlaying = true;
  bgmStep = 0;

  // 128 BPM = 16th note interval ~ 117.18ms
  const stepMs = (60 / 128 / 4) * 1000;

  // Cheerful pentatonic melody & bouncy bass notes (Hz)
  const bassNotes = [
    130.81, 0, 130.81, 0, 164.81, 0, 146.83, 0, // C3, E3, D3
    130.81, 0, 196.00, 0, 174.61, 0, 146.83, 0, // C3, G3, F3, D3
    130.81, 0, 130.81, 0, 164.81, 0, 196.00, 0, // C3, E3, G3
    220.00, 0, 196.00, 0, 164.81, 0, 146.83, 0  // A3, G3, E3, D3
  ];

  const leadNotes = [
    523.25, 0, 659.25, 523.25, 0, 783.99, 0, 659.25,
    0, 523.25, 0, 587.33, 659.25, 0, 523.25, 0,
    783.99, 0, 880.00, 0, 783.99, 659.25, 0, 523.25,
    587.33, 659.25, 587.33, 0, 523.25, 0, 0, 0
  ];

  const chordProg = [
    [261.63, 329.63, 392.00], // C maj
    [293.66, 349.23, 440.00], // D min
    [329.63, 392.00, 493.88], // E min
    [349.23, 440.00, 523.25], // F maj
  ];

  bgmInterval = window.setInterval(() => {
    if (!ctx || !bgmGain || muted || !bgmPlaying) return;
    const now = ctx.currentTime;
    const step = bgmStep % 32;

    // 1. Kick Drum (every 4 steps: 0, 4, 8, 12...)
    if (step % 4 === 0) {
      try {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);
        g.gain.setValueAtTime(0.35, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.connect(g);
        g.connect(bgmGain);
        osc.start(now);
        osc.stop(now + 0.09);
      } catch {}
    }

    // 2. Snare / Clap (on beats 4 and 12 of each 16)
    if (step % 8 === 4) {
      try {
        const bufSize = Math.floor(ctx.sampleRate * 0.08);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.4;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 1400;
        src.connect(bp);
        bp.connect(g);
        g.connect(bgmGain);
        src.start(now);
      } catch {}
    }

    // 3. Hi-Hat (every odd 16th step)
    if (step % 2 === 1) {
      try {
        const bufSize = Math.floor(ctx.sampleRate * 0.03);
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * 0.25;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.08, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 6000;
        src.connect(hp);
        hp.connect(g);
        g.connect(bgmGain);
        src.start(now);
      } catch {}
    }

    // 4. Bass synth (bouncy saw)
    const bFreq = bassNotes[step];
    if (bFreq > 0) {
      try {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(bFreq, now);
        g.gain.setValueAtTime(0.18, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 600;
        osc.connect(lp);
        lp.connect(g);
        g.connect(bgmGain);
        osc.start(now);
        osc.stop(now + 0.12);
      } catch {}
    }

    // 5. Offbeat Chord Stabs (every 4 steps offbeat: 2, 6, 10...)
    if (step % 4 === 2) {
      const chord = chordProg[Math.floor(step / 8) % chordProg.length];
      for (const cf of chord) {
        try {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(cf, now);
          g.gain.setValueAtTime(0.08, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
          osc.connect(g);
          g.connect(bgmGain);
          osc.start(now);
          osc.stop(now + 0.11);
        } catch {}
      }
    }

    // 6. Lead melody (sweet square wave with vibrato)
    const lFreq = leadNotes[step];
    if (lFreq > 0) {
      try {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(lFreq, now);
        g.gain.setValueAtTime(0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(g);
        g.connect(bgmGain);
        osc.start(now);
        osc.stop(now + 0.14);
      } catch {}
    }

    bgmStep++;
  }, stepMs);
}

export function stopBGM() {
  bgmPlaying = false;
  if (bgmInterval !== null) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
}

// ─── Realistic Crowd Cheering ("Woooo-YEAAAH!") ───
export function sfxCrowdCheer(intensity = 1.0) {
  if (!ctx || !sfxGain || muted) return;
  try {
    const dur = 1.8 * intensity;
    const bufSize = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.35;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28 * intensity, now + 0.35);
    gain.gain.linearRampToValueAtTime(0.32 * intensity, now + 0.9);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    // Formant resonant filter (vocal crowd vowel)
    const bp1 = ctx.createBiquadFilter();
    bp1.type = "bandpass";
    bp1.frequency.setValueAtTime(650, now);
    bp1.frequency.linearRampToValueAtTime(950, now + 0.8);
    bp1.Q.value = 2.2;

    const bp2 = ctx.createBiquadFilter();
    bp2.type = "bandpass";
    bp2.frequency.setValueAtTime(1400, now);
    bp2.frequency.linearRampToValueAtTime(1800, now + 0.8);
    bp2.Q.value = 3.0;

    src.connect(bp1);
    src.connect(bp2);
    bp1.connect(gain);
    bp2.connect(gain);
    gain.connect(sfxGain);

    src.start(now);
  } catch {}
}

// ─── Cartoon Boing / Spring Bounce ───
export function sfxBoing() {
  if (!ctx || !sfxGain || muted) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = "sine";
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.22);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.38);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch {}
}

// ─── Stadium Airhorn & Goal Siren ───
export function sfxStadiumAirhorn() {
  if (!ctx || !sfxGain || muted) return;
  try {
    const hornNotes = [233.08, 293.66, 349.23]; // Bb3, D4, F4 brass chord
    const now = ctx.currentTime;
    for (const freq of hornNotes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1600;

      osc.connect(lp);
      lp.connect(gain);
      gain.connect(sfxGain);
      osc.start(now);
      osc.stop(now + 0.7);
    }

    // Warbling Goal Siren
    setTimeout(() => {
      if (!ctx || !sfxGain || muted) return;
      const siren = ctx.createOscillator();
      const sGain = ctx.createGain();
      const sNow = ctx.currentTime;
      siren.type = "triangle";
      siren.frequency.setValueAtTime(500, sNow);
      siren.frequency.linearRampToValueAtTime(900, sNow + 0.3);
      siren.frequency.linearRampToValueAtTime(500, sNow + 0.6);
      siren.frequency.linearRampToValueAtTime(900, sNow + 0.9);
      sGain.gain.setValueAtTime(0.2, sNow);
      sGain.gain.exponentialRampToValueAtTime(0.001, sNow + 1.1);

      siren.connect(sGain);
      sGain.connect(sfxGain);
      siren.start(sNow);
      siren.stop(sNow + 1.1);
    }, 250);
  } catch {}
}

// ─── Action Sound Effects ───
export function sfxPunch() {
  playNoise(0.12, 0.35, 1200);
  playTone(130, 0.15, "square", 0.25);
  playTone(70, 0.1, "sawtooth", 0.2);
}

export function sfxWhiff() {
  playTone(320, 0.08, "sine", 0.12);
}

export function sfxBumperHit(comboCount: number) {
  sfxBoing();
  const baseFreq = 440 + Math.min(comboCount, 8) * 80;
  playTone(baseFreq, 0.14, "sine", 0.28);
  playTone(baseFreq * 1.25, 0.12, "triangle", 0.22);
}

export function sfxGoal() {
  sfxStadiumAirhorn();
  sfxCrowdCheer(1.3);
  playTone(220, 0.4, "sawtooth", 0.3, false);
  playTone(330, 0.4, "sawtooth", 0.2, false);
  playTone(440, 0.5, "sawtooth", 0.25);
  setTimeout(() => {
    playTone(554, 0.6, "sawtooth", 0.25);
  }, 200);
}

export function sfxDash() {
  playTone(220, 0.09, "sawtooth", 0.18);
  playNoise(0.07, 0.18, 2200);
}

export function sfxOverdrive() {
  sfxCrowdCheer(1.1);
  if (!ctx || !sfxGain || muted) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(1050, ctx.currentTime + 0.35);
  osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.7);
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.9);
}

export function sfxCombo(level: number) {
  const base = 523 + level * 120;
  playTone(base, 0.1, "sine", 0.2);
  setTimeout(() => playTone(base * 1.5, 0.12, "sine", 0.18), 60);
  if (level >= 3) {
    sfxCrowdCheer(0.8);
  }
}

export function sfxWhistle() {
  // Realistic dual-tone trilling whistle
  if (!ctx || !sfxGain || muted) return;
  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = "sine";
  osc1.frequency.setValueAtTime(940, now);
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(985, now);

  gain.gain.setValueAtTime(0.28, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(sfxGain);

  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + 0.35);
  osc2.stop(now + 0.35);

  setTimeout(() => {
    if (!ctx || !sfxGain || muted) return;
    const n = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(1150, n);
    g.gain.setValueAtTime(0.32, n);
    g.gain.exponentialRampToValueAtTime(0.001, n + 0.45);
    o.connect(g);
    g.connect(sfxGain);
    o.start(n);
    o.stop(n + 0.45);
  }, 140);
}

export function sfxGameOver() {
  stopBGM();
  playTone(440, 0.3, "sawtooth", 0.25);
  setTimeout(() => playTone(330, 0.3, "sawtooth", 0.25), 300);
  setTimeout(() => playTone(220, 0.6, "sawtooth", 0.3), 600);
}

export function sfxCountBeep() {
  playTone(660, 0.12, "sine", 0.25);
}

export function sfxMatchStart() {
  startBGM();
  sfxWhistle();
  sfxCrowdCheer(0.9);
  playTone(440, 0.15, "sine", 0.3);
  setTimeout(() => playTone(660, 0.15, "sine", 0.3), 120);
  setTimeout(() => playTone(880, 0.3, "sine", 0.35), 240);
}

// ─── Skill SFX ───
export function sfxPickup() {
  playTone(880, 0.08, "sine", 0.3);
  setTimeout(() => playTone(1320, 0.15, "sine", 0.35), 70);
}

export function sfxGigaFist() {
  sfxCrowdCheer(0.9);
  playTone(80, 0.2, "sawtooth", 0.45);
  playNoise(0.18, 0.45, 1400);
  playTone(150, 0.15, "square", 0.3);
  setTimeout(() => playTone(60, 0.3, "sawtooth", 0.25), 100);
}

export function sfxBananaSlip() {
  sfxBoing();
  if (!ctx || !sfxGain || muted) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(1300, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(260, ctx.currentTime + 0.45);
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);
}

export function sfxRocket() {
  if (!ctx || !sfxGain || muted) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(100, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(450, ctx.currentTime + 0.35);
  gain.gain.setValueAtTime(0.35, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.65);
  playNoise(0.35, 0.3, 1800);
}

export function sfxMagnet() {
  if (!ctx || !sfxGain || muted) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(220, ctx.currentTime);
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(9, ctx.currentTime);
  lfoGain.gain.setValueAtTime(45, ctx.currentTime);
  lfo.connect(lfoGain);
  lfoGain.connect(osc.frequency);
  lfo.start(ctx.currentTime);
  lfo.stop(ctx.currentTime + 0.6);
  gain.gain.setValueAtTime(0.28, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.6);
}

export function sfxBombExplode() {
  sfxCrowdCheer(1.0);
  playTone(60, 0.5, "sawtooth", 0.45);
  playTone(40, 0.4, "square", 0.35);
  playNoise(0.45, 0.55, 1000);
  setTimeout(() => playNoise(0.3, 0.25, 600), 150);
}

export function sfxShrink() {
  if (!ctx || !sfxGain || muted) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(2200, ctx.currentTime + 0.25);
  gain.gain.setValueAtTime(0.22, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.35);
}
