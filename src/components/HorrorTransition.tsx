import { useEffect, useMemo } from 'react';
import { MAIN_EVENT_TIMELINE } from '../data/mainEvent';
import { playSound, setMainEventStage, getState } from '../game/store';
import { stageReached, useGame, useMainEventStage } from '../hooks/useGame';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTypewriter } from '../hooks/useTypewriter';
import { navigate } from '../utils/router';
import { formatHM } from '../utils/time';
import { ReadingRoomPhoto } from './photos/Photos';
import { ScareView } from './Ghost';
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
    lines.push(`당신은 ${formatHM(first)}에 처음 왔습니다. 그 뒤로 ${save.visitCount - 1}번 다시 왔습니다.`);
  } else {
    lines.push(`당신은 ${formatHM(first)}에 도착했습니다. 그리고 떠나지 않았습니다.`);
  }
  const v003 = save.recordViews['003'] ?? 0;
  lines.push(v003 > 0 ? `그녀에 대한 보고서를 ${v003}번 열었습니다.` : '그녀에 대한 보고서는 한 번도 열지 않았습니다. 그녀는 당신의 것을 열었습니다.');
  if (save.secretProgress.A.found) lines.push('당신은 방송 순서를 따라왔습니다.');
  else if (save.flags.includes('sentence-found')) lines.push('당신은 그녀의 마지막 문장을 찾았습니다.');
  else lines.push(`기록 ${save.discoveredRecords.length}건을 읽었습니다. ${save.clickCount}번 클릭했습니다.`);
  lines.push('색인에 당신의 자리가 있습니다.');
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
    () => ['기록 009 — 방문자 기록', '02:00:00 항목 추가됨', `방문자 #${String(visitCount).padStart(4, '0')}`],
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
          <p className="kicker">야간 색인</p>
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
      {stage === 'scare' && <ScareView kind="lunge" nonce={startedAt ?? 0} silent />}
      <button type="button" className="event-skip" onClick={skip}>
        건너뛰기 ›
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
      return '시계가 02:00에 멈췄습니다.';
    case 'strip-menu':
      return '메뉴가 사라지고 있습니다.';
    case 'dark':
      return '화면이 꺼졌습니다.';
    default:
      return '';
  }
}
