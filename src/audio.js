// Hybrid Web Audio Engine for Jungle Dash / Road Runner
// Combines Dustyroom CC0 Studio SFX samples (preloaded & zero-latency)
// with a lookahead-scheduled tropical jungle chase soundtrack, realistic train horn,
// master dynamics compression, combo pitch scaling, and smooth synth fallbacks.

const SOUND_BASE = `${import.meta.env?.BASE_URL || '/'}sounds/`;

const SAMPLE_FILES = {
  jump: 'jump.wav',
  slide: 'slide.wav',
  lane_switch: 'lane_switch.wav',
  button: 'button.wav',
  powerup: 'powerup.wav',
  hoverboard_on: 'hoverboard_on.wav',
  hoverboard_break: 'hoverboard_break.wav',
  crash: 'crash.wav',
  rocket_boost: 'rocket_boost.wav',
  chaching: 'chaching.wav',
  fanfare: 'fanfare.wav',
  mystery_box: 'mystery_box.wav',
  record_broken: 'record_broken.wav',
  gem_collect: 'gem_collect.wav',
  sacred_loot: 'sacred_loot.wav',
  revive: 'revive.wav',
  countdown_tick: 'countdown_tick.wav',
  letter_collect: 'letter_collect.wav',
};

let ctx = null;
let sfxGain = null;
let musicGain = null;
let duckGain = null;
let masterCompressor = null;
let masterGain = null;
let noiseBuffer = null;

let isMuted = false;
let sfxVolume = 0.85;
let musicVolume = 0.45;

// Sample preload & decode caches
const rawBuffers = new Map();
const decodedBuffers = new Map();
const decodeInFlight = new Map();
const lastPlayTimeMs = new Map();
let prefetchStarted = false;
let gestureHooked = false;

// Music lookahead scheduler state
let musicTimer = null;
let musicRunning = false;
let nextNoteTime = 0;
let musicStep = 0;
let duckTimer = null;

function ensureGraph(audio) {
  if (masterGain && ctx === audio) return;

  masterCompressor = audio.createDynamicsCompressor();
  masterCompressor.threshold.setValueAtTime(-14, audio.currentTime);
  masterCompressor.knee.setValueAtTime(18, audio.currentTime);
  masterCompressor.ratio.setValueAtTime(4, audio.currentTime);
  masterCompressor.attack.setValueAtTime(0.003, audio.currentTime);
  masterCompressor.release.setValueAtTime(0.16, audio.currentTime);

  masterGain = audio.createGain();
  masterGain.gain.setValueAtTime(isMuted ? 0 : 1, audio.currentTime);

  sfxGain = audio.createGain();
  sfxGain.gain.setValueAtTime(sfxVolume, audio.currentTime);

  musicGain = audio.createGain();
  musicGain.gain.setValueAtTime(0, audio.currentTime);

  duckGain = audio.createGain();
  duckGain.gain.setValueAtTime(1, audio.currentTime);

  sfxGain.connect(masterCompressor);
  musicGain.connect(duckGain);
  duckGain.connect(masterCompressor);
  masterCompressor.connect(masterGain);
  masterGain.connect(audio.destination);

  // Build reusable 1-second stereo white noise buffer for snare/hats/breath
  const len = Math.floor(audio.sampleRate * 1.0);
  noiseBuffer = audio.createBuffer(1, len, audio.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = Math.random() * 2 - 1;
  }
}

function prefetchSamples() {
  if (prefetchStarted || typeof fetch !== 'function') return;
  prefetchStarted = true;

  for (const [key, filename] of Object.entries(SAMPLE_FILES)) {
    fetch(`${SOUND_BASE}${filename}`)
      .then(res => (res.ok ? res.arrayBuffer() : null))
      .then(buf => {
        if (!buf) return;
        rawBuffers.set(key, buf);
        if (ctx) decodeSample(ctx, key);
      })
      .catch(() => {});
  }
}

function decodeSample(audio, key) {
  if (decodedBuffers.has(key) || decodeInFlight.has(key)) return;
  const raw = rawBuffers.get(key);
  if (!raw) return;

  const task = audio
    .decodeAudioData(raw.slice(0))
    .then(audioBuf => {
      decodedBuffers.set(key, audioBuf);
    })
    .catch(() => {})
    .finally(() => {
      decodeInFlight.delete(key);
    });

  decodeInFlight.set(key, task);
}

function decodeAllAvailable(audio) {
  for (const key of rawBuffers.keys()) {
    decodeSample(audio, key);
  }
}

function hookFirstGesture() {
  if (gestureHooked || typeof window === 'undefined') return;
  gestureHooked = true;

  const unlock = () => {
    getContext();
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
  };

  window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
  window.addEventListener('keydown', unlock, { capture: true, passive: true });
}

prefetchSamples();
hookFirstGesture();

function getContext() {
  if (!ctx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    ctx = new AudioContextClass();
  }
  ensureGraph(ctx);
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  prefetchSamples();
  decodeAllAvailable(ctx);
  return ctx;
}

export function setSfxVolume(v) {
  sfxVolume = Math.max(0, Math.min(1, v));
  if (ctx && sfxGain) {
    sfxGain.gain.setTargetAtTime(sfxVolume, ctx.currentTime, 0.025);
  }
}

export function setMusicVolume(v) {
  musicVolume = Math.max(0, Math.min(1, v));
  if (ctx && musicGain && musicRunning && !isMuted) {
    musicGain.gain.setTargetAtTime(musicVolume, ctx.currentTime, 0.05);
  }
}

export function setMuted(muted) {
  isMuted = Boolean(muted);
  if (ctx && masterGain) {
    masterGain.gain.setTargetAtTime(isMuted ? 0 : 1, ctx.currentTime, 0.02);
  }
  if (isMuted) {
    stopMusic();
  }
}

function duckMusic(level = 0.4, durationSec = 0.7) {
  if (!ctx || !duckGain || !musicRunning) return;
  const now = ctx.currentTime;
  duckGain.gain.cancelScheduledValues(now);
  duckGain.gain.setTargetAtTime(level, now, 0.03);
  clearTimeout(duckTimer);
  duckTimer = setTimeout(() => {
    if (ctx && duckGain) {
      duckGain.gain.setTargetAtTime(1.0, ctx.currentTime, 0.22);
    }
  }, Math.round(durationSec * 1000));
}

function canPlayVoice(key, minIntervalMs) {
  if (!minIntervalMs) return true;
  const now = performance.now();
  const prev = lastPlayTimeMs.get(key) || 0;
  if (now - prev < minIntervalMs) return false;
  lastPlayTimeMs.set(key, now);
  return true;
}

function playSample(
  key,
  {
    gain = 0.75,
    rate = 1.0,
    rateJitter = 0,
    pan = 0,
    minIntervalMs = 0,
    duck = 0,
    duckDur = 0.7,
    delaySec = 0,
  } = {}
) {
  if (isMuted) return false;
  const audio = getContext();
  if (!audio) return false;

  const buffer = decodedBuffers.get(key);
  if (!buffer) return false;
  if (!canPlayVoice(key, minIntervalMs)) return true; // Intentionally throttled

  const src = audio.createBufferSource();
  src.buffer = buffer;

  const jitter = rateJitter ? (Math.random() * 2 - 1) * rateJitter : 0;
  src.playbackRate.setValueAtTime(Math.max(0.5, Math.min(2.0, rate + jitter)), audio.currentTime);

  const nodeGain = audio.createGain();
  nodeGain.gain.setValueAtTime(gain, audio.currentTime);

  if (pan !== 0 && typeof audio.createStereoPanner === 'function') {
    const panner = audio.createStereoPanner();
    panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), audio.currentTime);
    src.connect(panner);
    panner.connect(nodeGain);
  } else {
    src.connect(nodeGain);
  }

  nodeGain.connect(sfxGain);

  if (duck > 0) {
    duckMusic(duck, duckDur);
  }

  src.start(audio.currentTime + delaySec);
  return true;
}

// Synth tone helper routed cleanly through sfxGain
function playSynthTone({
  type = 'triangle',
  freq = 440,
  endFreq = null,
  gain = 0.14,
  duration = 0.2,
  delay = 0,
  pan = 0,
  filterFreq = 0,
} = {}) {
  const audio = getContext();
  if (!audio || isMuted) return;

  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const env = audio.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (endFreq !== null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration * 0.85);
  }

  env.gain.setValueAtTime(0.0001, start);
  env.gain.linearRampToValueAtTime(gain, start + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0008, start + duration);

  let tailNode = env;
  if (pan !== 0 && typeof audio.createStereoPanner === 'function') {
    const panner = audio.createStereoPanner();
    panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), start);
    env.connect(panner);
    tailNode = panner;
  }

  if (filterFreq > 0) {
    const filter = audio.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, start);
    osc.connect(filter);
    filter.connect(env);
  } else {
    osc.connect(env);
  }

  tailNode.connect(sfxGain);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

// -------------------------------------------------------------
// GAMEPLAY & UI SOUND EFFECTS
// -------------------------------------------------------------

export function playCoinSound(combo = 0) {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  // Classic crystalline dual-oscillator coin chime: C5, D5, E5, G5, A5, C6
  const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
  const freq = notes[Math.min(Math.max(0, combo), notes.length - 1)];

  const osc = audio.createOscillator();
  const osc2 = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audio.currentTime);

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2, audio.currentTime);

  gain.gain.setValueAtTime(0.095, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);

  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(sfxGain);

  osc.start(audio.currentTime);
  osc2.start(audio.currentTime);
  osc.stop(audio.currentTime + 0.18);
  osc2.stop(audio.currentTime + 0.18);
}

export function playJumpSound() {
  if (
    playSample('jump', {
      gain: 0.56,
      rate: 1.03,
      rateJitter: 0.03,
      minIntervalMs: 50,
    })
  ) {
    return;
  }

  playSynthTone({
    type: 'sine',
    freq: 210,
    endFreq: 500,
    gain: 0.14,
    duration: 0.2,
  });
}

export function playSlideSound() {
  if (playSample('slide', { gain: 0.52, rate: 0.98, rateJitter: 0.04, minIntervalMs: 60 })) {
    return;
  }

  if (isMuted) return;
  const audio = getContext();
  if (!audio || !noiseBuffer) return;

  const src = audio.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1400, audio.currentTime);
  filter.frequency.exponentialRampToValueAtTime(380, audio.currentTime + 0.22);
  filter.Q.value = 2.5;

  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.18, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.22);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(sfxGain);
  src.start(audio.currentTime);
  src.stop(audio.currentTime + 0.23);
}

export function playLaneChangeSound(direction = 0) {
  const pan = Math.max(-0.35, Math.min(0.35, direction * 0.28));
  if (playSample('lane_switch', { gain: 0.38, rate: 1.02, rateJitter: 0.04, pan, minIntervalMs: 35 })) {
    return;
  }
  playSynthTone({ type: 'sine', freq: 340, endFreq: 220, gain: 0.07, duration: 0.08, pan });
}

export function playPowerupSound() {
  if (playSample('powerup', { gain: 0.72, rate: 1.0, duck: 0.55, duckDur: 0.45 })) {
    return;
  }
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
    playSynthTone({ type: 'triangle', freq, gain: 0.14, duration: 0.22, delay: idx * 0.055 });
  });
}

export function playHoverboardSound() {
  if (playSample('hoverboard_on', { gain: 0.65, rate: 1.05, duck: 0.55, duckDur: 0.5 })) {
    return;
  }
  playSynthTone({ type: 'triangle', freq: 180, endFreq: 680, gain: 0.16, duration: 0.34, filterFreq: 1400 });
}

export function playHoverboardBreakSound() {
  if (playSample('hoverboard_break', { gain: 0.78, rate: 1.0, duck: 0.35, duckDur: 0.55 })) {
    return;
  }
  playSynthTone({ type: 'sawtooth', freq: 240, endFreq: 55, gain: 0.24, duration: 0.32, filterFreq: 900 });
}

export function playTrainHornSound() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  // Cohesive 3-voice railroad air-horn triad (Eb4 + G4 + Bb4) with gentle Doppler fall
  const now = audio.currentTime;
  const voices = [
    { freq: 311.13, detune: -6, gain: 0.065, pan: -0.15 },
    { freq: 392.0, detune: 3, gain: 0.055, pan: 0.12 },
    { freq: 466.16, detune: 8, gain: 0.045, pan: 0.0 },
  ];

  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1650, now);
  filter.frequency.exponentialRampToValueAtTime(820, now + 0.62);
  filter.Q.setValueAtTime(1.4, now);

  const bus = audio.createGain();
  bus.gain.setValueAtTime(0.0001, now);
  bus.gain.linearRampToValueAtTime(1.0, now + 0.045);
  bus.gain.setValueAtTime(0.95, now + 0.32);
  bus.gain.exponentialRampToValueAtTime(0.0008, now + 0.66);

  filter.connect(bus);
  bus.connect(sfxGain);

  voices.forEach(v => {
    const osc = audio.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(v.freq, now);
    // Subtle Doppler drop in the release tail
    osc.frequency.setValueAtTime(v.freq, now + 0.28);
    osc.frequency.exponentialRampToValueAtTime(v.freq * 0.96, now + 0.66);
    osc.detune.setValueAtTime(v.detune, now);

    const vGain = audio.createGain();
    vGain.gain.setValueAtTime(v.gain, now);

    if (typeof audio.createStereoPanner === 'function') {
      const panner = audio.createStereoPanner();
      panner.pan.setValueAtTime(v.pan, now);
      osc.connect(panner);
      panner.connect(vGain);
    } else {
      osc.connect(vGain);
    }
    vGain.connect(filter);

    osc.start(now);
    osc.stop(now + 0.68);
  });
}

export function playCrashSound() {
  if (playSample('crash', { gain: 0.85, rate: 1.0, duck: 0.2, duckDur: 0.9 })) {
    return;
  }
  playSynthTone({ type: 'sawtooth', freq: 140, endFreq: 32, gain: 0.3, duration: 0.45, filterFreq: 550 });
}

export function playButtonSound() {
  if (playSample('button', { gain: 0.5, rate: 1.0, rateJitter: 0.03 })) {
    return;
  }
  playSynthTone({ type: 'sine', freq: 620, endFreq: 480, gain: 0.08, duration: 0.06 });
}

export function playChaChing() {
  if (playSample('chaching', { gain: 0.68, rate: 1.0 })) {
    return;
  }
  playSynthTone({ type: 'triangle', freq: 987.77, gain: 0.14, duration: 0.22 });
  playSynthTone({ type: 'triangle', freq: 1318.51, gain: 0.16, duration: 0.34, delay: 0.08 });
}

export function playFanfare() {
  if (playSample('fanfare', { gain: 0.68, rate: 1.0, duck: 0.45, duckDur: 0.6 })) {
    return;
  }
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
    playSynthTone({ type: 'triangle', freq, gain: 0.15, duration: 0.42, delay: idx * 0.065 });
  });
}

export function playMysteryBoxOpen() {
  if (playSample('mystery_box', { gain: 0.78, rate: 1.0, duck: 0.45, duckDur: 0.9, delaySec: 0.045 })) {
    playSample('button', { gain: 0.36, rate: 1.38 });
    return;
  }
  playSynthTone({ type: 'triangle', freq: 440, gain: 0.12, duration: 0.15 });
  playSynthTone({ type: 'sine', freq: 587.33, gain: 0.14, duration: 0.35, delay: 0.06 });
  playSynthTone({ type: 'triangle', freq: 880, gain: 0.14, duration: 0.45, delay: 0.12 });
}

export function playWhistleSound() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  // Crisp referee / chase-start whistle with real trill LFO + breath noise
  const now = audio.currentTime;
  const dur = 0.28;

  if (noiseBuffer) {
    const breath = audio.createBufferSource();
    breath.buffer = noiseBuffer;
    const bp = audio.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2700, now);
    bp.Q.setValueAtTime(6, now);

    const bGain = audio.createGain();
    bGain.gain.setValueAtTime(0.001, now);
    bGain.gain.linearRampToValueAtTime(0.06, now + 0.02);
    bGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    breath.connect(bp);
    bp.connect(bGain);
    bGain.connect(sfxGain);
    breath.start(now);
    breath.stop(now + dur + 0.02);
  }

  [2480, 2790].forEach(freq => {
    const osc = audio.createOscillator();
    const env = audio.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    const lfo = audio.createOscillator();
    const lfoDepth = audio.createGain();
    lfo.frequency.setValueAtTime(28, now);
    lfoDepth.gain.setValueAtTime(75, now);
    lfo.connect(lfoDepth);
    lfoDepth.connect(osc.frequency);

    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.055, now + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0008, now + dur);

    osc.connect(env);
    env.connect(sfxGain);
    lfo.start(now);
    osc.start(now);
    lfo.stop(now + dur + 0.02);
    osc.stop(now + dur + 0.02);
  });
}

export function playReviveSound() {
  if (playSample('revive', { gain: 0.72, rate: 1.0, duck: 0.45, duckDur: 0.75 })) {
    return;
  }
  playSynthTone({ type: 'triangle', freq: 220, endFreq: 880, gain: 0.18, duration: 0.45 });
}

export function playCloseCallSound() {
  playSynthTone({ type: 'triangle', freq: 440, endFreq: 880, gain: 0.14, duration: 0.2, filterFreq: 1800 });
}

export function playRocketBoostSound() {
  if (playSample('rocket_boost', { gain: 0.72, rate: 1.0, duck: 0.45, duckDur: 0.8 })) {
    return;
  }
  playSynthTone({ type: 'sawtooth', freq: 180, endFreq: 720, gain: 0.16, duration: 0.55, filterFreq: 1200 });
}

export function playCountdownTick() {
  if (playSample('countdown_tick', { gain: 0.52, rate: 1.0 })) {
    return;
  }
  playSynthTone({ type: 'sine', freq: 880, gain: 0.09, duration: 0.055 });
}

export function playRecordBrokenSound() {
  if (playSample('record_broken', { gain: 0.78, rate: 1.0, duck: 0.35, duckDur: 1.0 })) {
    return;
  }
  [392.0, 493.88, 587.33, 783.99].forEach((freq, idx) => {
    playSynthTone({ type: 'triangle', freq, gain: 0.18, duration: 0.6, delay: idx * 0.08 });
  });
}

export function playLetterCollectSound(letterIndex = 0) {
  const rates = [1.0, 1.08, 1.18, 1.32];
  const rate = rates[Math.max(0, letterIndex) % rates.length];
  if (playSample('letter_collect', { gain: 0.65, rate })) {
    return;
  }
  const notes = [587.33, 739.99, 880.0, 1174.66];
  const freq = notes[Math.max(0, letterIndex) % notes.length];
  playSynthTone({ type: 'sine', freq, gain: 0.14, duration: 0.28 });
}

// -------------------------------------------------------------
// BANDIT CHASE & PRECISION STONE AUDIO
// -------------------------------------------------------------
export function playSacredLootSound() {
  if (playSample('sacred_loot', { gain: 0.78, rate: 1.0, rateJitter: 0.02, minIntervalMs: 500, duck: 0.48, duckDur: 0.65 })) {
    return;
  }
  playSynthTone({ type: 'sine', freq: 587.33, gain: 0.14, duration: 0.35 });
  playSynthTone({ type: 'triangle', freq: 1174.66, gain: 0.09, duration: 0.4, delay: 0.04 });
}

export function playThiefPanicSound() {
  playSacredLootSound();
}

export function playGemCollectSound() {
  if (playSample('gem_collect', { gain: 0.75, rate: 1.0, duck: 0.38, duckDur: 0.9 })) {
    return;
  }
  [659.25, 830.61, 987.77, 1318.51].forEach((freq, idx) => {
    playSynthTone({ type: 'sine', freq, gain: 0.15, duration: 0.42, delay: idx * 0.048 });
  });
}

// -------------------------------------------------------------
// UPBEAT JUNGLE RUNNER SOUNDTRACK (Lookahead Hardware Sequencer)
// 134 BPM 4-bar heroic chase groove: Dm -> Bb -> C -> Am/C
// -------------------------------------------------------------
const TEMPO_BPM = 134;
const STEP_SEC = 60 / TEMPO_BPM / 4; // 16th note
const LOOKAHEAD_SEC = 0.14;
const SCHEDULER_INTERVAL_MS = 25;

// Bass notes per 64 steps (0 = rest)
const BASS_PATTERN = [
  // Bar 1: Dm (D2=73.42, A2=110.00, C3=130.81)
  73.42, 0, 73.42, 0, 0, 110.0, 73.42, 0, 73.42, 0, 130.81, 0, 110.0, 0, 73.42, 0,
  // Bar 2: Bb (Bb1=58.27, F2=87.31, Bb2=116.54)
  58.27, 0, 58.27, 0, 0, 87.31, 58.27, 0, 58.27, 0, 116.54, 0, 87.31, 0, 116.54, 0,
  // Bar 3: C (C2=65.41, G2=98.00, C3=130.81)
  65.41, 0, 65.41, 0, 0, 98.0, 65.41, 0, 65.41, 0, 130.81, 0, 98.0, 0, 130.81, 0,
  // Bar 4: Am -> C turnaround (A1=55.00, E2=82.41, C2=65.41)
  55.0, 0, 55.0, 0, 0, 82.41, 55.0, 0, 65.41, 0, 98.0, 0, 110.0, 0, 98.0, 0,
];

// Tropical Marimba / Steel-Drum Hook across 64 steps (Hz, 0 = rest)
const MARIMBA_PATTERN = [
  // Bar 1 (Dm): D5, F5, A5, G5, F5, D5
  587.33, 0, 698.46, 0, 880.0, 0, 783.99, 0, 698.46, 0, 587.33, 0, 698.46, 0, 587.33, 0,
  // Bar 2 (Bb): Bb4, D5, F5, G5, F5, D5
  466.16, 0, 587.33, 0, 698.46, 0, 783.99, 0, 698.46, 0, 587.33, 0, 698.46, 0, 587.33, 0,
  // Bar 3 (C): E5, G5, C6, A5, G5, E5
  659.25, 0, 783.99, 0, 1046.5, 0, 880.0, 0, 783.99, 0, 659.25, 0, 783.99, 0, 659.25, 0,
  // Bar 4 (Am->C lift): E5, A5, G5, E5, D5, E5, G5
  659.25, 0, 880.0, 0, 783.99, 0, 659.25, 0, 587.33, 0, 659.25, 0, 783.99, 0, 880.0, 0,
];

function scheduleKick(audio, time, gainScale = 1.0) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(132, time);
  osc.frequency.exponentialRampToValueAtTime(42, time + 0.09);

  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(0.28 * gainScale, time + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.16);

  osc.connect(gain);
  gain.connect(musicGain);
  osc.start(time);
  osc.stop(time + 0.17);
}

function scheduleSnare(audio, time, accent = 1.0) {
  if (noiseBuffer) {
    const src = audio.createBufferSource();
    src.buffer = noiseBuffer;

    const filter = audio.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1900, time);
    filter.Q.setValueAtTime(1.1, time);

    const nGain = audio.createGain();
    nGain.gain.setValueAtTime(0.001, time);
    nGain.gain.linearRampToValueAtTime(0.11 * accent, time + 0.003);
    nGain.gain.exponentialRampToValueAtTime(0.001, time + 0.11);

    src.connect(filter);
    filter.connect(nGain);
    nGain.connect(musicGain);
    src.start(time);
    src.stop(time + 0.12);
  }

  // Snare body snap
  const body = audio.createOscillator();
  const bGain = audio.createGain();
  body.type = 'triangle';
  body.frequency.setValueAtTime(195, time);
  body.frequency.exponentialRampToValueAtTime(115, time + 0.06);

  bGain.gain.setValueAtTime(0.09 * accent, time);
  bGain.gain.exponentialRampToValueAtTime(0.001, time + 0.075);

  body.connect(bGain);
  bGain.connect(musicGain);
  body.start(time);
  body.stop(time + 0.08);
}

function scheduleHiHat(audio, time, isAccent) {
  if (!noiseBuffer) return;
  const src = audio.createBufferSource();
  src.buffer = noiseBuffer;

  const hp = audio.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(isAccent ? 7200 : 8800, time);

  const gain = audio.createGain();
  const peak = isAccent ? 0.055 : 0.025;
  const dur = isAccent ? 0.05 : 0.028;
  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(peak, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0008, time + dur);

  src.connect(hp);
  hp.connect(gain);
  gain.connect(musicGain);
  src.start(time);
  src.stop(time + dur + 0.01);
}

function scheduleBass(audio, freq, time) {
  const osc = audio.createOscillator();
  const filter = audio.createBiquadFilter();
  const gain = audio.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(freq, time);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(freq * 4.5, time);
  filter.frequency.exponentialRampToValueAtTime(freq * 1.8, time + STEP_SEC * 1.4);

  gain.gain.setValueAtTime(0.001, time);
  gain.gain.linearRampToValueAtTime(0.14, time + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.001, time + STEP_SEC * 1.55);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(musicGain);
  osc.start(time);
  osc.stop(time + STEP_SEC * 1.65);
}

function scheduleMarimba(audio, freq, time, isEcho = false) {
  const fund = audio.createOscillator();
  const over = audio.createOscillator();
  const gain = audio.createGain();

  fund.type = 'sine';
  fund.frequency.setValueAtTime(freq, time);
  over.type = 'triangle';
  over.frequency.setValueAtTime(freq * 2, time);

  const overGain = audio.createGain();
  overGain.gain.setValueAtTime(0.28, time);

  const peak = isEcho ? 0.032 : 0.085;
  const decay = isEcho ? 0.14 : 0.2;
  gain.gain.setValueAtTime(0.0008, time);
  gain.gain.linearRampToValueAtTime(peak, time + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0008, time + decay);

  fund.connect(gain);
  over.connect(overGain);
  overGain.connect(gain);

  if (typeof audio.createStereoPanner === 'function') {
    const pan = audio.createStereoPanner();
    pan.pan.setValueAtTime(isEcho ? -0.28 : 0.22, time);
    gain.connect(pan);
    pan.connect(musicGain);
  } else {
    gain.connect(musicGain);
  }

  fund.start(time);
  over.start(time);
  fund.stop(time + decay + 0.02);
  over.stop(time + decay + 0.02);
}

function scheduleStep(audio, stepIdx, time) {
  const s64 = stepIdx % 64;
  const s16 = s64 % 16;
  const bar = Math.floor(s64 / 16);

  // Driving kick on beat + energetic chase pickup on step 10 of alternate bars
  if (s16 % 4 === 0 || (bar % 2 === 1 && s16 === 10)) {
    scheduleKick(audio, time, s16 % 4 === 0 ? 1.0 : 0.72);
  }

  // Backbeat snare + bar 4 turnaround fill
  if (s16 === 4 || s16 === 12) {
    scheduleSnare(audio, time, 1.0);
  } else if (bar === 3 && (s16 === 14 || s16 === 15)) {
    scheduleSnare(audio, time, s16 === 14 ? 0.55 : 0.8);
  }

  // Steady shaker / offbeat hat groove
  scheduleHiHat(audio, time, s16 % 4 === 2);

  // Bassline
  const bassFreq = BASS_PATTERN[s64];
  if (bassFreq > 0) {
    scheduleBass(audio, bassFreq, time);
  }

  // Tropical marimba lead + subtle dotted-8th stereo echo
  const leadFreq = MARIMBA_PATTERN[s64];
  if (leadFreq > 0) {
    scheduleMarimba(audio, leadFreq, time, false);
    scheduleMarimba(audio, leadFreq, time + STEP_SEC * 1.5, true);
  }
}

export function startMusic() {
  if (isMuted || musicRunning) return;
  const audio = getContext();
  if (!audio) return;

  musicRunning = true;
  musicStep = 0;
  nextNoteTime = audio.currentTime + 0.05;

  musicGain.gain.cancelScheduledValues(audio.currentTime);
  musicGain.gain.setTargetAtTime(musicVolume, audio.currentTime, 0.12);

  musicTimer = setInterval(() => {
    if (!musicRunning || isMuted || !ctx) return;
    if (ctx.state === 'suspended') return;

    // Resync cleanly if tab was backgrounded
    if (nextNoteTime < ctx.currentTime - 0.25) {
      nextNoteTime = ctx.currentTime + 0.04;
    }

    while (nextNoteTime < ctx.currentTime + LOOKAHEAD_SEC) {
      scheduleStep(ctx, musicStep, nextNoteTime);
      nextNoteTime += STEP_SEC;
      musicStep++;
    }
  }, SCHEDULER_INTERVAL_MS);
}

export function stopMusic() {
  musicRunning = false;
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  clearTimeout(duckTimer);
  if (ctx && musicGain) {
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.06);
  }
  if (ctx && duckGain) {
    duckGain.gain.setTargetAtTime(1.0, ctx.currentTime, 0.06);
  }
}
