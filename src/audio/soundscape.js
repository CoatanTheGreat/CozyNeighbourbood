// Sfeergeluid zonder geluidsbestanden: wind, zachte tonen, vogels en klusgeluid.

class Soundscape {
  constructor() {
    this.ctx = null;
    this.muted = true;
    this.wind = null;
    this.master = null;
  }

  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);

    // Bruine ruis als zachte wind
    const size = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < size; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 2.4;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 280;
    this.wind = this.ctx.createGain();
    this.wind.gain.value = 0;
    src.connect(filter);
    filter.connect(this.wind);
    this.wind.connect(this.master);
    src.start();
  }

  setMuted(muted) {
    this.muted = muted;
    if (!muted) this.init();
    if (!this.ctx) return;
    if (!muted && this.ctx.state === 'suspended') this.ctx.resume();
    if (muted) this.wind?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
  }

  // Meer wind als de buurt nog grauw is, zachter als hij bloeit
  setMood(bloom, winter) {
    if (!this.ctx || this.muted) return;
    const target = Math.max(0.025, 0.12 * (1 - bloom * 0.7)) + (winter ? 0.03 : 0);
    this.wind.gain.setTargetAtTime(target, this.ctx.currentTime, 1.2);
  }

  tone(freq, start, length, vol, type = 'triangle') {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(vol, start + Math.min(0.3, length * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(g);
    g.connect(this.master);
    osc.start(start);
    osc.stop(start + length + 0.05);
  }

  ambient(bloom, isNight, raining) {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const bleak = [196.0, 220.0, 246.94, 293.66];
    const warm = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
    const pool = bloom < 0.3 ? bleak : warm;
    this.tone(pool[Math.floor(Math.random() * pool.length)], now, 3.2, 0.018 + bloom * 0.02, isNight ? 'sine' : 'triangle');
    if (bloom > 0.25 && !isNight && !raining && Math.random() < 0.6) this.chirp(now + 0.6);
  }

  chirp(t) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const f = 1700 + Math.random() * 500;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * 1.3, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(f * 0.95, t + 0.17);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.014, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  knock() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.tone(180 + Math.random() * 40, now, 0.12, 0.03, 'square');
  }

  chime(kind = 'place') {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = kind === 'done' ? [392, 493.88, 587.33, 783.99] : kind === 'remove' ? [329.63, 261.63] : [523.25, 659.25, 783.99];
    notes.forEach((n, i) => this.tone(n, now + i * 0.08, 0.5, 0.035));
  }
}

export const sound = new Soundscape();
