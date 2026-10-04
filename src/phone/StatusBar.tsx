import { useEffect, useState } from 'react';
import { useGame } from '../hooks/useGame';
import { setRt } from '../engine/state';

/** How long the 0200 call from 23:53 has been going, by the phone's clock (seconds from the real one). */
export function lineTime(clock: string): string {
  const [h, m] = clock.split(':').map(Number);
  const mins = ((h * 60 + m - (23 * 60 + 53)) % 1440 + 1440) % 1440;
  const ss = String(new Date().getSeconds()).padStart(2, '0');
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}:${ss}`;
}

export function StatusBar({ dark = false }: { dark?: boolean }) {
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
  const low = battery <= 10;
  // Signal fades the closer it gets to 02:00; in chapter 4 there is none.
  const bars = chapter >= 4 ? 0 : chapter >= 3 ? 1 : 2;
  return (
    <div className={`statusbar${dark ? ' dark' : ''}`}>
      {openLine ? (
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
        <span className={`sb-battery${low ? ' low' : ''}`} aria-label={`배터리 ${battery}%`}>
          <span className="sb-battery-fill" style={{ width: `${battery}%` }} />
        </span>
        <span className="sb-pct">{battery}%</span>
      </span>
    </div>
  );
}
