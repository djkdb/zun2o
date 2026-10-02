import type { SoundId } from '../engine/types';

// Recorded versions of some sounds (src/assets/sfx, made by `npm run sfx`). A sound with a
// file plays the recording; everything else stays synthesized.
const SFX_FILES = new Map(
  Object.entries(import.meta.glob('../assets/sfx/*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>).map(
    ([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -4), url],
  ),
);
/** Recordings sit a little under the synthesized mix's peaks. */
const SFX_GAIN: Partial<Record<SoundId, number>> = { scream: 0.7, heartbeat: 0.8, drip: 0.6, whisper: 0.9 };

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
  /** A dying fluorescent tube somewhere in the building: follows the drone. */
  private buzz: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private sources: AudioScheduledSourceNode[] = [];
  /** Everything "in the building" goes through a synthesized room reverb. */
  private space: GainNode | null = null;
  private wetIn: GainNode | null = null;
  private ambientTimer: ReturnType<typeof setTimeout> | null = null;
  private ambientLevel = 0;
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
      void this.loadRecordings();
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

    // Fluorescent buzz: 120 Hz rasp through a narrow band, flickering.
    const buzz = ctx.createGain();
    buzz.gain.value = 0;
    const tube = ctx.createOscillator();
    tube.type = 'sawtooth';
    tube.frequency.value = 120;
    const tubeBp = ctx.createBiquadFilter();
    tubeBp.type = 'bandpass';
    tubeBp.frequency.value = 2400;
    tubeBp.Q.value = 3;
    const flick = ctx.createGain();
    flick.gain.value = 0.6;
    const flickLfo = ctx.createOscillator();
    flickLfo.type = 'square';
    flickLfo.frequency.value = 0.23;
    const flickDepth = ctx.createGain();
    flickDepth.gain.value = 0.4;
    flickLfo.connect(flickDepth).connect(flick.gain);
    tube.connect(tubeBp).connect(flick).connect(buzz).connect(master);
    tube.start();
    flickLfo.start();
    this.buzz = buzz;
    this.sources = [src, hum, o1, o2, lfo, tube, flickLfo];

    // Reverb: an impulse response made of decaying stereo noise — a long,
    // empty concrete corridor. Dry + wet so near sounds stay near.
    const irLen = Math.floor(ctx.sampleRate * 3.2);
    const ir = ctx.createBuffer(2, irLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch);
      for (let i = 0; i < irLen; i++) {
        const k = i / irLen;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - k, 3.2) * (i < ctx.sampleRate * 0.012 ? 0.2 : 1);
      }
    }
    const conv = ctx.createConvolver();
    conv.buffer = ir;
    const wetIn = ctx.createGain();
    wetIn.gain.value = 1;
    const wetOut = ctx.createGain();
    wetOut.gain.value = 0.42;
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.value = 3200;
    wetIn.connect(conv).connect(damp).connect(wetOut).connect(master);
    const space = ctx.createGain();
    space.connect(master);
    space.connect(wetIn);
    this.space = space;
    this.wetIn = wetIn;
  }

  /**
   * The building is alive: random, sparse sounds from somewhere else in it.
   * Denser and closer each chapter; 0 = silence (hush, 02:00).
   */
  setAmbientLevel(level: number): void {
    if (level === this.ambientLevel) return;
    this.ambientLevel = level;
    if (this.ambientTimer) clearTimeout(this.ambientTimer);
    this.ambientTimer = null;
    if (level > 0) this.scheduleAmbient();
  }

  private scheduleAmbient(): void {
    const lvl = this.ambientLevel;
    const wait = (14 + Math.random() * 26) / (1 + lvl * 0.35);
    this.ambientTimer = setTimeout(() => {
      this.ambientEvent();
      if (this.ambientLevel > 0) this.scheduleAmbient();
    }, wait * 1000);
  }

  private ambientEvent(): void {
    if (!this.enabled || !this.ctx || !this.space || this.ctx.state !== 'running') return;
    const lvl = this.ambientLevel;
    const pool: SoundId[] = ['drip', 'creak'];
    if (lvl >= 2) pool.push('stepsAbove', 'drip', 'buzz');
    if (lvl >= 3) pool.push('knock', 'drawer', 'breath');
    if (lvl >= 4) pool.push('knock', 'breath', 'whisper', 'stepsAbove');
    const id = pool[Math.floor(Math.random() * pool.length)];
    const ctx = this.ctx;
    // Somewhere to the side, and further away in the early chapters.
    const bus = ctx.createGain();
    bus.gain.value = 0.35 + lvl * 0.12;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900 + lvl * 700;
    let tail: AudioNode = lp;
    if (typeof ctx.createStereoPanner === 'function') {
      const pan = ctx.createStereoPanner();
      pan.pan.value = (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.5);
      lp.connect(pan);
      tail = pan;
    }
    bus.connect(lp);
    tail.connect(this.space);
    try {
      SOUNDS[id](ctx, bus, this);
    } catch {
      /* decoration */
    }
    setTimeout(() => bus.disconnect(), 6000);
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
    this.buzz?.gain.setTargetAtTime(drone * 0.05, t, tc);
  }

  suspend(): void {
    if (this.ctx && this.ctx.state === 'running') void this.ctx.suspend().catch(() => undefined);
  }

  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume().catch(() => undefined);
  }

  dispose(): void {
    if (this.ambientTimer) clearTimeout(this.ambientTimer);
    this.ambientTimer = null;
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

  private recordings = new Map<string, AudioBuffer>();
  private loading = false;
  /** Decode the recorded sounds once, in the background; until then the synth covers. */
  private async loadRecordings(): Promise<void> {
    if (this.loading || !this.ctx) return;
    this.loading = true;
    const ctx = this.ctx;
    await Promise.all(
      [...SFX_FILES].map(async ([id, url]) => {
        try {
          const data = await (await fetch(url)).arrayBuffer();
          this.recordings.set(id, await ctx.decodeAudioData(data));
        } catch {
          /* the synthesized version stays */
        }
      }),
    );
  }

  play(id: SoundId): void {
    if (!this.enabled || !this.ctx || !this.master || this.ctx.state !== 'running') return;
    const rec = this.recordings.get(id);
    if (rec) {
      try {
        const src = this.ctx.createBufferSource();
        src.buffer = rec;
        const g = this.ctx.createGain();
        g.gain.value = SFX_GAIN[id] ?? 1;
        src.connect(g).connect(DRY.has(id) || !this.space ? this.master : this.space);
        src.start();
        return;
      } catch {
        /* fall back to the synth */
      }
    }
    try {
      // Phone UI sounds are dry (in your hand); everything else is in the building.
      SOUNDS[id](this.ctx, DRY.has(id) || !this.space ? this.master : this.space, this);
    } catch {
      /* a failed blip must never break the page */
    }
  }

  /**
   * Her voice: not words, but breath shaped like syllables — one band-passed
   * noise burst per character, with vowel-like formants, pressed close to one
   * ear, over a sub-bass swell. The subtitle carries the words.
   */
  voice(text: string): void {
    if (!this.enabled || !this.ctx || !this.master || this.ctx.state !== 'running') return;
    const ctx = this.ctx;
    const syllables = [...text.replace(/[^가-힣a-zA-Z0-9]/g, '')];
    if (!syllables.length) return;
    try {
      const t0 = ctx.currentTime + 0.05;
      const step = 0.24;
      const total = syllables.length * step + 0.6;
      const bus = ctx.createGain();
      bus.gain.value = 0.9;
      let out: AudioNode = bus;
      if (typeof ctx.createStereoPanner === 'function') {
        const pan = ctx.createStereoPanner();
        pan.pan.setValueAtTime(0.65, t0);
        pan.pan.linearRampToValueAtTime(-0.2, t0 + total);
        bus.connect(pan);
        out = pan;
      }
      out.connect(this.master);
      if (this.wetIn) {
        const send = ctx.createGain();
        send.gain.value = 0.25;
        out.connect(send).connect(this.wetIn);
      }
      const FORMANTS: [number, number][] = [
        [700, 1200], [400, 2200], [300, 800], [550, 1800], [350, 1500],
      ];
      syllables.forEach((ch, i) => {
        const at = t0 + i * step + (Math.random() - 0.5) * 0.04;
        const n = this.noiseSource();
        if (!n) return;
        const [f1, f2] = FORMANTS[ch.charCodeAt(0) % FORMANTS.length];
        const g = ctx.createGain();
        env(ctx, g, 0.16, 0.04, 0.2, at);
        [f1, f2].forEach((f, k) => {
          const bp = ctx.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.setValueAtTime(f * 0.92, at);
          bp.frequency.linearRampToValueAtTime(f * 1.05, at + 0.22);
          bp.Q.value = 9;
          const lvl = ctx.createGain();
          lvl.gain.value = k === 0 ? 1.4 : 0.9;
          n.connect(bp).connect(lvl).connect(g);
        });
        g.connect(bus);
        n.start(at);
        n.stop(at + 0.3);
      });
      // A throat that is far too deep, under the breath.
      tone(ctx, bus, 'sine', 46, 0.22, 0.4, total, t0, 38);
      tone(ctx, bus, 'sawtooth', 92, 0.012, 0.3, total, t0, 76);
    } catch {
      /* decoration */
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

const DRY = new Set<SoundId>(['click', 'hover', 'key', 'type', 'ding', 'error', 'unlock', 'send', 'hangup', 'transition', 'open', 'zoom', 'connect', 'tape', 'vault', 'inhale']);

const SOUNDS: Record<SoundId, (ctx: Ctx, out: GainNode, engine: AudioEngine) => void> = {
  open(ctx, out, engine) {
    // App opening: a soft tap and a breath of air.
    tone(ctx, out, 'sine', 520, 0.025, 0.004, 0.06);
    noiseBurst(ctx, out, engine, 0.03, 0.12, 'highpass', 3000);
  },
  zoom(ctx, out) {
    // A lens focusing.
    const t = ctx.currentTime;
    tone(ctx, out, 'triangle', 1800, 0.02, 0.002, 0.03, t);
    tone(ctx, out, 'triangle', 2400, 0.015, 0.002, 0.03, t + 0.05);
  },
  connect(ctx, out) {
    // Call connected.
    const t = ctx.currentTime;
    tone(ctx, out, 'sine', 740, 0.05, 0.005, 0.09, t);
    tone(ctx, out, 'sine', 990, 0.05, 0.005, 0.12, t + 0.12);
  },
  tape(ctx, out, engine) {
    // Recorder start: mechanical click, then hiss.
    const t = ctx.currentTime;
    noiseBurst(ctx, out, engine, 0.2, 0.03, 'bandpass', 1800, t);
    noiseBurst(ctx, out, engine, 0.03, 0.6, 'highpass', 5000, t + 0.05);
  },
  vault(ctx, out, engine) {
    // Hidden album: a heavy latch.
    const t = ctx.currentTime;
    tone(ctx, out, 'sine', 90, 0.3, 0.005, 0.35, t, 50);
    noiseBurst(ctx, out, engine, 0.12, 0.08, 'bandpass', 1200, t + 0.02);
  },
  inhale(ctx, out, engine) {
    // Right before it happens: someone very close breathes in.
    const n = engine.noiseSource();
    if (!n) return;
    const t = ctx.currentTime;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(700, t);
    bp.frequency.linearRampToValueAtTime(1400, t + 0.5);
    bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    n.connect(bp).connect(g).connect(out);
    n.start(t);
    n.stop(t + 0.65);
  },
  buzz(ctx, out, engine) {
    // A fluorescent tube stutters.
    const t = ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      tone(ctx, out, 'sawtooth', 120, 0.05, 0.003, 0.05, t + i * 0.09 + Math.random() * 0.03);
    }
    noiseBurst(ctx, out, engine, 0.04, 0.3, 'bandpass', 3000, t);
  },
  send(ctx, out, engine) {
    const n = engine.noiseSource();
    if (!n) return;
    const t = ctx.currentTime;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 2;
    bp.frequency.setValueAtTime(700, t);
    bp.frequency.exponentialRampToValueAtTime(3400, t + 0.18);
    const g = ctx.createGain();
    env(ctx, g, 0.08, 0.02, 0.16, t);
    n.connect(bp).connect(g).connect(out);
    n.start(t);
    n.stop(t + 0.25);
  },
  knock(ctx, out, engine) {
    // Three knuckles on a door, somewhere down the corridor.
    const t = ctx.currentTime;
    const gap = 0.24 + Math.random() * 0.1;
    for (let i = 0; i < 3; i++) {
      tone(ctx, out, 'sine', 120, 0.4, 0.003, 0.14, t + i * gap, 70);
      noiseBurst(ctx, out, engine, 0.3, 0.06, 'lowpass', 700, t + i * gap);
    }
  },
  creak(ctx, out) {
    // A door or floorboard: a slow, rough, wandering squeal.
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    const base = 55 + Math.random() * 40;
    o.frequency.setValueAtTime(base, t);
    o.frequency.linearRampToValueAtTime(base * 1.6, t + 0.5);
    o.frequency.linearRampToValueAtTime(base * 1.1, t + 1.2);
    o.frequency.linearRampToValueAtTime(base * 1.9, t + 1.6);
    const jitter = ctx.createOscillator();
    jitter.type = 'square';
    jitter.frequency.value = 23;
    const jd = ctx.createGain();
    jd.gain.value = base * 0.3;
    jitter.connect(jd).connect(o.frequency);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 700;
    bp.Q.value = 6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.25);
    g.gain.setValueAtTime(0.09, t + 1.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
    o.connect(bp).connect(g).connect(out);
    o.start(t);
    jitter.start(t);
    o.stop(t + 2);
    jitter.stop(t + 2);
  },
  drip(ctx, out) {
    const t = ctx.currentTime;
    tone(ctx, out, 'sine', 1500, 0.06, 0.002, 0.07, t, 520);
    tone(ctx, out, 'sine', 1300, 0.04, 0.002, 0.06, t + 0.9 + Math.random() * 0.6, 480);
  },
  breath(ctx, out, engine) {
    // In… and out. Slow. Not yours.
    const t = ctx.currentTime;
    [
      [0, 1100, 1.1, 0.14],
      [1.7, 650, 1.6, 0.12],
    ].forEach(([at, f, dur, peak]) => {
      const n = engine.noiseSource();
      if (!n) return;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f;
      bp.Q.value = 1.4;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + at);
      g.gain.exponentialRampToValueAtTime(peak, t + at + dur * 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
      n.connect(bp).connect(g).connect(out);
      n.start(t + at);
      n.stop(t + at + dur + 0.05);
    });
  },
  stepsAbove(ctx, out, engine) {
    // Someone walking across the floor above you. Then stopping.
    const t = ctx.currentTime;
    const n = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const at = t + i * (0.62 + Math.random() * 0.1);
      tone(ctx, out, 'sine', 62, 0.28, 0.006, 0.18, at, 40);
      noiseBurst(ctx, out, engine, 0.16, 0.1, 'lowpass', 240, at);
    }
  },
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
