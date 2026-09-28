import { GlitchText } from '../components/GlitchText';
import { RecordList } from '../components/RecordList';
import { WelcomeLine } from '../components/WelcomeLine';
import { INTRO_TEXT } from '../data/copy';
import { useAnomaly, useGame, useVisualLevel } from '../hooks/useGame';
import { href } from '../utils/router';

export function IndexPage() {
  const level = useVisualLevel();
  const intro = useAnomaly('intro');
  const indexed = useGame((s) => s.save.flags.includes('record-013-indexed'));
  return (
    <>
      <WelcomeLine />
      <GlitchText as="p" className="prose" text={INTRO_TEXT[level]} anomaly={intro} />
      <h2 className="section-heading">Archive index</h2>
      <RecordList />
      <h2 className="section-heading">Recent additions</h2>
      <ul className="status-list">
        {level >= 2 && (
          <li>
            <span>{indexed ? 'Record #013 — Index continuation (unfiled)' : 'Record #0?? — (processing)'}</span>
            <span className="mono">02:00</span>
          </li>
        )}
        <li>
          <span>
            <a href={href('/record/008')}>Record #008</a> — reading room notice updated
          </span>
          <span className="mono">2004-11-02</span>
        </li>
        <li>
          <span>
            <a href={href('/record/006')}>Record #006</a> — transcript corrected
          </span>
          <span className="mono">2004-06-19</span>
        </li>
        <li>
          <span>
            <a href={href('/record/005')}>Record #005</a> — floor plan redrawn
          </span>
          <span className="mono">2003-09-30</span>
        </li>
      </ul>
    </>
  );
}
