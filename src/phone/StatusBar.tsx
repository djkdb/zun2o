import { useGame } from '../hooks/useGame';

export function StatusBar({ dark = false }: { dark?: boolean }) {
  const clock = useGame((s) => s.save.clock);
  const battery = useGame((s) => s.save.battery);
  const lost = useGame((s) => s.rt.lostNonce);
  const glitch = useGame((s) => s.rt.clockGlitch);
  const chapter = useGame((s) => s.save.chapter);
  const low = battery <= 10;
  // Signal fades the closer it gets to 02:00; in chapter 4 there is none.
  const bars = chapter >= 4 ? 0 : chapter >= 3 ? 1 : 2;
  return (
    <div className={`statusbar${dark ? ' dark' : ''}`}>
      <span key={lost} className={`sb-time${lost ? ' lost' : ''}${glitch ? ' glitched' : ''}`}>
        {glitch ?? clock}
      </span>
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
