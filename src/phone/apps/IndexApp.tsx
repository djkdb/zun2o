import { useGame } from '../../hooks/useGame';
import { openApp } from '../../engine/director';
import { fill } from '../../engine/state';

/** Minutes left until 02:00 on the phone's clock. */
function untilTwo(clock: string): number {
  const [h, m] = clock.split(':').map(Number);
  const now = h * 60 + m;
  return now >= 12 * 60 ? 24 * 60 - now + 120 : Math.max(0, 120 - now);
}

type Row = { no: string; name: string; status: string; tone: 'done' | 'on' | 'new' | 'wait' | 'index' };

// The index's own screen: a green terminal in the Annex that nobody switched off.
export function IndexApp() {
  const name = useGame((s) => s.save.playerName);
  const clock = useGame((s) => s.save.clock);
  const dohyun = useGame((s) => s.save.flags.includes('dohyun-in'));
  const rows: Row[] = [
    { no: '#0001', name: '서미령', status: '1994.03.14부터 안에 있음', tone: 'index' },
    { no: '#0024', name: '김수연', status: '풀려남 2024.09', tone: 'done' },
    { no: '#0025', name: '박현우', status: '풀려남 09.27 02:00', tone: 'done' },
    { no: '#0026', name: '윤채원', status: '안에 있음', tone: 'on' },
    { no: '#0027', name: name ?? '(이름 없음)', status: `도착 ${fill('{start}')} (당신 시계)`, tone: 'new' },
    ...(dohyun ? [{ no: '#0028', name: '박도현', status: '들어옴 01:56', tone: 'wait' as const }] : []),
  ];
  const left = untilTwo(clock);
  return (
    <div className="index-app">
      <div className="index-bar">
        <button type="button" className="index-back" onClick={() => openApp(null)}>
          ‹ 닫기
        </button>
        <span className="index-title">야간 출입 기록</span>
        <span className="index-rec" aria-hidden="true">
          ● REC
        </span>
      </div>
      <p className="index-sub">해원고 도서관 · 지금 안에 있는 사람</p>
      <ul className="index-table">
        {rows.map((r) => (
          <li key={r.no + r.name} className={`index-row ${r.tone}`}>
            <span className="index-no">{r.no}</span>
            <span className="index-name">{r.name}</span>
            <span className="index-status">{r.status}</span>
          </li>
        ))}
      </ul>
      <div className="index-count">
        <small>다음 이름이 적히기까지</small>
        <strong>{left === 0 ? '지금' : `${left}분`}</strong>
        <small>현재 시각 {clock} · 기록 02:00</small>
      </div>
      <div className="index-rules">
        <p>매일 02:00, 학교 안에 있는 사람 한 명의 이름이 기록된다.</p>
        <p>이름이 기록된 사람은 도서관을 나갈 수 없다. 다음 사람이 기록되면 풀려난다.</p>
        <p>정문 부스의 폰을 주운 사람도 들어온 것으로 본다.</p>
        <p>삭제 코드 입력은 02:00에만 가능하다.</p>
      </div>
      <p className="index-prompt">
        &gt; <span className="index-blink">▌</span>
      </p>
    </div>
  );
}
