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
    // Slow, deliberate horror piano — think "The Shining" / "Insidious"
    // Minor 2nds, tritones, diminished chords — deeply unsettling intervals
    const darkPhrases = [
      // Each phrase is [note, delayMs, duration, volume] — slow, deliberate
      [65.41, 0, 6, 0.07],    // C2 — deep, ominous
      [69.30, 1800, 5, 0.05], // C#2 — minor 2nd = maximum dread
      [65.41, 3800, 4, 0.04], // repeat root — lingering
      
      [87.31, 0, 6, 0.065],   // F2
      [92.50, 2200, 5, 0.05], // F#2 — tritone region
      [82.41, 4500, 4, 0.04], // E2 — descending = despair
      
      [110, 0, 6, 0.06],      // A2
      [116.54, 1500, 5, 0.055],// Bb2 — minor 2nd
      [103.83, 3500, 5, 0.04], // Ab2 — chromatic descent
      
      [73.42, 0, 7, 0.07],    // D2 — very low, ominous
      [69.30, 2500, 5, 0.05], // C#2 — half step down = sinister
      [77.78, 5000, 4, 0.04], // Eb2 — minor 3rd above root
      
      [55.00, 0, 8, 0.08],    // A1 — extremely low, dread
      [58.27, 3000, 6, 0.06], // Bb1 — minor 2nd in bass = terrifying
    ];
    
    let phraseIdx = 0;
    
    const playPhrase = () => {
      if (!this.musicPlaying || !this.ctx || !this.musicGain) return;
      const startIdx = phraseIdx * 3;
      const phrase = darkPhrases.slice(startIdx, startIdx + 3);
      if (phrase.length === 0) { phraseIdx = 0; playPhrase(); return; }
      phraseIdx++;
      if (phraseIdx * 3 >= darkPhrases.length) phraseIdx = 0;
      
      phrase.forEach(([freq, delayMs, dur, vol]) => {
        setTimeout(() => {
          if (!this.musicPlaying || !this.ctx || !this.musicGain) return;
          const t = this.ctx.currentTime;
          // Main note with slow attack — piano hammer feel
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;
          osc.detune.value = (Math.random() - 0.5) * 8; // subtle detuning
          const g = this.ctx.createGain();
          g.gain.setValueAtTime(0.001, t);
          g.gain.linearRampToValueAtTime(vol, t + 0.02); // sharp attack
          g.gain.exponentialRampToValueAtTime(vol * 0.6, t + 0.5); // sustain decay
          g.gain.exponentialRampToValueAtTime(0.001, t + dur); // long tail
          
          // Sympathetic string resonance (2nd harmonic, very quiet)
          const harm = this.ctx!.createOscillator();
          harm.type = 'sine';
          harm.frequency.value = freq * 2;
          const hg = this.ctx!.createGain();
          hg.gain.setValueAtTime(vol * 0.15, t);
          hg.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.7);
          
          // Long reverb tail — cavernous, haunted hall
          const dly1 = this.ctx!.createDelay(); dly1.delayTime.value = 0.45;
          const dly1g = this.ctx!.createGain(); dly1g.gain.value = 0.04;
          const dly2 = this.ctx!.createDelay(); dly2.delayTime.value = 1.1;
          const dly2g = this.ctx!.createGain(); dly2g.gain.value = 0.025;
          const dly3 = this.ctx!.createDelay(); dly3.delayTime.value = 2.0;
          const dly3g = this.ctx!.createGain(); dly3g.gain.value = 0.015;
          
          osc.connect(g); g.connect(this.musicGain!);
          g.connect(dly1); dly1.connect(dly1g); dly1g.connect(this.musicGain!);
          g.connect(dly2); dly2.connect(dly2g); dly2g.connect(this.musicGain!);
          g.connect(dly3); dly3.connect(dly3g); dly3g.connect(this.musicGain!);
          harm.connect(hg); hg.connect(this.musicGain!);
          
          osc.start(t); osc.stop(t + dur + 0.5);
          harm.start(t); harm.stop(t + dur * 0.7 + 0.5);
        }, delayMs);
      });
    };
    
    const scheduleNext = () => {
      if (!this.musicPlaying) return;
      const d = 6000 + Math.random() * 4000; // slower pacing — more dread
      setTimeout(() => { playPhrase(); scheduleNext(); }, d);
    };
    setTimeout(() => { playPhrase(); scheduleNext(); }, 2000);
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

    // Layer 1: Heavy iron/wood creak — slow, agonizing groan
    const creak1 = this.ctx.createOscillator();
    creak1.type = 'sawtooth';
    creak1.frequency.setValueAtTime(45, t);
    creak1.frequency.linearRampToValueAtTime(120, t + 1.0);
    creak1.frequency.linearRampToValueAtTime(65, t + 2.0);
    creak1.frequency.linearRampToValueAtTime(180, t + 3.0);
    creak1.frequency.exponentialRampToValueAtTime(50, t + 4.0);
    const cg1 = this.ctx.createGain();
    cg1.gain.setValueAtTime(0.001, t);
    cg1.gain.linearRampToValueAtTime(0.14, t + 0.5);
    cg1.gain.linearRampToValueAtTime(0.09, t + 2.0);
    cg1.gain.linearRampToValueAtTime(0.12, t + 3.0);
    cg1.gain.exponentialRampToValueAtTime(0.001, t + 4.5);
    const cf1 = this.ctx.createBiquadFilter();
    cf1.type = 'bandpass'; cf1.frequency.value = 280; cf1.Q.value = 5;
    creak1.connect(cf1); cf1.connect(cg1); cg1.connect(this.masterGain);
    creak1.start(t); creak1.stop(t + 4.5);

    // Layer 2: High rusty hinge shriek — painful, metallic
    const hinge = this.ctx.createOscillator();
    hinge.type = 'square';
    hinge.frequency.setValueAtTime(600, t + 0.3);
    hinge.frequency.exponentialRampToValueAtTime(250, t + 1.2);
    hinge.frequency.linearRampToValueAtTime(700, t + 2.2);
    hinge.frequency.exponentialRampToValueAtTime(200, t + 3.5);
    const hg = this.ctx.createGain();
    hg.gain.setValueAtTime(0.001, t);
    hg.gain.linearRampToValueAtTime(0.04, t + 0.5);
    hg.gain.linearRampToValueAtTime(0.02, t + 1.5);
    hg.gain.linearRampToValueAtTime(0.035, t + 2.5);
    hg.gain.exponentialRampToValueAtTime(0.001, t + 3.8);
    const hf = this.ctx.createBiquadFilter();
    hf.type = 'bandpass'; hf.frequency.value = 800; hf.Q.value = 8;
    hinge.connect(hf); hf.connect(hg); hg.connect(this.masterGain);
    hinge.start(t + 0.2); hinge.stop(t + 4.0);

    // Layer 3: Deep wood stress groan — subsonic weight
    const wood = this.ctx.createOscillator();
    wood.type = 'triangle';
    wood.frequency.setValueAtTime(35, t);
    wood.frequency.linearRampToValueAtTime(60, t + 1.5);
    wood.frequency.linearRampToValueAtTime(30, t + 3.0);
    const wg = this.ctx.createGain();
    wg.gain.setValueAtTime(0.001, t);
    wg.gain.linearRampToValueAtTime(0.08, t + 0.8);
    wg.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
    wood.connect(wg); wg.connect(this.masterGain);
    wood.start(t); wood.stop(t + 3.5);

    // Layer 4: Heavy latch clunk — mechanical, cold
    this.playTone(80, 0.06, 'square', 0.12);
    setTimeout(() => this.playTone(55, 0.04, 'square', 0.08), 40);

    // Layer 5: Cold air rush through opening
    setTimeout(() => {
      this.playFilteredNoise(3, 0.06, 350, 'bandpass', 2);
    }, 800);

    // Layer 6: Sub bass slam feel
    const sub = this.ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = 22;
    const sg = this.ctx.createGain();
    sg.gain.setValueAtTime(0.001, t);
    sg.gain.linearRampToValueAtTime(0.12, t + 0.1);
    sg.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
    sub.connect(sg); sg.connect(this.masterGain);
    sub.start(t); sub.stop(t + 2.0);

    // Layer 7: Eerie tonal whisper as door opens
    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      const eerieOsc = this.ctx.createOscillator();
      eerieOsc.type = 'sine';
      eerieOsc.frequency.setValueAtTime(220, this.ctx.currentTime);
      eerieOsc.frequency.linearRampToValueAtTime(185, this.ctx.currentTime + 2);
      const eg = this.ctx.createGain();
      eg.gain.setValueAtTime(0.001, this.ctx.currentTime);
      eg.gain.linearRampToValueAtTime(0.025, this.ctx.currentTime + 0.8);
      eg.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.5);
      eerieOsc.connect(eg); eg.connect(this.masterGain!);
      eerieOsc.start(); eerieOsc.stop(this.ctx.currentTime + 3);
    }, 500);
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
    const t = this.ctx.currentTime;
    // Heavy slam — violent, final
    this.playTone(20, 0.8, 'sine', 0.3); // massive sub impact
    this.playNoise(0.2, 0.25); // impact crack
    // Dissonant horror sting
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.linearRampToValueAtTime(60, t + 1);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 400;
    osc.connect(f); f.connect(g); g.connect(this.masterGain);
    osc.start(t); osc.stop(t + 1.5);
    // Second dissonant tone
    setTimeout(() => {
      this.playTone(95, 0.8, 'sawtooth', 0.1);
      this.playNoise(0.3, 0.08);
    }, 80);
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
    if (!this.ctx || !this.masterGain) return;
    // Eerie low confirmation — not happy, just... relief mixed with dread
    this.playTone(110, 1.5, 'sine', 0.08);
    this.playTone(130.81, 1.5, 'sine', 0.05); // minor 3rd — somber
    setTimeout(() => {
      this.playFilteredNoise(1.2, 0.03, 300, 'bandpass', 2);
    }, 200);
    this.playTone(25, 1, 'sine', 0.06); // sub rumble
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

    // Slow, cinematic horror piano — deliberate single notes with long decay
    const menuPhrases = [
      [55.00, 0, 8, 0.08],    // A1
      [58.27, 2500, 7, 0.06], // Bb1 — minor 2nd
      [51.91, 5500, 6, 0.05], // Ab1 — descending
      
      [65.41, 0, 7, 0.07],    // C2
      [69.30, 2000, 6, 0.06], // C#2
      [61.74, 4500, 5, 0.05], // B1

      [73.42, 0, 8, 0.07],    // D2
      [77.78, 3000, 6, 0.055],// Eb2
      [69.30, 6000, 5, 0.04], // C#2
    ];
    let menuPhraseIdx = 0;
    
    const schedulePiano = () => {
      const delay = 5000 + Math.random() * 5000; // very slow pacing
      const timer = setTimeout(() => {
        if (!this.ctx || !this.masterGain) return;
        const startIdx = menuPhraseIdx * 3;
        const phrase = menuPhrases.slice(startIdx, startIdx + 3);
        if (phrase.length === 0) { menuPhraseIdx = 0; schedulePiano(); return; }
        menuPhraseIdx++;
        if (menuPhraseIdx * 3 >= menuPhrases.length) menuPhraseIdx = 0;
        
        phrase.forEach(([freq, delayMs, dur, vol]) => {
          setTimeout(() => {
            if (!this.ctx || !this.masterGain) return;
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            osc.detune.value = (Math.random() - 0.5) * 6;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.001, t);
            g.gain.linearRampToValueAtTime(vol, t + 0.015);
            g.gain.exponentialRampToValueAtTime(vol * 0.5, t + 0.6);
            g.gain.exponentialRampToValueAtTime(0.001, t + dur);
            // Harmonic shimmer
            const h = this.ctx!.createOscillator();
            h.type = 'sine';
            h.frequency.value = freq * 2;
            const hg = this.ctx!.createGain();
            hg.gain.setValueAtTime(vol * 0.12, t);
            hg.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.6);
            // Long hall reverb
            const d1 = this.ctx!.createDelay(); d1.delayTime.value = 0.5;
            const d1g = this.ctx!.createGain(); d1g.gain.value = 0.035;
            const d2 = this.ctx!.createDelay(); d2.delayTime.value = 1.3;
            const d2g = this.ctx!.createGain(); d2g.gain.value = 0.02;
            const d3 = this.ctx!.createDelay(); d3.delayTime.value = 2.2;
            const d3g = this.ctx!.createGain(); d3g.gain.value = 0.01;
            osc.connect(g); g.connect(this.masterGain!);
            g.connect(d1); d1.connect(d1g); d1g.connect(this.masterGain!);
            g.connect(d2); d2.connect(d2g); d2g.connect(this.masterGain!);
            g.connect(d3); d3.connect(d3g); d3g.connect(this.masterGain!);
            h.connect(hg); hg.connect(this.masterGain!);
            osc.start(t); osc.stop(t + dur + 1);
            h.start(t); h.stop(t + dur * 0.6 + 1);
          }, delayMs);
        });
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
