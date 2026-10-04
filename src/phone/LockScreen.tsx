import { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../hooks/useGame';
import { BoothPhoto, SlotPhoto, WallpaperPhoto } from '../art/phonePhotos';
import { emit, sfx, vibrate } from '../engine/director';
import { logInput, setSave } from '../engine/state';
import { lastSent, threadMeta, today } from '../content/threads';
import { isS2, pick } from '../content/season';
import { Avatar } from './Avatar';
import type { ThreadId } from '../engine/types';

/** 채원's phone: the day she met 도현. 소연's: the day her mother disappeared. */
const passcode = () => pick('0113', '0314');
/** The letters under the digits (drawn by CSS, so a key's text stays just its digit). */
const KEY_LETTERS: Record<string, string> = { '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL', '6': 'MNO', '7': 'PQRS', '8': 'TUV', '9': 'WXYZ' };
/** Season 2 shows only what arrived tonight (from the 27th on). */
const TONIGHT_AT = (9 * 31 + 27) * 1440;

export function LockScreen() {
  const clock = useGame((s) => s.save.clock);
  const threads = useGame((s) => s.save.threads);
  const fails = useGame((s) => s.save.passcodeFails);
  const wallpaper = useGame((s) => s.save.wallpaper ?? 'annex');
  const [pad, setPad] = useState(false);
  const [code, setCode] = useState('');
  const [shake, setShake] = useState(0);
  const [torch, setTorch] = useState(false);
  const [nope, setNope] = useState(0);
  const swipe = useRef<number | null>(null);

  // Standing still on the lock screen is noticed — twice, with a silence between:
  // first the invitation, then, if you still haven't moved, the sign that you're being watched.
  useEffect(() => {
    const ts = [setTimeout(() => emit('lock:idle'), 22000), setTimeout(() => emit('lock:idle2'), 40000)];
    return () => ts.forEach(clearTimeout);
  }, []);

  const notifications = useMemo(() => {
    const out: { th: ThreadId; text: string; time: string; at: number; seq: number }[] = [];
    pick<ThreadId[]>(['unknown', 'dohyun'], ['unknown', 'mom', 'dohyun']).forEach((th) => {
      const all = threads[th];
      all.forEach((m, i) => {
        if (i < all.length - 2) return;
        const at = lastSent(all.slice(0, i + 1));
        if (m.from === 'them' && m.day !== '9월 26일 (금)' && (!isS2() || at >= TONIGHT_AT)) out.push({ th, text: m.text, time: m.time, at, seq: i });
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
      if (next === passcode()) {
        logInput(`잠금 해제 ${next}`);
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
      <div className={`lock-wall${wallpaper === 'booth' ? ' changed' : ''}`}>
        {isS2() ? <SlotPhoto slot="miryeong-daughter" w={390} h={844} fill label="1994년, 도서관 앞의 엄마와 열한 살 딸." /> : wallpaper === 'booth' ? <BoothPhoto fill /> : <WallpaperPhoto />}
      </div>
      {!pad ? (
        <div
          className="lock-main"
          onClick={() => setPad(true)}
          // or swipe up from anywhere, like a real one
          // (a swipe on the notifications scrolls them instead)
          onPointerDown={(e) => (swipe.current = (e.target as Element).closest('.lock-notes') ? null : e.clientY)}
          onPointerUp={(e) => {
            if (swipe.current !== null && swipe.current - e.clientY > 50) setPad(true);
            swipe.current = null;
          }}
        >
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
                    <strong>{threadMeta()[n.th].name}</strong>
                    <span>{n.time}</span>
                  </div>
                  <p>{n.text}</p>
                </div>
              </div>
            ))}
            {isS2() && <NewsClue />}
            {/* The passcode clue: when 채원 started filming tonight. */}
            {!isS2() && (
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
            )}
          </div>
          <button type="button" className="lock-hint" onClick={() => setPad(true)}>
            위로 쓸어올려 열기
          </button>
          {/* the two glass buttons in the corners — the flashlight works, the camera doesn't (and never asks) */}
          <button
            type="button"
            className={`lock-corner left${torch ? ' on' : ''}`}
            aria-label="손전등"
            aria-pressed={torch}
            onClick={(e) => {
              e.stopPropagation();
              vibrate([12]);
              setTorch((v) => !v);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 2.5h8v3.2l-2 3V21a1 1 0 01-1 1h-2a1 1 0 01-1-1V8.7l-2-3z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <circle cx="12" cy="12.5" r="1.2" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            key={nope}
            className={`lock-corner right${nope ? ' nope' : ''}`}
            aria-label="카메라 (사용할 수 없음)"
            onClick={(e) => {
              e.stopPropagation();
              sfx('error');
              setNope((n) => n + 1);
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 8h3l1.6-2.2h6.8L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <circle cx="12" cy="13" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="lock-pad" key={shake}>
          <p className="lock-pad-title">암호 입력</p>
          {/* the clue stays in view while typing: her riddle, once it's been left, and the camera notice */}
          <div className="lock-pad-clues">
            {isS2() ? <p>채원 · “잠겨 있으면 언니 비번 어머니 사라지신 날이에요”</p> : <p>도현 · (비번 메시지는 삭제됨) “걔가 어제 학교 들어간 시간이랑 똑같아요.”</p>}
            {isS2() ? <p>해원일보 · 1994년 3월 14일 실종된 사서, 31년 만에 귀가</p> : <p>카메라 · 01:13에 시작한 영상을 저장하지 못했습니다.</p>}
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
                  data-sub={KEY_LETTERS[k]}
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

/** Season 2's passcode clue: today's "a year ago" push, with the date in it. */
function NewsClue() {
  return (
    <div className="lock-note">
      <span className="avatar pic news-app" style={{ width: 40, height: 40 }} aria-hidden="true">
        해
      </span>
      <div className="lock-note-body">
        <div className="lock-note-head">
          <strong>해원일보</strong>
          <span>23:30</span>
        </div>
        <p>[1년 전 이맘때] 1994년 3월 14일 실종된 도서관 사서, 31년 만에 귀가… “도서관에 잠깐 있었다”</p>
      </div>
    </div>
  );
}
