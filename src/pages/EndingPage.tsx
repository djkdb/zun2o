import { useEffect, useMemo } from 'react';
import { ENDING_BY_ID, ENDINGS } from '../data/endings';
import { playSound } from '../game/store';
import { fillTemplate } from '../game/template';
import { getNow } from '../game/clock';
import { useGame } from '../hooks/useGame';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { href } from '../utils/router';
import { NotFoundPage } from './NotFoundPage';
import type { EndingId } from '../game/types';

export function EndingPage({ id }: { id: string }) {
  const save = useGame((s) => s.save);
  const reduced = useReducedMotion();
  const def = (ENDINGS.map((e) => e.id) as string[]).includes(id) ? ENDING_BY_ID[id as EndingId] : null;
  const unlocked = def ? save.endingUnlocked.includes(def.id) : false;
  const lines = useMemo(() => (def ? def.lines.map((l) => fillTemplate(l, { save, now: getNow() })) : []),
    // Lines are written once, when the ending is reached.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [def]);

  useEffect(() => {
    if (unlocked) playSound('ending');
  }, [unlocked]);

  if (!def || !unlocked) return <NotFoundPage path={`/ending/${id}`} />;

  const step = reduced ? 0.4 : 1.6;
  return (
    <div className={`ending-page ending-${def.id}`} role="main">
      <div className="ending-inner">
        <div className="ending-number">
          ENDING {def.index} / {ENDINGS.length}
        </div>
        <h1 className="ending-title">{def.title}</h1>
        <p className="ending-subtitle">{def.subtitle}</p>
        <div className="ending-lines" aria-live="polite">
          {lines.map((l, i) => (
            <p key={i} style={{ animationDelay: `${0.8 + i * step}s` }}>
              {l}
            </p>
          ))}
        </div>
        <div className="ending-foot" style={{ animationDelay: `${1.4 + lines.length * step}s` }}>
          <a className="btn" href={href('/')}>
            Return to the archive
          </a>
          <span>
            Endings found: {save.endingUnlocked.length} / {ENDINGS.length}
          </span>
        </div>
      </div>
    </div>
  );
}
