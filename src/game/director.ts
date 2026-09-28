import { flushPersist, markInteraction, registerClick, teardown, tick } from './store';
import { msToNextSecond } from './clock';

// ─────────────────────────────────────────────────────────────────────────
// The director owns the only recurring timer in the app: one tick aligned to
// the wall-clock second. It also wires global input listeners (interaction
// and click counting) and flushes the save when the page is hidden.
// ─────────────────────────────────────────────────────────────────────────

export function startDirector(): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const loop = () => {
    if (stopped) return;
    tick();
    timer = setTimeout(loop, msToNextSecond());
  };
  timer = setTimeout(loop, msToNextSecond());

  let lastMove = 0;
  const onMove = () => {
    const t = performance.now();
    if (t - lastMove < 800) return;
    lastMove = t;
    markInteraction();
  };
  const onClick = () => {
    markInteraction();
    registerClick();
  };
  const onHide = () => {
    if (document.visibilityState === 'hidden') flushPersist();
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('scroll', onMove, { passive: true });
  window.addEventListener('keydown', markInteraction);
  window.addEventListener('click', onClick);
  window.addEventListener('pagehide', flushPersist);
  document.addEventListener('visibilitychange', onHide);

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('scroll', onMove);
    window.removeEventListener('keydown', markInteraction);
    window.removeEventListener('click', onClick);
    window.removeEventListener('pagehide', flushPersist);
    document.removeEventListener('visibilitychange', onHide);
    teardown();
  };
}
