import { useGame, useVisualLevel } from '../hooks/useGame';
import { listedRecords } from '../game/secretManager';

const STATUS = ['ONLINE', 'ONLINE', 'ONLINE', 'SYNCING', 'SYNC IMMINENT', 'OPEN'];
const ROOM = ['closed', 'closed', 'closed', 'closed', 'closing', 'staffed'];

export function StatusPanel() {
  const level = useVisualLevel();
  const save = useGame((s) => s.save);
  const count = listedRecords(save).length;
  return (
    <section className="panel sidebar-extra" aria-label="Archive status">
      <h2 className="panel-title">Archive status</h2>
      <ul className="status-list">
        <li>
          <span>Server</span>
          <span className="mono">{STATUS[level]}</span>
        </li>
        <li>
          <span>Records online</span>
          <span className="mono">{level >= 2 && count < 10 ? `${count} (+1?)` : count}</span>
        </li>
        <li>
          <span>Reading room</span>
          <span className="mono">{ROOM[level]}</span>
        </li>
        <li>
          <span>Your visits</span>
          <span className="mono">{save.visitCount}</span>
        </li>
      </ul>
    </section>
  );
}
