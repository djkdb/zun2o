import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { applyChapterMix, emit, markPhoto, mix, openApp, sfx, vibrate } from '../../engine/director';
import { addFlag, hasFlag, logInput } from '../../engine/state';
import { HIDDEN_ALBUM_CODE, PHOTOS, type PhotoItem } from '../../content/media';
import { AppHeader } from '../AppHeader';
import { AnnexPhoto, FloorPlan, ReadingRoomPhoto, Room02Photo } from '../../art/scenes';
import { BlackPhoto, BoothPhoto, CorridorPhoto, IndexCardPhoto, LobbyPhoto, SelfiePhoto, StairsPhoto } from '../../art/phonePhotos';

export function PhotoView({ id, brightness = 0 }: { id: string; brightness?: number }) {
  const flags = useGame((s) => s.save.flags);
  switch (id) {
    case 'p01':
      return <AnnexPhoto level={3} />;
    case 'p02':
      return <LobbyPhoto />;
    case 'p03':
      // Recognition: after the selfie, there is someone at the top of the stairs.
      return <StairsPhoto figure={flags.includes('selfie-scare')} />;
    case 'p04':
      return <CorridorPhoto />;
    case 'p05':
      return <ReadingRoomPhoto level={3} stage={flags.includes('selfie-scare') ? 3 : flags.includes('reveal-scare') ? 2 : 1} />;
    case 'p06':
      return <FloorPlan level={3} />;
    case 'p07':
      return <BlackPhoto brightness={brightness} />;
    case 'p08':
      return <BoothPhoto />;
    case 'p09':
      return <BoothPhoto behind />;
    case 'h01':
      return <CorridorPhoto door />;
    case 'h02':
      return <Room02Photo level={5} />;
    case 'h03':
      return <IndexCardPhoto lines={['방문자 #0026  윤채원', '도착  01:13', '열람  사진 7장 · 녹음 1개', '상태  근무 대기']} />;
    case 'h04':
      return <SelfiePhoto stage={1} />;
    case 'h05':
      return <SelfiePhoto stage={2} />;
    default:
      return null;
  }
}

function Viewer({ list, index, onClose }: { list: PhotoItem[]; index: number; onClose: () => void }) {
  const [i, setI] = useState(index);
  const [edit, setEdit] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const touch = useRef<number | null>(null);
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
    sfx('click');
  };

  // Leaving the editor puts the room tone back.
  useEffect(() => () => applyChapterMix(1), []);

  const onBright = (v: number) => {
    setBrightness(v);
    // The brighter the photo, the louder the room gets.
    mix(0.16 + v * 0.3, v * 0.45, 0.2, 420 + v * 2600);
    if (v > 0.55 && Math.random() < 0.08) vibrate([20]);
    if (v >= 0.92 && !hasFlag('reveal-scare')) {
      emit('photo:p07:reveal');
    }
  };

  return (
    <div
      className="viewer"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        touch.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
      }}
    >
      <AppHeader title={photo.time} subtitle={photo.album === 'hidden' ? '숨김' : '9월 27일'} onBack={onClose} backLabel="앨범" />
      <div className={`viewer-img${photo.portrait ? ' portrait' : ''}`}>
        <PhotoView id={photo.id} brightness={brightness} />
      </div>
      <p className="viewer-caption">{photo.caption || ' '}</p>
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
        sfx('unlock');
        addFlag('album-open');
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

export function GalleryApp() {
  const [album, setAlbum] = useState<'recent' | 'hidden' | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [locked, setLocked] = useState(true);
  const albumOpen = useGame((s) => s.save.flags.includes('album-open'));
  const seen = useGame((s) => s.save.seenPhotos);
  const extra = useGame((s) => s.save.photos);
  const visible = (p: PhotoItem) => !p.extra || extra.includes(p.id);

  if (album === 'hidden' && !albumOpen && locked) return <HiddenLock onOpen={() => setLocked(false)} onBack={() => setAlbum(null)} />;
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
          <span className="album-cover locked">{albumOpen ? <PhotoView id="h01" /> : <span className="lock-glyph">🔒</span>}</span>
          <strong>숨김</strong>
          <small>{albumOpen ? 5 : '잠김'}</small>
        </button>
      </div>
    </div>
  );
}
