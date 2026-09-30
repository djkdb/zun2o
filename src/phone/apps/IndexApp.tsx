import { useGame } from '../../hooks/useGame';
import { openApp } from '../../engine/director';
import { fill } from '../../engine/state';

export function IndexApp() {
  const name = useGame((s) => s.save.playerName);
  const clock = useGame((s) => s.save.clock);
  const dohyun = useGame((s) => s.save.flags.includes('dohyun-in'));
  return (
    <div className="index-app">
      <button type="button" className="index-back" onClick={() => openApp(null)}>
        ‹ 닫기
      </button>
      <pre className="index-screen">{`야간 색인 v2.3 — 해원군청 별관
────────────────────────────
방문자 #0024  김수연      근무 종료  2024.09
방문자 #0025  박현우      근무 종료  09.27 02:00
방문자 #0026  윤채원      근무 중
방문자 #0027  ${(name ?? '(이름 없음)').padEnd(10, ' ')} 도착 · 폰 습득 ${fill('{start}')}
${dohyun ? '대기        박도현      02호실 입실  01:56\n' : ''}────────────────────────────
등록 규칙: 부스의 폰을 주운 사람은 방문자가 된다.
근무 교대 예정 시각   02:00
현재 시각             ${clock}

연장 열쇠 입력은 02:00에만 가능합니다.`}</pre>
      <p className="index-blink">▌</p>
    </div>
  );
}
