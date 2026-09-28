import { useEffect, useMemo } from 'react';
import { MAIN_EVENT_TIMELINE } from '../data/mainEvent';
import { playSound, setMainEventStage, getState } from '../game/store';
import { stageReached, useGame, useMainEventStage } from '../hooks/useGame';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTypewriter } from '../hooks/useTypewriter';
import { navigate } from '../utils/router';
import { formatHM } from '../utils/time';
import { ReadingRoomPhoto } from './photos/Photos';
import type { MainEventStage, SaveData } from '../game/types';

// ─────────────────────────────────────────────────────────────────────────
// 02:00 — the main event. This component is the conductor: it walks the
// timeline (data/mainEvent.ts) and sets the stage; the clock, header, menu,
// audio and page react to the stage on their own. It also renders the
// full-screen record that types itself and recalls what the visitor did.
// ─────────────────────────────────────────────────────────────────────────

function recallLines(save: SaveData): string[] {
  const lines: string[] = [];
  const first = new Date(save.firstVisit);
  if (save.visitCount > 1) {
    lines.push(`You first came at ${formatHM(first)}. You came back ${save.visitCount - 1} ${save.visitCount - 1 === 1 ? 'time' : 'times'}.`);
  } else {
    lines.push(`You arrived at ${formatHM(first)}. You stayed.`);
  }
  const v003 = save.recordViews['003'] ?? 0;
  lines.push(v003 > 0 ? `You opened her report ${v003} ${v003 === 1 ? 'time' : 'times'}.` : 'You never opened her report. She opened yours.');
  if (save.secretProgress.A.found) lines.push('You followed the broadcast order.');
  else if (save.flags.includes('sentence-found')) lines.push('You found her last sentence.');
  else lines.push(`You read ${save.discoveredRecords.length} records. You clicked ${save.clickCount} times.`);
  lines.push('The index has a place for you.');
  return lines;
}

export function HorrorTransition() {
  const stage = useMainEventStage();
  const startedAt = useGame((s) => s.session.mainEvent.startedAt);
  const visitCount = useGame((s) => s.save.visitCount);
  const reduced = useReducedMotion();
  const running = stage !== 'idle' && stage !== 'done';

  // Walk the timeline from the recorded start (robust to re-renders).
  useEffect(() => {
    if (startedAt === null) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const elapsed = Date.now() - startedAt;
    for (const step of MAIN_EVENT_TIMELINE) {
      if (step.at < elapsed) continue;
      timers.push(
        setTimeout(() => {
          const current = getState().session.mainEvent;
          if (current.startedAt !== startedAt || current.stage === 'done') return;
          setMainEventStage(step.stage);
          if (step.sound) playSound(step.sound);
          if (step.stage === 'navigate') navigate('/record/009');
        }, step.at - elapsed),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [startedAt]);

  const skip = () => {
    navigate('/record/009');
    setMainEventStage('done');
  };

  const recordLines = useMemo(
    () => ['RECORD 009 — VISITOR LOG', 'ENTRY ADDED 02:00:00', `VISITOR #${String(visitCount).padStart(4, '0')}`],
    [visitCount],
  );
  // Recall lines are written from what the save knew when 02:00 began.
  const recall = useMemo(() => (startedAt === null ? [] : recallLines(getState().save)), [startedAt]);

  const typingRecord = stageReached(stage, 'record');
  const typingRecall = stageReached(stage, 'recall');
  const record = useTypewriter(recordLines, running && typingRecord, { speed: 55, lineDelay: 500, instant: reduced, onChar: onType });
  const memory = useTypewriter(recall, running && typingRecall, { speed: 34, lineDelay: 650, instant: reduced, onChar: onType });

  if (!running) return null;
  const overlayVisible = stageReached(stage, 'dark') && !stageReached(stage, 'navigate');
  const leaving = stageReached(stage, 'navigate');
  const showPhoto = stage === 'photo';

  return (
    <>
      <div
        className={['event-overlay', overlayVisible ? 'visible' : '', leaving ? 'leaving' : ''].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="02:00"
      >
        <div className="event-record" aria-live="polite">
          <p className="kicker">THE NIGHT INDEX</p>
          {record.shown.map((l, i) => (
            <p key={`r${i}`}>{l}</p>
          ))}
          {typingRecall && <p aria-hidden="true">&nbsp;</p>}
          {memory.shown.map((l, i) => (
            <p key={`m${i}`} className="recall">
              {l}
              {i === memory.shown.length - 1 && !memory.done && <span className="cursor" />}
            </p>
          ))}
          {!typingRecall && <span className="cursor" />}
        </div>
        {showPhoto && (
          <div className="event-photo" aria-hidden="true">
            <ReadingRoomPhoto level={5} stage={3} effect={null} />
          </div>
        )}
      </div>
      <button type="button" className="event-skip" onClick={skip}>
        SKIP ›
      </button>
      <span className="visually-hidden" aria-live="assertive">
        {stageAnnouncement(stage)}
      </span>
    </>
  );
}

function onType(): void {
  playSound('type');
}

function stageAnnouncement(stage: MainEventStage): string {
  switch (stage) {
    case 'freeze':
      return 'The clock has stopped at 02:00.';
    case 'strip-menu':
      return 'The menu is disappearing.';
    case 'dark':
      return 'The page has gone dark.';
    default:
      return '';
  }
}
