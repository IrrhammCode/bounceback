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
const BGM_VOLUME = 0.16; // Balanced volume so SFX, punches, and hits are crisp and clear
let bgmAudio: HTMLAudioElement | null = null;
let bgmPlaying = false;

export function initAudio() {
  if (ctx) return;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  ctx = new AudioCtx();

  masterGain = ctx.createGain();
  masterGain.gain.value = 0.55;
  masterGain.connect(ctx.destination);

  // Balanced volume: BGM 0.20 so SFX at 0.70 pop crisp and clear!
  bgmGain = ctx.createGain();
  bgmGain.gain.value = 0.20;
  bgmGain.connect(masterGain);

  sfxGain = ctx.createGain();
  sfxGain.gain.value = 0.70;
  sfxGain.connect(masterGain);
}

export function resumeAudio() {
  if (!ctx) initAudio();
  if (ctx && ctx.state === "suspended") {
    ctx.resume();
  }
  if (bgmPlaying && bgmAudio && bgmAudio.paused) {
    bgmAudio.play().catch(() => {});
  }
}

// Auto-unlock audio and start BGM on immediate launch or first interaction
if (typeof window !== "undefined") {
  const unlockAudio = () => {
    resumeAudio();
    if (!bgmPlaying) {
      startBGM();
    } else if (bgmAudio && bgmAudio.paused) {
      bgmAudio.play().catch(() => {});
    }
    window.removeEventListener("pointerdown", unlockAudio);
    window.removeEventListener("keydown", unlockAudio);
    window.removeEventListener("click", unlockAudio);
  };
  window.addEventListener("pointerdown", unlockAudio, { once: true });
  window.addEventListener("keydown", unlockAudio, { once: true });
  window.addEventListener("click", unlockAudio, { once: true });

  // Immediate attempt on localhost load
  setTimeout(() => {
    startBGM();
  }, 50);
}

export function setMuted(v: boolean) {
  muted = v;
  if (masterGain) {
    masterGain.gain.value = v ? 0 : 0.45;
  }
  if (bgmAudio) {
    bgmAudio.volume = v ? 0 : BGM_VOLUME;
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

// ─── Yellow Shell Hustle BGM Player (AI Generated Audio Asset) ───
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
    bgmAudio.volume = muted ? 0 : BGM_VOLUME;
    const p = bgmAudio.play();
    if (p !== undefined) {
      p.catch(() => {
        // Autoplay wait for user gesture; will automatically resume on next interaction
      });
    }
  } catch (err) {
    console.warn("HTML5 audio playback error", err);
  }
}

export function stopBGM() {
  bgmPlaying = false;
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio.currentTime = 0;
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
export function sfxPunchCheer() {
  // Enthusiastic stadium crowd roar
  sfxCrowdCheer(1.25);
  // Sharp referee party whistle
  playTone(1900, 0.12, "sine", 0.22);
  setTimeout(() => playTone(2600, 0.16, "sine", 0.28), 70);
  // Joyful rising brass fanfare chords (C5 -> E5 -> G5 -> C6)
  setTimeout(() => {
    playTone(523.25, 0.16, "triangle", 0.28);
    playTone(659.25, 0.16, "triangle", 0.24);
  }, 90);
  setTimeout(() => {
    playTone(783.99, 0.22, "sawtooth", 0.3);
    playTone(1046.5, 0.26, "sawtooth", 0.25);
  }, 190);
}

export function sfxPunch() {
  // Heavy visceral punch bass impact & crack
  playNoise(0.2, 0.5, 1200);
  playTone(85, 0.25, "square", 0.5);
  playTone(45, 0.28, "sawtooth", 0.4);
  // Stadium crowd excited celebration cheer!
  sfxPunchCheer();
}

export function sfxWhiff() {
  playTone(320, 0.08, "sine", 0.12);
  playNoise(0.08, 0.15, 2400);
}

export function sfxBumperHit(comboCount: number = 0) {
  if (!ctx || !sfxGain || muted) return;
  try {
    const now = ctx.currentTime;

    // 1. High metallic pinball bell chime (1760Hz - 2400Hz harmonic pair)
    const bellFreq = 1760 + Math.min(comboCount, 6) * 110;
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(bellFreq, now);
    g1.gain.setValueAtTime(0.4, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc1.connect(g1);
    g1.connect(sfxGain);
    osc1.start(now);
    osc1.stop(now + 0.28);

    // 2. Secondary bell chime overtone (1.5x frequency)
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(bellFreq * 1.5, now);
    g2.gain.setValueAtTime(0.25, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc2.connect(g2);
    g2.connect(sfxGain);
    osc2.start(now);
    osc2.stop(now + 0.22);

    // 3. Heavy mechanical solenoid thwack
    const thwack = ctx.createOscillator();
    const tg = ctx.createGain();
    thwack.type = "triangle";
    thwack.frequency.setValueAtTime(140, now);
    thwack.frequency.exponentialRampToValueAtTime(45, now + 0.12);
    tg.gain.setValueAtTime(0.5, now);
    tg.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    thwack.connect(tg);
    tg.connect(sfxGain);
    thwack.start(now);
    thwack.stop(now + 0.14);

    // 4. Spring boing undertone
    sfxBoing();
  } catch {}
}

// ─── Skill Box Spawn Fanfare ───
export function sfxSkillSpawn() {
  if (!ctx || !sfxGain || muted) return;
  try {
    const now = ctx.currentTime;
    const notes = [587.33, 739.99, 880.0, 1174.66]; // D5, F#5, A5, D6 shimmer
    notes.forEach((freq, idx) => {
      const t = now + idx * 0.055;
      const osc = ctx!.createOscillator();
      const g = ctx!.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(g);
      g.connect(sfxGain!);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  } catch {}
}

// ─── Power-Up Acquired Jingle ───
export function sfxSkillAcquire() {
  if (!ctx || !sfxGain || muted) return;
  try {
    const now = ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.5]; // C5 -> E5 -> G5 -> C6
    chord.forEach((freq, idx) => {
      const t = now + idx * 0.06;
      const osc = ctx!.createOscillator();
      const g = ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(g);
      g.connect(sfxGain!);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  } catch {}
}

// ─── Skill Activation Supersonic Release SFX ───
export function sfxSkillActivate() {
  if (!ctx || !sfxGain || muted) return;
  try {
    const now = ctx.currentTime;
    // High-energy ascending chord + whoosh
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(1480, now + 0.22);
    g.gain.setValueAtTime(0.35, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.35);

    // Sub-bass thump
    const sub = ctx.createOscillator();
    const subG = ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(160, now);
    sub.frequency.exponentialRampToValueAtTime(45, now + 0.3);
    subG.gain.setValueAtTime(0.45, now);
    subG.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    sub.connect(subG);
    subG.connect(sfxGain);
    sub.start(now);
    sub.stop(now + 0.3);
  } catch {}
}

// ─── Live Audience Vote Surge Cheer ───
export function sfxVoteCheer() {
  if (!ctx || !sfxGain || muted) return;
  try {
    playTone(880, 0.08, "triangle", 0.08);
  } catch {}
}

// ─── Goal / Ring-Out Fanfare ───
export function sfxGongHit() {
  // Gong sound fully removed — replaced by stadium crowd cheers
  sfxCrowdCheer(1.5);
}

export function sfxGoal() {
  sfxStadiumAirhorn();
  sfxCrowdCheer(2.2);
  playTone(220, 0.4, "sawtooth", 0.3, false);
  playTone(330, 0.4, "sawtooth", 0.2, false);
  playTone(440, 0.5, "sawtooth", 0.25);
  setTimeout(() => {
    playTone(554, 0.6, "sawtooth", 0.25);
  }, 200);
}

export function sfxLethalHit() {
  if (!ctx || !sfxGain || muted) return;
  const now = ctx.currentTime;
  playNoise(0.35, 0.45, 420);
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);
    g.gain.setValueAtTime(0.75, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc.connect(g);
    g.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.38);
  } catch {}
  playTone(920, 0.12, "sawtooth", 0.4);
}

export function sfxRingOut() {
  sfxStadiumAirhorn();
  sfxCrowdCheer(2.5); // Thunderous cheering roar!
  playTone(220, 0.3, "sawtooth", 0.4, false);
  playTone(330, 0.3, "sawtooth", 0.35, false);
  playTone(440, 0.45, "sawtooth", 0.4);
  setTimeout(() => {
    playTone(660, 0.55, "sawtooth", 0.4);
  }, 140);
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
  sfxCrowdCheer(1.6);
}

export function sfxCountBeep() {
  playTone(660, 0.12, "sine", 0.25);
}

// ─── High-Voltage Round Countdown & Finale SFX ───
export function sfxRoundCountdownTick(_remaining: number) {
  // Silenced per user request: removed annoying loud countdown reminder alarm
  return;
}

export function sfxRoundBuzzer() {
  // Silenced per user request: removed harsh horn buzzer alarm
  return;
}

export function sfxRoundVictoryFanfare(team: number) {
  const audioCtx = ctx;
  const audioGain = sfxGain;
  if (!audioCtx || !audioGain || muted) return;
  try {
    sfxCrowdCheer(1.5);
    const t = audioCtx.currentTime;

    // Triumphant 4-note brass fanfare
    const notes = team === 0
      ? [392.0, 523.25, 659.25, 783.99] // G4, C5, E5, G5 (Cyan bright triumph)
      : [349.23, 440.0, 523.25, 698.46]; // F4, A4, C5, F5 (Coral bold glory)

    notes.forEach((freq, idx) => {
      const noteStart = t + idx * 0.16;
      const noteDur = idx === notes.length - 1 ? 0.75 : 0.22;

      const osc = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, noteStart);
      osc2.type = "square";
      osc2.frequency.setValueAtTime(freq * 1.002, noteStart);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1800, noteStart);

      gain.gain.setValueAtTime(0.001, noteStart);
      gain.gain.linearRampToValueAtTime(0.48, noteStart + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDur);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(audioGain);

      osc.start(noteStart);
      osc2.start(noteStart);
      osc.stop(noteStart + noteDur);
      osc2.stop(noteStart + noteDur);
    });
  } catch {}
}

export function sfxStarDing(_starIndex: number = 1) {
  // Silenced per user request: removed piercing high chime bell
  return;
}

export function sfxRoundTransitionWhoosh() {
  if (!ctx || !sfxGain || muted) return;
  try {
    const t = ctx.currentTime;
    const dur = 0.45;

    // Filtered noise sweep
    const bufferSize = ctx.sampleRate * dur;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(250, t);
    filter.frequency.exponentialRampToValueAtTime(3200, t + 0.22);
    filter.frequency.exponentialRampToValueAtTime(450, t + dur);
    filter.Q.setValueAtTime(2.0, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.55, t + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);

    noise.start(t);

    // Deep sub bass drop
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(150, t);
    sub.frequency.exponentialRampToValueAtTime(38, t + dur);
    subGain.gain.setValueAtTime(0.5, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    sub.connect(subGain);
    subGain.connect(sfxGain);
    sub.start(t);
    sub.stop(t + dur);
  } catch {}
}

export function sfxGrandChampionshipVictory() {
  const audioCtx = ctx;
  const audioGain = sfxGain;
  if (!audioCtx || !audioGain || muted) return;
  try {
    sfxCrowdCheer(2.0);
    const t = audioCtx.currentTime;

    // Multi-chord epic Grand Championship brass fanfare
    const chords = [
      [523.25, 659.25, 783.99], // C Major
      [587.33, 739.99, 880.0],  // D Major
      [659.25, 830.61, 987.77], // E Major
      [783.99, 987.77, 1174.66, 1567.98] // Grand C Major Crescendo!
    ];

    chords.forEach((chord, step) => {
      const stepTime = t + step * 0.28;
      const stepDur = step === chords.length - 1 ? 1.6 : 0.32;

      chord.forEach((freq) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, stepTime);

        gain.gain.setValueAtTime(0.001, stepTime);
        gain.gain.linearRampToValueAtTime(0.38 / chord.length, stepTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + stepDur);

        osc.connect(gain);
        gain.connect(audioGain);
        osc.start(stepTime);
        osc.stop(stepTime + stepDur);
      });
    });

    // Fireworks pops during fanfare
    for (let f = 0; f < 5; f++) {
      setTimeout(() => sfxConfettiPop(), 250 + f * 320);
    }
  } catch {}
}

export function sfxConfettiPop() {
  if (!ctx || !sfxGain || muted) return;
  try {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);

    playNoise(0.08, 0.4, 2500);
  } catch {}
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

export function sfxOnePunch() {
  if (!ctx || !sfxGain || muted) return;
  // Deep explosive anime bass impact
  playTone(65, 0.8, "sine", 0.85);
  playTone(130, 0.45, "triangle", 0.7);
  // Fiery explosion crack
  playNoise(0.6, 0.75, 2200);
  // High energy anime laser shimmer
  playTone(880, 0.28, "sawtooth", 0.4);
  // Stadium crowd roar
  sfxCrowdCheer(1.5);
}

// ─── TV Game Show & Tournament Broadcast SFX ───
export function sfxTVOpener() {
  if (!ctx || !sfxGain || muted) return;
  // Retro TV static zap
  playNoise(0.08, 0.25, 3400);
  // Tournament fanfare brass chords
  playTone(392.0, 0.25, "sawtooth", 0.35); // G4
  setTimeout(() => playTone(523.25, 0.3, "sawtooth", 0.38), 120); // C5
  setTimeout(() => playTone(659.25, 0.3, "sawtooth", 0.35), 240); // E5
  setTimeout(() => {
    playTone(783.99, 0.6, "sawtooth", 0.45); // G5
    playTone(1046.5, 0.6, "sawtooth", 0.35); // C6
    sfxCrowdCheer(1.1);
  }, 380);
}

export function sfxTVCountdown(step: number) {
  if (!ctx || !sfxGain || muted) return;
  if (step > 0) {
    // 3, 2, 1 arcade rising beeps
    const f = 440 + (3 - step) * 110;
    playTone(f, 0.12, "sine", 0.45);
    playTone(f * 2, 0.08, "triangle", 0.25);
  } else {
    // 0 = GO / BOUNCE!!
    playTone(1046.5, 0.45, "sawtooth", 0.45);
    sfxCrowdCheer(1.3);
  }
}

export function sfxBoxingBell() {
  // Silenced per user request: removed loud ringing bell
  return;
}

export function sfxCommentatorGasp() {
  if (!ctx || !sfxGain || muted) return;
  // Humorous commentator mic pop & gasp
  playNoise(0.06, 0.22, 1800);
  playTone(580, 0.12, "square", 0.2);
  setTimeout(() => playTone(820, 0.18, "sawtooth", 0.25), 50);
}

// ─── Reality TV Audience Poll & Disaster Mayhem SFX ───
export function sfxVoteStart() {
  if (!ctx || !sfxGain || muted) return;
  // Reality TV chime / notification sound
  playTone(523.25, 0.15, "sine", 0.4);
  setTimeout(() => playTone(659.25, 0.15, "sine", 0.4), 80);
  setTimeout(() => playTone(783.99, 0.25, "sine", 0.45), 160);
  setTimeout(() => playTone(1046.5, 0.4, "triangle", 0.5), 240);
}

export function sfxVoteTick() {
  if (!ctx || !sfxGain || muted) return;
  playTone(880, 0.05, "sine", 0.2);
}

export function sfxDisasterSiren() {
  if (!ctx || !sfxGain || muted) return;
  // Urgent reality TV emergency klaxon
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(650, now);
  osc.frequency.linearRampToValueAtTime(950, now + 0.22);
  osc.frequency.linearRampToValueAtTime(650, now + 0.45);
  osc.frequency.linearRampToValueAtTime(950, now + 0.68);
  osc.frequency.linearRampToValueAtTime(650, now + 0.9);

  gain.gain.setValueAtTime(0.35, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start(now);
  osc.stop(now + 0.95);
}

export function sfxTornado() {
  if (!ctx || !sfxGain || muted) return;
  // Howling, whistling vortex wind loop
  try {
    const dur = 2.4;
    const bufSize = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;

    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(260, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(680, ctx.currentTime + 0.8);
    filter.frequency.linearRampToValueAtTime(320, ctx.currentTime + 1.6);
    filter.frequency.linearRampToValueAtTime(540, ctx.currentTime + 2.4);
    filter.Q.value = 4.5;

    // High howling resonance whistle
    const whistle = ctx.createOscillator();
    whistle.type = "sine";
    whistle.frequency.setValueAtTime(380, ctx.currentTime);
    whistle.frequency.linearRampToValueAtTime(740, ctx.currentTime + 1.2);
    whistle.frequency.linearRampToValueAtTime(420, ctx.currentTime + 2.4);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

    const whistleGain = ctx.createGain();
    whistleGain.gain.setValueAtTime(0.18, ctx.currentTime);
    whistleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(sfxGain);

    whistle.connect(whistleGain);
    whistleGain.connect(sfxGain);

    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + dur);
    whistle.start(ctx.currentTime);
    whistle.stop(ctx.currentTime + dur);
  } catch {}
}

export function sfxMeteorIncoming() {
  if (!ctx || !sfxGain || muted) return;
  // Supersonic whistling descent
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.65);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.65);
  } catch {}
}

export function sfxMeteorExplode() {
  if (!ctx || !sfxGain || muted) return;
  // Cataclysmic fiery blast
  playTone(55, 0.8, "sawtooth", 0.75);
  playTone(35, 0.9, "sine", 0.85);
  playNoise(0.7, 0.8, 1600);
  setTimeout(() => playNoise(0.4, 0.35, 800), 120);
  sfxCrowdCheer(1.2);
}

export function sfxEarthquake() {
  if (!ctx || !sfxGain || muted) return;
  // Tectonic sub-rumble tremor
  try {
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(45, ctx.currentTime);

    lfo.frequency.setValueAtTime(18, ctx.currentTime);
    lfoGain.gain.setValueAtTime(25, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.65, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

    osc.connect(gain);
    gain.connect(sfxGain);

    lfo.start(ctx.currentTime);
    osc.start(ctx.currentTime);
    lfo.stop(ctx.currentTime + 1.8);
    osc.stop(ctx.currentTime + 1.8);
    playNoise(1.5, 0.45, 450);
  } catch {}
}

export function sfxLaserBeam() {
  if (!ctx || !sfxGain || muted) return;
  // Orbital sci-fi plasma beam sweep
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(2200, now + 0.18);
    osc.frequency.linearRampToValueAtTime(800, now + 0.7);
    gain.gain.setValueAtTime(0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 0.75);
    playNoise(0.5, 0.3, 3000);
  } catch {}
}

export function sfxBlackHole() {
  if (!ctx || !sfxGain || muted) return;
  // Gravitational anomaly vacuum warp + shockwave
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    // Suction pitch drop
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.7);
    osc.frequency.linearRampToValueAtTime(900, now + 0.85); // Anti-grav pop!
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.linearRampToValueAtTime(0.7, now + 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

    osc.connect(gain);
    gain.connect(sfxGain);
    osc.start(now);
    osc.stop(now + 1.1);
  } catch {}
}

