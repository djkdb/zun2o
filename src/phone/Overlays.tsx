import { useEffect, useRef, useState } from 'react';
import { useGame, useTicker } from '../hooks/useGame';
import { answerCall, declineCall, endCall, emit, HINT_TIER_MS, openApp, openThread, sfx } from '../engine/director';
import { setRt } from '../engine/state';
import { CALLS } from '../content/calls';
import { GhostVisual } from '../art/Ghost';
import { speak, stopSpeech } from '../audio/speech';
import type { CallLine } from '../engine/types';
import { CallIcon } from './CallIcon';
import { Avatar } from './Avatar';
import { APP_META, AppGlyph } from './icons';
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
  const th = from === 'dohyun' ? 'dohyun' : from === '0200' ? 'unknown' : null;
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

export function IncomingCall() {
  const id = useGame((s) => s.rt.incoming);
  if (!id) return null;
  const call = CALLS[id];
  return (
    <div className={`incoming${call.video ? ' video' : ''}`} role="dialog" aria-label="수신 전화">
      {!call.video && <CallBackdrop from={call.from} />}
      <div className="incoming-top">
        <CallAvatar from={call.from} />
        <small>{call.video ? '영상 통화' : call.from === '0200' ? '발신자 정보 없음' : '휴대전화'}</small>
        <h2>{call.label}</h2>
      </div>
      <div className="incoming-actions">
        <button type="button" className="decline" onClick={declineCall} aria-label="거절">
          <CallIcon down />
        </button>
        <button type="button" className="accept" onClick={answerCall} aria-label="받기">
          <CallIcon />
        </button>
      </div>
    </div>
  );
}

/** Plays a CallScript: timed subtitle lines, optional mid-call choice. */
export function CallScreen() {
  const id = useGame((s) => s.rt.activeCall);
  return id ? <ActiveCall key={id} id={id} /> : null;
}

/** The contact's picture, blurred to fill the screen behind the call — like a real phone's contact poster. */
function CallBackdrop({ from, hijacked = false }: { from: string; hijacked?: boolean }) {
  const photo = from === 'dohyun' ? art('avatar-dohyun') : undefined;
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
  const [lines, setLines] = useState<CallLine[]>([]);
  const [choice, setChoice] = useState(false);
  const [phase, setPhase] = useState<'main' | 'after'>('main');
  const [elapsed, setElapsed] = useState(0);
  // The moment the voice on 도현's line stops being 도현.
  const [hijacked, setHijacked] = useState(false);
  // Who is talking right now (for the voice bars), and whether the line is breaking up.
  const [talking, setTalking] = useState<CallLine['who'] | null>(null);
  const [noisy, setNoisy] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const quiet = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const call = CALLS[id] ?? null;

  useEffect(() => {
    if (!call) return;
    const script = phase === 'main' ? call.lines : call.after ?? [];
    const clear = () => timers.current.forEach(clearTimeout);
    script.forEach((l) =>
      timers.current.push(
        setTimeout(() => {
          setLines((x) => [...x.slice(-2), l]);
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
    setPhase('after');
  };
  const hangUp = () => {
    timers.current.forEach(clearTimeout);
    stopSpeech();
    endCall(call.id, phase === 'after' || !call.choice);
  };
  const who = (l: CallLine) => (l.who === 'caller' ? (hijacked ? '???' : call.label) : l.who === 'other' ? '???' : null);
  const status = elapsed < 1 ? '연결 중…' : noisy ? '연결 상태 불안정' : `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
  return (
    <div className={`callscreen${hijacked ? ' hijacked' : ''}`} role="dialog" aria-label="통화 중">
      <CallBackdrop from={call.from} hijacked={hijacked} />
      <div className="call-top">
        <small className="call-kind">{hijacked || call.from === '0200' ? '발신자 정보 없음' : call.from === 'dohyun' ? '휴대전화' : '저장되지 않은 번호'}</small>
        <CallAvatar from={hijacked ? '0200' : call.from} hijacked={hijacked} />
        <h2 className={hijacked ? 'hijacked' : undefined}>{hijacked ? '발신자 표시제한' : call.label}</h2>
        <span className={`call-status${noisy ? ' noisy' : ''}`}>
          <VoiceBars who={talking} />
          <time>{status}</time>
        </span>
      </div>
      <div className="call-subs" aria-live="polite">
        {lines.map((l, i) => (
          <p key={`${l.at}-${i}`} className={`sub ${l.who}${i === lines.length - 1 ? ' now' : ' past'}`}>
            {who(l) && <span className="sub-who">{who(l)}</span>}
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
        <div className="call-controls">
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
                {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <circle key={`${r}${c}`} cx={6 + c * 6} cy={5 + r * 6} r="1.7" fill="currentColor" />))}
                <circle cx="12" cy="23" r="1.7" fill="currentColor" />
              </svg>
            </span>
            키패드
          </button>
          <button type="button" className="call-ctl" disabled>
            <span className="call-ctl-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            통화 추가
          </button>
        </div>
      )}
      <button type="button" className="hangup" onClick={hangUp} aria-label="통화 종료">
        <CallIcon down />
      </button>
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
        <span>야간 색인</span>
        <small>해원군청 별관 · 방문자 등록 시스템</small>
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
      <button type="button" className="hint-chip stuck" onClick={() => setRt({ hintOpen: !open })} aria-expanded={open}>
        {open ? '닫기' : '? 막혔나요'}
      </button>
      {open && (
        <div className="hint-sheet" role="dialog" aria-label="목표">
          <small>지금 할 일</small>
          <strong>{obj.text}</strong>
          {obj.app && !showFull && <p className="hint-app">살펴볼 곳: {APP_META[obj.app].name}</p>}
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
