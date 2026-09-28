import { memo, useId } from 'react';
import { GhostFaceShape } from './Ghost';

// Photos taken on 채원's phone inside the Annex. Phone-camera look: flash
// falloff, noise, crushed blacks. All SVG — no third-party imagery.

function useSvgId(): string {
  return useId().replace(/[^a-zA-Z0-9_-]/g, '');
}

function Defs({ id, flashX = 50, flashY = 50, r = 60 }: { id: string; flashX?: number; flashY?: number; r?: number }) {
  return (
    <defs>
      <filter id={`${id}-n`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="noise" />
        <feColorMatrix type="saturate" values="0" in="noise" result="mono" />
        <feBlend in="SourceGraphic" in2="mono" mode="multiply" result="b" />
        <feComposite in="b" in2="SourceGraphic" operator="in" />
      </filter>
      <radialGradient id={`${id}-flash`} cx={`${flashX}%`} cy={`${flashY}%`} r={`${r}%`}>
        <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
        <stop offset="45%" stopColor="#fff" stopOpacity="0.06" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.85" />
      </radialGradient>
    </defs>
  );
}

function Stamp({ text, x = 16, y = 30 }: { text: string; x?: number; y?: number }) {
  return (
    <text x={x} y={y} fontFamily="IBM Plex Mono, monospace" fontSize="15" fill="#ff5a3c" opacity="0.85">
      {text}
    </text>
  );
}

/** Lock-screen wallpaper: the Annex at night, with the channel's REC overlay. */
export const WallpaperPhoto = memo(function WallpaperPhoto() {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <Defs id={id} flashX={50} flashY={52} r={95} />
      <g filter={`url(#${id}-n)`}>
        <rect width="390" height="844" fill="#07080a" />
        <rect x="40" y="300" width="310" height="330" fill="#23252a" />
        <rect x="34" y="290" width="322" height="14" fill="#1a1c20" />
        {[0, 1, 2].map((r) =>
          [0, 1, 2, 3].map((c) => (
            <rect key={`${r}${c}`} x={62 + c * 72} y={322 + r * 92} width="44" height="58" fill={r === 0 && c === 1 ? '#6a5a36' : '#0c0d0f'} />
          )),
        )}
        <rect x="165" y="560" width="60" height="70" fill="#050506" />
        <rect y="630" width="390" height="214" fill="#0b0c0d" />
        {Array.from({ length: 20 }).map((_, i) => (
          <rect key={i} x={i * 20} y="636" width="3" height="46" fill="#040405" />
        ))}
        <rect width="390" height="844" fill={`url(#${id}-flash)`} />
      </g>
      <circle cx="30" cy="704" r="7" fill="#ff3b30" />
      <text x="44" y="710" fontFamily="IBM Plex Mono, monospace" fontSize="17" fill="#fff" opacity="0.9">
        REC 01:13
      </text>
      <text x="24" y="820" fontFamily="IBM Plex Mono, monospace" fontSize="12" fill="#fff" opacity="0.45">
        밤채널 · 해원군청 별관
      </text>
    </svg>
  );
});

export const LobbyPhoto = memo(function LobbyPhoto() {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 640 420" role="img" aria-label="어두운 로비. 벽에 층별 안내판, 바닥에 떨어진 서류들.">
      <Defs id={id} />
      <g filter={`url(#${id}-n)`}>
        <rect width="640" height="420" fill="#2a2a27" />
        <polygon points="0,300 640,300 640,420 0,420" fill="#1b1a17" />
        <rect x="230" y="70" width="180" height="150" fill="#3b3a33" stroke="#1d1c18" strokeWidth="6" />
        {['3층  열람실 · 색인실', '2층  토지대장', '1층  민원실'].map((t, i) => (
          <text key={t} x="248" y={112 + i * 36} fontFamily="IBM Plex Sans KR, sans-serif" fontSize="17" fill="#bcb8a8">
            {t}
          </text>
        ))}
        <rect x="40" y="120" width="120" height="180" fill="#121210" />
        <rect x="480" y="120" width="120" height="180" fill="#121210" />
        {[
          [120, 340, 12],
          [300, 360, -8],
          [430, 330, 20],
          [520, 380, -4],
        ].map(([x, y, r]) => (
          <rect key={`${x}`} x={x} y={y} width="60" height="42" fill="#bdb8a6" opacity="0.7" transform={`rotate(${r} ${x} ${y})`} />
        ))}
        <rect width="640" height="420" fill={`url(#${id}-flash)`} />
      </g>
      <Stamp text="01:14" />
    </svg>
  );
});

export const StairsPhoto = memo(function StairsPhoto({ figure = false }: { figure?: boolean }) {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 640 420" role="img" aria-label="위층으로 올라가는 좁은 계단. 위쪽은 완전히 어둡다.">
      <Defs id={id} flashY={80} />
      <g filter={`url(#${id}-n)`}>
        <rect width="640" height="420" fill="#1a1a18" />
        {Array.from({ length: 9 }).map((_, i) => (
          <g key={i}>
            <polygon points={`${150 + i * 18},${420 - i * 38} ${490 - i * 18},${420 - i * 38} ${484 - i * 18},${404 - i * 38} ${156 + i * 18},${404 - i * 38}`} fill={`hsl(40 6% ${34 - i * 3}%)`} />
            <polygon points={`${156 + i * 18},${404 - i * 38} ${484 - i * 18},${404 - i * 38} ${484 - i * 18},${382 - i * 38} ${156 + i * 18},${382 - i * 38}`} fill={`hsl(40 6% ${24 - i * 2}%)`} />
          </g>
        ))}
        <rect x="120" y="0" width="16" height="420" fill="#0f0f0e" />
        <rect x="504" y="0" width="16" height="420" fill="#0f0f0e" />
        {figure && (
          <g opacity="0.55">
            <ellipse cx="320" cy="58" rx="11" ry="14" fill="#050505" />
            <path d="M305 72 L335 72 L342 118 L298 118 Z" fill="#050505" />
          </g>
        )}
        <rect width="640" height="420" fill={`url(#${id}-flash)`} />
      </g>
      <Stamp text="01:25" />
    </svg>
  );
});

export const CorridorPhoto = memo(function CorridorPhoto({ door = false }: { door?: boolean }) {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 640 420" role="img" aria-label={door ? '복도 끝, 벽돌로 반쯤 막힌 문. 문패에 02호실.' : '3층 복도. 끝의 방 하나에서만 노란 불빛이 새어 나온다.'}>
      <Defs id={id} />
      <g filter={`url(#${id}-n)`}>
        <rect width="640" height="420" fill="#161614" />
        <polygon points="0,0 640,0 400,150 240,150" fill="#1f1f1c" />
        <polygon points="0,420 640,420 400,270 240,270" fill="#22211d" />
        <polygon points="0,0 240,150 240,270 0,420" fill="#1b1b18" />
        <polygon points="640,0 400,150 400,270 640,420" fill="#1b1b18" />
        {[60, 140].map((x) => (
          <polygon key={x} points={`${x},${x * 0.62} ${x + 44},${(x + 44) * 0.62} ${x + 44},${420 - (x + 44) * 0.62} ${x},${420 - x * 0.62}`} fill="#0c0c0b" />
        ))}
        {door ? (
          <g>
            <rect x="282" y="162" width="76" height="108" fill="#0a0a09" />
            {Array.from({ length: 6 }).map((_, r) =>
              Array.from({ length: 3 }).map((__, c) => (
                <rect key={`${r}${c}`} x={284 + c * 25 + (r % 2) * 10} y={200 + r * 12} width="22" height="10" fill="#5a3e30" opacity="0.85" />
              )),
            )}
            <rect x="300" y="170" width="40" height="16" fill="#cfc9b4" />
            <text x="320" y="182" textAnchor="middle" fontFamily="IBM Plex Sans KR, sans-serif" fontSize="10" fill="#222">
              02호실
            </text>
          </g>
        ) : (
          <g>
            <rect x="296" y="168" width="48" height="96" fill="#d8b45a" opacity="0.85" />
            <polygon points="296,264 344,264 420,420 220,420" fill="#d8b45a" opacity="0.12" />
          </g>
        )}
        <rect width="640" height="420" fill={`url(#${id}-flash)`} />
      </g>
      <Stamp text={door ? '01:53' : '01:32'} />
    </svg>
  );
});

export const IndexCardPhoto = memo(function IndexCardPhoto({ lines }: { lines: string[] }) {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 640 420" role="img" aria-label="서랍 안의 색인 카드 한 장. 채원의 이름이 타자로 쳐져 있다.">
      <Defs id={id} />
      <g filter={`url(#${id}-n)`}>
        <rect width="640" height="420" fill="#2a2119" />
        <g transform="translate(320 214) rotate(-3)">
          <rect x="-220" y="-130" width="440" height="260" fill="#e7dfc8" />
          <line x1="-220" y1="-86" x2="220" y2="-86" stroke="#c05050" strokeWidth="2" />
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={i} x1="-220" y1={-50 + i * 32} x2="220" y2={-50 + i * 32} stroke="#9fb6cf" strokeWidth="1" />
          ))}
          <text x="-200" y="-100" fontFamily="IBM Plex Mono, IBM Plex Sans KR, monospace" fontSize="17" fill="#1a1a1a">
            야간 색인 — 방문자 카드
          </text>
          {lines.map((l, i) => (
            <text key={i} x="-200" y={-58 + i * 32} fontFamily="IBM Plex Mono, IBM Plex Sans KR, monospace" fontSize="18" fill="#1a1a1a">
              {l}
            </text>
          ))}
        </g>
        <rect width="640" height="420" fill={`url(#${id}-flash)`} />
      </g>
      <Stamp text="01:56" />
    </svg>
  );
});

function ChaewonDefs({ id, blur }: { id: string; blur: string }) {
  return (
    <defs>
      <filter id={`${id}-blur`} x="-10%" y="-10%" width="120%" height="120%">
        <feGaussianBlur stdDeviation={blur} />
      </filter>
      <radialGradient id={`${id}-skin`} cx="50%" cy="80%" r="75%">
        <stop offset="0%" stopColor="#d9bda8" />
        <stop offset="55%" stopColor="#9a7c6a" />
        <stop offset="100%" stopColor="#2a1f1a" />
      </radialGradient>
    </defs>
  );
}

/** 채원, drawn in the 420×560 selfie frame. */
function ChaewonFigure({ id }: { id: string }) {
  return (
    <>
      {/* 채원 — lit from below by her own flashlight, motion-blurred, terrified */}
        <g filter={`url(#${id}-blur)`}>
          <path d="M104 560 C116 468 150 428 210 418 C270 428 304 468 316 560 Z" fill="#1d1c22" />
          <path d="M118 262 C104 172 158 118 212 120 C270 122 318 172 304 268 C302 318 296 352 290 392 L134 392 C126 350 120 306 118 262 Z" fill="#0c0a0b" />
          <ellipse cx="210" cy="276" rx="66" ry="88" fill={`url(#${id}-skin)`} />
          <path d="M140 250 C150 176 270 166 282 250 C268 214 244 200 212 200 C182 200 154 214 140 250 Z" fill="#0c0a0b" />
          {/* raised, pinched brows — fear */}
          <path d="M168 240 Q182 228 198 236" stroke="#2a1d17" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M222 236 Q238 228 252 240" stroke="#2a1d17" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* wide eyes, looking past the camera */}
          <ellipse cx="184" cy="262" rx="11" ry="9" fill="#e9e0d6" />
          <ellipse cx="236" cy="262" rx="11" ry="9" fill="#e9e0d6" />
          <circle cx="190" cy="262" r="5" fill="#140e0b" />
          <circle cx="242" cy="262" r="5" fill="#140e0b" />
          {/* mouth open, breath caught */}
          <ellipse cx="210" cy="326" rx="10" ry="13" fill="#2a1210" />
          <path d="M152 300 C160 350 190 362 210 362 C230 362 260 350 268 300" stroke="#000" strokeOpacity="0.25" strokeWidth="10" fill="none" />
          <rect x="176" y="358" width="68" height="70" fill="#8d7263" />
        </g>
    </>
  );
}

/** 채원's selfie in the index room. `stage` 1: something behind her; 2: right behind her shoulder. */
export const SelfiePhoto = memo(function SelfiePhoto({ stage }: { stage: 1 | 2 }) {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 420 560" role="img" aria-label="겁에 질린 젊은 여성의 셀카. 손전등 불빛. 뒤쪽 어둠 속에 무언가가 있다.">
      <Defs id={id} flashX={50} flashY={62} />
      <ChaewonDefs id={id} blur={stage === 2 ? '2.2 0.6' : '1.2 0.4'} />
      <g filter={`url(#${id}-n)`}>
        <rect width="420" height="560" fill="#0b0a09" />
        {Array.from({ length: 7 }).map((_, r) =>
          Array.from({ length: 6 }).map((__, c) => <rect key={`${r}${c}`} x={10 + c * 70} y={10 + r * 46} width="62" height="38" fill="#1c1813" />),
        )}
        {/* her behind 채원 */}
        {stage === 1 && (
          <g transform="translate(318 170) scale(0.28)" opacity="0.55">
            <GhostFaceShape distort={false} />
          </g>
        )}
        {stage === 2 && (
          <g transform="translate(300 232) scale(0.62)" opacity="0.95">
            <GhostFaceShape distort={false} />
          </g>
        )}
        <ChaewonFigure id={id} />
        <rect width="420" height="560" fill={`url(#${id}-flash)`} />
      </g>
      <Stamp text="01:58" />
    </svg>
  );
});

/**
 * The last photo, 01:59. Almost black. The gallery editor's brightness
 * slider (0..1) slowly reveals who took it.
 */
export const BlackPhoto = memo(function BlackPhoto({ brightness = 0 }: { brightness?: number }) {
  const b = Math.max(0, Math.min(1, brightness));
  return (
    <svg viewBox="0 0 420 560" role="img" aria-label="거의 완전히 검은 사진.">
      <rect width="420" height="560" fill="#030303" />
      <g opacity={Math.max(0, (b - 0.35) * 1.55)} style={{ filter: `brightness(${0.3 + b * 1.3}) contrast(${1 + b})` }}>
        <rect width="420" height="560" fill="#15130f" />
        {Array.from({ length: 8 }).map((_, r) =>
          Array.from({ length: 6 }).map((__, c) => <rect key={`${r}${c}`} x={10 + c * 70} y={10 + r * 46} width="62" height="38" fill="#2a241c" />),
        )}
        <g transform={`translate(210 ${320 - b * 40}) scale(${0.45 + b * 0.75})`}>
          <GhostFaceShape distort={false} />
        </g>
      </g>
      <text x="14" y="30" fontFamily="IBM Plex Mono, monospace" fontSize="15" fill="#ff5a3c" opacity={0.25 + b * 0.5}>
        01:59
      </text>
    </svg>
  );
});

/**
 * Video call at 02:00: 채원's face lit by her phone. `close` 0..1 — past
 * 0.35 something rises behind her shoulder and keeps coming.
 */
export const VideoFeed = memo(function VideoFeed({ close = 0 }: { close?: number }) {
  const id = useSvgId();
  const her = Math.max(0, (close - 0.35) / 0.65);
  return (
    <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <Defs id={id} flashX={50} flashY={62} />
      <ChaewonDefs id={id} blur={`${1 + her * 1.5} 0.5`} />
      <g filter={`url(#${id}-n)`}>
        <rect width="390" height="844" fill="#060504" />
        {Array.from({ length: 14 }).map((_, r) =>
          Array.from({ length: 6 }).map((__, c) => <rect key={`${r}${c}`} x={6 + c * 64} y={20 + r * 58} width="56" height="48" fill="#141009" />),
        )}
        {her > 0 && (
          <g transform={`translate(${300 - her * 60} ${300 + her * 30}) scale(${0.3 + her * 0.55})`} opacity={Math.min(1, her * 1.6)}>
            <GhostFaceShape distort={false} />
          </g>
        )}
        <g transform="translate(-40 200) scale(1.12)">
          <ChaewonFigure id={id} />
        </g>
        <rect width="390" height="844" fill={`url(#${id}-flash)`} />
      </g>
      <rect x="272" y="96" width="96" height="140" rx="10" fill="#111" stroke="#333" />
      <text x="320" y="170" textAnchor="middle" fontFamily="IBM Plex Sans KR, sans-serif" fontSize="11" fill="#666">
        카메라 꺼짐
      </text>
    </svg>
  );
});
