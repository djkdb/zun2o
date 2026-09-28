import { useGame, useVisualLevel } from '../hooks/useGame';
import { listedRecords } from '../game/secretManager';

const STATUS = ['정상', '정상', '정상', '동기화 중', '동기화 임박', '개방'];
const ROOM = ['닫힘', '닫힘', '닫힘', '닫힘', '닫는 중', '근무 중'];

export function StatusPanel() {
  const level = useVisualLevel();
  const save = useGame((s) => s.save);
  const count = listedRecords(save).length;
  return (
    <section className="panel sidebar-extra" aria-label="보관소 상태">
      <h2 className="panel-title">보관소 상태</h2>
      <ul className="status-list">
        <li>
          <span>서버</span>
          <span className="mono">{STATUS[level]}</span>
        </li>
        <li>
          <span>공개 기록</span>
          <span className="mono">{level >= 2 && count < 10 ? `${count} (+1?)` : count}</span>
        </li>
        <li>
          <span>열람실</span>
          <span className="mono">{ROOM[level]}</span>
        </li>
        <li>
          <span>내 방문 횟수</span>
          <span className="mono">{save.visitCount}</span>
        </li>
      </ul>
    </section>
  );
}
