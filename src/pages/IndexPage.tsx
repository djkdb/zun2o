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
      <h2 className="section-heading">기록 색인</h2>
      <RecordList />
      <h2 className="section-heading">최근 추가</h2>
      <ul className="status-list">
        {level >= 2 && (
          <li>
            <span>{indexed ? '기록 #013 — 색인 연장 (미등록)' : '기록 #0?? — (처리 중)'}</span>
            <span className="mono">02:00</span>
          </li>
        )}
        <li>
          <span>
            <a href={href('/record/008')}>기록 #008</a> — 열람실 안내문 수정
          </span>
          <span className="mono">2004-11-02</span>
        </li>
        <li>
          <span>
            <a href={href('/record/006')}>기록 #006</a> — 녹취록 교정
          </span>
          <span className="mono">2004-06-19</span>
        </li>
        <li>
          <span>
            <a href={href('/record/005')}>기록 #005</a> — 평면도 다시 그림
          </span>
          <span className="mono">2003-09-30</span>
        </li>
      </ul>
    </>
  );
}
