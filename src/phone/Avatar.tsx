import type { ThreadId } from '../engine/types';
import { AppGlyph, APP_META } from './icons';
import { art } from '../art/photoArt';

// Contact profile pictures, drawn (no photos of real people).
// 도현: the back-view-at-the-sea photo every guy has. 엄마: flowers, always.
// 나에게: 채원's own channel logo. The unknown number: the default silhouette —
// except the hair is too long.

function Portrait({ th }: { th: ThreadId }) {
  // A real profile photo, if one was provided (src/assets/art/avatar-<thread>).
  const photo = art(`avatar-${th}`);
  if (photo) return <img src={photo} alt="" draggable={false} />;
  switch (th) {
    case 'dohyun':
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <defs>
            <linearGradient id="av-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6c5b7b" />
              <stop offset="55%" stopColor="#f4845f" />
              <stop offset="100%" stopColor="#f7c58b" />
            </linearGradient>
          </defs>
          <rect width="40" height="26" fill="url(#av-sky)" />
          <circle cx="29" cy="22" r="4" fill="#ffe3a3" />
          <rect y="24" width="40" height="16" fill="#35506e" />
          <path d="M0 27h40M4 30h30M8 33h26" stroke="#f7c58b" strokeWidth="0.6" opacity="0.6" />
          <circle cx="17" cy="25" r="3.6" fill="#15161b" />
          <path d="M9 40c0-8 4-11 8-11s8 3 8 11z" fill="#15161b" />
        </svg>
      );
    case 'mom':
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <rect width="40" height="40" fill="#e9f3e1" />
          <path d="M8 40c3-10 6-14 12-18M30 40c-2-9-5-12-9-16" stroke="#5a8f4e" strokeWidth="1.6" fill="none" />
          <ellipse cx="11" cy="30" rx="5" ry="2.2" fill="#6ea85f" transform="rotate(-30 11 30)" />
          <ellipse cx="28" cy="31" rx="5" ry="2.2" fill="#6ea85f" transform="rotate(30 28 31)" />
          {[
            [13, 15, 5.5, '#f27ea9'],
            [27, 13, 5, '#f59ac0'],
            [21, 24, 4.5, '#ee6a9b'],
          ].map(([x, y, r, c]) => (
            <g key={`${x}`}>
              {[0, 72, 144, 216, 288].map((a) => (
                <circle
                  key={a}
                  cx={Number(x) + Math.cos((a * Math.PI) / 180) * Number(r) * 0.55}
                  cy={Number(y) + Math.sin((a * Math.PI) / 180) * Number(r) * 0.55}
                  r={Number(r) * 0.5}
                  fill={String(c)}
                />
              ))}
              <circle cx={Number(x)} cy={Number(y)} r={Number(r) * 0.28} fill="#f7d04a" />
            </g>
          ))}
        </svg>
      );
    case 'self':
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <rect width="40" height="40" fill="#17122e" />
          <circle cx="8" cy="9" r="0.8" fill="#fff" opacity="0.8" />
          <circle cx="31" cy="7" r="0.6" fill="#fff" opacity="0.7" />
          <circle cx="33" cy="30" r="0.7" fill="#fff" opacity="0.6" />
          <circle cx="20" cy="18" r="9" fill="#f5e6a8" />
          <circle cx="24" cy="15.5" r="8" fill="#17122e" />
          <circle cx="11" cy="31" r="2.2" fill="#ff3b30" />
          <text x="15" y="33.2" fontSize="6.5" fontWeight="700" fill="#fff" fontFamily="IBM Plex Sans KR, sans-serif">
            밤채널
          </text>
        </svg>
      );
    case 'unknown':
      return (
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <rect width="40" height="40" fill="#8e9097" />
          <circle cx="20" cy="15" r="7" fill="#d9dadd" />
          <path d="M6 40c0-9 6-13 14-13s14 4 14 13z" fill="#d9dadd" />
          {/* not part of the default picture */}
          <path d="M14 11c-3 6-4 14-5 24M26 11c3 6 4 14 5 24M17 9c-2 7-2 12-3 18" stroke="#26272b" strokeWidth="1.3" fill="none" opacity="0.55" />
        </svg>
      );
  }
}

/** Round contact picture; `badge` adds the small messages-app icon like a lock-screen notification. */
export function Avatar({ th, size = 48, badge = false }: { th: ThreadId; size?: number; badge?: boolean }) {
  return (
    <span className="avatar pic" style={{ width: size, height: size }}>
      <Portrait th={th} />
      {badge && (
        <span className="avatar-badge" style={{ background: APP_META.messages.bg }}>
          <AppGlyph app="messages" />
        </span>
      )}
    </span>
  );
}
