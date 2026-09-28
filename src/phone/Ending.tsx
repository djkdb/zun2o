import { useEffect, useState } from 'react';
import { useGame } from '../hooks/useGame';
import { newGame, sfx } from '../engine/director';
import type { EndingId } from '../engine/types';

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
    line: '당신은 도망쳤다. 채원은 아직 그 방에 있다.',
    scene: [
      { text: '폰은 다시 켜지지 않았다.' },
      { text: '다음 날 밤, 해원군청 별관 앞 공중전화 부스.' },
      { text: '선반 위에 휴대폰 한 대가 놓여 있다.' },
      { text: '화면이 켜진다. 배터리 12%.' },
      { who: '02:00', text: '내일 밤에 봐요.', side: 'left' },
    ],
  },
  shift: {
    n: 2,
    title: '교대',
    line: '누군가는 근무를 서야 한다. 오늘부터는 당신이다.',
    scene: [
      { who: '나에게', text: '…나왔어', side: 'right' },
      { who: '나에게', text: '나 밖이야. 별관 앞. 해가 떠', side: 'right' },
      { who: '나에게', text: '고마워', side: 'right' },
      { who: '나에게', text: '근데 너는… 누구였어?', side: 'right' },
      { text: '방문자 #0027 {name} — 근무 중' },
    ],
  },
  release: {
    n: 3,
    title: '색인 종료',
    line: '아무도 더 기록되지 않는다. 아무도 남지 않아도 된다.',
    scene: [
      { who: '도현', text: '채원이 찾았대요!!!', side: 'left' },
      { who: '도현', text: '02호실 안에서요. 살아 있어요', side: 'left' },
      { who: '엄마', text: '누구신지 몰라도, 정말 고맙습니다', side: 'left' },
      { who: '02:00', text: '고마워요. 이제 집에 갈게요.', side: 'left' },
      { text: '(대화 상대를 찾을 수 없습니다)' },
    ],
  },
};

export function EndingScreen({ id }: { id: EndingId }) {
  const def = ENDINGS[id];
  const name = useGame((s) => s.save.playerName) ?? '(이름 없음)';
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
      <div className="ending-scene">
        {def.scene.slice(0, shown).map((l, i) =>
          l.who ? (
            <div key={i} className={`ending-bubble ${l.side}`}>
              <small>{l.who}</small>
              <span>{l.text}</span>
            </div>
          ) : (
            <p key={i} className="ending-line">
              {l.text.replace('{name}', name)}
            </p>
          ),
        )}
      </div>
      {done && (
        <div className="ending-card">
          <small>
            ENDING {def.n} / 3 · 발견 {endings.length} / 3
          </small>
          <h2>{def.title}</h2>
          <p>{def.line}</p>
          {id === 'release' && new Date().getHours() === 2 && <p className="badge-real">★ 진짜 새벽 2시에 색인을 끝냈습니다</p>}
          {endings.length < 3 && <p className="ending-more">다른 선택도 있습니다. 결말은 세 가지.</p>}
          <button type="button" onClick={newGame}>
            처음부터 다시 하기
          </button>
        </div>
      )}
    </div>
  );
}
