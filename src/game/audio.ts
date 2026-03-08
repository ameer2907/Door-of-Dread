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

  // Ambient layers
  private ambientLayers: { source: AudioBufferSourceNode | OscillatorNode; gain: GainNode }[] = [];
  private footstepInterval: number | null = null;
  private whisperInterval: number | null = null;

  init() {
    if (this.initialized) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.2;
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

  // --- Layered Ambient Sound System ---
  startRoomAmbience(type: string) {
    this.stopRoomAmbience();
    if (!this.ctx || !this.masterGain) return;

    switch (type) {
      case 'wind':
        this._layerWind();
        break;
      case 'drip':
        this._layerWind();
        this._layerDrip();
        break;
      case 'whisper':
        this._layerWind();
        this._layerWhispers();
        break;
      case 'scream':
        this._layerWind();
        this._layerDistantScreams();
        break;
      case 'child':
        this._layerMusicBox();
        this._layerWhispers();
        break;
      case 'ritual':
        this._layerRitualChant();
        this._layerWind();
        break;
      case 'silence':
        // Subtle low-freq rumble only
        this._layerDeepRumble();
        break;
    }
  }

  private _layerWind() {
    if (!this.ctx || !this.masterGain) return;
    const bufLen = this.ctx.sampleRate * 4;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1);

    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 250;
    const g = this.ctx.createGain();
    g.gain.value = 0.03;
    src.connect(filt);
    filt.connect(g);
    g.connect(this.masterGain);
    src.start();
    this.ambientLayers.push({ source: src, gain: g });
  }

  private _layerDrip() {
    if (!this.ctx || !this.masterGain) return;
    const scheduleDrip = () => {
      if (!this.ctx || !this.masterGain) return;
      const delay = 1500 + Math.random() * 3000;
      const timer = setTimeout(() => {
        if (!this.ctx || !this.masterGain) return;
        // Water drip: short high-freq ping
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000 + Math.random() * 500, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.15);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.04, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        osc.connect(g);
        g.connect(this.masterGain!);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
        scheduleDrip();
      }, delay);
      (this as any)._dripTimer = timer;
    };
    scheduleDrip();
  }

  private _layerWhispers() {
    if (!this.ctx || !this.masterGain) return;
    const scheduleWhisper = () => {
      const delay = 4000 + Math.random() * 8000;
      this.whisperInterval = window.setTimeout(() => {
        if (!this.ctx || !this.masterGain) return;
        // Breathy noise whisper
        const bufLen = this.ctx.sampleRate * 1.5;
        const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.sin(i / bufLen * Math.PI);
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filt = this.ctx.createBiquadFilter();
        filt.type = 'bandpass';
        filt.frequency.value = 1500 + Math.random() * 500;
        filt.Q.value = 3;
        const g = this.ctx.createGain();
        g.gain.value = 0.02;
        src.connect(filt);
        filt.connect(g);
        g.connect(this.masterGain!);
        src.start();
        scheduleWhisper();
      }, delay);
    };
    scheduleWhisper();
  }

  private _layerDistantScreams() {
    if (!this.ctx || !this.masterGain) return;
    const scheduleScream = () => {
      const delay = 8000 + Math.random() * 15000;
      setTimeout(() => {
        if (!this.ctx || !this.masterGain) return;
        // Distant muffled scream
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400 + Math.random() * 200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.5);
        osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 1.5);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.001, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.03, this.ctx.currentTime + 0.3);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2);
        const filt = this.ctx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.value = 600;
        osc.connect(filt);
        filt.connect(g);
        g.connect(this.masterGain!);
        osc.start();
        osc.stop(this.ctx.currentTime + 2.5);
        scheduleScream();
      }, delay);
    };
    scheduleScream();
  }

  private _layerMusicBox() {
    if (!this.ctx || !this.masterGain) return;
    const notes = [523.25, 587.33, 659.25, 783.99, 880]; // C5-A5
    let noteIdx = 0;
    const playNote = () => {
      if (!this.ctx || !this.masterGain) return;
      const freq = notes[noteIdx % notes.length];
      noteIdx++;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.03, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start();
      osc.stop(this.ctx.currentTime + 2);
    };
    const schedule = () => {
      setTimeout(() => {
        playNote();
        if (Math.random() > 0.3) {
          setTimeout(playNote, 400);
        }
        schedule();
      }, 3000 + Math.random() * 4000);
    };
    schedule();
  }

  private _layerRitualChant() {
    if (!this.ctx || !this.masterGain) return;
    // Deep monotone chant drone
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 80;
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 120;
    const g = this.ctx.createGain();
    g.gain.value = 0.02;
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.2;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.01;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    lfo.start();
    osc.connect(g);
    osc2.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc2.start();
    this.ambientLayers.push({ source: osc, gain: g });
    this.musicOscillators.push(osc2, lfo);
  }

  private _layerDeepRumble() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 25;
    const g = this.ctx.createGain();
    g.gain.value = 0.04;
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    this.ambientLayers.push({ source: osc, gain: g });
  }

  stopRoomAmbience() {
    this.ambientLayers.forEach(l => { try { l.source.stop(); } catch {} });
    this.ambientLayers = [];
    if (this.whisperInterval) { clearTimeout(this.whisperInterval); this.whisperInterval = null; }
    if ((this as any)._dripTimer) { clearTimeout((this as any)._dripTimer); }
  }

  // --- Footsteps ---
  playFootstep() {
    if (!this.ctx || !this.masterGain) return;
    const freq = 100 + Math.random() * 80;
    this.playTone(freq, 0.08, 'sine', 0.04);
    this.playNoise(0.05, 0.02);
  }

  // --- Horror Music System ---
  startMusic() {
    if (!this.ctx || !this.musicGain || this.musicPlaying) return;
    this.musicPlaying = true;
    this.musicEnabled = true;
    this._startDrone();
    this._startMetalCreaks();
    this._startPianoLoop();
  }

  private _startDrone() {
    if (!this.ctx || !this.musicGain) return;
    const freqs = [28, 32, 42, 56];
    freqs.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      osc.type = idx < 2 ? 'sine' : 'triangle';
      osc.frequency.value = f;
      const g = this.ctx!.createGain();
      g.gain.value = idx < 2 ? 0.06 : 0.03;
      const lfo = this.ctx!.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.03 + Math.random() * 0.04;
      const lfoGain = this.ctx!.createGain();
      lfoGain.gain.value = 0.02;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);
      lfo.start();
      osc.connect(g);
      g.connect(this.musicGain!);
      osc.start();
      this.musicOscillators.push(osc);
    });

    const bufLen = this.ctx.sampleRate * 5;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1);

    const playWindLoop = () => {
      if (!this.musicPlaying || !this.ctx || !this.musicGain) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filt = this.ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 200;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.025, this.ctx.currentTime + 1.5);
      g.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 4.5);
      src.connect(filt);
      filt.connect(g);
      g.connect(this.musicGain!);
      src.start();
      this.musicBufferSources.push(src);
    };
    playWindLoop();
    this.musicInterval = window.setInterval(playWindLoop, 5000);
  }

  private _startMetalCreaks() {
    if (!this.ctx || !this.musicGain) return;
    const scheduleCreak = () => {
      if (!this.musicPlaying || !this.ctx || !this.musicGain) return;
      const delay = 6000 + Math.random() * 8000;
      setTimeout(() => {
        if (!this.musicPlaying || !this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        const startFreq = 300 + Math.random() * 400;
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(startFreq * 0.5, this.ctx.currentTime + 0.8);
        const g = this.ctx.createGain();
        g.gain.value = 0.015;
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
        const filt = this.ctx.createBiquadFilter();
        filt.type = 'bandpass';
        filt.frequency.value = 500;
        filt.Q.value = 5;
        osc.connect(filt);
        filt.connect(g);
        g.connect(this.musicGain!);
        osc.start();
        osc.stop(this.ctx.currentTime + 1);
        scheduleCreak();
      }, delay);
    };
    scheduleCreak();
  }

  private _startPianoLoop() {
    if (!this.ctx || !this.musicGain) return;
    const notes = [110, 130.81, 146.83, 164.81, 196, 220];
    const playNote = () => {
      if (!this.musicPlaying || !this.ctx || !this.musicGain) return;
      const freq = notes[Math.floor(Math.random() * notes.length)];
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 15;
      const g = this.ctx.createGain();
      g.gain.value = 0.04;
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 4);
      const delay = this.ctx.createDelay();
      delay.delayTime.value = 0.4;
      const dGain = this.ctx.createGain();
      dGain.gain.value = 0.02;
      osc.connect(g);
      g.connect(this.musicGain!);
      g.connect(delay);
      delay.connect(dGain);
      dGain.connect(this.musicGain!);
      osc.start();
      osc.stop(this.ctx.currentTime + 4.5);
    };
    const scheduleNext = () => {
      if (!this.musicPlaying) return;
      const d = 4000 + Math.random() * 5000;
      setTimeout(() => { playNote(); scheduleNext(); }, d);
    };
    setTimeout(() => { playNote(); scheduleNext(); }, 2000);
  }

  stopMusic() {
    this.musicPlaying = false;
    this.musicOscillators.forEach(o => { try { o.stop(); } catch {} });
    this.musicOscillators = [];
    this.musicBufferSources.forEach(s => { try { s.stop(); } catch {} });
    this.musicBufferSources = [];
    if (this.musicInterval) { clearInterval(this.musicInterval); this.musicInterval = null; }
  }

  toggleMusic(): boolean {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) this.startMusic(); else this.stopMusic();
    return this.musicEnabled;
  }

  isMusicEnabled() { return this.musicEnabled; }

  // --- Title Screen ---
  playTitleIntro() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 30;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 3);
    g.gain.linearRampToValueAtTime(0.04, this.ctx.currentTime + 6);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 8);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 6);
    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0.001, this.ctx.currentTime);
    g2.gain.linearRampToValueAtTime(0.015, this.ctx.currentTime + 2);
    g2.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 6);
    osc2.connect(g2);
    g2.connect(this.masterGain);
    osc2.start();
    osc2.stop(this.ctx.currentTime + 6);

    this.playNoise(5, 0.03);
  }

  // Lightning crack for menu
  playLightningCrack() {
    if (!this.ctx || !this.masterGain) return;
    this.playNoise(0.3, 0.25);
    this.playTone(40, 0.6, 'sine', 0.15);
    setTimeout(() => this.playNoise(0.5, 0.08), 200);
  }

  playTitleHit(wordIndex: number) {
    if (!this.ctx || !this.masterGain) return;
    const intensity = 0.12 + wordIndex * 0.08;
    const baseFreq = 50 - wordIndex * 10;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq + 30, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, this.ctx.currentTime + 0.5);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(intensity, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.5);
    this.playNoise(0.15 + wordIndex * 0.05, 0.08 + wordIndex * 0.04);
    if (wordIndex === 2) {
      this.playTone(180, 2, 'sawtooth', 0.08);
      this.playTone(187, 2, 'sawtooth', 0.06);
      setTimeout(() => this.playNoise(1, 0.04), 200);
    }
  }

  // --- Door Sounds ---
  playHorrorDoorOpen() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.5);
    osc.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 1.0);
    osc.frequency.linearRampToValueAtTime(250, this.ctx.currentTime + 1.5);
    osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 2.0);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.06, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.8);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.2);
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 300;
    filt.Q.value = 3;
    osc.connect(filt);
    filt.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 2.5);

    // Hinge creak
    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(350, this.ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.5);
      const g2 = this.ctx.createGain();
      g2.gain.value = 0.04;
      g2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
      osc2.connect(g2);
      g2.connect(this.masterGain);
      osc2.start();
      osc2.stop(this.ctx.currentTime + 0.7);
    }, 300);

    // Wood stress groan
    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      const osc2 = this.ctx.createOscillator();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(60, this.ctx.currentTime);
      osc2.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.6);
      const g2 = this.ctx.createGain();
      g2.gain.value = 0.05;
      g2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
      osc2.connect(g2);
      g2.connect(this.masterGain);
      osc2.start();
      osc2.stop(this.ctx.currentTime + 0.8);
    }, 600);

    this.playTone(35, 0.8, 'sine', 0.06);
  }

  playDoorCreak() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.4);
    const g = this.ctx.createGain();
    g.gain.value = 0.08;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 400;
    osc.connect(filt);
    filt.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      this.playTone(800, 0.05, 'sine', 0.04);
    }, 80);
  }

  // --- SFX ---
  startAmbient() {
    if (!this.ctx || !this.masterGain || this.ambientOsc) return;
    this.ambientOsc = this.ctx.createOscillator();
    this.ambientGain = this.ctx.createGain();
    this.ambientOsc.type = 'sawtooth';
    this.ambientOsc.frequency.value = 35;
    this.ambientGain.gain.value = 0.025;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 150;
    this.ambientOsc.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);
    this.ambientOsc.start();
  }

  stopAmbient() {
    this.ambientOsc?.stop();
    this.ambientOsc = null;
    this.ambientGain = null;
  }

  playWrongDoor() {
    this.playNoise(0.2, 0.12);
    this.playTone(70, 0.4, 'square', 0.12);
  }

  playFlicker() {
    this.playNoise(0.12, 0.08);
    setTimeout(() => this.playNoise(0.08, 0.06), 200);
  }

  playGhostSting() {
    if (!this.ctx || !this.masterGain) return;
    this.playTone(120, 1.2, 'sine', 0.2);
    this.playTone(127, 1.2, 'sine', 0.18);
    this.playTone(240, 0.6, 'triangle', 0.1);
    this.playNoise(0.3, 0.12);
    setTimeout(() => {
      this.playTone(60, 1.5, 'sine', 0.08);
      this.playNoise(0.8, 0.04);
    }, 300);
  }

  playGhostScream() {
    if (!this.ctx || !this.masterGain) return;
    // LOUDER more terrifying scream
    this.playTone(180, 2, 'sawtooth', 0.35);
    this.playTone(190, 2, 'sawtooth', 0.3);
    this.playTone(380, 1.5, 'square', 0.2);
    this.playNoise(1.5, 0.25);
    // Rising shriek
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, this.ctx.currentTime + 1);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.25, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2);
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 3000;
    osc.connect(filt);
    filt.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 2);
    // Sub bass impact
    this.playTone(25, 1, 'sine', 0.3);
    // Additional dissonant layer
    setTimeout(() => {
      this.playTone(440, 1, 'sawtooth', 0.15);
      this.playTone(466, 1, 'sawtooth', 0.12);
    }, 100);
  }

  // Jumpscare stinger - very loud and sudden
  playJumpscareStinger() {
    if (!this.ctx || !this.masterGain) return;
    this.playNoise(0.1, 0.4);
    this.playTone(100, 0.3, 'square', 0.4);
    this.playTone(2000, 0.2, 'sawtooth', 0.2);
    setTimeout(() => this.playNoise(0.3, 0.15), 50);
  }

  playWhisper() {
    this.playNoise(2, 0.03);
  }

  startHeartbeat(rate = 1000) {
    this.stopHeartbeat();
    const beat = () => {
      this.playTone(45, 0.12, 'sine', 0.2);
      setTimeout(() => this.playTone(40, 0.1, 'sine', 0.15), 150);
    };
    beat();
    this.heartbeatInterval = window.setInterval(beat, rate);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) { clearInterval(this.heartbeatInterval); this.heartbeatInterval = null; }
  }

  playCorrectDoor() {
    this.playTone(440, 0.3, 'sine', 0.1);
    setTimeout(() => this.playTone(550, 0.3, 'sine', 0.08), 150);
  }

  playChurchBell() {
    this.playTone(220, 2, 'sine', 0.12);
    this.playTone(330, 1.5, 'sine', 0.06);
  }

  stopAll() {
    this.stopAmbient();
    this.stopHeartbeat();
    this.stopMusic();
    this.stopRoomAmbience();
  }
}

export const audioManager = new AudioManager();
