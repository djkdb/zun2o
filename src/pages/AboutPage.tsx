import { useState } from 'react';
import { useGame, useVisualLevel } from '../hooks/useGame';
import { clearSave } from '../game/save';
import { removeItem, storageAvailable } from '../utils/storage';
import { formatHM } from '../utils/time';

export function AboutPage() {
  const level = useVisualLevel();
  const save = useGame((s) => s.save);
  const [confirming, setConfirming] = useState(false);
  const archivist = save.flags.includes('ending-true');

  const erase = () => {
    clearSave();
    removeItem('na_visit', 'session');
    removeItem('na_entered', 'session');
    window.location.hash = '#/';
    window.location.reload();
  };

  return (
    <div className="prose">
      <h2 className="page-title">보관소 소개</h2>
      <p>
        심야 기록보관소는 1996년, 봉인을 앞둔 해원군청 별관에서 남은 종이 기록을 꺼내 와도 좋다는 허락을 받은 자원봉사자들이
        시작했습니다. 대부분 낮에는 본업이 있어서, 스캔 작업은 밤에 했습니다. 그래서 이름이 이렇게 붙었습니다.
      </p>
      <p>
        {level >= 3
          ? '목록 작업은 한 번도 끝난 적이 없습니다. 끝났다고 생각할 때마다 색인이 더 길어져 있습니다.'
          : '목록은 아직 완성되지 않았습니다. 새로 스캔한 기록은 매일 밤 기록 동기화 때 추가됩니다.'}
      </p>
      <h3 className="section-heading">직원</h3>
      <ul className="status-list">
        <li>
          <span>초대 기록사</span>
          <span>{level >= 3 ? '서미령 (1985– )' : '서미령 (1985–1994)'}</span>
        </li>
        <li>
          <span>자원봉사자</span>
          <span>{level >= 5 ? '0명' : '6명'}</span>
        </li>
        <li>
          <span>야간 기록사</span>
          <span>
            {archivist
              ? `방문자 #${String(save.visitCount).padStart(4, '0')} (${formatHM(new Date(save.secretProgress.C.at ?? save.lastVisit))}부터)`
              : level >= 5
                ? '근무 중'
                : '공석'}
          </span>
        </li>
      </ul>
      <h3 className="section-heading" id="privacy">
        개인정보
      </h3>
      <p>
        이 사이트는 브라우저의 로컬 저장소(localStorage)만 사용해 방문을 기억합니다. 몇 번 왔는지, 어떤 기록을 열었는지, 무엇을
        발견했는지가 전부입니다. 어떤 정보도 서버로 전송되지 않고, 쿠키나 추적 도구도 없으며, 카메라·마이크·위치 권한을 요청하지
        않습니다. {storageAvailable() ? '' : '이 브라우저에서는 로컬 저장소를 쓸 수 없어서, 진행 상황은 탭을 닫을 때까지만 유지됩니다.'}
      </p>
      {!confirming ? (
        <button type="button" className="btn" onClick={() => setConfirming(true)}>
          내 기록 지우기
        </button>
      ) : (
        <p>
          방문, 열람한 기록, 발견한 것이 모두 초기화됩니다.{' '}
          <button type="button" className="btn" onClick={erase}>
            네, 지웁니다
          </button>{' '}
          <button type="button" className="text-button" onClick={() => setConfirming(false)}>
            취소
          </button>
        </p>
      )}
    </div>
  );
}
