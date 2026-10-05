import { useId, type ReactNode } from 'react';
import type { AppId } from '../engine/types';
import { isS2 } from '../content/season';
import { useGame } from '../hooks/useGame';

// App icons, drawn here in the iOS 26 manner (lit from above, a glass rim)
// but our own designs — no platform icon assets. Each one is a full tile.
// As the night goes on, some of them change a little.

export const APP_META: Record<AppId, { name: string; bg: string }> = {
  messages: { name: '메시지', bg: 'linear-gradient(180deg,#5ef07f,#0fbb3a)' },
  gallery: { name: '사진', bg: 'linear-gradient(180deg,#ffffff,#e9ecf1)' },
  notes: { name: '메모', bg: 'linear-gradient(180deg,#ffe57e,#f4c63e)' },
  memos: { name: '녹음', bg: 'linear-gradient(180deg,#ff6f61,#d4232a)' },
  browser: { name: '인터넷', bg: 'linear-gradient(180deg,#5cc8ff,#0a64ec)' },
  phone: { name: '전화', bg: 'linear-gradient(180deg,#6cf08b,#12b63a)' },
  settings: { name: '설정', bg: 'linear-gradient(180deg,#bfc3ca,#6c7179)' },
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

export function AppGlyph({ app }: { app: AppId }) {
  const id = `i${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const chapter = useGame((s) => s.save.chapter);
  const ds = `url(#${id}ds)`;
  switch (app) {
    case 'messages':
      return (
        <Tile id={id} from="#5ef07f" to="#0fbb3a">
          {/* a rounded speech bubble; in chapter 4 someone is always typing in it */}
          <path filter={ds} fill="#fff" d="M17 15h26a8 8 0 018 8v11a8 8 0 01-8 8H27l-9 6.5 2-6.5h-3a8 8 0 01-8-8V23a8 8 0 018-8z" />
          {chapter >= 4 && [22, 30, 38].map((x) => <circle key={x} cx={x} cy="28.5" r="2.6" fill="#0fbb3a" opacity="0.75" />)}
        </Tile>
      );
    case 'phone':
      return (
        <Tile id={id} from="#6cf08b" to="#12b63a">
          <path
            filter={ds}
            fill="#fff"
            d="M20.3 13.5c1.3-.7 2.9-.3 3.7.9l3.3 5c.8 1.2.6 2.8-.5 3.7l-2.6 2.1a20 20 0 0010.6 10.6l2.1-2.6c.9-1.1 2.5-1.3 3.7-.5l5 3.3c1.2.8 1.6 2.4.9 3.7l-1.6 3c-1 1.9-3.2 3-5.3 2.5C27.6 42.7 17.3 32.4 14.8 20.4c-.5-2.1.6-4.3 2.5-5.3z"
          />
        </Tile>
      );
    case 'browser':
      return (
        <Tile id={id} from="#5cc8ff" to="#0a64ec">
          {/* a globe, not a compass */}
          <g filter={ds} fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
            <circle cx="30" cy="30" r="16" fill="#fff" fillOpacity="0.12" />
            <path d="M14 30h32M30 14c6 5 6 27 0 32M30 14c-6 5-6 27 0 32M17 21.5h26M17 38.5h26" strokeWidth="2" />
          </g>
        </Tile>
      );
    case 'gallery':
      return (
        <Tile id={id} from="#ffffff" to="#e6e9ee" rim={0.6}>
          <defs>
            <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={chapter >= 4 ? '#7b6f86' : '#ffb35c'} />
              <stop offset="1" stopColor={chapter >= 4 ? '#3c3346' : '#ff5e7e'} />
            </linearGradient>
          </defs>
          {/* two prints: one behind, tilted; the front one a sunset over a ridge */}
          <rect x="15" y="12" width="30" height="30" rx="5" fill="#8ec5ff" transform="rotate(-10 30 27)" filter={ds} />
          <g filter={ds}>
            <rect x="14" y="17" width="32" height="30" rx="5" fill="#fff" />
            <rect x="17" y="20" width="26" height="24" rx="3" fill={`url(#${id}sky)`} />
            <circle cx="35" cy="27" r="3.6" fill="#fff4c8" opacity={chapter >= 4 ? 0.45 : 0.95} />
            <path d="M17 44V37l6-5 5 4 6-6 9 8v6z" fill="#2f2440" />
            {/* chapter 4: someone stands on the ridge */}
            {chapter >= 4 && <path d="M33.6 30.6h.9v-1.4a.7.7 0 10-.9 0z" fill="#120d18" />}
          </g>
        </Tile>
      );
    case 'notes':
      return (
        <Tile id={id} from="#ffe57e" to="#f4c63e">
          {/* a spiral pad; from chapter 3 a line is written that nobody wrote */}
          <rect x="0" y="0" width="60" height="13" fill="#e2a92a" />
          {[14, 23, 32, 41].map((x) => (
            <g key={x}>
              <circle cx={x + 2} cy="13" r="2.2" fill="#8a6413" />
              <rect x={x + 1} y="6" width="2" height="8" rx="1" fill="#f5f0e0" />
            </g>
          ))}
          <path d="M12 25h36M12 33h36M12 41h36M12 49h36" stroke="#b98a1c" strokeOpacity="0.55" strokeWidth="1.3" />
          {chapter >= 3 && <path d="M13 31c3-3 4 1 7-1s3-3 6 0 4 0 6-2 3 1 5 0" fill="none" stroke={chapter >= 4 ? '#b3261e' : '#5a3d0c'} strokeWidth="1.6" strokeLinecap="round" />}
        </Tile>
      );
    case 'memos': {
      // a recording level: in chapter 3 one sound is far too loud; in chapter 4 it's the only one
      const base = [6, 12, 18, 10, 22, 14, 8, 16, 10, 6];
      const bars = chapter >= 4 ? base.map((_, i) => (i === 5 ? 34 : 2)) : chapter >= 3 ? base.map((h, i) => (i === 5 ? 32 : h)) : base;
      return (
        <Tile id={id} from="#ff6f61" to="#d4232a">
          <g filter={ds} fill="#fff">
            {bars.map((h, i) => (
              <rect key={i} x={10.5 + i * 4} y={30 - h / 2} width="2.6" height={h} rx="1.3" />
            ))}
          </g>
        </Tile>
      );
    }
    case 'settings':
      return (
        <Tile id={id} from="#bfc3ca" to="#6c7179">
          <g filter={ds} transform="translate(30 30)">
            {Array.from({ length: 12 }, (_, i) => (
              <rect key={i} x="-3" y="-21" width="6" height="9" rx="1.5" fill="#3b3e44" transform={`rotate(${i * 30})`} />
            ))}
            <circle r="15" fill="#3b3e44" />
            <circle r="11.5" fill="#a9aeb6" />
            <circle r="6" fill="#3b3e44" />
            <circle r="3" fill="#cfd3d9" />
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
