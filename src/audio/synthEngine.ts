// Web Audio API Synthesizer Engine for Vaporwave / Synthwave Music and Arcade Sound FX

export interface TrackInfo {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  bpm: number;
  coverUrl: string;
  genre: string;
  year: string;
}

export const TRACKS: TrackInfo[] = [
  {
    id: 'track-1',
    title: 'Neon Drift',
    artist: 'Kavinsky Dreams',
    album: 'Synthwave Riders',
    duration: 184, // 3:04
    bpm: 110,
    coverUrl: '/src/assets/images/album_midnight_cruise_1791619331512.jpg',
    genre: 'Outrun / Darksynth',
    year: '1984',
  },
  {
    id: 'track-2',
    title: 'Night City 1988',
    artist: 'Cyber Voyager',
    album: 'Retro★Wave Hits',
    duration: 168, // 2:48
    bpm: 124,
    coverUrl: '/src/assets/images/album_cyber_city_1791619343551.jpg',
    genre: 'Chiptune / Cyberwave',
    year: '1988',
  },
  {
    id: 'track-3',
    title: 'Solaris Sunrise',
    artist: 'Sunset Boulevard',
    album: 'Synthwave Dreams',
    duration: 212, // 3:32
    bpm: 94,
    coverUrl: '/src/assets/images/album_solaris_sunset_1791619353120.jpg',
    genre: 'Vaporwave / Chillwave',
    year: '1986',
  },
];

// Musical note frequencies (Hz)
const NOTE_FREQS: Record<string, number> = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  'F#2': 92.5, 'G#2': 103.83, 'Bb2': 116.54, 'C#3': 138.59, 'Eb3': 155.56, 'F#3': 185.0,
  'G#3': 207.65, 'Bb3': 233.08, 'C#4': 277.18, 'Eb4': 311.13, 'F#4': 369.99, 'G#4': 415.3,
  'Bb4': 466.16, 'C#5': 554.37, 'Eb5': 622.25, 'F#5': 739.99, 'G#5': 830.61, 'Bb5': 932.33,
};

// Patterns for each track
interface StepSequence {
  bass: (string | null)[];
  chord: (string[] | null)[];
  lead: (string | null)[];
  kick: boolean[];
  snare: boolean[];
  hihat: boolean[];
}

const SEQUENCES: StepSequence[] = [
  // Track 1: Neon Drift (Am - F - C - G, 110 BPM, 16 steps per bar, 2 bars = 32 steps)
  {
    bass: [
      'A2', 'A2', 'A2', 'A2', 'A2', 'A2', 'A2', 'A2',
      'F2', 'F2', 'F2', 'F2', 'F2', 'F2', 'F2', 'F2',
      'C2', 'C2', 'C2', 'C2', 'C2', 'C2', 'C2', 'C2',
      'G2', 'G2', 'G2', 'G2', 'G2', 'G2', 'G2', 'G2',
    ],
    chord: [
      ['A3', 'C4', 'E4'], null, null, null, null, null, null, null,
      ['F3', 'A3', 'C4'], null, null, null, null, null, null, null,
      ['C3', 'E3', 'G3'], null, null, null, null, null, null, null,
      ['G3', 'B3', 'D4'], null, null, null, null, null, null, null,
    ],
    lead: [
      'E4', null, 'A4', null, 'B4', 'C5', null, 'B4',
      'A4', null, 'F4', null, 'A4', null, 'C5', null,
      'G4', null, 'E4', null, 'G4', 'A4', null, 'G4',
      'D4', null, 'G4', null, 'B4', null, 'D5', null,
    ],
    kick: [
      true, false, false, false, true, false, false, false,
      true, false, false, false, true, false, false, false,
      true, false, false, false, true, false, false, false,
      true, false, false, false, true, false, false, false,
    ],
    snare: [
      false, false, false, false, true, false, false, false,
      false, false, false, false, true, false, false, false,
      false, false, false, false, true, false, false, false,
      false, false, false, false, true, false, false, true,
    ],
    hihat: [
      true, true, true, true, true, true, true, true,
      true, true, true, true, true, true, true, true,
      true, true, true, true, true, true, true, true,
      true, true, true, true, true, true, true, true,
    ],
  },
  // Track 2: Night City 1988 (Dm - Bb - Gm - A, 124 BPM, fast pumping)
  {
    bass: [
      'D2', 'D2', 'D3', 'D2', 'D2', 'D2', 'D3', 'D2',
      'Bb2', 'Bb2', 'Bb3', 'Bb2', 'Bb2', 'Bb2', 'Bb3', 'Bb2',
      'G2', 'G2', 'G3', 'G2', 'G2', 'G2', 'G3', 'G2',
      'A2', 'A2', 'A3', 'A2', 'A2', 'A2', 'C#3', 'A2',
    ],
    chord: [
      ['D3', 'F3', 'A3'], null, null, null, null, null, null, null,
      ['Bb3', 'D4', 'F4'], null, null, null, null, null, null, null,
      ['G3', 'Bb3', 'D4'], null, null, null, null, null, null, null,
      ['A3', 'C#4', 'E4'], null, null, null, null, null, null, null,
    ],
    lead: [
      'D4', 'F4', 'A4', 'D5', 'C5', null, 'A4', null,
      'Bb4', 'D5', 'F5', 'D5', 'C5', 'Bb4', 'A4', 'F4',
      'G4', 'Bb4', 'D5', 'Bb4', 'A4', null, 'G4', null,
      'A4', 'C#5', 'E5', 'A5', 'G5', 'F5', 'E5', 'C#5',
    ],
    kick: [
      true, false, false, false, true, false, false, false,
      true, false, false, false, true, false, false, false,
      true, false, false, false, true, false, false, false,
      true, false, false, false, true, false, false, false,
    ],
    snare: [
      false, false, false, false, true, false, false, false,
      false, false, false, false, true, false, false, false,
      false, false, false, false, true, false, false, false,
      false, false, false, false, true, false, true, false,
    ],
    hihat: [
      false, false, true, false, false, false, true, false,
      false, false, true, false, false, false, true, false,
      false, false, true, false, false, false, true, false,
      false, false, true, false, false, false, true, true,
    ],
  },
  // Track 3: Solaris Sunrise (F#m - D - A - E, 94 BPM, dreamy vaporwave)
  {
    bass: [
      'F#2', null, 'F#2', null, 'F#2', null, 'F#2', null,
      'D2', null, 'D2', null, 'D2', null, 'D2', null,
      'A2', null, 'A2', null, 'A2', null, 'A2', null,
      'E2', null, 'E2', null, 'E2', null, 'E2', null,
    ],
    chord: [
      ['F#3', 'A3', 'C#4'], null, null, null, null, null, null, null,
      ['D3', 'F#3', 'A3'], null, null, null, null, null, null, null,
      ['A3', 'C#4', 'E4'], null, null, null, null, null, null, null,
      ['E3', 'G#3', 'B3'], null, null, null, null, null, null, null,
    ],
    lead: [
      'C#5', null, null, 'A4', 'F#4', null, 'A4', null,
      'F#5', null, 'E5', null, 'D5', null, 'A4', null,
      'E5', null, null, 'C#5', 'A4', null, 'C#5', null,
      'B4', null, 'G#4', null, 'E4', null, 'G#4', null,
    ],
    kick: [
      true, false, false, false, false, false, false, false,
      true, false, false, false, false, false, false, false,
      true, false, false, false, false, false, false, false,
      true, false, false, false, false, false, false, false,
    ],
    snare: [
      false, false, false, false, true, false, false, false,
      false, false, false, false, true, false, false, false,
      false, false, false, false, true, false, false, false,
      false, false, false, false, true, false, false, false,
    ],
    hihat: [
      true, false, true, false, true, false, true, false,
      true, false, true, false, true, false, true, false,
      true, false, true, false, true, false, true, false,
      true, false, true, false, true, false, true, false,
    ],
  },
];

class SynthEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Music state
  public isPlaying = false;
  public currentTrackIndex = 0;
  public volume = 0.75;
  public sfxVolume = 0.8;
  public isMuted = false;
  public currentTime = 0;
  private schedulerTimer: number | null = null;
  private nextStepTime = 0;
  private currentStep = 0;
  private stepInterval = 0.125; // 16th note duration

  // Listeners
  private onStateChangeCallbacks: (() => void)[] = [];

  constructor() {
    // Lazy AudioContext setup on first user click to respect browser autoplay policies
  }

  public init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      // Music sub-bus
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.7, this.ctx.currentTime);

      // SFX sub-bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);

      // Analyser for real-time visualizer
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.8;

      // Routing
      this.musicGain.connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public subscribe(cb: () => void) {
    this.onStateChangeCallbacks.push(cb);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter((c) => c !== cb);
    };
  }

  private notify() {
    this.onStateChangeCallbacks.forEach((cb) => cb());
  }

  public play() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) return;

    this.isPlaying = true;
    const track = TRACKS[this.currentTrackIndex];
    // Calculate 16th note step duration from BPM: (60 / bpm) / 4
    this.stepInterval = 60 / track.bpm / 4;
    this.nextStepTime = this.ctx.currentTime + 0.05;

    this.startScheduler();
    this.notify();
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.schedulerTimer !== null) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.notify();
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public nextTrack() {
    const nextIndex = (this.currentTrackIndex + 1) % TRACKS.length;
    this.setTrack(nextIndex);
  }

  public prevTrack() {
    const prevIndex = (this.currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
    this.setTrack(prevIndex);
  }

  public setTrack(index: number) {
    if (index < 0 || index >= TRACKS.length) return;
    this.currentTrackIndex = index;
    this.currentTime = 0;
    this.currentStep = 0;
    if (this.ctx) {
      const track = TRACKS[index];
      this.stepInterval = 60 / track.bpm / 4;
      this.nextStepTime = this.ctx.currentTime + 0.05;
    }
    this.notify();
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  public seek(seconds: number) {
    const track = TRACKS[this.currentTrackIndex];
    this.currentTime = Math.max(0, Math.min(track.duration, seconds));
    // Approximate step position
    const stepsPerSecond = 1 / this.stepInterval;
    this.currentStep = Math.floor(this.currentTime * stepsPerSecond) % 32;
    this.notify();
  }

  private startScheduler() {
    if (this.schedulerTimer !== null) {
      clearInterval(this.schedulerTimer);
    }
    // Schedule notes slightly in advance for rock-solid timing
    this.schedulerTimer = window.setInterval(() => {
      this.schedulerTick();
    }, 25);
  }

  private schedulerTick() {
    if (!this.ctx || !this.isPlaying) return;

    const scheduleAheadTime = 0.15;
    while (this.nextStepTime < this.ctx.currentTime + scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.nextStepTime += this.stepInterval;
      this.currentStep = (this.currentStep + 1) % 32;
      this.currentTime += this.stepInterval;

      const track = TRACKS[this.currentTrackIndex];
      if (this.currentTime >= track.duration) {
        this.currentTime = 0;
      }
    }
    this.notify();
  }

  private scheduleStep(step: number, time: number) {
    if (!this.ctx || !this.musicGain) return;

    const seq = SEQUENCES[this.currentTrackIndex] || SEQUENCES[0];

    // 1. Kick
    if (seq.kick[step]) {
      this.triggerKick(time);
    }

    // 2. Snare
    if (seq.snare[step]) {
      this.triggerSnare(time);
    }

    // 3. Hihat
    if (seq.hihat[step]) {
      this.triggerHihat(time);
    }

    // 4. Bass
    const bassNote = seq.bass[step];
    if (bassNote && NOTE_FREQS[bassNote]) {
      this.triggerBass(NOTE_FREQS[bassNote], time, this.stepInterval * 0.9);
    }

    // 5. Chords (on bar/beat steps)
    const chordNotes = seq.chord[step];
    if (chordNotes && chordNotes.length > 0) {
      const freqs = chordNotes.map((n) => NOTE_FREQS[n]).filter(Boolean);
      if (freqs.length > 0) {
        this.triggerChord(freqs, time, this.stepInterval * 7);
      }
    }

    // 6. Lead
    const leadNote = seq.lead[step];
    if (leadNote && NOTE_FREQS[leadNote]) {
      this.triggerLead(NOTE_FREQS[leadNote], time, this.stepInterval * 1.8);
    }
  }

  // --- SYNTH INSTRUMENTS ---

  private triggerKick(time: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + 0.26);
  }

  private triggerSnare(time: number) {
    if (!this.ctx || !this.musicGain) return;
    // Tone component
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
    oscGain.gain.setValueAtTime(0.3, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(oscGain);
    oscGain.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.16);

    // Noise component (gated retro 80s snare)
    const bufferSize = this.ctx.sampleRate * 0.18;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.18);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.19);
  }

  private triggerHihat(time: number) {
    if (!this.ctx || !this.musicGain) return;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(time);
    noise.stop(time + 0.06);
  }

  private triggerBass(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, time);
    filter.frequency.exponentialRampToValueAtTime(350, time + duration);
    filter.Q.setValueAtTime(4, time);

    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  private triggerChord(freqs: number[], time: number, duration: number) {
    if (!this.ctx || !this.musicGain) return;
    freqs.forEach((freq) => {
      if (!this.ctx || !this.musicGain) return;
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      // Subtle detune for lush 80s chorus
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq * 1.006, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, time);
      filter.frequency.exponentialRampToValueAtTime(1000, time + duration);

      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc2.start(time);
      osc.stop(time + duration + 0.05);
      osc2.stop(time + duration + 0.05);
    });
  }

  private triggerLead(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, time);
    filter.Q.setValueAtTime(3, time);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + duration + 0.03);
  }

  // --- RETRO ARCADE SOUND EFFECTS ---

  public playShootSound() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(900, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.13);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.14);
  }

  public playAlienExplosionSound() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const bufferSize = this.ctx.sampleRate * 0.18;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
    noise.stop(this.ctx.currentTime + 0.19);
  }

  public playPlayerHitSound() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.45);

    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.46);
  }

  public playUfoSound() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const t = this.ctx.currentTime;
    osc.frequency.setValueAtTime(550, t);
    osc.frequency.linearRampToValueAtTime(700, t + 0.1);
    osc.frequency.linearRampToValueAtTime(550, t + 0.2);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.21);
  }

  public playWaveClearSound() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  public playGameOverSound() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const notes = [440, 392, 349.23, 261.63];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime + idx * 0.15;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.32);
    });
  }
}

export const synthEngine = new SynthEngine();
