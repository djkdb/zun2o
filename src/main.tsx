import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/ibm-plex-sans-kr/400.css';
import '@fontsource/ibm-plex-sans-kr/500.css';
import '@fontsource/ibm-plex-sans-kr/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import './styles/phone.css';
import { App } from './App';
import { flush, getState, initState } from './engine/state';
import { applyChapterMix, connectAudio, emit, onReturn, resume, setSpeed, startLifeTicker } from './engine/director';
import { audio } from './audio/engine';
import { setEntityLayer, setSpeechEnabled } from './audio/speech';

const params = new URLSearchParams(window.location.search);
const debug = params.get('debug') === '1' || params.get('debug') === 'true';
initState(debug);

connectAudio(
  (id) => {
    if (getState().save.sound) audio.play(id);
  },
  (id, on) => audio.setLoop(id, on && getState().save.sound),
  (a, d, s, b) => {
    audio.setMix(a, d, s, b);
    // A hush (everything to zero) or 02:00 also silences the building.
    audio.setAmbientLevel(a === 0 && d === 0 ? 0 : getState().rt.finale ? 0 : getState().save.chapter);
  },
);
setSpeechEnabled(getState().save.sound);
setEntityLayer((text) => {
  if (getState().save.sound) audio.voice(text);
});

// Returning player: sound resumes on their first touch (autoplay policy).
const unlockOnce = async () => {
  window.removeEventListener('pointerdown', unlockOnce);
  if (!getState().save.sound) return;
  await audio.unlock();
  audio.setEnabled(true);
  applyChapterMix(4);
};
window.addEventListener('pointerdown', unlockOnce);

// Leaving the phone is noticed: the tab title changes, and after a while
// away the phone locks itself.
let hiddenAt = 0;
const baseTitle = document.title;
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    hiddenAt = Date.now();
    flush();
    audio.suspend();
    if (getState().save.unlocked) document.title = '(1) 02:00: 어디 가요?';
  } else {
    audio.resume();
    document.title = baseTitle;
    if (hiddenAt) onReturn(Date.now() - hiddenAt);
    hiddenAt = 0;
  }
});
startLifeTicker();
window.addEventListener('pagehide', flush);

if (debug) {
  const speed = Number(params.get('speed'));
  if (speed > 0) setSpeed(speed);
  (window as unknown as { __game: unknown }).__game = { emit, getState, setSpeed };
}

resume();

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
