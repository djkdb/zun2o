import { memo, useId } from 'react';
import { GhostCurtain, GhostHanging, GhostProfile } from './Ghost';
import { art, type ArtSlot } from './photoArt';

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
      {/* motion blur for things that moved during the exposure */}
      <filter id={`${id}-mb`} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4 0.8" />
      </filter>
      {/* only the corners fall off; no bright centre (on a phone that read as a grey oval) */}
      <radialGradient id={`${id}-flash`} cx={`${flashX}%`} cy={`${flashY}%`} r={`${r}%`}>
        <stop offset="0%" stopColor="#000" stopOpacity="0" />
        <stop offset="65%" stopColor="#000" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
      </radialGradient>
    </defs>
  );
}

/** A photographic slot image, if one was provided (see photoArt.ts). */
function ArtImage({ slot, w, h, x = 0, y = 0, style, align = 'xMidYMid' }: { slot: ArtSlot; w: number; h: number; x?: number; y?: number; style?: React.CSSProperties; align?: string }) {
  const url = art(slot);
  if (!url) return null;
  // 채원's daytime photos keep their colour; only the night is drained.
  return <image href={url} x={x} y={y} width={w} height={h} preserveAspectRatio={`${align} slice`} className={slot.startsWith('life-') ? 'art-photo life' : 'art-photo'} style={style} />;
}

function Stamp({ text, x = 16, y = 30 }: { text: string; x?: number; y?: number }) {
  return (
    <text x={x} y={y} fontFamily="IBM Plex Mono, monospace" fontSize="15" fill="#ff5a3c" opacity="0.85">
      {text}
    </text>
  );
}

/**
 * A photograph from an art slot, shown as it is plus 채원's timestamp. (The drawn
 * flash falloff and sensor noise are only for the SVG drawings: on a real photo
 * they read as a grey oval.) Callers check `art(slot)` first.
 */
export function SlotPhoto({
  slot,
  w = 420,
  h = 560,
  stamp,
  label,
  fill = false,
  align,
}: {
  slot: ArtSlot;
  w?: number;
  h?: number;
  stamp?: string;
  label: string;
  /** Crop to fill the container (the lock-screen wallpaper). */
  fill?: boolean;
  align?: string;
}) {
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio={fill ? 'xMidYMid slice' : undefined} role="img" aria-label={label}>
      <rect width={w} height={h} fill="#050505" />
      <ArtImage slot={slot} w={w} h={h} align={align} />
      {stamp && <Stamp text={stamp} />}
    </svg>
  );
}

/** Lock-screen wallpaper: the Annex at night, with the channel's REC overlay. */
export const WallpaperPhoto = memo(function WallpaperPhoto() {
  const id = useSvgId();
  if (art('wallpaper')) return <SlotPhoto slot="wallpaper" w={390} h={844} fill label="밤의 해원고등학교." />;
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
      <text x="24" y="820" fontFamily="IBM Plex Mono, monospace" fontSize="12" fill="#fff" opacity="0.45">
        밤채널 · 해원고 폐교
      </text>
    </svg>
  );
});

export const LobbyPhoto = memo(function LobbyPhoto() {
  const id = useSvgId();
  return (
    <svg viewBox="0 0 640 420" role="img" aria-label="어두운 현관. 벽에 층별 안내판, 바닥에 떨어진 종이들.">
      <Defs id={id} />
      <g filter={`url(#${id}-n)`}>
        <rect width="640" height="420" fill="#2a2a27" />
        <polygon points="0,300 640,300 640,420 0,420" fill="#1b1a17" />
        <rect x="230" y="70" width="180" height="150" fill="#3b3a33" stroke="#1d1c18" strokeWidth="6" />
        {['3층  도서관 · 제2서고', '2층  교무실', '1층  행정실'].map((t, i) => (
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
          <g>
            <ellipse cx="320" cy="80" rx="70" ry="60" fill="#8a8272" opacity="0.35" />
            <ellipse cx="320" cy="56" rx="12" ry="15" fill="#000" />
            <path d="M304 71 L336 71 L346 128 L294 128 Z" fill="#000" />
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
    <svg viewBox="0 0 640 420" role="img" aria-label={door ? '복도 끝, 벽돌로 반쯤 막힌 문. 문패에 제2서고.' : '3층 복도. 끝의 방 하나에서만 노란 불빛이 새어 나온다.'}>
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
            <rect x="294" y="170" width="52" height="16" fill="#cfc9b4" />
            <text x="320" y="182" textAnchor="middle" fontFamily="IBM Plex Sans KR, sans-serif" fontSize="10" fill="#222">
              제2서고
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

// Typed onto the blank card in the photo (the photo has no writing, so the name can change).
const TYPE = { fontFamily: '"Courier New", IBM Plex Mono, IBM Plex Sans KR, monospace', fill: '#2b2622', opacity: 0.82 } as const;

export const IndexCardPhoto = memo(function IndexCardPhoto({ lines }: { lines: string[] }) {
  const id = useSvgId();
  if (art('index-card'))
    return (
      <svg viewBox="0 0 420 560" role="img" aria-label={`서랍 안의 출입 카드 한 장. ${lines[0]}`}>
        <rect width="420" height="560" fill="#050505" />
        <ArtImage slot="index-card" w={420} h={560} />
        <g transform="rotate(-0.6 216 260)">
          <text x="100" y="215" fontSize="8.5" {...TYPE}>
            야간 출입 기록 — 방문자 카드
          </text>
          {lines.map((l, i) => (
            <text key={i} x="100" y={244.5 + i * 12.8} fontSize="9" {...TYPE}>
              {l}
            </text>
          ))}
        </g>
        <Stamp text="01:56" />
      </svg>
    );
  return (
    <svg viewBox="0 0 640 420" role="img" aria-label="서랍 안의 출입 카드 한 장. 채원의 이름이 타자로 쳐져 있다.">
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
            야간 출입 기록 — 방문자 카드
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
      {/* phone light from below: bright chin, eyes and forehead lost in shadow */}
      <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#040303" />
        <stop offset="46%" stopColor="#0e0a09" />
        <stop offset="64%" stopColor="#3d2f28" />
        <stop offset="84%" stopColor="#9a7e6d" />
        <stop offset="100%" stopColor="#dcc0aa" />
      </linearGradient>
      <linearGradient id={`${id}-neck`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#6e5a4e" />
        <stop offset="100%" stopColor="#120e0c" />
      </linearGradient>
    </defs>
  );
}

/** 채원, drawn in the 420×560 selfie frame. */
function ChaewonFigure({ id }: { id: string }) {
  // Lit only from below by her phone: a silhouette with a rim of light.
  // No drawn eyes or mouth — the dark does the work.
  return (
    <g filter={`url(#${id}-blur)`}>
      <path d="M104 560 C116 468 150 428 210 418 C270 428 304 468 316 560 Z" fill="#141317" />
      <path d="M118 262 C104 172 158 118 212 120 C270 122 318 172 304 268 C302 318 296 352 290 392 L134 392 C126 350 120 306 118 262 Z" fill="#070606" />
      <ellipse cx="210" cy="278" rx="64" ry="86" fill={`url(#${id}-skin)`} />
      <path d="M140 252 C150 176 270 166 282 252 C266 220 242 206 212 206 C182 206 156 220 140 252 Z" fill="#070606" />
      <path d="M146 262 C140 300 150 330 170 350" stroke="#070606" strokeWidth="18" fill="none" strokeLinecap="round" />
      {/* only the wet glint of her eyes catches the light */}
      <circle cx="188" cy="264" r="1.8" fill="#e8e2d8" opacity="0.8" />
      <circle cx="238" cy="264" r="1.8" fill="#e8e2d8" opacity="0.8" />
      <ellipse cx="210" cy="334" rx="7" ry="5" fill="#1a110e" opacity="0.85" />
      <rect x="178" y="356" width="64" height="70" fill={`url(#${id}-neck)`} />
    </g>
  );
}

/** 채원's selfie in the index room. `stage` 0: just her; 1: something behind her; 2: right behind her shoulder. */
export const SelfiePhoto = memo(function SelfiePhoto({ stage }: { stage: 0 | 1 | 2 }) {
  const slot = stage === 0 ? 'selfie-alone' : stage === 1 ? 'selfie-far' : 'selfie-close';
  const photo = !!art(slot);
  const id = useSvgId();
  return (
    <svg viewBox="0 0 420 560" role="img" aria-label="겁에 질린 젊은 여성의 셀카. 손전등 불빛. 뒤쪽 어둠 속에 무언가가 있다.">
      <Defs id={id} flashX={50} flashY={62} />
      <ChaewonDefs id={id} blur={stage === 2 ? '3 0.8' : '2 0.6'} />
      <g filter={photo ? undefined : `url(#${id}-n)`}>
        <rect width="420" height="560" fill="#0b0a09" />
        {Array.from({ length: 7 }).map((_, r) =>
          Array.from({ length: 6 }).map((__, c) => <rect key={`${r}${c}`} x={10 + c * 70} y={10 + r * 46} width="62" height="38" fill="#1c1813" />),
        )}
        {/* her behind 채원 */}
        {photo ? (
          <ArtImage slot={slot} w={420} h={560} align={stage === 2 ? 'xMaxYMid' : undefined} />
        ) : (
          <>
        {/* stage 1: far back, between the shelves. stage 2: her cheek against 채원's hair */}
        {stage === 1 && (
          <g filter={`url(#${id}-mb)`} opacity="0.5">
            <g transform="translate(330 180) scale(0.3)">
              <GhostCurtain distort={false} />
            </g>
          </g>
        )}
        {stage === 2 && (
          <g filter={`url(#${id}-mb)`} opacity="0.92">
            <g transform="translate(362 236) scale(0.72)">
              <GhostProfile distort={false} />
            </g>
          </g>
        )}
        <ChaewonFigure id={id} />
          </>
        )}
        {!photo && <rect width="420" height="560" fill={`url(#${id}-flash)`} />}
      </g>
      <Stamp text="01:58" />
    </svg>
  );
});

/** The dark photo turns — and the scare is armed — only at full brightness. */
export const REVEAL_AT = 0.97;

/**
 * The last photo, 01:59. Almost black. The gallery editor's brightness
 * slider (0..1) slowly reveals who took it.
 */
/**
 * `revealed`: she only appears in the photo *after* the scare. Brightened all
 * the way, the room is empty — then she's in your face — then she was in the
 * photo all along.
 */
export const BlackPhoto = memo(function BlackPhoto({ brightness = 0, revealed = false }: { brightness?: number; revealed?: boolean }) {
  const b = Math.max(0, Math.min(1, brightness));
  return (
    <svg viewBox="0 0 420 560" role="img" aria-label="거의 완전히 검은 사진.">
      <rect width="420" height="560" fill="#030303" />
      <g opacity={Math.min(1, Math.max(0, (b - 0.2) * 1.4))} style={{ filter: `brightness(${0.25 + b * 0.75}) contrast(${1.6 - b * 0.6})` }}>
        {art('black-empty') ? (
          <ArtImage slot="black-empty" w={420} h={560} />
        ) : (
          <>
            <rect width="420" height="560" fill="#15130f" />
            {Array.from({ length: 8 }).map((_, r) =>
              Array.from({ length: 6 }).map((__, c) => <rect key={`${r}${c}`} x={10 + c * 70} y={10 + r * 46} width="62" height="38" fill="#2a241c" />),
            )}
            {/* an empty chair, a desk… nothing else. Until there is. */}
            <rect x="150" y="400" width="120" height="14" fill="#1d1812" />
            <rect x="186" y="330" width="48" height="70" rx="4" fill="#120f0b" />
          </>
        )}
      </g>
      {/* she was on the ceiling, right above the lens — outside the brightness boost, so she stays grey */}
      {b >= REVEAL_AT && revealed &&
        (art('black-reveal') ? (
          <ArtImage slot="black-reveal" w={420} h={560} />
        ) : (
          <g transform="translate(222 150) scale(0.85)" style={{ filter: 'brightness(0.8) contrast(1.15)' }}>
            <GhostHanging distort={false} />
          </g>
        ))}
      <text x="14" y="30" fontFamily="IBM Plex Mono, monospace" fontSize="15" fill="#ff5a3c" opacity={0.25 + b * 0.5}>
        01:59
      </text>
    </svg>
  );
});

/** Taken from the Annex's 3rd-floor window: the phone booth — and you. */
/**
 * The phone booth — and you in it. Default: taken from the Annex's 3rd-floor
 * window. `behind`: 도현's photo from the street, someone standing behind you.
 * `fill`: cropped to fill a portrait screen (the lock-screen wallpaper).
 */
export const BoothPhoto = memo(function BoothPhoto({ behind = false, fill = false, reflection = false }: { behind?: boolean; fill?: boolean; reflection?: boolean }) {
  const slot = behind ? 'booth-behind' : 'booth';
  const photo = !!art(slot);
  const id = useSvgId();
  return (
    <svg
      viewBox="0 0 640 420"
      preserveAspectRatio={fill ? 'xMidYMid slice' : undefined}
      role="img"
      aria-label={behind ? '길 건너에서 찍은 공중전화 부스. 휴대폰을 든 사람 바로 뒤에 누군가 서 있다.' : '높은 창문에서 내려다본 밤거리. 불 켜진 공중전화 부스 안에 휴대폰을 든 사람이 서 있다.'}
    >
      <Defs id={id} flashX={52} flashY={70} r={70} />
      <g filter={photo ? undefined : `url(#${id}-n)`}>
        <rect width="640" height="420" fill="#08090b" />
        <polygon points="0,420 640,420 520,150 120,150" fill="#101114" />
        <line x1="120" y1="150" x2="0" y2="420" stroke="#1a1b1f" strokeWidth="3" />
        <line x1="520" y1="150" x2="640" y2="420" stroke="#1a1b1f" strokeWidth="3" />
        {photo && <ArtImage slot={slot} w={640} h={420} />}
        {!photo && (
          <>
        {/* the booth, lit from inside */}
        <ellipse cx="330" cy="300" rx="110" ry="90" fill="#dfe6d0" opacity="0.07" />
        <rect x="284" y="214" width="92" height="146" fill="#cfd6c4" opacity="0.2" />
        <rect x="284" y="214" width="92" height="146" fill="none" stroke="#7f8a78" strokeWidth="4" />
        <rect x="284" y="206" width="92" height="10" fill="#4d5549" />
        <line x1="330" y1="214" x2="330" y2="360" stroke="#7f8a78" strokeWidth="2" opacity="0.6" />
        {/* you: head bowed over a phone, the screen lighting your chin */}
        <ellipse cx="322" cy="258" rx="11" ry="13" fill="#0a0a0a" />
        <path d="M322 262 C328 262 332 268 331 272 C326 274 320 272 318 268 Z" fill="#b9c7dc" opacity="0.55" />
        <path d="M306 274 L338 274 L344 350 L302 350 Z" fill="#0a0a0a" />
        <path d="M312 282 C318 290 324 292 330 286" stroke="#0a0a0a" strokeWidth="7" fill="none" />
        <rect x="327" y="276" width="7" height="11" rx="1" fill="#e8f0ff" />
        <circle cx="330" cy="281" r="16" fill="#cfe0ff" opacity="0.22" />
        {behind && (
          <g>
            {/* right behind you, taller than you, head tilted: hair where a face should be */}
            <path d="M356 236 C348 236 344 246 346 258 C348 272 356 280 364 280 C372 280 378 270 376 256 C374 244 366 236 356 236 Z" fill="#050505" transform="rotate(-18 360 258)" />
            <path d="M358 256 C362 256 364 264 362 272 C360 276 356 276 356 270 Z" fill="#c9c3b4" opacity="0.6" />
            <circle cx="360" cy="262" r="1.3" fill="#fff" opacity="0.9" />
            <path d="M348 280 L376 280 L382 352 L342 352 Z" fill="#050505" />
            <path d="M350 282 C344 300 338 316 334 330" stroke="#050505" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M340 326 L332 334 M338 330 L334 340" stroke="#c9c3b4" strokeWidth="2" opacity="0.5" />
          </g>
        )}
          </>
        )}
        {/* stared at long enough: in the window glass, whoever is holding the camera */}
        {reflection && !behind && (art('booth-reflect') ? (
          <ArtImage slot="booth-reflect" w={640} h={420} />
        ) : (
          <g transform="translate(118 118) scale(0.16)" opacity="0.2">
            <GhostCurtain distort={false} />
          </g>
        ))}
        {/* the 3rd-floor window frame (not in 도현's street photo) */}
        {!behind && (
          <>
            <rect x="0" y="0" width="640" height="26" fill="#030303" />
            <rect x="0" y="0" width="30" height="420" fill="#030303" />
            <rect x="610" y="0" width="30" height="420" fill="#030303" />
            <rect x="206" y="0" width="16" height="420" fill="#030303" opacity="0.9" />
          </>
        )}
        {!photo && <rect width="640" height="420" fill={`url(#${id}-flash)`} />}
      </g>
      {!fill && <Stamp text={behind ? '01:53' : '01:39'} x={40} y={52} />}
    </svg>
  );
});

/** 00:58, 채원's photo: a phone left on the booth's shelf. The same phone. The same shelf. */
export const BoothShelfPhoto = memo(function BoothShelfPhoto() {
  const photo = !!art('booth-shelf');
  const id = useSvgId();
  return (
    <svg viewBox="0 0 640 420" role="img" aria-label="공중전화 부스 안. 금속 선반 위에 화면이 켜진 휴대폰 한 대가 놓여 있다.">
      <Defs id={id} flashX={48} flashY={58} r={62} />
      <g filter={photo ? undefined : `url(#${id}-n)`}>
        <rect width="640" height="420" fill="#0b0c0e" />
        {/* booth glass and frame */}
        <rect x="40" y="0" width="560" height="420" fill="#14161a" />
        {photo ? (
          <ArtImage slot="booth-shelf" w={640} h={420} />
        ) : (
          <>
        <rect x="40" y="0" width="14" height="420" fill="#2c3036" />
        <rect x="586" y="0" width="14" height="420" fill="#2c3036" />
        {/* the payphone, receiver hanging off the hook */}
        <rect x="380" y="40" width="130" height="190" rx="8" fill="#6d7178" />
        <rect x="398" y="62" width="94" height="40" fill="#1a1c20" />
        {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={410 + c * 26} y={118 + r * 24} width="18" height="16" rx="3" fill="#aeb2b8" />))}
        <path d="M512 120 C560 150 548 260 520 320" stroke="#15171a" strokeWidth="6" fill="none" />
        <rect x="500" y="318" width="40" height="18" rx="6" fill="#23262b" transform="rotate(20 520 327)" />
        {/* the shelf */}
        <polygon points="60,300 600,300 640,350 20,350" fill="#8c9096" />
        <rect x="20" y="350" width="620" height="12" fill="#55595f" />
        {/* the phone, screen on */}
        <g transform="rotate(-8 230 310)">
          <rect x="170" y="286" width="120" height="30" rx="6" fill="#050506" />
          <rect x="176" y="289" width="108" height="24" rx="4" fill="#dfe8ff" opacity="0.9" />
          <text x="230" y="306" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" fill="#222">
            12%
          </text>
        </g>
        <ellipse cx="230" cy="300" rx="120" ry="40" fill="#cfe0ff" opacity="0.12" />
        {/* stickers and scratches on the glass */}
        <rect x="90" y="60" width="80" height="54" fill="#2a2d33" opacity="0.8" />
        <text x="130" y="92" textAnchor="middle" fontFamily="IBM Plex Sans KR, sans-serif" fontSize="12" fill="#8a8f96">
          분실물 신고
        </text>
        <path d="M100 200 L180 170 M120 230 L210 190" stroke="#3a3e45" strokeWidth="1.5" opacity="0.6" />
          </>
        )}
        {!photo && <rect width="640" height="420" fill={`url(#${id}-flash)`} />}
      </g>
      <Stamp text="00:58" />
    </svg>
  );
});

/**
 * Video call at 02:00: 채원's face lit by her phone. `close` 0..1 — past
 * 0.35 something rises behind her shoulder and keeps coming.
 */
/** `clip`: a real video plays underneath — draw only the overlay (your camera, top right). */
export const VideoFeed = memo(function VideoFeed({ close = 0, pip = 0, clip = false }: { close?: number; pip?: number; clip?: boolean }) {
  const id = useSvgId();
  const her = Math.max(0, (close - 0.35) / 0.65);
  const photo = !!art('video-chaewon');
  return (
    <svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <Defs id={id} flashX={50} flashY={62} />
      <ChaewonDefs id={id} blur={`${1 + her * 1.5} 0.5`} />
      {!clip && (
        <g filter={photo ? undefined : `url(#${id}-n)`}>
          <rect width="390" height="844" fill="#060504" />
          {Array.from({ length: 14 }).map((_, r) =>
            Array.from({ length: 6 }).map((__, c) => <rect key={`${r}${c}`} x={6 + c * 64} y={20 + r * 58} width="56" height="48" fill="#141009" />),
          )}
          {her > 0 && (
            <g transform={`translate(${300 - her * 60} ${300 + her * 30}) scale(${0.3 + her * 0.55})`} opacity={Math.min(1, her * 1.6)}>
              <GhostCurtain distort={false} />
            </g>
          )}
          <g transform="translate(-40 200) scale(1.12)">
            <ChaewonFigure id={id} />
          </g>
          <ArtImage slot="video-chaewon" w={390} h={844} align="xMaxYMid" />
          {/* she comes in over the right shoulder: keep that side of the frame */}
          {her > 0 && <ArtImage slot="video-behind" w={390} h={844} align="xMaxYMid" style={{ opacity: Math.min(1, her * 1.4) }} />}
          {/* a real photo has its own light; the drawn flash falloff would ring it in an oval */}
          {!photo && <rect width="390" height="844" fill={`url(#${id}-flash)`} />}
        </g>
      )}
      {pip === 0 ? (
        <>
          <rect x="272" y="96" width="96" height="140" rx="10" fill="#111" stroke="#333" />
          <text x="320" y="170" textAnchor="middle" fontFamily="IBM Plex Sans KR, sans-serif" fontSize="11" fill="#666">
            카메라 꺼짐
          </text>
        </>
      ) : (
        <g>
          {/* "your" side — a drawn silhouette, not a camera */}
          <rect x="272" y="96" width="96" height="140" rx="10" fill="#0d0e10" stroke="#555" />
          <ellipse cx="320" cy="210" rx="30" ry="34" fill="#050505" />
          <path d="M280 236 C290 214 350 214 360 236 Z" fill="#050505" />
          {/* above your shoulder, leaning in from the top of the frame */}
          <clipPath id={`${id}-pip`}>
            <rect x="272" y="96" width="96" height="140" rx="10" />
          </clipPath>
          <g clipPath={`url(#${id}-pip)`}>
            {art('pip-self') ? (
              <g opacity={0.6 + pip * 0.4}>
                <ArtImage slot="pip-self" x={272} y={96} w={96} h={140} align="xMaxYMid" />
              </g>
            ) : (
              <g transform={`translate(${346 - pip * 8} ${80 + pip * 26}) scale(${0.18 + pip * 0.06})`} opacity={0.5 + pip * 0.5}>
                <GhostCurtain distort={false} />
              </g>
            )}
          </g>
          <text x="320" y="110" textAnchor="middle" fontFamily="IBM Plex Sans KR, sans-serif" fontSize="9" fill="#9a9">
            카메라 켜짐
          </text>
        </g>
      )}
    </svg>
  );
});

/** The floor plan on the corridor wall: a photo with empty label boxes, labelled here. */
const PLAN_LABELS: [string, number, number, boolean?][] = [
  ['자료실', 94, 223],
  ['제2서고', 173, 214, true],
  ['열람실', 233, 208],
  ['사서실', 294, 202],
  ['제1서고', 184, 350],
];

export function FloorPlanPhoto({ stamp }: { stamp?: string }) {
  return (
    <svg viewBox="0 0 420 560" role="img" aria-label="벽에 붙은 도서관 3층 평면도. 복도 위쪽 가운데 방 하나에 빨간 빗금이 쳐져 있고, 제2서고라고 적혀 있다.">
      <rect width="420" height="560" fill="#050505" />
      <ArtImage slot="floorplan" w={420} h={560} />
      {PLAN_LABELS.map(([t, x, y, red]) => (
        <text key={t} x={x} y={y} transform={`rotate(-5.5 ${x} ${y})`} textAnchor="middle" fontSize="6.8" fontFamily="IBM Plex Sans KR, sans-serif" fontWeight={red ? 700 : 500} fill={red ? '#b3261e' : '#3b3b3b'} opacity="0.85">
          {t}
        </text>
      ))}
      <text x="294" y="269" transform="rotate(-5.5 294 269)" textAnchor="middle" fontSize="6" fontFamily="IBM Plex Sans KR, sans-serif" fill="#b3261e" opacity="0.85">
        현위치
      </text>
      <text x="210" y="160" transform="rotate(-5.5 210 160)" textAnchor="middle" fontSize="9" fontFamily="IBM Plex Sans KR, sans-serif" fontWeight={700} fill="#333" opacity="0.8">
        도서관 3층 피난 안내도
      </text>
      {stamp && <Stamp text={stamp} />}
    </svg>
  );
}
