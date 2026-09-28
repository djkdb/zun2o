import { memo, useId } from 'react';

// ─────────────────────────────────────────────────────────────────────────
// Her. Drawn in SVG (no third-party imagery): a gaunt, under-exposed face
// with hollow eyes, pinpoint pupils, a stretched mouth and wet dark hair.
// Used small (in photographs) and full-screen for jump scares.
// ─────────────────────────────────────────────────────────────────────────

/** Face centred on (0,0), roughly 300 × 480 units. */
export const GhostFaceShape = memo(function GhostFaceShape({ distort = true }: { distort?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <g>
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
      <g filter={`url(#${id}-warp)`}>
        {/* hair behind the head */}
        <path d="M-150 -175 C-195 -40 -180 140 -170 340 L170 340 C180 140 195 -40 150 -175 C95 -255 -95 -255 -150 -175 Z" fill="#040404" />
        {/* neck and shoulders */}
        <path d="M-38 150 L38 150 L52 240 C120 258 172 290 192 340 L-192 340 C-172 290 -120 258 -52 240 Z" fill="#0b0b0a" />
        <g filter={`url(#${id}-focus)`}>
          {/* face: the jaw hangs too low */}
          <path
            d="M0 -138 C62 -138 96 -92 96 -22 C96 52 82 122 52 180 C32 216 -32 216 -52 180 C-82 122 -96 52 -96 -22 C-96 -92 -62 -138 0 -138 Z"
            fill={`url(#${id}-skin)`}
          />
          <path
            d="M0 -138 C62 -138 96 -92 96 -22 C96 52 82 122 52 180 C32 216 -32 216 -52 180 C-82 122 -96 52 -96 -22 C-96 -92 -62 -138 0 -138 Z"
            fill={`url(#${id}-shade)`}
          />
          {/* hollows */}
          <g filter={`url(#${id}-soft)`}>
            <ellipse cx="-55" cy="62" rx="20" ry="44" fill="#2f322b" opacity="0.7" />
            <ellipse cx="55" cy="62" rx="20" ry="44" fill="#2f322b" opacity="0.7" />
            <ellipse cx="-38" cy="-18" rx="36" ry="34" fill="#141511" opacity="0.9" />
            <ellipse cx="40" cy="-16" rx="35" ry="36" fill="#141511" opacity="0.9" />
          </g>
          {/* eyes: hollow, slightly different heights */}
          <ellipse cx="-38" cy="-20" rx="19" ry="24" fill="#000" transform="rotate(9 -38 -20)" />
          <ellipse cx="40" cy="-16" rx="18" ry="26" fill="#000" transform="rotate(-7 40 -16)" />
          {/* black tears */}
          <path d="M-44 2 C-47 34 -41 66 -46 112 L-39 112 C-35 70 -40 36 -34 4 Z" fill="#030303" opacity="0.85" />
          <path d="M44 8 C46 30 42 52 46 74 L51 74 C50 52 51 30 50 8 Z" fill="#030303" opacity="0.8" />
          {/* she is looking at you */}
          <circle cx="-34" cy="-22" r="1.8" fill="#e6e7dc" opacity="0.85" />
          <circle cx="37" cy="-19" r="1.8" fill="#e6e7dc" opacity="0.85" />
          {/* nostrils */}
          <ellipse cx="-7" cy="44" rx="2.6" ry="5" fill="#1a1b17" transform="rotate(-20 -7 44)" />
          <ellipse cx="7" cy="44" rx="2.6" ry="5" fill="#1a1b17" transform="rotate(20 7 44)" />
          {/* mouth, open far wider than a jaw should */}
          <path d="M-21 74 C-31 122 -23 188 0 204 C23 188 31 122 21 74 C11 67 -11 67 -21 74 Z" fill={`url(#${id}-mouth)`} stroke="#23241f" strokeWidth="4" />
          <g fill="#9f9c8b" opacity="0.55">
            <polygon points="-15,74 -12,88 -9,73" />
            <polygon points="-3,71 -1,80 2,71" />
            <polygon points="9,73 12,92 15,75" />
            <polygon points="-8,196 -5,184 -2,198" />
          </g>
          {/* cracks */}
          <g stroke="#23241f" strokeWidth="1.3" fill="none" opacity="0.55">
            <path d="M-64 -74 L-52 -56 L-58 -42 L-46 -30" />
            <path d="M62 34 L72 58 L64 78" />
            <path d="M-18 -116 L-10 -96 L-16 -82" />
          </g>
        </g>
        {/* hair falling across the face — one strand over the left eye */}
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

export const GhostSvg = memo(function GhostSvg({ className, distort }: { className?: string; distort?: boolean }) {
  return (
    <svg className={className} viewBox="-200 -240 400 560" aria-hidden="true" focusable="false">
      <GhostFaceShape distort={distort} />
    </svg>
  );
});
