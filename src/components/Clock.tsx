import { memo } from 'react';
import { useAnomaly, useMainEventStage, useVisualLevel } from '../hooks/useGame';
import { useLocalTime } from '../hooks/useLocalTime';
import { getOffset } from '../game/clock';
import { formatClock, formatDuration, msUntilNextTwo, partsOf, secondsOfDay } from '../utils/time';

const FROZEN = '02:00:00';

function ClockInner() {
  const now = useLocalTime();
  const level = useVisualLevel();
  const stage = useMainEventStage();
  const anomaly = useAnomaly('clock');

  const eventFrozen = stage !== 'idle' && stage !== 'done';
  const nightMode = level >= 5 && !eventFrozen;
  let display = formatClock(partsOf(new Date(now)));
  let sync = formatDuration(msUntilNextTwo(new Date(now)));
  let syncLabel = 'Next archive sync';

  if (anomaly && !eventFrozen) {
    const startVirtual = anomaly.startedAt + getOffset();
    switch (anomaly.effect) {
      case 'offset':
        display = formatClock(partsOf(new Date(now + Number(anomaly.payload?.seconds ?? -1) * 1000)));
        break;
      case 'freeze':
        display = formatClock(partsOf(new Date(startVirtual)));
        break;
      case 'jump':
        display = FROZEN;
        break;
      case 'reverse':
        display = formatClock(partsOf(new Date(startVirtual - (now - startVirtual))));
        break;
      case 'sync-zero':
        sync = '00:00:00';
        break;
      default:
        break;
    }
  }

  if (eventFrozen) {
    display = FROZEN;
    sync = '00:00:00';
  } else if (nightMode) {
    // After 02:00 the clock no longer moves. Only the sync counter knows.
    display = anomaly?.effect === 'real' ? formatClock(partsOf(new Date(now))) : FROZEN;
    syncLabel = 'Sync in progress';
    const s = secondsOfDay(new Date(now)) - 2 * 3600;
    sync = formatDuration(Math.max(0, s) * 1000);
  }

  const className = ['panel', 'clock', level === 4 && !eventFrozen ? 'prominent' : '', eventFrozen || nightMode ? 'frozen' : ''].filter(Boolean).join(' ');
  return (
    <section className={className} aria-label="Current local time">
      <h2 className="panel-title">Current local time</h2>
      <time className="clock-time" aria-live="off">
        {display}
      </time>
      <div className="clock-rows">
        <div className="clock-row">
          <span>{syncLabel}</span>
          <strong>{sync}</strong>
        </div>
      </div>
    </section>
  );
}

export const Clock = memo(ClockInner);
