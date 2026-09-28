import { memo, useId } from 'react';
import { art } from './photoArt';

// ─────────────────────────────────────────────────────────────────────────
// Her. Drawn in SVG (no third-party imagery). She is never shown the same
// way twice: a head hanging upside down into the last photo, half a face
// pressed against 채원's cheek, a figure whose hair hides everything but one
// eye — and only once, at 02:00, the whole face.
// ─────────────────────────────────────────────────────────────────────────

export type GhostLook = 'face' | 'hang' | 'profile' | 'curtain';

function useSvgId(): string {
  return useId().replace(/[^a-zA-Z0-9_-]/g, '');
}

function GhostDefs({ id, distort }: { id: string; distort: boolean }) {
  return (
    <defs>
      <radialGradient id={`${id}-skin`} cx="50%" cy="30%" r="68%">
        <stop offset="0%" stopColor="#d9dcd2" />
        <stop offset="40%" stopColor="#a4a89c" />
        <stop offset="78%" stopColor="#555950" />
        <stop offset="100%" stopColor="#15161378" />
      </radialGradient>
      <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#000" stopOpacity="0" />
        <stop offset="55%" stopColor="#000" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.7" />
      </linearGradient>
      <linearGradient id={`${id}-side`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#cfd2c6" />
        <stop offset="45%" stopColor="#8d9185" />
        <stop offset="100%" stopColor="#1a1b17" />
      </linearGradient>
      <radialGradient id={`${id}-mouth`} cx="50%" cy="25%" r="75%">
        <stop offset="0%" stopColor="#000" />
        <stop offset="80%" stopColor="#070202" />
        <stop offset="100%" stopColor="#240b09" />
      </radialGradient>
      <filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
      <filter id={`${id}-focus`} x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation="0.9" />
      </filter>
      <filter id={`${id}-warp`} x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.016 0.045" numOctaves="2" seed="13" result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale={distort ? 12 : 0} xChannelSelector="R" yChannelSelector="G" result="w" />
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="3" result="g" />
        <feColorMatrix in="g" type="saturate" values="0" result="gm" />
        <feBlend in="w" in2="gm" mode="multiply" result="grainy" />
        {/* keep the grain inside her silhouette */}
        <feComposite in="grainy" in2="w" operator="in" />
      </filter>
    </defs>
  );
}

const FACE_PATH = 'M0 -138 C62 -138 96 -92 96 -22 C96 52 82 122 52 180 C32 216 -32 216 -52 180 C-82 122 -96 52 -96 -22 C-96 -92 -62 -138 0 -138 Z';

/** Frontal face without hair, centred on (0,0). */
function Face({ id, eyes = 'both' }: { id: string; eyes?: 'both' | 'right' }) {
  return (
    <g filter={`url(#${id}-focus)`}>
      <path d={FACE_PATH} fill={`url(#${id}-skin)`} />
      <path d={FACE_PATH} fill={`url(#${id}-shade)`} />
      <g filter={`url(#${id}-soft)`}>
        <ellipse cx="-55" cy="62" rx="20" ry="44" fill="#2f322b" opacity="0.7" />
        <ellipse cx="55" cy="62" rx="20" ry="44" fill="#2f322b" opacity="0.7" />
        <ellipse cx="-38" cy="-18" rx="36" ry="34" fill="#141511" opacity="0.9" />
        <ellipse cx="40" cy="-16" rx="35" ry="36" fill="#141511" opacity="0.9" />
      </g>
      {eyes === 'both' && <ellipse cx="-38" cy="-20" rx="19" ry="24" fill="#000" transform="rotate(9 -38 -20)" />}
      <ellipse cx="40" cy="-16" rx="18" ry="26" fill="#000" transform="rotate(-7 40 -16)" />
      {eyes === 'both' && <path d="M-44 2 C-47 34 -41 66 -46 112 L-39 112 C-35 70 -40 36 -34 4 Z" fill="#030303" opacity="0.85" />}
      <path d="M44 8 C46 30 42 52 46 74 L51 74 C50 52 51 30 50 8 Z" fill="#030303" opacity="0.8" />
      {eyes === 'both' && <circle cx="-34" cy="-22" r="1.8" fill="#e6e7dc" opacity="0.85" />}
      <circle cx="37" cy="-19" r="1.8" fill="#e6e7dc" opacity="0.85" />
      <ellipse cx="-7" cy="44" rx="2.6" ry="5" fill="#1a1b17" transform="rotate(-20 -7 44)" />
      <ellipse cx="7" cy="44" rx="2.6" ry="5" fill="#1a1b17" transform="rotate(20 7 44)" />
      <path d="M-21 74 C-31 122 -23 188 0 204 C23 188 31 122 21 74 C11 67 -11 67 -21 74 Z" fill={`url(#${id}-mouth)`} stroke="#23241f" strokeWidth="4" />
      <g fill="#9f9c8b" opacity="0.55">
        <polygon points="-15,74 -12,88 -9,73" />
        <polygon points="-3,71 -1,80 2,71" />
        <polygon points="9,73 12,92 15,75" />
        <polygon points="-8,196 -5,184 -2,198" />
      </g>
      <g stroke="#23241f" strokeWidth="1.3" fill="none" opacity="0.55">
        <path d="M-64 -74 L-52 -56 L-58 -42 L-46 -30" />
        <path d="M62 34 L72 58 L64 78" />
        <path d="M-18 -116 L-10 -96 L-16 -82" />
      </g>
    </g>
  );
}

/** The whole face. Shown once: at 02:00. Centred on (0,0), ~300 × 480. */
export const GhostFaceShape = memo(function GhostFaceShape({ distort = true }: { distort?: boolean }) {
  const id = useSvgId();
  return (
    <g>
      <GhostDefs id={id} distort={distort} />
      <g filter={`url(#${id}-warp)`}>
        <path d="M-150 -175 C-195 -40 -180 140 -170 340 L170 340 C180 140 195 -40 150 -175 C95 -255 -95 -255 -150 -175 Z" fill="#040404" />
        <path d="M-38 150 L38 150 L52 240 C120 258 172 290 192 340 L-192 340 C-172 290 -120 258 -52 240 Z" fill="#0b0b0a" />
        <Face id={id} />
        <path d="M-98 -118 C-60 -172 60 -172 98 -118 C60 -142 -60 -142 -98 -118 Z" fill="#040404" />
        <g stroke="#030303" fill="none" strokeLinecap="round">
          <path d="M-62 -128 C-88 -30 -114 92 -128 270" strokeWidth="22" />
          <path d="M-34 -142 C-64 -40 -98 62 -114 246" strokeWidth="15" />
          <path d="M-14 -144 C-26 -80 -40 -30 -58 70 C-64 110 -70 150 -72 200" strokeWidth="9" />
          <path d="M-2 -146 C-8 -100 -14 -60 -20 -24" strokeWidth="3" />
          <path d="M24 -142 C48 -64 64 18 70 130" strokeWidth="6" />
          <path d="M46 -142 C74 -50 104 72 116 246" strokeWidth="15" />
          <path d="M72 -126 C98 -30 122 100 134 276" strokeWidth="22" />
        </g>
      </g>
    </g>
  );
});

// Hair strands hanging straight down from a line: [x, width, sway].
const HANG_STRANDS: [number, number, number][] = [
  [-92, 26, -14], [-70, 18, 8], [-52, 22, -6], [-30, 12, 12], [-14, 20, -10], [4, 9, 6],
  [18, 24, -4], [36, 14, 14], [54, 22, -12], [72, 16, 6], [90, 26, 10], [-80, 8, 20], [62, 7, -20],
];

/** Upside down, from the ceiling: mouth on top, one eye, hair pouring down. Head centre (0,0). */
export const GhostHanging = memo(function GhostHanging({ distort = true }: { distort?: boolean }) {
  const id = useSvgId();
  return (
    <g>
      <GhostDefs id={id} distort={distort} />
      <g filter={`url(#${id}-warp)`}>
        {/* neck and the rest of her, above — somewhere in the ceiling */}
        <path d="M-40 -130 C-46 -260 -40 -420 -60 -700 L60 -700 C40 -420 46 -260 40 -130 Z" fill="#070707" />
        <g transform="rotate(180)">
          <Face id={id} eyes="right" />
        </g>
        {/* the top of her head is at the bottom now: hair pours down from it */}
        <g stroke="#030303" fill="none" strokeLinecap="butt">
          {HANG_STRANDS.map(([x, w, sw], i) => (
            <path key={i} d={`M${x * 0.9} 160 C${x + sw} 300 ${x - sw} 420 ${x * 1.1 + sw * 1.5} ${560 + (i % 3) * 40}`} strokeWidth={w} />
          ))}
        </g>
        <path d="M-100 84 C-60 112 60 112 100 84 C110 160 70 214 0 218 C-70 214 -110 160 -100 84 Z" fill="#040404" />
        {/* wet strands stuck across the face and over the empty socket */}
        <g stroke="#030303" fill="none" strokeLinecap="round">
          <path d="M-60 110 C-50 60 -38 10 -30 -40" strokeWidth="14" />
          <path d="M-84 100 C-70 40 -56 -10 -58 -60" strokeWidth="8" />
          <path d="M-36 112 C-32 80 -26 40 -24 10" strokeWidth="4" />
        </g>
      </g>
    </g>
  );
});

/** Half a face in profile, turned so the one visible eye looks at the lens. Faces left. */
export const GhostProfile = memo(function GhostProfile({ distort = true }: { distort?: boolean }) {
  const id = useSvgId();
  return (
    <g>
      <GhostDefs id={id} distort={distort} />
      <g filter={`url(#${id}-warp)`}>
        <path d="M-24 176 C-14 240 -24 300 -34 340 L80 340 L60 140 Z" fill="#0b0b0a" />
        <path
          d="M30 -172 C-20 -176 -70 -150 -84 -100 C-92 -70 -90 -52 -96 -40 C-88 -30 -86 -10 -94 6 C-104 20 -120 32 -116 42 C-112 50 -98 50 -88 52 C-92 60 -98 66 -94 74 L-90 150 C-96 160 -90 176 -76 184 C-62 196 -40 200 -14 196 C14 190 36 176 56 150 L70 -172 Z"
          fill={`url(#${id}-side)`}
        />
        {/* the jaw hangs open, much too long */}
        <path d="M-94 74 C-76 70 -58 80 -52 96 C-50 112 -56 132 -68 146 L-90 150 C-88 126 -88 100 -94 74 Z" fill={`url(#${id}-mouth)`} />
        <g filter={`url(#${id}-soft)`}>
          <ellipse cx="-52" cy="-26" rx="28" ry="24" fill="#141511" opacity="0.95" />
          <ellipse cx="-34" cy="64" rx="18" ry="40" fill="#2f322b" opacity="0.6" />
        </g>
        {/* the eye is turned all the way forward: toward you */}
        <ellipse cx="-62" cy="-26" rx="15" ry="11" fill="#000" />
        <circle cx="-72" cy="-27" r="1.8" fill="#e6e7dc" opacity="0.9" />
        <path d="M-66 -12 C-68 20 -64 44 -70 80" stroke="#030303" strokeWidth="4" fill="none" opacity="0.8" />
        <path d="M30 -184 C110 -186 170 -120 186 -20 C200 100 180 220 206 340 L40 340 C52 260 50 190 44 140 C30 90 24 40 18 -20 C12 -80 -12 -130 -52 -154 C-26 -178 0 -186 30 -184 Z" fill="#040404" />
        <path d="M-44 -160 C-58 -90 -66 -20 -62 40" stroke="#030303" strokeWidth="5" fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
});

/** Head tilted, face hidden behind wet hair — except one eye through a gap. */
export const GhostCurtain = memo(function GhostCurtain({ distort = true }: { distort?: boolean }) {
  const id = useSvgId();
  return (
    <g>
      <GhostDefs id={id} distort={distort} />
      <g filter={`url(#${id}-warp)`} transform="rotate(-24)">
        <path d="M-38 150 L38 150 L52 240 C120 258 172 290 192 380 L-192 380 C-172 290 -120 258 -52 240 Z" fill="#0b0b0a" />
        <Face id={id} eyes="right" />
        {/* the curtain: everything but a crack at the right eye */}
        <path d="M-150 -175 C-110 -250 110 -250 150 -175 C120 -150 60 -148 24 -140 C18 -60 20 40 12 140 C8 240 16 320 18 400 L-190 400 C-190 200 -190 0 -150 -175 Z" fill="#040404" />
        <path d="M150 -175 C180 -40 190 160 180 400 L70 400 C76 300 66 200 72 100 C76 30 68 -40 62 -100 C70 -140 110 -160 150 -175 Z" fill="#040404" />
        <g stroke="#030303" fill="none" strokeLinecap="round">
          <path d="M40 -150 C44 -60 34 40 44 200" strokeWidth="4" />
          <path d="M20 -140 C30 -40 50 60 60 150" strokeWidth="3" />
        </g>
      </g>
    </g>
  );
});

const VIEWBOX: Record<GhostLook, string> = {
  face: '-200 -240 400 560',
  hang: '-200 -300 400 700',
  profile: '-200 -240 400 580',
  curtain: '-220 -260 440 660',
};

export const GhostSvg = memo(function GhostSvg({ className, distort, look = 'face' }: { className?: string; distort?: boolean; look?: GhostLook }) {
  return (
    <svg className={className} viewBox={VIEWBOX[look]} aria-hidden="true" focusable="false">
      {look === 'face' && <GhostFaceShape distort={distort} />}
      {look === 'hang' && <GhostHanging distort={distort} />}
      {look === 'profile' && <GhostProfile distort={distort} />}
      {look === 'curtain' && <GhostCurtain distort={distort} />}
    </svg>
  );
});

/** The scare image: a provided photograph for that look if there is one, else the drawing. */
export function GhostVisual({ look, className }: { look: GhostLook; className?: string }) {
  const url = art(look === 'curtain' ? 'reflect' : `scare-${look}`);
  if (url) return <img className={`${className ?? ''} ghost-photo`} src={url} alt="" draggable={false} />;
  return <GhostSvg className={className} look={look} distort />;
}
