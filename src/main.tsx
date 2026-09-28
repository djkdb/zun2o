import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/ibm-plex-sans-kr/400.css';
import '@fontsource/ibm-plex-sans-kr/500.css';
import '@fontsource/ibm-plex-sans-kr/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import './styles/phone.css';
import { App } from './App';
import { flush, getState, initState } from './engine/state';
import { connectAudio, emit, resume, setSpeed } from './engine/director';
import { audio } from './audio/engine';
import { setSpeechEnabled } from './audio/speech';

const params = new URLSearchParams(window.location.search);
const debug = params.get('debug') === '1' || params.get('debug') === 'true';
initState(debug);

connectAudio(
  (id) => {
    if (getState().save.sound) audio.play(id);
  },
  (id, on) => audio.setLoop(id, on && getState().save.sound),
);
setSpeechEnabled(getState().save.sound);

// Returning player: sound resumes on their first touch (autoplay policy).
const unlockOnce = async () => {
  window.removeEventListener('pointerdown', unlockOnce);
  if (!getState().save.sound) return;
  await audio.unlock();
  audio.setEnabled(true);
};
window.addEventListener('pointerdown', unlockOnce);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    flush();
    audio.suspend();
  } else audio.resume();
});
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
