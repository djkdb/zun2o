import { useGame } from '../hooks/useGame';

export function StatusBar({ dark = false }: { dark?: boolean }) {
  const clock = useGame((s) => s.save.clock);
  const battery = useGame((s) => s.save.battery);
  const lost = useGame((s) => s.rt.lostNonce);
  const low = battery <= 10;
  return (
    <div className={`statusbar${dark ? ' dark' : ''}`}>
      <span key={lost} className={`sb-time${lost ? ' lost' : ''}`}>
        {clock}
      </span>
      <span className="sb-right">
        <span className="sb-signal" aria-label="신호 약함">
          <i />
          <i />
          <i className="off" />
          <i className="off" />
        </span>
        <span className={`sb-battery${low ? ' low' : ''}`} aria-label={`배터리 ${battery}%`}>
          <span className="sb-battery-fill" style={{ width: `${battery}%` }} />
        </span>
        <span className="sb-pct">{battery}%</span>
      </span>
    </div>
  );
}
