import { useState } from 'react';
import {
  debugResetSave,
  debugResetTime,
  debugSetTime,
  debugTriggerMainEvent,
  debugUnlockAll,
  fireAnomalyById,
  setLevelOverride,
  triggerRandomAnomaly,
  unlockEnding,
} from '../game/store';
import { useGame } from '../hooks/useGame';
import { useLocalTime } from '../hooks/useLocalTime';
import { currentEnding } from '../game/endingManager';
import { ANOMALIES } from '../data/anomalies';
import { LEVEL_NAMES, type EndingId, type HorrorLevel, type SecretId } from '../game/types';
import { formatClock, formatDuration, partsOf } from '../utils/time';
import { navigate } from '../utils/router';

// Visible only with ?debug=true. Everything the QA checklist needs to reach
// any state in seconds instead of waiting for 02:00.

const TIMES: [string, number, number, number][] = [
  ['12:00', 12, 0, 0],
  ['01:30', 1, 30, 0],
  ['01:45', 1, 45, 0],
  ['01:55', 1, 55, 0],
  ['01:59', 1, 59, 0],
  ['01:59:50', 1, 59, 50],
  ['02:03', 2, 3, 0],
  ['03:10', 3, 10, 0],
];

export function DebugPanel() {
  const [open, setOpen] = useState(true);
  const now = useLocalTime();
  const session = useGame((s) => s.session);
  const save = useGame((s) => s.save);
  const [lastRandom, setLastRandom] = useState<string | null>(null);
  const [pick, setPick] = useState(ANOMALIES[0].id);

  if (!open) {
    return (
      <button type="button" className="debug-fab" onClick={() => setOpen(true)} aria-label="Open debug panel">
        DBG L{session.level}
      </button>
    );
  }

  const secrets = (Object.keys(save.secretProgress) as SecretId[]).map((id) => `${id}:${save.secretProgress[id].found ? '✓' : '·'}`).join(' ');
  const testEnding = (id: EndingId) => {
    unlockEnding(id);
    navigate(`/ending/${id}`);
  };

  return (
    <aside className="debug" aria-label="Debug panel">
      <div className="debug-head">
        <strong>DEBUG</strong>
        <button type="button" onClick={() => setOpen(false)} aria-label="Collapse debug panel">
          —
        </button>
      </div>
      <dl className="debug-stats">
        <dt>HORROR LEVEL</dt>
        <dd>
          {session.level} · {LEVEL_NAMES[session.level]}
          {session.levelOverride !== null ? ' (override)' : ''}
        </dd>
        <dt>CURRENT TIME</dt>
        <dd>
          {formatClock(partsOf(new Date(now)))} · {session.phase}
        </dd>
        <dt>VISIT COUNT</dt>
        <dd>{save.visitCount}</dd>
        <dt>SESSION TIME</dt>
        <dd>{formatDuration(session.sessionSeconds * 1000)}</dd>
        <dt>CLICKS</dt>
        <dd>{save.clickCount}</dd>
        <dt>MAIN EVENT</dt>
        <dd>{session.mainEvent.stage}</dd>
        <dt>RECORDS</dt>
        <dd>{save.discoveredRecords.join(' ') || '—'}</dd>
        <dt>SEQUENCE</dt>
        <dd>{save.recordSequence.slice(-6).join('→') || '—'}</dd>
        <dt>SECRETS</dt>
        <dd>{secrets}</dd>
        <dt>FLAGS</dt>
        <dd>{save.flags.join(', ') || '—'}</dd>
        <dt>ENDINGS</dt>
        <dd>
          {save.endingUnlocked.join(', ') || '—'} · leaning: {currentEnding(save, session.phase)}
        </dd>
        <dt>ANOMALIES</dt>
        <dd>
          {save.discoveredAnomalies.length}/{ANOMALIES.length} found · active: {Object.values(session.active).map((a) => a?.id).join(', ') || '—'}
        </dd>
      </dl>
      <div className="debug-group" role="group" aria-label="Force level">
        {([0, 1, 2, 3, 4, 5] as HorrorLevel[]).map((l) => (
          <button key={l} type="button" aria-pressed={session.levelOverride === l} onClick={() => setLevelOverride(l)}>
            L{l}
          </button>
        ))}
        <button type="button" onClick={() => setLevelOverride(null)}>
          auto
        </button>
      </div>
      <div className="debug-group" role="group" aria-label="Set time">
        {TIMES.map(([label, h, m, s]) => (
          <button key={label} type="button" onClick={() => debugSetTime(h, m, s)}>
            {label}
          </button>
        ))}
        <button type="button" onClick={debugResetTime}>
          real
        </button>
      </div>
      <div className="debug-group">
        <button type="button" className="danger" onClick={debugTriggerMainEvent}>
          Trigger 02:00
        </button>
        <button type="button" onClick={() => setLastRandom(triggerRandomAnomaly() ?? 'none eligible')}>
          Random anomaly
        </button>
        <button type="button" className="danger" onClick={() => fireAnomalyById('tape-lunge')}>
          Jump scare
        </button>
        <button type="button" onClick={() => fireAnomalyById('ghost-stare')}>
          Stare
        </button>
        <button type="button" onClick={() => fireAnomalyById('ghost-peek')}>
          Peek
        </button>
      </div>
      <div className="debug-group">
        <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Anomaly">
          {ANOMALIES.map((a) => (
            <option key={a.id} value={a.id}>
              {a.id}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => fireAnomalyById(pick)}>
          Fire
        </button>
      </div>
      {lastRandom && <p className="debug-note">fired: {lastRandom}</p>}
      <div className="debug-group">
        <button type="button" onClick={debugUnlockAll}>
          Unlock all
        </button>
        <button type="button" className="danger" onClick={debugResetSave}>
          Reset save
        </button>
      </div>
      <div className="debug-group" role="group" aria-label="Test ending">
        <button type="button" onClick={() => testEnding('normal')}>
          End: normal
        </button>
        <button type="button" onClick={() => testEnding('secret')}>
          End: secret
        </button>
        <button type="button" onClick={() => testEnding('true')}>
          End: true
        </button>
      </div>
      <details className="debug-log">
        <summary>Triggered events ({session.triggeredLog.length})</summary>
        <ol>
          {session.triggeredLog
            .slice()
            .reverse()
            .map((e, i) => (
              <li key={`${e.at}-${i}`}>
                {formatClock(partsOf(new Date(e.at)))} {e.id} <span>({e.source})</span>
              </li>
            ))}
        </ol>
      </details>
    </aside>
  );
}
