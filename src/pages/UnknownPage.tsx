import { useState } from 'react';
import { useGame, useVisualLevel } from '../hooks/useGame';
import { useLocalTime } from '../hooks/useLocalTime';
import { playSound, unlockEnding } from '../game/store';
import { canReachEnding } from '../game/endingManager';
import { fillTemplate } from '../game/template';
import { SECRET_BY_ID } from '../data/secrets';
import { navigate, href } from '../utils/router';
import { formatDuration, formatHM, msUntilNextTwo } from '../utils/time';
import type { SecretId } from '../game/types';

// Record 017 — the end of the index. It only fully exists at 02:00.

export function UnknownPage() {
  const level = useVisualLevel();
  const save = useGame((s) => s.save);
  const phase = useGame((s) => s.session.phase);
  const override = useGame((s) => s.session.levelOverride);
  const now = useLocalTime();
  const [accepting, setAccepting] = useState(false);
  const foundA = save.secretProgress.A.found;
  const night = level >= 5;
  const trueReady = canReachEnding('true', save, override === 5 ? 'after' : phase);

  if (save.flags.includes('ending-true')) {
    return (
      <article className="unknown-page prose">
        <div className="record-kicker">Record #017</div>
        <h2 className="record-title">Night Shift</h2>
        <p>Assigned. Night archivist: VISITOR #{String(save.visitCount).padStart(4, '0')}.</p>
        <p>Your shift begins at 02:00. Please do not be late. Someone will be waiting.</p>
      </article>
    );
  }

  if (!foundA) {
    return (
      <article className="unknown-page">
        <div className="access-panel" role="alert">
          <div className="stamp">NO SUCH RECORD</div>
          <p>The index ends at 009. Doesn’t it?</p>
          <p>
            <a href={href('/records')}>Return to the index</a>
          </p>
        </div>
      </article>
    );
  }

  if (!night) {
    return (
      <article className="unknown-page prose">
        <div className="record-kicker">Record #017</div>
        <h2 className="record-title">[PENDING]</h2>
        <p>This record is written at 02:00. It is not 02:00.</p>
        <p className="mono">Time until 02:00 — {formatDuration(msUntilNextTwo(new Date(now)))}</p>
        <p className="small">Come back then. Leave the tab open if you like. The archive will wait with you.</p>
      </article>
    );
  }

  const missing = (['A', 'B', 'C'] as SecretId[]).filter((id) => !save.secretProgress[id].found);
  const accept = () => {
    setAccepting(true);
    playSound('ending');
    setTimeout(() => {
      unlockEnding('true');
      navigate('/ending/true');
    }, 2600);
  };
  const decline = () => {
    unlockEnding('normal');
    navigate('/ending/normal');
  };

  return (
    <article className="unknown-page prose">
      <div className="record-kicker">Record #017 · written {formatHM(new Date(now))}</div>
      <h2 className="record-title">Night Shift</h2>
      <table className="data-table">
        <tbody>
          <tr>
            <th scope="row">Subject</th>
            <td>{fillTemplate('VISITOR #{visitCount}', { save, now })}</td>
          </tr>
          <tr>
            <th scope="row">First arrived</th>
            <td>{fillTemplate('{firstVisitTime}, {firstVisitDate}', { save, now })}</td>
          </tr>
          <tr>
            <th scope="row">Records opened</th>
            <td>{save.discoveredRecords.length}</td>
          </tr>
          <tr>
            <th scope="row">Relieves</th>
            <td>VARGA, I. (on shift since 14/03/1994 02:00)</td>
          </tr>
          <tr>
            <th scope="row">Status</th>
            <td>{accepting ? 'ACCEPTED' : 'OFFERED'}</td>
          </tr>
        </tbody>
      </table>
      <p>Somebody has to stay on shift until the next visitor comes. She has stayed for a very long time.</p>
      {save.secretProgress.D.found && <p>You have seen ROOM 02. You know what the job is.</p>}
      {trueReady ? (
        <p className="accept-shift">
          <button type="button" className="btn" onClick={accept} disabled={accepting}>
            {accepting ? 'Filing…' : '[ Accept the shift ]'}
          </button>{' '}
          <button type="button" className="text-button" onClick={decline} disabled={accepting}>
            Leave
          </button>
        </p>
      ) : (
        <div className="notice">
          The shift cannot be offered yet. The index is missing:
          {'\n'}
          {missing.map((id) => `— ${SECRET_BY_ID[id].hint}`).join('\n')}
        </div>
      )}
    </article>
  );
}
