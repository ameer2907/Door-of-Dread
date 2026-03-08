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

  // === CONJURING-STYLE GHOST REVEAL STING ===
  playGhostSting() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    // Layer 1: Massive orchestral hit — low brass stab
    const brass1 = this.ctx.createOscillator();
    brass1.type = 'sawtooth';
    brass1.frequency.setValueAtTime(65, t);
    brass1.frequency.linearRampToValueAtTime(55, t + 2);
    const bg1 = this.ctx.createGain();
    bg1.gain.setValueAtTime(0.35, t);
    bg1.gain.exponentialRampToValueAtTime(0.15, t + 0.5);
    bg1.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
    const bf1 = this.ctx.createBiquadFilter();
    bf1.type = 'lowpass'; bf1.frequency.value = 400;
    brass1.connect(bf1); bf1.connect(bg1); bg1.connect(this.masterGain);
    brass1.start(t); brass1.stop(t + 2.5);
    
    // Layer 2: Dissonant minor 2nd cluster
    [120, 127, 113].forEach(freq => {
      this.playTone(freq, 2.5, 'sine', 0.2);
    });
    
    // Layer 3: High shrieking string glissando
    const shriek = this.ctx.createOscillator();
    shriek.type = 'sawtooth';
    shriek.frequency.setValueAtTime(800, t);
    shriek.frequency.exponentialRampToValueAtTime(3000, t + 0.3);
    shriek.frequency.exponentialRampToValueAtTime(1200, t + 1.5);
    const skg = this.ctx.createGain();
    skg.gain.setValueAtTime(0.001, t);
    skg.gain.linearRampToValueAtTime(0.12, t + 0.1);
    skg.gain.exponentialRampToValueAtTime(0.001, t + 2);
    const skf = this.ctx.createBiquadFilter();
    skf.type = 'highpass'; skf.frequency.value = 600;
    shriek.connect(skf); skf.connect(skg); skg.connect(this.masterGain);
    shriek.start(t); shriek.stop(t + 2.5);
    
    // Layer 4: Sub-bass earthquake thud
    this.playTone(18, 1.5, 'sine', 0.4);
    this.playNoise(0.3, 0.2);
    
    // Layer 5: Reverse-swell demonic whisper
    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      this.playFilteredNoise(2, 0.08, 800, 'bandpass', 5);
      const v1 = this.ctx.createOscillator();
      v1.type = 'sawtooth';
      v1.frequency.setValueAtTime(180, this.ctx.currentTime);
      v1.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 1.5);
      const vg = this.ctx.createGain();
      vg.gain.setValueAtTime(0.001, this.ctx.currentTime);
      vg.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.8);
      vg.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2);
      const vf = this.ctx.createBiquadFilter();
      vf.type = 'bandpass'; vf.frequency.value = 300; vf.Q.value = 3;
      v1.connect(vf); vf.connect(vg); vg.connect(this.masterGain!);
      v1.start(); v1.stop(this.ctx.currentTime + 2.5);
    }, 200);
  }

  // === CONJURING-STYLE DEMONIC SCREAM ===
  playGhostScream() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    // Layer 1: Primary demonic scream
    const scream = this.ctx.createOscillator();
    scream.type = 'sawtooth';
    scream.frequency.setValueAtTime(150, t);
    scream.frequency.exponentialRampToValueAtTime(900, t + 0.3);
    scream.frequency.linearRampToValueAtTime(700, t + 1.5);
    scream.frequency.exponentialRampToValueAtTime(2000, t + 2.5);
    const scg = this.ctx.createGain();
    scg.gain.setValueAtTime(0.5, t);
    scg.gain.linearRampToValueAtTime(0.6, t + 0.5);
    scg.gain.linearRampToValueAtTime(0.5, t + 2);
    scg.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
    const scf = this.ctx.createBiquadFilter();
    scf.type = 'lowpass'; scf.frequency.value = 4000;
    scream.connect(scf); scf.connect(scg); scg.connect(this.masterGain);
    scream.start(t); scream.stop(t + 3.5);
    
    // Layer 2: Detuned second voice — demonic chorus
    const scream2 = this.ctx.createOscillator();
    scream2.type = 'sawtooth';
    scream2.frequency.setValueAtTime(155, t);
    scream2.frequency.exponentialRampToValueAtTime(920, t + 0.35);
    scream2.frequency.linearRampToValueAtTime(720, t + 1.5);
    scream2.frequency.exponentialRampToValueAtTime(2100, t + 2.5);
    const sc2g = this.ctx.createGain();
    sc2g.gain.setValueAtTime(0.4, t);
    sc2g.gain.exponentialRampToValueAtTime(0.001, t + 3);
    scream2.connect(sc2g); sc2g.connect(this.masterGain);
    scream2.start(t); scream2.stop(t + 3.5);
    
    // Layer 3: Sub-octave growl
    const growl = this.ctx.createOscillator();
    growl.type = 'sawtooth';
    growl.frequency.setValueAtTime(75, t);
    growl.frequency.linearRampToValueAtTime(45, t + 2);
    const gg = this.ctx.createGain();
    gg.gain.setValueAtTime(0.35, t);
    gg.gain.exponentialRampToValueAtTime(0.001, t + 3);
    const gf = this.ctx.createBiquadFilter();
    gf.type = 'lowpass'; gf.frequency.value = 200;
    growl.connect(gf); gf.connect(gg); gg.connect(this.masterGain);
    growl.start(t); growl.stop(t + 3.5);
    
    // Layer 4: Massive sub-bass body slam
    this.playTone(15, 2, 'sine', 0.5);
    this.playTone(22, 1.5, 'sine', 0.45);
    
    // Layer 5: High-frequency screeching
    const screech = this.ctx.createOscillator();
    screech.type = 'square';
    screech.frequency.setValueAtTime(1500, t + 0.1);
    screech.frequency.exponentialRampToValueAtTime(4000, t + 0.5);
    screech.frequency.linearRampToValueAtTime(2500, t + 2);
    const schg = this.ctx.createGain();
    schg.gain.setValueAtTime(0.001, t);
    schg.gain.linearRampToValueAtTime(0.15, t + 0.2);
    schg.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
    const schf = this.ctx.createBiquadFilter();
    schf.type = 'bandpass'; schf.frequency.value = 3000; schf.Q.value = 2;
    screech.connect(schf); schf.connect(schg); schg.connect(this.masterGain);
    screech.start(t); screech.stop(t + 3);
    
    // Layer 6: Distorted noise — raw terror
    this.playNoise(2.5, 0.35);
    this.playFilteredNoise(3, 0.15, 1500, 'bandpass', 3);
    
    // Layer 7: Dissonant brass stabs (Conjuring-style)
    setTimeout(() => {
      this.playTone(110, 1.5, 'sawtooth', 0.25);
      this.playTone(117, 1.5, 'sawtooth', 0.2);
      this.playTone(220, 1, 'square', 0.15);
      this.playTone(233, 1, 'square', 0.12);
    }, 100);
    
    // Layer 8: Delayed secondary scream wave
    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      const wave2 = this.ctx.createOscillator();
      wave2.type = 'sawtooth';
      wave2.frequency.setValueAtTime(500, this.ctx.currentTime);
      wave2.frequency.exponentialRampToValueAtTime(3000, this.ctx.currentTime + 0.5);
      wave2.frequency.linearRampToValueAtTime(1000, this.ctx.currentTime + 1.5);
      const w2g = this.ctx.createGain();
      w2g.gain.setValueAtTime(0.3, this.ctx.currentTime);
      w2g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2);
      wave2.connect(w2g); w2g.connect(this.masterGain!);
      wave2.start(); wave2.stop(this.ctx.currentTime + 2.5);
      this.playNoise(1, 0.2);
    }, 300);
  }

  // === MASSIVE JUMPSCARE STINGER ===
  playJumpscareStinger() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    this.playNoise(0.2, 0.5);
    this.playTone(80, 0.5, 'square', 0.5);
    this.playTone(85, 0.5, 'square', 0.45);
    this.playTone(160, 0.4, 'sawtooth', 0.35);
    this.playTone(20, 0.8, 'sine', 0.5);
    const jShriek = this.ctx.createOscillator();
    jShriek.type = 'sawtooth';
    jShriek.frequency.setValueAtTime(2000, t);
    jShriek.frequency.exponentialRampToValueAtTime(5000, t + 0.15);
    jShriek.frequency.linearRampToValueAtTime(3000, t + 0.4);
    const jsg = this.ctx.createGain();
    jsg.gain.setValueAtTime(0.3, t);
    jsg.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    jShriek.connect(jsg); jsg.connect(this.masterGain);
    jShriek.start(t); jShriek.stop(t + 0.6);
    setTimeout(() => {
      this.playNoise(0.4, 0.3);
      this.playTone(3500, 0.2, 'sawtooth', 0.2);
      this.playTone(40, 0.6, 'sine', 0.35);
    }, 60);
  }

  // === BEHIND-SPAWN — whisper-to-scream ===
  playGhostBehindReveal() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    this.playFilteredNoise(1.5, 0.12, 600, 'bandpass', 6);
    const whisperGrowl = this.ctx.createOscillator();
    whisperGrowl.type = 'sawtooth';
    whisperGrowl.frequency.setValueAtTime(100, t);
    whisperGrowl.frequency.linearRampToValueAtTime(60, t + 1);
    whisperGrowl.frequency.linearRampToValueAtTime(200, t + 2);
    const wgg = this.ctx.createGain();
    wgg.gain.setValueAtTime(0.001, t);
    wgg.gain.linearRampToValueAtTime(0.15, t + 0.5);
    wgg.gain.linearRampToValueAtTime(0.25, t + 1.5);
    wgg.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
    const wgf = this.ctx.createBiquadFilter();
    wgf.type = 'bandpass'; wgf.frequency.value = 250; wgf.Q.value = 4;
    whisperGrowl.connect(wgf); wgf.connect(wgg); wgg.connect(this.masterGain);
    whisperGrowl.start(t); whisperGrowl.stop(t + 2.5);
    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      this.playTone(18, 1, 'sine', 0.45);
      this.playNoise(0.3, 0.35);
      this.playTone(90, 0.6, 'square', 0.35);
      this.playTone(95, 0.6, 'square', 0.3);
    }, 800);
  }

  // === CONTINUOUS HORROR DRONE — plays while ghost is visible ===
  playGhostPresenceDrone() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    // Deep rumbling bass drone
    const drone = this.ctx.createOscillator();
    drone.type = 'sawtooth';
    drone.frequency.setValueAtTime(40, t);
    drone.frequency.linearRampToValueAtTime(55, t + 3);
    drone.frequency.linearRampToValueAtTime(35, t + 5);
    const dg = this.ctx.createGain();
    dg.gain.setValueAtTime(0.001, t);
    dg.gain.linearRampToValueAtTime(0.2, t + 1);
    dg.gain.linearRampToValueAtTime(0.15, t + 4);
    dg.gain.exponentialRampToValueAtTime(0.001, t + 6);
    const df = this.ctx.createBiquadFilter();
    df.type = 'lowpass'; df.frequency.value = 250;
    drone.connect(df); df.connect(dg); dg.connect(this.masterGain);
    drone.start(t); drone.stop(t + 6.5);
    
    // Dissonant beating — two close frequencies create unsettling wavering
    const beat1 = this.ctx.createOscillator();
    beat1.type = 'sine';
    beat1.frequency.value = 92;
    const beat2 = this.ctx.createOscillator();
    beat2.type = 'sine';
    beat2.frequency.value = 97; // 5Hz beat frequency — nauseating
    const bg = this.ctx.createGain();
    bg.gain.setValueAtTime(0.001, t);
    bg.gain.linearRampToValueAtTime(0.12, t + 1.5);
    bg.gain.exponentialRampToValueAtTime(0.001, t + 5);
    beat1.connect(bg); beat2.connect(bg); bg.connect(this.masterGain);
    beat1.start(t); beat2.start(t);
    beat1.stop(t + 5.5); beat2.stop(t + 5.5);
    
    // Whispery wind texture throughout
    this.playFilteredNoise(5, 0.08, 400, 'bandpass', 3);
    
    // Intermittent creepy tones
    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      this.playTone(180, 2, 'triangle', 0.06);
      this.playTone(185, 2, 'triangle', 0.05);
    }, 1500);
    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      this.playFilteredNoise(1.5, 0.06, 1200, 'bandpass', 5);
    }, 3000);
  }

  // === LOUD GHOST ARRIVAL SCREAM — instant shock ===
  playGhostArrivalScream() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    
    // Instant loud impact — no fade in
    this.playNoise(0.3, 0.4);
    this.playTone(25, 1, 'sine', 0.45); // chest-shaking sub
    
    // Sharp dissonant stab
    this.playTone(100, 1, 'square', 0.35);
    this.playTone(106, 1, 'square', 0.3); // minor 2nd
    
    // Shrieking wail
    const wail = this.ctx.createOscillator();
    wail.type = 'sawtooth';
    wail.frequency.setValueAtTime(400, t);
    wail.frequency.exponentialRampToValueAtTime(1800, t + 0.4);
    wail.frequency.linearRampToValueAtTime(600, t + 1.5);
    const wg = this.ctx.createGain();
    wg.gain.setValueAtTime(0.3, t);
    wg.gain.exponentialRampToValueAtTime(0.001, t + 2);
    const wf = this.ctx.createBiquadFilter();
    wf.type = 'lowpass'; wf.frequency.value = 3000;
    wail.connect(wf); wf.connect(wg); wg.connect(this.masterGain);
    wail.start(t); wail.stop(t + 2.5);
    
    // Demonic growl undertone
    const growl = this.ctx.createOscillator();
    growl.type = 'sawtooth';
    growl.frequency.setValueAtTime(60, t);
    growl.frequency.linearRampToValueAtTime(40, t + 1.5);
    const grg = this.ctx.createGain();
    grg.gain.setValueAtTime(0.25, t);
    grg.gain.exponentialRampToValueAtTime(0.001, t + 2);
    const grf = this.ctx.createBiquadFilter();
    grf.type = 'lowpass'; grf.frequency.value = 150;
    growl.connect(grf); grf.connect(grg); grg.connect(this.masterGain);
    growl.start(t); growl.stop(t + 2.5);
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

  // === RANDOM HORROR EVENT SOUNDS ===

  /** Random whisper from behind — directional feeling */
  playRandomWhisper() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    // Breathy whisper noise
    const bufLen = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      const env = Math.sin((i / bufLen) * Math.PI);
      d[i] = (Math.random() * 2 - 1) * env;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 1200 + Math.random() * 600;
    filt.Q.value = 4;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.035, t + 0.3);
    g.gain.linearRampToValueAtTime(0.04, t + 0.8);
    g.gain.exponentialRampToValueAtTime(0.001, t + 2);
    src.connect(filt);
    filt.connect(g);
    g.connect(this.masterGain);
    src.start();
    // Second whisper layer offset
    setTimeout(() => {
      this.playFilteredNoise(1.2, 0.025, 1600, 'bandpass', 5);
    }, 400);
  }

  /** Distant footsteps — echoing in empty halls */
  playDistantFootsteps() {
    if (!this.ctx || !this.masterGain) return;
    const count = 4 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (!this.ctx || !this.masterGain) return;
        const freq = 80 + Math.random() * 60;
        this.playTone(freq, 0.06, 'sine', 0.02);
        this.playNoise(0.04, 0.012);
        // Echo
        setTimeout(() => {
          this.playTone(freq * 0.8, 0.08, 'sine', 0.008);
        }, 150);
      }, i * (350 + Math.random() * 100));
    }
  }

  /** Door slamming in the distance */
  playDistantDoorSlam() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    // Delayed to feel distant
    setTimeout(() => {
      if (!this.ctx || !this.masterGain) return;
      this.playTone(30, 0.4, 'sine', 0.15);
      this.playNoise(0.15, 0.12);
      // Reverb tail
      setTimeout(() => {
        this.playFilteredNoise(0.8, 0.04, 200, 'lowpass');
        this.playTone(25, 0.6, 'sine', 0.05);
      }, 100);
    }, 200 + Math.random() * 500);
  }

  /** Shadow movement sound — subtle, wrong */
  playShadowMovement() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    // Creepy sliding noise
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.linearRampToValueAtTime(60, t + 2);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.03, t + 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 2.5);
    // Cloth rustling
    this.playFilteredNoise(1.5, 0.015, 800, 'bandpass', 2);
  }

  /** Cold breath on neck — intimate, close */
  playBreathOnNeck() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    // Rhythmic breath — 2 cycles
    const bufLen = this.ctx.sampleRate * 3;
    const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
      const time = i / this.ctx.sampleRate;
      const breathCycle = Math.sin(time * Math.PI * 2 * 0.6);
      const env = Math.max(0, breathCycle);
      d[i] = (Math.random() * 2 - 1) * env;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 500;
    filt.Q.value = 1.5;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.08, t + 0.5);
    g.gain.linearRampToValueAtTime(0.06, t + 2);
    g.gain.exponentialRampToValueAtTime(0.001, t + 3);
    src.connect(filt);
    filt.connect(g);
    g.connect(this.masterGain);
    src.start();
    // Low presence tone
    this.playTone(50, 2, 'sine', 0.04);
  }

  /** Intense chase music — pounding, urgent, terrifying */
  playChaseMusic() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    // Layer 1: Fast pounding bass drum
    for (let i = 0; i < 16; i++) {
      const beatTime = t + i * 0.25;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, beatTime);
      osc.frequency.exponentialRampToValueAtTime(30, beatTime + 0.15);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.35, beatTime);
      g.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.2);
      osc.connect(g);
      g.connect(this.masterGain);
      osc.start(beatTime);
      osc.stop(beatTime + 0.25);
    }

    // Layer 2: Shrieking dissonant strings
    const str1 = this.ctx.createOscillator();
    str1.type = 'sawtooth';
    str1.frequency.setValueAtTime(400, t);
    str1.frequency.linearRampToValueAtTime(800, t + 4);
    const str1g = this.ctx.createGain();
    str1g.gain.setValueAtTime(0.001, t);
    str1g.gain.linearRampToValueAtTime(0.15, t + 1);
    str1g.gain.linearRampToValueAtTime(0.2, t + 3);
    str1g.gain.exponentialRampToValueAtTime(0.001, t + 5);
    const str1f = this.ctx.createBiquadFilter();
    str1f.type = 'bandpass'; str1f.frequency.value = 1200; str1f.Q.value = 2;
    str1.connect(str1f); str1f.connect(str1g); str1g.connect(this.masterGain);
    str1.start(t); str1.stop(t + 5);

    // Layer 3: Detuned second string
    const str2 = this.ctx.createOscillator();
    str2.type = 'sawtooth';
    str2.frequency.setValueAtTime(407, t);
    str2.frequency.linearRampToValueAtTime(820, t + 4);
    const str2g = this.ctx.createGain();
    str2g.gain.setValueAtTime(0.001, t);
    str2g.gain.linearRampToValueAtTime(0.1, t + 1);
    str2g.gain.exponentialRampToValueAtTime(0.001, t + 5);
    str2.connect(str2g); str2g.connect(this.masterGain);
    str2.start(t); str2.stop(t + 5);

    // Layer 4: Rushing wind noise
    this.playFilteredNoise(5, 0.12, 500, 'bandpass', 1);

    // Layer 5: Demonic low brass
    const brass = this.ctx.createOscillator();
    brass.type = 'sawtooth';
    brass.frequency.value = 80;
    const bg = this.ctx.createGain();
    bg.gain.setValueAtTime(0.2, t);
    bg.gain.exponentialRampToValueAtTime(0.001, t + 4);
    const bf = this.ctx.createBiquadFilter();
    bf.type = 'lowpass'; bf.frequency.value = 300;
    brass.connect(bf); bf.connect(bg); bg.connect(this.masterGain);
    brass.start(t); brass.stop(t + 4);

    // Layer 6: Off-beat snare hits
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.playNoise(0.06, 0.15);
      }, (i * 500) + 250);
    }
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
