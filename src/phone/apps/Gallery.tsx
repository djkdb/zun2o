import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { applyChapterMix, emit, markPhoto, mix, openApp, sfx, vibrate } from '../../engine/director';
import { addFlag, getState, hasFlag, logInput, setRt } from '../../engine/state';
import { HIDDEN_ALBUM_CODE, PHOTOS, type PhotoItem } from '../../content/media';
import { VIDEO } from '../../art/videos';
import { AppHeader } from '../AppHeader';
import { AnnexPhoto, FloorPlan, ReadingRoomPhoto, Room02Photo } from '../../art/scenes';
import { art } from '../../art/photoArt';
import { BlackPhoto, BoothPhoto, BoothShelfPhoto, REVEAL_AT, SlotPhoto, CorridorPhoto, IndexCardPhoto, LobbyPhoto, SelfiePhoto, StairsPhoto } from '../../art/phonePhotos';

/** Photos that change if you stare at them zoomed in. */
const DWELL_PHOTOS = ['p03', 'p05', 'p08'];

/** The recovered clip, as a still: thumbnail and chat card. */
function VideoStill() {
  return (
    <span className="video-still">
      <img src={VIDEO.recoveredPoster} alt="복구된 동영상. 어두운 계단." draggable={false} />
      <span className="video-still-play" aria-hidden="true">
        ▶
      </span>
      <span className="video-still-len">0:10</span>
    </span>
  );
}

/** Plays the recovered clip in the viewer. Sound only if the game's sound is on. */
function RecoveredVideo() {
  const sound = useGame((s) => s.save.sound);
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const play = () => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = 0;
    v.muted = !sound;
    setEnded(false);
    void v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };
  return (
    <div className="recovered">
      <video
        ref={ref}
        poster={VIDEO.recoveredPoster}
        playsInline
        preload="auto"
        onEnded={() => {
          setPlaying(false);
          setEnded(true);
          emit('video:v01:end');
        }}
      >
        <source src={VIDEO.recovered} type="video/mp4" />
        <source src={VIDEO.recoveredWebm} type="video/webm" />
      </video>
      {!playing && (
        <button type="button" className="recovered-play" onClick={play} aria-label={ended ? '다시 재생' : '재생'}>
          {ended ? '↻' : '▶'}
        </button>
      )}
      <span className="recovered-tag">REC 01:25 · 복구됨</span>
    </div>
  );
}

export function PhotoView({ id, brightness = 0, changed = false }: { id: string; brightness?: number; changed?: boolean }) {
  const flags = useGame((s) => s.save.flags);
  switch (id) {
    case 'v01':
      return <VideoStill />;
    case 'p00':
      return <BoothShelfPhoto />;
    case 'p01':
      return art('annex-gate') ? <SlotPhoto slot="annex-gate" stamp="00:59" label="학교 정문. 체인이 끊어져 있다." /> : <AnnexPhoto level={3} />;
    case 'p02':
      return art('lobby') ? <SlotPhoto slot="lobby" stamp="01:14" label="1층 현관." /> : <LobbyPhoto />;
    case 'p03':
      // Recognition: after the selfie, there is someone at the top of the stairs.
      if (art('stairs')) {
        const fig = (changed || flags.includes('selfie-scare')) && art('stairs-figure');
        return <SlotPhoto slot={fig ? 'stairs-figure' : 'stairs'} stamp="01:25" label="3층으로 가는 계단." />;
      }
      return <StairsPhoto figure={changed || flags.includes('selfie-scare')} />;
    case 'p04':
      return art('corridor') ? <SlotPhoto slot="corridor" stamp="01:32" label="3층 복도. 불 켜진 방 하나." /> : <CorridorPhoto />;
    case 'p05': {
      // The figure in the reading room: absent at first, then there, closer each time.
      const stage = Math.min(4, (flags.includes('selfie-scare') ? 3 : flags.includes('reveal-scare') ? 2 : 1) + (changed ? 1 : 0));
      if (art('reading-empty')) return <SlotPhoto slot={stage >= 3 && art('reading-figure') ? 'reading-figure' : 'reading-empty'} stamp="01:40" label="열람실." />;
      return <ReadingRoomPhoto level={3} stage={Math.min(4, (flags.includes('selfie-scare') ? 3 : flags.includes('reveal-scare') ? 2 : 1) + (changed ? 1 : 0)) as 1 | 2 | 3 | 4} />;
    }
    case 'p06':
      return <FloorPlan level={3} />;
    case 'p07':
      return <BlackPhoto brightness={brightness} revealed={flags.includes('p07-revealed')} />;
    case 'p08':
      return <BoothPhoto reflection={changed} />;
    case 'p09':
      return <BoothPhoto behind />;
    case 'h01':
      return art('room02-door') ? <SlotPhoto slot="room02-door" stamp="01:53" label="제2서고 문. 벽돌이 안쪽에서 쌓여 있다." /> : <CorridorPhoto door />;
    case 'h02':
      return art('room02') ? <SlotPhoto slot="room02" stamp="01:55" label="제2서고 안. 끝없는 카드 서랍." /> : <Room02Photo level={5} />;
    case 'h03':
      return <IndexCardPhoto lines={['방문자 #0026  윤채원', '도착  01:13', '열람  사진 7장 · 녹음 1개', '상태  안에 있음']} />;
    case 'h04':
      return <SelfiePhoto stage={1} />;
    case 'h05':
      // Just her, crying — until the scare. When it fades, she was at 채원's cheek all along.
      return <SelfiePhoto stage={flags.includes('h05-revealed') ? 2 : 0} />;
    default:
      return null;
  }
}

function Viewer({ list, index, onClose }: { list: PhotoItem[]; index: number; onClose: () => void }) {
  const [i, setI] = useState(index);
  const [edit, setEdit] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const touch = useRef<number | null>(null);
  // Double-tap to zoom 2.5×, drag to look around.
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const press = useRef<{ x: number; y: number; ox: number; oy: number; moved: boolean } | null>(null);
  const lastTap = useRef(0);
  const photo = list[i];

  useEffect(() => {
    markPhoto(photo.id);
    if (photo.id !== 'h05') return;
    const t = setTimeout(() => emit('photo:h05:dwell'), 1800);
    return () => clearTimeout(t);
  }, [photo.id]);

  const go = (d: number) => {
    const n = i + d;
    if (n < 0 || n >= list.length) return;
    setI(n);
    setEdit(false);
    setBrightness(0);
    setZoom(null);
    sfx('click');
  };

  // Leaving the editor puts the room tone back.
  useEffect(() => () => applyChapterMix(1), []);

  // Stay zoomed in long enough and the photo changes — slightly. Once per photo,
  // no sound cue, nothing announces it: "was that there before?"
  const [dwelt, setDwelt] = useState<string | null>(null);
  useEffect(() => {
    if (!zoom || !DWELL_PHOTOS.includes(photo.id) || hasFlag(`dwell-${photo.id}`)) return;
    const t = setTimeout(() => {
      addFlag(`dwell-${photo.id}`);
      addFlag('dwelt');
      setDwelt(photo.id);
    }, 3500);
    return () => clearTimeout(t);
  }, [zoom, photo.id]);

  // While the player is looking closely, scripted pop-ups hold off.
  useEffect(() => {
    setRt({ engaged: zoom !== null || edit });
  }, [zoom, edit]);
  useEffect(() => () => setRt({ engaged: false }), []);

  const onBright = (v: number) => {
    setBrightness(v);
    // The brighter the photo, the louder the room gets — until she's there; then nothing.
    if (!hasFlag('reveal-scare')) mix(0.16 + v * 0.3, v * 0.45, 0.2, 420 + v * 2600);
    if (v > 0.55 && Math.random() < 0.08) vibrate([20]);
    if (v >= REVEAL_AT && !hasFlag('reveal-scare')) {
      emit('photo:p07:reveal');
    }
  };

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // A video has its own controls: no double-tap zoom.
    if (photo.video) return;
    press.current = { x: e.clientX, y: e.clientY, ox: zoom?.x ?? 50, oy: zoom?.y ?? 50, moved: false };
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    if (Math.abs(dx) + Math.abs(dy) > 8) p.moved = true;
    if (!zoom || !p.moved) return;
    const r = e.currentTarget.getBoundingClientRect();
    const clamp = (v: number) => Math.max(0, Math.min(100, v));
    setZoom({ x: clamp(p.ox - (dx / r.width) * 70), y: clamp(p.oy - (dy / r.height) * 70) });
  };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    press.current = null;
    if (!p || p.moved || edit) return;
    const now = Date.now();
    if (now - lastTap.current > 320) {
      lastTap.current = now;
      return;
    }
    lastTap.current = 0;
    if (zoom) {
      setZoom(null);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
    sfx('zoom');
    emit(`photo:${photo.id}:zoom`);
  };

  return (
    <div
      className="viewer"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null || zoom) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <AppHeader title={photo.time} subtitle={photo.album === 'hidden' ? '숨김' : (photo.date ?? '9월 27일')} onBack={onClose} backLabel="앨범" />
      <div
        className={`viewer-img${photo.portrait ? ' portrait' : ''}${zoom ? ' zoomed' : ''}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => (press.current = null)}
      >
        {photo.video ? (
          <RecoveredVideo key={photo.id} />
        ) : (
          <div key={photo.id} className="viewer-zoom" style={zoom ? { transform: 'scale(2.5)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}>
            <PhotoView id={photo.id} brightness={brightness} changed={dwelt === photo.id || hasFlag(`dwell-${photo.id}`)} />
          </div>
        )}
      </div>
      <p className="viewer-caption">
        {photo.caption || ' '}
        {!edit && !photo.video && <small className="viewer-zoomhint">{zoom ? '두 번 탭: 원래대로' : '두 번 탭: 확대'}</small>}
      </p>
      {edit && photo.id === 'p07' ? (
        <div className="editor">
          <label htmlFor="bright">밝기</label>
          <input id="bright" type="range" min={0} max={1} step={0.01} value={brightness} onChange={(e) => onBright(Number(e.target.value))} />
        </div>
      ) : (
        <div className="viewer-bar">
          <button type="button" onClick={() => go(-1)} disabled={i === 0} aria-label="이전 사진">
            ‹
          </button>
          <span>
            {i + 1} / {list.length}
          </span>
          {photo.id === 'p07' ? (
            <button type="button" className="edit-btn" onClick={() => setEdit(true)}>
              편집
            </button>
          ) : (
            <span className="edit-spacer" />
          )}
          <button type="button" onClick={() => go(1)} disabled={i === list.length - 1} aria-label="다음 사진">
            ›
          </button>
        </div>
      )}
    </div>
  );
}

function HiddenLock({ onOpen, onBack }: { onOpen: () => void; onBack: () => void }) {
  const [code, setCode] = useState('');
  const [err, setErr] = useState(false);
  const press = (d: string) => {
    sfx('key');
    const next = (code + d).slice(0, 4);
    setCode(next);
    if (next.length < 4) return;
    setTimeout(() => {
      if (next === HIDDEN_ALBUM_CODE) {
        sfx('vault');
        addFlag('album-code');
        emit('album:unlock');
        onOpen();
      } else {
        sfx('error');
        vibrate([60, 30, 60]);
        logInput(`숨김 앨범 암호 ${next} — 틀림`);
        setErr(true);
        emit('album:fail');
      }
      setCode('');
    }, 160);
  };
  return (
    <div className="album-lock">
      <AppHeader title="숨김" onBack={onBack} backLabel="앨범" />
      <p className="album-lock-title">숨김 앨범 암호</p>
      <div className="lock-dots dark">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < code.length ? 'on' : ''} />
        ))}
      </div>
      {err && <p className="album-lock-err">암호가 틀렸습니다</p>}
      <div className="keypad dark">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) =>
          k === '' ? (
            <span key={i} />
          ) : (
            <button key={i} type="button" className={k === '⌫' ? 'key-del' : 'key'} onClick={() => (k === '⌫' ? setCode((c) => c.slice(0, -1)) : press(k))}>
              {k}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

function SyncingAlbum({ onBack }: { onBack: () => void }) {
  return (
    <div className="gallery">
      <AppHeader title="숨김" onBack={onBack} backLabel="앨범" />
      <p className="sync-note">클라우드에서 사진을 받는 중… (0/5)</p>
      <div className="grid">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="thumb syncing" aria-label="동기화 중인 사진" />
        ))}
      </div>
    </div>
  );
}

/** Opened from a photo shared in a chat: land on that photo (or its album). */
function deepTarget(): { album: 'recent' | 'hidden' | null; open: number | null } {
  const d = getState().rt.deep;
  if (d?.kind === 'album') return { album: 'hidden', open: null };
  if (d?.kind !== 'photo') return { album: null, open: null };
  const p = PHOTOS.find((x) => x.id === d.id);
  if (!p) return { album: null, open: null };
  const s = getState().save;
  const list = PHOTOS.filter((x) => x.album === p.album && (!x.extra || s.photos.includes(x.id)));
  const locked = p.album === 'hidden' && !(s.flags.includes('album-code') || s.flags.includes('album-open'));
  return { album: p.album, open: locked ? null : Math.max(0, list.findIndex((x) => x.id === p.id)) };
}

export function GalleryApp() {
  const [album, setAlbum] = useState<'recent' | 'hidden' | null>(() => deepTarget().album);
  const [open, setOpen] = useState<number | null>(() => deepTarget().open);
  useEffect(() => {
    if (getState().rt.deep) setRt({ deep: null });
  }, []);
  const [locked, setLocked] = useState(true);
  const albumOpen = useGame((s) => s.save.flags.includes('album-code') || s.save.flags.includes('album-open'));
  // The code can be found early, but the photos only arrive once 02:00 wants you to see them.
  const synced = useGame((s) => s.save.chapter >= 3);
  const seen = useGame((s) => s.save.seenPhotos);
  const extra = useGame((s) => s.save.photos);
  const visible = (p: PhotoItem) => !p.extra || extra.includes(p.id);

  if (album === 'hidden' && !albumOpen && locked) return <HiddenLock onOpen={() => setLocked(false)} onBack={() => setAlbum(null)} />;
  if (album === 'hidden' && !synced) return <SyncingAlbum onBack={() => setAlbum(null)} />;
  const list = album ? PHOTOS.filter((p) => p.album === album && visible(p)) : [];
  if (album && open !== null) return <Viewer list={list} index={open} onClose={() => setOpen(null)} />;

  if (album) {
    return (
      <div className="gallery">
        <AppHeader title={album === 'recent' ? '최근 항목' : '숨김'} onBack={() => setAlbum(null)} backLabel="앨범" />
        <div className="grid">
          {list.map((p, i) => (
            <button key={p.id} type="button" className="thumb" onClick={() => setOpen(i)} aria-label={`${p.time} 사진`}>
              <PhotoView id={p.id} />
              {!seen.includes(p.id) && <span className="thumb-new" />}
              <span className="thumb-time">{p.time}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const recent = PHOTOS.filter((p) => p.album === 'recent' && visible(p));
  return (
    <div className="gallery">
      <AppHeader title="앨범" onBack={() => openApp(null)} backLabel="홈" />
      <div className="albums">
        <button type="button" className="album" onClick={() => setAlbum('recent')}>
          <span className="album-cover">
            <PhotoView id={recent[recent.length - 1].id === 'p07' ? 'p04' : recent[recent.length - 1].id} />
          </span>
          <strong>최근 항목</strong>
          <small>{recent.length}</small>
        </button>
        <button type="button" className="album" onClick={() => setAlbum('hidden')}>
          <span className="album-cover locked">{albumOpen && synced ? <PhotoView id="h01" /> : <span className="lock-glyph">{albumOpen ? '☁' : '🔒'}</span>}</span>
          <strong>숨김</strong>
          <small>{!albumOpen ? '잠김' : synced ? 5 : '동기화 중'}</small>
        </button>
      </div>
    </div>
  );
}
