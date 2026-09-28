import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../hooks/useGame';
import { WallpaperPhoto } from '../art/phonePhotos';
import { emit, sfx, vibrate } from '../engine/director';
import { setSave } from '../engine/state';
import { THREAD_META } from '../content/threads';
import type { ThreadId } from '../engine/types';

const CODE = '0113';

export function LockScreen() {
  const clock = useGame((s) => s.save.clock);
  const threads = useGame((s) => s.save.threads);
  const fails = useGame((s) => s.save.passcodeFails);
  const [pad, setPad] = useState(false);
  const [code, setCode] = useState('');
  const [shake, setShake] = useState(0);

  // Standing still on the lock screen is noticed.
  useEffect(() => {
    const t = setTimeout(() => emit('lock:idle'), 16000);
    return () => clearTimeout(t);
  }, []);

  const notifications = useMemo(() => {
    const out: { th: ThreadId; text: string; time: string }[] = [];
    (['unknown', 'dohyun'] as ThreadId[]).forEach((th) => {
      threads[th].slice(-2).forEach((m) => {
        if (m.from === 'them' && m.day !== '9월 26일 (금)') out.push({ th, text: m.text, time: m.time });
      });
    });
    return out.slice(-4).reverse();
  }, [threads]);

  const press = (d: string) => {
    sfx('key');
    const next = (code + d).slice(0, 4);
    setCode(next);
    if (next.length < 4) return;
    setTimeout(() => {
      if (next === CODE) {
        sfx('unlock');
        setSave({ unlocked: true });
        emit('unlock');
      } else {
        sfx('error');
        vibrate([80, 40, 80]);
        setShake((x) => x + 1);
        const n = fails + 1;
        setSave({ passcodeFails: n });
        if (n >= 3) emit('lock:fail3');
      }
      setCode('');
    }, 180);
  };

  return (
    <div className="lock">
      <div className="lock-wall">
        <WallpaperPhoto />
      </div>
      {!pad ? (
        <div className="lock-main" onClick={() => setPad(true)}>
          <div className="lock-date">9월 27일 토요일</div>
          <div className="lock-clock">{clock}</div>
          <div className="lock-notes">
            {notifications.map((n, i) => (
              <div key={`${n.th}${i}`} className="lock-note">
                <div className="lock-note-head">
                  <span className="lock-note-app">메시지</span>
                  <span>{n.time}</span>
                </div>
                <strong>{THREAD_META[n.th].name}</strong>
                <p>{n.text}</p>
              </div>
            ))}
          </div>
          <button type="button" className="lock-hint" onClick={() => setPad(true)}>
            눌러서 잠금 해제
          </button>
        </div>
      ) : (
        <div className="lock-pad" key={shake}>
          <p className="lock-pad-title">암호 입력</p>
          <div className={`lock-dots${shake ? ' shake' : ''}`}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={i < code.length ? 'on' : ''} />
            ))}
          </div>
          <div className="keypad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) =>
              k === '' ? (
                <span key={i} />
              ) : (
                <button
                  key={i}
                  type="button"
                  className={k === '⌫' ? 'key-del' : 'key'}
                  aria-label={k === '⌫' ? '지우기' : k}
                  onClick={() => (k === '⌫' ? setCode((c) => c.slice(0, -1)) : press(k))}
                >
                  {k}
                </button>
              ),
            )}
          </div>
          <button type="button" className="lock-cancel" onClick={() => setPad(false)}>
            취소
          </button>
          {fails > 0 && <p className="lock-fails">암호가 틀렸습니다 ({fails}회)</p>}
        </div>
      )}
    </div>
  );
}
