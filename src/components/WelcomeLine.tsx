import { useMemo } from 'react';
import { GlitchText } from './GlitchText';
import { useAnomaly, useGame, useVisualLevel } from '../hooks/useGame';
import { welcomeLine } from '../data/copy';
import { getNow } from '../game/clock';

export function WelcomeLine() {
  const level = useVisualLevel();
  const anomaly = useAnomaly('welcome');
  const save = useGame((s) => s.save);
  const previousVisit = useGame((s) => s.session.previousVisit);
  const previousActive = useGame((s) => s.session.previousActive);
  // Recomputed only when the level or visit data changes, not every second.
  const visitCount = save.visitCount;
  const lastEnding = save.lastEnding;
  const flagCount = save.flags.length;
  const text = useMemo(
    () => welcomeLine({ save, previousVisit, previousActive, now: getNow(), level }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [level, visitCount, lastEnding, flagCount, previousVisit, previousActive],
  );
  return <GlitchText as="p" className="welcome" text={text} anomaly={anomaly} />;
}
