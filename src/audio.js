// Web Audio API Synthesizer for Jungle Dash / Subway Runner
// 100% procedural - zero external audio asset dependencies, zero loading lag.

let ctx = null;
let musicNode = null;
let musicInterval = null;
let isMuted = false;
let sfxVolume = 0.8;
let musicVolume = 0.5;

export function setSfxVolume(v) {
  sfxVolume = Math.max(0, Math.min(1, v));
}

export function setMusicVolume(v) {
  musicVolume = Math.max(0, Math.min(1, v));
}

function getContext() {
  if (!ctx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      ctx = new AudioContextClass();
    }
  }
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
  return ctx;
}

export function setMuted(muted) {
  isMuted = muted;
  if (muted && musicNode) {
    stopMusic();
  }
}

export function playCoinSound(combo = 0) {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5, D5, E5, G5, A5, C6
  const freq = notes[Math.min(combo, notes.length - 1)];

  const osc = audio.createOscillator();
  const osc2 = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audio.currentTime);

  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 2, audio.currentTime);

  gain.gain.setValueAtTime(0.08, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);

  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(audio.destination);

  osc.start(audio.currentTime);
  osc2.start(audio.currentTime);
  osc.stop(audio.currentTime + 0.18);
  osc2.stop(audio.currentTime + 0.18);
}

export function playJumpSound(isSuper = false) {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = isSuper ? 'triangle' : 'sine';
  const startFreq = isSuper ? 240 : 180;
  const endFreq = isSuper ? 880 : 440;
  const duration = isSuper ? 0.35 : 0.22;

  osc.frequency.setValueAtTime(startFreq, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(endFreq, audio.currentTime + duration * 0.7);

  gain.gain.setValueAtTime(isSuper ? 0.12 : 0.08, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);

  osc.connect(gain);
  gain.connect(audio.destination);

  osc.start(audio.currentTime);
  osc.stop(audio.currentTime + duration);
}

export function playSlideSound() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  // Filtered white noise for sneaker / board slide scrape
  const bufferSize = audio.sampleRate * 0.22;
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
  }

  const noise = audio.createBufferSource();
  noise.buffer = buffer;

  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1200, audio.currentTime);
  filter.frequency.exponentialRampToValueAtTime(400, audio.currentTime + 0.22);
  filter.Q.value = 3;

  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.1, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.22);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);

  noise.start(audio.currentTime);
}

export function playLaneChangeSound() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(320, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, audio.currentTime + 0.08);

  gain.gain.setValueAtTime(0.04, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.08);

  osc.connect(gain);
  gain.connect(audio.destination);

  osc.start(audio.currentTime);
  osc.stop(audio.currentTime + 0.08);
}

export function playPowerupSound() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  // Energetic ascending fanfare: C5, E5, G5, C6
  const arpeggio = [523.25, 659.25, 783.99, 1046.5];
  arpeggio.forEach((freq, idx) => {
    const startTime = audio.currentTime + idx * 0.06;
    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.09, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

    osc.connect(gain);
    gain.connect(audio.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.2);
  });
}

export function playHoverboardSound() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(140, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(560, audio.currentTime + 0.3);

  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, audio.currentTime);

  gain.gain.setValueAtTime(0.08, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.35);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);

  osc.start(audio.currentTime);
  osc.stop(audio.currentTime + 0.35);
}

export function playHoverboardBreakSound() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  // Impact crash + shatter
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(260, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(60, audio.currentTime + 0.3);

  gain.gain.setValueAtTime(0.18, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.35);

  osc.connect(gain);
  gain.connect(audio.destination);

  osc.start(audio.currentTime);
  osc.stop(audio.currentTime + 0.35);
}

export function playTrainHornSound() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  // Classic dual-tone train horn: F4 (349Hz) + A4 (440Hz)
  [349.23, 440.0].forEach(freq => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, audio.currentTime);

    const filter = audio.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, audio.currentTime);

    gain.gain.setValueAtTime(0.06, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.55);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);

    osc.start(audio.currentTime);
    osc.stop(audio.currentTime + 0.55);
  });
}

export function playCrashSound() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  // Heavy low punch
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(150, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, audio.currentTime + 0.4);

  gain.gain.setValueAtTime(0.25, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.45);

  osc.connect(gain);
  gain.connect(audio.destination);

  osc.start(audio.currentTime);
  osc.stop(audio.currentTime + 0.45);
}

export function playButtonSound() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  const osc = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(580, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(420, audio.currentTime + 0.06);

  gain.gain.setValueAtTime(0.05, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.06);

  osc.connect(gain);
  gain.connect(audio.destination);

  osc.start(audio.currentTime);
  osc.stop(audio.currentTime + 0.06);
}

// Upbeat procedural funk/arcade background groove
export function startMusic() {
  if (isMuted || musicInterval) return;
  const audio = getContext();
  if (!audio) return;

  const tempo = 124; // BPM
  const stepTime = 60 / tempo / 4; // 16th note in seconds
  let step = 0;

  // Bassline notes (F minor / funk groove: F, Ab, Bb, C, Eb)
  const bassNotes = [
    87.31, 0, 87.31, 0, 103.83, 0, 116.54, 0,
    87.31, 0, 87.31, 116.54, 130.81, 0, 155.56, 0,
  ];

  // Synth riff notes
  const leadNotes = [
    349.23, 0, 0, 415.30, 466.16, 0, 523.25, 0,
    0, 466.16, 0, 415.30, 349.23, 0, 0, 0,
  ];

  musicInterval = setInterval(() => {
    if (isMuted || !ctx) return;
    const now = ctx.currentTime;
    const currentStep = step % 16;

    // Bass note
    const bFreq = bassNotes[currentStep];
    if (bFreq > 0) {
      const bOsc = ctx.createOscillator();
      const bGain = ctx.createGain();
      bOsc.type = 'triangle';
      bOsc.frequency.setValueAtTime(bFreq, now);

      bGain.gain.setValueAtTime(0.045, now);
      bGain.gain.exponentialRampToValueAtTime(0.001, now + stepTime * 1.8);

      bOsc.connect(bGain);
      bGain.connect(ctx.destination);
      bOsc.start(now);
      bOsc.stop(now + stepTime * 1.8);
    }

    // Lead arpeggio
    const lFreq = leadNotes[currentStep];
    if (lFreq > 0) {
      const lOsc = ctx.createOscillator();
      const lGain = ctx.createGain();
      lOsc.type = 'sine';
      lOsc.frequency.setValueAtTime(lFreq, now);

      lGain.gain.setValueAtTime(0.025, now);
      lGain.gain.exponentialRampToValueAtTime(0.001, now + stepTime * 1.4);

      lOsc.connect(lGain);
      lGain.connect(ctx.destination);
      lOsc.start(now);
      lOsc.stop(now + stepTime * 1.4);
    }

    // Percussion: kick on 0, 4, 8, 12; snare on 4, 12; hi-hat on even steps
    if (currentStep % 4 === 0) {
      // Kick drum
      const kOsc = ctx.createOscillator();
      const kGain = ctx.createGain();
      kOsc.type = 'sine';
      kOsc.frequency.setValueAtTime(110, now);
      kOsc.frequency.exponentialRampToValueAtTime(35, now + 0.1);

      kGain.gain.setValueAtTime(0.065, now);
      kGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      kOsc.connect(kGain);
      kGain.connect(ctx.destination);
      kOsc.start(now);
      kOsc.stop(now + 0.12);
    }

    if (currentStep % 2 === 0) {
      // Hi-hat (short noise click)
      const hatOsc = ctx.createOscillator();
      const hatGain = ctx.createGain();
      hatOsc.type = 'square';
      hatOsc.frequency.setValueAtTime(8000, now);

      hatGain.gain.setValueAtTime(0.012, now);
      hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      hatOsc.connect(hatGain);
      hatGain.connect(ctx.destination);
      hatOsc.start(now);
      hatOsc.stop(now + 0.03);
    }

    step++;
  }, stepTime * 1000);
}

export function stopMusic() {
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
}

export function playChaChing() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  // Dual bright register bells
  [987.77, 1318.51].forEach((freq, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, audio.currentTime + i * 0.08);

    gain.gain.setValueAtTime(0.12, audio.currentTime + i * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + i * 0.08 + 0.35);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(audio.currentTime + i * 0.08);
    osc.stop(audio.currentTime + i * 0.08 + 0.35);
  });
}

export function playFanfare() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  // Triumphant mission / mystery box fanfare chord: C5, E5, G5, C6
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
    const startTime = audio.currentTime + idx * 0.07;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.14, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.45);
  });
}

export function playMysteryBoxOpen() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  // Rising whoosh then sparkle
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(880, audio.currentTime + 0.3);

  gain.gain.setValueAtTime(0.1, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.35);

  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(audio.currentTime);
  osc.stop(audio.currentTime + 0.35);

  setTimeout(playFanfare, 280);
}

export function playWhistleSound() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  // Dual tone police whistle with trill / vibrato (2600Hz + 2950Hz)
  [2600, 2950].forEach(freq => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'sine';

    // Vibrato LFO
    const lfo = audio.createOscillator();
    const lfoGain = audio.createGain();
    lfo.frequency.value = 24; // 24Hz trill
    lfoGain.gain.value = 85;
    lfo.connect(osc.frequency);

    osc.frequency.setValueAtTime(freq, audio.currentTime);
    gain.gain.setValueAtTime(0.09, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(audio.destination);

    lfo.start(audio.currentTime);
    osc.start(audio.currentTime);
    lfo.stop(audio.currentTime + 0.45);
    osc.stop(audio.currentTime + 0.45);
  });
}

export function playReviveSound() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  // Deep pulse + golden ascent
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(160, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(740, audio.currentTime + 0.4);

  gain.gain.setValueAtTime(0.18, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.5);

  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(audio.currentTime);
  osc.stop(audio.currentTime + 0.5);
}

export function playCloseCallSound() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(420, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(840, audio.currentTime + 0.18);

  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1400, audio.currentTime);
  filter.Q.value = 4;

  gain.gain.setValueAtTime(0.12, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.22);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  osc.start(audio.currentTime);
  osc.stop(audio.currentTime + 0.22);
}

export function playRocketBoostSound() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  const bufferSize = audio.sampleRate * 0.6;
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.5));
  }

  const noise = audio.createBufferSource();
  noise.buffer = buffer;

  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(350, audio.currentTime);
  filter.frequency.exponentialRampToValueAtTime(1400, audio.currentTime + 0.5);

  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.15, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.6);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audio.destination);
  noise.start(audio.currentTime);
}

export function playCountdownTick() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, audio.currentTime);

  gain.gain.setValueAtTime(0.06, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.05);

  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(audio.currentTime);
  osc.stop(audio.currentTime + 0.05);
}

export function playRecordBrokenSound() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  // Grand celebratory major chord fanfare: F4, A4, C5, F5
  [349.23, 440.0, 523.25, 698.46].forEach((freq, idx) => {
    const startTime = audio.currentTime + idx * 0.09;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.18 * sfxVolume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.65);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.65);
  });
}

export function playLetterCollectSound(letterIndex = 0) {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  // D-A-S-H note progression: D5, F#5, A5, D6
  const notes = [587.33, 739.99, 880.0, 1174.66];
  const freq = notes[letterIndex % notes.length];

  const osc = audio.createOscillator();
  const osc2 = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audio.currentTime);
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(freq * 1.5, audio.currentTime);

  gain.gain.setValueAtTime(0.14 * sfxVolume, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.32);

  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(audio.destination);

  osc.start(audio.currentTime);
  osc2.start(audio.currentTime);
  osc.stop(audio.currentTime + 0.32);
  osc2.stop(audio.currentTime + 0.32);
}

// -------------------------------------------------------------
// TALKING TOM GOLD RUN - THIEF CHASE AUDIO
// -------------------------------------------------------------
export function playThiefPanicSound() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  // Comedic surprised burglar squeak: rapid rising pitch, then flustered wobble
  const t = audio.currentTime;
  const osc = audio.createOscillator();
  const osc2 = audio.createOscillator();
  const gain = audio.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(320, t);
  osc.frequency.exponentialRampToValueAtTime(780, t + 0.12);
  osc.frequency.linearRampToValueAtTime(620, t + 0.22);
  osc.frequency.exponentialRampToValueAtTime(920, t + 0.35);

  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(640, t);
  osc2.frequency.exponentialRampToValueAtTime(1560, t + 0.12);
  osc2.frequency.linearRampToValueAtTime(1240, t + 0.22);

  gain.gain.setValueAtTime(0.12 * sfxVolume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

  osc.connect(gain);
  osc2.connect(gain);
  gain.connect(audio.destination);

  osc.start(t);
  osc2.start(t);
  osc.stop(t + 0.38);
  osc2.stop(t + 0.38);
}

export function playGemCollectSound() {
  if (isMuted) return;
  const audio = getContext();
  if (!audio) return;

  // Radiant crystalline arpeggio chime: E5, G#5, B5, E6
  const t = audio.currentTime;
  const notes = [659.25, 830.61, 987.77, 1318.51];
  notes.forEach((freq, idx) => {
    const noteStart = t + idx * 0.05;
    const osc = audio.createOscillator();
    const gain = audio.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, noteStart);

    gain.gain.setValueAtTime(0.16 * sfxVolume, noteStart);
    gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.45);

    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(noteStart);
    osc.stop(noteStart + 0.45);
  });
}

