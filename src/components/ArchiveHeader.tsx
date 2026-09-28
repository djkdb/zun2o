import { useEffect, useState } from 'react';
import { GlitchText } from './GlitchText';
import { SoundToggle } from './SoundToggle';
import { stageReached, useAnomaly, useMainEventStage, useVisualLevel } from '../hooks/useGame';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { NEW_TITLE } from '../data/mainEvent';
import { href } from '../utils/router';

const TITLE = 'THE NIGHT ARCHIVE';
const GLYPHS = '#%&/\\|=+*<>?!0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const SUBTITLE: Record<number, string> = {
  0: 'Harrow County Records Preservation Project · est. 1996',
  3: 'Harrow County Records Preservation Project · est. 1994',
  5: 'Night index · The reading room is staffed',
};

/** Scramble from one string to another over `duration` ms. */
function useScramble(from: string, to: string, active: boolean, instant: boolean, duration = 2600): string {
  const [text, setText] = useState(from);
  useEffect(() => {
    if (!active) return;
    if (instant) {
      const t = setTimeout(() => setText(to), 400);
      return () => clearTimeout(t);
    }
    const start = performance.now();
    const len = Math.max(from.length, to.length);
    let frame = 0;
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      frame++;
      if (frame % 3 === 0 || p === 1) {
        let out = '';
        for (let i = 0; i < len; i++) {
          const settleAt = (i / len) * 0.8 + 0.15;
          if (p >= settleAt) out += to[i] ?? '';
          else if (p < settleAt - 0.35) out += from[i] ?? '';
          else out += to[i] === ' ' ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }
        setText(out);
      }
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, instant, from, to, duration]);
  return active ? text : from;
}

export function ArchiveHeader() {
  const level = useVisualLevel();
  const stage = useMainEventStage();
  const anomaly = useAnomaly('title');
  const reduced = useReducedMotion();
  const retitling = stageReached(stage, 'retitle');
  const scrambled = useScramble(TITLE, NEW_TITLE, retitling && stage !== 'done', reduced);
  const afterEvent = level >= 5 && (stage === 'done' || stage === 'idle');
  const title = afterEvent ? NEW_TITLE : retitling ? scrambled : TITLE;
  const subtitle = SUBTITLE[level >= 5 ? 5 : level >= 3 ? 3 : 0];

  return (
    <header className="header">
      <div className="header-top">
        <div>
          <h1 className="site-title">
            <a href={href('/')} aria-label="The Night Archive — home">
              <GlitchText text={title} anomaly={retitling || afterEvent ? null : anomaly} />
            </a>
          </h1>
          <p className="site-subtitle">{subtitle}</p>
        </div>
        <div className="header-tools">
          <SoundToggle />
        </div>
      </div>
    </header>
  );
}
