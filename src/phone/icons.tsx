import { useId, type ReactNode } from 'react';
import type { AppId } from '../engine/types';
import { isS2 } from '../content/season';
import { useGame } from '../hooks/useGame';

// App icons laid out like the iPhone's own (compass, petals, waveform on black, paper
// under a yellow band) but drawn here — no platform icon assets. Each one is a full tile.
// As the night goes on, some of them change a little.

export const APP_META: Record<AppId, { name: string; bg: string }> = {
  messages: { name: '메시지', bg: 'linear-gradient(180deg,#6ff28a,#1fc244)' },
  gallery: { name: '사진', bg: 'linear-gradient(180deg,#ffffff,#eef1f5)' },
  notes: { name: '메모', bg: 'linear-gradient(180deg,#ffe066,#fcc62d 26%,#ffffff 26%)' },
  memos: { name: '녹음', bg: 'linear-gradient(180deg,#2a2a2c,#0b0b0c)' },
  browser: { name: '인터넷', bg: 'linear-gradient(180deg,#ffffff,#e9edf2)' },
  phone: { name: '전화', bg: 'linear-gradient(180deg,#6ff28a,#1fc244)' },
  settings: { name: '설정', bg: 'linear-gradient(180deg,#d7dade,#8a8f97)' },
  index: { name: '출입 기록', bg: '#050505' },
};

/** An app's name on the home screen: season 2's extra app is 소연's archive admin. */
export const appName = (app: AppId): string => (isS2() && app === 'index' ? '보관소 관리' : APP_META[app].name);

/** A full icon tile: background gradient, the artwork, then the light from above and the glass rim. */
function Tile({ id, from, to, children, rim = 0.28 }: { id: string; from: string; to: string; children: ReactNode; rim?: number }) {
  return (
    <svg className="icon-full" viewBox="0 0 60 60" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
        <linearGradient id={`${id}sh`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}ds`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="#000" floodOpacity="0.22" />
        </filter>
      </defs>
      <rect width="60" height="60" fill={`url(#${id}bg)`} />
      {children}
      <rect width="60" height="60" fill={`url(#${id}sh)`} />
      <rect x="0.6" y="0.6" width="58.8" height="58.8" rx="13" fill="none" stroke="#fff" strokeOpacity={rim} strokeWidth="1.2" />
    </svg>
  );
}

// Optional icon images: drop src/assets/icons/<app>.png (messages, phone, browser, gallery,
// notes, memos, settings) and that app uses the image instead of the drawing. Files you add
// there are yours to have the rights to; the drawings below stay as the fallback.
const ICON_FILES = import.meta.glob('../assets/icons/*.{png,webp,jpg,jpeg,svg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const ICON_IMG: Partial<Record<AppId, string>> = {};
for (const [path, url] of Object.entries(ICON_FILES)) ICON_IMG[path.split('/').pop()!.replace(/\.[a-z]+$/i, '') as AppId] = url;

export function AppGlyph({ app }: { app: AppId }) {
  const img = ICON_IMG[app];
  return img ? <img className="icon-full" src={img} alt="" draggable={false} /> : <DrawnGlyph app={app} />;
}

function DrawnGlyph({ app }: { app: AppId }) {
  const id = `i${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const chapter = useGame((s) => s.save.chapter);
  const ds = `url(#${id}ds)`;
  switch (app) {
    case 'messages':
      return (
        <Tile id={id} from="#6ff28a" to="#1fc244">
          {/* the round speech bubble with a small tail; in chapter 4 someone is always typing in it */}
          <path filter={ds} fill="#fff" d="M30 13c10.8 0 19.5 7 19.5 15.6S40.8 44.2 30 44.2c-2.1 0-4.1-.3-6-.8-2.3 2-5.6 3.5-9.4 3.8 1.7-1.6 2.8-3.6 3.1-5.9C13.3 38.5 10.5 33.9 10.5 28.6 10.5 20 19.2 13 30 13z" />
          {chapter >= 4 && [22.5, 30, 37.5].map((x) => <circle key={x} cx={x} cy="28.6" r="2.6" fill="#1fc244" opacity="0.75" />)}
        </Tile>
      );
    case 'phone':
      return (
        <Tile id={id} from="#6ff28a" to="#1fc244">
          <path
            filter={ds}
            fill="#fff"
            transform="translate(30 30) scale(0.9) translate(-30 -30)"
            d="M20.3 13.5c1.3-.7 2.9-.3 3.7.9l3.3 5c.8 1.2.6 2.8-.5 3.7l-2.6 2.1a20 20 0 0010.6 10.6l2.1-2.6c.9-1.1 2.5-1.3 3.7-.5l5 3.3c1.2.8 1.6 2.4.9 3.7l-1.6 3c-1 1.9-3.2 3-5.3 2.5C27.6 42.7 17.3 32.4 14.8 20.4c-.5-2.1.6-4.3 2.5-5.3z"
          />
        </Tile>
      );
    case 'browser': {
      // a compass: white dial, fine ticks, a red-and-white needle
      const ticks = Array.from({ length: 48 }, (_, i) => i * 7.5);
      return (
        <Tile id={id} from="#ffffff" to="#e9edf2" rim={0.6}>
          <defs>
            <linearGradient id={`${id}dial`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#3fb4ff" />
              <stop offset="1" stopColor="#1360e8" />
            </linearGradient>
          </defs>
          <g filter={ds}>
            <circle cx="30" cy="30" r="24.5" fill={`url(#${id}dial)`} />
            <g transform="translate(30 30)" stroke="#fff" strokeLinecap="round">
              {ticks.map((a) => (
                <line key={a} x1="0" y1="-22.6" x2="0" y2={a % 45 === 0 ? -18.2 : -20.4} strokeWidth={a % 45 === 0 ? 1.2 : 0.6} strokeOpacity={a % 45 === 0 ? 1 : 0.85} transform={`rotate(${a})`} />
              ))}
              {/* the needle points north-east — in chapter 4 it has swung round to face you */}
              <g transform={`rotate(${chapter >= 4 ? 180 + 45 : 45})`} stroke="none">
                <path d="M0 -17 L3.4 0 L-3.4 0 Z" fill="#ff3b30" />
                <path d="M0 17 L3.4 0 L-3.4 0 Z" fill="#fff" />
              </g>
              <circle r="1.5" fill="#fff" stroke="none" />
            </g>
          </g>
        </Tile>
      );
    }
    case 'gallery': {
      // a flower of eight translucent petals on white; in chapter 4 one of them has gone grey
      const petals = ['#ff9f0a', '#ffd60a', '#8fd14f', '#34c7a8', '#30a2ff', '#7d5cf0', '#d24fd8', '#ff4a5a'];
      return (
        <Tile id={id} from="#ffffff" to="#eef1f5" rim={0.6}>
          <g transform="translate(30 30)" style={{ mixBlendMode: 'multiply' }}>
            {petals.map((c, i) => (
              <ellipse key={c} cx="0" cy="-11.4" rx="7.2" ry="11.4" fill={chapter >= 4 && i === 5 ? '#4b4650' : c} fillOpacity={chapter >= 4 && i === 5 ? 0.92 : 0.84} transform={`rotate(${i * 45})`} />
            ))}
          </g>
        </Tile>
      );
    }
    case 'notes':
      return (
        <Tile id={id} from="#ffffff" to="#f1f1f1" rim={0.6}>
          {/* white paper under a yellow band; from chapter 3 a line is written that nobody wrote */}
          <defs>
            <linearGradient id={`${id}band`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffe066" />
              <stop offset="1" stopColor="#fcc62d" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="60" height="16" fill={`url(#${id}band)`} />
          <path d="M5 18.6h50" stroke="#b9b9be" strokeWidth="1.3" strokeDasharray="1.1 2.4" strokeLinecap="round" />
          <path d="M6 28h48M6 37h48M6 46h48M6 55h48" stroke="#d4d4d8" strokeWidth="1.1" />
          {chapter >= 3 && <path d="M9 34c3-3 4 1 7-1s3-3 6 0 4 0 6-2 3 1 5 0" fill="none" stroke={chapter >= 4 ? '#b3261e' : '#5a3d0c'} strokeWidth="1.6" strokeLinecap="round" />}
        </Tile>
      );
    case 'memos': {
      // a waveform in red on black; in chapter 3 one sound is far too loud; in chapter 4 it's the only one
      const base = [6, 12, 18, 10, 22, 14, 8, 16, 10, 6, 12];
      const bars = chapter >= 4 ? base.map((_, i) => (i === 5 ? 34 : 2)) : chapter >= 3 ? base.map((h, i) => (i === 5 ? 32 : h)) : base;
      return (
        <Tile id={id} from="#2a2a2c" to="#0b0b0c" rim={0.18}>
          <g>
            {bars.map((h, i) => (
              <rect key={i} x={8.6 + i * 4} y={30 - h / 2} width="2.4" height={h} rx="1.2" fill={i < 6 ? '#ff3b30' : '#f2f2f7'} fillOpacity={i < 6 ? 1 : 0.85} />
            ))}
            {/* the playhead */}
            <rect x="31.4" y="12" width="1.2" height="36" rx="0.6" fill="#ff3b30" />
          </g>
        </Tile>
      );
    }
    case 'settings':
      return (
        <Tile id={id} from="#d7dade" to="#8a8f97">
          {/* a large gear with a smaller ring inside it */}
          <g filter={ds} transform="translate(30 30)">
            {Array.from({ length: 24 }, (_, i) => (
              <rect key={i} x="-1.6" y="-23" width="3.2" height="6" rx="0.8" fill="#4a4d53" transform={`rotate(${i * 15})`} />
            ))}
            <circle r="18.5" fill="#4a4d53" />
            <circle r="15.5" fill="#c4c8ce" />
            {Array.from({ length: 12 }, (_, i) => (
              <rect key={i} x="-1.3" y="-14" width="2.6" height="5" rx="0.7" fill="#4a4d53" transform={`rotate(${i * 30})`} />
            ))}
            <circle r="10" fill="#4a4d53" />
            {Array.from({ length: 3 }, (_, i) => (
              <rect key={i} x="-1.1" y="-9" width="2.2" height="18" rx="1.1" fill="#9ba0a7" transform={`rotate(${i * 60})`} />
            ))}
            <circle r="3.4" fill="#4a4d53" />
            <circle r="1.6" fill="#c4c8ce" />
          </g>
        </Tile>
      );
    case 'index':
      return (
        <Tile id={id} from="#141010" to="#020202" rim={0.12}>
          <g fill="none" stroke="#b33" strokeWidth="1.8">
            <rect x="17" y="13" width="26" height="34" rx="1.5" />
            <path d="M22 22h16M22 28h16M22 34h16M22 40h9" />
            <path d="M17 13v34" strokeWidth="3.4" stroke="#7a1f1f" />
          </g>
        </Tile>
      );
  }
}
