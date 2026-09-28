import { useState } from 'react';
import { useGame, useVisualLevel } from '../hooks/useGame';
import { useLocalTime } from '../hooks/useLocalTime';
import { playSound, unlockEnding } from '../game/store';
import { canReachEnding } from '../game/endingManager';
import { fillTemplate } from '../game/template';
import { SECRET_BY_ID } from '../data/secrets';
import { navigate, href } from '../utils/router';
import { formatDuration, formatHM, msUntilNextTwo } from '../utils/time';
import type { SecretId } from '../game/types';

// Record 017 — the end of the index. It only fully exists at 02:00.

export function UnknownPage() {
  const level = useVisualLevel();
  const save = useGame((s) => s.save);
  const phase = useGame((s) => s.session.phase);
  const override = useGame((s) => s.session.levelOverride);
  const now = useLocalTime();
  const [accepting, setAccepting] = useState(false);
  const foundA = save.secretProgress.A.found;
  const night = level >= 5;
  const trueReady = canReachEnding('true', save, override === 5 ? 'after' : phase);

  if (save.flags.includes('ending-true')) {
    return (
      <article className="unknown-page prose">
        <div className="record-kicker">기록 #017</div>
        <h2 className="record-title">야간 근무</h2>
        <p>배정 완료. 야간 기록사: 방문자 #{String(save.visitCount).padStart(4, '0')}.</p>
        <p>근무는 02:00에 시작합니다. 늦지 마십시오. 누군가 기다리고 있을 겁니다.</p>
      </article>
    );
  }

  if (!foundA) {
    return (
      <article className="unknown-page">
        <div className="access-panel" role="alert">
          <div className="stamp">없는 기록</div>
          <p>색인은 009에서 끝납니다. 그렇죠?</p>
          <p>
            <a href={href('/records')}>목록으로 돌아가기</a>
          </p>
        </div>
      </article>
    );
  }

  if (!night) {
    return (
      <article className="unknown-page prose">
        <div className="record-kicker">기록 #017</div>
        <h2 className="record-title">[대기 중]</h2>
        <p>이 기록은 02:00에 작성됩니다. 지금은 02:00이 아닙니다.</p>
        <p className="mono">02:00까지 — {formatDuration(msUntilNextTwo(new Date(now)))}</p>
        <p className="small">그때 다시 오십시오. 탭을 열어 두셔도 됩니다. 보관소가 함께 기다리겠습니다.</p>
      </article>
    );
  }

  const missing = (['A', 'B', 'C'] as SecretId[]).filter((id) => !save.secretProgress[id].found);
  const accept = () => {
    setAccepting(true);
    playSound('ending');
    setTimeout(() => {
      unlockEnding('true');
      navigate('/ending/true');
    }, 2600);
  };
  const decline = () => {
    unlockEnding('normal');
    navigate('/ending/normal');
  };

  return (
    <article className="unknown-page prose">
      <div className="record-kicker">기록 #017 · {formatHM(new Date(now))} 작성</div>
      <h2 className="record-title">야간 근무</h2>
      <table className="data-table">
        <tbody>
          <tr>
            <th scope="row">대상</th>
            <td>{fillTemplate('방문자 #{visitCount}', { save, now })}</td>
          </tr>
          <tr>
            <th scope="row">첫 방문</th>
            <td>{fillTemplate('{firstVisitDate} {firstVisitTime}', { save, now })}</td>
          </tr>
          <tr>
            <th scope="row">열람한 기록</th>
            <td>{save.discoveredRecords.length}건</td>
          </tr>
          <tr>
            <th scope="row">교대 대상</th>
            <td>서미령 (1994-03-14 02:00부터 근무 중)</td>
          </tr>
          <tr>
            <th scope="row">상태</th>
            <td>{accepting ? '수락됨' : '제안됨'}</td>
          </tr>
        </tbody>
      </table>
      <p>다음 방문자가 올 때까지 누군가는 근무를 서야 합니다. 그녀는 아주 오랫동안 남아 있었습니다.</p>
      {save.secretProgress.D.found && <p>당신은 02호실을 보았습니다. 무슨 일인지 알고 있습니다.</p>}
      {trueReady ? (
        <p className="accept-shift">
          <button type="button" className="btn" onClick={accept} disabled={accepting}>
            {accepting ? '등록 중…' : '[ 근무를 인수한다 ]'}
          </button>{' '}
          <button type="button" className="text-button" onClick={decline} disabled={accepting}>
            떠난다
          </button>
        </p>
      ) : (
        <div className="notice">
          아직 근무를 제안할 수 없습니다. 색인에 빠진 것이 있습니다:
          {'\n'}
          {missing.map((id) => `— ${SECRET_BY_ID[id].hint}`).join('\n')}
        </div>
      )}
    </article>
  );
}
