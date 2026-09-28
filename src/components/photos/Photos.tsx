import { memo, useId } from 'react';
import type { HorrorLevel } from '../../game/types';

// ─────────────────────────────────────────────────────────────────────────
// Archive photographs, drawn as SVG so the project ships no third-party
// imagery. Each scene takes the current horror level / figure stage and an
// optional anomaly effect, so the *same* photo can quietly change between
// visits (the Recognition half of the horror loop).
// ─────────────────────────────────────────────────────────────────────────

export interface SceneProps {
  level: HorrorLevel;
  stage?: 0 | 1 | 2 | 3 | 4;
  effect?: string | null;
}

function useSvgId(): string {
  return useId().replace(/[^a-zA-Z0-9_-]/g, '');
}

/** Shared film grain + vignette defs. */
function FilmDefs({ id }: { id: string }) {
  return (
    <defs>
      <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="noise" />
        <feColorMatrix type="saturate" values="0" in="noise" result="mono" />
        <feBlend in="SourceGraphic" in2="mono" mode="multiply" />
      </filter>
      <radialGradient id={`${id}-vig`} cx="50%" cy="48%" r="70%">
        <stop offset="55%" stopColor="#000" stopOpacity="0" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.75" />
      </radialGradient>
      <radialGradient id={`${id}-lamp`} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#fff2c4" stopOpacity="0.85" />
        <stop offset="45%" stopColor="#e8c878" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#e8c878" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

function Face({ x, y, s, opacity }: { x: number; y: number; s: number; opacity: number }) {
  // Not a mask: a pale, under-exposed smear with two hollows. Less detail reads as more wrong.
  const id = useSvgId();
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      <defs>
        <radialGradient id={`${id}-skin`} cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="#b9b2a0" />
          <stop offset="70%" stopColor="#7d776a" />
          <stop offset="100%" stopColor="#2a2722" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
      </defs>
      <g filter={`url(#${id}-soft)`}>
        <ellipse cx="0" cy="0" rx="9" ry="12.5" fill={`url(#${id}-skin)`} />
        <ellipse cx="-3.4" cy="-1.5" rx="1.9" ry="2.6" fill="#0d0b09" />
        <ellipse cx="3.4" cy="-1.5" rx="1.9" ry="2.6" fill="#0d0b09" />
        <path d="M-2.2 6.4 Q0 7.2 2.2 6.4" stroke="#1d1a16" strokeWidth="0.9" fill="none" />
      </g>
    </g>
  );
}

function Figure({ x, y, s, fill, face }: { x: number; y: number; s: number; fill: string; face?: boolean }) {
  return (
    <g className="figure-layer" transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -62 C-9 -62 -13 -54 -13 -46 C-13 -38 -9 -32 0 -32 C9 -32 13 -38 13 -46 C13 -54 9 -62 0 -62 Z" fill={fill} />
      <path d="M-5 -31 L5 -31 L20 -22 C26 -18 27 -8 28 6 L31 70 L-31 70 L-28 6 C-27 -8 -26 -18 -20 -22 Z" fill={fill} />
      <path d="M-24 -10 L-30 40 M24 -10 L30 40" stroke={fill} strokeWidth="7" strokeLinecap="round" />
      {face && <Face x={0} y={-47} s={1.05} opacity={0.92} />}
    </g>
  );
}

// ─── Reading room (Record 003) ───────────────────────────────────────────

function ReadingRoomInner({ stage = 0, effect }: SceneProps) {
  const id = useSvgId();
  // One-frame flicker shows what is really standing there.
  let shown = stage;
  if (effect === 'flicker') shown = 3;
  else if (effect === 'figure-shift' && stage < 3) shown = (stage + 1) as typeof stage;
  const chairTurned = stage === 4;

  return (
    <svg viewBox="0 0 640 420" role="img" aria-label="Black-and-white photograph of an archive reading room: shelves, a desk with a lamp, a chair, and a doorway at the back.">
      <FilmDefs id={id} />
      <g filter={`url(#${id}-grain)`}>
        {/* back wall */}
        <rect width="640" height="300" fill="#6d6353" />
        <rect y="0" width="640" height="60" fill="#584f42" />
        {/* floor */}
        <polygon points="0,300 640,300 640,420 0,420" fill="#40382e" />
        {[80, 200, 320, 440, 560].map((x) => (
          <line key={x} x1={320 + (x - 320) * 0.4} y1="300" x2={x * 1.4 - 128} y2="420" stroke="#352e25" strokeWidth="1.2" />
        ))}
        <line x1="0" y1="340" x2="640" y2="340" stroke="#352e25" />
        <line x1="0" y1="380" x2="640" y2="380" stroke="#352e25" />
        {/* skirting */}
        <rect y="292" width="640" height="10" fill="#4b4336" />
        {/* shelves left */}
        <rect x="18" y="70" width="170" height="226" fill="#3b3227" />
        {[0, 1, 2, 3, 4].map((row) => (
          <g key={row}>
            <rect x="24" y={80 + row * 43} width="158" height="36" fill="#2a231b" />
            {Array.from({ length: 14 }).map((_, i) => (
              <rect
                key={i}
                x={26 + i * 11.2}
                y={82 + row * 43 + ((i * 7 + row * 3) % 9)}
                width="9.4"
                height={34 - ((i * 7 + row * 3) % 9)}
                fill={['#6e604b', '#4d4234', '#857259', '#5b4e3c', '#3f362a'][(i + row) % 5]}
              />
            ))}
          </g>
        ))}
        {/* window */}
        <rect x="230" y="84" width="92" height="120" fill="#19191a" stroke="#4b4336" strokeWidth="6" />
        <line x1="276" y1="84" x2="276" y2="204" stroke="#4b4336" strokeWidth="4" />
        <line x1="230" y1="144" x2="322" y2="144" stroke="#4b4336" strokeWidth="4" />
        {effect === 'face' && <Face x={299} y={120} s={1.2} opacity={0.4} />}
        {/* wall clock stuck at 02:00 */}
        <g transform="translate(372 76)">
          <circle r="20" fill="#d9d1bd" stroke="#2a241c" strokeWidth="3" />
          <line x1="0" y1="0" x2="0" y2="-15" stroke="#1a1612" strokeWidth="2" />
          <line x1="0" y1="0" x2="8.5" y2="-5" stroke="#1a1612" strokeWidth="3" />
        </g>
        {/* doorway */}
        <rect x="408" y="112" width="76" height="186" fill="#0e0c0a" />
        <rect x="402" y="106" width="88" height="6" fill="#4b4336" />
        <rect x="402" y="106" width="6" height="192" fill="#4b4336" />
        <rect x="484" y="106" width="6" height="192" fill="#4b4336" />
        {/* figure (behind furniture unless facing camera) */}
        {shown === 0 && <Figure x={446} y={218} s={0.62} fill="#1e1b17" />}
        {shown === 1 && <Figure x={378} y={236} s={0.78} fill="#1b1814" />}
        {shown === 2 && <Figure x={318} y={250} s={1.02} fill="#15120f" />}
        {/* chair */}
        <g transform={chairTurned ? 'translate(300 262) rotate(-18)' : 'translate(300 262)'}>
          <rect x="-26" y="-50" width="52" height="46" rx="4" fill="#2c241b" />
          <rect x="-30" y="-6" width="60" height="12" fill="#231c14" />
          <rect x="-28" y="6" width="5" height="40" fill="#231c14" />
          <rect x="23" y="6" width="5" height="40" fill="#231c14" />
        </g>
        {/* coat on chair */}
        {!chairTurned && <path d="M280 214 C284 236 282 252 286 268 L316 268 C318 250 316 232 322 214 Z" fill="#5a5750" opacity="0.9" />}
        {/* desk */}
        <polygon points="120,300 470,300 520,346 80,346" fill="#4c3b28" />
        <rect x="80" y="346" width="440" height="14" fill="#3a2d1f" />
        <rect x="96" y="360" width="12" height="54" fill="#2e2418" />
        <rect x="492" y="360" width="12" height="54" fill="#2e2418" />
        {/* papers + index drawer */}
        <polygon points="200,312 262,310 268,334 196,336" fill="#d8d0bd" />
        <polygon points="214,306 270,305 274,326 212,328" fill="#e6dfcc" />
        <rect x="360" y="300" width="70" height="30" fill="#6a5438" />
        <rect x="366" y="306" width="58" height="18" fill="#3a2d1f" />
        <rect x="372" y="298" width="46" height="10" fill="#d8d0bd" />
        {/* lamp */}
        <circle cx="160" cy="290" r="90" fill={`url(#${id}-lamp)`} />
        <rect x="156" y="282" width="6" height="26" fill="#2a2a24" />
        <ellipse cx="159" cy="309" rx="18" ry="5" fill="#2a2a24" />
        <path d="M134 284 L184 284 L172 262 L146 262 Z" fill="#2f5a3c" />
        {/* facing the camera */}
        {shown === 3 && <Figure x={500} y={296} s={1.9} fill="#0c0b09" face />}
        <rect width="640" height="420" fill={`url(#${id}-vig)`} />
      </g>
      {/* dust */}
      {[
        [60, 40],
        [540, 90],
        [220, 380],
        [610, 330],
        [330, 30],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="1.3" fill="#fff" opacity="0.35" />
      ))}
    </svg>
  );
}

// ─── Annex building (Record 005) ─────────────────────────────────────────

function AnnexInner({ level, effect }: SceneProps) {
  const id = useSvgId();
  const litWindow = level >= 3 || effect === 'face';
  return (
    <svg viewBox="0 0 640 420" role="img" aria-label="Photograph of a three-storey concrete municipal building at dusk, with rows of dark windows.">
      <FilmDefs id={id} />
      <g filter={`url(#${id}-grain)`}>
        <rect width="640" height="420" fill="#2b2d2e" />
        <rect width="640" height="200" fill="#3a3c3c" />
        {/* building */}
        <rect x="110" y="96" width="420" height="260" fill="#6b675e" />
        <rect x="104" y="88" width="432" height="12" fill="#56534b" />
        {[0, 1, 2].map((floor) =>
          [0, 1, 2, 3, 4].map((col) => {
            const x = 138 + col * 78;
            const y = 118 + floor * 74;
            const isReading = floor === 0 && col === 1;
            return (
              <g key={`${floor}-${col}`}>
                <rect x={x} y={y} width="50" height="52" fill={isReading && litWindow ? '#6d6040' : '#1b1c1c'} />
                <line x1={x + 25} y1={y} x2={x + 25} y2={y + 52} stroke="#4d4a43" strokeWidth="3" />
                {isReading && effect === 'face' && <Face x={x + 36} y={y + 24} s={0.9} opacity={0.75} />}
              </g>
            );
          }),
        )}
        {/* entrance */}
        <rect x="290" y="300" width="60" height="56" fill="#131414" />
        <rect x="280" y="292" width="80" height="8" fill="#4d4a43" />
        <text x="320" y="286" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill="#bdb6a4" letterSpacing="2">
          HARROW COUNTY ANNEX
        </text>
        {/* ground, fence, trees */}
        <rect y="356" width="640" height="64" fill="#232424" />
        {Array.from({ length: 33 }).map((_, i) => (
          <rect key={i} x={i * 20} y="360" width="3" height="40" fill="#141515" />
        ))}
        <rect y="366" width="640" height="3" fill="#141515" />
        <path d="M0 356 C20 250 60 230 70 356 Z" fill="#161717" />
        <path d="M560 356 C580 220 630 240 640 356 Z" fill="#161717" />
        {/* streetlight */}
        <rect x="585" y="210" width="4" height="150" fill="#101111" />
        <path d="M587 212 L560 212" stroke="#101111" strokeWidth="4" />
        <circle cx="560" cy="216" r="30" fill={`url(#${id}-lamp)`} opacity="0.5" />
        <rect width="640" height="420" fill={`url(#${id}-vig)`} />
      </g>
    </svg>
  );
}

// ─── Floor plan (Record 005) ─────────────────────────────────────────────

function FloorPlanInner({ level }: SceneProps) {
  const ink = '#2c3a57';
  const doorOpen = level >= 3;
  const rooms: { id: string; x: number; y: number; w: number; h: number; label: string }[] = [
    { id: '01', x: 40, y: 40, w: 180, h: 150, label: 'ROOM 01 — STACKS' },
    { id: '02', x: 220, y: 40, w: 150, h: 150, label: 'ROOM 02 — INDEX' },
    { id: '03', x: 370, y: 40, w: 230, h: 150, label: 'ROOM 03 — READING' },
    { id: '04', x: 40, y: 250, w: 170, h: 130, label: 'ROOM 04 — NIGHT STAFF' },
    { id: '05', x: 210, y: 250, w: 190, h: 130, label: 'ROOM 05 — MICROFILM' },
    { id: '06', x: 400, y: 250, w: 200, h: 130, label: 'ROOM 06 — STORAGE' },
  ];
  return (
    <svg viewBox="0 0 640 420" role="img" aria-label="Floor plan of the third floor: six rooms around a corridor. Room 02, the index room, is hatched and marked sealed.">
      <defs>
        <pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke={ink} strokeWidth="1" opacity="0.55" />
        </pattern>
      </defs>
      <rect width="640" height="420" fill="#e8e2d0" />
      {Array.from({ length: 16 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="420" stroke="#cfc6ae" strokeWidth="0.6" />
      ))}
      {Array.from({ length: 11 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 40} x2="640" y2={i * 40} stroke="#cfc6ae" strokeWidth="0.6" />
      ))}
      {rooms.map((r) => (
        <g key={r.id}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={r.id === '02' ? 'url(#hatch)' : 'none'} stroke={ink} strokeWidth="3" />
          <text x={r.x + 10} y={r.y + 20} fontFamily="IBM Plex Mono, monospace" fontSize="11" fill={ink}>
            {r.label}
          </text>
        </g>
      ))}
      {/* doors onto the corridor */}
      {[90, 420, 480].map((x) => (
        <rect key={x} x={x} y="187" width="34" height="6" fill="#e8e2d0" />
      ))}
      {[80, 280, 470].map((x) => (
        <rect key={x} x={x} y="247" width="34" height="6" fill="#e8e2d0" />
      ))}
      {/* ROOM 02 door: bricked — or, later, not */}
      {doorOpen ? (
        <g>
          <rect x="278" y="187" width="34" height="6" fill="#e8e2d0" />
          <path d="M278 190 A34 34 0 0 1 312 224" stroke={ink} strokeWidth="1.2" fill="none" strokeDasharray="3 3" />
        </g>
      ) : (
        <rect x="278" y="186" width="34" height="8" fill={ink} />
      )}
      <text x="244" y="120" fontFamily="IBM Plex Mono, monospace" fontSize="14" fill="#8a2a1e" letterSpacing="3" transform="rotate(-8 295 120)">
        SEALED
      </text>
      <text x="320" y="224" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="10" fill={ink} letterSpacing="4">
        CORRIDOR
      </text>
      <text x="600" y="408" textAnchor="end" fontFamily="IBM Plex Mono, monospace" fontSize="9" fill={ink}>
        HARROW ANNEX · LEVEL 3 · 1:200
      </text>
    </svg>
  );
}

// ─── Transmitter mast (Record 001) ───────────────────────────────────────

function TowerInner(_: SceneProps) {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 640 420" role="img" aria-label="Night photograph of a radio transmitter mast on a hill, a small red light at the top.">
      <FilmDefs id={id} />
      <g filter={`url(#${id}-grain)`}>
        <rect width="640" height="420" fill="#1b1d22" />
        <rect width="640" height="260" fill="#23262c" />
        {[
          [80, 40],
          [150, 90],
          [470, 60],
          [560, 30],
          [600, 120],
          [260, 50],
          [390, 110],
        ].map(([x, y]) => (
          <circle key={`${x}${y}`} cx={x} cy={y} r="1" fill="#e8e6e0" opacity="0.6" />
        ))}
        <path d="M0 330 C140 290 240 300 320 312 C420 326 520 290 640 300 L640 420 L0 420 Z" fill="#0f1012" />
        <g stroke="#0b0b0c" strokeWidth="2.2">
          <line x1="320" y1="40" x2="290" y2="312" />
          <line x1="320" y1="40" x2="350" y2="312" />
          {Array.from({ length: 12 }).map((_, i) => {
            const y = 60 + i * 21;
            const half = ((y - 40) / 272) * 30;
            return <line key={i} x1={320 - half} y1={y} x2={320 + half} y2={y + 21} />;
          })}
        </g>
        <circle cx="320" cy="38" r="3.4" fill="#d44" />
        <circle cx="320" cy="38" r="14" fill="#d44" opacity="0.15" />
        <rect x="360" y="296" width="44" height="22" fill="#141518" />
        <rect x="372" y="303" width="8" height="6" fill="#5c5540" />
        <rect width="640" height="420" fill={`url(#${id}-vig)`} />
      </g>
    </svg>
  );
}

// ─── Cassette (Record 006) ───────────────────────────────────────────────

function CassetteInner({ level }: SceneProps) {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 640 420" role="img" aria-label="A microcassette labelled Tape 6 in handwriting, lying on a desk.">
      <FilmDefs id={id} />
      <g filter={`url(#${id}-grain)`}>
        <rect width="640" height="420" fill="#4a3d2c" />
        {Array.from({ length: 10 }).map((_, i) => (
          <path key={i} d={`M0 ${30 + i * 42} C200 ${20 + i * 42} 420 ${46 + i * 42} 640 ${28 + i * 42}`} stroke="#3e3224" strokeWidth="3" fill="none" />
        ))}
        <g transform="translate(320 210) rotate(-6)">
          <rect x="-170" y="-104" width="340" height="208" rx="14" fill="#1d1d1f" />
          <rect x="-150" y="-86" width="300" height="104" rx="4" fill="#e3dccb" />
          <text x="-132" y="-48" fontFamily="'Bradley Hand', 'Segoe Script', 'Comic Sans MS', cursive" fontSize="26" fill="#23304f">
            Tape 6 — 13/III
          </text>
          <text x="-132" y="-14" fontFamily="'Bradley Hand', 'Segoe Script', 'Comic Sans MS', cursive" fontSize="17" fill="#23304f">
            {level >= 3 ? 'inventory — do not play after 2' : 'inventory, drawers 2–3'}
          </text>
          <rect x="-90" y="34" width="180" height="46" rx="23" fill="#0d0d0e" />
          <circle cx="-56" cy="57" r="16" fill="#6b5a44" />
          <circle cx="56" cy="57" r="16" fill="#6b5a44" />
          <circle cx="-56" cy="57" r="6" fill="#0d0d0e" />
          <circle cx="56" cy="57" r="6" fill="#0d0d0e" />
        </g>
        <rect width="640" height="420" fill={`url(#${id}-vig)`} />
      </g>
    </svg>
  );
}

// ─── Reading room notice (Record 008) ────────────────────────────────────

function NoticeInner({ level }: SceneProps) {
  const id = useSvgId();
  const lines = ['READING ROOM', '', 'OPEN 18:00 — 01:59', '', 'Return drawers to the index.', 'Speak quietly.', level >= 2 ? 'Do not stay after the clock stops.' : 'Thank you.'];
  return (
    <svg viewBox="0 0 640 420" role="img" aria-label="A typed paper notice pinned to a wall with reading room hours.">
      <FilmDefs id={id} />
      <g filter={`url(#${id}-grain)`}>
        <rect width="640" height="420" fill="#5c5446" />
        <g transform="translate(320 210) rotate(1.5)">
          <rect x="-160" y="-180" width="320" height="360" fill="#e9e3d2" />
          <circle cx="0" cy="-166" r="6" fill="#8a2a1e" />
          {lines.map((l, i) => (
            <text
              key={i}
              x="0"
              y={-110 + i * 34}
              textAnchor="middle"
              fontFamily="IBM Plex Mono, Courier New, monospace"
              fontSize={i === 0 ? 24 : 15}
              fontWeight={i === 0 ? 600 : 400}
              fill="#211f1b"
            >
              {l}
            </text>
          ))}
        </g>
        <rect width="640" height="420" fill={`url(#${id}-vig)`} />
      </g>
    </svg>
  );
}

// ─── Room 02 (secret D) ──────────────────────────────────────────────────

function Room02Inner(_: SceneProps) {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 640 420" role="img" aria-label="A dark room lined floor to ceiling with small index drawers. One drawer is open and lit. Someone sits at a desk with their back to the camera.">
      <FilmDefs id={id} />
      <g filter={`url(#${id}-grain)`}>
        <rect width="640" height="420" fill="#141312" />
        {Array.from({ length: 9 }).map((_, row) =>
          Array.from({ length: 16 }).map((__, col) => (
            <g key={`${row}-${col}`}>
              <rect x={12 + col * 39} y={14 + row * 30} width="35" height="26" fill="#2a251e" />
              <rect x={24 + col * 39} y={24 + row * 30} width="11" height="4" fill="#6b5f4b" />
            </g>
          )),
        )}
        <rect x="402" y="104" width="35" height="36" fill="#d9c88f" opacity="0.7" />
        <circle cx="420" cy="120" r="70" fill={`url(#${id}-lamp)`} opacity="0.6" />
        <polygon points="160,330 480,330 520,370 120,370" fill="#2e2418" />
        <rect x="120" y="370" width="400" height="50" fill="#1a150f" />
        <circle cx="400" cy="320" r="60" fill={`url(#${id}-lamp)`} />
        <path d="M384 320 L420 320 L412 302 L392 302 Z" fill="#2f5a3c" />
        <Figure x={300} y={300} s={1.25} fill="#0a0908" />
        <rect width="640" height="420" fill={`url(#${id}-vig)`} />
      </g>
    </svg>
  );
}

export const ReadingRoomPhoto = memo(ReadingRoomInner);
export const AnnexPhoto = memo(AnnexInner);
export const FloorPlan = memo(FloorPlanInner);
export const TowerPhoto = memo(TowerInner);
export const CassettePhoto = memo(CassetteInner);
export const NoticePhoto = memo(NoticeInner);
export const Room02Photo = memo(Room02Inner);
