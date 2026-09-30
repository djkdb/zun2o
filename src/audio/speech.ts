// Voices for calls and memos. A recorded file for the line (src/assets/voice,
// made by `npm run voices`) plays if there is one; otherwise the browser's
// Web Speech API reads it. Subtitles are always shown, so the game works
// silently when speech is unavailable or sound is off.

import { spokenText, voiceKey, type VoiceId } from './voiceKey';

export type Voice = VoiceId;

const FILES = new Map(
  Object.entries(import.meta.glob('../assets/voice/*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>).map(
    ([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -4), url],
  ),
);
const VOLUME: Record<Voice, number> = { male: 0.9, female: 0.85, entity: 0.7 };
let playing: HTMLAudioElement | null = null;

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
  if (voice === 'entity') entityLayer?.(clean);
  const file = FILES.get(voiceKey(text, voice));
  if (file) {
    try {
      playing?.pause();
      playing = new Audio(file);
      playing.volume = VOLUME[voice];
      void playing.play().catch(() => {});
    } catch {
      /* speech is decoration */
    }
    return;
  }
  const s = synth();
  if (!s) return;
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
    playing?.pause();
    playing = null;
    synth()?.cancel();
  } catch {
    /* ignore */
  }
}
