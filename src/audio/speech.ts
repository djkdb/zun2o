// Voices for calls and memos. A recorded file for the line (src/assets/voice,
// made by `npm run voices`) plays if there is one; otherwise the browser's
// Web Speech API reads it. Subtitles are always shown, so the game works
// silently when speech is unavailable or sound is off.

import { spokenText, voiceKey, type VoiceId } from './voiceKey';
import { isS2 } from '../content/season';
import { audio } from './engine';

export type Voice = VoiceId;

const FILES = new Map(
  Object.entries(import.meta.glob('../assets/voice/*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>).map(
    ([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -4), url],
  ),
);
// the recordings are loudness-matched; play them full and let the bed duck under them
const VOLUME: Record<Voice, number> = { male: 1, female: 1, entity: 0.95 };
let playing: HTMLAudioElement | null = null;
let stopBuffer: (() => void) | null = null;
let seq = 0;

/** Decode every recorded line in the background once sound is on, so each plays the moment it's due. */
export function preloadVoices(): void {
  FILES.forEach((url) => audio.preloadVoice(url));
}

let enabled = true;
let koVoice: SpeechSynthesisVoice | null = null;

function synth(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
}

function pickVoice(): SpeechSynthesisVoice | null {
  const s = synth();
  if (!s) return null;
  if (koVoice) return koVoice;
  koVoice = s.getVoices().find((v) => v.lang?.toLowerCase().startsWith('ko')) ?? null;
  return koVoice;
}

if (synth()) {
  synth()!.onvoiceschanged = () => {
    koVoice = null;
    pickVoice();
  };
}

let entityLayer: ((text: string) => void) | null = null;
/** Her lines also get a synthesized breath layer from the audio engine. */
export function setEntityLayer(fn: (text: string) => void): void {
  entityLayer = fn;
}

export function setSpeechEnabled(on: boolean): void {
  enabled = on;
  if (!on) stopSpeech();
}

export function speak(text: string, voice: Voice): void {
  if (!enabled) return;
  const clean = spokenText(text);
  if (!clean) return;
  const file = FILES.get(voiceKey(text, voice));
  // Season 2's new lines have no recordings yet: a browser voice would turn 엄마 into a robot.
  // Subtitles only — except where a season-1 recording exists ("다 적어 뒀어요." is her voice).
  if (!file && isS2()) return;
  if (voice === 'entity') entityLayer?.(clean);
  if (file) {
    stopSpeech();
    const my = ++seq;
    // the audio context first (works from timers on phones); a plain <audio> only if that can't play
    void audio.playVoice(file, VOLUME[voice]).then((stop) => {
      if (my !== seq) return stop?.();
      if (stop) {
        stopBuffer = stop;
        return;
      }
      try {
        playing = new Audio(file);
        playing.volume = VOLUME[voice];
        void playing.play().catch(() => {});
      } catch {
        /* speech is decoration */
      }
    });
    return;
  }
  const s = synth();
  if (!s) return;
  // No Korean voice on this device: an English voice would read the Korean. Subtitles only, then.
  if (!pickVoice()) return;
  try {
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'ko-KR';
    const v = pickVoice();
    if (v) u.voice = v;
    if (voice === 'entity') {
      // Quiet under the breath layer: heard as a voice inside the whisper.
      u.pitch = 0.1;
      u.rate = 0.66;
      u.volume = 0.45;
    } else if (voice === 'male') {
      u.pitch = 0.55;
      u.rate = 1.08;
    } else {
      u.pitch = 1.25;
      u.rate = 0.9;
      u.volume = 0.7;
    }
    s.speak(u);
  } catch {
    /* speech is decoration */
  }
}

export function stopSpeech(): void {
  try {
    seq++;
    stopBuffer?.();
    stopBuffer = null;
    playing?.pause();
    playing = null;
    synth()?.cancel();
  } catch {
    /* ignore */
  }
}
