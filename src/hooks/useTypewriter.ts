import { useEffect, useState } from 'react';

/**
 * Types `lines` out character by character (one timer at a time, cleaned up
 * on change). With `instant` the lines appear one per `lineDelay` instead —
 * used for reduced motion.
 */
export function useTypewriter(lines: readonly string[], active: boolean, opts: { speed?: number; lineDelay?: number; instant?: boolean; onChar?: () => void } = {}): { shown: string[]; done: boolean } {
  const { speed = 28, lineDelay = 380, instant = false, onChar } = opts;
  const key = lines.join('\u0000');
  const [state, setState] = useState({ key, line: 0, char: 0 });
  // New lines → start over (derived during render, no reset effect needed).
  const progress = state.key === key ? state : { key, line: 0, char: 0 };
  const setProgress = (p: { line: number; char: number }) => setState({ key, ...p });

  useEffect(() => {
    if (!active) return;
    const { line, char } = progress;
    if (line >= lines.length) return;
    const current = lines[line];
    let timer: ReturnType<typeof setTimeout>;
    if (instant) {
      timer = setTimeout(() => setProgress({ line: line + 1, char: 0 }), lineDelay);
    } else if (char < current.length) {
      timer = setTimeout(() => {
        if (current[char] !== ' ') onChar?.();
        setProgress({ line, char: char + 1 });
      }, speed);
    } else {
      timer = setTimeout(() => setProgress({ line: line + 1, char: 0 }), lineDelay);
    }
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, progress.line, progress.char, key, speed, lineDelay, instant, onChar]);

  const shown = lines.slice(0, progress.line).concat(progress.line < lines.length ? [instant ? '' : lines[progress.line].slice(0, progress.char)] : []);
  return { shown, done: progress.line >= lines.length };
}
