import { memo, useId } from 'react';
import { NOTEBOOK } from '../content/s2/media';
import { art } from './photoArt';

// 시즌 2 — photos on 소연's phone, drawn (no photos of real people):
// her mother's notebook, the kitchen at 01:59, the morning she came home.

const HAND = "'Nanum Pen Script', 'IBM Plex Sans KR', cursive";

/** A phone photo of a lined notebook page, slightly crooked, under a kitchen light. */
function Paper({ children, tilt = -2.2, label }: { children: React.ReactNode; tilt?: number; label: string }) {
  const id = useId().replace(/:/g, '');
  const photo = art('s2-notebook');
  return (
    <svg viewBox="0 0 420 560" role="img" aria-label={label}>
      <defs>
        <radialGradient id={`${id}-light`} cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#fff6dc" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
      </defs>
      {photo ? (
        // a real photo of the blank page; her lines are written over it
        <>
          <image href={photo} width="420" height="560" preserveAspectRatio="xMidYMid slice" />
          <g transform={`rotate(${tilt} 210 280)`}>{children}</g>
        </>
      ) : (
        <>
          <rect width="420" height="560" fill="#2a2420" />
          <g transform={`rotate(${tilt} 210 280)`}>
            <rect x="34" y="26" width="352" height="510" fill="#efe7d4" />
            {Array.from({ length: 19 }, (_, i) => (
              <line key={i} x1="34" x2="386" y1={92 + i * 24} y2={92 + i * 24} stroke="#9fb4cc" strokeWidth="0.8" opacity="0.7" />
            ))}
            <line x1="78" x2="78" y1="26" y2="536" stroke="#d27a7a" strokeWidth="1" opacity="0.7" />
            {children}
          </g>
          <rect width="420" height="560" fill={`url(#${id}-light)`} />
        </>
      )}
    </svg>
  );
}

const Line = ({ y, children, dim = false, strike = false, size = 23, pencil = false }: { y: number; children: string; dim?: boolean; strike?: boolean; size?: number; pencil?: boolean }) => (
  <g opacity={dim ? 0.55 : pencil ? 0.6 : 1}>
    <text x="88" y={y} fontFamily={HAND} fontSize={size} fill={pencil ? '#6b6f7a' : '#24252e'}>
      {children}
    </text>
    {strike && <line x1="86" x2={96 + children.length * 10.5} y1={y - 7} y2={y - 9} stroke="#24252e" strokeWidth="1.4" />}
  </g>
);

/** The notebook, page 1 or 2: one name a month, each at 02:00. Page 3 is tonight's. */
export const NotebookPage = memo(function NotebookPage({ page, more = '' }: { page: 1 | 2 | 3; more?: string }) {
  if (page === 3)
    return (
      <Paper tilt={1.4} label="노트의 새 페이지. 연필로 옅게: 9월 28일 02:00 — 한소연. 엄마의 글씨.">
        <Line y={112} pencil>
          9월 28일 02:00 — 한소연
        </Line>
        {more && (
          <g className="nb-more">
            <Line y={160} pencil>
              {more}
            </Line>
          </g>
        )}
      </Paper>
    );
  const rows = page === 1 ? NOTEBOOK.slice(0, 6) : NOTEBOOK.slice(6);
  return (
    <Paper tilt={page === 1 ? -2.2 : -0.8} label={`노트 ${page}쪽. 날짜와 02:00, 그리고 이름이 한 줄씩. ${rows.map(([d, n]) => `${d} ${n}`).join(', ')}.`}>
      {page === 1 && (
        <Line y={64} strike dim size={20}>
          1994년 3월 14일 02:00 — 서미령
        </Line>
      )}
      {rows.map(([d, n], i) => (
        <Line key={d} y={112 + i * 48}>{`${d} 02:00 — ${n}`}</Line>
      ))}
    </Paper>
  );
});

/** 8월 28일 01:59, through a door left ajar: a woman at the kitchen table, writing. Back view. */
export const KitchenPhoto = memo(function KitchenPhoto() {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 640 420" role="img" aria-label="문틈으로 찍은 어두운 부엌. 식탁 위 스탠드 불빛 아래, 단발머리 여자가 등을 보이고 앉아 무언가를 쓰고 있다.">
      <defs>
        <radialGradient id={`${id}-lamp`} cx="52%" cy="46%" r="38%">
          <stop offset="0%" stopColor="#f2d9a0" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-blur`}>
          <feGaussianBlur stdDeviation="1.2" />
        </filter>
      </defs>
      <rect width="640" height="420" fill="#07080a" />
      <rect x="0" y="0" width="120" height="420" fill="#030304" />
      <rect x="560" y="0" width="80" height="420" fill="#030304" />
      <rect x="140" y="250" width="400" height="18" fill="#2a2119" />
      <rect x="160" y="268" width="10" height="150" fill="#1b1611" />
      <rect x="510" y="268" width="10" height="150" fill="#1b1611" />
      <rect width="640" height="420" fill={`url(#${id}-lamp)`} />
      <g filter={`url(#${id}-blur)`}>
        <path d="M372 250 l8 -60 l14 0 l-6 60z" fill="#3a3024" />
        <ellipse cx="386" cy="186" rx="26" ry="9" fill="#d9c08a" opacity="0.85" />
        {/* her: bob haircut, cardigan, bent over the page */}
        <path d="M262 252c-6-50 10-86 52-92 40 6 56 42 50 92z" fill="#141210" />
        <ellipse cx="312" cy="142" rx="30" ry="34" fill="#0e0d0c" />
        <path d="M282 136c2-26 18-40 32-40s30 14 32 40c-6-10-18-16-32-16s-26 6-32 16z" fill="#080807" />
        <rect x="300" y="244" width="70" height="6" fill="#efe7d4" opacity="0.8" />
      </g>
      <text x="22" y="398" fontFamily="IBM Plex Mono, monospace" fontSize="15" fill="#e6534b" opacity="0.85">
        01:59
      </text>
    </svg>
  );
});

/**
 * 9월 28일 01:52, tonight: the same kitchen, closer — from inside the room, not the door.
 * Taken by 소연's phone, which is in the booth. Its own photo if there is one, else the
 * August photo, cropped in towards her back.
 */
export const KitchenTonightPhoto = memo(function KitchenTonightPhoto() {
  const own = art('s2-kitchen-close');
  const photo = own ?? art('s2-kitchen');
  const label = '어두운 부엌. 아까 사진보다 훨씬 가까이에서, 식탁에 앉아 무언가를 쓰는 단발머리 여자의 등이 보인다.';
  if (!photo) return <KitchenPhoto />;
  return (
    <svg viewBox={own ? '0 0 640 585' : '200 150 320 292'} role="img" aria-label={label}>
      <rect x="0" y="0" width="640" height="585" fill="#050505" />
      <image href={photo} width="640" height="585" preserveAspectRatio="xMidYMid slice" />
      <text x={own ? 22 : 212} y={own ? 562 : 432} fontFamily="IBM Plex Mono, monospace" fontSize={own ? 15 : 8} fill="#e6534b" opacity="0.85">
        01:52
      </text>
    </svg>
  );
});

/** The morning she came home: the same coat over a kitchen chair, dawn in the window. */
export const HomecomingPhoto = memo(function HomecomingPhoto() {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 640 420" role="img" aria-label="새벽빛이 드는 부엌. 식탁 의자에 낡은 갈색 외투가 걸려 있다. 1994년의 외투.">
      <defs>
        <linearGradient id={`${id}-dawn`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1b2233" />
          <stop offset="100%" stopColor="#7c8aa3" />
        </linearGradient>
      </defs>
      <rect width="640" height="420" fill="#14161b" />
      <rect x="400" y="40" width="190" height="200" fill={`url(#${id}-dawn)`} />
      <line x1="495" x2="495" y1="40" y2="240" stroke="#14161b" strokeWidth="6" />
      <line x1="400" x2="590" y1="140" y2="140" stroke="#14161b" strokeWidth="6" />
      <rect x="80" y="270" width="420" height="16" fill="#3a3129" />
      <rect x="250" y="190" width="70" height="12" fill="#2e2620" />
      <rect x="250" y="190" width="10" height="200" fill="#2e2620" />
      <rect x="310" y="190" width="10" height="200" fill="#2e2620" />
      <path d="M246 196c-10 40-12 90-6 150l90 0c6-60 4-110-6-150z" fill="#7a5a3e" />
      <path d="M262 200l22 60 22-60" fill="none" stroke="#5e4430" strokeWidth="4" />
      <text x="22" y="398" fontFamily="IBM Plex Mono, monospace" fontSize="15" fill="#e6534b" opacity="0.85">
        06:10
      </text>
    </svg>
  );
});
