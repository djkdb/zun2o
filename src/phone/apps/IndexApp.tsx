import { useGame } from '../../hooks/useGame';
import { openApp } from '../../engine/director';

export function IndexApp() {
  const name = useGame((s) => s.save.playerName);
  const clock = useGame((s) => s.save.clock);
  return (
    <div className="index-app">
      <button type="button" className="index-back" onClick={() => openApp(null)}>
        ‹ 닫기
      </button>
      <pre className="index-screen">{`야간 색인 v2.3 — 해원군청 별관
────────────────────────────
방문자 #0026  윤채원      근무 대기
방문자 #0027  ${(name ?? '(이름 없음)').padEnd(10, ' ')} 도착
────────────────────────────
근무 교대 예정 시각   02:00
현재 시각             ${clock}

연장 열쇠 입력은 02:00에만 가능합니다.`}</pre>
      <p className="index-blink">▌</p>
    </div>
  );
}
