import { useState } from 'react';
import { emit, newGame, setSpeed } from './engine/director';
import { addFlag, getState, setRt, setSave } from './engine/state';
import { useGame } from './hooks/useGame';

// ?debug=1 — jump between chapters, fast-forward waits, trigger the finale.

const JUMPS: [string, () => void][] = [
  ['CH1', () => (setSave({ started: true, unlocked: true }), emit('start'), emit('unlock'))],
  ['CH2', () => (setSave({ started: true, unlocked: true }), ['unlocked', 'reveal-scare'].forEach(addFlag), emit('call1:done'))],
  ['CH3', () => (setSave({ started: true, unlocked: true, playerName: getState().save.playerName ?? '테스터' }), ['unlocked', 'reveal-scare', 'call1-done', 'memo-done', 'gave-name'].forEach(addFlag), emit('c2:done'))],
  ['CH4', () => (setSave({ started: true, unlocked: true }), ['unlocked', 'reveal-scare', 'call1-done', 'memo-done', 'album-open', 'selfie-scare', 'self-contact', 'read-miryeong', 'found-key'].forEach(addFlag), emit('ch4'))],
  ['02:00', () => (setSave({ started: true, unlocked: true }), addFlag('found-key'), addFlag('finale'), setRt({ finale: true }))],
];

export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [fast, setFast] = useState(false);
  const chapter = useGame((s) => s.save.chapter);
  const clock = useGame((s) => s.save.clock);
  const flags = useGame((s) => s.save.flags);
  if (!open)
    return (
      <button type="button" className="dbg-fab" onClick={() => setOpen(true)}>
        DBG
      </button>
    );
  return (
    <div className="dbg">
      <div className="dbg-row">
        <b>CH {chapter}</b> · {clock}
        <button type="button" onClick={() => setOpen(false)}>
          —
        </button>
      </div>
      <div className="dbg-row">
        {JUMPS.map(([l, f]) => (
          <button key={l} type="button" onClick={f}>
            {l}
          </button>
        ))}
      </div>
      <div className="dbg-row">
        <button
          type="button"
          onClick={() => {
            setSpeed(fast ? 1 : 6);
            setFast(!fast);
          }}
        >
          {fast ? '×1' : '×6 속도'}
        </button>
        <button type="button" onClick={newGame}>
          새 게임
        </button>
      </div>
      <div className="dbg-flags">{flags.join(', ')}</div>
    </div>
  );
}
