import { useEffect, useMemo, useState } from 'react';
import { useGame } from '../hooks/useGame';
import { BoothPhoto, WallpaperPhoto } from '../art/phonePhotos';
import { emit, sfx, vibrate } from '../engine/director';
import { logInput, setSave } from '../engine/state';
import { THREAD_META, lastSent, today } from '../content/threads';
import { Avatar } from './Avatar';
import type { ThreadId } from '../engine/types';

const CODE = '0113';

export function LockScreen() {
  const clock = useGame((s) => s.save.clock);
  const threads = useGame((s) => s.save.threads);
  const fails = useGame((s) => s.save.passcodeFails);
  const wallpaper = useGame((s) => s.save.wallpaper ?? 'annex');
  const [pad, setPad] = useState(false);
  const [code, setCode] = useState('');
  const [shake, setShake] = useState(0);

  // Standing still on the lock screen is noticed — twice, with a silence between:
  // first the invitation, then, if you still haven't moved, the sign that you're being watched.
  useEffect(() => {
    const ts = [setTimeout(() => emit('lock:idle'), 22000), setTimeout(() => emit('lock:idle2'), 40000)];
    return () => ts.forEach(clearTimeout);
  }, []);

  const notifications = useMemo(() => {
    const out: { th: ThreadId; text: string; time: string; at: number; seq: number }[] = [];
    (['unknown', 'dohyun'] as ThreadId[]).forEach((th) => {
      const all = threads[th];
      all.forEach((m, i) => {
        if (i < all.length - 2) return;
        if (m.from === 'them' && m.day !== '9월 26일 (금)') out.push({ th, text: m.text, time: m.time, at: lastSent(all.slice(0, i + 1)), seq: i });
      });
    });
    // Newest on top, like a real lock screen.
    // Same minute: the one that arrived later (later in its thread) goes on top.
    return out.sort((a, b) => b.at - a.at || b.seq - a.seq).slice(0, 4);
  }, [threads]);

  const press = (d: string) => {
    // four digits in: ignore extra taps until they've been checked
    if (code.length >= 4) return;
    sfx('key');
    const next = (code + d).slice(0, 4);
    setCode(next);
    if (next.length < 4) return;
    setTimeout(() => {
      if (next === CODE) {
        logInput('잠금 해제 0113');
        sfx('unlock');
        setSave({ unlocked: true });
        emit('unlock');
      } else {
        sfx('error');
        vibrate([80, 40, 80]);
        setShake((x) => x + 1);
        logInput(`잠금 암호 ${next} — 틀림`);
        const n = fails + 1;
        setSave({ passcodeFails: n });
        if (n >= 3) emit('lock:fail3');
      }
      setCode('');
    }, 180);
  };

  return (
    <div className="lock">
      <div className={`lock-wall${wallpaper === 'booth' ? ' changed' : ''}`}>{wallpaper === 'booth' ? <BoothPhoto fill /> : <WallpaperPhoto />}</div>
      {!pad ? (
        <div className="lock-main" onClick={() => setPad(true)}>
          <div className="lock-date">
            9월 {today(clock).d}일 {today(clock).weekday}
          </div>
          <div className="lock-clock">{clock}</div>
          <div className="lock-notes">
            {notifications.map((n, i) => (
              <div key={`${n.th}${i}`} className="lock-note">
                <Avatar th={n.th} size={40} badge />
                <div className="lock-note-body">
                  <div className="lock-note-head">
                    <strong>{THREAD_META[n.th].name}</strong>
                    <span>{n.time}</span>
                  </div>
                  <p>{n.text}</p>
                </div>
              </div>
            ))}
            {/* The passcode clue: when 채원 started filming tonight. */}
            <div className="lock-note">
              <span className="avatar pic camera-app" style={{ width: 40, height: 40 }}>
                <svg viewBox="0 0 32 32" aria-hidden="true">
                  <rect x="5" y="10" width="22" height="15" rx="3" fill="none" stroke="#fff" strokeWidth="2.2" />
                  <path d="M12 10l2-3h4l2 3" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" />
                  <circle cx="16" cy="17.5" r="4" fill="none" stroke="#fff" strokeWidth="2.2" />
                </svg>
              </span>
              <div className="lock-note-body">
                <div className="lock-note-head">
                  <strong>카메라</strong>
                  <span>01:58</span>
                </div>
                <p>녹화가 중단되었습니다. 01:13에 시작한 영상(45분)을 저장하지 못했습니다.</p>
              </div>
            </div>
          </div>
          <button type="button" className="lock-hint" onClick={() => setPad(true)}>
            눌러서 잠금 해제
          </button>
        </div>
      ) : (
        <div className="lock-pad" key={shake}>
          <p className="lock-pad-title">암호 입력</p>
          {/* the clue stays in view while typing: her riddle, once it's been left, and the camera notice */}
          <div className="lock-pad-clues">
            <p>도현 · (지워진 메시지) “걔가 어제 학교 들어간 시간이랑 똑같아요.”</p>
            <p>카메라 · 01:13에 시작한 영상을 저장하지 못했습니다.</p>
          </div>
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
          <button type="button" className="lock-cancel" onClick={() => (setPad(false), setCode(''))}>
            취소
          </button>
          {fails > 0 && <p className="lock-fails">암호가 틀렸습니다 ({fails}회)</p>}
        </div>
      )}
    </div>
  );
}
