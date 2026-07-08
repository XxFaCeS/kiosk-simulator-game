// SoundSystem: Prozedurale Platzhalter-Sounds per WebAudio.
// Ersetzen: In play() statt Synthese eine Audiodatei abspielen (this.buffers[name]).

export class SoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    // Sound-Definitionen: [Wellenform, Frequenzverlauf, Dauer, Lautstärke]
    this.defs = {
      doorbell:    { type: 'sine',     notes: [[880, 0], [660, 0.15]], dur: 0.45, vol: 0.25 },
      scanner:     { type: 'square',   notes: [[1200, 0]], dur: 0.09, vol: 0.12 },
      register:    { type: 'triangle', notes: [[520, 0], [780, 0.08]], dur: 0.2, vol: 0.2 },
      coins:       { type: 'triangle', notes: [[1400, 0], [1800, 0.05], [1500, 0.1]], dur: 0.22, vol: 0.15 },
      card:        { type: 'sine',     notes: [[980, 0], [980, 0.12]], dur: 0.3, vol: 0.15 },
      packageScan: { type: 'square',   notes: [[900, 0], [1300, 0.1]], dur: 0.22, vol: 0.12 },
      lotto:       { type: 'sawtooth', notes: [[440, 0], [550, 0.1], [660, 0.2]], dur: 0.4, vol: 0.12 },
      happy:       { type: 'sine',     notes: [[523, 0], [659, 0.1], [784, 0.2]], dur: 0.4, vol: 0.18 },
      unhappy:     { type: 'sawtooth', notes: [[300, 0], [220, 0.15]], dur: 0.4, vol: 0.15 },
      dayEnd:      { type: 'sine',     notes: [[392, 0], [523, 0.15], [659, 0.3], [784, 0.45]], dur: 0.8, vol: 0.2 },
      error:       { type: 'square',   notes: [[200, 0], [160, 0.12]], dur: 0.3, vol: 0.15 },
      levelUp:     { type: 'triangle', notes: [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.3]], dur: 0.6, vol: 0.2 },
    };
  }

  ensureContext() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        this.enabled = false;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  play(name) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;
    const def = this.defs[name];
    if (!def) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = def.type;
    for (const [freq, t] of def.notes) {
      osc.frequency.setValueAtTime(freq, now + t);
    }
    gain.gain.setValueAtTime(def.vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + def.dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + def.dur + 0.05);
  }
}
