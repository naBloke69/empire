class SoundEngine {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  ensureContext() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  tone(freq = 440, duration = 0.08, type = 'sine', gainPeak = 0.07, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  click() {
    this.tone(540, 0.045, 'triangle', 0.05);
  }

  success() {
    this.tone(523.25, 0.08, 'triangle', 0.07, 0);
    this.tone(659.25, 0.09, 'triangle', 0.07, 0.08);
    this.tone(783.99, 0.13, 'triangle', 0.08, 0.16);
  }

  alert() {
    this.tone(310, 0.1, 'sawtooth', 0.06, 0);
    this.tone(246.94, 0.14, 'sawtooth', 0.06, 0.11);
  }

  march() {
    this.tone(392, 0.07, 'square', 0.045, 0);
    this.tone(493.88, 0.09, 'square', 0.045, 0.07);
  }
}

export const sound = new SoundEngine();
