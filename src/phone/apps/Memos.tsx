import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { emit, openApp, sfx } from '../../engine/director';
import { MEMO_M1 } from '../../content/media';
import { AppHeader } from '../AppHeader';
import { speak, stopSpeech } from '../../audio/speech';

// Voice memo player. The audio is synthesized (footsteps, drawers, whisper,
// scream) and the dialogue is spoken + subtitled.

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function Player() {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const fired = useRef(new Set<number>());
  const sound = useGame((s) => s.save.sound);

  useEffect(() => {
    if (!playing) return;
    const start = performance.now() - t * 1000;
    const iv = setInterval(() => {
      const now = (performance.now() - start) / 1000;
      if (now >= MEMO_M1.duration) {
        setT(MEMO_M1.duration);
        setPlaying(false);
        clearInterval(iv);
        emit('memo:m1:end');
        return;
      }
      setT(now);
      MEMO_M1.lines.forEach((l, i) => {
        if (now >= l.at && !fired.current.has(i)) {
          fired.current.add(i);
          if (l.sfx) sfx(l.sfx === 'scream' ? 'scream' : l.sfx);
          if (sound && l.who === '채원') speak(l.text, 'female');
          if (sound && l.who === '???') speak(l.text, 'entity');
        }
      });
    }, 100);
    return () => clearInterval(iv);
    // `t` is only the resume point; restarting on every tick is not wanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  useEffect(() => () => stopSpeech(), []);

  const current = [...MEMO_M1.lines].reverse().find((l) => t >= l.at);
  const scream = current?.sfx === 'scream' && playing;
  const bars = Array.from({ length: 48 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.37)) * 0.75);

  return (
    <div className={`memo-player${scream ? ' memo-scream' : ''}`}>
      <h2>{MEMO_M1.title}</h2>
      <small>{MEMO_M1.date}</small>
      <div className="wave" aria-hidden="true">
        {bars.map((h, i) => (
          <i key={i} className={i / bars.length <= t / MEMO_M1.duration ? 'on' : ''} style={{ height: `${h * 100}%` }} />
        ))}
      </div>
      <div className="memo-time">
        <span>{fmt(t)}</span>
        <span>{fmt(MEMO_M1.duration)}</span>
      </div>
      <p className="subtitle" aria-live="polite">
        {current ? (
          <>
            {current.who && <b>{current.who}: </b>}
            {current.text}
          </>
        ) : (
          ' '
        )}
      </p>
      <button
        type="button"
        className="memo-play"
        onClick={() => {
          if (t >= MEMO_M1.duration) {
            setT(0);
            fired.current.clear();
          }
          setPlaying((p) => !p);
          stopSpeech();
        }}
        aria-label={playing ? '일시정지' : '재생'}
      >
        {playing ? '❚❚' : '▶'}
      </button>
    </div>
  );
}

export function MemosApp() {
  const [open, setOpen] = useState(false);
  return (
    <div className="memos-app">
      <AppHeader title="녹음" onBack={() => (open ? setOpen(false) : openApp(null))} backLabel={open ? '목록' : '홈'} />
      {open ? (
        <Player />
      ) : (
        <ul className="memo-list">
          <li>
            <button type="button" onClick={() => setOpen(true)}>
              <strong>{MEMO_M1.title}</strong>
              <span>
                {MEMO_M1.date} · {fmt(MEMO_M1.duration)}
              </span>
            </button>
          </li>
          <li className="memo-old">
            <strong>새 녹음 16</strong>
            <span>9월 25일 · 0:12 · 손상된 파일</span>
          </li>
        </ul>
      )}
    </div>
  );
}
