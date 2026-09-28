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
    anomaly?.effect === 'visitors-tonight' ? '오늘 밤 방문자: 2명' : `1996년 이후 방문자: ${String(BASE_VISITORS + visits).padStart(6, '0').replace(/(\d{3})(\d{3})/, '$1,$2')}`;
  return (
    <footer className="footer">
      <div>
        © 1996–2004 심야 기록보관소 · 최종 수정 2004.11.02 · {level >= 3 ? '밤에 보시기를 권장합니다' : '1024×768 해상도에 최적화'}
        <br />
        <span className="counter">{counter}</span>
      </div>
      <div className="footer-links">
        {staff && <a href={href('/system')}>직원용 단말기</a>}
        <button type="button" className="text-button" aria-pressed={reduce} onClick={() => setReduceEffects(!reduce)}>
          {reduce ? '효과: 줄임' : '효과 줄이기'}
        </button>
        <a href={href('/about')}>개인정보</a>
      </div>
    </footer>
  );
}
