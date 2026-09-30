import { useEffect, useState } from 'react';
import { useGame } from '../hooks/useGame';
import { newGame, replayFinale, sfx } from '../engine/director';
import type { EndingId } from '../engine/types';
import { art } from '../art/photoArt';
import { copula } from '../content/korean';

interface EndingDef {
  n: number;
  title: string;
  line: string;
  scene: { who?: string; text: string; side?: 'left' | 'right' }[];
}

const ENDINGS: Record<EndingId, EndingDef> = {
  poweroff: {
    n: 1,
    title: '전원 끄기',
    line: '당신은 도망쳤다. 02:00, 색인은 가장 가까이 있던 사람을 등록했다.',
    scene: [
      { text: '폰은 다시 켜지지 않았다.' },
      { text: '02:00. 해원고등학교 도서관 3층, 제2서고.' },
      { text: '방문자 #0027 — 도주. 방문자 #0028 박도현 — 근무 중' },
      { text: '다음 날 밤, 같은 공중전화 부스. 선반 위에 휴대폰이 두 대 놓여 있다. 채원의 폰, 그리고 도현의 폰.' },
      { text: '그중 하나의 화면이 켜진다. 배터리 12%.' },
      { who: '발신자 정보 없음', text: '들어오세요.', side: 'left' },
    ],
  },
  shift: {
    n: 2,
    title: '교대',
    line: '누군가는 색인을 맡아야 한다. 오늘부터는 당신이다.',
    scene: [
      { who: '나에게', text: '…나왔어. 해가 떠', side: 'right' },
      { who: '도현', text: '채원이랑 같이 부스 안에서 깼어요. 둘 다 무사해요', side: 'left' },
      { who: '도현', text: '근데 당신은 어디 있어요? 이 폰만 선반에 있어요', side: 'left' },
      { text: '색인 담당 — {name}. 서미령의 이름은 지워졌다.' },
      { text: '1년 뒤. 해원고 정문 앞 공중전화 부스.' },
      { who: '발신자 정보 없음', text: '들어오세요. 저는 {name}{이에요}. 오래 기다렸어요.', side: 'left' },
    ],
  },
  release: {
    n: 3,
    title: '색인 종료',
    line: '아무도 더 기록되지 않는다. 아무도 남지 않아도 된다.',
    scene: [
      { who: '도현', text: '채원이랑 나왔어요!!! 둘 다 살아 있어요', side: 'left' },
      { who: '도현', text: '서랍이 전부 비어 있었어요. 카드가 한 장도 없었어요', side: 'left' },
      { who: '엄마', text: '누구신지 몰라도, 정말 고맙습니다', side: 'left' },
      { who: '발신자 정보 없음', text: '서미령이에요. 31년 만에 퇴근해요. 고마워요.', side: 'left' },
      { text: '(대화 상대를 찾을 수 없습니다)' },
      { text: '다음 날 아침, 비가 그쳤다. 공중전화 부스의 선반은 비어 있다.' },
    ],
  },
};

export function EndingScreen({ id }: { id: EndingId }) {
  const def = ENDINGS[id];
  const playerName = useGame((s) => s.save.playerName);
  const name = playerName ?? '(이름 없음)';
  // In dialogue, someone who never gave a name is just their number.
  const spoken = playerName ?? '#0027';
  const endings = useGame((s) => s.save.endings);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    sfx('ending');
    const ts = def.scene.map((_, i) =>
      setTimeout(() => {
        setShown(i + 1);
        sfx(i === def.scene.length - 1 ? 'thud' : 'ding');
      }, 1400 + i * 1700),
    );
    return () => ts.forEach(clearTimeout);
  }, [def]);

  const done = shown >= def.scene.length;
  return (
    <div className={`ending ending-${id}`}>
      {/* the last photograph of the night, behind the words */}
      {art(`ending-${id}`) && <img className="ending-photo" src={art(`ending-${id}`)} alt="" />}
      <div className="ending-scene">
        {def.scene.slice(0, shown).map((l, i) =>
          l.who ? (
            <div key={i} className={`ending-bubble ${l.side}`}>
              <small>{l.who}</small>
              <span>{l.text.replaceAll('{name}{이에요}', spoken + copula(spoken)).replaceAll('{name}', spoken)}</span>
            </div>
          ) : (
            <p key={i} className="ending-line">
              {l.text.replaceAll('{name}', name)}
            </p>
          ),
        )}
      </div>
      {done && (
        <div className="ending-card">
          <small>
            엔딩 {def.n} · 결말 3개 중 {endings.length}개 발견
          </small>
          <h2>{def.title}</h2>
          <p>{def.line}</p>
          {id === 'release' && new Date().getHours() === 2 && <p className="badge-real">★ 진짜 새벽 2시에 색인을 끝냈습니다</p>}
          {endings.length < 3 && <p className="ending-more">다른 선택도 있습니다. 결말은 세 가지.</p>}
          {endings.length < 3 && (
            <button type="button" onClick={() => replayFinale() || newGame()}>
              02:00부터 다시 (다른 선택)
            </button>
          )}
          <button type="button" className={endings.length < 3 ? 'secondary' : undefined} onClick={newGame}>
            처음부터 다시 하기
          </button>
        </div>
      )}
    </div>
  );
}
