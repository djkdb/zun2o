import type { AppId } from '../engine/types';

// Generic app glyphs (drawn here; no platform icon assets).

const P = { fill: 'none', stroke: '#fff', strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const APP_META: Record<AppId, { name: string; bg: string }> = {
  messages: { name: '메시지', bg: 'linear-gradient(180deg,#3ad16b,#1f9e4a)' },
  gallery: { name: '사진', bg: 'linear-gradient(180deg,#f6c34a,#e58a2c)' },
  notes: { name: '메모', bg: 'linear-gradient(180deg,#f5e27a,#e3b93a)' },
  memos: { name: '녹음', bg: 'linear-gradient(180deg,#e2574c,#b02a24)' },
  browser: { name: '인터넷', bg: 'linear-gradient(180deg,#5ea8ff,#2d6fe0)' },
  phone: { name: '전화', bg: 'linear-gradient(180deg,#48d06f,#22a049)' },
  settings: { name: '설정', bg: 'linear-gradient(180deg,#9aa0a8,#5f646b)' },
  index: { name: '야간 색인', bg: '#050505' },
};

export function AppGlyph({ app }: { app: AppId }) {
  switch (app) {
    case 'messages':
      return (
        <svg viewBox="0 0 32 32">
          <path {...P} d="M6 9h20v12H14l-6 5v-5H6z" />
        </svg>
      );
    case 'gallery':
      return (
        <svg viewBox="0 0 32 32">
          <rect {...P} x="5" y="7" width="22" height="18" rx="2" />
          <path {...P} d="M5 21l7-6 5 4 4-3 6 5" />
          <circle cx="21" cy="12" r="2" fill="#fff" />
        </svg>
      );
    case 'notes':
      return (
        <svg viewBox="0 0 32 32">
          <path {...P} stroke="#6b5413" d="M9 10h14M9 15h14M9 20h9" />
        </svg>
      );
    case 'memos':
      return (
        <svg viewBox="0 0 32 32">
          <rect {...P} x="12" y="5" width="8" height="14" rx="4" />
          <path {...P} d="M8 15a8 8 0 0016 0M16 23v4" />
        </svg>
      );
    case 'browser':
      return (
        <svg viewBox="0 0 32 32">
          <circle {...P} cx="16" cy="16" r="10" />
          <path {...P} d="M6 16h20M16 6c4 4 4 16 0 20M16 6c-4 4-4 16 0 20" />
        </svg>
      );
    case 'phone':
      return (
        <svg viewBox="0 0 32 32">
          <path
            {...P}
            d="M10 6l4 5-2.5 2.5a13 13 0 006 6L20 17l5 4-2 4c-8 0-17-9-17-17z"
            fill="#fff"
            stroke="none"
          />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 32 32">
          <circle {...P} cx="16" cy="16" r="4" />
          <path {...P} d="M16 5v4M16 23v4M5 16h4M23 16h4M8.2 8.2l2.8 2.8M21 21l2.8 2.8M8.2 23.8L11 21M21 11l2.8-2.8" />
        </svg>
      );
    case 'index':
      return (
        <svg viewBox="0 0 32 32">
          <rect x="7" y="6" width="18" height="20" fill="none" stroke="#b33" strokeWidth="1.6" />
          <path d="M11 12h10M11 16h10M11 20h6" stroke="#b33" strokeWidth="1.6" />
        </svg>
      );
  }
}
