import { useAnomaly, useGame, useVisualLevel } from '../hooks/useGame';
import { setReduceEffects } from '../game/store';
import { href } from '../utils/router';

const BASE_VISITORS = 4381;

export function Footer() {
  const level = useVisualLevel();
  const anomaly = useAnomaly('footer');
  const visits = useGame((s) => s.save.visitCount);
  const reduce = useGame((s) => s.save.reduceEffects);
  const staff = useGame((s) => s.save.flags.includes('system-unlocked'));
  const counter =
    anomaly?.effect === 'visitors-tonight' ? 'Visitors tonight: 2' : `Visitors since 1996: ${String(BASE_VISITORS + visits).padStart(6, '0').replace(/(\d{3})(\d{3})/, '$1,$2')}`;
  return (
    <footer className="footer">
      <div>
        © 1996–2004 The Night Archive · Last updated 02 Nov 2004 · {level >= 3 ? 'Best viewed at night' : 'Best viewed at 1024×768'}
        <br />
        <span className="counter">{counter}</span>
      </div>
      <div className="footer-links">
        {staff && <a href={href('/system')}>staff terminal</a>}
        <button type="button" className="text-button" aria-pressed={reduce} onClick={() => setReduceEffects(!reduce)}>
          {reduce ? 'Effects: reduced' : 'Reduce effects'}
        </button>
        <a href={href('/about')}>Privacy</a>
      </div>
    </footer>
  );
}
