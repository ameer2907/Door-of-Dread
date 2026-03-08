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

  // Helper: filtered noise burst with envelope
  private playFilteredNoise(duration: number, vol: number, filterFreq: number, filterType: BiquadFilterType = 'lowpass', Q = 1) {
    if (!this.ctx || !this.masterGain) return;
    const bufLen = this.ctx.sampleRate * duration;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = filterType;
    filt.frequency.value = filterFreq;
    filt.Q.value = Q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    src.connect(filt);
    filt.connect(g);
    g.connect(this.masterGain);
    src.start();
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
    const notes = [523.25, 587.33, 659.25, 783.99, 880];
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
    // Dark minor key / diminished notes for maximum tension
    const notes = [
      82.41, 87.31, 98, 103.83, 110, 116.54, // low register - dark
      123.47, 130.81, 138.59, 146.83, 155.56, // mid register - dissonant
      164.81, 174.61, 185, 196, 207.65,        // upper mid
    ];
    const playNote = () => {
      if (!this.musicPlaying || !this.ctx || !this.musicGain) return;
      const freq = notes[Math.floor(Math.random() * notes.length)];
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 20;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.06, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 5);
      // Reverb delays for haunted piano feel
      const delay1 = this.ctx.createDelay();
      delay1.delayTime.value = 0.35;
      const d1g = this.ctx.createGain();
      d1g.gain.value = 0.035;
      const delay2 = this.ctx.createDelay();
      delay2.delayTime.value = 0.8;
      const d2g = this.ctx.createGain();
      d2g.gain.value = 0.02;
      const delay3 = this.ctx.createDelay();
      delay3.delayTime.value = 1.4;
      const d3g = this.ctx.createGain();
      d3g.gain.value = 0.012;
      osc.connect(g);
      g.connect(this.musicGain!);
      g.connect(delay1); delay1.connect(d1g); d1g.connect(this.musicGain!);
      g.connect(delay2); delay2.connect(d2g); d2g.connect(this.musicGain!);
      g.connect(delay3); delay3.connect(d3g); d3g.connect(this.musicGain!);
      osc.start();
      osc.stop(this.ctx.currentTime + 5.5);
      // Occasional dissonant double-note (minor 2nd)
      if (Math.random() > 0.6) {
        setTimeout(() => {
          if (!this.musicPlaying || !this.ctx || !this.musicGain) return;
          const osc2 = this.ctx.createOscillator();
          osc2.type = 'sine';
          osc2.frequency.value = freq * 1.0595; // semitone up = dissonant
          const g2 = this.ctx.createGain();
          g2.gain.setValueAtTime(0.03, this.ctx.currentTime);
          g2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 3);
          osc2.connect(g2);
          g2.connect(this.musicGain!);
          osc2.start();
          osc2.stop(this.ctx.currentTime + 3.5);
        }, 200 + Math.random() * 400);
      }
    };
    const scheduleNext = () => {
      if (!this.musicPlaying) return;
      const d = 2500 + Math.random() * 3500; // more frequent
      setTimeout(() => { playNote(); scheduleNext(); }, d);
    };
    setTimeout(() => { playNote(); scheduleNext(); }, 1500);
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
    // Deep sub rumble that builds
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 30;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 3);
    g.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 6);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 9);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 9);

    // Eerie high harmonic
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(500, this.ctx.currentTime + 7);
    const g2 = this.ctx.createGain();
    g2.gain.setValueAtTime(0.001, this.ctx.currentTime);
    g2.gain.linearRampToValueAtTime(0.02, this.ctx.currentTime + 2);
    g2.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 7);
    osc2.connect(g2);
    g2.connect(this.masterGain);
    osc2.start();
    osc2.stop(this.ctx.currentTime + 7);

    // Wind noise swell
    this.playFilteredNoise(6, 0.05, 200, 'lowpass');
    
    // Dissonant second harmonic
    const osc3 = this.ctx.createOscillator();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(33, this.ctx.currentTime);
    osc3.frequency.linearRampToValueAtTime(28, this.ctx.currentTime + 8);
    const g3 = this.ctx.createGain();
    g3.gain.setValueAtTime(0.001, this.ctx.currentTime);
    g3.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 4);
    g3.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 8);
    osc3.connect(g3);
    g3.connect(this.masterGain);
    osc3.start();
    osc3.stop(this.ctx.currentTime + 8);
  }

  // Lightning crack for menu
  playLightningCrack() {
    if (!this.ctx || !this.masterGain) return;
    this.playNoise(0.3, 0.25);
    this.playTone(40, 0.6, 'sine', 0.15);
    setTimeout(() => this.playNoise(0.5, 0.08), 200);
    // Distant thunder rumble
    setTimeout(() => {
      this.playTone(25, 1.5, 'sine', 0.08);
      this.playFilteredNoise(1.2, 0.06, 120, 'lowpass');
    }, 400);
  }

  playTitleHit(wordIndex: number) {
    if (!this.ctx || !this.masterGain) return;
    const intensity = 0.15 + wordIndex * 0.1;
    const baseFreq = 50 - wordIndex * 10;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq + 30, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, this.ctx.currentTime + 0.5);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(intensity, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.5);
    this.playNoise(0.15 + wordIndex * 0.05, 0.08 + wordIndex * 0.04);
    
    if (wordIndex === 2) {
      // "DREAD" hit - massive impact
      this.playTone(180, 2.5, 'sawtooth', 0.12);
      this.playTone(187, 2.5, 'sawtooth', 0.08);
      this.playTone(22, 1.5, 'sine', 0.2); // deep sub impact
      setTimeout(() => {
        this.playNoise(1.5, 0.06);
        this.playFilteredNoise(2, 0.04, 300, 'bandpass', 2);
      }, 200);
    }
  }

  // --- Door Sounds ---
  playHorrorDoorOpen() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Multi-layered door creak - slow, long, realistic
    // Layer 1: Main creak (wood stress)
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, t);
    osc.frequency.linearRampToValueAtTime(180, t + 0.6);
    osc.frequency.linearRampToValueAtTime(100, t + 1.2);
    osc.frequency.linearRampToValueAtTime(220, t + 1.8);
    osc.frequency.linearRampToValueAtTime(80, t + 2.5);
    osc.frequency.linearRampToValueAtTime(150, t + 3.0);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.3);
    g.gain.linearRampToValueAtTime(0.08, t + 1.5);
    g.gain.linearRampToValueAtTime(0.1, t + 2.0);
    g.gain.exponentialRampToValueAtTime(0.001, t + 3.2);
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 350;
    filt.Q.value = 4;
    osc.connect(filt);
    filt.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(t + 3.5);

    // Layer 2: High-pitched hinge squeal
    const hingeOsc = this.ctx.createOscillator();
    hingeOsc.type = 'triangle';
    hingeOsc.frequency.setValueAtTime(400, t + 0.2);
    hingeOsc.frequency.exponentialRampToValueAtTime(200, t + 0.8);
    hingeOsc.frequency.linearRampToValueAtTime(500, t + 1.4);
    hingeOsc.frequency.exponentialRampToValueAtTime(180, t + 2.0);
    const hingeG = this.ctx.createGain();
    hingeG.gain.setValueAtTime(0.001, t);
    hingeG.gain.linearRampToValueAtTime(0.06, t + 0.3);
    hingeG.gain.linearRampToValueAtTime(0.03, t + 1.0);
    hingeG.gain.linearRampToValueAtTime(0.05, t + 1.6);
    hingeG.gain.exponentialRampToValueAtTime(0.001, t + 2.3);
    const hingeFilt = this.ctx.createBiquadFilter();
    hingeFilt.type = 'bandpass';
    hingeFilt.frequency.value = 600;
    hingeFilt.Q.value = 6;
    hingeOsc.connect(hingeFilt);
    hingeFilt.connect(hingeG);
    hingeG.connect(this.masterGain);
    hingeOsc.start(t + 0.15);
    hingeOsc.stop(t + 2.5);

    // Layer 3: Wood groaning/stress
    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      const woodOsc = this.ctx.createOscillator();
      woodOsc.type = 'triangle';
      woodOsc.frequency.setValueAtTime(50, this.ctx.currentTime);
      woodOsc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.8);
      woodOsc.frequency.linearRampToValueAtTime(45, this.ctx.currentTime + 1.2);
      const woodG = this.ctx.createGain();
      woodG.gain.setValueAtTime(0.06, this.ctx.currentTime);
      woodG.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
      woodOsc.connect(woodG);
      woodG.connect(this.masterGain);
      woodOsc.start();
      woodOsc.stop(this.ctx.currentTime + 1.5);
    }, 400);

    // Layer 4: Latch click at start
    this.playTone(1200, 0.03, 'square', 0.08);
    setTimeout(() => this.playTone(800, 0.02, 'square', 0.05), 50);

    // Layer 5: Air/wind whistle through gap
    setTimeout(() => {
      this.playFilteredNoise(2.5, 0.04, 400, 'bandpass', 2);
    }, 600);

    // Deep sub thud
    this.playTone(30, 1.2, 'sine', 0.08);
  }

  playDoorCreak() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(250, this.ctx.currentTime + 0.2);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.5);
    const g = this.ctx.createGain();
    g.gain.value = 0.08;
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 400;
    filt.Q.value = 3;
    osc.connect(filt);
    filt.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.6);
    // Hinge squeak
    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      this.playTone(800, 0.05, 'triangle', 0.04);
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
    if (!this.ctx || !this.masterGain) return;
    // More dramatic wrong door sound
    this.playNoise(0.3, 0.18);
    this.playTone(70, 0.5, 'square', 0.15);
    this.playTone(75, 0.5, 'sawtooth', 0.1); // dissonant layer
    // Slam impact
    this.playTone(25, 0.3, 'sine', 0.2);
    setTimeout(() => {
      this.playNoise(0.15, 0.1);
      this.playTone(50, 0.3, 'triangle', 0.08);
    }, 100);
  }

  playFlicker() {
    this.playNoise(0.12, 0.08);
    setTimeout(() => this.playNoise(0.08, 0.06), 200);
    // Electrical buzz
    this.playTone(120, 0.15, 'square', 0.03);
  }

  playGhostSting() {
    if (!this.ctx || !this.masterGain) return;
    // More dramatic ghost reveal sting
    this.playTone(120, 1.5, 'sine', 0.25);
    this.playTone(127, 1.5, 'sine', 0.22);
    this.playTone(240, 0.8, 'triangle', 0.12);
    this.playNoise(0.4, 0.15);
    // Descending dissonance
    setTimeout(() => {
      this.playTone(60, 2, 'sine', 0.1);
      this.playNoise(1, 0.06);
      this.playFilteredNoise(1.5, 0.05, 800, 'bandpass', 4);
    }, 200);
    // Reverse-sounding swell
    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 1);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, this.ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.5);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);
      osc.connect(g);
      g.connect(this.masterGain!);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.5);
    }, 400);
  }

  playGhostScream() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    // MASSIVE layered scream
    this.playTone(180, 2.5, 'sawtooth', 0.4);
    this.playTone(190, 2.5, 'sawtooth', 0.35);
    this.playTone(380, 2, 'square', 0.25);
    this.playNoise(2, 0.3);
    
    // Rising shriek - primary
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(2500, t + 0.8);
    osc.frequency.linearRampToValueAtTime(1800, t + 1.5);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.linearRampToValueAtTime(0.35, t + 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, t + 2);
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = 3500;
    osc.connect(filt);
    filt.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(t + 2.5);

    // Sub bass impact - chest-punch
    this.playTone(20, 1.5, 'sine', 0.4);
    this.playTone(25, 1, 'sine', 0.35);
    
    // Dissonant cluster
    setTimeout(() => {
      this.playTone(440, 1.2, 'sawtooth', 0.18);
      this.playTone(466, 1.2, 'sawtooth', 0.15);
      this.playTone(233, 1.5, 'square', 0.1);
    }, 80);

    // Noise burst for impact texture
    this.playFilteredNoise(0.5, 0.3, 2000, 'lowpass');
  }

  // Jumpscare stinger
  playJumpscareStinger() {
    if (!this.ctx || !this.masterGain) return;
    this.playNoise(0.15, 0.45);
    this.playTone(100, 0.4, 'square', 0.45);
    this.playTone(2000, 0.25, 'sawtooth', 0.25);
    this.playTone(30, 0.5, 'sine', 0.3); // sub thud
    setTimeout(() => {
      this.playNoise(0.3, 0.2);
      this.playTone(3000, 0.15, 'sawtooth', 0.15);
    }, 50);
  }

  // Sustained tension drone during ghost approach
  playApproachDrone() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    // Low dissonant drone that builds
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, t);
    osc1.frequency.linearRampToValueAtTime(75, t + 5);
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(58, t);
    osc2.frequency.linearRampToValueAtTime(78, t + 5);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.18, t + 2.5);
    g.gain.linearRampToValueAtTime(0.12, t + 4);
    g.gain.exponentialRampToValueAtTime(0.001, t + 6);
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(200, t);
    filt.frequency.linearRampToValueAtTime(1000, t + 5);
    osc1.connect(filt);
    osc2.connect(filt);
    filt.connect(g);
    g.connect(this.masterGain);
    osc1.start();
    osc2.start();
    osc1.stop(t + 6);
    osc2.stop(t + 6);
    
    // Whispery noise texture
    this.playFilteredNoise(5, 0.06, 1200, 'bandpass', 3);
    
    // Rising tension - high dissonant string
    const osc3 = this.ctx.createOscillator();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(220, t + 1);
    osc3.frequency.linearRampToValueAtTime(350, t + 5);
    const g3 = this.ctx.createGain();
    g3.gain.setValueAtTime(0.001, t);
    g3.gain.linearRampToValueAtTime(0.04, t + 3);
    g3.gain.exponentialRampToValueAtTime(0.001, t + 5.5);
    osc3.connect(g3);
    g3.connect(this.masterGain);
    osc3.start(t + 1);
    osc3.stop(t + 6);
  }

  // Breathing sound - rhythmic filtered noise
  playBreathingSound() {
    if (!this.ctx || !this.masterGain) return;
    const duration = 4;
    const bufLen = this.ctx.sampleRate * duration;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      const t = i / this.ctx.sampleRate;
      const breathCycle = Math.sin(t * Math.PI * 2 * 0.8);
      const envelope = Math.max(0, breathCycle);
      d[i] = (Math.random() * 2 - 1) * envelope;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 400;
    filt.Q.value = 2;
    const g = this.ctx.createGain();
    g.gain.value = 0.1;
    src.connect(filt);
    filt.connect(g);
    g.connect(this.masterGain);
    src.start();
  }

  playWhisper() {
    if (!this.ctx || !this.masterGain) return;
    this.playFilteredNoise(2, 0.04, 1500, 'bandpass', 3);
    // Second whisper layer slightly delayed
    setTimeout(() => {
      this.playFilteredNoise(1.5, 0.03, 1800, 'bandpass', 4);
    }, 300);
  }

  startHeartbeat(rate = 1000) {
    this.stopHeartbeat();
    const beat = () => {
      this.playTone(45, 0.15, 'sine', 0.25);
      setTimeout(() => this.playTone(40, 0.12, 'sine', 0.18), 150);
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

  // Wind gust during portal transition
  playTransitionWind() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const bufLen = this.ctx.sampleRate * 4;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(100, t);
    filt.frequency.linearRampToValueAtTime(500, t + 1.5);
    filt.frequency.linearRampToValueAtTime(100, t + 3.5);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.1, t + 0.8);
    g.gain.linearRampToValueAtTime(0.05, t + 2.5);
    g.gain.exponentialRampToValueAtTime(0.001, t + 3.8);
    src.connect(filt);
    filt.connect(g);
    g.connect(this.masterGain);
    src.start();
    // Deep rumble + wood groan
    this.playTone(28, 3, 'sine', 0.08);
    setTimeout(() => {
      this.playTone(55, 1.5, 'triangle', 0.04);
    }, 500);
  }

  playChurchBell() {
    this.playTone(220, 2, 'sine', 0.12);
    this.playTone(330, 1.5, 'sine', 0.06);
  }

  // Menu ambience - richer, louder, more layers
  private menuAmbienceLayers: { source: AudioBufferSourceNode | OscillatorNode; gain: GainNode }[] = [];
  private menuAmbienceTimers: ReturnType<typeof setTimeout>[] = [];

  playMenuAmbience() {
    this.stopMenuAmbience();
    if (!this.ctx || !this.masterGain) return;

    // Continuous wind layer - louder
    const windLen = this.ctx.sampleRate * 6;
    const windBuf = this.ctx.createBuffer(1, windLen, this.ctx.sampleRate);
    const wd = windBuf.getChannelData(0);
    for (let i = 0; i < windLen; i++) wd[i] = (Math.random() * 2 - 1);
    const windSrc = this.ctx.createBufferSource();
    windSrc.buffer = windBuf;
    windSrc.loop = true;
    const windFilt = this.ctx.createBiquadFilter();
    windFilt.type = 'lowpass';
    windFilt.frequency.value = 200;
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.12;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 100;
    lfo.connect(lfoGain);
    lfoGain.connect(windFilt.frequency);
    lfo.start();
    const windG = this.ctx.createGain();
    windG.gain.value = 0.06; // louder wind
    windSrc.connect(windFilt);
    windFilt.connect(windG);
    windG.connect(this.masterGain);
    windSrc.start();
    this.menuAmbienceLayers.push({ source: windSrc, gain: windG });

    // Second wind layer - higher frequency gusts
    const gust2Src = this.ctx.createBufferSource();
    gust2Src.buffer = windBuf;
    gust2Src.loop = true;
    const gust2Filt = this.ctx.createBiquadFilter();
    gust2Filt.type = 'bandpass';
    gust2Filt.frequency.value = 400;
    gust2Filt.Q.value = 1;
    const lfo2 = this.ctx.createOscillator();
    lfo2.type = 'sine';
    lfo2.frequency.value = 0.08;
    const lfo2Gain = this.ctx.createGain();
    lfo2Gain.gain.value = 150;
    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(gust2Filt.frequency);
    lfo2.start();
    const gust2G = this.ctx.createGain();
    gust2G.gain.value = 0.025;
    gust2Src.connect(gust2Filt);
    gust2Filt.connect(gust2G);
    gust2G.connect(this.masterGain);
    gust2Src.start();
    this.menuAmbienceLayers.push({ source: gust2Src, gain: gust2G });

    // Deep drone - richer
    const drone = this.ctx.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 32;
    const droneG = this.ctx.createGain();
    droneG.gain.value = 0.06;
    drone.connect(droneG);
    droneG.connect(this.masterGain);
    drone.start();
    this.menuAmbienceLayers.push({ source: drone, gain: droneG });

    // Second drone - dissonant interval
    const drone2 = this.ctx.createOscillator();
    drone2.type = 'triangle';
    drone2.frequency.value = 37; // slightly dissonant with 32Hz
    const drone2G = this.ctx.createGain();
    drone2G.gain.value = 0.03;
    drone2.connect(drone2G);
    drone2G.connect(this.masterGain);
    drone2.start();
    this.menuAmbienceLayers.push({ source: drone2, gain: drone2G });

    // Periodic whispers - more frequent
    const scheduleWhisper = () => {
      const delay = 3000 + Math.random() * 6000;
      const timer = setTimeout(() => {
        if (!this.ctx || !this.masterGain) return;
        const wLen = this.ctx.sampleRate * 1.5;
        const wBuf = this.ctx.createBuffer(1, wLen, this.ctx.sampleRate);
        const d = wBuf.getChannelData(0);
        for (let i = 0; i < wLen; i++) {
          d[i] = (Math.random() * 2 - 1) * Math.sin(i / wLen * Math.PI);
        }
        const wSrc = this.ctx.createBufferSource();
        wSrc.buffer = wBuf;
        const f = this.ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 1000 + Math.random() * 800;
        f.Q.value = 4;
        const g = this.ctx.createGain();
        g.gain.value = 0.02;
        wSrc.connect(f);
        f.connect(g);
        g.connect(this.masterGain!);
        wSrc.start();
        scheduleWhisper();
      }, delay);
      this.menuAmbienceTimers.push(timer);
    };
    scheduleWhisper();

    // Sparse eerie piano notes - minor key
    const schedulePiano = () => {
      const delay = 3000 + Math.random() * 5000;
      const timer = setTimeout(() => {
        if (!this.ctx || !this.masterGain) return;
        // Minor key notes for darker feel
        const notes = [103.83, 110, 123.47, 130.81, 146.83, 155.56, 185, 196];
        const freq = notes[Math.floor(Math.random() * notes.length)];
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.detune.value = (Math.random() - 0.5) * 12;
        const g = this.ctx.createGain();
        g.gain.value = 0.04; // slightly louder
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 3.5);
        // Reverb-like delay
        const dly = this.ctx.createDelay();
        dly.delayTime.value = 0.5;
        const dly2 = this.ctx.createDelay();
        dly2.delayTime.value = 1.1;
        const dlyG = this.ctx.createGain();
        dlyG.gain.value = 0.02;
        const dly2G = this.ctx.createGain();
        dly2G.gain.value = 0.01;
        osc.connect(g);
        g.connect(this.masterGain!);
        g.connect(dly);
        dly.connect(dlyG);
        dlyG.connect(this.masterGain!);
        g.connect(dly2);
        dly2.connect(dly2G);
        dly2G.connect(this.masterGain!);
        osc.start();
        osc.stop(this.ctx.currentTime + 4);
        schedulePiano();
      }, delay);
      this.menuAmbienceTimers.push(timer);
    };
    schedulePiano();

    // Occasional distant thunder/rumble
    const scheduleThunder = () => {
      const delay = 12000 + Math.random() * 20000;
      const timer = setTimeout(() => {
        if (!this.ctx || !this.masterGain) return;
        this.playTone(22, 2, 'sine', 0.06);
        this.playFilteredNoise(1.5, 0.04, 150, 'lowpass');
        scheduleThunder();
      }, delay);
      this.menuAmbienceTimers.push(timer);
    };
    scheduleThunder();
  }

  stopMenuAmbience() {
    this.menuAmbienceLayers.forEach(l => { try { l.source.stop(); } catch {} });
    this.menuAmbienceLayers = [];
    this.menuAmbienceTimers.forEach(t => clearTimeout(t));
    this.menuAmbienceTimers = [];
  }

  stopAll() {
    this.stopAmbient();
    this.stopHeartbeat();
    this.stopMusic();
    this.stopRoomAmbience();
    this.stopMenuAmbience();
  }
}

export const audioManager = new AudioManager();
