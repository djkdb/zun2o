// Shared by the game and scripts/voices.mjs: which audio file belongs to a
// spoken line. No imports, so Node can load it directly.

// season 2: 'mother' is 서미령 at home (same voice as 'entity', warm, no haunting), 'soyeon' is her daughter
export type VoiceId = 'male' | 'female' | 'entity' | 'mother' | 'soyeon';

/** What is actually said: stage directions in parentheses and pause marks dropped. */
export function spokenText(text: string): string {
  return text
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[…—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** File name (without extension) for a line in a voice: `<voice>-<fnv1a hash>`. */
export function voiceKey(text: string, voice: VoiceId): string {
  let h = 0x811c9dc5;
  for (const ch of `${voice}:${spokenText(text)}`) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${voice}-${h.toString(16).padStart(8, '0')}`;
}
