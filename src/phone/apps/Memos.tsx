import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { emit, openApp, sfx } from '../../engine/director';
import { MEMO_M1, type MemoLine } from '../../content/media';
import { getState, setRt } from '../../engine/state';
import { AppHeader } from '../AppHeader';
import { speak, stopSpeech } from '../../audio/speech';

// Voice memo player. The audio is synthesized (footsteps, drawers, whisper,
// scream) and the dialogue is spoken + subtitled.

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

interface Memo {
  id: string;
  title: string;
  date: string;
  duration: number;
  lines: MemoLine[];
}

/** 새 녹음 18: the phone "recorded" everything you typed into it tonight. */
function buildM2(): Memo {
  const s = getState().save;
  const start = new Date(s.startedAtReal);
  const hm = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
  const lines: MemoLine[] = [{ at: 0, who: '', text: `(휴대폰을 집어 드는 소리 · ${hm})`, sfx: 'static' }];
  let at = 4;
  for (const entry of s.inputs.slice(-7)) {
    lines.push({ at, who: '', text: `(키패드 소리) ${entry}` });
    at += 4;
  }
  lines.push({ at, who: '???', text: '다 적어 뒀어요.', sfx: 'whisper' });
  lines.push({ at: at + 4, who: '???', text: s.playerName ? `${s.playerName} 씨. 두 시에 봐요.` : '이름은 몰라도 괜찮아요. 두 시에 봐요.' });
  return { id: 'm2', title: '새 녹음 18', date: '오늘 01:51', duration: at + 9, lines };
}

function Player({ memo }: { memo: Memo }) {
  const MEMO_M1 = memo;
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
        emit(`memo:${memo.id}:end`);
        return;
      }
      setT(now);
      MEMO_M1.lines.forEach((l, i) => {
        if (now >= l.at && !fired.current.has(i)) {
          fired.current.add(i);
          if (l.sfx) sfx(l.sfx);
          else if (l.text.startsWith('(키패드')) sfx('key');
          if (sound && l.who === '채원') speak(l.text, 'female');
          if (sound && l.who === '???') speak(l.text, 'entity');
        }
      });
    }, 100);
    return () => clearInterval(iv);
    // `t` is only the resume point; restarting on every tick is not wanted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  useEffect(() => {
    setRt({ memoPlaying: playing });
  }, [playing]);

  useEffect(
    () => () => {
      stopSpeech();
      setRt({ memoPlaying: false });
    },
    [],
  );

  const current = [...MEMO_M1.lines].reverse().find((l) => t >= l.at);
  const scream = current?.sfx === 'scream' && playing;
  const bars = Array.from({ length: 48 }, (_, i) => 0.25 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.37)) * 0.75);

  return (
    <div className={`memo-player${scream ? ' memo-scream' : ''}`}>
      <h2>{MEMO_M1.title}</h2>
      <small>{MEMO_M1.date}</small>
      <div className="wave" aria-hidden="true">
        {bars.map((h, i) => (
          <i
            key={i}
            className={`${i / bars.length <= t / MEMO_M1.duration ? 'on' : ''}${playing && Math.abs(i - Math.floor((t / MEMO_M1.duration) * bars.length)) <= 2 ? (scream ? ' live loud' : ' live') : ''}`}
            style={{ height: `${h * 100}%` }}
          />
        ))}
      </div>
      <div className="memo-time">
        <span>{fmt(t)}</span>
        <span>{fmt(MEMO_M1.duration)}</span>
      </div>
      {/* the line being heard, and the two before it fading above: nothing is missed */}
      <div className="memo-transcript" aria-live="polite">
        {MEMO_M1.lines
          .filter((l) => t >= l.at)
          .slice(-3)
          .map((l, i, shown) => (
            <p key={l.at} className={`subtitle${i === shown.length - 1 ? '' : ' past'}`}>
              {l.who && <b>{l.who}: </b>}
              {l.text}
            </p>
          ))}
      </div>
      <button
        type="button"
        className="memo-play"
        onClick={() => {
          if (t >= MEMO_M1.duration) {
            setT(0);
            fired.current.clear();
          }
          if (!playing) sfx('tape');
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

function deepMemo(): Memo | null {
  const d = getState().rt.deep;
  if (d?.kind !== 'memo') return null;
  if (d.id === 'm2') return buildM2();
  return getState().save.flags.includes('call1-done') ? MEMO_M1 : null;
}

export function MemosApp() {
  // Opened from a recording shared in a chat: go straight to it.
  const [open, setOpen] = useState<Memo | null>(deepMemo);
  const memos = useGame((s) => s.save.memos);
  const synced = useGame((s) => s.save.flags.includes('call1-done'));
  useEffect(() => {
    if (getState().rt.deep) setRt({ deep: null });
  }, []);
  return (
    <div className="memos-app">
      <AppHeader title="녹음" onBack={() => (open ? setOpen(null) : openApp(null))} backLabel={open ? '목록' : '홈'} />
      {open ? (
        <Player memo={open} />
      ) : (
        <ul className="memo-list">
          {memos.includes('m2') && (
            <li>
              <button type="button" className="new" onClick={() => setOpen(buildM2())}>
                <strong>새 녹음 18</strong>
                <span>오늘 · 방금 저장됨</span>
              </button>
            </li>
          )}
          <li>
            {synced ? (
              <button type="button" onClick={() => setOpen(MEMO_M1)}>
                <strong>{MEMO_M1.title}</strong>
                <span>
                  {MEMO_M1.date} · {fmt(MEMO_M1.duration)}
                </span>
              </button>
            ) : (
              <div className="memo-old syncing">
                <strong>{MEMO_M1.title}</strong>
                <span>클라우드에서 불러오는 중… (신호 약함)</span>
              </div>
            )}
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
