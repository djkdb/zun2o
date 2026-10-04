import { useEffect, useRef, useState } from 'react';
import { useGame, useTicker } from '../hooks/useGame';
import { answerCall, declineCall, endCall, emit, HINT_TIER_MS, openApp, openThread, sfx } from '../engine/director';
import { addFlag, setRt } from '../engine/state';
import { lineTime } from './StatusBar';
import { CALLS } from '../content/calls';
import { GhostVisual } from '../art/Ghost';
import { speak, stopSpeech } from '../audio/speech';
import type { CallLine } from '../engine/types';
import { CallIcon } from './CallIcon';
import { Avatar } from './Avatar';
import { APP_META, AppGlyph, appName } from './icons';
import { art } from '../art/photoArt';

export function BannerView() {
  const banner = useGame((s) => s.rt.banner);
  const finale = useGame((s) => s.rt.finale);
  const listening = useGame((s) => s.rt.memoPlaying);
  // Inside an app the banner drops *below* the app header, so it never
  // swallows a tap meant for the back button.
  const inApp = useGame((s) => s.rt.app !== null && s.save.unlocked);
  const swipe = useRef<number | null>(null);
  useEffect(() => {
    if (!banner) return;
    const off = (e: PointerEvent) => {
      if (!(e.target instanceof Element && e.target.closest('.banner'))) setRt({ banner: null });
    };
    window.addEventListener('pointerdown', off, true);
    return () => window.removeEventListener('pointerdown', off, true);
  }, [banner]);
  if (!banner || finale || listening) return null;
  const open = () => {
    setRt({ banner: null });
    if (banner.thread) openThread(banner.thread);
    else openApp(banner.app);
  };
  return (
    <button
      key={banner.id}
      type="button"
      className={`banner${inApp ? ' in-app' : ''}`}
      onClick={open}
      onTouchStart={(e) => (swipe.current = e.touches[0].clientY)}
      onTouchEnd={(e) => {
        const y0 = swipe.current;
        swipe.current = null;
        // Flick it up to dismiss.
        if (y0 !== null && e.changedTouches[0].clientY - y0 < -24) {
          e.preventDefault();
          setRt({ banner: null });
        }
      }}
    >
      {banner.thread ? (
        <Avatar th={banner.thread} size={38} badge />
      ) : (
        <span className="banner-icon" style={{ background: APP_META[banner.app].bg }}>
          <AppGlyph app={banner.app} />
        </span>
      )}
      <span className="banner-text">
        <strong>{banner.title}</strong>
        <span>{banner.body}</span>
      </span>
      <span className="banner-time">지금</span>
    </button>
  );
}

function CallAvatar({ from, hijacked = false }: { from: string; hijacked?: boolean }) {
  const th = from === 'dohyun' ? 'dohyun' : from === 'mom' ? 'mom' : from === '0200' ? 'unknown' : null;
  // An unsaved number: the plain default silhouette, not a letter.
  if (!th)
    return (
      <span className="call-avatar">
        <svg viewBox="0 0 40 40" aria-hidden="true">
          <circle cx="20" cy="15" r="7" fill="#d9dadd" />
          <path d="M6 40c0-9 6-13 14-13s14 4 14 13z" fill="#d9dadd" />
        </svg>
      </span>
    );
  return (
    <span className={`call-avatar pic${hijacked ? ' hijacked' : ''}`}>
      <Avatar th={th} size={96} />
    </span>
  );
}

/** Locked phone, like a real one: drag the green handle across to answer (a tap on it answers too). */
function SlideToAnswer() {
  const track = useRef<HTMLDivElement>(null);
  const start = useRef<number | null>(null);
  // a drag that falls short springs back — it isn't a tap
  const dragged = useRef(false);
  const [x, setX] = useState(0);
  const max = () => (track.current ? track.current.clientWidth - 70 : 220);
  return (
    <div className="slide-answer" ref={track}>
      <span className="slide-text" style={{ opacity: Math.max(0, 1 - x / 120) }}>
        밀어서 응답하기
      </span>
      <button
        type="button"
        className="accept knob"
        style={{ transform: `translateX(${x}px)` }}
        onClick={() => {
          if (!dragged.current) answerCall();
          dragged.current = false;
        }}
        onPointerDown={(e) => {
          start.current = e.clientX - x;
          dragged.current = false;
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (start.current === null) return;
          const nx = Math.max(0, Math.min(max(), e.clientX - start.current));
          if (nx > 6) dragged.current = true;
          setX(nx);
        }}
        onPointerUp={() => {
          start.current = null;
          if (x > max() * 0.75) answerCall();
          else setX(0);
        }}
        aria-label="받기"
      >
        <CallIcon />
      </button>
    </div>
  );
}

export function IncomingCall() {
  const id = useGame((s) => s.rt.incoming);
  const locked = useGame((s) => !s.save.unlocked);
  if (!id) return null;
  const call = CALLS[id];
  return (
    <div className={`incoming${call.video ? ' video' : ''}${locked ? ' locked' : ''}`} role="dialog" aria-label="수신 전화">
      {!call.video && <CallBackdrop from={call.from} />}
      <div className="incoming-top">
        <CallAvatar from={call.from} />
        <small>{call.video ? '영상 통화' : '휴대전화'}</small>
        <h2>{call.label}</h2>
      </div>
      {locked ? (
        <>
          <div className="incoming-extras">
            <button type="button" className="incoming-extra decline" onClick={declineCall}>
              <span className="extra-icon" aria-hidden="true">
                <CallIcon down />
              </span>
              거절
            </button>
            <span className="incoming-extra off" aria-hidden="true">
              <span className="extra-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 4c4.7 0 8.5 3 8.5 6.8s-3.8 6.8-8.5 6.8c-.9 0-1.8-.1-2.6-.3L5 19.5l1.2-3.6C4.6 14.7 3.5 12.9 3.5 10.8 3.5 7 7.3 4 12 4z" fill="currentColor" />
                </svg>
              </span>
              메시지
            </span>
          </div>
          <SlideToAnswer />
        </>
      ) : (
        <div className="incoming-actions">
          <span className="incoming-act">
            <button type="button" className="decline" onClick={declineCall} aria-label="거절">
              <CallIcon down />
            </button>
            거절
          </span>
          <span className="incoming-act">
            <button type="button" className="accept" onClick={answerCall} aria-label="받기">
              <CallIcon />
            </button>
            응답
          </span>
        </div>
      )}
    </div>
  );
}

/** Plays a CallScript: timed subtitle lines, optional mid-call choice. */
/** Chapter 4: the 0200 call from 23:53 never hung up. Only breathing on the line, and it won't end. */
export function OpenLineScreen() {
  // a real call (도현 at 01:57) comes in on top of it
  const open = useGame((s) => s.rt.openLine && s.rt.incoming === null && s.rt.activeCall === null);
  const clock = useGame((s) => s.save.clock);
  const [, tick] = useState(0);
  const [toast, setToast] = useState(false);
  useEffect(() => {
    if (!open) return;
    addFlag('heard-line');
    sfx('breath');
    const iv = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(iv);
  }, [open]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 1800);
    return () => clearTimeout(t);
  }, [toast]);
  if (!open) return null;
  return (
    <div className="callscreen hijacked openline" role="dialog" aria-label="통화 중">
      <CallBackdrop from="0200" hijacked />
      <div className="call-top">
        <small className="call-kind">휴대전화 · 23:53부터</small>
        <CallAvatar from="0200" hijacked />
        <h2 className="hijacked">0200</h2>
        <span className="call-status noisy">
          <VoiceBars who="sfx" />
          <time>{lineTime(clock)}</time>
        </span>
      </div>
      <div className="call-subs" aria-live="polite">
        <p className="sub sfx now">
          <span className="sub-text">(숨소리)</span>
        </p>
      </div>
      {toast && <p className="video-toast">통화를 종료할 수 없습니다</p>}
      <button type="button" className="openline-down" onClick={() => setRt({ openLine: false })}>
        화면 내리기
      </button>
      <button type="button" className="hangup" onClick={() => (sfx('error'), setToast(true))} aria-label="통화 종료">
        <CallIcon down />
      </button>
    </div>
  );
}

export function CallScreen() {
  const id = useGame((s) => s.rt.activeCall);
  return id ? <ActiveCall key={id} id={id} /> : null;
}

/** The contact's picture, blurred to fill the screen behind the call — like a real phone's contact poster. */
function CallBackdrop({ from, hijacked = false }: { from: string; hijacked?: boolean }) {
  const photo = from === 'dohyun' ? art('avatar-dohyun') : from === 'mom' ? art('miryeong-id') : undefined;
  return (
    <div className={`call-backdrop${hijacked ? ' hijacked' : ''}`} aria-hidden="true">
      {photo && !hijacked && <img src={photo} alt="" draggable={false} />}
    </div>
  );
}

/** Five bars that move while someone is talking on the line. */
function VoiceBars({ who }: { who: CallLine['who'] | null }) {
  return (
    <span className={`voice-bars${who ? ` talking ${who}` : ''}`} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <i key={i} style={{ animationDelay: `${(i * 0.13) % 0.5}s` }} />
      ))}
    </span>
  );
}

function ActiveCall({ id }: { id: string }) {
  const sound = useGame((s) => s.save.sound);
  // Each caption keeps the speaker it had when it was said (도현's lines stay 도현's after she takes over).
  const [lines, setLines] = useState<(CallLine & { label: string | null })[]>([]);
  const [choice, setChoice] = useState(false);
  const [phase, setPhase] = useState<'main' | 'after'>('main');
  const [picked, setPicked] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  // The moment the voice on 도현's line stops being 도현.
  const [hijacked, setHijacked] = useState(false);
  // Who is talking right now (for the voice bars), and whether the line is breaking up.
  const [talking, setTalking] = useState<CallLine['who'] | null>(null);
  const [noisy, setNoisy] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  // only the button: this game never touches the microphone
  const [muted, setMuted] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const quiet = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const call = CALLS[id] ?? null;

  useEffect(() => {
    if (!call) return;
    const script: CallLine[] = phase === 'main' ? call.lines : ((picked ? call.afterBy?.[picked] : undefined) ?? call.after ?? []);
    const clear = () => timers.current.forEach(clearTimeout);
    script.forEach((l) =>
      timers.current.push(
        setTimeout(() => {
          setLines((x) => [...x.slice(-2), { ...l, label: l.who === 'caller' ? call.label : l.who === 'other' ? '???' : null }]);
          if (l.who === 'sfx') sfx(l.text.includes('종료') ? 'hangup' : 'static');
          else if (sound && l.voice) speak(l.text, l.voice);
          // The bars move for about as long as the line takes to say.
          clearTimeout(quiet.current);
          const noise = l.who === 'sfx' && !l.text.includes('종료');
          setNoisy(noise);
          setTalking(l.who === 'sfx' ? null : l.who);
          quiet.current = setTimeout(
            () => {
              setTalking(null);
              setNoisy(false);
            },
            l.who === 'sfx' ? 1600 : Math.min(4200, 600 + l.text.length * 95),
          );
          // When *she* speaks on the line, her face flickers on the screen.
          // …and the speaker turns itself on: she wants to be heard in the room.
          if (l.who === 'other' && call.from === 'dohyun') {
            setHijacked(true);
            setSpeaker(true);
          }
          if (l.who === 'other' && call.from === 'dohyun') {
            setRt({ scare: { kind: 'reflect', nonce: Date.now() } });
            setTimeout(() => setRt({ scare: null }), 320);
          }
        }, l.at),
      ),
    );
    const last = script.length ? script[script.length - 1].at : 0;
    if (phase === 'main' && call.choice) {
      timers.current.push(setTimeout(() => setChoice(true), call.choice.at));
    } else {
      timers.current.push(
        setTimeout(() => {
          stopSpeech();
          endCall(call.id, true);
        }, last + 1400),
      );
    }
    return () => {
      clear();
      clearTimeout(quiet.current);
    };
    // `picked` is set together with the phase change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call, phase, sound]);

  useEffect(() => {
    if (!call) return;
    const t0 = Date.now();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 500);
    return () => clearInterval(iv);
  }, [call]);

  if (!call) return null;
  const pick = (opt: string) => {
    setChoice(false);
    sfx('key');
    emit(`call:${call.id}:choice:${opt}`);
    setPicked(opt);
    setPhase('after');
  };
  const hangUp = () => {
    timers.current.forEach(clearTimeout);
    stopSpeech();
    endCall(call.id, phase === 'after' || !call.choice);
  };
  const status = elapsed < 1 ? '연결 중…' : noisy ? '연결 상태 불안정' : `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
  return (
    <div className={`callscreen${hijacked ? ' hijacked' : ''}`} role="dialog" aria-label="통화 중">
      <CallBackdrop from={call.from} hijacked={hijacked} />
      <div className="call-top">
        <small className="call-kind">{hijacked || call.from === '0200' || call.from === 'dohyun' || call.from === 'mom' ? '휴대전화' : '저장되지 않은 번호'}</small>
        <CallAvatar from={hijacked ? '0200' : call.from} hijacked={hijacked} />
        <h2 className={hijacked ? 'hijacked' : undefined}>{hijacked ? '발신자 정보 없음' : call.label}</h2>
        <span className={`call-status${noisy ? ' noisy' : ''}`}>
          <VoiceBars who={talking} />
          <time>{status}</time>
        </span>
      </div>
      <div className="call-subs" aria-live="polite">
        {lines.map((l, i) => (
          <p key={`${l.at}-${i}`} className={`sub ${l.who}${i === lines.length - 1 ? ' now' : ' past'}${l.text.length > 32 ? ' long' : ''}`}>
            {l.label && <span className="sub-who">{l.label}</span>}
            <span className="sub-text">{l.text}</span>
          </p>
        ))}
      </div>
      {choice && call.choice ? (
        <div className="call-choices">
          {call.choice.options.map((o) => (
            <button key={o.id} type="button" className="choice" onClick={() => pick(o.id)}>
              {o.label}
            </button>
          ))}
        </div>
      ) : (
        // iOS's six: 스피커 · FaceTime · 소리 끔 / 더 보기 · 종료 · 키패드
        <div className="call-controls six">
          <button type="button" className={`call-ctl${speaker ? ' on' : ''}`} aria-pressed={speaker} onClick={() => (sfx('key'), setSpeaker((v) => !v))}>
            <span className="call-ctl-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
                <path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              </svg>
            </span>
            스피커
          </button>
          <button type="button" className="call-ctl" disabled>
            <span className="call-ctl-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="2.5" y="6.5" width="13" height="11" rx="2.5" fill="currentColor" />
                <path d="M16.5 10.5l5-3v9l-5-3z" fill="currentColor" />
              </svg>
            </span>
            FaceTime
          </button>
          <button type="button" className={`call-ctl${muted ? ' on' : ''}`} aria-pressed={muted} onClick={() => (sfx('key'), setMuted((v) => !v))}>
            <span className="call-ctl-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
                <path d="M6 11a6 6 0 0012 0M12 17v4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" />
                <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            소리 끔
          </button>
          <button type="button" className="call-ctl" disabled>
            <span className="call-ctl-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                {[6, 12, 18].map((x) => (
                  <circle key={x} cx={x} cy="12" r="1.9" fill="currentColor" />
                ))}
              </svg>
            </span>
            더 보기
          </button>
          <span className="call-ctl end">
            <button type="button" className="hangup" onClick={hangUp} aria-label="통화 종료">
              <CallIcon down />
            </button>
            종료
          </span>
          <button type="button" className="call-ctl" disabled>
            <span className="call-ctl-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={6 + c * 6} cy={5 + r * 6} r="1.7" fill="currentColor" />))}
                <circle cx="12" cy="23" r="1.7" fill="currentColor" />
              </svg>
            </span>
            키패드
          </button>
        </div>
      )}
      {choice && call.choice && (
        <button type="button" className="hangup" onClick={hangUp} aria-label="통화 종료">
          <CallIcon down />
        </button>
      )}
    </div>
  );
}

export function ChapterCard() {
  const card = useGame((s) => s.rt.chapterCard);
  if (!card) return null;
  return (
    <div key={card.nonce} className="chapter-card" aria-live="polite">
      <small>CHAPTER {card.n}</small>
      <h2>{card.title}</h2>
    </div>
  );
}

export function ScareOverlay() {
  const scare = useGame((s) => s.rt.scare);
  const reduce = useGame((s) => s.save.reduceFx);
  if (!scare) return null;
  // Big scares say which look; the small ones never show her face.
  const look = scare.look ?? (scare.kind === 'lunge' ? 'face' : 'curtain');
  return (
    <div key={scare.nonce} className={`scare scare-${scare.kind} look-${look}${reduce ? ' scare-reduced' : ''}`} aria-hidden="true">
      {scare.kind !== 'flash' && <GhostVisual className="ghost" look={look} />}
      {scare.kind === 'lunge' && <div className="scare-grain" />}
    </div>
  );
}

/** The phone restarting on its own: black, then a boot screen that isn't the phone's. */
export function RebootOverlay() {
  const on = useGame((s) => s.rt.rebooting);
  if (!on) return null;
  return (
    <div className="reboot" aria-live="polite">
      <div className="reboot-logo">
        <span>야간 출입 기록</span>
        <small>해원고 도서관 · 출입 기록 시스템</small>
      </div>
    </div>
  );
}

export function GlitchOverlay() {
  const until = useGame((s) => s.rt.glitchUntil);
  const reduce = useGame((s) => s.save.reduceFx);
  const [expired, setExpired] = useState(0);
  // One timer per glitch instead of a render loop running all game long.
  useEffect(() => {
    const t = setTimeout(() => setExpired(until), Math.max(0, until - Date.now()));
    return () => clearTimeout(t);
  }, [until]);
  if (reduce || expired >= until || until === 0) return null;
  return <div key={until} className="glitch" aria-hidden="true" />;
}

export function DialogView() {
  const dialog = useGame((s) => s.rt.dialog);
  if (!dialog) return null;
  return (
    <div className="dialog-back" role="alertdialog" aria-label={dialog.title}>
      <div className="dialog">
        <strong>{dialog.title}</strong>
        <p>{dialog.body}</p>
        <button type="button" onClick={() => setRt({ dialog: null })}>
          확인
        </button>
      </div>
    </div>
  );
}

/** Current objective + hint, so a stuck player is never lost. */
export function HintChip() {
  const obj = useGame((s) => s.save.objective);
  const open = useGame((s) => s.rt.hintOpen);
  const finale = useGame((s) => s.rt.finale);
  const busy = useGame((s) => s.rt.activeCall !== null || s.rt.incoming !== null || s.rt.app === 'memos');
  const now = useTicker(5000);
  const [full, setFull] = useState<string | null>(null);
  // No permanent game UI: the hint only surfaces after a real stall.
  // Tier 3 names the goal and where to look; tier 4 (the full hint) only when asked.
  if (!obj || finale || busy) return null;
  const stuck = now - obj.since > HINT_TIER_MS[2];
  if (!stuck && !open) return null;
  const showFull = full === obj.text;
  return (
    <>
      {!open && (
        <button type="button" className="hint-chip stuck" onClick={() => setRt({ hintOpen: true })} aria-expanded={false}>
          ? 막혔나요
        </button>
      )}
      {open && <button type="button" className="hint-scrim" aria-label="힌트 닫기" onClick={() => setRt({ hintOpen: false })} />}
      {open && (
        <div className="hint-sheet" role="dialog" aria-label="목표">
          <span className="hint-grab" aria-hidden="true" />
          <div className="hint-head">
            <small>지금 할 일</small>
            <button type="button" className="hint-close" onClick={() => setRt({ hintOpen: false })}>
              닫기
            </button>
          </div>
          <strong>{obj.text}</strong>
          {obj.app && !showFull && <p className="hint-app">살펴볼 곳: {appName(obj.app)}</p>}
          {showFull ? (
            <p>{obj.hint}</p>
          ) : (
            <button type="button" className="hint-more" onClick={() => setFull(obj.text)}>
              더 자세히 알려 줘요
            </button>
          )}
        </div>
      )}
    </>
  );
}
