// ─────────────────────────────────────────────────────────────────────────
// Optional photographic art. Drop an image named after a slot into
// src/assets/art/ (e.g. `scare-hang.webp`) and the game uses it instead of
// the SVG drawing for that moment. Nothing there → SVG fallback, so the game
// always builds and runs. See ART_PROMPTS.md for what each slot should show.
// ─────────────────────────────────────────────────────────────────────────

export type ArtSlot =
  | 'black-reveal'
  | 'selfie-far'
  | 'selfie-close'
  | 'selfie-alone'
  | 'booth'
  | 'booth-shelf'
  | 'booth-behind'
  | 'video-chaewon'
  | 'video-behind'
  | 'scare-hang'
  | 'scare-profile'
  | 'scare-face'
  | 'reflect'
  | 'wallpaper'
  | 'annex-gate'
  | 'lobby'
  | 'stairs'
  | 'stairs-figure'
  | 'corridor'
  | 'reading-empty'
  | 'reading-figure'
  | 'room02-door'
  | 'room02'
  | 'index-card'
  | 'life-cafe'
  | 'miryeong-id'
  | 'miryeong-daughter'
  | 'chair-coat'
  | 'chair-empty'
  | 'life-desk'
  | 'life-cake'
  | 'life-busstop'
  | 'life-busstop-ghost'
  | 'floorplan'
  | 'black-empty'
  | 'tower'
  | 'booth-reflect'
  | 'pip-self'
  | 'ending-poweroff'
  | 'ending-shift'
  | 'ending-release'
  | 'avatar-dohyun'
  | 'avatar-mom'
  | 'avatar-self'
  | 'avatar-unknown'
  // season 2
  | 's2-kitchen'
  | 's2-kitchen-close'
  | 's2-card'
  | 's2-ending-home'
  | 's2-home'
  | 's2-notebook'
  | 's2-sisters'
  | 's2-window'
  | 'avatar-soyeon'
  | 's2-booth'
  // full-resolution portrait wallpapers (fall back to the cropped photos)
  | 'wall-lock'
  | 'wall-home'
  | 'wall-booth'
  | 'wall-s2';

const FILES = import.meta.glob('../assets/art/*.{jpg,jpeg,png,webp,avif}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const BY_SLOT: Partial<Record<ArtSlot, string>> = {};
for (const [path, url] of Object.entries(FILES)) {
  const name = path.split('/').pop()!.replace(/\.[a-z]+$/i, '') as ArtSlot;
  BY_SLOT[name] = url;
}

export function art(slot: ArtSlot): string | undefined {
  return BY_SLOT[slot];
}
