import type { SoundId } from '../engine/types';

// ─────────────────────────────────────────────────────────────────────────
// Every sound in the archive is synthesised with the Web Audio API — no
// external audio files, no licensing questions. The context is created only
// after the first user gesture (autoplay policy) and never on page load.
// If Web Audio is unavailable every method silently does nothing.
// ─────────────────────────────────────────────────────────────────────────

type Ctx = AudioContext;

class AudioEngine {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private ambience: GainNode | null = null;
  private ambienceFilter: BiquadFilterNode | null = null;
  private drone: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private sources: AudioScheduledSourceNode[] = [];
  private enabled = false;
  private failed = false;
  clickLow = false;

  get ready(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  /** Must be called from inside a user gesture handler. */
  async unlock(): Promise<boolean> {
    if (this.failed) return false;
    try {
      if (!this.ctx) this.build();
      if (this.ctx && this.ctx.state !== 'running') await this.ctx.resume();
      return this.ready;
    } catch {
      this.failed = true;
      return false;
    }
  }

  private build(): void {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) {
      this.failed = true;
      return;
    }
    const ctx = new AC();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.master = master;

    // Noise buffer shared by room tone, whispers and transitions.
    const len = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      // Brown-ish noise: warmer than white, reads as "room".
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    this.noise = buffer;

    // Room tone: brown noise + faint mains hum.
    const ambience = ctx.createGain();
    ambience.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.connect(filter).connect(ambience).connect(master);
    const hum = ctx.createOscillator();
    hum.frequency.value = 60;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.05;
    hum.connect(humGain).connect(ambience);
    src.start();
    hum.start();
    this.ambience = ambience;
    this.ambienceFilter = filter;

    // Low drone: two detuned oscillators through a slowly breathing filter.
    const drone = ctx.createGain();
    drone.gain.value = 0;
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 140;
    const o1 = ctx.createOscillator();
    o1.type = 'sawtooth';
    o1.frequency.value = 41.2;
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = 43.7;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 60;
    lfo.connect(lfoGain).connect(droneFilter.frequency);
    o1.connect(droneFilter);
    o2.connect(droneFilter);
    droneFilter.connect(drone).connect(master);
    o1.start();
    o2.start();
    lfo.start();
    this.drone = drone;
    this.sources = [src, hum, o1, o2, lfo];
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(on ? 1 : 0, t, on ? 1.2 : 0.15);
  }

  /** Crossfade the beds. `seconds` is the approximate ramp time. */
  setMix(ambience: number, drone: number, seconds = 2.5, brightness = 420): void {
    if (!this.ctx || !this.ambience || !this.drone || !this.ambienceFilter) return;
    const t = this.ctx.currentTime;
    const tc = Math.max(0.05, seconds / 3);
    this.ambience.gain.setTargetAtTime(ambience, t, tc);
    this.drone.gain.setTargetAtTime(drone, t, tc);
    this.ambienceFilter.frequency.setTargetAtTime(brightness, t, tc);
  }

  suspend(): void {
    if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend().catch(() => undefined);
  }

  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume().catch(() => undefined);
  }

  dispose(): void {
    this.sources.forEach((s) => {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    });
    this.sources = [];
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
    this.master = null;
  }

  private loops = new Map<string, ReturnType<typeof setInterval>>();

  /** Repeating patterns: incoming-call ringtone and heartbeat. */
  setLoop(id: 'ring' | 'heartbeat', on: boolean): void {
    const existing = this.loops.get(id);
    if (!on) {
      if (existing) clearInterval(existing);
      this.loops.delete(id);
      return;
    }
    if (existing) return;
    const fire = () => {
      if (!this.enabled || !this.ctx || !this.master || this.ctx.state !== 'running') return;
      if (id === 'ring') ring(this.ctx, this.master);
      else heartbeat(this.ctx, this.master);
    };
    fire();
    this.loops.set(id, setInterval(fire, id === 'ring' ? 2600 : 640));
  }

  stopAllLoops(): void {
    this.loops.forEach((t) => clearInterval(t));
    this.loops.clear();
  }

  play(id: SoundId): void {
    if (!this.enabled || !this.ctx || !this.master || this.ctx.state !== 'running') return;
    try {
      SOUNDS[id](this.ctx, this.master, this);
    } catch {
      /* a failed blip must never break the page */
    }
  }

  noiseSource(): AudioBufferSourceNode | null {
    if (!this.ctx || !this.noise) return null;
    const s = this.ctx.createBufferSource();
    s.buffer = this.noise;
    return s;
  }
}

function env(ctx: Ctx, gain: GainNode, peak: number, attack: number, release: number, at = ctx.currentTime): void {
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + release);
}

function tone(ctx: Ctx, out: AudioNode, type: OscillatorType, freq: number, peak: number, attack: number, release: number, at = ctx.currentTime, endFreq?: number): void {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, at + attack + release);
  const g = ctx.createGain();
  env(ctx, g, peak, attack, release, at);
  o.connect(g).connect(out);
  o.start(at);
  o.stop(at + attack + release + 0.05);
}

function ring(ctx: Ctx, out: GainNode): void {
  // Generic two-tone phone ring (not any vendor's ringtone).
  const t = ctx.currentTime;
  for (let i = 0; i < 2; i++) {
    const at = t + i * 0.5;
    tone(ctx, out, 'sine', 880, 0.09, 0.01, 0.34, at);
    tone(ctx, out, 'sine', 1100, 0.06, 0.01, 0.34, at);
  }
}

function heartbeat(ctx: Ctx, out: GainNode): void {
  const t = ctx.currentTime;
  tone(ctx, out, 'sine', 58, 0.35, 0.01, 0.16, t, 40);
  tone(ctx, out, 'sine', 52, 0.25, 0.01, 0.2, t + 0.24, 36);
}

function noiseBurst(ctx: Ctx, out: AudioNode, engine: AudioEngine, peak: number, dur: number, type: BiquadFilterType, freq: number, at = ctx.currentTime): void {
  const n = engine.noiseSource();
  if (!n) return;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  const g = ctx.createGain();
  env(ctx, g, peak, 0.01, dur, at);
  n.connect(f).connect(g).connect(out);
  n.start(at);
  n.stop(at + dur + 0.05);
}

const SOUNDS: Record<SoundId, (ctx: Ctx, out: GainNode, engine: AudioEngine) => void> = {
  ding(ctx, out) {
    const t = ctx.currentTime;
    tone(ctx, out, 'sine', 1318, 0.06, 0.005, 0.35, t);
    tone(ctx, out, 'sine', 1760, 0.045, 0.005, 0.5, t + 0.09);
  },
  key(ctx, out) {
    tone(ctx, out, 'triangle', 2200, 0.03, 0.001, 0.03);
  },
  static(ctx, out, engine) {
    noiseBurst(ctx, out, engine, 0.12, 1.2, 'bandpass', 2400);
  },
  heartbeat(ctx, out) {
    heartbeat(ctx, out);
  },
  footsteps(ctx, out, engine) {
    const t = ctx.currentTime;
    for (let i = 0; i < 6; i++) noiseBurst(ctx, out, engine, 0.18, 0.12, 'lowpass', 380, t + i * 0.62);
  },
  drawer(ctx, out, engine) {
    const t = ctx.currentTime;
    noiseBurst(ctx, out, engine, 0.12, 0.7, 'bandpass', 900, t);
    tone(ctx, out, 'square', 140, 0.03, 0.02, 0.5, t, 90);
    noiseBurst(ctx, out, engine, 0.22, 0.12, 'lowpass', 600, t + 0.72);
  },
  glitch(ctx, out, engine) {
    const t = ctx.currentTime;
    for (let i = 0; i < 5; i++) {
      tone(ctx, out, 'square', 200 + Math.random() * 1800, 0.04, 0.001, 0.04, t + i * 0.06);
    }
    noiseBurst(ctx, out, engine, 0.1, 0.35, 'highpass', 3000, t);
  },
  hangup(ctx, out) {
    const t = ctx.currentTime;
    [0, 0.3, 0.6].forEach((d) => tone(ctx, out, 'sine', 480, 0.05, 0.005, 0.18, t + d));
  },
  click(ctx, out, engine) {
    if (engine.clickLow) tone(ctx, out, 'square', 190, 0.05, 0.003, 0.09, ctx.currentTime, 120);
    else tone(ctx, out, 'square', 1600, 0.025, 0.002, 0.025);
  },
  hover(ctx, out) {
    tone(ctx, out, 'sine', 2600, 0.006, 0.002, 0.02);
  },
  type(ctx, out, engine) {
    const n = engine.noiseSource();
    if (!n) return;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2500;
    const g = ctx.createGain();
    env(ctx, g, 0.05, 0.001, 0.03);
    n.connect(hp).connect(g).connect(out);
    n.start();
    n.stop(ctx.currentTime + 0.05);
  },
  error(ctx, out) {
    tone(ctx, out, 'square', 180, 0.04, 0.005, 0.12);
    tone(ctx, out, 'square', 150, 0.04, 0.005, 0.16, ctx.currentTime + 0.15);
  },
  transition(ctx, out, engine) {
    const n = engine.noiseSource();
    if (!n) return;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(1400, ctx.currentTime);
    bp.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.5);
    const g = ctx.createGain();
    env(ctx, g, 0.12, 0.05, 0.45);
    n.connect(bp).connect(g).connect(out);
    n.start();
    n.stop(ctx.currentTime + 0.6);
  },
  unlock(ctx, out) {
    const t = ctx.currentTime;
    [392, 466.2, 587.3].forEach((f, i) => tone(ctx, out, 'sine', f, 0.035, 0.01, 1.4, t + i * 0.12));
  },
  anomaly(ctx, out) {
    const t = ctx.currentTime;
    tone(ctx, out, 'sawtooth', 92, 0.03, 0.02, 0.7, t, 70);
    tone(ctx, out, 'sawtooth', 95.5, 0.03, 0.02, 0.7, t, 72);
    tone(ctx, out, 'sine', 1760, 0.012, 0.01, 0.5, t, 1480);
  },
  event(ctx, out, engine) {
    const t = ctx.currentTime;
    const sub = ctx.createOscillator();
    sub.frequency.setValueAtTime(34, t);
    sub.frequency.linearRampToValueAtTime(28, t + 9);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.35, t + 6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 12);
    sub.connect(g).connect(out);
    sub.start(t);
    sub.stop(t + 12.2);
    const n = engine.noiseSource();
    if (!n) return;
    n.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(200, t);
    lp.frequency.exponentialRampToValueAtTime(3200, t + 8);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.09, t + 8);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 10.5);
    n.connect(lp).connect(ng).connect(out);
    n.start(t);
    n.stop(t + 10.6);
  },
  ending(ctx, out) {
    const t = ctx.currentTime;
    [110, 130.8, 164.8, 220].forEach((f, i) => tone(ctx, out, 'sine', f, 0.04, 0.8, 5.5, t + i * 0.05));
  },
  whisper(ctx, out, engine) {
    const t = ctx.currentTime;
    const n = engine.noiseSource();
    if (!n) return;
    n.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2300;
    bp.Q.value = 4;
    const am = ctx.createGain();
    am.gain.value = 0;
    const lfo = ctx.createOscillator();
    lfo.type = 'triangle';
    lfo.frequency.value = 5.5;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.5;
    lfo.connect(lfoDepth).connect(am.gain);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
    let node: AudioNode = g;
    if (typeof ctx.createStereoPanner === 'function') {
      const pan = ctx.createStereoPanner();
      pan.pan.setValueAtTime(Math.random() < 0.5 ? -0.8 : 0.8, t);
      g.connect(pan);
      node = pan;
    }
    n.connect(bp).connect(am).connect(g);
    node.connect(out);
    n.start(t);
    lfo.start(t);
    n.stop(t + 3);
    lfo.stop(t + 3);
  },
  thud(ctx, out) {
    tone(ctx, out, 'sine', 70, 0.3, 0.005, 0.5, ctx.currentTime, 28);
  },
  scream(ctx, out, engine) {
    // A jump-scare hit: distorted detuned shriek with wild vibrato, a burst of
    // noise and a sub-bass punch. Loud relative to the room tone, but capped.
    const t = ctx.currentTime;
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0.0001, t);
    bus.gain.exponentialRampToValueAtTime(0.42, t + 0.015);
    bus.gain.setValueAtTime(0.42, t + 0.35);
    bus.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * 6);
    }
    shaper.curve = curve;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1500;
    bp.Q.value = 0.7;
    shaper.connect(bp).connect(bus).connect(out);
    const vib = ctx.createOscillator();
    vib.frequency.value = 17;
    const vibDepth = ctx.createGain();
    vibDepth.gain.value = 45;
    vib.connect(vibDepth);
    [620, 657, 702, 1240].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i === 3 ? 'square' : 'sawtooth';
      o.frequency.setValueAtTime(f * 0.7, t);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
      o.frequency.exponentialRampToValueAtTime(f * 0.62, t + 1.3);
      vibDepth.connect(o.frequency);
      const g = ctx.createGain();
      g.gain.value = i === 3 ? 0.12 : 0.3;
      o.connect(g).connect(shaper);
      o.start(t);
      o.stop(t + 1.35);
    });
    vib.start(t);
    vib.stop(t + 1.35);
    const n = engine.noiseSource();
    if (n) {
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 900;
      const ng = ctx.createGain();
      env(ctx, ng, 0.5, 0.005, 0.6);
      n.connect(hp).connect(ng).connect(out);
      n.start(t);
      n.stop(t + 0.7);
    }
    tone(ctx, out, 'sine', 90, 0.6, 0.004, 0.7, t, 32);
  },
};

export const audio = new AudioEngine();
