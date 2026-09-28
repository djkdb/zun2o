import { useEffect, useRef, useState } from 'react';
import { useGame, useTicker } from '../hooks/useGame';
import { answerCall, declineCall, endCall, emit, openApp, openThread, sfx } from '../engine/director';
import { setRt } from '../engine/state';
import { CALLS } from '../content/calls';
import { GhostSvg } from '../art/Ghost';
import { speak, stopSpeech } from '../audio/speech';
import { THREAD_META } from '../content/threads';
import type { CallLine } from '../engine/types';
import { CallIcon } from './CallIcon';

export function BannerView() {
  const banner = useGame((s) => s.rt.banner);
  const finale = useGame((s) => s.rt.finale);
  useEffect(() => {
    if (!banner) return;
    const off = (e: PointerEvent) => {
      if (!(e.target instanceof Element && e.target.closest('.banner'))) setRt({ banner: null });
    };
    window.addEventListener('pointerdown', off, true);
    return () => window.removeEventListener('pointerdown', off, true);
  }, [banner]);
  if (!banner || finale) return null;
  const open = () => {
    setRt({ banner: null });
    if (banner.thread) openThread(banner.thread);
    else openApp(banner.app);
  };
  const avatar = banner.thread ? THREAD_META[banner.thread] : null;
  return (
    <button key={banner.id} type="button" className="banner" onClick={open}>
      <span className="banner-icon" style={{ background: avatar?.color ?? '#111' }}>
        {avatar?.avatar ?? '夜'}
      </span>
      <span className="banner-text">
        <strong>{banner.title}</strong>
        <span>{banner.body}</span>
      </span>
      <span className="banner-time">지금</span>
    </button>
  );
}

export function IncomingCall() {
  const id = useGame((s) => s.rt.incoming);
  if (!id) return null;
  const call = CALLS[id];
  return (
    <div className={`incoming${call.video ? ' video' : ''}`} role="dialog" aria-label="수신 전화">
      <div className="incoming-top">
        <span className="call-avatar">{call.label.slice(0, 1)}</span>
        <small>{call.video ? '영상 통화' : '휴대전화'}</small>
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

function ActiveCall({ id }: { id: string }) {
  const sound = useGame((s) => s.save.sound);
  const [lines, setLines] = useState<CallLine[]>([]);
  const [choice, setChoice] = useState(false);
  const [phase, setPhase] = useState<'main' | 'after'>('main');
  const [elapsed, setElapsed] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const call = CALLS[id] ?? null;

  useEffect(() => {
    if (!call) return;
    const script = phase === 'main' ? call.lines : call.after ?? [];
    const clear = () => timers.current.forEach(clearTimeout);
    script.forEach((l) =>
      timers.current.push(
        setTimeout(() => {
          setLines((x) => [...x.slice(-3), l]);
          if (l.who === 'sfx') sfx(l.text.includes('종료') ? 'hangup' : 'static');
          else if (sound && l.voice) speak(l.text, l.voice);
          // When *she* speaks on the line, her face flickers on the screen.
          if (l.who === 'other' && call.id === 'dohyun1') {
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
    return clear;
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
  return (
    <div className="callscreen" role="dialog" aria-label="통화 중">
      <div className="call-top">
        <span className="call-avatar">{call.label.slice(0, 1)}</span>
        <h2>{call.label}</h2>
        <small>
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
        </small>
      </div>
      <div className="call-subs" aria-live="polite">
        {lines.map((l, i) => (
          <p key={`${l.at}-${i}`} className={`sub ${l.who}`}>
            {l.who === 'caller' ? `${call.label}: ` : l.who === 'other' ? '??? : ' : ''}
            {l.text}
          </p>
        ))}
      </div>
      {choice && call.choice && (
        <div className="call-choices">
          {call.choice.options.map((o) => (
            <button key={o.id} type="button" className="choice" onClick={() => pick(o.id)}>
              {o.label}
            </button>
          ))}
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
  return (
    <div key={scare.nonce} className={`scare scare-${scare.kind}${reduce ? ' scare-reduced' : ''}`} aria-hidden="true">
      {scare.kind !== 'flash' && <GhostSvg className="ghost" distort />}
    </div>
  );
}

export function GlitchOverlay() {
  const until = useGame((s) => s.rt.glitchUntil);
  const reduce = useGame((s) => s.save.reduceFx);
  const now = useTicker(200);
  if (reduce || now > until) return null;
  return <div className="glitch" aria-hidden="true" />;
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
  // No permanent game UI: the hint only surfaces after a real stall.
  if (!obj || finale || busy) return null;
  const stuck = now - obj.since > 100000;
  if (!stuck && !open) return null;
  return (
    <>
      <button type="button" className="hint-chip stuck" onClick={() => setRt({ hintOpen: !open })} aria-expanded={open}>
        {open ? '닫기' : '? 막혔나요'}
      </button>
      {open && (
        <div className="hint-sheet" role="dialog" aria-label="목표">
          <small>지금 할 일</small>
          <strong>{obj.text}</strong>
          <p>{obj.hint}</p>
        </div>
      )}
    </>
  );
}
