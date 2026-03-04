class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private heartbeatInterval: number | null = null;
  private initialized = false;

  // Music system
  private musicGain: GainNode | null = null;
  private musicOscillators: OscillatorNode[] = [];
  private musicBufferSources: AudioBufferSourceNode[] = [];
  private musicInterval: number | null = null;
  private musicEnabled = true;
  private musicPlaying = false;

  init() {
    if (this.initialized) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.25;
    this.musicGain.connect(this.masterGain);

    this.initialized = true;
  }

  resume() {
    if (this.ctx?.state === 'suspended') this.ctx.resume();
  }

  setVolume(v: number) {
    if (this.masterGain) this.masterGain.gain.value = v / 100;
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.3) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = vol;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  private playNoise(duration: number, vol = 0.1) {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * vol;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    const gain = this.ctx.createGain();
    gain.gain.value = 1;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  // --- Horror Music System ---
  startMusic() {
    if (!this.ctx || !this.musicGain || this.musicPlaying) return;
    this.musicPlaying = true;
    this.musicEnabled = true;
    this._startDrone();
    this._startPianoLoop();
  }

  private _startDrone() {
    if (!this.ctx || !this.musicGain) return;

    // Deep drone - layered detuned sines
    const freqs = [38, 40, 57]; // low rumble
    freqs.forEach(f => {
      const osc = this.ctx!.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      const g = this.ctx!.createGain();
      g.gain.value = 0.08;
      // Slow LFO on volume for breathing feel
      const lfo = this.ctx!.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.05 + Math.random() * 0.05;
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 0.03;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);
      lfo.start();

      osc.connect(g);
      g.connect(this.musicGain!);
      osc.start();
      this.musicOscillators.push(osc);
    });

    // Filtered noise layer for distant wind
    const bufLen = this.ctx.sampleRate * 4;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1);
    const playNoiseLoop = () => {
      if (!this.musicPlaying || !this.ctx || !this.musicGain) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filt = this.ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 300;
      const g = this.ctx.createGain();
      g.gain.value = 0.04;
      g.gain.setValueAtTime(0.001, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 1);
      g.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 3.8);
      src.connect(filt);
      filt.connect(g);
      g.connect(this.musicGain!);
      src.start();
      this.musicBufferSources.push(src);
    };
    playNoiseLoop();
    this.musicInterval = window.setInterval(playNoiseLoop, 4000);
  }

  private _startPianoLoop() {
    if (!this.ctx || !this.musicGain) return;
    // Simulate sparse piano notes with sine + fast decay
    const notes = [130.81, 146.83, 155.56, 174.61, 196, 220, 261.63]; // C3-C4 range
    const playNote = () => {
      if (!this.musicPlaying || !this.ctx || !this.musicGain) return;
      const freq = notes[Math.floor(Math.random() * notes.length)];
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      // Add slight detune for eeriness
      osc.detune.value = (Math.random() - 0.5) * 20;
      const g = this.ctx.createGain();
      g.gain.value = 0.06;
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 3);
      // Reverb-like echo via delayed copy
      const delay = this.ctx.createDelay();
      delay.delayTime.value = 0.3;
      const dGain = this.ctx.createGain();
      dGain.gain.value = 0.03;

      osc.connect(g);
      g.connect(this.musicGain!);
      g.connect(delay);
      delay.connect(dGain);
      dGain.connect(this.musicGain!);
      osc.start();
      osc.stop(this.ctx.currentTime + 3.5);
    };

    // Play a note every 3-6 seconds randomly
    const scheduleNext = () => {
      if (!this.musicPlaying) return;
      const delay = 3000 + Math.random() * 3000;
      setTimeout(() => {
        playNote();
        scheduleNext();
      }, delay);
    };
    // Play first note after a short delay
    setTimeout(() => {
      playNote();
      scheduleNext();
    }, 1500);
  }

  stopMusic() {
    this.musicPlaying = false;
    this.musicOscillators.forEach(o => { try { o.stop(); } catch {} });
    this.musicOscillators = [];
    this.musicBufferSources.forEach(s => { try { s.stop(); } catch {} });
    this.musicBufferSources = [];
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  isMusicEnabled() {
    return this.musicEnabled;
  }

  // --- Existing SFX ---
  startAmbient() {
    if (!this.ctx || !this.masterGain || this.ambientOsc) return;
    this.ambientOsc = this.ctx.createOscillator();
    this.ambientGain = this.ctx.createGain();
    this.ambientOsc.type = 'sawtooth';
    this.ambientOsc.frequency.value = 40;
    this.ambientGain.gain.value = 0.04;
    this.ambientOsc.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);
    this.ambientOsc.start();
  }

  stopAmbient() {
    this.ambientOsc?.stop();
    this.ambientOsc = null;
    this.ambientGain = null;
  }

  playDoorCreak() {
    if (!this.ctx) return;
    this.playTone(200, 0.6, 'sawtooth', 0.15);
    setTimeout(() => this.playTone(150, 0.4, 'sawtooth', 0.1), 100);
  }

  playWrongDoor() {
    this.playNoise(0.3, 0.2);
    this.playTone(80, 0.5, 'square', 0.2);
  }

  playFlicker() {
    this.playNoise(0.15, 0.15);
    setTimeout(() => this.playNoise(0.1, 0.1), 200);
    setTimeout(() => this.playNoise(0.08, 0.12), 350);
  }

  playGhostScream() {
    if (!this.ctx) return;
    this.playTone(600, 1.5, 'sawtooth', 0.4);
    this.playTone(800, 1.2, 'square', 0.3);
    this.playNoise(1.5, 0.3);
  }

  playWhisper() {
    this.playNoise(2, 0.04);
  }

  startHeartbeat(rate = 1000) {
    this.stopHeartbeat();
    const beat = () => {
      this.playTone(50, 0.15, 'sine', 0.25);
      setTimeout(() => this.playTone(45, 0.12, 'sine', 0.2), 150);
    };
    beat();
    this.heartbeatInterval = window.setInterval(beat, rate);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  playCorrectDoor() {
    this.playTone(440, 0.3, 'sine', 0.15);
    setTimeout(() => this.playTone(550, 0.3, 'sine', 0.12), 150);
  }

  playChurchBell() {
    this.playTone(220, 2, 'sine', 0.15);
    this.playTone(330, 1.5, 'sine', 0.08);
  }

  stopAll() {
    this.stopAmbient();
    this.stopHeartbeat();
    this.stopMusic();
  }
}

export const audioManager = new AudioManager();
