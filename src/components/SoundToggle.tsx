import { setSoundPreference } from '../game/store';
import { useGame } from '../hooks/useGame';
import { audio } from '../utils/audio';

export function SoundToggle() {
  const on = useGame((s) => s.save.soundPreference === 'on');
  const ready = useGame((s) => s.session.audioReady);
  const toggle = async () => {
    const next = !on;
    setSoundPreference(next);
    if (next) await audio.unlock();
    audio.setEnabled(next);
  };
  return (
    <button
      type="button"
      className="tool-toggle"
      aria-pressed={on}
      aria-label={on ? '소리 켜짐. 누르면 소리를 끕니다.' : '소리 꺼짐. 누르면 소리를 켭니다.'}
      title={on && !ready ? '처음 클릭한 뒤부터 소리가 납니다' : undefined}
      onClick={toggle}
    >
      소리: {on ? '켬' : '끔'}
    </button>
  );
}
