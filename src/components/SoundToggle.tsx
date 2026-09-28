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
      aria-label={on ? 'Sound on. Turn sound off.' : 'Sound off. Turn sound on.'}
      title={on && !ready ? 'Sound starts after your first click' : undefined}
      onClick={toggle}
    >
      SOUND: {on ? 'ON' : 'OFF'}
    </button>
  );
}
