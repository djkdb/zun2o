import { useEffect, useState, useSyncExternalStore } from 'react';
import { useGame } from '../hooks/useGame';
import { setRt } from '../engine/state';

/** How long the 0200 call from 23:53 has been going, by the phone's clock (seconds from the real one). */
export function lineTime(clock: string): string {
  const [h, m] = clock.split(':').map(Number);
  const mins = ((h * 60 + m - (23 * 60 + 53)) % 1440 + 1440) % 1440;
  const ss = String(new Date().getSeconds()).padStart(2, '0');
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}:${ss}`;
}

/**
 * The drawn Dynamic Island belongs to the desktop phone frame only. On a real phone the
 * hardware island is already there — above the browser bar, or in the safe area when
 * installed — and a second one would just sit on top of the screen's own content.
 */
const FRAME = '(min-width: 700px) and (min-height: 600px)';
function islandShown(): boolean {
  const notch = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sat')) > 12;
  return !notch && window.matchMedia(FRAME).matches;
}
function onFrameChange(cb: () => void) {
  const mq = window.matchMedia(FRAME);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
export function useIsland(): boolean {
  return useSyncExternalStore(onFrameChange, islandShown, () => false);
}

/**
 * The Dynamic Island: hardware, so above everything on the screen. Like a real
 * call in the background, the line that never hung up lives in it.
 */
export function Island() {
  const clock = useGame((s) => s.save.clock);
  const openLine = useGame((s) => s.save.flags.includes('open-line') && !s.rt.finale && !s.rt.ending && !s.rt.openLine && !s.rt.activeCall && !s.rt.incoming);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!openLine) return;
    const iv = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(iv);
  }, [openLine]);
  const shown = useIsland();
  if (!shown) return null;
  if (!openLine) return <span className="island" aria-hidden="true" />;
  return (
    <button type="button" className="island live sb-call" onClick={() => setRt({ openLine: true })} aria-label={`통화 중 0200, ${lineTime(clock)}`}>
      <span className="island-call" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 013 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" fill="currentColor" />
        </svg>
        {lineTime(clock)}
      </span>
      <span className="island-wave" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <i key={i} style={{ animationDelay: `${i * 0.17}s` }} />
        ))}
      </span>
    </button>
  );
}

export function StatusBar({ dark = false, lock = false }: { dark?: boolean; lock?: boolean }) {
  const clock = useGame((s) => s.save.clock);
  // Chapter 4: the call that took your 38 minutes never ended. The clock becomes a green call pill.
  const openLine = useGame((s) => s.save.flags.includes('open-line') && !s.rt.finale && !s.rt.ending);
  const [, tick] = useState(0);
  useEffect(() => {
    if (!openLine) return;
    const iv = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(iv);
  }, [openLine]);
  const battery = useGame((s) => s.save.battery);
  const lost = useGame((s) => s.rt.lostNonce);
  const glitch = useGame((s) => s.rt.clockGlitch);
  const chapter = useGame((s) => s.save.chapter);
  const low = battery <= 20;
  // Signal fades the closer it gets to 02:00; in chapter 4 there is none.
  const bars = chapter >= 4 ? 0 : chapter >= 3 ? 1 : 2;
  const notch = !useIsland();
  return (
    // (on the lock screen the big clock is the time: the bar leaves its corner empty, like a real one)
    <div className={`statusbar${dark ? ' dark' : ''}${lock ? ' on-lock' : ''}`}>
      {openLine && notch ? (
        <button type="button" className="sb-time sb-call" onClick={() => setRt({ openLine: true })} aria-label={`통화 중 0200, ${lineTime(clock)}`}>
          0200 · {lineTime(clock)}
        </button>
      ) : (
        <span key={lost} className={`sb-time${lost ? ' lost' : ''}${glitch ? ' glitched' : ''}`}>
          {glitch ?? clock}
        </span>
      )}
      <span className="sb-right">
        {bars === 0 ? (
          <span className="sb-sos" aria-label="서비스 없음">
            SOS
          </span>
        ) : (
          <span className="sb-signal" aria-label="신호 약함">
            {[0, 1, 2, 3].map((i) => (
              <i key={i} className={i < bars ? undefined : 'off'} />
            ))}
          </span>
        )}
        {/* the percentage inside the battery, like iOS with 배터리 잔량 표시 on */}
        <span className={`sb-battery${low ? ' low' : ''}`} role="img" aria-label={`배터리 ${battery}%`}>
          <span className="sb-battery-fill" style={{ width: `${battery}%` }} />
          <span className="sb-pct">{battery}</span>
        </span>
      </span>
    </div>
  );
}
