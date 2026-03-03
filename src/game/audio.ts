class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private heartbeatInterval: number | null = null;
  private initialized = false;

  init() {
    if (this.initialized) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);
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
  }
}

export const audioManager = new AudioManager();
