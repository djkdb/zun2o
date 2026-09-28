import { useEffect } from 'react';
import { ArchivePhoto } from '../components/ArchivePhoto';
import { findSecret, showNotice } from '../game/store';
import { useGame, useVisualLevel } from '../hooks/useGame';
import { NotFoundPage } from './NotFoundPage';

// Secret D — the file that "does not exist". Reachable from search.

export function RoomPage() {
  const level = useVisualLevel();
  const listed = useGame((s) => s.save.flags.includes('room02-listed'));
  const allowed = listed || level >= 5;

  useEffect(() => {
    if (allowed && findSecret('D')) showNotice('02호실 파일 복구됨. 38%.');
  }, [allowed]);

  if (!allowed) return <NotFoundPage path="/room-02" />;

  return (
    <article className="prose">
      <div className="record-kicker">ROOM_02.DAT · [파일 손상] · 38% 복구됨</div>
      <h2 className="record-title">02호실 — 색인실</h2>
      <p className="corrupt">
        ▒▒ 해원군청 별관 / 3층 / 02호실 / 1995년 봉인 ▒▒▒▒▒▒▒▒ 내부 물품 미이관 ▒▒▒▒ 색인 캐비닛: 서랍 1,208개 ▒▒▒
      </p>
      <ArchivePhoto scene="room-02" caption="복구된 프레임. 날짜 인쇄는 읽을 수 없음. 전등이 켜져 있다." />
      <table className="data-table">
        <tbody>
          <tr>
            <th scope="row">재실 인원</th>
            <td>1명</td>
          </tr>
          <tr>
            <th scope="row">근무</th>
            <td>1994-03-14 02:00부터 계속</td>
          </tr>
          <tr>
            <th scope="row">가득 찬 서랍</th>
            <td>1,208개 중 1,207개</td>
          </tr>
          <tr>
            <th scope="row">마지막 등록 카드</th>
            <td>방문자 — 오늘 밤</td>
          </tr>
        </tbody>
      </table>
      <p>색인 캐비닛이 거의 다 찼다. 서랍 하나가 열려 있다. 그 안의 카드는 아직 쓰이지 않았다.</p>
      <p className="corrupt">▒▒▒ 38%에서 복구 중단 ▒▒▒ 이 파일의 나머지는 지금 쓰이는 중 ▒▒▒</p>
    </article>
  );
}
