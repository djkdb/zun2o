import { useEffect, useRef, useState } from 'react';
import { useGame } from '../../hooks/useGame';
import { emit, openApp, sfx } from '../../engine/director';
import { MEMO_M1, type MemoLine } from '../../content/media';
import { MEMO_S2M1, MEMO_S2M2, MEMO_S2TAPE } from '../../content/s2/media';
import { isS2 } from '../../content/season';
import { getState, setRt } from '../../engine/state';
import { AppHeader } from '../AppHeader';
import { hasRecording, speak, stopSpeech } from '../../audio/speech';

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
          // (a stage direction in parentheses is shown, not said)
          const said = l.text.replace(/^\([^)]*\)\s*/, '');
          if (sound && l.who === '채원') speak(said, 'female');
          if (sound && l.who === '소연') speak(said, 'soyeon');
          if (sound && l.who === '???') speak(said, 'entity');
          // 엄마: where she says *her* lines ("다 적어 뒀어요"), it is her recorded voice from season 1
          if (sound && l.who === '엄마') speak(said, hasRecording(said, 'entity') ? 'entity' : 'mother');
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
  if (d.id === 's2m1') return MEMO_S2M1;
  if (d.id === 's2m2') return MEMO_S2M2;
  if (d.id === 's2tape') return getState().save.flags.includes('tape-ok') ? MEMO_S2TAPE : null;
  return getState().save.flags.includes('call1-done') ? MEMO_M1 : null;
}

export function MemosApp() {
  // Opened from a recording shared in a chat: go straight to it.
  const [open, setOpen] = useState<Memo | null>(deepMemo);
  const memos = useGame((s) => s.save.memos);
  const synced = useGame((s) => s.save.flags.includes('call1-done'));
  // season 2: the cassette 소연 never played to the end, until tonight
  const tapeOk = useGame((s) => s.save.flags.includes('tape-ok'));
  // Tapping the damaged file does something: a burst of static, and a detail that doesn't add up.
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    if (!broken) return;
    const t = setTimeout(() => setBroken(false), 2600);
    return () => clearTimeout(t);
  }, [broken]);
  useEffect(() => {
    if (getState().rt.deep) setRt({ deep: null });
  }, []);
  return (
    <div className="memos-app">
      <AppHeader title="녹음" onBack={() => (open ? setOpen(null) : openApp(null))} backLabel={open ? '목록' : '홈'} />
      {open ? (
        <Player memo={open} />
      ) : isS2() ? (
        <ul className="memo-list">
          {memos.includes('s2m1') && (
            <li>
              <button type="button" className="new" onClick={() => setOpen(MEMO_S2M1)}>
                <MemoIcon kind="play" />
                <span className="memo-row-text">
                  <strong>{MEMO_S2M1.title}</strong>
                  <span>방금 복원됨 · {fmt(MEMO_S2M1.duration)}</span>
                </span>
                <MiniWave seed={28} />
              </button>
            </li>
          )}
          {memos.includes('s2m2') && (
            <li>
              <button type="button" className="new" onClick={() => setOpen(MEMO_S2M2)}>
                <MemoIcon kind="play" />
                <span className="memo-row-text">
                  <strong>{MEMO_S2M2.title}</strong>
                  <span>해원고 정문 · {fmt(MEMO_S2M2.duration)}</span>
                </span>
                <MiniWave seed={47} />
              </button>
            </li>
          )}
          <li>
            {tapeOk ? (
              <button type="button" className="new" onClick={() => setOpen(MEMO_S2TAPE)}>
                <MemoIcon kind="play" />
                <span className="memo-row-text">
                  <strong>{MEMO_S2TAPE.title}</strong>
                  <span>1994년 3월 13일 · 자동응답기 테이프 · {fmt(MEMO_S2TAPE.duration)}</span>
                </span>
                <MiniWave seed={94} />
              </button>
            ) : (
              <div className="memo-old">
                <MemoIcon kind="broken" />
                <span className="memo-row-text">
                  <strong>엄마 목소리</strong>
                  <span>1994년 3월 · 카세트에서 옮김 · 0:10 · 재생할 수 없음</span>
                </span>
              </div>
            )}
          </li>
        </ul>
      ) : (
        <ul className="memo-list">
          {memos.includes('m2') && (
            <li>
              <button type="button" className="new" onClick={() => setOpen(buildM2())}>
                <MemoIcon kind="play" />
                <span className="memo-row-text">
                  <strong>새 녹음 18</strong>
                  <span>오늘 01:51 · 방금 저장됨</span>
                </span>
                <MiniWave seed={18} />
              </button>
            </li>
          )}
          <li>
            {synced ? (
              <button type="button" onClick={() => setOpen(MEMO_M1)}>
                <MemoIcon kind="play" />
                <span className="memo-row-text">
                  <strong>{MEMO_M1.title}</strong>
                  <span>
                    {MEMO_M1.date} · {fmt(MEMO_M1.duration)}
                  </span>
                </span>
                <MiniWave seed={17} />
              </button>
            ) : (
              <div className="memo-old syncing">
                <MemoIcon kind="sync" />
                <span className="memo-row-text">
                  <strong>{MEMO_M1.title}</strong>
                  <span>클라우드에서 불러오는 중… (신호 약함)</span>
                </span>
              </div>
            )}
          </li>
          <li>
            <button
              type="button"
              className="memo-old"
              onClick={() => {
                sfx('static');
                setBroken(true);
              }}
            >
              <MemoIcon kind="broken" />
              <span className="memo-row-text">
                <strong>새 녹음 16</strong>
                <span>{broken ? '파일이 손상되어 재생할 수 없습니다. · 마지막 재생: 오늘 02:00' : '9월 25일 · 0:12 · 손상된 파일'}</span>
              </span>
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}

function MemoIcon({ kind }: { kind: 'play' | 'sync' | 'broken' }) {
  return (
    <span className={`memo-icon ${kind}`} aria-hidden="true">
      {kind === 'play' ? '▶' : kind === 'sync' ? '' : '!'}
    </span>
  );
}

/** A little waveform per recording, the same every time. */
function MiniWave({ seed }: { seed: number }) {
  return (
    <span className="memo-mini" aria-hidden="true">
      {Array.from({ length: 14 }, (_, i) => (
        <i key={i} style={{ height: `${25 + Math.abs(Math.sin(i * 1.9 + seed) * Math.cos(i * 0.7 + seed)) * 75}%` }} />
      ))}
    </span>
  );
}

