import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-serif/400.css';
import '@fontsource/ibm-plex-serif/400-italic.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './styles/base.css';
import './styles/components.css';
import './styles/effects.css';
import './styles/pages.css';
import './styles/debug.css';
import { App } from './App';
import { bootstrap } from './game/store';
import { setVirtualTime } from './game/clock';
import { detectDebug, detectStartTime } from './utils/env';
import { parseClockString } from './utils/time';

const debug = detectDebug();

// ?debug=true&t=01:59:50 — start at a given local time (for filming / QA).
// Applied before bootstrap so the visit itself is recorded at that time.
const start = debug ? detectStartTime() : null;
const parsed = start ? parseClockString(start) : null;
if (parsed) setVirtualTime(parsed.hours, parsed.minutes, parsed.seconds);

bootstrap(debug);

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
