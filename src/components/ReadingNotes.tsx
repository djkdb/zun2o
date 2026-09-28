import { useState } from 'react';
import { useGame, useVisualLevel } from '../hooks/useGame';
import { useLocalTime } from '../hooks/useLocalTime';
import { getOffset } from '../game/clock';
import { nextHint } from '../data/hints';
import { ANOMALIES } from '../data/anomalies';
import { ENDINGS } from '../data/endings';

// 열람 수첩 — 진행도와 다음 단서. 처음 온 사람이 "뭘 해야 하지?"에서
// 멈추지 않도록, 그러나 답은 말하지 않도록.

function initiallyOpen(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return true;
  return window.matchMedia('(min-width: 861px)').matches;
}

export function ReadingNotes() {
  const level = useVisualLevel();
  const save = useGame((s) => s.save);
  const phase = useGame((s) => s.session.phase);
  const lastDiscovery = useGame((s) => s.session.lastDiscovery);
  const now = useLocalTime();
  const [open] = useState(initiallyOpen);

  const anomalies = save.discoveredAnomalies.length;
  const secrets = Object.values(save.secretProgress).filter((p) => p.found).length;
  const endings = save.endingUnlocked.length;
  const justSaw = lastDiscovery !== null && now - getOffset() - lastDiscovery.at < 5000;

  return (
    <details className={`panel notes${justSaw ? ' notes-flash' : ''}`} open={open}>
      <summary>
        <span className="panel-title">열람 수첩</span>
        <span className="notes-summary">
          이상 {anomalies} · 비밀 {secrets}/4 · 엔딩 {endings}/{ENDINGS.length}
        </span>
      </summary>
      <ul className="status-list">
        <li>
          <span>발견한 이상현상</span>
          <span className="mono">
            {anomalies} / {ANOMALIES.length}
          </span>
        </li>
        <li>
          <span>찾은 비밀</span>
          <span className="mono">{secrets} / 4</span>
        </li>
        <li>
          <span>본 엔딩</span>
          <span className="mono">
            {endings} / {ENDINGS.length}
          </span>
        </li>
      </ul>
      <p className="notes-alert" aria-live="polite">
        {justSaw ? '방금, 무언가 이상하지 않았나요? (+1)' : ' '}
      </p>
      <p className="notes-hint">
        <span className="notes-label">다음 단서</span>
        {nextHint(save, level, phase, now)}
      </p>
    </details>
  );
}
