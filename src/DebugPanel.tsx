import { useState } from 'react';
import { debugAnomaly, emit, fromMinutes, newGame, reachEnding, sendText, setSpeed, sfx, toMinutes } from './engine/director';
import { addFlag, clearCheckpoint, getState, saveCheckpoint, setRt, setSave } from './engine/state';
import type { SoundId } from './engine/types';

const SOUNDS: SoundId[] = ['inhale', 'breath', 'knock', 'creak', 'stepsAbove', 'drip', 'buzz', 'whisper', 'scream', 'vault', 'tape', 'zoom', 'open', 'connect', 'send'];
import { useGame } from './hooks/useGame';

// ?debug=1 — jump between chapters, fast-forward waits, trigger the finale.

const JUMPS: [string, () => void][] = [
  ['CH1', () => (setSave({ started: true, unlocked: true }), emit('start'), emit('unlock'))],
  ['CH2', () => (setSave({ started: true, unlocked: true }), ['unlocked', 'reveal-scare'].forEach(addFlag), emit('call1:done'))],
  ['CH3', () => (setSave({ started: true, unlocked: true, playerName: getState().save.playerName ?? '테스터' }), ['unlocked', 'reveal-scare', 'call1-done', 'memo-done', 'gave-name'].forEach(addFlag), emit('c2:done'))],
  ['CH4', () => (setSave({ started: true, unlocked: true }), ['unlocked', 'reveal-scare', 'call1-done', 'memo-done', 'ch3', 'album-code', 'album-open', 'selfie-scare', 'self-contact', 'read-miryeong', 'found-key'].forEach(addFlag), emit('ch4'))],
  ['02:00', () => (setSave({ started: true, unlocked: true, chapter: 4 }), addFlag('found-key'), saveCheckpoint(), addFlag('finale'), setRt({ finale: true }))],
];

export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [fast, setFast] = useState(false);
  const [sound, setSound] = useState<SoundId>('inhale');
  const [ev, setEv] = useState('');
  const [talk, setTalk] = useState('');
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
      <div className="dbg-row">
        {(['hang', 'profile', 'face', 'curtain'] as const).map((look) => (
          <button
            key={look}
            type="button"
            onClick={() => {
              setRt({ scare: { kind: look === 'curtain' ? 'reflect' : 'lunge', nonce: Date.now(), look } });
              setTimeout(() => setRt({ scare: null }), 1300);
            }}
          >
            {look}
          </button>
        ))}
      </div>
      <div className="dbg-row">
        {(['clock', 'typing', 'dim', 'phantom', 'stamp', 'buzz'] as const).map((k) => (
          <button key={k} type="button" onClick={() => debugAnomaly(k)}>
            {k}
          </button>
        ))}
      </div>
      <div className="dbg-row">
        {(['poweroff', 'shift', 'release'] as const).map((e) => (
          <button key={e} type="button" onClick={() => (setSave({ started: true }), reachEnding(e))}>
            END {e}
          </button>
        ))}
      </div>
      <div className="dbg-row">
        <button type="button" onClick={() => setSave((s) => ({ clock: fromMinutes(toMinutes(s.clock) + 10) }))}>
          +10분
        </button>
        <button type="button" onClick={() => setSave({ battery: 5 })}>
          배터리 5%
        </button>
        <button type="button" onClick={clearCheckpoint}>
          체크포인트 삭제
        </button>
      </div>
      <div className="dbg-row">
        <select value={sound} onChange={(e) => setSound(e.target.value as SoundId)} aria-label="사운드">
          {SOUNDS.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <button type="button" onClick={() => sfx(sound)}>
          ▶
        </button>
      </div>
      <form className="dbg-row" onSubmit={(e) => (e.preventDefault(), ev && emit(ev))}>
        <input value={ev} onChange={(e) => setEv(e.target.value)} placeholder="emit 이벤트" aria-label="이벤트" />
      </form>
      <form className="dbg-row" onSubmit={(e) => (e.preventDefault(), talk && (sendText('unknown', talk), setTalk('')))}>
        <input value={talk} onChange={(e) => setTalk(e.target.value)} placeholder="모르는 번호에게 (키워드 테스트)" aria-label="채팅 테스트" />
      </form>
      <div className="dbg-flags">{flags.join(', ')}</div>
    </div>
  );
}
